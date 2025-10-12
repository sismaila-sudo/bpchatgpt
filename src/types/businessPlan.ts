// Types pour les sections complètes du business plan
// Conforme aux standards business plan sénégalais

import { BusinessSector } from './project'

// ============ ÉTUDE DE MARCHÉ ============

export interface MarketStudy {
  id: string
  projectId: string

  // Analyse du marché
  marketAnalysis: {
    marketSize: number // Taille du marché en FCFA
    marketGrowth: number // Croissance annuelle %
    marketSegments: MarketSegment[]
    keyTrends: string[]
    seasonality: SeasonalityFactor[]
  }

  // Analyse de la clientèle
  targetCustomers: {
    segments: CustomerSegment[]
    totalAddressableMarket: number
    servicableAddressableMarket: number
    penetrationRate: number
  }

  // Analyse de la concurrence
  competitiveAnalysis: {
    competitors: Competitor[]
    competitiveMatrix: CompetitiveMatrix
    marketPositioning: string
    competitiveAdvantages: string[]
  }

  // Contexte sectoriel sénégalais
  sectorContext: {
    governmentPolicy: string
    regulations: string[]
    supportPrograms: string[]
    challenges: string[]
    opportunities: string[]
  }

  lastUpdated: Date
}

export interface MarketSegment {
  id: string
  name: string
  size: number // En FCFA
  growthRate: number // %
  characteristics: string[]
  accessibility: 'high' | 'medium' | 'low'
}

export interface SeasonalityFactor {
  month: number
  factor: number // Multiplicateur (1 = normal, 1.5 = +50%, 0.7 = -30%)
  description: string
}

export interface CustomerSegment {
  id: string
  name: string
  demographics: {
    ageRange: string
    income: string
    location: string[]
    profession: string[]
  }
  needs: string[]
  painPoints: string[]
  buyingBehavior: {
    decisionFactors: string[]
    buyingProcess: string
    averageTicket: number
    frequency: string
  }
  size: number // Nombre de clients potentiels
}

export interface Competitor {
  id: string
  name: string
  type: 'direct' | 'indirect' | 'substitute'
  marketShare: number // %
  strengths: string[]
  weaknesses: string[]
  pricing: {
    strategy: string
    averagePrice: number
    priceRange: { min: number; max: number }
  }
  location: string[]
  target: string[]
}

export interface CompetitiveMatrix {
  criteria: string[] // Prix, Qualité, Service, Innovation, etc.
  companies: {
    name: string
    scores: number[] // Note sur 5 pour chaque critère
  }[]
}

// ============ ANALYSE SWOT ============

export interface SWOTAnalysis {
  id: string
  projectId: string

  strengths: SWOTItem[]
  weaknesses: SWOTItem[]
  opportunities: SWOTItem[]
  threats: SWOTItem[]

  strategicRecommendations: {
    soStrategies: string[] // Forces + Opportunités
    woStrategies: string[] // Faiblesses + Opportunités
    stStrategies: string[] // Forces + Menaces
    wtStrategies: string[] // Faiblesses + Menaces
  }

  lastUpdated: Date
}

export interface SWOTItem {
  id: string
  description: string
  impact: 'high' | 'medium' | 'low'
  priority: number
  actionItems: string[]
}

// ============ PLAN MARKETING ============

export interface MarketingPlan {
  id: string
  projectId: string

  // Stratégie marketing
  strategy: {
    positioning: string
    valueProposition: string
    brandIdentity: {
      name: string
      logo: string
      colors: string[]
      slogan: string
    }
    targetSegments: string[]
  }

  // Mix marketing (4P)
  marketingMix: {
    product: ProductStrategy
    price: PricingStrategy
    place: DistributionStrategy
    promotion: PromotionStrategy
  }

  // Plan d'actions marketing
  actionPlan: {
    launchStrategy: LaunchStrategy
    campaigns: MarketingCampaign[]
    budget: MarketingBudget
    timeline: MarketingTimeline[]
  }

  // Métriques et KPIs
  kpis: {
    awarenessTargets: number
    acquisitionTargets: number
    retentionTargets: number
    revenueTargets: number[]
  }

  lastUpdated: Date
}

export interface ProductStrategy {
  core: string
  features: string[]
  benefits: string[]
  differentiation: string[]
  lifecycle: 'introduction' | 'growth' | 'maturity' | 'decline'
  development: {
    roadmap: string[]
    innovations: string[]
  }
}

export interface PricingStrategy {
  strategy: 'cost_plus' | 'competition' | 'value' | 'penetration' | 'skimming'
  basePrice: number
  priceRange: { min: number; max: number }
  paymentTerms: string[]
  discounts: {
    type: string
    percentage: number
    conditions: string
  }[]
}

export interface DistributionStrategy {
  channels: DistributionChannel[]
  coverage: 'intensive' | 'selective' | 'exclusive'
  partnerships: {
    retailers: string[]
    distributors: string[]
    onlineMarketplaces: string[]
  }
  logistics: {
    warehousing: string
    transportation: string
    inventory: string
  }
}

export interface DistributionChannel {
  id: string
  type: 'direct' | 'retail' | 'wholesale' | 'online' | 'agent'
  name: string
  coverage: string[]
  margin: number // %
  volume: number // % des ventes
}

export interface PromotionStrategy {
  communication: {
    mainMessage: string
    channels: PromotionChannel[]
    budget: number
  }
  salesPromotion: {
    launches: string[]
    loyalty: string[]
    incentives: string[]
  }
  publicRelations: {
    events: string[]
    partnerships: string[]
    community: string[]
  }
  digitalMarketing: {
    website: boolean
    socialMedia: string[]
    seo: boolean
    advertising: string[]
  }
}

export interface PromotionChannel {
  id: string
  type: 'tv' | 'radio' | 'print' | 'digital' | 'outdoor' | 'event' | 'word_of_mouth'
  name: string
  budget: number
  reach: number
  frequency: number
  timing: string
}

export interface LaunchStrategy {
  phases: LaunchPhase[]
  budget: number
  timeline: string
  successMetrics: string[]
}

export interface LaunchPhase {
  id: string
  name: string
  duration: string
  activities: string[]
  budget: number
  targets: string[]
}

export interface MarketingCampaign {
  id: string
  name: string
  objective: string
  target: string
  budget: number
  duration: { start: Date; end: Date }
  channels: string[]
  kpis: string[]
  status: 'planned' | 'active' | 'completed' | 'cancelled'
}

export interface MarketingBudget {
  total: number
  allocation: {
    advertising: number
    promotion: number
    events: number
    digital: number
    pr: number
    other: number
  }
  breakdown: {
    year1: number
    year2: number
    year3: number
  }
}

export interface MarketingTimeline {
  id: string
  quarter: string
  activities: string[]
  budget: number
  kpis: string[]
}

// ============ RESSOURCES HUMAINES ============

export interface HumanResources {
  id: string
  projectId: string

  // Structure organisationnelle
  organization: {
    orgChart: OrganizationChart
    governance: Governance
    advisors: Advisor[]
  }

  // Équipe dirigeante
  managementTeam: TeamMember[]

  // Plan de recrutement
  recruitmentPlan: {
    positions: Position[]
    timeline: RecruitmentTimeline[]
    budget: RecruitmentBudget
  }

  // Politiques RH
  hrPolicies: {
    compensation: CompensationPolicy
    benefits: BenefitsPackage
    training: TrainingProgram
    performance: PerformanceManagement
  }

  // Projections RH
  projections: {
    headcount: HeadcountProjection[]
    costs: HRCostProjection[]
    productivity: ProductivityMetrics
  }

  lastUpdated: Date
}

export interface OrganizationChart {
  levels: OrgLevel[]
  totalPositions: number
  reportingLines: ReportingLine[]
}

export interface OrgLevel {
  level: number
  name: string
  positions: string[]
  count: number
}

export interface ReportingLine {
  from: string
  to: string
  type: 'direct' | 'functional' | 'advisory'
}

export interface Governance {
  board: BoardMember[]
  committees: Committee[]
  decisionMaking: string
  meetingFrequency: string
}

export interface BoardMember {
  id: string
  name: string
  role: string
  expertise: string[]
  experience: string
  equity: number // %
}

export interface Committee {
  id: string
  name: string
  purpose: string
  members: string[]
  frequency: string
}

export interface Advisor {
  id: string
  name: string
  expertise: string
  role: string
  compensation: string
  time: string // heures/mois
}

export interface TeamMember {
  id: string
  name: string
  position: string
  department: string
  education: string
  experience: string
  skills: string[]
  responsibilities: string[]
  kpis: string[]
  salary: number
  equity: number // %
  startDate: Date
}

export interface Position {
  id: string
  title: string
  department: string
  level: 'entry' | 'mid' | 'senior' | 'executive'
  type: 'full_time' | 'part_time' | 'contract' | 'intern'
  requirements: {
    education: string
    experience: string
    skills: string[]
    languages: string[]
  }
  responsibilities: string[]
  salary: { min: number; max: number }
  benefits: string[]
  priority: 'high' | 'medium' | 'low'
  timeline: string
}

export interface RecruitmentTimeline {
  quarter: string
  positions: string[]
  budget: number
  sources: string[]
}

export interface RecruitmentBudget {
  total: number
  breakdown: {
    advertising: number
    agencies: number
    referrals: number
    events: number
    other: number
  }
}

export interface CompensationPolicy {
  philosophy: string
  structure: {
    base: string
    variable: string
    equity: string
  }
  benchmarking: string
  reviews: string
}

export interface BenefitsPackage {
  insurance: string[]
  retirement: string
  vacation: string
  training: string
  other: string[]
  cost: number // % du salaire
}

export interface TrainingProgram {
  onboarding: string
  continuous: string[]
  leadership: string[]
  budget: number
  providers: string[]
}

export interface PerformanceManagement {
  system: string
  frequency: string
  criteria: string[]
  consequences: {
    rewards: string[]
    development: string[]
    corrective: string[]
  }
}

export interface HeadcountProjection {
  year: number
  total: number
  byDepartment: { [key: string]: number }
  growth: number // %
}

export interface HRCostProjection {
  year: number
  salaries: number
  benefits: number
  training: number
  recruitment: number
  total: number
}

export interface ProductivityMetrics {
  revenuePerEmployee: number[]
  costPerEmployee: number[]
  turnoverRate: number
  satisfactionScore: number
}

// ============ PLAN OPÉRATIONNEL ============

export interface OperationalPlan {
  id: string
  projectId: string

  // Processus opérationnels
  processes: {
    core: CoreProcess[]
    support: SupportProcess[]
    qualityControl: QualityProcess[]
  }

  // Ressources et infrastructure
  resources: {
    facilities: Facility[]
    equipment: EquipmentPlan[]
    technology: TechnologyPlan
    suppliers: SupplierPlan[]
  }

  // Planning opérationnel
  timeline: {
    milestones: Milestone[]
    phases: OperationalPhase[]
    dependencies: Dependency[]
  }

  // Métriques opérationnelles
  kpis: {
    efficiency: EfficiencyMetric[]
    quality: QualityMetric[]
    productivity: ProductivityMetric[]
  }

  lastUpdated: Date
}

export interface CoreProcess {
  id: string
  name: string
  description: string
  inputs: string[]
  outputs: string[]
  steps: ProcessStep[]
  duration: string
  cost: number
  quality: string[]
}

export interface ProcessStep {
  id: string
  name: string
  description: string
  duration: string
  resources: string[]
  dependencies: string[]
  risks: string[]
}

export interface SupportProcess {
  id: string
  name: string
  purpose: string
  frequency: string
  cost: number
  outsourced: boolean
}

export interface QualityProcess {
  id: string
  name: string
  standards: string[]
  controls: string[]
  frequency: string
  certifications: string[]
}

export interface Facility {
  id: string
  type: 'office' | 'warehouse' | 'production' | 'retail' | 'other'
  location: string
  size: number // m²
  cost: number // FCFA/mois
  lease: { duration: string; terms: string[] }
  requirements: string[]
}

export interface EquipmentPlan {
  id: string
  name: string
  category: string
  quantity: number
  cost: number
  supplier: string
  maintenance: MaintenancePlan
  lifecycle: number // années
}

export interface MaintenancePlan {
  schedule: string
  cost: number // FCFA/an
  provider: string
  warranty: string
}

export interface TechnologyPlan {
  systems: TechSystem[]
  infrastructure: TechInfrastructure
  security: SecurityPlan
  budget: number
}

export interface TechSystem {
  id: string
  name: string
  purpose: string
  vendor: string
  cost: number
  implementation: string
  training: string
}

export interface TechInfrastructure {
  network: string
  servers: string
  cloud: string
  backup: string
  support: string
}

export interface SecurityPlan {
  policies: string[]
  controls: string[]
  training: string
  compliance: string[]
  budget: number
}

export interface SupplierPlan {
  id: string
  name: string
  category: string
  products: string[]
  terms: {
    payment: string
    delivery: string
    quality: string
  }
  risk: 'low' | 'medium' | 'high'
  alternatives: string[]
}

export interface Milestone {
  id: string
  name: string
  date: Date
  description: string
  deliverables: string[]
  success: string[]
  responsible: string
}

export interface OperationalPhase {
  id: string
  name: string
  duration: string
  objectives: string[]
  activities: string[]
  budget: number
  risks: string[]
}

export interface Dependency {
  id: string
  from: string
  to: string
  type: 'start_to_start' | 'finish_to_start' | 'start_to_finish' | 'finish_to_finish'
  lag: string
}

export interface EfficiencyMetric {
  name: string
  target: number
  measurement: string
  frequency: string
}

export interface QualityMetric {
  name: string
  standard: string
  target: number
  measurement: string
}

export interface ProductivityMetric {
  name: string
  baseline: number
  target: number
  driver: string[]
}

// ============ STRUCTURE GLOBALE BUSINESS PLAN ============

export interface BusinessPlan {
  id: string
  projectId: string

  // Métadonnées
  metadata: {
    version: string
    createdAt: Date
    lastUpdated: Date
    status: 'draft' | 'review' | 'approved' | 'final'
    author: string
    reviewer?: string
  }

  // Sections principales
  sections: {
    marketStudy?: MarketStudy
    swotAnalysis?: SWOTAnalysis
    marketingPlan?: MarketingPlan
    humanResources?: HumanResources
    operationalPlan?: OperationalPlan
  }

  // Configuration export
  exportConfig: {
    includedSections: string[]
    template: string
    customizations: { [key: string]: unknown }
  }

  // Validation et qualité
  validation: {
    completeness: number // % de sections complétées
    quality: number // Score qualité global
    issues: ValidationIssue[]
    recommendations: string[]
  }
}

export interface ValidationIssue {
  section: string
  field: string
  type: 'missing' | 'incomplete' | 'inconsistent' | 'warning'
  message: string
  priority: 'high' | 'medium' | 'low'
}

// Constantes pour les secteurs sénégalais
export const SENEGAL_MARKET_DATA = {
  // Tailles de marché par secteur (en milliards FCFA)
  MARKET_SIZES: {
    agriculture: 2800,
    elevage: 400,
    peche: 150,
    industrie: 1200,
    services: 3500,
    commerce: 2100,
    transport: 800,
    telecommunications: 600,
    tourisme: 350,
    energie: 500
  },

  // Taux de croissance moyens par secteur
  GROWTH_RATES: {
    agriculture: 6.5,
    elevage: 4.2,
    peche: 3.8,
    industrie: 8.1,
    services: 7.3,
    commerce: 5.9,
    transport: 9.2,
    telecommunications: 12.5,
    tourisme: 15.8,
    energie: 11.3
  },

  // Programmes de soutien gouvernementaux
  SUPPORT_PROGRAMS: {
    FONGIP: ['agriculture', 'elevage', 'peche', 'artisanat', 'services'],
    FAISE: ['industrie', 'agribusiness', 'services', 'ict'],
    DER: ['jeunes', 'femmes', 'agriculture', 'artisanat'],
    FONSIS: ['industrie', 'infrastructure', 'energie', 'telecommunications'],
    ADEPME: ['pme', 'industrie', 'services', 'export']
  }
} as const

// Constantes pour les canaux marketing
export const MARKETING_CHANNELS = [
  { value: 'digital_ads', label: 'Publicité digitale' },
  { value: 'social_media', label: 'Réseaux sociaux' },
  { value: 'radio', label: 'Radio' },
  { value: 'tv', label: 'Télévision' },
  { value: 'print', label: 'Presse écrite' },
  { value: 'outdoor', label: 'Affichage extérieur' },
  { value: 'events', label: 'Événements' },
  { value: 'influencers', label: 'Influenceurs' },
  { value: 'email', label: 'Email marketing' },
  { value: 'sms', label: 'SMS marketing' },
  { value: 'word_of_mouth', label: 'Bouche-à-oreille' },
  { value: 'partnerships', label: 'Partenariats' },
  { value: 'direct_sales', label: 'Vente directe' },
  { value: 'content_marketing', label: 'Marketing de contenu' }
] as const

// Stratégies de prix
export const PRICING_STRATEGIES = [
  { value: 'competitive', label: 'Prix concurrentiel' },
  { value: 'premium', label: 'Prix premium' },
  { value: 'penetration', label: 'Prix de pénétration' },
  { value: 'skimming', label: 'Prix d\'écrémage' },
  { value: 'cost_plus', label: 'Coût plus marge' },
  { value: 'value_based', label: 'Basé sur la valeur' },
  { value: 'dynamic', label: 'Prix dynamique' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'bundle', label: 'Prix groupé' },
  { value: 'psychological', label: 'Prix psychologique' }
] as const

// Types de postes
export const POSITION_TYPES = [
  { value: 'full-time', label: 'Temps plein' },
  { value: 'part-time', label: 'Temps partiel' },
  { value: 'contract', label: 'Contractuel' },
  { value: 'intern', label: 'Stagiaire' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'temporary', label: 'Temporaire' }
] as const

// Types de contrats
export const CONTRACT_TYPES = [
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
  { value: 'stage', label: 'Stage' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'apprenticeship', label: 'Apprentissage' }
] as const

// Fonction pour obtenir les canaux marketing recommandés par secteur
export function getSectorMarketingChannels(sector: string): string[] {
  const recommendations: { [key: string]: string[] } = {
    agriculture: ['radio', 'events', 'word_of_mouth', 'partnerships'],
    elevage: ['radio', 'events', 'word_of_mouth', 'direct_sales'],
    peche: ['radio', 'word_of_mouth', 'partnerships', 'events'],
    commerce_detail: ['social_media', 'digital_ads', 'outdoor', 'radio'],
    commerce_gros: ['partnerships', 'direct_sales', 'events', 'email'],
    services_financiers: ['digital_ads', 'partnerships', 'content_marketing', 'events'],
    technologies: ['digital_ads', 'social_media', 'content_marketing', 'influencers'],
    sante: ['partnerships', 'word_of_mouth', 'events', 'content_marketing'],
    education: ['social_media', 'partnerships', 'word_of_mouth', 'events'],
    tourisme: ['social_media', 'digital_ads', 'influencers', 'partnerships'],
    transport: ['digital_ads', 'partnerships', 'outdoor', 'radio'],
    construction: ['partnerships', 'word_of_mouth', 'print', 'events'],
    industrie_alimentaire: ['tv', 'radio', 'outdoor', 'social_media'],
    textile: ['social_media', 'influencers', 'events', 'partnerships'],
    artisanat: ['social_media', 'events', 'word_of_mouth', 'partnerships']
  }

  return recommendations[sector] || ['social_media', 'digital_ads', 'word_of_mouth', 'partnerships']
}

// Fonction pour obtenir les besoins RH par secteur
export function getSectorHRNeeds(sector: string): { keyPositions: Array<Record<string, unknown>>; departments: Array<Record<string, unknown>> } {
  const sectorHRNeeds: { [key: string]: { keyPositions: Array<Record<string, unknown>>; departments: Array<Record<string, unknown>> } } = {
    agriculture: {
      keyPositions: [
        {
          title: 'Ingénieur Agronome',
          description: 'Supervision technique des cultures',
          requirements: ['Diplôme ingénieur agronome', '3+ ans expérience'],
          responsibilities: ['Planification cultures', 'Conseil technique', 'Formation équipes'],
          salary: 400000,
          type: 'full-time',
          priority: 'high'
        },
        {
          title: 'Chef d\'Exploitation',
          description: 'Gestion opérationnelle quotidienne',
          requirements: ['Formation agricole', '5+ ans expérience terrain'],
          responsibilities: ['Supervision équipes', 'Planification activités', 'Contrôle qualité'],
          salary: 300000,
          type: 'full-time',
          priority: 'high'
        }
      ],
      departments: [
        { name: 'Production', manager: 'Chef d\'Exploitation', employees: 8, responsibilities: ['Culture', 'Récolte', 'Conditionnement'] },
        { name: 'Commercial', manager: 'Responsable Commercial', employees: 3, responsibilities: ['Vente', 'Distribution', 'Relations clients'] }
      ]
    },
    technologies: {
      keyPositions: [
        {
          title: 'Directeur Technique',
          description: 'Leadership technique et innovation',
          requirements: ['Master informatique', '7+ ans expérience', 'Leadership'],
          responsibilities: ['Architecture technique', 'Équipe dev', 'Innovation'],
          salary: 800000,
          type: 'full-time',
          priority: 'high'
        },
        {
          title: 'Développeur Senior',
          description: 'Développement applications',
          requirements: ['Bachelor informatique', '5+ ans expérience dev'],
          responsibilities: ['Développement', 'Code review', 'Mentorat junior'],
          salary: 500000,
          type: 'full-time',
          priority: 'high'
        }
      ],
      departments: [
        { name: 'Développement', manager: 'Directeur Technique', employees: 6, responsibilities: ['Développement', 'Tests', 'Déploiement'] },
        { name: 'Support', manager: 'Chef Support', employees: 4, responsibilities: ['Support client', 'Maintenance', 'Documentation'] }
      ]
    },
    commerce_detail: {
      keyPositions: [
        {
          title: 'Directeur Commercial',
          description: 'Stratégie commerciale et ventes',
          requirements: ['Formation commerce', '5+ ans management commercial'],
          responsibilities: ['Stratégie vente', 'Équipe commerciale', 'Relations clients'],
          salary: 450000,
          type: 'full-time',
          priority: 'high'
        },
        {
          title: 'Responsable Magasin',
          description: 'Gestion opérationnelle magasin',
          requirements: ['Formation gestion', '3+ ans expérience retail'],
          responsibilities: ['Gestion équipe', 'Stocks', 'Service client'],
          salary: 250000,
          type: 'full-time',
          priority: 'medium'
        }
      ],
      departments: [
        { name: 'Vente', manager: 'Directeur Commercial', employees: 10, responsibilities: ['Vente', 'Conseil client', 'Encaissement'] },
        { name: 'Logistique', manager: 'Responsable Logistique', employees: 5, responsibilities: ['Réception', 'Stockage', 'Préparation'] }
      ]
    }
  }

  const defaultHRNeeds = {
    keyPositions: [
      {
        title: 'Directeur Général',
        description: 'Direction générale de l\'entreprise',
        requirements: ['Formation supérieure', '5+ ans management'],
        responsibilities: ['Stratégie', 'Management', 'Relations partenaires'],
        salary: 600000,
        type: 'full-time',
        priority: 'high'
      }
    ],
    departments: [
      { name: 'Direction', manager: 'Directeur Général', employees: 2, responsibilities: ['Stratégie', 'Coordination', 'Contrôle'] },
      { name: 'Opérations', manager: 'Responsable Opérations', employees: 5, responsibilities: ['Production', 'Livraison', 'Qualité'] }
    ]
  }

  return sectorHRNeeds[sector] || defaultHRNeeds
}