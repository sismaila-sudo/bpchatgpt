import { FastifyPluginAsync } from 'fastify'
import { pipeline } from 'stream/promises'
import * as XLSX from 'xlsx'
import { getSupabaseClient, verifyAuthToken } from '@/services/supabase'

interface AuthenticatedRequest extends FastifyRequest {
  user?: any
}

export const importRoutes: FastifyPluginAsync = async (fastify) => {
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

  // Import Excel/CSV file
  fastify.post('/excel/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      // Check project access
      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const data = await request.file()
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' })
      }

      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]

      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Invalid file type. Only Excel and CSV files are allowed.' })
      }

      // Read file buffer
      const buffer = await data.toBuffer()

      let workbook: XLSX.WorkBook
      let importResults: any = {}

      try {
        if (data.mimetype === 'text/csv') {
          workbook = XLSX.read(buffer, { type: 'buffer' })
        } else {
          workbook = XLSX.read(buffer, { type: 'buffer' })
        }

        // Process each sheet
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          // Detect data type based on sheet name and content
          const dataType = detectDataType(sheetName, jsonData)

          if (dataType) {
            const processedData = await processImportData(dataType, jsonData, project_id)
            importResults[dataType] = processedData
          }
        }

        return {
          success: true,
          message: 'File imported successfully',
          data: importResults
        }
      } catch (error) {
        fastify.log.error('Excel processing error:', error)
        return reply.status(400).send({ error: 'Failed to process Excel file' })
      }
    } catch (error) {
      fastify.log.error('Import error:', error)
      return reply.status(500).send({ error: 'Import failed' })
    }
  })

  // Import bank statements
  fastify.post('/bank-statements/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const data = await request.file()
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' })
      }

      const buffer = await data.toBuffer()
      const content = buffer.toString('utf-8')

      // Parse bank statement (CSV format)
      const transactions = parseBankStatement(content)

      // Categorize transactions using simple rules
      const categorizedTransactions = await categorizeTransactions(transactions)

      // Save to database
      const supabase = getSupabaseClient()

      const { data: insertedData, error } = await supabase
        .from('bank_transactions')
        .insert(
          categorizedTransactions.map(tx => ({
            ...tx,
            project_id
          }))
        )
        .select()

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Bank statements imported successfully',
        data: {
          total_transactions: insertedData.length,
          transactions: insertedData
        }
      }
    } catch (error) {
      fastify.log.error('Bank statement import error:', error)
      return reply.status(500).send({ error: 'Bank statement import failed' })
    }
  })

  // Get import templates
  fastify.get('/templates/:type', async (request: AuthenticatedRequest, reply) => {
    try {
      const { type } = request.params as { type: string }

      const template = getImportTemplate(type)

      if (!template) {
        return reply.status(404).send({ error: 'Template not found' })
      }

      return {
        template,
        download_url: `/api/imports/download-template/${type}`
      }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get template' })
    }
  })

  // Download import template
  fastify.get('/download-template/:type', async (request, reply) => {
    try {
      const { type } = request.params as { type: string }

      const workbook = generateTemplate(type)

      if (!workbook) {
        return reply.status(404).send({ error: 'Template not found' })
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .header('Content-Disposition', `attachment; filename="${type}-template.xlsx"`)
        .send(buffer)
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate template' })
    }
  })

  // Get import history
  fastify.get('/history/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const supabase = getSupabaseClient()

      // Get statements (imported financial data)
      const { data: statements, error: statementsError } = await supabase
        .from('statements')
        .select('*')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })

      if (statementsError) {
        throw statementsError
      }

      // Get bank transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionsError) {
        throw transactionsError
      }

      return {
        statements: statements || [],
        bank_transactions: transactions || []
      }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get import history' })
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

function detectDataType(sheetName: string, data: any[][]): string | null {
  const name = sheetName.toLowerCase()

  // Check sheet name patterns
  if (name.includes('bilan') || name.includes('balance')) {
    return 'balance_sheet'
  }
  if (name.includes('resultat') || name.includes('income') || name.includes('p&l')) {
    return 'income_statement'
  }
  if (name.includes('flux') || name.includes('cash') || name.includes('tresorerie')) {
    return 'cash_flow'
  }
  if (name.includes('produit') || name.includes('service') || name.includes('product')) {
    return 'products'
  }
  if (name.includes('vente') || name.includes('sales') || name.includes('revenue')) {
    return 'sales'
  }
  if (name.includes('capex') || name.includes('investissement') || name.includes('investment')) {
    return 'capex'
  }
  if (name.includes('opex') || name.includes('charge') || name.includes('expense')) {
    return 'opex'
  }
  if (name.includes('salaire') || name.includes('paie') || name.includes('payroll')) {
    return 'payroll'
  }

  // Check header patterns if sheet name is not clear
  if (data.length > 0) {
    const headers = data[0].map(h => String(h).toLowerCase())

    if (headers.some(h => h.includes('actif') || h.includes('passif') || h.includes('asset'))) {
      return 'balance_sheet'
    }
    if (headers.some(h => h.includes('chiffre') || h.includes('revenue') || h.includes('charge'))) {
      return 'income_statement'
    }
  }

  return null
}

async function processImportData(dataType: string, jsonData: any[][], projectId: string) {
  if (jsonData.length < 2) {
    return { error: 'Insufficient data rows' }
  }

  const headers = jsonData[0]
  const rows = jsonData.slice(1)

  const supabase = getSupabaseClient()

  switch (dataType) {
    case 'products':
      return await processProductsData(supabase, headers, rows, projectId)

    case 'sales':
      return await processSalesData(supabase, headers, rows, projectId)

    case 'capex':
      return await processCapexData(supabase, headers, rows, projectId)

    case 'opex':
      return await processOpexData(supabase, headers, rows, projectId)

    case 'balance_sheet':
    case 'income_statement':
    case 'cash_flow':
      return await processFinancialStatement(supabase, dataType, headers, rows, projectId)

    default:
      return { error: 'Unknown data type' }
  }
}

async function processProductsData(supabase: any, headers: any[], rows: any[][], projectId: string) {
  const products = []

  // Map common header variations
  const headerMap = createHeaderMap(headers, {
    name: ['nom', 'name', 'produit', 'service', 'product'],
    description: ['description', 'desc'],
    unit: ['unite', 'unit', 'unité'],
    price: ['prix', 'price', 'tarif'],
    cogs_unit: ['cout', 'cogs', 'cost', 'coût'],
    revenue_model: ['modele', 'model', 'type']
  })

  for (const row of rows) {
    if (!row[headerMap.name] || row[headerMap.name] === '') continue

    const product = {
      project_id: projectId,
      name: String(row[headerMap.name]),
      description: row[headerMap.description] ? String(row[headerMap.description]) : null,
      unit: row[headerMap.unit] ? String(row[headerMap.unit]) : 'unité',
      price: parseFloat(row[headerMap.price]) || 0,
      cogs_unit: parseFloat(row[headerMap.cogs_unit]) || 0,
      revenue_model: mapRevenueModel(row[headerMap.revenue_model]) || 'unitaire',
      vat_rate: 18.0,
      is_active: true
    }

    products.push(product)
  }

  const { data, error } = await supabase
    .from('products_services')
    .insert(products)
    .select()

  return { imported: products.length, data, error }
}

async function processSalesData(supabase: any, headers: any[], rows: any[][], projectId: string) {
  // Implementation for sales projections import
  return { message: 'Sales data processing not implemented yet' }
}

async function processCapexData(supabase: any, headers: any[], rows: any[][], projectId: string) {
  const investments = []

  const headerMap = createHeaderMap(headers, {
    label: ['libelle', 'label', 'nom', 'name'],
    category: ['categorie', 'category', 'type'],
    amount: ['montant', 'amount', 'valeur', 'value'],
    date: ['date', 'acquisition'],
    life_months: ['duree', 'life', 'duration', 'amortissement']
  })

  for (const row of rows) {
    if (!row[headerMap.label] || !row[headerMap.amount]) continue

    const investment = {
      project_id: projectId,
      label: String(row[headerMap.label]),
      category: row[headerMap.category] ? String(row[headerMap.category]) : 'Equipement',
      amount: parseFloat(row[headerMap.amount]),
      date: parseDate(row[headerMap.date]) || new Date().toISOString().split('T')[0],
      life_months: parseInt(row[headerMap.life_months]) || 60,
      method: 'linear',
      salvage_value: 0,
      vat_rate: 18.0,
      vat_recoverable: true
    }

    investments.push(investment)
  }

  const { data, error } = await supabase
    .from('capex')
    .insert(investments)
    .select()

  return { imported: investments.length, data, error }
}

async function processOpexData(supabase: any, headers: any[], rows: any[][], projectId: string) {
  // Implementation for OPEX import
  return { message: 'OPEX data processing not implemented yet' }
}

async function processFinancialStatement(supabase: any, type: string, headers: any[], rows: any[][], projectId: string) {
  // Extract and normalize financial statement data
  const statementData = {
    project_id: projectId,
    period: new Date().getFullYear().toString(),
    type,
    source: 'import',
    mapped_lines: {
      headers,
      rows: rows.slice(0, 100) // Limit rows for storage
    },
    validation_status: 'pending'
  }

  const { data, error } = await supabase
    .from('statements')
    .insert([statementData])
    .select()

  return { imported: 1, data, error }
}

function createHeaderMap(headers: any[], mapping: Record<string, string[]>) {
  const map: Record<string, number> = {}

  for (const [key, variations] of Object.entries(mapping)) {
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase().trim()
      if (variations.some(variation => header.includes(variation))) {
        map[key] = i
        break
      }
    }
  }

  return map
}

function mapRevenueModel(value: any): string {
  if (!value) return 'unitaire'

  const str = String(value).toLowerCase()
  if (str.includes('abonnement') || str.includes('subscription')) return 'abonnement'
  if (str.includes('forfait') || str.includes('package')) return 'forfait'
  if (str.includes('licence') || str.includes('license')) return 'licence'
  if (str.includes('m2') || str.includes('surface')) return 'm2'

  return 'unitaire'
}

function parseDate(value: any): string | null {
  if (!value) return null

  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}

function parseBankStatement(content: string) {
  const lines = content.split('\n').filter(line => line.trim())
  const transactions = []

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    if (parts.length >= 3) {
      transactions.push({
        date: parseDate(parts[0]),
        label: parts[1]?.trim() || '',
        amount: parseFloat(parts[2]) || 0,
        counterparty: parts[3]?.trim() || ''
      })
    }
  }

  return transactions
}

async function categorizeTransactions(transactions: any[]) {
  // Simple rule-based categorization
  const categories: Record<string, string> = {
    'salaire': 'payroll',
    'virement': 'transfer',
    'cheque': 'payment',
    'cb': 'card_payment',
    'prelevement': 'direct_debit',
    'facture': 'bill',
    'fournisseur': 'supplier',
    'client': 'customer'
  }

  return transactions.map(tx => ({
    ...tx,
    category: detectCategory(tx.label, categories),
    confidence_score: 0.8,
    manual_override: false
  }))
}

function detectCategory(label: string, categories: Record<string, string>): string {
  const lowerLabel = label.toLowerCase()

  for (const [keyword, category] of Object.entries(categories)) {
    if (lowerLabel.includes(keyword)) {
      return category
    }
  }

  return 'other'
}

function getImportTemplate(type: string) {
  const templates: Record<string, any> = {
    products: {
      headers: ['Nom', 'Description', 'Unité', 'Prix', 'Coût unitaire', 'Modèle de revenu'],
      example: ['Produit A', 'Description du produit', 'unité', 100, 60, 'unitaire']
    },
    capex: {
      headers: ['Libellé', 'Catégorie', 'Montant', 'Date', 'Durée (mois)'],
      example: ['Ordinateur', 'Informatique', 1500, '2024-01-01', 36]
    },
    sales: {
      headers: ['Produit', 'Année', 'Mois', 'Volume', 'Prix'],
      example: ['Produit A', 2024, 1, 100, 100]
    }
  }

  return templates[type] || null
}

function generateTemplate(type: string): XLSX.WorkBook | null {
  const template = getImportTemplate(type)
  if (!template) return null

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([
    template.headers,
    template.example
  ])

  XLSX.utils.book_append_sheet(workbook, worksheet, type)

  return workbook
}