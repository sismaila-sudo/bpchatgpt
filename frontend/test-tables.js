// Test de vérification des tables nécessaires
const { createBrowserClient } = require('@supabase/ssr')

const SUPABASE_URL = 'https://nddimpfyofoopjnroswf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZGltcGZ5b2Zvb3BqbnJvc3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzk3NjcsImV4cCI6MjA3MzYxNTc2N30.iT4YioB3clcSfGuzHeS7Jkg86D-x2d8xvgHREPZdLyk'

async function testTables() {
  console.log('🔍 Vérification des tables...')

  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const tablesToTest = [
    'projects',
    'products_services',
    'business_plan_sections',
    'uploaded_documents',
    'project_owners'
  ]

  for (const tableName of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Table "${tableName}" n'existe pas`)
        } else {
          console.log(`⚠️  Table "${tableName}" - Erreur: ${error.message}`)
        }
      } else {
        console.log(`✅ Table "${tableName}" existe`)
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}" - Erreur: ${err.message}`)
    }
  }

  console.log('\n🎯 Tables à créer si nécessaires:')
  console.log('   - project_owners: Exécuter create-project-owner-table.sql')
  console.log('   - Si business_plan_sections ou uploaded_documents manquent: create-tables.sql')
}

testTables()