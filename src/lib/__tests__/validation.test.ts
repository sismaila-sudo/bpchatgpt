/**
 * Tests unitaires pour la validation Zod
 */

import { z } from 'zod'
import {
  businessPlanTextSchema,
  marketAnalysisSchema,
  validationErrorResponse
} from '../validation'
import { BusinessSector, ProjectType } from '@/types/project'

describe('Validation Schemas', () => {
  describe('businessPlanTextSchema', () => {
    it('should validate correct business plan text', () => {
      const validData = {
        businessPlanText: 'A'.repeat(200), // 200 caractères
        mode: 'quick' as const
      }

      const result = businessPlanTextSchema.parse(validData)
      expect(result.businessPlanText).toBe(validData.businessPlanText)
      expect(result.mode).toBe('quick')
    })

    it('should reject too short text', () => {
      const invalidData = {
        businessPlanText: 'Too short',
        mode: 'quick' as const
      }

      expect(() => businessPlanTextSchema.parse(invalidData)).toThrow()
    })

    it('should reject too long text', () => {
      const invalidData = {
        businessPlanText: 'A'.repeat(60000), // > 50000
        mode: 'quick' as const
      }

      expect(() => businessPlanTextSchema.parse(invalidData)).toThrow()
    })

    it('should use default mode', () => {
      const data = {
        businessPlanText: 'A'.repeat(200)
      }

      const result = businessPlanTextSchema.parse(data)
      expect(result.mode).toBe('quick')
    })
  })

  describe('marketAnalysisSchema', () => {
    it('should validate correct market analysis data', () => {
      const validData = {
        sector: BusinessSector.AGRICULTURE,
        location: 'Dakar',
        projectType: ProjectType.CREATION
      }

      const result = marketAnalysisSchema.parse(validData)
      expect(result.sector).toBe(BusinessSector.AGRICULTURE)
      expect(result.location).toBe('Dakar')
    })

    it('should reject invalid sector', () => {
      const invalidData = {
        sector: 'INVALID_SECTOR',
        location: 'Dakar'
      }

      expect(() => marketAnalysisSchema.parse(invalidData)).toThrow()
    })

    it('should reject missing location', () => {
      const invalidData = {
        sector: BusinessSector.COMMERCE_DETAIL,
        location: ''
      }

      expect(() => marketAnalysisSchema.parse(invalidData)).toThrow()
    })
  })

  describe('validationErrorResponse', () => {
    it('should format Zod errors correctly', () => {
      try {
        businessPlanTextSchema.parse({ businessPlanText: 'short' })
      } catch (error) {
        const response = validationErrorResponse(error)
        expect(response.error).toBe('Validation failed')
        expect(response.details).toBeInstanceOf(Array)
      }
    })

    it('should handle generic errors', () => {
      const error = new Error('Generic error')
      const response = validationErrorResponse(error)
      expect(response.error).toBe('Generic error')
    })
  })
})

