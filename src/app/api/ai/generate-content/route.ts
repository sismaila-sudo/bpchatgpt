import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/services/openaiService'

interface GenerateContentRequest {
  prompt: string
  context: {
    project: {
      basicInfo: {
        name: string
        description: string
        sector: string
        location: {
          city: string
          region: string
        }
        projectType: string
      }
    }
    senegalContext: Record<string, unknown>
    localRegion?: Record<string, unknown>
  }
  contentType: string
  maxTokens?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, context, contentType, maxTokens = 1500 }: GenerateContentRequest = body

    // Log pour debug : voir exactement ce qui est reçu
    console.log('[API /generate-content] Requête reçue:', {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasContext: !!context,
      hasProject: !!context?.project,
      contentType,
      bodyKeys: Object.keys(body)
    })

    if (!prompt || !context?.project) {
      console.error('[API /generate-content] Requête invalide:', {
        prompt: prompt?.substring(0, 50) || 'null',
        hasContext: !!context,
        hasProject: !!context?.project
      })
      return NextResponse.json(
        { error: 'Prompt and project context are required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Génération du contenu avec le prompt personnalisé
    const content = await OpenAIService.generateCompletion(
      "Tu es un expert en business plans spécialisé dans le marché sénégalais.",
      prompt,
      maxTokens
    )

    // Suggestions basées sur le type de contenu
    const suggestions = getContentSuggestions(contentType)

    return NextResponse.json({
      content,
      suggestions,
      confidence: 0.9,
      sources: ['IA Spécialisée Business Plan Sénégal']
    })
  } catch (error) {
    console.error('Erreur génération contenu:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de contenu' },
      { status: 500 }
    )
  }
}

function getContentSuggestions(contentType: string): string[] {
  const suggestions: Record<string, string[]> = {
    executive_summary: [
      "Ajoutez des données chiffrées sur le marché",
      "Précisez l'avantage concurrentiel unique",
      "Mentionnez les partenaires stratégiques potentiels"
    ],
    market_study: [
      "Analysez la saisonnalité du marché",
      "Étudiez les canaux de distribution locaux",
      "Évaluez l'impact de l'économie informelle"
    ],
    swot: [
      "Considérez les spécificités culturelles sénégalaises",
      "Analysez l'impact des politiques gouvernementales",
      "Évaluez les risques climatiques et environnementaux"
    ],
    marketing_strategy: [
      "Adaptez au pouvoir d'achat local",
      "Intégrez les réseaux sociaux populaires au Sénégal",
      "Considérez les langues locales dans la communication"
    ],
    financial_analysis: [
      "Intégrez les taux d'inflation sénégalais",
      "Considérez les variations saisonnières",
      "Analysez la sensibilité aux changes FCFA/Euro"
    ]
  }

  return suggestions[contentType] || [
    "Consultez des experts locaux",
    "Validez avec des études de marché récentes",
    "Adaptez aux spécificités de votre région"
  ]
}