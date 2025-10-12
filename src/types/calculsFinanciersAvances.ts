// Types pour les Calculs Financiers Avancés (VAN, TRI, DRCI)

export interface InvestissementInitial {
  montant: number
  description: string
  annee: number
}

export interface CashFlow {
  annee: number
  cashFlowNet: number // Flux de trésorerie net après impôts
  cashFlowCumule: number // Flux cumulé

  // Détail du cash flow
  resultatNet?: number
  dotationsAmortissements?: number
  variationBFR?: number
  investissements?: number
  remboursementsPrincipaux?: number
}

export interface CalculVAN {
  tauxActualisation: number // En pourcentage (ex: 10 pour 10%)
  investissementInitial: number
  cashFlows: CashFlow[]

  // Résultats
  van: number // Valeur Actuelle Nette
  vanPositive: boolean
  interpretation: string
}

export interface CalculTRI {
  investissementInitial: number
  cashFlows: CashFlow[]

  // Résultats
  tri: number // Taux de Rentabilité Interne en %
  triSuperieurCout: boolean
  coutCapital: number // Coût du capital de référence
  interpretation: string
}

export interface CalculDRCI {
  investissementInitial: number
  cashFlows: CashFlow[]

  // Résultats
  drci: {
    annees: number
    mois: number
    jours: number
  }
  drciDecimal: number // En années décimales
  interpretation: string
}

export interface AnalyseRentabilite {
  // Données d'entrée
  investissementInitial: number
  tauxActualisation: number
  coutCapital: number
  dureeProjet: number // En années
  cashFlows: CashFlow[]

  // Calculs
  van: CalculVAN
  tri: CalculTRI
  drci: CalculDRCI

  // Ratios complémentaires
  indiceRentabilite: number // VAN / Investissement initial
  tauxRendementComptable: number // Résultat net moyen / Investissement initial

  // Analyse de sensibilité
  sensibilite?: {
    vanOptimiste: number // +20% revenus
    vanPessimiste: number // -20% revenus
    triOptimiste: number
    triPessimiste: number
  }

  // Recommandation
  recommandation: 'Excellent' | 'Bon' | 'Acceptable' | 'À revoir'
  justification: string

  // Métadonnées
  dateCalcul?: Date
}

// Helper pour créer un cash flow
export function createCashFlow(
  annee: number,
  resultatNet: number,
  dotationsAmortissements: number,
  variationBFR: number = 0,
  investissements: number = 0,
  remboursementsPrincipaux: number = 0
): CashFlow {
  // Cash Flow = Résultat Net + Dotations - Variation BFR - Investissements - Remboursements
  const cashFlowNet = resultatNet + dotationsAmortissements - variationBFR - investissements - remboursementsPrincipaux

  return {
    annee,
    cashFlowNet,
    cashFlowCumule: 0, // Sera calculé après
    resultatNet,
    dotationsAmortissements,
    variationBFR,
    investissements,
    remboursementsPrincipaux
  }
}

// Helper pour calculer les cash flows cumulés
export function calculateCumulativeCashFlows(cashFlows: CashFlow[]): CashFlow[] {
  let cumul = 0
  return cashFlows.map(cf => {
    cumul += cf.cashFlowNet
    return { ...cf, cashFlowCumule: cumul }
  })
}

// Seuils de décision
export const SEUILS_DECISION = {
  van: {
    excellent: 500_000_000, // 500M FCFA
    bon: 100_000_000, // 100M FCFA
    acceptable: 0
  },
  tri: {
    excellent: 30, // 30%
    bon: 20, // 20%
    acceptable: 12 // 12% (coût capital moyen)
  },
  drci: {
    excellent: 2, // 2 ans
    bon: 3, // 3 ans
    acceptable: 4 // 4 ans
  }
}

export function evaluerVAN(van: number): 'Excellent' | 'Bon' | 'Acceptable' | 'Problématique' {
  if (van >= SEUILS_DECISION.van.excellent) return 'Excellent'
  if (van >= SEUILS_DECISION.van.bon) return 'Bon'
  if (van >= SEUILS_DECISION.van.acceptable) return 'Acceptable'
  return 'Problématique'
}

export function evaluerTRI(tri: number): 'Excellent' | 'Bon' | 'Acceptable' | 'Problématique' {
  if (tri >= SEUILS_DECISION.tri.excellent) return 'Excellent'
  if (tri >= SEUILS_DECISION.tri.bon) return 'Bon'
  if (tri >= SEUILS_DECISION.tri.acceptable) return 'Acceptable'
  return 'Problématique'
}

export function evaluerDRCI(drciAnnees: number): 'Excellent' | 'Bon' | 'Acceptable' | 'Problématique' {
  if (drciAnnees <= SEUILS_DECISION.drci.excellent) return 'Excellent'
  if (drciAnnees <= SEUILS_DECISION.drci.bon) return 'Bon'
  if (drciAnnees <= SEUILS_DECISION.drci.acceptable) return 'Acceptable'
  return 'Problématique'
}
