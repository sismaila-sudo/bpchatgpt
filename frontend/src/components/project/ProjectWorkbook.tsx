'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Calculator,
  BarChart3,
  Download,
  Settings,
  ArrowLeft,
  Building,
  Receipt,
  Cog
} from 'lucide-react'
import Link from 'next/link'
import { OverviewTab } from './tabs/OverviewTab'
import { IdentityTab } from './tabs/IdentityTab'
import { FinancialDataTab } from './tabs/FinancialDataTab'
import { ResultsTab } from './tabs/ResultsTab'
import { TechnicalImpactTab } from './tabs/TechnicalImpactTab'
import { BusinessPlanTab } from './tabs/BusinessPlanTab'
import { ExistingFinancialAnalysisTab } from './tabs/ExistingFinancialAnalysisTab'
import { ExcelExportService } from '@/services/excelExport'
import { FinancialCalculationsService } from '@/services/financialCalculations'
import { createClient } from '@/lib/supabase/client'

// Tabs de base pour tous les projets
const baseTabs = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: BarChart3,
    component: OverviewTab
  },
  {
    id: 'identity',
    label: 'Identité',
    icon: Building,
    component: IdentityTab
  },
  {
    id: 'financial-data',
    label: 'Données Financières',
    icon: Calculator,
    component: FinancialDataTab
  },
  {
    id: 'results-ratios',
    label: 'Ratios & Résultats',
    icon: TrendingUp,
    component: ResultsTab
  },
  {
    id: 'technical-impact',
    label: 'Étude Technique & Impact',
    icon: Cog,
    component: TechnicalImpactTab
  },
  {
    id: 'business-plan',
    label: 'Business Plan',
    icon: Receipt,
    component: BusinessPlanTab
  }
]

// Onglet spécial pour entreprises en activité
const existingCompanyTab = {
  id: 'existing-analysis',
  label: 'Analyse Financière Existant',
  icon: FileText,
  component: ExistingFinancialAnalysisTab
}

interface ProjectWorkbookProps {
  project: any
}

export function ProjectWorkbook({ project }: ProjectWorkbookProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [existingCompanyAnalysis, setExistingCompanyAnalysis] = useState<any>(null)
  const supabase = createClient()

  // Gérer les entreprises en activité avec analyse pré-remplie
  useEffect(() => {
    // Pour les entreprises en activité, vérifier s'il y a des données d'analyse stockées
    if (project.mode === 'existing-company' || project.company_type === 'existing') {
      const storedAnalysis = localStorage.getItem('existing_company_analysis')
      if (storedAnalysis) {
        try {
          const analysisData = JSON.parse(storedAnalysis)
          if (analysisData.projectId === project.id) {
            setExistingCompanyAnalysis(analysisData.analysis)
            console.log('✅ Données d\'entreprise en activité chargées:', analysisData.analysis)
          }
        } catch (error) {
          console.error('Erreur parsing données analysis:', error)
        }
      }
    }
  }, [project.id, project.mode, project.company_type])

  // Construire la liste des tabs selon le type d'entreprise
  const isExistingCompany = project.mode === 'existing-company' || project.company_type === 'existing'

  const tabs = isExistingCompany
    ? [baseTabs[0], existingCompanyTab, ...baseTabs.slice(1)] // Dashboard, Analyse Existant, puis le reste
    : baseTabs

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component || OverviewTab

  // Écouter l'événement de calcul depuis l'onglet Aperçu
  useEffect(() => {
    const handleCalculation = () => {
      handleCalculate()
    }

    window.addEventListener('triggerCalculation', handleCalculation)
    return () => window.removeEventListener('triggerCalculation', handleCalculation)
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      console.log('Démarrage export pour projet:', project.id)

      // Récupérer toutes les données du projet
      const [products, salesProjections, opexItems, capexItems, scenarios, loans] = await Promise.all([
        supabase.from('products').select('*').eq('project_id', project.id),
        supabase.from('sales_projections').select('*').eq('project_id', project.id),
        supabase.from('opex_items').select('*').eq('project_id', project.id),
        supabase.from('capex_items').select('*').eq('project_id', project.id),
        supabase.from('scenarios').select('*').eq('project_id', project.id),
        supabase.from('loans').select('*').eq('project_id', project.id)
      ])

      // Récupérer les résultats financiers
      const { data: financialOutputs } = await supabase
        .from('financial_outputs')
        .select('*')
        .eq('project_id', project.id)
        .order('period')

      const exportData = {
        project,
        products: products.data || [],
        salesProjections: salesProjections.data || [],
        opexItems: opexItems.data || [],
        capexItems: capexItems.data || [],
        financialOutputs: financialOutputs || [],
        scenarios: scenarios.data || [],
        loans: loans.data || []
      }

      await ExcelExportService.exportBusinessPlan(exportData)
      alert('Export Excel terminé avec succès!')
    } catch (error) {
      console.error('Erreur export:', error)
      alert('Erreur lors de l\'export: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSettings = () => {
    setShowSettings(!showSettings)
  }

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      console.log('Démarrage calcul pour projet:', project.id)

      // Vérifier que les données nécessaires sont présentes
      const [productsResult, salesResult] = await Promise.all([
        supabase.from('products_services').select('*').eq('project_id', project.id),
        supabase.from('sales_projections').select('*').eq('project_id', project.id)
      ])

      const products = productsResult.data || []
      const sales = salesResult.data || []

      // Validation des données
      if (products.length === 0) {
        alert('⚠️ Aucun produit ou service défini !\n\nVeuillez d\'abord ajouter vos produits/services dans l\'onglet "Données Financières" avant de lancer le calcul.')
        return
      }

      if (sales.length === 0) {
        alert('⚠️ Aucune projection de vente définie !\n\nVeuillez d\'abord ajouter vos prévisions de vente dans l\'onglet "Données Financières" avant de lancer le calcul.')
        return
      }

      // Vérifier que les projections de vente ont des quantités
      const hasValidSales = sales.some(sale => sale.volume && sale.volume > 0)
      if (!hasValidSales) {
        alert('⚠️ Aucune quantité de vente définie !\n\nVeuillez définir des quantités de vente réalistes dans vos projections avant de lancer le calcul.')
        return
      }

      // 🔧 UTILISER L'API LOCALE au lieu de l'ancienne API externe défaillante
      const response = await fetch(`/api/simple/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: project.id
        })
      })

      const result = await response.json()
      console.log('Réponse calcul:', result)

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors du calcul')
      }

      // ✅ Utiliser le service centralisé pour afficher le vrai CA
      const realRevenue = await FinancialCalculationsService.calculateRealRevenue(project.id)

      alert(`✅ Calcul terminé avec succès !\n\nCA Total (recalculé): ${FinancialCalculationsService.formatCurrency(realRevenue.totalRevenue)}`)

      // Rafraîchir la page pour voir les résultats
      window.location.reload()
    } catch (error) {
      console.error('Erreur calcul:', error)
      alert('❌ Erreur lors du calcul: ' + error.message)
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Premium - Double hauteur */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl">
        {/* Section du haut - Info projet */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center text-blue-100 hover:text-white transition-all duration-300 hover:transform hover:scale-110"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                    {project.name}
                  </h1>
                  {project.mode && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.mode === 'existing-company'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {project.mode === 'existing-company' ? 'Entreprise en Activité' : 'Nouvelle Entreprise'}
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-base">
                  {project.sector} • {project.horizon_years} ans • {project.organizations?.currency || 'XOF'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <Calculator className="h-5 w-5 mr-2" />
                {isCalculating ? 'Calcul...' : 'Calculer'}
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <Download className="h-5 w-5 mr-2" />
                {isExporting ? 'Export...' : 'Exporter'}
              </Button>
              <Button
                onClick={handleSettings}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section du bas - Navigation premium */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 border-t border-white/10">
          <nav className="flex space-x-2 px-8 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group flex items-center space-x-3 py-4 px-6 font-semibold text-base whitespace-nowrap transition-all duration-300 rounded-t-xl border-b-4 min-w-fit
                    transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl
                    ${activeTab === tab.id
                      ? 'border-yellow-400 text-white bg-gradient-to-t from-white/20 to-white/30 shadow-lg'
                      : 'border-transparent text-blue-100 hover:text-white hover:bg-gradient-to-t hover:from-white/10 hover:to-white/20 hover:border-white/50'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-all duration-300 ${
                    activeTab === tab.id ? 'text-yellow-400' : 'text-blue-200 group-hover:text-white'
                  }`} />
                  <span className="font-bold tracking-wide">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Tab Content avec design premium */}
      <main className="flex-1 px-8 py-8 max-w-7xl mx-auto">
        {showSettings ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Paramètres du Projet</h2>
              <Button variant="ghost" size="sm" onClick={handleSettings}>
                ✕
              </Button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom du projet</label>
                    <input
                      type="text"
                      value={project.name}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Secteur</label>
                    <input
                      type="text"
                      value={project.sector}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de début</label>
                    <input
                      type="date"
                      value={project.start_date}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Horizon (années)</label>
                    <input
                      type="number"
                      value={project.horizon_years}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      disabled
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="flex space-x-4">
                  <Button variant="outline">
                    Modifier le projet
                  </Button>
                  <Button variant="outline">
                    Archiver le projet
                  </Button>
                  <Button variant="destructive">
                    Supprimer le projet
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ActiveComponent
            project={project}
            existingCompanyAnalysis={existingCompanyAnalysis}
          />
        )}
      </main>

      {/* Status Bar */}
      <footer className="bg-white border-t px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Statut: {project.status === 'draft' ? 'Brouillon' : 'Actif'}</span>
            <span>•</span>
            <span>Dernière modification: {new Date(project.updated_at).toLocaleDateString('fr-FR')}</span>
          </div>
          <div>
            Business Plan Generator v1.0
          </div>
        </div>
      </footer>
    </div>
  )
}