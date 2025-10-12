/**
 * Schémas de validation Zod pour les API routes
 */

import { z } from 'zod'
import { BusinessSector, ProjectType } from '@/types/project'

// ========== SCHÉMAS COMMUNS ==========

export const projectIdSchema = z.string().min(1, 'Project ID requis')

export const userIdSchema = z.string().min(1, 'User ID requis')

export const fileSchema = z.instanceof(File, { message: 'Fichier requis' })
  .refine(file => file.size <= 10 * 1024 * 1024, 'Fichier trop volumineux (max 10MB)')

// ========== API AI ==========

export const businessPlanTextSchema = z.object({
  businessPlanText: z.string()
    .min(100, 'Le business plan doit contenir au moins 100 caractères')
    .max(50000, 'Le business plan ne peut pas dépasser 50000 caractères'),
  mode: z.enum(['quick', 'comprehensive']).optional().default('quick')
})

export const documentAnalysisSchema = z.object({
  documentText: z.string().min(10, 'Document trop court'),
  fileName: z.string().min(1, 'Nom de fichier requis')
})

export const marketAnalysisSchema = z.object({
  sector: z.nativeEnum(BusinessSector, { errorMap: () => ({ message: 'Secteur invalide' }) }),
  location: z.string().min(2, 'Localisation requise'),
  projectType: z.nativeEnum(ProjectType).optional()
})

export const swotAnalysisSchema = z.object({
  sector: z.nativeEnum(BusinessSector),
  projectDescription: z.string().min(20, 'Description trop courte'),
  currentData: z.record(z.unknown()).optional()
})

export const contentGenerationSchema = z.object({
  section: z.string().min(1, 'Section requise'),
  context: z.record(z.unknown()).optional(),
  tone: z.enum(['professional', 'friendly', 'formal']).optional()
})

// ========== DOCUMENTS ==========

export const documentProcessSchema = z.object({
  file: z.any(), // Validé séparément (FormData)
  projectId: projectIdSchema,
  userId: userIdSchema
})

// ========== HELPERS ==========

/**
 * Valide une requête avec un schéma Zod
 * Retourne les données validées ou lance une erreur
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Valide FormData
 */
export function validateFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): T {
  const data = Object.fromEntries(formData.entries())
  return schema.parse(data)
}

/**
 * Crée une réponse d'erreur de validation
 */
export function validationErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      error: 'Validation failed',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    }
  }

  return {
    error: error instanceof Error ? error.message : 'Validation error'
  }
}

