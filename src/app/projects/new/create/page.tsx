'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function CreateNewCompanyProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading } = useAuth()

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      // Créer directement un nouveau projet et rediriger
      createProjectDirectly()
    }
  }, [user, loading, router])

  const createProjectDirectly = async () => {
    if (!user) return

    try {
      // Créer ou récupérer l'organisation par défaut de l'utilisateur
      let organization_id: string

      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .single()

      if (existingOrg) {
        organization_id = existingOrg.id
      } else {
        // Créer une organisation par défaut pour l'utilisateur
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `Organisation de ${user.user_metadata?.full_name || user.email}`,
            slug: `org-${user.id.slice(0, 8)}`,
            created_by: user.id
          })
          .select()
          .single()

        if (orgError) throw orgError
        organization_id = newOrg.id
      }

      // Créer le projet avec des valeurs par défaut pour nouvelle entreprise
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          organization_id,
          name: `Nouvelle Entreprise ${new Date().toLocaleDateString('fr-FR')}`,
          sector: 'Non défini',
          mode: 'new-company', // Mode explicite pour nouvelle entreprise
          start_date: new Date().toISOString().split('T')[0],
          horizon_years: 3,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter l'utilisateur comme collaborateur admin du projet
      await supabase
        .from('project_collaborators')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'admin',
          invited_by: user.id,
          accepted_at: new Date().toISOString()
        })

      // Rediriger directement vers le projet créé
      router.push(`/projects/${project.id}`)

    } catch (error: any) {
      console.error('Erreur création projet nouvelle entreprise:', error)
      // En cas d'erreur, rediriger vers la sélection
      router.push('/projects/new/select')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Création de votre nouvelle entreprise
          </h2>
          <p className="text-gray-600">
            Configuration de votre business plan en cours...
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">Initialisation du projet</span>
          </div>
        </div>
      </div>
    </div>
  )
}