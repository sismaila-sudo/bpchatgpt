'use client'

/**
 * 🎨 DIALOG D'EXPORT PDF PROFESSIONNEL
 * Sélection granulaire des sections + Templates prédéfinis
 */

import React, { useState, useEffect } from 'react'
import {
  XMarkIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  DocumentTextIcon,
  BanknotesIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline'
import {
  PDFSection,
  PDFExportOptions,
  EXPORT_TEMPLATES,
  CompletePDFExportService
} from '@/services/completePDFExportService'

interface ExportPDFDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onExport: (options: PDFExportOptions) => Promise<void>
}

export default function ExportPDFDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  onExport
}: ExportPDFDialogProps) {
  const [sections, setSections] = useState<PDFSection[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<'fongip' | 'banque' | 'pitch' | 'complet' | 'custom'>('complet')

  const [options, setOptions] = useState<PDFExportOptions>({
    ...EXPORT_TEMPLATES.complet,
    template: 'complet',
    pageNumbers: true,
    colorScheme: 'blue'
  } as PDFExportOptions)

  // Charger les sections disponibles
  useEffect(() => {
    if (isOpen && projectId) {
      loadAvailableSections()
    }
  }, [isOpen, projectId])

  const loadAvailableSections = async () => {
    setLoading(true)
    try {
      const availableSections = await CompletePDFExportService.getAvailableSections(projectId)
      setSections(availableSections)
    } catch (error) {
      console.error('Erreur chargement sections:', error)
    } finally {
      setLoading(false)
    }
  }

  // Appliquer un template
  const applyTemplate = (templateName: 'fongip' | 'banque' | 'pitch' | 'complet') => {
    setSelectedTemplate(templateName)
    const templateOptions = EXPORT_TEMPLATES[templateName]
    setOptions({
      ...options,
      ...templateOptions,
      template: templateName
    } as PDFExportOptions)
  }

  // Toggle une option
  const toggleOption = (key: keyof PDFExportOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setSelectedTemplate('custom')
  }

  // Compter les sections sélectionnées
  const countSelectedSections = () => {
    let count = 0
    if (options.includeResume) count++
    if (options.includeIdentification) count++
    if (options.includeMarketStudy) count++
    if (options.includeSWOT) count++
    if (options.includeMarketing) count++
    if (options.includeHR) count++
    if (options.includeFinancial) count++
    if (options.includeFicheSynoptique) count++
    if (options.includeAnalyseFinanciere) count++
    if (options.includeTableauxFinanciers) count++
    if (options.includeRelationsBancaires) count++
    if (options.includeVanTriDrci) count++
    if (options.includeProjectionsFinancieres) count++
    if (options.includeScoringFongip) count++
    return count
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Nouveau flux: API serveur qui retourne du HTML optimisé
      try {
        const res = await fetch('/api/pdf/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, options })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.html) {
            // Utiliser le HTML optimisé du serveur avec jsPDF
            await generatePDFFromHTML(data.html, data.projectName || projectName)
            onClose()
            return
          }
        }
        // Si échec API, bascule sur le flux existant
        console.warn('API PDF serveur indisponible, fallback jsPDF...')
      } catch (e) {
        console.warn('Erreur API PDF serveur, fallback jsPDF...', e)
      }

      // Fallback: flux existant (jsPDF/HTML)
      await onExport(options)
      onClose()
    } catch (error) {
      console.error('Erreur export:', error)
    } finally {
      setExporting(false)
    }
  }

  // Fonction pour générer le PDF à partir du HTML optimisé
  const generatePDFFromHTML = async (html: string, fileName: string) => {
    // Créer une nouvelle fenêtre pour le rendu HTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir une nouvelle fenêtre')
    }

    printWindow.document.write(html)
    printWindow.document.close()

    // Attendre que le contenu soit chargé
    await new Promise(resolve => {
      printWindow.onload = resolve
    })

    // Utiliser l'impression native du navigateur
    printWindow.print()
    
    // Fermer la fenêtre après impression
    setTimeout(() => {
      printWindow.close()
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ArrowDownTrayIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Export PDF Professionnel</h2>
                  <p className="text-blue-100 mt-1">{projectName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">

            {/* Templates prédéfinis */}
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Templates Prédéfinis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Template FONGIP */}
                <button
                  onClick={() => applyTemplate('fongip')}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedTemplate === 'fongip'
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">FONGIP</h4>
                    <p className="text-xs text-gray-600">Complet + FONGIP</p>
                    <p className="text-xs text-blue-600 mt-2 font-semibold">15 sections</p>
                  </div>
                </button>

                {/* Template Banque */}
                <button
                  onClick={() => applyTemplate('banque')}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedTemplate === 'banque'
                      ? 'border-green-600 bg-green-50 shadow-lg'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <BanknotesIcon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Banque</h4>
                    <p className="text-xs text-gray-600">Focus Financier</p>
                    <p className="text-xs text-green-600 mt-2 font-semibold">11 sections</p>
                  </div>
                </button>

                {/* Template Pitch */}
                <button
                  onClick={() => applyTemplate('pitch')}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedTemplate === 'pitch'
                      ? 'border-purple-600 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <PresentationChartLineIcon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Pitch</h4>
                    <p className="text-xs text-gray-600">Investisseurs</p>
                    <p className="text-xs text-purple-600 mt-2 font-semibold">7 sections</p>
                  </div>
                </button>

                {/* Template Complet */}
                <button
                  onClick={() => applyTemplate('complet')}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedTemplate === 'complet'
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Complet</h4>
                    <p className="text-xs text-gray-600">Tout inclus</p>
                    <p className="text-xs text-indigo-600 mt-2 font-semibold">16 sections</p>
                  </div>
                </button>

              </div>

              {selectedTemplate === 'custom' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Configuration personnalisée active
                  </p>
                </div>
              )}
            </div>

            {/* Sélection détaillée */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎯 Sections à inclure ({countSelectedSections()} sélectionnées)
              </h3>

              <div className="space-y-6">

                {/* Business Plan Classique */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Business Plan Classique
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CheckboxOption
                      label="Résumé Exécutif"
                      checked={options.includeResume}
                      onChange={() => toggleOption('includeResume')}
                      required
                    />
                    <CheckboxOption
                      label="Identification Entreprise"
                      checked={options.includeIdentification}
                      onChange={() => toggleOption('includeIdentification')}
                      required
                    />
                    <CheckboxOption
                      label="Étude de Marché"
                      checked={options.includeMarketStudy}
                      onChange={() => toggleOption('includeMarketStudy')}
                    />
                    <CheckboxOption
                      label="Analyse SWOT"
                      checked={options.includeSWOT}
                      onChange={() => toggleOption('includeSWOT')}
                    />
                    <CheckboxOption
                      label="Stratégie Marketing"
                      checked={options.includeMarketing}
                      onChange={() => toggleOption('includeMarketing')}
                    />
                    <CheckboxOption
                      label="Ressources Humaines"
                      checked={options.includeHR}
                      onChange={() => toggleOption('includeHR')}
                    />
                    <CheckboxOption
                      label="Plan de Financement"
                      checked={options.includeFinancial}
                      onChange={() => toggleOption('includeFinancial')}
                      required
                    />
                  </div>
                </div>

                {/* Modules FONGIP */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                    Modules FONGIP / Bancaires
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CheckboxOption
                      label="Fiche Synoptique FONGIP"
                      checked={options.includeFicheSynoptique}
                      onChange={() => toggleOption('includeFicheSynoptique')}
                      available={sections.find(s => s.id === 'fiche_synoptique')?.isAvailable}
                    />
                    <CheckboxOption
                      label="Analyse Financière Historique"
                      checked={options.includeAnalyseFinanciere}
                      onChange={() => toggleOption('includeAnalyseFinanciere')}
                      available={sections.find(s => s.id === 'analyse_financiere')?.isAvailable}
                    />
                    <CheckboxOption
                      label="Tableaux Financiers"
                      checked={options.includeTableauxFinanciers}
                      onChange={() => toggleOption('includeTableauxFinanciers')}
                      available={sections.find(s => s.id === 'tableaux_financiers')?.isAvailable}
                    />
                    <CheckboxOption
                      label="Relations Bancaires"
                      checked={options.includeRelationsBancaires}
                      onChange={() => toggleOption('includeRelationsBancaires')}
                      available={sections.find(s => s.id === 'relations_bancaires')?.isAvailable}
                    />
                    <CheckboxOption
                      label="VAN / TRI / DRCI"
                      checked={options.includeVanTriDrci}
                      onChange={() => toggleOption('includeVanTriDrci')}
                    />
                    <CheckboxOption
                      label="Projections Financières"
                      checked={options.includeProjectionsFinancieres}
                      onChange={() => toggleOption('includeProjectionsFinancieres')}
                    />
                    <CheckboxOption
                      label="Scoring FONGIP"
                      checked={options.includeScoringFongip}
                      onChange={() => toggleOption('includeScoringFongip')}
                    />
                  </div>
                </div>

                {/* Options générales */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                    Options générales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <CheckboxOption
                      label="Page de couverture"
                      checked={options.includeCover}
                      onChange={() => toggleOption('includeCover')}
                    />
                    <CheckboxOption
                      label="Table des matières"
                      checked={options.includeTableOfContents}
                      onChange={() => toggleOption('includeTableOfContents')}
                    />
                    <CheckboxOption
                      label="Numéros de page"
                      checked={options.pageNumbers}
                      onChange={() => toggleOption('pageNumbers')}
                    />
                    <CheckboxOption
                      label="Annexes"
                      checked={options.includeAppendices}
                      onChange={() => toggleOption('includeAppendices')}
                    />
                  </div>
                </div>

                {/* Palette de couleurs */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">🎨 Palette de couleurs</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, colorScheme: 'blue' }))}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        options.colorScheme === 'blue'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Bleu
                    </button>
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, colorScheme: 'green' }))}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        options.colorScheme === 'green'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Vert
                    </button>
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, colorScheme: 'purple' }))}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        options.colorScheme === 'purple'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Violet
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p className="font-medium">{countSelectedSections()} sections sélectionnées</p>
                <p className="text-xs mt-1">Template: {selectedTemplate === 'custom' ? 'Personnalisé' : selectedTemplate.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || countSelectedSections() === 0}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      Générer PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Composant Checkbox Option
interface CheckboxOptionProps {
  label: string
  checked: boolean
  onChange: () => void
  required?: boolean
  available?: boolean
}

function CheckboxOption({ label, checked, onChange, required, available = true }: CheckboxOptionProps) {
  return (
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
      checked
        ? 'border-blue-600 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    } ${!available ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={required || !available}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
      />
      <span className={`flex-1 font-medium ${checked ? 'text-blue-900' : 'text-gray-700'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!available && <span className="text-amber-600 text-xs ml-2">(Non disponible)</span>}
      </span>
      {checked && <CheckIcon className="w-5 h-5 text-blue-600" />}
    </label>
  )
}
