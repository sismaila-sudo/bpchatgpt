import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { project_id } = await request.json()

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    console.log('🔄 API Calculate - Project ID:', project_id)

    // 1. Récupérer les données source + info projet + OPEX réels
    const [productsResult, projectionsResult, projectResult, opexResult] = await Promise.all([
      supabase
        .from('products_services')
        .select('*')
        .eq('project_id', project_id),
      supabase
        .from('sales_projections')
        .select('*')
        .eq('project_id', project_id)
        .order('year, month'),
      supabase
        .from('projects')
        .select('start_date')
        .eq('id', project_id)
        .single(),
      supabase
        .from('opex')
        .select('*')
        .eq('project_id', project_id)
    ])

    if (productsResult.error) throw productsResult.error
    if (projectionsResult.error) throw projectionsResult.error
    if (projectResult.error) throw projectResult.error
    if (opexResult.error) throw opexResult.error

    const products = productsResult.data || []
    const allProjections = projectionsResult.data || []
    const project = projectResult.data
    const opexItems = opexResult.data || []

    // 2. Filtrer les projections selon la date de démarrage (comme SalesTab)
    const projectStartDate = new Date(project.start_date)
    const projections = allProjections.filter(proj => {
      const projDate = new Date(proj.year, proj.month - 1, 1)
      return projDate >= projectStartDate
    })

    console.log(`- Projections totales: ${allProjections.length}`)
    console.log(`- Projections filtrées après ${project.start_date}: ${projections.length}`)

    console.log('- Produits:', products.length)
    console.log('- Projections:', projections.length)
    console.log('- OPEX configurés:', opexItems.length)

    // Fonction helper pour calculer les OPEX d'un mois donné
    const calculateMonthlyOpex = (year: number, month: number) => {
      let totalOpex = 0
      const opexBreakdown = {
        personnel: 0,
        location: 0,
        marketing: 0,
        frais_generaux: 0,
        autres: 0
      }

      opexItems.forEach(opex => {
        // Vérifier si cette charge est active à cette date
        const opexStartDate = new Date(opex.start_year, opex.start_month - 1, 1)
        const currentDate = new Date(year, month - 1, 1)

        if (currentDate >= opexStartDate) {
          let monthlyAmount = 0

          if (opex.frequency === 'monthly') {
            monthlyAmount = opex.amount
          } else if (opex.frequency === 'yearly') {
            monthlyAmount = opex.amount / 12
          } else if (opex.frequency === 'quarterly') {
            monthlyAmount = opex.amount / 3
          }

          totalOpex += monthlyAmount

          // Ventilation par catégorie
          switch (opex.category) {
            case 'personnel':
              opexBreakdown.personnel += monthlyAmount
              break
            case 'location':
              opexBreakdown.location += monthlyAmount
              break
            case 'marketing':
              opexBreakdown.marketing += monthlyAmount
              break
            case 'frais_generaux':
              opexBreakdown.frais_generaux += monthlyAmount
              break
            default:
              opexBreakdown.autres += monthlyAmount
          }
        }
      })

      return { totalOpex, opexBreakdown }
    }

    if (products.length === 0) {
      return NextResponse.json({
        error: 'Aucun produit trouvé',
        message: 'Veuillez d\'abord ajouter des produits dans l\'onglet Données Financières'
      }, { status: 400 })
    }

    if (projections.length === 0) {
      return NextResponse.json({
        error: 'Aucune projection trouvée',
        message: 'Veuillez d\'abord ajouter des projections de vente'
      }, { status: 400 })
    }

    // 3. Supprimer les anciens calculs
    const { error: deleteError } = await supabase
      .from('financial_outputs')
      .delete()
      .eq('project_id', project_id)

    if (deleteError) throw deleteError

    // 4. Calculer EXACTEMENT comme le récapitulatif SalesTab
    console.log('🔍 Calcul détaillé par projection:')

    const financialRecords = []
    let totalCalculatedRevenue = 0

    // Calculer DIRECTEMENT depuis CHAQUE projection individuelle
    const monthlyRevenues: { [key: string]: number } = {}

    projections.forEach((proj: any) => {
      const product = products.find(p => p.id === proj.product_id)
      if (product && proj.volume > 0) {
        const revenue = proj.volume * product.unit_price
        totalCalculatedRevenue += revenue

        const key = `${proj.year}-${proj.month}`
        if (!monthlyRevenues[key]) monthlyRevenues[key] = 0
        monthlyRevenues[key] += revenue

        console.log(`${product.name} ${proj.year}-${proj.month}: ${proj.volume} x ${product.unit_price} = ${revenue}`)
      }
    })

    console.log(`Total calculé: ${totalCalculatedRevenue}`)

    // Grouper par mois pour financial_outputs
    const monthlyData: { [key: string]: any } = {}
    projections.forEach(proj => {
      const key = `${proj.year}-${proj.month}`
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: proj.year,
          month: proj.month,
          revenue: monthlyRevenues[key] || 0
        }
      }
    })

    // Créer les records financial_outputs
    for (const [key, monthData] of Object.entries(monthlyData)) {
      const monthlyRevenue = monthData.revenue

      // Calculs dérivés corrects
      const monthlyCOGS = monthlyRevenue * 0.4 // 40% du CA
      const grossMargin = monthlyRevenue - monthlyCOGS
      const grossMarginPercent = monthlyRevenue > 0 ? (grossMargin / monthlyRevenue) * 100 : 0

      // OPEX mensuels (calculés depuis les données réelles)
      const opexData = calculateMonthlyOpex(monthData.year, monthData.month)
      const monthlyOpex = opexData.totalOpex

      const ebitda = grossMargin - monthlyOpex
      const depreciation = 500000 // 500K par mois
      const ebit = ebitda - depreciation
      const netIncome = ebit
      const cashFlow = netIncome + depreciation

      const record = {
        project_id,
        year: monthData.year,
        month: monthData.month,
        revenue: monthlyRevenue,
        cogs: monthlyCOGS,
        gross_margin: grossMargin,
        gross_margin_percent: grossMarginPercent,
        opex_personnel: opexData.opexBreakdown.personnel,
        opex_location: opexData.opexBreakdown.location,
        opex_marketing: opexData.opexBreakdown.marketing,
        opex_frais_generaux: opexData.opexBreakdown.frais_generaux,
        opex_autres: opexData.opexBreakdown.autres,
        total_opex: monthlyOpex,
        depreciation,
        ebitda,
        ebit,
        net_income: netIncome,
        cash_flow: cashFlow,
        cumulative_cash_flow: 0,
        cash_balance: 0,
        scenario_id: null,
        loan_payments: 0,
        created_at: new Date().toISOString()
      }

      financialRecords.push(record)
    }

    // 5. Insérer les nouveaux calculs
    const { error: insertError } = await supabase
      .from('financial_outputs')
      .insert(financialRecords)

    if (insertError) throw insertError

    console.log(`✅ ${financialRecords.length} records calculés et insérés`)
    console.log(`CA Total: ${totalCalculatedRevenue.toLocaleString()}`)

    // 6. Retourner le résumé
    const totalNetIncome = financialRecords.reduce((sum, r) => sum + r.net_income, 0)
    const marginPercent = totalCalculatedRevenue > 0 ? (totalNetIncome / totalCalculatedRevenue) * 100 : 0

    return NextResponse.json({
      success: true,
      message: 'Calculs terminés avec succès',
      summary: {
        total_revenue: totalCalculatedRevenue,
        total_net_income: totalNetIncome,
        margin_percent: marginPercent,
        periods_calculated: financialRecords.length
      }
    })

  } catch (error) {
    console.error('Erreur API Calculate:', error)
    return NextResponse.json({
      error: 'Erreur lors du calcul',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}