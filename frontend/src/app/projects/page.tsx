'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { projectService, Project } from '@/services/projectService'
import Link from 'next/link'

export default function ProjectsPage() {
  const searchParams = useSearchParams()
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(searchParams.get('filter') === 'archived')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    setShowArchived(searchParams.get('filter') === 'archived')
  }, [searchParams])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const [active, archived] = await Promise.all([
        projectService.getActiveProjects(),
        projectService.getArchivedProjects()
      ])
      setActiveProjects(active)
      setArchivedProjects(archived)
    } catch (err) {
      setError('Erreur lors du chargement des projets')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      await projectService.archiveProject(projectId)
      await loadProjects()
    } catch (err) {
      setError('Erreur lors de l\'archivage du projet')
      console.error(err)
    }
  }

  const handleUnarchiveProject = async (projectId: string) => {
    try {
      await projectService.unarchiveProject(projectId)
      await loadProjects()
    } catch (err) {
      setError('Erreur lors de la restauration du projet')
      console.error(err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const ProjectCard = ({ project, isArchived }: { project: Project, isArchived: boolean }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {project.name}
          </h3>
          {project.sector && (
            <p className="text-gray-600 mb-3">
              Secteur: {project.sector}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Modifié le {formatDate(project.updated_at)}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Link
            href={`/projects/${project.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ouvrir
          </Link>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  const currentProjects = activeProjects

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tous mes projets
          </h1>
          <p className="text-gray-600">
            Gérez l'ensemble de vos business plans
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Fermer
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              💡 Fonctionnalité d'archivage en préparation - Bientôt disponible !
            </p>
          </div>
        </div>

        {currentProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">
              Aucun projet trouvé
            </p>
            <Link
              href="/projects/new"
              className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer mon premier projet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isArchived={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}