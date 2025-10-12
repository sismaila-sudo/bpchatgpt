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

interface AIAssistantProps {
  project: Project
  currentSection?: string
  isOpen: boolean
  onClose: () => void
  onContentGenerated?: (content: string, section: string) => void
  userId?: string // Pour activer la cohérence inter-sections
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestions?: string[]
  confidence?: number
  sectionId?: string // Pour tracer quelle section génère le contenu
  isUsed?: boolean // Pour savoir si le contenu a déjà été utilisé
}

const QUICK_ACTIONS = [
  {
    id: 'executive_summary',
    label: 'Résumé exécutif',
    icon: DocumentTextIcon,
    prompt: 'Génère un résumé exécutif professionnel pour mon business plan',
    color: 'bg-blue-600'
  },
  {
    id: 'market_study',
    label: 'Étude de marché',
    icon: ChartBarIcon,
    prompt: 'Aide-moi à analyser mon marché cible au Sénégal',
    color: 'bg-green-600'
  },
  {
    id: 'swot',
    label: 'Analyse SWOT',
    icon: ShieldCheckIcon,
    prompt: 'Crée une analyse SWOT adaptée à mon projet',
    color: 'bg-purple-600'
  },
  {
    id: 'marketing_strategy',
    label: 'Stratégie marketing',
    icon: MegaphoneIcon,
    prompt: 'Développe une stratégie marketing pour le marché sénégalais',
    color: 'bg-orange-600'
  }
]

export default function BusinessPlanAIAssistant({
  project,
  currentSection,
  isOpen,
  onClose,
  onContentGenerated,
  userId
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message d'accueil
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Bonjour ! Je suis votre assistant IA spécialisé dans les business plans sénégalais.

Je peux vous aider à :
• Rédiger des sections complètes de votre business plan
• Analyser votre marché et la concurrence
• Créer des stratégies adaptées au contexte sénégalais
• Optimiser vos projections financières
• Identifier des opportunités de financement

**Projet actuel :** ${project.basicInfo.name}
**Secteur :** ${project.basicInfo.sector}
**Localisation :** ${project.basicInfo.location.city}, ${project.basicInfo.location.region}

Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date(),
        suggestions: [
          "Aide-moi à rédiger mon résumé exécutif",
          "Analyse le marché de mon secteur",
          "Crée une stratégie marketing adaptée",
          "Quels sont les défis de mon secteur ?"
        ]
      }

      setMessages([welcomeMessage])
    }
  }, [isOpen, project])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      // Appel à l'assistant IA
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
    setIsGenerating(true)

    // Log pour debug : afficher le prompt avant l'appel API
    console.log('[QuickAction] Action déclenchée:', {
      actionId: action.id,
      actionLabel: action.label,
      actionPrompt: action.prompt
    })

    try {
      // Génération de contenu spécialisé
      console.log('[QuickAction] Appel generateSectionContent avec:', {
        section: action.id,
        projectName: project.basicInfo?.name || 'N/A'
      })

      const response = await BusinessPlanAI.generateSectionContent(
        { project, section: action.id },
        action.id as any,
        userId // Passer userId pour activer cohérence inter-sections
      )

      console.log('[QuickAction] Réponse IA reçue:', {
        contentLength: response.content?.length || 0,
        hasSuggestions: response.suggestions?.length > 0,
        confidence: response.confidence
      })

      // Message système pour l'action
      const actionMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `🚀 Génération de ${action.label} en cours...`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, actionMessage])

      // Ajouter la réponse
      const contentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence,
        sectionId: action.id, // Stocker la section pour le bouton
        isUsed: false
      }

      setMessages(prev => [...prev, contentMessage])

      // ✅ Ne plus appeler automatiquement - l'utilisateur choisit via le bouton

    } catch (error) {
      console.error('Erreur action rapide:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Erreur lors de la génération de ${action.label}. Veuillez réessayer.`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setActiveAction(null)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
    inputRef.current?.focus()
  }

  const handleUseContent = (content: string, messageId: string, sectionId?: string) => {
    if (!onContentGenerated) {
      console.warn('[AI Assistant] onContentGenerated non fourni')
      return
    }

    console.log('[AI Assistant] Utilisation du contenu demandée:', {
      messageId,
      sectionId,
      contentLength: content?.length || 0
    })

    // Déterminer la section (soit explicite, soit depuis currentSection)
    const targetSection = sectionId || currentSection || 'general'

    // Appeler le handler du parent
    onContentGenerated(content, targetSection)

    // Feedback visuel : marquer le message comme utilisé
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          isUsed: true
        }
      }
      return msg
    }))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Assistant IA Business Plan</h2>
              <p className="text-blue-100 text-sm">Spécialisé marché sénégalais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Actions rapides */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Actions rapides :</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={isGenerating}
                  className={`${action.color} text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all flex items-center disabled:opacity-50 ${
                    activeAction === action.id ? 'animate-pulse' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                  {activeAction === action.id && (
                    <div className="ml-2 animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  )}
                </button>
              )
            })}
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
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Métadonnées */}
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{formatTime(message.timestamp)}</span>
                  {message.confidence && (
                    <div className="flex items-center">
                      {message.confidence > 0.8 ? (
                        <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" />
                      ) : message.confidence > 0.6 ? (
                        <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500 mr-1" />
                      ) : (
                        <ClockIcon className="h-3 w-3 text-gray-500 mr-1" />
                      )}
                      <span>Confiance: {Math.round(message.confidence * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Bouton "Utiliser ce contenu" pour messages assistant avec sectionId */}
                {message.type === 'assistant' && message.sectionId && onContentGenerated && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleUseContent(message.content, message.id, message.sectionId)}
                      disabled={message.isUsed}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
                        message.isUsed
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                      }`}
                    >
                      {message.isUsed ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Contenu déjà utilisé
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          ✅ Utiliser ce contenu
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium mb-2 flex items-center">
                      <LightBulbIcon className="h-3 w-3 mr-1" />
                      Suggestions :
                    </p>
                    <div className="space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-white bg-opacity-50 hover:bg-opacity-80 px-2 py-1 rounded border transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3 max-w-[80%]">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span>L'assistant réfléchit...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Posez votre question sur votre business plan..."
              disabled={isGenerating}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Assistant IA spécialisé dans l'écosystème entrepreneurial sénégalais
          </div>
        </div>
      </div>
    </div>
  )
}