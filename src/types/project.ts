export enum ProjectType {
  CREATION = 'creation',
  EXPANSION = 'expansion',
  DIVERSIFICATION = 'diversification',
  REPRISE = 'reprise'
}

export enum CompanySize {
  MICRO = 'micro',           // < 5 employés
  SMALL = 'small',           // 5-20 employés
  MEDIUM = 'medium',         // 20-100 employés
  LARGE = 'large'            // > 100 employés
}

export enum BusinessSector {
  // Agriculture & Pêche
  AGRICULTURE = 'agriculture',
  ELEVAGE = 'elevage',
  PECHE = 'peche',
  TRANSFORMATION_AGRICOLE = 'transformation_agricole',

  // Commerce & Distribution
  COMMERCE_DETAIL = 'commerce_detail',
  COMMERCE_GROS = 'commerce_gros',
  IMPORT_EXPORT = 'import_export',
  DISTRIBUTION = 'distribution',

  // Services
  SERVICES_FINANCIERS = 'services_financiers',
  CONSEIL = 'conseil',
  FORMATION = 'formation',
  SANTE = 'sante',
  EDUCATION = 'education',
  TOURISME = 'tourisme',
  TRANSPORT = 'transport',
  LOGISTIQUE = 'logistique',

  // Industrie & Production
  INDUSTRIE_ALIMENTAIRE = 'industrie_alimentaire',
  TEXTILE = 'textile',
  CONSTRUCTION = 'construction',
  MATERIAUX = 'materiaux',
  ARTISANAT = 'artisanat',

  // Technologie & Innovation
  TECHNOLOGIES = 'technologies',
  TELECOMMUNICATION = 'telecommunication',
  FINTECH = 'fintech',
  E_COMMERCE = 'e_commerce',

  // Énergie & Environnement
  ENERGIE_RENOUVELABLE = 'energie_renouvelable',
  ENVIRONNEMENT = 'environnement',
  EAU_ASSAINISSEMENT = 'eau_assainissement',

  // Autres
  AUTRES = 'autres'
}

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Types d'entreprises au Sénégal
export enum SenegalCompanyType {
  SARL = 'sarl',                    // Société à Responsabilité Limitée
  SA = 'sa',                        // Société Anonyme
  SUARL = 'suarl',                  // Société Unipersonnelle à Responsabilité Limitée
  SNC = 'snc',                      // Société en Nom Collectif
  SCS = 'scs',                      // Société en Commandite Simple
  GIE = 'gie',                      // Groupement d'Intérêt Économique
  ENTREPRISE_INDIVIDUELLE = 'ei',   // Entreprise Individuelle
  AUTO_ENTREPRENEUR = 'ae',         // Auto-entrepreneur
  ASSOCIATION = 'association',      // Association
  COOPERATIVE = 'cooperative',      // Coopérative
  SOCIETE_CIVILE = 'sc'            // Société Civile
}

// Statuts d'entreprise
export enum CompanyStatus {
  CREATION = 'creation',           // En cours de création
  ACTIVE = 'active',               // En activité
  SUSPENDUE = 'suspendue',         // Activité suspendue
  DISSOLUTION = 'dissolution'       // En dissolution
}

export interface ProjectBasicInfo {
  name: string
  description: string
  sector: BusinessSector
  projectType: ProjectType
  companySize: CompanySize
  location: {
    region: string
    city: string
    address?: string
  }
  timeline: {
    startDate: Date
    projectedLaunch?: Date
    duration: number // en mois
  }
}

export interface Project {
  id: string
  ownerId: string
  organizationId?: string

  // Informations de base
  basicInfo: ProjectBasicInfo

  // Sections du business plan
  sections: {
    identification?: CompanyIdentification
    marketStudy?: MarketStudy
    technicalStudy?: TechnicalStudy
    financialData?: FinancialData
    swotAnalysis?: SwotAnalysis
    businessPlan?: BusinessPlanContent
  }

  // Nouvelles sections du business plan intégrées
  businessPlan?: {
    marketStudy?: Record<string, unknown> // MarketStudy from businessPlan types
    swotAnalysis?: Record<string, unknown> // SWOTAnalysis from businessPlan types
    marketingPlan?: Record<string, unknown> // MarketingPlan from businessPlan types
    humanResources?: Record<string, unknown> // HumanResources from businessPlan types
  }

  // Métadonnées
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
  collaborators?: string[]
  templateUsed?: string
}

export interface CompanyIdentification {
  // Identification légale
  legalName: string
  commercialName?: string
  legalForm: SenegalCompanyType
  status: CompanyStatus

  // Numéros d'identification sénégalais
  ninea?: string                    // Numéro d'Identification Nationale des Entreprises
  registreCommerce?: string         // Numéro du Registre de Commerce
  nif?: string                      // Numéro d'Identification Fiscale

  // Capital et actionnariat
  capital: number
  currency: 'XOF' | 'EUR' | 'USD'   // Franc CFA principalement

  // Dirigeants et contacts
  manager: {
    name: string
    function: string               // Gérant, DG, PDG, etc.
    phone: string
    email: string
  }
  pointFocal?: {
    name: string
    function: string
    phone: string
    email: string
  }

  // Fondateurs/Associés
  founders: Array<{
    name: string
    role: string
    equity: number                 // Part en pourcentage
    apport: number                 // Apport en FCFA
  }>

  // Siège social
  headquarters: {
    address: string
    city: string
    region: string
    country: string
    phone?: string
    email?: string
    website?: string
  }

  // Dates importantes
  dates: {
    creation?: Date
    registrationRC?: Date
    debutActivite?: Date
  }

  // Informations complémentaires
  activitePrincipale: string
  activitesSecondaires?: string[]
  effectifPrevu: number
  logo?: string                    // URL vers le logo
}

export interface MarketStudy {
  targetMarket: {
    description: string
    size: number
    growth: number
  }
  competition: Array<{
    name: string
    strengths: string[]
    weaknesses: string[]
    marketShare?: number
  }>
  marketingStrategy: {
    positioning: string
    channels: string[]
    budget: number
  }
}

export interface TechnicalStudy {
  production: {
    process: string
    capacity: number
    equipment: Array<{
      name: string
      cost: number
      lifespan: number
    }>
  }
  location: {
    requirements: string[]
    justification: string
    cost: number
  }
  workforce: {
    organigram: string
    recruitment: Array<{
      position: string
      count: number
      salary: number
    }>
  }
}

export interface FinancialData {
  investment: {
    total: number
    breakdown: Array<{
      category: string
      amount: number
    }>
  }
  financing: {
    ownFunds: number
    loans: Array<{
      source: string
      amount: number
      rate: number
      duration: number
    }>
    grants: Array<{
      source: string
      amount: number
      conditions: string
    }>
  }
  projections: {
    revenue: Array<{ year: number, amount: number }>
    expenses: Array<{ year: number, amount: number }>
    profit: Array<{ year: number, amount: number }>
  }
  ratios: {
    profitability: number
    paybackPeriod: number
    roi: number
    breakEven: number
  }
}

export interface SwotAnalysis {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface BusinessPlanContent {
  executiveSummary: string
  companyPresentation: string
  marketAnalysis: string
  strategy: string
  operations: string
  management: string
  financialPlan: string
  riskAnalysis: string
  conclusion: string
}