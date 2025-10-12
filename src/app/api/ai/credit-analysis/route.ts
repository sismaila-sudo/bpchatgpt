import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { webSearchService } from '@/services/webSearchService'
import { webScrapingService } from '@/services/webScrapingService'
import { getRagServiceInstance } from '@/services/ragService'
import {
  CREDIT_ANALYST_SYSTEM_PROMPT,
  QUICK_ANALYSIS_INSTRUCTION,
  COMPREHENSIVE_ANALYSIS_INSTRUCTION
} from '@/prompts/creditAnalystPrompt'
import { rateLimit, getIdentifier, RATE_LIMITS } from '@/lib/rateLimit'
import { businessPlanTextSchema, validationErrorResponse } from '@/lib/validation'

// Mode d'analyse: quick (BP seul) ou comprehensive (avec recherches)
type AnalysisMode = 'quick' | 'comprehensive'

const OLD_CREDIT_ANALYST_PROMPT = `Tu es un analyste crédit sénior dans une banque sénégalaise (contexte UEMOA/BCEAO).

CONTEXTE ÉCONOMIQUE SÉNÉGAL ${new Date().getFullYear()}:
- Vision stratégique: Vision Sénégal 2050 (gouvernement actuel depuis mars 2024)
- Taux directeur BCEAO: 3.5%
- Taux crédit PME moyen: 8-12%
- Impôt sur sociétés: 30%, TVA: 18%
- Programmes de garantie: FONGIP, FAISE, DER

RÈGLES STRICTES - AUCUNE HALLUCINATION:

1. BASE DOCUMENTAIRE UNIQUEMENT:
   - Ne t'appuie QUE sur le contenu fourni dans {{BUSINESS_PLAN_TEXT}}
   - Si une info manque, écris explicitement "Non documenté dans le BP"
   - JAMAIS inventer de chiffres, contrats, prix, volumes, dates ou taux

2. JUSTIFICATION OBLIGATOIRE:
   - Chaque chiffre/ratio/date DOIT être justifié avec source exacte
   - Format: "Selon [Tableau X, page Y]: [donnée]"
   - Si estimation nécessaire, le mentionner: "Estimation basée sur [hypothèse]"

3. CALCULS FINANCIERS (quand données disponibles):
   - Sources & Emplois (équilibre obligatoire)
   - EBE (Excédent Brut d'Exploitation)
   - CAF (Capacité d'Autofinancement)
   - DSCR annuel = CAF / Service de la dette (covenant minimum 1.3x BCEAO)
   - Intérêts, Amortissements du capital
   - Autonomie financière = Fonds propres / Total bilan
   - Liquidité générale = Actif circulant / Passif circulant
   - Fonds de roulement = Actif circulant - Passif circulant
   - TRI (Taux de Rentabilité Interne), VAN (Valeur Actuelle Nette), Payback
   - Stress test: -10% CA, +10% charges opérationnelles

4. CONTEXTE RÉGLEMENTAIRE:
   - Normes prudentielles BCEAO
   - Ratio d'endettement acceptable: Dette/Fonds propres < 3
   - DSCR minimum bancaire: 1.3x (recommandé: > 1.5x)
   - Garanties standards: hypothèque, nantissement, caution solidaire

5. OUTPUT STRUCTURÉ - Deux blocs:
A. JSON minimal pour la machine avec la structure suivante :
{
  "decision": "approve" | "conditional" | "decline",
  "reasons": ["raison 1", "raison 2"],
  "requestedFacilities": [
    {
      "type": "CMT",
      "montant": 645000000,
      "taux": 9,
      "tenor": 60,
      "differe": 12
    }
  ],
  "sourcesEmplois": {
    "sources": [
      {"description": "CMT (9%, 60m, 12m différé)", "montant": 645000000}
    ],
    "emplois": [
      {"description": "Bâtiments clés en main", "montant": 574400000}
    ],
    "totalSources": 934900000,
    "totalEmplois": 934900000
  },
  "ratios": {
    "dscr": {
      "2025": 5.0,
      "2026": 3.5,
      "2027": 3.0
    },
    "autonomieFinanciere": 26.6,
    "liquiditeGenerale": 0.85,
    "fondsRoulement": -112000000
  },
  "tri": 55,
  "van": 1230000000,
  "payback": "2 ans 1 mois",
  "projections": [
    {"year": 2025, "ca": 1360000000, "ebe": 450000000, "caf": 380000000, "dscr": 5.0}
  ],
  "risks": [
    {
      "type": "BFR",
      "description": "Fonds de roulement déficitaire",
      "mitigation": "Domiciliation créances et lignes d'exploitation",
      "severity": "medium"
    }
  ],
  "mitigants": ["Domiciliation créances", "Lignes d'exploitation"],
  "covenants": ["Domiciliation irrévocable", "DSCR ≥ 1,3x"],
  "evidence": ["Tableau 12 – Plan de financement", "p. 27 – Planning"]
}

B. Note de crédit rédigée, structurée en sections (Résumé, Objet, Projet, Historique, Prévisions & ratios, Risques & mitigations, Conditions & covenants).

6. TRAÇABILITÉ ET TRANSPARENCE:
   - Chaque affirmation financière doit citer sa source documentaire
   - Indiquer clairement les hypothèses et estimations
   - Mentionner les lacunes documentaires identifiées
   - Niveau de confiance global sur l'analyse: Élevé/Moyen/Faible

7. STYLE:
   - Concis, professionnel, orienté décision comité de crédit
   - Factuel et argumenté
   - Recommandations actionnables

IMPORTANT:
- Renvoie uniquement un objet JSON valide avec deux clés: "analysis" (objet JSON structuré) et "noteDeCredit" (texte formaté)
- Inclure un champ "confidence" (0-1) et "documentationQuality" dans l'analysis
- Lister les "missingData" (données manquantes critiques)
- Ne renvoie RIEN d'autre que ce JSON`

export async function POST(request: NextRequest) {
  try {
    // ========== ÉTAPE 1: RATE LIMITING ==========
    const identifier = getIdentifier(request)
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.AI_ANALYSIS)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString()
          }
        }
      )
    }

    // ========== ÉTAPE 2: VALIDATION ==========
    let validatedData
    try {
      const body = await request.json()
      validatedData = businessPlanTextSchema.parse(body)
    } catch (error) {
      return NextResponse.json(
        validationErrorResponse(error),
        { status: 400 }
      )
    }

    const { businessPlanText, mode = 'quick' as AnalysisMode } = validatedData

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée' },
        { status: 500 }
      )
    }

    console.log(`🚀 Analyse de crédit - Mode: ${mode.toUpperCase()}`)

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const systemPrompt = CREDIT_ANALYST_SYSTEM_PROMPT
    let userPrompt = ''
    let enrichedContext = ''

    if (mode === 'comprehensive') {
      // MODE COMPLET: Avec recherches externes
      console.log('📊 Mode Comprehensive - Récupération contexte marché...')

      const [ragResults, creditContext, officialData] = await Promise.all([
        // RAG: Documents officiels
        (() => {
          const ragService = getRagServiceInstance()
          return ragService.isAvailable()
            ? ragService.search(`financement crédit business plan normes BCEAO ratios`, 5)
            : Promise.resolve([])
        })(),
        // Web Search: Contexte économique actuel
        webSearchService.isAvailable()
          ? webSearchService.searchCreditContext('général', {
              includeFinancialMetrics: true,
              includeRegulations: true
            })
          : Promise.resolve({ query: '', results: [], sources: [], timestamp: new Date() }),
        // Scraping: Données officielles
        webScrapingService.getAllSenegalData()
      ])

      // Formater contexte RAG
      let ragContext = ''
      if (ragResults.length > 0) {
        ragContext = '\n\n📚 BASE DE CONNAISSANCES OFFICIELLE:\n\n'
        ragResults.forEach((result, i) => {
          ragContext += `[${i + 1}] ${result.metadata.title} (${result.metadata.source} - ${result.metadata.year}):\n`
          ragContext += `${result.text}\n\n`
        })
        console.log(`✅ RAG: ${ragResults.length} documents pertinents`)
      }

      // Formater contexte web
      const creditContextFormatted = webSearchService.formatForPrompt(creditContext)

      // Formater données officielles
      const scrapedDataArray = Object.values(officialData).filter((d): d is import('@/services/webScrapingService').ScrapedData => d !== null)
      const officialContext = webScrapingService.formatForPrompt(scrapedDataArray)

      enrichedContext = ragContext + creditContextFormatted + officialContext
      console.log('✅ Contexte marché récupéré')

      userPrompt = COMPREHENSIVE_ANALYSIS_INSTRUCTION + '\n\n' +
        enrichedContext + '\n\n' +
        `BUSINESS PLAN À ANALYSER:\n\n${businessPlanText}\n\n` +
        `Effectue une analyse de crédit complète en suivant la méthodologie définie.`

    } else {
      // MODE QUICK: Analyse BP seul
      console.log('⚡ Mode Quick - Analyse BP uniquement')

      userPrompt = QUICK_ANALYSIS_INSTRUCTION + '\n\n' +
        `BUSINESS PLAN À ANALYSER:\n\n${businessPlanText}\n\n` +
        `Effectue une analyse de crédit complète en suivant la méthodologie définie.`
    }

    // Appel à OpenAI avec GPT-4
    console.log('🤖 Génération analyse IA...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.2,  // Plus bas pour plus de rigueur
      max_tokens: 4096,  // Plus de tokens pour analyse complète
      response_format: { type: 'json_object' }
    })
    console.log('✅ Analyse générée')

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('Pas de réponse de l\'IA')
    }

    // Parser la réponse JSON
    const result = JSON.parse(responseContent)

    // Valider la structure de base
    if (!result.analysis || !result.noteDeCredit) {
      // Si la structure n'est pas comme attendue, essayer de l'adapter
      if (result.decision) {
        // La réponse est directement l'analyse
        return NextResponse.json({
          analysis: result,
          noteDeCredit: result.noteDeCredit || 'Note de crédit non générée'
        })
      }
      throw new Error('Structure de réponse invalide')
    }

    return NextResponse.json(result)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur analyse de crédit:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'analyse de crédit',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}