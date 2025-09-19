'use client'

import { useState } from 'react'
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
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { OverviewTab } from './tabs/OverviewTab'
import { ProductsTab } from './tabs/ProductsTab'
import { SalesTab } from './tabs/SalesTab'
import { OpexTab } from './tabs/OpexTab'
import { CapexTab } from './tabs/CapexTab'
import { PayrollTab } from './tabs/PayrollTab'
import { TaxesTab } from './tabs/TaxesTab'
import { WorkingCapitalTab } from './tabs/WorkingCapitalTab'
import { RatiosTab } from './tabs/RatiosTab'
import { ResultsTab } from './tabs/ResultsTab'
import { ScenariosTab } from './tabs/ScenariosTab'
import { FinancingTab } from './tabs/FinancingTab'
import { BusinessPlanTab } from './tabs/BusinessPlanTab'
import { ExcelExportService } from '@/services/excelExport'
import { createClient } from '@/lib/supabase/client'

const tabs = [
  {
    id: 'overview',
    label: 'Synoptique',
    icon: FileText,
    component: OverviewTab
  },
  {
    id: 'products',
    label: 'Produits/Services',
    icon: Package,
    component: ProductsTab
  },
  {
    id: 'sales',
    label: 'Ventes',
    icon: TrendingUp,
    component: SalesTab
  },
  {
    id: 'capex',
    label: 'CAPEX',
    icon: DollarSign,
    component: CapexTab
  },
  {
    id: 'opex',
    label: 'OPEX',
    icon: Building,
    component: OpexTab
  },
  {
    id: 'payroll',
    label: 'Paie',
    icon: Users,
    component: PayrollTab
  },
  {
    id: 'taxes',
    label: 'Taxes',
    icon: Receipt,
    component: TaxesTab
  },
  {
    id: 'working-capital',
    label: 'BFR',
    icon: Calculator,
    component: WorkingCapitalTab
  },
  {
    id: 'ratios',
    label: 'Ratios',
    icon: TrendingUp,
    component: RatiosTab
  },
  {
    id: 'results',
    label: 'Résultats',
    icon: BarChart3,
    component: ResultsTab
  },
  {
    id: 'scenarios',
    label: 'Scénarios',
    icon: Settings,
    component: ScenariosTab
  },
  {
    id: 'business-plan',
    label: 'Business Plan IA',
    icon: FileText,
    component: BusinessPlanTab
  },
  {
    id: 'financing',
    label: 'Financements',
    icon: DollarSign,
    component: FinancingTab
  }
]

interface ProjectWorkbookProps {
  project: any
}

export function ProjectWorkbook({ project }: ProjectWorkbookProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const supabase = createClient()

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component || OverviewTab

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/simple/calculate`, {
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

      alert(`Calcul terminé ! Revenue total: ${result.summary?.total_revenue?.toLocaleString()} XOF`)

      // Rafraîchir la page pour voir les résultats
      window.location.reload()
    } catch (error) {
      console.error('Erreur calcul:', error)
      alert('Erreur lors du calcul: ' + error.message)
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
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                  {project.name}
                </h1>
                <p className="text-blue-100 text-base mt-1">
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
          <ActiveComponent project={project} />
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