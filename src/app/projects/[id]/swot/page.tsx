'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { SWOTAnalysis, SWOTItem } from '@/types/businessPlan'
import { BUSINESS_SECTOR_LABELS } from '@/lib/constants'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  FireIcon,
  PlusIcon,
  DocumentPlusIcon,
  DocumentArrowUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import DocumentUploader from '@/components/DocumentUploader'
import AIAssistant from '@/components/AIAssistant'
import { LazyBusinessPlanAIAssistant as BusinessPlanAIAssistant } from '@/components/LazyComponents'
import { DocumentAnalysisResult } from '@/services/openaiService'

export default function SWOTPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [swotAnalysis, setSWOTAnalysis] = useState<SWOTAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // États pour les données SWOT
  const [strengths, setStrengths] = useState<SWOTItem[]>([])
  const [weaknesses, setWeaknesses] = useState<SWOTItem[]>([])
  const [opportunities, setOpportunities] = useState<SWOTItem[]>([])
  const [threats, setThreats] = useState<SWOTItem[]>([])

  const [strategicRecommendations, setStrategicRecommendations] = useState({
    soStrategies: [] as string[], // Forces + Opportunités
    woStrategies: [] as string[], // Faiblesses + Opportunités
    stStrategies: [] as string[], // Forces + Menaces
    wtStrategies: [] as string[]  // Faiblesses + Menaces
  })

  // États pour l'IA et documents
  const [showDocumentUploader, setShowDocumentUploader] = useState(false)

  // État pour gérer l'ajout d'actions
  const [newActionInputs, setNewActionInputs] = useState<Record<string, string>>({})

  const projectId = params.id as string

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

  // Écoute de l'événement pour ouvrir l'assistant IA depuis la sidebar
  useEffect(() => {
    const handleOpenAIAssistant = () => {
      setShowAIAssistant(true)
    }

    window.addEventListener('openAIAssistant', handleOpenAIAssistant)

    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
    }
  }, [])

  const loadProject = async () => {
    if (!user || !projectId) return

    setLoading(true)
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      if (projectData) {
        setProject(projectData)
        // Charger d'abord la section sauvegardée si elle existe
        try {
          const saved = await projectService.getProjectSection(projectId, user.uid, 'swotAnalysis')
          if (saved) {
            const sw = saved as unknown as SWOTAnalysis
            setStrengths(sw.strengths || [])
            setWeaknesses(sw.weaknesses || [])
            setOpportunities(sw.opportunities || [])
            setThreats(sw.threats || [])
            setStrategicRecommendations(sw.strategicRecommendations || { soStrategies: [], woStrategies: [], stStrategies: [], wtStrategies: [] })
          } else {
            initializeSWOTData(projectData)
          }
        } catch (e) {
          console.error('Erreur chargement section swotAnalysis:', e)
          initializeSWOTData(projectData)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeSWOTData = (project: Project) => {
    // Initialiser avec des exemples selon le secteur
    const sector = project.basicInfo.sector
    const examples = getSectorSWOTExamples(sector)

    if (strengths.length === 0) {
      setStrengths(examples.strengths)
    }
    if (weaknesses.length === 0) {
      setWeaknesses(examples.weaknesses)
    }
    if (opportunities.length === 0) {
      setOpportunities(examples.opportunities)
    }
    if (threats.length === 0) {
      setThreats(examples.threats)
    }
  }

  const getSectorSWOTExamples = (sector: string) => {
    const examples = {
      agriculture: {
        strengths: [
          {
            id: 'str1',
            description: 'Terres fertiles disponibles',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Maximiser l\'utilisation des terres', 'Investir dans l\'irrigation']
          },
          {
            id: 'str2',
            description: 'Connaissance du marché local',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Développer les circuits de distribution', 'Fidéliser la clientèle']
          }
        ],
        weaknesses: [
          {
            id: 'weak1',
            description: 'Dépendance aux conditions climatiques',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Diversifier les cultures', 'Investir dans l\'irrigation', 'Assurance agricole']
          },
          {
            id: 'weak2',
            description: 'Accès limité au financement',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Demander financement FONGIP', 'Constituer un historique bancaire']
          }
        ],
        opportunities: [
          {
            id: 'opp1',
            description: 'Politique de souveraineté alimentaire',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Postuler aux programmes gouvernementaux', 'S\'aligner sur les priorités nationales']
          },
          {
            id: 'opp2',
            description: 'Demande croissante de produits biologiques',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Certification bio', 'Marketing produits naturels']
          }
        ],
        threats: [
          {
            id: 'threat1',
            description: 'Changement climatique',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Adaptation variétés résistantes', 'Techniques de conservation']
          },
          {
            id: 'threat2',
            description: 'Concurrence des importations',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Améliorer la qualité', 'Réduire les coûts']
          }
        ]
      },
      commerce: {
        strengths: [
          {
            id: 'str1',
            description: 'Emplacement stratégique',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Maximiser la visibilité', 'Optimiser l\'aménagement']
          },
          {
            id: 'str2',
            description: 'Réseau de fournisseurs établi',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Négocier de meilleurs prix', 'Diversifier les sources']
          }
        ],
        weaknesses: [
          {
            id: 'weak1',
            description: 'Stock limité de démarrage',
            impact: 'medium' as const,
            priority: 1,
            actionItems: ['Négocier des facilités de paiement', 'Rotation rapide']
          },
          {
            id: 'weak2',
            description: 'Manque d\'expérience digital',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Formation e-commerce', 'Partenariats plateformes']
          }
        ],
        opportunities: [
          {
            id: 'opp1',
            description: 'Croissance du pouvoir d\'achat',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Adapter l\'offre à la demande', 'Diversifier les gammes']
          },
          {
            id: 'opp2',
            description: 'Développement du e-commerce',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Créer boutique en ligne', 'Livraison à domicile']
          }
        ],
        threats: [
          {
            id: 'threat1',
            description: 'Concurrence informelle',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Différenciation par la qualité', 'Services additionnels']
          },
          {
            id: 'threat2',
            description: 'Fluctuations des prix',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Contrats long terme', 'Diversification fournisseurs']
          }
        ]
      },
      services: {
        strengths: [
          {
            id: 'str1',
            description: 'Expertise technique reconnue',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Valoriser l\'expertise', 'Certifications professionnelles']
          },
          {
            id: 'str2',
            description: 'Flexibilité et adaptation',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Services sur mesure', 'Réactivité client']
          }
        ],
        weaknesses: [
          {
            id: 'weak1',
            description: 'Dépendance aux compétences clés',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Formation équipe', 'Documentation processus']
          },
          {
            id: 'weak2',
            description: 'Capacité limitée de traitement',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Recrutement graduel', 'Outils productivité']
          }
        ],
        opportunities: [
          {
            id: 'opp1',
            description: 'Transformation numérique',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Services digitaux', 'Formation numérique']
          },
          {
            id: 'opp2',
            description: 'Marché régional en expansion',
            impact: 'medium' as const,
            priority: 2,
            actionItems: ['Expansion géographique', 'Partenariats régionaux']
          }
        ],
        threats: [
          {
            id: 'threat1',
            description: 'Concurrence internationale',
            impact: 'medium' as const,
            priority: 1,
            actionItems: ['Différenciation locale', 'Avantage proximité']
          },
          {
            id: 'threat2',
            description: 'Évolution technologique rapide',
            impact: 'high' as const,
            priority: 1,
            actionItems: ['Veille technologique', 'Formation continue']
          }
        ]
      }
    }

    return examples[sector as keyof typeof examples] || examples.services
  }

  const addSWOTItem = (category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats') => {
    const newItem: SWOTItem = {
      id: `${category}_${Date.now()}`,
      description: '',
      impact: 'medium',
      priority: 1,
      actionItems: []
    }

    switch (category) {
      case 'strengths':
        setStrengths(prev => [...prev, newItem])
        break
      case 'weaknesses':
        setWeaknesses(prev => [...prev, newItem])
        break
      case 'opportunities':
        setOpportunities(prev => [...prev, newItem])
        break
      case 'threats':
        setThreats(prev => [...prev, newItem])
        break
    }
  }

  const updateSWOTItem = (
    category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    itemId: string,
    updates: Partial<SWOTItem>
  ) => {
    const updateFunction = (items: SWOTItem[]) =>
      items.map(item => item.id === itemId ? { ...item, ...updates } : item)

    switch (category) {
      case 'strengths':
        setStrengths(updateFunction)
        break
      case 'weaknesses':
        setWeaknesses(updateFunction)
        break
      case 'opportunities':
        setOpportunities(updateFunction)
        break
      case 'threats':
        setThreats(updateFunction)
        break
    }
  }

  const removeSWOTItem = (
    category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    itemId: string
  ) => {
    const filterFunction = (items: SWOTItem[]) => items.filter(item => item.id !== itemId)

    switch (category) {
      case 'strengths':
        setStrengths(filterFunction)
        break
      case 'weaknesses':
        setWeaknesses(filterFunction)
        break
      case 'opportunities':
        setOpportunities(filterFunction)
        break
      case 'threats':
        setThreats(filterFunction)
        break
    }
  }

  // Gestion des actions
  const addAction = (category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', itemId: string, actionText: string) => {
    if (!actionText.trim()) return

    const updateFunc = (items: SWOTItem[]) => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, actionItems: [...item.actionItems, actionText] }
          : item
      )

    switch (category) {
      case 'strengths':
        setStrengths(updateFunc)
        break
      case 'weaknesses':
        setWeaknesses(updateFunc)
        break
      case 'opportunities':
        setOpportunities(updateFunc)
        break
      case 'threats':
        setThreats(updateFunc)
        break
    }
  }

  const removeAction = (category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', itemId: string, actionIndex: number) => {
    const updateFunc = (items: SWOTItem[]) =>
      items.map(item =>
        item.id === itemId
          ? { ...item, actionItems: item.actionItems.filter((_, idx) => idx !== actionIndex) }
          : item
      )

    switch (category) {
      case 'strengths':
        setStrengths(updateFunc)
        break
      case 'weaknesses':
        setWeaknesses(updateFunc)
        break
      case 'opportunities':
        setOpportunities(updateFunc)
        break
      case 'threats':
        setThreats(updateFunc)
        break
    }
  }

  const updateAction = (category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', itemId: string, actionIndex: number, newText: string) => {
    const updateFunc = (items: SWOTItem[]) =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              actionItems: item.actionItems.map((action, idx) =>
                idx === actionIndex ? newText : action
              )
            }
          : item
      )

    switch (category) {
      case 'strengths':
        setStrengths(updateFunc)
        break
      case 'weaknesses':
        setWeaknesses(updateFunc)
        break
      case 'opportunities':
        setOpportunities(updateFunc)
        break
      case 'threats':
        setThreats(updateFunc)
        break
    }
  }

  const generateStrategicRecommendations = () => {
    // Générer automatiquement des recommandations stratégiques
    const soStrategies = [
      'Exploiter les forces pour capitaliser sur les opportunités de marché',
      'Utiliser l\'expertise pour se positionner sur les nouveaux segments',
      'Tirer parti des avantages concurrentiels pour la croissance'
    ]

    const woStrategies = [
      'Corriger les faiblesses pour saisir les opportunités',
      'Investir dans la formation pour combler les lacunes',
      'Chercher des partenariats pour compenser les faiblesses'
    ]

    const stStrategies = [
      'Utiliser les forces pour minimiser l\'impact des menaces',
      'Développer des avantages défensifs durables',
      'Créer des barrières à l\'entrée grâce aux forces'
    ]

    const wtStrategies = [
      'Réduire les faiblesses et éviter les menaces',
      'Stratégie défensive de consolidation',
      'Rechercher des alliances stratégiques'
    ]

    setStrategicRecommendations({
      soStrategies,
      woStrategies,
      stStrategies,
      wtStrategies
    })
  }

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[impact]
  }

  const getImpactLabel = (impact: 'high' | 'medium' | 'low') => {
    const labels = {
      high: 'Élevé',
      medium: 'Moyen',
      low: 'Faible'
    }
    return labels[impact]
  }

  // Fonctions pour l'IA et documents
  const handleDocumentAnalysis = (analysis: DocumentAnalysisResult) => {
    if (analysis.suggestedSections?.swot) {
      const swotSuggestions = analysis.suggestedSections.swot

      // Ajouter les forces suggérées
      if (swotSuggestions.strengths) {
        swotSuggestions.strengths.forEach((strength, index) => {
          const newItem: SWOTItem = {
            id: `ai_str_${Date.now()}_${index}`,
            description: strength,
            impact: 'medium' as const,
            priority: 2,
            actionItems: []
          }
          setStrengths(prev => [...prev, newItem])
        })
      }

      // Ajouter les faiblesses suggérées
      if (swotSuggestions.weaknesses) {
        swotSuggestions.weaknesses.forEach((weakness, index) => {
          const newItem: SWOTItem = {
            id: `ai_weak_${Date.now()}_${index}`,
            description: weakness,
            impact: 'medium' as const,
            priority: 2,
            actionItems: []
          }
          setWeaknesses(prev => [...prev, newItem])
        })
      }

      // Ajouter les opportunités suggérées
      if (swotSuggestions.opportunities) {
        swotSuggestions.opportunities.forEach((opportunity, index) => {
          const newItem: SWOTItem = {
            id: `ai_opp_${Date.now()}_${index}`,
            description: opportunity,
            impact: 'medium' as const,
            priority: 2,
            actionItems: []
          }
          setOpportunities(prev => [...prev, newItem])
        })
      }

      // Ajouter les menaces suggérées
      if (swotSuggestions.threats) {
        swotSuggestions.threats.forEach((threat, index) => {
          const newItem: SWOTItem = {
            id: `ai_threat_${Date.now()}_${index}`,
            description: threat,
            impact: 'medium' as const,
            priority: 2,
            actionItems: []
          }
          setThreats(prev => [...prev, newItem])
        })
      }

      alert(`Analyse terminée ! ${analysis.summary}`)
    }
  }

  const handleAISuggestion = (suggestion: any) => {
    if (suggestion.type === 'suggestion') {
      // Ajouter une suggestion comme nouvel item SWOT (on peut demander à l'utilisateur dans quelle catégorie)
      const category = prompt('Dans quelle catégorie ajouter cette suggestion ?\n1: Forces\n2: Faiblesses\n3: Opportunités\n4: Menaces')

      if (category) {
        const newItem: SWOTItem = {
          id: `ai_sug_${Date.now()}`,
          description: suggestion.content,
          impact: 'medium' as const,
          priority: 2,
          actionItems: []
        }

        switch (category) {
          case '1':
            setStrengths(prev => [...prev, newItem])
            break
          case '2':
            setWeaknesses(prev => [...prev, newItem])
            break
          case '3':
            setOpportunities(prev => [...prev, newItem])
            break
          case '4':
            setThreats(prev => [...prev, newItem])
            break
        }
      }
    }
  }

  const handleSave = async () => {
    if (!user || !project) return

    setSaving(true)
    toast.loading('Sauvegarde en cours...', { id: 'swot-save' })

    try {
      // Construire l'objet SWOTAnalysis
      const swotData: SWOTAnalysis = {
        id: projectId,
        projectId: projectId,
        strengths,
        weaknesses,
        opportunities,
        threats,
        strategicRecommendations,
        lastUpdated: new Date()
      }

      // Sauvegarder via le service
      await projectService.updateProjectSection(projectId, user.uid, 'swotAnalysis', swotData as unknown as Record<string, unknown>)

      toast.success('Analyse SWOT sauvegardée avec succès', { id: 'swot-save' })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde', { id: 'swot-save' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Chargement de l'analyse SWOT...</p>
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
    <>
      <button
        type="button"
        onClick={() => setShowDocumentUploader(!showDocumentUploader)}
        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
      >
        <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
        Documents
      </button>
      <button
        type="button"
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <SparklesIcon className="h-4 w-4 mr-2" />
        Assistant IA
      </button>
      <button
        type="button"
        onClick={generateStrategicRecommendations}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <LightBulbIcon className="h-4 w-4 mr-2" />
        Générer stratégies
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
      <button
        type="button"
        onClick={() => setShowAIAssistant(true)}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
      >
        <SparklesIcon className="h-5 w-5 mr-2" />
        Assistant IA
      </button>
    </>
  )

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project.basicInfo.name}
      title="Analyse SWOT"
      subtitle={`Analyse des forces, faiblesses, opportunités et menaces - ${BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}`}
      actions={actions}
      project={project}
      currentSection="swot"
    >
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 mr-3 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">
              Matrice SWOT
            </h2>
          </div>
          <p className="text-slate-600">
            L'analyse SWOT identifie les Forces, Faiblesses, Opportunités et Menaces
            pour définir une stratégie adaptée au contexte sénégalais.
          </p>
        </div>

        {/* Outils IA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upload de documents */}
          {showDocumentUploader && (
            <div className="lg:col-span-1">
              <DocumentUploader
                projectId={projectId}
                userId={user?.uid || ''}
                onAnalysisComplete={handleDocumentAnalysis}
                className="h-full"
              />
            </div>
          )}

          {/* Assistant IA */}
          {showAIAssistant && project && (
            <div className={showDocumentUploader ? "lg:col-span-1" : "lg:col-span-2"}>
              <AIAssistant
                section="swot"
                sector={project.basicInfo.sector}
                project={project}
                currentData={{
                  strengths,
                  weaknesses,
                  opportunities,
                  threats
                }}
                onSuggestionApply={handleAISuggestion}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Matrice SWOT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* FORCES */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-green-800 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Forces (Strengths)
                </h3>
                <button
                  type="button"
                  onClick={() => addSWOTItem('strengths')}
                  className="text-green-600 hover:text-green-800"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {strengths.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune force identifiée</p>
              ) : (
                <div className="space-y-4">
                  {strengths.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateSWOTItem('strengths', item.id, { description: e.target.value })}
                          className="flex-1 font-medium text-gray-900 bg-transparent border-none focus:outline-none"
                          placeholder="Décrivez cette force..."
                        />
                        <button
                          type="button"
                          onClick={() => removeSWOTItem('strengths', item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <select
                          value={item.impact}
                          onChange={(e) => updateSWOTItem('strengths', item.id, {
                            impact: e.target.value as 'high' | 'medium' | 'low'
                          })}
                          className="text-xs px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1"
                        >
                          <option value="high">Impact Élevé</option>
                          <option value="medium">Impact Moyen</option>
                          <option value="low">Impact Faible</option>
                        </select>
                        <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(item.impact)}`}>
                          {getImpactLabel(item.impact)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-gray-700">Actions à entreprendre :</strong>
                        </div>
                        <ul className="space-y-2">
                          {item.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center gap-2 group bg-green-50 p-2 rounded">
                              <span className="text-green-600 font-bold">•</span>
                              <span className="flex-1">{action}</span>
                              <button
                                type="button"
                                onClick={() => removeAction('strengths', item.id, actionIndex)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer cette action"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Ajouter une action..."
                            value={newActionInputs[item.id] || ''}
                            onChange={(e) => setNewActionInputs({ ...newActionInputs, [item.id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newActionInputs[item.id]?.trim()) {
                                addAction('strengths', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newActionInputs[item.id]?.trim()) {
                                addAction('strengths', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FAIBLESSES */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-red-800 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Faiblesses (Weaknesses)
                </h3>
                <button
                  type="button"
                  onClick={() => addSWOTItem('weaknesses')}
                  className="text-red-600 hover:text-red-800"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {weaknesses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune faiblesse identifiée</p>
              ) : (
                <div className="space-y-4">
                  {weaknesses.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateSWOTItem('weaknesses', item.id, { description: e.target.value })}
                          className="flex-1 font-medium text-gray-900 bg-transparent border-none focus:outline-none"
                          placeholder="Décrivez cette faiblesse..."
                        />
                        <button
                          type="button"
                          onClick={() => removeSWOTItem('weaknesses', item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <select
                          value={item.impact}
                          onChange={(e) => updateSWOTItem('weaknesses', item.id, {
                            impact: e.target.value as 'high' | 'medium' | 'low'
                          })}
                          className="text-xs px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1"
                        >
                          <option value="high">Impact Élevé</option>
                          <option value="medium">Impact Moyen</option>
                          <option value="low">Impact Faible</option>
                        </select>
                        <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(item.impact)}`}>
                          {getImpactLabel(item.impact)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-gray-700">Actions correctives :</strong>
                        </div>
                        <ul className="space-y-2">
                          {item.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center gap-2 group bg-red-50 p-2 rounded">
                              <span className="text-red-600 font-bold">•</span>
                              <span className="flex-1">{action}</span>
                              <button
                                type="button"
                                onClick={() => removeAction('weaknesses', item.id, actionIndex)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer cette action"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Ajouter une action corrective..."
                            value={newActionInputs[item.id] || ''}
                            onChange={(e) => setNewActionInputs({ ...newActionInputs, [item.id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newActionInputs[item.id]?.trim()) {
                                addAction('weaknesses', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newActionInputs[item.id]?.trim()) {
                                addAction('weaknesses', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* OPPORTUNITÉS */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2" />
                  Opportunités (Opportunities)
                </h3>
                <button
                  type="button"
                  onClick={() => addSWOTItem('opportunities')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {opportunities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune opportunité identifiée</p>
              ) : (
                <div className="space-y-4">
                  {opportunities.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateSWOTItem('opportunities', item.id, { description: e.target.value })}
                          className="flex-1 font-medium text-gray-900 bg-transparent border-none focus:outline-none"
                          placeholder="Décrivez cette opportunité..."
                        />
                        <button
                          type="button"
                          onClick={() => removeSWOTItem('opportunities', item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <select
                          value={item.impact}
                          onChange={(e) => updateSWOTItem('opportunities', item.id, {
                            impact: e.target.value as 'high' | 'medium' | 'low'
                          })}
                          className="text-xs px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1"
                        >
                          <option value="high">Potentiel Élevé</option>
                          <option value="medium">Potentiel Moyen</option>
                          <option value="low">Potentiel Faible</option>
                        </select>
                        <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(item.impact)}`}>
                          {getImpactLabel(item.impact)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-gray-700">Comment saisir l'opportunité :</strong>
                        </div>
                        <ul className="space-y-2">
                          {item.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center gap-2 group bg-blue-50 p-2 rounded">
                              <span className="text-blue-600 font-bold">•</span>
                              <span className="flex-1">{action}</span>
                              <button
                                type="button"
                                onClick={() => removeAction('opportunities', item.id, actionIndex)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer cette action"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Ajouter une action..."
                            value={newActionInputs[item.id] || ''}
                            onChange={(e) => setNewActionInputs({ ...newActionInputs, [item.id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newActionInputs[item.id]?.trim()) {
                                addAction('opportunities', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newActionInputs[item.id]?.trim()) {
                                addAction('opportunities', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MENACES */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                  <FireIcon className="h-5 w-5 mr-2" />
                  Menaces (Threats)
                </h3>
                <button
                  type="button"
                  onClick={() => addSWOTItem('threats')}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {threats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune menace identifiée</p>
              ) : (
                <div className="space-y-4">
                  {threats.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateSWOTItem('threats', item.id, { description: e.target.value })}
                          className="flex-1 font-medium text-gray-900 bg-transparent border-none focus:outline-none"
                          placeholder="Décrivez cette menace..."
                        />
                        <button
                          type="button"
                          onClick={() => removeSWOTItem('threats', item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <select
                          value={item.impact}
                          onChange={(e) => updateSWOTItem('threats', item.id, {
                            impact: e.target.value as 'high' | 'medium' | 'low'
                          })}
                          className="text-xs px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1"
                        >
                          <option value="high">Risque Élevé</option>
                          <option value="medium">Risque Moyen</option>
                          <option value="low">Risque Faible</option>
                        </select>
                        <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(item.impact)}`}>
                          {getImpactLabel(item.impact)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-gray-700">Actions de mitigation :</strong>
                        </div>
                        <ul className="space-y-2">
                          {item.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center gap-2 group bg-orange-50 p-2 rounded">
                              <span className="text-orange-600 font-bold">•</span>
                              <span className="flex-1">{action}</span>
                              <button
                                type="button"
                                onClick={() => removeAction('threats', item.id, actionIndex)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer cette action"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Ajouter une action de mitigation..."
                            value={newActionInputs[item.id] || ''}
                            onChange={(e) => setNewActionInputs({ ...newActionInputs, [item.id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newActionInputs[item.id]?.trim()) {
                                addAction('threats', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newActionInputs[item.id]?.trim()) {
                                addAction('threats', item.id, newActionInputs[item.id])
                                setNewActionInputs({ ...newActionInputs, [item.id]: '' })
                              }
                            }}
                            className="px-3 py-2 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommandations stratégiques */}
        {strategicRecommendations.soStrategies.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2" />
              Recommandations Stratégiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Forces × Opportunités (SO)</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    {strategicRecommendations.soStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Faiblesses × Opportunités (WO)</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    {strategicRecommendations.woStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">→</span>
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Forces × Menaces (ST)</h4>
                  <ul className="space-y-1 text-sm text-orange-700">
                    {strategicRecommendations.stStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-500 mr-2">⚡</span>
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Faiblesses × Menaces (WT)</h4>
                  <ul className="space-y-1 text-sm text-red-700">
                    {strategicRecommendations.wtStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">🛡</span>
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de l'Assistant IA Conversationnel */}
        {showAIAssistant && project && (
          <BusinessPlanAIAssistant
            project={project}
            currentSection="swot"
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            onContentGenerated={(content, section) => {
              console.info('[SWOT IA] Contenu généré (copier-coller manuel)', {
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