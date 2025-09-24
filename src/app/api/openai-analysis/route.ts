import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Client OpenAI avec la clé API sécurisée côté serveur
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, documentTexts } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé OpenAI non configurée. Ajoutez OPENAI_API_KEY dans .env.local' },
        { status: 500 }
      )
    }

    if (!prompt || !documentTexts) {
      return NextResponse.json(
        { error: 'Prompt et documentTexts requis' },
        { status: 400 }
      )
    }

    console.log('🤖 Analyse OpenAI GPT-4 en cours...')

    // Construire le message pour GPT-4 avec le prompt expert
    const messages = [
      {
        role: "system" as const,
        content: `${prompt}\n\nIMPORTANT: Tu DOIS retourner une réponse JSON valide avec cette structure exacte:
{
  "identite": {
    "denomination": "string",
    "forme_juridique": "string",
    "capital_social": "string",
    "ninea": "string",
    "rccm": "string",
    "ifu": "string",
    "adresse": "string",
    "representant_legal": "string"
  },
  "finances": [
    {
      "exercice": 2022,
      "chiffre_affaires": 0,
      "ebe": 0,
      "resultat_net": 0,
      "total_bilan": 0,
      "dettes_financieres": 0,
      "tresorerie_nette": 0
    }
  ],
  "banques": [
    {
      "banque": "string",
      "type": "string",
      "octroye": 0,
      "crd": 0,
      "taux": 0,
      "statut": "string"
    }
  ],
  "scoring": {
    "cip": "string",
    "prob_defaut": "string",
    "impayes": 0,
    "alerte": "string"
  },
  "observations_legales": {
    "changements_detectes": false,
    "observations": [],
    "continuite_identite": true,
    "alertes_incoherence": []
  },
  "synthese": {
    "evolution_ca": "string",
    "points_forts": ["string"],
    "points_attention": ["string"],
    "recommandations": ["string"],
    "score_global": 0
  },
  "actions_recommandees": [
    {
      "action": "string",
      "priorite": "elevee|moyenne|basse",
      "impact_attendu": "string",
      "delai_recommande": "string"
    }
  ]
}`
      },
      {
        role: "user" as const,
        content: `Voici les documents financiers à analyser:\n\n${documentTexts.join('\n\n---\n\n')}\n\nEffectue une analyse complète selon tes instructions d'auditeur financier senior. Retourne UNIQUEMENT le JSON sans texte supplémentaire.`
      }
    ]

    // Appel à GPT-4 avec le modèle le plus récent
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Modèle le plus récent et performant
      messages: messages,
      temperature: 0.1, // Peu de créativité pour plus de précision
      max_tokens: 4000, // Assez pour une analyse complète
      response_format: { type: "json_object" }, // Force une réponse JSON structurée
    })

    const analysisResult = completion.choices[0].message.content

    if (!analysisResult) {
      throw new Error('Pas de réponse de OpenAI')
    }

    // Parser la réponse JSON
    let parsedResult
    try {
      parsedResult = JSON.parse(analysisResult)
    } catch (error) {
      console.error('Erreur parsing JSON:', error)
      return NextResponse.json(
        { error: 'Réponse OpenAI non parsable', rawResponse: analysisResult },
        { status: 500 }
      )
    }

    console.log('✅ Analyse OpenAI terminée avec succès')

    return NextResponse.json({
      success: true,
      analysis: parsedResult,
      usage: completion.usage,
      model: completion.model
    })

  } catch (error: any) {
    console.error('❌ Erreur OpenAI:', error)

    // Gestion des erreurs spécifiques OpenAI
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Quota OpenAI épuisé. Vérifiez votre compte OpenAI.' },
        { status: 402 }
      )
    }

    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Clé API OpenAI invalide. Vérifiez votre configuration.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse OpenAI', details: error.message },
      { status: 500 }
    )
  }
}