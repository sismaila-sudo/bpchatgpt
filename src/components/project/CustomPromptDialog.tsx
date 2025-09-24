'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Wand2,
  Sparkles,
  FileText,
  Building,
  Target,
  Users,
  TrendingUp,
  Shield,
  Save,
  X
} from 'lucide-react'
import { geminiAIService } from '@/services/geminiAI'
import { aiTextGenerationService } from '@/services/aiTextGeneration'

interface CustomPromptDialogProps {
  project: any
  onClose: () => void
  onSectionGenerated: () => void
}

const sectionTypes = [
  { value: 'resume', label: 'Résumé Exécutif', icon: FileText },
  { value: 'presentation', label: 'Présentation du Projet', icon: Building },
  { value: 'marche', label: 'Analyse du Marché', icon: Target },
  { value: 'strategie', label: 'Stratégie Commerciale', icon: TrendingUp },
  { value: 'organisation', label: 'Organisation et Management', icon: Users },
  { value: 'risques', label: 'Analyse des Risques', icon: Shield },
  { value: 'conclusion', label: 'Conclusion et Financement', icon: FileText }
]

const promptTemplates = {
  startup: {
    name: "Startup Tech",
    prompt: "Génère un business plan pour une startup technologique innovante qui révolutionne [SECTEUR]. Mets l'accent sur l'innovation, la scalabilité et le potentiel de croissance exponentielle."
  },
  traditionnel: {
    name: "Entreprise Traditionnelle",
    prompt: "Rédige un business plan classique et professionnel pour une entreprise établie dans le secteur [SECTEUR]. Focus sur la stabilité, la rentabilité et l'expansion mesurée."
  },
  social: {
    name: "Entreprise Sociale",
    prompt: "Crée un business plan pour un projet à impact social dans le domaine [SECTEUR]. Équilibre entre mission sociale et viabilité économique."
  },
  ecommerce: {
    name: "E-commerce",
    prompt: "Développe un business plan pour une plateforme e-commerce spécialisée dans [SECTEUR]. Focus sur le digital, l'expérience client et les canaux de vente en ligne."
  },
  personnalise: {
    name: "Prompt Personnalisé",
    prompt: ""
  }
}

export function CustomPromptDialog({ project, onClose, onSectionGenerated }: CustomPromptDialogProps) {
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [templateType, setTemplateType] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [tone, setTone] = useState('professionnel')
  const [length, setLength] = useState('moyen')
  const [focus, setFocus] = useState('')
  const [generating, setGenerating] = useState(false)

  const generateWithCustomPrompt = async () => {
    if (!selectedSection) {
      alert('Veuillez sélectionner une section')
      return
    }

    setGenerating(true)
    try {
      // Récupérer les métriques du projet
      const metrics = await aiTextGenerationService.getProjectMetrics(project.id)
      if (!metrics) {
        alert('❌ Impossible de récupérer les données du projet.\n\n📋 Vérifiez que :\n• Les tables de base de données sont créées (voir INSTRUCTIONS_SUPABASE.md)\n• Le projet contient des données financières\n• L\'API backend fonctionne')
        return
      }

      // Construire le prompt personnalisé
      let finalPrompt = ''

      if (templateType === 'personnalise') {
        finalPrompt = customPrompt
      } else if (templateType && promptTemplates[templateType as keyof typeof promptTemplates]) {
        finalPrompt = promptTemplates[templateType as keyof typeof promptTemplates].prompt.replace('[SECTEUR]', project.sector)
      }

      // Ajouter le contexte du projet
      const contextPrompt = `
DONNÉES DU PROJET :
- Nom: ${project.name}
- Secteur: ${metrics.sector}
- CA prévisionnel: ${metrics.total_revenue.toLocaleString()} XOF
- Bénéfice net: ${metrics.total_profit.toLocaleString()} XOF
- Marge nette: ${metrics.profit_margin.toFixed(1)}%
- Investissement: ${metrics.investment_total.toLocaleString()} XOF
- Nombre de produits: ${metrics.products_count}
- Produit principal: ${metrics.main_product}

INSTRUCTIONS SPÉCIFIQUES :
- Section à générer: ${sectionTypes.find(s => s.value === selectedSection)?.label}
- Ton souhaité: ${tone}
- Longueur: ${length} (${length === 'court' ? '200-300 mots' : length === 'moyen' ? '400-600 mots' : '800-1200 mots'})
${focus ? `- Focus particulier: ${focus}` : ''}

PROMPT PERSONNALISÉ :
${finalPrompt}

CONTRAINTES :
- Rédige en français professionnel
- Utilise un format markdown avec des titres ### et **gras**
- Intègre naturellement les chiffres fournis
- Reste réaliste et crédible
- Adapte le contenu au secteur ${project.sector}
`

      // Générer avec Gemini AI
      const result = await geminiAIService.generateSectionWithCustomPrompt(
        project.id,
        selectedSection as any,
        metrics,
        contextPrompt
      )

      if (result) {
        alert('✅ Section générée avec succès avec votre prompt personnalisé !')
        onSectionGenerated()
        onClose()
      } else {
        alert('❌ Erreur lors de la génération\n\n🔧 Causes possibles :\n• Les tables business_plan_sections n\'existent pas\n• Problème de connexion avec Gemini AI\n• Erreur de sauvegarde en base\n\n📋 Voir INSTRUCTIONS_SUPABASE.md pour créer les tables')
      }

    } catch (error) {
      console.error('Erreur génération personnalisée:', error)
      alert('❌ Erreur technique lors de la génération\n\n🔧 Détails :\n• Vérifiez la console pour plus d\'informations\n• Assurez-vous que les tables DB sont créées\n• Redémarrez le serveur si nécessaire')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4 bg-white shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              Génération IA Personnalisée
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Sélection de la section */}
          <div>
            <Label>Section à générer</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Choisir une section..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {sectionTypes.map((section) => (
                  <SelectItem key={section.value} value={section.value}>
                    <div className="flex items-center">
                      <section.icon className="h-4 w-4 mr-2" />
                      {section.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates de prompts */}
          <div>
            <Label>Template de base (optionnel)</Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Choisir un template..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {Object.entries(promptTemplates).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templateType && templateType !== 'personnalise' && (
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                <strong>Aperçu :</strong> {promptTemplates[templateType as keyof typeof promptTemplates].prompt.replace('[SECTEUR]', project.sector)}
              </div>
            )}
          </div>

          {/* Prompt personnalisé */}
          <div>
            <Label>Votre prompt personnalisé</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Décrivez précisément ce que vous voulez dans cette section...

Exemples :
- 'Mets l'accent sur notre avantage concurrentiel unique...'
- 'Explique pourquoi notre timing de lancement est parfait...'
- 'Détaille notre stratégie de pénétration de marché...'
- 'Présente notre équipe comme experte du secteur...'"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Options de génération */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Ton</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="professionnel">Professionnel</SelectItem>
                  <SelectItem value="dynamique">Dynamique</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="accessible">Accessible</SelectItem>
                  <SelectItem value="innovant">Innovant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Longueur</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="court">Court (200-300 mots)</SelectItem>
                  <SelectItem value="moyen">Moyen (400-600 mots)</SelectItem>
                  <SelectItem value="long">Long (800-1200 mots)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Focus particulier</Label>
              <Input
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Ex: Innovation, ROI, Équipe..."
              />
            </div>
          </div>

          {/* Aperçu des données du projet */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">📊 Données automatiquement intégrées :</h4>
            <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
              <span>• Projet : {project.name}</span>
              <span>• Secteur : {project.sector}</span>
              <span>• CA prévu : Calculé automatiquement</span>
              <span>• Produits : Récupérés de votre catalogue</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={generateWithCustomPrompt}
              disabled={generating || !selectedSection}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer avec l'IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}