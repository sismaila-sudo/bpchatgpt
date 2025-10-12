/**
 * Tests unitaires pour le module de validation métier
 * Tests de base pour vérifier le bon fonctionnement
 */

import {
  validateFinancialProjections,
  validateFONGIPEligibility,
  validateDataConsistency
} from '../businessValidation'
import { FinancialProjections } from '@/types/financial'

describe('Business Validation Module', () => {
  
  // Projections valides pour tests
  const validProjections: FinancialProjections = {
    years: [2025, 2026, 2027],
    revenues: [15000000, 18000000, 21000000],
    costs: [10000000, 11000000, 12000000],
    netProfit: [3500000, 4900000, 6300000],
    operatingCashFlow: [4000000, 5400000, 6800000],
    investmentCashFlow: [-8000000, -500000, -500000],
    financingCashFlow: [5000000, 0, 0],
    netCashFlow: [1000000, 4900000, 6300000],
    cumulativeCashFlow: [1000000, 5900000, 12200000],
    roe: [35, 40, 42],
    roce: [28, 32, 35],
    dscr: [1.8, 2.2, 2.5],
    grossMargin: [33, 39, 43],
    netMargin: [23, 27, 30],
    breakEvenPoint: 2.1,
    assets: [12000000, 13500000, 15000000],
    liabilities: [7000000, 6000000, 5000000],
    equity: [5000000, 7500000, 10000000],
    npv: 8500000,
    irr: 0.28,
    paybackPeriod: 2.3,
    loans: []
  }

  describe('validateFinancialProjections', () => {
    it('devrait retourner un résultat valide pour des projections cohérentes', () => {
      const result = validateFinancialProjections(validProjections)

      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('infos')
      
      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThan(70)
    })

    it('devrait détecter une VAN négative', () => {
      const projections = {
        ...validProjections,
        npv: -2000000
      }

      const result = validateFinancialProjections(projections)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('devrait détecter un DSCR insuffisant', () => {
      const projections = {
        ...validProjections,
        dscr: [0.9, 1.0, 1.1]
      }

      const result = validateFinancialProjections(projections)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateFONGIPEligibility', () => {
    it('devrait valider un projet éligible FONGIP', () => {
      const result = validateFONGIPEligibility(validProjections)

      expect(result).toHaveProperty('isValid')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('devrait rejeter autonomie financière < 30%', () => {
      const projections = {
        ...validProjections,
        assets: [10000000, 11000000, 12000000],
        liabilities: [8000000, 8500000, 9000000],
        equity: [2000000, 2500000, 3000000] // 20%
      }

      const result = validateFONGIPEligibility(projections)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('devrait rejeter DSCR < 1.2', () => {
      const projections = {
        ...validProjections,
        dscr: [1.0, 1.1, 1.15]
      }

      const result = validateFONGIPEligibility(projections)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateDataConsistency', () => {
    it('devrait valider des données cohérentes', () => {
      const result = validateDataConsistency(validProjections)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('devrait détecter valeurs négatives invalides', () => {
      const projections = {
        ...validProjections,
        revenues: [-5000000, 18000000, 21000000]
      }

      const result = validateDataConsistency(projections)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('devrait détecter flux cumulatifs incohérents', () => {
      const projections = {
        ...validProjections,
        netCashFlow: [1000000, 2000000, 3000000],
        cumulativeCashFlow: [1000000, 2000000, 4000000] // Incohérent
      }

      const result = validateDataConsistency(projections)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Calcul de score', () => {
    it('devrait calculer un score élevé pour un excellent projet', () => {
      const excellentProjections = {
        ...validProjections,
        roe: [40, 45, 50],
        roce: [35, 38, 42],
        dscr: [2.5, 3.0, 3.5],
        grossMargin: [45, 48, 50],
        netMargin: [30, 32, 35],
        irr: 0.35,
        npv: 15000000
      }

      const result = validateFinancialProjections(excellentProjections)

      expect(result.score).toBeGreaterThan(80)
      expect(result.isValid).toBe(true)
    })

    it('devrait calculer un score faible pour un projet à risque', () => {
      const riskyProjections = {
        ...validProjections,
        roe: [10, 11, 12],
        roce: [8, 9, 10],
        dscr: [1.2, 1.3, 1.4],
        grossMargin: [18, 19, 20],
        netMargin: [6, 7, 8],
        irr: 0.10,
        npv: 1000000
      }

      const result = validateFinancialProjections(riskyProjections)

      expect(result.score).toBeLessThan(90)
    })
  })
})
