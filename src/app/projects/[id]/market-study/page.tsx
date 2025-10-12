'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import {
  MarketStudy,
  MarketSegment,
  CustomerSegment,
  Competitor,
  SeasonalityFactor,
  CompetitiveMatrix,
  SENEGAL_MARKET_DATA
} from '@/types/businessPlan'
import { BUSINESS_SECTOR_LABELS } from '@/lib/constants'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { LazyDocumentUploader as DocumentUploader, LazyAIAssistant as AIAssistant, LazyBusinessPlanAIAssistant as BusinessPlanAIAssistant } from '@/components/LazyComponents'
import { DocumentAnalysisResult } from '@/services/openaiService'
import ImageUpload from '@/components/ImageUpload'
import { SparklesIcon } from '@heroicons/react/24/solid'

export default function MarketStudyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [marketStudy, setMarketStudy] = useState<MarketStudy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'market' | 'customers' | 'competition' | 'context'>('market')
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  const projectId = params.id as string

  // États pour les données d'étude de marché
  const [marketAnalysis, setMarketAnalysis] = useState({
    marketSize: 0,
    marketGrowth: 0,
    marketSegments: [] as MarketSegment[],
    keyTrends: [] as string[],
    seasonality: [] as SeasonalityFactor[]
  })

  const [targetCustomers, setTargetCustomers] = useState({
    segments: [] as CustomerSegment[],
    totalAddressableMarket: 0,
    servicableAddressableMarket: 0,
    penetrationRate: 0
  })

  const [competitiveAnalysis, setCompetitiveAnalysis] = useState({
    competitors: [] as Competitor[],
    competitiveMatrix: { criteria: [], companies: [] } as CompetitiveMatrix,
    marketPositioning: '',
    competitiveAdvantages: [] as string[]
  })

  const [sectorContext, setSectorContext] = useState({
    governmentPolicy: '',
    regulations: [] as string[],
    supportPrograms: [] as string[],
    challenges: [] as string[],
    opportunities: [] as string[]
  })

  // Images pour l'étude de marché (produits, locaux, etc.)
  const [marketImages, setMarketImages] = useState<string[]>([])

  // Handlers pour les fonctionnalités IA
  const handleDocumentAnalysis = (analysis: DocumentAnalysisResult) => {
    // Analyser et intégrer les insights depuis le summary ou suggestedSections
    if (analysis.summary) {
      console.log('Résumé de l\'analyse:', analysis.summary)

      // Vérifier les données extraites pour insights de marché
      if (analysis.extractedData) {
        console.log('Données extraites pour étude de marché:', analysis.extractedData)
        // TODO: Intégrer ces données dans les champs du formulaire
      }

      // Utiliser toutes les suggestions disponibles
      if (analysis.suggestedSections) {
        console.log('Sections suggérées:', analysis.suggestedSections)
      }
    }
  }

  const handleAISuggestion = (suggestion: string) => {
    // Traiter la suggestion IA pour améliorer l'étude de marché
    console.log('Suggestion IA étude de marché reçue:', suggestion)
  }

  const handleSave = async () => {
    if (!user || !project) return

    setSaving(true)
    toast.loading('Sauvegarde en cours...', { id: 'market-save' })

    try {
      // Construire l'objet MarketStudy
      const marketStudyData: MarketStudy = {
        id: project.id,
        projectId: project.id,
        marketAnalysis,
        targetCustomers,
        competitiveAnalysis,
        sectorContext,
        lastUpdated: new Date()
      }

      // Sauvegarder via le service (inclure les images)
      await projectService.updateProjectSection(projectId, user.uid, 'marketStudy', { ...marketStudyData, marketImages } as unknown as Record<string, unknown>)

      toast.success('Étude de marché sauvegardée avec succès', { id: 'market-save' })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde', { id: 'market-save' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

  const loadProject = async () => {
    if (!user || !projectId) return

    setLoading(true)
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      if (projectData) {
        setProject(projectData)
        // Charger d'abord les données sauvegardées si elles existent
        try {
          const saved = await projectService.getProjectSection(projectId, user.uid, 'marketStudy')
          if (saved) {
            const ms = saved as unknown as MarketStudy & { marketImages?: string[] }
            // Hydrater l'état local à partir des données persistées
            setMarketAnalysis(ms.marketAnalysis)
            setTargetCustomers(ms.targetCustomers)
            setCompetitiveAnalysis(ms.competitiveAnalysis)
            setSectorContext(ms.sectorContext)
            // Charger les images si elles existent
            if (ms.marketImages) {
              setMarketImages(ms.marketImages)
            }
          } else {
            // Sinon initialiser avec les données sectorielles par défaut
            initializeMarketData(projectData)
          }
        } catch (e) {
          console.error('Erreur chargement section marketStudy:', e)
          // Fallback: initialiser
          initializeMarketData(projectData)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeMarketData = (project: Project) => {
    const sector = project.basicInfo.sector
    const sectorData = SENEGAL_MARKET_DATA

    // Initialiser avec les données sectorielles sénégalaises
    setMarketAnalysis(prev => ({
      ...prev,
      marketSize: sectorData.MARKET_SIZES[sector as keyof typeof sectorData.MARKET_SIZES] * 1000000 || 0,
      marketGrowth: sectorData.GROWTH_RATES[sector as keyof typeof sectorData.GROWTH_RATES] || 5
    }))

    // Initialiser le contexte sectoriel
    setSectorContext(prev => ({
      ...prev,
      supportPrograms: getSupportPrograms(sector),
      opportunities: getSectorOpportunities(sector),
      challenges: getSectorChallenges(sector)
    }))
  }

  const getSupportPrograms = (sector: string): string[] => {
    const programs: string[] = []
    const supportData = SENEGAL_MARKET_DATA.SUPPORT_PROGRAMS

    Object.entries(supportData).forEach(([program, sectors]) => {
      if ((sectors as unknown as string[]).includes(sector)) {
        programs.push(program)
      }
    })

    return programs
  }

  const getSectorOpportunities = (sector: string): string[] => {
    const opportunities = {
      agriculture: [
        'Politique de souveraineté alimentaire du PSE',
        'Valorisation des chaînes de valeur agricoles',
        'Marchés export sous-régionaux en croissance',
        'Programmes de modernisation agricole'
      ],
      commerce: [
        'Position de hub régional du Sénégal',
        'Développement du commerce électronique',
        'Croissance de la classe moyenne',
        'Amélioration des infrastructures logistiques'
      ],
      services: [
        'Tertiarisation de l\'économie sénégalaise',
        'Transformation numérique accélérée',
        'Demande croissante de services qualifiés',
        'Ouverture aux marchés régionaux'
      ]
    }

    return opportunities[sector as keyof typeof opportunities] || [
      'Croissance économique soutenue du Sénégal',
      'Amélioration du climat des affaires',
      'Jeunesse de la population',
      'Stabilité politique et sociale'
    ]
  }

  const getSectorChallenges = (sector: string): string[] => {
    const challenges = {
      agriculture: [
        'Dépendance aux aléas climatiques',
        'Accès limité au financement',
        'Faible mécanisation',
        'Problèmes de conservation et stockage'
      ],
      commerce: [
        'Concurrence du secteur informel',
        'Coûts logistiques élevés',
        'Accès limité au crédit',
        'Fluctuations des devises'
      ],
      services: [
        'Pénurie de compétences spécialisées',
        'Infrastructure numérique insuffisante',
        'Réglementations complexes',
        'Concurrence internationale'
      ]
    }

    return challenges[sector as keyof typeof challenges] || [
      'Concurrence accrue',
      'Contraintes de financement',
      'Défis réglementaires',
      'Fluctuations économiques'
    ]
  }

  const addMarketSegment = () => {
    const newSegment: MarketSegment = {
      id: `segment_${Date.now()}`,
      name: '',
      size: 0,
      growthRate: 0,
      characteristics: [],
      accessibility: 'medium'
    }

    setMarketAnalysis(prev => ({
      ...prev,
      marketSegments: [...prev.marketSegments, newSegment]
    }))
  }

  const updateMarketSegment = (segmentId: string, updates: Partial<MarketSegment>) => {
    setMarketAnalysis(prev => ({
      ...prev,
      marketSegments: prev.marketSegments.map(segment =>
        segment.id === segmentId ? { ...segment, ...updates } : segment
      )
    }))
  }

  const removeMarketSegment = (segmentId: string) => {
    setMarketAnalysis(prev => ({
      ...prev,
      marketSegments: prev.marketSegments.filter(segment => segment.id !== segmentId)
    }))
  }

  const addCustomerSegment = () => {
    const newSegment: CustomerSegment = {
      id: `customer_${Date.now()}`,
      name: '',
      demographics: {
        ageRange: '',
        income: '',
        location: [],
        profession: []
      },
      needs: [],
      painPoints: [],
      buyingBehavior: {
        decisionFactors: [],
        buyingProcess: '',
        averageTicket: 0,
        frequency: ''
      },
      size: 0
    }

    setTargetCustomers(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment]
    }))
  }

  const updateCustomerSegment = (segmentId: string, updates: Partial<CustomerSegment>) => {
    setTargetCustomers(prev => ({
      ...prev,
      segments: prev.segments.map(segment =>
        segment.id === segmentId ? { ...segment, ...updates } : segment
      )
    }))
  }

  const removeCustomerSegment = (segmentId: string) => {
    setTargetCustomers(prev => ({
      ...prev,
      segments: prev.segments.filter(segment => segment.id !== segmentId)
    }))
  }

  const addCompetitor = () => {
    const newCompetitor: Competitor = {
      id: `competitor_${Date.now()}`,
      name: '',
      type: 'direct',
      marketShare: 0,
      strengths: [],
      weaknesses: [],
      pricing: {
        strategy: '',
        averagePrice: 0,
        priceRange: { min: 0, max: 0 }
      },
      location: [],
      target: []
    }

    setCompetitiveAnalysis(prev => ({
      ...prev,
      competitors: [...prev.competitors, newCompetitor]
    }))
  }

  const updateCompetitor = (competitorId: string, updates: Partial<Competitor>) => {
    setCompetitiveAnalysis(prev => ({
      ...prev,
      competitors: prev.competitors.map(competitor =>
        competitor.id === competitorId ? { ...competitor, ...updates } : competitor
      )
    }))
  }

  const removeCompetitor = (competitorId: string) => {
    setCompetitiveAnalysis(prev => ({
      ...prev,
      competitors: prev.competitors.filter(competitor => competitor.id !== competitorId)
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Chargement de l'étude de marché...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Projet introuvable</h2>
          <Link href="/projects" className="text-blue-600 hover:text-blue-800">
            Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  const actions = (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
    >
      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
    </button>
  )

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project.basicInfo.name}
      title="Étude de Marché"
      subtitle={`Analyse du marché ${BUSINESS_SECTOR_LABELS[project.basicInfo.sector]} au Sénégal`}
      actions={actions}
      project={project}
      currentSection="market_study"
    >
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="w-8 h-8 mr-3 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">
              Analyse de Marché
            </h2>
          </div>
          <p className="text-slate-600">
            Cette section analyse votre marché cible, la concurrence et les opportunités
            dans le contexte économique sénégalais.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'market', label: 'Analyse Marché', icon: '📊' },
              { id: 'customers', label: 'Clientèle Cible', icon: '👥' },
              { id: 'competition', label: 'Concurrence', icon: '🏢' },
              { id: 'context', label: 'Contexte Sectoriel', icon: '🇸🇳' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu selon l'onglet */}
        {activeTab === 'market' && (
          <div className="space-y-8">
            {/* Analyse du marché global */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Taille et Croissance du Marché</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille du marché (milliards FCFA)
                  </label>
                  <input
                    type="number"
                    value={marketAnalysis.marketSize === 0 ? '' : (marketAnalysis.marketSize / 1000000000).toString()}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      setMarketAnalysis(prev => ({
                        ...prev,
                        marketSize: value * 1000000000
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 2.8"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Valeur estimée secteur {BUSINESS_SECTOR_LABELS[project.basicInfo.sector]} au Sénégal
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux de croissance annuel (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={marketAnalysis.marketGrowth === 0 ? '' : marketAnalysis.marketGrowth.toString()}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      setMarketAnalysis(prev => ({
                        ...prev,
                        marketGrowth: value
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 6.5"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Croissance moyenne du secteur au Sénégal
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Données du marché</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Taille totale :</span>
                    <div className="font-medium">{formatCurrency(marketAnalysis.marketSize)}</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Croissance annuelle :</span>
                    <div className="font-medium">{marketAnalysis.marketGrowth}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Segments de marché */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">🎯 Segments de Marché</h3>
                <button
                  onClick={addMarketSegment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Ajouter segment
                </button>
              </div>

              {marketAnalysis.marketSegments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun segment défini</p>
              ) : (
                <div className="space-y-4">
                  {marketAnalysis.marketSegments.map((segment, index) => (
                    <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Segment {index + 1}</h4>
                        <button
                          onClick={() => removeMarketSegment(segment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom du segment
                          </label>
                          <input
                            type="text"
                            value={segment.name}
                            onChange={(e) => updateMarketSegment(segment.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Particuliers"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Taille (millions FCFA)
                          </label>
                          <input
                            type="number"
                            value={segment.size === 0 ? '' : (segment.size / 1000000).toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              updateMarketSegment(segment.id, {
                                size: value * 1000000
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Croissance (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={segment.growthRate === 0 ? '' : segment.growthRate.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              updateMarketSegment(segment.id, {
                                growthRate: value
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Accessibilité
                          </label>
                          <select
                            value={segment.accessibility}
                            onChange={(e) => updateMarketSegment(segment.id, {
                              accessibility: e.target.value as 'high' | 'medium' | 'low'
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="high">Élevée</option>
                            <option value="medium">Moyenne</option>
                            <option value="low">Faible</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Total des segments</h4>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(
                        marketAnalysis.marketSegments.reduce((sum, segment) => sum + segment.size, 0)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tendances clés */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📈 Tendances Clés du Marché</h3>

              <div className="space-y-3">
                {marketAnalysis.keyTrends.map((trend, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={trend}
                      onChange={(e) => {
                        const newTrends = [...marketAnalysis.keyTrends]
                        newTrends[index] = e.target.value
                        setMarketAnalysis(prev => ({ ...prev, keyTrends: newTrends }))
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Digitalisation croissante"
                    />
                    <button
                      onClick={() => {
                        const newTrends = marketAnalysis.keyTrends.filter((_, i) => i !== index)
                        setMarketAnalysis(prev => ({ ...prev, keyTrends: newTrends }))
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setMarketAnalysis(prev => ({
                    ...prev,
                    keyTrends: [...prev.keyTrends, '']
                  }))}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  + Ajouter une tendance
                </button>
              </div>
            </div>

            {/* Images de produits/locaux/services */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📷 Images du Marché</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ajoutez des images de vos produits, de vos locaux, ou tout autre élément visuel illustrant votre positionnement sur le marché.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image {index + 1} (optionnel)
                    </label>
                    <ImageUpload
                      value={marketImages[index] || ''}
                      onChange={(url) => {
                        const newImages = [...marketImages]
                        newImages[index] = url || ''
                        setMarketImages(newImages)
                      }}
                      maxSize={5}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Ces images apparaîtront dans l'export PDF et enrichiront votre présentation.
              </p>
            </div>
          </div>
        )}

        {/* Autres onglets à développer dans les prochaines étapes */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">👥 Analyse de la Clientèle Cible</h3>

            {/* Métriques générales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marché Total Addressable (TAM)
                </label>
                <input
                  type="number"
                  value={targetCustomers.totalAddressableMarket === 0 ? '' : targetCustomers.totalAddressableMarket.toString()}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    setTargetCustomers(prev => ({
                      ...prev,
                      totalAddressableMarket: value
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Taille du marché total"
                />
                <p className="text-xs text-gray-500 mt-1">En FCFA</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marché Serviceable (SAM)
                </label>
                <input
                  type="number"
                  value={targetCustomers.servicableAddressableMarket === 0 ? '' : targetCustomers.servicableAddressableMarket.toString()}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    setTargetCustomers(prev => ({
                      ...prev,
                      servicableAddressableMarket: value
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Marché serviceable"
                />
                <p className="text-xs text-gray-500 mt-1">En FCFA</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de Pénétration Visé
                </label>
                <input
                  type="number"
                  step="0.1"
                  max="100"
                  value={targetCustomers.penetrationRate === 0 ? '' : targetCustomers.penetrationRate.toString()}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    setTargetCustomers(prev => ({
                      ...prev,
                      penetrationRate: value
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Pourcentage"
                />
                <p className="text-xs text-gray-500 mt-1">En %</p>
              </div>
            </div>

            {/* Segments de clientèle */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Segments de Clientèle</h4>
                <button
                  onClick={addCustomerSegment}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Ajouter un segment
                </button>
              </div>

              {targetCustomers.segments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun segment de clientèle défini</p>
                  <p className="text-sm">Cliquez sur "Ajouter un segment" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {targetCustomers.segments.map((segment, index) => (
                    <div key={segment.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="font-medium">Segment {index + 1}</h5>
                        <button
                          onClick={() => removeCustomerSegment(segment.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du segment
                          </label>
                          <input
                            type="text"
                            value={segment.name}
                            onChange={(e) => updateCustomerSegment(segment.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: Jeunes urbains connectés"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taille du segment
                          </label>
                          <input
                            type="number"
                            value={segment.size === 0 ? '' : segment.size.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                              updateCustomerSegment(segment.id, { size: value })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Nombre de clients potentiels"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tranche d'âge
                          </label>
                          <input
                            type="text"
                            value={segment.demographics.ageRange}
                            onChange={(e) => updateCustomerSegment(segment.id, {
                              demographics: { ...segment.demographics, ageRange: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: 25-35 ans"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Niveau de revenus
                          </label>
                          <input
                            type="text"
                            value={segment.demographics.income}
                            onChange={(e) => updateCustomerSegment(segment.id, {
                              demographics: { ...segment.demographics, income: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: 200 000 - 500 000 FCFA/mois"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Processus d'achat
                          </label>
                          <input
                            type="text"
                            value={segment.buyingBehavior.buyingProcess}
                            onChange={(e) => updateCustomerSegment(segment.id, {
                              buyingBehavior: { ...segment.buyingBehavior, buyingProcess: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: Recherche en ligne puis achat en magasin"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Panier moyen (FCFA)
                          </label>
                          <input
                            type="number"
                            value={segment.buyingBehavior.averageTicket === 0 ? '' : segment.buyingBehavior.averageTicket.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                              updateCustomerSegment(segment.id, {
                                buyingBehavior: { ...segment.buyingBehavior, averageTicket: value }
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Montant moyen par achat"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Besoins principaux
                        </label>
                        <textarea
                          value={segment.needs.join(', ')}
                          onChange={(e) => updateCustomerSegment(segment.id, {
                            needs: e.target.value.split(',').map(need => need.trim()).filter(Boolean)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Séparez les besoins par des virgules"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points de douleur
                        </label>
                        <textarea
                          value={segment.painPoints.join(', ')}
                          onChange={(e) => updateCustomerSegment(segment.id, {
                            painPoints: e.target.value.split(',').map(pain => pain.trim()).filter(Boolean)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Séparez les problèmes par des virgules"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Résumé des segments */}
            {targetCustomers.segments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium mb-2">📊 Résumé de l'analyse clientèle</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Segments identifiés:</span> {targetCustomers.segments.length}
                  </div>
                  <div>
                    <span className="font-medium">Total clients potentiels:</span> {
                      targetCustomers.segments.reduce((total, segment) => total + segment.size, 0).toLocaleString()
                    }
                  </div>
                  <div>
                    <span className="font-medium">Marché serviceable:</span> {formatCurrency(targetCustomers.servicableAddressableMarket)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'competition' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🏢 Analyse Concurrentielle</h3>

            {/* Positionnement concurrentiel */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">📍 Positionnement sur le Marché</h4>
              <textarea
                value={competitiveAnalysis.marketPositioning}
                onChange={(e) => setCompetitiveAnalysis(prev => ({
                  ...prev,
                  marketPositioning: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Décrivez comment votre entreprise se positionne par rapport à la concurrence..."
              />
            </div>

            {/* Avantages concurrentiels */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">💪 Avantages Concurrentiels</h4>
              <textarea
                value={competitiveAnalysis.competitiveAdvantages.join(', ')}
                onChange={(e) => setCompetitiveAnalysis(prev => ({
                  ...prev,
                  competitiveAdvantages: e.target.value.split(',').map(advantage => advantage.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Séparez vos avantages concurrentiels par des virgules..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Ex: Innovation technologique, service client, prix compétitifs
              </p>
            </div>

            {/* Liste des concurrents */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Analyse des Concurrents</h4>
                <button
                  onClick={addCompetitor}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Ajouter un concurrent
                </button>
              </div>

              {competitiveAnalysis.competitors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun concurrent identifié</p>
                  <p className="text-sm">Cliquez sur "Ajouter un concurrent" pour commencer l'analyse</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {competitiveAnalysis.competitors.map((competitor, index) => (
                    <div key={competitor.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="font-medium">Concurrent {index + 1}</h5>
                        <button
                          onClick={() => removeCompetitor(competitor.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom de l'entreprise
                          </label>
                          <input
                            type="text"
                            value={competitor.name}
                            onChange={(e) => updateCompetitor(competitor.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Nom du concurrent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de concurrence
                          </label>
                          <select
                            value={competitor.type}
                            onChange={(e) => updateCompetitor(competitor.id, { type: e.target.value as 'direct' | 'indirect' | 'substitute' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="direct">Concurrence directe</option>
                            <option value="indirect">Concurrence indirecte</option>
                            <option value="substitute">Produit de substitution</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Part de marché (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            max="100"
                            value={competitor.marketShare === 0 ? '' : competitor.marketShare.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                              updateCompetitor(competitor.id, { marketShare: value })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Part de marché estimée"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prix moyen (FCFA)
                          </label>
                          <input
                            type="number"
                            value={competitor.pricing.averagePrice === 0 ? '' : competitor.pricing.averagePrice.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                              updateCompetitor(competitor.id, {
                                pricing: { ...competitor.pricing, averagePrice: value }
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Prix moyen pratiqué"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stratégie tarifaire
                          </label>
                          <input
                            type="text"
                            value={competitor.pricing.strategy}
                            onChange={(e) => updateCompetitor(competitor.id, {
                              pricing: { ...competitor.pricing, strategy: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: Prix bas, Premium, Différenciation"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Localisation
                          </label>
                          <input
                            type="text"
                            value={competitor.location.join(', ')}
                            onChange={(e) => updateCompetitor(competitor.id, {
                              location: e.target.value.split(',').map(loc => loc.trim()).filter(Boolean)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Zones de présence (séparez par des virgules)"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Forces principales
                          </label>
                          <textarea
                            value={competitor.strengths.join(', ')}
                            onChange={(e) => updateCompetitor(competitor.id, {
                              strengths: e.target.value.split(',').map(strength => strength.trim()).filter(Boolean)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={3}
                            placeholder="Séparez les forces par des virgules"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Faiblesses identifiées
                          </label>
                          <textarea
                            value={competitor.weaknesses.join(', ')}
                            onChange={(e) => updateCompetitor(competitor.id, {
                              weaknesses: e.target.value.split(',').map(weakness => weakness.trim()).filter(Boolean)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={3}
                            placeholder="Séparez les faiblesses par des virgules"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clientèle cible
                        </label>
                        <textarea
                          value={competitor.target.join(', ')}
                          onChange={(e) => updateCompetitor(competitor.id, {
                            target: e.target.value.split(',').map(target => target.trim()).filter(Boolean)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Segments de clientèle visés (séparez par des virgules)"
                        />
                      </div>

                      {/* Badge du type de concurrent */}
                      <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          competitor.type === 'direct' ? 'bg-red-100 text-red-800' :
                          competitor.type === 'indirect' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {competitor.type === 'direct' ? '🎯 Concurrent direct' :
                           competitor.type === 'indirect' ? '🔄 Concurrent indirect' :
                           '🔀 Produit de substitution'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tableau comparatif */}
            {competitiveAnalysis.competitors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-4">📊 Tableau Comparatif</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Concurrent</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Part de marché</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Prix moyen</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Forces principales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitiveAnalysis.competitors.map((competitor, index) => (
                        <tr key={competitor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm border-b">{competitor.name || 'Non défini'}</td>
                          <td className="px-4 py-3 text-sm border-b">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              competitor.type === 'direct' ? 'bg-red-100 text-red-700' :
                              competitor.type === 'indirect' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {competitor.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm border-b">{competitor.marketShare}%</td>
                          <td className="px-4 py-3 text-sm border-b">{formatCurrency(competitor.pricing.averagePrice)}</td>
                          <td className="px-4 py-3 text-sm border-b">
                            {competitor.strengths.slice(0, 2).join(', ')}
                            {competitor.strengths.length > 2 && '...'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Résumé de l'analyse concurrentielle */}
            {competitiveAnalysis.competitors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium mb-2">🎯 Résumé de l'analyse concurrentielle</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Concurrents analysés:</span> {competitiveAnalysis.competitors.length}
                  </div>
                  <div>
                    <span className="font-medium">Concurrents directs:</span> {
                      competitiveAnalysis.competitors.filter(c => c.type === 'direct').length
                    }
                  </div>
                  <div>
                    <span className="font-medium">Part de marché totale:</span> {
                      competitiveAnalysis.competitors.reduce((total, c) => total + c.marketShare, 0).toFixed(1)
                    }%
                  </div>
                  <div>
                    <span className="font-medium">Avantages identifiés:</span> {competitiveAnalysis.competitiveAdvantages.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'context' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🇸🇳 Contexte Sectoriel Sénégalais</h3>

            {/* Programmes de soutien */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Programmes de soutien disponibles</h4>
              <div className="flex flex-wrap gap-2">
                {sectorContext.supportPrograms.map((program, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {program}
                  </span>
                ))}
              </div>
            </div>

            {/* Opportunités */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Opportunités sectorielles</h4>
              <ul className="space-y-2">
                {sectorContext.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Défis */}
            <div>
              <h4 className="font-medium mb-3">Défis sectoriels</h4>
              <ul className="space-y-2">
                {sectorContext.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">⚠</span>
                    <span className="text-gray-700">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section Analyse de Documents et Assistant IA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Upload et analyse de documents */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📄 Analyse de Documents Marché</h3>
            <p className="text-gray-600 mb-4">
              Uploadez des documents d'étude de marché (rapports sectoriels, études concurrentielles, données statistiques)
              pour enrichir automatiquement votre analyse du marché sénégalais.
            </p>
            <DocumentUploader
              projectId={projectId}
              userId={user?.uid || ''}
              onAnalysisComplete={handleDocumentAnalysis}
            />
          </div>

          {/* Assistant IA */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🤖 Assistant IA Étude de Marché</h3>
            <p className="text-gray-600 mb-4">
              Obtenez des analyses personnalisées du marché sénégalais pour votre secteur
              et des recommandations stratégiques basées sur le contexte local.
            </p>
            {project && (
              <AIAssistant
                section="market-study"
                sector={project.basicInfo.sector}
                project={project}
                currentData={{ marketAnalysis, targetCustomers, competitiveAnalysis, sectorContext }}
                onSuggestionApply={handleAISuggestion}
              />
            )}

            {/* Bouton pour ouvrir le nouvel assistant IA conversationnel */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Ouvrir l'Assistant IA Conversationnel
              </button>
            </div>
          </div>
        </div>

        {/* Modal de l'Assistant IA Conversationnel */}
        {showAIAssistant && project && (
          <BusinessPlanAIAssistant
            project={project}
            currentSection="market_study"
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            onContentGenerated={(content, section) => {
              console.info('[Market Study IA] Contenu généré (copier-coller manuel)', {
                section,
                contentLength: content?.length || 0
              })
            }}
            userId={user?.uid}
          />
        )}
    </ModernProjectLayout>
  )
}