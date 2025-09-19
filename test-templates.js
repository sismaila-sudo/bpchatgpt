const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://nddimpfyofoopjnroswf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZGltcGZ5b2Zvb3BqbnJvc3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzOTc2NywiZXhwIjoyMDczNjE1NzY3fQ.SF6tlQBLdtHUFZhPBri5Ha4bwOC7zDO51iJpKZprGPU'
)

async function testTemplates() {
  console.log('🔍 Test des templates...')

  // Vérifier les templates
  const { data: templates, error } = await supabase
    .from('document_templates')
    .select('*')

  if (error) {
    console.error('❌ Erreur:', error)
    return
  }

  console.log(`✅ ${templates.length} templates trouvés:`)
  templates.forEach(t => {
    console.log(`  - ${t.name} (${t.sector}, ${t.mode})`)
  })
}

testTemplates().catch(console.error)