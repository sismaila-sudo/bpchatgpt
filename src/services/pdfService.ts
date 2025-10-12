// Service de génération PDF pour business plans
// Templates conformes aux standards institutionnels sénégalais

import { jsPDF } from 'jspdf'
import { Project } from '@/types/project'
import {
  ProjectFinancials,
  InitialFinancing,
  InitialInvestments,
  ProfitLossProjection,
  FinancialRatios,
  BreakEvenAnalysis,
  ValidationStatus
} from '@/types/financial'
import { BUSINESS_SECTOR_LABELS, SENEGAL_REGIONS } from '@/lib/constants'

export enum PDFTemplate {
  STANDARD = 'standard',
  FONGIP = 'fongip',
  FAISE = 'faise',
  DER = 'der',
  BANK = 'bank'
}

export interface PDFOptions {
  template: PDFTemplate
  includeFinancials: boolean
  includeSWOT: boolean
  includeMarketStudy: boolean
  language: 'fr' | 'en'
}

export class PDFGenerationService {
  private doc: jsPDF
  private currentY: number = 20
  private pageHeight: number = 297 // A4 height
  private pageWidth: number = 210 // A4 width
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
  }

  /**
   * Génère un business plan PDF complet
   */
  async generateBusinessPlanPDF(
    project: Project,
    financials: ProjectFinancials | null,
    options: PDFOptions = {
      template: PDFTemplate.STANDARD,
      includeFinancials: true,
      includeSWOT: false,
      includeMarketStudy: false,
      language: 'fr'
    }
  ): Promise<Blob> {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.currentY = 20

    // Page de couverture
    this.generateCoverPage(project, options.template)

    // Sommaire
    this.addNewPage()
    this.generateTableOfContents(options)

    // 1. Résumé exécutif
    this.addNewPage()
    this.generateExecutiveSummary(project, financials)

    // 2. Présentation du projet
    this.addNewPage()
    this.generateProjectPresentation(project)

    // 3. Étude de marché (si incluse)
    if (options.includeMarketStudy) {
      this.addNewPage()
      this.generateMarketStudy(project)
    }

    // 4. Données financières (si incluses)
    if (options.includeFinancials && financials) {
      this.addNewPage()
      this.generateFinancialSection(financials, project)
    }

    // 5. Analyse SWOT (si incluse)
    if (options.includeSWOT) {
      this.addNewPage()
      this.generateSWOTAnalysis(project)
    }

    // 6. Annexes
    this.addNewPage()
    this.generateAnnexes(project, financials)

    // Footer institutionnel selon template
    this.addInstitutionalFooter(options.template)

    return this.doc.output('blob')
  }

  /**
   * Page de couverture selon template institutionnel
   */
  private generateCoverPage(project: Project, template: PDFTemplate) {
    const { basicInfo } = project

    // Header institutionnel
    this.addInstitutionalHeader(template)

    // Titre principal
    this.currentY = 80
    this.doc.setFontSize(28)
    this.doc.setTextColor(0, 51, 102) // Bleu institutionnel
    this.doc.text('BUSINESS PLAN', this.pageWidth / 2, this.currentY, { align: 'center' })

    this.currentY += 20
    this.doc.setFontSize(24)
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(basicInfo.name.toUpperCase(), this.pageWidth / 2, this.currentY, { align: 'center' })

    // Informations projet
    this.currentY += 40
    this.doc.setFontSize(14)
    this.doc.setTextColor(60, 60, 60)

    const projectInfo = [
      `Secteur d'activité : ${BUSINESS_SECTOR_LABELS[basicInfo.sector]}`,
      `Type de projet : ${this.getProjectTypeLabel(basicInfo.projectType)}`,
      `Localisation : ${basicInfo.location.city}, ${basicInfo.location.region}`,
      `Durée : ${basicInfo.timeline.duration} mois`,
      '',
      `Date d'établissement : ${new Date().toLocaleDateString('fr-FR')}`
    ]

    projectInfo.forEach(line => {
      if (line) {
        this.doc.text(line, this.pageWidth / 2, this.currentY, { align: 'center' })
      }
      this.currentY += 8
    })

    // Logo/Cachet selon institution
    this.addInstitutionalSeal(template)
  }

  /**
   * Génère le sommaire
   */
  private generateTableOfContents(options: PDFOptions) {
    this.addSectionTitle('SOMMAIRE')

    const contents = [
      { title: '1. RÉSUMÉ EXÉCUTIF', page: 3 },
      { title: '2. PRÉSENTATION DU PROJET', page: 4 },
    ]

    if (options.includeMarketStudy) {
      contents.push({ title: '3. ÉTUDE DE MARCHÉ', page: 5 })
    }

    if (options.includeFinancials) {
      contents.push({ title: '4. DONNÉES FINANCIÈRES', page: 6 })
    }

    if (options.includeSWOT) {
      contents.push({ title: '5. ANALYSE SWOT', page: 7 })
    }

    contents.push({ title: '6. ANNEXES', page: 8 })

    this.doc.setFontSize(12)
    contents.forEach(item => {
      this.doc.text(item.title, this.margin, this.currentY)
      this.doc.text(`${item.page}`, this.pageWidth - this.margin, this.currentY, { align: 'right' })

      // Ligne pointillée
      const dots = '.'.repeat(Math.floor((this.pageWidth - 2 * this.margin -
        this.doc.getTextWidth(item.title) - this.doc.getTextWidth(`${item.page}`)) / 2))
      this.doc.text(dots, this.margin + this.doc.getTextWidth(item.title) + 5, this.currentY)

      this.currentY += 8
    })
  }

  /**
   * Résumé exécutif
   */
  private generateExecutiveSummary(project: Project, financials: ProjectFinancials | null) {
    this.addSectionTitle('1. RÉSUMÉ EXÉCUTIF')

    // Description du projet
    this.addSubsectionTitle('1.1 Description du projet')
    this.addParagraph(project.basicInfo.description)

    // Objectifs
    this.addSubsectionTitle('1.2 Objectifs')
    this.addParagraph(`Ce projet vise à ${this.getProjectObjective(project.basicInfo.projectType)}
      dans le secteur ${BUSINESS_SECTOR_LABELS[project.basicInfo.sector]} au Sénégal.`)

    // Résumé financier
    if (financials) {
      this.addSubsectionTitle('1.3 Résumé financier')
      this.generateFinancialSummary(financials)
    }

    // Facteurs clés de succès
    this.addSubsectionTitle('1.4 Facteurs clés de succès')
    const successFactors = this.getSuccessFactors(project.basicInfo.sector)
    successFactors.forEach(factor => {
      this.addBulletPoint(factor)
    })
  }

  /**
   * Présentation du projet
   */
  private generateProjectPresentation(project: Project) {
    this.addSectionTitle('2. PRÉSENTATION DU PROJET')

    // Informations générales
    this.addSubsectionTitle('2.1 Informations générales')

    const projectDetails = [
      [`Nom du projet`, project.basicInfo.name],
      [`Secteur d'activité`, BUSINESS_SECTOR_LABELS[project.basicInfo.sector]],
      [`Type de projet`, this.getProjectTypeLabel(project.basicInfo.projectType)],
      [`Taille d'entreprise`, this.getCompanySizeLabel(project.basicInfo.companySize)],
      [`Localisation`, `${project.basicInfo.location.city}, ${project.basicInfo.location.region}`],
    ]

    if (project.basicInfo.location.address) {
      projectDetails.push(['Adresse', project.basicInfo.location.address])
    }

    this.addTable(projectDetails)

    // Planning
    this.addSubsectionTitle('2.2 Planning prévisionnel')
    this.addParagraph(`Durée totale du projet : ${project.basicInfo.timeline.duration} mois`)
    this.addParagraph(`Date de démarrage prévue : ${project.basicInfo.timeline.startDate.toLocaleDateString('fr-FR')}`)

    // Description détaillée
    this.addSubsectionTitle('2.3 Description détaillée')
    this.addParagraph(project.basicInfo.description)

    // Contexte sectoriel
    this.addSubsectionTitle('2.4 Contexte sectoriel au Sénégal')
    this.addParagraph(this.getSectorContext(project.basicInfo.sector))
  }

  /**
   * Section financière
   */
  private generateFinancialSection(financials: ProjectFinancials, project: Project) {
    this.addSectionTitle('3. DONNÉES FINANCIÈRES')

    // Plan de financement
    this.addSubsectionTitle('3.1 Plan de financement initial')
    this.generateFinancingTable(financials.initialFinancing)

    // Investissements
    this.addSubsectionTitle('3.2 Détail des investissements')
    this.generateInvestmentsTable(financials.initialInvestments)

    // Comptes de résultat prévisionnels
    this.addSubsectionTitle('3.3 Comptes de résultat prévisionnels')
    this.generateProfitLossTable(financials.profitLossProjections)

    // Ratios financiers
    this.addSubsectionTitle('3.4 Ratios financiers')
    this.generateRatiosTable(financials.financialRatios[0])

    // Analyse de rentabilité
    this.addSubsectionTitle('3.5 Analyse de rentabilité')
    if (financials.breakEvenAnalysis.length > 0) {
      this.generateBreakEvenAnalysis(financials.breakEvenAnalysis[0])
    }

    // Validation bancaire
    this.addSubsectionTitle('3.6 Conformité aux critères bancaires')
    this.generateBankingValidation(financials.validationStatus)
  }

  /**
   * Méthodes utilitaires pour tableaux financiers
   */
  private generateFinancingTable(financing: InitialFinancing) {
    const data = [
      ['Source de financement', 'Montant (FCFA)', '%'],
      ['Apport personnel', this.formatCurrency(financing.personalContribution),
       this.calculatePercentage(financing.personalContribution, financing.totalProject)],
    ]

    financing.loans.forEach((loan, index: number) => {
      data.push([
        `Emprunt ${index + 1} (${this.getFinancingSourceLabel(loan.source)})`,
        this.formatCurrency(loan.amount),
        this.calculatePercentage(loan.amount, financing.totalProject)
      ])
    })

    data.push([
      'TOTAL FINANCEMENT',
      this.formatCurrency(financing.totalProject),
      '100%'
    ])

    this.addFinancialTable(data)
  }

  private generateProfitLossTable(projections: ProfitLossProjection[]) {
    const headers = ['Éléments', 'Année 1', 'Année 2', 'Année 3']
    const data = [
      headers,
      ['Chiffre d\'affaires', ...projections.slice(0, 3).map(p => this.formatCurrency(p.revenues.total))],
      ['Charges d\'exploitation', ...projections.slice(0, 3).map(p => this.formatCurrency(p.expenses.total))],
      ['Résultat d\'exploitation', ...projections.slice(0, 3).map(p => this.formatCurrency(p.operatingProfit))],
      ['Charges financières', ...projections.slice(0, 3).map(p => this.formatCurrency(p.financialCharges))],
      ['Résultat avant impôt', ...projections.slice(0, 3).map(p => this.formatCurrency(p.netProfitBeforeTax))],
      ['Impôts', ...projections.slice(0, 3).map(p => this.formatCurrency(p.taxes))],
      ['RÉSULTAT NET', ...projections.slice(0, 3).map(p => this.formatCurrency(p.netProfit))]
    ]

    this.addFinancialTable(data)
  }

  /**
   * Headers institutionnels
   */
  private addInstitutionalHeader(template: PDFTemplate) {
    this.doc.setFontSize(10)
    this.doc.setTextColor(100, 100, 100)

    switch (template) {
      case PDFTemplate.FONGIP:
        this.doc.text('FONDS DE GARANTIE DES INVESTISSEMENTS PRIORITAIRES', this.pageWidth / 2, 10, { align: 'center' })
        this.doc.text('RÉPUBLIQUE DU SÉNÉGAL', this.pageWidth / 2, 15, { align: 'center' })
        break

      case PDFTemplate.FAISE:
        this.doc.text('FONDS D\'APPUI À L\'INVESTISSEMENT DES SÉNÉGALAIS DE L\'EXTÉRIEUR', this.pageWidth / 2, 10, { align: 'center' })
        this.doc.text('RÉPUBLIQUE DU SÉNÉGAL', this.pageWidth / 2, 15, { align: 'center' })
        break

      case PDFTemplate.DER:
        this.doc.text('DÉLÉGATION À L\'ENTREPRENEURIAT RAPIDE', this.pageWidth / 2, 10, { align: 'center' })
        this.doc.text('RÉPUBLIQUE DU SÉNÉGAL', this.pageWidth / 2, 15, { align: 'center' })
        break

      case PDFTemplate.BANK:
        this.doc.text('DOSSIER DE FINANCEMENT BANCAIRE', this.pageWidth / 2, 10, { align: 'center' })
        this.doc.text('CONFORME AUX STANDARDS BCEAO', this.pageWidth / 2, 15, { align: 'center' })
        break

      default:
        this.doc.text('BUSINESS PLAN PROFESSIONNEL', this.pageWidth / 2, 10, { align: 'center' })
        this.doc.text('RÉPUBLIQUE DU SÉNÉGAL', this.pageWidth / 2, 15, { align: 'center' })
    }

    // Ligne de séparation
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, 18, this.pageWidth - this.margin, 18)
  }

  /**
   * Méthodes utilitaires
   */
  private addSectionTitle(title: string) {
    this.checkPageBreak(15)
    this.doc.setFontSize(16)
    this.doc.setTextColor(0, 51, 102)
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 10
  }

  private addSubsectionTitle(title: string) {
    this.checkPageBreak(10)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 8
  }

  private addParagraph(text: string) {
    this.checkPageBreak(15)
    this.doc.setFontSize(11)
    this.doc.setTextColor(0, 0, 0)

    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin)
    lines.forEach((line: string) => {
      this.checkPageBreak(5)
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += 5
    })
    this.currentY += 3
  }

  private addBulletPoint(text: string) {
    this.checkPageBreak(8)
    this.doc.setFontSize(11)
    this.doc.text('•', this.margin, this.currentY)

    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin - 10)
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 8, this.currentY)
      if (index < lines.length - 1) {
        this.currentY += 5
        this.checkPageBreak(5)
      }
    })
    this.currentY += 8
  }

  private addTable(data: string[][]) {
    this.checkPageBreak(data.length * 6 + 10)

    const colWidth = (this.pageWidth - 2 * this.margin) / 2

    data.forEach(row => {
      this.doc.setFontSize(10)
      this.doc.text(row[0], this.margin, this.currentY)
      this.doc.text(row[1], this.margin + colWidth, this.currentY)
      this.currentY += 6
    })
    this.currentY += 5
  }

  private addFinancialTable(data: string[][]) {
    this.checkPageBreak(data.length * 6 + 10)

    const colWidth = (this.pageWidth - 2 * this.margin) / data[0].length

    data.forEach((row, rowIndex) => {
      this.doc.setFontSize(rowIndex === 0 ? 10 : 9)
      this.doc.setTextColor(rowIndex === 0 ? 0 : 60, rowIndex === 0 ? 0 : 60, rowIndex === 0 ? 0 : 60)

      row.forEach((cell, colIndex) => {
        const x = this.margin + colIndex * colWidth
        this.doc.text(cell, x, this.currentY)
      })

      this.currentY += rowIndex === 0 ? 8 : 6
    })
    this.currentY += 5
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addNewPage()
    }
  }

  private addNewPage() {
    this.doc.addPage()
    this.currentY = this.margin + 10
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  private calculatePercentage(amount: number, total: number): string {
    return total > 0 ? `${((amount / total) * 100).toFixed(1)}%` : '0%'
  }

  // Méthodes de mapping et contexte
  private getProjectTypeLabel(type: string): string {
    const labels = {
      creation: 'Création d\'entreprise',
      expansion: 'Extension d\'activité',
      diversification: 'Diversification',
      reprise: 'Reprise d\'entreprise'
    }
    return labels[type as keyof typeof labels] || type
  }

  private getCompanySizeLabel(size: string): string {
    const labels = {
      micro: 'Micro-entreprise (< 5 employés)',
      small: 'Petite entreprise (5-20 employés)',
      medium: 'Moyenne entreprise (20-100 employés)',
      large: 'Grande entreprise (> 100 employés)'
    }
    return labels[size as keyof typeof labels] || size
  }

  private getProjectObjective(type: string): string {
    const objectives = {
      creation: 'créer une nouvelle entreprise',
      expansion: 'étendre les activités existantes',
      diversification: 'diversifier les activités',
      reprise: 'reprendre une entreprise existante'
    }
    return objectives[type as keyof typeof objectives] || 'développer une activité'
  }

  private getSuccessFactors(sector: string): string[] {
    const factors = {
      agriculture: [
        'Maîtrise des techniques agricoles modernes',
        'Accès aux marchés et circuits de distribution',
        'Gestion optimale de la chaîne d\'approvisionnement',
        'Conformité aux normes de qualité'
      ],
      commerce: [
        'Emplacement stratégique',
        'Gestion des stocks et rotation',
        'Relation client et fidélisation',
        'Diversification de l\'offre'
      ],
      services: [
        'Qualité de service et expertise',
        'Réseau professionnel développé',
        'Innovation et adaptation',
        'Gestion de la réputation'
      ]
    }
    return factors[sector as keyof typeof factors] || [
      'Expertise technique et savoir-faire',
      'Positionnement concurrentiel',
      'Gestion financière rigoureuse',
      'Adaptation au marché local'
    ]
  }

  private getSectorContext(sector: string): string {
    const contexts = {
      agriculture: 'Le secteur agricole représente 17% du PIB sénégalais et emploie 60% de la population active. Les opportunités sont nombreuses avec les politiques gouvernementales de souveraineté alimentaire.',
      elevage: 'L\'élevage contribue à 4% du PIB national. Le Plan Sénégal Émergent (PSE) priorise le développement de l\'élevage moderne et l\'amélioration de la productivité.',
      peche: 'La pêche est un secteur stratégique du Sénégal avec 600 000 emplois directs et indirects. Les ressources halieutiques offrent un potentiel de développement important.',
      industrie: 'Le secteur industriel bénéficie des politiques d\'industrialisation du PSE et de la position géographique stratégique du Sénégal en Afrique de l\'Ouest.',
      services: 'Le secteur tertiaire représente 55% du PIB sénégalais et connaît une croissance soutenue, notamment avec le développement du numérique.',
      commerce: 'Le commerce bénéficie de la position de hub régional du Sénégal et du développement des infrastructures de transport et logistiques.'
    }
    return contexts[sector as keyof typeof contexts] || 'Ce secteur présente des opportunités de développement dans le contexte économique sénégalais.'
  }

  private getFinancingSourceLabel(source: string): string {
    const labels = {
      bank_loan: 'Banque commerciale',
      microfinance: 'Microfinance',
      fongip: 'FONGIP',
      faise: 'FAISE',
      der: 'DER',
      personal: 'Fonds propres',
      investor: 'Investisseur',
      family: 'Famille',
      other: 'Autre'
    }
    return labels[source as keyof typeof labels] || source
  }

  private generateFinancialSummary(financials: ProjectFinancials) {
    const summary = [
      [`Investissement total`, this.formatCurrency(financials.initialFinancing.totalProject)],
      [`Financement propre`, this.formatCurrency(financials.initialFinancing.personalContribution)],
      [`Emprunts`, this.formatCurrency(financials.initialFinancing.loans.reduce((sum, loan) => sum + loan.amount, 0))],
      [`CA prévisionnel Année 1`, this.formatCurrency(financials.profitLossProjections[0]?.revenues.total || 0)],
      [`Résultat net Année 1`, this.formatCurrency(financials.profitLossProjections[0]?.netProfit || 0)]
    ]

    this.addTable(summary)
  }

  private generateInvestmentsTable(investments: InitialInvestments) {
    const data = [
      ['Type d\'investissement', 'Montant (FCFA)'],
      ['Équipements', this.formatCurrency(investments.equipment?.reduce((sum, eq) => sum + eq.totalPrice, 0) || 0)],
      ['Immobilisations incorporelles', this.formatCurrency(investments.intangible?.reduce((sum, int) => sum + int.amount, 0) || 0)],
      ['Besoin en fonds de roulement', this.formatCurrency(investments.workingCapital?.reduce((sum, wc) => sum + wc.amount, 0) || 0)],
      ['TOTAL INVESTISSEMENTS', this.formatCurrency(investments.total)]
    ]

    this.addFinancialTable(data)
  }

  private generateRatiosTable(ratios: FinancialRatios) {
    if (!ratios) return

    const data = [
      ['Ratio', 'Valeur', 'Norme'],
      ['Rentabilité (ROI)', `${ratios.profitability.roi.toFixed(1)}%`, '> 15%'],
      ['Autonomie financière', `${(ratios.leverage.equityRatio * 100).toFixed(1)}%`, '> 30%'],
      ['Liquidité générale', ratios.liquidity.currentRatio.toFixed(2), '> 1.2'],
      ['Couverture des intérêts', ratios.leverage.interestCoverage.toFixed(1), '> 2.0'],
      ['Délai de récupération', `${ratios.profitability.paybackPeriod.toFixed(1)} ans`, '< 5 ans']
    ]

    this.addFinancialTable(data)
  }

  private generateBreakEvenAnalysis(breakEven: BreakEvenAnalysis) {
    this.addParagraph(`Seuil de rentabilité : ${this.formatCurrency(breakEven.breakEvenRevenue)}`)
    this.addParagraph(`Marge de sécurité : ${breakEven.marginOfSafety.toFixed(1)}%`)
    if (breakEven.reachMonth) {
      this.addParagraph(`Seuil atteint au mois ${breakEven.reachMonth}`)
    }
  }

  private generateBankingValidation(validation: ValidationStatus) {
    if (validation.isValid) {
      this.addParagraph('✓ Le projet respecte les critères bancaires standard.')
    } else {
      this.addParagraph('⚠ Points d\'attention identifiés :')
      validation.errors.forEach((error) => {
        this.addBulletPoint(error.message)
      })
    }
  }

  private generateMarketStudy(project: Project) {
    this.addSectionTitle('3. ÉTUDE DE MARCHÉ')
    this.addParagraph('Section étude de marché à développer selon les besoins spécifiques du secteur.')
  }

  private generateSWOTAnalysis(project: Project) {
    this.addSectionTitle('5. ANALYSE SWOT')
    this.addParagraph('Analyse SWOT à développer selon les caractéristiques du projet.')
  }

  private generateAnnexes(project: Project, financials: ProjectFinancials | null) {
    this.addSectionTitle('6. ANNEXES')
    this.addParagraph('Documents complémentaires et pièces justificatives.')
  }

  private addInstitutionalSeal(template: PDFTemplate) {
    // Emplacement pour logo/cachet institutionnel
    this.currentY = this.pageHeight - 60
    this.doc.setFontSize(8)
    this.doc.setTextColor(150, 150, 150)

    switch (template) {
      case PDFTemplate.FONGIP:
        this.doc.text('Document conforme aux exigences FONGIP', this.pageWidth / 2, this.currentY, { align: 'center' })
        break
      case PDFTemplate.FAISE:
        this.doc.text('Document conforme aux exigences FAISE', this.pageWidth / 2, this.currentY, { align: 'center' })
        break
      case PDFTemplate.DER:
        this.doc.text('Document conforme aux exigences DER', this.pageWidth / 2, this.currentY, { align: 'center' })
        break
      case PDFTemplate.BANK:
        this.doc.text('Document conforme aux standards bancaires BCEAO', this.pageWidth / 2, this.currentY, { align: 'center' })
        break
    }
  }

  private addInstitutionalFooter(template: PDFTemplate) {
    // Footer sur toutes les pages
    const pageCount = this.doc.getCurrentPageInfo().pageNumber
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(100, 100, 100)
      this.doc.text(`Page ${i}/${pageCount}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
      this.doc.text('Généré par BP Design Pro - www.bpdesignpro.sn', this.pageWidth / 2, this.pageHeight - 5, { align: 'center' })
    }
  }
}

// Instance singleton
export const pdfService = new PDFGenerationService()