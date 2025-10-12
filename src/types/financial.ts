// Types pour le moteur financier - Contexte Sénégalais
// Conforme aux standards BCEAO, FONGIP, FAISE, banques locales

export enum Currency {
  XOF = 'XOF', // Franc CFA
  EUR = 'EUR',
  USD = 'USD'
}

export enum FinancingSource {
  PERSONAL = 'personal',
  BANK_LOAN = 'bank_loan',
  MICROFINANCE = 'microfinance',
  FONGIP = 'fongip',
  FAISE = 'faise',
  DER = 'der',
  INVESTOR = 'investor',
  FAMILY = 'family',
  OTHER = 'other'
}

export enum ExpenseCategory {
  INVESTMENTS = 'investments',
  WORKING_CAPITAL = 'working_capital',
  OPERATING = 'operating',
  PERSONNEL = 'personnel',
  MARKETING = 'marketing',
  ADMINISTRATIVE = 'administrative',
  FINANCIAL = 'financial',
  TAXES = 'taxes'
}

export enum RevenueCategory {
  SALES = 'sales',
  SERVICES = 'services',
  COMMISSION = 'commission',
  RENTAL = 'rental',
  OTHER = 'other'
}

// Structure de financement initial
export interface InitialFinancing {
  totalProject: number
  personalContribution: number
  loans: LoanDetails[]
  grants: GrantDetails[]
  investors: InvestorDetails[]
}

export interface LoanDetails {
  id: string
  source: FinancingSource
  amount: number
  interestRate: number // Pourcentage annuel
  durationMonths: number
  gracePeriodMonths?: number // Différé de paiement
  guaranteeRequired: number // Pourcentage
  bankName?: string
  notes?: string
}

export interface GrantDetails {
  id: string
  source: FinancingSource
  amount: number
  conditions: string[]
  repaymentRequired: boolean
  notes?: string
}

export interface InvestorDetails {
  id: string
  name: string
  amount: number
  equityPercentage: number
  returnExpected: number
  exitStrategy: string
  notes?: string
}

// Investissements initiaux
export interface InitialInvestments {
  equipment: EquipmentItem[]
  intangible: IntangibleItem[]
  workingCapital: WorkingCapitalItem[]
  total: number
}

export interface EquipmentItem {
  id: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  depreciationYears: number
  supplier?: string
  notes?: string
}

export interface IntangibleItem {
  id: string
  name: string
  category: string
  amount: number
  amortizationYears: number
  notes?: string
}

export interface WorkingCapitalItem {
  id: string
  category: 'stock' | 'receivables' | 'cash' | 'other'
  description: string
  amount: number
  rotationDays?: number
  notes?: string
}

// Projections de revenus
export interface RevenueProjection {
  year: number
  month?: number
  categories: RevenueByCategory[]
  total: number
  growth: number // Pourcentage de croissance
}

export interface RevenueByCategory {
  category: RevenueCategory
  description: string
  quantity?: number
  unitPrice?: number
  amount: number
  seasonality?: number[] // Facteur mensuel (12 valeurs)
}

// Projections de charges
export interface ExpenseProjection {
  year: number
  month?: number
  categories: ExpenseByCategory[]
  total: number
}

export interface ExpenseByCategory {
  category: ExpenseCategory
  description: string
  amount: number
  variablePercentage: number // Pourcentage du CA
  escalationRate: number // Augmentation annuelle
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
}

// Compte de résultat prévisionnel
export interface ProfitLossProjection {
  year: number
  revenues: RevenueProjection
  expenses: ExpenseProjection
  grossProfit: number
  operatingProfit: number
  financialCharges: number
  netProfitBeforeTax: number
  taxes: number
  netProfit: number
  ebitda: number
  margins: {
    gross: number
    operating: number
    net: number
  }
}

// Plan de trésorerie
export interface CashFlowProjection {
  year: number
  month: number
  openingBalance: number
  receipts: CashReceipts
  payments: CashPayments
  netCashFlow: number
  closingBalance: number
  cumulativeCashFlow: number
}

export interface CashReceipts {
  sales: number
  loans: number
  grants: number
  other: number
  total: number
}

export interface CashPayments {
  investments: number
  workingCapital: number
  operatingExpenses: number
  loanRepayments: number
  taxes: number
  other: number
  total: number
}

// Ratios financiers
export interface FinancialRatios {
  profitability: ProfitabilityRatios
  liquidity: LiquidityRatios
  leverage: LeverageRatios
  efficiency: EfficiencyRatios
  valuation: ValuationRatios
}

export interface ProfitabilityRatios {
  roi: number // Return on Investment
  roe: number // Return on Equity
  roa: number // Return on Assets
  grossMargin: number
  operatingMargin: number
  netMargin: number
  paybackPeriod: number // En années
}

export interface LiquidityRatios {
  currentRatio: number
  quickRatio: number
  cashRatio: number
  workingCapitalRatio: number
}

export interface LeverageRatios {
  debtToEquity: number
  debtToAssets: number
  equityRatio: number
  interestCoverage: number
}

export interface EfficiencyRatios {
  assetTurnover: number
  inventoryTurnover: number
  receivablesTurnover: number
  workingCapitalTurnover: number
}

export interface ValuationRatios {
  priceToEarnings?: number
  priceToBook?: number
  enterpriseValue?: number
}

// Analyse de sensibilité
export interface SensitivityAnalysis {
  scenarios: Scenario[]
  variables: SensitivityVariable[]
  results: SensitivityResult[]
}

export interface Scenario {
  id: string
  name: 'pessimistic' | 'realistic' | 'optimistic'
  description: string
  probability: number
  adjustments: ScenarioAdjustment[]
}

export interface ScenarioAdjustment {
  variable: string
  adjustment: number // Pourcentage ou valeur absolue
  type: 'percentage' | 'absolute'
}

export interface SensitivityVariable {
  name: string
  baseValue: number
  minValue: number
  maxValue: number
  stepSize: number
  impact: 'revenue' | 'cost' | 'both'
}

export interface SensitivityResult {
  scenarioId: string
  variable: string
  value: number
  netProfitImpact: number
  roiImpact: number
  paybackImpact: number
}

// Analyse de seuil de rentabilité
export interface BreakEvenAnalysis {
  year: number
  fixedCosts: number
  variableCostRatio: number
  averageSellingPrice: number
  breakEvenUnits: number
  breakEvenRevenue: number
  marginOfSafety: number
  operatingLeverage: number
  reachMonth?: number // Mois d'atteinte du seuil
}

// Données financières complètes du projet
export interface ProjectFinancials {
  id: string
  projectId: string
  currency: Currency
  planningHorizon: number // Nombre d'années

  // Structure initiale
  initialFinancing: InitialFinancing
  initialInvestments: InitialInvestments

  // Projections annuelles
  profitLossProjections: ProfitLossProjection[]
  cashFlowProjections: CashFlowProjection[]

  // Analyses
  financialRatios: FinancialRatios[]
  sensitivityAnalysis: SensitivityAnalysis
  breakEvenAnalysis: BreakEvenAnalysis[]

  // Métadonnées
  lastCalculated: Date
  assumptions: FinancialAssumption[]
  validationStatus: ValidationStatus
}

export interface FinancialAssumption {
  category: string
  description: string
  value: number
  unit: string
  source: string
  confidence: 'low' | 'medium' | 'high'
}

export interface ValidationStatus {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  lastValidated: Date
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  recommendation: string
}

// Standards bancaires sénégalais
export interface SenegalBankingStandards {
  minimumEquityRatio: number // 30%
  maximumDebtRatio: number // 70%
  minimumLiquidityRatio: number // 1.2
  minimumROI: number // 15%
  minimumInterestCoverage: number // 2.0
  maximumPaybackPeriod: number // 5 années
}

// Constantes financières locales
export const SENEGAL_FINANCIAL_CONSTANTS = {
  BCEAO_RATE: 4.5,
  BANK_RATES: {
    min: 12,
    max: 18,
    average: 15
  },
  MICROFINANCE_RATES: {
    min: 15,
    max: 25,
    average: 20
  },
  TAX_RATES: {
    corporate: 30,
    vat: 18,
    payroll: 13.5
  },
  DEPRECIATION_RATES: {
    equipment: 20,
    vehicles: 25,
    computers: 33,
    buildings: 5,
    furniture: 10
  }
} as const

export const FONGIP_CRITERIA = {
  minimumROI: 20,
  minimumEquityRatio: 40,
  maximumLoanAmount: 50000000, // 50M FCFA
  maximumDuration: 84, // 7 ans
  sectors: ['agriculture', 'elevage', 'peche', 'artisanat', 'services']
} as const

export const FAISE_CRITERIA = {
  minimumROI: 18,
  minimumEquityRatio: 35,
  maximumLoanAmount: 100000000, // 100M FCFA
  maximumDuration: 120, // 10 ans
  sectors: ['industry', 'agribusiness', 'services', 'ict']
} as const