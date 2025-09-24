'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Settings, Sparkles, Save, RotateCcw } from 'lucide-react'

interface CustomAnalysisPromptProps {
  onPromptChange: (prompt: string) => void
  currentPrompt: string
}

export function CustomAnalysisPrompt({ onPromptChange, currentPrompt }: CustomAnalysisPromptProps) {
  const [prompt, setPrompt] = useState(currentPrompt)
  const [isOpen, setIsOpen] = useState(false)

  // Prompts prédéfinis
  const presetPrompts = [
    {
      name: "Audit Complet",
      description: "Analyse financière complète avec tous les aspects",
      prompt: `Tu es un EXPERT ANALYSTE FINANCIER de niveau international. Effectue une analyse complète et détaillée de l'entreprise avec :

1. IDENTIFICATION COMPLÈTE
2. ANALYSE FINANCIÈRE APPROFONDIE (3-5 ans)
3. DIAGNOSTIC BANCAIRE & CRÉDIT
4. ANALYSE DES RISQUES
5. PROJECTIONS & SCÉNARIOS
6. RECOMMANDATIONS STRATÉGIQUES
7. VALORISATION & INVESTISSEMENT

Retourne un JSON structuré avec toutes les métriques financières, ratios clés, projections et recommandations actionnables.`
    },
    {
      name: "Focus Croissance",
      description: "Analyse axée sur le potentiel de croissance",
      prompt: `En tant qu'expert en développement d'entreprise, analyse cette société sous l'angle de la CROISSANCE :

1. Potentiel d'expansion (géographique, produits, marchés)
2. Capacité de financement de la croissance
3. Scalabilité du modèle économique
4. Opportunités d'investissement
5. Stratégies de développement recommandées
6. Valorisation basée sur le potentiel de croissance

Focus sur les recommandations pour doubler l'activité en 3 ans.`
    },
    {
      name: "Due Diligence",
      description: "Analyse pour investissement ou rachat",
      prompt: `Réalise une DUE DILIGENCE financière complète pour un potentiel investissement :

1. Vérification de la continuité d'exploitation
2. Qualité des revenus et récurrence
3. Analyse des risques cachés
4. Évaluation des synergies potentielles
5. Red flags et points d'attention
6. Recommandation d'investissement (GO/NO GO)
7. Fourchette de valorisation justifiée

Sois critique et objectif - identifie tous les risques.`
    }
  ]

  const handleSave = () => {
    onPromptChange(prompt)
    setIsOpen(false)
  }

  const handleReset = () => {
    setPrompt(currentPrompt)
  }

  const usePreset = (presetPrompt: string) => {
    setPrompt(presetPrompt)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Personnaliser l'analyse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Personnaliser le Prompt d'Analyse IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prompts prédéfinis */}
          <div>
            <h3 className="text-sm font-medium mb-3">Prompts Prédéfinis</h3>
            <div className="grid gap-3">
              {presetPrompts.map((preset, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mb-1">{preset.name}</Badge>
                      <p className="text-sm text-gray-600">{preset.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => usePreset(preset.prompt)}
                    >
                      Utiliser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Éditeur de prompt personnalisé */}
          <div>
            <h3 className="text-sm font-medium mb-3">Prompt Personnalisé</h3>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Écrivez votre prompt d'analyse personnalisé..."
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Conseil : Soyez spécifique sur les aspects à analyser et le format de sortie souhaité
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Appliquer le prompt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}