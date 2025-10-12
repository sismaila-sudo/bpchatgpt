import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCQT0rubQjdLMhDovPymHWhzTZdtIDTeFM",
  authDomain: "bpdesign-pro.firebaseapp.com",
  projectId: "bpdesign-pro",
  storageBucket: "bpdesign-pro.firebasestorage.app",
  messagingSenderId: "722637437465",
  appId: "1:722637437465:web:75374562e5605947cfc888"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function inspectProject() {
  try {
    const projectId = 'JGuSemkoWm1Ax5kAdtx9'
    const projectRef = doc(db, 'projects', projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      console.error('❌ Project not found')
      return
    }

    const project = projectSnap.data()

    console.log('\n=== PROJECT STRUCTURE ===\n')
    console.log('📦 Top-level keys:', Object.keys(project))

    console.log('\n=== BASIC INFO ===')
    console.log(JSON.stringify(project.basicInfo, null, 2))

    console.log('\n=== SECTIONS ===')
    if (project.sections) {
      console.log('Available sections:', Object.keys(project.sections))

      // Market Study
      if (project.sections.marketStudy) {
        console.log('\n--- Market Study ---')
        console.log('Keys:', Object.keys(project.sections.marketStudy))
        console.log('Full data:', JSON.stringify(project.sections.marketStudy, null, 2).substring(0, 1000))
      }

      // SWOT Analysis
      if (project.sections.swotAnalysis) {
        console.log('\n--- SWOT Analysis ---')
        console.log('Keys:', Object.keys(project.sections.swotAnalysis))
        console.log('Full data:', JSON.stringify(project.sections.swotAnalysis, null, 2).substring(0, 1000))
      }

      // Marketing Plan
      if (project.sections.marketingPlan) {
        console.log('\n--- Marketing Plan ---')
        console.log('Keys:', Object.keys(project.sections.marketingPlan))
        console.log('Full data:', JSON.stringify(project.sections.marketingPlan, null, 2).substring(0, 1000))
      }

      // Human Resources
      if (project.sections.humanResources) {
        console.log('\n--- Human Resources ---')
        console.log('Keys:', Object.keys(project.sections.humanResources))
        console.log('Full data:', JSON.stringify(project.sections.humanResources, null, 2).substring(0, 1000))
      }

      // Financial Engine
      if (project.sections.financialEngine) {
        console.log('\n--- Financial Engine ---')
        console.log('Keys:', Object.keys(project.sections.financialEngine))
        console.log('Sample:', JSON.stringify(project.sections.financialEngine, null, 2).substring(0, 500))
      }
    }

    console.log('\n=== BUSINESS PLAN ===')
    if (project.businessPlan) {
      console.log('Keys:', Object.keys(project.businessPlan))
      console.log('Sample:', JSON.stringify(project.businessPlan, null, 2).substring(0, 500))
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

inspectProject()
