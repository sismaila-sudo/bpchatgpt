import { NextResponse } from 'next/server'
import { CompletePDFExportService, type PDFExportOptions } from '@/services/completePDFExportService'
import { TableauxFinanciersService } from '@/services/tableauxFinanciersService'
import { projectService } from '@/services/projectService'
import { adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { projectId, options, userId, projectData, ficheSynoptiqueData } = body as { 
      projectId: string; 
      options: PDFExportOptions; 
      userId?: string;
      projectData?: any; // ✅ NOUVELLE APPROCHE : Données envoyées depuis le client
      ficheSynoptiqueData?: any; // ✅ NOUVELLE APPROCHE : Fiche synoptique envoyée depuis le client
    }
    if (!projectId || !options) {
      return NextResponse.json({ error: 'projectId et options requis' }, { status: 400 })
    }

    // ✅ NOUVELLE APPROCHE : Utiliser les données envoyées depuis le client
    let project: any
    if (projectData) {
      // Utiliser les données envoyées depuis le client (pas de problème de permissions)
      project = projectData
      console.log('📦 Projet reçu depuis le client:', {
        id: project.id,
        name: project.basicInfo?.name,
        hasSections: !!project.sections,
        sectionsKeys: project.sections ? Object.keys(project.sections) : [],
        hasBusinessPlan: !!project.businessPlan,
        businessPlanKeys: project.businessPlan ? Object.keys(project.businessPlan) : []
      })
    } else {
      // Fallback : projet vide si pas de données envoyées
      project = {
        id: projectId,
        basicInfo: { name: 'Projet', description: '' },
        sections: {},
        businessPlan: {},
      }
      console.warn('⚠️ Aucune donnée projet envoyée, utilisation du fallback')
    }

    // 🔍 DEBUG APPROFONDI: Vérifier la structure des sections
    console.log('🔍 Structure sections détaillée:')
    if (project.sections) {
      console.log('  - marketStudy:', {
        exists: !!project.sections.marketStudy,
        keys: project.sections.marketStudy ? Object.keys(project.sections.marketStudy) : [],
        sample: project.sections.marketStudy ? JSON.stringify(project.sections.marketStudy).substring(0, 300) : null
      })
      console.log('  - swotAnalysis:', {
        exists: !!project.sections.swotAnalysis,
        keys: project.sections.swotAnalysis ? Object.keys(project.sections.swotAnalysis) : [],
        hasStrengths: !!project.sections.swotAnalysis?.strengths,
        strengthsLength: project.sections.swotAnalysis?.strengths?.length || 0
      })
      console.log('  - marketingPlan:', {
        exists: !!project.sections.marketingPlan,
        keys: project.sections.marketingPlan ? Object.keys(project.sections.marketingPlan) : []
      })
      console.log('  - humanResources:', {
        exists: !!project.sections.humanResources,
        keys: project.sections.humanResources ? Object.keys(project.sections.humanResources) : []
      })
    }

    if (project.businessPlan) {
      console.log('🔍 Structure businessPlan détaillée:')
      console.log('  - marketStudy:', !!project.businessPlan.marketStudy)
      console.log('  - swotAnalysis:', !!project.businessPlan.swotAnalysis)
      console.log('  - marketingPlan:', !!project.businessPlan.marketingPlan)
      console.log('  - humanResources:', !!project.businessPlan.humanResources)
    }

    // ✅ FIX: Ne pas charger depuis les sous-collections côté serveur (pas d'auth)
    // Les données sont déjà dans project.sections et project.businessPlan
    // Préparer les données consolidées avec le VRAI projet et la VRAIE fiche synoptique
    const exportData = await CompletePDFExportService.prepareExportDataFromMainDocument(project, projectId, options, ficheSynoptiqueData)

    // Tenter de construire un bundle de tableaux PDF-ready depuis le document principal
    let tablesBundle: any = undefined
    try {
      const tf = project.sections?.financialEngine || project.sections?.tableauxFinanciers
      if (tf && (TableauxFinanciersService as any).getFinancialTablesBundleFromSource) {
        tablesBundle = await (TableauxFinanciersService as any).getFinancialTablesBundleFromSource(tf)
      }
    } catch {
      // silencieux: bundle restera undefined, le builder gèrera des placeholders
    }

    // Générer le HTML complet pour jsPDF (fallback côté serveur)
    const html = CompletePDFExportService.generateCompleteHTML(exportData, options)

    // Retourner le HTML pour traitement côté client
    return NextResponse.json({ 
      success: true, 
      html,
      tablesBundle,
      projectName: exportData.project.basicInfo?.name || 'Projet'
    })

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur génération PDF' }, { status: 500 })
  }
}


