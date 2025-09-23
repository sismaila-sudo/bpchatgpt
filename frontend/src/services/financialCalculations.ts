import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  unit_price: number
  unit: string
}

interface SalesProjection {
  id: string
  product_id: string
  year: number
  month: number
  volume: number
}

interface FinancialSummary {
  totalRevenue: number
  revenueByYear: Record<number, number>
  revenueByProduct: Record<string, number>
  totalVolume: number
  averagePrice: number
}

export class FinancialCalculationsService {
  private static supabase = createClient()

  /**
   * Calcule le chiffre d'affaires réel basé sur les produits et projections de vente actuels
   * Cette méthode garantit la cohérence en calculant directement depuis les données source
   * IMPORTANT: Filtre les projections selon la date de démarrage du projet (comme SalesTab et API)
   */
  static async calculateRealRevenue(projectId: string): Promise<FinancialSummary> {
    try {
      console.log('🔄 FinancialCalculationsService - Calcul pour projet:', projectId)

      // Récupérer les données source fiables + info projet pour filtrage date
      const [productsResult, projectionsResult, projectResult] = await Promise.all([
        this.supabase
          .from('products_services')
          .select('*')
          .eq('project_id', projectId),
        this.supabase
          .from('sales_projections')
          .select('*')
          .eq('project_id', projectId),
        this.supabase
          .from('projects')
          .select('start_date')
          .eq('id', projectId)
          .single()
      ])

      if (productsResult.error) throw productsResult.error
      if (projectionsResult.error) throw projectionsResult.error
      if (projectResult.error) throw projectResult.error

      const products: Product[] = productsResult.data || []
      const allProjections: SalesProjection[] = projectionsResult.data || []
      const project = projectResult.data

      // 🔥 FILTRAGE CRITIQUE: Appliquer le même filtrage que SalesTab et API
      const projectStartDate = new Date(project.start_date)
      const projections = allProjections.filter(projection => {
        const projDate = new Date(projection.year, projection.month - 1, 1)
        return projDate >= projectStartDate
      })

      console.log('- Produits trouvés:', products.length)
      console.log('- Projections totales:', allProjections.length)
      console.log('- Projections filtrées après', project.start_date, ':', projections.length)

      // Calculer le CA total et les détails
      let totalRevenue = 0
      let totalVolume = 0
      const revenueByYear: Record<number, number> = {}
      const revenueByProduct: Record<string, number> = {}

      projections.forEach(projection => {
        const product = products.find(p => p.id === projection.product_id)

        if (product && projection.volume > 0) {
          const revenue = projection.volume * product.unit_price

          // Total général
          totalRevenue += revenue
          totalVolume += projection.volume

          // Par année
          if (!revenueByYear[projection.year]) {
            revenueByYear[projection.year] = 0
          }
          revenueByYear[projection.year] += revenue

          // Par produit
          if (!revenueByProduct[product.id]) {
            revenueByProduct[product.id] = 0
          }
          revenueByProduct[product.id] += revenue
        }
      })

      const averagePrice = totalVolume > 0 ? totalRevenue / totalVolume : 0

      const result: FinancialSummary = {
        totalRevenue,
        revenueByYear,
        revenueByProduct,
        totalVolume,
        averagePrice
      }

      console.log('- CA Total calculé:', totalRevenue.toLocaleString())
      console.log('- Volume total:', totalVolume.toLocaleString())
      console.log('- Répartition par année:', Object.entries(revenueByYear).map(([year, amount]) =>
        `${year}: ${amount.toLocaleString()}`).join(', '))

      return result

    } catch (error) {
      console.error('Erreur calcul CA réel:', error)
      throw error
    }
  }

  /**
   * Compare le CA calculé avec celui stocké dans financial_outputs
   * Utile pour détecter les incohérences
   */
  static async compareWithStoredData(projectId: string): Promise<{
    realRevenue: number
    storedRevenue: number
    difference: number
    isConsistent: boolean
  }> {
    try {
      // Calcul réel
      const realData = await this.calculateRealRevenue(projectId)

      // Données stockées
      const { data: storedData, error } = await this.supabase
        .from('financial_outputs')
        .select('revenue')
        .eq('project_id', projectId)

      if (error) throw error

      const storedRevenue = storedData?.reduce((sum, row) => sum + (row.revenue || 0), 0) || 0
      const difference = Math.abs(realData.totalRevenue - storedRevenue)
      const isConsistent = difference < 1000 // Tolérance de 1000 XOF

      console.log('📊 Comparaison CA:')
      console.log('- CA Réel (calculé):', realData.totalRevenue.toLocaleString())
      console.log('- CA Stocké:', storedRevenue.toLocaleString())
      console.log('- Différence:', difference.toLocaleString())
      console.log('- Cohérent?', isConsistent ? '✅' : '❌')

      return {
        realRevenue: realData.totalRevenue,
        storedRevenue,
        difference,
        isConsistent
      }

    } catch (error) {
      console.error('Erreur comparaison données:', error)
      throw error
    }
  }

  /**
   * Formate un montant en devise locale
   */
  static formatCurrency(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Calcule les ratios financiers de base
   */
  static calculateBasicRatios(summary: FinancialSummary, totalCosts: number = 0): {
    grossMarginPercent: number
    revenueGrowthByYear: Record<number, number>
  } {
    const grossMarginPercent = totalCosts > 0 ?
      ((summary.totalRevenue - totalCosts) / summary.totalRevenue) * 100 : 0

    // Calcul croissance année par année
    const years = Object.keys(summary.revenueByYear).map(Number).sort()
    const revenueGrowthByYear: Record<number, number> = {}

    for (let i = 1; i < years.length; i++) {
      const currentYear = years[i]
      const previousYear = years[i - 1]
      const currentRevenue = summary.revenueByYear[currentYear] || 0
      const previousRevenue = summary.revenueByYear[previousYear] || 0

      if (previousRevenue > 0) {
        revenueGrowthByYear[currentYear] =
          ((currentRevenue - previousRevenue) / previousRevenue) * 100
      }
    }

    return {
      grossMarginPercent,
      revenueGrowthByYear
    }
  }
}