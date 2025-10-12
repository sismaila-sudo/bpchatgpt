/**
 * Service de recherche web avec Tavily AI
 * Fournit des informations à jour pour l'analyse IA
 */

import { tavily } from 'tavily'

// Types
export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
}

export interface WebSearchResponse {
  query: string
  results: SearchResult[]
  answer?: string // Réponse synthétique de Tavily
  sources: string[]
  timestamp: Date
}

class WebSearchService {
  private tavilyClient: any
  private isInitialized: boolean = false

  constructor() {
    this.initializeTavily()
  }

  /**
   * Initialiser le client Tavily
   */
  private initializeTavily() {
    // Temporarily disabled - Tavily library causing build issues
    console.warn('⚠️ Tavily search temporarily disabled')
    this.isInitialized = false
    return

    // const apiKey = process.env.TAVILY_API_KEY
    // if (!apiKey) {
    //   console.warn('⚠️ TAVILY_API_KEY non configurée - recherche web désactivée')
    //   this.isInitialized = false
    //   return
    // }
    // try {
    //   this.tavilyClient = new (tavily as any).Client({ apiKey })
    //   this.isInitialized = true
    //   console.log('✅ Tavily AI initialisé')
    // } catch (error) {
    //   console.error('❌ Erreur initialisation Tavily:', error)
    //   this.isInitialized = false
    // }
  }

  /**
   * Recherche web avec Tavily
   */
  async search(
    query: string,
    options: {
      searchDepth?: 'basic' | 'advanced'
      maxResults?: number
      includeAnswer?: boolean
      includeDomains?: string[]
      excludeDomains?: string[]
    } = {}
  ): Promise<WebSearchResponse> {
    if (!this.isInitialized) {
      console.warn('⚠️ Tavily non initialisé - retour résultats vides')
      return this.getEmptyResponse(query)
    }

    try {
      const {
        searchDepth = 'advanced',
        maxResults = 5,
        includeAnswer = true,
        includeDomains = [],
        excludeDomains = []
      } = options

      console.log(`🔍 Recherche Tavily: "${query}"`)

      const response = await this.tavilyClient.search(query, {
        searchDepth,
        maxResults,
        includeAnswer,
        includeDomains: includeDomains.length > 0 ? includeDomains : undefined,
        excludeDomains: excludeDomains.length > 0 ? excludeDomains : undefined,
        includeRawContent: false // Optimiser la réponse
      })

      const results: SearchResult[] = response.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score || 0,
        publishedDate: result.publishedDate
      }))

      return {
        query,
        results,
        answer: response.answer,
        sources: results.map(r => r.url),
        timestamp: new Date()
      }
    } catch (error) {
      console.error('❌ Erreur recherche Tavily:', error)
      return this.getEmptyResponse(query)
    }
  }

  /**
   * Recherche spécifique au marché sénégalais
   */
  async searchSenegalMarket(
    sector: string,
    city: string,
    options: {
      year?: number
      includeStatistics?: boolean
    } = {}
  ): Promise<WebSearchResponse> {
    const { year = new Date().getFullYear(), includeStatistics = true } = options

    // Construction de requêtes ciblées
    const queries = [
      `marché ${sector} Sénégal ${year}`,
      `statistiques ${sector} ${city} Sénégal`,
      `opportunités ${sector} Afrique de l'Ouest ${year}`
    ]

    // Domaines prioritaires pour le Sénégal
    const includeDomains = [
      'ansd.sn', // Agence Nationale de la Statistique et de la Démographie
      'gouv.sn',
      'apix.sn',
      'worldbank.org',
      'afdb.org', // African Development Bank
      'imf.org',
      'seneweb.com',
      'leral.net'
    ]

    // Recherche combinée
    const searchPromises = queries.map(q =>
      this.search(q, {
        searchDepth: 'advanced',
        maxResults: 3,
        includeDomains
      })
    )

    const results = await Promise.all(searchPromises)

    // Fusionner les résultats
    return this.mergeSearchResults(results)
  }

  /**
   * Recherche pour analyse de crédit
   */
  async searchCreditContext(
    sector: string,
    options: {
      includeFinancialMetrics?: boolean
      includeRegulations?: boolean
    } = {}
  ): Promise<WebSearchResponse> {
    const year = new Date().getFullYear()

    const query = `
      taux crédit PME Sénégal ${year}
      financement ${sector} BCEAO
      ratios financiers bancaires Sénégal
      FONGIP FAISE DER programmes
    `.trim().replace(/\s+/g, ' ')

    return this.search(query, {
      searchDepth: 'advanced',
      maxResults: 5,
      includeDomains: [
        'bceao.int',
        'fongip.sn',
        'der.sn',
        'banquemondiale.org',
        'gouv.sn'
      ]
    })
  }

  /**
   * Recherche Vision Sénégal 2050
   */
  async searchVision2050(): Promise<WebSearchResponse> {
    return this.search('Vision Sénégal 2050 priorités gouvernement', {
      searchDepth: 'advanced',
      maxResults: 5,
      includeDomains: ['gouv.sn', 'sec.gouv.sn', 'apix.sn']
    })
  }

  /**
   * Formater les résultats pour utilisation dans prompts IA
   */
  formatForPrompt(searchResponse: WebSearchResponse): string {
    const { query, results, answer } = searchResponse

    let formatted = `INFORMATIONS WEB À JOUR (recherche: "${query}"):\n\n`

    if (answer) {
      formatted += `SYNTHÈSE:\n${answer}\n\n`
    }

    formatted += `SOURCES VÉRIFIÉES:\n`
    results.forEach((result, index) => {
      formatted += `\n${index + 1}. ${result.title}\n`
      formatted += `   Source: ${result.url}\n`
      if (result.publishedDate) {
        formatted += `   Date: ${result.publishedDate}\n`
      }
      formatted += `   Contenu: ${result.content.slice(0, 300)}...\n`
    })

    formatted += `\n---\n`
    formatted += `IMPORTANT: Utilise UNIQUEMENT ces informations vérifiées. `
    formatted += `Cite les sources dans ta réponse.\n`

    return formatted
  }

  /**
   * Fusionner plusieurs résultats de recherche
   */
  private mergeSearchResults(responses: WebSearchResponse[]): WebSearchResponse {
    const allResults: SearchResult[] = []
    const allSources: string[] = []
    let combinedAnswer = ''

    responses.forEach(response => {
      allResults.push(...response.results)
      allSources.push(...response.sources)
      if (response.answer) {
        combinedAnswer += response.answer + '\n\n'
      }
    })

    // Dédupliquer par URL et trier par score
    const uniqueResults = Array.from(
      new Map(allResults.map(r => [r.url, r])).values()
    ).sort((a, b) => b.score - a.score)

    return {
      query: responses.map(r => r.query).join(' | '),
      results: uniqueResults.slice(0, 10), // Top 10
      answer: combinedAnswer.trim() || undefined,
      sources: [...new Set(allSources)],
      timestamp: new Date()
    }
  }

  /**
   * Réponse vide en cas d'erreur
   */
  private getEmptyResponse(query: string): WebSearchResponse {
    return {
      query,
      results: [],
      sources: [],
      timestamp: new Date()
    }
  }

  /**
   * Vérifier si le service est disponible
   */
  isAvailable(): boolean {
    return this.isInitialized
  }
}

// Export singleton
export const webSearchService = new WebSearchService()
