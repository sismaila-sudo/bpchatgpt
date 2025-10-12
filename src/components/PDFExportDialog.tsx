'use client'

import { useState } from 'react'
import { Project } from '@/types/project'
import { FinancialProjections } from '@/services/financialEngine'
import { PDFExportService, PDFExportOptions } from '@/services/pdfExportService'
import {
  DocumentArrowDownIcon,
  XMarkIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface PDFExportDialogProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  financialProjections?: FinancialProjections
}

export default function PDFExportDialog({
  isOpen,
  onClose,
  project,
  financialProjections
}: PDFExportDialogProps) {
  const [options, setOptions] = useState<PDFExportOptions>({
    includeCover: true,
    includeExecutiveSummary: true,
    includeFinancialProjections: true,
    includeSWOTAnalysis: true,
    includeMarketStudy: true,
    includeAppendices: true
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportStep, setExportStep] = useState<string>('')

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Étapes de génération
      setExportStep('Préparation des données...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      setExportStep('Génération du contenu...')
      await new Promise(resolve => setTimeout(resolve, 1500))

      setExportStep('Mise en forme PDF...')
      const pdfBlob = await PDFExportService.generateBusinessPlanPDF(
        project,
        financialProjections,
        options
      )

      setExportStep('Finalisation...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Téléchargement du fichier
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `business-plan-${project.basicInfo.name.replace(/\s+/g, '-').toLowerCase()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onClose()
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
    } finally {
      setIsExporting(false)
      setExportStep('')
    }
  }

  const updateOption = (key: keyof PDFExportOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Export Business Plan PDF
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Informations du projet */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Projet à exporter</h3>
            <div className="text-blue-800 text-sm">
              <p><strong>Nom :</strong> {project.basicInfo.name}</p>
              <p><strong>Secteur :</strong> {project.basicInfo.sector}</p>
              <p><strong>Localisation :</strong> {project.basicInfo.location.city}, {project.basicInfo.location.region}</p>
            </div>
          </div>

          {/* Options d'export */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Cog6ToothIcon className="h-5 w-5 text-gray-600 mr-2" />
              Options d'export
            </h3>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeCover}
                  onChange={(e) => updateOption('includeCover', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900">Page de couverture</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeExecutiveSummary}
                  onChange={(e) => updateOption('includeExecutiveSummary', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900">Résumé exécutif</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeFinancialProjections}
                  onChange={(e) => updateOption('includeFinancialProjections', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900">Projections financières</span>
                {!financialProjections && (
                  <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    Données manquantes
                  </span>
                )}
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeSWOTAnalysis}
                  onChange={(e) => updateOption('includeSWOTAnalysis', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <ShieldCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900">Analyse SWOT</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeMarketStudy}
                  onChange={(e) => updateOption('includeMarketStudy', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900">Étude de marché</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeAppendices}
                  onChange={(e) => updateOption('includeAppendices', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900">Annexes</span>
              </label>
            </div>
          </div>

          {/* Aperçu du contenu */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Aperçu du document</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Pages estimées :</span>
                <span className="font-medium">
                  {Object.values(options).filter(Boolean).length * 2 + 2} pages
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sections incluses :</span>
                <span className="font-medium">
                  {Object.values(options).filter(Boolean).length} sections
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Format :</span>
                <span className="font-medium">PDF A4</span>
              </div>
            </div>
          </div>

          {/* État de l'export */}
          {isExporting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">{exportStep}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                     style={{
                       width: exportStep.includes('Préparation') ? '25%' :
                              exportStep.includes('Génération') ? '50%' :
                              exportStep.includes('Mise en forme') ? '75%' :
                              exportStep.includes('Finalisation') ? '100%' : '0%'
                     }}
                ></div>
              </div>
            </div>
          )}

          {/* Note d'information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <DocumentTextIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="text-yellow-800 text-sm">
                <p className="font-medium mb-1">Note importante</p>
                <p>
                  Cette version génère un document HTML stylisé. Pour un vrai PDF professionnel,
                  l'intégration avec des services comme Puppeteer ou jsPDF sera implémentée dans
                  les prochaines versions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Export en cours...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exporter le PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}