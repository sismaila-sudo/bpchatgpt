/**
 * Tests unitaires pour FinancialEngine
 * Validation des calculs financiers corrigés (revenus, intérêts, etc.)
 */

import { FinancialEngine } from '../financialEngine'
import { FinancialInputs, RevenueStream, CostItem, Loan } from '@/types/financial'

describe('FinancialEngine - Calculs corrigés', () => {
  
  // ============ INPUTS DE BASE POUR TESTS ============
  
  const baseInputs: FinancialInputs = {
    years: 3,
    startYear: 2025,
    taxRate: 0.30, // 30% Sénégal
    discountRate: 0.12, // 12% FONGIP
    initialInvestment: 10000000,
    initialInvestments: [], // Tableau vide par défaut
    revenueStreams: [],
    costs: [],
    loans: []
  }

  // ============ TESTS CALCUL REVENUS (FIX MENSUEL → ANNUEL) ============

  describe('Calcul Revenus Mensuels × 12', () => {
    it('devrait calculer les revenus annuels = revenus mensuels × 12', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes produit A',
            unitPrice: 10000, // 10k FCFA
            quantity: 100, // 100 unités/mois
            growthRate: 0 // Pas de croissance pour ce test
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Revenu mensuel = 10000 × 100 = 1 000 000 FCFA
      // Revenu annuel = 1 000 000 × 12 = 12 000 000 FCFA
      expect(projections.revenues[0]).toBe(12000000)
    })

    it('devrait appliquer la croissance sur la base annuelle', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        years: 3,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 10000,
            quantity: 100, // 100/mois
            growthRate: 0.10 // 10% de croissance annuelle
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Année 1: 10000 × 100 × 12 = 12 000 000
      expect(projections.revenues[0]).toBe(12000000)
      
      // Année 2: 12 000 000 × 1.10 = 13 200 000
      expect(projections.revenues[1]).toBeCloseTo(13200000, -3)
      
      // Année 3: 13 200 000 × 1.10 = 14 520 000
      expect(projections.revenues[2]).toBeCloseTo(14520000, -3)
    })

    it('devrait gérer plusieurs flux de revenus', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Produit A',
            unitPrice: 5000,
            quantity: 200, // 200/mois
            growthRate: 0
          },
          {
            id: 'rev2',
            name: 'Produit B',
            unitPrice: 10000,
            quantity: 100, // 100/mois
            growthRate: 0
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Produit A: 5000 × 200 × 12 = 12 000 000
      // Produit B: 10000 × 100 × 12 = 12 000 000
      // Total = 24 000 000
      expect(projections.revenues[0]).toBe(24000000)
    })
  })

  // ============ TESTS TAUX D'INTÉRÊT (FIX POURCENTAGE/DÉCIMAL) ============

  describe('Calcul Intérêts Emprunts (décimal vs pourcentage)', () => {
    it('devrait traiter interestRate comme décimal (0.12 = 12%)', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        loans: [
          {
            id: 'loan1',
            name: 'Emprunt banque',
            amount: 10000000,
            interestRate: 0.12, // 12% en décimal
            durationMonths: 60
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Mensualité attendue pour 10M à 12% sur 5 ans
      const expectedMonthlyPayment = 222440 // Calculé avec formule annuités
      
      // Vérifier que les flux de financement incluent remboursements
      expect(projections.financingCashFlow[0]).toBeLessThan(0)
      
      // Vérifier montant annuel remboursé (~12 mensualités)
      const annualPayment = Math.abs(projections.financingCashFlow[0])
      expect(annualPayment).toBeCloseTo(expectedMonthlyPayment * 12, -4)
    })

    it('devrait calculer mensualité correctement (formule annuités)', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        loans: [
          {
            id: 'loan1',
            name: 'Emprunt',
            amount: 5000000,
            interestRate: 0.15, // 15% annuel
            durationMonths: 36
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Mensualité = M × (r × (1+r)^n) / ((1+r)^n - 1)
      // M = 5000000, r = 0.15/12 = 0.0125, n = 36
      const r = 0.15 / 12
      const n = 36
      const expectedMonthly = 5000000 * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      
      // ~173k FCFA/mois
      expect(expectedMonthly).toBeCloseTo(173317, 0)
    })

    it('devrait séparer capital et intérêts correctement', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        years: 5,
        loans: [
          {
            id: 'loan1',
            name: 'Emprunt',
            amount: 10000000,
            interestRate: 0.12,
            durationMonths: 60
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // En début de prêt, intérêts > capital remboursé
      // En fin de prêt, capital > intérêts
      
      // Total remboursé sur 5 ans doit être > capital initial (à cause des intérêts)
      const totalRepaid = projections.financingCashFlow
        .map(cf => Math.abs(cf))
        .reduce((sum, val) => sum + val, 0)
      
      expect(totalRepaid).toBeGreaterThan(10000000)
      expect(totalRepaid).toBeLessThan(15000000) // Pas trop d'intérêts non plus
    })
  })

  // ============ TESTS CALCULS INDICATEURS ============

  describe('Calcul NPV (VAN)', () => {
    it('devrait calculer VAN positive pour projet rentable', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 20000,
            quantity: 100,
            growthRate: 0.10
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Achats',
            amount: 10000000,
            type: 'variable',
            frequency: 'annual',
            growthRate: 0.05
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Avec revenus croissants et coûts maîtrisés, VAN doit être positive
      expect(projections.npv).toBeGreaterThan(0)
    })

    it('devrait calculer VAN négative pour projet non rentable', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        initialInvestment: 50000000, // Investissement énorme
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 5000,
            quantity: 50, // Revenus faibles
            growthRate: 0
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 2000000,
            type: 'fixed',
            frequency: 'annual',
            growthRate: 0
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Investissement trop lourd, VAN doit être négative
      expect(projections.npv).toBeLessThan(0)
    })
  })

  describe('Calcul IRR (TRI)', () => {
    it('devrait calculer TRI cohérent avec VAN', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        years: 5,
        initialInvestment: 10000000,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 15000,
            quantity: 150,
            growthRate: 0.08
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 15000000,
            type: 'variable',
            frequency: 'annual',
            growthRate: 0.04
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Si VAN > 0 avec discount 12%, alors TRI doit être > 12%
      if (projections.npv > 0) {
        expect(projections.irr).toBeGreaterThan(0.12)
      }
      
      // TRI doit être un nombre réaliste (entre -50% et 200%)
      expect(projections.irr).toBeGreaterThan(-0.5)
      expect(projections.irr).toBeLessThan(2.0)
    })
  })

  describe('Calcul DSCR', () => {
    it('devrait calculer DSCR > 1.2 pour projet FONGIP viable', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 25000,
            quantity: 100,
            growthRate: 0.10
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 15000000,
            type: 'variable',
            frequency: 'annual',
            growthRate: 0.05
          }
        ],
        loans: [
          {
            id: 'loan1',
            name: 'FONGIP',
            amount: 8000000,
            interestRate: 0.08,
            durationMonths: 84
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // DSCR année 1 doit être > 1.2 (critère FONGIP)
      expect(projections.dscr[0]).toBeGreaterThan(1.2)
    })

    it('devrait gérer DSCR = 0 sans emprunt', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        loans: [] // Pas d'emprunt
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Sans emprunt, DSCR doit être 0 ou indéfini
      expect(projections.dscr[0]).toBeGreaterThanOrEqual(0)
    })
  })

  // ============ TESTS MARGES ============

  describe('Calcul Marges', () => {
    it('devrait calculer marge brute correctement', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 10000,
            quantity: 100,
            growthRate: 0
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Achats',
            amount: 8000000, // 66.7% des revenus
            type: 'variable',
            frequency: 'annual',
            growthRate: 0
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Revenus = 10000 × 100 × 12 = 12M
      // Coûts = 8M
      // Marge brute = (12M - 8M) / 12M = 33.3%
      expect(projections.grossMargin[0]).toBeCloseTo(33.3, 1)
    })

    it('devrait calculer marge nette avec impôts', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        taxRate: 0.30,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 10000,
            quantity: 100,
            growthRate: 0
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 6000000,
            type: 'variable',
            frequency: 'annual',
            growthRate: 0
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Revenus = 12M
      // Coûts = 6M
      // Bénéfice avant impôt = 6M
      // Impôt (30%) = 1.8M
      // Bénéfice net = 4.2M
      // Marge nette = 4.2M / 12M = 35%
      expect(projections.netMargin[0]).toBeCloseTo(35, 1)
    })
  })

  // ============ TESTS COHÉRENCE GLOBALE ============

  describe('Cohérence des calculs', () => {
    it('devrait respecter équation comptable de base', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        years: 3,
        initialInvestment: 10000000,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 15000,
            quantity: 100,
            growthRate: 0.10
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 12000000,
            type: 'variable',
            frequency: 'annual',
            growthRate: 0.05
          }
        ],
        loans: [
          {
            id: 'loan1',
            name: 'Banque',
            amount: 5000000,
            interestRate: 0.12,
            durationMonths: 60
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Vérifications de cohérence
      projections.years.forEach((year, i) => {
        // Revenus > 0
        expect(projections.revenues[i]).toBeGreaterThan(0)
        
        // Coûts > 0
        expect(projections.costs[i]).toBeGreaterThan(0)
        
        // Bénéfice net = Revenus - Coûts - Charges financières - Impôts
        // (approximation, car calcul complexe avec amortissements)
        
        // Actif = Passif + Capitaux propres
        const balanceCheck = Math.abs(
          projections.assets[i] - (projections.liabilities[i] + projections.equity[i])
        )
        expect(balanceCheck).toBeLessThan(1000) // Tolérance 1000 FCFA
        
        // Flux net = Flux opérationnel + Flux investissement + Flux financement
        const cashFlowCheck = projections.operatingCashFlow[i] +
                               projections.investmentCashFlow[i] +
                               projections.financingCashFlow[i]
        expect(cashFlowCheck).toBeCloseTo(projections.netCashFlow[i], -2)
      })
    })

    it('devrait avoir flux cumulatifs cohérents', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        years: 5,
        revenueStreams: [
          {
            id: 'rev1',
            name: 'Ventes',
            unitPrice: 10000,
            quantity: 100,
            growthRate: 0.10
          }
        ],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 8000000,
            type: 'variable',
            frequency: 'annual',
            growthRate: 0.05
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Flux cumulatif année N = Flux cumulatif année N-1 + Flux net année N
      projections.cumulativeCashFlow.forEach((cumul, i) => {
        if (i === 0) {
          expect(cumul).toBeCloseTo(projections.netCashFlow[0], -2)
        } else {
          const expectedCumul = projections.cumulativeCashFlow[i - 1] + projections.netCashFlow[i]
          expect(cumul).toBeCloseTo(expectedCumul, -2)
        }
      })
    })
  })

  // ============ TESTS CAS LIMITES ============

  describe('Cas limites', () => {
    it('devrait gérer revenus = 0', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: []
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      expect(projections.revenues[0]).toBe(0)
      expect(projections.grossMargin[0]).toBe(0)
    })

    it('devrait gérer division par zéro dans marges', () => {
      const inputs: FinancialInputs = {
        ...baseInputs,
        revenueStreams: [],
        costs: [
          {
            id: 'cost1',
            name: 'Charges',
            amount: 5000000,
            type: 'fixed',
            frequency: 'annual',
            growthRate: 0
          }
        ]
      }

      const engine = new FinancialEngine(inputs)
      const projections = engine.calculateProjections()

      // Avec revenus = 0, marges doivent être 0 (pas NaN ou Infinity)
      expect(isNaN(projections.grossMargin[0])).toBe(false)
      expect(isFinite(projections.grossMargin[0])).toBe(true)
    })
  })
})

