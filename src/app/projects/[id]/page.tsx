'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { BUSINESS_SECTOR_LABELS } from '@/lib/constants'
import { FinancialEngine, FinancialProjections, FinancialInputs } from '@/services/financialEngine'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  ShareIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { LazyPDFExportDialog as PDFExportDialog, LazyBusinessPlanAIAssistant as BusinessPlanAIAssistant, LazyFONGIPScoreWidget as FONGIPScoreWidget } from '@/components/LazyComponents'
import { PageSkeleton } from '@/components/SkeletonLoaders'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPDFDialog, setShowPDFDialog] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [financialProjections, setFinancialProjections] = useState<FinancialProjections | null>(null)

  const projectId = params.id as string

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

  // Écoute de l'événement pour ouvrir l'assistant IA depuis la sidebar
  useEffect(() => {
    const handleOpenAIAssistant = () => {
      setShowAIAssistant(true)
    }

    window.addEventListener('openAIAssistant', handleOpenAIAssistant)

    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
    }
  }, [])

  const loadProject = async () => {
    if (!user || !projectId) return

    setLoading(true)
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      if (projectData) {
        setProject(projectData)
        // Charger les projections financières si elles existent
        loadFinancialProjections(projectData)
      } else {
        setError('Projet introuvable')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error)
      setError('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const loadFinancialProjections = async (project: Project) => {
    try {
      const financialData = await projectService.getFinancialData(projectId, user!.uid)
      if (financialData) {
        const engine = new FinancialEngine(financialData as unknown as FinancialInputs)
        const projections = engine.calculateProjections()
        setFinancialProjections(projections)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projections financières:', error)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Terminé',
          icon: CheckCircleIcon,
          className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          iconColor: 'text-emerald-600'
        }
      case 'in_progress':
        return {
          label: 'En cours',
          icon: ClockIcon,
          className: 'bg-blue-50 text-blue-700 border border-blue-200',
          iconColor: 'text-blue-600'
        }
      case 'review':
        return {
          label: 'En révision',
          icon: ExclamationTriangleIcon,
          className: 'bg-amber-50 text-amber-700 border border-amber-200',
          iconColor: 'text-amber-600'
        }
      default:
        return {
          label: 'Brouillon',
          icon: InformationCircleIcon,
          className: 'bg-gray-50 text-gray-700 border border-gray-200',
          iconColor: 'text-gray-600'
        }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  if (loading) {
    return <PageSkeleton />
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">{error || 'Projet introuvable'}</h2>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(project.status)

  const actions = (
    <>
      <button
        onClick={() => setShowAIAssistant(true)}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Assistant IA</span>
      </button>
      <button
        onClick={() => setShowPDFDialog(true)}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Export PDF</span>
      </button>
      <Link
        href={`/projects/${project.id}/edit`}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <PencilIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Modifier</span>
      </Link>
    </>
  )

  return (
    <>
      <ModernProjectLayout
        projectId={projectId}
        projectName={project.basicInfo.name}
        title="Vue d'ensemble"
        subtitle="Tableau de bord de votre projet"
        actions={actions}
        project={project}
        currentSection="overview"
      >
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Hero Section avec informations principales */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusConfig.className}`}>
                    <statusConfig.icon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                    {statusConfig.label}
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{project.basicInfo.name}</h1>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {project.basicInfo.description}
                </p>
              </div>
              
              <div className="flex sm:flex-col gap-2">
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Aide IA</span>
                </button>
              </div>
            </div>

            {/* Stats en ligne */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <TagIcon className="w-5 h-5 text-blue-200 mb-2" />
                <p className="text-xs text-blue-200">Secteur</p>
                <p className="text-sm font-bold truncate">{BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <RocketLaunchIcon className="w-5 h-5 text-purple-200 mb-2" />
                <p className="text-xs text-purple-200">Type</p>
                <p className="text-sm font-bold truncate">
                  {project.basicInfo.projectType === 'creation' && 'Création'}
                  {project.basicInfo.projectType === 'expansion' && 'Extension'}
                  {project.basicInfo.projectType === 'diversification' && 'Diversification'}
                  {project.basicInfo.projectType === 'reprise' && 'Reprise'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <MapPinIcon className="w-5 h-5 text-blue-200 mb-2" />
                <p className="text-xs text-blue-200">Localisation</p>
                <p className="text-sm font-bold truncate">{project.basicInfo.location.city}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <CalendarIcon className="w-5 h-5 text-purple-200 mb-2" />
                <p className="text-xs text-purple-200">Lancement</p>
                <p className="text-sm font-bold">
                  {new Date(project.basicInfo.timeline.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Actions rapides */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                  Actions rapides
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href={`/projects/${project.id}/fiche-synoptique`}
                    className="group flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-purple-900 truncate">Synopsis</p>
                      <p className="text-xs text-purple-700">Résumé exécutif</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>

                  <Link
                    href={`/projects/${project.id}/market-study`}
                    className="group flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ChartBarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-900 truncate">Étude de marché</p>
                      <p className="text-xs text-green-700">Analyse du marché</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>

                  <Link
                    href={`/projects/${project.id}/swot`}
                    className="group flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-orange-900 truncate">Analyse SWOT</p>
                      <p className="text-xs text-orange-700">Forces & faiblesses</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-orange-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>

                  <Link
                    href={`/projects/${project.id}/export-preview`}
                    className="group flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-900 truncate">Export Preview</p>
                      <p className="text-xs text-blue-700">Voir et imprimer</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>

                  <Link
                    href={`/projects/${project.id}/financial-engine`}
                    className="group flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CurrencyDollarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-900 truncate">Projections Financières</p>
                      <p className="text-xs text-emerald-700">Moteur financier avancé</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Détails du projet</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPinIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase">Localisation complète</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {project.basicInfo.location.city}, {project.basicInfo.location.region}
                      </p>
                      {project.basicInfo.location.address && (
                        <p className="text-xs text-gray-600 mt-1">{project.basicInfo.location.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase">Timeline</p>
                      <p className="text-sm text-gray-900 font-medium">
                        Lancement prévu : {formatDate(new Date(project.basicInfo.timeline.startDate))}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Créé le {formatDate(new Date(project.createdAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase">Dernière mise à jour</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {formatDate(new Date(project.updatedAt))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* FONGIP Score */}
              <FONGIPScoreWidget projectId={projectId} />

              {/* Résumé financier */}
              {financialProjections && (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5" />
                    Indicateurs financiers
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-emerald-100 uppercase">VAN (3 ans)</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(financialProjections.npv)}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-emerald-100 uppercase">TRI</p>
                        <p className="text-xl font-bold">
                          {financialProjections.irr.toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-emerald-100 uppercase">Point mort</p>
                        <p className="text-xl font-bold">
                          {financialProjections.breakEvenPoint}m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prochaines étapes */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Prochaines étapes</h3>
                <div className="space-y-3">
                  <Link
                    href={`/projects/${project.id}/marketing`}
                    className="block p-3 bg-pink-50 rounded-lg border border-pink-200 hover:bg-pink-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MegaphoneIcon className="w-4 h-4 text-pink-600" />
                      <p className="text-sm font-semibold text-pink-900">Stratégie Marketing</p>
                    </div>
                    <p className="text-xs text-pink-700">Définir votre stratégie de communication</p>
                  </Link>

                  <Link
                    href={`/projects/${project.id}/hr`}
                    className="block p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                      <p className="text-sm font-semibold text-indigo-900">Ressources Humaines</p>
                    </div>
                    <p className="text-xs text-indigo-700">Structurer votre équipe</p>
                  </Link>

                  <Link
                    href={`/projects/${project.id}/export`}
                    className="block p-3 bg-teal-50 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownTrayIcon className="w-4 h-4 text-teal-600" />
                      <p className="text-sm font-semibold text-teal-900">Exporter en PDF</p>
                    </div>
                    <p className="text-xs text-teal-700">Générer votre business plan complet</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModernProjectLayout>

      {/* Dialogs */}
      {showPDFDialog && (
        <PDFExportDialog
          project={project}
          isOpen={showPDFDialog}
          onClose={() => setShowPDFDialog(false)}
        />
      )}

      {showAIAssistant && (
        <BusinessPlanAIAssistant
          project={project}
          currentSection="executive_summary"
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onContentGenerated={(content, section) => {
            console.info('[Overview IA] Contenu généré (copier-coller manuel)', {
              section,
              contentLength: content?.length || 0
            })
          }}
          userId={user?.uid}
        />
      )}
    </>
  )
}
