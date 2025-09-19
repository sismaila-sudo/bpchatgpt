'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Building, Calendar, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { TemplateSelector } from '@/components/project/TemplateSelector'
import { documentTemplateService, DocumentTemplate } from '@/services/documentTemplateService'

type Step = 'basic-info' | 'template-selection'

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState<Step>('basic-info')
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    start_date: '',
    horizon_years: 3
  })
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [selectedMode, setSelectedMode] = useState<'new-company' | 'existing-company'>('new-company')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const supabase = createClient()
  const { user, loading } = useAuth()

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du projet est requis'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La date de début est requise'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Passer à l'étape suivante
    setCurrentStep('template-selection')
  }

  const handleTemplateSelected = async (template: DocumentTemplate, mode: 'new-company' | 'existing-company') => {
    setSelectedTemplate(template)
    setSelectedMode(mode)

    // Créer le projet avec le template
    await createProjectWithTemplate(template, mode)
  }

  const createProjectWithTemplate = async (template: DocumentTemplate, mode: 'new-company' | 'existing-company') => {
    setIsLoading(true)
    setErrors({})

    try {
      // Créer ou récupérer l'organisation par défaut de l'utilisateur
      let organization_id: string

      // D'abord, vérifier si l'utilisateur a déjà une organisation
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

      // Créer le projet avec template et mode
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          organization_id,
          name: formData.name.trim(),
          sector: template.sector,
          mode: mode,
          template_id: template.id,
          start_date: formData.start_date,
          horizon_years: formData.horizon_years,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Initialiser les sections du projet depuis le template
      await documentTemplateService.initializeProjectWithTemplate(project.id, template.id)

      // Ajouter l'utilisateur comme collaborateur admin du projet
      const { error: collaboratorError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'admin',
          invited_by: user.id,
          accepted_at: new Date().toISOString()
        })

      if (collaboratorError) throw collaboratorError

      // Rediriger vers le projet créé
      router.push(`/projects/${project.id}`)

    } catch (error: any) {
      console.error('Erreur création projet:', error)
      setErrors({ general: error.message || 'Erreur lors de la création du projet' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToBasicInfo = () => {
    setCurrentStep('basic-info')
    setSelectedTemplate(null)
    setSelectedMode('new-company')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'basic-info' ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nouveau Business Plan
              </h1>
              <p className="text-gray-600">
                Créez un nouveau projet de business plan en quelques étapes simples
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Informations du projet
                </CardTitle>
                <CardDescription>
                  Définissez les paramètres de base de votre business plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                  {/* Nom du projet */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du projet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Boulangerie Moderne, Startup EdTech..."
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Date de début */}
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date de début *
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                    )}
                  </div>

                  {/* Horizon temporel */}
                  <div>
                    <label htmlFor="horizon_years" className="block text-sm font-medium text-gray-700 mb-2">
                      <TrendingUp className="inline h-4 w-4 mr-1" />
                      Horizon de projection
                    </label>
                    <select
                      id="horizon_years"
                      value={formData.horizon_years}
                      onChange={(e) => setFormData({ ...formData, horizon_years: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={3}>3 ans</option>
                      <option value={4}>4 ans</option>
                      <option value={5}>5 ans</option>
                      <option value={6}>6 ans</option>
                      <option value={7}>7 ans</option>
                    </select>
                  </div>

                  {/* Message d'erreur général */}
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                  )}

                  {/* Boutons */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continuer
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Aide */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                💡 Conseil
              </h3>
              <p className="text-sm text-blue-700">
                Choisissez ensuite un template adapté à votre secteur et type de projet pour
                bénéficier de sections pré-configurées et d'aide à la génération IA.
              </p>
            </div>
          </div>
        ) : (
          <TemplateSelector
            onTemplateSelected={handleTemplateSelected}
            onBack={handleBackToBasicInfo}
          />
        )}

        {/* Indicateur de chargement global */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Création du projet en cours...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}