/**
 * Service d'export PDF pour les analyses de crédit
 * Génère des notes de crédit professionnelles au format PDF
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ProjectAnalysis } from '@/types/analysis'

export class AnalysisExportService {
  private static readonly PRIMARY_COLOR: [number, number, number] = [30, 58, 138] // RGB Bleu FONGIP
  private static readonly SECONDARY_COLOR: [number, number, number] = [16, 185, 129] // RGB Vert
  private static readonly TEXT_COLOR: [number, number, number] = [51, 51, 51] // RGB Gris foncé
  private static readonly LIGHT_BG: [number, number, number] = [248, 250, 252] // RGB Fond clair

  /**
   * Génère le PDF complet de la note de crédit
   */
  static generateCreditNotePDF(analysis: ProjectAnalysis): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    let currentY = 20

    // 1. En-tête et page de couverture
    currentY = this.addCoverSection(doc, analysis, currentY)

    // 2. Résumé & Décision
    doc.addPage()
    currentY = 20
    currentY = this.addDecisionSummary(doc, analysis, currentY)

    // 3. Facilités demandées
    if (analysis.aiAnalysis?.requestedFacilities && analysis.aiAnalysis?.requestedFacilities.length > 0) {
      currentY = this.addRequestedFacilities(doc, analysis, currentY)
    }

    // 4. Sources & Emplois
    doc.addPage()
    currentY = 20
    currentY = this.addSourcesEmplois(doc, analysis, currentY)

    // 5. Ratios financiers
    currentY = this.addFinancialRatios(doc, analysis, currentY)

    // 6. Projections
    if (analysis.aiAnalysis?.projections && analysis.aiAnalysis?.projections.length > 0) {
      doc.addPage()
      currentY = 20
      currentY = this.addProjections(doc, analysis, currentY)
    }

    // 7. Risques & Mitigations
    if (analysis.aiAnalysis?.risks && analysis.aiAnalysis?.risks.length > 0) {
      doc.addPage()
      currentY = 20
      currentY = this.addRisksAnalysis(doc, analysis, currentY)
    }

    // 8. Note de crédit complète
    if (analysis.aiAnalysis?.noteDeCredit) {
      doc.addPage()
      currentY = 20
      this.addCreditNote(doc, analysis, currentY)
    }

    // Footer sur toutes les pages
    const pageCount = doc.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      this.addFooter(doc, i, pageCount, analysis)
    }

    // Télécharger le PDF
    const filename = `note-credit-${this.sanitizeFilename(analysis.projectName)}.pdf`
    doc.save(filename)
  }

  /**
   * Page de couverture
   */
  private static addCoverSection(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    // Rectangle bleu en haut
    doc.setFillColor(...this.PRIMARY_COLOR)
    doc.rect(0, 0, 210, 60, 'F')

    // Titre
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTE DE CRÉDIT', 105, 30, { align: 'center' })

    // Sous-titre
    doc.setFontSize(18)
    doc.setFont('helvetica', 'normal')
    doc.text('Analyse Financière Professionnelle', 105, 45, { align: 'center' })

    y = 80

    // Nom du projet
    doc.setTextColor(...this.TEXT_COLOR)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    const projectNameLines = doc.splitTextToSize(analysis.projectName, 170)
    doc.text(projectNameLines, 105, y, { align: 'center' })
    y += projectNameLines.length * 10 + 15

    // Informations clés
    doc.setFillColor(...this.LIGHT_BG)
    doc.rect(20, y, 170, 60, 'F')

    y += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    const infoData = [
      ['Date d\'analyse', new Date(analysis.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Documents analysés', `${analysis.uploadedDocuments.length} document(s)`],
      ['Statut', this.getStatusLabel(analysis.status)]
    ]

    infoData.forEach((row) => {
      doc.setFont('helvetica', 'bold')
      doc.text(row[0] + ' :', 30, y)
      doc.setFont('helvetica', 'normal')
      doc.text(row[1], 80, y)
      y += 10
    })

    y += 20

    // Décision badge
    const decision = analysis.aiAnalysis?.decision || 'pending'
    let decisionColor: [number, number, number]
    let decisionText: string

    switch (decision) {
      case 'approve':
        decisionColor = [16, 185, 129] // Vert
        decisionText = 'APPROUVÉ'
        break
      case 'conditional':
        decisionColor = [251, 191, 36] // Orange
        decisionText = 'CONDITIONNEL'
        break
      case 'decline':
        decisionColor = [239, 68, 68] // Rouge
        decisionText = 'REFUSÉ'
        break
      default:
        decisionColor = [156, 163, 175] // Gris
        decisionText = 'EN COURS'
    }

    doc.setFillColor(...decisionColor)
    doc.roundedRect(60, y, 90, 15, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(decisionText, 105, y + 10, { align: 'center' })

    y += 30

    // Footer de la page de couverture
    doc.setTextColor(...this.TEXT_COLOR)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Document confidentiel - Usage interne uniquement', 105, 280, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.text('Généré par BP Design Pro', 105, 287, { align: 'center' })

    return y
  }

  /**
   * Résumé et décision
   */
  private static addDecisionSummary(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    // Titre de section
    y = this.addSectionTitle(doc, 'RÉSUMÉ & AVIS', y)

    // Badge décision
    const decision = analysis.aiAnalysis?.decision || 'pending'
    const decisionLabels: Record<string, { text: string; color: [number, number, number] }> = {
      approve: { text: 'APPROUVÉ', color: [16, 185, 129] },
      conditional: { text: 'CONDITIONNEL', color: [251, 191, 36] },
      decline: { text: 'REFUSÉ', color: [239, 68, 68] }
    }

    const decisionInfo = decisionLabels[decision]

    if (decisionInfo) {
      doc.setFillColor(...decisionInfo.color)
      doc.roundedRect(20, y, 50, 12, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(decisionInfo.text, 45, y + 8, { align: 'center' })
      y += 20
    }

    // Raisons
    doc.setTextColor(...this.TEXT_COLOR)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Avis Global :', 20, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    if (analysis.aiAnalysis?.reasons && analysis.aiAnalysis?.reasons.length > 0) {
      analysis.aiAnalysis?.reasons.forEach((reason, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${reason}`, 170)
        doc.text(lines, 25, y)
        y += lines.length * 6 + 3
      })
    } else {
      doc.setFont('helvetica', 'italic')
      doc.text('Aucune raison spécifique fournie.', 25, y)
      y += 8
    }

    y += 10

    // Métriques clés
    if (analysis.aiAnalysis?.tri !== undefined || analysis.aiAnalysis?.van !== undefined || analysis.aiAnalysis?.payback) {
      doc.setFillColor(...this.LIGHT_BG)
      doc.rect(20, y, 170, 35, 'F')

      y += 8
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('INDICATEURS CLÉS', 105, y, { align: 'center' })
      y += 8

      const metrics: string[] = []
      if (analysis.aiAnalysis?.tri !== undefined) {
        metrics.push(`TRI: ${analysis.aiAnalysis?.tri.toFixed(1)}%`)
      }
      if (analysis.aiAnalysis?.van !== undefined) {
        metrics.push(`VAN: ${this.formatCurrency(analysis.aiAnalysis?.van)}`)
      }
      if (analysis.aiAnalysis?.payback) {
        metrics.push(`Payback: ${analysis.aiAnalysis?.payback}`)
      }

      const metricsPerRow = 3
      const colWidth = 170 / metricsPerRow
      metrics.forEach((metric, index) => {
        const col = index % metricsPerRow
        const row = Math.floor(index / metricsPerRow)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(metric, 20 + col * colWidth + colWidth / 2, y + row * 8, { align: 'center' })
      })

      y += Math.ceil(metrics.length / metricsPerRow) * 8 + 10
    }

    return y + 5
  }

  /**
   * Facilités demandées
   */
  private static addRequestedFacilities(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('FACILITÉS DE CRÉDIT DEMANDÉES', 20, y)
    y += 8

    const facilities = analysis.aiAnalysis?.requestedFacilities || []

    facilities.forEach((facility, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFillColor(...this.LIGHT_BG)
      doc.rect(20, y, 170, 30, 'F')

      y += 7
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${facility.type}`, 25, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Montant: ${this.formatCurrency(facility.montant)}`, 30, y)
      doc.text(`Taux: ${facility.taux}%`, 100, y)
      y += 5
      doc.text(`Durée: ${facility.tenor} mois`, 30, y)
      if (facility.differe) {
        doc.text(`Différé: ${facility.differe} mois`, 100, y)
      }
      y += 12
    })

    return y + 5
  }

  /**
   * Sources & Emplois
   */
  private static addSourcesEmplois(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    y = this.addSectionTitle(doc, 'SOURCES & EMPLOIS', y)

    const sourcesEmplois = analysis.aiAnalysis?.sourcesEmplois

    if (!sourcesEmplois) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('Données non disponibles', 20, y)
      return y + 10
    }

    // Tableau Sources
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('SOURCES DE FINANCEMENT', 20, y)
    y += 5

    const sourcesData = (sourcesEmplois.sources || []).map(s => [
      s.description || '',
      this.formatCurrency(s.montant || 0)
    ])

    sourcesData.push(['TOTAL SOURCES', this.formatCurrency(sourcesEmplois.totalSources || 0)])

    autoTable(doc, {
      startY: y,
      head: [['Description', 'Montant (FCFA)']],
      body: sourcesData,
      theme: 'grid',
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    })

    y = (doc as any).lastAutoTable.finalY + 10

    // Tableau Emplois
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('EMPLOIS', 20, y)
    y += 5

    const emploisData = (sourcesEmplois.emplois || []).map(e => [
      e.description || '',
      this.formatCurrency(e.montant || 0)
    ])

    emploisData.push(['TOTAL EMPLOIS', this.formatCurrency(sourcesEmplois.totalEmplois || 0)])

    autoTable(doc, {
      startY: y,
      head: [['Description', 'Montant (FCFA)']],
      body: emploisData,
      theme: 'grid',
      headStyles: {
        fillColor: this.SECONDARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    })

    y = (doc as any).lastAutoTable.finalY + 10

    // Équilibre
    const balance = (sourcesEmplois.totalSources || 0) - (sourcesEmplois.totalEmplois || 0)
    const isBalanced = Math.abs(balance) < 1000

    doc.setFillColor(isBalanced ? 220 : 254, isBalanced ? 252 : 226, isBalanced ? 231 : 226)
    doc.rect(20, y, 170, 12, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(isBalanced ? 22 : 124, isBalanced ? 163 : 58, isBalanced ? 74 : 23)
    doc.text(
      isBalanced ? '✓ ÉQUILIBRE FINANCIER RESPECTÉ' : '⚠ DÉSÉQUILIBRE FINANCIER',
      105,
      y + 8,
      { align: 'center' }
    )

    return y + 20
  }

  /**
   * Ratios financiers
   */
  private static addFinancialRatios(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    if (y > 220) {
      doc.addPage()
      y = 20
    }

    y = this.addSectionTitle(doc, 'RATIOS FINANCIERS', y)

    const ratios = analysis.aiAnalysis?.ratios

    if (!ratios) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('Données non disponibles', 20, y)
      return y + 10
    }

    // DSCR (Debt Service Coverage Ratio)
    if (ratios.dscr && Object.keys(ratios.dscr).length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('DSCR (Debt Service Coverage Ratio)', 20, y)
      y += 5

      const dcsrData = Object.entries(ratios.dscr).map(([year, value]) => [
        year,
        typeof value === 'number' ? `${value.toFixed(2)}x` : 'N/A'
      ])

      autoTable(doc, {
        startY: y,
        head: [['Année', 'DSCR']],
        body: dcsrData,
        theme: 'grid',
        headStyles: {
          fillColor: this.PRIMARY_COLOR,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 85, halign: 'center' },
          1: { cellWidth: 85, halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    // Autres ratios
    const otherRatios: Array<[string, string]> = []

    if (ratios.autonomieFinanciere !== undefined) {
      otherRatios.push(['Autonomie Financière', `${this.formatNumber(ratios.autonomieFinanciere, 1)}%`])
    }
    if (ratios.liquiditeGenerale !== undefined) {
      otherRatios.push(['Liquidité Générale', this.formatNumber(ratios.liquiditeGenerale, 2)])
    }
    if (ratios.fondsRoulement !== undefined) {
      otherRatios.push(['Fonds de Roulement', this.formatCurrency(ratios.fondsRoulement)])
    }

    if (otherRatios.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Ratio', 'Valeur']],
        body: otherRatios,
        theme: 'grid',
        headStyles: {
          fillColor: this.SECONDARY_COLOR,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 110 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      })

      y = (doc as any).lastAutoTable.finalY + 10
    }

    return y
  }

  /**
   * Projections financières
   */
  private static addProjections(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    y = this.addSectionTitle(doc, 'PROJECTIONS FINANCIÈRES', y)

    const projections = analysis.aiAnalysis?.projections || []

    if (projections.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('Données non disponibles', 20, y)
      return y + 10
    }

    const tableData = projections.map(proj => {
      const row: any[] = [proj.year.toString()]

      if (proj.ca !== undefined) row.push(this.formatCurrency(proj.ca))
      if (proj.ebe !== undefined) row.push(this.formatCurrency(proj.ebe))
      if (proj.caf !== undefined) row.push(this.formatCurrency(proj.caf))
      if (proj.dscr !== undefined) row.push(`${this.formatNumber(proj.dscr, 1)}x`)

      return row
    })

    const headers: string[] = ['Année']
    if (projections[0].ca !== undefined) headers.push('CA')
    if (projections[0].ebe !== undefined) headers.push('EBE')
    if (projections[0].caf !== undefined) headers.push('CAF')
    if (projections[0].dscr !== undefined) headers.push('DSCR')

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 10
  }

  /**
   * Risques & Mitigations
   */
  private static addRisksAnalysis(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    y = this.addSectionTitle(doc, 'RISQUES & MITIGATIONS', y)

    const risks = analysis.aiAnalysis?.risks || []

    if (risks.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('Aucun risque identifié', 20, y)
      return y + 10
    }

    risks.forEach((risk, index) => {
      if (y > 240) {
        doc.addPage()
        y = 20
      }

      // Couleur selon sévérité
      let severityColor: [number, number, number]
      switch (risk.severity) {
        case 'high':
          severityColor = [239, 68, 68] // Rouge
          break
        case 'medium':
          severityColor = [251, 191, 36] // Orange
          break
        case 'low':
          severityColor = [16, 185, 129] // Vert
          break
        default:
          severityColor = [156, 163, 175] // Gris
      }

      // Badge sévérité
      doc.setFillColor(...severityColor)
      doc.roundedRect(20, y, 30, 7, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      const severityLabel = risk.severity === 'high' ? 'ÉLEVÉ' : risk.severity === 'medium' ? 'MOYEN' : 'FAIBLE'
      doc.text(severityLabel, 35, y + 5, { align: 'center' })

      // Type de risque
      doc.setTextColor(...this.TEXT_COLOR)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(risk.type || 'Risque', 55, y + 5)

      y += 10

      // Description
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(risk.description || '', 165)
      doc.text(descLines, 25, y)
      y += descLines.length * 5 + 3

      // Mitigation
      if (risk.mitigation) {
        doc.setFont('helvetica', 'bold')
        doc.text('Mitigation :', 25, y)
        doc.setFont('helvetica', 'normal')
        y += 5
        const mitigationLines = doc.splitTextToSize(risk.mitigation, 160)
        doc.text(mitigationLines, 30, y)
        y += mitigationLines.length * 5 + 5
      }

      y += 5
    })

    return y
  }

  /**
   * Note de crédit complète
   */
  private static addCreditNote(doc: jsPDF, analysis: ProjectAnalysis, startY: number): number {
    let y = startY

    y = this.addSectionTitle(doc, 'NOTE DE CRÉDIT COMPLÈTE', y)

    const noteDeCredit = analysis.aiAnalysis?.noteDeCredit || ''

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    // Découper en paragraphes
    const paragraphs = noteDeCredit.split('\n\n')

    paragraphs.forEach(paragraph => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      const lines = doc.splitTextToSize(paragraph.trim(), 170)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 5
    })

    return y
  }

  /**
   * Titre de section
   */
  private static addSectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFillColor(...this.PRIMARY_COLOR)
    doc.rect(20, y, 170, 10, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 105, y + 7, { align: 'center' })

    doc.setTextColor(...this.TEXT_COLOR)

    return y + 15
  }

  /**
   * Footer
   */
  private static addFooter(doc: jsPDF, pageNum: number, totalPages: number, analysis: ProjectAnalysis): void {
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 282, 190, 282)

    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    doc.text(`Note de crédit - ${analysis.projectName}`, 20, 287)
    doc.text(`Page ${pageNum} / ${totalPages}`, 190, 287, { align: 'right' })

    doc.setFont('helvetica', 'italic')
    doc.text('Généré par BP Design Pro', 105, 287, { align: 'center' })
  }

  /**
   * Utilitaires
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA'
  }

  private static formatNumber(value: any, decimals: number = 1): string {
    if (value === undefined || value === null) return 'N/A'
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numValue)) return 'N/A'
    return numValue.toFixed(decimals)
  }

  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Terminée',
      failed: 'Échouée'
    }
    return labels[status] || status
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
