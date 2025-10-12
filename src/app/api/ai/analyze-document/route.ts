import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/services/openaiService'

export async function POST(request: NextRequest) {
  try {
    const { documentText, fileName } = await request.json()

    if (!documentText || !fileName) {
      return NextResponse.json(
        { error: 'Document text and filename are required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const analysis = await OpenAIService.analyzeDocument(documentText, fileName)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Erreur analyse document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    )
  }
}