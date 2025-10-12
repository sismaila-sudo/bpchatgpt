import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/services/openaiService'

interface BusinessPlanAssistantRequest {
  question: string
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
    section: string
    senegalContext: Record<string, unknown>
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, context }: BusinessPlanAssistantRequest = await request.json()

    if (!question || !context?.project) {
      return NextResponse.json(
        { error: 'Question and project context are required' },
        { status: 400 }
      )
    }

    // Validation plus détaillée
    if (!context.project.basicInfo || !context.project.basicInfo.location) {
      return NextResponse.json(
        { error: 'Project structure incomplete - basicInfo.location required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Construction du prompt contextuel avec validation
    const { project } = context
    const location = project.basicInfo?.location ?
      `${project.basicInfo.location.city || 'Non spécifié'}, ${project.basicInfo.location.region || 'Non spécifié'}` :
      'Localisation non spécifiée'

    const systemPrompt = `Tu es un expert en business plans spécialisé dans le marché sénégalais.

CONTEXTE DU PROJET:
- Nom: ${project.basicInfo?.name || 'Non spécifié'}
- Description: ${project.basicInfo?.description || 'Non spécifiée'}
- Secteur: ${project.basicInfo?.sector || 'Non spécifié'}
- Type: ${project.basicInfo?.projectType || 'Non spécifié'}
- Localisation: ${location}

CONTEXTE SÉNÉGAL:
- Économie: Croissance 4.8%, inflation 3%, chômage 16%
- Taux d'imposition: 30% (sociétés), TVA 18%
- Défis: Accès au financement, infrastructure, formation
- Opportunités: Marché CEDEAO, position géographique, stabilité

Tu dois répondre de manière professionnelle, précise et adaptée au contexte sénégalais.
Fournis des conseils pratiques et des données réalistes.
Réponds en français avec un ton professionnel mais accessible.`

    const response = await OpenAIService.generateCompletion(
      systemPrompt,
      question,
      1000
    )

    // Génération de suggestions contextuelle
    const suggestions = [
      "Comment adapter ma stratégie au marché sénégalais ?",
      "Quelles sont les sources de financement disponibles ?",
      "Comment optimiser mes projections financières ?",
      "Quels sont les défis spécifiques à mon secteur ?"
    ]

    return NextResponse.json({
      content: response,
      suggestions,
      confidence: 0.85
    })
  } catch (error) {
    console.error('Erreur assistant business plan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    )
  }
}