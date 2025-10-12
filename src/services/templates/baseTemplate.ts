/**
 * Template de base pour les exports de business plans
 */

import { ExportTemplate, TemplateStyles } from '@/types/export'

export const BASE_STYLES: TemplateStyles = {
  // Couleurs
  primaryColor: '#2563eb',      // Bleu
  secondaryColor: '#10b981',     // Vert
  accentColor: '#8b5cf6',        // Violet
  textColor: '#1f2937',          // Gris foncé
  backgroundColor: '#ffffff',     // Blanc

  // Police
  font: 'Inter, system-ui, -apple-system, sans-serif',
  fontSizeTitle: 32,
  fontSizeHeading: 18,
  fontSizeBody: 11,

  // Marges (en mm)
  pageMargins: {
    top: 25,
    right: 20,
    bottom: 25,
    left: 20
  },

  // Header & Footer
  footerText: 'Document généré par BP Design Pro - www.bpdesignpro.sn',
  showPageNumbers: true,
  showDate: true,

  // Bordures
  borderRadius: 4,
  borderColor: '#e5e7eb'
}

export const BASE_TEMPLATE: ExportTemplate = {
  id: 'base',
  name: 'Template Standard',
  description: 'Template de base pour tous types de business plans',
  institution: 'CUSTOM',

  styles: BASE_STYLES,

  requiredSections: [
    'cover',
    'toc',
    'synopsis'
  ],

  optionalSections: [
    'identification',
    'market',
    'swot',
    'marketing',
    'hr',
    'financial',
    'appendix'
  ],

  sectionOrder: [
    'cover',
    'toc',
    'synopsis',
    'identification',
    'market',
    'swot',
    'marketing',
    'hr',
    'financial',
    'appendix'
  ],

  pageBreaks: [
    'cover',
    'toc',
    'synopsis',
    'market',
    'financial'
  ],

  allowImages: true,
  maxImagesPerSection: 5,
  logoPosition: 'cover'
}

/**
 * Fonction utilitaire pour créer un template personnalisé
 */
export function createCustomTemplate(
  overrides: Partial<ExportTemplate>
): ExportTemplate {
  return {
    ...BASE_TEMPLATE,
    ...overrides,
    styles: {
      ...BASE_TEMPLATE.styles,
      ...(overrides.styles || {})
    }
  }
}
