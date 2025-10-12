'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { AnalyseFinanciereHistoriqueService } from '@/services/analyseFinanciereHistoriqueService'
import {
  AnalyseFinanciereHistorique,
  CompteResultat,
  BilanActif,
  BilanPassif,
  RatiosDecision,
  SEUILS_RATIOS,
  evaluerRatio
} from '@/types/analyseFinanciereHistorique'
import {
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CalculatorIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { TableSkeleton } from '@/components/SkeletonLoaders'

export default function AnalyseFinancierePage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'comptes' | 'bilan' | 'ratios' | 'analyse'>('comptes')
  const [selectedYear, setSelectedYear] = useState(0) // Index de l'année sélectionnée
  const [analyse, setAnalyse] = useState<AnalyseFinanciereHistorique | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // États temporaires pour les formulaires
  const [comptesResultat, setComptesResultat] = useState<CompteResultat[]>([])
  const [bilansActif, setBilansActif] = useState<BilanActif[]>([])
  const [bilansPassif, setBilansPassif] = useState<BilanPassif[]>([])

  const loadProject = async () => {
    if (!user || !projectId) return
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      setProject(projectData)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
    }
  }

  useEffect(() => {
    if (user && projectId) {
      loadProject()
      loadAnalyse()
    }
  }, [projectId, user])

  const loadAnalyse = async () => {
    try {
      setLoading(true)
      const data = await AnalyseFinanciereHistoriqueService.getAnalyse(projectId)

      if (data) {
        setAnalyse(data)
        setComptesResultat(data.comptesResultat)
        setBilansActif(data.bilansActif)
        setBilansPassif(data.bilansPassif)
      } else if (user) {
        // Initialiser avec 3 années vides
        const init = AnalyseFinanciereHistoriqueService.initializeAnalyse(projectId, user.uid)
        setComptesResultat(init.comptesResultat)
        setBilansActif(init.bilansActif)
        setBilansPassif(init.bilansPassif)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      // Recalculer tous les indicateurs
      let dataToSave: AnalyseFinanciereHistorique = {
        projectId,
        userId: user.uid,
        periodeDebut: comptesResultat[0]?.annee || new Date().getFullYear() - 2,
        periodeFin: comptesResultat[comptesResultat.length - 1]?.annee || new Date().getFullYear(),
        comptesResultat,
        bilansActif,
        bilansPassif,
        analysesFondsRoulement: [],
        ratiosDecision: []
      }

      dataToSave = AnalyseFinanciereHistoriqueService.recalculateAll(dataToSave) as AnalyseFinanciereHistorique

      await AnalyseFinanciereHistoriqueService.saveAnalyse(projectId, dataToSave)

      setMessage({ type: 'success', text: 'Analyse financière enregistrée et ratios recalculés !' })
      await loadAnalyse()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const updateCompteResultat = (field: keyof CompteResultat, value: number) => {
    const newComptes = [...comptesResultat]
    newComptes[selectedYear] = { ...newComptes[selectedYear], [field]: value }
    setComptesResultat(newComptes)
  }

  const updateBilanActif = (field: keyof BilanActif, value: number) => {
    const newBilans = [...bilansActif]
    newBilans[selectedYear] = { ...newBilans[selectedYear], [field]: value }
    setBilansActif(newBilans)
  }

  const updateBilanPassif = (field: keyof BilanPassif, value: number) => {
    const newBilans = [...bilansPassif]
    newBilans[selectedYear] = { ...newBilans[selectedYear], [field]: value }
    setBilansPassif(newBilans)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  }

  const getRatioColor = (ratio: keyof typeof SEUILS_RATIOS, value: number): string => {
    const evaluation = evaluerRatio(ratio, value)
    switch (evaluation) {
      case 'Excellent': return 'text-green-600 bg-green-50'
      case 'Bon': return 'text-blue-600 bg-blue-50'
      case 'Acceptable': return 'text-yellow-600 bg-yellow-50'
      case 'Problématique': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <ModernProjectLayout
        projectId={projectId}
        projectName={project?.basicInfo?.name || 'Chargement...'}
      >
        <div className="p-6">
          <TableSkeleton rows={8} columns={5} />
        </div>
      </ModernProjectLayout>
    )
  }

  const currentYear = comptesResultat[selectedYear]
  const currentBilanActif = bilansActif[selectedYear]
  const currentBilanPassif = bilansPassif[selectedYear]
  const currentRatios = analyse?.ratiosDecision?.[selectedYear]

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project?.basicInfo?.name || 'Chargement...'}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyse Financière Historique</h1>
                <p className="text-gray-600">Données historiques sur 3 ans pour l'évaluation bancaire (FONGIP)</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              {saving ? 'Calcul en cours...' : 'Enregistrer & Calculer'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Sélecteur d'année */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Année de saisie</h2>
            <div className="flex gap-2">
              {comptesResultat.map((compte, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedYear(index)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedYear === index
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {compte.annee}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-1 p-2">
              {[
                { id: 'comptes' as const, label: 'Compte de Résultat', icon: DocumentChartBarIcon },
                { id: 'bilan' as const, label: 'Bilan Actif/Passif', icon: ScaleIcon },
                { id: 'ratios' as const, label: 'Ratios & Indicateurs', icon: CalculatorIcon },
                { id: 'analyse' as const, label: 'Analyse', icon: ArrowTrendingUpIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {/* TAB 1: Compte de Résultat */}
            {activeTab === 'comptes' && currentYear && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Compte de Résultat {currentYear.annee}</h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Revenus */}
                  <div className="p-6 bg-blue-50 rounded-xl">
                    <h4 className="font-bold text-blue-900 mb-4">REVENUS</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chiffre d'Affaires (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.chiffreAffaires || ''}
                          onChange={(e) => updateCompteResultat('chiffreAffaires', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Achats et Charges */}
                  <div className="p-6 bg-red-50 rounded-xl">
                    <h4 className="font-bold text-red-900 mb-4">ACHATS & CHARGES</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Achats Matières Premières (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.achatsMatieresPremieres || ''}
                          onChange={(e) => updateCompteResultat('achatsMatieresPremieres', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Autres Achats (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.autresAchats || ''}
                          onChange={(e) => updateCompteResultat('autresAchats', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transports (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.transports || ''}
                          onChange={(e) => updateCompteResultat('transports', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Services Extérieurs (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.servicesExterieurs || ''}
                          onChange={(e) => updateCompteResultat('servicesExterieurs', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Impôts et Taxes (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.impotsTaxes || ''}
                          onChange={(e) => updateCompteResultat('impotsTaxes', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Charges de Personnel (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.chargesPersonnel || ''}
                          onChange={(e) => updateCompteResultat('chargesPersonnel', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dotations Amortissements (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.dotationsAmortissements || ''}
                          onChange={(e) => updateCompteResultat('dotationsAmortissements', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frais Financiers (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.fraisFinanciers || ''}
                          onChange={(e) => updateCompteResultat('fraisFinanciers', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Impôts sur Résultat (FCFA)</label>
                        <input
                          type="number"
                          value={currentYear.impotsSurResultat || ''}
                          onChange={(e) => updateCompteResultat('impotsSurResultat', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Résultats */}
                  <div className="col-span-2 p-6 bg-green-50 rounded-xl">
                    <h4 className="font-bold text-green-900 mb-4">RÉSULTATS (Calculés automatiquement)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valeur Ajoutée</label>
                        <div className="px-4 py-2 bg-white rounded-lg font-bold text-green-700">
                          {formatCurrency(
                            currentYear.chiffreAffaires -
                            currentYear.achatsMatieresPremieres -
                            currentYear.autresAchats -
                            currentYear.transports -
                            currentYear.servicesExterieurs -
                            currentYear.impotsTaxes
                          )} FCFA
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Résultat d'Exploitation</label>
                        <div className="px-4 py-2 bg-white rounded-lg font-bold text-green-700">
                          {formatCurrency(
                            currentYear.chiffreAffaires -
                            currentYear.achatsMatieresPremieres -
                            currentYear.autresAchats -
                            currentYear.transports -
                            currentYear.servicesExterieurs -
                            currentYear.impotsTaxes -
                            currentYear.chargesPersonnel -
                            currentYear.dotationsAmortissements
                          )} FCFA
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Résultat Net</label>
                        <div className="px-4 py-2 bg-white rounded-lg font-bold text-green-700 text-xl">
                          {formatCurrency(
                            currentYear.chiffreAffaires -
                            currentYear.achatsMatieresPremieres -
                            currentYear.autresAchats -
                            currentYear.transports -
                            currentYear.servicesExterieurs -
                            currentYear.impotsTaxes -
                            currentYear.chargesPersonnel -
                            currentYear.dotationsAmortissements -
                            currentYear.fraisFinanciers -
                            currentYear.impotsSurResultat
                          )} FCFA
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Bilan */}
            {activeTab === 'bilan' && currentBilanActif && currentBilanPassif && (
              <div className="grid grid-cols-2 gap-6">
                {/* ACTIF */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">ACTIF {currentBilanActif.annee}</h3>

                  <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-blue-900">Actif Immobilisé</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Immob. Incorporelles</label>
                      <input
                        type="number"
                        value={currentBilanActif.immobilisationsIncorporelles || ''}
                        onChange={(e) => updateBilanActif('immobilisationsIncorporelles', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Immob. Corporelles</label>
                      <input
                        type="number"
                        value={currentBilanActif.immobilisationsCorporelles || ''}
                        onChange={(e) => updateBilanActif('immobilisationsCorporelles', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <label className="block text-sm font-bold text-blue-900 mb-1">Total Actif Immobilisé</label>
                      <div className="px-3 py-2 bg-white rounded-lg font-bold">
                        {formatCurrency(currentBilanActif.immobilisationsIncorporelles + currentBilanActif.immobilisationsCorporelles)} FCFA
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-green-900">Actif Circulant</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clients</label>
                      <input
                        type="number"
                        value={currentBilanActif.clients || ''}
                        onChange={(e) => updateBilanActif('clients', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Autres Créances</label>
                      <input
                        type="number"
                        value={currentBilanActif.creancesEmploisAssimiles || ''}
                        onChange={(e) => updateBilanActif('creancesEmploisAssimiles', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <label className="block text-sm font-bold text-green-900 mb-1">Total Actif Circulant</label>
                      <div className="px-3 py-2 bg-white rounded-lg font-bold">
                        {formatCurrency(currentBilanActif.clients + currentBilanActif.creancesEmploisAssimiles)} FCFA
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-purple-900">Trésorerie Actif</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banques, Chèques, Caisse</label>
                      <input
                        type="number"
                        value={currentBilanActif.tresorerieActif || ''}
                        onChange={(e) => updateBilanActif('tresorerieActif', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900 text-white rounded-xl">
                    <h4 className="font-bold mb-2">TOTAL BILAN ACTIF</h4>
                    <div className="text-3xl font-bold">
                      {formatCurrency(
                        currentBilanActif.immobilisationsIncorporelles +
                        currentBilanActif.immobilisationsCorporelles +
                        currentBilanActif.clients +
                        currentBilanActif.creancesEmploisAssimiles +
                        currentBilanActif.tresorerieActif
                      )} FCFA
                    </div>
                  </div>
                </div>

                {/* PASSIF */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">PASSIF {currentBilanPassif.annee}</h3>

                  <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-blue-900">Capitaux Propres</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capital</label>
                      <input
                        type="number"
                        value={currentBilanPassif.capital || ''}
                        onChange={(e) => updateBilanPassif('capital', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primes et Réserves</label>
                      <input
                        type="number"
                        value={currentBilanPassif.primesReserves || ''}
                        onChange={(e) => updateBilanPassif('primesReserves', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report à Nouveau</label>
                      <input
                        type="number"
                        value={currentBilanPassif.reportANouveau || ''}
                        onChange={(e) => updateBilanPassif('reportANouveau', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Résultat Net</label>
                      <input
                        type="number"
                        value={currentBilanPassif.resultatNet || ''}
                        onChange={(e) => updateBilanPassif('resultatNet', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <label className="block text-sm font-bold text-blue-900 mb-1">Total Capitaux Propres</label>
                      <div className="px-3 py-2 bg-white rounded-lg font-bold">
                        {formatCurrency(
                          currentBilanPassif.capital +
                          currentBilanPassif.primesReserves +
                          currentBilanPassif.reportANouveau +
                          currentBilanPassif.resultatNet
                        )} FCFA
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-red-900">Dettes Financières</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emprunts</label>
                      <input
                        type="number"
                        value={currentBilanPassif.emprunts || ''}
                        onChange={(e) => updateBilanPassif('emprunts', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-orange-900">Passif Circulant</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseurs</label>
                      <input
                        type="number"
                        value={currentBilanPassif.fournisseursExploitation || ''}
                        onChange={(e) => updateBilanPassif('fournisseursExploitation', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dettes Fiscales/Sociales</label>
                      <input
                        type="number"
                        value={currentBilanPassif.dettesFiscalesSociales || ''}
                        onChange={(e) => updateBilanPassif('dettesFiscalesSociales', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Autres Dettes</label>
                      <input
                        type="number"
                        value={currentBilanPassif.autresDettes || ''}
                        onChange={(e) => updateBilanPassif('autresDettes', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                    <h4 className="font-bold text-purple-900">Trésorerie Passif</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Découverts Bancaires</label>
                      <input
                        type="number"
                        value={currentBilanPassif.tresoreriePassif || ''}
                        onChange={(e) => updateBilanPassif('tresoreriePassif', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900 text-white rounded-xl">
                    <h4 className="font-bold mb-2">TOTAL BILAN PASSIF</h4>
                    <div className="text-3xl font-bold">
                      {formatCurrency(
                        currentBilanPassif.capital +
                        currentBilanPassif.primesReserves +
                        currentBilanPassif.reportANouveau +
                        currentBilanPassif.resultatNet +
                        currentBilanPassif.emprunts +
                        currentBilanPassif.fournisseursExploitation +
                        currentBilanPassif.dettesFiscalesSociales +
                        currentBilanPassif.autresDettes +
                        currentBilanPassif.tresoreriePassif
                      )} FCFA
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Ratios */}
            {activeTab === 'ratios' && analyse && currentRatios && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Ratios de Décision {currentRatios.annee}</h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Autonomie Financière */}
                  <div className={`p-6 rounded-xl ${getRatioColor('autonomieFinanciere', currentRatios.autonomieFinanciere)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Autonomie Financière</h4>
                      <span className="text-sm">Seuil: ≥ 20%</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{currentRatios.autonomieFinanciere.toFixed(1)}%</div>
                    <p className="text-sm">{evaluerRatio('autonomieFinanciere', currentRatios.autonomieFinanciere)}</p>
                  </div>

                  {/* Capacité de Remboursement */}
                  <div className={`p-6 rounded-xl ${getRatioColor('capaciteRemboursement', currentRatios.capaciteRemboursement)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Capacité de Remboursement</h4>
                      <span className="text-sm">Seuil: ≤ 4 ans</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{currentRatios.capaciteRemboursement.toFixed(1)} ans</div>
                    <p className="text-sm">{evaluerRatio('capaciteRemboursement', currentRatios.capaciteRemboursement)}</p>
                  </div>

                  {/* Rentabilité Globale */}
                  <div className={`p-6 rounded-xl ${getRatioColor('rentabiliteGlobale', currentRatios.rentabiliteGlobale)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Rentabilité Globale</h4>
                      <span className="text-sm">Seuil: &gt; 0%</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{currentRatios.rentabiliteGlobale.toFixed(1)}%</div>
                    <p className="text-sm">{evaluerRatio('rentabiliteGlobale', currentRatios.rentabiliteGlobale)}</p>
                  </div>

                  {/* Liquidité Générale */}
                  <div className={`p-6 rounded-xl ${getRatioColor('liquiditeGenerale', currentRatios.liquiditeGenerale)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Liquidité Générale</h4>
                      <span className="text-sm">Seuil: &gt; 1</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{currentRatios.liquiditeGenerale.toFixed(2)}</div>
                    <p className="text-sm">{evaluerRatio('liquiditeGenerale', currentRatios.liquiditeGenerale)}</p>
                  </div>

                  {/* Solvabilité */}
                  <div className={`p-6 rounded-xl ${getRatioColor('solvabilite', currentRatios.solvabilite)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Solvabilité</h4>
                      <span className="text-sm">Seuil: ≥ 20%</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{currentRatios.solvabilite.toFixed(1)}%</div>
                    <p className="text-sm">{evaluerRatio('solvabilite', currentRatios.solvabilite)}</p>
                  </div>

                  {/* FDR / BFR */}
                  <div className="p-6 bg-indigo-50 text-indigo-900 rounded-xl">
                    <h4 className="font-bold mb-4">Fonds de Roulement & Trésorerie</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>FDR:</span>
                        <span className="font-bold">{formatCurrency(analyse.analysesFondsRoulement[selectedYear]?.fondsRoulement || 0)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>BFR:</span>
                        <span className="font-bold">{formatCurrency(analyse.analysesFondsRoulement[selectedYear]?.besoinFondsRoulement || 0)} FCFA</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-indigo-200">
                        <span>Trésorerie Nette:</span>
                        <span className="font-bold text-lg">{formatCurrency(analyse.analysesFondsRoulement[selectedYear]?.tresorerieNette || 0)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Analyse */}
            {activeTab === 'analyse' && analyse && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Analyse Globale</h3>

                <div className="grid grid-cols-1 gap-6">
                  {analyse.analysesFondsRoulement.length > 0 && (
                    <>
                      <div className="p-6 bg-green-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircleIcon className="w-6 h-6 text-green-600" />
                          <h4 className="font-bold text-green-900">Points Forts</h4>
                        </div>
                        <ul className="space-y-2">
                          {analyse.analysesFondsRoulement.map((a, i) => (
                            analyse.ratiosDecision[i]?.autonomieFinanciere >= 20 && (
                              <li key={i} className="text-green-800">
                                ✓ {a.annee}: Autonomie financière conforme ({analyse.ratiosDecision[i].autonomieFinanciere.toFixed(1)}%)
                              </li>
                            )
                          ))}
                        </ul>
                      </div>

                      <div className="p-6 bg-red-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                          <h4 className="font-bold text-red-900">Points de Vigilance</h4>
                        </div>
                        <ul className="space-y-2">
                          {analyse.analysesFondsRoulement.map((a, i) => (
                            analyse.ratiosDecision[i]?.capaciteRemboursement > 4 && (
                              <li key={i} className="text-red-800">
                                ⚠ {a.annee}: Capacité de remboursement élevée ({analyse.ratiosDecision[i].capaciteRemboursement.toFixed(1)} ans)
                              </li>
                            )
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de sauvegarde final */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-gray-600 mb-4">
            Cliquez sur "Enregistrer & Calculer" pour sauvegarder les données et calculer automatiquement tous les ratios
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold text-lg"
          >
            {saving ? 'Calcul en cours...' : 'Enregistrer & Calculer Tous les Ratios'}
          </button>
        </div>

        {/* Pages Connexes */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Pages Connexes - Module Financier
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = `/projects/${projectId}/rentabilite`}
              className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300 shadow-sm font-medium"
            >
              → Analyse Rentabilité (VAN/TRI/DRCI)
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
      </div>
      </div>
    </ModernProjectLayout>
  )
}
