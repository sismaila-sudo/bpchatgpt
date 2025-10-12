'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project, ProjectType, CompanySize, BusinessSector, ProjectBasicInfo } from '@/types/project'
import { BUSINESS_SECTOR_LABELS, SENEGAL_REGIONS } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import ImageUpload from '@/components/ImageUpload'

export default function EditProjectPage() {
  const params = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)

  const projectId = params.id as string

  // Données du formulaire
  const [formData, setFormData] = useState<Partial<ProjectBasicInfo>>({
    name: '',
    description: '',
    sector: BusinessSector.COMMERCE_DETAIL,
    projectType: ProjectType.CREATION,
    companySize: CompanySize.MICRO,
    location: {
      region: 'Dakar',
      city: '',
      address: ''
    },
    timeline: {
      startDate: new Date(),
      duration: 12
    }
  })

  // État pour le logo de l'entreprise
  const [companyLogo, setCompanyLogo] = useState<string>('')

  const loadProject = useCallback(async () => {
    if (!user || !projectId) return

    setInitialLoading(true)
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      if (projectData) {
        setProject(projectData)
        // Pré-remplir le formulaire avec les données existantes
        setFormData({
          name: projectData.basicInfo.name,
          description: projectData.basicInfo.description,
          sector: projectData.basicInfo.sector,
          projectType: projectData.basicInfo.projectType,
          companySize: projectData.basicInfo.companySize,
          location: projectData.basicInfo.location,
          timeline: projectData.basicInfo.timeline
        })
        // Charger le logo s'il existe
        if ((projectData.basicInfo as any).companyLogo) {
          setCompanyLogo((projectData.basicInfo as any).companyLogo)
        }
      } else {
        setError('Projet introuvable ou accès non autorisé')
      }
    } catch (err) {
      console.error('Erreur lors du chargement du projet:', err)
      setError('Erreur lors du chargement du projet')
    } finally {
      setInitialLoading(false)
    }
  }, [user, projectId])

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

  const handleInputChange = (field: string, value: string | number | Date) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProjectBasicInfo] as Record<string, unknown>),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateForm = (): boolean => {
    return !!(
      formData.name &&
      formData.description &&
      formData.name.length >= 3 &&
      formData.sector &&
      formData.projectType &&
      formData.companySize &&
      formData.location?.region &&
      formData.location?.city
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !project || !validateForm()) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      // Inclure le logo dans les données à sauvegarder
      await projectService.updateProjectBasicInfo(
        projectId,
        user.uid,
        { ...formData, companyLogo } as ProjectBasicInfo & { companyLogo: string }
      )

      router.push(`/projects/${projectId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du projet')
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Veuillez vous connecter</div>
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error}
          </h2>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/projects/${projectId}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour au projet
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Modifier le projet
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations de base */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Informations générales
                </h2>
                <p className="text-gray-600 mb-8">
                  Modifiez les informations de base de votre projet business plan.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Restaurant traditionnel sénégalais"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 3 caractères
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description du projet *
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez votre projet, ses objectifs et sa valeur ajoutée..."
                  required
                />
              </div>

              {/* Upload du logo de l'entreprise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de l&apos;entreprise (optionnel)
                </label>
                <ImageUpload
                  value={companyLogo}
                  onChange={(url) => setCompanyLogo(url || '')}
                  maxSize={2}
                  className="max-w-md"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Le logo apparaîtra sur la page de garde du PDF et dans les exports.
                </p>
              </div>
            </div>

            {/* Type & Secteur */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Type de projet et secteur
                </h2>
                <p className="text-gray-600 mb-8">
                  Précisez le type de votre projet et son secteur d&apos;activité.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de projet *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(ProjectType).map((type) => {
                    const labels = {
                      [ProjectType.CREATION]: { name: 'Création d\'entreprise', desc: 'Nouvelle entreprise' },
                      [ProjectType.EXPANSION]: { name: 'Extension d\'activité', desc: 'Développement existant' },
                      [ProjectType.DIVERSIFICATION]: { name: 'Diversification', desc: 'Nouveaux produits/services' },
                      [ProjectType.REPRISE]: { name: 'Reprise d\'entreprise', desc: 'Acquisition existante' }
                    }
                    return (
                      <label key={type} className="relative">
                        <input
                          type="radio"
                          name="projectType"
                          value={type}
                          checked={formData.projectType === type}
                          onChange={(e) => handleInputChange('projectType', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.projectType === type
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="font-medium text-gray-900">
                            {labels[type].name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {labels[type].desc}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d&apos;activité *
                </label>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(BUSINESS_SECTOR_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-2">
                  Taille d&apos;entreprise envisagée *
                </label>
                <select
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={CompanySize.MICRO}>Micro-entreprise (&lt; 5 employés)</option>
                  <option value={CompanySize.SMALL}>Petite entreprise (5-20 employés)</option>
                  <option value={CompanySize.MEDIUM}>Moyenne entreprise (20-100 employés)</option>
                  <option value={CompanySize.LARGE}>Grande entreprise (&gt; 100 employés)</option>
                </select>
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Localisation du projet
                </h2>
                <p className="text-gray-600 mb-8">
                  Où sera implanté votre projet au Sénégal ?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                    Région *
                  </label>
                  <select
                    id="region"
                    value={formData.location?.region || ''}
                    onChange={(e) => handleInputChange('location.region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SENEGAL_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Ville/Commune *
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.location?.city || ''}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Dakar, Thiès, Saint-Louis..."
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse précise (optionnel)
                </label>
                <input
                  id="address"
                  type="text"
                  value={formData.location?.address || ''}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quartier, rue, numéro..."
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée prévisionnelle du projet (mois)
                </label>
                <select
                  id="duration"
                  value={formData.timeline?.duration || 12}
                  onChange={(e) => handleInputChange('timeline.duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>6 mois</option>
                  <option value={12}>12 mois</option>
                  <option value={18}>18 mois</option>
                  <option value={24}>24 mois</option>
                  <option value={36}>36 mois</option>
                </select>
              </div>
            </div>

            {/* Boutons d&apos;action */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
              <Link
                href={`/projects/${projectId}`}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>

              <button
                type="submit"
                disabled={loading || !validateForm()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Note :</strong> Ces modifications n&apos;affecteront que les informations de base du projet.
                  Les sections du business plan (SWOT, étude de marché, etc.) conserveront leur contenu.
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}