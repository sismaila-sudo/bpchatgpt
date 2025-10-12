import OpenAI from 'openai'

// Configuration OpenAI côté serveur uniquement
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface DocumentAnalysisResult {
  type: 'balance_sheet' | 'income_statement' | 'business_report' | 'financial_data' | 'other'
  extractedData: {
    revenue?: number
    profit?: number
    assets?: number
    liabilities?: number
    employees?: number
    year?: number
    currency?: string
    keyMetrics?: Record<string, any>
  }
  suggestedSections: {
    financial?: Partial<Record<string, unknown>>
    swot?: {
      strengths?: string[]
      weaknesses?: string[]
      opportunities?: string[]
      threats?: string[]
    }
    marketing?: Partial<Record<string, unknown>>
    hr?: Partial<Record<string, unknown>>
  }
  confidence: number
  summary: string
}

export interface BusinessPlanAssistantRequest {
  section: 'market-study' | 'swot' | 'marketing' | 'hr' | 'financial'
  sector: string
  currentData?: Record<string, unknown>
  context?: string
  prompt?: string
}

export interface BusinessPlanAssistantResponse {
  suggestions: string[]
  generatedContent?: Record<string, unknown>
  improvements?: string[]
  sectorialInsights?: string[]
}

export class OpenAIService {

  // Analyse de documents uploadés
  static async analyzeDocument(documentText: string, fileName: string): Promise<DocumentAnalysisResult> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es un expert comptable et analyste financier sénégalais. Analyse ce document et extrais les données financières importantes.

            Retourne une réponse JSON avec cette structure exacte:
            {
              "type": "balance_sheet|income_statement|business_report|financial_data|other",
              "extractedData": {
                "revenue": number (en FCFA si possible),
                "profit": number,
                "assets": number,
                "liabilities": number,
                "employees": number,
                "year": number,
                "currency": "FCFA|EUR|USD|other",
                "keyMetrics": {}
              },
              "suggestedSections": {
                "financial": {},
                "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
                "marketing": {},
                "hr": {}
              },
              "confidence": 0.0-1.0,
              "summary": "Résumé en français"
            }

            Focus sur le contexte sénégalais et africain.`
          },
          {
            role: "user",
            content: `Analyse ce document nommé "${fileName}":\n\n${documentText.slice(0, 8000)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse OpenAI')

      try {
        return JSON.parse(response) as DocumentAnalysisResult
      } catch (parseError) {
        // Si le JSON est malformé, on retourne une structure de base
        return {
          type: 'other',
          extractedData: {},
          suggestedSections: {},
          confidence: 0.1,
          summary: response.slice(0, 200) + '...'
        }
      }

    } catch (error) {
      console.error('Erreur analyse OpenAI:', error)
      throw new Error('Erreur lors de l\'analyse du document')
    }
  }

  // Assistant IA pour les sections business plan
  static async getBusinessPlanAssistance(request: BusinessPlanAssistantRequest): Promise<BusinessPlanAssistantResponse> {
    try {
      const sectorContext = this.getSectorContext(request.sector)

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es un consultant business expert du marché sénégalais et africain. Tu aides à créer des business plans de qualité.

            Secteur: ${request.sector}
            Context sectoriel: ${sectorContext}

            Réponds TOUJOURS en JSON avec cette structure:
            {
              "suggestions": ["suggestion 1", "suggestion 2", ...],
              "generatedContent": {}, // Contenu généré pour la section
              "improvements": ["amélioration 1", ...],
              "sectorialInsights": ["insight sectoriel 1", ...]
            }

            Utilise des données réalistes du marché sénégalais, mentionne les institutions locales (FONGIP, FAISE, ADEPME), et adapte au contexte économique local.`
          },
          {
            role: "user",
            content: this.buildPromptForSection(request)
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse OpenAI')

      try {
        return JSON.parse(response) as BusinessPlanAssistantResponse
      } catch (parseError) {
        return {
          suggestions: [response.slice(0, 100) + '...'],
          improvements: [],
          sectorialInsights: []
        }
      }

    } catch (error) {
      console.error('Erreur assistant OpenAI:', error)
      throw new Error('Erreur lors de la génération de suggestions')
    }
  }

  // Génération de contenu spécifique pour une section
  static async generateSectionContent(section: string, sector: string, briefing: string): Promise<Record<string, unknown>> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en business plan pour le marché sénégalais. Génère du contenu professionnel pour la section "${section}" du secteur "${sector}".

            Utilise des données réelles du Sénégal, des exemples concrets, et mentionne les programmes de financement locaux quand pertinents.

            Retourne du JSON structuré selon la section demandée.`
          },
          {
            role: "user",
            content: briefing
          }
        ],
        max_tokens: 1200,
        temperature: 0.6
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse OpenAI')

      try {
        return JSON.parse(response)
      } catch {
        return { content: response }
      }

    } catch (error) {
      console.error('Erreur génération OpenAI:', error)
      throw new Error('Erreur lors de la génération de contenu')
    }
  }

  // Contexte sectoriel sénégalais
  private static getSectorContext(sector: string): string {
    const contexts: Record<string, string> = {
      agriculture: "Secteur clé au Sénégal (60% population active), soutenu par PRACAS, irrigation, chaînes de valeur riz/arachide",
      elevage: "Forte tradition pastorale, programmes PAPEL/PRAPS, défis transhumance et commercialisation",
      technologies: "Hub numérique DER/Sénégal Digital 2025, incubateurs comme Jokkolabs, croissance fintech",
      commerce_detail: "Secteur informel important, digitalisation progressive, impact e-commerce croissant",
      services_financiers: "Bancarisation 45%, mobile money (Orange Money/Wave), microfinance développée",
      industrie_alimentaire: "Transformation locale encouragée, import-substitution, normes UEMOA",
      default: "Secteur en développement avec potentiel sur le marché sénégalais et sous-régional"
    }

    return contexts[sector] || contexts.default
  }

  // Méthode générique pour génération de contenu
  static async generateCompletion(systemPrompt: string, userPrompt: string, maxTokens: number = 1000): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse OpenAI')

      return response
    } catch (error) {
      console.error('Erreur génération OpenAI:', error)
      throw new Error('Erreur lors de la génération de contenu')
    }
  }

  // Construction du prompt selon la section
  private static buildPromptForSection(request: BusinessPlanAssistantRequest): string {
    const basePrompt = `Section: ${request.section}\nSecteur: ${request.sector}\n`

    if (request.currentData) {
      return basePrompt + `Données actuelles: ${JSON.stringify(request.currentData)}\n\nAméliore et complète ces données.`
    }

    if (request.prompt) {
      return basePrompt + `Demande spécifique: ${request.prompt}`
    }

    const sectionPrompts: Record<string, string> = {
      'market-study': 'Génère une étude de marché complète avec taille, concurrence, segments et tendances.',
      'swot': 'Crée une analyse SWOT détaillée adaptée au secteur et au marché sénégalais.',
      'marketing': 'Propose une stratégie marketing mix complète avec canaux adaptés au Sénégal.',
      'hr': 'Développe un plan RH avec organigramme, recrutement et formation.',
      'financial': 'Crée des projections financières réalistes avec hypothèses sectorielles.'
    }

    return basePrompt + (sectionPrompts[request.section] || 'Génère du contenu pertinent pour cette section.')
  }
}