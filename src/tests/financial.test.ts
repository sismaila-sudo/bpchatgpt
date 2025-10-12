// Tests pour le moteur financier
// Validation des calculs selon les standards bancaires sénégalais

import { financialService } from '@/services/financialService'
import {
  LoanDetails,
  FinancingSource,
  InitialFinancing,
  InitialInvestments,
  SENEGAL_FINANCIAL_CONSTANTS,
  FONGIP_CRITERIA,
  FAISE_CRITERIA
} from '@/types/financial'

describe('FinancialCalculationService', () => {

  // ============ TESTS CALCULS DE BASE ============

  describe('Calculs de mensualités d\'emprunt', () => {
    it('devrait calculer correctement les mensualités sans différé', () => {
      const result = financialService.calculateLoanPayment(
        10000000, // 10M FCFA
        15, // 15% taux annuel
        60 // 5 ans
      )

      // Vérification mensualité attendue (formule annuités constantes)
      expect(result.monthlyPayment).toBeCloseTo(237900, 0)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(result.schedule).toHaveLength(60)
    })

    it('devrait calculer correctement avec période de grâce', () => {
      const result = financialService.calculateLoanPayment(
        5000000, // 5M FCFA
        12, // 12% taux annuel
        36, // 3 ans
        6 // 6 mois de grâce
      )

      // Pendant la grâce : intérêts seulement
      const gracePayment = 5000000 * (12 / 100 / 12)
      expect(result.monthlyPayment.grace).toBeCloseTo(gracePayment, 0)

      // Après la grâce : mensualité normale sur 30 mois
      expect(result.monthlyPayment.normal).toBeGreaterThan(gracePayment)
      expect(result.schedule).toHaveLength(36)
    })

    it('devrait respecter les taux BCEAO et bancaires', () => {
      // Test avec taux BCEAO minimum
      const resultBCEAO = financialService.calculateLoanPayment(
        1000000,
        SENEGAL_FINANCIAL_CONSTANTS.BCEAO_RATE,
        24
      )

      // Test avec taux bancaire moyen
      const resultBank = financialService.calculateLoanPayment(
        1000000,
        SENEGAL_FINANCIAL_CONSTANTS.BANK_RATES.average,
        24
      )

      expect(resultBank.monthlyPayment).toBeGreaterThan(resultBCEAO.monthlyPayment)
    })
  })

  describe('Calculs d\'amortissement', () => {
    it('devrait calculer l\'amortissement linéaire correctement', () => {
      const result = financialService.calculateDepreciation(
        1000000, // 1M FCFA
        5, // 5 ans
        'linear'
      )

      expect(result).toHaveLength(5)
      result.forEach(year => {
        expect(year.depreciation).toBe(200000) // 1M/5 = 200k par an
      })
      expect(result[4].bookValue).toBe(0) // Valeur nulle après 5 ans
    })

    it('devrait respecter les taux d\'amortissement réglementaires', () => {
      // Test équipements (20%)
      const equipmentResult = financialService.calculateDepreciation(
        1000000,
        1 / (SENEGAL_FINANCIAL_CONSTANTS.DEPRECIATION_RATES.equipment / 100),
        'linear'
      )
      expect(equipmentResult).toHaveLength(5) // 100/20 = 5 ans

      // Test informatique (33%)
      const computerResult = financialService.calculateDepreciation(
        300000,
        1 / (SENEGAL_FINANCIAL_CONSTANTS.DEPRECIATION_RATES.computers / 100),
        'linear'
      )
      expect(computerResult).toHaveLength(3) // 100/33 ≈ 3 ans
    })
  })

  // ============ TESTS PROJECTIONS FINANCIÈRES ============

  describe('Projections de résultats', () => {
    const sampleLoan: LoanDetails = {
      id: 'loan1',
      source: FinancingSource.BANK_LOAN,
      amount: 5000000,
      interestRate: 15,
      durationMonths: 60,
      guaranteeRequired: 120
    }

    it('devrait générer des projections cohérentes', () => {
      const revenues = [
        { year: 1, amount: 10000000 },
        { year: 2, amount: 12000000 },
        { year: 3, amount: 15000000 }
      ]

      const expenses = [
        { year: 1, amount: 7000000 },
        { year: 2, amount: 8000000 },
        { year: 3, amount: 9000000 }
      ]

      const projections = financialService.generateProfitLossProjections(
        revenues,
        expenses,
        [sampleLoan],
        3
      )

      expect(projections).toHaveLength(3)

      // Vérification année 1
      expect(projections[0].revenues.total).toBe(10000000)
      expect(projections[0].expenses.total).toBe(7000000)
      expect(projections[0].operatingProfit).toBe(3000000)

      // Vérification croissance année 2
      expect(projections[1].revenues.growth).toBeCloseTo(20, 0) // 20% de croissance

      // Vérification impôts (30% au Sénégal)
      projections.forEach(projection => {
        if (projection.netProfitBeforeTax > 0) {
          const expectedTaxes = projection.netProfitBeforeTax * 0.3
          expect(projection.taxes).toBeCloseTo(expectedTaxes, 0)
        }
      })
    })

    it('devrait calculer les charges financières correctement', () => {
      const projections = financialService.generateProfitLossProjections(
        [{ year: 1, amount: 10000000 }],
        [{ year: 1, amount: 6000000 }],
        [sampleLoan],
        1
      )

      // Les charges financières doivent être > 0 avec un emprunt
      expect(projections[0].financialCharges).toBeGreaterThan(0)
      // Estimation approximative des intérêts première année
      expect(projections[0].financialCharges).toBeLessThan(sampleLoan.amount * 0.15)
    })
  })

  describe('Plans de trésorerie', () => {
    it('devrait générer 12 mois par année', () => {
      const profitLoss = [{
        year: 1,
        revenues: { total: 12000000, year: 1, categories: [], growth: 0 },
        expenses: { total: 8000000, year: 1, categories: [] },
        grossProfit: 4000000,
        operatingProfit: 4000000,
        financialCharges: 500000,
        netProfitBeforeTax: 3500000,
        taxes: 1050000,
        netProfit: 2450000,
        ebitda: 4000000,
        margins: { gross: 33, operating: 33, net: 20 }
      }]

      const investments: InitialInvestments = {
        equipment: [],
        intangible: [],
        workingCapital: [],
        total: 3000000
      }

      const cashFlow = financialService.generateCashFlowProjections(
        profitLoss,
        investments,
        []
      )

      expect(cashFlow).toHaveLength(12) // 12 mois

      // Vérification cohérence des soldes
      cashFlow.forEach((month, index) => {
        expect(month.closingBalance).toBe(month.openingBalance + month.netCashFlow)
        if (index > 0) {
          expect(month.openingBalance).toBe(cashFlow[index - 1].closingBalance)
        }
      })
    })
  })

  // ============ TESTS RATIOS FINANCIERS ============

  describe('Calculs de ratios', () => {
    const sampleFinancing: InitialFinancing = {
      totalProject: 10000000,
      personalContribution: 4000000,
      loans: [{
        id: 'loan1',
        source: FinancingSource.BANK_LOAN,
        amount: 6000000,
        interestRate: 15,
        durationMonths: 60,
        guaranteeRequired: 120
      }],
      grants: [],
      investors: []
    }

    const sampleInvestments: InitialInvestments = {
      equipment: [],
      intangible: [],
      workingCapital: [],
      total: 8000000
    }

    it('devrait calculer les ratios de rentabilité', () => {
      const profitLoss = [{
        year: 1,
        revenues: { total: 15000000, year: 1, categories: [], growth: 0 },
        expenses: { total: 10000000, year: 1, categories: [] },
        grossProfit: 5000000,
        operatingProfit: 5000000,
        financialCharges: 900000,
        netProfitBeforeTax: 4100000,
        taxes: 1230000,
        netProfit: 2870000,
        ebitda: 5000000,
        margins: { gross: 33, operating: 33, net: 19 }
      }]

      const ratios = financialService.calculateFinancialRatios(
        profitLoss,
        sampleFinancing,
        sampleInvestments
      )

      expect(ratios).toHaveLength(1)

      // ROI = Résultat net / Fonds propres
      const expectedROI = (2870000 / 4000000) * 100
      expect(ratios[0].profitability.roi).toBeCloseTo(expectedROI, 1)

      // Autonomie financière = Fonds propres / Total actif
      const expectedEquityRatio = 4000000 / 8000000
      expect(ratios[0].leverage.equityRatio).toBeCloseTo(expectedEquityRatio, 2)
    })

    it('devrait respecter les critères FONGIP', () => {
      // Simulation projet FONGIP conforme
      const strongProfitLoss = [{
        year: 1,
        revenues: { total: 20000000, year: 1, categories: [], growth: 0 },
        expenses: { total: 12000000, year: 1, categories: [] },
        grossProfit: 8000000,
        operatingProfit: 8000000,
        financialCharges: 600000,
        netProfitBeforeTax: 7400000,
        taxes: 2220000,
        netProfit: 5180000,
        ebitda: 8000000,
        margins: { gross: 40, operating: 40, net: 26 }
      }]

      const strongFinancing: InitialFinancing = {
        totalProject: 10000000,
        personalContribution: 5000000, // 50% autonomie
        loans: [{
          id: 'fongip1',
          source: FinancingSource.FONGIP,
          amount: 5000000,
          interestRate: 8, // Taux préférentiel FONGIP
          durationMonths: 84,
          guaranteeRequired: 100
        }],
        grants: [],
        investors: []
      }

      const ratios = financialService.calculateFinancialRatios(
        strongProfitLoss,
        strongFinancing,
        sampleInvestments
      )

      // ROI > 20% (critère FONGIP)
      expect(ratios[0].profitability.roi).toBeGreaterThan(FONGIP_CRITERIA.minimumROI)

      // Autonomie > 40% (critère FONGIP)
      expect(ratios[0].leverage.equityRatio).toBeGreaterThan(FONGIP_CRITERIA.minimumEquityRatio / 100)
    })
  })

  // ============ TESTS VALIDATION BANCAIRE ============

  describe('Validation selon critères bancaires', () => {
    it('devrait valider un projet bancable', () => {
      const goodRatios = {
        profitability: {
          roi: 25, roe: 25, roa: 15,
          grossMargin: 40, operatingMargin: 30, netMargin: 20,
          paybackPeriod: 3
        },
        liquidity: {
          currentRatio: 1.5, quickRatio: 1.2,
          cashRatio: 0.8, workingCapitalRatio: 0.2
        },
        leverage: {
          debtToEquity: 1.0, debtToAssets: 0.5,
          equityRatio: 0.5, interestCoverage: 5
        },
        efficiency: {
          assetTurnover: 2, inventoryTurnover: 6,
          receivablesTurnover: 12, workingCapitalTurnover: 8
        },
        valuation: {}
      }

      const validation = financialService.validateAgainstBankingStandards(goodRatios)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('devrait rejeter un projet non bancable', () => {
      const badRatios = {
        profitability: {
          roi: 5, roe: 5, roa: 3, // ROI trop faible
          grossMargin: 10, operatingMargin: 5, netMargin: 2,
          paybackPeriod: 8
        },
        liquidity: {
          currentRatio: 0.8, quickRatio: 0.6, // Liquidité insuffisante
          cashRatio: 0.3, workingCapitalRatio: 0.1
        },
        leverage: {
          debtToEquity: 4.0, debtToAssets: 0.8,
          equityRatio: 0.2, interestCoverage: 1 // Endettement excessif
        },
        efficiency: {
          assetTurnover: 0.5, inventoryTurnover: 2,
          receivablesTurnover: 4, workingCapitalTurnover: 3
        },
        valuation: {}
      }

      const validation = financialService.validateAgainstBankingStandards(badRatios)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('devrait appliquer les critères spécifiques FONGIP', () => {
      const borderlineRatios = {
        profitability: {
          roi: 18, roe: 18, roa: 12, // ROI < 20% (critère FONGIP)
          grossMargin: 35, operatingMargin: 25, netMargin: 15,
          paybackPeriod: 4
        },
        liquidity: {
          currentRatio: 1.3, quickRatio: 1.1,
          cashRatio: 0.7, workingCapitalRatio: 0.15
        },
        leverage: {
          debtToEquity: 1.5, debtToAssets: 0.6,
          equityRatio: 0.35, interestCoverage: 3 // Autonomie < 40%
        },
        efficiency: {
          assetTurnover: 1.5, inventoryTurnover: 5,
          receivablesTurnover: 10, workingCapitalTurnover: 6
        },
        valuation: {}
      }

      const validationFONGIP = financialService.validateAgainstBankingStandards(borderlineRatios, 'fongip')

      expect(validationFONGIP.isValid).toBe(false)
      expect(validationFONGIP.errors.some(e => e.message.includes('FONGIP'))).toBe(true)
    })
  })

  // ============ TESTS SEUIL DE RENTABILITÉ ============

  describe('Analyse de seuil de rentabilité', () => {
    it('devrait calculer le seuil de rentabilité correctement', () => {
      const profitLoss = [{
        year: 1,
        revenues: { total: 20000000, year: 1, categories: [], growth: 0 },
        expenses: { total: 15000000, year: 1, categories: [] },
        grossProfit: 5000000,
        operatingProfit: 5000000,
        financialCharges: 500000,
        netProfitBeforeTax: 4500000,
        taxes: 1350000,
        netProfit: 3150000,
        ebitda: 5000000,
        margins: { gross: 25, operating: 25, net: 16 }
      }]

      const breakEven = financialService.calculateBreakEvenAnalysis(profitLoss)

      expect(breakEven).toHaveLength(1)
      expect(breakEven[0].breakEvenRevenue).toBeGreaterThan(0)
      expect(breakEven[0].breakEvenRevenue).toBeLessThan(profitLoss[0].revenues.total)
      expect(breakEven[0].marginOfSafety).toBeGreaterThan(0)
    })
  })

  // ============ TESTS RAPPORTS FINANCIERS ============

  describe('Génération de rapports', () => {
    it('devrait générer un rapport complet', () => {
      // Données de test complètes
      const sampleFinancials = {
        id: 'test',
        projectId: 'project1',
        currency: 'XOF',
        planningHorizon: 3,
        initialFinancing: {
          totalProject: 10000000,
          personalContribution: 4000000,
          loans: [],
          grants: [],
          investors: []
        },
        initialInvestments: {
          equipment: [],
          intangible: [],
          workingCapital: [],
          total: 8000000
        },
        profitLossProjections: [],
        cashFlowProjections: [],
        financialRatios: [{
          profitability: {
            roi: 22, roe: 22, roa: 15,
            grossMargin: 35, operatingMargin: 25, netMargin: 18,
            paybackPeriod: 3.5
          },
          liquidity: {
            currentRatio: 1.4, quickRatio: 1.1,
            cashRatio: 0.8, workingCapitalRatio: 0.18
          },
          leverage: {
            debtToEquity: 1.5, debtToAssets: 0.6,
            equityRatio: 0.4, interestCoverage: 4
          },
          efficiency: {
            assetTurnover: 1.8, inventoryTurnover: 6,
            receivablesTurnover: 12, workingCapitalTurnover: 8
          },
          valuation: {}
        }],
        sensitivityAnalysis: { scenarios: [], variables: [], results: [] },
        breakEvenAnalysis: [],
        lastCalculated: new Date(),
        assumptions: [],
        validationStatus: { isValid: true, errors: [], warnings: [], lastValidated: new Date() }
      }

      const report = financialService.generateFinancialReport(sampleFinancials as Record<string, unknown>)

      expect(report.bankability).toBe('high')
      expect(report.summary).toContain('très bancable')
      expect(report.recommendations).toBeDefined()
      expect(report.risks).toBeDefined()
    })
  })
})

// ============ TESTS D'INTÉGRATION ============

describe('Tests d\'intégration complets', () => {
  it('devrait traiter un projet complet de A à Z', () => {
    // Scénario : Restaurant à Dakar, financement mixte FONGIP + banque

    const financing: InitialFinancing = {
      totalProject: 25000000, // 25M FCFA
      personalContribution: 10000000, // 40%
      loans: [
        {
          id: 'fongip1',
          source: FinancingSource.FONGIP,
          amount: 10000000,
          interestRate: 8,
          durationMonths: 84,
          guaranteeRequired: 100
        },
        {
          id: 'bank1',
          source: FinancingSource.BANK_LOAN,
          amount: 5000000,
          interestRate: 15,
          durationMonths: 60,
          guaranteeRequired: 150
        }
      ],
      grants: [],
      investors: []
    }

    const investments: InitialInvestments = {
      equipment: [
        { id: 'eq1', name: 'Équipement cuisine', category: 'kitchen', quantity: 1, unitPrice: 8000000, totalPrice: 8000000, depreciationYears: 5 }
      ],
      intangible: [
        { id: 'int1', name: 'Licence restaurant', category: 'license', amount: 2000000, amortizationYears: 5 }
      ],
      workingCapital: [
        { id: 'wc1', category: 'stock', description: 'Stock initial', amount: 3000000 }
      ],
      total: 13000000
    }

    const revenues = [
      { year: 1, amount: 30000000 },
      { year: 2, amount: 36000000 },
      { year: 3, amount: 42000000 }
    ]

    const expenses = [
      { year: 1, amount: 22000000 },
      { year: 2, amount: 25000000 },
      { year: 3, amount: 28000000 }
    ]

    // Génération des projections
    const profitLoss = financialService.generateProfitLossProjections(
      revenues,
      expenses,
      financing.loans,
      3
    )

    const cashFlow = financialService.generateCashFlowProjections(
      profitLoss,
      investments,
      financing.loans
    )

    const ratios = financialService.calculateFinancialRatios(
      profitLoss,
      financing,
      investments
    )

    const breakEven = financialService.calculateBreakEvenAnalysis(profitLoss)

    // Validations
    expect(profitLoss).toHaveLength(3)
    expect(cashFlow).toHaveLength(36) // 3 ans × 12 mois
    expect(ratios).toHaveLength(3)
    expect(breakEven).toHaveLength(3)

    // Validation bancabilité
    const validation = financialService.validateAgainstBankingStandards(ratios[0], 'fongip')
    expect(validation.isValid).toBe(true)

    // Vérification cohérence financière
    profitLoss.forEach(projection => {
      expect(projection.netProfit).toBeGreaterThan(0)
      expect(projection.margins.net).toBeGreaterThan(10) // Marge nette > 10%
    })

    ratios.forEach(ratio => {
      expect(ratio.profitability.roi).toBeGreaterThan(15) // ROI > 15%
      expect(ratio.leverage.equityRatio).toBeGreaterThan(0.3) // Autonomie > 30%
    })
  })
})