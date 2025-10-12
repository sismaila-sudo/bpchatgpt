'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { FicheSynoptiqueService } from '@/services/ficheSynoptiqueService'
import { Project } from '@/types/project'
import {
  FicheSynoptique,
  PresentationEntreprise,
  PresentationProjet,
  TypeCredit,
  GarantieItem
} from '@/types/ficheSynoptique'
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import { FormSkeleton } from '@/components/SkeletonLoaders'

export default function FicheSynoptiquePage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [ficheSynoptique, setFicheSynoptique] = useState<FicheSynoptique | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [presentationEntreprise, setPresentationEntreprise] = useState<PresentationEntreprise>({
    raisonSociale: '',
    dateCreation: '',
    formeJuridique: '',
    registreCommerce: '',
    identificationFiscale: '',
    adresse: '',
    telephone: '',
    email: '',
    presidentFondateur: '',
    capitalSocial: 0,
    repartitionCapital: '100% National',
    secteurActivite: '',
    activites: ''
  })

  const [presentationProjet, setPresentationProjet] = useState<PresentationProjet>({
    objetFinancement: '',
    besoinTotalFinancement: 0,
    detailsBesoins: {},
    apportPromoteur: 0,
    montantSollicite: 0
  })

  const [typesCredit, setTypesCredit] = useState<TypeCredit[]>([
    { type: 'CMT', montant: 0, dureeRemboursement: '60 mois', taux: 9, echeanceValidite: 'Trimestrielle' }
  ])

  const [garanties, setGaranties] = useState<GarantieItem[]>([
    { type: 'Garantie financière FONGIP', description: '60% des concours', montant: 0 }
  ])

  useEffect(() => {
    if (user && projectId) {
      loadProject()
      loadFicheSynoptique()
    }
  }, [projectId, user])

  const loadProject = async () => {
    if (!user || !projectId) return
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      setProject(projectData)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
    }
  }

  const loadFicheSynoptique = async () => {
    try {
      setLoading(true)
      const data = await FicheSynoptiqueService.getFicheSynoptique(projectId)

      if (data) {
        setFicheSynoptique(data)
        setPresentationEntreprise(data.presentationEntreprise)
        setPresentationProjet(data.presentationProjet)
        setTypesCredit(data.conditionsFinancement.typesCredit)
        setGaranties(data.garanties.garantiesProposees)
      } else if (user) {
        // Générer une fiche synoptique automatique
        const generated = await FicheSynoptiqueService.generateFromProject(projectId, user.uid)
        setPresentationEntreprise(generated.presentationEntreprise)
        setPresentationProjet(generated.presentationProjet)
        setTypesCredit(generated.conditionsFinancement.typesCredit)
        setGaranties(generated.garanties.garantiesProposees)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la fiche synoptique:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      await FicheSynoptiqueService.saveFicheSynoptique(projectId, {
        projectId,
        userId: user.uid,
        presentationEntreprise,
        presentationProjet,
        conditionsFinancement: { typesCredit },
        garanties: { garantiesProposees: garanties },
        donneesPrevisionnelles: ficheSynoptique?.donneesPrevisionnelles || {
          annees: [],
          margeCommerciale: [],
          chiffreAffaires: [],
          valeurAjoutee: [],
          excedentBrutExploitation: [],
          resultatExploitation: [],
          resultatFinancier: [],
          resultatActivitesOrdinaires: [],
          resultatHorsActivitesOrdinaires: [],
          impotsSurResultat: [],
          resultatNet: [],
          cashFlows: [],
          cashFlowsCumules: [],
          rentabiliteGlobale: []
        }
      })

      setMessage({ type: 'success', text: 'Fiche synoptique enregistrée avec succès' })
      await loadFicheSynoptique()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const addTypeCredit = () => {
    setTypesCredit([
      ...typesCredit,
      { type: 'Découvert', montant: 0, dureeRemboursement: '12 mois renouvelable', taux: 10, echeanceValidite: '12 mois' }
    ])
  }

  const removeTypeCredit = (index: number) => {
    setTypesCredit(typesCredit.filter((_, i) => i !== index))
  }

  const addGarantie = () => {
    setGaranties([...garanties, { type: '', description: '', montant: 0 }])
  }

  const removeGarantie = (index: number) => {
    setGaranties(garanties.filter((_, i) => i !== index))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(value)
  }

  if (loading) {
    return (
      <ModernProjectLayout
        projectId={projectId}
        projectName={project?.basicInfo?.name || 'Chargement...'}
      >
        <FormSkeleton />
      </ModernProjectLayout>
    )
  }

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project?.basicInfo?.name || 'Chargement...'}
      project={project}
      currentSection="fiche_synoptique"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Fiche Synoptique</h1>
                <p className="text-gray-600">Document de synthèse pour banques et institutions (FONGIP, FAISE)</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Section 1: Présentation de l'Entreprise */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Présentation de l'Entreprise</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Raison Sociale *</label>
              <input
                type="text"
                value={presentationEntreprise.raisonSociale}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, raisonSociale: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom légal de votre entreprise"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de Création *</label>
              <input
                type="date"
                value={presentationEntreprise.dateCreation}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, dateCreation: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forme Juridique *</label>
              <select
                value={presentationEntreprise.formeJuridique}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, formeJuridique: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                <option value="SA">Société Anonyme (SA)</option>
                <option value="SAS">Société par Actions Simplifiées (SAS)</option>
                <option value="SARL">Société à Responsabilité Limitée (SARL)</option>
                <option value="SUARL">Société Unipersonnelle à Responsabilité Limitée (SUARL)</option>
                <option value="SNC">Société en Nom Collectif (SNC)</option>
                <option value="EI">Entreprise Individuelle (EI)</option>
                <option value="GIE">Groupement d'Intérêt Économique (GIE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registre de Commerce</label>
              <input
                type="text"
                value={presentationEntreprise.registreCommerce}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, registreCommerce: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: SN-THS-2015-M-2090"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NINEA (Identification Fiscale)</label>
              <input
                type="text"
                value={presentationEntreprise.identificationFiscale}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, identificationFiscale: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 005226990 2F2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={presentationEntreprise.telephone}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, telephone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+221 77 575 22 00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={presentationEntreprise.email}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@entreprise.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Président / Fondateur</label>
              <input
                type="text"
                value={presentationEntreprise.presidentFondateur}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, presidentFondateur: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom complet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capital Social (FCFA)</label>
              <input
                type="number"
                value={presentationEntreprise.capitalSocial}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, capitalSocial: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Répartition du Capital</label>
              <input
                type="text"
                value={presentationEntreprise.repartitionCapital}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, repartitionCapital: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 100% National"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secteur d'Activité</label>
              <input
                type="text"
                value={presentationEntreprise.secteurActivite}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, secteurActivite: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Aviculture"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse Complète</label>
              <input
                type="text"
                value={presentationEntreprise.adresse}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, adresse: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adresse complète avec ville et région"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Activités (Description)</label>
              <textarea
                value={presentationEntreprise.activites}
                onChange={(e) => setPresentationEntreprise({ ...presentationEntreprise, activites: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description des activités principales de l'entreprise..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Présentation du Projet */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <BanknotesIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Présentation du Projet</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Objet du Financement *</label>
              <textarea
                value={presentationProjet.objetFinancement}
                onChange={(e) => setPresentationProjet({ ...presentationProjet, objetFinancement: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez précisément l'objet du financement (acquisition équipements, construction, BFR, etc.)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Besoin Total (FCFA) *</label>
                <input
                  type="number"
                  value={presentationProjet.besoinTotalFinancement}
                  onChange={(e) => setPresentationProjet({ ...presentationProjet, besoinTotalFinancement: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(presentationProjet.besoinTotalFinancement)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apport Promoteur (FCFA) *</label>
                <input
                  type="number"
                  value={presentationProjet.apportPromoteur}
                  onChange={(e) => setPresentationProjet({ ...presentationProjet, apportPromoteur: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(presentationProjet.apportPromoteur)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant Sollicité (FCFA)</label>
                <input
                  type="number"
                  value={presentationProjet.besoinTotalFinancement - presentationProjet.apportPromoteur}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                />
                <p className="text-sm text-green-600 mt-1 font-medium">
                  {formatCurrency(presentationProjet.besoinTotalFinancement - presentationProjet.apportPromoteur)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Conditions de Financement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Conditions de Financement</h2>
            </div>
            <button
              onClick={addTypeCredit}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
            >
              + Ajouter un crédit
            </button>
          </div>

          <div className="space-y-4">
            {typesCredit.map((credit, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Crédit #{index + 1}</h3>
                  {typesCredit.length > 1 && (
                    <button
                      onClick={() => removeTypeCredit(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={credit.type}
                      onChange={(e) => {
                        const newTypes = [...typesCredit]
                        newTypes[index].type = e.target.value as TypeCredit['type']
                        setTypesCredit(newTypes)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="CMT">CMT</option>
                      <option value="Découvert">Découvert</option>
                      <option value="Avance sur factures">Avance sur factures</option>
                      <option value="Crédit-bail">Crédit-bail</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA)</label>
                    <input
                      type="number"
                      value={credit.montant}
                      onChange={(e) => {
                        const newTypes = [...typesCredit]
                        newTypes[index].montant = parseFloat(e.target.value) || 0
                        setTypesCredit(newTypes)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Durée</label>
                    <input
                      type="text"
                      value={credit.dureeRemboursement}
                      onChange={(e) => {
                        const newTypes = [...typesCredit]
                        newTypes[index].dureeRemboursement = e.target.value
                        setTypesCredit(newTypes)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="60 mois"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taux (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={credit.taux}
                      onChange={(e) => {
                        const newTypes = [...typesCredit]
                        newTypes[index].taux = parseFloat(e.target.value) || 0
                        setTypesCredit(newTypes)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Échéance</label>
                    <input
                      type="text"
                      value={credit.echeanceValidite}
                      onChange={(e) => {
                        const newTypes = [...typesCredit]
                        newTypes[index].echeanceValidite = e.target.value
                        setTypesCredit(newTypes)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Trimestrielle"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Garanties */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Garanties Proposées</h2>
            </div>
            <button
              onClick={addGarantie}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
            >
              + Ajouter une garantie
            </button>
          </div>

          <div className="space-y-4">
            {garanties.map((garantie, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Garantie #{index + 1}</h3>
                  {garanties.length > 1 && (
                    <button
                      onClick={() => removeGarantie(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de Garantie</label>
                    <input
                      type="text"
                      value={garantie.type}
                      onChange={(e) => {
                        const newGaranties = [...garanties]
                        newGaranties[index].type = e.target.value
                        setGaranties(newGaranties)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ex: Garantie FONGIP, Hypothèque, Dépôt..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={garantie.description}
                      onChange={(e) => {
                        const newGaranties = [...garanties]
                        newGaranties[index].description = e.target.value
                        setGaranties(newGaranties)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ex: 60% des concours"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA)</label>
                    <input
                      type="number"
                      value={garantie.montant || ''}
                      onChange={(e) => {
                        const newGaranties = [...garanties]
                        newGaranties[index].montant = parseFloat(e.target.value) || 0
                        setGaranties(newGaranties)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de sauvegarde final */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Les données prévisionnelles seront automatiquement calculées à partir de vos projections financières.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
            >
              {saving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              {saving ? 'Enregistrement...' : 'Enregistrer la Fiche Synoptique'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </ModernProjectLayout>
  )
}
