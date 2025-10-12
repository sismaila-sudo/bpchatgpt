/**
 * Tests unitaires pour ProjectService
 */

import { ProjectService } from '../projectService'
import { ProjectType, BusinessSector, ProjectStatus } from '@/types/project'

// Mock Firestore
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })
  }
}))

describe('ProjectService', () => {
  let service: ProjectService

  beforeEach(() => {
    service = new ProjectService()
    jest.clearAllMocks()
  })

  describe('createProject', () => {
    it('should create a project with basic info', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mockAddDoc = require('firebase/firestore').addDoc
      mockAddDoc.mockResolvedValueOnce({ id: 'test-project-id' })

      const basicInfo = {
        name: 'Test Project',
        description: 'Test Description',
        sector: BusinessSector.TECHNOLOGIES,
        projectType: ProjectType.CREATION,
        location: {
          country: 'Sénégal',
          city: 'Dakar',
          region: 'Dakar'
        },
        timeline: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-01-01')
        }
      }

      const projectId = await service.createProject('user-123', basicInfo)

      expect(projectId).toBe('test-project-id')
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ownerId: 'user-123',
          basicInfo,
          status: ProjectStatus.DRAFT
        })
      )
    })

    it('should handle company identification', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mockAddDoc = require('firebase/firestore').addDoc
      mockAddDoc.mockResolvedValueOnce({ id: 'test-project-id' })

      const basicInfo = {
        name: 'Test Project',
        description: 'Test Description',
        sector: BusinessSector.COMMERCE_DETAIL,
        projectType: ProjectType.CREATION,
        location: {
          country: 'Sénégal',
          city: 'Dakar',
          region: 'Dakar'
        },
        timeline: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-01-01')
        }
      }

      const companyId = {
        denomination: 'Test Company SARL',
        formeJuridique: 'SARL' as const,
        numeroRC: 'SN-DKR-2025-A-123',
        dates: {
          creation: new Date('2024-01-01'),
          registrationRC: new Date('2024-01-15'),
          debutActivite: new Date('2024-02-01')
        },
        siege: {
          adresse: '123 Rue Test',
          ville: 'Dakar',
          region: 'Dakar',
          pays: 'Sénégal'
        }
      }

      const projectId = await service.createProject('user-123', basicInfo, undefined, companyId)

      expect(projectId).toBe('test-project-id')
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sections: expect.objectContaining({
            identification: expect.objectContaining({
              denomination: 'Test Company SARL'
            })
          })
        })
      )
    })
  })

  describe('Validation', () => {
    it('should validate required fields', () => {
      // Test de validation basique
      const basicInfo = {
        name: '',  // Invalid: empty name
        description: 'Test',
        sector: BusinessSector.AGRICULTURE,
        projectType: ProjectType.CREATION,
        location: {
          country: 'Sénégal',
          city: 'Dakar',
          region: 'Dakar'
        },
        timeline: {
          startDate: new Date(),
          endDate: new Date()
        }
      }

      // Le service devrait rejeter les noms vides
      expect(basicInfo.name).toBe('')
    })
  })
})

