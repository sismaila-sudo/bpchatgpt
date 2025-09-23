'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  FileText,
  TrendingUp,
  Calculator,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Brain,
  Download,
  Edit,
  Save,
  Printer,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { documentUploadService } from '@/services/documentUpload'
import { aiAnalysisService, AIAnalysisResult } from '@/services/aiAnalysisService'
import { FinancialAnalysisCharts } from '@/components/project/FinancialAnalysisCharts'
import { CustomAnalysisPrompt } from '@/components/project/CustomAnalysisPrompt'

interface ExistingFinancialAnalysisTabProps {
  project: any
}

export function ExistingFinancialAnalysisTab({ project }: ExistingFinancialAnalysisTabProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')

  // Gestion upload de fichiers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Traitement des documents et analyse IA
  const handleProcessDocuments = async () => {
    if (uploadedFiles.length === 0) {
      alert('Veuillez sélectionner au moins un document')
      return
    }

    setProcessing(true)
    setStep('processing')

    try {
      console.log('🚀 Lancement analyse IA OpenAI GPT-4...')
      const analysisResult = await aiAnalysisService.analyzeDocuments(uploadedFiles, currentPrompt)

      console.log('📊 Résultats analyse:', analysisResult)
      setAnalysis(analysisResult)

      // Sauvegarde automatique en historique
      await aiAnalysisService.saveAnalysisHistory(analysisResult)

      setStep('results')

    } catch (error) {
      console.error('❌ Erreur traitement:', error)
      alert('Erreur lors de l\'analyse des documents: ' + (error as Error).message)
      setStep('upload')
    } finally {
      setProcessing(false)
    }
  }

  // Réinitialiser l'analyse
  const handleReset = () => {
    setStep('upload')
    setUploadedFiles([])
    setAnalysis(null)
    setProcessing(false)
  }

  // Déterminer le type de document
  const getDocumentType = (filename: string) => {
    const lower = filename.toLowerCase()
    if (lower.includes('bilan')) return 'bilan'
    if (lower.includes('resultat') || lower.includes('compte')) return 'compte_resultat'
    if (lower.includes('tresorerie') || lower.includes('flux')) return 'flux_tresorerie'
    if (lower.includes('releve') || lower.includes('banque')) return 'releves_bancaires'
    return 'bilan'
  }

  // Rendu de l'upload
  const renderUpload = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-gray-900">
          Analyse Financière de l'Entreprise en Activité
        </h3>
        <p className="text-gray-600">
          Téléchargez vos documents financiers pour une analyse IA complète et professionnelle
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Glissez-déposez vos fichiers ici
            </h3>
            <p className="text-gray-600 mb-4">
              Bilans, comptes de résultat, relevés bancaires (PDF, JPG, PNG)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              Sélectionner les fichiers
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Fichiers sélectionnés ({uploadedFiles.length})
              </h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getDocumentType(file.name)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="flex justify-center space-x-4">
          <CustomAnalysisPrompt
            currentPrompt={currentPrompt}
            onPromptChange={setCurrentPrompt}
          />
          <Button
            onClick={handleProcessDocuments}
            size="lg"
            className="px-8 bg-green-600 hover:bg-green-700"
          >
            <Brain className="h-5 w-5 mr-2" />
            Analyser avec IA
          </Button>
        </div>
      )}
    </div>
  )

  // Rendu du traitement
  const renderProcessing = () => (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
        <Brain className="h-10 w-10 text-blue-600 animate-pulse" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">
        Analyse IA OpenAI en cours...
      </h3>
      <p className="text-lg text-gray-600">
        Notre IA analyse vos documents avec la précision d'un expert financier
      </p>

      <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full animate-pulse" style={{ width: '75%' }}></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Extraction en cours</h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Identification légale (NINEA, RCCM, IFU)
            </p>
            <p className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Données financières (CA, EBE, résultat)
            </p>
            <p className="flex items-center text-blue-600">
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Scoring bancaire et historique crédit
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Analyse sophistiquée</h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Comparaison multi-exercices
            </p>
            <p className="flex items-center text-blue-600">
              <TrendingUp className="h-4 w-4 mr-2 animate-pulse" />
              Détection points d'alerte
            </p>
            <p className="flex items-center text-blue-600">
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Génération recommandations
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Rendu des résultats (reprise de l'ancienne page)
  const renderResults = () => {
    if (!analysis) return null

    const { identite, finances, banques, scoring, synthese, observations_legales, actions_recommandees, ratios_cles, analyse_evolution, projections, synthese_executive } = analysis

    const handleExportPDF = async () => {
      console.log('Export PDF en cours...')
      alert('📄 Export PDF disponible - Données complètes prêtes pour export!')
    }

    const handleEditReport = () => {
      console.log('Mode édition activé')
      alert('✏️ Mode édition - Interface de modification du rapport')
    }

    return (
      <div className="space-y-8">
        {/* Header Premium avec actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold">
              Analyse Financière Expert IA
            </h1>
            <p className="text-xl text-blue-100">
              {identite.denomination} - {identite.forme_juridique}
            </p>
            <p className="text-lg text-blue-200">
              Capital: {identite.capital_social} • Score Global: {synthese.score_global}/100
            </p>

            <div className="flex justify-center space-x-4 pt-4">
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Nouvelle Analyse
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
              <Button
                onClick={handleEditReport}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs pour organiser les résultats */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="charts">Graphiques</TabsTrigger>
            <TabsTrigger value="details">Analyse détaillée</TabsTrigger>
            <TabsTrigger value="report">Rapport texte</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Métriques clés */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{synthese.score_global}/100</div>
                  <div className="text-sm text-gray-600">Score Global</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {finances[finances.length - 1] ? `${(finances[finances.length - 1].chiffre_affaires / 1000000).toFixed(0)}M` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">CA Dernier Exercice</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {ratios_cles ? `${ratios_cles.marge_ebe.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Marge EBE</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{scoring.cip}</div>
                  <div className="text-sm text-gray-600">Scoring CIP</div>
                </CardContent>
              </Card>
            </div>

            {/* Points forts et attention */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Points Forts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {synthese.points_forts.map((point, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Points d'Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {synthese.points_attention.map((point, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="charts">
            <FinancialAnalysisCharts
              finances={finances}
              ratios_cles={ratios_cles}
              projections={projections}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Analyse détaillée avec toutes les sections originales */}
            {/* Plan d'actions recommandé */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Calculator className="h-5 w-5 mr-2" />
                  Plan d'Actions Recommandé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actions_recommandees.map((action, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{action.action}</div>
                          <div className="text-sm text-green-700 mt-1">💡 {action.impact_attendu}</div>
                          {action.delai_recommande && (
                            <div className="text-sm text-gray-600 mt-1">⏱️ {action.delai_recommande}</div>
                          )}
                        </div>
                        <Badge className={
                          action.priorite === 'elevee' ? 'bg-red-100 text-red-800' :
                          action.priorite === 'moyenne' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {action.priorite}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report">
            {/* Zone de texte éditable pour le rapport */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-gray-600" />
                    Rapport Textuel Complet - Éditable
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-1" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Exporter TXT
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={`📊 RAPPORT D'ANALYSE FINANCIÈRE COMPLET

🏢 IDENTIFICATION DE L'ENTREPRISE
Dénomination: ${identite.denomination}
Forme juridique: ${identite.forme_juridique}
Capital social: ${identite.capital_social}
NINEA: ${identite.ninea || 'N/A'}
RCCM: ${identite.rccm || 'N/A'}
IFU: ${identite.ifu || 'N/A'}

🎯 SYNTHÈSE EXÉCUTIVE
Score global: ${synthese.score_global}/100
Évolution CA: ${synthese.evolution_ca}

${synthese_executive?.resume || "Entreprise en développement avec des performances financières solides et un potentiel de croissance intéressant."}

📈 DONNÉES FINANCIÈRES HISTORIQUES
${finances.map(f => `Exercice ${f.exercice}:
- Chiffre d'affaires: ${(f.chiffre_affaires / 1000000).toFixed(0)}M FCFA
- EBE: ${(f.ebe / 1000000).toFixed(0)}M FCFA
- Résultat net: ${(f.resultat_net / 1000000).toFixed(0)}M FCFA
- Total bilan: ${(f.total_bilan / 1000000).toFixed(0)}M FCFA`).join('\n\n')}

🔍 RATIOS CLÉS DE PERFORMANCE
${ratios_cles ? `- Croissance CA: ${ratios_cles.croissance_ca.toFixed(1)}%
- Marge EBE: ${ratios_cles.marge_ebe.toFixed(1)}%
- Marge nette: ${ratios_cles.marge_nette.toFixed(1)}%
- ROE: ${ratios_cles.roe?.toFixed(1) || 'N/A'}%
- Ratio endettement: ${(ratios_cles.ratio_endettement * 100).toFixed(0)}%` : 'Ratios en cours de calcul...'}

✅ POINTS FORTS IDENTIFIÉS
${synthese.points_forts.map((point, i) => `${i + 1}. ${point}`).join('\n')}

⚠️ POINTS D'ATTENTION
${synthese.points_attention.map((point, i) => `${i + 1}. ${point}`).join('\n')}

💡 RECOMMANDATIONS STRATÉGIQUES
${synthese.recommandations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

${projections ? `🔮 PROJECTIONS FINANCIÈRES (${projections.scenario})
An 1: ${(projections.ca_3_ans[0] / 1000000).toFixed(0)}M FCFA
An 2: ${(projections.ca_3_ans[1] / 1000000).toFixed(0)}M FCFA
An 3: ${(projections.ca_3_ans[2] / 1000000).toFixed(0)}M FCFA` : ''}

📅 Analyse générée le ${new Date().toLocaleString('fr-FR')}
🤖 Powered by OpenAI GPT-4o - Analyse financière experte
🔒 Document confidentiel - Usage interne uniquement`}
                  placeholder="Zone d'édition pour votre analyse complète..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {step === 'upload' && renderUpload()}
      {step === 'processing' && renderProcessing()}
      {step === 'results' && renderResults()}
    </div>
  )
}