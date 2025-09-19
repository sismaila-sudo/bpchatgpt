import Decimal from 'decimal.js'
import {
  Project,
  ProductService,
  SalesProjection,
  Capex,
  Opex,
  PayrollRole,
  HeadcountPlan,
  Loan,
  TaxSettings,
  WorkingCapital,
  Assumptions,
  FinancialOutput
} from '@/types/database'

// Configure Decimal.js for financial precision
Decimal.config({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export class FinancialCalculator {
  private project: Project
  private assumptions: Assumptions
  private taxSettings: TaxSettings
  private workingCapital: WorkingCapital

  constructor(
    project: Project,
    assumptions: Assumptions,
    taxSettings: TaxSettings,
    workingCapital: WorkingCapital
  ) {
    this.project = project
    this.assumptions = assumptions
    this.taxSettings = taxSettings
    this.workingCapital = workingCapital
  }

  /**
   * Calculate monthly financial projections
   */
  async calculateMonthlyProjections(
    products: ProductService[],
    salesProjections: SalesProjection[],
    capex: Capex[],
    opex: Opex[],
    payrollRoles: PayrollRole[],
    headcountPlan: HeadcountPlan[],
    loans: Loan[],
    scenarioId?: string
  ): Promise<FinancialOutput[]> {
    const results: FinancialOutput[] = []
    const startDate = new Date(this.project.start_date)
    const horizonMonths = this.project.horizon_years * 12

    let cumulativeCashBalance = new Decimal(0)
    let cumulativeAssets = new Decimal(0)
    let cumulativeDebt = new Decimal(0)

    for (let monthIndex = 0; monthIndex < horizonMonths; monthIndex++) {
      const currentDate = new Date(startDate)
      currentDate.setMonth(startDate.getMonth() + monthIndex)

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      // Calculate revenue
      const monthlyRevenue = this.calculateMonthlyRevenue(
        products,
        salesProjections,
        year,
        month
      )

      // Calculate COGS
      const monthlyCogs = this.calculateMonthlyCogs(
        products,
        salesProjections,
        year,
        month
      )

      // Calculate OPEX
      const monthlyOpex = this.calculateMonthlyOpex(
        opex,
        monthlyRevenue,
        year,
        month,
        monthIndex
      )

      // Calculate payroll
      const monthlyPayroll = this.calculateMonthlyPayroll(
        payrollRoles,
        headcountPlan,
        year,
        month
      )

      // Calculate depreciation
      const monthlyDepreciation = this.calculateMonthlyDepreciation(
        capex,
        year,
        month
      )

      // Calculate interest expense
      const monthlyInterest = this.calculateMonthlyInterest(
        loans,
        year,
        month,
        cumulativeDebt
      )

      // Calculate working capital needs
      const bfrData = this.calculateWorkingCapital(
        monthlyRevenue,
        monthlyCogs,
        year,
        month
      )

      // Income Statement calculations
      const grossProfit = monthlyRevenue.minus(monthlyCogs)
      const totalOpex = monthlyOpex.plus(monthlyPayroll)
      const ebitda = grossProfit.minus(totalOpex)
      const ebit = ebitda.minus(monthlyDepreciation)
      const ebt = ebit.minus(monthlyInterest)

      // Tax calculation
      const monthlyTaxes = this.calculateTaxes(ebt, year, month)
      const netIncome = ebt.minus(monthlyTaxes)

      // Cash Flow calculations
      const operatingCashFlow = netIncome
        .plus(monthlyDepreciation)
        .minus(bfrData.change)

      const investingCashFlow = this.calculateInvestingCashFlow(
        capex,
        year,
        month
      )

      const financingCashFlow = this.calculateFinancingCashFlow(
        loans,
        year,
        month
      )

      const netCashFlow = operatingCashFlow
        .plus(investingCashFlow)
        .plus(financingCashFlow)

      cumulativeCashBalance = cumulativeCashBalance.plus(netCashFlow)

      // Update cumulative values for next iteration
      cumulativeAssets = cumulativeAssets
        .plus(investingCashFlow.negated())
        .minus(monthlyDepreciation)

      cumulativeDebt = this.updateCumulativeDebt(
        cumulativeDebt,
        loans,
        year,
        month
      )

      // Calculate ratios
      const ratios = this.calculateRatios(
        monthlyRevenue,
        grossProfit,
        ebitda,
        netIncome,
        cumulativeAssets,
        cumulativeDebt,
        operatingCashFlow,
        monthlyInterest
      )

      const financialOutput: FinancialOutput = {
        id: '', // Will be set by database
        project_id: this.project.id,
        scenario_id: scenarioId || null,
        year,
        month,
        // Income Statement
        revenue: monthlyRevenue.toNumber(),
        cogs: monthlyCogs.toNumber(),
        gross_profit: grossProfit.toNumber(),
        opex_total: totalOpex.toNumber(),
        ebitda: ebitda.toNumber(),
        depreciation: monthlyDepreciation.toNumber(),
        ebit: ebit.toNumber(),
        interest_expense: monthlyInterest.toNumber(),
        taxes: monthlyTaxes.toNumber(),
        net_income: netIncome.toNumber(),
        // Cash Flow
        operating_cash_flow: operatingCashFlow.toNumber(),
        investing_cash_flow: investingCashFlow.toNumber(),
        financing_cash_flow: financingCashFlow.toNumber(),
        net_cash_flow: netCashFlow.toNumber(),
        cash_balance: cumulativeCashBalance.toNumber(),
        // Working Capital
        bfr: bfrData.total.toNumber(),
        bfr_change: bfrData.change.toNumber(),
        // Ratios
        gross_margin: ratios.grossMargin.toNumber(),
        ebitda_margin: ratios.ebitdaMargin.toNumber(),
        net_margin: ratios.netMargin.toNumber(),
        roa: ratios.roa.toNumber(),
        roe: ratios.roe.toNumber(),
        current_ratio: ratios.currentRatio.toNumber(),
        debt_to_equity: ratios.debtToEquity.toNumber(),
        dscr: ratios.dscr.toNumber(),
        created_at: new Date().toISOString()
      }

      results.push(financialOutput)
    }

    return results
  }

  private calculateMonthlyRevenue(
    products: ProductService[],
    salesProjections: SalesProjection[],
    year: number,
    month: number
  ): Decimal {
    let totalRevenue = new Decimal(0)

    for (const projection of salesProjections) {
      if (projection.year === year && projection.month === month) {
        const product = products.find(p => p.id === projection.product_service_id)
        if (product) {
          // Apply seasonality if available
          const seasonalityFactor = product.seasonality?.[month - 1] || 1
          const adjustedVolume = new Decimal(projection.volume).times(seasonalityFactor)
          const revenue = adjustedVolume.times(projection.price)
          totalRevenue = totalRevenue.plus(revenue)
        }
      }
    }

    return totalRevenue
  }

  private calculateMonthlyCogs(
    products: ProductService[],
    salesProjections: SalesProjection[],
    year: number,
    month: number
  ): Decimal {
    let totalCogs = new Decimal(0)

    for (const projection of salesProjections) {
      if (projection.year === year && projection.month === month) {
        const product = products.find(p => p.id === projection.product_service_id)
        if (product) {
          const seasonalityFactor = product.seasonality?.[month - 1] || 1
          const adjustedVolume = new Decimal(projection.volume).times(seasonalityFactor)
          const cogs = adjustedVolume.times(product.cogs_unit)
          totalCogs = totalCogs.plus(cogs)
        }
      }
    }

    return totalCogs
  }

  private calculateMonthlyOpex(
    opex: Opex[],
    revenue: Decimal,
    year: number,
    month: number,
    monthIndex: number
  ): Decimal {
    let totalOpex = new Decimal(0)

    for (const expense of opex) {
      // Check if expense is active in this period
      const startDate = expense.start_date ? new Date(expense.start_date) : null
      const endDate = expense.end_date ? new Date(expense.end_date) : null
      const currentDate = new Date(year, month - 1, 1)

      if (startDate && currentDate < startDate) continue
      if (endDate && currentDate > endDate) continue

      let monthlyAmount = new Decimal(0)

      if (expense.is_variable) {
        // Variable cost as percentage of revenue
        monthlyAmount = revenue.times(expense.var_pct_of_sales).div(100)
      } else {
        // Fixed cost based on periodicity
        switch (expense.periodicity) {
          case 'monthly':
            monthlyAmount = new Decimal(expense.amount)
            break
          case 'quarterly':
            if (month % 3 === 1) { // First month of quarter
              monthlyAmount = new Decimal(expense.amount)
            }
            break
          case 'annually':
            if (month === 1) { // January
              monthlyAmount = new Decimal(expense.amount)
            }
            break
        }
      }

      // Apply inflation
      const inflationRate = new Decimal(this.assumptions.inflation_rate).div(100)
      const yearsFromStart = Math.floor(monthIndex / 12)
      const inflationFactor = inflationRate.plus(1).pow(yearsFromStart)

      monthlyAmount = monthlyAmount.times(inflationFactor)
      totalOpex = totalOpex.plus(monthlyAmount)
    }

    return totalOpex
  }

  private calculateMonthlyPayroll(
    payrollRoles: PayrollRole[],
    headcountPlan: HeadcountPlan[],
    year: number,
    month: number
  ): Decimal {
    let totalPayroll = new Decimal(0)

    for (const role of payrollRoles) {
      const headcount = headcountPlan.find(
        hp => hp.role_id === role.id && hp.year === year && hp.month === month
      )

      if (headcount && headcount.headcount > 0) {
        const grossSalary = new Decimal(role.gross_monthly)
        const employerCharges = grossSalary.times(role.employer_charges_pct).div(100)
        const benefits = new Decimal(role.benefits)
        const totalCostPerEmployee = grossSalary.plus(employerCharges).plus(benefits)

        const monthlyPayrollCost = totalCostPerEmployee.times(headcount.headcount)
        totalPayroll = totalPayroll.plus(monthlyPayrollCost)
      }
    }

    return totalPayroll
  }

  private calculateMonthlyDepreciation(
    capex: Capex[],
    year: number,
    month: number
  ): Decimal {
    let totalDepreciation = new Decimal(0)

    for (const asset of capex) {
      const assetDate = new Date(asset.date)
      const currentDate = new Date(year, month - 1, 1)

      // Check if asset is being depreciated in this month
      const monthsFromPurchase = this.getMonthsDifference(assetDate, currentDate)

      if (monthsFromPurchase >= 0 && monthsFromPurchase < asset.life_months) {
        const depreciableAmount = new Decimal(asset.amount).minus(asset.salvage_value)

        if (asset.method === 'linear') {
          const monthlyDepreciation = depreciableAmount.div(asset.life_months)
          totalDepreciation = totalDepreciation.plus(monthlyDepreciation)
        } else if (asset.method === 'degressive') {
          // Simplified degressive method (2x linear rate)
          const annualRate = new Decimal(2).div(asset.life_months / 12)
          const monthlyRate = annualRate.div(12)
          const bookValue = depreciableAmount // Simplified - should track actual book value
          const monthlyDepreciation = bookValue.times(monthlyRate)
          totalDepreciation = totalDepreciation.plus(monthlyDepreciation)
        }
      }
    }

    return totalDepreciation
  }

  private calculateMonthlyInterest(
    loans: Loan[],
    year: number,
    month: number,
    currentDebt: Decimal
  ): Decimal {
    let totalInterest = new Decimal(0)

    for (const loan of loans) {
      const loanDate = new Date(loan.disbursement_date)
      const currentDate = new Date(year, month - 1, 1)
      const monthsFromStart = this.getMonthsDifference(loanDate, currentDate)

      if (monthsFromStart >= 0 && monthsFromStart < loan.term_months) {
        // Calculate outstanding principal using amortization schedule
        const outstandingPrincipal = this.calculateOutstandingPrincipal(
          loan,
          monthsFromStart
        )

        if (outstandingPrincipal.gt(0)) {
          const monthlyRate = new Decimal(loan.rate).div(100).div(12)
          const monthlyInterest = outstandingPrincipal.times(monthlyRate)
          totalInterest = totalInterest.plus(monthlyInterest)
        }
      }
    }

    return totalInterest
  }

  private calculateWorkingCapital(
    revenue: Decimal,
    cogs: Decimal,
    year: number,
    month: number
  ): { total: Decimal; change: Decimal } {
    // Simplified BFR calculation
    const dailyRevenue = revenue.div(30)
    const dailyCogs = cogs.div(30)

    const receivables = dailyRevenue.times(this.workingCapital.dso_days)
    const inventory = dailyCogs.times(this.workingCapital.inventory_days)
    const payables = dailyCogs.times(this.workingCapital.dpo_days)

    const totalBfr = receivables
      .plus(inventory)
      .minus(payables)
      .plus(this.workingCapital.advances_clients)
      .minus(this.workingCapital.advances_suppliers)

    // For simplicity, assume BFR change equals current BFR (first month scenario)
    // In practice, this should track previous month's BFR
    const bfrChange = totalBfr

    return {
      total: totalBfr,
      change: bfrChange
    }
  }

  private calculateTaxes(
    ebt: Decimal,
    year: number,
    month: number
  ): Decimal {
    if (ebt.lte(0)) {
      return new Decimal(0)
    }

    const taxRate = new Decimal(this.taxSettings.corporate_tax_rate).div(100)
    return ebt.times(taxRate)
  }

  private calculateInvestingCashFlow(
    capex: Capex[],
    year: number,
    month: number
  ): Decimal {
    let totalInvesting = new Decimal(0)

    for (const asset of capex) {
      const assetDate = new Date(asset.date)
      const currentDate = new Date(year, month - 1, 1)

      if (this.isSameMonth(assetDate, currentDate)) {
        // Cash outflow for asset purchase
        totalInvesting = totalInvesting.minus(asset.amount)
      }
    }

    return totalInvesting
  }

  private calculateFinancingCashFlow(
    loans: Loan[],
    year: number,
    month: number
  ): Decimal {
    let totalFinancing = new Decimal(0)

    for (const loan of loans) {
      const loanDate = new Date(loan.disbursement_date)
      const currentDate = new Date(year, month - 1, 1)

      if (this.isSameMonth(loanDate, currentDate)) {
        // Cash inflow from loan disbursement
        totalFinancing = totalFinancing.plus(loan.principal)
      } else {
        const monthsFromStart = this.getMonthsDifference(loanDate, currentDate)

        if (monthsFromStart > 0 && monthsFromStart <= loan.term_months) {
          // Calculate monthly principal payment
          const monthlyPayment = this.calculateMonthlyPayment(loan)
          const interestPayment = this.calculateMonthlyInterest(
            [loan],
            year,
            month,
            new Decimal(0)
          )
          const principalPayment = monthlyPayment.minus(interestPayment)

          // Cash outflow for principal repayment
          totalFinancing = totalFinancing.minus(principalPayment)
        }
      }
    }

    return totalFinancing
  }

  private calculateRatios(
    revenue: Decimal,
    grossProfit: Decimal,
    ebitda: Decimal,
    netIncome: Decimal,
    assets: Decimal,
    debt: Decimal,
    operatingCashFlow: Decimal,
    interestExpense: Decimal
  ) {
    const grossMargin = revenue.gt(0) ? grossProfit.div(revenue).times(100) : new Decimal(0)
    const ebitdaMargin = revenue.gt(0) ? ebitda.div(revenue).times(100) : new Decimal(0)
    const netMargin = revenue.gt(0) ? netIncome.div(revenue).times(100) : new Decimal(0)

    const roa = assets.gt(0) ? netIncome.div(assets).times(100) : new Decimal(0)
    const equity = assets.minus(debt)
    const roe = equity.gt(0) ? netIncome.div(equity).times(100) : new Decimal(0)

    // Simplified current ratio (assumes current assets = 30% of total assets)
    const currentAssets = assets.times(0.3)
    const currentLiabilities = debt.times(0.4) // Simplified assumption
    const currentRatio = currentLiabilities.gt(0) ? currentAssets.div(currentLiabilities) : new Decimal(0)

    const debtToEquity = equity.gt(0) ? debt.div(equity) : new Decimal(0)

    // DSCR (Debt Service Coverage Ratio)
    const debtService = interestExpense // Simplified - should include principal payments
    const dscr = debtService.gt(0) ? operatingCashFlow.div(debtService) : new Decimal(0)

    return {
      grossMargin,
      ebitdaMargin,
      netMargin,
      roa,
      roe,
      currentRatio,
      debtToEquity,
      dscr
    }
  }

  // Helper methods
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
           (endDate.getMonth() - startDate.getMonth())
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth()
  }

  private calculateOutstandingPrincipal(loan: Loan, monthsElapsed: number): Decimal {
    const monthlyRate = new Decimal(loan.rate).div(100).div(12)
    const totalPayments = loan.term_months
    const principal = new Decimal(loan.principal)

    if (monthlyRate.eq(0)) {
      // No interest loan
      return principal.times(totalPayments - monthsElapsed).div(totalPayments)
    }

    // Standard amortizing loan formula
    const monthlyPayment = this.calculateMonthlyPayment(loan)
    let outstandingPrincipal = principal

    for (let i = 0; i < monthsElapsed; i++) {
      const interestPayment = outstandingPrincipal.times(monthlyRate)
      const principalPayment = monthlyPayment.minus(interestPayment)
      outstandingPrincipal = outstandingPrincipal.minus(principalPayment)
    }

    return outstandingPrincipal.gt(0) ? outstandingPrincipal : new Decimal(0)
  }

  private calculateMonthlyPayment(loan: Loan): Decimal {
    const monthlyRate = new Decimal(loan.rate).div(100).div(12)
    const principal = new Decimal(loan.principal)
    const periods = loan.term_months

    if (monthlyRate.eq(0)) {
      return principal.div(periods)
    }

    // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const onePlusR = monthlyRate.plus(1)
    const numerator = principal.times(monthlyRate).times(onePlusR.pow(periods))
    const denominator = onePlusR.pow(periods).minus(1)

    return numerator.div(denominator)
  }

  private updateCumulativeDebt(
    currentDebt: Decimal,
    loans: Loan[],
    year: number,
    month: number
  ): Decimal {
    let newDebt = currentDebt

    for (const loan of loans) {
      const loanDate = new Date(loan.disbursement_date)
      const currentDate = new Date(year, month - 1, 1)

      if (this.isSameMonth(loanDate, currentDate)) {
        // Add new loan
        newDebt = newDebt.plus(loan.principal)
      } else {
        const monthsFromStart = this.getMonthsDifference(loanDate, currentDate)

        if (monthsFromStart > 0 && monthsFromStart <= loan.term_months) {
          // Subtract principal payment
          const monthlyPayment = this.calculateMonthlyPayment(loan)
          const interestPayment = this.calculateMonthlyInterest(
            [loan],
            year,
            month,
            new Decimal(0)
          )
          const principalPayment = monthlyPayment.minus(interestPayment)
          newDebt = newDebt.minus(principalPayment)
        }
      }
    }

    return newDebt.gt(0) ? newDebt : new Decimal(0)
  }
}