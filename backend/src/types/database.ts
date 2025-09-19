export type Organization = {
  id: string
  name: string
  slug: string
  legal_form?: string
  country: string
  currency: string
  tax_profile: Record<string, any>
  contacts: Record<string, any>
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  organization_id: string
  name: string
  description?: string
  sector: string
  size: 'TPE' | 'PME' | 'ETI' | 'GE'
  mode: 'simple' | 'advanced'
  start_date: string
  horizon_years: number
  status: 'draft' | 'active' | 'validated' | 'archived'
  scenario_set_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export type ProductService = {
  id: string
  project_id: string
  name: string
  description?: string
  category?: string
  unit: string
  revenue_model: 'unitaire' | 'abonnement' | 'm2' | 'forfait' | 'licence'
  price: number
  vat_rate: number
  cogs_unit: number
  bom: any[]
  seasonality?: number[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SalesProjection = {
  id: string
  project_id: string
  product_service_id: string
  year: number
  month: number
  volume: number
  price: number
  revenue: number
  created_at: string
}

export type Capex = {
  id: string
  project_id: string
  label: string
  category: string
  amount: number
  date: string
  life_months: number
  method: 'linear' | 'degressive'
  salvage_value: number
  vat_rate: number
  vat_recoverable: boolean
  created_at: string
  updated_at: string
}

export type Opex = {
  id: string
  project_id: string
  label: string
  category: string
  amount: number
  periodicity: 'monthly' | 'quarterly' | 'annually'
  is_variable: boolean
  var_pct_of_sales: number
  inflation_index: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export type PayrollRole = {
  id: string
  project_id: string
  role: string
  gross_monthly: number
  employer_charges_pct: number
  benefits: number
  created_at: string
  updated_at: string
}

export type HeadcountPlan = {
  id: string
  project_id: string
  role_id: string
  year: number
  month: number
  headcount: number
  created_at: string
}

export type Loan = {
  id: string
  project_id: string
  lender: string
  loan_type: 'bank_loan' | 'bond' | 'equity' | 'grant'
  principal: number
  rate: number
  term_months: number
  grace_principal: number
  grace_interest: number
  fees_pct: number
  insurance_pct: number
  balloon_pct: number
  disbursement_date: string
  covenant_dscr: number
  created_at: string
  updated_at: string
}

export type TaxSettings = {
  id: string
  project_id: string
  corporate_tax_rate: number
  vat_standard_rate: number
  vat_reduced_rate?: number
  regimes: Record<string, any>
  tva_rules: Record<string, any>
  created_at: string
  updated_at: string
}

export type WorkingCapital = {
  id: string
  project_id: string
  dso_days: number
  dpo_days: number
  inventory_days: number
  advances_clients: number
  advances_suppliers: number
  created_at: string
  updated_at: string
}

export type Assumptions = {
  id: string
  project_id: string
  inflation_rate: number
  wacc: number
  fx_rates: Record<string, number>
  sensitivity_bounds: Record<string, [number, number]>
  created_at: string
  updated_at: string
}

export type Scenario = {
  id: string
  project_id: string
  name: string
  type: 'base' | 'optimistic' | 'pessimistic' | 'stress'
  parameters: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FinancialOutput = {
  id: string
  project_id: string
  scenario_id?: string
  year: number
  month: number
  // Income Statement
  revenue: number
  cogs: number
  gross_profit: number
  opex_total: number
  ebitda: number
  depreciation: number
  ebit: number
  interest_expense: number
  taxes: number
  net_income: number
  // Cash Flow
  operating_cash_flow: number
  investing_cash_flow: number
  financing_cash_flow: number
  net_cash_flow: number
  cash_balance: number
  // Working Capital
  bfr: number
  bfr_change: number
  // Ratios
  gross_margin: number
  ebitda_margin: number
  net_margin: number
  roa: number
  roe: number
  current_ratio: number
  debt_to_equity: number
  dscr: number
  created_at: string
}

// Request/Response types
export type CreateProjectRequest = {
  organization_id: string
  name: string
  description?: string
  sector: string
  size: 'TPE' | 'PME' | 'ETI' | 'GE'
  mode?: 'simple' | 'advanced'
  start_date: string
  horizon_years?: number
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>

export type CreateProductServiceRequest = {
  name: string
  description?: string
  category?: string
  unit: string
  revenue_model: 'unitaire' | 'abonnement' | 'm2' | 'forfait' | 'licence'
  price: number
  vat_rate?: number
  cogs_unit?: number
  bom?: any[]
  seasonality?: number[]
}

export type CalculationRequest = {
  project_id: string
  scenario_id?: string
  force_recalculation?: boolean
}

export type MetricsResponse = {
  project_id: string
  scenario_id?: string
  summary: {
    total_revenue: number
    total_costs: number
    net_profit: number
    roi: number
    payback_period: number
    npv: number
    irr: number
  }
  ratios: {
    gross_margin_avg: number
    ebitda_margin_avg: number
    debt_to_equity_avg: number
    current_ratio_avg: number
    dscr_min: number
  }
  cash_flow: {
    peak_funding_need: number
    cash_generation_start: number
    break_even_month: number
  }
}