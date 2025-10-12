/**
 * Template Banques Commerciales
 * Format standard pour dossiers de crédit bancaire
 */

import { ExportTemplate } from '@/types/export'
import { createCustomTemplate, BASE_STYLES } from './baseTemplate'

export const BANK_TEMPLATE: ExportTemplate = createCustomTemplate({
  id: 'bank',
  name: 'Template Banque Commerciale',
  description: 'Format professionnel pour dossiers de financement bancaire - Conforme normes BCEAO',
  institution: 'BANK',

  styles: {
    ...BASE_STYLES,
    primaryColor: '#065f46',      // Vert foncé bancaire
    secondaryColor: '#fbbf24',     // Or
    accentColor: '#1e40af',        // Bleu foncé
    textColor: '#1f2937',
    backgroundColor: '#ffffff',

    font: 'Georgia, Times New Roman, serif',
    fontSizeTitle: 32,
    fontSizeHeading: 18,
    fontSizeBody: 11,

    pageMargins: {
      top: 30,
      right: 25,
      bottom: 30,
      left: 25
    },

    footerText: 'Dossier de crédit professionnel - Généré par BP Design Pro',
    showPageNumbers: true,
    showDate: true,

    borderRadius: 2,
    borderColor: '#d1d5db'
  },

  // Sections obligatoires banques
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
    'identification',
    'market',
    'swot',
    'financial',
    'appendix'
  ],

  allowImages: true,
  maxImagesPerSection: 3,
  logoPosition: 'cover'
})

/**
 * Règles de validation Banques
 */
export const BANK_VALIDATION_RULES = {
  minSections: 7,
  requiredFinancialData: [
    'investmentPlan',
    'financingSources',
    'projections5Years',         // 5 ans minimum pour banques
    'cashFlow',
    'balanceSheet',
    'incomeStatement',
    'financialRatios',
    'sensibilityAnalysis',
    'breakEven',
    'debtService'
  ],
  requiredGuarantees: [
    'typeOfGuarantee',
    'estimatedValue',
    'legalDocuments'
  ],
  maxFileSize: 30 * 1024 * 1024, // 30 MB
  acceptedFormats: ['pdf'],
  minPageCount: 25,
  maxPageCount: 80
}

/**
 * Checklist Banques
 */
export const BANK_CHECKLIST = [
  {
    section: 'Identification Juridique',
    items: [
      'Statuts certifiés de la société',
      'Procès-verbaux des 3 dernières AG',
      'NINEA',
      'Registre de Commerce',
      'Patente',
      'Attestation fiscale à jour',
      'Attestation IPRES/CSS à jour',
      'CNI des dirigeants et actionnaires'
    ]
  },
  {
    section: 'Historique Entreprise',
    items: [
      'Bilans certifiés 3 derniers exercices',
      'Comptes de résultat 3 derniers exercices',
      'Liasse fiscale',
      'Relevés bancaires 12 derniers mois',
      'Historique crédits (si existant)',
      'Centrale des risques BCEAO'
    ]
  },
  {
    section: 'Projet & Marché',
    items: [
      'Étude de marché professionnelle',
      'Analyse SWOT détaillée',
      'Lettres d\'intention clients',
      'Contrats en cours / signés',
      'Business model canvas',
      'Stratégie de croissance'
    ]
  },
  {
    section: 'Plan Financier',
    items: [
      'Plan de financement équilibré',
      'Projections 5 ans (pessimiste/réaliste/optimiste)',
      'Plan de trésorerie mensuel (année 1)',
      'Calcul DSCR ≥ 1.3x',
      'TRI ≥ 15%',
      'VAN positive',
      'Payback ≤ durée crédit',
      'Ratios BCEAO respectés',
      'Analyse de sensibilité (-20% CA, +15% charges)'
    ]
  },
  {
    section: 'Garanties',
    items: [
      'Hypothèque (titre foncier, attestation propriété)',
      'Nantissement (stock, matériel, fonds de commerce)',
      'Caution solidaire dirigeants',
      'Assurance-crédit',
      'Domiciliation irrévocable des créances',
      'Attestation d\'évaluation garanties'
    ]
  },
  {
    section: 'Gestion & RH',
    items: [
      'CV détaillés équipe dirigeante',
      'Organigramme',
      'Plan de recrutement',
      'Système de gouvernance',
      'Procédures de contrôle interne'
    ]
  }
]

/**
 * Critères d'éligibilité Banques
 */
export const BANK_ELIGIBILITY = {
  companyAge: {
    min: 0,                       // Création acceptée
    preferred: 24                  // Préférence > 2 ans d'activité
  },
  sectors: 'all',                  // Tous secteurs (analyse au cas par cas)
  minInvestment: 5_000_000,       // 5M FCFA
  maxInvestment: 10_000_000_000,  // 10 milliards FCFA
  minEquity: 0.25,                 // 25% d'apport minimum
  preferredEquity: 0.30,           // 30% préféré
  maxLoanTerm: 120,                // 120 mois (10 ans max)
  maxDebtToEquity: 3.0,            // Dette/FP ≤ 3
  minDSCR: 1.3,                    // DSCR ≥ 1.3x (BCEAO)
  minCurrentRatio: 1.0,            // Ratio de liquidité ≥ 1
  maxDebtRatio: 0.70,              // Endettement ≤ 70%
  guaranteeCoverage: 1.20          // Garanties ≥ 120% du prêt
}

/**
 * Ratios BCEAO requis
 */
export const BCEAO_RATIOS = {
  // Liquidité
  currentRatio: {
    min: 1.0,
    target: 1.5,
    formula: 'Actif Circulant / Passif Circulant'
  },

  // Solvabilité
  debtToEquity: {
    max: 3.0,
    target: 2.0,
    formula: 'Total Dette / Fonds Propres'
  },

  // Capacité de remboursement
  dscr: {
    min: 1.3,
    target: 1.5,
    formula: 'CAF / Service de la Dette'
  },

  // Autonomie financière
  equityRatio: {
    min: 0.25,
    target: 0.35,
    formula: 'Fonds Propres / Total Actif'
  },

  // Rentabilité
  roe: {
    min: 0.10,
    target: 0.15,
    formula: 'Résultat Net / Fonds Propres'
  },

  roa: {
    min: 0.05,
    target: 0.10,
    formula: 'Résultat Net / Total Actif'
  }
}

/**
 * Types de crédits bancaires
 */
export const CREDIT_TYPES = {
  CMT: {
    name: 'Crédit Moyen Terme',
    duration: { min: 24, max: 84 },
    rate: { min: 8, max: 12 },
    purpose: 'Équipements, matériel, véhicules'
  },
  CLT: {
    name: 'Crédit Long Terme',
    duration: { min: 84, max: 180 },
    rate: { min: 9, max: 13 },
    purpose: 'Immobilier, gros investissements'
  },
  CCT: {
    name: 'Crédit Court Terme',
    duration: { min: 3, max: 24 },
    rate: { min: 7, max: 11 },
    purpose: 'BFR, trésorerie, stock'
  },
  OVERDRAFT: {
    name: 'Découvert autorisé',
    duration: { min: 12, max: 12 },
    rate: { min: 12, max: 18 },
    purpose: 'Trésorerie courante'
  },
  LEASING: {
    name: 'Crédit-bail',
    duration: { min: 24, max: 60 },
    rate: { min: 9, max: 14 },
    purpose: 'Équipements, véhicules, immobilier'
  }
}

/**
 * Garanties acceptées
 */
export const GUARANTEE_TYPES = {
  MORTGAGE: {
    name: 'Hypothèque',
    coverage: 1.5,               // Valeur ≥ 150% du prêt
    documents: ['Titre foncier', 'Attestation de propriété', 'Plan cadastral'],
    costs: 0.03                   // 3% de frais
  },
  PLEDGE: {
    name: 'Nantissement',
    coverage: 1.3,
    documents: ['Contrat de nantissement', 'Liste des biens', 'Évaluation'],
    costs: 0.01
  },
  SURETY: {
    name: 'Caution solidaire',
    coverage: 1.0,
    documents: ['Acte de caution', 'CNI caution', 'Justificatifs revenus'],
    costs: 0.005
  },
  REVENUE_ASSIGNMENT: {
    name: 'Domiciliation créances',
    coverage: 1.2,
    documents: ['Contrat domiciliation', 'Lettres clients', 'Factures'],
    costs: 0.01
  },
  INSURANCE: {
    name: 'Assurance-crédit',
    coverage: 1.0,
    documents: ['Police d\'assurance', 'Attestation', 'Quittances'],
    costs: 0.02
  }
}
