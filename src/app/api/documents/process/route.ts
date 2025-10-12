import { NextRequest, NextResponse } from 'next/server'
import { DocumentServiceServer } from '@/services/documentServiceServer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const userId = formData.get('userId') as string

    if (!file || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Fichier, projectId et userId requis' },
        { status: 400 }
      )
    }

    // Valider le fichier
    const validation = DocumentServiceServer.validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Traiter le document
    const result = await DocumentServiceServer.processDocument(projectId, file, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur traitement document:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du document' },
      { status: 500 }
    )
  }
}