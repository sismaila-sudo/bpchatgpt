'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { ProjectType, CompanySize, BusinessSector, ProjectBasicInfo } from '@/types/project'
import { BUSINESS_SECTOR_LABELS, SENEGAL_REGIONS } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import CompanyIdentificationForm from '@/components/CompanyIdentificationForm'
import { CompanyIdentification } from '@/types/project'

export default function NewProjectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [companyIdentification, setCompanyIdentification] = useState<CompanyIdentification | null>(null)

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

  const handleInputChange = (field: string, value: string | number | Date) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => {
        const parentValue = prev[parent as keyof ProjectBasicInfo]
        return {
          ...prev,
          [parent]: {
            ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
            [child]: value
          }
        }
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.description && formData.name.length >= 3)
      case 2:
        return !!(formData.sector && formData.projectType && formData.companySize)
      case 3:
        return !!(formData.location?.region && formData.location?.city)
      case 4:
        return !!(companyIdentification &&
                  companyIdentification.legalName &&
                  companyIdentification.manager.name &&
                  companyIdentification.manager.email &&
                  companyIdentification.activitePrincipale)
      case 5:
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
      setError('')
    } else {
      setError('Veuillez remplir tous les champs obligatoires')
    }
  }

  const handlePrevious = () => {
    setStep(prev => prev - 1)
    setError('')
  }

  const handleSubmit = async () => {
    if (!user || !validateStep(step)) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const projectId = await projectService.createProject(
        user.uid,
        formData as ProjectBasicInfo,
        undefined, // organizationId
        companyIdentification || undefined
      )

      router.push(`/projects/${projectId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du projet')
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Veuillez vous connecter</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      {/* Navigation minimaliste */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Retour
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">Nouveau projet</span>
              <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700">
                Étape {step}/5
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Barre de progression moderne */}
        <div className="mb-10">
          <div className="relative">
            {/* Barre de progression animée */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
            
            {/* Points d'étapes avec labels */}
            <div className="flex justify-between">
              {[
                { num: 1, label: 'Infos' },
                { num: 2, label: 'Secteur' },
                { num: 3, label: 'Lieu' },
                { num: 4, label: 'Société' },
                { num: 5, label: 'Valider' }
              ].map(({ num, label }) => (
                <div key={num} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${
                    num < step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                    num === step ? 'bg-blue-600 text-white ring-4 ring-blue-200 shadow-lg' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {num < step ? '✓' : num}
                  </div>
                  <span className={`text-xs font-medium ${
                    num === step ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          {/* Étape 1: Informations de base */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Informations générales
                </h2>
                <p className="text-gray-600 mb-8">
                  Commençons par les informations de base de votre projet business plan.
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>Conseil :</strong> Soyez précis dans la description.
                    Elle sera utilisée par l&apos;IA pour générer des analyses personnalisées.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Type & Secteur */}
          {step === 2 && (
            <div className="space-y-6">
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
          )}

          {/* Étape 3: Localisation */}
          {step === 3 && (
            <div className="space-y-6">
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
          )}

          {/* Étape 4: Fiche d'identification d'entreprise */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Fiche d&apos;identification d&apos;entreprise
                </h2>
                <p className="text-gray-600 mb-8">
                  Complétez les informations légales et administratives de votre entreprise selon les standards sénégalais.
                </p>
              </div>

              <CompanyIdentificationForm
                companyId={companyIdentification || undefined}
                onChange={setCompanyIdentification}
              />
            </div>
          )}

          {/* Étape 5: Finalisation */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Récapitulatif et création
                </h2>
                <p className="text-gray-600 mb-8">
                  Vérifiez les informations avant de créer votre projet.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <strong>Nom du projet :</strong> {formData.name}
                </div>
                <div>
                  <strong>Description :</strong> {formData.description}
                </div>
                <div>
                  <strong>Type :</strong> {
                    formData.projectType === ProjectType.CREATION ? 'Création d\'entreprise' :
                    formData.projectType === ProjectType.EXPANSION ? 'Extension d\'activité' :
                    formData.projectType === ProjectType.DIVERSIFICATION ? 'Diversification' :
                    'Reprise d\'entreprise'
                  }
                </div>
                <div>
                  <strong>Secteur :</strong> {BUSINESS_SECTOR_LABELS[formData.sector as BusinessSector]}
                </div>
                <div>
                  <strong>Localisation :</strong> {formData.location?.city}, {formData.location?.region}
                </div>
                <div>
                  <strong>Durée :</strong> {formData.timeline?.duration} mois
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <strong>Prêt à commencer !</strong> Une fois créé, vous pourrez compléter
                    les sections de votre business plan étape par étape.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Précédent
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(step)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !validateStep(step)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                {loading ? 'Création...' : 'Créer le projet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}