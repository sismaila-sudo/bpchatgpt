import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client avec service key pour contourner RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json()

    if (!projectData.user_id || !projectData.name) {
      return NextResponse.json(
        { error: 'Paramètres manquants (user_id, name requis)' },
        { status: 400 }
      )
    }


    // Créer le projet en base avec service key (bypass RLS)
    const { data: project, error: dbError } = await supabaseAdmin
      .from('projects')
      .insert({
        created_by: projectData.user_id,
        name: projectData.name,
        company_type: projectData.company_type || 'new',
        status: projectData.status || 'active',
        sector: projectData.sector || 'Services',
        start_date: projectData.start_date || new Date().toISOString().split('T')[0],
        horizon_years: projectData.horizon_years || 3,
        mode: projectData.mode || 'new-company', // Utiliser le mode envoyé !
        organization_id: '11111111-1111-1111-1111-111111111111'
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
      project,
      message: 'Projet créé avec succès'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}