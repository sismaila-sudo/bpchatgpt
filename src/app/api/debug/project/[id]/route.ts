import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const projectDoc = await getDoc(doc(db, 'projects', projectId))

    if (!projectDoc.exists()) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectDoc.data()

    // Diagnostic complet de la structure
    const diagnostic = {
      projectId,
      basicInfo: {
        exists: !!project.basicInfo,
        name: project.basicInfo?.name,
        keys: project.basicInfo ? Object.keys(project.basicInfo) : []
      },
      sections: {
        exists: !!project.sections,
        keys: project.sections ? Object.keys(project.sections) : [],
        // Échantillons de données
        marketStudy: project.sections?.marketStudy ? {
          exists: true,
          keys: Object.keys(project.sections.marketStudy),
          sample: JSON.stringify(project.sections.marketStudy).substring(0, 500)
        } : null,
        swotAnalysis: project.sections?.swotAnalysis ? {
          exists: true,
          keys: Object.keys(project.sections.swotAnalysis),
          sample: JSON.stringify(project.sections.swotAnalysis).substring(0, 500)
        } : null,
        marketingPlan: project.sections?.marketingPlan ? {
          exists: true,
          keys: Object.keys(project.sections.marketingPlan),
          sample: JSON.stringify(project.sections.marketingPlan).substring(0, 500)
        } : null,
        humanResources: project.sections?.humanResources ? {
          exists: true,
          keys: Object.keys(project.sections.humanResources),
          sample: JSON.stringify(project.sections.humanResources).substring(0, 500)
        } : null
      },
      businessPlan: {
        exists: !!project.businessPlan,
        keys: project.businessPlan ? Object.keys(project.businessPlan) : [],
        marketStudy: project.businessPlan?.marketStudy ? {
          exists: true,
          keys: Object.keys(project.businessPlan.marketStudy)
        } : null,
        swotAnalysis: project.businessPlan?.swotAnalysis ? {
          exists: true,
          keys: Object.keys(project.businessPlan.swotAnalysis)
        } : null
      }
    }

    return NextResponse.json(diagnostic, null, 2)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
