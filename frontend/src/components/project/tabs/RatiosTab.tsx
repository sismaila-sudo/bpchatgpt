'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  Calculator,
  DollarSign,
  Percent,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RatioConfig {
  id?: string
  project_id: string
  ratio_type: 'VAN' | 'TRI' | 'DSCR' | 'ROI' | 'PAYBACK' | 'MARGE_BRUTE' | 'MARGE_NETTE' | 'SEUIL_RENTABILITE'
  name: string
  target_value: number
  warning_threshold: number
  critical_threshold: number
  unit: '%' | 'XOF' | 'RATIO' | 'MOIS' | 'ANNEES'
  calculation_method: string
  is_active: boolean
}

interface CalculatedRatio {
  type: string
  name: string
  value: number
  unit: string
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
}

interface RatiosTabProps {
  project: any
}

export function RatiosTab({ project }: RatiosTabProps) {
  const [ratioConfigs, setRatioConfigs] = useState<RatioConfig[]>([])
  const [calculatedRatios, setCalculatedRatios] = useState<CalculatedRatio[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Omit<RatioConfig, 'id'>>({
    project_id: project.id,
    ratio_type: 'VAN',
    name: '',
    target_value: 0,
    warning_threshold: 0,
    critical_threshold: 0,
    unit: 'XOF',
    calculation_method: 'NPV_STANDARD',
    is_active: true
  })

  const supabase = createClient()

  const ratioTypes = [
    {
      value: 'VAN',
      label: 'VAN - Valeur Actuelle Nette',
      unit: 'XOF',
      description: 'Mesure la rentabilité absolue du projet'
    },
    {
      value: 'TRI',
      label: 'TRI - Taux de Rentabilité Interne',
      unit: '%',
      description: 'Taux d\'actualisation qui annule la VAN'
    },
    {
      value: 'DSCR',
      label: 'DSCR - Debt Service Coverage Ratio',
      unit: 'RATIO',
      description: 'Capacité de remboursement de la dette'
    },
    {
      value: 'ROI',
      label: 'ROI - Return on Investment',
      unit: '%',
      description: 'Retour sur investissement'
    },
    {
      value: 'PAYBACK',
      label: 'Délai de récupération',
      unit: 'ANNEES',
      description: 'Temps pour récupérer l\'investissement initial'
    },
    {
      value: 'MARGE_BRUTE',
      label: 'Marge brute',
      unit: '%',
      description: 'Pourcentage de marge brute sur le CA'
    },
    {
      value: 'MARGE_NETTE',
      label: 'Marge nette',
      unit: '%',
      description: 'Pourcentage de marge nette sur le CA'
    },
    {
      value: 'SEUIL_RENTABILITE',
      label: 'Seuil de rentabilité',
      unit: 'XOF',
      description: 'CA minimum pour équilibrer les coûts'
    }
  ]

  useEffect(() => {
    if (project?.id) {
      fetchRatioConfigs()
      calculateRatios()
    }
  }, [project])

  const fetchRatioConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('ratio_configs')
        .select('*')
        .eq('project_id', project.id)
        .order('ratio_type')

      if (error) throw error
      setRatioConfigs(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des configurations de ratios:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateRatios = async () => {
    try {
      // Récupérer les données financières calculées
      const { data: financialOutputs, error } = await supabase
        .from('financial_outputs')
        .select('*')
        .eq('project_id', project.id)
        .order('year')
        .order('month')

      if (error) throw error

      if (!financialOutputs || financialOutputs.length === 0) {
        setCalculatedRatios([])
        return
      }

      // Récupérer les investissements CAPEX pour le calcul du ROI
      const { data: capexData } = await supabase
        .from('capex')
        .select('*')
        .eq('project_id', project.id)

      // Récupérer les prêts pour le DSCR
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('project_id', project.id)

      // Calculs des agrégats
      const totalRevenue = financialOutputs.reduce((sum, row) => sum + (row.revenue || 0), 0)
      const totalCogs = financialOutputs.reduce((sum, row) => sum + (row.cogs || 0), 0)
      const totalGrossMargin = financialOutputs.reduce((sum, row) => sum + (row.gross_margin || 0), 0)
      const totalNetIncome = financialOutputs.reduce((sum, row) => sum + (row.net_income || 0), 0)
      const totalCashFlow = financialOutputs.reduce((sum, row) => sum + (row.cash_flow || 0), 0)

      // Investissement initial (somme des CAPEX)
      const totalInvestment = (capexData || []).reduce((sum, item) => sum + (item.amount || 0), 0)

      // Service de la dette annuel moyen
      const totalLoanPayments = financialOutputs.reduce((sum, row) => sum + (row.loan_payments || 0), 0)
      const avgAnnualLoanPayments = totalLoanPayments / project.horizon_years

      // Calcul des ratios
      const grossMarginPercent = totalRevenue > 0 ? (totalGrossMargin / totalRevenue) * 100 : 0
      const netMarginPercent = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0

      // ROI = (Bénéfice total / Investissement initial) * 100
      const roi = totalInvestment > 0 ? (totalNetIncome / totalInvestment) * 100 : 0

      // VAN simplifiée = Cash flow total actualisé (approximation avec taux 10%)
      const discountRate = 0.10
      let van = -totalInvestment // Investissement initial
      financialOutputs.forEach(row => {
        const yearIndex = row.year - new Date(project.start_date).getFullYear()
        const discountFactor = Math.pow(1 + discountRate, yearIndex + (row.month - 1) / 12)
        van += (row.cash_flow || 0) / discountFactor
      })

      // TRI approximatif (méthode simple)
      const avgAnnualCashFlow = totalCashFlow / project.horizon_years
      const tri = totalInvestment > 0 ? (avgAnnualCashFlow / totalInvestment) * 100 : 0

      // DSCR = Cash flow opérationnel / Service de la dette
      const dscr = avgAnnualLoanPayments > 0 ? (totalCashFlow / project.horizon_years) / avgAnnualLoanPayments : 0

      // Délai de récupération (Payback)
      let paybackPeriod = 0
      let cumulativeCashFlow = -totalInvestment
      for (const row of financialOutputs) {
        cumulativeCashFlow += row.cash_flow || 0
        if (cumulativeCashFlow >= 0) {
          const yearIndex = row.year - new Date(project.start_date).getFullYear()
          paybackPeriod = yearIndex + (row.month - 1) / 12
          break
        }
      }
      if (cumulativeCashFlow < 0) paybackPeriod = project.horizon_years

      // Seuil de rentabilité
      const avgMonthlyOpex = financialOutputs.reduce((sum, row) => sum + (row.total_opex || 0), 0) / financialOutputs.length
      const avgGrossMarginRate = grossMarginPercent / 100
      const breakEvenRevenue = avgGrossMarginRate > 0 ? avgMonthlyOpex / avgGrossMarginRate : 0

      // Fonction pour déterminer le statut
      const getStatus = (value: number, thresholds: { excellent: number, good: number, warning: number }, isReverse = false) => {
        if (isReverse) {
          if (value <= thresholds.excellent) return 'excellent'
          if (value <= thresholds.good) return 'good'
          if (value <= thresholds.warning) return 'warning'
          return 'critical'
        } else {
          if (value >= thresholds.excellent) return 'excellent'
          if (value >= thresholds.good) return 'good'
          if (value >= thresholds.warning) return 'warning'
          return 'critical'
        }
      }

      const calculatedRatios: CalculatedRatio[] = [
        {
          type: 'VAN',
          name: 'Valeur Actuelle Nette',
          value: Math.round(van),
          unit: 'XOF',
          status: getStatus(van, { excellent: 5000000, good: 1000000, warning: 0 }),
          description: van > 0 ? 'VAN positive, projet rentable' : 'VAN négative, projet non rentable'
        },
        {
          type: 'TRI',
          name: 'Taux de Rentabilité Interne',
          value: Math.round(tri * 10) / 10,
          unit: '%',
          status: getStatus(tri, { excellent: 20, good: 15, warning: 10 }),
          description: tri > 15 ? 'TRI supérieur aux standards' : tri > 10 ? 'TRI acceptable' : 'TRI faible'
        },
        {
          type: 'DSCR',
          name: 'Ratio de Couverture du Service de la Dette',
          value: Math.round(dscr * 100) / 100,
          unit: 'RATIO',
          status: getStatus(dscr, { excellent: 1.5, good: 1.25, warning: 1.1 }),
          description: dscr > 1.25 ? 'Capacité de remboursement excellente' : dscr > 1.1 ? 'Capacité satisfaisante' : 'Capacité limitée'
        },
        {
          type: 'ROI',
          name: 'Retour sur Investissement',
          value: Math.round(roi * 10) / 10,
          unit: '%',
          status: getStatus(roi, { excellent: 25, good: 15, warning: 5 }),
          description: roi > 15 ? 'ROI très satisfaisant' : roi > 5 ? 'ROI acceptable' : 'ROI faible'
        },
        {
          type: 'PAYBACK',
          name: 'Délai de Récupération',
          value: Math.round(paybackPeriod * 10) / 10,
          unit: 'ANNEES',
          status: getStatus(paybackPeriod, { excellent: 2, good: 3, warning: 5 }, true),
          description: paybackPeriod <= 3 ? 'Délai excellent' : paybackPeriod <= 5 ? 'Délai acceptable' : 'Délai long'
        },
        {
          type: 'MARGE_BRUTE',
          name: 'Marge Brute',
          value: Math.round(grossMarginPercent * 10) / 10,
          unit: '%',
          status: getStatus(grossMarginPercent, { excellent: 50, good: 30, warning: 15 }),
          description: grossMarginPercent > 30 ? 'Marge brute excellente' : grossMarginPercent > 15 ? 'Marge brute correcte' : 'Marge brute faible'
        },
        {
          type: 'MARGE_NETTE',
          name: 'Marge Nette',
          value: Math.round(netMarginPercent * 10) / 10,
          unit: '%',
          status: getStatus(netMarginPercent, { excellent: 15, good: 8, warning: 3 }),
          description: netMarginPercent > 8 ? 'Marge nette satisfaisante' : netMarginPercent > 3 ? 'Marge nette correcte' : 'Marge nette à améliorer'
        },
        {
          type: 'SEUIL_RENTABILITE',
          name: 'Seuil de Rentabilité',
          value: Math.round(breakEvenRevenue * 12), // Annuel
          unit: 'XOF',
          status: breakEvenRevenue * 12 < totalRevenue / project.horizon_years ? 'excellent' : 'warning',
          description: breakEvenRevenue * 12 < totalRevenue / project.horizon_years ? 'Seuil facilement atteint' : 'Seuil difficile à atteindre'
        }
      ]

      setCalculatedRatios(calculatedRatios)
    } catch (error) {
      console.error('Erreur calcul ratios:', error)
      setCalculatedRatios([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const { error } = await supabase
          .from('ratio_configs')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ratio_configs')
          .insert([formData])

        if (error) throw error
      }

      await fetchRatioConfigs()
      resetForm()
      alert(editingId ? 'Configuration mise à jour !' : 'Configuration créée !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (config: RatioConfig) => {
    setFormData({
      project_id: config.project_id,
      ratio_type: config.ratio_type,
      name: config.name,
      target_value: config.target_value,
      warning_threshold: config.warning_threshold,
      critical_threshold: config.critical_threshold,
      unit: config.unit,
      calculation_method: config.calculation_method,
      is_active: config.is_active
    })
    setEditingId(config.id || null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette configuration ?')) return

    try {
      const { error } = await supabase
        .from('ratio_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchRatioConfigs()
      alert('Configuration supprimée !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: project.id,
      ratio_type: 'VAN',
      name: '',
      target_value: 0,
      warning_threshold: 0,
      critical_threshold: 0,
      unit: 'XOF',
      calculation_method: 'NPV_STANDARD',
      is_active: true
    })
    setEditingId(null)
  }

  const handleRatioTypeChange = (value: string) => {
    const ratioType = ratioTypes.find(t => t.value === value)
    setFormData(prev => ({
      ...prev,
      ratio_type: value as RatioConfig['ratio_type'],
      name: ratioType?.label || '',
      unit: ratioType?.unit as RatioConfig['unit'] || 'XOF'
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'good':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Calculator className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'from-green-50 to-green-100'
      case 'good':
        return 'from-blue-50 to-blue-100'
      case 'warning':
        return 'from-yellow-50 to-yellow-100'
      case 'critical':
        return 'from-red-50 to-red-100'
      default:
        return 'from-gray-50 to-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ratios calculés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {calculatedRatios.map((ratio, index) => (
          <Card key={index} className={`bg-gradient-to-r ${getStatusColor(ratio.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getStatusIcon(ratio.status)}
                  <h3 className="ml-2 font-medium text-sm">{ratio.name}</h3>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {ratio.unit === 'XOF'
                    ? `${ratio.value.toLocaleString()} ${ratio.unit}`
                    : ratio.unit === '%'
                    ? `${ratio.value.toFixed(1)}%`
                    : ratio.unit === 'ANNEES'
                    ? `${ratio.value.toFixed(1)} ans`
                    : ratio.value.toFixed(2)
                  }
                </p>
                <p className="text-xs text-gray-600">{ratio.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Résumé de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Analyse de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {calculatedRatios.filter(r => r.status === 'excellent').length}
              </div>
              <div className="text-sm text-gray-600">Excellents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {calculatedRatios.filter(r => r.status === 'good').length}
              </div>
              <div className="text-sm text-gray-600">Bons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {calculatedRatios.filter(r => r.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">À surveiller</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {calculatedRatios.filter(r => r.status === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">Critiques</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail des ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Ratios Financiers Détaillés</CardTitle>
          <CardDescription>
            Analyse complète des indicateurs de performance du projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ratio</th>
                  <th className="text-right py-2">Valeur</th>
                  <th className="text-center py-2">Statut</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {calculatedRatios.map((ratio, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{ratio.name}</td>
                    <td className="py-2 text-right">
                      {ratio.unit === 'XOF'
                        ? `${ratio.value.toLocaleString()} ${ratio.unit}`
                        : ratio.unit === '%'
                        ? `${ratio.value.toFixed(1)}%`
                        : ratio.unit === 'ANNEES'
                        ? `${ratio.value.toFixed(1)} ans`
                        : ratio.value.toFixed(2)
                      }
                    </td>
                    <td className="py-2 text-center">
                      {getStatusIcon(ratio.status)}
                    </td>
                    <td className="py-2 text-gray-600">{ratio.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations dynamiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Points forts - basés sur les ratios excellents */}
            {calculatedRatios.filter(r => r.status === 'excellent').length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">Points forts :</p>
                <ul className="list-disc list-inside text-sm text-green-700 mt-1">
                  {calculatedRatios
                    .filter(r => r.status === 'excellent')
                    .map((ratio, index) => (
                      <li key={index}>
                        {ratio.name} : {
                          ratio.unit === 'XOF'
                            ? `${ratio.value.toLocaleString()} ${ratio.unit}`
                            : ratio.unit === '%'
                            ? `${ratio.value}%`
                            : ratio.unit === 'ANNEES'
                            ? `${ratio.value} ans`
                            : ratio.value
                        } - {ratio.description}
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}

            {/* Points d'attention - basés sur les ratios warning/critical */}
            {calculatedRatios.filter(r => ['warning', 'critical'].includes(r.status)).length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800">Points d'attention :</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                  {calculatedRatios
                    .filter(r => ['warning', 'critical'].includes(r.status))
                    .map((ratio, index) => (
                      <li key={index}>
                        {ratio.name} : {
                          ratio.unit === 'XOF'
                            ? `${ratio.value.toLocaleString()} ${ratio.unit}`
                            : ratio.unit === '%'
                            ? `${ratio.value}%`
                            : ratio.unit === 'ANNEES'
                            ? `${ratio.value} ans`
                            : ratio.value
                        } - {ratio.description}
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}

            {/* Recommandations générales */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800">Recommandations :</p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-1">
                <li>Maintenir un suivi mensuel des ratios de performance</li>
                {calculatedRatios.find(r => r.type === 'DSCR' && r.value < 1.25) && (
                  <li>Améliorer le DSCR en réduisant les charges ou augmentant les revenus</li>
                )}
                {calculatedRatios.find(r => r.type === 'MARGE_NETTE' && r.value < 10) && (
                  <li>Optimiser la structure de coûts pour améliorer la marge nette</li>
                )}
                {calculatedRatios.find(r => r.type === 'VAN' && r.value < 0) && (
                  <li>Revoir le modèle économique - VAN négative</li>
                )}
                <li>Prévoir des scénarios de stress-test pour valider la robustesse</li>
                <li>Considérer l'optimisation fiscale pour améliorer les ratios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}