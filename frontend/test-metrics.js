// Test de récupération des métriques projet
const { createBrowserClient } = require('@supabase/ssr')

// Configuration
const SUPABASE_URL = 'https://nddimpfyofoopjnroswf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZGltcGZ5b2Zvb3BqbnJvc3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzk3NjcsImV4cCI6MjA3MzYxNTc2N30.iT4YioB3clcSfGuzHeS7Jkg86D-x2d8xvgHREPZdLyk'
const API_URL = 'http://localhost:3003'
const PROJECT_ID = '33436a00-3077-4a4e-922f-ea052e7c605e'

async function testMetrics() {
  console.log('🔍 Test de récupération des métriques...')

  try {
    // 1. Test connexion Supabase
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    console.log('📊 1. Test récupération projet...')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', PROJECT_ID)
      .single()

    if (projectError) {
      console.error('❌ Erreur projet:', projectError)
      return
    }

    console.log('✅ Projet trouvé:', project.name, '- Secteur:', project.sector)

    // 2. Test récupération produits
    console.log('\n📦 2. Test récupération produits...')
    const { data: products, error: productsError } = await supabase
      .from('products_services')
      .select('*')
      .eq('project_id', PROJECT_ID)

    if (productsError) {
      console.error('❌ Erreur produits:', productsError)
      return
    }

    console.log('✅ Produits trouvés:', products?.length, 'produits')
    if (products?.length > 0) {
      console.log('   - Premier produit:', products[0].name)
    }

    // 3. Test API Backend
    console.log('\n🔄 3. Test API Backend...')
    const response = await fetch(`${API_URL}/api/calculations/status/${PROJECT_ID}`, {
      headers: { 'Authorization': 'Bearer temp-token' }
    })

    if (!response.ok) {
      console.error('❌ Erreur API:', response.status, response.statusText)
      return
    }

    const financialData = await response.json()
    console.log('✅ Données financières récupérées:')
    console.log('   - CA Total:', financialData.summary?.total_revenue?.toLocaleString(), 'XOF')
    console.log('   - Bénéfice:', financialData.summary?.total_profit?.toLocaleString(), 'XOF')
    console.log('   - Mois calculés:', financialData.summary?.months_calculated)

    // 4. Test CAPEX
    console.log('\n💰 4. Test récupération CAPEX...')
    const { data: capex, error: capexError } = await supabase
      .from('capex')
      .select('amount')
      .eq('project_id', PROJECT_ID)

    if (capexError) {
      console.error('❌ Erreur CAPEX:', capexError)
    } else {
      const totalInvestment = capex?.reduce((sum, item) => sum + item.amount, 0) || 0
      console.log('✅ CAPEX Total:', totalInvestment.toLocaleString(), 'XOF')
    }

    // 5. Construction des métriques
    console.log('\n📈 5. Construction des métriques finales...')
    const metrics = {
      total_revenue: financialData.summary?.total_revenue || 0,
      total_profit: financialData.summary?.total_profit || 0,
      profit_margin: financialData.summary?.total_profit && financialData.summary?.total_revenue
        ? (financialData.summary.total_profit / financialData.summary.total_revenue) * 100
        : 0,
      break_even_month: financialData.summary?.break_even_month,
      investment_total: capex?.reduce((sum, item) => sum + item.amount, 0) || 0,
      financing_need: financialData.summary?.financing_need || 0,
      products_count: products?.length || 0,
      main_product: products?.[0]?.name || 'Produit principal',
      target_market: 'Marché local et régional',
      sector: project.sector,
      team_size: 5,
      van: 1500000,
      tri: 25.5,
      dscr: 1.8,
      roi: 22.3
    }

    console.log('🎉 Métriques construites avec succès !')
    console.log('   - Secteur:', metrics.sector)
    console.log('   - Produit principal:', metrics.main_product)
    console.log('   - CA:', metrics.total_revenue.toLocaleString(), 'XOF')
    console.log('   - Marge:', metrics.profit_margin.toFixed(1), '%')
    console.log('   - Nombre de produits:', metrics.products_count)

  } catch (error) {
    console.error('❌ Erreur globale:', error.message)
  }
}

testMetrics()