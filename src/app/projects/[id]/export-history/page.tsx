'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

/**
 * 📚 PAGE HISTORIQUE DES EXPORTS - Phase 10
 *
 * Liste et gère tous les exports personnalisés sauvegardés
 * Fonctionnalités :
 * - Liste exports avec filtres
 * - Visualiser export sauvegardé
 * - Renommer / Supprimer
 * - Définir comme default
 * - Épingler / Archiver
 * - Statistiques
 *
 * Route: /projects/[id]/export-history
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import {
  StarIcon as StarSolid,
  ArchiveBoxIcon as ArchiveSolid
} from '@heroicons/react/24/solid'
import { CustomExportService } from '@/services/customExportService'
import { CustomExport, CustomExportStats, TemplateType } from '@/types/customExport'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { PageSkeleton } from '@/components/SkeletonLoaders'
import toast from 'react-hot-toast'

export default function ExportHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  const [exports, setExports] = useState<CustomExport[]>([])
  const [stats, setStats] = useState<CustomExportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTemplate, setFilterTemplate] = useState<TemplateType | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (user) {
      loadExports()
      loadStats()
    }
  }, [user, projectId, filterTemplate, showArchived])

  const loadExports = async () => {
    if (!user) return

    setLoading(true)
    try {
      const filters = {
        template: filterTemplate !== 'all' ? filterTemplate : undefined,
        isArchived: showArchived ? true : false,
        searchQuery,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const
      }

      const data = await CustomExportService.listCustomExports(user.uid, projectId, filters)
      setExports(data)
    } catch (error) {
      console.error('Erreur chargement exports:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const data = await CustomExportService.getExportStats(user.uid, projectId)
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleViewExport = (exportId: string) => {
    router.push(`/projects/${projectId}/export-history/${exportId}`)
  }

  const handleDeleteExport = async (exportId: string, exportName: string) => {
    if (!user) return

    if (!confirm(`Supprimer "${exportName}" ?\nCette action est irréversible.`)) {
      return
    }

    try {
      await CustomExportService.deleteCustomExport(user.uid, projectId, exportId)
      toast.success('Export supprimé')
      loadExports()
      loadStats()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleToggleDefault = async (exportId: string, isDefault: boolean) => {
    if (!user) return

    try {
      if (isDefault) {
        // Retirer default
        await CustomExportService.updateCustomExport(user.uid, projectId, exportId, {
          isDefault: false
        })
        toast.success('Export retiré des favoris')
      } else {
        // Définir comme default
        await CustomExportService.setDefaultExport(user.uid, projectId, exportId)
        toast.success('Export défini comme favori')
      }
      loadExports()
    } catch (error) {
      console.error('Erreur toggle default:', error)
      toast.error('Erreur')
    }
  }

  const handleTogglePin = async (exportId: string, isPinned: boolean) => {
    if (!user) return

    try {
      await CustomExportService.togglePin(user.uid, projectId, exportId, !isPinned)
      toast.success(isPinned ? 'Export désépinglé' : 'Export épinglé')
      loadExports()
    } catch (error) {
      console.error('Erreur toggle pin:', error)
      toast.error('Erreur')
    }
  }

  const handleToggleArchive = async (exportId: string, isArchived: boolean) => {
    if (!user) return

    try {
      await CustomExportService.toggleArchive(user.uid, projectId, exportId, !isArchived)
      toast.success(isArchived ? 'Export désarchivé' : 'Export archivé')
      loadExports()
      loadStats()
    } catch (error) {
      console.error('Erreur toggle archive:', error)
      toast.error('Erreur')
    }
  }

  const handleDuplicate = async (exportId: string, exportName: string) => {
    if (!user) return

    try {
      await CustomExportService.duplicateExport(user.uid, projectId, exportId, `${exportName} (Copie)`)
      toast.success('Export dupliqué')
      loadExports()
      loadStats()
    } catch (error) {
      console.error('Erreur duplication:', error)
      toast.error('Erreur lors de la duplication')
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  const actions = (
    <button
      onClick={() => router.push(`/projects/${projectId}/export-preview`)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Nouvel export
    </button>
  )

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName="Historique des exports"
      title="Historique des exports"
      subtitle="Gérez vos versions sauvegardées du business plan"
      actions={actions}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Total exports"
              value={stats.totalExports}
              color="blue"
            />
            <StatCard
              label="Avec éditions"
              value={stats.totalEdited}
              color="purple"
            />
            <StatCard
              label="Vues totales"
              value={stats.totalViews}
              color="green"
            />
            <StatCard
              label="Téléchargements"
              value={stats.totalDownloads}
              color="orange"
            />
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Recherche */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un export..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadExports()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtre template */}
            <select
              value={filterTemplate}
              onChange={(e) => setFilterTemplate(e.target.value as TemplateType | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les templates</option>
              <option value="fongip">FONGIP</option>
              <option value="banque">Banque</option>
              <option value="pitch">Pitch</option>
              <option value="complet">Complet</option>
            </select>

            {/* Toggle archivés */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showArchived
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showArchived ? 'Masquer archivés' : 'Voir archivés'}
            </button>
          </div>
        </div>

        {/* Liste exports */}
        <div className="space-y-3">
          {exports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArchiveBoxIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun export sauvegardé
                </h3>
                <p className="text-gray-600 mb-6">
                  Créez votre premier export depuis la page Export Preview
                </p>
                <button
                  onClick={() => router.push(`/projects/${projectId}/export-preview`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer un export
                </button>
              </div>
            </div>
          ) : (
            exports.map((exp) => (
              <ExportCard
                key={exp.id}
                export={exp}
                onView={() => handleViewExport(exp.id)}
                onDelete={() => handleDeleteExport(exp.id, exp.name)}
                onToggleDefault={() => handleToggleDefault(exp.id, exp.isDefault)}
                onTogglePin={() => handleTogglePin(exp.id, exp.isPinned)}
                onToggleArchive={() => handleToggleArchive(exp.id, exp.isArchived)}
                onDuplicate={() => handleDuplicate(exp.id, exp.name)}
              />
            ))
          )}
        </div>
      </div>
    </ModernProjectLayout>
  )
}

// ========== COMPOSANT STAT CARD ==========

interface StatCardProps {
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700'
  }

  return (
    <div className={`${colors[color]} rounded-xl p-4`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

// ========== COMPOSANT EXPORT CARD ==========

interface ExportCardProps {
  export: CustomExport
  onView: () => void
  onDelete: () => void
  onToggleDefault: () => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onDuplicate: () => void
}

function ExportCard({
  export: exp,
  onView,
  onDelete,
  onToggleDefault,
  onTogglePin,
  onToggleArchive,
  onDuplicate
}: ExportCardProps) {
  const templateColors = {
    fongip: 'bg-blue-100 text-blue-700',
    banque: 'bg-green-100 text-green-700',
    pitch: 'bg-purple-100 text-purple-700',
    complet: 'bg-indigo-100 text-indigo-700',
    custom: 'bg-gray-100 text-gray-700'
  }

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${
      exp.isPinned
        ? 'border-blue-500 shadow-md'
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">

          {/* Gauche - Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {exp.name}
              </h3>

              {exp.isDefault && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  <StarSolid className="w-3 h-3" />
                  Favori
                </span>
              )}

              {exp.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Épinglé
                </span>
              )}

              {exp.hasEdits && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <PencilIcon className="w-3 h-3" />
                  Édité
                </span>
              )}
            </div>

            {exp.description && (
              <p className="text-sm text-gray-600 mb-3">{exp.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className={`px-2 py-1 rounded-full ${templateColors[exp.template]}`}>
                {exp.template.toUpperCase()}
              </span>
              <span>Créé le {exp.createdAt.toDate().toLocaleDateString('fr-FR')}</span>
              <span>•</span>
              <span>{exp.viewCount} vues</span>
              <span>•</span>
              <span>{exp.downloadCount} téléchargements</span>
              {exp.version > 1 && (
                <>
                  <span>•</span>
                  <span>v{exp.version}</span>
                </>
              )}
            </div>
          </div>

          {/* Droite - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Visualiser"
            >
              <EyeIcon className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleDefault}
              className={`p-2 rounded-lg transition-colors ${
                exp.isDefault
                  ? 'text-yellow-600 hover:bg-yellow-50'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={exp.isDefault ? 'Retirer des favoris' : 'Définir comme favori'}
            >
              {exp.isDefault ? <StarSolid className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={onDuplicate}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Dupliquer"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleArchive}
              className={`p-2 rounded-lg transition-colors ${
                exp.isArchived
                  ? 'text-orange-600 hover:bg-orange-50'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={exp.isArchived ? 'Désarchiver' : 'Archiver'}
            >
              {exp.isArchived ? <ArchiveSolid className="w-5 h-5" /> : <ArchiveBoxIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
