import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client avec service key pour contourner RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const documentType = formData.get('documentType') as string

    if (!file || !projectId || !documentType) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // 1. Upload du fichier vers Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${documentType}_${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erreur upload fichier' },
        { status: 500 }
      )
    }

    // 2. Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName)

    // 3. Enregistrer en base avec service key (bypass RLS)
    const { data: documentData, error: dbError } = await supabaseAdmin
      .from('uploaded_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Erreur base de données', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
      documentId: documentData.id,
      message: 'Document uploadé avec succès'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}