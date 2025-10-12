// Service de calculs financiers automatisés
// Conforme aux standards bancaires sénégalais (BCEAO, FONGIP, FAISE)

import {
  ProjectFinancials,
  InitialFinancing,
  InitialInvestments,
  ProfitLossProjection,
  CashFlowProjection,
  FinancialRatios,
  BreakEvenAnalysis,
  SensitivityAnalysis,
  LoanDetails,
  Currency,
  SENEGAL_FINANCIAL_CONSTANTS,
  FONGIP_CRITERIA,
  FAISE_CRITERIA,
  ValidationStatus,
  ValidationError,
  ValidationWarning
} from '@/types/financial'

export class FinancialCalculationService {

  // ============ CALCULS DE BASE ============

  /**
   * Calcule les mensualités d'un emprunt
   */
  calculateLoanPayment(
    principal: number,
    annualRate: number,
    durationMonths: number,
    gracePeriodMonths: number = 0
  ): {
    monthlyPayment: number | { grace: number; normal: number }
    totalInterest: number
    schedule: Array<{
      month: number
      principal: number
      interest: number
      balance: number
      payment: number
    }>
  } {
    const monthlyRate = annualRate / 100 / 12
    const effectiveMonths = durationMonths - gracePeriodMonths

    // Pendant la période de grâce, seuls les intérêts sont payés
    const interestOnlyPayment = principal * monthlyRate

    // Calcul de la mensualité après la période de grâce
    const monthlyPayment = effectiveMonths > 0 ?
      (principal * monthlyRate * Math.pow(1 + monthlyRate, effectiveMonths)) /
      (Math.pow(1 + monthlyRate, effectiveMonths) - 1) : 0

    const schedule = []
    let balance = principal
    let totalInterest = 0

    for (let month = 1; month <= durationMonths; month++) {
      let payment = 0
      let principalPayment = 0
      const interestPayment = balance * monthlyRate

      if (month <= gracePeriodMonths) {
        // Période de grâce : paiement des intérêts seulement
        payment = interestOnlyPayment
        principalPayment = 0
      } else {
        // Période normale : capital + intérêts
        payment = monthlyPayment
        principalPayment = payment - interestPayment
        balance -= principalPayment
      }

      totalInterest += interestPayment

      schedule.push({
        month,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        payment
      })
    }

    return {
      monthlyPayment: gracePeriodMonths > 0 ?
        { grace: interestOnlyPayment, normal: monthlyPayment } :
        monthlyPayment,
      totalInterest,
      schedule
    }
  }

  /**
   * Calcule l'amortissement des immobilisations
   */
  calculateDepreciation(
    initialValue: number,
    depreciationYears: number,
    method: 'linear' | 'declining' = 'linear'
  ): Array<{ year: number; depreciation: number; bookValue: number }> {
    const schedule = []
    let bookValue = initialValue

    if (method === 'linear') {
      const annualDepreciation = initialValue / depreciationYears

      for (let year = 1; year <= depreciationYears; year++) {
        bookValue -= annualDepreciation
        schedule.push({
          year,
          depreciation: annualDepreciation,
          bookValue: Math.max(0, bookValue)
        })
      }
    } else {
      // Méthode dégressive (utilisée au Sénégal pour certains équipements)
      const rate = 2 / depreciationYears

      for (let year = 1; year <= depreciationYears; year++) {
        const depreciation = Math.min(bookValue * rate, bookValue)
        bookValue -= depreciation
        schedule.push({
          year,
          depreciation,
          bookValue: Math.max(0, bookValue)
        })
      }
    }

    return schedule
  }

  // ============ PROJECTIONS FINANCIÈRES ============

  /**
   * Génère les comptes de résultat prévisionnels
   */
  generateProfitLossProjections(
    revenues: Array<{ year: number; amount: number }>,
    expenses: Array<{ year: number; amount: number }>,
    loans: LoanDetails[],
    planningHorizon: number
  ): ProfitLossProjection[] {
    const projections: ProfitLossProjection[] = []

    for (let year = 1; year <= planningHorizon; year++) {
      const yearRevenues = revenues.find(r => r.year === year)?.amount || 0
      const yearExpenses = expenses.find(e => e.year === year)?.amount || 0

      // Calcul des charges financières (intérêts des emprunts)
      const financialCharges = this.calculateYearlyInterest(loans, year)

      // Calcul des impôts (30% au Sénégal)
      const netProfitBeforeTax = yearRevenues - yearExpenses - financialCharges
      const taxes = Math.max(0, netProfitBeforeTax * SENEGAL_FINANCIAL_CONSTANTS.TAX_RATES.corporate / 100)
      const netProfit = netProfitBeforeTax - taxes

      const projection: ProfitLossProjection = {
        year,
        revenues: {
          year,
          categories: [],
          total: yearRevenues,
          growth: year > 1 ?
            ((yearRevenues - (revenues.find(r => r.year === year - 1)?.amount || 0)) /
            (revenues.find(r => r.year === year - 1)?.amount || 1)) * 100 : 0
        },
        expenses: {
          year,
          categories: [],
          total: yearExpenses
        },
        grossProfit: yearRevenues - (yearExpenses * 0.6), // Estimation COGS à 60%
        operatingProfit: yearRevenues - yearExpenses,
        financialCharges,
        netProfitBeforeTax,
        taxes,
        netProfit,
        ebitda: yearRevenues - yearExpenses, // Simplifié
        margins: {
          gross: yearRevenues > 0 ? ((yearRevenues - (yearExpenses * 0.6)) / yearRevenues) * 100 : 0,
          operating: yearRevenues > 0 ? ((yearRevenues - yearExpenses) / yearRevenues) * 100 : 0,
          net: yearRevenues > 0 ? (netProfit / yearRevenues) * 100 : 0
        }
      }

      projections.push(projection)
    }

    return projections
  }

  /**
   * Génère les plans de trésorerie mensuels
   */
  generateCashFlowProjections(
    profitLossProjections: ProfitLossProjection[],
    initialInvestments: InitialInvestments,
    loans: LoanDetails[],
    seasonality: number[] = Array(12).fill(1) // Facteurs mensuels
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = []
    let cumulativeBalance = 0

    profitLossProjections.forEach(annualProjection => {
      const monthlyRevenue = annualProjection.revenues.total / 12
      const monthlyExpenses = annualProjection.expenses.total / 12

      for (let month = 1; month <= 12; month++) {
        const seasonalFactor = seasonality[month - 1]
        const adjustedRevenue = monthlyRevenue * seasonalFactor

        // Calcul des encaissements
        const receipts = {
          sales: adjustedRevenue,
          loans: annualProjection.year === 1 && month === 1 ?
            loans.reduce((sum, loan) => sum + loan.amount, 0) : 0,
          grants: 0,
          other: 0,
          total: 0
        }
        receipts.total = receipts.sales + receipts.loans + receipts.grants + receipts.other

        // Calcul des décaissements
        const payments = {
          investments: annualProjection.year === 1 && month === 1 ? initialInvestments.total : 0,
          workingCapital: monthlyRevenue * 0.1, // 10% du CA en BFR
          operatingExpenses: monthlyExpenses,
          loanRepayments: this.calculateMonthlyLoanPayments(loans,
            (annualProjection.year - 1) * 12 + month),
          taxes: month === 12 ? annualProjection.taxes : 0, // Impôts payés en fin d'année
          other: 0,
          total: 0
        }
        payments.total = payments.investments + payments.workingCapital +
                        payments.operatingExpenses + payments.loanRepayments +
                        payments.taxes + payments.other

        const netCashFlow = receipts.total - payments.total
        cumulativeBalance += netCashFlow

        projections.push({
          year: annualProjection.year,
          month,
          openingBalance: cumulativeBalance - netCashFlow,
          receipts,
          payments,
          netCashFlow,
          closingBalance: cumulativeBalance,
          cumulativeCashFlow: cumulativeBalance
        })
      }
    })

    return projections
  }

  // ============ RATIOS FINANCIERS ============

  /**
   * Calcule tous les ratios financiers
   */
  calculateFinancialRatios(
    profitLossProjections: ProfitLossProjection[],
    initialFinancing: InitialFinancing,
    initialInvestments: InitialInvestments
  ): FinancialRatios[] {
    return profitLossProjections.map(projection => {
      const totalAssets = initialInvestments.total
      const totalEquity = initialFinancing.personalContribution +
        initialFinancing.investors.reduce((sum, inv) => sum + inv.amount, 0)
      const totalDebt = initialFinancing.loans.reduce((sum, loan) => sum + loan.amount, 0)

      return {
        profitability: {
          roi: totalEquity > 0 ? (projection.netProfit / totalEquity) * 100 : 0,
          roe: totalEquity > 0 ? (projection.netProfit / totalEquity) * 100 : 0,
          roa: totalAssets > 0 ? (projection.netProfit / totalAssets) * 100 : 0,
          grossMargin: projection.margins.gross,
          operatingMargin: projection.margins.operating,
          netMargin: projection.margins.net,
          paybackPeriod: this.calculatePaybackPeriod(profitLossProjections, totalEquity)
        },
        liquidity: {
          currentRatio: 1.5, // Estimation basée sur les standards
          quickRatio: 1.2,
          cashRatio: 1.0,
          workingCapitalRatio: 0.15
        },
        leverage: {
          debtToEquity: totalEquity > 0 ? totalDebt / totalEquity : 0,
          debtToAssets: totalAssets > 0 ? totalDebt / totalAssets : 0,
          equityRatio: totalAssets > 0 ? totalEquity / totalAssets : 0,
          interestCoverage: projection.financialCharges > 0 ?
            projection.operatingProfit / projection.financialCharges : 999
        },
        efficiency: {
          assetTurnover: totalAssets > 0 ? projection.revenues.total / totalAssets : 0,
          inventoryTurnover: 6, // Estimation
          receivablesTurnover: 12, // Estimation
          workingCapitalTurnover: 8 // Estimation
        },
        valuation: {
          priceToEarnings: undefined,
          priceToBook: undefined,
          enterpriseValue: undefined
        }
      }
    })
  }

  /**
   * Calcule l'analyse de seuil de rentabilité
   */
  calculateBreakEvenAnalysis(
    profitLossProjections: ProfitLossProjection[]
  ): BreakEvenAnalysis[] {
    return profitLossProjections.map(projection => {
      // Estimation des coûts fixes (40%) et variables (60%)
      const fixedCosts = projection.expenses.total * 0.4
      const variableCosts = projection.expenses.total * 0.6
      const variableCostRatio = projection.revenues.total > 0 ?
        variableCosts / projection.revenues.total : 0.6

      const contributionMarginRatio = 1 - variableCostRatio
      const breakEvenRevenue = contributionMarginRatio > 0 ?
        fixedCosts / contributionMarginRatio : 0

      // Estimation du nombre d'unités (prix unitaire moyen)
      const averageSellingPrice = 10000 // FCFA - à adapter selon le secteur
      const breakEvenUnits = averageSellingPrice > 0 ?
        breakEvenRevenue / averageSellingPrice : 0

      const marginOfSafety = projection.revenues.total > 0 ?
        ((projection.revenues.total - breakEvenRevenue) / projection.revenues.total) * 100 : 0

      return {
        year: projection.year,
        fixedCosts,
        variableCostRatio: variableCostRatio * 100,
        averageSellingPrice,
        breakEvenUnits,
        breakEvenRevenue,
        marginOfSafety,
        operatingLeverage: contributionMarginRatio > 0 && projection.operatingProfit > 0 ?
          (projection.revenues.total * contributionMarginRatio) / projection.operatingProfit : 1,
        reachMonth: this.estimateBreakEvenMonth(projection, breakEvenRevenue)
      }
    })
  }

  // ============ VALIDATION BANCAIRE ============

  /**
   * Valide selon les critères bancaires sénégalais
   */
  validateAgainstBankingStandards(
    ratios: FinancialRatios,
    institution: 'bank' | 'fongip' | 'faise' | 'der' = 'bank'
  ): ValidationStatus {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Critères généraux bancaires (assouplis selon analyse d'expert)
    if (ratios.leverage.equityRatio < 0.1) {
      errors.push({
        field: 'equityRatio',
        message: 'Ratio d\'autonomie financière critique (< 10%)',
        severity: 'error'
      })
    } else if (ratios.leverage.equityRatio < 0.3) {
      warnings.push({
        field: 'equityRatio',
        message: 'Autonomie financière faible (< 30%) - Recommandation: +3 à 4M FCFA de fonds propres',
        severity: 'warning'
      })
    }

    if (ratios.liquidity.currentRatio < 1.2) {
      warnings.push({
        field: 'currentRatio',
        message: 'Ratio de liquidité faible (< 1.2)',
        severity: 'warning'
      })
    }

    if (ratios.profitability.roi < 15) {
      warnings.push({
        field: 'roi',
        message: 'Rentabilité faible (ROI < 15%)',
        severity: 'warning'
      })
    }

    // Critères spécifiques FONGIP
    if (institution === 'fongip') {
      if (ratios.profitability.roi < FONGIP_CRITERIA.minimumROI) {
        errors.push({
          field: 'roi',
          message: `ROI insuffisant pour FONGIP (< ${FONGIP_CRITERIA.minimumROI}%)`,
          severity: 'error'
        })
      }

      if (ratios.leverage.equityRatio < FONGIP_CRITERIA.minimumEquityRatio / 100) {
        errors.push({
          field: 'equityRatio',
          message: `Autonomie financière insuffisante pour FONGIP (< ${FONGIP_CRITERIA.minimumEquityRatio}%)`,
          severity: 'error'
        })
      }
    }

    // Critères spécifiques FAISE
    if (institution === 'faise') {
      if (ratios.profitability.roi < FAISE_CRITERIA.minimumROI) {
        errors.push({
          field: 'roi',
          message: `ROI insuffisant pour FAISE (< ${FAISE_CRITERIA.minimumROI}%)`,
          severity: 'error'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings as unknown as ValidationWarning[],
      lastValidated: new Date()
    }
  }

  // ============ MÉTHODES UTILITAIRES ============

  private calculateYearlyInterest(loans: LoanDetails[], year: number): number {
    return loans.reduce((total, loan) => {
      const schedule = this.calculateLoanPayment(
        loan.amount,
        loan.interestRate,
        loan.durationMonths,
        loan.gracePeriodMonths || 0
      ).schedule

      const yearlyInterest = schedule
        .filter(payment => Math.ceil(payment.month / 12) === year)
        .reduce((sum, payment) => sum + payment.interest, 0)

      return total + yearlyInterest
    }, 0)
  }

  private calculateMonthlyLoanPayments(loans: LoanDetails[], month: number): number {
    return loans.reduce((total, loan) => {
      if (month <= loan.durationMonths) {
        const payment = this.calculateLoanPayment(
          loan.amount,
          loan.interestRate,
          loan.durationMonths,
          loan.gracePeriodMonths || 0
        )

        const monthlyPayment = typeof payment.monthlyPayment === 'number' ?
          payment.monthlyPayment :
          (month <= (loan.gracePeriodMonths || 0) ?
            payment.monthlyPayment.grace : payment.monthlyPayment.normal)

        return total + monthlyPayment
      }
      return total
    }, 0)
  }

  private calculatePaybackPeriod(
    projections: ProfitLossProjection[],
    initialInvestment: number
  ): number {
    let cumulativeCashFlow = 0

    for (let i = 0; i < projections.length; i++) {
      cumulativeCashFlow += projections[i].netProfit
      if (cumulativeCashFlow >= initialInvestment) {
        return i + 1
      }
    }

    return projections.length + 1 // Si pas atteint dans la période
  }

  private estimateBreakEvenMonth(
    projection: ProfitLossProjection,
    breakEvenRevenue: number
  ): number | undefined {
    if (projection.revenues.total >= breakEvenRevenue) {
      // Estimation linéaire
      return Math.ceil((breakEvenRevenue / projection.revenues.total) * 12)
    }
    return undefined
  }

  /**
   * Génère un rapport financier complet
   */
  generateFinancialReport(financials: ProjectFinancials): {
    summary: string
    bankability: 'high' | 'medium' | 'low'
    recommendations: string[]
    risks: string[]
  } {
    const latestRatios = financials.financialRatios[financials.financialRatios.length - 1]
    const validation = this.validateAgainstBankingStandards(latestRatios)

    let bankability: 'high' | 'medium' | 'low' = 'low'

    // Logique de bancabilité assouplie selon analyse d'expert
    if (validation.isValid && validation.errors.length === 0) {
      bankability = validation.warnings.length === 0 ? 'high' : 'medium'
    } else if (validation.errors.length === 0) {
      // Même avec warnings, si bons indicateurs → bancable sous condition
      const hasGoodCoverage = latestRatios.leverage.interestCoverage > 15
      const hasGoodMargin = latestRatios.profitability.netMargin > 25

      if (hasGoodCoverage && hasGoodMargin) {
        bankability = 'medium' // Bancable sous condition
      }
    }

    const recommendations: string[] = []
    const risks: string[] = []

    // Analyse des ratios
    if (latestRatios.profitability.roi < 20) {
      recommendations.push('Améliorer la rentabilité en optimisant les coûts ou augmentant les prix')
    }

    if (latestRatios.leverage.debtToEquity > 2) {
      risks.push('Endettement élevé - risque de difficultés de remboursement')
      recommendations.push('Augmenter les fonds propres ou réduire l\'endettement')
    }

    if (latestRatios.liquidity.currentRatio < 1.5) {
      risks.push('Liquidité insuffisante - risque de tensions de trésorerie')
      recommendations.push('Constituer une réserve de trésorerie plus importante')
    }

    const summary = `Projet ${bankability === 'high' ? 'très bancable' :
      bankability === 'medium' ? 'bancable sous condition' : 'non bancable en l\'état'
    }. ROE: ${latestRatios.profitability.roi.toFixed(1)}%, Autonomie: ${
      (latestRatios.leverage.equityRatio * 100).toFixed(1)}%, Couverture: ${latestRatios.leverage.interestCoverage.toFixed(1)}`

    return {
      summary,
      bankability,
      recommendations,
      risks
    }
  }
}

// Instance singleton
export const financialService = new FinancialCalculationService()