'use client'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react'
import { FinancialData, RatiosCles, Projections } from '@/services/aiAnalysisService'

interface FinancialAnalysisChartsProps {
  finances: FinancialData[]
  ratios_cles?: RatiosCles
  projections?: Projections
}

export function FinancialAnalysisCharts({ finances, ratios_cles, projections }: FinancialAnalysisChartsProps) {

  // Données pour le graphique d'évolution CA/Résultat
  const evolutionData = finances.map(finance => ({
    exercice: finance.exercice,
    ca: finance.chiffre_affaires / 1000000, // En millions
    resultat: finance.resultat_net / 1000000,
    ebe: finance.ebe / 1000000,
    tresorerie: finance.tresorerie_nette / 1000000
  }))

  // Données pour les projections
  const projectionData = projections ? [
    { annee: 'Actuel', ca: finances[finances.length - 1]?.chiffre_affaires / 1000000 || 0 },
    { annee: 'An 1', ca: projections.ca_3_ans[0] / 1000000 },
    { annee: 'An 2', ca: projections.ca_3_ans[1] / 1000000 },
    { annee: 'An 3', ca: projections.ca_3_ans[2] / 1000000 }
  ] : []

  // Données pour la répartition du bilan (dernière année)
  const dernierExercice = finances[finances.length - 1]
  const bilanData = dernierExercice ? [
    { name: 'Fonds Propres', value: dernierExercice.fonds_propres || 0, color: '#10b981' },
    { name: 'Dettes Financières', value: dernierExercice.dettes_financieres, color: '#ef4444' },
    { name: 'Autres', value: Math.max(0, dernierExercice.total_bilan - (dernierExercice.fonds_propres || 0) - dernierExercice.dettes_financieres), color: '#6366f1' }
  ] : []

  // Données pour les ratios sous forme de gauge
  const ratiosGaugeData = ratios_cles ? [
    {
      subject: 'Croissance CA',
      value: ratios_cles.croissance_ca,
      max: 50,
      color: ratios_cles.croissance_ca > 10 ? '#10b981' : ratios_cles.croissance_ca > 0 ? '#f59e0b' : '#ef4444'
    },
    {
      subject: 'Marge EBE',
      value: ratios_cles.marge_ebe,
      max: 30,
      color: ratios_cles.marge_ebe > 15 ? '#10b981' : ratios_cles.marge_ebe > 8 ? '#f59e0b' : '#ef4444'
    },
    {
      subject: 'ROE',
      value: ratios_cles.roe || 0,
      max: 40,
      color: (ratios_cles.roe || 0) > 20 ? '#10b981' : (ratios_cles.roe || 0) > 10 ? '#f59e0b' : '#ef4444'
    }
  ] : []

  // Calcul de la croissance CA
  const croissanceCA = finances.length > 1 ?
    ((finances[finances.length - 1].chiffre_affaires - finances[0].chiffre_affaires) / finances[0].chiffre_affaires * 100) : 0

  return (
    <div className="space-y-6">

      {/* Métriques clés en cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dernierExercice ? `${(dernierExercice.chiffre_affaires / 1000000).toFixed(0)}M` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {croissanceCA > 0 ? (
                <><TrendingUp className="h-3 w-3 mr-1 text-green-500" /> +{croissanceCA.toFixed(1)}%</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1 text-red-500" /> {croissanceCA.toFixed(1)}%</>
              )}
              {' '}sur la période
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge EBE</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ratios_cles ? `${ratios_cles.marge_ebe.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {ratios_cles && ratios_cles.marge_ebe > 15 ? 'Excellent' :
               ratios_cles && ratios_cles.marge_ebe > 8 ? 'Bon' : 'À améliorer'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROE</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ratios_cles?.roe ? `${ratios_cles.roe.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Rendement fonds propres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endettement</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ratios_cles ? `${(ratios_cles.ratio_endettement * 100).toFixed(0)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {ratios_cles && ratios_cles.ratio_endettement < 0.6 ? 'Maîtrisé' : 'Élevé'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution CA/Résultat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Évolution Financière (en millions FCFA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exercice" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)}M FCFA`, '']}
                  labelFormatter={(label) => `Exercice ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="ca" stroke="#2563eb" strokeWidth={3} name="Chiffre d'Affaires" />
                <Line type="monotone" dataKey="ebe" stroke="#10b981" strokeWidth={2} name="EBE" />
                <Line type="monotone" dataKey="resultat" stroke="#f59e0b" strokeWidth={2} name="Résultat Net" />
                <Line type="monotone" dataKey="tresorerie" stroke="#8b5cf6" strokeWidth={2} name="Trésorerie" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Projections */}
        {projections && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Projections CA (millions FCFA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(0)}M FCFA`, 'CA Projeté']} />
                    <Area type="monotone" dataKey="ca" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Scénario: {projections.scenario}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Structure du bilan */}
        {dernierExercice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Structure du Bilan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bilanData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                    >
                      {bilanData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${(value / 1000000).toFixed(0)}M FCFA`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ratios sous forme de jauges */}
      {ratios_cles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Ratios Clés - Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ratiosGaugeData.map((ratio, index) => (
                <div key={index} className="text-center">
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[ratio]}>
                        <RadialBar dataKey="value" cornerRadius={10} fill={ratio.color} />
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-lg font-bold"
                        >
                          {ratio.value.toFixed(1)}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <h3 className="font-medium text-sm mt-2">{ratio.subject}</h3>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}