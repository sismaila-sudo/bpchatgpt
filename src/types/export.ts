/**
 * Types pour le système d'export de business plans
 */

import { Project } from './project'

export type InstitutionType = 'FAISE' | 'FONGIP' | 'BANK' | 'CUSTOM'

export type SectionType =
  | 'cover'
  | 'toc'
  | 'synopsis'
  | 'identification'
  | 'market'
  | 'swot'
  | 'marketing'
  | 'hr'
  | 'financial'
  | 'appendix'

export type ImagePosition = 'cover' | 'header' | 'inline' | 'appendix'

export type ImageType = 'logo' | 'photo' | 'chart' | 'diagram'

/**
 * Template d'export pour une institution
 */
export interface ExportTemplate {
  id: string
  name: string
  description: string
  institution: InstitutionType

  // Styling
  styles: TemplateStyles

  // Structure du document
  requiredSections: SectionType[]
  optionalSections: SectionType[]
  sectionOrder: SectionType[]
  pageBreaks: SectionType[]

  // Images
  allowImages: boolean
  maxImagesPerSection: number
  logoPosition?: ImagePosition
  headerImage?: string

  // Métadonnées
  createdAt?: Date
  updatedAt?: Date
  isCustom?: boolean
}

/**
 * Styles du template
 */
export interface TemplateStyles {
  // Couleurs
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  textColor: string
  backgroundColor: string

  // Police
  font: string
  fontSizeTitle: number
  fontSizeHeading: number
  fontSizeBody: number

  // Marges et espacements
  pageMargins: {
    top: number
    right: number
    bottom: number
    left: number
  }

  // Header & Footer
  headerImage?: string
  footerText: string
  showPageNumbers: boolean
  showDate: boolean

  // Bordures et arrondis
  borderRadius: number
  borderColor: string
}

/**
 * Section d'export
 */
export interface ExportSection {
  id: string
  title: string
  type: SectionType

  // Données
  content: any
  images?: ExportImage[]

  // Configuration
  included: boolean
  editable: boolean
  pageNumber?: number
  order: number

  // Statut
  completed: boolean
  lastUpdated: Date

  // Metadata
  wordCount?: number
  characterCount?: number
}

/**
 * Image pour l'export
 */
export interface ExportImage {
  id: string
  url: string
  type: ImageType
  position: ImagePosition
  section?: string

  // Métadonnées
  caption?: string
  alt?: string
  width?: number
  height?: number
  size?: number

  // Upload info
  uploadedAt: Date
  uploadedBy?: string
}

/**
 * Configuration d'export complète
 */
export interface ExportConfig {
  id: string
  projectId: string

  // Template
  template: ExportTemplate

  // Sections
  sections: ExportSection[]

  // Images
  images: ExportImage[]

  // Métadonnées
  metadata: ExportMetadata

  // Statut
  status: 'draft' | 'ready' | 'exporting' | 'completed'

  // Dates
  createdAt: Date
  updatedAt: Date
  lastExportedAt?: Date
}

/**
 * Métadonnées de l'export
 */
export interface ExportMetadata {
  // Document
  title: string
  subtitle?: string
  author: string
  version: string

  // Projet
  projectName: string
  sector: string
  location: string

  // Dates
  date: Date
  projectStartDate?: Date

  // Informations additionnelles
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'secret'
  language: string
  totalPages?: number

  // Branding
  companyName?: string
  companyLogo?: string
  companyWebsite?: string
}

/**
 * Options d'export PDF
 */
export interface PDFExportOptions {
  // Format
  format: 'a4' | 'letter'
  orientation: 'portrait' | 'landscape'

  // Qualité
  quality: 'draft' | 'normal' | 'high'
  dpi: number

  // Compression
  compress: boolean

  // Sécurité
  password?: string
  permissions?: PDFPermissions

  // Watermark
  watermark?: {
    text: string
    opacity: number
    rotation: number
  }
}

/**
 * Permissions PDF
 */
export interface PDFPermissions {
  printing: boolean
  modifying: boolean
  copying: boolean
  annotating: boolean
}

/**
 * Résultat de l'export
 */
export interface ExportResult {
  success: boolean
  blob?: Blob
  url?: string
  filename: string
  size?: number
  error?: string
  exportedAt: Date
  duration?: number
}

/**
 * Section parsée depuis le projet
 */
export interface ParsedSection {
  type: SectionType
  title: string
  content: any
  completed: boolean
  lastUpdated: Date
}

/**
 * Statistiques d'export
 */
export interface ExportStats {
  totalSections: number
  completedSections: number
  totalWords: number
  totalCharacters: number
  totalImages: number
  estimatedPages: number
  completionPercentage: number
}

/**
 * Template personnalisé utilisateur
 */
export interface CustomTemplate extends Omit<ExportTemplate, 'id' | 'institution'> {
  userId: string
  organizationId?: string
  isPublic: boolean
  usageCount: number
}

/**
 * Historique d'export
 */
export interface ExportHistory {
  id: string
  projectId: string
  configId: string
  templateId: string

  // Résultat
  success: boolean
  filename: string
  fileSize?: number
  downloadUrl?: string

  // Métadonnées
  exportedBy: string
  exportedAt: Date
  format: string
  sections: string[]

  // Stats
  duration: number
  pageCount?: number
}
