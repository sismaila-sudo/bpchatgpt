import { FastifyPluginAsync } from 'fastify'
import { getSupabaseClient } from '@/services/supabase'

export const simpleCalcRoutes: FastifyPluginAsync = async (fastify) => {
  // Calculer les projections financières (version simplifiée)
  fastify.post('/calculate', async (request, reply) => {
    try {
      const { project_id, scenario_id } = request.body as { project_id: string, scenario_id?: string }

      if (!project_id) {
        return reply.status(400).send({ error: 'project_id requis' })
      }

      const supabase = getSupabaseClient()

      console.log('DEBUG: Recherche du projet avec ID:', project_id)

      // Récupérer le projet
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single()

      console.log('DEBUG: Résultat requête projet:')
      console.log('- Data:', project)
      console.log('- Error:', projectError)

      if (projectError || !project) {
        console.log('DEBUG: Projet non trouvé, erreur:', projectError)
        return reply.status(404).send({
          error: 'Projet non trouvé',
          debug: {
            project_id,
            supabase_error: projectError
          }
        })
      }

      // Récupérer les produits
      const { data: products, error: productsError } = await supabase
        .from('products_services')
        .select('*')
        .eq('project_id', project_id)

      if (productsError) {
        throw productsError
      }

      // Récupérer les projections de ventes
      const { data: salesProjections, error: salesError } = await supabase
        .from('sales_projections')
        .select('*')
        .eq('project_id', project_id)

      if (salesError) {
        throw salesError
      }

      // Récupérer OPEX
      const { data: opexItems, error: opexError } = await supabase
        .from('opex')
        .select('*')
        .eq('project_id', project_id)

      if (opexError) {
        throw opexError
      }

      // Récupérer CAPEX
      const { data: capexItems, error: capexError } = await supabase
        .from('capex')
        .select('*')
        .eq('project_id', project_id)

      if (capexError) {
        throw capexError
      }

      // Récupérer les financements
      const { data: loanItems, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('project_id', project_id)

      if (loanError) {
        throw loanError
      }

      // Récupérer le scénario si spécifié
      let scenario = null
      if (scenario_id) {
        const { data: scenarioData, error: scenarioError } = await supabase
          .from('scenarios')
          .select('*')
          .eq('id', scenario_id)
          .eq('project_id', project_id)
          .single()

        if (scenarioError) {
          console.log('Erreur récupération scénario:', scenarioError)
        } else {
          scenario = scenarioData
        }
      }

      // Facteurs de scénario (par défaut = 1.0)
      const scenarioFactors = scenario ? {
        revenue_factor: scenario.revenue_factor || 1.0,
        cost_factor: scenario.cost_factor || 1.0,
        opex_factor: scenario.opex_factor || 1.0,
        capex_factor: scenario.capex_factor || 1.0
      } : {
        revenue_factor: 1.0,
        cost_factor: 1.0,
        opex_factor: 1.0,
        capex_factor: 1.0
      }

      // Debug : afficher les données récupérées
      console.log('=== DONNÉES RÉCUPÉRÉES ===')
      console.log('Produits trouvés:', products?.length || 0)
      console.log('Projections de ventes:', salesProjections?.length || 0)
      console.log('OPEX items:', opexItems?.length || 0, opexItems?.map(o => `${o.name}: ${o.amount} ${o.frequency}`))
      console.log('CAPEX items:', capexItems?.length || 0, capexItems?.map(c => `${c.name}: ${c.amount}`))

      // Validation
      if (!products || products.length === 0) {
        return reply.status(400).send({
          error: 'Aucun produit défini',
          message: 'Vous devez d\'abord créer des produits/services'
        })
      }

      if (!salesProjections || salesProjections.length === 0) {
        return reply.status(400).send({
          error: 'Aucune projection de ventes',
          message: 'Vous devez d\'abord créer des projections de ventes'
        })
      }

      // Calculer les résultats financiers mensuels
      const startYear = new Date(project.start_date).getFullYear()
      const financialOutputs = []

      for (let year = startYear; year < startYear + project.horizon_years; year++) {
        for (let month = 1; month <= 12; month++) {
          let monthlyRevenue = 0
          let monthlyCogs = 0

          // Calculer pour chaque produit
          for (const product of products) {
            const projection = salesProjections.find(p =>
              p.product_id === product.id && p.year === year && p.month === month
            )

            if (projection && projection.volume > 0) {
              const revenue = projection.volume * product.unit_price * scenarioFactors.revenue_factor
              const cogs = projection.volume * product.unit_cost * scenarioFactors.cost_factor

              monthlyRevenue += revenue
              monthlyCogs += cogs
            }
          }

          // Calculer OPEX mensuel
          let monthlyOpex = 0
          for (const opex of (opexItems || [])) {
            if (opex.start_year <= year) {
              switch (opex.frequency) {
                case 'monthly':
                  monthlyOpex += opex.amount * scenarioFactors.opex_factor
                  break
                case 'quarterly':
                  if ([1, 4, 7, 10].includes(month)) {
                    monthlyOpex += opex.amount * scenarioFactors.opex_factor
                  }
                  break
                case 'yearly':
                  if (month === 1) {
                    monthlyOpex += opex.amount * scenarioFactors.opex_factor
                  }
                  break
              }
            }
          }

          // Calculer amortissements mensuels
          let monthlyDepreciation = 0
          for (const capex of (capexItems || [])) {
            if (capex.purchase_year <= year) {
              const yearsElapsed = year - capex.purchase_year
              if (yearsElapsed < capex.depreciation_years) {
                const adjustedCapexAmount = capex.amount * scenarioFactors.capex_factor
                monthlyDepreciation += (adjustedCapexAmount - capex.residual_value) / (capex.depreciation_years * 12)
              }
            }
          }

          const grossMargin = monthlyRevenue - monthlyCogs
          const grossMarginPercent = monthlyRevenue > 0 ? (grossMargin / monthlyRevenue) * 100 : 0
          // Calculer les remboursements d'emprunts
          let monthlyLoanPayments = 0
          for (const loan of (loanItems || [])) {
            const loanStartDate = new Date(loan.start_year, loan.start_month - 1)
            const currentDate = new Date(year, month - 1)
            const graceEndDate = new Date(loan.start_year, loan.start_month - 1 + loan.grace_period_months)

            if (currentDate >= graceEndDate) {
              const monthsFromStart = (year - loan.start_year) * 12 + (month - loan.start_month) - loan.grace_period_months
              if (monthsFromStart >= 0 && monthsFromStart < loan.duration_months) {
                // Calcul de la mensualité
                const monthlyRate = loan.interest_rate / 100 / 12
                if (monthlyRate > 0) {
                  const monthlyPayment = loan.principal_amount *
                    (monthlyRate * Math.pow(1 + monthlyRate, loan.duration_months)) /
                    (Math.pow(1 + monthlyRate, loan.duration_months) - 1)
                  monthlyLoanPayments += monthlyPayment
                } else {
                  monthlyLoanPayments += loan.principal_amount / loan.duration_months
                }
              }
            }
          }

          const ebitda = grossMargin - monthlyOpex
          const ebit = ebitda - monthlyDepreciation
          const netIncome = ebit // Pas d'impôts pour simplifier
          const cashFlow = netIncome + monthlyDepreciation - monthlyLoanPayments

          // Log des calculs pour le premier mois comme exemple
          if (year === startYear && month === 1) {
            console.log(`=== CALCULS ${month}/${year} ===`)
            console.log('Revenue:', monthlyRevenue)
            console.log('COGS:', monthlyCogs)
            console.log('Gross Margin:', grossMargin)
            console.log('OPEX:', monthlyOpex)
            console.log('Depreciation:', monthlyDepreciation)
            console.log('EBITDA:', ebitda)
            console.log('EBIT:', ebit)
            console.log('Net Income:', netIncome)
            console.log('Loan Payments:', monthlyLoanPayments)
            console.log('Cash Flow:', cashFlow)
          }

          financialOutputs.push({
            project_id,
            scenario_id: scenario_id || null,
            year,
            month,
            revenue: Math.round(monthlyRevenue),
            cogs: Math.round(monthlyCogs),
            gross_margin: Math.round(grossMargin),
            gross_margin_percent: Math.round(grossMarginPercent * 100) / 100,
            total_opex: Math.round(monthlyOpex),
            depreciation: Math.round(monthlyDepreciation),
            ebitda: Math.round(ebitda),
            ebit: Math.round(ebit),
            net_income: Math.round(netIncome),
            loan_payments: Math.round(monthlyLoanPayments),
            cash_flow: Math.round(cashFlow)
          })
        }
      }

      // Supprimer les anciens calculs pour ce projet et scénario
      let deleteQuery = supabase
        .from('financial_outputs')
        .delete()
        .eq('project_id', project_id)

      if (scenario_id) {
        deleteQuery = deleteQuery.eq('scenario_id', scenario_id)
      } else {
        deleteQuery = deleteQuery.is('scenario_id', null)
      }

      const { error: deleteError } = await deleteQuery
      if (deleteError) {
        console.log('Erreur suppression données précédentes:', deleteError)
        // Continue anyway car la table peut être vide
      }

      // Insérer les nouveaux calculs
      const { data: insertedData, error: insertError } = await supabase
        .from('financial_outputs')
        .insert(financialOutputs)
        .select()

      if (insertError) {
        console.log('Erreur insertion:', insertError)
        throw insertError
      }

      // Calculer un résumé
      const totalRevenue = financialOutputs.reduce((sum, row) => sum + row.revenue, 0)
      const totalCogs = financialOutputs.reduce((sum, row) => sum + row.cogs, 0)
      const totalOpex = financialOutputs.reduce((sum, row) => sum + row.total_opex, 0)
      const totalDepreciation = financialOutputs.reduce((sum, row) => sum + row.depreciation, 0)
      const totalNetIncome = financialOutputs.reduce((sum, row) => sum + row.net_income, 0)
      const totalCashFlow = financialOutputs.reduce((sum, row) => sum + row.cash_flow, 0)

      const grossMargin = totalRevenue - totalCogs
      const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0
      const netMarginPercent = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0

      // Debug du résumé
      console.log(`=== RÉSUMÉ FINANCIER ${scenario_id ? '(Scénario)' : '(Base)'} ===`)
      console.log('CA Total:', totalRevenue)
      console.log('COGS Total:', totalCogs)
      console.log('OPEX Total:', totalOpex)
      console.log('Amortissements Total:', totalDepreciation)
      console.log('Résultat Net:', totalNetIncome)
      console.log('Marge Nette %:', netMarginPercent.toFixed(1))

      return {
        success: true,
        message: 'Calculs terminés avec succès',
        summary: {
          months_calculated: financialOutputs.length,
          total_revenue: totalRevenue,
          total_cogs: totalCogs,
          gross_margin: grossMargin,
          total_opex: totalOpex,
          total_depreciation: totalDepreciation,
          net_income: totalNetIncome,
          cash_flow: totalCashFlow,
          gross_margin_percent: Math.round(grossMarginPercent * 100) / 100,
          net_margin_percent: Math.round(netMarginPercent * 100) / 100,
          avg_monthly_revenue: Math.round(totalRevenue / financialOutputs.length),
          avg_monthly_opex: Math.round(totalOpex / financialOutputs.length),
          avg_monthly_depreciation: Math.round(totalDepreciation / financialOutputs.length),
          profitability: totalNetIncome > 0 ? 'Rentable' : 'Non rentable',
          break_even: totalNetIncome > 0 ? 'Atteint' : 'Non atteint'
        }
      }

    } catch (error) {
      fastify.log.error('Erreur calcul:', error)
      return reply.status(500).send({
        error: 'Échec du calcul',
        message: error.message || 'Une erreur est survenue'
      })
    }
  })
}