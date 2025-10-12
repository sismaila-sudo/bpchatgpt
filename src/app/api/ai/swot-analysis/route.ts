import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/services/openaiService'

interface SWOTAnalysisRequest {
  project: {
    name: string
    description: string
    sector: string
    location: {
      city: string
      region: string
    }
    projectType: string
  }
  senegalContext: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const { project }: SWOTAnalysisRequest = await request.json()

    if (!project || !project.name || !project.sector) {
      return NextResponse.json(
        { error: 'Project information is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `Effectue une analyse SWOT complète pour le projet "${project.name}" dans le secteur ${project.sector} au Sénégal.

CONTEXTE DU PROJET:
- Nom: ${project.name}
- Description: ${project.description}
- Secteur: ${project.sector}
- Type: ${project.projectType}
- Localisation: ${project.location.city}, ${project.location.region}

CONTEXTE SÉNÉGAL:
- Économie en croissance (4.8% PIB)
- Jeune population (65% moins de 25 ans)
- Marché CEDEAO accessible
- Défis: Infrastructure, financement, formation
- Opportunités: Digitalisation, urbanisation, diaspora

ANALYSE SWOT DEMANDÉE:
1. FORCES (Strengths) - 5-6 points spécifiques au projet et équipe
2. FAIBLESSES (Weaknesses) - 4-5 limitations et défis internes
3. OPPORTUNITÉS (Opportunities) - 6-7 tendances favorables du marché
4. MENACES (Threats) - 4-5 risques externes et concurrence

Format: Points concis et actionables, adaptés au contexte sénégalais.`

    const analysis = await OpenAIService.generateCompletion(
      "Tu es un expert en analyse stratégique spécialisé dans l'écosystème entrepreneurial sénégalais.",
      prompt,
      1800
    )

    return NextResponse.json({
      strengths: [
        "Équipe motivée avec vision claire",
        "Connaissance approfondie du marché local",
        "Innovation adaptée aux besoins sénégalais",
        "Positionnement différenciant sur le marché",
        "Flexibilité et agilité d'une nouvelle structure",
        "Partenariats stratégiques potentiels"
      ],
      weaknesses: [
        "Ressources financières limitées au démarrage",
        "Notoriété et marque à construire",
        "Équipe restreinte avec compétences à développer",
        "Dépendance aux fournisseurs locaux",
        "Absence d'historique commercial"
      ],
      opportunities: [
        "Marché en forte croissance démographique",
        "Demande croissante non satisfaite",
        "Soutien gouvernemental aux PME et startup",
        "Accès facilité au marché CEDEAO",
        "Digitalisation accélérée post-COVID",
        "Diaspora sénégalaise investisseuse",
        "Programmes de financement internationaux"
      ],
      threats: [
        "Concurrence établie avec moyens importants",
        "Instabilité économique régionale",
        "Réglementation en évolution constante",
        "Défis logistiques et infrastructurels",
        "Fluctuation des taux de change"
      ],
      strategicRecommendations: [
        "Capitaliser sur l'innovation pour se différencier",
        "Développer des partenariats stratégiques solides",
        "Investir dans la formation continue de l'équipe",
        "Mettre en place une veille concurrentielle active",
        "Diversifier les sources de financement",
        "Créer une stratégie de communication digitale forte"
      ],
      detailedAnalysis: analysis
    })
  } catch (error) {
    console.error('Erreur analyse SWOT:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse SWOT' },
      { status: 500 }
    )
  }
}