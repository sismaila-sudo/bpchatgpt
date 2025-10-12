import { BusinessSector, SenegalCompanyType, CompanyStatus } from '@/types/project'

export const SENEGAL_REGIONS = [
  'Dakar',
  'Thiès',
  'Diourbel',
  'Fatick',
  'Kaolack',
  'Kaffrine',
  'Saint-Louis',
  'Louga',
  'Matam',
  'Tambacounda',
  'Kédougou',
  'Kolda',
  'Sédhiou',
  'Ziguinchor'
]

export const BUSINESS_SECTOR_LABELS: Record<BusinessSector, string> = {
  [BusinessSector.AGRICULTURE]: 'Agriculture & Maraîchage',
  [BusinessSector.ELEVAGE]: 'Élevage',
  [BusinessSector.PECHE]: 'Pêche & Aquaculture',
  [BusinessSector.TRANSFORMATION_AGRICOLE]: 'Transformation Agricole',

  [BusinessSector.COMMERCE_DETAIL]: 'Commerce de Détail',
  [BusinessSector.COMMERCE_GROS]: 'Commerce de Gros',
  [BusinessSector.IMPORT_EXPORT]: 'Import-Export',
  [BusinessSector.DISTRIBUTION]: 'Distribution',

  [BusinessSector.SERVICES_FINANCIERS]: 'Services Financiers',
  [BusinessSector.CONSEIL]: 'Conseil & Consulting',
  [BusinessSector.FORMATION]: 'Formation & Éducation',
  [BusinessSector.SANTE]: 'Santé',
  [BusinessSector.EDUCATION]: 'Éducation',
  [BusinessSector.TOURISME]: 'Tourisme & Hôtellerie',
  [BusinessSector.TRANSPORT]: 'Transport',
  [BusinessSector.LOGISTIQUE]: 'Logistique',

  [BusinessSector.INDUSTRIE_ALIMENTAIRE]: 'Industrie Alimentaire',
  [BusinessSector.TEXTILE]: 'Textile & Confection',
  [BusinessSector.CONSTRUCTION]: 'Construction & BTP',
  [BusinessSector.MATERIAUX]: 'Matériaux de Construction',
  [BusinessSector.ARTISANAT]: 'Artisanat',

  [BusinessSector.TECHNOLOGIES]: 'Technologies & Digital',
  [BusinessSector.TELECOMMUNICATION]: 'Télécommunication',
  [BusinessSector.FINTECH]: 'Fintech',
  [BusinessSector.E_COMMERCE]: 'E-commerce',

  [BusinessSector.ENERGIE_RENOUVELABLE]: 'Énergie Renouvelable',
  [BusinessSector.ENVIRONNEMENT]: 'Environnement',
  [BusinessSector.EAU_ASSAINISSEMENT]: 'Eau & Assainissement',

  [BusinessSector.AUTRES]: 'Autres Secteurs'
}

export const SENEGAL_COMPANY_TYPE_LABELS: Record<SenegalCompanyType, string> = {
  [SenegalCompanyType.SARL]: 'SARL - Société à Responsabilité Limitée',
  [SenegalCompanyType.SA]: 'SA - Société Anonyme',
  [SenegalCompanyType.SUARL]: 'SUARL - Société Unipersonnelle à Responsabilité Limitée',
  [SenegalCompanyType.SNC]: 'SNC - Société en Nom Collectif',
  [SenegalCompanyType.SCS]: 'SCS - Société en Commandite Simple',
  [SenegalCompanyType.GIE]: 'GIE - Groupement d\'Intérêt Économique',
  [SenegalCompanyType.ENTREPRISE_INDIVIDUELLE]: 'Entreprise Individuelle',
  [SenegalCompanyType.AUTO_ENTREPRENEUR]: 'Auto-entrepreneur',
  [SenegalCompanyType.ASSOCIATION]: 'Association',
  [SenegalCompanyType.COOPERATIVE]: 'Coopérative',
  [SenegalCompanyType.SOCIETE_CIVILE]: 'Société Civile'
}

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  [CompanyStatus.CREATION]: 'En cours de création',
  [CompanyStatus.ACTIVE]: 'En activité',
  [CompanyStatus.SUSPENDUE]: 'Activité suspendue',
  [CompanyStatus.DISSOLUTION]: 'En dissolution'
}

export const MANAGER_FUNCTIONS = [
  'Gérant',
  'Directeur Général',
  'Président Directeur Général',
  'Directeur',
  'Président',
  'Administrateur Délégué',
  'Représentant Légal'
]

export const FINANCING_INSTITUTIONS = [
  {
    name: 'FONGIP',
    type: 'guarantee',
    description: 'Fonds de Garantie des Investissements Prioritaires',
    website: 'https://fongip.sn'
  },
  {
    name: 'FONSIS',
    type: 'investment',
    description: 'Fonds Souverain d\'Investissements Stratégiques',
    website: 'https://fonsis.sn'
  },
  {
    name: 'ADEPME',
    type: 'support',
    description: 'Agence de Développement des PME',
    website: 'https://adepme.sn'
  },
  {
    name: 'FAISE',
    type: 'financing',
    description: 'Fonds d\'Appui à l\'Investissement des Sénégalais de l\'Extérieur',
    website: 'https://faise.sn'
  },
  {
    name: 'DER',
    type: 'entrepreneurship',
    description: 'Délégation générale à l\'Entrepreneuriat rapide',
    website: 'https://der.sn'
  }
]

export const BANKS_SENEGAL = [
  'Banque Atlantique',
  'BICIS',
  'BOA Sénégal',
  'CBAO',
  'Crédit du Sénégal',
  'Ecobank',
  'SGBS',
  'UBA Sénégal',
  'Banque Islamique du Sénégal',
  'Orabank'
]

export const PROJECT_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Professionnel',
    description: 'Template générique pour tous types de projets',
    sectors: Object.values(BusinessSector)
  },
  {
    id: 'faise',
    name: 'FAISE',
    description: 'Template spécifique pour dossiers FAISE',
    sectors: [BusinessSector.COMMERCE_DETAIL, BusinessSector.SERVICES_FINANCIERS, BusinessSector.TECHNOLOGIES]
  },
  {
    id: 'fongip',
    name: 'FONGIP',
    description: 'Template pour garanties FONGIP',
    sectors: Object.values(BusinessSector)
  },
  {
    id: 'adepme',
    name: 'ADEPME',
    description: 'Template ADEPME pour PME',
    sectors: [BusinessSector.ARTISANAT, BusinessSector.COMMERCE_DETAIL, BusinessSector.SERVICES_FINANCIERS]
  },
  {
    id: 'banking',
    name: 'Banques Locales',
    description: 'Template optimisé pour banques sénégalaises',
    sectors: Object.values(BusinessSector)
  }
]