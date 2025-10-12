'use client'

import { useState } from 'react'
import { BusinessPlanAssistantRequest, BusinessPlanAssistantResponse } from '@/services/openaiService'
import { SparklesIcon, ChatBubbleLeftRightIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline'

import { Project } from '@/types/project'

interface AIAssistantProps {
  section: 'market-study' | 'swot' | 'marketing' | 'hr' | 'financial'
  sector: string
  project: Project
  currentData?: any
  onSuggestionApply?: (suggestion: any) => void
  className?: string
}

export default function AIAssistant({
  section,
  sector,
  project,
  currentData,
  onSuggestionApply,
  className = ''
}: AIAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<BusinessPlanAssistantResponse | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)

  const getSectionLabel = () => {
    const labels = {
      'market-study': 'Étude de Marché',
      'swot': 'Analyse SWOT',
      'marketing': 'Plan Marketing',
      'hr': 'Ressources Humaines',
      'financial': 'Plan Financier'
    }
    return labels[section] || section
  }

  const getQuickPrompts = () => {
    const prompts: Record<string, string[]> = {
      'market-study': [
        'Analyse la taille du marché pour ce secteur au Sénégal',
        'Identifie les principaux concurrents et leur positionnement',
        'Propose une segmentation client pertinente',
        'Identifie les tendances et opportunités du marché'
      ],
      'swot': [
        'Analyse les forces concurrentielles de ce secteur',
        'Identifie les principales menaces du marché sénégalais',
        'Propose des opportunités de développement',
        'Suggère des améliorations pour réduire les faiblesses'
      ],
      'marketing': [
        'Propose une stratégie marketing mix adaptée au Sénégal',
        'Recommande les meilleurs canaux de communication',
        'Suggère une stratégie de prix compétitive',
        'Élabore un plan de lancement produit'
      ],
      'hr': [
        'Propose un organigramme optimal pour cette entreprise',
        'Définis un plan de recrutement par phases',
        'Recommande une grille salariale sectorielle',
        'Élabore un plan de formation des employés'
      ],
      'financial': [
        'Génère des projections financières réalistes',
        'Calcule les ratios financiers clés',
        'Propose une stratégie de financement',
        'Analyse la rentabilité prévisionnelle'
      ]
    }

    return prompts[section] || []
  }

  const callAIAssistant = async (prompt?: string) => {
    setLoading(true)
    try {
      const question = prompt || customPrompt || 'Aide-moi à améliorer cette section'

      const request = {
        question,
        context: {
          project,
          section,
          senegalContext: {
            economy: {
              gdpGrowth: 0.048,
              inflation: 0.03,
              unemployment: 0.16,
              currency: 'FCFA'
            },
            regulations: {
              taxRate: 0.30,
              vatRate: 0.18,
              minimumWage: 209000
            }
          }
        }
      }

      const response = await fetch('/api/ai/business-plan-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la consultation de l\'assistant IA')
      }

      const aiResponse = await response.json()
      // Adapter la réponse pour l'interface existante
      setResponse({
        suggestions: aiResponse.suggestions || [],
        improvements: [],
        sectorialInsights: [],
        generatedContent: aiResponse.content
      })
      setCustomPrompt('')

    } catch (error) {
      console.error('Erreur assistant IA:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la consultation de l\'assistant IA')
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = (suggestion: string, index: number) => {
    onSuggestionApply?.({ type: 'suggestion', content: suggestion, index })
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <SparklesIcon className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Assistant IA - {getSectionLabel()}</h3>
      </div>

      {/* Prompts rapides */}
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600 font-medium">💡 Suggestions rapides :</p>
        <div className="grid grid-cols-1 gap-2">
          {getQuickPrompts().map((prompt, index) => (
            <button
              key={index}
              onClick={() => callAIAssistant(prompt)}
              disabled={loading}
              className="text-left text-sm p-2 bg-white rounded border hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt personnalisé */}
      <div className="space-y-2 mb-4">
        <button
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          <span>Question personnalisée</span>
        </button>

        {showCustomPrompt && (
          <div className="space-y-2">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Posez votre question spécifique..."
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              onClick={() => callAIAssistant()}
              disabled={loading || !customPrompt.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Analyse en cours...' : 'Demander à l\'IA'}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin mx-auto h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-sm text-gray-600 mt-2">L'IA analyse votre demande...</p>
        </div>
      )}

      {/* Réponse de l'IA */}
      {response && !loading && (
        <div className="space-y-4">
          {/* Suggestions */}
          {response.suggestions && response.suggestions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💡 Suggestions :</h4>
              <div className="space-y-2">
                {response.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border">
                    <span className="text-sm flex-1">{suggestion}</span>
                    <button
                      onClick={() => applySuggestion(suggestion, index)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Appliquer cette suggestion"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Améliorations */}
          {response.improvements && response.improvements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔧 Améliorations :</h4>
              <div className="space-y-1">
                {response.improvements.map((improvement, index) => (
                  <div key={index} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                    {improvement}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights sectoriels */}
          {response.sectorialInsights && response.sectorialInsights.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🇸🇳 Contexte Sénégalais :</h4>
              <div className="space-y-1">
                {response.sectorialInsights.map((insight, index) => (
                  <div key={index} className="text-sm p-2 bg-green-50 rounded border border-green-200">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenu généré */}
          {response.generatedContent && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📝 Contenu généré :</h4>
              <div className="p-3 bg-gray-50 rounded border text-sm">
                <pre className="whitespace-pre-wrap font-sans">
                  {typeof response.generatedContent === 'string'
                    ? response.generatedContent
                    : JSON.stringify(response.generatedContent, null, 2)}
                </pre>
                {onSuggestionApply && (
                  <button
                    onClick={() => onSuggestionApply({ type: 'generated_content', content: response.generatedContent })}
                    className="mt-2 bg-blue-600 text-white py-1 px-3 rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Utiliser ce contenu
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}