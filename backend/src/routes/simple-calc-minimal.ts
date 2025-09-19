import { FastifyPluginAsync } from 'fastify'
import { getSupabaseClient } from '../services/supabase-minimal'

export const simpleCalcRoutes: FastifyPluginAsync = async (fastify) => {
  // Calculer les projections financières (version simplifiée)
  fastify.post('/calculate', async (request, reply) => {
    try {
      const body = request.body as any
      const { project_id, scenario_id } = body

      if (!project_id) {
        return reply.status(400).send({ error: 'project_id requis' })
      }

      const supabase = getSupabaseClient()

      console.log('DEBUG: Recherche du projet avec ID:', project_id)

      // Récupérer le projet
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single()

      console.log('DEBUG: Résultat requête projet:')
      console.log('- Data:', project)
      console.log('- Error:', projectError)

      if (projectError || !project) {
        console.log('DEBUG: Projet non trouvé, erreur:', projectError)
        return reply.status(404).send({
          error: 'Projet non trouvé',
          debug: {
            project_id,
            supabase_error: projectError
          }
        })
      }

      // Calcul simple de démonstration
      const financialOutputs = []
      const startYear = new Date((project as any).start_date).getFullYear()

      for (let year = startYear; year < startYear + (project as any).horizon_years; year++) {
        for (let month = 1; month <= 12; month++) {
          const monthlyRevenue = 10000 + Math.random() * 5000
          const monthlyCogs = monthlyRevenue * 0.4
          const monthlyOpex = 3000
          const depreciation = 500

          const grossMargin = monthlyRevenue - monthlyCogs
          const ebitda = grossMargin - monthlyOpex
          const ebit = ebitda - depreciation
          const netIncome = ebit
          const cashFlow = netIncome + depreciation

          financialOutputs.push({
            project_id,
            scenario_id: scenario_id || null,
            year,
            month,
            revenue: Math.round(monthlyRevenue),
            cogs: Math.round(monthlyCogs),
            gross_margin: Math.round(grossMargin),
            gross_margin_percent: Math.round((grossMargin / monthlyRevenue) * 100 * 100) / 100,
            total_opex: Math.round(monthlyOpex),
            depreciation: Math.round(depreciation),
            ebitda: Math.round(ebitda),
            ebit: Math.round(ebit),
            net_income: Math.round(netIncome),
            loan_payments: 0,
            cash_flow: Math.round(cashFlow)
          })
        }
      }

      // Supprimer les anciens calculs
      let deleteQuery = supabase
        .from('financial_outputs')
        .delete()
        .eq('project_id', project_id)

      if (scenario_id) {
        deleteQuery = deleteQuery.eq('scenario_id', scenario_id)
      } else {
        deleteQuery = deleteQuery.is('scenario_id', null)
      }

      const { error: deleteError } = await deleteQuery
      if (deleteError) {
        console.log('Erreur suppression données précédentes:', deleteError)
      }

      // Insérer les nouveaux calculs
      const { data: insertedData, error: insertError } = await supabase
        .from('financial_outputs')
        .insert(financialOutputs as any)
        .select()

      if (insertError) {
        console.log('Erreur insertion:', insertError)
        throw insertError
      }

      // Calculer un résumé
      const totalRevenue = financialOutputs.reduce((sum, row) => sum + row.revenue, 0)
      const totalCogs = financialOutputs.reduce((sum, row) => sum + row.cogs, 0)
      const totalOpex = financialOutputs.reduce((sum, row) => sum + row.total_opex, 0)
      const totalNetIncome = financialOutputs.reduce((sum, row) => sum + row.net_income, 0)
      const totalCashFlow = financialOutputs.reduce((sum, row) => sum + row.cash_flow, 0)

      const grossMargin = totalRevenue - totalCogs
      const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0
      const netMarginPercent = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0

      console.log(`=== RÉSUMÉ FINANCIER ${scenario_id ? '(Scénario)' : '(Base)'} ===`)
      console.log('CA Total:', totalRevenue)
      console.log('COGS Total:', totalCogs)
      console.log('OPEX Total:', totalOpex)
      console.log('Résultat Net:', totalNetIncome)

      return {
        success: true,
        message: 'Calculs terminés avec succès',
        summary: {
          months_calculated: financialOutputs.length,
          total_revenue: totalRevenue,
          total_cogs: totalCogs,
          gross_margin: grossMargin,
          total_opex: totalOpex,
          net_income: totalNetIncome,
          cash_flow: totalCashFlow,
          gross_margin_percent: Math.round(grossMarginPercent * 100) / 100,
          net_margin_percent: Math.round(netMarginPercent * 100) / 100,
          avg_monthly_revenue: Math.round(totalRevenue / financialOutputs.length),
          profitability: totalNetIncome > 0 ? 'Rentable' : 'Non rentable'
        }
      }

    } catch (error: any) {
      fastify.log.error('Erreur calcul:', error)
      return reply.status(500).send({
        error: 'Échec du calcul',
        message: error.message || 'Une erreur est survenue'
      })
    }
  })
}