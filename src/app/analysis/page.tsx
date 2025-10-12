'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import { analysisService } from '@/services/analysisService'
import { ProjectAnalysis } from '@/types/analysis'
import Link from 'next/link'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function AnalysisListPage() {
  const { user, userProfile } = useAuth()
  const [analyses, setAnalyses] = useState<ProjectAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, archived: 0 })

  useEffect(() => {
    if (user) {
      loadAnalyses()
      loadStats()
    }
  }, [user, showArchived])

  const loadAnalyses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await analysisService.getUserAnalyses(user.uid, showArchived)
      setAnalyses(data)
    } catch (error) {
      console.error('Erreur chargement analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const statsData = await analysisService.getAnalystStats(user.uid)
      setStats(statsData)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleArchive = async (analysisId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver cette analyse ?')) return

    try {
      await analysisService.archiveAnalysis(analysisId)
      loadAnalyses()
      loadStats()
    } catch (error) {
      console.error('Erreur archivage:', error)
      alert('Erreur lors de l\'archivage')
    }
  }

  const handleDelete = async (analysisId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette analyse ? Cette action est irréversible.')) return

    try {
      await analysisService.deleteAnalysis(analysisId)
      loadAnalyses()
      loadStats()
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: ProjectAnalysis['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
            <CheckCircleIcon className="w-3 h-3" />
            <span>Terminé</span>
          </span>
        )
      case 'processing':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center space-x-1">
            <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
            <span>En cours</span>
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center space-x-1">
            <ClockIcon className="w-3 h-3" />
            <span>En attente</span>
          </span>
        )
      case 'archived':
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium flex items-center space-x-1">
            <ArchiveBoxIcon className="w-3 h-3" />
            <span>Archivé</span>
          </span>
        )
      case 'error':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center space-x-1">
            <ExclamationTriangleIcon className="w-3 h-3" />
            <span>Erreur</span>
          </span>
        )
    }
  }

  // Vérifier les permissions
  if (userProfile && userProfile.role !== UserRole.ADMIN && userProfile.role !== UserRole.FINANCIAL_ANALYST) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h1>
          <p className="text-slate-600 mb-6">Vous n'avez pas les permissions pour accéder à cette fonctionnalité.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Mes Analyses</h1>
                <p className="text-slate-600 mt-1">Gérez vos analyses de crédit</p>
              </div>
            </div>
            <Link
              href="/analysis/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nouvelle analyse
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Terminées</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Archivées</p>
                <p className="text-3xl font-bold text-slate-600">{stats.archived}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <ArchiveBoxIcon className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une analyse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Afficher les archivées</span>
            </label>
          </div>
        </div>

        {/* Liste des analyses */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : filteredAnalyses.length > 0 ? (
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="group bg-slate-50/50 border border-slate-200 rounded-xl p-6 hover:bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{analysis.projectName}</h3>
                        {getStatusBadge(analysis.status)}
                      </div>
                      {analysis.description && (
                        <p className="text-slate-600 mb-3">{analysis.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>📄 {analysis.uploadedDocuments.length} document(s)</span>
                        <span>•</span>
                        <span>Créé le {analysis.createdAt.toLocaleDateString('fr-FR')}</span>
                        {analysis.aiAnalysis && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-blue-600">
                              Décision: {analysis.aiAnalysis.decision}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {analysis.status === 'completed' && (
                        <Link
                          href={`/analysis/${analysis.id}`}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Voir l'analyse"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                      )}

                      {analysis.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(analysis.id)}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Archiver"
                        >
                          <ArchiveBoxIcon className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(analysis.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune analyse</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery ? 'Aucun résultat pour cette recherche' : 'Commencez par créer votre première analyse'}
              </p>
              {!searchQuery && (
                <Link
                  href="/analysis/new"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Créer ma première analyse
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}