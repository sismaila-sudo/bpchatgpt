import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getSupabaseClient, verifyAuthToken } from '@/services/supabase'

interface AuthenticatedRequest extends FastifyRequest {
  user?: any
}

const exportSchema = z.object({
  project_id: z.string().uuid(),
  scenario_id: z.string().uuid().optional(),
  format: z.enum(['pdf', 'docx', 'xlsx']),
  theme: z.enum(['bank', 'investor', 'guarantee']).default('bank'),
  sections: z.array(z.string()).optional()
})

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
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

  // Generate export
  fastify.post('/generate', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id, scenario_id, format, theme, sections } = exportSchema.parse(request.body)

      // Check project access
      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      // Create export record
      const supabase = getSupabaseClient()

      const { data: exportRecord, error: exportError } = await supabase
        .from('reports')
        .insert({
          project_id,
          scenario_id,
          type: format,
          theme,
          status: 'generating',
          generated_by: request.user.id,
          template_version: '1.0'
        })
        .select()
        .single()

      if (exportError) {
        throw exportError
      }

      // Queue export generation (in a real implementation, this would use a job queue)
      // For now, we'll simulate the process
      const exportResult = await generateExport(exportRecord.id, project_id, scenario_id, format, theme, sections)

      // Update export record
      await supabase
        .from('reports')
        .update({
          status: exportResult.success ? 'ready' : 'error',
          file_url: exportResult.file_url,
          content: exportResult.content
        })
        .eq('id', exportRecord.id)

      return {
        export_id: exportRecord.id,
        status: exportResult.success ? 'ready' : 'error',
        download_url: exportResult.success ? `/api/exports/download/${exportRecord.id}` : null,
        message: exportResult.message
      }
    } catch (error) {
      fastify.log.error('Export generation error:', error)

      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }

      return reply.status(500).send({ error: 'Export generation failed' })
    }
  })

  // Download export
  fastify.get('/download/:export_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { export_id } = request.params as { export_id: string }

      const supabase = getSupabaseClient()

      const { data: exportRecord, error } = await supabase
        .from('reports')
        .select('*, projects!inner(created_by)')
        .eq('id', export_id)
        .single()

      if (error || !exportRecord) {
        return reply.status(404).send({ error: 'Export not found' })
      }

      // Check access
      const hasAccess = await checkProjectAccess(request.user.id, exportRecord.project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      if (exportRecord.status !== 'ready' || !exportRecord.file_url) {
        return reply.status(400).send({ error: 'Export not ready for download' })
      }

      // In a real implementation, this would download from storage
      // For now, we'll return a placeholder
      const filename = `business-plan-${exportRecord.project_id}.${exportRecord.type}`

      reply
        .header('Content-Type', getContentType(exportRecord.type))
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send('Export file content would be here')

    } catch (error) {
      return reply.status(500).send({ error: 'Download failed' })
    }
  })

  // Get export status
  fastify.get('/status/:export_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { export_id } = request.params as { export_id: string }

      const supabase = getSupabaseClient()

      const { data: exportRecord, error } = await supabase
        .from('reports')
        .select('id, status, created_at, updated_at, type, theme')
        .eq('id', export_id)
        .single()

      if (error || !exportRecord) {
        return reply.status(404).send({ error: 'Export not found' })
      }

      return { data: exportRecord }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get export status' })
    }
  })

  // List user's exports
  fastify.get('/list/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const supabase = getSupabaseClient()

      const { data: exports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      return { data: exports || [] }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to list exports' })
    }
  })

  // Delete export
  fastify.delete('/:export_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { export_id } = request.params as { export_id: string }

      const supabase = getSupabaseClient()

      const { data: exportRecord, error: fetchError } = await supabase
        .from('reports')
        .select('project_id, generated_by')
        .eq('id', export_id)
        .single()

      if (fetchError || !exportRecord) {
        return reply.status(404).send({ error: 'Export not found' })
      }

      // Check if user can delete (creator or project admin)
      const canDelete = exportRecord.generated_by === request.user.id ||
                       await checkProjectAdminAccess(request.user.id, exportRecord.project_id)

      if (!canDelete) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', export_id)

      if (deleteError) {
        throw deleteError
      }

      return { success: true }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to delete export' })
    }
  })

  // Get available templates
  fastify.get('/templates', async (request: AuthenticatedRequest, reply) => {
    try {
      const templates = getAvailableTemplates()
      return { data: templates }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get templates' })
    }
  })

  // Preview export content
  fastify.post('/preview', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id, scenario_id, theme, sections } = exportSchema
        .omit({ format: true })
        .extend({ sections: z.array(z.string()).default(['summary']) })
        .parse(request.body)

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      // Generate preview content
      const previewContent = await generatePreviewContent(project_id, scenario_id, theme, sections)

      return { data: previewContent }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      return reply.status(500).send({ error: 'Preview generation failed' })
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

async function checkProjectAdminAccess(userId: string, projectId: string): Promise<boolean> {
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
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single()

  return !!collaboration
}

async function generateExport(
  exportId: string,
  projectId: string,
  scenarioId: string | undefined,
  format: string,
  theme: string,
  sections?: string[]
) {
  try {
    // Fetch project data
    const projectData = await fetchProjectData(projectId, scenarioId)

    // Generate content based on format and theme
    let content: any
    let fileUrl: string

    switch (format) {
      case 'pdf':
        content = await generatePDFContent(projectData, theme, sections)
        fileUrl = await savePDFFile(exportId, content)
        break

      case 'docx':
        content = await generateWordContent(projectData, theme, sections)
        fileUrl = await saveWordFile(exportId, content)
        break

      case 'xlsx':
        content = await generateExcelContent(projectData, theme, sections)
        fileUrl = await saveExcelFile(exportId, content)
        break

      default:
        throw new Error('Unsupported format')
    }

    return {
      success: true,
      file_url: fileUrl,
      content: content,
      message: 'Export generated successfully'
    }
  } catch (error) {
    return {
      success: false,
      file_url: null,
      content: null,
      message: `Export generation failed: ${error.message}`
    }
  }
}

async function fetchProjectData(projectId: string, scenarioId?: string) {
  const supabase = getSupabaseClient()

  // Fetch all necessary data for export
  const [
    project,
    financialOutputs,
    products,
    capex,
    loans,
    assumptions
  ] = await Promise.all([
    supabase.from('projects').select('*, organizations(*)').eq('id', projectId).single(),
    supabase.from('financial_outputs').select('*').eq('project_id', projectId).eq('scenario_id', scenarioId || null),
    supabase.from('products_services').select('*').eq('project_id', projectId),
    supabase.from('capex').select('*').eq('project_id', projectId),
    supabase.from('loans').select('*').eq('project_id', projectId),
    supabase.from('assumptions').select('*').eq('project_id', projectId).single()
  ])

  return {
    project: project.data,
    financial_outputs: financialOutputs.data || [],
    products: products.data || [],
    capex: capex.data || [],
    loans: loans.data || [],
    assumptions: assumptions.data
  }
}

async function generatePDFContent(projectData: any, theme: string, sections?: string[]) {
  // PDF generation logic would go here
  // This would use libraries like Puppeteer or PDFKit

  const defaultSections = ['summary', 'market', 'strategy', 'financials', 'risks']
  const includedSections = sections || defaultSections

  const content = {
    title: `Business Plan - ${projectData.project.name}`,
    theme,
    sections: includedSections.map(section => generateSectionContent(section, projectData, theme))
  }

  return content
}

async function generateWordContent(projectData: any, theme: string, sections?: string[]) {
  // Word document generation logic
  // This would use libraries like docx

  return {
    type: 'docx',
    title: `Business Plan - ${projectData.project.name}`,
    theme,
    content: 'Word document content'
  }
}

async function generateExcelContent(projectData: any, theme: string, sections?: string[]) {
  // Excel generation logic
  // This would use libraries like xlsx

  return {
    type: 'xlsx',
    title: `Financial Model - ${projectData.project.name}`,
    sheets: {
      'Summary': generateSummarySheet(projectData),
      'Income Statement': generateIncomeStatementSheet(projectData),
      'Cash Flow': generateCashFlowSheet(projectData),
      'Balance Sheet': generateBalanceSheet(projectData)
    }
  }
}

function generateSectionContent(section: string, projectData: any, theme: string) {
  const templates = {
    summary: generateSummarySection(projectData, theme),
    market: generateMarketSection(projectData, theme),
    strategy: generateStrategySection(projectData, theme),
    financials: generateFinancialsSection(projectData, theme),
    risks: generateRisksSection(projectData, theme)
  }

  return templates[section] || { title: section, content: 'Section content not available' }
}

function generateSummarySection(projectData: any, theme: string) {
  const project = projectData.project
  const financials = projectData.financial_outputs

  // Calculate key metrics
  const totalRevenue = financials.reduce((sum: number, row: any) => sum + (row.revenue || 0), 0)
  const totalProfit = financials.reduce((sum: number, row: any) => sum + (row.net_income || 0), 0)

  return {
    title: 'Résumé Exécutif',
    content: {
      company_name: project.name,
      sector: project.sector,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      funding_need: calculateFundingNeed(financials),
      key_highlights: generateKeyHighlights(projectData)
    }
  }
}

function generateMarketSection(projectData: any, theme: string) {
  return {
    title: 'Analyse du Marché',
    content: {
      market_size: 'À définir',
      target_customers: 'À définir',
      competitive_landscape: 'À définir'
    }
  }
}

function generateStrategySection(projectData: any, theme: string) {
  return {
    title: 'Stratégie',
    content: {
      business_model: 'À définir',
      revenue_streams: projectData.products.map((p: any) => p.name),
      key_partnerships: 'À définir'
    }
  }
}

function generateFinancialsSection(projectData: any, theme: string) {
  const financials = projectData.financial_outputs

  return {
    title: 'Projections Financières',
    content: {
      revenue_projection: generateRevenueProjection(financials),
      profitability: generateProfitabilityAnalysis(financials),
      cash_flow: generateCashFlowAnalysis(financials),
      ratios: generateKeyRatios(financials)
    }
  }
}

function generateRisksSection(projectData: any, theme: string) {
  return {
    title: 'Analyse des Risques',
    content: {
      market_risks: 'À définir',
      operational_risks: 'À définir',
      financial_risks: 'À définir',
      mitigation_strategies: 'À définir'
    }
  }
}

// Financial analysis helpers
function calculateFundingNeed(financials: any[]) {
  const minCashBalance = Math.min(...financials.map(row => row.cash_balance || 0))
  return Math.abs(Math.min(0, minCashBalance))
}

function generateKeyHighlights(projectData: any) {
  return [
    `Secteur: ${projectData.project.sector}`,
    `Horizon: ${projectData.project.horizon_years} ans`,
    `Produits/Services: ${projectData.products.length}`,
    `Investissements: ${projectData.capex.length}`
  ]
}

function generateRevenueProjection(financials: any[]) {
  return financials.reduce((acc: any, row: any) => {
    const year = row.year
    if (!acc[year]) acc[year] = 0
    acc[year] += row.revenue || 0
    return acc
  }, {})
}

function generateProfitabilityAnalysis(financials: any[]) {
  const totalRevenue = financials.reduce((sum, row) => sum + (row.revenue || 0), 0)
  const totalProfit = financials.reduce((sum, row) => sum + (row.net_income || 0), 0)

  return {
    total_revenue: totalRevenue,
    total_profit: totalProfit,
    margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  }
}

function generateCashFlowAnalysis(financials: any[]) {
  return {
    operating_cf: financials.reduce((sum, row) => sum + (row.operating_cash_flow || 0), 0),
    investing_cf: financials.reduce((sum, row) => sum + (row.investing_cash_flow || 0), 0),
    financing_cf: financials.reduce((sum, row) => sum + (row.financing_cash_flow || 0), 0)
  }
}

function generateKeyRatios(financials: any[]) {
  const avgGrossMargin = financials.reduce((sum, row) => sum + (row.gross_margin || 0), 0) / financials.length
  const avgDSCR = financials.reduce((sum, row) => sum + (row.dscr || 0), 0) / financials.length

  return {
    gross_margin: avgGrossMargin,
    dscr: avgDSCR
  }
}

// Sheet generators for Excel
function generateSummarySheet(projectData: any) {
  return [
    ['Métrique', 'Valeur'],
    ['Nom du Projet', projectData.project.name],
    ['Secteur', projectData.project.sector],
    ['Horizon', `${projectData.project.horizon_years} ans`]
  ]
}

function generateIncomeStatementSheet(projectData: any) {
  const headers = ['Année', 'Mois', 'Chiffre d\'affaires', 'Charges', 'Résultat Net']
  const rows = projectData.financial_outputs.map((row: any) => [
    row.year,
    row.month,
    row.revenue || 0,
    (row.cogs || 0) + (row.opex_total || 0),
    row.net_income || 0
  ])

  return [headers, ...rows]
}

function generateCashFlowSheet(projectData: any) {
  const headers = ['Année', 'Mois', 'CF Opérationnel', 'CF Investissement', 'CF Financement', 'Trésorerie']
  const rows = projectData.financial_outputs.map((row: any) => [
    row.year,
    row.month,
    row.operating_cash_flow || 0,
    row.investing_cash_flow || 0,
    row.financing_cash_flow || 0,
    row.cash_balance || 0
  ])

  return [headers, ...rows]
}

function generateBalanceSheet(projectData: any) {
  // Simplified balance sheet
  return [
    ['Élément', 'Montant'],
    ['Actif Total', 'À calculer'],
    ['Passif Total', 'À calculer']
  ]
}

async function savePDFFile(exportId: string, content: any): Promise<string> {
  // In a real implementation, this would save to Supabase Storage
  return `storage/exports/${exportId}.pdf`
}

async function saveWordFile(exportId: string, content: any): Promise<string> {
  return `storage/exports/${exportId}.docx`
}

async function saveExcelFile(exportId: string, content: any): Promise<string> {
  return `storage/exports/${exportId}.xlsx`
}

function getContentType(format: string): string {
  const types = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  return types[format] || 'application/octet-stream'
}

function getAvailableTemplates() {
  return [
    {
      id: 'bank',
      name: 'Dossier Banque',
      description: 'Template optimisé pour les demandes de financement bancaire',
      sections: ['summary', 'company', 'market', 'strategy', 'financials', 'guarantees', 'risks']
    },
    {
      id: 'investor',
      name: 'Dossier Investisseur',
      description: 'Template pour levées de fonds et investisseurs',
      sections: ['summary', 'company', 'market', 'business_model', 'financials', 'team', 'roadmap']
    },
    {
      id: 'guarantee',
      name: 'Dossier Garantie',
      description: 'Template pour organismes de garantie (FONGIP, etc.)',
      sections: ['summary', 'company', 'project', 'financials', 'impact', 'guarantees']
    }
  ]
}

async function generatePreviewContent(projectId: string, scenarioId: string | undefined, theme: string, sections: string[]) {
  const projectData = await fetchProjectData(projectId, scenarioId)

  const previewSections = sections.map(section =>
    generateSectionContent(section, projectData, theme)
  )

  return {
    theme,
    sections: previewSections,
    metadata: {
      project_name: projectData.project.name,
      generated_at: new Date().toISOString(),
      total_sections: sections.length
    }
  }
}