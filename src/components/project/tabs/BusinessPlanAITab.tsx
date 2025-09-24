'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  FileText,
  Wand2,
  RefreshCw,
  Save,
  Download,
  Eye,
  BarChart3,
  Shield,
  TrendingUp,
  AlertTriangle,
  Users,
  Building,
  Target,
  Briefcase,
  CreditCard,
  CheckCircle,
  MessageSquare
} from 'lucide-react'

interface BusinessPlanAITabProps {
  project: any
}

interface BusinessPlanSection {
  id: string
  title: string
  content: string
  icon: any
  status: 'empty' | 'generating' | 'completed'
}

const businessPlanSections: BusinessPlanSection[] = [
  {
    id: 'executive-summary',
    title: 'Résumé Exécutif',
    content: '',
    icon: FileText,
    status: 'empty'
  },
  {
    id: 'market-analysis',
    title: 'Analyse de Marché',
    content: '',
    icon: BarChart3,
    status: 'empty'
  },
  {
    id: 'swot-analysis',
    title: 'Étude Secteur & SWOT',
    content: '',
    icon: TrendingUp,
    status: 'empty'
  },
  {
    id: 'technical-study',
    title: 'Étude Technique',
    content: '',
    icon: Shield,
    status: 'empty'
  },
  {
    id: 'financial-projections',
    title: 'Projections Financières',
    content: '',
    icon: BarChart3,
    status: 'empty'
  },
  {
    id: 'risk-analysis',
    title: 'Risques & Mesures d\'Atténuation',
    content: '',
    icon: AlertTriangle,
    status: 'empty'
  },
  {
    id: 'company-presentation',
    title: 'Présentation de l\'Entreprise',
    content: '',
    icon: Building,
    status: 'empty'
  },
  {
    id: 'products-services',
    title: 'Produits & Services',
    content: '',
    icon: Briefcase,
    status: 'empty'
  },
  {
    id: 'competitive-strategy',
    title: 'Stratégie Concurrentielle',
    content: '',
    icon: Target,
    status: 'empty'
  },
  {
    id: 'marketing-sales',
    title: 'Stratégie Marketing & Ventes',
    content: '',
    icon: MessageSquare,
    status: 'empty'
  },
  {
    id: 'funding-plan',
    title: 'Plan de Financement',
    content: '',
    icon: CreditCard,
    status: 'empty'
  },
  {
    id: 'socio-economic-impact',
    title: 'Impacts Socio-Économiques',
    content: '',
    icon: Users,
    status: 'empty'
  },
  {
    id: 'implementation-plan',
    title: 'Plan de Mise en Œuvre',
    content: '',
    icon: CheckCircle,
    status: 'empty'
  }
]

export function BusinessPlanAITab({ project }: BusinessPlanAITabProps) {
  const [sections, setSections] = useState<BusinessPlanSection[]>(businessPlanSections)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadBusinessPlanContent()
  }, [project.id])

  const loadBusinessPlanContent = async () => {
    try {
      const { data, error } = await supabase
        .from('business_plan_content')
        .select('*')
        .eq('project_id', project.id)

      if (data && data.length > 0) {
        const updatedSections = sections.map(section => {
          const savedContent = data.find(item => item.section_id === section.id)
          return {
            ...section,
            content: savedContent?.content || '',
            status: savedContent?.content ? 'completed' : 'empty'
          }
        })
        setSections(updatedSections)
      }
    } catch (error) {
      console.error('Erreur chargement contenu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveBusinessPlanContent = async (sectionId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('business_plan_content')
        .upsert({
          project_id: project.id,
          section_id: sectionId,
          content: content,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  const generateBusinessPlan = async () => {
    setIsGenerating(true)
    try {
      // Récupérer les données du projet pour le contexte
      const [products, identity, financialData] = await Promise.all([
        supabase.from('products').select('*').eq('project_id', project.id),
        supabase.from('company_identity').select('*').eq('project_id', project.id).single(),
        supabase.from('financial_outputs').select('*').eq('project_id', project.id).order('period')
      ])

      const contextData = {
        project: project,
        products: products.data || [],
        identity: identity.data || {},
        financialData: financialData.data || [],
        customPrompt: customPrompt
      }

      // Générer le contenu avec l'IA (simulation pour le moment)
      for (const section of sections) {
        setSections(prev => prev.map(s =>
          s.id === section.id ? { ...s, status: 'generating' } : s
        ))

        // Simulation de génération IA
        await new Promise(resolve => setTimeout(resolve, 2000))

        const generatedContent = await generateSectionContent(section.id, contextData)

        setSections(prev => prev.map(s =>
          s.id === section.id
            ? { ...s, content: generatedContent, status: 'completed' }
            : s
        ))

        // Sauvegarder le contenu généré
        await saveBusinessPlanContent(section.id, generatedContent)
      }

      alert('Business Plan généré avec succès!')
    } catch (error) {
      console.error('Erreur génération:', error)
      alert('Erreur lors de la génération du business plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSectionContent = async (sectionId: string, contextData: any): Promise<string> => {
    // Ici on appellerait l'API d'IA (Gemini, OpenAI, etc.)
    // Pour le moment, simulation avec du contenu générique

    const templates = {
      'executive-summary': `
RÉSUMÉ EXÉCUTIF - ${contextData.project.name}

${contextData.project.name} est une entreprise du secteur ${contextData.project.sector} qui vise à développer ses activités sur le marché sénégalais.

Notre projet se distingue par :
- Une approche innovante adaptée au contexte local
- Une équipe expérimentée et motivée
- Un modèle économique viable et rentable

Financement demandé : À définir selon les projections financières
Horizon de remboursement : ${contextData.project.horizon_years} ans
Impact attendu : Création d'emplois et développement économique local
      `,
      'market-analysis': `
ANALYSE DE MARCHÉ

Le marché du ${contextData.project.sector} au Sénégal présente des opportunités intéressantes :

1. TAILLE DU MARCHÉ
- Marché en croissance de X% par an
- Demande non satisfaite identifiée
- Potentiel d'expansion sous-régionale

2. CONCURRENCE
- Analyse des acteurs existants
- Positionnement concurrentiel
- Avantages différenciants

3. TENDANCES
- Évolution des besoins clients
- Impact des nouvelles technologies
- Réglementations favorables
      `,
      'swot-analysis': `
ANALYSE SWOT

FORCES :
- Expertise de l'équipe dirigeante
- Positionnement unique sur le marché
- Partenariats stratégiques établis
- Adaptation aux besoins locaux

FAIBLESSES :
- Besoin de financement initial
- Notoriété à construire
- Dépendance aux fournisseurs clés

OPPORTUNITÉS :
- Marché en croissance
- Soutien gouvernemental aux PME
- Digitalisation du secteur
- Accès aux marchés sous-régionaux

MENACES :
- Concurrence internationale
- Fluctuations économiques
- Risques réglementaires
- Défis logistiques
      `,
      'technical-study': `
ÉTUDE TECHNIQUE

1. INFRASTRUCTURE REQUISE
- Locaux et aménagements
- Équipements et matériels
- Systèmes informatiques
- Respect des normes de sécurité

2. PROCESSUS OPÉRATIONNELS
- Chaîne de production/prestation
- Contrôle qualité
- Gestion des stocks
- Logistique et distribution

3. RESSOURCES HUMAINES
- Profils recherchés
- Formation nécessaire
- Organisation du travail
- Politique salariale

4. ASPECTS RÉGLEMENTAIRES
- Licences et autorisations
- Normes sectorielles
- Contraintes environnementales
      `,
      'financial-projections': `
PROJECTIONS FINANCIÈRES

Les projections financières sur ${contextData.project.horizon_years} ans montrent :

1. CHIFFRE D'AFFAIRES
- Année 1 : [À compléter selon données financières]
- Croissance prévue : X% par an
- Diversification progressive des revenus

2. CHARGES
- Investissements initiaux
- Coûts opérationnels
- Frais de personnel
- Charges financières

3. RENTABILITÉ
- Seuil de rentabilité : Mois X
- Marge brute : X%
- ROI attendu : X%

4. BESOINS DE FINANCEMENT
- Capital initial requis
- Fonds de roulement
- Plan de remboursement
      `,
      'risk-analysis': `
ANALYSE DES RISQUES

1. RISQUES COMMERCIAUX
Risque : Évolution défavorable du marché
Mesure : Diversification de l'offre et veille concurrentielle

Risque : Perte de clients clés
Mesure : Fidélisation et diversification du portefeuille

2. RISQUES OPÉRATIONNELS
Risque : Défaillance des équipements
Mesure : Maintenance préventive et assurances

Risque : Ruptures d'approvisionnement
Mesure : Plusieurs fournisseurs et stocks de sécurité

3. RISQUES FINANCIERS
Risque : Difficultés de trésorerie
Mesure : Suivi de cash-flow et lignes de crédit

Risque : Évolution des taux d'intérêt
Mesure : Négociation de taux fixes

4. RISQUES EXTERNES
Risque : Changements réglementaires
Mesure : Veille juridique et conformité proactive
      `,
      'socio-economic-impact': `
IMPACTS SOCIO-ÉCONOMIQUES

1. CRÉATION D'EMPLOIS
- Emplois directs : X postes
- Emplois indirects : X postes
- Formation de jeunes
- Promotion de l'entrepreneuriat féminin

2. CONTRIBUTION ÉCONOMIQUE
- Valeur ajoutée locale
- Taxes et impôts générés
- Devises économisées/générées
- Effet multiplicateur

3. IMPACT SOCIAL
- Amélioration de l'offre de services/produits
- Transfert de compétences
- Contribution au développement local
- Responsabilité sociétale

4. IMPACT ENVIRONNEMENTAL
- Respect des normes environnementales
- Initiatives écologiques
- Gestion des déchets
- Économies d'énergie
      `,
      'company-presentation': `
PRÉSENTATION DE L'ENTREPRISE

1. HISTORIQUE ET CONTEXTE
${contextData.project.name} est une entreprise évoluant dans le secteur ${contextData.project.sector}.
Créée en [année], elle s'est positionnée comme un acteur clé de son marché.

2. MISSION ET VISION
Mission : Fournir des solutions innovantes et de qualité adaptées au marché sénégalais
Vision : Devenir le leader de référence dans notre secteur d'activité

3. VALEURS
- Excellence opérationnelle
- Innovation continue
- Engagement social
- Durabilité environnementale

4. STRUCTURE JURIDIQUE
Forme juridique : [A compléter selon fiche d'identité]
Capital social : [Montant]
Dirigeants : [Liste des dirigeants]
      `,
      'products-services': `
PRODUITS ET SERVICES

1. OFFRE PRINCIPALE
Nos produits/services répondent aux besoins spécifiques du marché ${contextData.project.sector} :

[Détail des produits/services basé sur les données financières]

2. AVANTAGES CONCURRENTIELS
- Qualité supérieure des produits/services
- Prix compétitifs
- Service client de proximité
- Adaptation aux spécificités locales

3. DÉVELOPPEMENT PRODUIT
- Innovation continue
- Écoute client
- Amélioration constante
- Extension de gamme prévue

4. GARANTIES ET SERVICES ASSOCIÉS
- Service après-vente
- Garanties offertes
- Formation clients
- Support technique
      `,
      'competitive-strategy': `
STRATÉGIE CONCURRENTIELLE

1. POSITIONNEMENT SUR LE MARCHÉ
Nous nous positionnons comme [leader/challenger/spécialiste] sur le segment [définir].

2. AVANTAGES DIFFÉRENCIANTS
- Innovation technologique
- Proximité client
- Flexibilité opérationnelle
- Expertise locale

3. ANALYSE CONCURRENTIELLE
Concurrents directs : [Liste]
Concurrents indirects : [Liste]
Barrières à l'entrée : [Analyse]

4. STRATÉGIE DE DIFFÉRENCIATION
- Innovation produit/service
- Qualité supérieure
- Service personnalisé
- Prix compétitifs

5. PLAN D'ACTION CONCURRENTIEL
- Veille concurrentielle
- Amélioration continue
- Développement de nouveaux avantages
- Fidélisation client
      `,
      'marketing-sales': `
STRATÉGIE MARKETING ET VENTES

1. SEGMENTATION ET CIBLAGE
Marché cible principal : [Définir]
Segments secondaires : [Liste]
Personas clients : [Détail]

2. POSITIONNEMENT
Message clé : [Définir]
Proposition de valeur : [Détail]

3. MIX MARKETING (4P)
Produit : [Caractéristiques clés]
Prix : [Stratégie tarifaire]
Place : [Canaux de distribution]
Promotion : [Actions marketing]

4. STRATÉGIE DIGITALE
- Présence en ligne
- Réseaux sociaux
- Marketing digital
- E-commerce (si applicable)

5. PLAN COMMERCIAL
- Organisation équipe vente
- Objectifs commerciaux
- Outils de vente
- Suivi performance
      `,
      'funding-plan': `
PLAN DE FINANCEMENT

1. BESOINS DE FINANCEMENT
Investissements initiaux :
- Équipements : [Montant] XOF
- Aménagements : [Montant] XOF
- Stocks initiaux : [Montant] XOF
- Fonds de roulement : [Montant] XOF

Total besoins : [Montant total] XOF

2. SOURCES DE FINANCEMENT
Apports personnels : [Montant] XOF ([%])
Emprunt bancaire : [Montant] XOF ([%])
Subventions/Aides : [Montant] XOF ([%])
Partenaires : [Montant] XOF ([%])

3. CONDITIONS DE FINANCEMENT
Durée d'emprunt : ${contextData.project.horizon_years} ans
Taux d'intérêt : [%] (estimation)
Garanties offertes : [Détail]

4. PLAN DE REMBOURSEMENT
[Tableau de remboursement prévisionnel]

5. RENTABILITÉ PROJET
VAN : [Montant] XOF
TRI : [%]
Payback : [Mois/Années]
      `,
      'implementation-plan': `
PLAN DE MISE EN ŒUVRE

1. PHASES DU PROJET
Phase 1 : Préparation et financement (Mois 1-3)
- Finalisation financement
- Recherche locaux
- Recrutement équipe clé

Phase 2 : Installation et lancement (Mois 4-6)
- Aménagement locaux
- Installation équipements
- Formation équipe
- Tests et mise en service

Phase 3 : Montée en charge (Mois 7-12)
- Lancement commercial
- Développement clientèle
- Optimisation processus

2. JALONS CLÉS
[Planning détaillé avec dates]

3. RESSOURCES NÉCESSAIRES
Équipe projet : [Organisation]
Budget par phase : [Répartition]
Partenaires clés : [Liste]

4. RISQUES ET CONTINGENCES
[Identification des risques majeurs]
[Plans de contingence]

5. SUIVI ET CONTRÔLE
Indicateurs de performance : [KPIs]
Fréquence reporting : [Périodicité]
Comité de pilotage : [Organisation]
      `
    }

    return templates[sectionId] || `Contenu généré pour ${sectionId}`
  }

  const regenerateSection = async (sectionId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, status: 'generating' } : s
    ))

    try {
      const contextData = { project, customPrompt }
      const newContent = await generateSectionContent(sectionId, contextData)

      setSections(prev => prev.map(s =>
        s.id === sectionId
          ? { ...s, content: newContent, status: 'completed' }
          : s
      ))

      await saveBusinessPlanContent(sectionId, newContent)
    } catch (error) {
      console.error('Erreur régénération:', error)
    }
  }

  const updateSectionContent = (sectionId: string, content: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, content } : s
    ))

    // Auto-save après 2 secondes
    setTimeout(() => {
      saveBusinessPlanContent(sectionId, content)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-lg h-32"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    )
  }

  if (activeSection) {
    const section = sections.find(s => s.id === activeSection)
    if (section) {
      const Icon = section.icon
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => regenerateSection(section.id)}
                disabled={section.status === 'generating'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveSection(null)}
              >
                ← Retour
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <Textarea
                value={section.content}
                onChange={(e) => updateSectionContent(section.id, e.target.value)}
                placeholder="Contenu de la section..."
                className="min-h-96 text-sm"
              />
              {section.status === 'generating' && (
                <div className="mt-4 flex items-center text-blue-600">
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Génération en cours...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Plan IA</h1>
        <p className="text-gray-600">
          Générez automatiquement le contenu de votre business plan avec l'intelligence artificielle
        </p>
      </div>

      {/* Canevas/Prompt personnalisé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
            Canevas de Présentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Décrivez votre vision, vos objectifs spécifiques, votre positionnement unique, ou tout autre élément que l'IA doit prendre en compte pour personnaliser votre business plan..."
            rows={4}
            className="mb-4"
          />
          <Button
            onClick={generateBusinessPlan}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? 'Génération en cours...' : 'Générer Business Plan'}
          </Button>
        </CardContent>
      </Card>

      {/* Sections du Business Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                section.status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : section.status === 'generating'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{section.title}</span>
                  </div>
                  {section.status === 'generating' && (
                    <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                  )}
                  {section.status === 'completed' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 line-clamp-3">
                  {section.content || 'Cliquez pour éditer ou générer le contenu...'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions globales */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}