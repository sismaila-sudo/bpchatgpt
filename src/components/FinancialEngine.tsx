'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import {
  FinancialEngine,
  FinancialInputs,
  FinancialProjections,
  RevenueStream,
  CostItem,
  InvestmentItem,
  LoanItem,
  SenegalFinancialUtils
} from '@/services/financialEngine'
import { FinancialCalculationService } from '@/services/financialService'
import { TableauxFinanciersService } from '@/services/tableauxFinanciersService'
import { FinancialTablesCalculator } from '@/services/financialTablesCalculator'
import {
  CurrencyDollarIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
  CalculatorIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import SaveIndicator from './SaveIndicator'

interface FinancialEngineProps {
  projectId: string
  onSave?: (data: FinancialInputs) => Promise<void> | void
}

export default function FinancialEngineComponent({ projectId, onSave }: FinancialEngineProps) {
  const { user } = useAuth()

  // État local sans auto-sauvegarde
  const [inputs, setInputs] = useState<FinancialInputs>({
    revenueStreams: [],
    fixedCosts: [],
    variableCosts: [],
    initialInvestments: [],
    ownFunds: 0,
    loans: [],
    grants: [],
    projectionYears: 3,
    taxRate: SenegalFinancialUtils.CORPORATE_TAX_RATE,
    depreciationRate: 0.2,
    workingCapitalDays: 30
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  // Chargement initial depuis Firestore (pas d'auto-save)
  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const saved = await projectService.getProjectSection(projectId, user.uid, 'financialEngine')
        if (saved) {
          setInputs(saved as unknown as FinancialInputs)
        }
      } catch (e) {
        console.error('Erreur chargement financialEngine:', e)
      } finally {
        setIsLoaded(true)
      }
    }
    load()
  }, [projectId, user])

  // Marquer l'état comme non sauvegardé après chargement
  useEffect(() => {
    if (!isLoaded) return
    setSaveStatus('unsaved')
  }, [inputs, isLoaded])

  const [projections, setProjections] = useState<FinancialProjections | null>(null)
  const [activeTab, setActiveTab] = useState<'inputs' | 'projections' | 'ratios'>('inputs')
  const [calculating, setCalculating] = useState(false)
  const [loanSchedules, setLoanSchedules] = useState<Record<string, { month: number; principal: number; interest: number; balance: number; payment: number }[]>>({})
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
  const [expandedSeasonalityId, setExpandedSeasonalityId] = useState<string | null>(null)

  const calculateProjections = useCallback(async () => {
    setCalculating(true)
    try {
      const engine = new FinancialEngine(inputs)
      const results = engine.calculateProjections()
      setProjections(results)
      
      // ⚠️ Émettre événement pour widget validation (READ-ONLY)
      console.log('📊 Projections calculées, émission événement...', results)
      window.dispatchEvent(new CustomEvent('projectionsCalculated', {
        detail: { projections: results }
      }))
      console.log('✅ Événement projectionsCalculated émis')
    } catch (error) {
      console.error('Erreur calcul financier:', error)
    } finally {
      setCalculating(false)
    }
  }, [inputs])

  // Ref pour toujours avoir la dernière version de calculateProjections
  const calculateProjectionsRef = useRef(calculateProjections)
  useEffect(() => {
    calculateProjectionsRef.current = calculateProjections
  }, [calculateProjections])

  const calculateLoanSchedule = (loan: LoanItem) => {
    const calc = new FinancialCalculationService()
    const result = calc.calculateLoanPayment(
      loan.amount,
      loan.interestRate,
      loan.termYears * 12,
      loan.gracePeriodMonths || 0
    )
    setLoanSchedules(prev => ({ ...prev, [loan.id]: result.schedule }))
  }

  // Sauvegarde uniquement sur action utilisateur (événement externe ou bouton interne)
  useEffect(() => {
    const handleExternalSave = async () => {
      try {
        setSaveStatus('saving')
        await onSave?.(inputs)
        setSaveStatus('saved')
        alert('✅ Données financières sauvegardées avec succès !')
      } catch (e) {
        console.error('Erreur sauvegarde moteur financier:', e)
        setSaveStatus('unsaved')
        alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.')
      }
    }
    const handleExternalRecalc = () => {
      console.log('🔄 Recalcul demandé...')
      calculateProjectionsRef.current()
    }
    const handleGenerateNarrative = async () => {
      // Simple génération locale: synthèse courte des hypothèses et indicateurs clés
      const revenue = projections?.revenues?.[0] || 0
      const netMargin = projections?.netMargin?.[0] || 0
      const irr = projections?.irr ?? 0
      const dscr = projections?.dscr?.[0] ?? 0

      const narrative = [
        `Hypothèses initiales: ${inputs.revenueStreams.length} flux, ${inputs.fixedCosts.length} coûts fixes, ${inputs.initialInvestments.length} investissements, ${inputs.loans.length} prêts.`,
        `Année 1: Chiffre d'affaires estimé ${new Intl.NumberFormat('fr-FR').format(Math.round(revenue))} FCFA, marge nette ${netMargin.toFixed(1)}%.`,
        `Rentabilité: TRI ${irr.toFixed(1)}%. Couverture du service de la dette (DSCR): ${dscr.toFixed(2)}.`,
        `Remarque: ajustez les flux/coûts et recalculez pour affiner la trajectoire.`,
      ].join(' ')

      // Sauvegarde narrative côté projet
      try {
        if (user) {
          await projectService.updateProjectSection(projectId, user.uid, 'financialNarrative', {
            narrative,
            generatedAt: new Date()
          } as unknown as Record<string, unknown>)
          alert('✅ Texte BP généré et sauvegardé avec succès.')
        } else {
          alert(narrative)
        }
      } catch (e) {
        console.error('Erreur sauvegarde narrative:', e)
        alert('❌ Erreur lors de la sauvegarde du texte BP.')
      }
    }

    const handleExportToTables = async () => {
      if (!user) {
        alert('⚠️ Veuillez vous connecter pour exporter vers les tableaux.')
        return
      }

      console.log('🚀 Début export tableaux financiers complets...')

      // S'assurer d'avoir des projections fraîches
      let currentProjections = projections
      try {
        const engine = new FinancialEngine(inputs)
        currentProjections = engine.calculateProjections()
        setProjections(currentProjections)
      } catch (e) {
        console.error('Erreur calcul projections avant export:', e)
        alert('❌ Erreur lors du calcul des projections.')
        return
      }

      if (!currentProjections) {
        alert('⚠️ Veuillez saisir des données (revenus/coûts) puis réessayez l\'export.')
        return
      }

      try {
        // ========== NOUVEAU: GÉNÉRATION COMPLÈTE DES TABLEAUX ==========
        console.log('📊 Génération tableaux financiers complets via FinancialTablesCalculator...')

        const calculator = new FinancialTablesCalculator(inputs, currentProjections)
        const tableauxComplets = calculator.generateCompleteFinancialTables(projectId, user.uid)

        console.log('✅ Tableaux générés:', {
          comptesResultat: tableauxComplets.comptesResultat.length,
          tableauxCharges: tableauxComplets.tableauxCharges.length,
          immobilisations: tableauxComplets.planAmortissement.immobilisations.length,
          bilans: tableauxComplets.bilans.length,
          moisTresorerie: tableauxComplets.planTresorerieAnnee1.mois.length,
          calculsBFR: tableauxComplets.calculsBFR.length,
          ratios: tableauxComplets.ratios.length
        })

        // Sauvegarder dans Firestore
        await projectService.updateProjectSection(
          projectId,
          user.uid,
          'financialTablesExport',
          tableauxComplets as unknown as Record<string, unknown>
        )

        console.log('✅ Export sauvegardé dans Firestore')

        alert(`✅ EXPORT COMPLET RÉUSSI !

📊 Tableaux générés:
- ${tableauxComplets.comptesResultat.length} Comptes de Résultat
- ${tableauxComplets.tableauxCharges.length} Tableaux des Charges
- Plan d'Amortissement (${tableauxComplets.planAmortissement.immobilisations.length} immobilisations)
- ${tableauxComplets.bilans.length} Bilans Prévisionnels
- Plan de Trésorerie mensuel (${tableauxComplets.planTresorerieAnnee1.mois.length} mois)
- Calculs BFR/FDR/TN
- Ratios financiers complets

➡️ Consultez tous les tableaux dans "Tableaux Financiers"`)

      } catch (e) {
        console.error('❌ Erreur export tableaux:', e)
        alert(`❌ Erreur lors de l'export vers Tableaux Financiers.\n\nDétails: ${e}\n\nVeuillez réessayer ou contacter le support.`)
      }
    }

    window.addEventListener('saveFinancialEngine', handleExternalSave as EventListener)
    window.addEventListener('recalculateFinancialEngine', handleExternalRecalc as EventListener)
    window.addEventListener('generateFinancialNarrative', handleGenerateNarrative as EventListener)
    window.addEventListener('exportFinancialToTables', handleExportToTables as EventListener)
    return () => {
      window.removeEventListener('saveFinancialEngine', handleExternalSave as EventListener)
      window.removeEventListener('recalculateFinancialEngine', handleExternalRecalc as EventListener)
      window.removeEventListener('generateFinancialNarrative', handleGenerateNarrative as EventListener)
      window.removeEventListener('exportFinancialToTables', handleExportToTables as EventListener)
    }
  }, [inputs, onSave, projections, user, projectId])

  useEffect(() => {
    if (inputs.revenueStreams.length > 0 || inputs.fixedCosts.length > 0) {
      calculateProjectionsRef.current()
    }
  }, [inputs])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const addRevenueStream = () => {
    const newStream: RevenueStream = {
      id: Date.now().toString(),
      name: '',
      unitPrice: 0,
      quantity: 0,
      seasonality: Array(12).fill(1),
      growthRate: 0.1,
      category: 'product'
    }
    setInputs(prev => ({
      ...prev,
      revenueStreams: [...prev.revenueStreams, newStream]
    }))
  }

  const updateRevenueStream = (id: string, updates: Partial<RevenueStream>) => {
    setInputs(prev => ({
      ...prev,
      revenueStreams: prev.revenueStreams.map(stream =>
        stream.id === id ? { ...stream, ...updates } : stream
      )
    }))
  }

  const removeRevenueStream = (id: string) => {
    setInputs(prev => ({
      ...prev,
      revenueStreams: prev.revenueStreams.filter(stream => stream.id !== id)
    }))
  }

  const addCost = (type: 'fixed' | 'variable') => {
    const newCost: CostItem = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      category: '',
      isRecurring: true,
      frequency: 'monthly',
      growthRate: SenegalFinancialUtils.INFLATION_RATE
    }

    setInputs(prev => ({
      ...prev,
      [type === 'fixed' ? 'fixedCosts' : 'variableCosts']: [
        ...prev[type === 'fixed' ? 'fixedCosts' : 'variableCosts'],
        newCost
      ]
    }))
  }

  const updateCost = (id: string, updates: Partial<CostItem>, type: 'fixed' | 'variable') => {
    const key = type === 'fixed' ? 'fixedCosts' : 'variableCosts'
    setInputs(prev => ({
      ...prev,
      [key]: prev[key].map(cost =>
        cost.id === id ? { ...cost, ...updates } : cost
      )
    }))
  }

  const removeCost = (id: string, type: 'fixed' | 'variable') => {
    const key = type === 'fixed' ? 'fixedCosts' : 'variableCosts'
    setInputs(prev => ({
      ...prev,
      [key]: prev[key].filter(cost => cost.id !== id)
    }))
  }

  const addInvestment = () => {
    const newInvestment: InvestmentItem = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      category: 'equipment',
      depreciationYears: 5,
      residualValue: 0
    }
    setInputs(prev => ({
      ...prev,
      initialInvestments: [...prev.initialInvestments, newInvestment]
    }))
  }

  const updateInvestment = (id: string, updates: Partial<InvestmentItem>) => {
    setInputs(prev => ({
      ...prev,
      initialInvestments: prev.initialInvestments.map(inv =>
        inv.id === id ? { ...inv, ...updates } : inv
      )
    }))
  }

  const removeInvestment = (id: string) => {
    setInputs(prev => ({
      ...prev,
      initialInvestments: prev.initialInvestments.filter(inv => inv.id !== id)
    }))
  }

  const addLoan = () => {
    const newLoan: LoanItem = {
      id: Date.now().toString(),
      source: '',
      amount: 0,
      interestRate: SenegalFinancialUtils.BANK_INTEREST_RATE,
      termYears: 5,
      gracePeriodMonths: 0
    }
    setInputs(prev => ({
      ...prev,
      loans: [...prev.loans, newLoan]
    }))
  }

  const updateLoan = (id: string, updates: Partial<LoanItem>) => {
    setInputs(prev => ({
      ...prev,
      loans: prev.loans.map(loan =>
        loan.id === id ? { ...loan, ...updates } : loan
      )
    }))
  }

  const removeLoan = (id: string) => {
    setInputs(prev => ({
      ...prev,
      loans: prev.loans.filter(loan => loan.id !== id)
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <CalculatorIcon className="h-8 w-8 text-blue-600 mr-3" />
              Moteur Financier
            </h1>
            <p className="text-gray-600">
              Modélisation financière avancée adaptée au marché sénégalais
            </p>
          </div>

          {/* Indicateur de sauvegarde */}
          <SaveIndicator status={saveStatus} />
        </div>
      </div>

      {/* Navigation onglets */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'inputs', label: 'Données d\'entrée', icon: CurrencyDollarIcon },
            { key: 'projections', label: 'Projections', icon: ChartBarIcon },
            { key: 'ratios', label: 'Ratios & Indicateurs', icon: DocumentChartBarIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'inputs' && (
        <div className="space-y-8">
          {/* Flux de revenus */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Flux de revenus</h2>
              <button
                type="button"
                onClick={addRevenueStream}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {inputs.revenueStreams.map((stream) => (
                <div key={stream.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du produit/service
                      </label>
                      <input
                        type="text"
                        value={stream.name}
                        onChange={(e) => updateRevenueStream(stream.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Restaurant, Formation..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix unitaire (FCFA)
                      </label>
                      <input
                        type="number"
                        value={stream.unitPrice}
                        onChange={(e) => updateRevenueStream(stream.id, { unitPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité mensuelle
                      </label>
                      <input
                        type="number"
                        value={stream.quantity}
                        onChange={(e) => updateRevenueStream(stream.id, { quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Croissance annuelle (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={stream.growthRate * 100}
                        onChange={(e) => updateRevenueStream(stream.id, { growthRate: Number(e.target.value) / 100 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Saisonnalité (optionnel - dépliable) */}
                  <div className="mt-4 border-t pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedSeasonalityId(expandedSeasonalityId === stream.id ? null : stream.id)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                    >
                      <span>⚙️ Saisonnalité (optionnel)</span>
                      <span className="text-xs text-gray-500">
                        {expandedSeasonalityId === stream.id ? '▼' : '▶'}
                      </span>
                    </button>

                    {expandedSeasonalityId === stream.id && (
                      <div className="mt-3 bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-3">
                          Ajustez les coefficients par mois si vos ventes varient selon la période de l'année.
                          1.0 = mois normal, 1.2 = +20%, 0.8 = -20%
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, idx) => (
                            <div key={idx}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {month}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="3"
                                value={stream.seasonality[idx]}
                                onChange={(e) => {
                                  const newSeasonality = [...stream.seasonality]
                                  newSeasonality[idx] = Number(e.target.value) || 1
                                  updateRevenueStream(stream.id, { seasonality: newSeasonality })
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateRevenueStream(stream.id, { seasonality: Array(12).fill(1) })
                            }}
                            className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            Réinitialiser (tous à 1.0)
                          </button>
                          <div className="text-xs text-gray-600 flex items-center">
                            Moyenne: {(stream.seasonality.reduce((a, b) => a + b, 0) / 12).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Revenus annuels estimés: {formatCurrency(stream.unitPrice * stream.quantity * 12)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRevenueStream(stream.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {inputs.revenueStreams.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun flux de revenus défini. Cliquez sur "Ajouter" pour commencer.
                </div>
              )}
            </div>
          </div>

          {/* Coûts fixes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Coûts fixes</h2>
              <button
                type="button"
                onClick={() => addCost('fixed')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {inputs.fixedCosts.map((cost) => (
                <div key={cost.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Ligne 1 : Champs principaux */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du coût
                      </label>
                      <input
                        type="text"
                        value={cost.name}
                        onChange={(e) => updateCost(cost.id, { name: e.target.value }, 'fixed')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Loyer, Salaires..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant (FCFA)
                      </label>
                      <input
                        type="number"
                        value={cost.amount}
                        onChange={(e) => updateCost(cost.id, { amount: Number(e.target.value) }, 'fixed')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fréquence
                      </label>
                      <select
                        value={cost.frequency}
                        onChange={(e) => updateCost(cost.id, { frequency: e.target.value as any }, 'fixed')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="monthly">Mensuel</option>
                        <option value="quarterly">Trimestriel</option>
                        <option value="yearly">Annuel</option>
                      </select>
                    </div>
                  </div>

                  {/* Ligne 2 : Catégorie + Taux augmentation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie
                      </label>
                      <select
                        value={cost.category || ''}
                        onChange={(e) => updateCost(cost.id, { category: e.target.value }, 'fixed')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Choisir --</option>
                        <option value="loyer">Loyer/Location</option>
                        <option value="energie">Énergie (Électricité, Eau, Gaz)</option>
                        <option value="telecoms">Télécoms</option>
                        <option value="personnel">Personnel (Salaires, Charges)</option>
                        <option value="entretien">Entretien/Maintenance</option>
                        <option value="marketing">Marketing/Publicité</option>
                        <option value="administratif">Administratif (Comptable, Assurances)</option>
                        <option value="transport">Transport</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Augmentation annuelle (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={cost.growthRate * 100}
                        onChange={(e) => updateCost(cost.id, { growthRate: Number(e.target.value) / 100 }, 'fixed')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 3 pour 3%/an"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Inflation Sénégal : 3%
                      </p>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeCost(cost.id, 'fixed')}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {inputs.fixedCosts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun coût fixe défini. Cliquez sur "Ajouter" pour commencer.
                </div>
              )}
            </div>
          </div>

          {/* Coûts variables */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Coûts variables</h2>
              <button
                type="button"
                onClick={() => addCost('variable')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>💡 Coûts variables</strong> : Coûts qui varient en fonction du volume de production ou de ventes
                (matières premières, commissions, frais de transport des ventes, etc.)
              </p>
            </div>

            <div className="space-y-4">
              {inputs.variableCosts.map((cost) => (
                <div key={cost.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  {/* Ligne 1 : Champs principaux */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du coût
                      </label>
                      <input
                        type="text"
                        value={cost.name}
                        onChange={(e) => updateCost(cost.id, { name: e.target.value }, 'variable')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Ex: Matières premières, Commissions..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant unitaire (FCFA)
                      </label>
                      <input
                        type="number"
                        value={cost.amount}
                        onChange={(e) => updateCost(cost.id, { amount: Number(e.target.value) }, 'variable')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fréquence
                      </label>
                      <select
                        value={cost.frequency}
                        onChange={(e) => updateCost(cost.id, { frequency: e.target.value as 'monthly' | 'quarterly' | 'yearly' }, 'variable')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="monthly">Mensuel</option>
                        <option value="quarterly">Trimestriel</option>
                        <option value="yearly">Annuel</option>
                      </select>
                    </div>
                  </div>

                  {/* Ligne 2 : Infos calculées */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Coût mensuel</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(cost.frequency === 'monthly' ? cost.amount : cost.amount / 12)}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Coût annuel</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(cost.frequency === 'yearly' ? cost.amount : cost.frequency === 'quarterly' ? cost.amount * 4 : cost.amount * 12)}
                      </p>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeCost(cost.id, 'variable')}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {inputs.variableCosts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun coût variable défini.</p>
                  <p className="text-sm mt-2">
                    Ajoutez les coûts qui varient selon votre volume de production/ventes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Investissements initiaux */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Investissements initiaux</h2>
              <button
                type="button"
                onClick={addInvestment}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {inputs.initialInvestments.map((investment) => (
                <div key={investment.id} className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'investissement
                      </label>
                      <input
                        type="text"
                        value={investment.name}
                        onChange={(e) => updateInvestment(investment.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Machine industrielle"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant (FCFA)
                      </label>
                      <input
                        type="number"
                        value={investment.amount}
                        onChange={(e) => updateInvestment(investment.id, { amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date d'acquisition
                      </label>
                      <input
                        type="month"
                        value={investment.date}
                        onChange={(e) => updateInvestment(investment.id, { date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée d'amortissement (ans)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={investment.depreciationYears}
                        onChange={(e) => updateInvestment(investment.id, { depreciationYears: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Équipement: 3-5 ans, Véhicule: 4-5 ans, Bâtiment: 10-20 ans
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Dotation annuelle:</strong> {formatCurrency(investment.amount / investment.depreciationYears)} / an
                      </p>
                      <p className="text-xs mt-1">
                        Amortissement linéaire sur {investment.depreciationYears} ans
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInvestment(investment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {inputs.initialInvestments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun investissement défini.</p>
                  <p className="text-sm mt-2">Ajoutez vos immobilisations (équipements, véhicules, bâtiments...)</p>
                </div>
              )}
            </div>
          </div>

          {/* Paramètres généraux */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Paramètres généraux</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fonds propres (FCFA)
                </label>
                <input
                  type="number"
                  value={inputs.ownFunds}
                  onChange={(e) => setInputs(prev => ({ ...prev, ownFunds: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Années de projection
                </label>
                <select
                  value={inputs.projectionYears}
                  onChange={(e) => setInputs(prev => ({ ...prev, projectionYears: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 ans</option>
                  <option value={5}>5 ans</option>
                  <option value={10}>10 ans</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux d'imposition (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.taxRate * 100}
                  onChange={(e) => setInputs(prev => ({ ...prev, taxRate: Number(e.target.value) / 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Taux corporatif Sénégal: 30%</p>
              </div>
            </div>
          </div>

          {/* Financement - Prêts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Financement — Prêts bancaires</h2>
              <button
                type="button"
                onClick={addLoan}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter un prêt
              </button>
            </div>

            <div className="space-y-4">
              {inputs.loans.map((loan) => (
                <div key={loan.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <input
                        type="text"
                        value={loan.source}
                        onChange={(e) => updateLoan(loan.id, { source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Ex: Banque X"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                      <input
                        type="number"
                        value={loan.amount}
                        onChange={(e) => updateLoan(loan.id, { amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Taux (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={loan.interestRate * 100}
                        onChange={(e) => updateLoan(loan.id, { interestRate: Number(e.target.value) / 100 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée (années)</label>
                      <input
                        type="number"
                        value={loan.termYears}
                        onChange={(e) => updateLoan(loan.id, { termYears: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Différé (mois)</label>
                      <input
                        type="number"
                        value={loan.gracePeriodMonths}
                        onChange={(e) => updateLoan(loan.id, { gracePeriodMonths: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Échéancier: intérêts pendant le différé, puis amortissement constant calculé.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          calculateLoanSchedule(loan)
                          setExpandedLoanId((prev) => (prev === loan.id ? null : loan.id))
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800"
                      >
                        {expandedLoanId === loan.id ? 'Masquer échéancier' : 'Voir échéancier'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLoan(loan.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {expandedLoanId === loan.id && loanSchedules[loan.id] && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700">Mois</th>
                            <th className="px-3 py-2 text-right text-gray-700">Intérêts</th>
                            <th className="px-3 py-2 text-right text-gray-700">Amortissement</th>
                            <th className="px-3 py-2 text-right text-gray-700">Paiement</th>
                            <th className="px-3 py-2 text-right text-gray-700">CRD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanSchedules[loan.id].slice(0, 24).map((row) => (
                            <tr key={row.month} className="odd:bg-white even:bg-gray-50">
                              <td className="px-3 py-2">{row.month}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Math.round(row.interest))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Math.round(row.principal))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Math.round(row.payment))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Math.round(row.balance))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-xs text-gray-500 mt-2">(Affichage limité aux 24 premiers mois)</div>
                    </div>
                  )}
                </div>
              ))}

              {inputs.loans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun prêt défini. Cliquez sur "Ajouter un prêt" pour commencer.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projections' && projections && (
        <div className="space-y-8">
          {/* Compte de résultat prévisionnel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Compte de résultat prévisionnel</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Éléments
                    </th>
                    {projections.years.map(year => (
                      <th key={year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Chiffre d'affaires
                    </td>
                    {projections.revenues.map((revenue, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(revenue)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Coûts totaux
                    </td>
                    {projections.totalCosts.map((cost, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(cost)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Bénéfice brut
                    </td>
                    {projections.grossProfit.map((profit, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(profit)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Bénéfice net
                    </td>
                    {projections.netProfit.map((profit, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(profit)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Flux de trésorerie */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Flux de trésorerie</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flux
                    </th>
                    {projections.years.map(year => (
                      <th key={year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Flux opérationnel
                    </td>
                    {projections.operatingCashFlow.map((flow, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(flow)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Flux d'investissement
                    </td>
                    {projections.investmentCashFlow.map((flow, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(flow)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Flux de financement
                    </td>
                    {projections.financingCashFlow.map((flow, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(flow)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Flux net
                    </td>
                    {projections.netCashFlow.map((flow, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(flow)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Flux cumulé
                    </td>
                    {projections.cumulativeCashFlow.map((flow, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(flow)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ratios' && projections && (
        <div className="space-y-8">
          {/* Indicateurs de rentabilité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-900">Point mort</h3>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {projections.breakEvenPoint > 0 ? `${Math.round(projections.breakEvenPoint)} mois` : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Temps pour atteindre l'équilibre</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-900">Retour sur investissement</h3>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {projections.paybackPeriod > 0 ? `${projections.paybackPeriod} ans` : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Période de récupération</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-900">TRI</h3>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {projections.irr.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Taux de rendement interne</p>
            </div>
          </div>

          {/* Ratios financiers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ratios financiers</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ratios de rentabilité</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Marge brute</span>
                    <span className="font-medium">
                      {projections.grossMargin[0]?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Marge nette</span>
                    <span className="font-medium">
                      {projections.netMargin[0]?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ROE première année</span>
                    <span className="font-medium">
                      {projections.roe[0]?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ROCE première année</span>
                    <span className="font-medium">
                      {projections.roce[0]?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">DSCR</span>
                    <span className="font-medium">
                      {projections.dscr[0]?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ratios de structure</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ratio de liquidité</span>
                    <span className="font-medium">
                      {projections.currentRatio[0]?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Endettement</span>
                    <span className="font-medium">
                      {projections.debtToEquity[0]?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rotation des actifs</span>
                    <span className="font-medium">
                      {projections.assetTurnover[0]?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VAN */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Valeur Actuelle Nette (VAN)</h3>
                <p className="text-sm text-gray-600">Rentabilité actualisée du projet</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(projections.npv)}
                </div>
                <p className={`text-sm ${projections.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {projections.npv > 0 ? 'Projet rentable' : 'Projet non rentable'}
                </p>
              </div>
            </div>
          </div>

          {/* DSCR par année */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Couverture du service de la dette (DSCR)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {projections.years.map((y) => (
                      <th key={y} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {y}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {projections.dscr.map((v, i) => (
                      <td key={i} className="px-4 py-3 text-sm font-medium">
                        <span className={v >= 1.2 ? 'text-green-600' : v >= 1.0 ? 'text-yellow-600' : 'text-red-600'}>
                          {v?.toFixed(2) ?? '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={calculateProjections}
          disabled={calculating}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <CalculatorIcon className="h-5 w-5 mr-2" />
          {calculating ? 'Calcul en cours...' : 'Recalculer'}
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              setSaveStatus('saving')
              await onSave?.(inputs)
              setSaveStatus('saved')
            } catch (e) {
              console.error('Erreur sauvegarde moteur financier:', e)
              setSaveStatus('unsaved')
            }
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  )
}