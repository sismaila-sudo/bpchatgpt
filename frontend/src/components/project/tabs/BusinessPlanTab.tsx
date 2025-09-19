'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Wand2,
  Save,
  Check,
  Download,
  Eye,
  Edit3,
  RefreshCw,
  BookOpen,
  Users,
  TrendingUp,
  Shield,
  Target
} from 'lucide-react'
import { aiTextGenerationService, BusinessPlanSection } from '@/services/aiTextGeneration'
import { geminiAIService } from '@/services/geminiAI'
import { pdfExportService, PDFExportService } from '@/services/pdfExport'
import { DocumentView } from '../DocumentView'
import { CustomPromptDialog } from '../CustomPromptDialog'

interface BusinessPlanTabProps {
  project: any
}

export function BusinessPlanTab({ project }: BusinessPlanTabProps) {
  const [sections, setSections] = useState<BusinessPlanSection[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [exportingPDF, setExportingPDF] = useState(false)
  const [useAI, setUseAI] = useState(false)
  const [aiStatus, setAiStatus] = useState('')
  const [showDocumentView, setShowDocumentView] = useState(false)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)

  const sectionIcons = {
    resume: FileText,
    presentation: BookOpen,
    marche: Target,
    strategie: TrendingUp,
    organisation: Users,
    risques: Shield,
    conclusion: FileText,
    // Nouvelles sections du système de templates
    'executive-summary': FileText,
    'project-description': BookOpen,
    'market-analysis': Target,
    'products-services': TrendingUp,
    'marketing-strategy': TrendingUp,
    'operational-plan': Users,
    'management-team': Users,
    'financial-projections': TrendingUp,
    'funding-request': Target,
    'risk-analysis': Shield,
    'company-presentation': BookOpen,
    'historical-analysis': FileText,
    'expansion-project': Target,
    'competitive-advantage': TrendingUp,
    'operational-improvements': Users,
    'banking-relationships': Users,
    'agricultural-project': Target,
    'land-resources': Target,
    'production-plan': Users,
    'technical-specifications': FileText,
    'supply-chain': Users,
    'environmental-impact': Shield,
    'historical-financial-analysis': TrendingUp,
    'sector-analysis': Target,
    'swot-analysis': Target,
    'technical-study': FileText,
    'funding-requirements': Target,
    'sensitivity-analysis': TrendingUp,
    'risk-mitigation': Shield,
    'impact-study': FileText,
    'problem-solution': Target,
    'product-description': TrendingUp,
    'business-model': Users,
    'technology-platform': FileText,
    'go-to-market': TrendingUp,
    'team-advisors': Users,
    'funding-strategy': Target,
    'scaling-plan': TrendingUp
  }

  const sectionColors = {
    resume: 'bg-blue-50 border-blue-200',
    presentation: 'bg-green-50 border-green-200',
    marche: 'bg-purple-50 border-purple-200',
    strategie: 'bg-orange-50 border-orange-200',
    organisation: 'bg-indigo-50 border-indigo-200',
    risques: 'bg-red-50 border-red-200',
    conclusion: 'bg-gray-50 border-gray-200',
    // Nouvelles sections du système de templates - utiliser une couleur par défaut
    'executive-summary': 'bg-blue-50 border-blue-200',
    'project-description': 'bg-green-50 border-green-200',
    'market-analysis': 'bg-purple-50 border-purple-200',
    'products-services': 'bg-orange-50 border-orange-200',
    'marketing-strategy': 'bg-indigo-50 border-indigo-200',
    'operational-plan': 'bg-yellow-50 border-yellow-200',
    'management-team': 'bg-pink-50 border-pink-200',
    'financial-projections': 'bg-emerald-50 border-emerald-200',
    'funding-request': 'bg-cyan-50 border-cyan-200',
    'risk-analysis': 'bg-red-50 border-red-200',
    'company-presentation': 'bg-green-50 border-green-200',
    'historical-analysis': 'bg-slate-50 border-slate-200',
    'expansion-project': 'bg-violet-50 border-violet-200',
    'competitive-advantage': 'bg-amber-50 border-amber-200',
    'operational-improvements': 'bg-lime-50 border-lime-200',
    'banking-relationships': 'bg-teal-50 border-teal-200',
    'agricultural-project': 'bg-green-50 border-green-200',
    'land-resources': 'bg-emerald-50 border-emerald-200',
    'production-plan': 'bg-yellow-50 border-yellow-200',
    'technical-specifications': 'bg-blue-50 border-blue-200',
    'supply-chain': 'bg-purple-50 border-purple-200',
    'environmental-impact': 'bg-green-50 border-green-200',
    'historical-financial-analysis': 'bg-emerald-50 border-emerald-200',
    'sector-analysis': 'bg-purple-50 border-purple-200',
    'swot-analysis': 'bg-orange-50 border-orange-200',
    'technical-study': 'bg-blue-50 border-blue-200',
    'funding-requirements': 'bg-cyan-50 border-cyan-200',
    'sensitivity-analysis': 'bg-emerald-50 border-emerald-200',
    'risk-mitigation': 'bg-red-50 border-red-200',
    'impact-study': 'bg-slate-50 border-slate-200',
    'problem-solution': 'bg-violet-50 border-violet-200',
    'product-description': 'bg-orange-50 border-orange-200',
    'business-model': 'bg-indigo-50 border-indigo-200',
    'technology-platform': 'bg-blue-50 border-blue-200',
    'go-to-market': 'bg-amber-50 border-amber-200',
    'team-advisors': 'bg-pink-50 border-pink-200',
    'funding-strategy': 'bg-cyan-50 border-cyan-200',
    'scaling-plan': 'bg-violet-50 border-violet-200'
  }

  useEffect(() => {
    loadSections()
  }, [project.id])

  const loadSections = async () => {
    try {
      const sectionsData = await aiTextGenerationService.getProjectSections(project.id)
      setSections(sectionsData)
    } catch (error) {
      console.error('Erreur chargement sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAllSections = async () => {
    setGenerating(true)
    setAiStatus('')
    try {
      let result

      if (useAI) {
        setAiStatus('🤖 Génération avec IA Gemini...')
        // Test de connexion d'abord
        const testResult = await geminiAIService.testConnection()
        setAiStatus(testResult.message)

        if (testResult.success) {
          result = await geminiAIService.generateAllSectionsWithAI(project.id)
        } else {
          setAiStatus('⚠️ Fallback vers templates')
          result = await aiTextGenerationService.generateBusinessPlanSections(project.id)
        }
      } else {
        setAiStatus('📝 Génération avec templates')
        result = await aiTextGenerationService.generateBusinessPlanSections(project.id)
      }

      if (result.success && result.sections) {
        setSections(result.sections)
        const method = useAI ? 'IA Gemini' : 'templates'
        alert(`✅ Toutes les sections ont été générées avec ${method} !`)
        setAiStatus('')
      } else {
        alert(result.error || 'Erreur lors de la génération')
      }
    } catch (error) {
      console.error('Erreur génération:', error)
      alert('Erreur lors de la génération des sections')
      setAiStatus('❌ Erreur de génération')
    } finally {
      setGenerating(false)
    }
  }

  const startEditing = (section: BusinessPlanSection) => {
    setEditingSection(section.id)
    setEditContent(section.content)
  }

  const saveSection = async () => {
    if (!editingSection) return

    try {
      const success = await aiTextGenerationService.updateSection(
        editingSection,
        editContent,
        'validated'
      )

      if (success) {
        await loadSections()
        setEditingSection(null)
        setEditContent('')
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const cancelEditing = () => {
    setEditingSection(null)
    setEditContent('')
  }

  const getStatusBadge = (status: BusinessPlanSection['status']) => {
    const variants = {
      draft: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      final: 'bg-blue-100 text-blue-800'
    }

    const labels = {
      draft: 'Brouillon',
      validated: 'Validé',
      final: 'Final'
    }

    return (
      <Badge className={`${variants[status]} border-0`}>
        {labels[status]}
      </Badge>
    )
  }

  const regenerateSection = async (sectionType: BusinessPlanSection['section_type']) => {
    setGenerating(true)
    try {
      const metrics = await aiTextGenerationService.getProjectMetrics(project.id)
      if (metrics) {
        const newSection = await aiTextGenerationService.generateSection(
          project.id,
          sectionType,
          metrics
        )

        if (newSection) {
          await loadSections()
        }
      }
    } catch (error) {
      console.error('Erreur régénération:', error)
    } finally {
      setGenerating(false)
    }
  }

  const exportToPDF = async () => {
    setExportingPDF(true)
    try {
      const result = await pdfExportService.generateBusinessPlanPDF(project.id, {
        includeFinancials: true,
        includeCharts: true,
        includeAppendices: true,
        template: 'banque',
        language: 'fr'
      })

      if (result.success && result.blob) {
        const filename = `business-plan-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        PDFExportService.downloadPDF(result.blob, filename)
        alert('PDF exporté avec succès!')
      } else {
        alert(result.error || 'Erreur lors de l\'export PDF')
      }
    } catch (error) {
      console.error('Erreur export PDF:', error)
      alert('Erreur lors de l\'export PDF')
    } finally {
      setExportingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Afficher la vue document si demandée
  if (showDocumentView) {
    return <DocumentView project={project} onBack={() => setShowDocumentView(false)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Business Plan IA
          </h2>
          <p className="text-gray-600 mt-1">
            Sections générées automatiquement à partir de vos données financières
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Sélecteur IA/Template */}
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <label className="text-sm font-medium text-gray-700">Mode :</label>
            <select
              value={useAI ? 'ai' : 'template'}
              onChange={(e) => setUseAI(e.target.value === 'ai')}
              className="bg-white text-gray-900 border border-gray-300 text-sm rounded px-3 py-1 font-medium"
              disabled={generating}
            >
              <option value="template">📝 Templates</option>
              <option value="ai">🤖 IA Gemini</option>
            </select>
          </div>

          <Button
            onClick={generateAllSections}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            {sections.length > 0 ? 'Régénérer tout' : 'Générer le Business Plan'}
          </Button>

          <Button
            onClick={() => setShowCustomPrompt(true)}
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Prompt Personnalisé
          </Button>
        </div>
      </div>

      {/* Statut IA */}
      {aiStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">{aiStatus}</p>
        </div>
      )}

      {/* Statistiques */}
      {sections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Sections Générées</p>
                  <p className="text-2xl font-bold text-blue-900">{sections.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Sections Validées</p>
                  <p className="text-2xl font-bold text-green-900">
                    {sections.filter(s => s.status === 'validated' || s.status === 'final').length}
                  </p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Mots Total</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {sections.reduce((total, s) => total + (s.word_count || 0), 0).toLocaleString()}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sections du Business Plan */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wand2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune section générée
            </h3>
            <p className="text-gray-600 mb-6">
              Cliquez sur "Générer le Business Plan" pour créer automatiquement toutes les sections
              à partir de vos données financières.
            </p>
            <Button
              onClick={generateAllSections}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Générer le Business Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = sectionIcons[section.section_type] || FileText
            const isEditing = editingSection === section.id

            return (
              <Card
                key={section.id}
                className={`${sectionColors[section.section_type] || 'bg-gray-50 border-gray-200'} transition-all duration-200`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <span>{section.word_count || 0} mots</span>
                          <span>•</span>
                          <span>Mis à jour le {new Date(section.last_updated).toLocaleDateString('fr-FR')}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(section.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenerateSection(section.section_type)}
                        disabled={generating}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(section)}
                        disabled={isEditing}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Contenu de la section..."
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={cancelEditing}>
                          Annuler
                        </Button>
                        <Button onClick={saveSection} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <div
                        className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: section.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Actions globales */}
      {true && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Actions sur le Business Plan</h3>
                <p className="text-sm text-gray-600">
                  Exportez votre business plan complet ou validez les sections finales
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDocumentView(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vue Document
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportingPDF ? 'Export...' : 'Exporter PDF'}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // Marquer toutes les sections comme finales
                    sections.forEach(async (section) => {
                      await aiTextGenerationService.updateSection(section.id, section.content, 'final')
                    })
                    loadSections()
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Valider tout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogue Prompt Personnalisé */}
      {showCustomPrompt && (
        <CustomPromptDialog
          project={project}
          onClose={() => setShowCustomPrompt(false)}
          onSectionGenerated={() => {
            loadSections()
            setShowCustomPrompt(false)
          }}
        />
      )}
    </div>
  )
}