import { createClient } from '@/lib/supabase/client'

export interface BusinessPlanSection {
  id: string
  project_id: string
  section_type: 'resume' | 'presentation' | 'marche' | 'strategie' | 'organisation' | 'risques' | 'conclusion'
  title: string
  content: string
  status: 'draft' | 'validated' | 'final'
  generated_at: string
  last_updated: string
  metrics_used?: string[]
}

export interface ProjectMetrics {
  // Données financières
  total_revenue: number
  total_profit: number
  profit_margin: number
  break_even_month: number | null
  investment_total: number
  financing_need: number

  // Données opérationnelles
  products_count: number
  main_product: string
  target_market: string
  sector: string
  team_size: number

  // Ratios financiers
  van?: number
  tri?: number
  dscr?: number
  roi?: number
}

export class AITextGenerationService {
  private supabase = createClient()

  /**
   * Génère automatiquement toutes les sections du business plan
   */
  async generateBusinessPlanSections(projectId: string): Promise<{
    success: boolean
    sections?: BusinessPlanSection[]
    error?: string
  }> {
    try {
      // Récupérer les métriques du projet
      const metrics = await this.getProjectMetrics(projectId)
      if (!metrics) {
        return { success: false, error: 'Impossible de récupérer les métriques du projet' }
      }

      // Générer toutes les sections
      const sections: BusinessPlanSection[] = []
      const sectionTypes: BusinessPlanSection['section_type'][] = [
        'resume', 'presentation', 'marche', 'strategie', 'organisation', 'risques', 'conclusion'
      ]

      for (const sectionType of sectionTypes) {
        const section = await this.generateSection(projectId, sectionType, metrics)
        if (section) {
          sections.push(section)
        }
      }

      return { success: true, sections }
    } catch (error) {
      console.error('Erreur génération sections:', error)
      return { success: false, error: 'Erreur lors de la génération des sections' }
    }
  }

  /**
   * Génère une section spécifique du business plan
   */
  async generateSection(
    projectId: string,
    sectionType: BusinessPlanSection['section_type'],
    metrics: ProjectMetrics
  ): Promise<BusinessPlanSection | null> {
    try {
      const template = this.getTemplate(sectionType)
      const content = this.fillTemplate(template, metrics)

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
        console.error('Erreur sauvegarde section:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erreur génération section:', error)
      return null
    }
  }

  /**
   * Récupère les métriques financières et opérationnelles du projet
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics | null> {
    try {
      // Récupérer les données du projet
      const { data: project } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (!project) return null

      // Récupérer les produits
      const { data: products } = await this.supabase
        .from('products_services')
        .select('*')
        .eq('project_id', projectId)

      // Récupérer les données financières calculées (via API)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calculations/status/${projectId}`, {
        headers: { 'Authorization': 'Bearer temp-token' }
      })

      const financialData = response.ok ? await response.json() : null

      // Récupérer les CAPEX pour le total d'investissement
      const { data: capex } = await this.supabase
        .from('capex')
        .select('amount')
        .eq('project_id', projectId)

      const totalInvestment = capex?.reduce((sum, item) => sum + item.amount, 0) || 0

      return {
        total_revenue: financialData?.summary?.total_revenue || 0,
        total_profit: financialData?.summary?.total_profit || 0,
        profit_margin: financialData?.summary?.total_profit && financialData?.summary?.total_revenue
          ? (financialData.summary.total_profit / financialData.summary.total_revenue) * 100
          : 0,
        break_even_month: financialData?.summary?.break_even_month,
        investment_total: totalInvestment,
        financing_need: financialData?.summary?.financing_need || 0,
        products_count: products?.length || 0,
        main_product: products?.[0]?.name || 'Produit principal',
        target_market: 'Marché local et régional', // À enrichir avec les données utilisateur
        sector: project.sector,
        team_size: 5, // À calculer depuis PayrollTab
        van: 1500000, // Mock data - À calculer
        tri: 25.5, // Mock data - À calculer
        dscr: 1.8, // Mock data - À calculer
        roi: 22.3 // Mock data - À calculer
      }
    } catch (error) {
      console.error('Erreur récupération métriques:', error)
      return null
    }
  }

  /**
   * Récupère les sections existantes d'un projet
   */
  async getProjectSections(projectId: string): Promise<BusinessPlanSection[]> {
    try {
      const { data, error } = await this.supabase
        .from('business_plan_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('section_type')

      if (error) {
        console.error('Erreur récupération sections:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur service:', error)
      return []
    }
  }

  /**
   * Met à jour une section existante
   */
  async updateSection(
    sectionId: string,
    content: string,
    status: BusinessPlanSection['status'] = 'draft'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('business_plan_sections')
        .update({
          content,
          status,
          last_updated: new Date().toISOString()
        })
        .eq('id', sectionId)

      return !error
    } catch (error) {
      console.error('Erreur mise à jour section:', error)
      return false
    }
  }

  /**
   * Templates pour chaque section
   */
  private getTemplate(sectionType: BusinessPlanSection['section_type']): string {
    const templates = {
      resume: `
## Résumé Exécutif

**{{main_product}}** est une entreprise {{sector}} qui génère un chiffre d'affaires prévisionnel de **{{total_revenue_formatted}} XOF** sur {{project_duration}} ans.

### Opportunité
L'entreprise opère sur le marché {{target_market}} avec {{products_count}} produits/services principaux. La demande est soutenue et offre des perspectives de croissance intéressantes.

### Modèle Économique
- **Chiffre d'affaires prévisionnel** : {{total_revenue_formatted}} XOF
- **Résultat net prévisionnel** : {{total_profit_formatted}} XOF
- **Marge nette** : {{profit_margin}}%
- **Retour sur investissement** : {{roi}}%

### Financement
L'investissement total requis s'élève à **{{investment_total_formatted}} XOF**. {{financing_strategy}}

### Équipe
L'équipe dirigeante compte {{team_size}} personnes expérimentées dans le secteur {{sector}}.

**Demande de financement** : {{financing_need_formatted}} XOF pour démarrer et développer l'activité.
      `,

      presentation: `
## Présentation du Projet

### Vision
Devenir un acteur de référence dans le secteur {{sector}} en proposant des solutions innovantes et adaptées aux besoins du marché {{target_market}}.

### Mission
Offrir des produits/services de qualité qui répondent aux attentes de notre clientèle tout en générant une rentabilité durable pour l'entreprise et ses parties prenantes.

### Historique et Contexte
{{company_background}}

### Produits et Services
L'entreprise propose {{products_count}} produits/services principaux :
- **{{main_product}}** : produit phare de l'entreprise
- Gamme complète adaptée aux besoins du marché cible

### Valeurs
- Excellence opérationnelle
- Satisfaction client
- Innovation continue
- Responsabilité sociale et environnementale
      `,

      marche: `
## Analyse du Marché

### Secteur d'Activité
Le secteur {{sector}} présente des opportunités de croissance intéressantes sur le marché {{target_market}}.

### Marché Cible
- **Segmentation** : {{target_market}}
- **Taille du marché** : Marché en croissance avec une demande soutenue
- **Tendances** : Évolution positive des besoins clients

### Clientèle Cible
La clientèle cible comprend :
- Particuliers et familles
- Entreprises locales
- Institutions publiques et privées

### Concurrence
Le marché présente une concurrence modérée avec des opportunités de différenciation par :
- La qualité des produits/services
- Le service client personnalisé
- Les prix compétitifs

### Positionnement
L'entreprise se positionne comme un acteur de confiance proposant {{main_product}} avec un excellent rapport qualité-prix.
      `,

      strategie: `
## Stratégie Commerciale et Marketing

### Stratégie de Développement
La stratégie s'articule autour de {{products_count}} axes principaux :

1. **Développement des ventes** : Objectif de {{total_revenue_formatted}} XOF de CA sur {{project_duration}} ans
2. **Optimisation opérationnelle** : Maintien d'une marge nette de {{profit_margin}}%
3. **Expansion géographique** : Couverture progressive du marché {{target_market}}

### Mix Marketing

**Produit** : {{main_product}} et gamme associée répondant aux besoins clients

**Prix** : Stratégie de prix compétitifs avec une marge permettant la rentabilité

**Distribution** : Canaux de distribution adaptés au marché cible

**Communication** : Actions marketing ciblées pour développer la notoriété

### Objectifs Commerciaux
- **Année 1** : Lancement et acquisition des premiers clients
- **Année 2** : Développement et fidélisation
- **Année 3** : Expansion et optimisation

### Avantages Concurrentiels
- Expertise dans le secteur {{sector}}
- {{main_product}} adapté aux besoins locaux
- Équipe expérimentée de {{team_size}} personnes
- Modèle économique viable (ROI : {{roi}}%)
      `,

      organisation: `
## Organisation et Management

### Structure de l'Entreprise
L'entreprise est organisée pour optimiser l'efficacité opérationnelle et la prise de décision.

### Équipe Dirigeante
L'équipe compte {{team_size}} personnes clés avec une expertise reconnue dans le secteur {{sector}}.

### Organigramme
- Direction Générale
- Direction Commerciale
- Direction Opérationnelle
- Direction Administrative et Financière

### Ressources Humaines
Plan de recrutement progressif aligné sur le développement de l'activité :
- Effectif initial : {{team_size}} personnes
- Évolution prévue selon la croissance du CA

### Processus et Procédures
Mise en place de processus standardisés pour :
- La production/prestation de services
- La relation client
- La gestion financière et administrative
- Le contrôle qualité

### Partenaires Clés
Développement d'un réseau de partenaires stratégiques pour :
- L'approvisionnement
- La distribution
- Le support technique
      `,

      risques: `
## Analyse des Risques et Mesures d'Atténuation

### Risques Identifiés

**1. Risques Commerciaux**
- Évolution de la demande sur le marché {{target_market}}
- Intensification de la concurrence dans le secteur {{sector}}
- *Atténuation* : Diversification de l'offre et veille concurrentielle

**2. Risques Opérationnels**
- Difficultés d'approvisionnement pour {{main_product}}
- Problèmes de qualité ou de livraison
- *Atténuation* : Partenariats fournisseurs multiples et contrôle qualité renforcé

**3. Risques Financiers**
- Retards de paiement clients
- Augmentation des coûts
- *Atténuation* : Diversification clientèle et gestion rigoureuse du BFR

**4. Risques Humains**
- Départ de personnes clés dans l'équipe de {{team_size}} personnes
- Difficultés de recrutement
- *Atténuation* : Formation continue et politique de fidélisation

### Indicateurs de Suivi
- **DSCR** : {{dscr}} (>1,2 requis pour viabilité)
- **Marge nette** : {{profit_margin}}% (objectif de maintien)
- **ROI** : {{roi}}% (performance satisfaisante)

### Plan de Contingence
En cas de difficultés :
1. Réduction des coûts non essentiels
2. Renégociation des conditions fournisseurs
3. Actions commerciales renforcées
4. Recherche de financements complémentaires si nécessaire
      `,

      conclusion: `
## Conclusion et Demande de Financement

### Synthèse du Projet
Le projet {{main_product}} dans le secteur {{sector}} présente un potentiel de développement solide avec :

- **Marché porteur** : {{target_market}} avec demande soutenue
- **Modèle économique viable** : {{profit_margin}}% de marge nette
- **Équipe compétente** : {{team_size}} personnes expérimentées
- **Rentabilité attractive** : ROI de {{roi}}%

### Projections Financières
- **Chiffre d'affaires** : {{total_revenue_formatted}} XOF sur {{project_duration}} ans
- **Résultat net** : {{total_profit_formatted}} XOF
- **Investissement total** : {{investment_total_formatted}} XOF

### Demande de Financement
**Montant sollicité** : {{financing_need_formatted}} XOF

**Utilisation des fonds** :
- Investissements productifs
- Besoin en fonds de roulement initial
- Fonds de sécurité

### Garanties et Sûretés
L'entreprise propose des garanties appropriées selon les exigences de l'établissement financier.

### Calendrier de Mise en Œuvre
- **Phase 1** : Finalisation du financement et démarrage (Mois 1-2)
- **Phase 2** : Lancement opérationnel (Mois 3-6)
- **Phase 3** : Développement et croissance (Mois 7-36)

**Ce projet représente une opportunité d'investissement solide avec un potentiel de croissance durable dans le secteur {{sector}}.**
      `
    }

    return templates[sectionType] || ''
  }

  /**
   * Remplace les placeholders dans le template avec les métriques
   */
  private fillTemplate(template: string, metrics: ProjectMetrics): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR').format(amount)
    }

    const replacements: Record<string, string> = {
      '{{main_product}}': metrics.main_product,
      '{{sector}}': metrics.sector,
      '{{target_market}}': metrics.target_market,
      '{{products_count}}': metrics.products_count.toString(),
      '{{team_size}}': metrics.team_size.toString(),
      '{{total_revenue_formatted}}': formatCurrency(metrics.total_revenue),
      '{{total_profit_formatted}}': formatCurrency(metrics.total_profit),
      '{{investment_total_formatted}}': formatCurrency(metrics.investment_total),
      '{{financing_need_formatted}}': formatCurrency(metrics.financing_need),
      '{{profit_margin}}': metrics.profit_margin.toFixed(1),
      '{{roi}}': metrics.roi?.toFixed(1) || '0.0',
      '{{tri}}': metrics.tri?.toFixed(1) || '0.0',
      '{{van}}': formatCurrency(metrics.van || 0),
      '{{dscr}}': metrics.dscr?.toFixed(1) || '0.0',
      '{{project_duration}}': '3', // Durée par défaut
      '{{company_background}}': 'Projet entrepreneurial ambitieux dans un secteur à fort potentiel.',
      '{{financing_strategy}}': metrics.financing_need > 0
        ? `Un financement de ${formatCurrency(metrics.financing_need)} XOF est nécessaire pour réaliser ce projet.`
        : 'Le projet dispose de ressources propres suffisantes.'
    }

    let filledTemplate = template
    Object.entries(replacements).forEach(([placeholder, value]) => {
      filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), value)
    })

    return filledTemplate
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
}

export const aiTextGenerationService = new AITextGenerationService()