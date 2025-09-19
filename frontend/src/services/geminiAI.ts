import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/client'
import { ProjectMetrics, BusinessPlanSection } from './aiTextGeneration'

// Configuration Gemini AI
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export class GeminiAIService {
  private supabase = createClient()
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  /**
   * Génère une section du business plan avec Gemini AI
   */
  async generateSectionWithAI(
    projectId: string,
    sectionType: BusinessPlanSection['section_type'],
    metrics: ProjectMetrics
  ): Promise<BusinessPlanSection | null> {
    try {
      // Vérifier si on a une clé API
      if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
        console.warn('Pas de clé API Gemini, utilisation des templates')
        return this.generateWithTemplate(projectId, sectionType, metrics)
      }

      const prompt = this.buildPrompt(sectionType, metrics)
      console.log('Génération IA pour:', sectionType)

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const content = response.text()

      // Sauvegarder en base
      const { data, error } = await this.supabase
        .from('business_plan_sections')
        .upsert({
          project_id: projectId,
          section_type: sectionType,
          title: this.getSectionTitle(sectionType),
          content,
          status: 'draft',
          generated_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          metrics_used: Object.keys(metrics)
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur sauvegarde section IA:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erreur IA Gemini:', error)
      // Fallback vers les templates en cas d'erreur
      return this.generateWithTemplate(projectId, sectionType, metrics)
    }
  }

  /**
   * Construit le prompt pour chaque section
   */
  private buildPrompt(sectionType: BusinessPlanSection['section_type'], metrics: ProjectMetrics): string {
    const baseContext = `
Tu es un expert en business plan et conseiller financier. Génère une section professionnelle de business plan en français.

DONNÉES DU PROJET :
- Produit principal: ${metrics.main_product}
- Secteur: ${metrics.sector}
- CA prévisionnel: ${metrics.total_revenue.toLocaleString()} XOF
- Bénéfice net: ${metrics.total_profit.toLocaleString()} XOF
- Marge nette: ${metrics.profit_margin.toFixed(1)}%
- Investissement: ${metrics.investment_total.toLocaleString()} XOF
- Financement demandé: ${metrics.financing_need.toLocaleString()} XOF
- ROI: ${metrics.roi?.toFixed(1)}%
- Nombre de produits: ${metrics.products_count}
- Taille équipe: ${metrics.team_size}
- Marché cible: ${metrics.target_market}

INSTRUCTIONS :
- Rédige en français professionnel
- Utilise un format markdown avec des titres ### et **gras**
- Intègre naturellement les chiffres fournis
- Reste réaliste et crédible
- Adapte le ton pour une présentation bancaire
- Longueur: 300-500 mots
`

    const sectionPrompts = {
      resume: `${baseContext}

SECTION : RÉSUMÉ EXÉCUTIF
Rédige un résumé exécutif convaincant qui présente :
- L'opportunité business
- Les chiffres clés (CA, bénéfices, ROI)
- La demande de financement
- Les points forts du projet`,

      presentation: `${baseContext}

SECTION : PRÉSENTATION DU PROJET
Rédige une présentation détaillée incluant :
- La vision et mission de l'entreprise
- Description des produits/services
- Les valeurs de l'entreprise
- Le positionnement sur le marché`,

      marche: `${baseContext}

SECTION : ANALYSE DU MARCHÉ
Analyse le marché en incluant :
- Le secteur d'activité et ses tendances
- La segmentation du marché cible
- L'analyse de la concurrence
- Les opportunités identifiées`,

      strategie: `${baseContext}

SECTION : STRATÉGIE COMMERCIALE
Développe la stratégie incluant :
- Les objectifs commerciaux chiffrés
- Le mix marketing (4P)
- Les canaux de distribution
- Les avantages concurrentiels`,

      organisation: `${baseContext}

SECTION : ORGANISATION ET MANAGEMENT
Présente l'organisation avec :
- La structure de l'entreprise
- L'équipe dirigeante
- Les ressources humaines
- Les processus clés`,

      risques: `${baseContext}

SECTION : ANALYSE DES RISQUES
Analyse les risques et mesures d'atténuation :
- Risques commerciaux et opérationnels
- Risques financiers
- Mesures préventives
- Indicateurs de suivi`,

      conclusion: `${baseContext}

SECTION : CONCLUSION ET FINANCEMENT
Rédige une conclusion percutante avec :
- Synthèse du projet
- Justification de la demande de financement
- Calendrier de mise en œuvre
- Appel à l'action pour les financeurs`
    }

    return sectionPrompts[sectionType] || sectionPrompts.resume
  }

  /**
   * Fallback vers génération par template
   */
  private async generateWithTemplate(
    projectId: string,
    sectionType: BusinessPlanSection['section_type'],
    metrics: ProjectMetrics
  ): Promise<BusinessPlanSection | null> {
    try {
      // Import du service template
      const { aiTextGenerationService } = await import('./aiTextGeneration')
      return await aiTextGenerationService.generateSection(projectId, sectionType, metrics)
    } catch (error) {
      console.error('Erreur fallback template:', error)
      return null
    }
  }

  /**
   * Génère toutes les sections avec IA
   */
  async generateAllSectionsWithAI(projectId: string): Promise<{
    success: boolean
    sections?: BusinessPlanSection[]
    error?: string
  }> {
    try {
      // Import du service pour récupérer les métriques
      const { aiTextGenerationService } = await import('./aiTextGeneration')
      const metrics = await aiTextGenerationService.getProjectMetrics(projectId)

      if (!metrics) {
        return { success: false, error: 'Impossible de récupérer les métriques du projet' }
      }

      console.log('🤖 Génération IA avec Gemini pour toutes les sections...')

      const sections: BusinessPlanSection[] = []
      const sectionTypes: BusinessPlanSection['section_type'][] = [
        'resume', 'presentation', 'marche', 'strategie', 'organisation', 'risques', 'conclusion'
      ]

      for (const sectionType of sectionTypes) {
        console.log(`Génération de la section: ${sectionType}`)
        const section = await this.generateSectionWithAI(projectId, sectionType, metrics)
        if (section) {
          sections.push(section)
        }
        // Délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return { success: true, sections }
    } catch (error) {
      console.error('Erreur génération IA complète:', error)
      return { success: false, error: 'Erreur lors de la génération IA' }
    }
  }

  /**
   * Retourne le titre de la section
   */
  private getSectionTitle(sectionType: BusinessPlanSection['section_type']): string {
    const titles = {
      resume: 'Résumé Exécutif',
      presentation: 'Présentation du Projet',
      marche: 'Analyse du Marché',
      strategie: 'Stratégie Commerciale',
      organisation: 'Organisation et Management',
      risques: 'Analyse des Risques',
      conclusion: 'Conclusion et Financement'
    }

    return titles[sectionType] || ''
  }

  /**
   * Génère une section avec un prompt personnalisé
   */
  async generateSectionWithCustomPrompt(
    projectId: string,
    sectionType: BusinessPlanSection['section_type'],
    metrics: ProjectMetrics,
    customPrompt: string
  ): Promise<BusinessPlanSection | null> {
    try {
      // Vérifier si on a une clé API
      if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
        console.warn('Pas de clé API Gemini, utilisation des templates')
        return this.generateWithTemplate(projectId, sectionType, metrics)
      }

      console.log('Génération IA avec prompt personnalisé pour:', sectionType)

      const result = await this.model.generateContent(customPrompt)
      const response = await result.response
      const content = response.text()

      // Sauvegarder en base
      const { data, error } = await this.supabase
        .from('business_plan_sections')
        .upsert({
          project_id: projectId,
          section_type: sectionType,
          title: this.getSectionTitle(sectionType),
          content,
          status: 'draft',
          generated_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          metrics_used: Object.keys(metrics)
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur sauvegarde section IA personnalisée:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erreur IA Gemini avec prompt personnalisé:', error)
      // Fallback vers les templates en cas d'erreur
      return this.generateWithTemplate(projectId, sectionType, metrics)
    }
  }

  /**
   * Test de la connexion à l'API Gemini
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
        return {
          success: false,
          message: 'Clé API Gemini manquante. Mode template actif.'
        }
      }

      const result = await this.model.generateContent('Dis juste "OK" pour tester la connexion')
      const response = await result.response
      const text = response.text()

      return {
        success: true,
        message: `✅ Connexion Gemini réussie: ${text}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Erreur connexion Gemini: ${error}`
      }
    }
  }
}

export const geminiAIService = new GeminiAIService()