import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convertir le File en Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extraire le texte du PDF
    const data = await pdf(buffer)

    return NextResponse.json({
      text: data.text,
      numPages: data.numpages,
      info: data.info
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error extracting PDF:', error)
    return NextResponse.json(
      { error: 'Failed to extract PDF text', details: errorMessage },
      { status: 500 }
    )
  }
}
