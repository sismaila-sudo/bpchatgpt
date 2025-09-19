import { FastifyPluginAsync } from 'fastify'
import { getSupabaseClient, verifyAuthToken } from '@/services/supabase'
import { MetricsResponse } from '@/types/database'

interface AuthenticatedRequest extends FastifyRequest {
  user?: any
}

export const metricsRoutes: FastifyPluginAsync = async (fastify) => {
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

  // Get project metrics
  fastify.get('/:project_id', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_id } = request.query as { scenario_id?: string }

      // Check project access
      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const metrics = await calculateProjectMetrics(project_id, scenario_id)

      return { data: metrics }
    } catch (error) {
      fastify.log.error('Metrics calculation error:', error)
      return reply.status(500).send({ error: 'Failed to calculate metrics' })
    }
  })

  // Get dashboard metrics
  fastify.get('/:project_id/dashboard', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_id } = request.query as { scenario_id?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const dashboardData = await generateDashboardMetrics(project_id, scenario_id)

      return { data: dashboardData }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate dashboard metrics' })
    }
  })

  // Get time series data
  fastify.get('/:project_id/timeseries', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_id, metric } = request.query as { scenario_id?: string, metric?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const timeSeriesData = await getTimeSeriesData(project_id, scenario_id, metric)

      return { data: timeSeriesData }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get time series data' })
    }
  })

  // Get sensitivity analysis
  fastify.get('/:project_id/sensitivity', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { base_scenario_id } = request.query as { base_scenario_id?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const sensitivityData = await performSensitivityAnalysis(project_id, base_scenario_id)

      return { data: sensitivityData }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to perform sensitivity analysis' })
    }
  })

  // Get scenario comparison
  fastify.get('/:project_id/comparison', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_ids } = request.query as { scenario_ids?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const scenarioIdList = scenario_ids ? scenario_ids.split(',') : []
      const comparisonData = await compareScenarios(project_id, scenarioIdList)

      return { data: comparisonData }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to compare scenarios' })
    }
  })

  // Get key performance indicators
  fastify.get('/:project_id/kpis', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_id, period } = request.query as { scenario_id?: string, period?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const kpis = await calculateKPIs(project_id, scenario_id, period)

      return { data: kpis }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to calculate KPIs' })
    }
  })

  // Get risk indicators
  fastify.get('/:project_id/risks', async (request: AuthenticatedRequest, reply) => {
    try {
      const { project_id } = request.params as { project_id: string }
      const { scenario_id } = request.query as { scenario_id?: string }

      const hasAccess = await checkProjectAccess(request.user.id, project_id)
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' })
      }

      const riskIndicators = await calculateRiskIndicators(project_id, scenario_id)

      return { data: riskIndicators }
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to calculate risk indicators' })
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

async function calculateProjectMetrics(projectId: string, scenarioId?: string): Promise<MetricsResponse> {
  const supabase = getSupabaseClient()

  // Fetch financial outputs
  const { data: financialOutputs, error } = await supabase
    .from('financial_outputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('scenario_id', scenarioId || null)
    .order('year')
    .order('month')

  if (error || !financialOutputs) {
    throw new Error('Failed to fetch financial data')
  }

  // Calculate summary metrics
  const totalRevenue = financialOutputs.reduce((sum, row) => sum + (row.revenue || 0), 0)
  const totalCosts = financialOutputs.reduce((sum, row) => sum + (row.cogs || 0) + (row.opex_total || 0), 0)
  const netProfit = financialOutputs.reduce((sum, row) => sum + (row.net_income || 0), 0)

  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0

  // Calculate payback period
  const paybackPeriod = calculatePaybackPeriod(financialOutputs)

  // Calculate NPV and IRR
  const { npv, irr } = calculateNPVAndIRR(financialOutputs)

  // Calculate ratios
  const grossMarginAvg = financialOutputs.reduce((sum, row) => sum + (row.gross_margin || 0), 0) / financialOutputs.length
  const ebitdaMarginAvg = financialOutputs.reduce((sum, row) => sum + (row.ebitda_margin || 0), 0) / financialOutputs.length
  const debtToEquityAvg = financialOutputs.reduce((sum, row) => sum + (row.debt_to_equity || 0), 0) / financialOutputs.length
  const currentRatioAvg = financialOutputs.reduce((sum, row) => sum + (row.current_ratio || 0), 0) / financialOutputs.length
  const dscrMin = Math.min(...financialOutputs.map(row => row.dscr || 0))

  // Calculate cash flow metrics
  const cashBalances = financialOutputs.map(row => row.cash_balance || 0)
  const peakFundingNeed = Math.abs(Math.min(0, Math.min(...cashBalances)))

  // Find cash generation start
  const firstPositiveCashIndex = cashBalances.findIndex(balance => balance > 0)
  const cashGenerationStart = firstPositiveCashIndex >= 0 ? firstPositiveCashIndex + 1 : null

  // Find break-even month
  const cumulativeNetIncome = financialOutputs.reduce((acc, row, index) => {
    acc.push((acc[index - 1] || 0) + (row.net_income || 0))
    return acc
  }, [] as number[])

  const breakEvenIndex = cumulativeNetIncome.findIndex(cumulative => cumulative > 0)
  const breakEvenMonth = breakEvenIndex >= 0 ? breakEvenIndex + 1 : null

  return {
    project_id: projectId,
    scenario_id: scenarioId,
    summary: {
      total_revenue: totalRevenue,
      total_costs: totalCosts,
      net_profit: netProfit,
      roi,
      payback_period: paybackPeriod,
      npv,
      irr
    },
    ratios: {
      gross_margin_avg: grossMarginAvg,
      ebitda_margin_avg: ebitdaMarginAvg,
      debt_to_equity_avg: debtToEquityAvg,
      current_ratio_avg: currentRatioAvg,
      dscr_min: dscrMin
    },
    cash_flow: {
      peak_funding_need: peakFundingNeed,
      cash_generation_start: cashGenerationStart,
      break_even_month: breakEvenMonth
    }
  }
}

async function generateDashboardMetrics(projectId: string, scenarioId?: string) {
  const supabase = getSupabaseClient()

  const { data: financialOutputs } = await supabase
    .from('financial_outputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('scenario_id', scenarioId || null)
    .order('year')
    .order('month')

  if (!financialOutputs || financialOutputs.length === 0) {
    return {
      cards: [],
      charts: [],
      alerts: []
    }
  }

  // Generate dashboard cards
  const cards = [
    {
      title: 'Chiffre d\'affaires total',
      value: financialOutputs.reduce((sum, row) => sum + (row.revenue || 0), 0),
      format: 'currency',
      trend: calculateTrend(financialOutputs.map(row => row.revenue || 0))
    },
    {
      title: 'Bénéfice net total',
      value: financialOutputs.reduce((sum, row) => sum + (row.net_income || 0), 0),
      format: 'currency',
      trend: calculateTrend(financialOutputs.map(row => row.net_income || 0))
    },
    {
      title: 'Marge EBITDA moyenne',
      value: financialOutputs.reduce((sum, row) => sum + (row.ebitda_margin || 0), 0) / financialOutputs.length,
      format: 'percentage',
      trend: 'neutral'
    },
    {
      title: 'Trésorerie actuelle',
      value: financialOutputs[financialOutputs.length - 1]?.cash_balance || 0,
      format: 'currency',
      trend: financialOutputs[financialOutputs.length - 1]?.cash_balance > 0 ? 'positive' : 'negative'
    }
  ]

  // Generate chart data
  const charts = [
    {
      type: 'line',
      title: 'Évolution du chiffre d\'affaires',
      data: financialOutputs.map(row => ({
        x: `${row.year}-${String(row.month).padStart(2, '0')}`,
        y: row.revenue || 0
      }))
    },
    {
      type: 'line',
      title: 'Évolution de la trésorerie',
      data: financialOutputs.map(row => ({
        x: `${row.year}-${String(row.month).padStart(2, '0')}`,
        y: row.cash_balance || 0
      }))
    },
    {
      type: 'bar',
      title: 'Résultat net mensuel',
      data: financialOutputs.map(row => ({
        x: `${row.year}-${String(row.month).padStart(2, '0')}`,
        y: row.net_income || 0
      }))
    }
  ]

  // Generate alerts
  const alerts = generateAlerts(financialOutputs)

  return {
    cards,
    charts,
    alerts
  }
}

async function getTimeSeriesData(projectId: string, scenarioId?: string, metric?: string) {
  const supabase = getSupabaseClient()

  const selectFields = metric
    ? `year, month, ${metric}`
    : 'year, month, revenue, net_income, cash_balance, ebitda_margin, dscr'

  const { data: financialOutputs } = await supabase
    .from('financial_outputs')
    .select(selectFields)
    .eq('project_id', projectId)
    .eq('scenario_id', scenarioId || null)
    .order('year')
    .order('month')

  if (!financialOutputs) {
    return []
  }

  return financialOutputs.map(row => ({
    date: `${row.year}-${String(row.month).padStart(2, '0')}`,
    ...row
  }))
}

async function performSensitivityAnalysis(projectId: string, baseScenarioId?: string) {
  const supabase = getSupabaseClient()

  // Get all scenarios for the project
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('project_id', projectId)

  if (!scenarios || scenarios.length === 0) {
    return {
      base_scenario: null,
      sensitivity_results: []
    }
  }

  const baseScenario = scenarios.find(s => s.id === baseScenarioId) || scenarios[0]

  // Calculate metrics for each scenario
  const sensitivityResults = []

  for (const scenario of scenarios) {
    const metrics = await calculateProjectMetrics(projectId, scenario.id)
    sensitivityResults.push({
      scenario: scenario.name,
      scenario_id: scenario.id,
      type: scenario.type,
      metrics: {
        total_revenue: metrics.summary.total_revenue,
        net_profit: metrics.summary.net_profit,
        npv: metrics.summary.npv,
        irr: metrics.summary.irr,
        dscr_min: metrics.ratios.dscr_min
      }
    })
  }

  return {
    base_scenario: baseScenario,
    sensitivity_results: sensitivityResults
  }
}

async function compareScenarios(projectId: string, scenarioIds: string[]) {
  if (scenarioIds.length === 0) {
    return {
      scenarios: [],
      comparison_metrics: {}
    }
  }

  const scenarioData = []

  for (const scenarioId of scenarioIds) {
    const metrics = await calculateProjectMetrics(projectId, scenarioId)
    scenarioData.push({
      scenario_id: scenarioId,
      metrics
    })
  }

  // Calculate comparison metrics
  const comparisonMetrics = {
    revenue_variance: calculateVariance(scenarioData.map(s => s.metrics.summary.total_revenue)),
    profit_variance: calculateVariance(scenarioData.map(s => s.metrics.summary.net_profit)),
    npv_variance: calculateVariance(scenarioData.map(s => s.metrics.summary.npv)),
    best_case: scenarioData.reduce((best, current) =>
      current.metrics.summary.npv > best.metrics.summary.npv ? current : best
    ),
    worst_case: scenarioData.reduce((worst, current) =>
      current.metrics.summary.npv < worst.metrics.summary.npv ? current : worst
    )
  }

  return {
    scenarios: scenarioData,
    comparison_metrics: comparisonMetrics
  }
}

async function calculateKPIs(projectId: string, scenarioId?: string, period?: string) {
  const supabase = getSupabaseClient()

  let query = supabase
    .from('financial_outputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('scenario_id', scenarioId || null)

  // Filter by period if specified
  if (period) {
    const [year, month] = period.split('-')
    if (year) query = query.eq('year', parseInt(year))
    if (month) query = query.eq('month', parseInt(month))
  }

  const { data: financialOutputs } = await query.order('year').order('month')

  if (!financialOutputs || financialOutputs.length === 0) {
    return {}
  }

  const totalRevenue = financialOutputs.reduce((sum, row) => sum + (row.revenue || 0), 0)
  const totalCosts = financialOutputs.reduce((sum, row) => sum + (row.cogs || 0) + (row.opex_total || 0), 0)

  return {
    revenue_growth_rate: calculateGrowthRate(financialOutputs.map(row => row.revenue || 0)),
    gross_margin: totalRevenue > 0 ? ((totalRevenue - financialOutputs.reduce((sum, row) => sum + (row.cogs || 0), 0)) / totalRevenue) * 100 : 0,
    operating_margin: totalRevenue > 0 ? (financialOutputs.reduce((sum, row) => sum + (row.ebitda || 0), 0) / totalRevenue) * 100 : 0,
    net_margin: totalRevenue > 0 ? (financialOutputs.reduce((sum, row) => sum + (row.net_income || 0), 0) / totalRevenue) * 100 : 0,
    asset_turnover: calculateAssetTurnover(financialOutputs),
    debt_service_coverage: financialOutputs.reduce((sum, row) => sum + (row.dscr || 0), 0) / financialOutputs.length,
    working_capital_ratio: calculateWorkingCapitalRatio(financialOutputs),
    burn_rate: calculateBurnRate(financialOutputs)
  }
}

async function calculateRiskIndicators(projectId: string, scenarioId?: string) {
  const supabase = getSupabaseClient()

  const { data: financialOutputs } = await supabase
    .from('financial_outputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('scenario_id', scenarioId || null)
    .order('year')
    .order('month')

  if (!financialOutputs || financialOutputs.length === 0) {
    return {
      risk_level: 'unknown',
      indicators: []
    }
  }

  const indicators = []

  // DSCR risk
  const minDSCR = Math.min(...financialOutputs.map(row => row.dscr || 0))
  if (minDSCR < 1.2) {
    indicators.push({
      type: 'dscr_risk',
      level: minDSCR < 1.0 ? 'high' : 'medium',
      message: `DSCR minimum de ${minDSCR.toFixed(2)} en dessous du seuil recommandé`,
      value: minDSCR
    })
  }

  // Cash flow risk
  const minCashBalance = Math.min(...financialOutputs.map(row => row.cash_balance || 0))
  if (minCashBalance < 0) {
    indicators.push({
      type: 'cash_risk',
      level: 'high',
      message: `Trésorerie négative avec un minimum de ${minCashBalance.toFixed(0)}`,
      value: minCashBalance
    })
  }

  // Profitability risk
  const negativeMonths = financialOutputs.filter(row => (row.net_income || 0) < 0).length
  const profitabilityRisk = negativeMonths / financialOutputs.length
  if (profitabilityRisk > 0.5) {
    indicators.push({
      type: 'profitability_risk',
      level: profitabilityRisk > 0.8 ? 'high' : 'medium',
      message: `${Math.round(profitabilityRisk * 100)}% des mois avec un résultat négatif`,
      value: profitabilityRisk
    })
  }

  // Revenue concentration risk (if product data available)
  // This would require additional product-level analysis

  // Determine overall risk level
  const highRiskCount = indicators.filter(i => i.level === 'high').length
  const mediumRiskCount = indicators.filter(i => i.level === 'medium').length

  let riskLevel = 'low'
  if (highRiskCount > 0) riskLevel = 'high'
  else if (mediumRiskCount > 1) riskLevel = 'medium'

  return {
    risk_level: riskLevel,
    indicators,
    summary: {
      total_indicators: indicators.length,
      high_risk: highRiskCount,
      medium_risk: mediumRiskCount
    }
  }
}

// Utility functions
function calculatePaybackPeriod(financialOutputs: any[]): number {
  let cumulativeCashFlow = 0
  for (let i = 0; i < financialOutputs.length; i++) {
    cumulativeCashFlow += financialOutputs[i].net_cash_flow || 0
    if (cumulativeCashFlow > 0) {
      return i + 1 // months
    }
  }
  return financialOutputs.length // No payback within horizon
}

function calculateNPVAndIRR(financialOutputs: any[]): { npv: number; irr: number } {
  const cashFlows = financialOutputs.map(row => row.net_cash_flow || 0)
  const wacc = 0.12 // 12% default WACC

  // NPV calculation
  let npv = 0
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + wacc / 12, i + 1)
  }

  // IRR calculation (simplified Newton-Raphson method)
  let irr = 0.12 // Initial guess
  for (let iteration = 0; iteration < 100; iteration++) {
    let npvAtRate = 0
    let derivativeAtRate = 0

    for (let i = 0; i < cashFlows.length; i++) {
      const period = i + 1
      npvAtRate += cashFlows[i] / Math.pow(1 + irr / 12, period)
      derivativeAtRate -= (period * cashFlows[i]) / (12 * Math.pow(1 + irr / 12, period + 1))
    }

    if (Math.abs(npvAtRate) < 0.01) break

    irr = irr - npvAtRate / derivativeAtRate
  }

  return { npv, irr: irr * 100 } // Convert IRR to percentage
}

function calculateTrend(values: number[]): 'positive' | 'negative' | 'neutral' {
  if (values.length < 2) return 'neutral'

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

  const change = (secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)

  if (change > 0.05) return 'positive'
  if (change < -0.05) return 'negative'
  return 'neutral'
}

function generateAlerts(financialOutputs: any[]) {
  const alerts = []

  // Check for negative cash balance
  const negativeCashMonths = financialOutputs.filter(row => (row.cash_balance || 0) < 0)
  if (negativeCashMonths.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Trésorerie négative',
      message: `${negativeCashMonths.length} mois avec une trésorerie négative détectés`,
      severity: 'high'
    })
  }

  // Check for low DSCR
  const lowDSCRMonths = financialOutputs.filter(row => (row.dscr || 0) < 1.2)
  if (lowDSCRMonths.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'DSCR faible',
      message: `${lowDSCRMonths.length} mois avec un DSCR inférieur à 1.2`,
      severity: 'medium'
    })
  }

  // Check for consecutive losses
  let consecutiveLosses = 0
  let maxConsecutiveLosses = 0

  for (const row of financialOutputs) {
    if ((row.net_income || 0) < 0) {
      consecutiveLosses++
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses)
    } else {
      consecutiveLosses = 0
    }
  }

  if (maxConsecutiveLosses >= 3) {
    alerts.push({
      type: 'error',
      title: 'Pertes consécutives',
      message: `${maxConsecutiveLosses} mois consécutifs de pertes détectés`,
      severity: 'high'
    })
  }

  return alerts
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0

  const firstValue = values[0]
  const lastValue = values[values.length - 1]

  if (firstValue === 0) return 0

  const periods = values.length - 1
  return Math.pow(lastValue / firstValue, 1 / periods) - 1
}

function calculateAssetTurnover(financialOutputs: any[]): number {
  // Simplified calculation - would need actual asset data
  const totalRevenue = financialOutputs.reduce((sum, row) => sum + (row.revenue || 0), 0)
  // Assuming assets = 2x annual revenue (industry average)
  const estimatedAssets = totalRevenue * 2 / financialOutputs.length * 12
  return estimatedAssets > 0 ? totalRevenue / estimatedAssets : 0
}

function calculateWorkingCapitalRatio(financialOutputs: any[]): number {
  // Simplified - would need actual balance sheet data
  const avgBFR = financialOutputs.reduce((sum, row) => sum + (row.bfr || 0), 0) / financialOutputs.length
  const avgRevenue = financialOutputs.reduce((sum, row) => sum + (row.revenue || 0), 0) / financialOutputs.length
  return avgRevenue > 0 ? avgBFR / avgRevenue : 0
}

function calculateBurnRate(financialOutputs: any[]): number {
  const negativeCashFlowMonths = financialOutputs.filter(row => (row.net_cash_flow || 0) < 0)
  if (negativeCashFlowMonths.length === 0) return 0

  const totalBurn = negativeCashFlowMonths.reduce((sum, row) => sum + Math.abs(row.net_cash_flow || 0), 0)
  return totalBurn / negativeCashFlowMonths.length
}