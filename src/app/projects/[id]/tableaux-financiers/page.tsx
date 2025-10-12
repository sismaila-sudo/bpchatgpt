'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

/**
 * PAGE TABLEAUX FINANCIERS PROFESSIONNELS
 * Conforme aux standards FONGIP et bancaires du Sénégal
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import type { ExportTableauxFinanciers } from '@/types/financialTables'
import {
  ArrowPathIcon,
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  BanknotesIcon,
  ScaleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

type TabType = 'resultat' | 'charges' | 'amortissement' | 'bilan' | 'tresorerie' | 'bfr'

export default function TableauxFinanciersPage() {
  const params = useParams()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('resultat')
  const [loading, setLoading] = useState(true)
  const [tableaux, setTableaux] = useState<ExportTableauxFinanciers | null>(null)

  useEffect(() => {
    if (user && projectId) {
      loadProject()
      loadTableaux()
    }
  }, [user, projectId])

  const loadProject = async () => {
    if (!user || !projectId) return
    try {
      const projectData = await projectService.getProjectById(projectId, user.uid)
      setProject(projectData)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
    }
  }

  const loadTableaux = async () => {
    if (!user || !projectId) return
    setLoading(true)
    try {
      const data = await projectService.getProjectSection(projectId, user.uid, 'financialTablesExport')
      if (data) {
        setTableaux(data as unknown as ExportTableauxFinanciers)
        console.log('✅ Tableaux chargés:', data)
      } else {
        console.warn('⚠️ Aucun tableau exporté')
      }
    } catch (error) {
      console.error('❌ Erreur chargement tableaux:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadTableaux()
    toast.success('Données rafraîchies')
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(v)

  const formatPercent = (v: number) => `${v.toFixed(1)}%`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des tableaux financiers...</p>
        </div>
      </div>
    )
  }

  if (!tableaux) {
    return (
      <ModernProjectLayout
        projectId={projectId}
        projectName={project?.basicInfo.name || 'Projet'}
        title="Tableaux Financiers"
        subtitle="Tableaux prévisionnels professionnels"
        project={project}
        currentSection="tableaux_financiers"
      >
        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-8 text-center">
          <DocumentChartBarIcon className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun tableau financier exporté
          </h3>
          <p className="text-gray-700 mb-6">
            Vous devez d'abord remplir vos données financières et exporter vers les tableaux.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            📍 Allez dans <strong>"Projections Financières"</strong> → Remplissez vos données →
            Cliquez sur <strong>"Exporter vers Tableaux"</strong>
          </p>
        </div>
      </ModernProjectLayout>
    )
  }

  const actions = (
    <button
      onClick={handleRefresh}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <ArrowPathIcon className="w-4 h-4" />
      Rafraîchir
    </button>
  )

  const tabs = [
    { id: 'resultat', label: 'Compte de Résultat', icon: DocumentChartBarIcon },
    { id: 'charges', label: 'Tableau des Charges', icon: CurrencyDollarIcon },
    { id: 'amortissement', label: 'Plan d\'Amortissement', icon: CalculatorIcon },
    { id: 'bilan', label: 'Bilan Prévisionnel', icon: ScaleIcon },
    { id: 'tresorerie', label: 'Plan de Trésorerie', icon: BanknotesIcon },
    { id: 'bfr', label: 'BFR/FDR/TN', icon: ChartBarIcon }
  ]

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project?.basicInfo.name || 'Projet'}
      title="Tableaux Financiers Prévisionnels"
      subtitle={`Période: ${tableaux.anneeDebut} - ${tableaux.anneeDebut + tableaux.nombreAnnees - 1} (${tableaux.nombreAnnees} ans)`}
      actions={actions}
      project={project}
      currentSection="tableaux_financiers"
    >
      {/* Onglets */}
      <div className="flex flex-wrap gap-2 border-b mb-6 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-t-2 border-x-2 border-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        {activeTab === 'resultat' && <CompteResultatTab tableaux={tableaux} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
        {activeTab === 'charges' && <TableauChargesTab tableaux={tableaux} formatCurrency={formatCurrency} />}
        {activeTab === 'amortissement' && <PlanAmortissementTab tableaux={tableaux} formatCurrency={formatCurrency} />}
        {activeTab === 'bilan' && <BilanPrevisionnelTab tableaux={tableaux} formatCurrency={formatCurrency} />}
        {activeTab === 'tresorerie' && <PlanTresorerieTab tableaux={tableaux} formatCurrency={formatCurrency} />}
        {activeTab === 'bfr' && <BFRFDRTNTab tableaux={tableaux} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
      </div>
    </ModernProjectLayout>
  )
}

// ========== ONGLET 1: COMPTE DE RÉSULTAT ==========

function CompteResultatTab({ tableaux, formatCurrency, formatPercent }: any) {
  const { comptesResultat } = tableaux

  if (!comptesResultat || comptesResultat.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun compte de résultat disponible.</p>
        <p className="text-sm mt-2">Exportez d'abord vos données financières.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Compte de Résultat Prévisionnel</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                ÉLÉMENTS
              </th>
              {comptesResultat.map((cr: any) => (
                <th key={cr.annee} className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">
                  {cr.annee}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Produits */}
            <tr className="bg-blue-50">
              <td colSpan={comptesResultat.length + 1} className="border border-gray-300 px-4 py-2 font-bold text-blue-900">
                PRODUITS D'EXPLOITATION
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Chiffre d'affaires</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right font-medium">
                  {formatCurrency(cr.chiffreAffaires)}
                </td>
              ))}
            </tr>

            {/* Charges */}
            <tr className="bg-red-50">
              <td colSpan={comptesResultat.length + 1} className="border border-gray-300 px-4 py-2 font-bold text-red-900">
                CHARGES D'EXPLOITATION
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Achats consommés</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(cr.achatsConsommes)}
                </td>
              ))}
            </tr>
            <tr className="bg-green-50">
              <td className="border border-gray-300 px-4 py-2 font-semibold">Marge commerciale</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-700">
                  {formatCurrency(cr.margeCommerciale)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Charges externes</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(cr.chargesExternes)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Charges de personnel</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(cr.chargesPersonnel)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Charges sociales</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(cr.chargesSociales)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Impôts et taxes</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(cr.impotsTaxes)}
                </td>
              ))}
            </tr>

            {/* Résultats intermédiaires */}
            <tr className="bg-purple-50">
              <td className="border border-gray-300 px-4 py-2 font-bold">VALEUR AJOUTÉE</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right font-bold text-purple-700">
                  {formatCurrency(cr.valeureAjoutee)}
                </td>
              ))}
            </tr>
            <tr className="bg-indigo-50">
              <td className="border border-gray-300 px-4 py-2 font-bold">EBE (Excédent Brut d'Exploitation)</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right font-bold text-indigo-700">
                  {formatCurrency(cr.excedentBrutExploitation)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Dotations aux amortissements</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right">
                  {formatCurrency(cr.dotationsAmortissements)}
                </td>
              ))}
            </tr>
            <tr className="bg-blue-100">
              <td className="border border-gray-300 px-4 py-2 font-bold">RÉSULTAT D'EXPLOITATION</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right font-bold text-blue-800">
                  {formatCurrency(cr.resultatExploitation)}
                </td>
              ))}
            </tr>

            {/* Financier */}
            <tr>
              <td className="border border-gray-300 px-4 py-2">Charges financières</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right text-red-600">
                  {formatCurrency(cr.chargesFinancieres)}
                </td>
              ))}
            </tr>
            <tr className="bg-yellow-50">
              <td className="border border-gray-300 px-4 py-2 font-bold">RÉSULTAT COURANT AVANT IMPÔTS</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right font-bold text-yellow-800">
                  {formatCurrency(cr.resultatCourantAvantImpots)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Impôt sur les sociétés (30%)</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-2 text-right text-red-600">
                  {formatCurrency(cr.impotSocietes)}
                </td>
              ))}
            </tr>

            {/* Résultat net */}
            <tr className="bg-green-100">
              <td className="border border-gray-300 px-4 py-3 font-bold text-lg">RÉSULTAT NET</td>
              {comptesResultat.map((cr: any) => (
                <td key={cr.annee} className="border border-gray-300 px-4 py-3 text-right font-bold text-lg text-green-800">
                  {formatCurrency(cr.resultatNet)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ratios */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {comptesResultat.map((cr: any) => {
          const tauxMargeEBE = (cr.excedentBrutExploitation / cr.chiffreAffaires) * 100
          const tauxMargeNette = (cr.resultatNet / cr.chiffreAffaires) * 100
          return (
            <div key={cr.annee} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{cr.annee}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Taux marge EBE:</span>
                  <span className="font-medium">{formatPercent(tauxMargeEBE)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux marge nette:</span>
                  <span className="font-medium">{formatPercent(tauxMargeNette)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ========== ONGLET 2: TABLEAU DES CHARGES ==========

function TableauChargesTab({ tableaux, formatCurrency }: any) {
  const { tableauxCharges } = tableaux

  if (!tableauxCharges || tableauxCharges.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun tableau des charges disponible.</p>
        <p className="text-sm mt-2">Exportez d'abord vos données financières.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tableau des Charges Détaillé</h2>

      {tableauxCharges.map((tc: any) => (
        <div key={tc.annee} className="border border-gray-300 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Année {tc.annee}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Charges externes */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 bg-blue-50 p-2 rounded">Charges Externes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Loyer et charges:</span>
                  <span>{formatCurrency(tc.loyerCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Électricité, eau, gaz:</span>
                  <span>{formatCurrency(tc.electriciteEauGaz)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Télécommunications:</span>
                  <span>{formatCurrency(tc.telecommunications)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assurances:</span>
                  <span>{formatCurrency(tc.assurances)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entretien/Maintenance:</span>
                  <span>{formatCurrency(tc.entretienMaintenance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport/Déplacements:</span>
                  <span>{formatCurrency(tc.transportDeplacements)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Publicité/Marketing:</span>
                  <span>{formatCurrency(tc.publiciteMarketing)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Total Charges Externes:</span>
                  <span className="text-blue-700">{formatCurrency(tc.totalChargesExternes)}</span>
                </div>
              </div>
            </div>

            {/* Charges de personnel */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 bg-green-50 p-2 rounded">Charges de Personnel</h4>
              <div className="space-y-3">
                {tc.salaireBrut.map((sp: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-900">{sp.poste}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {sp.nombreEmployes} employé(s)
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>Salaire brut annuel:</span>
                      <span className="font-medium">{formatCurrency(sp.salaireAnnuelBrut)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Charges sociales (24%):</span>
                      <span className="font-medium">{formatCurrency(sp.chargesSociales)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                      <span>Coût total:</span>
                      <span className="text-green-700">{formatCurrency(sp.coutTotal)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2 mt-2">
                  <span>Total Charges Personnel:</span>
                  <span className="text-green-800">{formatCurrency(tc.totalChargesPersonnel)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total général */}
          <div className="mt-6 bg-gray-900 text-white p-4 rounded-lg">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>TOTAL CHARGES ANNÉE {tc.annee}:</span>
              <span>{formatCurrency(tc.totalCharges)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ========== ONGLET 3: PLAN D'AMORTISSEMENT ==========

function PlanAmortissementTab({ tableaux, formatCurrency }: any) {
  const { planAmortissement } = tableaux

  if (!planAmortissement || !planAmortissement.immobilisations || planAmortissement.immobilisations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun plan d'amortissement disponible.</p>
        <p className="text-sm mt-2">Exportez d'abord vos données financières.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Plan d'Amortissement des Immobilisations</h2>

      {/* Liste des immobilisations */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Immobilisations</h3>
        <div className="space-y-2">
          {planAmortissement.immobilisations.map((immo: any) => (
            <div key={immo.id} className="flex justify-between text-sm">
              <span className="font-medium">{immo.nature}</span>
              <div className="text-right">
                <div>{formatCurrency(immo.valeurAcquisition)}</div>
                <div className="text-xs text-gray-600">
                  Amort. sur {immo.dureeAmortissement} ans ({immo.tauxAmortissement.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau d'amortissement par année */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left">Immobilisation</th>
              {planAmortissement.amortissementsParAnnee.map((a: any) => (
                <th key={a.annee} colSpan={3} className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  {a.annee}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm">Nature</th>
              {planAmortissement.amortissementsParAnnee.map((a: any) => (
                <>
                  <th key={`${a.annee}-dot`} className="border border-gray-300 px-2 py-2 text-xs">Dotation</th>
                  <th key={`${a.annee}-cumul`} className="border border-gray-300 px-2 py-2 text-xs">Cumul</th>
                  <th key={`${a.annee}-vnc`} className="border border-gray-300 px-2 py-2 text-xs">VNC</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {planAmortissement.immobilisations.map((immo: any) => (
              <tr key={immo.id}>
                <td className="border border-gray-300 px-4 py-2 font-medium">{immo.nature}</td>
                {planAmortissement.amortissementsParAnnee.map((annee: any) => {
                  const ligne = annee.lignes.find((l: any) => l.immobilisationId === immo.id)
                  return (
                    <>
                      <td key={`${annee.annee}-dot`} className="border border-gray-300 px-2 py-2 text-right text-sm">
                        {formatCurrency(ligne?.dotationAnnuelle || 0)}
                      </td>
                      <td key={`${annee.annee}-cumul`} className="border border-gray-300 px-2 py-2 text-right text-sm text-red-600">
                        {formatCurrency(ligne?.cumulAmortissements || 0)}
                      </td>
                      <td key={`${annee.annee}-vnc`} className="border border-gray-300 px-2 py-2 text-right text-sm font-medium text-green-700">
                        {formatCurrency(ligne?.valeurNetteComptable || 0)}
                      </td>
                    </>
                  )
                })}
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 px-4 py-3">TOTAL</td>
              {planAmortissement.amortissementsParAnnee.map((annee: any) => (
                <>
                  <td key={`${annee.annee}-tot-dot`} className="border border-gray-300 px-2 py-3 text-right">
                    {formatCurrency(annee.totalDotations)}
                  </td>
                  <td key={`${annee.annee}-tot-cumul`} colSpan={2} className="border border-gray-300 px-2 py-3 text-right">
                    VNC Total: {formatCurrency(annee.totalVNC)}
                  </td>
                </>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ========== ONGLET 4: BILAN PRÉVISIONNEL ==========

function BilanPrevisionnelTab({ tableaux, formatCurrency }: any) {
  const { bilans } = tableaux

  if (!bilans || bilans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun bilan prévisionnel disponible.</p>
        <p className="text-sm mt-2">Exportez d'abord vos données financières.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Bilans Prévisionnels</h2>

      {bilans.map((bilan: any) => {
        const { actif, passif, equilibre, ecart } = bilan
        return (
          <div key={actif.annee} className="border-2 border-gray-300 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Bilan au 31/12/{actif.annee}</h3>
              <div className={`px-4 py-2 rounded-lg font-medium ${equilibre ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {equilibre ? '✓ Équilibré' : `✗ Écart: ${formatCurrency(Math.abs(ecart))}`}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ACTIF */}
              <div>
                <h4 className="bg-blue-600 text-white px-4 py-2 font-bold text-lg rounded-t-lg">ACTIF</h4>
                <div className="border border-gray-300 p-4 rounded-b-lg">
                  {/* Actif immobilisé */}
                  <div className="mb-4">
                    <div className="font-semibold text-gray-700 mb-2">Actif Immobilisé</div>
                    <div className="space-y-1 text-sm pl-4">
                      <div className="flex justify-between">
                        <span>Immobilisations corporelles (net):</span>
                        <span className="font-medium">{formatCurrency(actif.immobilisationsCorporelles.net)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total Actif Immobilisé:</span>
                      <span className="text-blue-700">{formatCurrency(actif.totalActifImmobilise)}</span>
                    </div>
                  </div>

                  {/* Actif circulant */}
                  <div>
                    <div className="font-semibold text-gray-700 mb-2">Actif Circulant</div>
                    <div className="space-y-1 text-sm pl-4">
                      <div className="flex justify-between">
                        <span>Stocks:</span>
                        <span className="font-medium">{formatCurrency(actif.stocks.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Créances clients:</span>
                        <span className="font-medium">{formatCurrency(actif.creances.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disponibilités:</span>
                        <span className="font-medium">{formatCurrency(actif.disponibilites.total)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total Actif Circulant:</span>
                      <span className="text-blue-700">{formatCurrency(actif.totalActifCirculant)}</span>
                    </div>
                  </div>

                  {/* Total actif */}
                  <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t-2 bg-blue-50 p-3 rounded">
                    <span>TOTAL ACTIF:</span>
                    <span className="text-blue-900">{formatCurrency(actif.totalActif)}</span>
                  </div>
                </div>
              </div>

              {/* PASSIF */}
              <div>
                <h4 className="bg-green-600 text-white px-4 py-2 font-bold text-lg rounded-t-lg">PASSIF</h4>
                <div className="border border-gray-300 p-4 rounded-b-lg">
                  {/* Capitaux propres */}
                  <div className="mb-4">
                    <div className="font-semibold text-gray-700 mb-2">Capitaux Propres</div>
                    <div className="space-y-1 text-sm pl-4">
                      <div className="flex justify-between">
                        <span>Capital:</span>
                        <span className="font-medium">{formatCurrency(passif.capital)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Réserves:</span>
                        <span className="font-medium">{formatCurrency(passif.reserves)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Résultat exercice:</span>
                        <span className={`font-medium ${passif.resultatExercice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(passif.resultatExercice)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total Capitaux Propres:</span>
                      <span className="text-green-700">{formatCurrency(passif.totalCapitauxPropres)}</span>
                    </div>
                  </div>

                  {/* Dettes */}
                  <div>
                    <div className="font-semibold text-gray-700 mb-2">Dettes</div>
                    <div className="space-y-1 text-sm pl-4">
                      <div className="flex justify-between">
                        <span>Emprunts LT/MT:</span>
                        <span className="font-medium">{formatCurrency(passif.empruntsLongMoyenTerme)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emprunts CT:</span>
                        <span className="font-medium">{formatCurrency(passif.empruntsCourtTerme)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dettes fournisseurs:</span>
                        <span className="font-medium">{formatCurrency(passif.dettesFournisseurs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dettes fiscales/sociales:</span>
                        <span className="font-medium">{formatCurrency(passif.dettesFiscalesSociales)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total Dettes:</span>
                      <span className="text-red-700">{formatCurrency(passif.totalDettesFinancieres + passif.totalDettesExploitation)}</span>
                    </div>
                  </div>

                  {/* Total passif */}
                  <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t-2 bg-green-50 p-3 rounded">
                    <span>TOTAL PASSIF:</span>
                    <span className="text-green-900">{formatCurrency(passif.totalPassif)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ========== ONGLET 5: PLAN DE TRÉSORERIE ==========

function PlanTresorerieTab({ tableaux, formatCurrency }: any) {
  const { planTresorerieAnnee1 } = tableaux

  if (!planTresorerieAnnee1 || !planTresorerieAnnee1.mois || planTresorerieAnnee1.mois.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun plan de trésorerie disponible.</p>
        <p className="text-sm mt-2">Exportez d'abord vos données financières.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Plan de Trésorerie Mensuel - Année {planTresorerieAnnee1.annee}</h2>

      {/* Métriques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Encaissements totaux</div>
          <div className="text-xl font-bold text-blue-700">{formatCurrency(planTresorerieAnnee1.totalEncaissements)}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Décaissements totaux</div>
          <div className="text-xl font-bold text-red-700">{formatCurrency(planTresorerieAnnee1.totalDecaissements)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Trésorerie finale</div>
          <div className="text-xl font-bold text-green-700">{formatCurrency(planTresorerieAnnee1.tresorerieFinale)}</div>
        </div>
        <div className={`rounded-lg p-4 ${planTresorerieAnnee1.moisNegatifs > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
          <div className="text-sm text-gray-600">Mois négatifs</div>
          <div className={`text-xl font-bold ${planTresorerieAnnee1.moisNegatifs > 0 ? 'text-orange-700' : 'text-green-700'}`}>
            {planTresorerieAnnee1.moisNegatifs}
          </div>
        </div>
      </div>

      {/* Tableau mensuel (simplifié pour l'affichage) */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2">Mois</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Encaissements</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Décaissements</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Flux Net</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Trésorerie Fin</th>
            </tr>
          </thead>
          <tbody>
            {planTresorerieAnnee1.mois.map((m: any) => (
              <tr key={m.mois} className={m.tresorerieFin < 0 ? 'bg-red-50' : ''}>
                <td className="border border-gray-300 px-3 py-2 font-medium">{m.libelle}</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-green-700">
                  {formatCurrency(m.totalEncaissements)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right text-red-700">
                  {formatCurrency(m.totalDecaissements)}
                </td>
                <td className={`border border-gray-300 px-3 py-2 text-right font-medium ${m.fluxNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(m.fluxNet)}
                </td>
                <td className={`border border-gray-300 px-3 py-2 text-right font-bold ${m.tresorerieFin >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatCurrency(m.tresorerieFin)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ========== ONGLET 6: BFR/FDR/TN ==========

function BFRFDRTNTab({ tableaux, formatCurrency, formatPercent }: any) {
  const { calculsBFR } = tableaux

  if (!calculsBFR || calculsBFR.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun calcul BFR/FDR/TN disponible.</p>
        <p className="text-sm mt-2">Exportez d'abord vos données financières.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Besoin en Fonds de Roulement (BFR) et Trésorerie Nette (TN)</h2>

      {calculsBFR.map((calc: any) => (
        <div key={calc.annee} className="border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Année {calc.annee}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* BFR */}
            <div className="bg-blue-50 rounded-lg p-5">
              <div className="font-bold text-blue-900 text-lg mb-3">BFR</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Stocks:</span>
                  <span className="font-medium">{formatCurrency(calc.stocks)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créances clients:</span>
                  <span className="font-medium">{formatCurrency(calc.creancesClients)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Dettes fournisseurs:</span>
                  <span className="font-medium">({formatCurrency(calc.dettesFournisseurs)})</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Dettes fiscales/sociales:</span>
                  <span className="font-medium">({formatCurrency(calc.dettesFiscalesSociales)})</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t-2 pt-2 mt-2 border-blue-300">
                  <span>BFR:</span>
                  <span className="text-blue-800">{formatCurrency(calc.bfr)}</span>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {calc.bfrJours.toFixed(0)} jours de CA
                </div>
              </div>
            </div>

            {/* FDR */}
            <div className="bg-green-50 rounded-lg p-5">
              <div className="font-bold text-green-900 text-lg mb-3">FDR</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Capitaux permanents:</span>
                  <span className="font-medium">{formatCurrency(calc.capitauxPermanents)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Actif immobilisé:</span>
                  <span className="font-medium">({formatCurrency(calc.actifImmobilise)})</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t-2 pt-2 mt-2 border-green-300">
                  <span>FDR:</span>
                  <span className="text-green-800">{formatCurrency(calc.fdr)}</span>
                </div>
              </div>
            </div>

            {/* TN */}
            <div className="bg-purple-50 rounded-lg p-5">
              <div className="font-bold text-purple-900 text-lg mb-3">TRÉSORERIE NETTE</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>FDR:</span>
                  <span className="font-medium">{formatCurrency(calc.fdr)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- BFR:</span>
                  <span className="font-medium">({formatCurrency(calc.bfr)})</span>
                </div>
                <div className={`flex justify-between font-bold text-xl border-t-2 pt-2 mt-2 border-purple-300 ${calc.tresorerieNette >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                  <span>TN:</span>
                  <span>{formatCurrency(calc.tresorerieNette)}</span>
                </div>
                <div className={`text-center font-medium ${calc.tresorerieNette >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {calc.tresorerieNette >= 0 ? '✓ Trésorerie positive' : '✗ Trésorerie négative'}
                </div>
              </div>
            </div>
          </div>

          {/* Interprétation */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-2">Interprétation:</div>
            <div className="text-sm text-gray-700 space-y-1">
              {calc.tresorerieNette >= 0 ? (
                <p>✅ Le FDR couvre le BFR. L'entreprise dispose d'une trésorerie nette positive de {formatCurrency(calc.tresorerieNette)}.</p>
              ) : (
                <p>⚠️ Le FDR ne couvre pas entièrement le BFR. L'entreprise a un besoin de financement de {formatCurrency(Math.abs(calc.tresorerieNette))}.</p>
              )}
              <p>• BFR représente {formatPercent(calc.ratioBFR * 100)} du CA ({calc.bfrJours.toFixed(0)} jours)</p>
              <p>• TN représente {formatPercent(calc.ratioTN * 100)} du CA</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
