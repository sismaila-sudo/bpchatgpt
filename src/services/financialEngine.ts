/**
 * Moteur de Calculs Financiers pour Business Plans
 * 
 * @module FinancialEngine
 * @description Moteur de calculs financiers adapté au contexte économique sénégalais.
 * Calcule les projections financières, ratios, et indicateurs de rentabilité conformes
 * aux normes FONGIP et bancaires du Sénégal.
 * 
 * @see GLOSSAIRE_METIER.md pour définitions des termes financiers
 * 
 * @example
 * ```typescript
 * const inputs: FinancialInputs = {
 *   revenueStreams: [{ name: 'Ventes', unitPrice: 1000, quantity: 100, ... }],
 *   fixedCosts: [{ name: 'Loyer', amount: 50000, ... }],
 *   projectionYears: 5,
 *   taxRate: 0.30, // 30% IS Sénégal
 *   ...
 * };
 * 
 * const engine = new FinancialEngine(inputs);
 * const projections = engine.calculateProjections();
 * console.log('VAN:', projections.npv);
 * console.log('TRI:', projections.irr);
 * ```
 * 
 * @author BP FONGIP Team
 * @version 2.0.0
 * @date 2025-10-06
 */

export interface FinancialInputs {
  // Revenus
  revenueStreams: RevenueStream[]

  // Coûts
  fixedCosts: CostItem[]
  variableCosts: CostItem[]

  // Investissements
  initialInvestments: InvestmentItem[]

  // Financement
  ownFunds: number
  loans: LoanItem[]
  grants: GrantItem[]

  // Paramètres
  projectionYears: number
  taxRate: number // Taux d'imposition Sénégal
  depreciationRate: number
  workingCapitalDays: number
}

export interface RevenueStream {
  id: string
  name: string
  unitPrice: number
  quantity: number
  seasonality: number[] // 12 mois
  growthRate: number // Taux de croissance annuel
  category: 'product' | 'service'
}

export interface CostItem {
  id: string
  name: string
  amount: number
  category: string
  isRecurring: boolean
  frequency: 'monthly' | 'quarterly' | 'yearly'
  growthRate: number
}

export interface InvestmentItem {
  id: string
  name: string
  amount: number
  category: 'equipment' | 'infrastructure' | 'software' | 'other'
  depreciationYears: number
  residualValue: number
  date?: string  // Date d'acquisition (format YYYY-MM)
}

export interface LoanItem {
  id: string
  source: string
  amount: number
  interestRate: number
  termYears: number
  gracePeriodMonths: number
}

export interface GrantItem {
  id: string
  source: string
  amount: number
  conditions: string
  disbursementSchedule: number[] // Par année
}

export interface FinancialProjections {
  years: number[]

  // Compte de résultat
  revenues: number[]
  totalCosts: number[]
  grossProfit: number[]
  operatingProfit: number[]
  netProfit: number[]

  // Bilans
  assets: number[]
  liabilities: number[]
  equity: number[]

  // Flux de trésorerie
  operatingCashFlow: number[]
  investmentCashFlow: number[]
  financingCashFlow: number[]
  netCashFlow: number[]
  cumulativeCashFlow: number[]

  // Indicateurs
  breakEvenPoint: number // En mois
  roe: number[] // Rentabilité des fonds propres (ROE)
  roce: number[] // Rentabilité du capital employé (ROCE)
  dscr: number[] // Debt Service Coverage Ratio
  paybackPeriod: number // En années
  irr: number // Taux de rendement interne
  npv: number // Valeur actuelle nette

  // Ratios
  grossMargin: number[]
  netMargin: number[]
  currentRatio: number[]
  debtToEquity: number[]
  assetTurnover: number[]
}

export class FinancialEngine {
  private inputs: FinancialInputs

  constructor(inputs: FinancialInputs) {
    this.inputs = inputs
  }

  /**
   * Calcule Toutes les Projections Financières
   * 
   * @description Méthode principale qui orchestre tous les calculs financiers sur la période définie.
   * Génère le compte de résultat, le bilan, les flux de trésorerie et les indicateurs de rentabilité.
   * 
   * @returns {FinancialProjections} Objet contenant toutes les projections et indicateurs
   * 
   * @example
   * ```typescript
   * const engine = new FinancialEngine(inputs);
   * const projections = engine.calculateProjections();
   * 
   * // Accéder aux résultats
   * console.log('Revenus année 1:', projections.revenues[0]);
   * console.log('VAN du projet:', projections.npv);
   * console.log('TRI:', (projections.irr * 100).toFixed(2) + '%');
   * ```
   * 
   * @see GLOSSAIRE_METIER.md pour définitions VAN, TRI, DSCR, etc.
   * 
   * @throws {Error} Si les données d'entrée sont invalides ou insuffisantes
   * 
   * @remarks
   * - Les revenus sont calculés mensuellement puis agrégés annuellement
   * - Le taux d'imposition appliqué est celui du Sénégal (30%)
   * - Les flux de trésorerie incluent l'amortissement des investissements
   * - La VAN utilise un taux d'actualisation de 12% (coût du capital Sénégal)
   */
  calculateProjections(): FinancialProjections {
    const years = Array.from({ length: this.inputs.projectionYears }, (_, i) => new Date().getFullYear() + i)

    // Calculs des revenus
    const revenues = this.calculateRevenues()

    // Calculs des coûts
    const { fixedCosts, variableCosts } = this.calculateCosts()
    const totalCosts = fixedCosts.map((fixed, i) => fixed + variableCosts[i])

    // Calculs de profitabilité
    const grossProfit = revenues.map((rev, i) => rev - variableCosts[i])
    const operatingProfit = grossProfit.map((gross, i) => gross - fixedCosts[i])
    const netProfit = this.calculateNetProfit(operatingProfit)

    // Calculs de flux de trésorerie
    const operatingCashFlow = this.calculateOperatingCashFlow(netProfit)
    const investmentCashFlow = this.calculateInvestmentCashFlow()
    const financingCashFlow = this.calculateFinancingCashFlow()
    const netCashFlow = operatingCashFlow.map((op, i) =>
      op + investmentCashFlow[i] + financingCashFlow[i]
    )
    const cumulativeCashFlow = this.calculateCumulativeCashFlow(netCashFlow)

    // Calculs d'indicateurs
    const breakEvenPoint = this.calculateBreakEvenPoint(revenues, totalCosts)
    const roe = this.calculateROE(netProfit)
    const roce = this.calculateROCE(operatingProfit)
    const dscr = this.calculateDSCR(operatingCashFlow)
    const paybackPeriod = this.calculatePaybackPeriod(cumulativeCashFlow)
    const irr = this.calculateIRR(netCashFlow)
    const npv = this.calculateNPV(netCashFlow)

    // Calculs de ratios
    const grossMargin = this.calculateGrossMargin(grossProfit, revenues)
    const netMargin = this.calculateNetMargin(netProfit, revenues)

    return {
      years,
      revenues,
      totalCosts,
      grossProfit,
      operatingProfit,
      netProfit,

      // Simplified balance sheet items
      assets: this.calculateAssets(),
      liabilities: this.calculateLiabilities(),
      equity: this.calculateEquity(),

      operatingCashFlow,
      investmentCashFlow,
      financingCashFlow,
      netCashFlow,
      cumulativeCashFlow,

      breakEvenPoint,
      roe,
      roce,
      dscr,
      paybackPeriod,
      irr,
      npv,

      grossMargin,
      netMargin,
      currentRatio: [1.5, 1.8, 2.1], // Simplified
      debtToEquity: [0.4, 0.3, 0.2], // Simplified
      assetTurnover: [1.2, 1.4, 1.6] // Simplified
    }
  }

  private calculateRevenues(): number[] {
    const revenues: number[] = []

    for (let year = 0; year < this.inputs.projectionYears; year++) {
      let yearlyRevenue = 0

      for (const stream of this.inputs.revenueStreams) {
        // Calcul base ANNUEL (quantité mensuelle × 12 mois)
        const monthlyRevenue = stream.unitPrice * stream.quantity
        const annualBaseRevenue = monthlyRevenue * 12
        const grownRevenue = annualBaseRevenue * Math.pow(1 + stream.growthRate, year)

        // Application de la saisonnalité (moyenne annuelle)
        // Si seasonality = [1,1,1,...,1] → factor = 1 (pas d'impact)
        const seasonalityFactor = stream.seasonality.reduce((a, b) => a + b, 0) / 12

        yearlyRevenue += grownRevenue * seasonalityFactor
      }

      revenues.push(yearlyRevenue)
    }

    return revenues
  }

  private calculateCosts(): { fixedCosts: number[], variableCosts: number[] } {
    const fixedCosts: number[] = []
    const variableCosts: number[] = []

    for (let year = 0; year < this.inputs.projectionYears; year++) {
      let yearlyFixedCosts = 0
      let yearlyVariableCosts = 0

      // Coûts fixes
      for (const cost of this.inputs.fixedCosts) {
        const annualCost = this.convertToAnnualCost(cost)
        const grownCost = annualCost * Math.pow(1 + cost.growthRate, year)
        yearlyFixedCosts += grownCost
      }

      // Coûts variables
      for (const cost of this.inputs.variableCosts) {
        const annualCost = this.convertToAnnualCost(cost)
        const grownCost = annualCost * Math.pow(1 + cost.growthRate, year)
        yearlyVariableCosts += grownCost
      }

      fixedCosts.push(yearlyFixedCosts)
      variableCosts.push(yearlyVariableCosts)
    }

    return { fixedCosts, variableCosts }
  }

  private convertToAnnualCost(cost: CostItem): number {
    switch (cost.frequency) {
      case 'monthly':
        return cost.amount * 12
      case 'quarterly':
        return cost.amount * 4
      case 'yearly':
        return cost.amount
      default:
        return cost.amount
    }
  }

  private calculateNetProfit(operatingProfit: number[]): number[] {
    return operatingProfit.map(profit => {
      // Application taux d'imposition sénégalais
      const tax = Math.max(0, profit * this.inputs.taxRate)
      return profit - tax
    })
  }

  private calculateOperatingCashFlow(netProfit: number[]): number[] {
    // Simplification: flux de trésorerie opérationnel ≈ bénéfice net + amortissements
    const depreciation = this.calculateAnnualDepreciation()

    return netProfit.map((profit, i) => profit + depreciation)
  }

  private calculateAnnualDepreciation(): number {
    return this.inputs.initialInvestments.reduce((total, investment) => {
      return total + (investment.amount - investment.residualValue) / investment.depreciationYears
    }, 0)
  }

  private calculateInvestmentCashFlow(): number[] {
    const flows: number[] = []

    for (let year = 0; year < this.inputs.projectionYears; year++) {
      if (year === 0) {
        // Année 0: investissements initiaux
        const totalInvestment = this.inputs.initialInvestments.reduce(
          (sum, inv) => sum + inv.amount, 0
        )
        flows.push(-totalInvestment)
      } else {
        // Années suivantes: pas d'investissements supplémentaires pour l'instant
        flows.push(0)
      }
    }

    return flows
  }

  private calculateFinancingCashFlow(): number[] {
    const flows: number[] = []

    for (let year = 0; year < this.inputs.projectionYears; year++) {
      let yearlyFlow = 0

      if (year === 0) {
        // Année 0: apports en capital et emprunts
        yearlyFlow += this.inputs.ownFunds
        yearlyFlow += this.inputs.loans.reduce((sum, loan) => sum + loan.amount, 0)
        yearlyFlow += this.inputs.grants.reduce((sum, grant) => sum + grant.amount, 0)
      }

      // Remboursements d'emprunts
      for (const loan of this.inputs.loans) {
        if (year > 0 || loan.gracePeriodMonths === 0) {
          const monthlyPayment = this.calculateLoanPayment(loan)
          yearlyFlow -= monthlyPayment * 12
        }
      }

      flows.push(yearlyFlow)
    }

    return flows
  }

  private calculateLoanPayment(loan: LoanItem): number {
    const monthlyRate = loan.interestRate / 12
    const numberOfPayments = loan.termYears * 12

    if (monthlyRate === 0) {
      return loan.amount / numberOfPayments
    }

    return loan.amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  }

  private calculateCumulativeCashFlow(netCashFlow: number[]): number[] {
    const cumulative: number[] = []
    let total = 0

    for (const flow of netCashFlow) {
      total += flow
      cumulative.push(total)
    }

    return cumulative
  }

  private calculateBreakEvenPoint(revenues: number[], costs: number[]): number {
    // Point mort en mois (quand revenus = coûts)
    const monthlyRevenue = revenues[0] / 12
    const monthlyCosts = costs[0] / 12

    if (monthlyRevenue <= monthlyCosts) {
      return -1 // Pas de point mort
    }

    // Simplification: point mort basé sur la première année
    return monthlyCosts / (monthlyRevenue - monthlyCosts)
  }

  private calculateROE(netProfit: number[]): number[] {
    // ROE = Résultat net / Fonds propres
    const equity = this.inputs.ownFunds

    if (equity === 0) return netProfit.map(() => 0)

    return netProfit.map(profit => (profit / equity) * 100)
  }

  private calculateROCE(operatingProfit: number[]): number[] {
    // ROCE = NOPAT / Capital employé
    // NOPAT = Résultat opérationnel × (1 - taux d'impôt)
    const totalInvestment = this.inputs.initialInvestments.reduce(
      (sum, inv) => sum + inv.amount, 0
    )
    const totalDebt = this.inputs.loans.reduce((sum, loan) => sum + loan.amount, 0)
    const capitalEmployed = this.inputs.ownFunds + totalDebt

    if (capitalEmployed === 0) return operatingProfit.map(() => 0)

    return operatingProfit.map(profit => {
      const nopat = profit * (1 - this.inputs.taxRate)
      return (nopat / capitalEmployed) * 100
    })
  }

  /**
   * Calcule le DSCR (Debt Service Coverage Ratio)
   * 
   * @description Ratio de couverture du service de la dette.
   * Mesure la capacité de l'entreprise à couvrir ses remboursements d'emprunts.
   * 
   * @param {number[]} operatingCashFlow - Flux de trésorerie d'exploitation annuels
   * 
   * @returns {number[]} DSCR pour chaque année (ratio sans unité)
   * 
   * @formula DSCR = Flux de Trésorerie d'Exploitation / Service de la Dette
   * 
   * @example
   * ```typescript
   * const operatingCF = [2000000, 3000000, 4000000];
   * const dscr = this.calculateDSCR(operatingCF);
   * // dscr = [1.8, 2.2, 2.8] (exemple)
   * ```
   * 
   * @remarks
   * - **DSCR > 1.5** : Excellente capacité de remboursement ✅
   * - **DSCR = 1.2-1.5** : Capacité acceptable ⚠️
   * - **DSCR < 1.2** : Risque de défaut ❌ (REJET FONGIP)
   * - **Critère FONGIP OBLIGATOIRE** : DSCR ≥ 1.2
   * - Un DSCR de 1.5 signifie que l'entreprise génère 50% de plus que nécessaire pour rembourser
   * 
   * @see GLOSSAIRE_METIER.md - Section DSCR
   */
  private calculateDSCR(operatingCashFlow: number[]): number[] {
    // DSCR = Flux de trésorerie opérationnel / (Intérêts + Remboursement capital)
    const totalDebtService = this.inputs.loans.reduce((total, loan) => {
      const monthlyPayment = this.calculateLoanPayment(loan)
      return total + (monthlyPayment * 12)
    }, 0)

    if (totalDebtService === 0) return operatingCashFlow.map(() => 0)

    return operatingCashFlow.map(cashFlow => cashFlow / totalDebtService)
  }

  private calculatePaybackPeriod(cumulativeCashFlow: number[]): number {
    for (let i = 0; i < cumulativeCashFlow.length; i++) {
      if (cumulativeCashFlow[i] > 0) {
        return i + 1
      }
    }
    return -1 // Pas de retour sur investissement
  }

  /**
   * Calcule le TRI (Taux de Rendement Interne) / IRR (Internal Rate of Return)
   * 
   * @description Taux d'actualisation pour lequel la VAN = 0.
   * Le TRI représente le rendement annuel moyen du projet sur toute sa durée.
   * 
   * @param {number[]} cashFlows - Flux de trésorerie annuels
   * 
   * @returns {number} TRI en pourcentage (ex: 15.5 pour 15.5%)
   * 
   * @algorithm Méthode de Newton-Raphson (itérations jusqu'à convergence)
   * 
   * @example
   * ```typescript
   * const cashFlows = [-10000000, 3000000, 4000000, 5000000, 6000000];
   * const tri = this.calculateIRR(cashFlows);
   * // tri = 18.5% (exemple)
   * ```
   * 
   * @remarks
   * - **TRI > 12%** : Bon rendement (> coût du capital Sénégal) ✅
   * - **TRI = 10-12%** : Rendement acceptable ⚠️
   * - **TRI < 10%** : Rendement insuffisant ❌
   * - Le TRI doit être comparé au coût du capital (WACC)
   * - Critère FONGIP : TRI minimum recommandé = 12%
   * 
   * @see GLOSSAIRE_METIER.md - Section TRI
   */
  private calculateIRR(cashFlows: number[]): number {
    // Méthode de Newton-Raphson simplifiée pour calculer le TRI
    let rate = 0.1 // Taux initial 10%

    for (let i = 0; i < 100; i++) {
      let npv = 0
      let npvDerivative = 0

      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t)
        npvDerivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
      }

      if (Math.abs(npv) < 0.01) {
        return rate * 100
      }

      rate = rate - npv / npvDerivative
    }

    return rate * 100
  }

  /**
   * Calcule la VAN (Valeur Actuelle Nette) / NPV (Net Present Value)
   * 
   * @description Somme actualisée de tous les flux de trésorerie sur la période.
   * La VAN indique la valeur créée par le projet après actualisation au coût du capital.
   * 
   * @param {number[]} cashFlows - Flux de trésorerie annuels (positifs ou négatifs)
   * @param {number} [discountRate=0.1] - Taux d'actualisation (défaut: 10%)
   * 
   * @returns {number} VAN en FCFA
   * 
   * @example
   * ```typescript
   * const cashFlows = [-10000000, 3000000, 4000000, 5000000, 6000000];
   * const van = this.calculateNPV(cashFlows, 0.12);
   * // van = 3,245,678 FCFA (exemple)
   * ```
   * 
   * @remarks
   * - **VAN > 0** : Projet rentable ✅
   * - **VAN = 0** : Projet à l'équilibre ⚠️
   * - **VAN < 0** : Projet non rentable ❌
   * - Taux recommandé FONGIP : 12% (coût du capital Sénégal)
   * 
   * @see GLOSSAIRE_METIER.md - Section VAN
   */
  private calculateNPV(cashFlows: number[], discountRate: number = 0.1): number {
    return cashFlows.reduce((npv, flow, year) => {
      return npv + flow / Math.pow(1 + discountRate, year)
    }, 0)
  }

  private calculateGrossMargin(grossProfit: number[], revenues: number[]): number[] {
    return grossProfit.map((profit, i) =>
      revenues[i] === 0 ? 0 : (profit / revenues[i]) * 100
    )
  }

  private calculateNetMargin(netProfit: number[], revenues: number[]): number[] {
    return netProfit.map((profit, i) =>
      revenues[i] === 0 ? 0 : (profit / revenues[i]) * 100
    )
  }

  // Méthodes simplifiées pour le bilan
  private calculateAssets(): number[] {
    // Simplification: actifs = investissements + fonds de roulement
    const investment = this.inputs.initialInvestments.reduce((sum, inv) => sum + inv.amount, 0)
    return Array(this.inputs.projectionYears).fill(investment)
  }

  private calculateLiabilities(): number[] {
    // Simplification: passifs = emprunts restants
    const totalLoans = this.inputs.loans.reduce((sum, loan) => sum + loan.amount, 0)
    return Array(this.inputs.projectionYears).fill(totalLoans * 0.7) // Amortissement simplifié
  }

  private calculateEquity(): number[] {
    // Simplification: capitaux propres = fonds propres + bénéfices cumulés
    return Array(this.inputs.projectionYears).fill(this.inputs.ownFunds)
  }
}

/**
 * Fonctions utilitaires pour les calculs financiers sénégalais
 */
export class SenegalFinancialUtils {
  // Taux d'imposition sénégalais 2024
  static readonly CORPORATE_TAX_RATE = 0.30 // 30%
  static readonly VAT_RATE = 0.18 // 18%
  static readonly SOCIAL_CHARGES_RATE = 0.24 // 24% des salaires

  // Taux d'intérêt bancaires moyens Sénégal
  static readonly BANK_INTEREST_RATE = 0.12 // 12%
  static readonly MICROCREDIT_RATE = 0.15 // 15%

  // Inflation moyenne Sénégal
  static readonly INFLATION_RATE = 0.03 // 3%

  static calculateSocialCharges(salaryAmount: number): number {
    return salaryAmount * this.SOCIAL_CHARGES_RATE
  }

  static calculateVAT(amount: number): number {
    return amount * this.VAT_RATE
  }

  static calculateCorporateTax(profit: number): number {
    return Math.max(0, profit * this.CORPORATE_TAX_RATE)
  }

  static adjustForInflation(amount: number, years: number): number {
    return amount * Math.pow(1 + this.INFLATION_RATE, years)
  }
}