'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, FileText, Calendar, Building, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  sector: string
  start_date: string
  horizon_years: number
  status: string
  created_at: string
  updated_at: string
}

interface RecentProjectsProps {
  user: User
}

export function RecentProjects({ user }: RecentProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'validated':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'draft':
        return 'Brouillon'
      case 'validated':
        return 'Validé'
      case 'archived':
        return 'Archivé'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projets récents</CardTitle>
          <CardDescription>
            Vos derniers business plans en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projets récents</CardTitle>
          <CardDescription>
            Vos derniers business plans en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun projet pour le moment</p>
            <p className="text-sm mb-4">Créez votre premier business plan pour commencer</p>
            <Button className="mt-4" asChild>
              <Link href="/projects/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau Projet
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projets récents</CardTitle>
          <CardDescription>
            Vos derniers business plans en cours
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">
                      {project.sector}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Début: {formatDate(project.start_date)}
                    </span>
                    <span>
                      Horizon: {project.horizon_years} ans
                    </span>
                    <span>
                      Modifié: {formatDate(project.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/projects/${project.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {projects.length >= 5 && (
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/projects">
                Voir tous les projets
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}