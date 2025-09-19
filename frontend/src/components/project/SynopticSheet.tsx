'use client'

import { useState, useEffect } from 'react'
import '../../styles/synoptic-print.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SynopticSheetProps {
  project: any
  onBack: () => void
}

interface ProjectOwner {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  title?: string
  experience_years?: number
  motivation?: string
  vision?: string
}

interface ProjectStats {
  total_revenue: number
  total_profit: number
  profit_margin: number
  investment_total: number
  financing_need: number
  roi: number
  main_product: string
  products_count: number
  team_size: number
  target_market: string
}

export function SynopticSheet({ project, onBack }: SynopticSheetProps) {
  const [owner, setOwner] = useState<ProjectOwner | null>(null)
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProjectData()
  }, [project.id])

  const loadProjectData = async () => {
    try {
      // Charger les données du porteur
      const { data: ownerData } = await supabase
        .from('project_owners')
        .select('*')
        .eq('project_id', project.id)
        .single()

      if (ownerData) {
        setOwner(ownerData)
      }

      // Charger les statistiques financières
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calculations/status/${project.id}`)
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Erreur chargement données synoptique:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' XOF'
  }

  const formatPercentage = (value: number) => {
    return value.toFixed(1) + '%'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec actions */}
      <div className="bg-white shadow-sm border-b p-4 print-hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Fiche synoptique */}
      <div className="max-w-4xl mx-auto p-6 print-no-padding">
        <div className="bg-white shadow-lg print-no-shadow">

          {/* En-tête */}
          <div className="bg-slate-800 text-white p-4 print-header">
            <h1 className="text-2xl font-bold text-center">FICHE SYNOPTIQUE</h1>
          </div>

          {/* Présentation de l'entreprise */}
          <div className="border border-gray-300 synoptic-section">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h2 className="text-lg font-bold text-center">PRÉSENTATION DE L'ENTREPRISE</h2>
            </div>

            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 w-1/4 font-semibold bg-gray-50">Raison sociale</td>
                  <td className="p-3">{project.name}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Date de création</td>
                  <td className="p-3">{new Date(project.start_date).getFullYear()}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Forme juridique</td>
                  <td className="p-3">Société en cours de création</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Registre de commerce</td>
                  <td className="p-3">En cours d'obtention</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Identification fiscale</td>
                  <td className="p-3">En cours d'obtention</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Adresse :</td>
                  <td className="p-3">À définir selon localisation du projet</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Téléphone / Email</td>
                  <td className="p-3">
                    {owner?.phone && `${owner.phone} / `}
                    {owner?.email || 'À compléter'}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Président Fondateur</td>
                  <td className="p-3">
                    {owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'À compléter' : 'À compléter'}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Capital social</td>
                  <td className="p-3">
                    {stats?.investment_total ? formatCurrency(stats.investment_total) : 'À définir'}
                    <span className="ml-4 text-sm text-gray-600">100% National</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Secteur d'activité</td>
                  <td className="p-3">{project.sector}</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">Activités</td>
                  <td className="p-3">
                    {stats?.main_product || 'Production et commercialisation dans le secteur ' + project.sector}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Présentation du projet */}
          <div className="border border-gray-300 border-t-0">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h2 className="text-lg font-bold text-center">PRÉSENTATION DU PROJET</h2>
            </div>

            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 w-1/4 font-semibold bg-gray-50">
                    Objet du financement
                  </td>
                  <td className="p-3">
                    <div className="space-y-2">
                      <p>
                        Développement d'une activité dans le secteur {project.sector} avec un chiffre d'affaires prévisionnel de{' '}
                        <strong>{stats ? formatCurrency(stats.total_revenue) : 'À calculer'}</strong> sur {project.horizon_years} ans.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Investissement initial : {stats ? formatCurrency(stats.investment_total) : 'À définir'}</li>
                        <li>Chiffre d'affaires prévu : {stats ? formatCurrency(stats.total_revenue) : 'À calculer'}</li>
                        <li>Bénéfice net estimé : {stats ? formatCurrency(stats.total_profit) : 'À calculer'}</li>
                        <li>Marge nette : {stats ? formatPercentage(stats.profit_margin) : 'À calculer'}</li>
                        {stats?.roi && <li>ROI prévu : {formatPercentage(stats.roi)}</li>}
                      </ul>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">
                    Besoin total de financement
                  </td>
                  <td className="p-3">
                    <strong>{stats ? formatCurrency(stats.financing_need || stats.investment_total) : 'À définir'}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 p-3 font-semibold bg-gray-50">
                    Apport Personnel
                  </td>
                  <td className="p-3">
                    {stats ? formatCurrency((stats.investment_total - (stats.financing_need || 0))) : 'À définir'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conditions du financement */}
          <div className="border border-gray-300 border-t-0">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h2 className="text-lg font-bold text-center">CONDITIONS DU FINANCEMENT SOLLICITÉ</h2>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-sm font-semibold">Type de crédit</th>
                  <th className="border border-gray-300 p-2 text-sm font-semibold">CMT</th>
                  <th className="border border-gray-300 p-2 text-sm font-semibold">Avance sur factures</th>
                  <th className="border border-gray-300 p-2 text-sm font-semibold">Découvert</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 text-sm font-semibold bg-gray-50">Montant</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">
                    {stats ? formatCurrency(stats.financing_need * 0.7) : 'À définir'}
                  </td>
                  <td className="border border-gray-300 p-2 text-sm text-center">
                    {stats ? formatCurrency(stats.financing_need * 0.2) : 'À définir'}
                  </td>
                  <td className="border border-gray-300 p-2 text-sm text-center">
                    {stats ? formatCurrency(stats.financing_need * 0.1) : 'À définir'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-sm font-semibold bg-gray-50">Durée remboursement</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">60 mois</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">12 mois renouvelable</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">12 mois renouvelable</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-sm font-semibold bg-gray-50">Taux</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">9%</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">10%</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">10%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-sm font-semibold bg-gray-50">Échéance/validité</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">Trimestrielle</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">120 jours</td>
                  <td className="border border-gray-300 p-2 text-sm text-center">12 mois renouvelable</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Garanties */}
          <div className="border border-gray-300 border-t-0">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h2 className="text-lg font-bold text-center">GARANTIES</h2>
            </div>

            <div className="p-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <strong>Garantie financière FONGIP</strong> 60% des concours, soit{' '}
                  {stats ? formatCurrency((stats.financing_need || 0) * 0.6) : 'À calculer'}
                </li>
                <li>
                  <strong>Dépôt de garantie</strong> de{' '}
                  {stats ? formatCurrency((stats.financing_need || 0) * 0.1) : 'À calculer'}{' '}
                  de l'entreprise
                </li>
                <li>
                  <strong>Caution hypothécaire</strong> du porteur sur bien immobilier d'une valeur de{' '}
                  {stats ? formatCurrency((stats.financing_need || 0) * 1.5) : 'À évaluer'}
                </li>
                <li>
                  <strong>Domiciliation irrévocable</strong> des contrats et marchés
                </li>
                <li>
                  <strong>Assurance décès invalidité</strong> du porteur de projet
                </li>
              </ul>
            </div>
          </div>

          {/* Informations complémentaires sur le porteur */}
          {owner && (owner.motivation || owner.vision) && (
            <div className="border border-gray-300 border-t-0">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h2 className="text-lg font-bold text-center">PROFIL DU PORTEUR</h2>
              </div>

              <div className="p-4 space-y-3">
                {owner.title && (
                  <div>
                    <strong>Fonction :</strong> {owner.title}
                  </div>
                )}
                {owner.experience_years && (
                  <div>
                    <strong>Expérience :</strong> {owner.experience_years} ans dans le secteur
                  </div>
                )}
                {owner.motivation && (
                  <div>
                    <strong>Motivation :</strong> {owner.motivation}
                  </div>
                )}
                {owner.vision && (
                  <div>
                    <strong>Vision :</strong> {owner.vision}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer avec date */}
          <div className="border border-gray-300 border-t-0 bg-gray-50 p-3">
            <div className="text-center text-sm text-gray-600">
              Fiche synoptique générée le {new Date().toLocaleDateString('fr-FR')} - {project.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}