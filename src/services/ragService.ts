/**
 * RAG Service - Retrieval Augmented Generation avec Pinecone
 * Base de connaissances vectorielle pour informations Sénégal
 */

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

// Types
export interface Document {
  id: string
  text: string
  metadata: {
    source: string
    title: string
    category: string
    year?: number
    url?: string
    reliability: 'high' | 'medium' | 'low'
  }
}

export interface SearchResult {
  id: string
  text: string
  score: number
  metadata: Document['metadata']
}

export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  confidence: number
}

class RAGService {
  private pinecone: Pinecone | null = null
  private openai: OpenAI | null = null
  private indexName = 'senegal-knowledge-base'
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  constructor() {
    // Ne pas initialiser automatiquement pour éviter DataCloneError
    // L'initialisation se fera à la demande via ensureInitialized()
  }

  /**
   * Initialiser Pinecone et OpenAI (lazy initialization)
   */
  private async initialize() {
    const pineconeKey = process.env.PINECONE_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!pineconeKey) {
      console.warn('⚠️ PINECONE_API_KEY non configurée - RAG désactivé')
      return
    }

    if (!openaiKey) {
      console.warn('⚠️ OPENAI_API_KEY non configurée - RAG désactivé')
      return
    }

    try {
      this.pinecone = new Pinecone({
        apiKey: pineconeKey
      })

      this.openai = new OpenAI({
        apiKey: openaiKey
      })

      // Vérifier si l'index existe, sinon le créer
      await this.ensureIndexExists()

      this.isInitialized = true
      console.log('✅ RAG Service initialisé avec Pinecone')
    } catch (error) {
      console.error('❌ Erreur initialisation RAG:', error)
      this.isInitialized = false
    }
  }

  /**
   * S'assurer que le service est initialisé (lazy initialization)
   */
  private async ensureInitialized() {
    if (this.isInitialized) return

    if (!this.initPromise) {
      this.initPromise = this.initialize()
    }

    await this.initPromise
  }

  /**
   * S'assurer que l'index Pinecone existe
   */
  private async ensureIndexExists() {
    if (!this.pinecone) return

    try {
      const indexes = await this.pinecone.listIndexes()
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName)

      if (!indexExists) {
        console.log(`📊 Création de l'index Pinecone: ${this.indexName}`)
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // Dimension des embeddings text-embedding-ada-002
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        })
        console.log('✅ Index créé avec succès')
      }
    } catch (error) {
      console.error('❌ Erreur vérification index:', error)
    }
  }

  /**
   * Générer embeddings avec OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) throw new Error('OpenAI non initialisé')

    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    })

    return response.data[0].embedding
  }

  /**
   * Ajouter un document à la base de connaissances
   */
  async addDocument(document: Document): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.isInitialized || !this.pinecone || !this.openai) {
      console.warn('⚠️ RAG non disponible - document non ajouté')
      return
    }

    try {
      const embedding = await this.generateEmbedding(document.text)
      const index = this.pinecone.index(this.indexName)

      await index.upsert([{
        id: document.id,
        values: embedding,
        metadata: {
          text: document.text.slice(0, 40000), // Pinecone limite metadata
          ...document.metadata
        }
      }])

      console.log(`✅ Document ajouté: ${document.metadata.title}`)
    } catch (error) {
      console.error('❌ Erreur ajout document:', error)
    }
  }

  /**
   * Ajouter plusieurs documents en batch
   */
  async addDocuments(documents: Document[]): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.isInitialized || !this.pinecone || !this.openai) {
      console.warn('⚠️ RAG non disponible - documents non ajoutés')
      return
    }

    console.log(`📚 Ajout de ${documents.length} documents...`)

    for (const doc of documents) {
      await this.addDocument(doc)
      // Petite pause pour éviter rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('✅ Tous les documents ajoutés')
  }

  /**
   * Rechercher dans la base de connaissances
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    await this.ensureInitialized()
    
    if (!this.isInitialized || !this.pinecone || !this.openai) {
      console.warn('⚠️ RAG non disponible - recherche annulée')
      return []
    }

    try {
      const embedding = await this.generateEmbedding(query)
      const index = this.pinecone.index(this.indexName)

      const results = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true
      })

      return results.matches?.map(match => ({
        id: match.id,
        text: (match.metadata?.text as string) || '',
        score: match.score || 0,
        metadata: {
          source: (match.metadata?.source as string) || '',
          title: (match.metadata?.title as string) || '',
          category: (match.metadata?.category as string) || '',
          year: match.metadata?.year as number | undefined,
          url: match.metadata?.url as string | undefined,
          reliability: (match.metadata?.reliability as 'high' | 'medium' | 'low') || 'medium'
        }
      })) || []
    } catch (error) {
      console.error('❌ Erreur recherche RAG:', error)
      return []
    }
  }

  /**
   * Générer réponse avec RAG (recherche + génération)
   */
  async query(question: string, options: {
    topK?: number
    includeContext?: boolean
  } = {}): Promise<RAGResponse> {
    await this.ensureInitialized()
    
    const { topK = 5, includeContext = true } = options

    if (!this.isInitialized || !this.openai) {
      return {
        answer: 'Service RAG non disponible',
        sources: [],
        confidence: 0
      }
    }

    try {
      // Recherche documents pertinents
      const sources = await this.search(question, topK)

      if (sources.length === 0) {
        return {
          answer: 'Aucune information trouvée dans la base de connaissances',
          sources: [],
          confidence: 0
        }
      }

      // Construire contexte
      const context = sources
        .map((s, i) => `[${i + 1}] ${s.metadata.title} (${s.metadata.source}):\n${s.text}`)
        .join('\n\n')

      // Générer réponse
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en économie sénégalaise. Réponds en te basant UNIQUEMENT sur le contexte fourni.

RÈGLES STRICTES:
- Cite toujours les sources [1], [2], etc.
- Si l'info n'est pas dans le contexte, dis "Information non disponible dans la base de connaissances"
- Ne jamais inventer de données

CONTEXTE:
${context}`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const answer = completion.choices[0]?.message?.content || 'Pas de réponse générée'

      // Calculer confiance basée sur les scores de similarité
      const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length
      const confidence = Math.min(avgScore * 1.2, 1) // Normaliser à 0-1

      return {
        answer,
        sources,
        confidence
      }
    } catch (error) {
      console.error('❌ Erreur génération RAG:', error)
      return {
        answer: 'Erreur lors de la génération de la réponse',
        sources: [],
        confidence: 0
      }
    }
  }

  /**
   * Réinitialiser le service (utile pour scripts avec dotenv)
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false
    this.pinecone = null
    this.openai = null
    this.initPromise = null
    await this.initialize()
  }

  /**
   * Vérifier disponibilité du service
   */
  isAvailable(): boolean {
    return this.isInitialized
  }

  /**
   * Obtenir statistiques de l'index
   */
  async getStats(): Promise<{ vectorCount: number; dimension: number }> {
    await this.ensureInitialized()
    
    if (!this.isInitialized || !this.pinecone) {
      return { vectorCount: 0, dimension: 0 }
    }

    try {
      const index = this.pinecone.index(this.indexName)
      const stats = await index.describeIndexStats()

      return {
        vectorCount: stats.totalRecordCount || 0,
        dimension: stats.dimension || 0
      }
    } catch (error) {
      console.error('❌ Erreur stats:', error)
      return { vectorCount: 0, dimension: 0 }
    }
  }
}

// Export d'une fonction factory au lieu d'une instance globale
export function getRagService(): RAGService {
  return new RAGService()
}

// Pour la compatibilité avec l'existant, on peut garder une instance mais la créer à la demande
let _ragServiceInstance: RAGService | null = null

export function getRagServiceInstance(): RAGService {
  if (!_ragServiceInstance) {
    _ragServiceInstance = new RAGService()
  }
  return _ragServiceInstance
}
