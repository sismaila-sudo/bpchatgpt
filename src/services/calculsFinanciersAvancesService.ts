import {
  CashFlow,
  CalculVAN,
  CalculTRI,
  CalculDRCI,
  AnalyseRentabilite,
  calculateCumulativeCashFlows,
  evaluerVAN,
  evaluerTRI,
  evaluerDRCI
} from '@/types/calculsFinanciersAvances'

export class CalculsFinanciersAvancesService {
  /**
   * Calcule la Valeur Actuelle Nette (VAN)
   * VAN = Σ (Cash Flow_t / (1 + r)^t) - Investissement Initial
   */
  static calculateVAN(
    investissementInitial: number,
    cashFlows: CashFlow[],
    tauxActualisation: number // En pourcentage
  ): CalculVAN {
    const taux = tauxActualisation / 100 // Convertir en décimal

    // Calculer la somme des flux actualisés
    let vanFlux = 0
    for (const cf of cashFlows) {
      const fluxActualise = cf.cashFlowNet / Math.pow(1 + taux, cf.annee)
      vanFlux += fluxActualise
    }

    // VAN = Somme des flux actualisés - Investissement initial
    const van = vanFlux - investissementInitial

    const vanPositive = van >= 0
    const evaluation = evaluerVAN(van)

    let interpretation = ''
    if (van > 0) {
      interpretation = `Le projet crée de la valeur. La VAN positive de ${this.formatCurrency(van)} indique que le projet génère un surplus de richesse actualisée.`
    } else {
      interpretation = `Le projet détruit de la valeur. La VAN négative de ${this.formatCurrency(van)} indique que le projet ne couvre pas le coût du capital.`
    }

    interpretation += ` Évaluation: ${evaluation}.`

    return {
      tauxActualisation,
      investissementInitial,
      cashFlows,
      van,
      vanPositive,
      interpretation
    }
  }

  /**
   * Calcule le Taux de Rentabilité Interne (TRI)
   * TRI = taux r tel que VAN = 0
   * Utilise la méthode de Newton-Raphson
   */
  static calculateTRI(
    investissementInitial: number,
    cashFlows: CashFlow[],
    coutCapital: number = 10 // Coût du capital de référence en %
  ): CalculTRI {
    // Fonction VAN pour un taux donné
    const vanForRate = (rate: number): number => {
      let van = -investissementInitial
      for (const cf of cashFlows) {
        van += cf.cashFlowNet / Math.pow(1 + rate, cf.annee)
      }
      return van
    }

    // Dérivée de la VAN par rapport au taux
    const vanDerivative = (rate: number): number => {
      let derivative = 0
      for (const cf of cashFlows) {
        derivative -= (cf.annee * cf.cashFlowNet) / Math.pow(1 + rate, cf.annee + 1)
      }
      return derivative
    }

    // Méthode de Newton-Raphson
    let tri = 0.1 // Estimation initiale: 10%
    const maxIterations = 100
    const precision = 0.000001

    for (let i = 0; i < maxIterations; i++) {
      const van = vanForRate(tri)
      const derivative = vanDerivative(tri)

      if (Math.abs(derivative) < precision) break

      const triNext = tri - van / derivative

      if (Math.abs(triNext - tri) < precision) {
        tri = triNext
        break
      }

      tri = triNext

      // Sécurité: éviter les valeurs aberrantes
      if (tri < -0.99 || tri > 10) {
        tri = 0
        break
      }
    }

    const triPourcentage = tri * 100
    const triSuperieurCout = triPourcentage > coutCapital
    const evaluation = evaluerTRI(triPourcentage)

    let interpretation = ''
    if (triSuperieurCout) {
      interpretation = `Le TRI de ${triPourcentage.toFixed(2)}% est supérieur au coût du capital de ${coutCapital}%. Le projet est rentable.`
    } else {
      interpretation = `Le TRI de ${triPourcentage.toFixed(2)}% est inférieur au coût du capital de ${coutCapital}%. Le projet n'est pas suffisamment rentable.`
    }

    interpretation += ` Évaluation: ${evaluation}.`

    return {
      investissementInitial,
      cashFlows,
      tri: triPourcentage,
      triSuperieurCout,
      coutCapital,
      interpretation
    }
  }

  /**
   * Calcule le Délai de Récupération du Capital Investi (DRCI)
   * DRCI = temps nécessaire pour que les cash flows cumulés = investissement initial
   */
  static calculateDRCI(
    investissementInitial: number,
    cashFlows: CashFlow[]
  ): CalculDRCI {
    // Calculer les cash flows cumulés
    const cashFlowsWithCumul = calculateCumulativeCashFlows(cashFlows)

    let drciAnnees = 0
    let drciMois = 0
    let drciJours = 0
    let drciDecimal = 0

    // Trouver l'année où le cumul dépasse l'investissement
    let anneeRecuperation = -1
    for (let i = 0; i < cashFlowsWithCumul.length; i++) {
      if (cashFlowsWithCumul[i].cashFlowCumule >= investissementInitial) {
        anneeRecuperation = i
        break
      }
    }

    if (anneeRecuperation === -1) {
      // Le capital n'est jamais récupéré sur la période
      drciAnnees = cashFlowsWithCumul.length
      drciDecimal = cashFlowsWithCumul.length
    } else {
      // Calcul précis avec interpolation
      const cfPrecedent = anneeRecuperation > 0 ? cashFlowsWithCumul[anneeRecuperation - 1].cashFlowCumule : 0
      const cfCourant = cashFlowsWithCumul[anneeRecuperation].cashFlowCumule
      const cfAnnee = cashFlowsWithCumul[anneeRecuperation].cashFlowNet

      // Montant restant à récupérer au début de l'année
      const resteARecuperer = investissementInitial - cfPrecedent

      // Fraction de l'année nécessaire
      const fractionAnnee = cfAnnee > 0 ? resteARecuperer / cfAnnee : 0

      drciDecimal = anneeRecuperation + fractionAnnee

      // Convertir en années, mois, jours
      drciAnnees = Math.floor(drciDecimal)
      const resteEnMois = (drciDecimal - drciAnnees) * 12
      drciMois = Math.floor(resteEnMois)
      drciJours = Math.floor((resteEnMois - drciMois) * 30)
    }

    const evaluation = evaluerDRCI(drciDecimal)

    const interpretation = `Le capital investi de ${this.formatCurrency(investissementInitial)} sera récupéré en ${drciAnnees} an(s), ${drciMois} mois et ${drciJours} jours. Évaluation: ${evaluation}.`

    return {
      investissementInitial,
      cashFlows: cashFlowsWithCumul,
      drci: {
        annees: drciAnnees,
        mois: drciMois,
        jours: drciJours
      },
      drciDecimal,
      interpretation
    }
  }

  /**
   * Analyse de rentabilité complète (VAN + TRI + DRCI)
   */
  static analyseRentabiliteComplete(
    investissementInitial: number,
    cashFlows: CashFlow[],
    tauxActualisation: number = 10,
    coutCapital: number = 10
  ): AnalyseRentabilite {
    // Calculer VAN, TRI, DRCI
    const van = this.calculateVAN(investissementInitial, cashFlows, tauxActualisation)
    const tri = this.calculateTRI(investissementInitial, cashFlows, coutCapital)
    const drci = this.calculateDRCI(investissementInitial, cashFlows)

    // Calculer l'indice de rentabilité
    const indiceRentabilite = investissementInitial > 0
      ? (van.van + investissementInitial) / investissementInitial
      : 0

    // Calculer le taux de rendement comptable moyen
    const resultatNetMoyen = cashFlows.reduce((sum, cf) => sum + (cf.resultatNet || 0), 0) / cashFlows.length
    const tauxRendementComptable = investissementInitial > 0
      ? (resultatNetMoyen / investissementInitial) * 100
      : 0

    // Analyse de sensibilité (optionnel)
    const cashFlowsOptimistes = cashFlows.map(cf => ({
      ...cf,
      cashFlowNet: cf.cashFlowNet * 1.2 // +20%
    }))

    const cashFlowsPessimistes = cashFlows.map(cf => ({
      ...cf,
      cashFlowNet: cf.cashFlowNet * 0.8 // -20%
    }))

    const vanOptimiste = this.calculateVAN(investissementInitial, cashFlowsOptimistes, tauxActualisation).van
    const vanPessimiste = this.calculateVAN(investissementInitial, cashFlowsPessimistes, tauxActualisation).van
    const triOptimiste = this.calculateTRI(investissementInitial, cashFlowsOptimistes, coutCapital).tri
    const triPessimiste = this.calculateTRI(investissementInitial, cashFlowsPessimistes, coutCapital).tri

    // Recommandation finale
    let recommandation: 'Excellent' | 'Bon' | 'Acceptable' | 'À revoir' = 'À revoir'
    let justification = ''

    if (van.vanPositive && tri.triSuperieurCout && drci.drciDecimal <= 3) {
      recommandation = 'Excellent'
      justification = 'Le projet présente une VAN positive, un TRI supérieur au coût du capital et un délai de récupération court. Projet hautement rentable.'
    } else if (van.vanPositive && tri.triSuperieurCout) {
      recommandation = 'Bon'
      justification = 'Le projet est rentable avec une VAN positive et un TRI acceptable. Le délai de récupération est un peu long mais acceptable.'
    } else if (van.vanPositive || tri.tri > coutCapital * 0.8) {
      recommandation = 'Acceptable'
      justification = 'Le projet présente des indicateurs mitigés. Une analyse approfondie des risques est recommandée.'
    } else {
      recommandation = 'À revoir'
      justification = 'Le projet ne présente pas des indicateurs de rentabilité suffisants. Il est recommandé de revoir le business model ou les hypothèses.'
    }

    return {
      investissementInitial,
      tauxActualisation,
      coutCapital,
      dureeProjet: cashFlows.length,
      cashFlows,
      van,
      tri,
      drci,
      indiceRentabilite,
      tauxRendementComptable,
      sensibilite: {
        vanOptimiste,
        vanPessimiste,
        triOptimiste,
        triPessimiste
      },
      recommandation,
      justification,
      dateCalcul: new Date()
    }
  }

  /**
   * Génère les cash flows à partir des données financières prévisionnelles
   */
  static generateCashFlowsFromProjections(
    projections: Array<{
      annee: number
      resultatNet: number
      dotationsAmortissements: number
      variationBFR?: number
      investissements?: number
      remboursementsPrincipaux?: number
    }>
  ): CashFlow[] {
    const cashFlows = projections.map(p => ({
      annee: p.annee,
      cashFlowNet: p.resultatNet + p.dotationsAmortissements - (p.variationBFR || 0) - (p.investissements || 0) - (p.remboursementsPrincipaux || 0),
      cashFlowCumule: 0,
      resultatNet: p.resultatNet,
      dotationsAmortissements: p.dotationsAmortissements,
      variationBFR: p.variationBFR,
      investissements: p.investissements,
      remboursementsPrincipaux: p.remboursementsPrincipaux
    }))

    return calculateCumulativeCashFlows(cashFlows)
  }

  /**
   * Helper pour formater les montants en FCFA
   */
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
}
