'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { useRouter } from 'next/navigation'
import { BusinessSector, ProjectType, CompanySize } from '@/types/project'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import {
  DocumentTextIcon,
  FolderIcon,
  CogIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { BUSINESS_SECTOR_LABELS } from '@/lib/constants'

// Template mock data
const templates = [
  {
    id: 1,
    name: "Restaurant Traditionnel Sénégalais",
    description: "Template complet pour un restaurant de cuisine locale avec analyse financière et étude de marché",
    sector: "restauration",
    difficulty: "Débutant",
    duration: "2-3 heures",
    rating: 4.8,
    downloads: 234,
    isPopular: true,
    tags: ["Restauration", "Cuisine locale", "Dakar"]
  },
  {
    id: 2,
    name: "Boutique de Prêt-à-Porter",
    description: "Business plan pour une boutique de vêtements avec focus sur la mode africaine",
    sector: "commerce_detail",
    difficulty: "Intermédiaire",
    duration: "3-4 heures",
    rating: 4.6,
    downloads: 189,
    isPopular: true,
    tags: ["Mode", "Commerce", "Textile"]
  },
  {
    id: 3,
    name: "Service de Livraison à Domicile",
    description: "Template pour un service de livraison urbaine avec modèle logistique",
    sector: "transport_logistique",
    difficulty: "Avancé",
    duration: "4-5 heures",
    rating: 4.7,
    downloads: 156,
    isPopular: false,
    tags: ["Livraison", "Logistique", "Digital"]
  },
  {
    id: 4,
    name: "Salon de Coiffure Moderne",
    description: "Business plan pour un salon de coiffure avec services beauté",
    sector: "services_personnels",
    difficulty: "Débutant",
    duration: "2-3 heures",
    rating: 4.5,
    downloads: 203,
    isPopular: false,
    tags: ["Beauté", "Services", "Coiffure"]
  },
  {
    id: 5,
    name: "Ferme Avicole Bio",
    description: "Template pour une exploitation avicole avec focus sur le bio et l'export",
    sector: "agriculture_elevage",
    difficulty: "Avancé",
    duration: "5-6 heures",
    rating: 4.9,
    downloads: 98,
    isPopular: false,
    tags: ["Agriculture", "Bio", "Export"]
  },
  {
    id: 6,
    name: "Centre de Formation Informatique",
    description: "Business plan pour un centre de formation aux métiers du numérique",
    sector: "education_formation",
    difficulty: "Intermédiaire",
    duration: "3-4 heures",
    rating: 4.4,
    downloads: 167,
    isPopular: true,
    tags: ["Formation", "Informatique", "Jeunesse"]
  }
]

export default function TemplatesPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [creatingProject, setCreatingProject] = useState<number | null>(null)

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSector = selectedSector === 'all' || template.sector === selectedSector
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty

    return matchesSearch && matchesSector && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return 'bg-green-100 text-green-800'
      case 'Intermédiaire': return 'bg-yellow-100 text-yellow-800'
      case 'Avancé': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const createProjectFromTemplate = async (templateId: number) => {
    if (!user) return

    setCreatingProject(templateId)
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    try {
      const projectId = await projectService.createProject(
        user.uid,
        {
          name: `${template.name} - ${new Date().toLocaleDateString('fr-FR')}`,
          description: template.description,
          sector: template.sector as BusinessSector,
          projectType: 'business_plan' as ProjectType,
          companySize: CompanySize.SMALL,
          location: {
            city: 'Dakar',
            region: 'Dakar'
          },
          timeline: {
            startDate: new Date(),
            duration: 12
          }
        }
      )

      // Rediriger vers le nouveau projet
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
      alert('Erreur lors de la création du projet. Veuillez réessayer.')
    } finally {
      setCreatingProject(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès restreint</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder aux templates.</p>
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Templates Business Plan
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Découvrez nos modèles prêts à l'emploi adaptés au marché sénégalais
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-4">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les secteurs</option>
                {Object.entries(BUSINESS_SECTOR_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes difficultés</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates populaires */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
            Templates populaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.isPopular).map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-yellow-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    <div className="ml-2">
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {template.duration}
                    </div>
                    <div className="flex items-center">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      {template.downloads}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                    <button
                      onClick={() => createProjectFromTemplate(template.id)}
                      disabled={creatingProject === template.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                        creatingProject === template.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {creatingProject === template.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          Création...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Utiliser
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tous les templates */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            Tous les templates ({filteredTemplates.length})
          </h2>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun template trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      {template.isPopular && (
                        <StarIcon className="h-5 w-5 text-yellow-500 ml-2" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {template.duration}
                      </div>
                      <div className="flex items-center">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        {template.downloads}
                      </div>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                        {template.rating}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </span>
                      <button
                        onClick={() => createProjectFromTemplate(template.id)}
                        disabled={creatingProject === template.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                          creatingProject === template.id
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {creatingProject === template.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            Création...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Utiliser
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note de développement */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Templates en développement
              </h3>
              <p className="text-blue-800 text-sm">
                Les templates présentés sont des exemples de ce qui sera disponible.
                Le système de téléchargement et d'utilisation des templates sera implémenté dans les prochaines versions.
                Ces modèles couvriront tous les secteurs d'activité du marché sénégalais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}