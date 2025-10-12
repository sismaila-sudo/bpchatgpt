#!/usr/bin/env tsx

/**
 * Migration Script: Old Project Structure → New Sub-collections
 *
 * Usage: npx tsx scripts/migrateOldProject.ts <projectId>
 * Example: npx tsx scripts/migrateOldProject.ts 0IDBKsYQhdUtJtXhBAtf
 *
 * This script migrates old projects stored entirely in projects/{id}
 * to the new architecture with sub-collections:
 * - /projects/{id}/sections/{sectionId}
 * - /tableauxFinanciers/{projectId}
 * - /analysesFinancieresHistoriques/{projectId}
 * - /relationsBancaires/{projectId}
 * - /analyseRentabilite/{projectId}
 */

import * as dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, getDoc, setDoc, doc, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import * as path from 'path'
import * as readline from 'readline'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

interface MigrationStats {
  sectionsCreated: number
  tableauxCreated: number
  analysesCreated: number
  relationsCreated: number
  ficheCreated: number
  rentabiliteCreated: number
  totalDocuments: number
  errors: string[]
}

const stats: MigrationStats = {
  sectionsCreated: 0,
  tableauxCreated: 0,
  analysesCreated: 0,
  relationsCreated: 0,
  ficheCreated: 0,
  rentabiliteCreated: 0,
  totalDocuments: 0,
  errors: []
}

/**
 * Prompt for user credentials
 */
async function promptCredentials(): Promise<{ email: string; password: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('Enter your email: ', (email) => {
      rl.question('Enter your password: ', (password) => {
        rl.close()
        resolve({ email, password })
      })
    })
  })
}

/**
 * Safely migrate a section to sub-collection
 */
async function migrateSection(
  projectId: string,
  sectionId: string,
  sectionData: any,
  ownerId: string
): Promise<boolean> {
  if (!sectionData || Object.keys(sectionData).length === 0) {
    return false
  }

  try {
    const sectionRef = doc(db, 'projects', projectId, 'sections', sectionId)
    await setDoc(sectionRef, {
      ...sectionData,
      ownerId,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    stats.sectionsCreated++
    stats.totalDocuments++
    console.log(`  ✅ Section migrated: ${sectionId}`)
    return true
  } catch (error: any) {
    const errorMsg = `Failed to migrate section ${sectionId}: ${error.message}`
    stats.errors.push(errorMsg)
    console.error(`  ❌ ${errorMsg}`)
    return false
  }
}

/**
 * Migrate tableaux financiers to dedicated collection
 */
async function migrateTableauxFinanciers(
  projectId: string,
  tableauxData: any,
  ownerId: string
): Promise<boolean> {
  if (!tableauxData || Object.keys(tableauxData).length === 0) {
    return false
  }

  try {
    // Use projectId as docId (new architecture)
    const tableauxRef = doc(db, 'tableauxFinanciers', projectId)
    await setDoc(tableauxRef, {
      ...tableauxData,
      projectId,
      ownerId,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    stats.tableauxCreated++
    stats.totalDocuments++
    console.log(`  ✅ Tableaux financiers migrated`)
    return true
  } catch (error: any) {
    const errorMsg = `Failed to migrate tableaux financiers: ${error.message}`
    stats.errors.push(errorMsg)
    console.error(`  ❌ ${errorMsg}`)
    return false
  }
}

/**
 * Migrate analyse financiere to dedicated collection
 */
async function migrateAnalyseFinanciere(
  projectId: string,
  analyseData: any,
  ownerId: string
): Promise<boolean> {
  if (!analyseData || Object.keys(analyseData).length === 0) {
    return false
  }

  try {
    // Use projectId as docId (new architecture)
    const analyseRef = doc(db, 'analysesFinancieresHistoriques', projectId)
    await setDoc(analyseRef, {
      ...analyseData,
      projectId,
      ownerId,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    stats.analysesCreated++
    stats.totalDocuments++
    console.log(`  ✅ Analyse financière migrated`)
    return true
  } catch (error: any) {
    const errorMsg = `Failed to migrate analyse financiere: ${error.message}`
    stats.errors.push(errorMsg)
    console.error(`  ❌ ${errorMsg}`)
    return false
  }
}

/**
 * Migrate relations bancaires to dedicated collection
 */
async function migrateRelationsBancaires(
  projectId: string,
  relationsData: any,
  ownerId: string
): Promise<boolean> {
  if (!relationsData || Object.keys(relationsData).length === 0) {
    return false
  }

  try {
    // Use projectId as docId (new architecture)
    const relationsRef = doc(db, 'relationsBancaires', projectId)
    await setDoc(relationsRef, {
      ...relationsData,
      projectId,
      ownerId,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    stats.relationsCreated++
    stats.totalDocuments++
    console.log(`  ✅ Relations bancaires migrated`)
    return true
  } catch (error: any) {
    const errorMsg = `Failed to migrate relations bancaires: ${error.message}`
    stats.errors.push(errorMsg)
    console.error(`  ❌ ${errorMsg}`)
    return false
  }
}

/**
 * Migrate analyse rentabilité (VAN/TRI/DRCI) to dedicated collection
 */
async function migrateAnalyseRentabilite(
  projectId: string,
  rentabiliteData: any,
  ownerId: string
): Promise<boolean> {
  if (!rentabiliteData || Object.keys(rentabiliteData).length === 0) {
    return false
  }

  try {
    // Use projectId as docId (new architecture)
    const rentabiliteRef = doc(db, 'analyseRentabilite', projectId)
    await setDoc(rentabiliteRef, {
      ...rentabiliteData,
      projectId,
      ownerId,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    stats.rentabiliteCreated++
    stats.totalDocuments++
    console.log(`  ✅ Analyse rentabilité migrated`)
    return true
  } catch (error: any) {
    const errorMsg = `Failed to migrate analyse rentabilite: ${error.message}`
    stats.errors.push(errorMsg)
    console.error(`  ❌ ${errorMsg}`)
    return false
  }
}

/**
 * Migrate fiche synoptique to dedicated collection
 */
async function migrateFicheSynoptique(
  projectId: string,
  ficheData: any,
  ownerId: string
): Promise<boolean> {
  if (!ficheData || Object.keys(ficheData).length === 0) {
    return false
  }

  try {
    const ficheRef = doc(db, 'fichesSynoptiques', projectId)
    await setDoc(ficheRef, {
      ...ficheData,
      projectId,
      ownerId,
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    stats.ficheCreated++
    stats.totalDocuments++
    console.log(`  ✅ Fiche synoptique migrated`)
    return true
  } catch (error: any) {
    const errorMsg = `Failed to migrate fiche synoptique: ${error.message}`
    stats.errors.push(errorMsg)
    console.error(`  ❌ ${errorMsg}`)
    return false
  }
}

/**
 * Main migration function
 */
async function migrateProject(projectId: string): Promise<void> {
  console.log(`\n🚀 Starting migration for project: ${projectId}\n`)

  try {
    // 1. Authenticate user
    console.log('🔐 Authentication required...\n')
    const { email, password } = await promptCredentials()

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log(`✅ Authenticated as: ${email}\n`)
    } catch (authError: any) {
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    // 2. Load old project document
    const projectRef = doc(db, 'projects', projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      throw new Error(`Project ${projectId} not found in Firestore`)
    }

    const projectData = projectSnap.data()
    if (!projectData) {
      throw new Error('Project data is empty')
    }

    const ownerId = projectData.ownerId || projectData.userId

    if (!ownerId) {
      throw new Error('Project has no ownerId or userId field')
    }

    console.log(`📦 Project loaded: ${projectData.basicInfo?.name || 'Unnamed Project'}`)
    console.log(`👤 Owner ID: ${ownerId}\n`)

    // 3. Migrate sections from data.sections
    console.log('📂 Migrating sections...')
    const sections = projectData.sections || {}

    const sectionMappings: { [key: string]: string } = {
      executiveSummary: 'executiveSummary',
      companyIdentification: 'companyIdentification',
      marketStudy: 'marketStudy',
      swotAnalysis: 'swotAnalysis',
      marketingPlan: 'marketingPlan',
      humanResources: 'humanResources',
      productionPlan: 'productionPlan',
      legalStructure: 'legalStructure',
      financialPlan: 'financialPlan',
      risks: 'risks',
      timeline: 'timeline',
      appendices: 'appendices'
    }

    for (const [oldKey, newKey] of Object.entries(sectionMappings)) {
      if (sections[oldKey]) {
        await migrateSection(projectId, newKey, sections[oldKey], ownerId)
      }
    }

    // 4. Migrate sections from data.businessPlan
    console.log('\n📂 Migrating businessPlan sections...')
    const businessPlan = projectData.businessPlan || {}

    if (businessPlan.swotAnalysis) {
      await migrateSection(projectId, 'swotAnalysis', businessPlan.swotAnalysis, ownerId)
    }
    if (businessPlan.marketingPlan) {
      await migrateSection(projectId, 'marketingPlan', businessPlan.marketingPlan, ownerId)
    }
    if (businessPlan.humanResources) {
      await migrateSection(projectId, 'humanResources', businessPlan.humanResources, ownerId)
    }
    if (businessPlan.financialPlan) {
      await migrateSection(projectId, 'financialPlan', businessPlan.financialPlan, ownerId)
    }

    // 5. Migrate financial data
    console.log('\n💰 Migrating financial collections...')

    // Tableaux financiers (from sections.financialEngine or financialEngine)
    const tableauxData = projectData.sections?.financialEngine ||
                         projectData.financialEngine ||
                         projectData.sections?.tableauxFinanciers
    if (tableauxData) {
      await migrateTableauxFinanciers(projectId, tableauxData, ownerId)
    }

    // Analyse financière (from businessPlan.financialAnalysis)
    const analyseData = businessPlan.financialAnalysis || projectData.sections?.analyseFinanciere
    if (analyseData) {
      await migrateAnalyseFinanciere(projectId, analyseData, ownerId)
    }

    // Relations bancaires
    const relationsData = projectData.sections?.relationsBancaires ||
                          businessPlan.relationsBancaires
    if (relationsData) {
      await migrateRelationsBancaires(projectId, relationsData, ownerId)
    }

    // Analyse rentabilité (VAN/TRI/DRCI)
    const rentabiliteData = projectData.sections?.analyseRentabilite ||
                            projectData.sections?.rentabilite ||
                            businessPlan.analyseRentabilite
    if (rentabiliteData) {
      await migrateAnalyseRentabilite(projectId, rentabiliteData, ownerId)
    }

    // 6. Fiche synoptique (if exists)
    const ficheData = projectData.ficheSynoptique || sections.ficheSynoptique
    if (ficheData) {
      await migrateFicheSynoptique(projectId, ficheData, ownerId)
    }

    // 7. Display summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ MIGRATION TERMINÉE')
    console.log('='.repeat(60))
    console.log(`📊 Résumé :`)
    console.log(`  • Sections créées       : ${stats.sectionsCreated}`)
    console.log(`  • Tableaux financiers   : ${stats.tableauxCreated}`)
    console.log(`  • Analyses financières  : ${stats.analysesCreated}`)
    console.log(`  • Relations bancaires   : ${stats.relationsCreated}`)
    console.log(`  • Fiches synoptiques    : ${stats.ficheCreated}`)
    console.log(`  • Analyses rentabilité  : ${stats.rentabiliteCreated}`)
    console.log(`  • Documents totaux      : ${stats.totalDocuments}`)

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Erreurs rencontrées : ${stats.errors.length}`)
      stats.errors.forEach(err => console.log(`  ❌ ${err}`))
    }

    console.log('\n✨ Les données de l\'ancien projet ont été copiées dans les sous-collections.')
    console.log('   Le document principal reste inchangé pour compatibilité.')
    console.log('='.repeat(60) + '\n')

  } catch (error: any) {
    console.error('\n❌ MIGRATION FAILED')
    console.error(`Error: ${error.message}`)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// CLI Entry Point
const projectId = process.argv[2]

if (!projectId) {
  console.error('\n❌ Usage: npx tsx scripts/migrateOldProject.ts <projectId>')
  console.error('   Example: npx tsx scripts/migrateOldProject.ts 0IDBKsYQhdUtJtXhBAtf\n')
  process.exit(1)
}

// Run migration
migrateProject(projectId)
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })
