import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { aiTextGenerationService } from './aiTextGeneration'

export interface PDFExportOptions {
  includeFinancials: boolean
  includeCharts: boolean
  includeAppendices: boolean
  template: 'banque' | 'investisseur' | 'garantie'
  language: 'fr' | 'en'
}

export interface FinancialData {
  totalRevenue: number
  totalProfit: number
  profitMargin: number
  totalInvestment: number
  financingNeed: number
  roi: number
  van: number
  tri: number
  dscr: number
  paybackPeriod: number
}

export class PDFExportService {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number = 210
  private pageHeight: number = 297
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
  }

  /**
   * Génère un PDF complet du business plan
   */
  async generateBusinessPlanPDF(
    projectId: string,
    options: PDFExportOptions = {
      includeFinancials: true,
      includeCharts: true,
      includeAppendices: true,
      template: 'banque',
      language: 'fr'
    }
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      // Récupérer les données du projet
      const projectData = await this.getProjectData(projectId)
      if (!projectData) {
        return { success: false, error: 'Impossible de récupérer les données du projet' }
      }

      // Récupérer les sections du business plan
      const sections = await aiTextGenerationService.getProjectSections(projectId)
      if (sections.length === 0) {
        return { success: false, error: 'Aucune section générée. Générez d\'abord le business plan.' }
      }

      // Initialiser le document PDF
      this.doc = new jsPDF('p', 'mm', 'a4')
      this.currentY = 20

      // Page de couverture
      await this.generateCoverPage(projectData, options.template)

      // Sommaire
      this.addNewPage()
      this.generateTableOfContents(sections)

      // Sections du business plan
      for (const section of sections) {
        this.addNewPage()
        await this.generateSection(section)
      }

      // Annexes financières
      if (options.includeFinancials) {
        this.addNewPage()
        await this.generateFinancialAppendix(projectData.financials)
      }

      // Graphiques
      if (options.includeCharts) {
        this.addNewPage()
        await this.generateChartsAppendix(projectId)
      }

      // Générer le blob PDF
      const pdfBlob = new Blob([this.doc.output('blob')], { type: 'application/pdf' })

      return { success: true, blob: pdfBlob }
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      return { success: false, error: 'Erreur lors de la génération du PDF' }
    }
  }

  /**
   * Génère la page de couverture
   */
  private async generateCoverPage(projectData: any, template: string) {
    const colors = {
      banque: { primary: '#1e40af', secondary: '#3b82f6' },
      investisseur: { primary: '#059669', secondary: '#10b981' },
      garantie: { primary: '#dc2626', secondary: '#ef4444' }
    }

    const color = colors[template as keyof typeof colors]

    // En-tête avec logo (simulé)
    this.doc.setFillColor(color.primary)
    this.doc.rect(0, 0, this.pageWidth, 40, 'F')

    // Titre principal
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('BUSINESS PLAN', this.pageWidth / 2, 25, { align: 'center' })

    // Nom du projet
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.currentY = 60
    this.doc.text(projectData.name.toUpperCase(), this.pageWidth / 2, this.currentY, { align: 'center' })

    // Secteur
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'normal')
    this.currentY += 15
    this.doc.text(`Secteur : ${projectData.sector}`, this.pageWidth / 2, this.currentY, { align: 'center' })

    // Encadré financier principal
    this.currentY += 30
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 60, 'F')
    this.doc.setDrawColor(color.primary)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 60, 'S')

    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(color.primary)
    this.currentY += 15
    this.doc.text('SYNTHÈSE FINANCIÈRE', this.pageWidth / 2, this.currentY, { align: 'center' })

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont('helvetica', 'normal')
    this.currentY += 12
    this.doc.text(`CA prévisionnel : ${this.formatCurrency(projectData.financials?.totalRevenue || 0)} XOF`, this.margin + 10, this.currentY)
    this.currentY += 8
    this.doc.text(`Résultat net : ${this.formatCurrency(projectData.financials?.totalProfit || 0)} XOF`, this.margin + 10, this.currentY)
    this.currentY += 8
    this.doc.text(`Investissement : ${this.formatCurrency(projectData.financials?.totalInvestment || 0)} XOF`, this.margin + 10, this.currentY)
    this.currentY += 8
    this.doc.text(`ROI : ${projectData.financials?.roi || 0}%`, this.margin + 10, this.currentY)

    // Financement demandé
    if (projectData.financials?.financingNeed > 0) {
      this.currentY += 20
      this.doc.setFillColor(color.primary)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F')
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.currentY += 13
      this.doc.text(
        `FINANCEMENT DEMANDÉ : ${this.formatCurrency(projectData.financials.financingNeed)} XOF`,
        this.pageWidth / 2,
        this.currentY,
        { align: 'center' }
      )
    }

    // Pied de page
    this.doc.setTextColor(100, 100, 100)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, this.pageWidth / 2, this.pageHeight - 15, { align: 'center' })
  }

  /**
   * Génère le sommaire
   */
  private generateTableOfContents(sections: any[]) {
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('SOMMAIRE', this.margin, this.currentY)

    this.currentY += 20
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')

    const tocItems = [
      'Résumé Exécutif',
      'Présentation du Projet',
      'Analyse du Marché',
      'Stratégie Commerciale',
      'Organisation et Management',
      'Analyse des Risques',
      'Conclusion et Financement',
      'Annexes Financières',
      'Graphiques et Tableaux'
    ]

    tocItems.forEach((item, index) => {
      this.doc.text(`${index + 1}. ${item}`, this.margin + 5, this.currentY)
      this.doc.text(`${index + 3}`, this.pageWidth - this.margin - 10, this.currentY)
      this.currentY += 8
    })
  }

  /**
   * Génère une section du business plan
   */
  private async generateSection(section: any) {
    // Titre de section
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(30, 64, 175) // Bleu
    this.doc.text(section.title, this.margin, this.currentY)

    this.currentY += 15

    // Contenu
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0)

    const content = section.content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Enlever le markdown bold
      .replace(/#{1,6}\s/g, '') // Enlever les titres markdown

    const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin)

    for (const line of lines) {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage()
      }
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += 6
    }
  }

  /**
   * Génère l'annexe financière
   */
  private async generateFinancialAppendix(financials: FinancialData) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('ANNEXES FINANCIÈRES', this.margin, this.currentY)

    this.currentY += 20

    // Tableau des indicateurs clés
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Indicateurs Financiers Clés', this.margin, this.currentY)

    this.currentY += 15

    const indicators = [
      ['Chiffre d\'affaires prévisionnel', this.formatCurrency(financials.totalRevenue), 'XOF'],
      ['Résultat net prévisionnel', this.formatCurrency(financials.totalProfit), 'XOF'],
      ['Marge nette', `${financials.profitMargin.toFixed(1)}`, '%'],
      ['Investissement total', this.formatCurrency(financials.totalInvestment), 'XOF'],
      ['Retour sur investissement (ROI)', `${financials.roi.toFixed(1)}`, '%'],
      ['Valeur Actuelle Nette (VAN)', this.formatCurrency(financials.van), 'XOF'],
      ['Taux de Rentabilité Interne (TRI)', `${financials.tri.toFixed(1)}`, '%'],
      ['Ratio de Couverture (DSCR)', `${financials.dscr.toFixed(1)}`, ''],
      ['Période de retour', `${financials.paybackPeriod.toFixed(1)}`, 'années']
    ]

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    // En-têtes du tableau
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Indicateur', this.margin, this.currentY)
    this.doc.text('Valeur', this.margin + 80, this.currentY)
    this.doc.text('Unité', this.margin + 130, this.currentY)

    this.currentY += 5
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 8

    // Lignes du tableau
    this.doc.setFont('helvetica', 'normal')
    indicators.forEach(([indicator, value, unit]) => {
      this.doc.text(indicator, this.margin, this.currentY)
      this.doc.text(value, this.margin + 80, this.currentY)
      this.doc.text(unit, this.margin + 130, this.currentY)
      this.currentY += 8
    })
  }

  /**
   * Génère l'annexe des graphiques
   */
  private async generateChartsAppendix(projectId: string) {
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('GRAPHIQUES ET TABLEAUX', this.margin, this.currentY)

    this.currentY += 20

    // Note explicative
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Les graphiques détaillés sont disponibles dans l\'application web.', this.margin, this.currentY)
    this.currentY += 10
    this.doc.text('Accédez à votre projet en ligne pour consulter :', this.margin, this.currentY)

    this.currentY += 15
    const chartList = [
      '• Évolution du chiffre d\'affaires mensuel',
      '• Répartition des charges par catégorie',
      '• Évolution de la trésorerie',
      '• Analyse de sensibilité',
      '• Ratios financiers sur 3 ans'
    ]

    chartList.forEach(item => {
      this.doc.text(item, this.margin + 5, this.currentY)
      this.currentY += 8
    })
  }

  /**
   * Ajoute une nouvelle page
   */
  private addNewPage() {
    this.doc.addPage()
    this.currentY = 20
    this.addPageNumber()
  }

  /**
   * Ajoute le numéro de page
   */
  private addPageNumber() {
    const pageCount = this.doc.getNumberOfPages()
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text(`Page ${pageCount}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
  }

  /**
   * Formate les montants en devises
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount)
  }

  /**
   * Récupère les données du projet
   */
  private async getProjectData(projectId: string): Promise<any | null> {
    try {
      // Récupérer les métriques via le service IA
      const metrics = await aiTextGenerationService.getProjectMetrics(projectId)
      if (!metrics) return null

      return {
        name: metrics.main_product,
        sector: metrics.sector,
        financials: {
          totalRevenue: metrics.total_revenue,
          totalProfit: metrics.total_profit,
          profitMargin: metrics.profit_margin,
          totalInvestment: metrics.investment_total,
          financingNeed: metrics.financing_need,
          roi: metrics.roi || 0,
          van: metrics.van || 0,
          tri: metrics.tri || 0,
          dscr: metrics.dscr || 0,
          paybackPeriod: 3.5 // Mock data
        }
      }
    } catch (error) {
      console.error('Erreur récupération données projet:', error)
      return null
    }
  }

  /**
   * Télécharge le PDF généré
   */
  static downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const pdfExportService = new PDFExportService()