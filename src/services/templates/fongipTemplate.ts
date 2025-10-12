/**
 * Template FONGIP - Fonds de Garantie des Investissements Prioritaires
 * Format standard pour soumission au FONGIP
 */

import { ExportTemplate } from '@/types/export'
import { createCustomTemplate, BASE_STYLES } from './baseTemplate'

export const FONGIP_TEMPLATE: ExportTemplate = createCustomTemplate({
  id: 'fongip',
  name: 'Template FONGIP',
  description: 'Format officiel pour dossiers de financement FONGIP - Respect des normes gouvernementales sénégalaises',
  institution: 'FONGIP',

  styles: {
    ...BASE_STYLES,
    primaryColor: '#1e3a8a',      // Bleu FONGIP
    secondaryColor: '#10b981',     // Vert
    accentColor: '#fbbf24',        // Or
    textColor: '#1f2937',
    backgroundColor: '#ffffff',

    font: 'Arial, Helvetica, sans-serif',
    fontSizeTitle: 28,
    fontSizeHeading: 16,
    fontSizeBody: 11,

    pageMargins: {
      top: 30,
      right: 25,
      bottom: 30,
      left: 25
    },

    footerText: 'Document préparé pour FONGIP - Généré par BP Design Pro',
    showPageNumbers: true,
    showDate: true,

    borderRadius: 3,
    borderColor: '#d1d5db'
  },

  // Sections obligatoires selon cahier des charges FONGIP
  requiredSections: [
    'cover',
    'toc',
    'synopsis',
    'identification',
    'market',
    'financial'
  ],

  optionalSections: [
    'swot',
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
    'identification',
    'market',
    'financial',
    'appendix'
  ],

  allowImages: true,
  maxImagesPerSection: 3,
  logoPosition: 'cover',
  headerImage: '/templates/fongip-header.png'
})

/**
 * Règles de validation FONGIP
 */
export const FONGIP_VALIDATION_RULES = {
  minSections: 6,
  requiredFinancialData: [
    'investmentPlan',
    'financingSources',
    'projections3Years',
    'cashFlow',
    'breakEven'
  ],
  maxFileSize: 20 * 1024 * 1024, // 20 MB
  acceptedFormats: ['pdf'],
  minPageCount: 15,
  maxPageCount: 50
}

/**
 * Checklist FONGIP
 */
export const FONGIP_CHECKLIST = [
  {
    section: 'Identification',
    items: [
      'NINEA de l\'entreprise',
      'Registre de Commerce',
      'CV du promoteur',
      'Copie CNI du promoteur'
    ]
  },
  {
    section: 'Marché',
    items: [
      'Étude de marché documentée',
      'Analyse de la concurrence',
      'Stratégie de pénétration',
      'Prévisions de ventes réalistes'
    ]
  },
  {
    section: 'Financier',
    items: [
      'Plan de financement équilibré',
      'Projections sur 3 ans minimum',
      'Apport personnel ≥ 20%',
      'Ratios financiers (DSCR, TRI, VAN)',
      'Garanties proposées'
    ]
  },
  {
    section: 'Juridique',
    items: [
      'Statuts de l\'entreprise',
      'Procès-verbaux AG',
      'Attestation fiscale à jour',
      'Attestation IPRES/CSS'
    ]
  }
]

/**
 * Critères d'éligibilité FONGIP
 */
export const FONGIP_ELIGIBILITY = {
  sectors: [
    'Agriculture',
    'Élevage',
    'Pêche',
    'Industrie',
    'Artisanat',
    'Services',
    'Technologies',
    'Tourisme'
  ],
  minInvestment: 5_000_000,      // 5M FCFA
  maxInvestment: 500_000_000,    // 500M FCFA
  minEquity: 0.20,                // 20% d'apport
  maxLoanTerm: 84,                // 84 mois (7 ans)
  guaranteeCoverage: 0.80         // 80% de garantie
}
