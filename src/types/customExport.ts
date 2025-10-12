/**
 * Types pour les exports personnalisés (Phase 10)
 *
 * Permet de sauvegarder et gérer les versions éditées du business plan
 */

import { Timestamp } from 'firebase/firestore'

export type TemplateType = 'fongip' | 'banque' | 'pitch' | 'complet' | 'custom'

/**
 * Export personnalisé sauvegardé en Firestore
 *
 * Structure: users/{uid}/projects/{projectId}/customExports/{exportId}
 */
export interface CustomExport {
  id: string
  projectId: string
  userId: string

  // Métadonnées
  name: string // Nom personnalisé (ex: "Export FONGIP - Version finale")
  description?: string // Description optionnelle

  // Configuration export
  template: TemplateType
  colorScheme: 'blue' | 'green' | 'purple'

  // Contenu HTML
  originalHTML: string // HTML généré initialement
  editedHTML: string // HTML après éditions utilisateur
  hasEdits: boolean // true si editedHTML !== originalHTML

  // Sections éditées (granularité fine)
  editedSections?: {
    [sectionId: string]: {
      originalContent: string
      editedContent: string
      editedAt: Timestamp
    }
  }

  // Métadonnées projet (snapshot au moment export)
  projectSnapshot: {
    name: string
    description: string
    sector: string
    location: string
  }

  // Statut
  isDefault: boolean // Export utilisé par défaut
  isPinned: boolean // Épinglé en haut de liste
  isArchived: boolean // Archivé (masqué par défaut)

  // Partage (Phase future)
  isPublic: boolean
  shareToken?: string // Token unique pour partage public

  // Statistiques
  viewCount: number
  downloadCount: number
  printCount: number

  // Dates
  createdAt: Timestamp
  updatedAt: Timestamp
  lastViewedAt?: Timestamp

  // Tags personnalisés
  tags?: string[]

  // Version
  version: number // Incrémenté à chaque sauvegarde
}

/**
 * Données pour créer un nouvel export
 */
export interface CreateCustomExportInput {
  projectId: string
  userId: string
  name: string
  description?: string
  template: TemplateType
  colorScheme: 'blue' | 'green' | 'purple'
  originalHTML: string
  editedHTML: string
  projectSnapshot: {
    name: string
    description: string
    sector: string
    location: string
  }
  tags?: string[]
}

/**
 * Données pour mettre à jour un export
 */
export interface UpdateCustomExportInput {
  name?: string
  description?: string
  editedHTML?: string
  isDefault?: boolean
  isPinned?: boolean
  isArchived?: boolean
  tags?: string[]
}

/**
 * Filtres pour recherche exports
 */
export interface CustomExportFilters {
  template?: TemplateType
  isDefault?: boolean
  isPinned?: boolean
  isArchived?: boolean
  tags?: string[]
  searchQuery?: string // Recherche dans nom/description
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Statistiques exports utilisateur
 */
export interface CustomExportStats {
  totalExports: number
  totalEdited: number // Exports avec éditions
  totalViews: number
  totalDownloads: number
  totalPrints: number
  templateBreakdown: {
    fongip: number
    banque: number
    pitch: number
    complet: number
    custom: number
  }
  recentExports: CustomExport[] // 5 derniers
  mostViewed: CustomExport[] // 5 plus vus
}

/**
 * Action historique sur export
 */
export interface ExportHistoryAction {
  id: string
  exportId: string
  action: 'created' | 'updated' | 'viewed' | 'downloaded' | 'printed' | 'shared' | 'archived' | 'deleted'
  timestamp: Timestamp
  metadata?: {
    changedFields?: string[]
    downloadFormat?: 'html' | 'pdf'
    sharedWith?: string
  }
}
