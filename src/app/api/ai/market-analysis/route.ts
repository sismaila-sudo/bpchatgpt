import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/services/openaiService'
import { webSearchService } from '@/services/webSearchService'
import { webScrapingService } from '@/services/webScrapingService'
import { getRagServiceInstance } from '@/services/ragService'

interface MarketAnalysisRequest {
  sector: string
  location: {
    city: string
    region: string
  }
  projectType: string
  senegalContext: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const { sector, location, projectType }: MarketAnalysisRequest = await request.json()

    if (!sector || !location) {
      return NextResponse.json(
        { error: 'Sector and location are required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log(`🚀 Analyse de marché: ${sector} à ${location.city}`)

    // ÉTAPE 1: Recherche web en temps réel (Tavily)
    let webContext = ''
    if (webSearchService.isAvailable()) {
      console.log('🔍 Recherche web Tavily en cours...')
      const searchResult = await webSearchService.searchSenegalMarket(
        sector,
        location.city,
        { year: new Date().getFullYear() }
      )
      webContext = webSearchService.formatForPrompt(searchResult)
      console.log(`✅ Recherche web complétée: ${searchResult.results.length} sources`)
    } else {
      console.warn('⚠️ Tavily non disponible - analyse sans recherche web')
    }

    // ÉTAPE 2: Recherche dans base de connaissances RAG (si disponible)
    const ragService = getRagServiceInstance()
    let ragContext = ''
    if (ragService.isAvailable()) {
      console.log('🧠 Recherche dans base de connaissances RAG...')
      const ragQuery = `marché ${sector} Sénégal opportunités défis ${location.city}`
      const ragResults = await ragService.search(ragQuery, 3)
      if (ragResults.length > 0) {
        ragContext = '\n\nBASE DE CONNAISSANCES OFFICIELLE:\n\n'
        ragResults.forEach((result, i) => {
          ragContext += `[${i + 1}] ${result.metadata.title} (${result.metadata.source} - ${result.metadata.year}):\n`
          ragContext += `${result.text}\n`
          ragContext += `Pertinence: ${(result.score * 100).toFixed(1)}%\n\n`
        })
        console.log(`✅ RAG: ${ragResults.length} documents pertinents trouvés`)
      }
    }

    // ÉTAPE 3: Scraping sources officielles (ANSD, Banque Mondiale, etc.)
    console.log('📊 Récupération données officielles...')
    const officialData = await webScrapingService.getAllSenegalData()
    const scrapedDataArray = Object.values(officialData).filter((d): d is import('@/services/webScrapingService').ScrapedData => d !== null)
    const officialContext = webScrapingService.formatForPrompt(scrapedDataArray)
    console.log(`✅ Données officielles récupérées: ${scrapedDataArray.length} sources`)

    // ÉTAPE 4: Construire le prompt enrichi avec TOUTES les données
    const prompt = `RÈGLES STRICTES - AUCUNE HALLUCINATION:
1. Utilise UNIQUEMENT les données fournies ci-dessous (RAG + web + sources officielles)
2. JAMAIS inventer de chiffres, d'acteurs ou de références
3. TOUJOURS citer les sources exactes pour chaque affirmation
4. Si une donnée manque dans les sources fournies, écris "Donnée non disponible dans les sources"
5. Indique ton niveau de confiance: [Élevé], [Moyen], [Faible]

${ragContext}

${webContext}

${officialContext}

MISSION:
Effectue une analyse de marché COMPLÈTE pour un projet de ${projectType} dans le secteur ${sector} au Sénégal, spécifiquement à ${location.city}, région ${location.region}.

ANALYSE REQUISE (avec citations de sources obligatoires):
1. Taille et tendances du marché ${sector} au Sénégal
   - Utilise les données web et officielles ci-dessus
   - Cite précisément les sources (URL, organisme)

2. Segments de clientèle cible dans ${location.region}
   - Base-toi sur les statistiques démographiques fournies

3. Paysage concurrentiel
   - Mentionne UNIQUEMENT les acteurs trouvés dans les recherches web
   - Si aucun nom trouvé: "Acteurs non identifiés dans les sources - étude terrain recommandée"

4. Barrières à l'entrée et facteurs clés de succès
   - Base-toi sur les données Vision 2050 et programmes gouvernementaux fournis

5. Opportunités spécifiques (contexte Vision 2050)
   - Utilise les priorités gouvernementales des sources officielles

6. Risques et menaces identifiés

7. Recommandations stratégiques adaptées

Format: Texte structuré professionnel avec citations [Source: ...]
Langue: Français professionnel`

    // ÉTAPE 5: Génération de l'analyse avec IA
    console.log('🤖 Génération analyse IA avec données enrichies (RAG + Web + Scraping)...')
    const analysis = await OpenAIService.generateCompletion(
      "Tu es un expert en analyse de marché spécialisé dans l'économie sénégalaise. Tu travailles avec des données RÉELLES issues de la base de connaissances, recherches web et sources officielles.",
      prompt,
      3000 // Plus de tokens pour analyse détaillée
    )
    console.log('✅ Analyse IA générée')

    // ÉTAPE 6: Retourner résultats avec métadonnées complètes
    return NextResponse.json({
      detailedAnalysis: analysis,
      metadata: {
        ragEnabled: ragService.isAvailable(),
        searchPerformed: webSearchService.isAvailable(),
        sourcesUsed: [
          ...(ragService.isAvailable() ? [{ name: 'Base de Connaissances RAG (Pinecone)', reliability: 'high', category: 'knowledge-base' }] : []),
          ...scrapedDataArray.map(d => ({
            name: d?.source || 'Unknown',
            url: d?.url || '',
            reliability: d?.reliability || 'unknown',
            category: 'official'
          })),
          ...(webContext ? [{ name: 'Web Search (Tavily)', reliability: 'high', category: 'web' }] : [])
        ],
        analysisTimestamp: new Date().toISOString(),
        sector,
        location: location.city
      },
      // Données structurées basiques pour compatibilité
      marketSize: `Analyse basée sur recherches web et sources officielles`,
      targetAudience: `Voir analyse détaillée`,
      competition: ["Voir analyse détaillée avec sources"],
      opportunities: ["Voir analyse détaillée avec sources"],
      threats: ["Voir analyse détaillée avec sources"],
      recommendations: ["Voir analyse détaillée avec sources"]
    })
  } catch (error) {
    console.error('Erreur analyse marché:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse de marché' },
      { status: 500 }
    )
  }
}