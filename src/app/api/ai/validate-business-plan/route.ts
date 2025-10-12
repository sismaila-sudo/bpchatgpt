import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/services/openaiService'

interface ValidateBusinessPlanRequest {
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
    status: string
  }
  financialData?: Record<string, unknown>
  senegalContext: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const { project, financialData }: ValidateBusinessPlanRequest = await request.json()

    if (!project || !project.basicInfo) {
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

    const prompt = `Effectue une validation complète de ce business plan pour le marché sénégalais:

PROJET À VALIDER:
- Nom: ${project.basicInfo.name}
- Description: ${project.basicInfo.description}
- Secteur: ${project.basicInfo.sector}
- Type: ${project.basicInfo.projectType}
- Localisation: ${project.basicInfo.location.city}, ${project.basicInfo.location.region}
- Statut: ${project.status}

CRITÈRES DE VALIDATION:
1. Cohérence du concept avec le marché sénégalais
2. Faisabilité technique et opérationnelle
3. Viabilité financière (si données disponibles)
4. Adaptation au contexte réglementaire sénégalais
5. Potentiel de croissance et scalabilité
6. Gestion des risques
7. Stratégie commerciale et marketing

ÉVALUATION DEMANDÉE:
- Score global sur 100
- Points forts identifiés
- Faiblesses critiques à corriger
- Recommandations d'amélioration prioritaires
- Conformité aux standards du marché sénégalais

Format: Analyse structurée avec score justifié et recommandations actionables.`

    const validation = await OpenAIService.generateCompletion(
      "Tu es un expert-conseil en business plans spécialisé dans l'écosystème entrepreneurial sénégalais.",
      prompt,
      1500
    )

    // Calcul du score basé sur différents critères
    let score = 70 // Score de base

    // Bonus/malus selon les critères
    if (project.basicInfo.description.length > 50) score += 5
    if (project.status === 'completed') score += 10
    if (project.status === 'draft') score -= 10
    if (financialData) score += 15

    // Limitation du score entre 0 et 100
    score = Math.max(0, Math.min(100, score))

    const issues = [
      {
        section: "Général",
        issue: "Description du projet à enrichir",
        suggestion: "Ajoutez plus de détails sur la proposition de valeur unique"
      },
      {
        section: "Marché",
        issue: "Étude de marché incomplète",
        suggestion: "Réalisez une analyse concurrentielle approfondie"
      },
      {
        section: "Financier",
        issue: financialData ? "Projections à affiner" : "Données financières manquantes",
        suggestion: financialData ? "Ajustez les hypothèses de croissance" : "Complétez le modèle financier"
      },
      {
        section: "Stratégie",
        issue: "Plan de développement à préciser",
        suggestion: "Définissez les étapes clés et jalons de développement"
      }
    ]

    const improvements = [
      "Renforcez l'analyse de la concurrence locale",
      "Précisez la stratégie de distribution",
      "Développez le plan de communication",
      "Détaillez la structure organisationnelle",
      "Identifiez les partenaires stratégiques",
      "Élaborez un plan de gestion des risques"
    ]

    return NextResponse.json({
      score,
      issues,
      improvements,
      detailedValidation: validation,
      recommendations: [
        "Focalisez-vous sur l'adaptation au marché local",
        "Renforcez la partie financière avec des projections réalistes",
        "Développez une stratégie de communication culturellement adaptée",
        "Préparez un plan de contingence pour les principaux risques"
      ]
    })
  } catch (error) {
    console.error('Erreur validation business plan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation du business plan' },
      { status: 500 }
    )
  }
}