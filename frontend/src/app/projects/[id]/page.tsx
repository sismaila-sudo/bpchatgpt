'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectWorkbook } from '@/components/project/ProjectWorkbook'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadProject() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            organizations (
              id,
              name,
              currency
            )
          `)
          .eq('id', projectId)
          .single()

        if (error) throw error

        if (!data) {
          setError('Projet non trouvé')
          return
        }

        setProject(data)
      } catch (err: any) {
        console.error('Erreur chargement projet:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Projet non trouvé</h2>
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    )
  }

  return <ProjectWorkbook project={project} />
}