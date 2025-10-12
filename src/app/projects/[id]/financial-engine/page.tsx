'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { LazyFinancialEngine as FinancialEngineComponent } from '@/components/LazyComponents'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import ValidationWidget from '@/components/ValidationWidget'
import { validateFinancialProjections } from '@/lib/businessValidation'
import { FinancialProjections } from '@/services/financialEngine'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalculatorIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function FinancialEnginePage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projections, setProjections] = useState<FinancialProjections | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const projectId = params.id as string

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

  // ⚠️ Écouter les projections calculées (READ-ONLY)
  useEffect(() => {
    const handleProjectionsUpdated = (event: any) => {
      console.log('📥 Événement projectionsCalculated reçu:', event.detail)
      if (event.detail?.projections) {
        setProjections(event.detail.projections)
        console.log('✅ Projections mises à jour dans la page')
      }
    }

    window.addEventListener('projectionsCalculated', handleProjectionsUpdated)
    return () => {
      window.removeEventListener('projectionsCalculated', handleProjectionsUpdated)
    }
  }, [])

  // Gérer les états de chargement des boutons
  useEffect(() => {
    const handleRecalcStart = () => { setIsRecalculating(true); setTimeout(() => setIsRecalculating(false), 1000) }
    const handleSaveStart = () => { setIsSaving(true); setTimeout(() => setIsSaving(false), 1000) }
    const handleExportStart = () => { setIsExporting(true); setTimeout(() => setIsExporting(false), 2000) }
    const handleGenerateStart = () => { setIsGenerating(true); setTimeout(() => setIsGenerating(false), 1500) }

    window.addEventListener('recalculateFinancialEngine', handleRecalcStart)
    window.addEventListener('saveFinancialEngine', handleSaveStart)
    window.addEventListener('exportFinancialToTables', handleExportStart)
    window.addEventListener('generateFinancialNarrative', handleGenerateStart)

    return () => {
      window.removeEventListener('recalculateFinancialEngine', handleRecalcStart)
      window.removeEventListener('saveFinancialEngine', handleSaveStart)
      window.removeEventListener('exportFinancialToTables', handleExportStart)
      window.removeEventListener('generateFinancialNarrative', handleGenerateStart)
    }
  }, [])

  const loadProject = async () => {
    if (!user || !projectId) return

    setLoading(true)
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      if (projectData) {
        setProject(projectData)
      } else {
        setError('Projet introuvable')
      }
    } catch (err) {
      console.error('Erreur lors du chargement du projet:', err)
      setError('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFinancialData = async (financialInputs: any) => {
    if (!user || !projectId) return

    try {
      // Sauvegarder la section dédiée du moteur financier
      await projectService.updateProjectSection(
        projectId,
        user.uid,
        'financialEngine',
        financialInputs as Record<string, unknown>
      )

      console.log('Moteur financier sauvegardé avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du moteur financier:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Chargement du moteur financier...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Accès restreint</h2>
          <p className="text-slate-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{error}</h2>
          <Link
            href="/projects"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  const actions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => window.dispatchEvent(new Event('recalculateFinancialEngine'))}
        disabled={isRecalculating}
        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
          isRecalculating 
            ? 'bg-blue-400 cursor-not-allowed scale-95' 
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
        } text-white font-medium shadow-md hover:shadow-lg`}
      >
        {isRecalculating && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isRecalculating ? 'Calcul...' : 'Recalculer'}
      </button>
      <button
        onClick={() => window.dispatchEvent(new Event('saveFinancialEngine'))}
        disabled={isSaving}
        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
          isSaving 
            ? 'bg-green-400 cursor-not-allowed scale-95' 
            : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
        } text-white font-medium shadow-md hover:shadow-lg`}
      >
        {isSaving && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
      <button
        onClick={() => window.dispatchEvent(new Event('exportFinancialToTables'))}
        disabled={isExporting}
        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
          isExporting 
            ? 'bg-amber-400 cursor-not-allowed scale-95' 
            : 'bg-amber-600 hover:bg-amber-700 hover:scale-105 active:scale-95'
        } text-white font-medium shadow-md hover:shadow-lg`}
      >
        {isExporting && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isExporting ? 'Export...' : 'Exporter vers Tableaux'}
      </button>
      <button
        onClick={() => window.dispatchEvent(new Event('generateFinancialNarrative'))}
        disabled={isGenerating}
        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
          isGenerating 
            ? 'bg-purple-400 cursor-not-allowed scale-95' 
            : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 active:scale-95'
        } text-white font-medium shadow-md hover:shadow-lg`}
      >
        {isGenerating && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isGenerating ? 'Génération...' : 'Générer texte BP'}
      </button>
    </div>
  )

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project.basicInfo.name}
      title="Projections Financières"
      subtitle="Moteur financier avancé (paramètres Sénégal)"
      actions={actions}
      project={project}
      currentSection="financial_engine"
    >
      {/* Introduction courte */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <p className="text-slate-600">
          Saisissez vos flux, coûts, investissements et paramètres. Calculez et sauvegardez vos projections.
        </p>
      </div>

      {/* Composant Financial Engine */}
      <FinancialEngineComponent
        projectId={projectId}
        onSave={handleSaveFinancialData}
      />

      {/* Widget de validation (READ-ONLY) */}
      {projections && (
        <div className="mt-8">
          <ValidationWidget
            validationResult={validateFinancialProjections(projections)}
            title="Validation Cohérence Financière"
            className="animate-in fade-in duration-500"
          />
        </div>
      )}

      {/* Note explicative */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mt-8">
        <div className="flex items-start">
          <CalculatorIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Paramètres Économiques Sénégalais
            </h3>
            <div className="text-blue-800 text-sm space-y-3">
              <p>
                Ce moteur financier utilise des paramètres spécifiquement adaptés
                au contexte économique et réglementaire du Sénégal :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Taux d'imposition corporatif :</span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux d'intérêt bancaire moyen :</span>
                    <span className="font-medium">12%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Taux d'inflation :</span>
                    <span className="font-medium">3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Charges sociales :</span>
                    <span className="font-medium">24%</span>
                  </div>
                </div>
              </div>
              <p className="mt-4">
                Les calculs incluent projections de revenus, coûts, flux de trésorerie,
                ratios financiers et indicateurs de rentabilité conformes aux standards
                bancaires sénégalais pour l'évaluation des business plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModernProjectLayout>
  )
}