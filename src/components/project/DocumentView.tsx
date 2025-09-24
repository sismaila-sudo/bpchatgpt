'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Download,
  Printer,
  Edit3,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  ArrowLeft
} from 'lucide-react'
import { aiTextGenerationService, BusinessPlanSection } from '@/services/aiTextGeneration'
import { createClient } from '@/lib/supabase/client'

interface DocumentViewProps {
  project: any
  onBack: () => void
}

interface ProjectOwner {
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
  products_count: number
  months_calculated: number
  break_even_month: number | null
  investment_total: number
  financing_need: number
}

export function DocumentView({ project, onBack }: DocumentViewProps) {
  const [sections, setSections] = useState<BusinessPlanSection[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [owner, setOwner] = useState<ProjectOwner | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDocumentData()
  }, [project.id])

  const loadDocumentData = async () => {
    try {
      // Charger les sections du business plan
      const sectionsData = await aiTextGenerationService.getProjectSections(project.id)
      setSections(sectionsData)

      // Charger les statistiques financières
      const metrics = await aiTextGenerationService.getProjectMetrics(project.id)
      if (metrics) {
        setStats({
          total_revenue: metrics.total_revenue,
          total_profit: metrics.total_profit,
          profit_margin: metrics.profit_margin,
          products_count: metrics.products_count,
          months_calculated: 36, // Mock data
          break_even_month: metrics.break_even_month,
          investment_total: metrics.investment_total,
          financing_need: metrics.financing_need
        })
      }

      // Charger les informations du porteur de projet
      const { data: ownerData } = await supabase
        .from('project_owners')
        .select('*')
        .eq('project_id', project.id)
        .single()

      if (ownerData) {
        setOwner(ownerData)
      }

    } catch (error) {
      console.error('Erreur chargement document:', error)
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

  const getSectionOrder = (sectionType: string) => {
    const order = {
      'resume': 1,
      'presentation': 2,
      'marche': 3,
      'strategie': 4,
      'organisation': 5,
      'risques': 6,
      'conclusion': 7
    }
    return order[sectionType] || 999
  }

  const sortedSections = sections.sort((a, b) =>
    getSectionOrder(a.section_type) - getSectionOrder(b.section_type)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header avec actions (masqué à l'impression) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Plan - {project.name}</h1>
            <p className="text-gray-600">Vue document complète</p>
          </div>
        </div>
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

      {/* Document principal */}
      <div className="bg-white shadow-lg print:shadow-none max-w-4xl mx-auto">

        {/* Page de couverture */}
        <div className="p-12 text-center border-b print:page-break-after-always">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">BUSINESS PLAN</h1>
              <h2 className="text-2xl text-blue-600 font-semibold">{project.name}</h2>
              <p className="text-lg text-gray-600 mt-2">{project.sector}</p>
            </div>

            <Separator className="my-8" />

            {/* Informations du porteur de projet */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Porteur de Projet</h3>
              <div className="space-y-2 text-gray-600">
                {owner ? (
                  <>
                    <div className="flex items-center justify-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{owner.first_name} {owner.last_name}</span>
                    </div>
                    {owner.title && (
                      <div className="flex items-center justify-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>{owner.title}</span>
                      </div>
                    )}
                    {owner.email && (
                      <div className="flex items-center justify-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{owner.email}</span>
                      </div>
                    )}
                    {owner.phone && (
                      <div className="flex items-center justify-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{owner.phone}</span>
                      </div>
                    )}
                    {owner.experience_years && (
                      <div className="flex items-center justify-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{owner.experience_years} ans d'expérience</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Porteur de Projet</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Entreprise / Projet</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Résumé financier */}
            {stats && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Résumé Financier</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Chiffre d'affaires prévisionnel</p>
                    <p className="text-blue-600 font-bold">{formatCurrency(stats.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Bénéfice net prévisionnel</p>
                    <p className="text-green-600 font-bold">{formatCurrency(stats.total_profit)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Marge nette</p>
                    <p className="font-bold">{stats.profit_margin.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Investissement total</p>
                    <p className="font-bold">{formatCurrency(stats.investment_total)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sommaire */}
        <div className="p-8 print:page-break-after-always">
          <h2 className="text-2xl font-bold mb-6">Sommaire</h2>
          <div className="space-y-2">
            {sortedSections.map((section, index) => (
              <div key={section.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{section.title}</span>
                </div>
                <span className="text-gray-500">Page {index + 3}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{sortedSections.length + 1}.</span>
                <span>Annexes Financières</span>
              </div>
              <span className="text-gray-500">Page {sortedSections.length + 3}</span>
            </div>
          </div>
        </div>

        {/* Sections du business plan */}
        {sortedSections.map((section, index) => (
          <div key={section.id} className="p-8 print:page-break-before-always">
            <div className="flex items-center justify-between mb-6 print:mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              <div className="flex items-center space-x-2 print:hidden">
                <Badge variant={section.status === 'final' ? 'default' : 'secondary'}>
                  {section.status === 'final' ? 'Final' : 'Brouillon'}
                </Badge>
                <Button size="sm" variant="outline">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <div
                dangerouslySetInnerHTML={{
                  __html: section.content
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/### (.*?)\n/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                    .replace(/## (.*?)\n/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                }}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 print:hidden">
              <div className="flex justify-between">
                <span>{section.word_count || 0} mots</span>
                <span>Mis à jour le {new Date(section.last_updated).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Annexes Financières */}
        {stats && (
          <div className="p-8 print:page-break-before-always">
            <h2 className="text-2xl font-bold mb-6">Annexes Financières</h2>

            <div className="space-y-8">
              {/* Tableau de synthèse */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Synthèse Financière</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Chiffre d'affaires total :</span>
                        <span className="font-bold text-blue-600">{formatCurrency(stats.total_revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Résultat net total :</span>
                        <span className="font-bold text-green-600">{formatCurrency(stats.total_profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Marge nette :</span>
                        <span className="font-bold">{stats.profit_margin.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Investissement total :</span>
                        <span className="font-bold">{formatCurrency(stats.investment_total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Besoin de financement :</span>
                        <span className="font-bold text-orange-600">{formatCurrency(stats.financing_need)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Nombre de produits :</span>
                        <span className="font-bold">{stats.products_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note sur les projections */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Les projections financières sont basées sur les données saisies dans l'application
                  et les calculs automatisés. Ces projections sont indicatives et peuvent évoluer selon les conditions de marché.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-center text-sm text-gray-500 print:hidden">
          <p>Document généré automatiquement par Business Plan Generator</p>
          <p>Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>
    </div>
  )
}