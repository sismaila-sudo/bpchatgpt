/**
 * Moteur de calcul financier simplifié pour MVP
 * Version allégée avec calculs essentiels
 */

interface Project {
  id: string
  start_date: string
  horizon_years: number
}

interface Product {
  id: string
  name: string
  price: number
  cogs_unit: number
}

interface SalesProjection {
  product_service_id: string
  year: number
  month: number
  volume: number
  price: number
}

interface CapexItem {
  amount: number
  date: string
  life_months: number
}

interface OpexItem {
  amount: number
  is_variable: boolean
}

interface FinancialOutput {
  project_id: string
  year: number
  month: number
  revenue: number
  cogs: number
  gross_profit: number
  opex_total: number
  ebitda: number
  depreciation: number
  ebit: number
  net_income: number
  operating_cash_flow: number
  investing_cash_flow: number
  net_cash_flow: number
  cash_balance: number
  gross_margin: number
  ebitda_margin: number
  net_margin: number
}

export class MVPCalculator {
  private project: Project
  private products: Product[]
  private salesProjections: SalesProjection[]
  private capex: CapexItem[]
  private opex: OpexItem[]

  constructor(
    project: Project,
    products: Product[],
    salesProjections: SalesProjection[],
    capex: CapexItem[] = [],
    opex: OpexItem[] = []
  ) {
    this.project = project
    this.products = products
    this.salesProjections = salesProjections
    this.capex = capex
    this.opex = opex
  }

  /**
   * Calcule les projections financières mois par mois
   */
  calculateMonthlyProjections(): FinancialOutput[] {
    const results: FinancialOutput[] = []
    const startDate = new Date(this.project.start_date)
    const horizonMonths = this.project.horizon_years * 12

    let cumulativeCashBalance = 0

    for (let monthIndex = 0; monthIndex < horizonMonths; monthIndex++) {
      const currentDate = new Date(startDate)
      currentDate.setMonth(startDate.getMonth() + monthIndex)

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      // 1. Calculer le chiffre d'affaires mensuel
      const monthlyRevenue = this.calculateMonthlyRevenue(year, month)

      // 2. Calculer le coût des ventes (COGS)
      const monthlyCogs = this.calculateMonthlyCogs(year, month)

      // 3. Calculer les charges opérationnelles (OPEX)
      const monthlyOpex = this.calculateMonthlyOpex(monthlyRevenue)

      // 4. Calculer l'amortissement
      const monthlyDepreciation = this.calculateMonthlyDepreciation(year, month)

      // 5. Calculer les flux d'investissement
      const monthlyInvestment = this.calculateMonthlyInvestment(year, month)

      // Calculs du compte de résultat
      const grossProfit = monthlyRevenue - monthlyCogs
      const ebitda = grossProfit - monthlyOpex
      const ebit = ebitda - monthlyDepreciation
      const netIncome = ebit // Simplifié sans intérêts et taxes pour MVP

      // Calculs de trésorerie
      const operatingCashFlow = netIncome + monthlyDepreciation
      const investingCashFlow = -monthlyInvestment
      const netCashFlow = operatingCashFlow + investingCashFlow

      cumulativeCashBalance += netCashFlow

      // Calculs des marges
      const grossMargin = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0
      const ebitdaMargin = monthlyRevenue > 0 ? (ebitda / monthlyRevenue) * 100 : 0
      const netMargin = monthlyRevenue > 0 ? (netIncome / monthlyRevenue) * 100 : 0

      const financialOutput: FinancialOutput = {
        project_id: this.project.id,
        year,
        month,
        revenue: monthlyRevenue,
        cogs: monthlyCogs,
        gross_profit: grossProfit,
        opex_total: monthlyOpex,
        ebitda,
        depreciation: monthlyDepreciation,
        ebit,
        net_income: netIncome,
        operating_cash_flow: operatingCashFlow,
        investing_cash_flow: investingCashFlow,
        net_cash_flow: netCashFlow,
        cash_balance: cumulativeCashBalance,
        gross_margin: grossMargin,
        ebitda_margin: ebitdaMargin,
        net_margin: netMargin
      }

      results.push(financialOutput)
    }

    return results
  }

  /**
   * Calcule le chiffre d'affaires mensuel
   */
  private calculateMonthlyRevenue(year: number, month: number): number {
    let totalRevenue = 0

    // Parcourir toutes les projections de vente pour ce mois
    for (const projection of this.salesProjections) {
      if (projection.year === year && projection.month === month) {
        totalRevenue += projection.volume * projection.price
      }
    }

    return totalRevenue
  }

  /**
   * Calcule le coût des ventes mensuel
   */
  private calculateMonthlyCogs(year: number, month: number): number {
    let totalCogs = 0

    // Parcourir toutes les projections de vente pour ce mois
    for (const projection of this.salesProjections) {
      if (projection.year === year && projection.month === month) {
        // Trouver le produit correspondant
        const product = this.products.find(p => p.id === projection.product_service_id)
        if (product) {
          totalCogs += projection.volume * product.cogs_unit
        }
      }
    }

    return totalCogs
  }

  /**
   * Calcule les charges opérationnelles mensuelles
   */
  private calculateMonthlyOpex(monthlyRevenue: number): number {
    let totalOpex = 0

    for (const expense of this.opex) {
      if (expense.is_variable) {
        // Charge variable (pourcentage du CA) - pour MVP on assume 1% si variable
        totalOpex += monthlyRevenue * 0.01
      } else {
        // Charge fixe mensuelle
        totalOpex += expense.amount
      }
    }

    return totalOpex
  }

  /**
   * Calcule l'amortissement mensuel
   */
  private calculateMonthlyDepreciation(year: number, month: number): number {
    let totalDepreciation = 0

    for (const asset of this.capex) {
      const assetDate = new Date(asset.date)
      const currentDate = new Date(year, month - 1, 1)

      // Calculer le nombre de mois écoulés depuis l'achat
      const monthsFromPurchase = this.getMonthsDifference(assetDate, currentDate)

      // Si l'actif est en cours d'amortissement
      if (monthsFromPurchase >= 0 && monthsFromPurchase < asset.life_months) {
        const monthlyDepreciation = asset.amount / asset.life_months
        totalDepreciation += monthlyDepreciation
      }
    }

    return totalDepreciation
  }

  /**
   * Calcule les investissements mensuels
   */
  private calculateMonthlyInvestment(year: number, month: number): number {
    let totalInvestment = 0

    for (const asset of this.capex) {
      const assetDate = new Date(asset.date)
      const currentDate = new Date(year, month - 1, 1)

      // Si l'investissement a lieu ce mois
      if (this.isSameMonth(assetDate, currentDate)) {
        totalInvestment += asset.amount
      }
    }

    return totalInvestment
  }

  /**
   * Calcule la différence en mois entre deux dates
   */
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
           (endDate.getMonth() - startDate.getMonth())
  }

  /**
   * Vérifie si deux dates sont dans le même mois
   */
  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth()
  }

  /**
   * Génère un résumé des métriques clés
   */
  generateSummary(outputs: FinancialOutput[]) {
    const totalRevenue = outputs.reduce((sum, row) => sum + row.revenue, 0)
    const totalProfit = outputs.reduce((sum, row) => sum + row.net_income, 0)
    const minCashBalance = Math.min(...outputs.map(row => row.cash_balance))
    const maxCashBalance = Math.max(...outputs.map(row => row.cash_balance))

    // Point d'équilibre (premier mois avec cash positif)
    const breakEvenMonth = outputs.findIndex(row => row.cash_balance > 0)

    // Marge moyenne
    const avgGrossMargin = outputs.reduce((sum, row) => sum + row.gross_margin, 0) / outputs.length
    const avgNetMargin = outputs.reduce((sum, row) => sum + row.net_margin, 0) / outputs.length

    return {
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      min_cash_balance: minCashBalance,
      max_cash_balance: maxCashBalance,
      break_even_month: breakEvenMonth >= 0 ? breakEvenMonth + 1 : null,
      avg_gross_margin: avgGrossMargin,
      avg_net_margin: avgNetMargin,
      months_calculated: outputs.length,
      is_profitable: totalProfit > 0,
      needs_financing: minCashBalance < 0,
      financing_need: minCashBalance < 0 ? Math.abs(minCashBalance) : 0
    }
  }
}