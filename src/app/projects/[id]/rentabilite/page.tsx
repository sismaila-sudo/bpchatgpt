'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { CalculsFinanciersAvancesService } from '@/services/calculsFinanciersAvancesService'
import {
  CashFlow,
  AnalyseRentabilite,
  evaluerVAN,
  evaluerTRI,
  evaluerDRCI
} from '@/types/calculsFinanciersAvances'
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChartPieIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function RentabilitePage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Paramètres d'entrée - VIDES par défaut (utilisateur doit tout saisir)
  const [investissementInitial, setInvestissementInitial] = useState(0)
  const [tauxActualisation, setTauxActualisation] = useState(10) // Taux standard Sénégal
  const [coutCapital, setCoutCapital] = useState(9) // Taux standard Sénégal
  const [nombreAnnees, setNombreAnnees] = useState(5) // 5 ans par défaut

  // Cash flows par année - TABLEAU VIDE par défaut
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([
    { annee: 1, cashFlowNet: 0, cashFlowCumule: 0, resultatNet: 0, dotationsAmortissements: 0 },
    { annee: 2, cashFlowNet: 0, cashFlowCumule: 0, resultatNet: 0, dotationsAmortissements: 0 },
    { annee: 3, cashFlowNet: 0, cashFlowCumule: 0, resultatNet: 0, dotationsAmortissements: 0 },
    { annee: 4, cashFlowNet: 0, cashFlowCumule: 0, resultatNet: 0, dotationsAmortissements: 0 },
    { annee: 5, cashFlowNet: 0, cashFlowCumule: 0, resultatNet: 0, dotationsAmortissements: 0 }
  ])

  // Résultats des calculs
  const [analyseRentabilite, setAnalyseRentabilite] = useState<AnalyseRentabilite | null>(null)

  const loadProject = async () => {
    if (!user || !projectId) return
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      setProject(projectData)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
    }
  }

  const loadSavedData = async () => {
    if (!user || !projectId) return
    try {
      const savedData = await projectService.getProjectSection(projectId, user.uid, 'analyseRentabilite')
      if (savedData && typeof savedData === 'object' && Object.keys(savedData).length > 0) {
        // Restaurer les paramètres sauvegardés
        setInvestissementInitial(typeof savedData.investissementInitial === 'number' ? savedData.investissementInitial : 0)
        setTauxActualisation(typeof savedData.tauxActualisation === 'number' ? savedData.tauxActualisation : 10)
        setCoutCapital(typeof savedData.coutCapital === 'number' ? savedData.coutCapital : 9)
        setNombreAnnees(typeof savedData.nombreAnnees === 'number' ? savedData.nombreAnnees : 5)
        setCashFlows(Array.isArray(savedData.cashFlows) ? savedData.cashFlows : cashFlows)

        // Restaurer les résultats si disponibles
        if (savedData.resultats && typeof savedData.resultats === 'object') {
          setAnalyseRentabilite(savedData.resultats as any)
        }
      }
    } catch (error) {
      console.error('Erreur chargement données sauvegardées:', error)
    }
  }

  useEffect(() => {
    if (user && projectId) {
      loadProject()
      loadSavedData()
    }
  }, [user, projectId])

  const handleCalculate = async () => {
    try {
      setCalculating(true)
      setMessage(null)

      const analyse = CalculsFinanciersAvancesService.analyseRentabiliteComplete(
        investissementInitial,
        cashFlows,
        tauxActualisation,
        coutCapital
      )

      setAnalyseRentabilite(analyse)

      // Sauvegarder automatiquement dans Firestore
      if (user) {
        await projectService.updateProjectSection(
          projectId,
          user.uid,
          'analyseRentabilite',
          {
            investissementInitial,
            cashFlows,
            tauxActualisation,
            coutCapital,
            nombreAnnees,
            resultats: analyse,
            dateCalcul: new Date()
          }
        )
        setMessage({ type: 'success', text: 'Calculs effectués et sauvegardés avec succès !' })
      } else {
        setMessage({ type: 'success', text: 'Calculs effectués avec succès !' })
      }
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
      setMessage({ type: 'error', text: 'Erreur lors du calcul' })
    } finally {
      setCalculating(false)
    }
  }

  const updateCashFlow = (index: number, field: keyof CashFlow, value: number) => {
    const newCashFlows = [...cashFlows]
    newCashFlows[index] = { ...newCashFlows[index], [field]: value }

    // Recalculer le cash flow net
    if (field === 'resultatNet' || field === 'dotationsAmortissements') {
      const cf = newCashFlows[index]
      newCashFlows[index].cashFlowNet = (cf.resultatNet || 0) + (cf.dotationsAmortissements || 0)
    }

    setCashFlows(newCashFlows)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  }

  const getRecommandationColor = (recommandation: string): string => {
    switch (recommandation) {
      case 'Excellent': return 'from-green-500 to-emerald-600'
      case 'Bon': return 'from-blue-500 to-blue-600'
      case 'Acceptable': return 'from-yellow-500 to-yellow-600'
      case 'À revoir': return 'from-red-500 to-red-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getEvaluationBadge = (evaluation: string) => {
    const colors = {
      'Excellent': 'bg-green-100 text-green-800',
      'Bon': 'bg-blue-100 text-blue-800',
      'Acceptable': 'bg-yellow-100 text-yellow-800',
      'Problématique': 'bg-red-100 text-red-800'
    }
    return colors[evaluation as keyof typeof colors] || colors['Acceptable']
  }

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project?.basicInfo?.name || 'Chargement...'}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyse de Rentabilité (VAN/TRI/DRCI)</h1>
                <p className="text-gray-600">Calculs financiers avancés requis par les banques et le FONGIP</p>
              </div>
            </div>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {calculating ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              {calculating ? 'Calcul en cours...' : 'Recalculer'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Paramètres */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramètres du Projet</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Investissement Initial (FCFA)</label>
              <input
                type="number"
                value={investissementInitial}
                onChange={(e) => setInvestissementInitial(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(investissementInitial)} FCFA</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taux d'Actualisation (%)</label>
              <input
                type="number"
                step="0.1"
                value={tauxActualisation}
                onChange={(e) => setTauxActualisation(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Pour actualiser les flux futurs</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coût du Capital (%)</label>
              <input
                type="number"
                step="0.1"
                value={coutCapital}
                onChange={(e) => setCoutCapital(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Seuil minimum de rentabilité</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durée du Projet (années)</label>
              <input
                type="number"
                value={nombreAnnees}
                onChange={(e) => setNombreAnnees(parseInt(e.target.value) || 7)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">{nombreAnnees} ans de projections</p>
            </div>
          </div>
        </div>

        {/* Cash Flows */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cash Flows Prévisionnels</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-4 py-3 text-left font-semibold text-purple-900">Année</th>
                  <th className="px-4 py-3 text-right font-semibold text-purple-900">Résultat Net (FCFA)</th>
                  <th className="px-4 py-3 text-right font-semibold text-purple-900">Dotations Amort. (FCFA)</th>
                  <th className="px-4 py-3 text-right font-semibold text-purple-900 bg-purple-100">Cash Flow Net (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{cf.annee}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={cf.resultatNet || ''}
                        onChange={(e) => updateCashFlow(index, 'resultatNet', parseFloat(e.target.value) || 0)}
                        className="w-full text-right px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={cf.dotationsAmortissements || ''}
                        onChange={(e) => updateCashFlow(index, 'dotationsAmortissements', parseFloat(e.target.value) || 0)}
                        className="w-full text-right px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-right bg-purple-50 font-bold text-purple-900">
                      {formatCurrency(cf.cashFlowNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Résultats */}
        {analyseRentabilite && (
          <>
            {/* Recommandation Globale */}
            <div className={`bg-gradient-to-r ${getRecommandationColor(analyseRentabilite.recommandation)} rounded-2xl shadow-2xl p-8 mb-6 text-white`}>
              <div className="flex items-center gap-4 mb-4">
                <LightBulbIcon className="w-12 h-12" />
                <div>
                  <h2 className="text-3xl font-bold">Recommandation: {analyseRentabilite.recommandation}</h2>
                  <p className="text-white/90 mt-2">{analyseRentabilite.justification}</p>
                </div>
              </div>
            </div>

            {/* Indicateurs Principaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* VAN */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <ChartPieIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">VAN</h3>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatCurrency(analyseRentabilite.van.van)} FCFA
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEvaluationBadge(evaluerVAN(analyseRentabilite.van.van))}`}>
                    {evaluerVAN(analyseRentabilite.van.van)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{analyseRentabilite.van.interpretation}</p>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Taux actualisation: {analyseRentabilite.tauxActualisation}%</div>
                  <div>Investissement: {formatCurrency(analyseRentabilite.investissementInitial)} FCFA</div>
                </div>
              </div>

              {/* TRI */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">TRI</h3>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {analyseRentabilite.tri.tri.toFixed(2)}%
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEvaluationBadge(evaluerTRI(analyseRentabilite.tri.tri))}`}>
                    {evaluerTRI(analyseRentabilite.tri.tri)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{analyseRentabilite.tri.interpretation}</p>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Coût du capital: {analyseRentabilite.coutCapital}%</div>
                  <div>Supérieur au coût: {analyseRentabilite.tri.triSuperieurCout ? 'OUI ✅' : 'NON ❌'}</div>
                </div>
              </div>

              {/* DRCI */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <ClockIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">DRCI</h3>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {analyseRentabilite.drci.drci.annees} ans {analyseRentabilite.drci.drci.mois} mois
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEvaluationBadge(evaluerDRCI(analyseRentabilite.drci.drciDecimal))}`}>
                    {evaluerDRCI(analyseRentabilite.drci.drciDecimal)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{analyseRentabilite.drci.interpretation}</p>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Délai exact: {analyseRentabilite.drci.drciDecimal.toFixed(2)} années</div>
                  <div>Jours: {analyseRentabilite.drci.drci.jours}</div>
                </div>
              </div>
            </div>

            {/* Analyse de Sensibilité */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analyse de Sensibilité (Stress Test)</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-green-50 rounded-xl">
                  <h3 className="font-bold text-green-900 mb-4">Scénario Optimiste (+20% revenus)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>VAN:</span>
                      <span className="font-bold text-green-700">{formatCurrency(analyseRentabilite.sensibilite?.vanOptimiste || 0)} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TRI:</span>
                      <span className="font-bold text-green-700">{analyseRentabilite.sensibilite?.triOptimiste.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 rounded-xl">
                  <h3 className="font-bold text-red-900 mb-4">Scénario Pessimiste (-20% revenus)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>VAN:</span>
                      <span className="font-bold text-red-700">{formatCurrency(analyseRentabilite.sensibilite?.vanPessimiste || 0)} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TRI:</span>
                      <span className="font-bold text-red-700">{analyseRentabilite.sensibilite?.triPessimiste.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ratios Complémentaires */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ratios Complémentaires</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 rounded-xl">
                  <h3 className="font-bold text-blue-900 mb-2">Indice de Rentabilité</h3>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{analyseRentabilite.indiceRentabilite.toFixed(2)}</div>
                  <p className="text-sm text-blue-800">
                    {analyseRentabilite.indiceRentabilite > 1 ? 'Projet créateur de valeur ✅' : 'Projet destructeur de valeur ❌'}
                  </p>
                </div>

                <div className="p-6 bg-purple-50 rounded-xl">
                  <h3 className="font-bold text-purple-900 mb-2">Taux de Rendement Comptable</h3>
                  <div className="text-3xl font-bold text-purple-700 mb-2">{analyseRentabilite.tauxRendementComptable.toFixed(2)}%</div>
                  <p className="text-sm text-purple-800">Résultat net moyen / Investissement initial</p>
                </div>
              </div>
            </div>

            {/* Pages Connexes */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pages Connexes - Module Financier
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => window.location.href = `/projects/${projectId}/analyse-financiere`}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300 shadow-sm font-medium"
                >
                  → Analyse Financière Historique (3 ans)
                </button>
                <button
                  onClick={() => window.location.href = `/projects/${projectId}/relations-bancaires`}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300 shadow-sm font-medium"
                >
                  → Relations Bancaires
                </button>
                <button
                  onClick={() => window.location.href = `/projects/${projectId}/tableaux-financiers`}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300 shadow-sm font-medium"
                >
                  → Tableaux Financiers Professionnels
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </ModernProjectLayout>
  )
}
