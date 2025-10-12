/**
 * Service IA spécialisé pour les business plans sénégalais
 * Intégration avec OpenAI et connaissances locales
 */

import { Project } from '@/types/project'
import { FinancialProjections } from '@/services/financialEngine'
import { ContextAggregator } from '@/services/contextAggregator'

// Types pour l'IA
export interface AIContext {
  project: Project
  section: string
  userInput?: string
  financialData?: FinancialProjections
}

export interface AIResponse {
  content: string
  suggestions: string[]
  confidence: number
  sources?: string[]
}

export interface MarketAnalysisAI {
  marketSize: string
  targetAudience: string
  competition: string[]
  opportunities: string[]
  threats: string[]
  recommendations: string[]
}

export interface SWOTAnalysisAI {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  strategicRecommendations: string[]
}

export class BusinessPlanAI {
  private static readonly API_BASE_URL = '/api/ai'

  // Base de connaissances spécifique au Sénégal (mise à jour 2024-2025)
  private static readonly SENEGAL_CONTEXT = {
    economy: {
      mainSectors: ['Agriculture', 'Pêche', 'Mining', 'Services', 'Tourisme', 'Textile', 'Numérique', 'Énergies renouvelables'],
      gdpGrowth: 0.048, // 4.8% croissance PIB
      inflation: 0.03,
      unemployment: 0.16,
      currency: 'FCFA',
      businessClimate: 'En amélioration selon Doing Business',
      strategicVision: 'Vision Sénégal 2050', // Nouveau gouvernement depuis mars 2024
      governmentPriorities: [
        'Souveraineté alimentaire',
        'Transformation numérique et digitale',
        'Industrialisation et transformation locale',
        'Développement du capital humain',
        'Développement durable et transition écologique',
        'Renforcement des infrastructures'
      ],
      currentYear: new Date().getFullYear(),
      dataSourceYear: 2024 // Pour éviter les références obsolètes
    },
    regulations: {
      businessRegistration: 'APIX - Agence nationale chargée de la Promotion de l\'Investissement',
      taxRate: 0.30,
      vatRate: 0.18,
      minimumWage: 209000, // FCFA par mois
      socialCharges: 0.24
    },
    regions: {
      'Dakar': { population: 3500000, economicActivity: 'Services, Port, Industrie' },
      'Thiès': { population: 2000000, economicActivity: 'Agriculture, Industrie' },
      'Kaolack': { population: 1000000, economicActivity: 'Arachide, Commerce' },
      'Saint-Louis': { population: 1000000, economicActivity: 'Pêche, Tourisme' },
      'Tambacounda': { population: 800000, economicActivity: 'Agriculture, Élevage' }
    },
    challenges: [
      'Accès au financement',
      'Infrastructure énergétique',
      'Formation de la main d\'œuvre',
      'Bureaucratie administrative',
      'Concurrence informelle'
    ],
    opportunities: [
      'Marché CEDEAO de 400M habitants',
      'Position géographique stratégique (hub Afrique de l\'Ouest)',
      'Stabilité politique et institutionnelle',
      'Ressources naturelles (phosphates, gaz, pêche)',
      'Diaspora active et investisseuse',
      'Vision Sénégal 2050 - orientation développement',
      'Programmes de financement: FONGIP, FAISE, DER, ADEPME',
      'Zone économique spéciale (ZES) en développement',
      'Digitalisation accélérée (mobile money, e-gov)'
    ],
    keyPrograms: {
      fongip: 'Fonds de Garantie des Investissements Prioritaires - garanties crédit PME',
      faise: 'Fonds d\'Appui à l\'Investissement des Sénégalais de l\'Extérieur',
      der: 'Délégation à l\'Entrepreneuriat Rapide - financement jeunes entrepreneurs',
      adepme: 'Agence de Développement des PME - accompagnement technique',
      fonsis: 'Fonds Souverain d\'Investissements Stratégiques'
    }
  }

  /**
   * Génère du contenu IA pour une section spécifique
   */
  static async generateSectionContent(
    context: AIContext,
    contentType: 'executive_summary' | 'market_study' | 'swot' | 'marketing_strategy' | 'financial_analysis',
    userId?: string
  ): Promise<AIResponse> {
    try {
      // Utiliser le prompt contextuel si userId fourni, sinon prompt de base
      const prompt = userId
        ? await this.buildContextualPrompt(context, contentType, userId)
        : this.buildPrompt(context, contentType)

      // Log pour debug : vérifier que le prompt est bien généré
      console.log('[BusinessPlanAI] Prompt généré:', {
        contentType,
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 150) + '...'
      })

      const senegalContext = this.getSenegalContext(context)
      const payload = {
        prompt,
        context: {
          project: context.project,  // ← Ajouter le projet !
          senegalContext,
          localRegion: senegalContext.localRegion
        },
        contentType,
        maxTokens: 1500
      }

      // Log du payload complet avant envoi
      console.log('[BusinessPlanAI] Payload envoyé à l\'API:', {
        hasPrompt: !!payload.prompt,
        promptLength: payload.prompt?.length || 0,
        hasContext: !!payload.context,
        contextKeys: Object.keys(payload.context || {}),
        contentType: payload.contentType
      })

      const response = await fetch(`${this.API_BASE_URL}/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Erreur API IA')
      }

      const data = await response.json()

      return {
        content: data.content,
        suggestions: data.suggestions || [],
        confidence: data.confidence || 0.8,
        sources: data.sources || []
      }
    } catch (error) {
      console.error('[BusinessPlanAI] Erreur génération IA:', error)
      console.error('[BusinessPlanAI] Context utilisé:', {
        hasProject: !!context?.project,
        projectName: context?.project?.basicInfo?.name || 'N/A',
        hasLocation: !!context?.project?.basicInfo?.location,
        contentType
      })

      // Fallback avec contenu prédéfini
      return this.getFallbackContent(context, contentType)
    }
  }

  /**
   * Analyse de marché automatisée avec recherche web
   */
  static async generateMarketAnalysis(project: Project): Promise<MarketAnalysisAI> {
    try {
      console.log(`🔍 Génération analyse marché avec recherche web pour ${project.basicInfo.sector}`)

      const response = await fetch(`${this.API_BASE_URL}/market-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sector: project.basicInfo.sector,
          location: project.basicInfo.location,
          projectType: project.basicInfo.projectType,
          senegalContext: this.SENEGAL_CONTEXT
        })
      })

      if (!response.ok) {
        throw new Error('Erreur analyse marché IA')
      }

      const data = await response.json()
      console.log('✅ Analyse marché générée avec sources vérifiées')

      // La réponse contient maintenant metadata.sourcesUsed
      return data
    } catch (error) {
      console.error('Erreur analyse marché:', error)
      console.warn('⚠️ Utilisation analyse de secours')
      return this.getFallbackMarketAnalysis(project)
    }
  }

  /**
   * Génération SWOT automatisée
   */
  static async generateSWOTAnalysis(project: Project): Promise<SWOTAnalysisAI> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/swot-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: {
            name: project.basicInfo.name,
            description: project.basicInfo.description,
            sector: project.basicInfo.sector,
            location: project.basicInfo.location,
            projectType: project.basicInfo.projectType
          },
          senegalContext: this.SENEGAL_CONTEXT
        })
      })

      if (!response.ok) {
        throw new Error('Erreur SWOT IA')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur SWOT:', error)
      return this.getFallbackSWOT(project)
    }
  }

  /**
   * Assistant IA conversationnel
   */
  static async askBusinessPlanAssistant(
    question: string,
    context: AIContext
  ): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/business-plan-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context: {
            project: context.project,
            section: context.section,
            senegalContext: this.SENEGAL_CONTEXT
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur assistant IA')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur assistant:', error)
      return {
        content: "Je ne peux pas répondre à cette question pour le moment. Veuillez réessayer plus tard.",
        suggestions: [
          "Consultez les ressources locales",
          "Contactez un expert en business plan",
          "Référez-vous aux guides APIX"
        ],
        confidence: 0.5
      }
    }
  }

  /**
   * Validation et suggestions d'amélioration
   */
  static async validateBusinessPlan(project: Project, financialData?: FinancialProjections): Promise<{
    score: number
    issues: Array<{ section: string, issue: string, suggestion: string }>
    improvements: string[]
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/validate-business-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project,
          financialData,
          senegalContext: this.SENEGAL_CONTEXT
        })
      })

      if (!response.ok) {
        throw new Error('Erreur validation IA')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur validation:', error)
      return this.getFallbackValidation(project)
    }
  }

  /**
   * Récupère les sections déjà complétées du business plan
   * Délègue à ContextAggregator pour une meilleure séparation des responsabilités
   */
  private static async getCompletedSections(projectId: string, userId: string): Promise<Record<string, any>> {
    return ContextAggregator.getCompletedSections(projectId, userId)
  }

  /**
   * Détecte automatiquement l'activité précise à partir de la description
   */
  private static detectBusinessActivity(project: Project): string {
    const description = project.basicInfo?.description?.toLowerCase() || ''
    const sector = project.basicInfo?.sector || ''

    // Dictionnaire des sous-activités par secteur
    const activityPatterns: Record<string, Record<string, string[]>> = {
      agriculture: {
        maraichage: ['tomate', 'oignon', 'chou', 'carotte', 'légume', 'maraîchage', 'maraicher'],
        cereales: ['riz', 'mil', 'maïs', 'blé', 'sorgho', 'céréale'],
        horticulture: ['mangue', 'orange', 'banane', 'fruit', 'fraise', 'horticulture', 'arboriculture'],
        elevage: ['volaille', 'bovin', 'ovin', 'caprin', 'poulet', 'élevage', 'bétail'],
        peche: ['pêche', 'poisson', 'aquaculture', 'crevette', 'halieutique']
      },
      construction: {
        batiment: ['chantier', 'bâtiment', 'gros œuvre', 'béton', 'maçonnerie', 'construction'],
        location_materiel: ['échafaudage', 'échafaudages', 'grue', 'engins', 'location', 'matériel'],
        menuiserie: ['menuiserie', 'alu', 'aluminium', 'bois', 'soudure', 'serrurerie', 'métallique'],
        genie_civil: ['route', 'pont', 'infrastructure', 'génie civil', 'voirie']
      },
      commerce_detail: {
        alimentaire: ['épicerie', 'fruits', 'légumes', 'supermarché', 'supérette', 'boucherie', 'alimentation'],
        habillement: ['vêtements', 'vêtement', 'chaussures', 'chaussure', 'boutique', 'friperie', 'mode'],
        electronique: ['téléphone', 'électronique', 'électroménager', 'informatique']
      },
      tourisme: {
        hebergement: ['hôtel', 'auberge', 'gîte', 'chambres', 'hébergement', 'résidence'],
        restauration: ['restaurant', 'café', 'bistro', 'restauration', 'traiteur', 'cantine'],
        ecotourisme: ['parc', 'nature', 'écotourisme', 'safari', 'écologique'],
        tourisme_culturel: ['guide', 'visite', 'patrimoine', 'culturel', 'circuit']
      },
      fintech: {
        paiement: ['paiement', 'wallet', 'mobile money', 'transaction', 'transfert'],
        credit: ['crédit', 'microfinance', 'prêt', 'financement', 'créance'],
        epargne: ['épargne', 'investissement', 'portefeuille', 'tontine'],
        assurance: ['assurance', 'mutuelle', 'couverture', 'garantie']
      },
      technologies: {
        saas: ['saas', 'cloud', 'logiciel', 'application', 'plateforme'],
        ecommerce: ['e-commerce', 'vente en ligne', 'marketplace', 'boutique en ligne'],
        mobile: ['mobile', 'app', 'application mobile', 'android', 'ios'],
        web: ['site web', 'développement web', 'web', 'portail']
      },
      transport: {
        personnes: ['taxi', 'bus', 'transport de personnes', 'navette', 'passagers'],
        marchandises: ['transport de marchandises', 'logistique', 'fret', 'camion', 'livraison'],
        urbain: ['urbain', 'ville', 'agglomération', 'intra-urbain']
      },
      sante: {
        clinique: ['clinique', 'cabinet médical', 'centre de santé', 'dispensaire'],
        pharmacie: ['pharmacie', 'médicaments', 'officine'],
        laboratoire: ['laboratoire', 'analyses', 'biologie', 'radiologie'],
        services_domicile: ['à domicile', 'soins à domicile', 'nursing']
      },
      education: {
        prescolaire: ['préscolaire', 'maternelle', 'crèche', 'jardin d\'enfants'],
        primaire: ['primaire', 'élémentaire', 'école primaire'],
        secondaire: ['collège', 'lycée', 'secondaire'],
        superieur: ['université', 'supérieur', 'enseignement supérieur', 'faculté']
      }
    }

    const sectorPatterns = activityPatterns[sector as string]
    if (!sectorPatterns) return sector

    // Recherche des mots-clés dans la description
    for (const [activity, keywords] of Object.entries(sectorPatterns)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return `${sector} (${activity.replace(/_/g, ' ')})`
      }
    }

    return sector
  }

  /**
   * Construction du prompt contextualisé
   */
  private static buildPrompt(context: AIContext, contentType: string): string {
    const { project } = context

    // Import dynamique des insights sectoriels
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SECTOR_INSIGHTS } = require('@/services/sectorInsights')
    const sector = project.basicInfo?.sector
    const sectorInsight = SECTOR_INSIGHTS[sector as string]

    // Détection automatique de l'activité précise
    const detectedActivity = this.detectBusinessActivity(project)

    // Guard safe pour éviter crash si location manquante
    const location = project.basicInfo?.location
      ? `${project.basicInfo.location.city || 'N/A'}, ${project.basicInfo.location.region || 'N/A'}`
      : 'Sénégal'

    // Formatage des dates
    const startDate = project.basicInfo?.timeline?.startDate
      ? new Date(project.basicInfo.timeline.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : 'Non spécifié'

    const breakEvenDate = 'Non spécifié'  // breakEvenDate removed from timeline type

    // Formatage de l'investissement
    const investment = 'Non spécifié'  // investmentAmount removed from basicInfo type

    // Statut du projet (pour adapter le niveau de détail)
    const statusLabels = {
      draft: 'En rédaction initiale',
      in_progress: 'En cours de développement',
      review: 'En révision',
      completed: 'Complété',
      archived: 'Archivé'
    }
    const projectStatus = statusLabels[project.status as keyof typeof statusLabels] || 'Non spécifié'

    const basePrompt = `
Tu es un expert en business plans spécialisé dans le marché sénégalais.

CONTEXTE DU PROJET:
- Nom: ${project.basicInfo?.name || 'Projet'}
- Description: ${project.basicInfo?.description || 'Non spécifié'}
- Secteur: ${project.basicInfo?.sector || 'Non spécifié'}
- Activité détectée: ${detectedActivity || 'Non détectée'} ✨
- Type: ${project.basicInfo?.projectType || 'Non spécifié'}
- Localisation: ${location}
- Taille prévue: ${project.basicInfo?.companySize || 'Non spécifié'}
- Investissement prévu: ${investment}
- Date de lancement: ${startDate}
- Point mort prévu: ${breakEvenDate}
- Statut du business plan: ${projectStatus}

CONTEXTE SÉNÉGAL (${new Date().getFullYear()}):
- Vision stratégique: Vision Sénégal 2050 (gouvernement actuel)
- Économie: Croissance 4.8%, inflation 3%, chômage 16%
- Taux d'imposition: 30% (sociétés), TVA 18%
- Défis: Accès au financement, infrastructure, formation
- Opportunités: Marché CEDEAO, position géographique, stabilité
- Priorités gouvernementales: Souveraineté alimentaire, transformation numérique, industrialisation
- Programmes de soutien: FONGIP, FAISE, DER, ADEPME, FONSIS

RÈGLES STRICTES - AUCUNE HALLUCINATION:
1. NE t'appuie QUE sur les données fournies et le contexte ci-dessus
2. JAMAIS inventer de chiffres, dates, programmes ou références
3. Si une information manque, écris "Information non disponible"
4. Utilise uniquement des données de 2024-2025
5. Mentionne "Vision Sénégal 2050" (PAS "Sénégal Émergent 2035" qui est obsolète)
6. Cite les sources quand possible (ANSD, Banque Mondiale, etc.)
7. Indique ton niveau de confiance sur les estimations

ADAPTATION INTELLIGENTE:
- Si investissement < 10M FCFA → Recommande stratégies low-cost, marketing digital, bootstrap
- Si investissement > 50M FCFA → Propose stratégies premium, campagnes média, partenariats institutionnels
- Si statut = "En rédaction" → Fournis grandes lignes et structure, pose questions clés
- Si statut = "Complété" → Concentre sur optimisations, améliorations, points de vigilance
- Si point mort prévu proche → Priorise actions rapides et rentabilité immédiate
- Si point mort lointain → Propose développement progressif et investissements long terme

INSTRUCTIONS DE FORMATAGE:
Génère du contenu professionnel, précis et adapté au contexte sénégalais actuel.
Utilise des données réalistes et des recommandations pratiques.
Écris en français avec un ton professionnel mais accessible.
ADAPTE tes recommandations au budget, à la timeline et au statut du projet.

STRUCTURE DE RÉPONSE OBLIGATOIRE:
- Utilise une HIÉRARCHIE CLAIRE avec titres principaux (##) et sous-sections (###)
- Ajoute des EMOJIS pertinents pour chaque thème (📊 🎯 💡 ⚠️ ✅ 🚀 💰 📈 🔍 etc.)
- Présente les informations en LISTES À PUCES pour la lisibilité
- NUMÉROTE les grandes sections (1. 2. 3.)
- AÈRE le texte avec des sauts de ligne entre sections
- Termine TOUJOURS par un encadré "💡 RECOMMANDATIONS CLÉS" (3-5 points actionnables)

Format attendu:
## 🎯 [TITRE PRINCIPAL]

### 1. [Première section]
• Point important 1
• Point important 2

### 2. [Deuxième section]
• Point important 1
• Point important 2

---
💡 **RECOMMANDATIONS CLÉS:**
1. Action prioritaire 1
2. Action prioritaire 2
3. Action prioritaire 3
`

    // Enrichissement sectoriel si disponible
    let sectorSpecificContext = ''
    if (sectorInsight) {
      sectorSpecificContext = `

✨ SPÉCIFICITÉS DU SECTEUR "${sectorInsight.label}":

🔍 QUESTIONS CLÉS À CONSIDÉRER:
${sectorInsight.keyQuestions.map((q: string, i: number) => `   ${i + 1}. ${q}`).join('\n')}

⚠️ DÉFIS SPÉCIFIQUES AU SECTEUR:
${sectorInsight.specificChallenges.map((c: string) => `   • ${c}`).join('\n')}

✅ OPPORTUNITÉS SECTORIELLES AU SÉNÉGAL:
${sectorInsight.opportunities.map((o: string) => `   • ${o}`).join('\n')}

📊 MÉTRIQUES CLÉS À SUIVRE:
${sectorInsight.keyMetrics.map((m: string) => `   • ${m}`).join('\n')}

IMPORTANT: Utilise ces éléments spécifiques au secteur pour enrichir ton analyse et tes recommandations.
`
    }

    const enrichedBasePrompt = basePrompt + sectorSpecificContext

    const specificPrompts = {
      executive_summary: `
${enrichedBasePrompt}

TÂCHE: Rédige un résumé exécutif structuré et percutant:

## 🚀 RÉSUMÉ EXÉCUTIF - ${project.basicInfo?.name || 'Projet'}

### 1. 🎯 L'Opportunité de Marché
• Contexte et problème résolu
• Taille du marché au Sénégal
• Demande non satisfaite

### 2. 💡 La Solution Proposée
• Description de l'offre
• Avantages concurrentiels uniques
• Positionnement sur le marché ${project.basicInfo?.sector || 'Non spécifié'}

### 3. 💰 Projections Financières Clés
• Investissement requis: ${investment}
• Chiffre d'affaires prévisionnel (années 1-3)
• Rentabilité et point mort (prévu: ${breakEvenDate})
• Retour sur investissement estimé

### 4. 👥 Équipe et Demande de Financement
• Profil de l'équipe dirigeante
• Compétences clés
• Montant et utilisation des fonds recherchés

---
💡 **RECOMMANDATIONS CLÉS:**
1. [Action prioritaire 1]
2. [Action prioritaire 2]
3. [Action prioritaire 3]
`,

      market_study: `
${enrichedBasePrompt}

TÂCHE: Rédige une étude de marché complète et structurée:

## 📊 ÉTUDE DE MARCHÉ - Secteur ${project.basicInfo?.sector || 'Non spécifié'}

### 1. 📈 Taille et Tendances du Marché
**Marché Sénégalais:**
• Taille du marché ${project.basicInfo?.sector || 'Non spécifié'} (en FCFA)
• Taux de croissance annuel estimé
• Segments de marché pertinents
• Tendances actuelles et futures (2024-2027)

**Impact Localisation (${location}):**
• Particularités régionales
• Dynamique locale du secteur

### 2. 🎯 Analyse de la Clientèle Cible
**Profils Clients Prioritaires:**
• B2C (particuliers): caractéristiques, pouvoir d'achat
• B2B (entreprises): types, besoins
• B2G (institutions): opportunités

**Comportements d'Achat:**
• Facteurs de décision principaux
• Saisonnalité et cycles de consommation
• Canaux d'accès privilégiés (physique, digital, mixte)

### 3. 🔍 Analyse Concurrentielle
**Concurrents Principaux:**
• Concurrent 1: [Nom] - forces/faiblesses - part de marché estimée
• Concurrent 2: [Nom] - forces/faiblesses - part de marché estimée
• Concurrent 3: [Nom] - forces/faiblesses - part de marché estimée

**Positionnement Concurrentiel:**
• Barrières à l'entrée (faibles/modérées/élevées)
• Niveau de concentration du marché
• Stratégies des leaders

### 4. 💡 Positionnement et Différenciation
**Espace de Marché:**
• Niche ou segment visé
• Avantage concurrentiel unique du projet
• Proposition de valeur distinctive

**Stratégie de Pénétration (budget: ${investment}):**
• Approche recommandée (pénétration/écrémage/niche)
• Canaux de distribution prioritaires
• Tactiques d'acquisition clients

### 5. ⚠️ Opportunités et Défis
**✅ Opportunités:**
• Programmes gouvernementaux (FONGIP, DER, ADEPME)
• Marché CEDEAO (400M habitants)
• Digitalisation et mobile money
• [Autres opportunités spécifiques au secteur]

**🔴 Défis:**
• Infrastructure (énergie, transport, logistique)
• Accès au financement et trésorerie
• Réglementation et formalités
• Concurrence informelle

**🛡️ Stratégies de Mitigation:**
• [Stratégie pour défi 1]
• [Stratégie pour défi 2]
• [Stratégie pour défi 3]

---
💡 **RECOMMANDATIONS CLÉS:**
1. Prioriser [segment client X] pour un démarrage rapide
2. Se différencier par [avantage concurrentiel unique]
3. Exploiter [opportunité principale identifiée]
4. Anticiper [risque majeur] avec [stratégie de mitigation]

Adapte le niveau de détail au statut du BP : ${projectStatus}.
`,

      swot: `
${enrichedBasePrompt}

TÂCHE: Génère une analyse SWOT détaillée et actionnable:

## 🎯 ANALYSE SWOT - ${project.basicInfo?.name || 'Projet'}

### 🟢 FORCES (Strengths)
Avantages compétitifs internes et ressources du projet:
• Force 1: [Avantage concurrentiel principal]
• Force 2: [Compétence clé de l'équipe]
• Force 3: [Ressource distinctive - financière/matérielle/partenariat]
• Force 4: [Positionnement unique sur le marché ${project.basicInfo?.sector || 'Non spécifié'}]
• Force 5: [Autre atout lié au type ${project.basicInfo?.projectType || 'Non spécifié'}]

### 🔴 FAIBLESSES (Weaknesses)
Limitations internes à anticiper et corriger:
• Faiblesse 1: [Limitation principale - ex: budget ${investment}]
• Faiblesse 2: [Manque de compétence ou ressource]
• Faiblesse 3: [Défi d'implantation à ${location}]
• Faiblesse 4: [Autre contrainte interne]

### 🟡 OPPORTUNITÉS (Opportunities)
Facteurs externes favorables à exploiter:
• Opportunité 1: [Tendance de marché favorable au Sénégal]
• Opportunité 2: [Programme de soutien pertinent - FONGIP/DER/ADEPME/FONSIS]
• Opportunité 3: [Évolution technologique ou digitale]
• Opportunité 4: [Marché CEDEAO ou régional]
• Opportunité 5: [Timing favorable - lancement ${startDate}]

### 🔵 MENACES (Threats)
Risques externes à surveiller et mitiger:
• Menace 1: [Concurrence directe ou internationale]
• Menace 2: [Risque réglementaire ou administratif]
• Menace 3: [Défi économique - inflation/change/financement]
• Menace 4: [Risque spécifique au secteur ${project.basicInfo?.sector || 'Non spécifié'}]

### 🎯 Matrice Stratégique
**Forces × Opportunités (Stratégies Offensives):**
• Exploiter [Force X] pour saisir [Opportunité Y]

**Forces × Menaces (Stratégies Défensives):**
• Utiliser [Force X] pour contrer [Menace Y]

**Faiblesses × Opportunités (Stratégies de Réorientation):**
• Corriger [Faiblesse X] pour profiter de [Opportunité Y]

**Faiblesses × Menaces (Stratégies de Survie):**
• Réduire [Faiblesse X] pour minimiser impact de [Menace Y]

---
💡 **RECOMMANDATIONS STRATÉGIQUES CLÉS:**
1. Capitaliser sur [force principale] pour exploiter [opportunité majeure]
2. Développer des partenariats pour combler [faiblesse critique]
3. Anticiper [menace principale] avec [stratégie de mitigation concrète]
4. Suivre indicateurs clés: [2-3 KPIs pertinents]
`,

      marketing_strategy: `
${enrichedBasePrompt}

TÂCHE: Développe une stratégie marketing complète et actionnable:

## 📢 STRATÉGIE MARKETING - ${project.basicInfo?.name || 'Projet'}

### 1. 🎯 Segmentation et Ciblage Client
**Segments de Marché Identifiés (Secteur ${project.basicInfo?.sector || 'Non spécifié'}):**
• Segment Prioritaire 1: [Description] - Taille estimée - Pouvoir d'achat
• Segment Secondaire 2: [Description] - Taille estimée - Pouvoir d'achat
• Segment Tertiaire 3: [Description] - Taille estimée - Pouvoir d'achat

**Impact Localisation (${location}):**
• Spécificités régionales du comportement client
• Adaptation nécessaire au contexte local

**Cible Prioritaire:**
• Profil démographique et socio-économique
• Besoins et motivations d'achat
• Canaux de communication privilégiés

### 2. 💡 Positionnement et Proposition de Valeur
**Positionnement Stratégique:**
• Position visée sur le marché (leader/challenger/niche/suiveur)
• Différenciation vs concurrents principaux
• Adapté au type: ${project.basicInfo?.projectType || 'Non spécifié'}

**Proposition de Valeur Unique (UVP):**
• Bénéfice principal pour le client
• Avantage concurrentiel distinctif
• Raison d'acheter (vs alternatives)

**Promesse de Marque:**
• Message central (en 1 phrase)
• Valeurs véhiculées

### 3. 🛍️ Mix Marketing (4P) Adapté au Sénégal

#### **📦 PRODUIT/SERVICE**
• Caractéristiques principales
• Différenciation (qualité/innovation/service)
• Gamme et déclinaisons prévues
• Packaging et présentation

#### **💰 PRIX**
• Stratégie de pricing recommandée:
  - 🔹 Pénétration (prix bas pour gagner parts de marché)
  - 🔹 Écrémage (prix premium pour segment haut)
  - 🔹 Alignement (prix du marché)
• Fourchette de prix cible (en FCFA)
• Politique de remise et promotions
• Sensibilité prix du segment cible

#### **📍 PLACE (Distribution)**
• Canaux de distribution prioritaires:
  - Vente directe (boutique/bureau)
  - Grossistes et distributeurs locaux
  - Détaillants et points de vente
  - E-commerce et digital
• Couverture géographique (démarrage puis extension)
• Logistique et gestion des stocks

#### **📣 PROMOTION (Communication)**
• Canaux adaptés au budget (${investment}):
  - 📱 Digital: réseaux sociaux (Facebook, WhatsApp, Instagram)
  - 📻 Traditionnels: radio locale, affichage
  - 🎪 Événementiel: salons, démonstrations
  - 🤝 Bouche-à-oreille et recommandations
• Messages clés par canal
• Calendrier de campagnes (premiers 6 mois)

### 4. 📅 Plan d'Action Marketing (Premier Trimestre)
**Mois 1: Lancement**
• Action 1: [Ex: Campagne réseaux sociaux - budget X]
• Action 2: [Ex: Inauguration événement - budget Y]
• Action 3: [Ex: Partenariats influenceurs locaux]

**Mois 2-3: Développement**
• Action 4: [Ex: Programme de fidélité]
• Action 5: [Ex: Expansion canaux distribution]

### 5. 💵 Budget Marketing Estimé
**Répartition Recommandée (Budget total: ${investment}):**
• Digital (40-50%): _____ FCFA
  - Réseaux sociaux et ads: ___ FCFA
  - Site web et e-commerce: ___ FCFA
• Traditionnel (30-40%): _____ FCFA
  - Radio et affichage: ___ FCFA
  - Print et flyers: ___ FCFA
• Événementiel (10-20%): _____ FCFA
• Contingence (5-10%): _____ FCFA

**Ratio Marketing/CA:**
• Recommandation: 8-12% du CA prévisionnel année 1
• Ajustement selon phase (lancement vs croissance)

### 6. 📊 Indicateurs de Performance (KPIs)
• Notoriété de marque (% cible connaissant la marque)
• Coût d'acquisition client (CAC en FCFA)
• Taux de conversion (leads → clients)
• Retour sur investissement marketing (ROMI)
• Taux de fidélisation clients

---
💡 **RECOMMANDATIONS MARKETING CLÉS:**
1. Prioriser [canal X] pour toucher [segment prioritaire] avec budget limité
2. Développer partenariats avec [acteurs locaux] pour crédibilité
3. Exploiter [spécificité culturelle sénégalaise] dans la communication
4. Mesurer systématiquement [KPI critique] pour optimiser ROI
5. Adapter tactiques selon résultats premiers 3 mois

Considère les spécificités culturelles, linguistiques (wolof/français) et économiques sénégalaises.
`,

      financial_analysis: `
${enrichedBasePrompt}

TÂCHE: Analyse financière approfondie et actionnable:

## 💰 ANALYSE FINANCIÈRE - ${project.basicInfo?.name || 'Projet'}

### 1. 📊 Hypothèses et Paramètres de Calcul
**Paramètres Économiques Sénégal (${new Date().getFullYear()}):**
• Inflation: 3% annuelle
• Taux d'imposition: 30% (IS)
• TVA: 18%
• Charges sociales: 24% de la masse salariale
• Taux de change: 1 EUR = 656 FCFA (fixe)

**Hypothèses Projet:**
• Investissement initial: ${investment}
• Date de lancement: ${startDate}
• Point mort prévu: ${breakEvenDate}
• Secteur d'activité: ${project.basicInfo?.sector || 'Non spécifié'}

### 2. 📈 Projections Financières Clés (3 ans)
**Chiffre d'Affaires Prévisionnel:**
• Année 1: _____ FCFA (hypothèse: ___ unités × ___ FCFA)
• Année 2: _____ FCFA (+X% croissance)
• Année 3: _____ FCFA (+Y% croissance)

**Marges et Rentabilité:**
• Marge brute: __% (standard secteur: __%)
• Marge opérationnelle: __%
• Marge nette: __%
• Point mort: Mois __

**Indicateurs de Performance:**
• ROI (Return on Investment): __% sur 3 ans
• TRI (Taux de Rentabilité Interne): __%
• VAN (Valeur Actuelle Nette): _____ FCFA
• Délai de récupération: __ mois

### 3. ⚖️ Analyse de Sensibilité
**Scénarios:**
• 📈 Optimiste (+20% CA): ROI = __%, Point mort = Mois __
• ➡️ Réaliste (base): ROI = __%, Point mort = Mois __
• 📉 Pessimiste (-20% CA): ROI = __%, Point mort = Mois __

**Variables Critiques:**
• Sensibilité au prix de vente: ±10% → Impact ROI ±__%
• Sensibilité au volume: ±10% → Impact ROI ±__%
• Sensibilité aux coûts fixes: ±10% → Impact ROI ±__%

### 4. 🎯 Comparaison Standards du Secteur
**Benchmarks Secteur ${project.basicInfo?.sector || 'Non spécifié'} (Sénégal):**
• Marge brute typique: __% (Projet: __%)
• ROI moyen: __% (Projet: __%)
• Délai point mort: __ mois (Projet: __ mois)
• Ratio d'endettement: __% (Projet: __%)

**Positionnement:**
• ✅ Au-dessus de la moyenne sur: [indicateur 1, 2]
• ⚠️ En-dessous de la moyenne sur: [indicateur 3]

### 5. ⚠️ Risques Financiers Identifiés
**Risques Majeurs:**
• Risque 1: [Ex: Retard paiements clients] - Impact: Élevé - Probabilité: Moyenne
• Risque 2: [Ex: Fluctuation coûts matières] - Impact: Moyen - Probabilité: Élevée
• Risque 3: [Ex: Sous-performance ventes] - Impact: Élevé - Probabilité: Faible

**Stratégies de Mitigation:**
• Risque 1 → [Stratégie: Ex: Avances 30%, crédit clients max 30j]
• Risque 2 → [Stratégie: Ex: Contrats fournisseurs fixes 6 mois]
• Risque 3 → [Stratégie: Ex: Diversification segments]

### 6. 🔧 Recommandations d'Optimisation
**Court Terme (0-6 mois):**
• Action 1: [Ex: Négocier délais paiement fournisseurs à 60j]
• Action 2: [Ex: Réduire stocks pour libérer trésorerie]

**Moyen Terme (6-18 mois):**
• Action 3: [Ex: Automatiser processus pour réduire coûts fixes]
• Action 4: [Ex: Diversifier sources revenus]

**Indicateurs de Suivi:**
• Trésorerie nette quotidienne
• Ratio couverture dettes (>1.5 recommandé)
• Besoin en fonds de roulement (BFR)
• Seuil de rentabilité mensuel

---
💡 **RECOMMANDATIONS FINANCIÈRES CLÉS:**
1. Constituer réserve trésorerie = 3 mois charges fixes (_____ FCFA)
2. Négocier [terme crédit] pour améliorer BFR
3. Suivre hebdomadairement [KPI critique] pour anticiper tensions
4. Envisager [source financement] pour sécuriser démarrage (FONGIP/DER)
5. Maintenir ratio d'endettement < 60% pour préserver autonomie

Utilise les paramètres économiques sénégalais actualisés.
`
    }

    return specificPrompts[contentType as keyof typeof specificPrompts] || basePrompt
  }

  /**
   * Construction du prompt avec contexte inter-sections
   * Utilise ContextAggregator pour récupérer et formater les sections complétées
   */
  private static async buildContextualPrompt(
    context: AIContext,
    contentType: string,
    userId: string
  ): Promise<string> {
    const { project } = context

    // Obtenir le prompt de base (avec enrichissement sectoriel)
    const basePrompt = this.buildPrompt(context, contentType)

    // Récupérer les sections complétées via ContextAggregator
    const completedSections = await this.getCompletedSections(project.id, userId)

    // Agréger et formater le contexte
    const aggregatedContext = ContextAggregator.aggregateContext(completedSections)
    const formattedContext = ContextAggregator.formatContextForPrompt(aggregatedContext)

    // Ajouter le contexte au prompt si des sections sont disponibles
    if (formattedContext) {
      return basePrompt + formattedContext
    }

    return basePrompt
  }

  /**
   * Contexte sénégalais pour l'IA
   */
  private static getSenegalContext(context: AIContext) {
    // Guard safe pour éviter crash si location manquante
    const region = context.project.basicInfo?.location?.region
    return {
      ...this.SENEGAL_CONTEXT,
      localRegion: region ? this.SENEGAL_CONTEXT.regions[region as keyof typeof this.SENEGAL_CONTEXT.regions] : null
    }
  }

  /**
   * Contenu de fallback en cas d'erreur IA - STRICTEMENT VIDE
   */
  private static getFallbackContent(context: AIContext, contentType: string): AIResponse {
    // ✅ RÈGLE STRICTE : Aucun contenu fictif généré automatiquement
    const fallbacks = {
      executive_summary: {
        content: '', // ✅ VIDE - L'utilisateur doit saisir
        suggestions: [
          "Saisissez votre résumé exécutif",
          "Décrivez votre projet en détail",
          "Précisez vos objectifs et votre vision"
        ]
      },
      market_study: {
        content: '', // ✅ VIDE - L'utilisateur doit saisir
        suggestions: [
          "Analysez votre marché cible",
          "Étudiez la concurrence locale",
          "Identifiez les opportunités et défis"
        ]
      },
      swot: {
        content: '', // ✅ VIDE - L'utilisateur doit saisir
        suggestions: [
          "Identifiez vos forces internes",
          "Analysez vos faiblesses",
          "Évaluez les opportunités et menaces externes"
        ]
      }
    }

    const fallback = fallbacks[contentType as keyof typeof fallbacks] || {
      content: '', // ✅ VIDE - Aucun contenu fictif
      suggestions: ["Saisissez votre contenu manuellement"]
    }
    return {
      ...fallback,
      confidence: 0.5
    }
  }

  private static getFallbackMarketAnalysis(project: Project): MarketAnalysisAI {
    return {
      marketSize: `Marché ${project.basicInfo.sector} en croissance au Sénégal`,
      targetAudience: "Population urbaine et semi-urbaine",
      competition: ["Concurrents locaux", "Importations", "Secteur informel"],
      opportunities: [
        "Croissance démographique",
        "Urbanisation croissante",
        "Amélioration du pouvoir d'achat",
        "Accès au marché CEDEAO"
      ],
      threats: [
        "Concurrence informelle",
        "Fluctuations économiques",
        "Défis infrastructurels"
      ],
      recommendations: [
        "Différenciation par la qualité",
        "Stratégie de prix compétitive",
        "Partenariats locaux stratégiques"
      ]
    }
  }

  private static getFallbackSWOT(project: Project): SWOTAnalysisAI {
    return {
      strengths: [
        "Équipe motivée et expérimentée",
        "Connaissance du marché local",
        "Innovation adaptée aux besoins",
        "Stratégie de développement claire"
      ],
      weaknesses: [
        "Ressources financières limitées",
        "Notoriété à construire",
        "Dépendance aux fournisseurs locaux"
      ],
      opportunities: [
        "Marché en croissance",
        "Demande non satisfaite",
        "Soutien gouvernemental aux PME",
        "Accès aux marchés régionaux"
      ],
      threats: [
        "Concurrence établie",
        "Instabilité économique",
        "Réglementation changeante",
        "Défis logistiques"
      ],
      strategicRecommendations: [
        "Capitaliser sur les forces pour saisir les opportunités",
        "Développer des partenariats pour réduire les faiblesses",
        "Mettre en place une veille concurrentielle",
        "Diversifier les risques opérationnels"
      ]
    }
  }

  private static getFallbackValidation(project: Project) {
    return {
      score: 75,
      issues: [
        {
          section: "Financier",
          issue: "Projections manquantes",
          suggestion: "Complétez le moteur financier"
        },
        {
          section: "Marché",
          issue: "Étude de marché à approfondir",
          suggestion: "Ajoutez une analyse concurrentielle détaillée"
        }
      ],
      improvements: [
        "Précisez votre stratégie marketing",
        "Détaillez votre plan opérationnel",
        "Renforcez l'analyse financière"
      ]
    }
  }
}