'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import { analysisService } from '@/services/analysisService'
import { AnalysisExportService } from '@/services/analysisExportService'
import { ProjectAnalysis } from '@/types/analysis'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import DecisionBadge from '@/components/analysis/DecisionBadge'
import MetricCard from '@/components/analysis/MetricCard'
import SourcesEmploisTable from '@/components/analysis/SourcesEmploisTable'
import RiskCard from '@/components/analysis/RiskCard'

export default function AnalysisDetailPage() {
  const { user, userProfile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && analysisId) {
      loadAnalysis()
    }
  }, [user, analysisId])

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const data = await analysisService.getAnalysis(analysisId)

      if (!data) {
        setError('Analyse introuvable')
        return
      }

      // Vérifier que l'analyse appartient à l'utilisateur
      if (data.userId !== user?.uid && userProfile?.role !== UserRole.ADMIN) {
        setError('Accès non autorisé')
        return
      }

      setAnalysis(data)
    } catch (err) {
      console.error('Erreur chargement analyse:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numValue)) return 'N/A'
    return `${numValue.toFixed(1)}%`
  }

  const formatNumber = (value: number | string | undefined | null, decimals: number = 1, suffix: string = '') => {
    if (value === undefined || value === null) return 'N/A'
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numValue)) return 'N/A'
    return `${numValue.toFixed(decimals)}${suffix}`
  }

  const handleExportPDF = () => {
    if (!analysis) {
      toast.error('Aucune analyse à exporter')
      return
    }

    try {
      toast.loading('Génération du PDF en cours...', { id: 'pdf-export' })

      // Générer le PDF avec le service
      AnalysisExportService.generateCreditNotePDF(analysis)

      toast.success('PDF téléchargé avec succès !', { id: 'pdf-export' })
    } catch (error) {
      console.error('Erreur export PDF:', error)
      toast.error('Erreur lors de la génération du PDF', { id: 'pdf-export' })
    }
  }

  // Vérifier les permissions
  if (userProfile && userProfile.role !== UserRole.ADMIN && userProfile.role !== UserRole.FINANCIAL_ANALYST) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h1>
          <p className="text-slate-600 mb-6">Vous n'avez pas les permissions pour accéder à cette fonctionnalité.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement de l'analyse...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{error || 'Analyse introuvable'}</h1>
          <Link
            href="/analysis"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour aux analyses
          </Link>
        </div>
      </div>
    )
  }

  const aiAnalysis = analysis.aiAnalysis

  if (!aiAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Analyse en cours</h1>
          <p className="text-slate-600 mb-6">L'analyse IA n'est pas encore terminée</p>
          <Link
            href="/analysis"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour aux analyses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/analysis"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{analysis.projectName}</h1>
                <p className="text-slate-600 mt-1">Note de crédit - Analyse bancaire</p>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Section 1: Résumé & Décision */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Résumé & Avis</h2>
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <span className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Créé le {analysis.createdAt.toLocaleDateString('fr-FR')}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{analysis.uploadedDocuments.length} document(s)</span>
                </span>
              </div>
            </div>
            <DecisionBadge decision={aiAnalysis.decision} size="lg" />
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Avis Global</h3>
            <div className="space-y-3">
              {aiAnalysis.reasons && aiAnalysis.reasons.length > 0 ? (
                aiAnalysis.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 italic">Aucune raison fournie dans l'analyse.</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Métriques clés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {aiAnalysis.tri !== undefined && (
            <MetricCard
              label="TRI (Taux de Rentabilité Interne)"
              value={formatPercent(aiAnalysis.tri)}
              gradient="from-emerald-500 to-teal-600"
            />
          )}
          {aiAnalysis.van !== undefined && (
            <MetricCard
              label="VAN (Valeur Actuelle Nette)"
              value={formatCurrency(aiAnalysis.van)}
              gradient="from-blue-500 to-cyan-600"
            />
          )}
          {aiAnalysis.payback && (
            <MetricCard
              label="Payback (Délai de récupération)"
              value={aiAnalysis.payback}
              gradient="from-purple-500 to-pink-600"
            />
          )}
        </div>

        {/* Section 3: Sources & Emplois */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Objet du Financement - Sources & Emplois</h2>
          <SourcesEmploisTable data={aiAnalysis.sourcesEmplois} />
        </div>

        {/* Section 4: Facilités demandées */}
        {aiAnalysis.requestedFacilities && aiAnalysis.requestedFacilities.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Facilités de crédit demandées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiAnalysis.requestedFacilities.map((facility, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="font-bold text-slate-900 mb-3">{facility.type}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Montant:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(facility.montant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Taux:</span>
                      <span className="font-semibold text-slate-900">{facility.taux}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Durée:</span>
                      <span className="font-semibold text-slate-900">{facility.tenor} mois</span>
                    </div>
                    {facility.differe && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Différé:</span>
                        <span className="font-semibold text-slate-900">{facility.differe} mois</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Ratios financiers */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Prévisions & Ratios de Dette</h2>

          {/* DSCR */}
          {aiAnalysis.ratios.dscr && Object.keys(aiAnalysis.ratios.dscr).length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-900 mb-4">DSCR (Debt Service Coverage Ratio)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(aiAnalysis.ratios.dscr).map(([year, value]) => (
                  <div key={year} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-sm text-slate-600 mb-1">{year}</div>
                    <div className="text-3xl font-bold text-blue-600">{formatNumber(value, 1, 'x')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Autres ratios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiAnalysis.ratios.autonomieFinanciere !== undefined && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="text-sm text-slate-600 mb-1">Autonomie Financière</div>
                <div className="text-2xl font-bold text-slate-900">{formatPercent(aiAnalysis.ratios.autonomieFinanciere)}</div>
              </div>
            )}
            {aiAnalysis.ratios.liquiditeGenerale !== undefined && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="text-sm text-slate-600 mb-1">Liquidité Générale</div>
                <div className="text-2xl font-bold text-slate-900">{formatNumber(aiAnalysis.ratios.liquiditeGenerale, 2)}</div>
              </div>
            )}
            {aiAnalysis.ratios.fondsRoulement !== undefined && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="text-sm text-slate-600 mb-1">Fonds de Roulement</div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(aiAnalysis.ratios.fondsRoulement)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Projections */}
        {aiAnalysis.projections && aiAnalysis.projections.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Projections Financières</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-4 py-3 text-left text-sm font-semibold rounded-tl-xl">Année</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">CA</th>
                    {aiAnalysis.projections[0].ebe !== undefined && (
                      <th className="px-4 py-3 text-right text-sm font-semibold">EBE</th>
                    )}
                    {aiAnalysis.projections[0].caf !== undefined && (
                      <th className="px-4 py-3 text-right text-sm font-semibold">CAF</th>
                    )}
                    {aiAnalysis.projections[0].dscr !== undefined && (
                      <th className="px-4 py-3 text-right text-sm font-semibold rounded-tr-xl">DSCR</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {aiAnalysis.projections.map((proj, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{proj.year}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(proj.ca)}</td>
                      {proj.ebe !== undefined && (
                        <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(proj.ebe)}</td>
                      )}
                      {proj.caf !== undefined && (
                        <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(proj.caf)}</td>
                      )}
                      {proj.dscr !== undefined && (
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">{formatNumber(proj.dscr, 1, 'x')}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 7: Risques & Mitigations */}
        {aiAnalysis.risks && aiAnalysis.risks.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Risques & Mitigations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiAnalysis.risks.map((risk, index) => (
                <RiskCard key={index} risk={risk} />
              ))}
            </div>
          </div>
        )}

        {/* Section 8: Conditions & Covenants */}
        {aiAnalysis.covenants && aiAnalysis.covenants.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Conditions & Covenants</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <ul className="space-y-3">
                {aiAnalysis.covenants.map((covenant, index) => (
                  <li key={index} className="flex items-start space-x-3 pb-3 border-b border-slate-200 last:border-0">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="text-slate-700 leading-relaxed">{covenant}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section 9: Note de crédit complète */}
        {aiAnalysis.noteDeCredit && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Note de Crédit Complète</h2>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {aiAnalysis.noteDeCredit}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}