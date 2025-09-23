import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface HistoricalData {
  id: string
  project_id: string
  year: number
  data_type: 'bilan' | 'compte_resultat' | 'flux_tresorerie' | 'releves_bancaires'
  data: any
  source: 'manual' | 'upload' | 'extracted'
  created_at: string
  updated_at: string
}

export interface FinancialAnalysis {
  id: string
  project_id: string
  analysis_data: {
    kpis: {
      ca_evolution: number[]
      resultat_evolution: number[]
      tresorerie_evolution: number[]
      ratios: {
        year: number
        rentabilite: number
        liquidite: number
        autonomie: number
      }[]
    }
    trends: {
      ca_trend: 'up' | 'down' | 'stable'
      profitability_trend: 'up' | 'down' | 'stable'
      overall_health: 'good' | 'warning' | 'critical'
    }
  }
  ai_commentary: string
  health_score: number
  recommendations: string[]
  created_at: string
  updated_at: string
}

export class HistoricalDataService {

  // Récupérer toutes les données historiques d'un projet
  async getProjectHistoricalData(projectId: string): Promise<HistoricalData[]> {
    const { data, error } = await supabase
      .from('historical_data')
      .select('*')
      .eq('project_id', projectId)
      .order('year', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Sauvegarder des données historiques
  async saveHistoricalData(data: Omit<HistoricalData, 'id' | 'created_at' | 'updated_at'>): Promise<HistoricalData> {
    const { data: result, error } = await supabase
      .from('historical_data')
      .upsert(data, {
        onConflict: 'project_id,year,data_type',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error
    return result
  }

  // Calculer l'analyse financière automatique
  async calculateAnalysis(projectId: string): Promise<FinancialAnalysis> {
    const historicalData = await this.getProjectHistoricalData(projectId)

    // Organiser les données par année
    const dataByYear = this.organizeDataByYear(historicalData)

    // Calculer les KPI
    const kpis = this.calculateKPIs(dataByYear)

    // Détecter les tendances
    const trends = this.detectTrends(kpis)

    // Générer le commentaire IA
    const aiCommentary = this.generateAICommentary(kpis, trends)

    // Calculer le score de santé
    const healthScore = this.calculateHealthScore(kpis, trends)

    // Générer des recommandations
    const recommendations = this.generateRecommendations(trends, healthScore)

    const analysisData = {
      project_id: projectId,
      analysis_data: { kpis, trends },
      ai_commentary: aiCommentary,
      health_score: healthScore,
      recommendations
    }

    // Sauvegarder l'analyse
    const { data: result, error } = await supabase
      .from('financial_analysis')
      .upsert(analysisData, { onConflict: 'project_id' })
      .select()
      .single()

    if (error) throw error
    return result
  }

  // Récupérer l'analyse existante
  async getAnalysis(projectId: string): Promise<FinancialAnalysis | null> {
    const { data, error } = await supabase
      .from('financial_analysis')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Organiser les données par année
  private organizeDataByYear(data: HistoricalData[]): Record<number, Record<string, any>> {
    const organized: Record<number, Record<string, any>> = {}

    data.forEach(item => {
      if (!organized[item.year]) {
        organized[item.year] = {}
      }
      organized[item.year][item.data_type] = item.data
    })

    return organized
  }

  // Calculer les KPI principaux
  private calculateKPIs(dataByYear: Record<number, Record<string, any>>) {
    const years = Object.keys(dataByYear).map(Number).sort()

    const ca_evolution: number[] = []
    const resultat_evolution: number[] = []
    const tresorerie_evolution: number[] = []
    const ratios: any[] = []

    years.forEach(year => {
      const yearData = dataByYear[year]

      // CA depuis compte de résultat
      const ca = yearData.compte_resultat?.chiffre_affaires || 0
      ca_evolution.push(ca)

      // Résultat net
      const resultat = yearData.compte_resultat?.resultat_net || 0
      resultat_evolution.push(resultat)

      // Trésorerie depuis bilan ou flux
      const tresorerie = yearData.bilan?.tresorerie || yearData.flux_tresorerie?.tresorerie_fin || 0
      tresorerie_evolution.push(tresorerie)

      // Ratios
      if (yearData.bilan && yearData.compte_resultat) {
        const bilan = yearData.bilan
        const cr = yearData.compte_resultat

        ratios.push({
          year,
          rentabilite: cr.resultat_net / cr.chiffre_affaires * 100,
          liquidite: bilan.actif_circulant / bilan.dettes_court_terme || 1,
          autonomie: bilan.capitaux_propres / bilan.total_passif * 100
        })
      }
    })

    return {
      ca_evolution,
      resultat_evolution,
      tresorerie_evolution,
      ratios
    }
  }

  // Détecter les tendances
  private detectTrends(kpis: any) {
    const detectTrend = (values: number[]) => {
      if (values.length < 2) return 'stable'
      const lastTwo = values.slice(-2)
      const growth = (lastTwo[1] - lastTwo[0]) / lastTwo[0]
      return growth > 0.05 ? 'up' : growth < -0.05 ? 'down' : 'stable'
    }

    const ca_trend = detectTrend(kpis.ca_evolution)
    const profitability_trend = detectTrend(kpis.resultat_evolution)

    // Santé globale
    let overall_health: 'good' | 'warning' | 'critical' = 'good'
    if (ca_trend === 'down' && profitability_trend === 'down') {
      overall_health = 'critical'
    } else if (ca_trend === 'down' || profitability_trend === 'down') {
      overall_health = 'warning'
    }

    return {
      ca_trend,
      profitability_trend,
      overall_health
    }
  }

  // Générer commentaire IA
  private generateAICommentary(kpis: any, trends: any): string {
    const caGrowth = kpis.ca_evolution.length > 1
      ? ((kpis.ca_evolution[kpis.ca_evolution.length - 1] - kpis.ca_evolution[0]) / kpis.ca_evolution[0] * 100)
      : 0

    let commentary = `Analyse de l'évolution financière:\n\n`

    // Évolution CA
    if (trends.ca_trend === 'up') {
      commentary += `📈 Chiffre d'affaires en croissance (${caGrowth.toFixed(1)}% sur la période), témoignant d'une dynamique commerciale positive.\n`
    } else if (trends.ca_trend === 'down') {
      commentary += `📉 Baisse du chiffre d'affaires (${caGrowth.toFixed(1)}% sur la période), nécessitant une analyse des causes.\n`
    } else {
      commentary += `➡️ Chiffre d'affaires stable, positionnement défensif sur le marché.\n`
    }

    // Rentabilité
    if (trends.profitability_trend === 'up') {
      commentary += `💰 Amélioration de la rentabilité, optimisation des coûts réussie.\n`
    } else if (trends.profitability_trend === 'down') {
      commentary += `⚠️ Détérioration de la rentabilité, pression sur les marges à surveiller.\n`
    }

    // Santé globale
    if (trends.overall_health === 'good') {
      commentary += `\n✅ Situation financière globalement saine, entreprise bien positionnée pour investir et se développer.`
    } else if (trends.overall_health === 'warning') {
      commentary += `\n⚠️ Situation nécessitant une attention particulière, opportunité d'amélioration avec un financement adapté.`
    } else {
      commentary += `\n🚨 Situation critique nécessitant des mesures correctives urgentes.`
    }

    return commentary
  }

  // Calculer score de santé (0-100)
  private calculateHealthScore(kpis: any, trends: any): number {
    let score = 50 // Base neutre

    // Bonus/malus selon tendances
    if (trends.ca_trend === 'up') score += 20
    if (trends.ca_trend === 'down') score -= 20

    if (trends.profitability_trend === 'up') score += 15
    if (trends.profitability_trend === 'down') score -= 15

    // Bonus selon ratios récents
    const lastRatio = kpis.ratios[kpis.ratios.length - 1]
    if (lastRatio) {
      if (lastRatio.rentabilite > 10) score += 10
      if (lastRatio.rentabilite < 0) score -= 20

      if (lastRatio.liquidite > 1.5) score += 5
      if (lastRatio.liquidite < 1) score -= 10

      if (lastRatio.autonomie > 30) score += 5
      if (lastRatio.autonomie < 10) score -= 15
    }

    return Math.max(0, Math.min(100, score))
  }

  // Générer recommandations
  private generateRecommendations(trends: any, healthScore: number): string[] {
    const recommendations: string[] = []

    if (trends.ca_trend === 'down') {
      recommendations.push("Analyser les causes de la baisse du CA : marché, concurrence, offre")
      recommendations.push("Développer de nouveaux canaux de distribution ou produits")
    }

    if (trends.profitability_trend === 'down') {
      recommendations.push("Optimiser la structure de coûts et négocier avec les fournisseurs")
      recommendations.push("Revoir la politique tarifaire et la stratégie de marge")
    }

    if (healthScore > 70) {
      recommendations.push("Situation favorable pour envisager des investissements de croissance")
      recommendations.push("Opportunité de diversification ou d'expansion géographique")
    } else if (healthScore < 40) {
      recommendations.push("Prioriser la stabilisation de la trésorerie")
      recommendations.push("Rechercher des financements pour consolider l'activité")
    }

    if (trends.overall_health === 'good') {
      recommendations.push("Anticiper les besoins futurs en capacité de production")
      recommendations.push("Envisager l'acquisition d'équipements ou véhicules pour augmenter l'activité")
    }

    return recommendations
  }
}

export const historicalDataService = new HistoricalDataService()