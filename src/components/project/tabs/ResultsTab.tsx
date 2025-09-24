'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, TrendingUp, DollarSign, AlertTriangle, LineChart, Download } from 'lucide-react'
import { FinancialCharts } from '../charts/FinancialCharts'
import { ExcelExportService } from '@/services/excelExport'
import { FinancialCalculationsService } from '@/services/financialCalculations'
import { Button } from '@/components/ui/button'

interface FinancialOutput {
  id: string
  year: number
  month: number
  revenue: number
  cogs: number
  gross_margin: number
  gross_margin_percent: number
  total_opex: number
  depreciation: number
  ebitda: number
  ebit: number
  net_income: number
  cash_flow: number
}

interface ResultsTabProps {
  project: any
}

export function ResultsTab({ project }: ResultsTabProps) {
  const [financialData, setFinancialData] = useState<FinancialOutput[]>([])
  const [realRevenueSummary, setRealRevenueSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'monthly' | 'annual' | 'charts'>('annual')
  const [exporting, setExporting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadFinancialData()
  }, [project.id])

  const loadFinancialData = async () => {
    try {
      // 🔄 Utiliser le service centralisé pour obtenir les vrais calculs
      const realData = await FinancialCalculationsService.calculateRealRevenue(project.id)
      setRealRevenueSummary(realData)

      // Comparer avec les données stockées pour diagnostic
      const comparison = await FinancialCalculationsService.compareWithStoredData(project.id)
      if (!comparison.isConsistent) {
        console.warn('⚠️ Incohérence détectée entre données réelles et stockées')
        console.warn(`CA Réel: ${comparison.realRevenue.toLocaleString()}`)
        console.warn(`CA Stocké: ${comparison.storedRevenue.toLocaleString()}`)
      }

      // Toujours charger financial_outputs pour les autres données (profit, cash flow, etc.)
      const { data, error } = await supabase
        .from('financial_outputs')
        .select('*')
        .eq('project_id', project.id)
        .order('year')
        .order('month')

      if (error) throw error

      // ✅ Corriger les revenues dans financial_outputs avec les vraies données
      const correctedData = await Promise.all((data || []).map(async row => ({
        ...row,
        // Remplacer le revenue stocké par le vrai calcul pour cette période
        revenue: await calculateMonthRevenue(row.year, row.month)
      })))

      setFinancialData(correctedData)
    } catch (error) {
      console.error('Erreur chargement données financières:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction helper pour calculer le CA d'un mois spécifique (avec filtrage par date de démarrage)
  const calculateMonthRevenue = async (year: number, month: number): Promise<number> => {
    try {
      // Vérifier si cette date est avant la date de démarrage du projet (comme SalesTab)
      const projectStartDate = new Date(project.start_date)
      const inputDate = new Date(year, month - 1, 1)

      // Si c'est avant la date de démarrage, retourner 0
      if (inputDate < projectStartDate) {
        return 0
      }

      const { data: projections } = await supabase
        .from('sales_projections')
        .select('*, products_services(*)')
        .eq('project_id', project.id)
        .eq('year', year)
        .eq('month', month)

      return (projections || []).reduce((sum: number, proj: any) => {
        if (proj.products_services && proj.volume > 0) {
          return sum + (proj.volume * proj.products_services.unit_price)
        }
        return sum
      }, 0)
    } catch (error) {
      console.error('Erreur calcul revenue mensuel:', error)
      return 0
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      // Récupérer toutes les données nécessaires
      const [productsRes, salesRes, opexRes, capexRes, scenariosRes, loansRes] = await Promise.all([
        supabase.from('products_services').select('*').eq('project_id', project.id),
        supabase.from('sales_projections').select('*').eq('project_id', project.id),
        supabase.from('opex').select('*').eq('project_id', project.id),
        supabase.from('capex').select('*').eq('project_id', project.id),
        supabase.from('scenarios').select('*').eq('project_id', project.id),
        supabase.from('loans').select('*').eq('project_id', project.id)
      ])

      const exportData = {
        project,
        products: productsRes.data || [],
        salesProjections: salesRes.data || [],
        opexItems: opexRes.data || [],
        capexItems: capexRes.data || [],
        scenarios: scenariosRes.data || [],
        loans: loansRes.data || [],
        financialOutputs: financialData
      }

      await ExcelExportService.exportBusinessPlan(exportData)
    } catch (error) {
      console.error('Erreur export Excel:', error)
      alert('Erreur lors de l\'export Excel')
    } finally {
      setExporting(false)
    }
  }

  const aggregateByYear = (data: FinancialOutput[]) => {
    const yearlyData: Record<number, any> = {}

    data.forEach(row => {
      if (!yearlyData[row.year]) {
        yearlyData[row.year] = {
          year: row.year,
          revenue: 0,
          cogs: 0,
          gross_margin: 0,
          total_opex: 0,
          ebitda: 0,
          depreciation: 0,
          ebit: 0,
          net_income: 0,
          cash_flow: 0,
          months: 0
        }
      }

      const yearly = yearlyData[row.year]
      yearly.revenue += row.revenue || 0
      yearly.cogs += row.cogs || 0
      yearly.gross_margin += row.gross_margin || 0
      yearly.total_opex += row.total_opex || 0
      yearly.ebitda += row.ebitda || 0
      yearly.depreciation += row.depreciation || 0
      yearly.ebit += row.ebit || 0
      yearly.net_income += row.net_income || 0
      yearly.cash_flow += row.cash_flow || 0
      yearly.months++
    })

    return Object.values(yearlyData).map(year => ({
      ...year,
      gross_margin_percent: year.revenue > 0 ? (year.gross_margin / year.revenue) * 100 : 0,
      ebitda_margin: year.revenue > 0 ? (year.ebitda / year.revenue) * 100 : 0,
      net_margin: year.revenue > 0 ? (year.net_income / year.revenue) * 100 : 0
    }))
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 XOF'
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: project.organizations?.currency || 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%'
    }
    return `${value.toFixed(1)}%`
  }

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ]
    return months[month - 1]
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement des résultats...</p>
        </div>
      </div>
    )
  }

  if (financialData.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun résultat calculé
          </h3>
          <p className="text-gray-600 mb-4">
            Cliquez sur "Calculer" dans la barre d'outils pour générer vos projections financières
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">
              Prérequis pour le calcul :
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Au moins 1 produit/service défini</li>
              <li>• Projections de ventes renseignées</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const displayData = selectedView === 'annual' ? aggregateByYear(financialData) : financialData
  const totalRevenue = financialData.reduce((sum, row) => sum + (row.revenue || 0), 0)
  const totalProfit = financialData.reduce((sum, row) => sum + (row.net_income || 0), 0)
  const minCashFlow = Math.min(...financialData.map(row => row.cash_flow || 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            Résultats Financiers
          </h2>
          <p className="text-gray-600 mt-1">
            Analyse des projections calculées sur {project.horizon_years} ans
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navigation des vues */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedView === 'annual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vue annuelle
            </button>
            <button
              onClick={() => setSelectedView('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedView === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vue mensuelle
            </button>
            <button
              onClick={() => setSelectedView('charts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedView === 'charts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LineChart className="h-4 w-4 mr-2 inline" />
              Graphiques
            </button>
          </div>

          {/* Bouton Export */}
          <Button
            onClick={handleExportExcel}
            disabled={exporting || financialData.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Export...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {/* KPIs - Toujours visibles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bénéfice Total</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Marge Nette</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalRevenue > 0 ? formatPercent((totalProfit / totalRevenue) * 100) : '0%'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cash Flow Min</p>
                <p className={`text-2xl font-bold ${minCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(minCashFlow)}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${minCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu conditionnel selon la vue sélectionnée */}
      {selectedView === 'charts' ? (
        /* Vue graphiques uniquement */
        <FinancialCharts
          data={financialData}
          currency={project.organizations?.currency || 'XOF'}
        />
      ) : (
        /* Vues tableaux (annuelle et mensuelle) */
        <>
          {/* Compte de résultat */}
          <Card>
            <CardHeader>
              <CardTitle>
                Compte de Résultat {selectedView === 'annual' ? 'Annuel' : 'Mensuel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        {selectedView === 'annual' ? 'Année' : 'Période'}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Chiffre d'affaires</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Coût des ventes</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Marge brute</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">OPEX</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">EBITDA</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Résultat net</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Marge %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {selectedView === 'annual'
                            ? row.year
                            : `${getMonthName(row.month)} ${row.year}`
                          }
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(row.gross_margin)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(row.total_opex)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={row.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(row.ebitda)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span className={row.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(row.net_income)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={row.net_margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercent(row.net_margin)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Flux de trésorerie */}
          <Card>
            <CardHeader>
              <CardTitle>
                Flux de Trésorerie {selectedView === 'annual' ? 'Annuel' : 'Mensuel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        {selectedView === 'annual' ? 'Année' : 'Période'}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Cash Flow</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Amortissement</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">EBIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {selectedView === 'annual'
                            ? row.year
                            : `${getMonthName(row.month)} ${row.year}`
                          }
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span className={row.cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(row.cash_flow)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(row.depreciation)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={row.ebit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(row.ebit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Alertes et recommandations */}
      {minCashFlow < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-900 mb-1">
                Cash flow négatif détecté
              </h3>
              <p className="text-sm text-red-700">
                Votre projet présente un cash flow minimal de {formatCurrency(minCashFlow)}.
                Vérifiez vos charges et investissements.
              </p>
            </div>
          </div>
        </div>
      )}

      {totalProfit > 0 && minCashFlow >= 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                Projet financièrement viable
              </h3>
              <p className="text-sm text-green-700">
                Votre projet génère un bénéfice de {formatCurrency(totalProfit)}
                avec une marge nette de {formatPercent((totalProfit / totalRevenue) * 100)}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}