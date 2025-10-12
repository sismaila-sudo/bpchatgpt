'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project, ProjectStatus } from '@/types/project'
import { BUSINESS_SECTOR_LABELS } from '@/lib/constants'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import {
  PlusIcon,
  FolderIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  CogIcon,
  TruckIcon,
  AcademicCapIcon,
  HeartIcon,
  HomeIcon,
  BeakerIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

export default function ProjectsPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('🔍 DEBUG: UID utilisateur:', user.uid)
      let projectsData: Project[]

      switch (filterStatus) {
        case 'active':
          projectsData = await projectService.getActiveProjects(user.uid)
          break
        case 'archived':
          projectsData = await projectService.getArchivedProjects(user.uid)
          break
        default:
          projectsData = await projectService.getUserProjects(user.uid)
      }

      console.log('🔍 DEBUG: Projets récupérés:', projectsData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    } finally {
      setLoading(false)
    }
  }, [user, filterStatus])

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user, filterStatus, loadProjects])

  const filteredProjects = projects.filter(project =>
    project.basicInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.basicInfo.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleArchiveProject = async (projectId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir archiver ce projet ?')) return
    
    try {
      await projectService.archiveProject(projectId)
      await loadProjects()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
      alert('Erreur lors de l\'archivage du projet')
    }
  }

  const handleRestoreProject = async (projectId: string) => {
    try {
      await projectService.unarchiveProject(projectId)
      await loadProjects()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Erreur lors de la restauration:', error)
      alert('Erreur lors de la restauration du projet')
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER définitivement le projet "${projectName}" ?\n\nCette action est irréversible !`)) return
    
    try {
      await projectService.deleteProject(projectId)
      await loadProjects()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du projet')
    }
  }

  const getStatusBadge = (status: ProjectStatus) => {
    const statusConfig = {
      [ProjectStatus.DRAFT]: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      [ProjectStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      [ProjectStatus.REVIEW]: { label: 'En révision', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      [ProjectStatus.COMPLETED]: { label: 'Terminé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      [ProjectStatus.ARCHIVED]: { label: 'Archivé', color: 'bg-gray-50 text-gray-500 border-gray-200' },
    }

    const config = statusConfig[status]
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getSectorIcon = (sector: string) => {
    const iconMap: Record<string, any> = {
      'commerce_detail': BuildingStorefrontIcon,
      'commerce_gros': TruckIcon,
      'industrie': CogIcon,
      'services': BeakerIcon,
      'agriculture': HomeIcon,
      'education': AcademicCapIcon,
      'sante': HeartIcon,
    }
    const IconComponent = iconMap[sector] || FolderIcon
    return <IconComponent className="w-5 h-5" />
  }

  // Afficher un spinner pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès restreint</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Mes Projets
              </h1>
              <p className="text-sm text-gray-600">
                Gérez et créez vos business plans professionnels
              </p>
            </div>
            <Link
              href="/projects/new"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Nouveau Projet</span>
            </Link>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FolderIcon className="h-4 w-4 inline mr-2" />
                Actifs
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'archived'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ArchiveBoxIcon className="h-4 w-4 inline mr-2" />
                Archivés
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Tous
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm
                ? 'Essayez avec des mots-clés différents'
                : 'Commencez par créer votre premier business plan'}
            </p>
            {!searchTerm && (
              <Link
                href="/projects/new"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Créer mon premier projet</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id} 
                className="group bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
                {/* Header avec couleur */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                
                <div className="p-6">
                  {/* Titre et badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          {getSectorIcon(project.basicInfo.sector)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {project.basicInfo.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === project.id ? null : project.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Options"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                      </button>

                      {/* Dropdown menu */}
                      {openMenuId === project.id && (
                        <>
                          {/* Overlay pour fermer */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          
                          {/* Menu */}
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                            <Link
                              href={`/projects/${project.id}/edit`}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <PencilIcon className="w-4 h-4 mr-3 text-gray-400" />
                              Modifier
                            </Link>

                            {project.status === ProjectStatus.ARCHIVED ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRestoreProject(project.id)
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <ArrowPathIcon className="w-4 h-4 mr-3" />
                                Restaurer
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleArchiveProject(project.id)
                                }}
                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <ArchiveBoxIcon className="w-4 h-4 mr-3 text-gray-400" />
                                Archiver
                              </button>
                            )}

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id, project.basicInfo.name)
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4 mr-3" />
                              Supprimer définitivement
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {project.basicInfo.description}
                  </p>

                  {/* Infos */}
                  <div className="space-y-2 mb-5 pb-5 border-b border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {project.basicInfo.location.city}, {project.basicInfo.location.region}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Modifié le {project.updatedAt.toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/projects/${project.id}`}
                    className="block w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-center font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Ouvrir le projet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}