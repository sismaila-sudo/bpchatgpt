import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getSupabaseClient, verifyAuthToken } from '@/services/supabase'
import { FinancialCalculator } from '@/calculations/financial'

const calculateSchema = z.object({
  project_id: z.string().uuid(),
  scenario_id: z.string().uuid().optional(),
  force_recalculation: z.boolean().default(false)
})

interface AuthenticatedRequest extends FastifyRequest {
  user?: any
}

export const calculationRoutes: FastifyPluginAsync = async (fastify) => {
  // Auth hook
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.status(401).send({ error: 'Missing authorization token' })
      }

      const user = await verifyAuthToken(token)
      request.user = user
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid token' })
    }
  })

  // Calculate financial projections
  fastify.post('/calculate', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id, scenario_id, force_recalculation } = calculateSchema.parse(request.body)

      // Check project access
      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const supabase = getSupabaseClient()

      // Check if calculations already exist and if we should skip
      if (!force_recalculation) {
        const { data: existingCalculations } = await supabase
          .from('financial_outputs')
          .select('id')
          .eq('project_id', project_id)
          .eq('scenario_id', scenario_id || null)
          .limit(1)

        if (existingCalculations?.length) {
          return { message: 'Calculations already exist', recalculated: false }
        }
      }

      // Fetch all required data
      const [
        projectData,
        assumptionsData,
        taxSettingsData,
        workingCapitalData,
        productsData,
        salesProjectionsData,
        capexData,
        opexData,
        payrollRolesData,
        headcountPlanData,
        loansData
      ] = await Promise.all([
        fetchProject(supabase, project_id),
        fetchAssumptions(supabase, project_id),
        fetchTaxSettings(supabase, project_id),
        fetchWorkingCapital(supabase, project_id),
        fetchProducts(supabase, project_id),
        fetchSalesProjections(supabase, project_id),
        fetchCapex(supabase, project_id),
        fetchOpex(supabase, project_id),
        fetchPayrollRoles(supabase, project_id),
        fetchHeadcountPlan(supabase, project_id),
        fetchLoans(supabase, project_id)
      ])

      if (!projectData) {
        return reply.status(404).send({ error: 'Project not found' })
      }

      // Initialize calculator
      const calculator = new FinancialCalculator(
        projectData,
        assumptionsData,
        taxSettingsData,
        workingCapitalData
      )

      // Perform calculations
      const financialOutputs = await calculator.calculateMonthlyProjections(
        productsData,
        salesProjectionsData,
        capexData,
        opexData,
        payrollRolesData,
        headcountPlanData,
        loansData,
        scenario_id
      )

      // Delete existing calculations if force recalculation
      if (force_recalculation) {
        await supabase
          .from('financial_outputs')
          .delete()
          .eq('project_id', project_id)
          .eq('scenario_id', scenario_id || null)
      }

      // Insert new calculations
      const { data: insertedData, error: insertError } = await supabase
        .from('financial_outputs')
        .insert(financialOutputs)
        .select()

      if (insertError) {
        throw insertError
      }

      return {
        message: 'Calculations completed successfully',
        recalculated: true,
        data: insertedData
      }
    } catch (error) {
      fastify.log.error('Calculation error:', error)

      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }

      return reply.status(500).send({ error: 'Calculation failed' })
    }
  })

  // Get calculation status
  fastify.get('/status/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_id } = request.query as { scenario_id?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('financial_outputs')
        .select('year, month, created_at')
        .eq('project_id', project_id)
        .eq('scenario_id', scenario_id || null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      const hasCalculations = data && data.length > 0
      const lastCalculation = hasCalculations ? data[0].created_at : null

      return {
        has_calculations: hasCalculations,
        last_calculation: lastCalculation,
        total_months: hasCalculations ? await getTotalCalculatedMonths(supabase, project_id, scenario_id) : 0
      }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get calculation status' })
    }
  })

  // Recalculate specific scenarios
  fastify.post('/recalculate-scenarios', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id, scenario_ids } = request.body as {
        project_id: string
        scenario_ids: string[]
      }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const results = []

      for (const scenario_id of scenario_ids) {
        try {
          // Trigger calculation for each scenario
          const result = await request.server.inject({
            method: 'POST',
            url: '/api/calculations/calculate',
            headers: {
              authorization: request.headers.authorization
            },
            payload: {
              project_id,
              scenario_id,
              force_recalculation: true
            }
          })

          results.push({
            scenario_id,
            success: result.statusCode === 200,
            data: result.json()
          })
        } catch (error) {
          results.push({
            scenario_id,
            success: false,
            error: error.message
          })
        }
      }

      return { results }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to recalculate scenarios' })
    }
  })

  // Validate financial model
  fastify.post('/validate/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const validationResults = await validateFinancialModel(project_id)

      return {
        is_valid: validationResults.every(result => result.passed),
        validations: validationResults
      }
    } catch (error) {
      return reply.status(500).send({ error: 'Validation failed' })
    }
  })
}

// Helper functions
async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single()

  if (project?.created_by === userId) {
    return true
  }

  const { data: collaboration } = await supabase
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  return !!collaboration
}

async function fetchProject(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

async function fetchAssumptions(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('assumptions')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) {
    // Return default assumptions if none exist
    return {
      id: '',
      project_id: projectId,
      inflation_rate: 2.0,
      wacc: 12.0,
      fx_rates: {},
      sensitivity_bounds: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return data
}

async function fetchTaxSettings(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) {
    return {
      id: '',
      project_id: projectId,
      corporate_tax_rate: 30.0,
      vat_standard_rate: 18.0,
      vat_reduced_rate: 10.0,
      regimes: {},
      tva_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return data
}

async function fetchWorkingCapital(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('working_capital')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) {
    return {
      id: '',
      project_id: projectId,
      dso_days: 30,
      dpo_days: 30,
      inventory_days: 30,
      advances_clients: 0,
      advances_suppliers: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return data
}

async function fetchProducts(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('products_services')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)

  if (error) throw error
  return data || []
}

async function fetchSalesProjections(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('sales_projections')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data || []
}

async function fetchCapex(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('capex')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data || []
}

async function fetchOpex(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('opex')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data || []
}

async function fetchPayrollRoles(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('payroll_roles')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data || []
}

async function fetchHeadcountPlan(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('headcount_plan')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data || []
}

async function fetchLoans(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data || []
}

async function getTotalCalculatedMonths(supabase: any, projectId: string, scenarioId?: string) {
  const { count, error } = await supabase
    .from('financial_outputs')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('scenario_id', scenarioId || null)

  if (error) return 0
  return count || 0
}

async function validateFinancialModel(projectId: string) {
  const supabase = getSupabaseClient()

  const validations = []

  // Check if basic data exists
  const { data: products } = await supabase
    .from('products_services')
    .select('id')
    .eq('project_id', projectId)
    .limit(1)

  validations.push({
    rule: 'has_products',
    description: 'Project must have at least one product/service',
    passed: products && products.length > 0
  })

  // Check if sales projections exist
  const { data: sales } = await supabase
    .from('sales_projections')
    .select('id')
    .eq('project_id', projectId)
    .limit(1)

  validations.push({
    rule: 'has_sales_projections',
    description: 'Project must have sales projections',
    passed: sales && sales.length > 0
  })

  // Check for reasonable margins
  const { data: financialOutputs } = await supabase
    .from('financial_outputs')
    .select('gross_margin, ebitda_margin')
    .eq('project_id', projectId)
    .limit(12)

  if (financialOutputs && financialOutputs.length > 0) {
    const avgGrossMargin = financialOutputs.reduce((sum, row) => sum + (row.gross_margin || 0), 0) / financialOutputs.length

    validations.push({
      rule: 'reasonable_gross_margin',
      description: 'Gross margin should be between -50% and 95%',
      passed: avgGrossMargin >= -50 && avgGrossMargin <= 95
    })

    const avgEbitdaMargin = financialOutputs.reduce((sum, row) => sum + (row.ebitda_margin || 0), 0) / financialOutputs.length

    validations.push({
      rule: 'reasonable_ebitda_margin',
      description: 'EBITDA margin should be between -100% and 80%',
      passed: avgEbitdaMargin >= -100 && avgEbitdaMargin <= 80
    })
  }

  // Check DSCR compliance
  const { data: dscr } = await supabase
    .from('financial_outputs')
    .select('dscr')
    .eq('project_id', projectId)
    .order('dscr', { ascending: true })
    .limit(1)

  if (dscr && dscr.length > 0) {
    validations.push({
      rule: 'adequate_dscr',
      description: 'DSCR should be at least 1.2',
      passed: (dscr[0].dscr || 0) >= 1.2
    })
  }

  return validations
}