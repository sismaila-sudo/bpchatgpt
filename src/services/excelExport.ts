import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ProjectData {
  project: any
  products: any[]
  salesProjections: any[]
  opexItems: any[]
  capexItems: any[]
  financialOutputs: any[]
  scenarios?: any[]
  loans?: any[]
}

export class ExcelExportService {
  static async exportBusinessPlan(data: ProjectData) {
    const { project, products, salesProjections, opexItems, capexItems, financialOutputs, scenarios, loans } = data

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()

    // 1. Feuille Projet
    const projectSheet = XLSX.utils.json_to_sheet([
      {
        'Nom du projet': project.name,
        'Secteur': project.sector,
        'Date de début': project.start_date,
        'Horizon (années)': project.horizon_years,
        'Date de création': new Date(project.created_at).toLocaleDateString('fr-FR')
      }
    ])
    XLSX.utils.book_append_sheet(workbook, projectSheet, 'Projet')

    // 2. Feuille Produits/Services
    if (products.length > 0) {
      const productsData = products.map(product => ({
        'Nom': product.name,
        'Catégorie': product.category || 'product',
        'Prix unitaire': product.unit_price,
        'Coût unitaire': product.unit_cost,
        'Marge unitaire': product.unit_price - product.unit_cost,
        'Marge %': ((product.unit_price - product.unit_cost) / product.unit_price * 100).toFixed(1) + '%',
        'Unité': product.unit
      }))

      const productsSheet = XLSX.utils.json_to_sheet(productsData)
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produits-Services')
    }

    // 3. Feuille Projections de ventes
    if (salesProjections.length > 0) {
      const salesData = salesProjections.map(projection => {
        const product = products.find(p => p.id === projection.product_id)
        return {
          'Produit': product?.name || 'Inconnu',
          'Année': projection.year,
          'Mois': projection.month,
          'Volume': projection.volume,
          'Prix unitaire': product?.unit_price || 0,
          'Chiffre d\'affaires': projection.volume * (product?.unit_price || 0)
        }
      })

      const salesSheet = XLSX.utils.json_to_sheet(salesData)
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Projections Ventes')
    }

    // 4. Feuille OPEX
    if (opexItems.length > 0) {
      const opexData = opexItems.map(opex => ({
        'Nom': opex.name,
        'Catégorie': opex.category,
        'Montant': opex.amount,
        'Fréquence': opex.frequency,
        'Année de début': opex.start_year,
        'Équivalent mensuel': this.calculateMonthlyEquivalent(opex.amount, opex.frequency),
        'Impact annuel': this.calculateMonthlyEquivalent(opex.amount, opex.frequency) * 12,
        'Description': opex.description
      }))

      const opexSheet = XLSX.utils.json_to_sheet(opexData)
      XLSX.utils.book_append_sheet(workbook, opexSheet, 'OPEX')
    }

    // 5. Feuille CAPEX
    if (capexItems.length > 0) {
      const capexData = capexItems.map(capex => ({
        'Nom': capex.name,
        'Catégorie': capex.category,
        'Montant': capex.amount,
        'Année d\'achat': capex.purchase_year,
        'Mois d\'achat': capex.purchase_month,
        'Durée amortissement': capex.depreciation_years + ' ans',
        'Valeur résiduelle': capex.residual_value,
        'Amortissement mensuel': (capex.amount - capex.residual_value) / (capex.depreciation_years * 12),
        'Description': capex.description
      }))

      const capexSheet = XLSX.utils.json_to_sheet(capexData)
      XLSX.utils.book_append_sheet(workbook, capexSheet, 'CAPEX')
    }

    // 6. Feuille Scénarios
    if (scenarios && scenarios.length > 0) {
      const scenariosData = scenarios.map(scenario => ({
        'Nom': scenario.name,
        'Type': scenario.type,
        'Facteur revenus': scenario.revenue_factor,
        'Facteur coûts': scenario.cost_factor,
        'Facteur OPEX': scenario.opex_factor,
        'Facteur CAPEX': scenario.capex_factor,
        'Description': scenario.description,
        'Actif': scenario.is_active ? 'Oui' : 'Non',
        'Date de création': new Date(scenario.created_at).toLocaleDateString('fr-FR')
      }))

      const scenariosSheet = XLSX.utils.json_to_sheet(scenariosData)
      XLSX.utils.book_append_sheet(workbook, scenariosSheet, 'Scénarios')
    }

    // 7. Feuille Financements
    if (loans && loans.length > 0) {
      const loansData = loans.map(loan => {
        const monthlyPayment = this.calculateMonthlyPayment(loan.principal_amount, loan.interest_rate, loan.duration_months)
        const totalInterest = (monthlyPayment * loan.duration_months) - loan.principal_amount

        return {
          'Nom': loan.name,
          'Type': loan.type,
          'Montant principal': loan.principal_amount,
          'Taux d\'intérêt (%)': loan.interest_rate,
          'Durée (mois)': loan.duration_months,
          'Année début': loan.start_year,
          'Mois début': loan.start_month,
          'Période de grâce (mois)': loan.grace_period_months,
          'Mensualité': Math.round(monthlyPayment),
          'Intérêts totaux': Math.round(totalInterest),
          'Total à rembourser': Math.round(monthlyPayment * loan.duration_months),
          'Description': loan.description
        }
      })

      const loansSheet = XLSX.utils.json_to_sheet(loansData)
      XLSX.utils.book_append_sheet(workbook, loansSheet, 'Financements')
    }

    // 8. Feuille Résultats financiers
    if (financialOutputs.length > 0) {
      const financialData = financialOutputs.map(output => ({
        'Année': output.year,
        'Mois': output.month,
        'Période': `${output.month.toString().padStart(2, '0')}/${output.year}`,
        'Chiffre d\'affaires': output.revenue,
        'Coûts directs (COGS)': output.cogs,
        'Marge brute': output.gross_margin,
        'Marge brute %': output.gross_margin_percent + '%',
        'Charges opérationnelles': output.total_opex,
        'EBITDA': output.ebitda,
        'Amortissements': output.depreciation,
        'EBIT': output.ebit,
        'Résultat net': output.net_income,
        'Remboursements emprunts': output.loan_payments || 0,
        'Flux de trésorerie': output.cash_flow
      }))

      const financialSheet = XLSX.utils.json_to_sheet(financialData)
      XLSX.utils.book_append_sheet(workbook, financialSheet, 'Résultats Financiers')
    }

    // 9. Feuille Résumé exécutif - TOUJOURS créée
    const summary = this.generateExecutiveSummary(data)
    const summarySheet = XLSX.utils.json_to_sheet(summary)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resume Executif')

    // 10. Feuille Ratios et KPIs - TOUJOURS créée
    const ratios = this.calculateRatios(data)
    const ratiosSheet = XLSX.utils.json_to_sheet(ratios)
    XLSX.utils.book_append_sheet(workbook, ratiosSheet, 'Ratios KPIs')

    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const fileName = `BusinessPlan_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, fileName)
  }

  private static calculateMonthlyEquivalent(amount: number, frequency: string): number {
    switch (frequency) {
      case 'yearly': return amount / 12
      case 'quarterly': return amount / 3
      default: return amount
    }
  }

  private static calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    if (annualRate === 0) return principal / months

    const monthlyRate = annualRate / 100 / 12
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  }

  private static generateExecutiveSummary(data: ProjectData) {
    const { project, financialOutputs, scenarios, loans } = data

    // Informations de base du projet (toujours présentes)
    const baseInfo = [
      { 'Métrique': 'INFORMATIONS PROJET', 'Valeur': '' },
      { 'Métrique': 'Nom du projet', 'Valeur': project.name },
      { 'Métrique': 'Secteur d\'activité', 'Valeur': project.sector },
      { 'Métrique': 'Date de début', 'Valeur': project.start_date },
      { 'Métrique': 'Durée de l\'étude', 'Valeur': project.horizon_years + ' ans' },
      { 'Métrique': 'Nombre de scénarios', 'Valeur': scenarios?.length || 0 },
      { 'Métrique': 'Nombre de financements', 'Valeur': loans?.length || 0 },
      { 'Métrique': '', 'Valeur': '' }
    ]

    if (financialOutputs.length === 0) {
      return [
        ...baseInfo,
        { 'Métrique': 'STATUT', 'Valeur': '' },
        { 'Métrique': 'Calculs financiers', 'Valeur': 'NON EFFECTUÉS' },
        { 'Métrique': 'Action requise', 'Valeur': 'Cliquer sur Calculer dans l\'application' }
      ]
    }

    const totalRevenue = financialOutputs.reduce((sum, item) => sum + item.revenue, 0)
    const totalNetIncome = financialOutputs.reduce((sum, item) => sum + item.net_income, 0)
    const totalCashFlow = financialOutputs.reduce((sum, item) => sum + item.cash_flow, 0)
    const months = financialOutputs.length

    return [
      { 'Métrique': 'Nom du projet', 'Valeur': project.name },
      { 'Métrique': 'Secteur d\'activité', 'Valeur': project.sector },
      { 'Métrique': 'Durée de l\'étude', 'Valeur': project.horizon_years + ' ans' },
      { 'Métrique': '', 'Valeur': '' },
      { 'Métrique': 'CHIFFRES CLÉS', 'Valeur': '' },
      { 'Métrique': 'Chiffre d\'affaires total', 'Valeur': totalRevenue },
      { 'Métrique': 'Résultat net total', 'Valeur': totalNetIncome },
      { 'Métrique': 'Marge nette', 'Valeur': totalRevenue > 0 ? ((totalNetIncome / totalRevenue) * 100).toFixed(1) + '%' : '0%' },
      { 'Métrique': 'CA mensuel moyen', 'Valeur': Math.round(totalRevenue / months) },
      { 'Métrique': 'Résultat mensuel moyen', 'Valeur': Math.round(totalNetIncome / months) },
      { 'Métrique': '', 'Valeur': '' },
      { 'Métrique': 'VIABILITÉ', 'Valeur': '' },
      { 'Métrique': 'Projet rentable', 'Valeur': totalNetIncome > 0 ? 'OUI' : 'NON' },
      { 'Métrique': 'Flux de trésorerie', 'Valeur': totalCashFlow > 0 ? 'POSITIF' : 'NÉGATIF' },
      { 'Métrique': 'Recommandation', 'Valeur': totalNetIncome > 0 && totalCashFlow > 0 ? 'PROJET VIABLE' : 'RÉVISION NÉCESSAIRE' }
    ]
  }

  private static calculateRatios(data: ProjectData) {
    const { financialOutputs } = data

    if (financialOutputs.length === 0) {
      return [{ 'Ratio': 'Aucune donnée disponible', 'Valeur': '', 'Formule': '' }]
    }

    const totalRevenue = financialOutputs.reduce((sum, item) => sum + item.revenue, 0)
    const totalCogs = financialOutputs.reduce((sum, item) => sum + item.cogs, 0)
    const totalOpex = financialOutputs.reduce((sum, item) => sum + item.total_opex, 0)
    const totalNetIncome = financialOutputs.reduce((sum, item) => sum + item.net_income, 0)
    const grossMargin = totalRevenue - totalCogs

    return [
      {
        'Ratio': 'Marge brute',
        'Valeur': totalRevenue > 0 ? ((grossMargin / totalRevenue) * 100).toFixed(1) + '%' : '0%',
        'Formule': '(CA - Coûts directs) / CA'
      },
      {
        'Ratio': 'Marge nette',
        'Valeur': totalRevenue > 0 ? ((totalNetIncome / totalRevenue) * 100).toFixed(1) + '%' : '0%',
        'Formule': 'Résultat net / CA'
      },
      {
        'Ratio': 'Ratio charges/CA',
        'Valeur': totalRevenue > 0 ? (((totalCogs + totalOpex) / totalRevenue) * 100).toFixed(1) + '%' : '0%',
        'Formule': '(COGS + OPEX) / CA'
      },
      {
        'Ratio': 'Point mort',
        'Valeur': this.calculateBreakEven(financialOutputs),
        'Formule': 'Premier mois avec résultat positif'
      },
      {
        'Ratio': 'ROI annualisé',
        'Valeur': this.calculateROI(data),
        'Formule': 'Résultat net / Investissement initial'
      }
    ]
  }

  private static calculateBreakEven(financialOutputs: any[]): string {
    const positiveMonth = financialOutputs.find(item => item.net_income > 0)
    if (positiveMonth) {
      return `${positiveMonth.month.toString().padStart(2, '0')}/${positiveMonth.year}`
    }
    return 'Non atteint'
  }

  private static calculateROI(data: ProjectData): string {
    const { capexItems, financialOutputs } = data

    const totalInvestment = capexItems.reduce((sum, item) => sum + item.amount, 0)
    const totalNetIncome = financialOutputs.reduce((sum, item) => sum + item.net_income, 0)

    if (totalInvestment === 0) return 'N/A'

    const roi = (totalNetIncome / totalInvestment) * 100
    return roi.toFixed(1) + '%'
  }
}