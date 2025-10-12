'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { MarketingPlan, ProductStrategy, PricingStrategy, DistributionStrategy, PromotionStrategy } from '@/types/businessPlan'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
  MegaphoneIcon,
  CurrencyDollarIcon,
  TruckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { LazyBusinessPlanAIAssistant as BusinessPlanAIAssistant } from '@/components/LazyComponents'
import ImageUpload from '@/components/ImageUpload'

function deepMerge<T>(base: T, patch: any): T {
  if (patch == null || typeof patch !== 'object') return base
  const output: any = Array.isArray(base) ? [...(Array.isArray(patch) ? patch : base)] : { ...base }
  if (Array.isArray(base)) {
    return output as T
  }
  for (const key of Object.keys(patch)) {
    const b: any = (base as any)[key]
    const p: any = patch[key]
    if (p && typeof p === 'object' && !Array.isArray(p) && b && typeof b === 'object' && !Array.isArray(b)) {
      output[key] = deepMerge(b, p)
    } else {
      output[key] = p ?? b
    }
  }
  return output as T
}

function makeDefaultMarketingPlan(projectId: string): MarketingPlan {
  return {
    id: projectId,
    projectId: projectId,
    strategy: {
      positioning: '',
      valueProposition: '',
      brandIdentity: {
        name: '',
        logo: '',
        colors: [],
        slogan: ''
      },
      targetSegments: []
    },
    marketingMix: {
      product: {
        core: '',
        features: [],
        benefits: [],
        differentiation: [],
        lifecycle: 'introduction',
        development: {
          roadmap: [],
          innovations: []
        }
      },
      price: {
        strategy: 'value',
        basePrice: 0,
        priceRange: { min: 0, max: 0 },
        paymentTerms: [],
        discounts: []
      },
      place: {
        channels: [],
        coverage: 'selective',
        partnerships: {
          retailers: [],
          distributors: [],
          onlineMarketplaces: []
        },
        logistics: {
          warehousing: '',
          transportation: '',
          inventory: ''
        }
      },
      promotion: {
        communication: {
          mainMessage: '',
          channels: [],
          budget: 0
        },
        salesPromotion: {
          launches: [],
          loyalty: [],
          incentives: []
        },
        publicRelations: {
          events: [],
          partnerships: [],
          community: []
        },
        digitalMarketing: {
          website: false,
          socialMedia: [],
          seo: false,
          advertising: []
        }
      }
    },
    actionPlan: {
      launchStrategy: {
        phases: [],
        budget: 0,
        timeline: '',
        successMetrics: []
      },
      campaigns: [],
      budget: {
        total: 0,
        allocation: {
          advertising: 0,
          promotion: 0,
          events: 0,
          digital: 0,
          pr: 0,
          other: 0
        },
        breakdown: {
          year1: 0,
          year2: 0,
          year3: 0
        }
      },
      timeline: []
    },
    kpis: {
      awarenessTargets: 0,
      acquisitionTargets: 0,
      retentionTargets: 0,
      revenueTargets: []
    },
    lastUpdated: new Date()
  }
}

export default function MarketingPlanPage() {
  const params = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  const projectId = params.id as string

  // État initial du plan marketing
  const [marketingPlan, setMarketingPlan] = useState<MarketingPlan>(makeDefaultMarketingPlan(projectId))

  // Images pour le marketing (produits, publicité, etc.)
  const [productImages, setProductImages] = useState<string[]>([])

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
          const saved = await projectService.getProjectSection(projectId, user.uid, 'marketingPlan')
          if (saved) {
            const savedData = saved as any
            setMarketingPlan(prev => deepMerge(makeDefaultMarketingPlan(projectId), saved))
            // Charger les images si elles existent
            if (savedData.productImages) {
              setProductImages(savedData.productImages)
            }
          } else if (projectData.businessPlan?.marketingPlan) {
            // fallback éventuel si ancien schéma
            setMarketingPlan(prev => deepMerge(makeDefaultMarketingPlan(projectId), projectData.businessPlan!.marketingPlan))
          }
        } catch (e) {
          console.error('Erreur chargement section marketingPlan:', e)
          if (projectData.businessPlan?.marketingPlan) {
            setMarketingPlan(prev => deepMerge(makeDefaultMarketingPlan(projectId), projectData.businessPlan!.marketingPlan))
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du projet:', err)
      toast.error('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const saveMarketingPlan = async () => {
    if (!user || !projectId) return

    setSaving(true)
    try {
      await projectService.updateProjectSection(
        projectId,
        user.uid,
        'marketingPlan',
        { ...marketingPlan, lastUpdated: new Date(), productImages } as unknown as Record<string, unknown>
      )
      toast.success('Plan marketing sauvegardé avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAIContentGenerated = async (content: string, section: string) => {
    // ✅ MODE COPIER-COLLER PUR : Pas d'intégration automatique
    // L'utilisateur copie manuellement le contenu généré depuis le modal IA

    console.info('[Marketing IA] Contenu généré (copier-coller manuel)', {
      section,
      contentLength: content?.length || 0,
      timestamp: new Date().toISOString()
    })

    // Note : Le contenu est affiché dans le modal BusinessPlanAIAssistant
    // L'utilisateur le copie et le colle où il le souhaite dans le formulaire
    // Aucune modification automatique des champs du formulaire
  }

  const addTargetSegment = () => {
    setMarketingPlan(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        targetSegments: [...prev.strategy.targetSegments, '']
      }
    }))
  }

  const updateTargetSegment = (index: number, value: string) => {
    setMarketingPlan(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        targetSegments: prev.strategy.targetSegments.map((seg, i) => i === index ? value : seg)
      }
    }))
  }

  const removeTargetSegment = (index: number) => {
    setMarketingPlan(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        targetSegments: prev.strategy.targetSegments.filter((_, i) => i !== index)
      }
    }))
  }

  if (!user) {
    return <div>Veuillez vous connecter</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Chargement du plan marketing...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Projet introuvable</h2>
          <Link href="/projects" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ModernProjectLayout
      projectId={project.id}
      projectName={project.basicInfo.name}
      title="Plan Marketing"
      subtitle="Stratégie marketing et commercialisation"
      project={project}
      currentSection="marketing"
    >
      <div className="space-y-6">

        {/* Bouton de sauvegarde flottant */}
        <div className="flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10 -mx-6 px-6 py-4 border-b border-slate-200">
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <SparklesIcon className="w-5 h-5" />
            Assistant IA
          </button>

          <button
            onClick={saveMarketingPlan}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* Stratégie Marketing */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Stratégie Marketing</h2>
          </div>

          <div className="space-y-6">
            {/* Positionnement */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Positionnement
              </label>
              <textarea
                value={marketingPlan.strategy.positioning}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  strategy: { ...prev.strategy, positioning: e.target.value }
                }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Comment voulez-vous être perçu par vos clients ?"
              />
            </div>

            {/* Proposition de valeur */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Proposition de valeur
              </label>
              <textarea
                value={marketingPlan.strategy.valueProposition}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  strategy: { ...prev.strategy, valueProposition: e.target.value }
                }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Quelle valeur unique apportez-vous à vos clients ?"
              />
            </div>

            {/* Identité de marque */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom de la marque
                </label>
                <input
                  type="text"
                  value={marketingPlan.strategy.brandIdentity.name}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    strategy: {
                      ...prev.strategy,
                      brandIdentity: { ...prev.strategy.brandIdentity, name: e.target.value }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={marketingPlan.strategy.brandIdentity.slogan}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    strategy: {
                      ...prev.strategy,
                      brandIdentity: { ...prev.strategy.brandIdentity, slogan: e.target.value }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre accroche marketing"
                />
              </div>
            </div>

            {/* Segments cibles */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Segments cibles
                </label>
                <button
                  onClick={addTargetSegment}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {marketingPlan.strategy.targetSegments.map((segment, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={segment}
                      onChange={(e) => updateTargetSegment(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Jeunes professionnels 25-35 ans"
                    />
                    <button
                      onClick={() => removeTargetSegment(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Mix - Produit */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <MegaphoneIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">Marketing Mix - Produit</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Produit/Service principal
              </label>
              <input
                type="text"
                value={marketingPlan.marketingMix.product.core}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  marketingMix: {
                    ...prev.marketingMix,
                    product: { ...prev.marketingMix.product, core: e.target.value }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez votre produit/service principal"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cycle de vie
              </label>
              <select
                value={marketingPlan.marketingMix.product.lifecycle}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  marketingMix: {
                    ...prev.marketingMix,
                    product: {
                      ...prev.marketingMix.product,
                      lifecycle: e.target.value as 'introduction' | 'growth' | 'maturity' | 'decline'
                    }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="introduction">Introduction</option>
                <option value="growth">Croissance</option>
                <option value="maturity">Maturité</option>
                <option value="decline">Déclin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Marketing Mix - Prix */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-slate-900">Marketing Mix - Prix</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Stratégie de prix
                </label>
                <select
                  value={marketingPlan.marketingMix.price.strategy}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    marketingMix: {
                      ...prev.marketingMix,
                      price: {
                        ...prev.marketingMix.price,
                        strategy: e.target.value as any
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cost_plus">Coût plus marge</option>
                  <option value="competition">Basé sur la concurrence</option>
                  <option value="value">Basé sur la valeur</option>
                  <option value="penetration">Pénétration</option>
                  <option value="skimming">Écrémage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prix de base (FCFA)
                </label>
                <input
                  type="number"
                  value={marketingPlan.marketingMix.price.basePrice}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    marketingMix: {
                      ...prev.marketingMix,
                      price: { ...prev.marketingMix.price, basePrice: Number(e.target.value) }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prix minimum (FCFA)
                </label>
                <input
                  type="number"
                  value={marketingPlan.marketingMix.price.priceRange.min}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    marketingMix: {
                      ...prev.marketingMix,
                      price: {
                        ...prev.marketingMix.price,
                        priceRange: { ...prev.marketingMix.price.priceRange, min: Number(e.target.value) }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prix maximum (FCFA)
                </label>
                <input
                  type="number"
                  value={marketingPlan.marketingMix.price.priceRange.max}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    marketingMix: {
                      ...prev.marketingMix,
                      price: {
                        ...prev.marketingMix.price,
                        priceRange: { ...prev.marketingMix.price.priceRange, max: Number(e.target.value) }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Mix - Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TruckIcon className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-slate-900">Marketing Mix - Distribution</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Couverture
              </label>
              <select
                value={marketingPlan.marketingMix.place.coverage}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  marketingMix: {
                    ...prev.marketingMix,
                    place: {
                      ...prev.marketingMix.place,
                      coverage: e.target.value as 'intensive' | 'selective' | 'exclusive'
                    }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="intensive">Intensive</option>
                <option value="selective">Sélective</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Logistique - Entreposage
              </label>
              <textarea
                value={marketingPlan.marketingMix.place.logistics.warehousing}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  marketingMix: {
                    ...prev.marketingMix,
                    place: {
                      ...prev.marketingMix.place,
                      logistics: { ...prev.marketingMix.place.logistics, warehousing: e.target.value }
                    }
                  }
                }))}
                rows={2}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez votre stratégie d'entreposage"
              />
            </div>
          </div>
        </div>

        {/* Budget Marketing */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Budget Marketing</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Budget total (FCFA)
              </label>
              <input
                type="number"
                value={marketingPlan.actionPlan.budget.total}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  actionPlan: {
                    ...prev.actionPlan,
                    budget: { ...prev.actionPlan.budget, total: Number(e.target.value) }
                  }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Année 1 (FCFA)
                </label>
                <input
                  type="number"
                  value={marketingPlan.actionPlan.budget.breakdown.year1}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    actionPlan: {
                      ...prev.actionPlan,
                      budget: {
                        ...prev.actionPlan.budget,
                        breakdown: { ...prev.actionPlan.budget.breakdown, year1: Number(e.target.value) }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Année 2 (FCFA)
                </label>
                <input
                  type="number"
                  value={marketingPlan.actionPlan.budget.breakdown.year2}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    actionPlan: {
                      ...prev.actionPlan,
                      budget: {
                        ...prev.actionPlan.budget,
                        breakdown: { ...prev.actionPlan.budget.breakdown, year2: Number(e.target.value) }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Année 3 (FCFA)
                </label>
                <input
                  type="number"
                  value={marketingPlan.actionPlan.budget.breakdown.year3}
                  onChange={(e) => setMarketingPlan(prev => ({
                    ...prev,
                    actionPlan: {
                      ...prev.actionPlan,
                      budget: {
                        ...prev.actionPlan.budget,
                        breakdown: { ...prev.actionPlan.budget.breakdown, year3: Number(e.target.value) }
                      }
                    }
                  }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">KPIs et Objectifs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Objectif de notoriété (%)
              </label>
              <input
                type="number"
                value={marketingPlan.kpis.awarenessTargets}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  kpis: { ...prev.kpis, awarenessTargets: Number(e.target.value) }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Objectif d'acquisition (clients)
              </label>
              <input
                type="number"
                value={marketingPlan.kpis.acquisitionTargets}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  kpis: { ...prev.kpis, acquisitionTargets: Number(e.target.value) }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Objectif de rétention (%)
              </label>
              <input
                type="number"
                value={marketingPlan.kpis.retentionTargets}
                onChange={(e) => setMarketingPlan(prev => ({
                  ...prev,
                  kpis: { ...prev.kpis, retentionTargets: Number(e.target.value) }
                }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Images de produits/supports marketing */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">Images Marketing</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Ajoutez des visuels de vos produits, de vos supports marketing ou toute autre image illustrant votre stratégie commerciale.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Image {index + 1} (optionnel)
                </label>
                <ImageUpload
                  value={productImages[index] || ''}
                  onChange={(url) => {
                    const newImages = [...productImages]
                    newImages[index] = url || ''
                    setProductImages(newImages)
                  }}
                  maxSize={5}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Ces images apparaîtront dans l'export PDF et enrichiront votre plan marketing.
          </p>
        </div>

      </div>

      {/* Assistant IA Modal */}
      {project && showAIAssistant && (
        <BusinessPlanAIAssistant
          project={project}
          currentSection="marketing"
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onContentGenerated={handleAIContentGenerated}
          userId={user?.uid} // Activer cohérence inter-sections
        />
      )}
    </ModernProjectLayout>
  )
}
