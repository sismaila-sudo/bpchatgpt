'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { RelationsBancairesService } from '@/services/relationsBancairesService'
import {
  RelationsBancaires,
  BanquePartenaire,
  EncoursCredit,
  CreditHistorique
} from '@/types/relationsBancaires'
import {
  BuildingLibraryIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function RelationsBancairesPage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'banques' | 'encours' | 'historique' | 'evaluation'>('banques')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [banques, setBanques] = useState<BanquePartenaire[]>([])
  const [encoursCredits, setEncoursCredits] = useState<EncoursCredit[]>([])
  const [creditsHistoriques, setCreditsHistoriques] = useState<CreditHistorique[]>([])
  const [noteBancaire, setNoteBancaire] = useState<any>(null)

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
      loadData()
    }
  }, [projectId, user])

  const loadData = async () => {
    try {
      const data = await RelationsBancairesService.getRelationsBancaires(projectId)
      if (data) {
        setBanques(data.banquesPartenaires)
        setEncoursCredits(data.encoursCredits)
        setCreditsHistoriques(data.creditsHistoriques)

        const note = RelationsBancairesService.calculateNoteBancaire(data)
        setNoteBancaire(note)
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    toast.loading('Sauvegarde en cours...', { id: 'save' })

    try {
      await RelationsBancairesService.saveRelationsBancaires(projectId, user.uid, {
        banquesPartenaires: banques,
        encoursCredits,
        creditsHistoriques
      })

      toast.success('Relations bancaires sauvegardées', { id: 'save' })
      await loadData() // Recharger pour recalculer la note
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde', { id: 'save' })
    } finally {
      setSaving(false)
    }
  }

  const addBanque = () => {
    setBanques([...banques, {
      nomBanque: '',
      typeBanque: 'commerciale',
      agence: '',
      adresse: '',
      telephone: '',
      email: '',
      contactPrincipal: {
        nom: '',
        fonction: '',
        telephone: '',
        email: ''
      },
      dateOuvertureCompte: '',
      numeroCompte: '',
      typeRelation: 'principale'
    }])
  }

  const addEncours = () => {
    setEncoursCredits([...encoursCredits, {
      banque: '',
      typeCredit: 'investissement',
      montantInitial: 0,
      capitalRestantDu: 0,
      tauxInteret: 0,
      echeanceMensuelle: 0,
      dateDebut: '',
      dateFin: '',
      garantiesMobilisees: [],
      classeRisque: '1'
    }])
  }

  const updateBanque = (index: number, field: keyof BanquePartenaire, value: any) => {
    const updated = [...banques]
    updated[index] = { ...updated[index], [field]: value }
    setBanques(updated)
  }

  const updateEncours = (index: number, field: keyof EncoursCredit, value: any) => {
    const updated = [...encoursCredits]
    updated[index] = { ...updated[index], [field]: value }
    setEncoursCredits(updated)
  }

  const deleteBanque = (index: number) => {
    setBanques(banques.filter((_, i) => i !== index))
  }

  const deleteEncours = (index: number) => {
    setEncoursCredits(encoursCredits.filter((_, i) => i !== index))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(value)
  }

  const totalEncours = encoursCredits.reduce((sum, credit) => sum + credit.capitalRestantDu, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project?.basicInfo?.name || 'Chargement...'}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <BuildingLibraryIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Relations Bancaires</h1>
              <p className="text-gray-600 mt-1">Historique et situation bancaire</p>
            </div>
          </div>

          {noteBancaire && (
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">{noteBancaire.note.toFixed(0)}/100</div>
              <div className={`text-sm font-semibold mt-1 ${
                noteBancaire.mention === 'Excellent' ? 'text-green-600' :
                noteBancaire.mention === 'Très Bien' ? 'text-blue-600' :
                noteBancaire.mention === 'Bien' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {noteBancaire.mention}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="w-5 h-5 inline mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 inline mr-2" />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <BuildingLibraryIcon className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Banques Partenaires</div>
              <div className="text-3xl font-bold text-gray-900">{banques.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <BanknotesIcon className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Encours Total</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalEncours)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Crédits Actifs</div>
              <div className="text-3xl font-bold text-gray-900">{encoursCredits.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xl">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-2">
            {[
              { id: 'banques' as const, label: 'Banques Partenaires' },
              { id: 'encours' as const, label: 'Encours Crédits' }
              // Note: Onglets "Historique" et "Évaluation" temporairement masqués (en cours d'implémentation)
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* TAB 1: Banques Partenaires */}
          {activeTab === 'banques' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Banques Partenaires</h2>
                <button
                  onClick={addBanque}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Ajouter Banque
                </button>
              </div>

              <div className="space-y-4">
                {banques.map((banque, index) => (
                  <div key={index} className="border rounded-lg p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la Banque</label>
                        <input
                          type="text"
                          value={banque.nomBanque}
                          onChange={(e) => updateBanque(index, 'nomBanque', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Ex: CBAO, BICIS, BOA"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={banque.typeBanque}
                          onChange={(e) => updateBanque(index, 'typeBanque', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        >
                          <option value="commerciale">Banque Commerciale</option>
                          <option value="islamique">Banque Islamique</option>
                          <option value="microfinance">Microfinance</option>
                          <option value="cooperative">Coopérative</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agence</label>
                        <input
                          type="text"
                          value={banque.agence}
                          onChange={(e) => updateBanque(index, 'agence', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Ex: Plateau, Liberté 6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={banque.telephone}
                          onChange={(e) => updateBanque(index, 'telephone', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="+221 33 XXX XX XX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">N° Compte</label>
                        <input
                          type="text"
                          value={banque.numeroCompte}
                          onChange={(e) => updateBanque(index, 'numeroCompte', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="XXX XXXXXXXXXX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                        <select
                          value={banque.typeRelation}
                          onChange={(e) => updateBanque(index, 'typeRelation', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        >
                          <option value="principale">Principale</option>
                          <option value="secondaire">Secondaire</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteBanque(index)}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}

                {banques.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BuildingLibraryIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucune banque partenaire ajoutée</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Encours Crédits */}
          {activeTab === 'encours' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Encours Crédits</h2>
                <button
                  onClick={addEncours}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  + Ajouter Crédit
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Banque</th>
                      <th className="border p-3 text-left">Type</th>
                      <th className="border p-3 text-right">Montant Initial</th>
                      <th className="border p-3 text-right">Capital Restant Dû</th>
                      <th className="border p-3 text-right">Taux (%)</th>
                      <th className="border p-3 text-right">Échéance Mensuelle</th>
                      <th className="border p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encoursCredits.map((credit, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">
                          <input
                            type="text"
                            value={credit.banque}
                            onChange={(e) => updateEncours(index, 'banque', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="Nom banque"
                          />
                        </td>
                        <td className="border p-2">
                          <select
                            value={credit.typeCredit}
                            onChange={(e) => updateEncours(index, 'typeCredit', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          >
                            <option value="investissement">Investissement</option>
                            <option value="exploitation">Exploitation</option>
                            <option value="tresorerie">Trésorerie</option>
                            <option value="decouvert">Découvert</option>
                            <option value="leasing">Leasing</option>
                          </select>
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={credit.montantInitial}
                            onChange={(e) => updateEncours(index, 'montantInitial', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded text-right"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={credit.capitalRestantDu}
                            onChange={(e) => updateEncours(index, 'capitalRestantDu', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded text-right"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={credit.tauxInteret}
                            onChange={(e) => updateEncours(index, 'tauxInteret', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded text-right"
                            step="0.1"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={credit.echeanceMensuelle}
                            onChange={(e) => updateEncours(index, 'echeanceMensuelle', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded text-right"
                          />
                        </td>
                        <td className="border p-2 text-center">
                          <button
                            onClick={() => deleteEncours(index)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 font-bold">
                      <td colSpan={3} className="border p-3 text-right">TOTAL ENCOURS</td>
                      <td className="border p-3 text-right text-blue-600">{formatCurrency(totalEncours)}</td>
                      <td colSpan={3} className="border"></td>
                    </tr>
                  </tfoot>
                </table>

                {encoursCredits.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucun crédit en cours</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglets "Historique" et "Évaluation" masqués - Seront implémentés dans une prochaine version */}

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
                onClick={() => window.location.href = `/projects/${projectId}/analyse-financiere`}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300 shadow-sm font-medium"
              >
                → Analyse Financière Historique (3 ans)
              </button>
              <button
                onClick={() => window.location.href = `/projects/${projectId}/rentabilite`}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-300 shadow-sm font-medium"
              >
                → Analyse Rentabilité (VAN/TRI/DRCI)
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
      </div>
    </ModernProjectLayout>
  )
}
