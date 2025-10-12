/**
 * Agrégateur de contexte inter-sections
 *
 * Récupère et formate les données des sections déjà complétées
 * pour enrichir les prompts IA avec la cohérence du business plan.
 *
 * OBJECTIF: Assurer la cohérence entre les sections du business plan
 * UTILISATION: Injecté dans buildContextualPrompt() de businessPlanAI.ts
 * NON-INTRUSIF: Lecture seule, aucune modification des données
 */

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface SectionSummary {
  sectionId: string
  summary: string
  keyPoints: string[]
}

export interface AggregatedContext {
  swot?: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  marketStudy?: {
    marketSize?: number
    marketGrowth?: number
    targetSegments: string[]
    mainCompetitors: string[]
  }
  hr?: {
    totalPositions: number
    keyRoles: string[]
    recruitmentTimeline?: string
  }
  marketing?: {
    positioning?: string
    targetSegments: string[]
    mainChannels: string[]
  }
  hasSections: boolean
}

export class ContextAggregator {
  /**
   * Récupère toutes les sections complétées du projet
   */
  static async getCompletedSections(
    projectId: string,
    userId: string
  ): Promise<Record<string, any>> {
    try {
      console.log('[ContextAggregator] Lecture sections pour projet:', projectId)
      const sectionsRef = collection(db, `users/${userId}/projects/${projectId}/sections`)
      const snapshot = await getDocs(sectionsRef)

      const sections: Record<string, any> = {}
      snapshot.forEach(doc => {
        sections[doc.id] = doc.data()
      })

      console.log('[ContextAggregator] Sections trouvées:', Object.keys(sections).join(', '))
      return sections
    } catch (error) {
      console.error('[ContextAggregator] Erreur lecture sections:', error)
      return {}
    }
  }

  /**
   * Agrège et résume les sections complétées
   */
  static aggregateContext(sections: Record<string, any>): AggregatedContext {
    const aggregated: AggregatedContext = {
      hasSections: Object.keys(sections).length > 0
    }

    // SWOT Analysis
    if (sections.swotAnalysis) {
      const swot = sections.swotAnalysis
      aggregated.swot = {
        strengths: this.extractItems(swot.strengths, 5),
        weaknesses: this.extractItems(swot.weaknesses, 5),
        opportunities: this.extractItems(swot.opportunities, 5),
        threats: this.extractItems(swot.threats, 5)
      }
    }

    // Market Study
    if (sections.marketStudy) {
      const market = sections.marketStudy
      aggregated.marketStudy = {
        marketSize: market.marketAnalysis?.marketSize,
        marketGrowth: market.marketAnalysis?.marketGrowth,
        targetSegments: this.extractSegmentNames(market.targetCustomers?.segments),
        mainCompetitors: this.extractCompetitorNames(market.competitiveAnalysis?.competitors)
      }
    }

    // HR Management
    if (sections.hr) {
      const hr = sections.hr
      aggregated.hr = {
        totalPositions: hr.positions?.length || 0,
        keyRoles: this.extractRoleNames(hr.positions, 5),
        recruitmentTimeline: hr.recruitmentPlan?.timeline
      }
    }

    // Marketing
    if (sections.marketing) {
      const marketing = sections.marketing
      aggregated.marketing = {
        positioning: marketing.strategy?.positioning,
        targetSegments: this.extractMarketingSegments(marketing.strategy?.targetSegments),
        mainChannels: this.extractChannels(marketing.marketingMix?.promotion?.channels)
      }
    }

    return aggregated
  }

  /**
   * Formate le contexte agrégé en texte pour injection dans le prompt
   */
  static formatContextForPrompt(context: AggregatedContext): string {
    if (!context.hasSections) {
      return ''
    }

    let formattedContext = '\n\n' + '='.repeat(80) + '\n'
    formattedContext += '🔗 COHÉRENCE INTER-SECTIONS\n'
    formattedContext += 'Utilise ces informations déjà définies dans le business plan pour assurer la cohérence:\n'
    formattedContext += '='.repeat(80) + '\n'

    // SWOT
    if (context.swot) {
      formattedContext += '\n🔗 SYNTHÈSE SWOT EXISTANTE:\n'

      if (context.swot.strengths.length > 0) {
        formattedContext += '\n✅ FORCES PRINCIPALES:\n'
        context.swot.strengths.forEach(s => {
          formattedContext += `   • ${s}\n`
        })
      }

      if (context.swot.weaknesses.length > 0) {
        formattedContext += '\n⚠️ FAIBLESSES IDENTIFIÉES:\n'
        context.swot.weaknesses.forEach(w => {
          formattedContext += `   • ${w}\n`
        })
      }

      if (context.swot.opportunities.length > 0) {
        formattedContext += '\n💡 OPPORTUNITÉS IDENTIFIÉES:\n'
        context.swot.opportunities.forEach(o => {
          formattedContext += `   • ${o}\n`
        })
      }

      if (context.swot.threats.length > 0) {
        formattedContext += '\n🚨 MENACES IDENTIFIÉES:\n'
        context.swot.threats.forEach(t => {
          formattedContext += `   • ${t}\n`
        })
      }
    }

    // Market Study
    if (context.marketStudy) {
      formattedContext += '\n🎯 MARCHÉ CIBLE IDENTIFIÉ:\n'

      if (context.marketStudy.marketSize) {
        formattedContext += `   • Taille du marché: ${context.marketStudy.marketSize.toLocaleString('fr-FR')} FCFA\n`
      }

      if (context.marketStudy.marketGrowth) {
        formattedContext += `   • Croissance annuelle: ${context.marketStudy.marketGrowth}%\n`
      }

      if (context.marketStudy.targetSegments.length > 0) {
        formattedContext += `   • Segments cibles: ${context.marketStudy.targetSegments.join(', ')}\n`
      }

      if (context.marketStudy.mainCompetitors.length > 0) {
        formattedContext += `   • Concurrents principaux: ${context.marketStudy.mainCompetitors.join(', ')}\n`
      }
    }

    // HR
    if (context.hr && context.hr.totalPositions > 0) {
      formattedContext += '\n👥 RESSOURCES HUMAINES PRÉVUES:\n'
      formattedContext += `   • Effectif total prévu: ${context.hr.totalPositions} postes\n`

      if (context.hr.keyRoles.length > 0) {
        formattedContext += `   • Postes clés: ${context.hr.keyRoles.join(', ')}\n`
      }

      if (context.hr.recruitmentTimeline) {
        formattedContext += `   • Timeline recrutement: ${context.hr.recruitmentTimeline}\n`
      }
    }

    // Marketing
    if (context.marketing) {
      formattedContext += '\n📢 STRATÉGIE MARKETING DÉFINIE:\n'

      if (context.marketing.positioning) {
        formattedContext += `   • Positionnement: ${context.marketing.positioning}\n`
      }

      if (context.marketing.targetSegments.length > 0) {
        formattedContext += `   • Segments marketing: ${context.marketing.targetSegments.join(', ')}\n`
      }

      if (context.marketing.mainChannels.length > 0) {
        formattedContext += `   • Canaux principaux: ${context.marketing.mainChannels.join(', ')}\n`
      }
    }

    formattedContext += '\n' + '='.repeat(80) + '\n'
    formattedContext += '⚠️ IMPORTANT: Assure la cohérence avec ces éléments déjà validés.\n'
    formattedContext += '='.repeat(80) + '\n'

    return formattedContext
  }

  // ========================================
  // HELPERS D'EXTRACTION
  // ========================================

  private static extractItems(items: any[] | undefined, limit: number): string[] {
    if (!items || !Array.isArray(items)) return []

    return items
      .slice(0, limit)
      .map(item => {
        if (typeof item === 'string') return item
        if (item.description) return item.description
        if (item.content) return item.content
        if (item.title) return item.title
        return JSON.stringify(item).substring(0, 100)
      })
      .filter(Boolean)
  }

  private static extractSegmentNames(segments: any[] | undefined): string[] {
    if (!segments || !Array.isArray(segments)) return []

    return segments
      .slice(0, 5)
      .map(s => s.name || s.segment || s.title || 'Segment')
      .filter(Boolean)
  }

  private static extractCompetitorNames(competitors: any[] | undefined): string[] {
    if (!competitors || !Array.isArray(competitors)) return []

    return competitors
      .slice(0, 5)
      .map(c => c.name || c.company || c.competitor || 'Concurrent')
      .filter(Boolean)
  }

  private static extractRoleNames(positions: any[] | undefined, limit: number): string[] {
    if (!positions || !Array.isArray(positions)) return []

    return positions
      .slice(0, limit)
      .map(p => p.title || p.name || p.role || 'Poste')
      .filter(Boolean)
  }

  private static extractMarketingSegments(segments: any[] | any | undefined): string[] {
    if (!segments) return []
    if (Array.isArray(segments)) {
      return segments.slice(0, 3).map(s => {
        if (typeof s === 'string') return s
        return s.name || s.segment || 'Segment'
      })
    }
    if (typeof segments === 'string') return [segments]
    return []
  }

  private static extractChannels(channels: any[] | any | undefined): string[] {
    if (!channels) return []
    if (Array.isArray(channels)) {
      return channels.slice(0, 5).map(c => {
        if (typeof c === 'string') return c
        return c.name || c.channel || c.type || 'Canal'
      })
    }
    if (typeof channels === 'string') return [channels]
    return []
  }
}
