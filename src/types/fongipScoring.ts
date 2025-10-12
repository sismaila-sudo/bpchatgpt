// Types pour le système de scoring FONGIP

export interface ScoringCriterion {
  id: string
  nom: string
  description: string
  pointsMax: number
  pointsObtenus: number
  statut: 'complet' | 'partiel' | 'manquant'
  obligatoire: boolean
  sections?: string[] // Sections du BP concernées
}

export interface ScoringCategory {
  id: string
  nom: string
  description: string
  pointsMax: number
  pointsObtenus: number
  criteres: ScoringCriterion[]
  progression: number // 0-100%
}

export interface FONGIPScore {
  scoreTotal: number // 0-100
  pointsObtenus: number
  pointsMax: number
  categories: ScoringCategory[]
  niveau: 'Excellent' | 'Très Bon' | 'Bon' | 'Insuffisant' | 'Incomplet'
  eligibilite: 'Éligible' | 'Éligible sous conditions' | 'Non éligible'
  recommandations: string[]
  sectionsManquantes: string[]
  dateEvaluation: Date
}

// Critères de scoring FONGIP
export const FONGIP_CRITERIA = {
  // CATÉGORIE 1: Documents Administratifs (15 points)
  documentsAdministratifs: {
    id: 'docs_admin',
    nom: 'Documents Administratifs',
    pointsMax: 15,
    criteres: [
      {
        id: 'fiche_synoptique',
        nom: 'Fiche Synoptique',
        description: 'Document de synthèse FONGIP complété',
        pointsMax: 5,
        obligatoire: true,
        sections: ['fiche-synoptique']
      },
      {
        id: 'identification',
        nom: 'Identification Entreprise',
        description: 'Raison sociale, NINEA, RC, statuts',
        pointsMax: 5,
        obligatoire: true,
        sections: ['identification']
      },
      {
        id: 'dirigeants',
        nom: 'Informations Dirigeants',
        description: 'CV, casier judiciaire, pièces identité',
        pointsMax: 5,
        obligatoire: true,
        sections: ['hr']
      }
    ]
  },

  // CATÉGORIE 2: Analyse Financière (30 points)
  analyseFinanciere: {
    id: 'analyse_fin',
    nom: 'Analyse Financière',
    pointsMax: 30,
    criteres: [
      {
        id: 'historique_3ans',
        nom: 'Historique Financier 3 ans',
        description: 'Comptes de résultat, bilans, annexes',
        pointsMax: 10,
        obligatoire: true,
        sections: ['analyse-financiere']
      },
      {
        id: 'ratios_bancaires',
        nom: 'Ratios Bancaires',
        description: 'Autonomie ≥20%, Liquidité >1, DSCR >1.2',
        pointsMax: 10,
        obligatoire: true,
        sections: ['analyse-financiere']
      },
      {
        id: 'van_tri_drci',
        nom: 'Indicateurs de Rentabilité',
        description: 'VAN positive, TRI > coût capital, DRCI acceptable',
        pointsMax: 10,
        obligatoire: true,
        sections: ['rentabilite']
      }
    ]
  },

  // CATÉGORIE 3: Tableaux Financiers Prévisionnels (25 points)
  tableauxFinanciers: {
    id: 'tableaux_fin',
    nom: 'Tableaux Financiers Prévisionnels',
    pointsMax: 25,
    criteres: [
      {
        id: 'investissement_financement',
        nom: 'Tableau Investissement/Financement',
        description: 'Sources et emplois équilibrés',
        pointsMax: 5,
        obligatoire: true,
        sections: ['tableaux-financiers']
      },
      {
        id: 'plan_tresorerie',
        nom: 'Plan de Trésorerie',
        description: 'Mensuel année 1, trimestriel années 2-3',
        pointsMax: 5,
        obligatoire: true,
        sections: ['tableaux-financiers']
      },
      {
        id: 'compte_resultat_previsionnel',
        nom: 'Compte de Résultat Prévisionnel',
        description: 'Sur 3-5 ans avec détail des charges',
        pointsMax: 5,
        obligatoire: true,
        sections: ['tableaux-financiers', 'financial']
      },
      {
        id: 'plan_amortissement',
        nom: 'Plan d\'Amortissement des Emprunts',
        description: 'Échéancier détaillé avec capital/intérêts',
        pointsMax: 5,
        obligatoire: true,
        sections: ['tableaux-financiers']
      },
      {
        id: 'bilan_previsionnel',
        nom: 'Bilan Prévisionnel',
        description: 'Actif/Passif sur 3 ans minimum',
        pointsMax: 5,
        obligatoire: true,
        sections: ['tableaux-financiers', 'financial']
      }
    ]
  },

  // CATÉGORIE 4: Étude de Marché (10 points)
  etudeMarche: {
    id: 'etude_marche',
    nom: 'Étude de Marché',
    pointsMax: 10,
    criteres: [
      {
        id: 'analyse_marche',
        nom: 'Analyse du Marché',
        description: 'Taille, tendances, opportunités',
        pointsMax: 5,
        obligatoire: true,
        sections: ['market-study']
      },
      {
        id: 'concurrence',
        nom: 'Analyse Concurrentielle',
        description: 'Concurrents, positionnement, différenciation',
        pointsMax: 3,
        obligatoire: false,
        sections: ['market-study', 'swot']
      },
      {
        id: 'clientele_cible',
        nom: 'Clientèle Cible',
        description: 'Segments, personas, besoins',
        pointsMax: 2,
        obligatoire: false,
        sections: ['market-study']
      }
    ]
  },

  // CATÉGORIE 5: Relations Bancaires (10 points)
  relationsBancaires: {
    id: 'relations_banc',
    nom: 'Relations Bancaires',
    pointsMax: 10,
    criteres: [
      {
        id: 'historique_credit',
        nom: 'Historique de Crédit',
        description: 'Crédits antérieurs, comportement remboursement',
        pointsMax: 5,
        obligatoire: true,
        sections: ['relations-bancaires']
      },
      {
        id: 'encours_actuels',
        nom: 'Encours de Crédit Actuels',
        description: 'Crédits en cours, échéances, garanties',
        pointsMax: 3,
        obligatoire: true,
        sections: ['relations-bancaires']
      },
      {
        id: 'incidents_bancaires',
        nom: 'Incidents Bancaires',
        description: 'Absence d\'incidents sur 12 mois',
        pointsMax: 2,
        obligatoire: true,
        sections: ['relations-bancaires']
      }
    ]
  },

  // CATÉGORIE 6: Autres Éléments (10 points)
  autresElements: {
    id: 'autres',
    nom: 'Autres Éléments',
    pointsMax: 10,
    criteres: [
      {
        id: 'swot',
        nom: 'Analyse SWOT',
        description: 'Forces, faiblesses, opportunités, menaces',
        pointsMax: 2,
        obligatoire: false,
        sections: ['swot']
      },
      {
        id: 'marketing',
        nom: 'Plan Marketing',
        description: 'Stratégie marketing et commerciale',
        pointsMax: 3,
        obligatoire: false,
        sections: ['marketing']
      },
      {
        id: 'ressources_humaines',
        nom: 'Plan RH',
        description: 'Équipe, recrutement, formation',
        pointsMax: 2,
        obligatoire: false,
        sections: ['hr']
      },
      {
        id: 'synopsis',
        nom: 'Synopsis/Résumé Exécutif',
        description: 'Résumé du projet',
        pointsMax: 3,
        obligatoire: false,
        sections: ['synopsis']
      }
    ]
  }
}

// Fonctions d'évaluation
export function evaluateScore(score: number): 'Excellent' | 'Très Bon' | 'Bon' | 'Insuffisant' | 'Incomplet' {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Très Bon'
  if (score >= 60) return 'Bon'
  if (score >= 40) return 'Insuffisant'
  return 'Incomplet'
}

export function evaluateEligibility(score: number, criteresObligatoires: number): 'Éligible' | 'Éligible sous conditions' | 'Non éligible' {
  if (score >= 75 && criteresObligatoires >= 90) return 'Éligible'
  if (score >= 60 && criteresObligatoires >= 70) return 'Éligible sous conditions'
  return 'Non éligible'
}

export function generateRecommendations(score: FONGIPScore): string[] {
  const recommendations: string[] = []

  // Recommandations par catégorie
  score.categories.forEach(cat => {
    if (cat.progression < 50) {
      recommendations.push(`🔴 ${cat.nom}: Compléter d'urgence (${cat.progression.toFixed(0)}% complété)`)
    } else if (cat.progression < 80) {
      recommendations.push(`🟡 ${cat.nom}: À améliorer (${cat.progression.toFixed(0)}% complété)`)
    }
  })

  // Recommandations globales
  if (score.scoreTotal < 60) {
    recommendations.push('📋 Votre dossier nécessite un travail important avant soumission au FONGIP')
  } else if (score.scoreTotal < 75) {
    recommendations.push('📝 Votre dossier est en bonne voie, quelques éléments à compléter')
  } else if (score.scoreTotal < 90) {
    recommendations.push('✅ Votre dossier est presque complet, finalisez les derniers détails')
  } else {
    recommendations.push('🎉 Excellent! Votre dossier est complet et conforme aux exigences FONGIP')
  }

  return recommendations
}
