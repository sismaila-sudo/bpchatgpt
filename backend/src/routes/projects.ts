import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { getSupabaseClient, verifyAuthToken } from '@/services/supabase'
import { CreateProjectRequest, UpdateProjectRequest } from '@/types/database'

const createProjectSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sector: z.string().min(1),
  size: z.enum(['TPE', 'PME', 'ETI', 'GE']),
  mode: z.enum(['simple', 'advanced']).default('simple'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horizon_years: z.number().int().min(3).max(7).default(3)
})

const updateProjectSchema = createProjectSchema.partial()

interface AuthenticatedRequest extends FastifyRequest {
  user?: any
}

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
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

  // Get user's projects
  fastify.get('/', async (request: AuthenticatedRequest, reply) => {
    try {
      const supabase = getSupabaseClient()
      const userId = request.user.id

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organizations (
            id,
            name,
            currency
          )
        `)
        .or(`created_by.eq.${userId},id.in.(${await getUserProjectIds(userId)})`)
        .order('updated_at', { ascending: false })

      if (error) {
        throw error
      }

      return { data }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch projects' })
    }
  })

  // Get project by ID
  fastify.get('/:id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string }
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organizations (
            id,
            name,
            currency,
            country
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        return reply.status(404).send({ error: 'Project not found' })
      }

      // Check if user has access
      const hasAccess = await checkProjectAccess(request.user.id, id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      return { data }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch project' })
    }
  })

  // Create new project
  fastify.post('/', async (request: AuthenticatedRequest, reply) => {
    try {
      const validatedData = createProjectSchema.parse(request.body)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...validatedData,
          created_by: request.user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Add creator as admin collaborator
      await supabase
        .from('project_collaborators')
        .insert({
          project_id: data.id,
          user_id: request.user.id,
          role: 'admin',
          invited_by: request.user.id,
          accepted_at: new Date().toISOString()
        })

      return { data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: 'Failed to create project' })
    }
  })

  // Update project
  fastify.put('/:id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string }
      const validatedData = updateProjectSchema.parse(request.body)

      // Check access
      const hasAccess = await checkProjectAccess(request.user.id, id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('projects')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      reply.status(500).send({ error: 'Failed to update project' })
    }
  })

  // Delete project
  fastify.delete('/:id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string }

      // Check if user is admin of the project
      const hasAdminAccess = await checkProjectAdminAccess(request.user.id, id)
      if (!hasAdminAccess) {
        return reply.status(403).send({ error: 'Admin access required' })
      }

      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete project' })
    }
  })

  // Get project financial summary
  fastify.get('/:id/summary', async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params as { id: string }

      const hasAccess = await checkProjectAccess(request.user.id, id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const supabase = getSupabaseClient()

      // Get latest financial outputs
      const { data: financialData, error: financialError } = await supabase
        .from('financial_outputs')
        .select('*')
        .eq('project_id', id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12)

      if (financialError) {
        throw financialError
      }

      // Calculate summary metrics
      const summary = calculateProjectSummary(financialData || [])

      return { data: summary }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch project summary' })
    }
  })
}

// Helper functions
async function getUserProjectIds(userId: string): Promise<string> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('project_collaborators')
    .select('project_id')
    .eq('user_id', userId)

  if (error || !data) {
    return ''
  }

  return data.map(d => d.project_id).join(',') || ''
}

async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  // Check if user is creator
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single()

  if (project?.created_by === userId) {
    return true
  }

  // Check if user is collaborator
  const { data: collaboration } = await supabase
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  return !!collaboration
}

async function checkProjectAdminAccess(userId: string, projectId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  // Check if user is creator
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single()

  if (project?.created_by === userId) {
    return true
  }

  // Check if user is admin collaborator
  const { data: collaboration } = await supabase
    .from('project_collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single()

  return !!collaboration
}

function calculateProjectSummary(financialData: any[]) {
  if (!financialData.length) {
    return {
      total_revenue: 0,
      total_costs: 0,
      net_profit: 0,
      gross_margin: 0,
      ebitda_margin: 0,
      cash_balance: 0,
      break_even_month: null,
      min_dscr: 0
    }
  }

  const totalRevenue = financialData.reduce((sum, row) => sum + (row.revenue || 0), 0)
  const totalCosts = financialData.reduce((sum, row) => sum + (row.cogs || 0) + (row.opex_total || 0), 0)
  const netProfit = financialData.reduce((sum, row) => sum + (row.net_income || 0), 0)

  const avgGrossMargin = financialData.reduce((sum, row) => sum + (row.gross_margin || 0), 0) / financialData.length
  const avgEbitdaMargin = financialData.reduce((sum, row) => sum + (row.ebitda_margin || 0), 0) / financialData.length

  const latestCashBalance = financialData[0]?.cash_balance || 0

  // Find break-even month (first month with positive cash balance)
  const breakEvenData = financialData
    .reverse()
    .find(row => (row.cash_balance || 0) > 0)

  const breakEvenMonth = breakEvenData
    ? `${breakEvenData.year}-${String(breakEvenData.month).padStart(2, '0')}`
    : null

  const minDscr = Math.min(...financialData.map(row => row.dscr || 0))

  return {
    total_revenue: totalRevenue,
    total_costs: totalCosts,
    net_profit: netProfit,
    gross_margin: avgGrossMargin,
    ebitda_margin: avgEbitdaMargin,
    cash_balance: latestCashBalance,
    break_even_month: breakEvenMonth,
    min_dscr: minDscr
  }
}