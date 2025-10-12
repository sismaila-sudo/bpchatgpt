/**
 * Service d'export PDF pour les business plans
 * Génération de documents professionnels
 */

import { Project } from '@/types/project'
import { FinancialProjections } from '@/services/financialEngine'
import { BUSINESS_SECTOR_LABELS, SENEGAL_REGIONS } from '@/lib/constants'

// Types pour l'export PDF
export interface PDFExportOptions {
  includeCover: boolean
  includeExecutiveSummary: boolean
  includeFinancialProjections: boolean
  includeSWOTAnalysis: boolean
  includeMarketStudy: boolean
  includeAppendices: boolean
  watermark?: string
  customTemplate?: string
}

export interface BusinessPlanPDF {
  project: Project
  financialProjections?: FinancialProjections
  generatedAt: Date
  options: PDFExportOptions
}

export class PDFExportService {
  private static readonly COMPANY_NAME = 'BP Design Pro'
  private static readonly COMPANY_WEBSITE = 'www.bpdesignpro.sn'

  /**
   * Génère un PDF complet du business plan
   */
  static async generateBusinessPlanPDF(
    project: Project,
    financialProjections?: FinancialProjections,
    options: PDFExportOptions = {
      includeCover: true,
      includeExecutiveSummary: true,
      includeFinancialProjections: true,
      includeSWOTAnalysis: true,
      includeMarketStudy: true,
      includeAppendices: true
    }
  ): Promise<Blob> {
    const businessPlan: BusinessPlanPDF = {
      project,
      financialProjections,
      generatedAt: new Date(),
      options
    }

    // En production, utiliser une vraie librairie PDF comme jsPDF ou Puppeteer
    const htmlContent = this.generateHTMLContent(businessPlan)

    // Pour l'instant, on simule avec un HTML converti
    return this.convertHTMLToPDF(htmlContent)
  }

  /**
   * Génère le contenu HTML du business plan
   */
  private static generateHTMLContent(businessPlan: BusinessPlanPDF): string {
    const { project, financialProjections, options } = businessPlan

    let html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Plan - ${project.basicInfo.name}</title>
        <style>
          ${this.getDocumentStyles()}
        </style>
      </head>
      <body>
    `

    // Page de couverture
    if (options.includeCover) {
      html += this.generateCoverPage(businessPlan)
    }

    // Table des matières
    html += this.generateTableOfContents(options)

    // Résumé exécutif
    if (options.includeExecutiveSummary) {
      html += this.generateExecutiveSummary(project)
    }

    // Présentation du projet
    html += this.generateProjectPresentation(project)

    // Étude de marché
    if (options.includeMarketStudy && project.sections?.marketStudy) {
      html += this.generateMarketStudy(project)
    }

    // Analyse SWOT
    if (options.includeSWOTAnalysis && project.sections?.swotAnalysis) {
      html += this.generateSWOTAnalysis(project)
    }

    // Projections financières
    if (options.includeFinancialProjections && financialProjections) {
      html += this.generateFinancialProjections(financialProjections)
    }

    // Stratégie marketing
    if (project.businessPlan?.marketingPlan) {
      html += this.generateMarketingStrategy(project)
    }

    // Ressources humaines
    if (project.businessPlan?.humanResources) {
      html += this.generateHumanResources(project)
    }

    // Annexes
    if (options.includeAppendices) {
      html += this.generateAppendices(project)
    }

    html += `
        <div class="footer-final">
          <p>Document généré par ${this.COMPANY_NAME} - ${this.formatDate(businessPlan.generatedAt)}</p>
        </div>
      </body>
      </html>
    `

    return html
  }

  /**
   * Styles CSS pour le document PDF
   */
  private static getDocumentStyles(): string {
    return `
      @page {
        size: A4;
        margin: 2cm;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background: white;
      }

      .page-break {
        page-break-before: always;
      }

      .cover-page {
        text-align: center;
        padding: 4cm 2cm;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .cover-title {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 1cm;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      }

      .cover-subtitle {
        font-size: 24px;
        margin-bottom: 2cm;
        opacity: 0.9;
      }

      .cover-info {
        font-size: 16px;
        margin-top: auto;
      }

      .section {
        margin-bottom: 2cm;
      }

      .section-title {
        font-size: 24px;
        font-weight: bold;
        color: #2563eb;
        border-bottom: 3px solid #2563eb;
        padding-bottom: 0.5cm;
        margin-bottom: 1cm;
      }

      .subsection-title {
        font-size: 18px;
        font-weight: semibold;
        color: #1e40af;
        margin: 1cm 0 0.5cm 0;
      }

      .content-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1cm;
        margin: 0.5cm 0;
      }

      .highlight-box {
        background: #dbeafe;
        border-left: 4px solid #2563eb;
        padding: 0.5cm 1cm;
        margin: 0.5cm 0;
      }

      .financial-table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.5cm 0;
      }

      .financial-table th {
        background: #2563eb;
        color: white;
        padding: 0.3cm;
        text-align: left;
        font-weight: bold;
      }

      .financial-table td {
        padding: 0.3cm;
        border-bottom: 1px solid #e2e8f0;
      }

      .financial-table tr:nth-child(even) {
        background: #f8fafc;
      }

      .ratio-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1cm;
        margin: 0.5cm 0;
      }

      .ratio-card {
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.5cm;
        text-align: center;
      }

      .ratio-value {
        font-size: 24px;
        font-weight: bold;
        color: #059669;
        margin-bottom: 0.2cm;
      }

      .ratio-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
      }

      .swot-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5cm;
        margin: 0.5cm 0;
      }

      .swot-item {
        border: 2px solid;
        border-radius: 8px;
        padding: 0.5cm;
      }

      .swot-strengths {
        border-color: #059669;
        background: #f0fdf4;
      }

      .swot-weaknesses {
        border-color: #dc2626;
        background: #fef2f2;
      }

      .swot-opportunities {
        border-color: #2563eb;
        background: #eff6ff;
      }

      .swot-threats {
        border-color: #d97706;
        background: #fffbeb;
      }

      .footer {
        position: fixed;
        bottom: 1cm;
        left: 2cm;
        right: 2cm;
        text-align: center;
        font-size: 10px;
        color: #6b7280;
        border-top: 1px solid #e2e8f0;
        padding-top: 0.3cm;
      }

      .footer-final {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        margin-top: 2cm;
        padding-top: 1cm;
        border-top: 2px solid #e2e8f0;
      }

      .header {
        position: fixed;
        top: 1cm;
        left: 2cm;
        right: 2cm;
        text-align: right;
        font-size: 10px;
        color: #6b7280;
      }

      ul {
        padding-left: 1cm;
        margin: 0.5cm 0;
      }

      li {
        margin-bottom: 0.2cm;
      }

      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
      .text-lg { font-size: 18px; }
      .text-sm { font-size: 14px; }
      .mb-4 { margin-bottom: 0.5cm; }
      .mt-4 { margin-top: 0.5cm; }
    `
  }

  /**
   * Génère la page de couverture
   */
  private static generateCoverPage(businessPlan: BusinessPlanPDF): string {
    const { project } = businessPlan

    return `
      <div class="cover-page">
        <div class="cover-title">BUSINESS PLAN</div>
        <div class="cover-subtitle">${project.basicInfo.name}</div>

        <div class="content-box" style="background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3);">
          <h3 style="font-size: 20px; margin-bottom: 0.5cm;">Présentation du projet</h3>
          <p style="font-size: 16px; margin-bottom: 0.5cm;">${project.basicInfo.description}</p>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1cm; margin-top: 1cm;">
            <div>
              <strong>Secteur d'activité :</strong><br>
              ${BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}
            </div>
            <div>
              <strong>Localisation :</strong><br>
              ${project.basicInfo.location.city}, ${project.basicInfo.location.region}
            </div>
            <div>
              <strong>Type de projet :</strong><br>
              ${this.getProjectTypeLabel(project.basicInfo.projectType)}
            </div>
            <div>
              <strong>Durée prévisionnelle :</strong><br>
              ${project.basicInfo.timeline.duration} mois
            </div>
          </div>
        </div>

        <div class="cover-info">
          <p>Document généré le ${this.formatDate(businessPlan.generatedAt)}</p>
          <p>Par ${this.COMPANY_NAME} - ${this.COMPANY_WEBSITE}</p>
        </div>
      </div>
      <div class="page-break"></div>
    `
  }

  /**
   * Génère la table des matières
   */
  private static generateTableOfContents(options: PDFExportOptions): string {
    let toc = `
      <div class="section">
        <h1 class="section-title">TABLE DES MATIÈRES</h1>
        <ul style="list-style: none; padding: 0;">
    `

    let pageNumber = 3 // Après couverture et table des matières

    if (options.includeExecutiveSummary) {
      toc += `<li style="margin-bottom: 0.3cm;"><span class="font-bold">1. Résumé exécutif</span> <span style="float: right;">${pageNumber}</span></li>`
      pageNumber++
    }

    toc += `<li style="margin-bottom: 0.3cm;"><span class="font-bold">2. Présentation du projet</span> <span style="float: right;">${pageNumber}</span></li>`
    pageNumber++

    if (options.includeMarketStudy) {
      toc += `<li style="margin-bottom: 0.3cm;"><span class="font-bold">3. Étude de marché</span> <span style="float: right;">${pageNumber}</span></li>`
      pageNumber++
    }

    if (options.includeSWOTAnalysis) {
      toc += `<li style="margin-bottom: 0.3cm;"><span class="font-bold">4. Analyse SWOT</span> <span style="float: right;">${pageNumber}</span></li>`
      pageNumber++
    }

    if (options.includeFinancialProjections) {
      toc += `<li style="margin-bottom: 0.3cm;"><span class="font-bold">5. Projections financières</span> <span style="float: right;">${pageNumber}</span></li>`
      pageNumber += 2
    }

    toc += `
          <li style="margin-bottom: 0.3cm;"><span class="font-bold">6. Stratégie marketing</span> <span style="float: right;">${pageNumber}</span></li>
          <li style="margin-bottom: 0.3cm;"><span class="font-bold">7. Ressources humaines</span> <span style="float: right;">${pageNumber + 1}</span></li>
        </ul>
      </div>
      <div class="page-break"></div>
    `

    return toc
  }

  /**
   * Génère le résumé exécutif
   */
  private static generateExecutiveSummary(project: Project): string {
    return `
      <div class="section">
        <h1 class="section-title">1. RÉSUMÉ EXÉCUTIF</h1>

        <div class="highlight-box">
          <h3 class="subsection-title">Vision du projet</h3>
          <p>${project.basicInfo.description}</p>
        </div>

        <div class="content-box">
          <h3 class="subsection-title">Informations clés</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1cm;">
            <div>
              <strong>Secteur :</strong> ${BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}<br>
              <strong>Type :</strong> ${this.getProjectTypeLabel(project.basicInfo.projectType)}<br>
              <strong>Taille :</strong> ${this.getCompanySizeLabel(project.basicInfo.companySize)}
            </div>
            <div>
              <strong>Région :</strong> ${project.basicInfo.location.region}<br>
              <strong>Ville :</strong> ${project.basicInfo.location.city}<br>
              <strong>Durée :</strong> ${project.basicInfo.timeline.duration} mois
            </div>
          </div>
        </div>

        <h3 class="subsection-title">Opportunité de marché</h3>
        <p>
          Le marché sénégalais dans le secteur ${BUSINESS_SECTOR_LABELS[project.basicInfo.sector].toLowerCase()}
          présente des opportunités significatives de croissance. Ce projet s'inscrit dans une démarche
          d'innovation et de création de valeur adaptée aux besoins locaux.
        </p>

        <h3 class="subsection-title">Avantages concurrentiels</h3>
        <ul>
          <li>Adaptation aux spécificités du marché sénégalais</li>
          <li>Équipe expérimentée et motivée</li>
          <li>Stratégie de développement progressive</li>
          <li>Positionnement différenciant sur le marché</li>
        </ul>
      </div>
      <div class="page-break"></div>
    `
  }

  /**
   * Génère la présentation du projet
   */
  private static generateProjectPresentation(project: Project): string {
    return `
      <div class="section">
        <h1 class="section-title">2. PRÉSENTATION DU PROJET</h1>

        <h3 class="subsection-title">Description détaillée</h3>
        <div class="content-box">
          <p>${project.basicInfo.description}</p>
        </div>

        <h3 class="subsection-title">Caractéristiques du projet</h3>
        <table class="financial-table">
          <tr>
            <td><strong>Secteur d'activité</strong></td>
            <td>${BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}</td>
          </tr>
          <tr>
            <td><strong>Type de projet</strong></td>
            <td>${this.getProjectTypeLabel(project.basicInfo.projectType)}</td>
          </tr>
          <tr>
            <td><strong>Taille envisagée</strong></td>
            <td>${this.getCompanySizeLabel(project.basicInfo.companySize)}</td>
          </tr>
          <tr>
            <td><strong>Localisation</strong></td>
            <td>${project.basicInfo.location.city}, ${project.basicInfo.location.region}</td>
          </tr>
          <tr>
            <td><strong>Date de démarrage prévue</strong></td>
            <td>${this.formatDate(project.basicInfo.timeline.startDate)}</td>
          </tr>
          <tr>
            <td><strong>Durée de mise en œuvre</strong></td>
            <td>${project.basicInfo.timeline.duration} mois</td>
          </tr>
        </table>

        <h3 class="subsection-title">Objectifs stratégiques</h3>
        <div class="highlight-box">
          <ul>
            <li>Créer une entreprise viable et pérenne</li>
            <li>Répondre aux besoins identifiés du marché</li>
            <li>Générer une rentabilité attractive</li>
            <li>Contribuer au développement économique local</li>
          </ul>
        </div>
      </div>
      <div class="page-break"></div>
    `
  }

  /**
   * Génère l'analyse SWOT
   */
  private static generateSWOTAnalysis(project: Project): string {
    const swot = project.sections?.swotAnalysis

    return `
      <div class="section">
        <h1 class="section-title">4. ANALYSE SWOT</h1>

        <p class="mb-4">
          L'analyse SWOT permet d'identifier les Forces, Faiblesses, Opportunités et Menaces
          du projet dans son environnement.
        </p>

        <div class="swot-grid">
          <div class="swot-item swot-strengths">
            <h4 class="font-bold mb-4" style="color: #059669;">FORCES</h4>
            <ul>
              ${swot?.strengths?.map(item => `<li>${item}</li>`).join('') || '<li>À définir lors de l\'analyse détaillée</li>'}
            </ul>
          </div>

          <div class="swot-item swot-weaknesses">
            <h4 class="font-bold mb-4" style="color: #dc2626;">FAIBLESSES</h4>
            <ul>
              ${swot?.weaknesses?.map(item => `<li>${item}</li>`).join('') || '<li>À définir lors de l\'analyse détaillée</li>'}
            </ul>
          </div>

          <div class="swot-item swot-opportunities">
            <h4 class="font-bold mb-4" style="color: #2563eb;">OPPORTUNITÉS</h4>
            <ul>
              ${swot?.opportunities?.map(item => `<li>${item}</li>`).join('') || '<li>À définir lors de l\'analyse détaillée</li>'}
            </ul>
          </div>

          <div class="swot-item swot-threats">
            <h4 class="font-bold mb-4" style="color: #d97706;">MENACES</h4>
            <ul>
              ${swot?.threats?.map(item => `<li>${item}</li>`).join('') || '<li>À définir lors de l\'analyse détaillée</li>'}
            </ul>
          </div>
        </div>

        <div class="highlight-box mt-4">
          <h4 class="font-bold mb-4">Synthèse stratégique</h4>
          <p>
            Cette analyse SWOT guide les décisions stratégiques en capitalisant sur les forces,
            corrigeant les faiblesses, saisissant les opportunités et atténuant les menaces.
          </p>
        </div>
      </div>
      <div class="page-break"></div>
    `
  }

  /**
   * Génère les projections financières
   */
  private static generateFinancialProjections(projections: FinancialProjections): string {
    return `
      <div class="section">
        <h1 class="section-title">5. PROJECTIONS FINANCIÈRES</h1>

        <h3 class="subsection-title">Compte de résultat prévisionnel</h3>
        <table class="financial-table">
          <thead>
            <tr>
              <th>Éléments</th>
              ${projections.years.map(year => `<th>${year}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Chiffre d'affaires</strong></td>
              ${projections.revenues.map(rev => `<td>${this.formatCurrency(rev)}</td>`).join('')}
            </tr>
            <tr>
              <td>Coûts totaux</td>
              ${projections.totalCosts.map(cost => `<td>${this.formatCurrency(cost)}</td>`).join('')}
            </tr>
            <tr>
              <td>Bénéfice brut</td>
              ${projections.grossProfit.map(profit => `<td>${this.formatCurrency(profit)}</td>`).join('')}
            </tr>
            <tr style="background: #dbeafe;">
              <td><strong>Bénéfice net</strong></td>
              ${projections.netProfit.map(profit => `<td><strong>${this.formatCurrency(profit)}</strong></td>`).join('')}
            </tr>
          </tbody>
        </table>

        <h3 class="subsection-title">Indicateurs de rentabilité</h3>
        <div class="ratio-grid">
          <div class="ratio-card">
            <div class="ratio-value">${projections.breakEvenPoint > 0 ? Math.round(projections.breakEvenPoint) : 'N/A'}</div>
            <div class="ratio-label">Point mort (mois)</div>
          </div>
          <div class="ratio-card">
            <div class="ratio-value">${projections.paybackPeriod > 0 ? projections.paybackPeriod : 'N/A'}</div>
            <div class="ratio-label">Retour investissement (années)</div>
          </div>
          <div class="ratio-card">
            <div class="ratio-value">${projections.irr.toFixed(1)}%</div>
            <div class="ratio-label">TRI</div>
          </div>
          <div class="ratio-card">
            <div class="ratio-value">${this.formatCurrency(projections.npv)}</div>
            <div class="ratio-label">VAN</div>
          </div>
        </div>

        <h3 class="subsection-title">Flux de trésorerie</h3>
        <table class="financial-table">
          <thead>
            <tr>
              <th>Flux</th>
              ${projections.years.map(year => `<th>${year}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Flux opérationnel</td>
              ${projections.operatingCashFlow.map(flow => `<td>${this.formatCurrency(flow)}</td>`).join('')}
            </tr>
            <tr>
              <td>Flux d'investissement</td>
              ${projections.investmentCashFlow.map(flow => `<td>${this.formatCurrency(flow)}</td>`).join('')}
            </tr>
            <tr>
              <td>Flux de financement</td>
              ${projections.financingCashFlow.map(flow => `<td>${this.formatCurrency(flow)}</td>`).join('')}
            </tr>
            <tr style="background: #f0fdf4;">
              <td><strong>Flux net cumulé</strong></td>
              ${projections.cumulativeCashFlow.map(flow => `<td><strong>${this.formatCurrency(flow)}</strong></td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
      <div class="page-break"></div>
    `
  }

  /**
   * Génère les sections restantes (simplifié)
   */
  private static generateMarketStudy(project: Project): string {
    return `
      <div class="section">
        <h1 class="section-title">3. ÉTUDE DE MARCHÉ</h1>
        <div class="content-box">
          <p>Section en cours de développement dans l'interface.</p>
        </div>
      </div>
      <div class="page-break"></div>
    `
  }

  private static generateMarketingStrategy(project: Project): string {
    return `
      <div class="section">
        <h1 class="section-title">6. STRATÉGIE MARKETING</h1>
        <div class="content-box">
          <p>Section en cours de développement dans l'interface.</p>
        </div>
      </div>
      <div class="page-break"></div>
    `
  }

  private static generateHumanResources(project: Project): string {
    return `
      <div class="section">
        <h1 class="section-title">7. RESSOURCES HUMAINES</h1>
        <div class="content-box">
          <p>Section en cours de développement dans l'interface.</p>
        </div>
      </div>
      <div class="page-break"></div>
    `
  }

  private static generateAppendices(project: Project): string {
    return `
      <div class="section">
        <h1 class="section-title">ANNEXES</h1>
        <div class="content-box">
          <h3>Documents de référence</h3>
          <ul>
            <li>Statuts de l'entreprise (si applicable)</li>
            <li>Études de marché complémentaires</li>
            <li>CV des dirigeants</li>
            <li>Lettres d'intention des partenaires</li>
          </ul>
        </div>
      </div>
    `
  }

  /**
   * Convertit le HTML en PDF (simulation)
   */
  private static async convertHTMLToPDF(htmlContent: string): Promise<Blob> {
    // En production, utiliser Puppeteer, jsPDF, ou une API de conversion
    // Pour l'instant, on retourne le HTML comme blob
    return new Blob([htmlContent], { type: 'text/html' })
  }

  /**
   * Fonctions utilitaires
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  private static getProjectTypeLabel(type: string): string {
    const labels = {
      'creation': 'Création d\'entreprise',
      'expansion': 'Extension d\'activité',
      'diversification': 'Diversification',
      'reprise': 'Reprise d\'entreprise'
    }
    return labels[type as keyof typeof labels] || type
  }

  private static getCompanySizeLabel(size: string): string {
    const labels = {
      'micro': 'Micro-entreprise (< 5 employés)',
      'small': 'Petite entreprise (5-20 employés)',
      'medium': 'Moyenne entreprise (20-100 employés)',
      'large': 'Grande entreprise (> 100 employés)'
    }
    return labels[size as keyof typeof labels] || size
  }
}