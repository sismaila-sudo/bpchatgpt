// Script pour créer les tables manquantes dans Supabase
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://nddimpfyofoopjnroswf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZGltcGZ5b2Zvb3BqbnJvc3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzk3NjcsImV4cCI6MjA3MzYxNTc2N30.iT4YioB3clcSfGuzHeS7Jkg86D-x2d8xvgHREPZdLyk'

async function createTables() {
  console.log('🔨 Création des tables manquantes...')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Note: Avec la clé ANON, on ne peut pas créer de tables directement
    // Il faut utiliser la console Supabase ou la clé SERVICE
    console.log('⚠️  Les tables doivent être créées via la console Supabase')
    console.log('📋 Tables à créer:')
    console.log('   1. business_plan_sections')
    console.log('   2. uploaded_documents')

    console.log('\n📝 Instructions:')
    console.log('1. Aller sur https://supabase.com/dashboard')
    console.log('2. Sélectionner le projet nddimpfyofoopjnroswf')
    console.log('3. Aller dans SQL Editor')
    console.log('4. Exécuter le contenu du fichier create-tables.sql')

    // Test si les tables existent déjà
    console.log('\n🔍 Vérification des tables existantes...')

    try {
      const { data, error } = await supabase
        .from('business_plan_sections')
        .select('id')
        .limit(1)

      if (error && error.code === 'PGRST116') {
        console.log('❌ Table business_plan_sections n\'existe pas')
      } else {
        console.log('✅ Table business_plan_sections existe')
      }
    } catch (err) {
      console.log('❌ Table business_plan_sections n\'existe pas')
    }

    try {
      const { data, error } = await supabase
        .from('uploaded_documents')
        .select('id')
        .limit(1)

      if (error && error.code === 'PGRST116') {
        console.log('❌ Table uploaded_documents n\'existe pas')
      } else {
        console.log('✅ Table uploaded_documents existe')
      }
    } catch (err) {
      console.log('❌ Table uploaded_documents n\'existe pas')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

createTables()