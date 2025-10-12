/**
 * ✨ SERVICE D'EXPORT PDF COMPLET PROFESSIONNEL
 * Génération PDF avec TOUTES les sections BP + FONGIP
 * Support jsPDF + html2canvas pour vraie génération PDF
 */

import { Project } from '@/types/project'
import { FicheSynoptiqueService } from './ficheSynoptiqueService'
import { AnalyseFinanciereHistoriqueService } from './analyseFinanciereHistoriqueService'
import { TableauxFinanciersService } from './tableauxFinanciersService'
import { RelationsBancairesService } from './relationsBancairesService'
import { CalculsFinanciersAvancesService } from './calculsFinanciersAvancesService'
import { FONGIPScoringService } from './fongipScoringService'

// ========== TYPES ==========

export interface PDFSection {
  id: string
  title: string
  category: 'bp_classique' | 'fongip' | 'autres'
  icon: string
  order: number
  isRequired: boolean
  isAvailable: boolean
  content?: string
}

export interface PDFExportOptions {
  // Sections BP Classique
  includeResume: boolean
  includeIdentification: boolean
  includeMarketStudy: boolean
  includeSWOT: boolean
  includeMarketing: boolean
  includeHR: boolean
  includeFinancial: boolean
  includeTableauxFinanciers: boolean // ✅ AJOUTÉ
  includeRentabilite: boolean // ✅ AJOUTÉ

  // Modules FONGIP
  includeFicheSynoptique: boolean
  includeAnalyseFinanciere: boolean
  includeRelationsBancaires: boolean
  includeVanTriDrci: boolean
  includeProjectionsFinancieres: boolean
  includeScoringFongip: boolean

  // Nouvelles sections professionnelles FONGIP
  includeTechnicalStudy: boolean
  includeRiskAnalysis: boolean
  includeStructuredConclusion: boolean
  includeContextJustification: boolean

  // Options générales
  includeCover: boolean
  includeTableOfContents: boolean
  includeAppendices: boolean

  // Template
  template: 'fongip' | 'banque' | 'pitch' | 'complet'

  // Personnalisation
  companyLogo?: string
  watermark?: string
  pageNumbers: boolean
  colorScheme: 'blue' | 'green' | 'purple'
}

export interface ExportedPDFData {
  project: Project
  sections: PDFSection[]
  fongipData?: {
    ficheSynoptique?: any
    analyseFinanciere?: any
    tableauxFinanciers?: any
    relationsBancaires?: any
    vanTriDrci?: any
    scoring?: any
    financialNarrative?: any
  }
  metadata: {
    generatedAt: Date
    generatedBy: string
    template: string
    version: string
  }
}

// ========== TEMPLATES PRÉDÉFINIS ==========

export const EXPORT_TEMPLATES: Record<string, Partial<PDFExportOptions>> = {
  fongip: {
    // Template FONGIP complet professionnel
    includeResume: true,
    includeIdentification: true,
    includeMarketStudy: true,
    includeSWOT: true,
    includeMarketing: true,
    includeHR: true,
    includeFinancial: true,
    includeFicheSynoptique: true,
    includeAnalyseFinanciere: true,
    includeTableauxFinanciers: true,
    includeRelationsBancaires: true,
    includeVanTriDrci: true,
    includeProjectionsFinancieres: true,
    includeScoringFongip: true,
    // Nouvelles sections professionnelles
    includeTechnicalStudy: true,
    includeRiskAnalysis: true,
    includeStructuredConclusion: true,
    includeContextJustification: true,
    // Présentation
    includeCover: true,
    includeTableOfContents: true,
    includeAppendices: true,
    template: 'fongip',
    pageNumbers: true,
    colorScheme: 'blue'
  },
  banque: {
    // Template optimisé banques
    includeResume: true,
    includeIdentification: true,
    includeMarketStudy: true,
    includeSWOT: true,
    includeFinancial: true,
    includeFicheSynoptique: true,
    includeAnalyseFinanciere: true,
    includeTableauxFinanciers: true,
    includeRelationsBancaires: true,
    includeVanTriDrci: true,
    includeProjectionsFinancieres: true,
    includeScoringFongip: true,
    includeMarketing: false,
    includeHR: false,
    includeCover: true,
    includeTableOfContents: true,
    includeAppendices: false,
    template: 'banque',
    pageNumbers: true,
    colorScheme: 'green'
  },
  pitch: {
    // Template pitch investisseurs
    includeResume: true,
    includeMarketStudy: true,
    includeSWOT: true,
    includeFinancial: true,
    includeProjectionsFinancieres: true,
    includeVanTriDrci: true,
    includeIdentification: false,
    includeFicheSynoptique: true,
    includeAnalyseFinanciere: false,
    includeTableauxFinanciers: false,
    includeRelationsBancaires: false,
    includeMarketing: true,
    includeHR: false,
    includeScoringFongip: false,
    includeCover: true,
    includeTableOfContents: false,
    includeAppendices: false,
    template: 'pitch',
    pageNumbers: true,
    colorScheme: 'purple'
  },
  complet: {
    // Template tout inclus
    includeResume: true,
    includeIdentification: true,
    includeMarketStudy: true,
    includeSWOT: true,
    includeMarketing: true,
    includeHR: true,
    includeFinancial: true,
    includeTableauxFinanciers: true, // ✅ AJOUTÉ
    includeRentabilite: true, // ✅ AJOUTÉ
    includeFicheSynoptique: true,
    includeAnalyseFinanciere: true,
    includeRelationsBancaires: true,
    includeVanTriDrci: true,
    includeProjectionsFinancieres: true,
    includeScoringFongip: true,
    includeCover: true,
    includeTableOfContents: true,
    includeAppendices: true,
    template: 'complet',
    pageNumbers: true,
    colorScheme: 'blue'
  }
}

// ========== SERVICE PRINCIPAL ==========

export class CompletePDFExportService {

  /**
   * Récupère toutes les sections disponibles pour un projet
   */
  static async getAvailableSections(projectId: string): Promise<PDFSection[]> {
    const sections: PDFSection[] = []
    let order = 0

    // ========== BP CLASSIQUE ==========
    sections.push({
      id: 'resume',
      title: 'Résumé Exécutif',
      category: 'bp_classique',
      icon: '📄',
      order: order++,
      isRequired: true,
      isAvailable: true
    })

    sections.push({
      id: 'identification',
      title: 'Identification de l\'Entreprise',
      category: 'bp_classique',
      icon: '🏢',
      order: order++,
      isRequired: true,
      isAvailable: true
    })

    sections.push({
      id: 'market',
      title: 'Étude de Marché',
      category: 'bp_classique',
      icon: '📊',
      order: order++,
      isRequired: true,
      isAvailable: true
    })

    sections.push({
      id: 'swot',
      title: 'Analyse SWOT',
      category: 'bp_classique',
      icon: '🛡️',
      order: order++,
      isRequired: false,
      isAvailable: true
    })

    sections.push({
      id: 'marketing',
      title: 'Stratégie Marketing',
      category: 'bp_classique',
      icon: '📢',
      order: order++,
      isRequired: false,
      isAvailable: true
    })

    sections.push({
      id: 'hr',
      title: 'Ressources Humaines',
      category: 'bp_classique',
      icon: '👥',
      order: order++,
      isRequired: false,
      isAvailable: true
    })

    sections.push({
      id: 'financial',
      title: 'Plan de Financement',
      category: 'bp_classique',
      icon: '💰',
      order: order++,
      isRequired: true,
      isAvailable: true
    })

    // ========== MODULES FONGIP ==========

    // Vérifier si fiche synoptique existe
    try {
      const fiche = await FicheSynoptiqueService.getFicheSynoptique(projectId)
      sections.push({
        id: 'fiche_synoptique',
        title: 'Fiche Synoptique FONGIP',
        category: 'fongip',
        icon: '📋',
        order: order++,
        isRequired: true,
        isAvailable: !!fiche
      })
    } catch {
      sections.push({
        id: 'fiche_synoptique',
        title: 'Fiche Synoptique FONGIP',
        category: 'fongip',
        icon: '📋',
        order: order++,
        isRequired: true,
        isAvailable: false
      })
    }

    // Analyse financière historique
    try {
      const analyse = await AnalyseFinanciereHistoriqueService.getAnalyse(projectId)
      sections.push({
        id: 'analyse_financiere',
        title: 'Analyse Financière Historique (3 ans)',
        category: 'fongip',
        icon: '📈',
        order: order++,
        isRequired: true,
        isAvailable: !!analyse
      })
    } catch {
      sections.push({
        id: 'analyse_financiere',
        title: 'Analyse Financière Historique (3 ans)',
        category: 'fongip',
        icon: '📈',
        order: order++,
        isRequired: true,
        isAvailable: false
      })
    }

    // Tableaux financiers
    try {
      const tableaux = await TableauxFinanciersService.getTableauxFinanciers(projectId)
      sections.push({
        id: 'tableaux_financiers',
        title: 'Tableaux Financiers Détaillés',
        category: 'fongip',
        icon: '📊',
        order: order++,
        isRequired: true,
        isAvailable: !!tableaux
      })
    } catch {
      sections.push({
        id: 'tableaux_financiers',
        title: 'Tableaux Financiers Détaillés',
        category: 'fongip',
        icon: '📊',
        order: order++,
        isRequired: true,
        isAvailable: false
      })
    }

    // Relations bancaires
    try {
      const relations = await RelationsBancairesService.getRelationsBancaires(projectId)
      sections.push({
        id: 'relations_bancaires',
        title: 'Relations Bancaires',
        category: 'fongip',
        icon: '🏦',
        order: order++,
        isRequired: true,
        isAvailable: !!relations
      })
    } catch {
      sections.push({
        id: 'relations_bancaires',
        title: 'Relations Bancaires',
        category: 'fongip',
        icon: '🏦',
        order: order++,
        isRequired: true,
        isAvailable: false
      })
    }

    // VAN/TRI/DRCI
    sections.push({
      id: 'van_tri_drci',
      title: 'Analyse de Rentabilité (VAN/TRI/DRCI)',
      category: 'fongip',
      icon: '✨',
      order: order++,
      isRequired: true,
      isAvailable: true
    })

    // Projections financières
    sections.push({
      id: 'projections',
      title: 'Projections Financières (ROI/IRR/NPV)',
      category: 'fongip',
      icon: '📉',
      order: order++,
      isRequired: true,
      isAvailable: true
    })

    // Scoring FONGIP
    sections.push({
      id: 'scoring_fongip',
      title: 'Score FONGIP & Recommandations',
      category: 'fongip',
      icon: '⭐',
      order: order++,
      isRequired: false,
      isAvailable: true
    })

    return sections
  }

  /**
   * Prépare les données complètes pour l'export
   */
  static async prepareExportData(
    project: Project,
    projectId: string,
    options: PDFExportOptions
  ): Promise<ExportedPDFData> {

    const sections = await this.getAvailableSections(projectId)

    // Charger les données FONGIP si nécessaire
    const fongipData: any = {}

    if (options.includeFicheSynoptique) {
      try {
        console.log('🔍 Chargement fiche synoptique pour projet:', projectId)
        fongipData.ficheSynoptique = await FicheSynoptiqueService.getFicheSynoptique(projectId)
        
        // Si pas de fiche synoptique, en générer une automatiquement
        if (!fongipData.ficheSynoptique) {
          console.log('📝 Génération automatique fiche synoptique')
          const generatedFiche = await FicheSynoptiqueService.generateFromProject(projectId, 'system')
          fongipData.ficheSynoptique = generatedFiche
        }
        
        console.log('✅ Fiche synoptique chargée:', fongipData.ficheSynoptique ? 'OUI' : 'NON')
        if (fongipData.ficheSynoptique) {
          console.log('📋 Données fiche synoptique:', {
            hasPresentationEntreprise: !!fongipData.ficheSynoptique.presentationEntreprise,
            hasPresentationProjet: !!fongipData.ficheSynoptique.presentationProjet,
            hasConditionsFinancement: !!fongipData.ficheSynoptique.conditionsFinancement,
            hasGaranties: !!fongipData.ficheSynoptique.garanties
          })
        }
      } catch (error) {
        console.warn('❌ Fiche synoptique non disponible:', error)
      }
    }

    if (options.includeAnalyseFinanciere) {
      try {
        fongipData.analyseFinanciere = await AnalyseFinanciereHistoriqueService.getAnalyse(projectId)
      } catch (error) {
        console.warn('Analyse financière non disponible:', error)
      }
    }

    if (options.includeTableauxFinanciers) {
      try {
        fongipData.tableauxFinanciers = await TableauxFinanciersService.getTableauxFinanciers(projectId)
      } catch (error) {
        console.warn('Tableaux financiers non disponibles:', error)
      }
    }

    // Charger la narrative financière (texte BP) si présente
    try {
      const narrative = (project.sections as any)?.financialNarrative
      if (narrative) {
        fongipData.financialNarrative = narrative
      }
    } catch (error) {
      console.warn('Narrative financière non disponible:', error)
    }

    if (options.includeRelationsBancaires) {
      try {
        const relations = await RelationsBancairesService.getRelationsBancaires(projectId)
        if (relations) {
          fongipData.relationsBancaires = {
            ...relations,
            note: RelationsBancairesService.calculateNoteBancaire(relations)
          }
        }
      } catch (error) {
        console.warn('Relations bancaires non disponibles:', error)
      }
    }

    if (options.includeScoringFongip) {
      try {
        // Calculer le scoring FONGIP complet
        fongipData.scoring = await FONGIPScoringService.calculateProjectScore(projectId)
      } catch (error) {
        console.warn('Scoring FONGIP non disponible:', error)
      }
    }

    return {
      project,
      sections,
      fongipData,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'BP Design Pro',
        template: options.template,
        version: '2.0.0'
      }
    }
  }

  /**
   * ✅ Préparer les données d'export DEPUIS LE DOCUMENT PRINCIPAL UNIQUEMENT
   * Utilisé côté serveur où on n'a pas d'authentification Firebase pour les sous-collections
   */
  static async prepareExportDataFromMainDocument(
    project: Project,
    projectId: string,
    options: PDFExportOptions,
    ficheSynoptiqueData?: any
  ): Promise<ExportedPDFData> {

    console.log('🔍 DEBUG prepareExportDataFromMainDocument:', {
      projectId,
      hasBusinessPlan: !!project.businessPlan,
      hasSections: !!project.sections,
      sectionsKeys: project.sections ? Object.keys(project.sections) : [],
      businessPlanKeys: project.businessPlan ? Object.keys(project.businessPlan) : [],
      marketStudy: project.sections?.marketStudy ? Object.keys(project.sections.marketStudy) : 'undefined',
      swotAnalysis: project.sections?.swotAnalysis ? Object.keys(project.sections.swotAnalysis) : 'undefined',
      marketingPlan: project.sections?.marketingPlan ? Object.keys(project.sections.marketingPlan) : 'undefined'
    })

    // Sections disponibles (basées sur ce qui existe dans project.sections et project.businessPlan)
    const sections: PDFSection[] = []
    let order = 1

    // Déterminer quelles sections sont disponibles
    const sectionChecks = [
      { id: 'resume', title: 'Résumé Exécutif', available: !!(project.sections?.executiveSummary || project.businessPlan?.executiveSummary) },
      { id: 'identification', title: 'Identification', available: !!(project.sections?.companyIdentification || project.basicInfo) },
      { id: 'market', title: 'Étude de Marché', available: !!(project.sections?.marketStudy || project.businessPlan?.marketStudy) },
      { id: 'swot', title: 'Analyse SWOT', available: !!(project.sections?.swotAnalysis || project.businessPlan?.swotAnalysis) },
      { id: 'marketing', title: 'Stratégie Marketing', available: !!(project.sections?.marketingPlan || project.businessPlan?.marketingPlan) },
      { id: 'hr', title: 'Ressources Humaines', available: !!(project.sections?.humanResources || project.businessPlan?.humanResources) },
      { id: 'financial', title: 'Plan Financier', available: !!(project.sections?.financialPlan || project.businessPlan?.financialPlan || project.sections?.financialEngine) },
      { id: 'tableaux', title: 'Tableaux Financiers', available: !!(project.sections?.financialEngine || project.sections?.financialTablesExport || project.sections?.tableauxFinanciers) },
      { id: 'rentabilite', title: 'Analyse de Rentabilité', available: !!(project.sections?.analyseRentabilite || project.businessPlan?.analyseRentabilite) },
    ]

    sectionChecks.forEach(check => {
      if (check.available) {
        sections.push({
          id: check.id,
          title: check.title,
          category: 'bp_classique',
          icon: '📄',
          order: order++,
          isRequired: false,
          isAvailable: true
        })
      }
    })

    // Charger les données FONGIP depuis le document principal
    const fongipData: any = {}

    if (options.includeFicheSynoptique) {
      // ✅ NOUVELLE APPROCHE : Utiliser les données envoyées depuis le client
      if (ficheSynoptiqueData) {
        console.log('📋 Utilisation fiche synoptique envoyée depuis le client')
        fongipData.ficheSynoptique = ficheSynoptiqueData
        console.log('✅ Fiche synoptique chargée depuis le client:', {
          hasPresentationEntreprise: !!fongipData.ficheSynoptique.presentationEntreprise,
          hasPresentationProjet: !!fongipData.ficheSynoptique.presentationProjet,
          hasConditionsFinancement: !!fongipData.ficheSynoptique.conditionsFinancement,
          hasGaranties: !!fongipData.ficheSynoptique.garanties,
          garantiesCount: fongipData.ficheSynoptique.garanties?.garantiesProposees?.length || 0,
          garanties: fongipData.ficheSynoptique.garanties?.garantiesProposees || []
        })
      } else {
        // Fallback : essayer de charger depuis Firestore (peut échouer à cause des permissions)
        try {
          console.log('🔍 Chargement fiche synoptique depuis Firestore pour projet:', projectId)
          fongipData.ficheSynoptique = await FicheSynoptiqueService.getFicheSynoptique(projectId)
          
          // Si pas de fiche synoptique, en générer une automatiquement
          if (!fongipData.ficheSynoptique) {
            console.log('📝 Génération automatique fiche synoptique')
            const generatedFiche = await FicheSynoptiqueService.generateFromProject(projectId, 'system')
            fongipData.ficheSynoptique = generatedFiche
          }
          
          console.log('✅ Fiche synoptique chargée depuis Firestore:', fongipData.ficheSynoptique ? 'OUI' : 'NON')
        } catch (error) {
          console.warn('❌ Fiche synoptique non disponible depuis Firestore:', error)
          // Fallback : générer une fiche basique avec données actuelles
        const financialEngine = project.sections?.financialEngine
        const totalInvestments = financialEngine?.initialInvestments?.reduce((total: number, inv: any) => total + (inv.amount || 0), 0) || 0
        const totalLoans = financialEngine?.loans?.reduce((total: number, loan: any) => total + (loan.amount || 0), 0) || 0
        
        fongipData.ficheSynoptique = {
          presentationEntreprise: {
            raisonSociale: project.basicInfo?.name || '',
            dateCreation: project.basicInfo?.timeline?.startDate ? new Date(project.basicInfo.timeline.startDate.seconds * 1000).toISOString().split('T')[0] : '',
            formeJuridique: '', // ✅ PAS de valeur par défaut
            registreCommerce: '',
            identificationFiscale: '',
            adresse: project.basicInfo?.location ? `${project.basicInfo.location.address}, ${project.basicInfo.location.city}, ${project.basicInfo.location.region}` : '',
            telephone: '',
            email: '',
            presidentFondateur: '',
            capitalSocial: 0,
            repartitionCapital: '', // ✅ PAS de valeur par défaut
            secteurActivite: project.basicInfo?.sector || '',
            activites: project.basicInfo?.description || ''
          },
          presentationProjet: {
            objetFinancement: project.basicInfo?.description || '',
            besoinTotalFinancement: totalInvestments,
            detailsBesoins: {},
            apportPromoteur: financialEngine?.ownFunds || 0,
            montantSollicite: totalLoans
          },
          conditionsFinancement: {
            typesCredit: financialEngine?.loans?.map((loan: any) => ({
              type: loan.source || 'CMT',
              montant: loan.amount || 0,
              dureeRemboursement: `${loan.termYears * 12} mois`,
              taux: (loan.interestRate * 100) || 9,
              echeanceValidite: 'Trimestrielle'
            })) || [{
              type: 'CMT',
              montant: totalLoans,
              dureeRemboursement: '60 mois',
              taux: 9,
              echeanceValidite: 'Trimestrielle'
            }]
          },
          garanties: {
            garantiesProposees: []
          }
        }
        }
      }
    }

    if (options.includeAnalyseFinanciere) {
      fongipData.analyseFinanciere = project.sections?.analyseFinanciere || project.businessPlan?.financialAnalysis
    }

    if (options.includeTableauxFinanciers) {
      fongipData.tableauxFinanciers = project.sections?.financialEngine || project.sections?.tableauxFinanciers
    }

    // Narrative financière
    const narrative = (project.sections as any)?.financialNarrative
    if (narrative) {
      fongipData.financialNarrative = narrative
    }

    if (options.includeRelationsBancaires) {
      fongipData.relationsBancaires = project.sections?.relationsBancaires
    }

    return {
      project,
      sections,
      fongipData,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'BP Design Pro',
        template: options.template,
        version: '2.0.0'
      }
    }
  }

  /**
   * Génère le HTML complet pour le PDF
   */
  static generateCompleteHTML(data: ExportedPDFData, options: PDFExportOptions): string {
    let html = this.getHTMLHeader(data.project, options)

    // Page de couverture
    if (options.includeCover) {
      html += this.generateCoverPage(data.project, options)
    }

    // Table des matières
    if (options.includeTableOfContents) {
      html += this.generateTableOfContents(data.sections, options)
    }

    // ========== BP CLASSIQUE ==========

    if (options.includeResume) {
      html += '<div class="section no-break">'
      html += this.generateResumeExecutif(data.project, data.fongipData?.ficheSynoptique)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    if (options.includeIdentification) {
      html += '<div class="section no-break">'
      html += this.generateIdentification(data.project)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    // Fiche synoptique après identification
    if (options.includeFicheSynoptique && data.fongipData?.ficheSynoptique) {
      console.log('📋 Génération HTML fiche synoptique')
      html += '<div class="section no-break">'
      html += this.generateFicheSynoptique(data.fongipData.ficheSynoptique)
      html += '</div>'
      html += '<div class="page-break"></div>'
    } else {
      console.log('❌ Fiche synoptique non incluse:', {
        includeFicheSynoptique: options.includeFicheSynoptique,
        hasFongipData: !!data.fongipData,
        hasFicheSynoptique: !!data.fongipData?.ficheSynoptique
      })
    }

    if (options.includeMarketStudy) {
      html += '<div class="section no-break">'
      html += this.generateMarketStudy(data.project)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    if (options.includeSWOT) {
      html += '<div class="section no-break">'
      html += this.generateSWOT(data.project)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    if (options.includeMarketing) {
      html += '<div class="section no-break">'
      html += this.generateMarketing(data.project)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    if (options.includeHR) {
      html += '<div class="section no-break">'
      html += this.generateHR(data.project)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    if (options.includeFinancial) {
      html += '<div class="section no-break">'
      html += this.generateFinancial(data.project)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    // ✅ NOUVELLES SECTIONS AJOUTÉES
    if (options.includeTableauxFinanciers) {
      // Utiliser les vraies données des tableaux financiers, avec fallback vers le moteur financier
      const tableauxData = data.project.sections?.financialTablesExport || data.project.sections?.financialEngine
      html += '<div class="section no-break">'
      html += this.generateTableauxFinanciers(tableauxData)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    if (options.includeRentabilite) {
      html += '<div class="section no-break">'
      html += this.generateRentabilite(data.project.sections?.analyseRentabilite)
      html += '</div>'
      html += '<div class="page-break"></div>'
    }

    // ========== MODULES FONGIP ==========

    if (options.includeAnalyseFinanciere && data.fongipData?.analyseFinanciere) {
      html += this.generateAnalyseFinanciere(data.fongipData.analyseFinanciere)
      html += '<div class="page-break"></div>'
    }

    if (options.includeTableauxFinanciers && data.fongipData?.tableauxFinanciers) {
      html += this.generateTableauxFinanciers(data.fongipData.tableauxFinanciers)
      html += '<div class="page-break"></div>'
    }

    if (data.fongipData?.financialNarrative) {
      html += this.generateFinancialNarrative(data.fongipData.financialNarrative)
      html += '<div class="page-break"></div>'
    }

    if (options.includeRelationsBancaires && data.fongipData?.relationsBancaires) {
      html += this.generateRelationsBancaires(data.fongipData.relationsBancaires)
      html += '<div class="page-break"></div>'
    }

    if (options.includeScoringFongip && data.fongipData?.scoring) {
      html += this.generateScoringFongip(data.fongipData.scoring)
      html += '<div class="page-break"></div>'
    }

    // ========== NOUVELLES SECTIONS PROFESSIONNELLES FONGIP ==========

    if (options.includeContextJustification) {
      html += this.generateContextJustification(data)
      html += '<div class="page-break"></div>'
    }

    if (options.includeTechnicalStudy) {
      html += this.generateTechnicalStudy(data)
      html += '<div class="page-break"></div>'
    }

    if (options.includeRiskAnalysis) {
      html += this.generateRiskAnalysis(data)
      html += '<div class="page-break"></div>'
    }

    if (options.includeStructuredConclusion) {
      html += this.generateStructuredConclusion(data)
      html += '<div class="page-break"></div>'
    }

    html += this.getHTMLFooter(options)

    return html
  }

  // ========== GÉNÉRATEURS HTML PAR SECTION ==========

  private static getHTMLHeader(project: Project, options: PDFExportOptions): string {
    const colors = {
      blue: '#2563eb',
      green: '#059669',
      purple: '#7c3aed'
    }
    const primaryColor = colors[options.colorScheme]

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Business Plan - ${project.basicInfo?.name || 'Sans nom'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
          }
          .page {
            padding: 60px;
            max-width: 210mm;
            margin: 0 auto;
            page-break-after: always;
          }
          h1 {
            color: ${primaryColor};
            font-size: 32px;
            margin-bottom: 20px;
            border-bottom: 4px solid ${primaryColor};
            padding-bottom: 10px;
          }
          h2 {
            color: ${primaryColor};
            font-size: 24px;
            margin: 30px 0 15px;
            border-left: 4px solid ${primaryColor};
            padding-left: 15px;
          }
          h3 {
            color: #374151;
            font-size: 18px;
            margin: 20px 0 10px;
          }
          p { margin-bottom: 12px; color: #4b5563; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
          }
          th {
            background: ${primaryColor};
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
          }
          tr:nth-child(even) { background: #f9fafb; }
          .section { margin-bottom: 40px; }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin: 4px;
          }
          .badge-success { background: #d1fae5; color: #065f46; }
          .badge-warning { background: #fef3c7; color: #92400e; }
          .badge-danger { background: #fee2e2; color: #991b1b; }
          .highlight-box {
            background: #eff6ff;
            border-left: 4px solid ${primaryColor};
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .metric-card {
            background: linear-gradient(135deg, ${primaryColor} 0%, #1e40af 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 10px 0;
          }
          .metric-value { font-size: 36px; font-weight: bold; }
          .metric-label { font-size: 14px; opacity: 0.9; }
          ul { margin-left: 25px; margin-bottom: 15px; }
          li { margin-bottom: 8px; color: #4b5563; }
          .header-logo {
            text-align: right;
            margin-bottom: 30px;
            color: #6b7280;
            font-size: 14px;
          }
          .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.3;
            font-size: 12px;
            color: #9ca3af;
          }

          /* ✅ RÈGLES D'IMPRESSION A4 OPTIMISÉES */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Times New Roman', serif !important;
              font-size: 12pt !important;
              line-height: 1.4 !important;
              color: #000 !important;
            }
            
            .page {
              page-break-after: always;
              padding: 2cm !important;
              max-width: none !important;
              margin: 0 !important;
              min-height: 29.7cm !important;
            }
            
            .page:last-child {
              page-break-after: avoid;
            }
            
            /* Configuration des pages */
            @page {
              size: A4 portrait !important;
              margin: 1.5cm !important;
              @top-center {
                content: "Business Plan FONGIP" !important;
                font-size: 10pt !important;
                color: #666 !important;
              }
              @bottom-right {
                content: "Page " counter(page) !important;
                font-size: 10pt !important;
                color: #666 !important;
              }
            }
            
            /* Titres optimisés */
            h1 {
              font-size: 18pt !important;
              font-weight: bold !important;
              color: #000 !important;
              margin: 20pt 0 15pt 0 !important;
              page-break-after: avoid !important;
              border-bottom: 2pt solid #000 !important;
              padding-bottom: 5pt !important;
            }
            
            h2 {
              font-size: 16pt !important;
              font-weight: bold !important;
              color: #000 !important;
              margin: 18pt 0 12pt 0 !important;
              page-break-after: avoid !important;
              border-bottom: 1pt solid #000 !important;
              padding-bottom: 3pt !important;
            }
            
            h3 {
              font-size: 14pt !important;
              font-weight: bold !important;
              color: #000 !important;
              margin: 15pt 0 10pt 0 !important;
              page-break-after: avoid !important;
            }
            
            h4 {
              font-size: 12pt !important;
              font-weight: bold !important;
              color: #000 !important;
              margin: 12pt 0 8pt 0 !important;
              page-break-after: avoid !important;
            }
            
            /* Paragraphes */
            p {
              margin: 8pt 0 !important;
              text-align: justify !important;
              color: #000 !important;
              orphans: 3 !important;
              widows: 3 !important;
            }
            
            /* Listes */
            ul, ol {
              margin: 10pt 0 !important;
              padding-left: 20pt !important;
            }
            
            li {
              margin: 4pt 0 !important;
              color: #000 !important;
            }
            
            /* Tableaux */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 15pt 0 !important;
              page-break-inside: avoid !important;
              font-size: 11pt !important;
            }
            
            th, td {
              border: 1pt solid #000 !important;
              padding: 6pt !important;
              text-align: left !important;
              vertical-align: top !important;
              color: #000 !important;
            }
            
            th {
              background: #f0f0f0 !important;
              font-weight: bold !important;
            }
            
            /* Sections */
            .section {
              margin: 20pt 0 !important;
              padding: 15pt !important;
              border: 1pt solid #ccc !important;
              page-break-inside: avoid !important;
              background: white !important;
            }
            
            /* Sauts de page intelligents */
            .page-break {
              page-break-before: always !important;
            }
            
            .no-break {
              page-break-inside: avoid !important;
            }
            
            /* Éviter les coupures */
            .section,
            .table,
            .financial-table,
            .risk-item,
            .installation-item,
            .highlight-box {
              page-break-inside: avoid !important;
            }
            
            /* Styles simplifiés pour impression */
            .context-justification,
            .technical-study,
            .risk-analysis,
            .structured-conclusion {
              background: white !important;
              border-left: 3pt solid #000 !important;
              padding: 15pt !important;
              margin: 15pt 0 !important;
            }
            
            /* Métriques et indicateurs */
            .metric-value {
              font-size: 14pt !important;
              font-weight: bold !important;
              color: #000 !important;
            }
            
            .metric-label {
              font-size: 10pt !important;
              color: #000 !important;
            }
            
            /* Badges et étiquettes */
            .badge {
              border: 1pt solid #000 !important;
              padding: 2pt 6pt !important;
              font-size: 9pt !important;
              background: white !important;
              color: #000 !important;
            }
            
            /* Images */
            img {
              max-width: 100% !important;
              height: auto !important;
              page-break-inside: avoid !important;
            }
            
            /* Signature */
            .signature-section {
              margin-top: 30pt !important;
              padding: 15pt !important;
              border: 2pt solid #000 !important;
              text-align: right !important;
              background: white !important;
            }
            
            /* Masquer les éléments d'interface */
            .print-hidden,
            .action-bar,
            .zoom-controls,
            .dark-mode-toggle,
            .fullscreen-toggle,
            .toc-toggle,
            .edit-toolbar,
            .image-dialog,
            .toc-sidebar {
              display: none !important;
            }
          }

          /* ✅ STYLES POUR ÉDITION CONTENTEDITABLE */
          [contenteditable="true"]:focus {
            outline: 2px dashed ${primaryColor};
            outline-offset: 4px;
            background: #fef9c3;
          }
        </style>
      </head>
      <body>
    `
  }

  private static generateCoverPage(project: Project, options: PDFExportOptions): string {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Récupérer le logo de l'entreprise s'il existe
    const companyLogo = (project.basicInfo as any)?.companyLogo || ''

    return `
      <div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 100vh;">
        ${companyLogo ? `
          <div style="margin-bottom: 40px;">
            <img src="${companyLogo}" alt="Logo entreprise" style="max-width: 200px; max-height: 150px; object-fit: contain;" />
          </div>
        ` : ''}

        <div style="margin-bottom: 60px;">
          <h1 style="font-size: 48px; margin-bottom: 20px; border: none;">BUSINESS PLAN</h1>
          <h2 style="font-size: 36px; color: #1f2937; border: none; padding: 0;">${project.basicInfo?.name || 'Sans nom'}</h2>
        </div>

        ${project.basicInfo?.description ? `
          <p style="font-size: 18px; max-width: 600px; margin-bottom: 40px; color: #6b7280;">
            ${project.basicInfo.description}
          </p>
        ` : ''}

        <div style="margin-top: 60px; color: #6b7280;">
          <p style="font-size: 16px; margin-bottom: 10px;">Template: ${options.template.toUpperCase()}</p>
          <p style="font-size: 16px;">${date}</p>
        </div>

        <div style="position: absolute; bottom: 40px; text-align: center; width: 100%;">
          <p style="color: #9ca3af; font-size: 14px;">Généré par BP Design Pro</p>
          <p style="color: #9ca3af; font-size: 12px;">www.bpdesignpro.sn</p>
        </div>
      </div>
    `
  }

  private static generateTableOfContents(sections: PDFSection[], options: PDFExportOptions): string {
    let html = `
      <div class="page">
        <h1>📑 Table des Matières</h1>
        <div style="margin-top: 40px;">
    `

    let currentCategory = ''
    sections.forEach((section, index) => {
      if (section.category !== currentCategory) {
        currentCategory = section.category
        const categoryTitle = currentCategory === 'bp_classique' ? 'Business Plan Classique' :
                            currentCategory === 'fongip' ? 'Modules FONGIP' : 'Autres'
        html += `<h3 style="margin-top: 30px; color: #2563eb;">${categoryTitle}</h3>`
      }

      html += `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dotted #e5e7eb;">
          <span>${section.icon} ${section.title}</span>
          <span style="color: #9ca3af;">Page ${index + 2}</span>
        </div>
      `
    })

    html += `
        </div>
      </div>
    `

    return html
  }

  private static generateResumeExecutif(project: Project, ficheSynoptique?: any): string {
    console.log('🔍 DEBUG generateResumeExecutif:', {
      hasBasicInfo: !!project.basicInfo,
      hasBusinessPlan: !!project.businessPlan,
      hasFicheSynoptique: !!ficheSynoptique,
      businessPlanKeys: project.businessPlan ? Object.keys(project.businessPlan) : [],
      ficheSynoptiqueKeys: ficheSynoptique ? Object.keys(ficheSynoptique) : []
    })

    // Sources possibles pour le synopsis/résumé exécutif
    const synopsisSources = [
      (project.businessPlan as any)?.synopsis,
      (project.businessPlan as any)?.executiveSummary,
      (project.sections as any)?.businessPlan?.synopsis,
      (project.sections as any)?.businessPlan?.executiveSummary,
      ficheSynoptique?.presentationProjet?.objetFinancement,
      ficheSynoptique?.presentationEntreprise?.activites
    ].filter(Boolean)

    const synopsis = synopsisSources[0] || ''

    return `
      <div class="page">
        <h1>📄 Résumé Exécutif</h1>
        <div class="section">
          <h2>${project.basicInfo?.name || 'Projet'}</h2>
          <p class="lead">${project.basicInfo?.description || 'Description non renseignée'}</p>

          ${synopsis ? `
            <div class="highlight-box">
              <h3>Synopsis du projet</h3>
              <p>${synopsis}</p>
            </div>
          ` : ''}

          ${ficheSynoptique?.presentationProjet ? `
            <div class="info-grid">
              <div class="info-item">
                <strong>Objet du financement :</strong>
                <span>${ficheSynoptique.presentationProjet.objetFinancement || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Besoin total :</strong>
                <span class="amount">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(ficheSynoptique.presentationProjet.besoinTotalFinancement || 0)}</span>
              </div>
              <div class="info-item">
                <strong>Apport promoteur :</strong>
                <span class="amount">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(ficheSynoptique.presentationProjet.apportPromoteur || 0)}</span>
              </div>
              <div class="info-item">
                <strong>Montant sollicité :</strong>
                <span class="amount highlight">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(ficheSynoptique.presentationProjet.montantSollicite || 0)}</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  private static generateIdentification(project: Project): string {
    const id = project.sections?.identification as any
    if (!id) return ''

    return `
      <div class="page">
        <h1>🏢 Identification de l'Entreprise</h1>

        <h3>Informations générales</h3>
        <table>
          <tr><td><strong>Raison sociale</strong></td><td>${id.raisonSociale || 'N/A'}</td></tr>
          <tr><td><strong>Forme juridique</strong></td><td>${id.formeJuridique || 'N/A'}</td></tr>
          <tr><td><strong>Capital social</strong></td><td>${id.capitalSocial || 'N/A'} FCFA</td></tr>
          <tr><td><strong>NINEA</strong></td><td>${id.ninea || 'N/A'}</td></tr>
          <tr><td><strong>RC</strong></td><td>${id.registreCommerce || 'N/A'}</td></tr>
        </table>

        <h3>Siège social</h3>
        <p>${id.siegeSocial?.adresse || 'Non renseigné'}</p>

        <h3>Activité principale</h3>
        <p>${id.activite?.principale || 'Non renseignée'}</p>
      </div>
    `
  }

  private static generateMarketStudy(project: Project): string {
    const market = project.businessPlan?.marketStudy || project.sections?.marketStudy
    console.log('🔍 DEBUG generateMarketStudy:', {
      hasBusinessPlan: !!project.businessPlan,
      hasSections: !!project.sections,
      hasMarketStudy: !!market,
      marketKeys: market ? Object.keys(market) : [],
      competitiveAnalysis: market?.competitiveAnalysis
    })
    if (!market) return ''

    const ms = market as any

    return `
      <div class="page">
        <h1>📊 Étude de Marché</h1>

        ${ms.marketAnalysis ? `
          <div class="section">
            <h3>Analyse du Marché</h3>
            <div class="highlight-box">
              <p><strong>Taille du marché :</strong> ${(ms.marketAnalysis.marketSize || 0).toLocaleString('fr-FR')} FCFA</p>
              <p><strong>Croissance annuelle :</strong> ${ms.marketAnalysis.marketGrowth || 0}%</p>
            </div>

            ${ms.marketAnalysis.marketSegments?.length > 0 ? `
              <h4>Segments de marché</h4>
              <table>
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Taille</th>
                    <th>Croissance</th>
                  </tr>
                </thead>
                <tbody>
                  ${ms.marketAnalysis.marketSegments.map((seg: any) => `
                    <tr>
                      <td>${seg.name || 'N/A'}</td>
                      <td>${(seg.size || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${seg.growthRate || 0}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            ${ms.marketAnalysis.keyTrends?.length > 0 ? `
              <h4>Tendances clés</h4>
              <ul>
                ${ms.marketAnalysis.keyTrends.map((trend: string) => `<li>${trend}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        ` : ''}

        ${ms.targetCustomers ? `
          <div class="section">
            <h3>Clientèle Cible</h3>
            <div class="highlight-box">
              <p><strong>Marché adressable total :</strong> ${(ms.targetCustomers.totalAddressableMarket || 0).toLocaleString('fr-FR')} FCFA</p>
              <p><strong>Taux de pénétration visé :</strong> ${ms.targetCustomers.penetrationRate || 0}%</p>
            </div>

            ${ms.targetCustomers.segments?.length > 0 ? `
              <h4>Segments de clientèle</h4>
              <ul>
                ${ms.targetCustomers.segments.map((seg: any) => `
                  <li><strong>${seg.name || 'N/A'}</strong>: ${seg.description || ''}</li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        ` : ''}

        ${ms.competitiveAnalysis ? `
          <div class="section">
            <h3>Analyse Concurrentielle</h3>

            ${ms.competitiveAnalysis.marketPositioning ? `
              <div class="highlight-box">
                <h4>Positionnement sur le marché</h4>
                <p>${ms.competitiveAnalysis.marketPositioning}</p>
              </div>
            ` : ''}

            ${ms.competitiveAnalysis.competitors?.length > 0 ? `
              <h4>Concurrents identifiés</h4>
              <table>
                <thead>
                  <tr>
                    <th>Concurrent</th>
                    <th>Parts de marché</th>
                    <th>Forces</th>
                  </tr>
                </thead>
                <tbody>
                  ${ms.competitiveAnalysis.competitors.map((comp: any) => `
                    <tr>
                      <td><strong>${comp.name || 'N/A'}</strong></td>
                      <td>${comp.marketShare || 0}%</td>
                      <td>${(comp.strengths || []).slice(0, 2).join(', ')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            ${ms.competitiveAnalysis.competitiveAdvantages?.length > 0 ? `
              <h4>Nos avantages concurrentiels</h4>
              <ul>
                ${ms.competitiveAnalysis.competitiveAdvantages.map((adv: string) => `<li>${adv}</li>`).join('')}
              </ul>
            ` : ''}

            ${ms.competitiveAnalysis.competitiveMatrix?.companies?.length > 0 ? `
              <h4>Matrice concurrentielle</h4>
              <table>
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    ${(ms.competitiveAnalysis.competitiveMatrix.criteria || []).slice(0, 3).map((c: any) => `<th>${c.name || c}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${ms.competitiveAnalysis.competitiveMatrix.companies.map((company: any) => `
                    <tr>
                      <td><strong>${company.name || 'N/A'}</strong></td>
                      ${(company.scores || []).slice(0, 3).map((score: any) => `<td>${score}/5</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
        ` : ''}

        ${ms.sectorContext ? `
          <div class="section">
            <h3>Contexte Sectoriel</h3>

            ${ms.sectorContext.opportunities?.length > 0 ? `
              <h4>Opportunités</h4>
              <ul>
                ${ms.sectorContext.opportunities.map((opp: string) => `<li>${opp}</li>`).join('')}
              </ul>
            ` : ''}

            ${ms.sectorContext.challenges?.length > 0 ? `
              <h4>Défis</h4>
              <ul>
                ${ms.sectorContext.challenges.map((ch: string) => `<li>${ch}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        ` : ''}

        ${ms.marketImages?.length > 0 ? `
          <div class="section">
            <h3>Images du Marché</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
              ${ms.marketImages.filter((img: string) => img).map((img: string) => `
                <div style="text-align: center;">
                  <img src="${img}" alt="Image marché" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateSWOT(project: Project): string {
    const swot = project.businessPlan?.swotAnalysis || project.sections?.swotAnalysis as any
    console.log('🔍 DEBUG generateSWOT:', {
      hasBusinessPlan: !!project.businessPlan,
      hasSections: !!project.sections,
      hasSwotAnalysis: !!swot,
      swotKeys: swot ? Object.keys(swot) : [],
      weaknesses: swot?.weaknesses?.length || 0
    })
    if (!swot) return ''

    // ✅ CORRECTION : SWOTItem est un objet {id, description, impact, priority, actionItems}
    const formatSWOTItem = (item: any): string => {
      if (typeof item === 'string') return item
      if (item?.description) {
        const impact = item.impact ? `<span class="badge badge-${item.impact === 'high' ? 'danger' : item.impact === 'medium' ? 'warning' : 'success'}">${item.impact}</span>` : ''
        let result = `<strong>${item.description}</strong> ${impact}`

        // Ajouter les action items si présents
        if (item.actionItems && Array.isArray(item.actionItems) && item.actionItems.length > 0) {
          result += '<ul style="margin-top: 5px; margin-left: 20px; font-size: 0.9em;">'
          result += item.actionItems.map((action: string) => `<li>${action}</li>`).join('')
          result += '</ul>'
        }

        return result
      }
      return String(item)
    }

    return `
      <div class="page">
        <h1>🛡️ Analyse SWOT</h1>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
          <div class="highlight-box" style="background: #d1fae5;">
            <h3 style="color: #065f46;">💪 Forces</h3>
            <ul>
              ${(swot.strengths || []).map((s: any) => `<li>${formatSWOTItem(s)}</li>`).join('')}
            </ul>
          </div>

          <div class="highlight-box" style="background: #fee2e2;">
            <h3 style="color: #991b1b;">⚠️ Faiblesses</h3>
            <ul>
              ${(swot.weaknesses || []).map((w: any) => `<li>${formatSWOTItem(w)}</li>`).join('')}
            </ul>
          </div>

          <div class="highlight-box" style="background: #dbeafe;">
            <h3 style="color: #1e40af;">🌟 Opportunités</h3>
            <ul>
              ${(swot.opportunities || []).map((o: any) => `<li>${formatSWOTItem(o)}</li>`).join('')}
            </ul>
          </div>

          <div class="highlight-box" style="background: #fef3c7;">
            <h3 style="color: #92400e;">⚡ Menaces</h3>
            <ul>
              ${(swot.threats || []).map((t: any) => `<li>${formatSWOTItem(t)}</li>`).join('')}
            </ul>
          </div>
        </div>

        ${swot.strategicRecommendations ? `
          <div class="section" style="margin-top: 30px;">
            <h2>📋 Recommandations Stratégiques</h2>
            ${swot.strategicRecommendations.soStrategies?.length > 0 ? `
              <div class="highlight-box">
                <h4>SO - Forces + Opportunités</h4>
                <ul>${swot.strategicRecommendations.soStrategies.map((s: string) => `<li>${s}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${swot.strategicRecommendations.woStrategies?.length > 0 ? `
              <div class="highlight-box">
                <h4>WO - Faiblesses + Opportunités</h4>
                <ul>${swot.strategicRecommendations.woStrategies.map((s: string) => `<li>${s}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${swot.strategicRecommendations.stStrategies?.length > 0 ? `
              <div class="highlight-box">
                <h4>ST - Forces + Menaces</h4>
                <ul>${swot.strategicRecommendations.stStrategies.map((s: string) => `<li>${s}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${swot.strategicRecommendations.wtStrategies?.length > 0 ? `
              <div class="highlight-box">
                <h4>WT - Faiblesses + Menaces</h4>
                <ul>${swot.strategicRecommendations.wtStrategies.map((s: string) => `<li>${s}</li>`).join('')}</ul>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateMarketing(project: Project): string {
    const marketing = project.businessPlan?.marketingPlan || (project.sections as any)?.marketingPlan
    console.log('🔍 DEBUG generateMarketing:', {
      hasBusinessPlan: !!project.businessPlan,
      hasSections: !!project.sections,
      hasMarketingPlan: !!marketing,
      marketingKeys: marketing ? Object.keys(marketing) : [],
      marketingMix: marketing?.marketingMix ? Object.keys(marketing.marketingMix) : []
    })
    if (!marketing) return ''

    const mp = marketing as any

    return `
      <div class="page">
        <h1>📢 Stratégie Marketing</h1>

        ${mp.strategy?.positioning ? `
          <div class="section">
            <h3>Stratégie et Positionnement</h3>
            <div class="highlight-box">
              <p>${mp.strategy.positioning}</p>
            </div>
          </div>
        ` : ''}

        ${mp.marketingMix ? `
          <div class="section">
            <h3>Mix Marketing (4P)</h3>

            ${mp.marketingMix.product ? `
              <div class="highlight-box" style="margin-bottom: 20px;">
                <h4>🎯 Produit</h4>
                ${mp.marketingMix.product.core ? `<p><strong>Produit principal :</strong> ${mp.marketingMix.product.core}</p>` : ''}
                ${mp.marketingMix.product.features?.length > 0 ? `
                  <p><strong>Caractéristiques :</strong></p>
                  <ul>${mp.marketingMix.product.features.map((f: string) => `<li>${f}</li>`).join('')}</ul>
                ` : ''}
                ${mp.marketingMix.product.benefits?.length > 0 ? `
                  <p><strong>Bénéfices :</strong></p>
                  <ul>${mp.marketingMix.product.benefits.map((b: string) => `<li>${b}</li>`).join('')}</ul>
                ` : ''}
                ${mp.marketingMix.product.differentiation?.length > 0 ? `
                  <p><strong>Différenciation :</strong></p>
                  <ul>${mp.marketingMix.product.differentiation.map((d: string) => `<li>${d}</li>`).join('')}</ul>
                ` : ''}
              </div>
            ` : ''}

            ${mp.marketingMix.price ? `
              <div class="highlight-box" style="margin-bottom: 20px;">
                <h4>💰 Prix</h4>
                ${mp.marketingMix.price.strategy ? `<p><strong>Stratégie :</strong> ${mp.marketingMix.price.strategy}</p>` : ''}
                ${mp.marketingMix.price.basePrice ? `<p><strong>Prix de base :</strong> ${mp.marketingMix.price.basePrice.toLocaleString('fr-FR')} FCFA</p>` : ''}
                ${mp.marketingMix.price.priceRange ? `
                  <p><strong>Fourchette de prix :</strong> ${mp.marketingMix.price.priceRange.min.toLocaleString('fr-FR')} - ${mp.marketingMix.price.priceRange.max.toLocaleString('fr-FR')} FCFA</p>
                ` : ''}
              </div>
            ` : ''}

            ${mp.marketingMix.place ? `
              <div class="highlight-box" style="margin-bottom: 20px;">
                <h4>📍 Distribution</h4>
                ${mp.marketingMix.place.coverage ? `<p><strong>Couverture :</strong> ${mp.marketingMix.place.coverage}</p>` : ''}
                ${mp.marketingMix.place.channels?.length > 0 ? `
                  <p><strong>Canaux :</strong></p>
                  <ul>${mp.marketingMix.place.channels.map((c: string) => `<li>${c}</li>`).join('')}</ul>
                ` : ''}
              </div>
            ` : ''}

            ${mp.marketingMix.promotion ? `
              <div class="highlight-box">
                <h4>📣 Communication et Promotion</h4>
                ${mp.marketingMix.promotion.communication?.mainMessage ? `
                  <p><strong>Message principal :</strong> ${mp.marketingMix.promotion.communication.mainMessage}</p>
                ` : ''}
                ${mp.marketingMix.promotion.communication?.channels?.length > 0 ? `
                  <p><strong>Canaux de communication :</strong></p>
                  <ul>${mp.marketingMix.promotion.communication.channels.map((c: string) => `<li>${c}</li>`).join('')}</ul>
                ` : ''}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${mp.actionPlan?.budget ? `
          <div class="section">
            <h3>Budget Marketing</h3>
            <div class="highlight-box">
              <p><strong>Budget total :</strong> ${(mp.actionPlan.budget.total || 0).toLocaleString('fr-FR')} FCFA</p>
              ${mp.actionPlan.budget.breakdown ? `
                <p><strong>Répartition par année :</strong></p>
                <ul>
                  ${mp.actionPlan.budget.breakdown.year1 ? `<li>Année 1 : ${mp.actionPlan.budget.breakdown.year1.toLocaleString('fr-FR')} FCFA</li>` : ''}
                  ${mp.actionPlan.budget.breakdown.year2 ? `<li>Année 2 : ${mp.actionPlan.budget.breakdown.year2.toLocaleString('fr-FR')} FCFA</li>` : ''}
                  ${mp.actionPlan.budget.breakdown.year3 ? `<li>Année 3 : ${mp.actionPlan.budget.breakdown.year3.toLocaleString('fr-FR')} FCFA</li>` : ''}
                </ul>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${mp.productImages?.length > 0 ? `
          <div class="section">
            <h3>Visuels Marketing</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
              ${mp.productImages.filter((img: string) => img).map((img: string) => `
                <div style="text-align: center;">
                  <img src="${img}" alt="Image produit" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateHR(project: Project): string {
    const hr = project.businessPlan?.humanResources || (project.sections as any)?.humanResources
    console.log('🔍 DEBUG generateHR:', {
      hasBusinessPlan: !!project.businessPlan,
      hasSections: !!project.sections,
      hasHumanResources: !!hr,
      hrKeys: hr ? Object.keys(hr) : [],
      sectionsKeys: project.sections ? Object.keys(project.sections) : []
    })
    if (!hr) return ''

    const hrData = hr as any

    return `
      <div class="page">
        <h1>👥 Ressources Humaines</h1>

        ${hrData.governance?.legalForm || hrData.governance?.management ? `
          <div class="section">
            <h3>Gouvernance</h3>
            ${hrData.governance.legalForm ? `<p><strong>Forme juridique :</strong> ${hrData.governance.legalForm}</p>` : ''}
            ${hrData.governance.management ? `<p><strong>Mode de gestion :</strong> ${hrData.governance.management}</p>` : ''}
          </div>
        ` : ''}

        ${hrData.organizationChart?.positions?.length > 0 ? `
          <div class="section">
            <h3>Organigramme</h3>
            <table>
              <thead>
                <tr>
                  <th>Poste</th>
                  <th>Nombre</th>
                  <th>Salaire mensuel</th>
                  <th>Charges annuelles</th>
                </tr>
              </thead>
              <tbody>
                ${hrData.organizationChart.positions.map((pos: any) => `
                  <tr>
                    <td><strong>${pos.title || 'N/A'}</strong></td>
                    <td>${pos.count || 1}</td>
                    <td>${(pos.monthlySalary || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td>${((pos.monthlySalary || 0) * (pos.count || 1) * 12 * 1.25).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${hrData.organizationChart.totalPositions ? `
              <div class="highlight-box" style="margin-top: 20px;">
                <p><strong>Total employés :</strong> ${hrData.organizationChart.totalPositions}</p>
                <p><strong>Masse salariale annuelle :</strong> ${(hrData.organizationChart.totalMonthlySalary * 12 || 0).toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Charges sociales (25%) :</strong> ${(hrData.organizationChart.totalMonthlySalary * 12 * 0.25 || 0).toLocaleString('fr-FR')} FCFA</p>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${hrData.recruitment?.strategy ? `
          <div class="section">
            <h3>Recrutement</h3>
            <p>${hrData.recruitment.strategy}</p>
          </div>
        ` : ''}

        ${hrData.training?.plan ? `
          <div class="section">
            <h3>Formation</h3>
            <p>${hrData.training.plan}</p>
            ${hrData.training.annualBudget ? `<p><strong>Budget formation annuel :</strong> ${hrData.training.annualBudget.toLocaleString('fr-FR')} FCFA</p>` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateFinancial(project: Project): string {
    const financial = project.businessPlan?.financialPlan || (project.sections as any)?.financialEngine
    console.log('🔍 DEBUG generateFinancial:', {
      hasBusinessPlan: !!project.businessPlan,
      hasSections: !!project.sections,
      hasFinancialPlan: !!project.businessPlan?.financialPlan,
      hasFinancialEngine: !!project.sections?.financialEngine,
      financialEngineKeys: project.sections?.financialEngine ? Object.keys(project.sections.financialEngine) : [],
      sectionsKeys: project.sections ? Object.keys(project.sections) : []
    })
    
    if (!financial) {
    return `
      <div class="page">
        <h1>💰 Plan de Financement</h1>
        <p>Section Plan de Financement à compléter</p>
        </div>
      `
    }

    const finData = financial as any
    return `
      <div class="page">
        <h1>💰 Plan de Financement</h1>
        
        ${finData.revenueStreams?.length > 0 ? `
          <div class="section">
            <h3>Sources de Revenus</h3>
            <ul>
              ${finData.revenueStreams.map((stream: any) => `
                <li><strong>${stream.name || 'Revenu'}</strong>: ${stream.unitPrice || 0} FCFA × ${stream.quantity || 0} unités</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        ${finData.fixedCosts?.length > 0 ? `
          <div class="section">
            <h3>Coûts Fixes</h3>
            <ul>
              ${finData.fixedCosts.map((cost: any) => `
                <li><strong>${cost.name || 'Coût'}</strong>: ${cost.amount || 0} FCFA</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        ${finData.loans?.length > 0 ? `
          <div class="section">
            <h3>Emprunts</h3>
            <ul>
              ${finData.loans.map((loan: any) => `
                <li><strong>${loan.name || 'Emprunt'}</strong>: ${loan.amount || 0} FCFA à ${(loan.interestRate || 0) * 100}%</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateFicheSynoptique(fiche: any): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'XOF', 
        minimumFractionDigits: 0 
      }).format(value || 0)
    }

    return `
      <div class="page">
        <div class="fiche-synoptique">
          <h1>📋 Fiche Synoptique</h1>
          <p class="subtitle">Document de synthèse pour institutions financières (FONGIP, FAISE, Banques)</p>

          <!-- Section 1: Présentation de l'Entreprise -->
          <div class="section">
            <h2>🏢 Présentation de l'Entreprise</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Raison sociale :</strong>
                <span>${fiche.presentationEntreprise?.raisonSociale || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Forme juridique :</strong>
                <span>${fiche.presentationEntreprise?.formeJuridique || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Date de création :</strong>
                <span>${fiche.presentationEntreprise?.dateCreation || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Registre de commerce :</strong>
                <span>${fiche.presentationEntreprise?.registreCommerce || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>NINEA :</strong>
                <span>${fiche.presentationEntreprise?.identificationFiscale || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Capital social :</strong>
                <span>${formatCurrency(fiche.presentationEntreprise?.capitalSocial)}</span>
              </div>
              <div class="info-item">
                <strong>Répartition du capital :</strong>
                <span>${fiche.presentationEntreprise?.repartitionCapital || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Secteur d'activité :</strong>
                <span>${fiche.presentationEntreprise?.secteurActivite || 'Non renseigné'}</span>
              </div>
              <div class="info-item full-width">
                <strong>Adresse :</strong>
                <span>${fiche.presentationEntreprise?.adresse || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Téléphone :</strong>
                <span>${fiche.presentationEntreprise?.telephone || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Email :</strong>
                <span>${fiche.presentationEntreprise?.email || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Président/Fondateur :</strong>
                <span>${fiche.presentationEntreprise?.presidentFondateur || 'Non renseigné'}</span>
              </div>
              <div class="info-item full-width">
                <strong>Activités :</strong>
                <span>${fiche.presentationEntreprise?.activites || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Présentation du Projet -->
          <div class="section">
            <h2>💼 Présentation du Projet</h2>
            <div class="info-grid">
              <div class="info-item full-width">
                <strong>Objet du financement :</strong>
                <span>${fiche.presentationProjet?.objetFinancement || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <strong>Besoin total de financement :</strong>
                <span class="amount">${formatCurrency(fiche.presentationProjet?.besoinTotalFinancement)}</span>
              </div>
              <div class="info-item">
                <strong>Apport du promoteur :</strong>
                <span class="amount">${formatCurrency(fiche.presentationProjet?.apportPromoteur)}</span>
              </div>
              <div class="info-item">
                <strong>Montant sollicité :</strong>
                <span class="amount highlight">${formatCurrency((fiche.presentationProjet?.besoinTotalFinancement || 0) - (fiche.presentationProjet?.apportPromoteur || 0))}</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Conditions de Financement -->
          <div class="section">
            <h2>💰 Conditions de Financement</h2>
            ${fiche.conditionsFinancement?.typesCredit?.length > 0 ? `
              <table class="financial-table">
                <thead>
                  <tr>
                    <th>Type de crédit</th>
                    <th>Montant (FCFA)</th>
                    <th>Durée de remboursement</th>
                    <th>Taux d'intérêt (%)</th>
                    <th>Échéance de validité</th>
                  </tr>
                </thead>
                <tbody>
                  ${fiche.conditionsFinancement.typesCredit.map((c: any) => `
                    <tr>
                      <td><strong>${c.type}</strong></td>
                      <td class="amount">${formatCurrency(c.montant)}</td>
                      <td>${c.dureeRemboursement}</td>
                      <td>${c.taux}%</td>
                      <td>${c.echeanceValidite}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p class="no-data">Aucun crédit demandé</p>'}
          </div>

          <!-- Section 4: Garanties Proposées -->
          <div class="section">
            <h2>🛡️ Garanties Proposées</h2>
            ${fiche.garanties?.garantiesProposees?.length > 0 ? `
              <table class="financial-table">
                <thead>
                  <tr>
                    <th>Type de garantie</th>
                    <th>Description</th>
                    <th>Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  ${fiche.garanties.garantiesProposees.map((g: any) => `
                    <tr>
                      <td><strong>${g.type}</strong></td>
                      <td>${g.description}</td>
                      <td class="amount">${g.montant ? formatCurrency(g.montant) : 'Non spécifié'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p class="no-data">Aucune garantie proposée</p>'}
          </div>

          <!-- Section 5: Données Prévisionnelles (si disponibles) -->
          ${fiche.donneesPrevisionnelles ? `
            <div class="section">
              <h2>📊 Données Prévisionnelles</h2>
              <div class="previsionnelles-summary">
                <div class="summary-item">
                  <strong>Période d'analyse :</strong>
                  <span>${fiche.donneesPrevisionnelles.annees?.length || 0} années</span>
                </div>
                <div class="summary-item">
                  <strong>Chiffre d'affaires prévisionnel :</strong>
                  <span>${fiche.donneesPrevisionnelles.chiffreAffaires?.length > 0 ? formatCurrency(fiche.donneesPrevisionnelles.chiffreAffaires[fiche.donneesPrevisionnelles.chiffreAffaires.length - 1]) : 'Non calculé'}</span>
                </div>
                <div class="summary-item">
                  <strong>Résultat net prévisionnel :</strong>
                  <span>${fiche.donneesPrevisionnelles.resultatNet?.length > 0 ? formatCurrency(fiche.donneesPrevisionnelles.resultatNet[fiche.donneesPrevisionnelles.resultatNet.length - 1]) : 'Non calculé'}</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Signature -->
          <div class="signature-section">
            <div class="signature-item">
              <strong>Date :</strong>
              <span>${new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="signature-item">
              <strong>Signature du promoteur :</strong>
              <span>_________________________</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  private static generateAnalyseFinanciere(analyse: any): string {
    return `
      <div class="page">
        <h1>📈 Analyse Financière Historique</h1>

        <h3>Comptes de résultat (3 dernières années)</h3>
        ${analyse.comptesResultat?.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Année</th>
                <th>CA (FCFA)</th>
                <th>Résultat Net (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              ${analyse.comptesResultat.map((c: any) => `
                <tr>
                  <td>Année ${c.annee}</td>
                  <td>${(c.chiffreAffaires || 0).toLocaleString('fr-FR')}</td>
                  <td>${(c.resultatNet || 0).toLocaleString('fr-FR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>Données non disponibles</p>'}

        <h3>Ratios de décision bancaire</h3>
        ${analyse.ratiosDecision?.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Ratio</th>
                <th>Valeur</th>
                <th>Évaluation</th>
              </tr>
            </thead>
            <tbody>
              ${analyse.ratiosDecision[analyse.ratiosDecision.length - 1] ? Object.entries(analyse.ratiosDecision[analyse.ratiosDecision.length - 1])
                .filter(([key]) => key !== 'annee')
                .map(([key, ratio]: [string, any]) => `
                  <tr>
                    <td>${key}</td>
                    <td>${ratio.valeur?.toFixed(2) || 'N/A'}</td>
                    <td><span class="badge badge-${ratio.evaluation === 'Bon' ? 'success' : ratio.evaluation === 'Moyen' ? 'warning' : 'danger'}">${ratio.evaluation}</span></td>
                  </tr>
                `).join('') : ''}
            </tbody>
          </table>
        ` : '<p>Ratios non calculés</p>'}
      </div>
    `
  }

  private static generateTableauxFinanciers(tableaux: any): string {
    console.log('🔍 DEBUG generateTableauxFinanciers:', {
      hasTableaux: !!tableaux,
      tableauxKeys: tableaux ? Object.keys(tableaux) : [],
      sample: tableaux ? JSON.stringify(tableaux).substring(0, 300) : null,
      // Vérifier si c'est des données de tableaux financiers ou du moteur financier
      isFinancialTables: tableaux?.comptesResultat || tableaux?.tableauxCharges || tableaux?.planAmortissement || tableaux?.bilans || tableaux?.planTresorerieAnnee1,
      isFinancialEngine: tableaux?.revenueStreams || tableaux?.fixedCosts || tableaux?.loans,
      // Structure détaillée pour debug
      comptesResultatType: tableaux?.comptesResultat ? typeof tableaux.comptesResultat : 'undefined',
      comptesResultatLength: tableaux?.comptesResultat ? (Array.isArray(tableaux.comptesResultat) ? tableaux.comptesResultat.length : 'not array') : 'undefined',
      tableauxChargesType: tableaux?.tableauxCharges ? typeof tableaux.tableauxCharges : 'undefined',
      tableauxChargesLength: tableaux?.tableauxCharges ? (Array.isArray(tableaux.tableauxCharges) ? tableaux.tableauxCharges.length : 'not array') : 'undefined',
      planAmortissementType: tableaux?.planAmortissement ? typeof tableaux.planAmortissement : 'undefined',
      bilansType: tableaux?.bilans ? typeof tableaux.bilans : 'undefined',
      bilansLength: tableaux?.bilans ? (Array.isArray(tableaux.bilans) ? tableaux.bilans.length : 'not array') : 'undefined'
    })
    
    if (!tableaux) return ''
    
    // Détecter le type de données et adapter l'affichage
    const isFinancialTables = !!(tableaux?.comptesResultat || tableaux?.tableauxCharges || tableaux?.planAmortissement || tableaux?.bilans || tableaux?.planTresorerieAnnee1 || tableaux?.ratios || tableaux?.indicateurs)
    const isFinancialEngine = !!(tableaux?.revenueStreams || tableaux?.fixedCosts || tableaux?.loans)
    
    return `
      <div class="page">
        <h1>📊 Tableaux Financiers Détaillés</h1>

        ${isFinancialTables ? `
          <!-- DONNÉES DES VRAIS TABLEAUX FINANCIERS -->
          
          <!-- Comptes de Résultat -->
          ${tableaux.comptesResultat && Array.isArray(tableaux.comptesResultat) && tableaux.comptesResultat.length > 0 ? `
            <div class="section">
              <h3>📈 Comptes de Résultat Prévisionnels</h3>
              ${tableaux.comptesResultat.map((cr: any) => `
                <h4>Année ${cr.annee || 'N/A'}</h4>
                <table class="financial-table">
                  <tr><td><strong>Chiffre d'affaires</strong></td><td>${(cr.chiffreAffaires || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Autres produits</strong></td><td>${(cr.autresProduits || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total produits</strong></td><td>${(cr.totalProduits || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Achats consommés</strong></td><td>${(cr.achatsConsommes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Charges externes</strong></td><td>${(cr.chargesExternes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Charges personnel</strong></td><td>${(cr.chargesPersonnel || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Charges sociales</strong></td><td>${(cr.chargesSociales || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Impôts et taxes</strong></td><td>${(cr.impotsTaxes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total charges exploitation</strong></td><td>${(cr.totalChargesExploitation || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Valeur ajoutée</strong></td><td>${(cr.valeureAjoutee || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Excédent brut exploitation</strong></td><td>${(cr.excedentBrutExploitation || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Dotations amortissements</strong></td><td>${(cr.dotationsAmortissements || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Résultat d'exploitation</strong></td><td>${(cr.resultatExploitation || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Produits financiers</strong></td><td>${(cr.produitsFinanciers || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Charges financières</strong></td><td>${(cr.chargesFinancieres || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Résultat financier</strong></td><td>${(cr.resultatFinancier || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Résultat courant avant impôts</strong></td><td>${(cr.resultatCourantAvantImpots || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Impôt sur les sociétés</strong></td><td>${(cr.impotSocietes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Résultat net</strong></td><td>${(cr.resultatNet || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                </table>
              `).join('')}
            </div>
          ` : ''}

          <!-- Tableau des Charges -->
          ${tableaux.tableauxCharges && Array.isArray(tableaux.tableauxCharges) && tableaux.tableauxCharges.length > 0 ? `
            <div class="section">
              <h3>💸 Tableau des Charges Détaillé</h3>
              ${tableaux.tableauxCharges.map((tc: any) => `
                <h4>Année ${tc.annee || 'N/A'}</h4>
                <table class="financial-table">
                  <tr><td><strong>Achats matières premières</strong></td><td>${(tc.achatsMatieresPremieres || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Achats marchandises</strong></td><td>${(tc.achatsMarchandises || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Achats fournitures</strong></td><td>${(tc.achatsFournitures || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Loyer et charges</strong></td><td>${(tc.loyerCharges || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Électricité, eau, gaz</strong></td><td>${(tc.electriciteEauGaz || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Télécommunications</strong></td><td>${(tc.telecommunications || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Assurances</strong></td><td>${(tc.assurances || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Entretien et maintenance</strong></td><td>${(tc.entretienMaintenance || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Documentation et fournitures</strong></td><td>${(tc.documentationFournitures || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Transport et déplacements</strong></td><td>${(tc.transportDeplacements || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Publicité et marketing</strong></td><td>${(tc.publiciteMarketing || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Honoraires et conseil</strong></td><td>${(tc.honorairesConseil || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Autres charges externes</strong></td><td>${(tc.autresChargesExternes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total charges externes</strong></td><td>${(tc.totalChargesExternes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total salaire brut</strong></td><td>${(tc.totalSalaireBrut || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Charges sociales</strong></td><td>${(tc.chargesSociales || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Autres charges personnel</strong></td><td>${(tc.autresChargesPersonnel || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total charges personnel</strong></td><td>${(tc.totalChargesPersonnel || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Patente et contribution économique</strong></td><td>${(tc.patenteContributionEconomique || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Taxe foncière établissement</strong></td><td>${(tc.taxeFonciereEtablissement || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Autres impôts et taxes</strong></td><td>${(tc.autresImpotsTaxes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total impôts et taxes</strong></td><td>${(tc.totalImpotsTaxes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                  <tr><td><strong>Total charges</strong></td><td>${(tc.totalCharges || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                </table>
              `).join('')}
            </div>
          ` : ''}

          <!-- Plan d'Amortissement -->
          ${tableaux.planAmortissement ? `
            <div class="section">
              <h3>📅 Plan d'Amortissement</h3>
              ${tableaux.planAmortissement.amortissementsParAnnee?.length > 0 ? `
                ${tableaux.planAmortissement.amortissementsParAnnee.map((annee: any) => `
                  <h4>Année ${annee.annee}</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Nature</th>
                        <th>Valeur Brute</th>
                        <th>Dotation Annuelle</th>
                        <th>Valeur Nette Comptable</th>
                        <th>Cumul Amortissements</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${annee.lignes?.map((ligne: any) => `
                        <tr>
                          <td>${ligne.nature || 'N/A'}</td>
                          <td>${(ligne.valeurBrute || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td>${(ligne.dotationAnnuelle || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td>${(ligne.valeurNetteComptable || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td>${(ligne.cumulAmortissements || 0).toLocaleString('fr-FR')} FCFA</td>
                        </tr>
                      `).join('') || '<tr><td colspan="5">Aucune ligne</td></tr>'}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>${(annee.totalVNC || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                        <td><strong>${(annee.totalDotations || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                        <td><strong>${(annee.totalVNC - annee.totalDotations || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                        <td><strong>${(annee.totalDotations || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                `).join('')}
              ` : `
                <p>Aucun plan d'amortissement disponible</p>
              `}
            </div>
          ` : ''}

          <!-- Bilan Prévisionnel -->
          ${tableaux.bilans && Array.isArray(tableaux.bilans) && tableaux.bilans.length > 0 ? `
            <div class="section">
              <h3>⚖️ Bilan Prévisionnel</h3>
              ${tableaux.bilans.map((bp: any, index: number) => `
                <h4>Année ${index + 1}</h4>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1;">
                    <h5>Actif</h5>
                    <table>
                      <tr><td><strong>Actif immobilisé</strong></td><td>${(bp.actifImmobilise || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                      <tr><td><strong>Actif circulant</strong></td><td>${(bp.actifCirculant || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                      <tr><td><strong>Total Actif</strong></td><td>${(bp.totalActif || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                    </table>
                  </div>
                  <div style="flex: 1;">
                    <h5>Passif</h5>
                    <table>
                      <tr><td><strong>Fonds propres</strong></td><td>${(bp.fondsPropres || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                      <tr><td><strong>Dettes</strong></td><td>${(bp.dettes || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                      <tr><td><strong>Total Passif</strong></td><td>${(bp.totalPassif || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                    </table>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Plan de Trésorerie Année 1 -->
          ${tableaux.planTresorerieAnnee1 && Array.isArray(tableaux.planTresorerieAnnee1) ? `
            <div class="section">
              <h3>💰 Plan de Trésorerie Année 1</h3>
              <table>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Encaissements</th>
                    <th>Décaissements</th>
                    <th>Solde</th>
                    <th>Solde Cumulé</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.planTresorerieAnnee1.map((pt: any) => `
                    <tr>
                      <td>${pt.mois || 'N/A'}</td>
                      <td>${(pt.encaissements || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${(pt.decaissements || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${(pt.solde || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${(pt.soldeCumule || 0).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Ratios -->
          ${tableaux.ratios && Array.isArray(tableaux.ratios) && tableaux.ratios.length > 0 ? `
            <div class="section">
              <h3>📊 Ratios Financiers</h3>
              <table>
                <thead>
                  <tr>
                    <th>Ratio</th>
                    <th>Valeur</th>
                    <th>Norme</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.ratios.map((r: any) => `
                    <tr>
                      <td>${r.nom || 'N/A'}</td>
                      <td>${r.valeur || 0}</td>
                      <td>${r.norme || 'N/A'}</td>
                      <td>${r.commentaire || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Indicateurs Financiers -->
          ${tableaux.indicateurs ? `
            <div class="section">
              <h3>🎯 Indicateurs Financiers Clés</h3>
              <table class="financial-table">
                <tr><td><strong>Taux de rendement interne (TRI)</strong></td><td>${(tableaux.indicateurs.irr ? (tableaux.indicateurs.irr * 100).toFixed(2) : 'N/A')}%</td></tr>
                <tr><td><strong>Valeur actuelle nette (VAN)</strong></td><td>${(tableaux.indicateurs.npv || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                <tr><td><strong>Délai de récupération</strong></td><td>${(tableaux.indicateurs.paybackPeriod || 0).toFixed(2)} années</td></tr>
                <tr><td><strong>Seuil de rentabilité</strong></td><td>${(tableaux.indicateurs.breakEvenPoint || 0).toFixed(2)} mois</td></tr>
                <tr><td><strong>CAF moyenne</strong></td><td>${(tableaux.indicateurs.cafMoyenne || 0).toLocaleString('fr-FR')} FCFA</td></tr>
                <tr><td><strong>Dette totale</strong></td><td>${(tableaux.indicateurs.detteTotale || 0).toLocaleString('fr-FR')} FCFA</td></tr>
              </table>
              
              ${tableaux.indicateurs.capaciteAutofinancement && Array.isArray(tableaux.indicateurs.capaciteAutofinancement) ? `
                <h4>Capacité d'Autofinancement par Année</h4>
                <table class="financial-table">
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th>Capacité d'Autofinancement</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableaux.indicateurs.capaciteAutofinancement.map((caf: any, index: number) => `
                      <tr>
                        <td>${(tableaux.anneeDebut || 2025) + index}</td>
                        <td>${(caf || 0).toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}
            </div>
          ` : ''}
        ` : ''}

        ${isFinancialEngine ? `
          <!-- DONNÉES DU MOTEUR FINANCIER (FALLBACK) -->
          
          <!-- Sources de Revenus -->
          ${tableaux.revenueStreams?.length > 0 ? `
            <div class="section">
              <h3>💰 Sources de Revenus</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prix Unitaire</th>
                    <th>Quantité/mois</th>
                    <th>Croissance</th>
                    <th>Revenu Annuel</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.revenueStreams.map((stream: any) => `
                    <tr>
                      <td>${stream.name || 'N/A'}</td>
                      <td>${(stream.unitPrice || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${stream.quantity || 0}</td>
                      <td>${((stream.growthRate || 0) * 100).toFixed(1)}%</td>
                      <td>${((stream.unitPrice || 0) * (stream.quantity || 0) * 12).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Coûts Fixes -->
          ${tableaux.fixedCosts?.length > 0 ? `
            <div class="section">
              <h3>🏢 Coûts Fixes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Montant/mois</th>
                    <th>Fréquence</th>
                    <th>Croissance</th>
                    <th>Coût Annuel</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.fixedCosts.map((cost: any) => `
                    <tr>
                      <td>${cost.name || 'N/A'}</td>
                      <td>${(cost.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${cost.frequency || 'mensuel'}</td>
                      <td>${((cost.growthRate || 0) * 100).toFixed(1)}%</td>
                      <td>${((cost.amount || 0) * 12).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Coûts Variables -->
          ${tableaux.variableCosts?.length > 0 ? `
            <div class="section">
              <h3>📊 Coûts Variables</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Montant/mois</th>
                    <th>Fréquence</th>
                    <th>Croissance</th>
                    <th>Coût Annuel</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.variableCosts.map((cost: any) => `
                    <tr>
                      <td>${cost.name || 'N/A'}</td>
                      <td>${(cost.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${cost.frequency || 'mensuel'}</td>
                      <td>${((cost.growthRate || 0) * 100).toFixed(1)}%</td>
                      <td>${((cost.amount || 0) * 12).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Emprunts -->
          ${tableaux.loans?.length > 0 ? `
            <div class="section">
              <h3>🏦 Emprunts</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Montant</th>
                    <th>Taux d'intérêt</th>
                    <th>Durée (mois)</th>
                    <th>Mensualité</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.loans.map((loan: any) => `
                    <tr>
                      <td>${loan.name || 'N/A'}</td>
                      <td>${(loan.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${((loan.interestRate || 0) * 100).toFixed(1)}%</td>
                      <td>${loan.durationMonths || 0}</td>
                      <td>${(loan.monthlyPayment || 0).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Investissements Initiaux -->
          ${tableaux.initialInvestments?.length > 0 ? `
            <div class="section">
              <h3>🏗️ Investissements Initiaux</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Montant</th>
                    <th>Catégorie</th>
                    <th>Durée Amortissement</th>
                    <th>Valeur Résiduelle</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableaux.initialInvestments.map((inv: any) => `
                    <tr>
                      <td>${inv.name || 'N/A'}</td>
                      <td>${(inv.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td>${inv.category || 'N/A'}</td>
                      <td>${inv.depreciationYears || 0} ans</td>
                      <td>${(inv.residualValue || 0).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Paramètres Financiers -->
          <div class="section">
            <h3>⚙️ Paramètres Financiers</h3>
            <table>
              <tr><td><strong>Années de projection:</strong></td><td>${tableaux.projectionYears || 3}</td></tr>
              <tr><td><strong>Taux d'imposition:</strong></td><td>${((tableaux.taxRate || 0.3) * 100).toFixed(1)}%</td></tr>
              <tr><td><strong>Taux d'amortissement:</strong></td><td>${((tableaux.depreciationRate || 0.2) * 100).toFixed(1)}%</td></tr>
              <tr><td><strong>Fonds propres:</strong></td><td>${(tableaux.ownFunds || 0).toLocaleString('fr-FR')} FCFA</td></tr>
              <tr><td><strong>Subventions:</strong></td><td>${(tableaux.grants || 0).toLocaleString('fr-FR')} FCFA</td></tr>
            </table>
          </div>
        ` : ''}
      </div>
      
      <style>
        .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 14px;
        }
        
        .financial-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        
        .financial-table td:first-child {
          width: 60%;
          font-weight: 500;
          color: #374151;
        }
        
        .financial-table td:last-child {
          width: 40%;
          text-align: right;
          font-weight: 600;
          color: #1f2937;
        }
        
        .financial-table tr:hover {
          background-color: #f9fafb;
        }

        /* Styles pour la fiche synoptique */
        .fiche-synoptique {
          max-width: 100%;
        }
        
        .fiche-synoptique .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 30px;
          font-style: italic;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        
        .info-item.full-width {
          grid-column: 1 / -1;
        }
        
        .info-item strong {
          font-size: 12px;
          color: #374151;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-item span {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }
        
        .info-item .amount {
          font-weight: 600;
          color: #059669;
        }
        
        .info-item .amount.highlight {
          color: #dc2626;
          font-size: 16px;
        }
        
        .previsionnelles-summary {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .summary-item {
          text-align: center;
          padding: 15px;
          background: #f0f9ff;
          border-radius: 8px;
          border: 1px solid #0ea5e9;
        }
        
        .summary-item strong {
          display: block;
          font-size: 12px;
          color: #0c4a6e;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        .summary-item span {
          font-size: 16px;
          font-weight: 600;
          color: #0c4a6e;
        }
        
        .signature-section {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
        }
        
        .signature-item {
          text-align: center;
        }
        
        .signature-item strong {
          display: block;
          font-size: 12px;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .signature-item span {
          font-size: 14px;
          color: #1f2937;
        }
        
        .no-data {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 20px;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .section {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #ffffff;
        }
        
        .section h3 {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3b82f6;
        }
        
        .section h4 {
          color: #374151;
          font-size: 16px;
          font-weight: 600;
          margin: 20px 0 10px 0;
        }
        
        .page {
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        .page h1 {
          color: #1f2937;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 3px solid #3b82f6;
        }
        
        /* Styles pour les nouvelles sections professionnelles FONGIP */
        .context-justification {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-left: 5px solid #0ea5e9;
        }
        
        .context-content p {
          text-align: justify;
          line-height: 1.6;
          margin-bottom: 15px;
        }
        
        .technical-study {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-left: 5px solid #22c55e;
        }
        
        .technical-content h3 {
          color: #166534;
          font-size: 18px;
          font-weight: 700;
          margin: 25px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #22c55e;
        }
        
        .installations {
          margin: 20px 0;
        }
        
        .installation-item {
          background: white;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .installation-item h4 {
          color: #166534;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .installation-item ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .installation-item li {
          margin-bottom: 5px;
          color: #374151;
        }
        
        .risk-analysis {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-left: 5px solid #ef4444;
        }
        
        .risk-content h3 {
          color: #dc2626;
          font-size: 18px;
          font-weight: 700;
          margin: 25px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #ef4444;
        }
        
        .risk-category {
          margin: 20px 0;
        }
        
        .risk-item {
          background: white;
          padding: 20px;
          margin: 15px 0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ef4444;
        }
        
        .risk-item h4 {
          color: #dc2626;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .risk-item h5 {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          margin: 15px 0 8px 0;
        }
        
        .mitigation {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          margin-top: 10px;
        }
        
        .mitigation ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .mitigation li {
          margin-bottom: 5px;
          color: #374151;
        }
        
        .structured-conclusion {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-left: 5px solid #8b5cf6;
        }
        
        .conclusion-content p {
          text-align: justify;
          line-height: 1.6;
          margin-bottom: 15px;
        }
        
        .conclusion-content h3 {
          color: #7c3aed;
          font-size: 18px;
          font-weight: 700;
          margin: 25px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #8b5cf6;
        }
        
        .signature-section {
          margin-top: 40px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          text-align: right;
          border: 2px solid #e5e7eb;
        }
        
        .signature-section p {
          margin: 10px 0;
          font-weight: 600;
          color: #374151;
        }
      </style>
    `
  }

  private static generateRentabilite(rentabilite: any): string {
    console.log('🔍 DEBUG generateRentabilite:', {
      hasRentabilite: !!rentabilite,
      rentabiliteKeys: rentabilite ? Object.keys(rentabilite) : [],
      sample: rentabilite ? JSON.stringify(rentabilite).substring(0, 300) : null
    })
    
    if (!rentabilite) return ''
    
    return `
      <div class="page">
        <h1>📈 Analyse de Rentabilité</h1>

        ${rentabilite.investissementInitial ? `
          <div class="section">
            <h3>Investissement Initial</h3>
            <p><strong>Montant:</strong> ${rentabilite.investissementInitial.toLocaleString('fr-FR')} FCFA</p>
          </div>
        ` : ''}

        ${rentabilite.cashFlows?.length > 0 ? `
          <div class="section">
            <h3>Flux de Trésorerie</h3>
            <table>
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Cash Flow Net</th>
                  <th>Cash Flow Cumulé</th>
                  <th>Résultat Net</th>
                </tr>
              </thead>
              <tbody>
                ${rentabilite.cashFlows.map((cf: any) => `
                  <tr>
                    <td>${cf.annee || 'N/A'}</td>
                    <td>${(cf.cashFlowNet || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td>${(cf.cashFlowCumule || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td>${(cf.resultatNet || 0).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${rentabilite.van || rentabilite.tri || rentabilite.drci ? `
          <div class="section">
            <h3>Indicateurs de Rentabilité</h3>
            ${rentabilite.van ? `<p><strong>VAN:</strong> ${rentabilite.van.toLocaleString('fr-FR')} FCFA</p>` : ''}
            ${rentabilite.tri ? `<p><strong>TRI:</strong> ${(rentabilite.tri * 100).toFixed(2)}%</p>` : ''}
            ${rentabilite.drci ? `<p><strong>DRCI:</strong> ${rentabilite.drci.toFixed(2)} années</p>` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  private static generateFinancialNarrative(narrative: any): string {
    return `
      <div class="page">
        <h1>🧾 Analyse et synthèse financière</h1>
        <div class="section">
          <p>${narrative.narrative || ''}</p>
          <p style="color:#6b7280; font-size:12px; margin-top:10px;">Généré le: ${narrative.generatedAt ? new Date(narrative.generatedAt).toLocaleString('fr-FR') : ''}</p>
        </div>
      </div>
    `
  }

  private static generateRelationsBancaires(relations: any): string {
    return `
      <div class="page">
        <h1>🏦 Relations Bancaires</h1>

        <div class="metric-card">
          <div class="metric-value">${relations.note?.noteGlobale || 0}/100</div>
          <div class="metric-label">Note Bancaire Globale</div>
        </div>

        <h3>Banques partenaires</h3>
        ${relations.banquesPartenaires?.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Banque</th>
                <th>Années relation</th>
                <th>Qualité</th>
              </tr>
            </thead>
            <tbody>
              ${relations.banquesPartenaires.map((b: any) => `
                <tr>
                  <td>${b.nom}</td>
                  <td>${b.anneesRelation}</td>
                  <td><span class="badge badge-success">${b.qualiteRelation}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>Aucune banque partenaire</p>'}
      </div>
    `
  }

  private static generateScoringFongip(scoring: any): string {
    return `
      <div class="page">
        <h1>⭐ Score FONGIP & Recommandations</h1>

        <div class="metric-card">
          <div class="metric-value">${scoring.scoreTotal || 0}/100</div>
          <div class="metric-label">Score FONGIP Total</div>
        </div>

        <h3>Détail des scores</h3>
        <table>
          ${scoring.details ? Object.entries(scoring.details).map(([key, value]: [string, any]) => `
            <tr>
              <td><strong>${key}</strong></td>
              <td>${value}/100</td>
            </tr>
          `).join('') : ''}
        </table>

        <h3>Recommandations</h3>
        <ul>
          ${(scoring.recommandations || []).map((r: string) => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    `
  }

  /**
   * Génère la section "Contexte et Justification" type FONGIP
   */
  private static generateContextJustification(data: ExportedPDFData): string {
    const { project } = data
    const basicInfo = project.basicInfo || {}
    const marketStudy = project.sections?.marketStudy || {}
    
    return `
      <div class="section context-justification">
        <h2>CONTEXTE ET JUSTIFICATION</h2>
        
        <div class="context-content">
          <p>
            Le secteur ${basicInfo.sector || 'd\'activité'} sénégalais est un pilier de l'économie, 
            en pleine expansion et crucial pour la sécurité alimentaire et le développement économique. 
            Il englobe une variété de systèmes de production, des activités traditionnelles aux 
            exploitations modernes et intensives.
          </p>
          
          <p>
            Un plan stratégique de compétitivité a été élaboré en collaboration avec les institutions 
            sectorielles. Les pouvoirs publics veulent renforcer et moderniser la filière à travers 
            l'amélioration de la qualité et de la sécurité des produits, le soutien à la production 
            locale, la structuration de la filière et le développement des marchés.
          </p>
          
          <p>
            Les défis persistants incluent les coûts élevés des intrants, les risques de marché, 
            la nécessité d'améliorer les pratiques de production, l'impact des variations 
            climatiques, ainsi que la maîtrise des coûts de production et des circuits de distribution.
          </p>
          
          <p>
            Malgré ces défis, le secteur ${basicInfo.sector || 'd\'activité'} sénégalais présente 
            un potentiel de croissance significatif, grâce à une demande croissante en produits 
            locaux et à des politiques gouvernementales favorables.
          </p>
          
          <p>
            <strong>${basicInfo.name || 'L\'entreprise'}</strong>, acteur majeur de la filière 
            ${basicInfo.sector || 'd\'activité'} sénégalaise, a initié un programme d'expansion 
            stratégique de ses installations de production. Ce projet est axé sur une augmentation 
            significative de sa capacité de production.
          </p>
          
          <p>
            La réalisation de ce programme d'expansion nécessite un apport financier conséquent. 
            Le présent dossier constitue une étude de faisabilité détaillée, élaborée à l'intention 
            des partenaires financiers potentiels.
          </p>
        </div>
      </div>
    `
  }

  /**
   * Génère la section "Étude Technique du Projet" type FONGIP
   */
  private static generateTechnicalStudy(data: ExportedPDFData): string {
    const { project } = data
    const basicInfo = project.basicInfo || {}
    const financialEngine = project.sections?.financialEngine || {}
    
    return `
      <div class="section technical-study">
        <h2>ÉTUDE TECHNIQUE DU PROJET</h2>
        
        <div class="technical-content">
          <h3>Présentation générale du projet</h3>
          <p>
            Le projet ${basicInfo.name || 'd\'expansion'} vise à ${basicInfo.description || 
            'augmenter la capacité de production et améliorer les performances de l\'entreprise'}.
          </p>
          
          <h3>Descriptif technique des installations</h3>
          <div class="installations">
            ${financialEngine.initialInvestments ? financialEngine.initialInvestments.map((investment: any) => `
              <div class="installation-item">
                <h4>${investment.name || 'Équipement'}</h4>
                <ul>
                  <li><strong>Catégorie:</strong> ${investment.category || 'Non spécifiée'}</li>
                  <li><strong>Montant:</strong> ${investment.amount ? investment.amount.toLocaleString('fr-FR') : '0'} FCFA</li>
                  <li><strong>Date d'acquisition:</strong> ${investment.date || 'À définir'}</li>
                  ${investment.depreciationYears ? `<li><strong>Durée d'amortissement:</strong> ${investment.depreciationYears} ans</li>` : ''}
                </ul>
              </div>
            `).join('') : '<p>Aucun investissement initial défini.</p>'}
          </div>
          
          <h3>Renforcement du personnel</h3>
          <p>
            Le projet prévoit un renforcement du personnel pour accompagner l'expansion des activités. 
            Les besoins en ressources humaines seront définis en fonction de la croissance prévue.
          </p>
          
          <h3>Planning d'exécution du projet</h3>
          <div class="planning">
            <p>
              Le projet sera exécuté selon un planning détaillé qui sera établi en fonction 
              des besoins de financement et des contraintes techniques identifiées.
            </p>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Génère la section "Risques Identifiés et Facteurs de Mitigation" type FONGIP
   */
  private static generateRiskAnalysis(data: ExportedPDFData): string {
    const { project } = data
    const swotAnalysis = project.sections?.swotAnalysis || {}
    
    return `
      <div class="section risk-analysis">
        <h2>RISQUES IDENTIFIÉS ET FACTEURS DE MITIGATION</h2>
        
        <div class="risk-content">
          <h3>Risques opérationnels</h3>
          <div class="risk-category">
            ${swotAnalysis.threats ? swotAnalysis.threats.map((threat: any) => `
              <div class="risk-item">
                <h4>${threat.description || 'Risque non spécifié'}</h4>
                <p><strong>Impact:</strong> ${threat.impact || 'Non évalué'}</p>
                <p><strong>Priorité:</strong> ${threat.priority || 'Non définie'}</p>
                <div class="mitigation">
                  <h5>Facteurs de mitigation:</h5>
                  <ul>
                    ${(threat.actionItems || []).map((item: string) => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
              </div>
            `).join('') : '<p>Aucun risque opérationnel identifié.</p>'}
          </div>
          
          <h3>Risques financiers</h3>
          <div class="risk-category">
            <div class="risk-item">
              <h4>Risque de trésorerie</h4>
              <p>Variations des flux de trésorerie pouvant affecter la capacité de remboursement.</p>
              <div class="mitigation">
                <h5>Facteurs de mitigation:</h5>
                <ul>
                  <li>Mise en place d'une gestion rigoureuse de la trésorerie</li>
                  <li>Diversification des sources de revenus</li>
                  <li>Établissement de lignes de crédit de secours</li>
                </ul>
              </div>
            </div>
            
            <div class="risk-item">
              <h4>Risque de taux d'intérêt</h4>
              <p>Variations des taux d'intérêt pouvant impacter les charges financières.</p>
              <div class="mitigation">
                <h5>Facteurs de mitigation:</h5>
                <ul>
                  <li>Négociation de taux fixes lorsque possible</li>
                  <li>Suivi régulier de l'évolution des taux</li>
                  <li>Optimisation de la structure financière</li>
                </ul>
              </div>
            </div>
          </div>
          
          <h3>Risques de marché</h3>
          <div class="risk-category">
            <div class="risk-item">
              <h4>Concurrence</h4>
              <p>Apparition de nouveaux concurrents ou intensification de la concurrence existante.</p>
              <div class="mitigation">
                <h5>Facteurs de mitigation:</h5>
                <ul>
                  <li>Renforcement de l'avantage concurrentiel</li>
                  <li>Innovation continue des produits et services</li>
                  <li>Fidélisation de la clientèle</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Génère la section "Conclusion et Avis" structurée type FONGIP
   */
  private static generateStructuredConclusion(data: ExportedPDFData): string {
    const { project } = data
    const basicInfo = project.basicInfo || {}
    const financialEngine = project.sections?.financialEngine || {}
    
    return `
      <div class="section structured-conclusion">
        <h2>CONCLUSION & AVIS</h2>
        
        <div class="conclusion-content">
          <p>
            <strong>${basicInfo.name || 'L\'entreprise'}</strong> est un acteur important du secteur 
            ${basicInfo.sector || 'd\'activité'}. Le promoteur a su faire preuve de professionnalisme 
            pour bénéficier de l'accompagnement des partenaires pour augmenter graduellement sa 
            capacité de production.
          </p>
          
          <p>
            Le secteur ${basicInfo.sector || 'd\'activité'} est un secteur qui regorge de potentialités 
            avec une très forte demande non couverte. De plus, le secteur s'impose comme un levier 
            essentiel pour renforcer la souveraineté alimentaire, stimuler l'emploi (notamment rural 
            et féminin), et renforcer la résilience économique dans la Vision Sénégal 2050.
          </p>
          
          <p>
            Le modèle et le savoir-faire de ${basicInfo.name || 'l\'entreprise'} ont fini de convaincre 
            les partenaires qui absorbent la quasi-totalité de sa production. Le projet d'augmentation 
            de sa capacité de production est rentable.
          </p>
          
          <h3>Le risque est fortement mitigé par :</h3>
          <ul>
            <li>Des sources de remboursement sécurisées par des contrats signés avec les partenaires</li>
            <li>L'intervention du FONGIP à hauteur de 60% puisqu'il s'agit d'une activité éligible au programme ETER</li>
            <li>Le dépôt de garantie constitué par ${basicInfo.name || 'l\'entreprise'}</li>
            <li>Une hypothèque à hauteur de premier rang</li>
          </ul>
          
          <h3>Recommandations</h3>
          <p>
            Compte tenu de la qualité du projet, de la solidité financière de l'entreprise et des 
            garanties proposées, il est recommandé d'accorder le financement sollicité.
          </p>
          
          <div class="signature-section">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Signature:</strong> _________________________</p>
          </div>
        </div>
      </div>
    `
  }

  private static getHTMLFooter(options: PDFExportOptions): string {
    return `
        ${options.watermark ? `
          <div class="watermark">
            ${options.watermark}
          </div>
        ` : ''}
      </body>
      </html>
    `
  }
}
