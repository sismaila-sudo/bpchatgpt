'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
  Download,
  FileText,
  Building,
  BarChart3,
  CreditCard,
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  Briefcase
} from 'lucide-react'
import { FAISETemplate } from '../templates/FAISETemplate'

interface ExportTabProps {
  project: any
}

interface ProjectData {
  products: any[]
  salesProjections: any[]
  financialOutputs: any[]
  projectOwner: any
  businessPlanSections: any[]
  risks: any[]
  swotAnalysis: any[]
  technicalStudy: any[]
  socioEconomicImpact: any[]
}

const getBusinessPlanSections = (projectData: ProjectData) => [
  {
    id: 'contexte',
    title: 'Contexte & Justification',
    description: 'Présentation du contexte économique et justification du projet',
    icon: FileText,
    status: 'ready' // Toujours prêt car basé sur les infos de base du projet
  },
  {
    id: 'synoptique',
    title: 'Fiche Synoptique',
    description: 'Résumé exécutif du projet selon format FONGIP',
    icon: FileText,
    status: projectData.projectOwner && projectData.products.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'historique',
    title: 'Historique & Présentation',
    description: 'Historique de l\'entreprise et présentation détaillée',
    icon: Building,
    status: projectData.projectOwner ? 'ready' : 'conditional'
  },
  {
    id: 'analyse-financiere',
    title: 'Analyse Financière',
    description: 'Données historiques et prévisionnelles complètes',
    icon: BarChart3,
    status: projectData.financialOutputs.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'relations-bancaires',
    title: 'Relations Bancaires',
    description: 'Historique et partenaires bancaires',
    icon: CreditCard,
    status: 'conditional' // Toujours conditionnel car optionnel
  },
  {
    id: 'etude-secteur',
    title: 'Étude Secteur & SWOT',
    description: 'Analyse sectorielle et forces/faiblesses',
    icon: TrendingUp,
    status: projectData.swotAnalysis.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'etude-technique',
    title: 'Étude Technique',
    description: 'Aspects techniques et opérationnels',
    icon: Shield,
    status: projectData.technicalStudy.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'financement',
    title: 'Besoin de Financement',
    description: 'Plan de financement et garanties proposées',
    icon: CreditCard,
    status: projectData.financialOutputs.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'resultats-ratios',
    title: 'Résultats & Ratios',
    description: 'VAN, TRI, Payback, ratios de couverture',
    icon: BarChart3,
    status: projectData.financialOutputs.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'risques',
    title: 'Risques & Mesures d\'Atténuation',
    description: 'Identification des risques et stratégies de mitigation',
    icon: AlertTriangle,
    status: projectData.risks.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'impacts',
    title: 'Impacts Socio-Économiques',
    description: 'Retombées économiques et sociales du projet',
    icon: TrendingUp,
    status: projectData.socioEconomicImpact.length > 0 ? 'ready' : 'pending'
  },
  {
    id: 'conclusion',
    title: 'Conclusion & Avis',
    description: 'Synthèse finale et recommandations',
    icon: CheckCircle,
    status: 'ready' // Toujours prêt car générée automatiquement
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ready':
      return <Badge className="bg-green-100 text-green-800">Prêt</Badge>
    case 'conditional':
      return <Badge className="bg-yellow-100 text-yellow-800">Conditionnel</Badge>
    case 'pending':
      return <Badge className="bg-red-100 text-red-800">À compléter</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800">-</Badge>
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'conditional':
      return <Clock className="h-5 w-5 text-yellow-600" />
    case 'pending':
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    default:
      return <Clock className="h-5 w-5 text-gray-600" />
  }
}

export function ExportTab({ project }: ExportTabProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word'>('pdf')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [projectData, setProjectData] = useState<ProjectData>({
    products: [],
    salesProjections: [],
    financialOutputs: [],
    projectOwner: null,
    businessPlanSections: [],
    risks: [],
    swotAnalysis: [],
    technicalStudy: [],
    socioEconomicImpact: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProjectData()
  }, [project.id])

  async function loadProjectData() {
    try {
      setLoading(true)

      const [
        productsResult,
        salesResult,
        financialResult,
        ownerResult,
        businessPlanResult,
        risksResult,
        swotResult,
        technicalResult,
        socioEconomicResult
      ] = await Promise.all([
        supabase.from('products_services').select('*').eq('project_id', project.id),
        supabase.from('sales_projections').select('*').eq('project_id', project.id),
        supabase.from('financial_outputs').select('*').eq('project_id', project.id),
        supabase.from('project_owners').select('*').eq('project_id', project.id).single(),
        supabase.from('business_plan_sections').select('*').eq('project_id', project.id),
        supabase.from('project_risks').select('*').eq('project_id', project.id),
        supabase.from('swot_analysis').select('*').eq('project_id', project.id),
        supabase.from('technical_studies').select('*').eq('project_id', project.id),
        supabase.from('socio_economic_impacts').select('*').eq('project_id', project.id)
      ])

      setProjectData({
        products: productsResult.data || [],
        salesProjections: salesResult.data || [],
        financialOutputs: financialResult.data || [],
        projectOwner: ownerResult.data,
        businessPlanSections: businessPlanResult.data || [],
        risks: risksResult.data || [],
        swotAnalysis: swotResult.data || [],
        technicalStudy: technicalResult.data || [],
        socioEconomicImpact: socioEconomicResult.data || []
      })
    } catch (error) {
      console.error('Erreur chargement données projet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportBusinessPlan = async () => {
    setIsExporting(true)
    try {
      // Simulation de l'export - à remplacer par l'appel API réel
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Ici on appellerait l'API backend pour générer le business plan FONGIP
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/export/business-plan-fongip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: project.id,
          format: exportFormat,
          sections: getBusinessPlanSections(projectData).map(s => s.id)
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export')
      }

      // Télécharger le fichier généré
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Business_Plan_${project.name}_FONGIP.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Business Plan exporté avec succès!')
    } catch (error) {
      console.error('Erreur export:', error)
      alert('Erreur lors de l\'export du business plan')
    } finally {
      setIsExporting(false)
    }
  }

  const businessPlanSections = getBusinessPlanSections(projectData)
  const readySections = businessPlanSections.filter(s => s.status === 'ready').length
  const totalSections = businessPlanSections.length
  const completionRate = Math.round((readySections / totalSections) * 100)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Rendu conditionnel pour les templates
  if (selectedTemplate === 'faise') {
    return <FAISETemplate project={project} onBack={() => setSelectedTemplate(null)} />
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export Business Plan</h1>
        <p className="text-gray-600">
          Choisissez le format de business plan adapté à votre organisme de financement
        </p>
      </div>

      {/* Sélection du format de business plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Briefcase className="h-6 w-6 text-purple-600" />
            <span>Formats de Business Plan Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Format FONGIP (existant) */}
            <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Format FONGIP</h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Format standard pour FONGIP, ADEPME et organismes similaires. Orienté entrepreneuriat et PME.
                </p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleExportBusinessPlan}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Génération...' : 'Générer FONGIP'}
                </Button>
              </CardContent>
            </Card>

            {/* Format FAISE */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flag className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Format FAISE</h3>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Nouveau</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Spécialement conçu pour le Fonds d'Appui à l'Investissement des Sénégalais de l'Extérieur. Max 15M FCFA.
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setSelectedTemplate('faise')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Générer FAISE
                </Button>
              </CardContent>
            </Card>

            {/* Format Banque (à venir) */}
            <Card className="border-2 border-gray-200 hover:border-gray-400 transition-colors cursor-pointer opacity-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Format Banque</h3>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">Bientôt</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Format optimisé pour les demandes de crédit bancaire. Analyse financière approfondie.
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Prochainement
                </Button>
              </CardContent>
            </Card>

            {/* Format Sur Mesure (à venir) */}
            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors cursor-pointer opacity-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Sur Mesure</h3>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Bientôt</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Format personnalisable selon vos spécifications. Sections et contenu adaptés.
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Prochainement
                </Button>
              </CardContent>
            </Card>

          </div>
        </CardContent>
      </Card>

      {/* État de préparation */}
      <Card className="border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span>État de Préparation</span>
            </div>
            <Badge className={`text-lg px-4 py-2 ${completionRate >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {completionRate}% prêt
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  completionRate >= 70 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {readySections}/{totalSections} sections
            </span>
          </div>

          {completionRate >= 70 ? (
            <p className="text-green-700 text-sm">
              ✅ Votre business plan est prêt à être généré avec un niveau de complétude satisfaisant
            </p>
          ) : (
            <p className="text-yellow-700 text-sm">
              ⚠️ Complétez les sections manquantes pour un business plan optimal
            </p>
          )}
        </CardContent>
      </Card>

      {/* Options d'export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-purple-600" />
            <span>Options d'Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format de sortie
            </label>
            <div className="flex space-x-4">
              <Button
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setExportFormat('pdf')}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>PDF</span>
              </Button>
              <Button
                variant={exportFormat === 'word' ? 'default' : 'outline'}
                onClick={() => setExportFormat('word')}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Word</span>
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              onClick={handleExportBusinessPlan}
              disabled={isExporting}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-6 w-6 mr-3" />
              {isExporting ? 'Génération en cours...' : `Exporter Business Plan (${exportFormat.toUpperCase()})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Détail des sections */}
      <Card>
        <CardHeader>
          <CardTitle>Sections du Business Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {businessPlanSections.map((section, index) => {
              const Icon = section.icon
              return (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(section.status)}
                    {getStatusBadge(section.status)}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-800">Format Business Plan FONGIP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-indigo-700">
            <p><strong>✓ Structure conforme</strong> aux exigences FONGIP et ADEPME</p>
            <p><strong>✓ Ratios financiers</strong> automatiquement calculés (VAN, TRI, Payback)</p>
            <p><strong>✓ Analyse de risques</strong> intégrée selon standards bancaires</p>
            <p><strong>✓ Plan de financement</strong> détaillé avec garanties</p>
            <p><strong>✓ Projections financières</strong> sur {project.horizon_years} ans</p>
            <p><strong>✓ Fiche synoptique</strong> conforme aux modèles bancaires sénégalais</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}