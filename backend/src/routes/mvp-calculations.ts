import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getSupabaseClient } from '@/services/supabase'
import { MVPCalculator } from '@/calculations/mvp-calculator'

const calculateSchema = z.object({
  project_id: z.string().uuid(),
  force_recalculation: z.boolean().default(false)
})

interface AuthenticatedRequest extends FastifyRequest {
  user?: any
}

export const mvpCalculationRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware d'authentification simple pour MVP
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.status(401).send({ error: 'Missing authorization token' })
      }

      // Pour MVP, on accepte tous les tokens non vides
      // En production, il faudra vérifier avec Supabase
      request.user = { id: 'test-user' }
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid token' })
    }
  })

  // Calculer les projections financières
  fastify.post('/calculate', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id, force_recalculation } = calculateSchema.parse(request.body)

      const supabase = getSupabaseClient()

      // Vérifier si les calculs existent déjà
      if (!force_recalculation) {
        const { data: existingCalculations } = await supabase
          .from('financial_outputs')
          .select('id')
          .eq('project_id', project_id)
          .limit(1)

        if (existingCalculations?.length) {
          return {
            message: 'Calculations already exist',
            recalculated: false,
            summary: await getCalculationSummary(supabase, project_id)
          }
        }
      }

      // Récupérer les données du projet
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single()

      if (projectError || !project) {
        return reply.status(404).send({ error: 'Project not found' })
      }

      // Récupérer les produits
      const { data: products, error: productsError } = await supabase
        .from('products_services')
        .select('*')
        .eq('project_id', project_id)

      if (productsError) {
        throw productsError
      }

      // Récupérer les projections de ventes
      const { data: salesProjections, error: salesError } = await supabase
        .from('sales_projections')
        .select('*')
        .eq('project_id', project_id)

      if (salesError) {
        throw salesError
      }

      // Récupérer CAPEX
      const { data: capex, error: capexError } = await supabase
        .from('capex')
        .select('*')
        .eq('project_id', project_id)

      if (capexError) {
        throw capexError
      }

      // Récupérer OPEX
      const { data: opex, error: opexError } = await supabase
        .from('opex')
        .select('*')
        .eq('project_id', project_id)

      if (opexError) {
        throw opexError
      }

      // Validation des données minimales
      if (!products || products.length === 0) {
        return reply.status(400).send({
          error: 'No products defined',
          message: 'Vous devez d\'abord créer des produits/services'
        })
      }

      if (!salesProjections || salesProjections.length === 0) {
        return reply.status(400).send({
          error: 'No sales projections',
          message: 'Vous devez d\'abord créer des projections de ventes'
        })
      }

      // Initialiser le calculateur
      const calculator = new MVPCalculator(
        project,
        products || [],
        salesProjections || [],
        capex || [],
        opex || []
      )

      // Effectuer les calculs
      const financialOutputs = calculator.calculateMonthlyProjections()

      // Supprimer les anciens calculs si recalcul forcé
      if (force_recalculation) {
        await supabase
          .from('financial_outputs')
          .delete()
          .eq('project_id', project_id)
      }

      // Insérer les nouveaux calculs
      const { data: insertedData, error: insertError } = await supabase
        .from('financial_outputs')
        .insert(financialOutputs)
        .select()

      if (insertError) {
        throw insertError
      }

      // Générer un résumé
      const summary = calculator.generateSummary(financialOutputs)

      return {
        message: 'Calculations completed successfully',
        recalculated: true,
        summary,
        data: {
          months_calculated: insertedData.length,
          total_revenue: summary.total_revenue,
          total_profit: summary.total_profit,
          break_even_month: summary.break_even_month,
          financing_need: summary.financing_need
        }
      }
    } catch (error) {
      fastify.log.error('Calculation error:', error)

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
      }

      return reply.status(500).send({
        error: 'Calculation failed',
        message: error.message || 'Une erreur est survenue lors du calcul'
      })
    }
  })

  // Obtenir le statut des calculs
  fastify.get('/status/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('financial_outputs')
        .select('year, month, created_at')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      const hasCalculations = data && data.length > 0
      const lastCalculation = hasCalculations ? data[0].created_at : null

      // Compter le total de mois calculés
      const { count } = await supabase
        .from('financial_outputs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project_id)

      const summary = hasCalculations ? await getCalculationSummary(supabase, project_id) : null

      return {
        has_calculations: hasCalculations,
        last_calculation: lastCalculation,
        total_months: count || 0,
        summary
      }
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to get calculation status'
      })
    }
  })

  // Supprimer les calculs
  fastify.delete('/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from('financial_outputs')
        .delete()
        .eq('project_id', project_id)

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Calculations deleted successfully'
      }
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to delete calculations'
      })
    }
  })
}

// Fonction utilitaire pour obtenir un résumé des calculs
async function getCalculationSummary(supabase: any, projectId: string) {
  const { data: financialData } = await supabase
    .from('financial_outputs')
    .select('*')
    .eq('project_id', projectId)
    .order('year, month')

  if (!financialData || financialData.length === 0) {
    return null
  }

  const totalRevenue = financialData.reduce((sum: number, row: any) => sum + (row.revenue || 0), 0)
  const totalProfit = financialData.reduce((sum: number, row: any) => sum + (row.net_income || 0), 0)
  const minCashBalance = Math.min(...financialData.map((row: any) => row.cash_balance || 0))

  // Point d'équilibre
  const breakEvenData = financialData.find((row: any) => (row.cash_balance || 0) > 0)
  const breakEvenMonth = breakEvenData ?
    financialData.indexOf(breakEvenData) + 1 : null

  return {
    total_revenue: totalRevenue,
    total_profit: totalProfit,
    min_cash_balance: minCashBalance,
    break_even_month: breakEvenMonth,
    months_calculated: financialData.length,
    is_profitable: totalProfit > 0,
    needs_financing: minCashBalance < 0,
    financing_need: minCashBalance < 0 ? Math.abs(minCashBalance) : 0,
    avg_monthly_revenue: totalRevenue / financialData.length,
    avg_monthly_profit: totalProfit / financialData.length
  }
}