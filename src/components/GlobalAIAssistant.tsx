'use client'

import { useState, useRef, useEffect } from 'react'
import { Project } from '@/types/project'
import { BusinessPlanAI, AIResponse } from '@/services/businessPlanAI'
import {
  SparklesIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline'

interface GlobalAIAssistantProps {
  project: Project
  currentSection?: string
  isOpen: boolean
  onClose: () => void
  userId?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestions?: string[]
  confidence?: number
}

const QUICK_ACTIONS = [
  {
    id: 'improve_text',
    title: 'Améliorer un texte',
    description: 'Corriger et enrichir un texte du projet',
    icon: DocumentTextIcon,
    color: 'bg-blue-600'
  },
  {
    id: 'analyze_project',
    title: 'Analyser le projet',
    description: 'Évaluation complète du business plan',
    icon: ChartBarIcon,
    color: 'bg-green-600'
  },
  {
    id: 'suggest_improvements',
    title: 'Suggestions d\'amélioration',
    description: 'Propositions concrètes pour optimiser',
    icon: LightBulbIcon,
    color: 'bg-yellow-600'
  },
  {
    id: 'financial_advice',
    title: 'Conseils financiers',
    description: 'Optimisation des projections financières',
    icon: ChartBarIcon,
    color: 'bg-purple-600'
  },
  {
    id: 'market_insights',
    title: 'Insights marché',
    description: 'Analyse du marché sénégalais',
    icon: MegaphoneIcon,
    color: 'bg-indigo-600'
  },
  {
    id: 'risk_analysis',
    title: 'Analyse des risques',
    description: 'Identification et mitigation des risques',
    icon: ShieldCheckIcon,
    color: 'bg-orange-600'
  }
]

export default function GlobalAIAssistant({
  project,
  currentSection,
  isOpen,
  onClose,
  userId
}: GlobalAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'system',
        content: `Bonjour ! Je suis votre assistant IA pour le projet "${project.basicInfo.name}". Je peux vous aider à améliorer vos textes, analyser votre business plan, et vous donner des conseils personnalisés. Que souhaitez-vous améliorer aujourd'hui ?`,
        timestamp: new Date(),
        suggestions: [
          'Améliorez la description du projet',
          'Analysez la stratégie marketing',
          'Optimisez les projections financières',
          'Identifiez les risques potentiels'
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, project.basicInfo.name, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim()
    if (!messageText || isGenerating) return

    // Ajouter message utilisateur
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsGenerating(true)

    try {
      // Appel à l'assistant IA avec contexte du projet
      const response = await BusinessPlanAI.askBusinessPlanAssistant(messageText, {
        project,
        section: currentSection || 'general'
      })

      // Ajouter réponse assistant
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Erreur assistant IA:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "Désolé, je rencontre une difficulté technique. Pouvez-vous reformuler votre question ou essayer une action rapide ?",
        timestamp: new Date(),
        suggestions: [
          "Consultez les ressources APIX",
          "Contactez un expert local",
          "Utilisez les templates disponibles"
        ]
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setActiveAction(null)
    }
  }

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    setActiveAction(action.id)
    
    let prompt = ''
    switch (action.id) {
      case 'improve_text':
        prompt = 'Je souhaite améliorer un texte de mon projet. Pouvez-vous analyser le contenu et proposer des améliorations en termes de clarté, structure et impact ?'
        break
      case 'analyze_project':
        prompt = 'Analysez mon projet de manière globale et identifiez les points forts, les faiblesses et les opportunités d\'amélioration.'
        break
      case 'suggest_improvements':
        prompt = 'Proposez des améliorations concrètes pour optimiser mon business plan, en tenant compte du marché sénégalais.'
        break
      case 'financial_advice':
        prompt = 'Analysez mes projections financières et proposez des optimisations pour améliorer la rentabilité et la viabilité du projet.'
        break
      case 'market_insights':
        prompt = 'Donnez-moi des insights sur le marché sénégalais pour mon secteur d\'activité et des conseils pour mieux me positionner.'
        break
      case 'risk_analysis':
        prompt = 'Identifiez les risques potentiels de mon projet et proposez des stratégies de mitigation adaptées au contexte sénégalais.'
        break
    }

    await handleSendMessage(prompt)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assistant IA</h2>
              <p className="text-sm text-gray-600">Projet: {project.basicInfo.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Actions rapides */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions rapides</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={isGenerating}
                className={`p-3 rounded-lg text-left transition-all hover:scale-105 disabled:opacity-50 ${action.color} text-white`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <action.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.title}</span>
                </div>
                <p className="text-xs opacity-90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : message.type === 'system'
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs opacity-75 font-medium">Suggestions :</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-2 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Posez votre question ou demandez une amélioration..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isGenerating || !inputText.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
