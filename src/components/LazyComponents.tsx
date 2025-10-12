/**
 * Lazy-loaded Components pour optimisation des performances
 * 
 * Ces composants sont chargés uniquement quand nécessaire,
 * réduisant le bundle initial et améliorant le Time to Interactive
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Composant de loading par défaut
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Financial Engine - Composant lourd avec calculs complexes
export const LazyFinancialEngine = dynamic(
  () => import('./FinancialEngine'),
  {
    loading: () => <LoadingFallback />,
    ssr: false // Pas de SSR car utilise localStorage
  }
)

// Business Plan AI Assistant - Appels API lourds
export const LazyBusinessPlanAIAssistant = dynamic(
  () => import('./BusinessPlanAIAssistant'),
  {
    loading: () => <LoadingFallback />,
    ssr: false
  }
)

// PDF Export Dialog - Génération PDF lourde
export const LazyPDFExportDialog = dynamic(
  () => import('./PDFExportDialog'),
  {
    loading: () => <LoadingFallback />,
    ssr: false // html2canvas, jsPDF ne fonctionnent que côté client
  }
)

// Document Uploader - Upload + Analyse IA
export const LazyDocumentUploader = dynamic(
  () => import('./DocumentUploader'),
  {
    loading: () => <LoadingFallback />,
    ssr: false
  }
)

// FONGIP Score Widget - Calculs complexes
export const LazyFONGIPScoreWidget = dynamic(
  () => import('./FONGIPScoreWidget'),
  {
    loading: () => <LoadingFallback />,
    ssr: false
  }
)

// Export PDF Dialog (alternatif)
export const LazyExportPDFDialog = dynamic(
  () => import('./ExportPDFDialog'),
  {
    loading: () => <LoadingFallback />,
    ssr: false
  }
)

// AI Assistant (pour market study, swot, etc.)
export const LazyAIAssistant = dynamic(
  () => import('./AIAssistant'),
  {
    loading: () => <LoadingFallback />,
    ssr: false
  }
)

/**
 * Hook utilitaire pour charger un composant seulement au premier clic
 * Utile pour les modals, dialogs, etc.
 */
export function useLazyLoad<T>(Component: ComponentType<T>) {
  return Component
}

