'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Building,
  FileText,
  Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SynopticSheet } from '../SynopticSheet'
import { FinancialCalculationsService } from '@/services/financialCalculations'

interface OverviewTabProps {
  project: any
  existingCompanyAnalysis?: any
}

export function OverviewTab({ project, existingCompanyAnalysis }: OverviewTabProps) {
  const [stats, setStats] = useState({
    products_count: 0,
    total_revenue: 0,
    total_profit: 0,
    months_calculated: 0,
    break_even_month: null as number | null,
    min_cash_balance: 0
  })
  const [loading, setLoading] = useState(true)
  const [showSynopticSheet, setShowSynopticSheet] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [project.id])

  async function loadStats() {
      try {
        // Compter les produits
        const { count: productsCount } = await supabase
          .from('products_services')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)

        // 🔄 Utiliser le service centralisé pour garantir la cohérence
        const realRevenueSummary = await FinancialCalculationsService.calculateRealRevenue(project.id)
        const totalRevenue = realRevenueSummary.totalRevenue

        // Pour les autres stats, on peut toujours utiliser financial_outputs si elles existent
        const { data: financialData } = await supabase
          .from('financial_outputs')
          .select('*')
          .eq('project_id', project.id)
          .order('year')
          .order('month')

        let totalProfit = 0
        let minCashBalance = 0
        let breakEvenMonth = null

        if (financialData && financialData.length > 0) {
          totalProfit = financialData.reduce((sum, row) => sum + (row.net_income || 0), 0)
          minCashBalance = Math.min(...financialData.map(row => row.cash_balance || 0))

          // Trouver le point d'équilibre (premier mois avec cash positif)
          const breakEvenData = financialData.find(row => (row.cash_balance || 0) > 0)
          if (breakEvenData) {
            const monthIndex = financialData.indexOf(breakEvenData)
            breakEvenMonth = monthIndex + 1
          }
        }

        setStats({
          products_count: productsCount || 0,
          total_revenue: totalRevenue, // ✅ Maintenant calculé directement depuis les vraies données
          total_profit: totalProfit,
          months_calculated: financialData?.length || 0,
          break_even_month: breakEvenMonth,
          min_cash_balance: minCashBalance
        })
      } catch (error) {
        console.error('Erreur chargement stats:', error)
      } finally {
        setLoading(false)
      }
    }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: project.organizations?.currency || 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 text-${color}-600`} />
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Données d'entreprise en activité */}
      {existingCompanyAnalysis && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-800 flex items-center">
              <Building className="h-6 w-6 mr-3" />
              Données d'Entreprise en Activité - Pré-remplies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">Identité</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Dénomination:</strong> {existingCompanyAnalysis.identite?.denomination}</p>
                  <p><strong>Forme juridique:</strong> {existingCompanyAnalysis.identite?.forme_juridique}</p>
                  <p><strong>Capital:</strong> {existingCompanyAnalysis.identite?.capital_social}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">Performance</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Score global:</strong> {existingCompanyAnalysis.synthese?.score_global}/100</p>
                  <p><strong>CA dernier exercice:</strong> {existingCompanyAnalysis.finances?.[existingCompanyAnalysis.finances.length - 1]?.chiffre_affaires ? `${(existingCompanyAnalysis.finances[existingCompanyAnalysis.finances.length - 1].chiffre_affaires / 1000000).toFixed(0)}M FCFA` : 'N/A'}</p>
                  <p><strong>Évolution:</strong> {existingCompanyAnalysis.synthese?.evolution_ca}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">Actions</h4>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">✅ Données automatiquement pré-remplies dans les onglets</p>
                  <p className="text-sm text-blue-700">🎯 Prêt pour business plan futur</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton de calcul principal */}
      <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold text-emerald-800 mb-4">
            {existingCompanyAnalysis ? 'Créer le Business Plan Futur' : 'Prêt à calculer votre business plan ?'}
          </h3>
          <p className="text-emerald-700 mb-6">
            {existingCompanyAnalysis ?
              'Utilisez les données existantes pour projeter l\'avenir de votre entreprise' :
              'Lancez les calculs financiers pour obtenir vos projections, ratios et analyses complètes'
            }
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => {
              // Déclencher le calcul depuis le parent
              const event = new CustomEvent('triggerCalculation');
              window.dispatchEvent(event);
            }}
          >
            <Calculator className="h-6 w-6 mr-3" />
            {existingCompanyAnalysis ? 'Projeter l\'Avenir' : 'Calculer le Business Plan'}
          </Button>
        </CardContent>
      </Card>

      {/* Statistiques clés */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Statistiques du projet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Produits/Services"
            value={stats.products_count}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Chiffre d'affaires total"
            value={formatCurrency(stats.total_revenue)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Bénéfice total"
            value={formatCurrency(stats.total_profit)}
            icon={TrendingUp}
            color={stats.total_profit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Mois calculés"
            value={`${stats.months_calculated}/${project.horizon_years * 12}`}
            icon={Calendar}
            color="purple"
          />
        </div>
      </div>

      {/* Alertes et indicateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Santé financière */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {stats.min_cash_balance >= 0 ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              )}
              Santé financière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trésorerie minimale:</span>
              <span className={`font-semibold ${stats.min_cash_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.min_cash_balance)}
              </span>
            </div>

            {stats.break_even_month && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Point d'équilibre:</span>
                <span className="font-semibold text-green-600">
                  Mois {stats.break_even_month}
                </span>
              </div>
            )}

            {stats.total_profit > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rentabilité:</span>
                <span className="font-semibold text-green-600">
                  {((stats.total_profit / stats.total_revenue) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions recommandées */}
        <Card>
          <CardHeader>
            <CardTitle>Actions recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.products_count === 0 && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ajouter des produits/services</p>
                    <p className="text-xs text-gray-600">
                      Commencez par définir vos offres dans l'onglet "Produits/Services"
                    </p>
                  </div>
                </div>
              )}

              {stats.months_calculated === 0 && stats.products_count > 0 && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ajouter des projections de ventes</p>
                    <p className="text-xs text-gray-600">
                      Définissez vos volumes de vente dans l'onglet "Ventes"
                    </p>
                  </div>
                </div>
              )}

              {stats.months_calculated > 0 && stats.min_cash_balance < 0 && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Besoin de financement détecté</p>
                    <p className="text-xs text-gray-600">
                      Votre projet nécessite un financement de {formatCurrency(Math.abs(stats.min_cash_balance))}
                    </p>
                  </div>
                </div>
              )}

              {stats.total_profit > 0 && stats.min_cash_balance >= 0 && (
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Projet viable financièrement</p>
                    <p className="text-xs text-gray-600">
                      Votre projet génère des bénéfices et maintient une trésorerie positive
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Fiche Synoptique - Centrée */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Fiche Synoptique
              </div>
              <Button
                onClick={() => setShowSynopticSheet(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Générer Fiche
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Générez une fiche synoptique professionnelle de votre projet incluant toutes les informations
              essentielles : présentation de l'entreprise, détails du projet, conditions de financement
              et garanties requises.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affichage de la fiche synoptique */}
      {showSynopticSheet && (
        <SynopticSheet
          project={project}
          onBack={() => setShowSynopticSheet(false)}
        />
      )}
    </div>
  )
}