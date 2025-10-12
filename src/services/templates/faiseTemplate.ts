/**
 * Template FAISE - Fonds d'Appui à l'Investissement des Sénégalais de l'Extérieur
 * Format pour dossiers de financement diaspora
 */

import { ExportTemplate } from '@/types/export'
import { createCustomTemplate, BASE_STYLES } from './baseTemplate'

export const FAISE_TEMPLATE: ExportTemplate = createCustomTemplate({
  id: 'faise',
  name: 'Template FAISE',
  description: 'Format officiel pour dossiers FAISE - Sénégalais de la diaspora',
  institution: 'FAISE',

  styles: {
    ...BASE_STYLES,
    primaryColor: '#f97316',      // Orange FAISE
    secondaryColor: '#3b82f6',     // Bleu
    accentColor: '#10b981',        // Vert
    textColor: '#1f2937',
    backgroundColor: '#ffffff',

    font: 'Arial, Helvetica, sans-serif',
    fontSizeTitle: 30,
    fontSizeHeading: 17,
    fontSizeBody: 11,

    pageMargins: {
      top: 28,
      right: 22,
      bottom: 28,
      left: 22
    },

    footerText: 'Document préparé pour FAISE - Généré par BP Design Pro',
    showPageNumbers: true,
    showDate: true,

    borderRadius: 4,
    borderColor: '#d1d5db'
  },

  // Sections obligatoires FAISE
  requiredSections: [
    'cover',
    'toc',
    'synopsis',
    'identification',
    'market',
    'swot',
    'financial'
  ],

  optionalSections: [
    'marketing',
    'hr',
    'appendix'
  ],

  sectionOrder: [
    'cover',
    'toc',
    'synopsis',
    'identification',
    'market',
    'swot',
    'marketing',
    'hr',
    'financial',
    'appendix'
  ],

  pageBreaks: [
    'cover',
    'toc',
    'synopsis',
    'market',
    'swot',
    'financial',
    'appendix'
  ],

  allowImages: true,
  maxImagesPerSection: 4,
  logoPosition: 'cover',
  headerImage: '/templates/faise-header.png'
})

/**
 * Règles de validation FAISE
 */
export const FAISE_VALIDATION_RULES = {
  minSections: 7,
  requiredDiasporaInfo: [
    'proofOfResidence',          // Justificatif de résidence à l'étranger
    'passportCopy',              // Copie passeport
    'transferProof',             // Preuve de transferts réguliers
    'diasporaAssociation'        // Adhésion association diaspora (optionnel)
  ],
  requiredFinancialData: [
    'investmentPlan',
    'foreignCurrencyTransfer',   // Plan de transfert devises
    'localPartnership',          // Partenariat local
    'projections3Years',
    'exitStrategy'               // Stratégie de sortie/gestion à distance
  ],
  maxFileSize: 25 * 1024 * 1024, // 25 MB
  acceptedFormats: ['pdf'],
  minPageCount: 20,
  maxPageCount: 60
}

/**
 * Checklist FAISE
 */
export const FAISE_CHECKLIST = [
  {
    section: 'Statut Diaspora',
    items: [
      'Justificatif de résidence à l\'étranger (> 1 an)',
      'Copie passeport sénégalais',
      'Preuve d\'activité professionnelle à l\'étranger',
      'Historique de transferts vers le Sénégal'
    ]
  },
  {
    section: 'Identification Projet',
    items: [
      'Localisation précise au Sénégal',
      'Partenaire local identifié',
      'Structure juridique définie',
      'NINEA (si existant)'
    ]
  },
  {
    section: 'Marché & SWOT',
    items: [
      'Étude de marché locale',
      'Analyse SWOT complète',
      'Avantage compétitif diaspora',
      'Réseau international mobilisable'
    ]
  },
  {
    section: 'Financier',
    items: [
      'Plan de financement en devises + FCFA',
      'Apport personnel ≥ 30%',
      'Projections 3-5 ans',
      'Plan de gestion à distance',
      'Garanties (hypothèque, caution, nantissement)'
    ]
  },
  {
    section: 'Gestion',
    items: [
      'Équipe de gestion locale',
      'Système de reporting',
      'Fréquence de retours au Sénégal',
      'Procurations et délégations'
    ]
  }
]

/**
 * Critères d'éligibilité FAISE
 */
export const FAISE_ELIGIBILITY = {
  diasporaStatus: {
    minResidenceAbroad: 12,      // 12 mois minimum à l'étranger
    acceptedCountries: 'all',     // Tous pays
    proofRequired: true
  },
  sectors: [
    'Agriculture & Agro-industrie',
    'Pêche & Aquaculture',
    'Industrie manufacturière',
    'Artisanat d\'art',
    'Services innovants',
    'Technologies & Digital',
    'Tourisme & Hôtellerie',
    'Santé',
    'Éducation & Formation'
  ],
  minInvestment: 10_000_000,     // 10M FCFA
  maxInvestment: 1_000_000_000,  // 1 milliard FCFA
  minEquity: 0.30,                // 30% d'apport (plus élevé que FONGIP)
  maxLoanTerm: 96,                // 96 mois (8 ans)
  guaranteeCoverage: 0.70,        // 70% de garantie
  foreignCurrencyAllowed: true,   // Apports en devises acceptés
  localPartnerRequired: true      // Partenaire local obligatoire
}

/**
 * Bonus points FAISE (critères favorables)
 */
export const FAISE_BONUS_CRITERIA = {
  highValueSectors: [
    'Technologies',
    'Agro-industrie',
    'Santé',
    'Énergies renouvelables'
  ],
  diasporaNetwork: {
    associationMember: true,       // Membre association diaspora
    networkSize: 'large',          // Réseau important
    internationalPartners: true    // Partenaires internationaux
  },
  innovation: {
    technologyTransfer: true,      // Transfert de technologie
    bestPractices: true,           // Meilleures pratiques internationales
    training: true                 // Formation équipe locale
  },
  impact: {
    jobCreation: 10,               // > 10 emplois
    womenEmployment: 0.40,         // ≥ 40% femmes
    youthEmployment: 0.50,         // ≥ 50% jeunes
    regionalDevelopment: true      // Développement régional
  }
}
