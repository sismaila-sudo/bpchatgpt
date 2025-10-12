'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

/**
 * 🚀 PAGE D'EXPORT PDF PROFESSIONNELLE
 * Nouvelle UI avec sélection granulaire et templates
 */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import ModernProjectLayout from '@/components/ModernProjectLayout'
import ExportPDFDialog from '@/components/ExportPDFDialog'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import {
  PDFExportOptions,
  CompletePDFExportService,
  ExportedPDFData
} from '@/services/completePDFExportService'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ExportPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exportData, setExportData] = useState<ExportedPDFData | null>(null)
  const [previewHTML, setPreviewHTML] = useState<string>('')

  useEffect(() => {
    if (!user || !projectId) return

    const loadProject = async () => {
      try {
        const projectData = await projectService.getProjectById(projectId, user.uid)
        if (!projectData) {
          toast.error('Projet introuvable')
          router.push('/projects')
          return
        }
        setProject(projectData)
      } catch (error) {
        console.error('Erreur chargement projet:', error)
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [user, projectId, router])

  // Génération PDF réelle avec jsPDF
  const handleExport = async (options: PDFExportOptions) => {
    if (!project) return

    const toastId = toast.loading('Préparation des données...')

    try {
      // 1. Préparer les données complètes
      toast.loading('Chargement des données FONGIP...', { id: toastId })
      const data = await CompletePDFExportService.prepareExportData(
        project,
        projectId,
        options
      )
      setExportData(data)

      // 2. Générer le HTML
      toast.loading('Génération du document...', { id: toastId })
      const htmlContent = CompletePDFExportService.generateCompleteHTML(data, options)
      setPreviewHTML(htmlContent)

      // 3. Convertir en PDF avec jsPDF
      toast.loading('Création du fichier PDF...', { id: toastId })
      await convertHTMLToPDF(htmlContent, data, options)

      toast.success('PDF généré avec succès !', { id: toastId })
    } catch (error) {
      console.error('Erreur export PDF:', error)
      toast.error('Erreur lors de la génération du PDF', { id: toastId })
    }
  }

  // Conversion HTML vers PDF
  const convertHTMLToPDF = async (
    htmlContent: string,
    data: ExportedPDFData,
    options: PDFExportOptions
  ) => {
    // Créer un élément temporaire pour le rendu
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    document.body.appendChild(tempDiv)

    try {
      // Capturer avec html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123 // A4 height in pixels at 96 DPI
      })

      // Créer PDF avec jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // Ajouter la première page
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297 // A4 height in mm

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      // Télécharger le PDF
      const fileName = `BusinessPlan_${data.project.basicInfo?.name?.replace(/\s+/g, '_') || 'Export'}_${options.template}.pdf`
      pdf.save(fileName)

    } finally {
      // Nettoyer
      document.body.removeChild(tempDiv)
    }
  }

  // Aperçu rapide
  const handleQuickPreview = async () => {
    if (!project) return

    const options: PDFExportOptions = {
      includeResume: true,
      includeIdentification: true,
      includeMarketStudy: true,
      includeSWOT: true,
      includeMarketing: true,
      includeHR: true,
      includeFinancial: true,
      includeFicheSynoptique: false,
      includeAnalyseFinanciere: false,
      includeTableauxFinanciers: false,
      includeRelationsBancaires: false,
      includeVanTriDrci: false,
      includeProjectionsFinancieres: false,
      includeScoringFongip: false,
      includeCover: true,
      includeTableOfContents: true,
      includeAppendices: false,
      template: 'pitch',
      pageNumbers: true,
      colorScheme: 'blue'
    }

    try {
      const data = await CompletePDFExportService.prepareExportData(project, projectId, options)
      const html = CompletePDFExportService.generateCompleteHTML(data, options)

      // Ouvrir dans un nouvel onglet pour prévisualisation
      const previewWindow = window.open('', '_blank')
      if (previewWindow) {
        previewWindow.document.write(html)
        previewWindow.document.close()
      }
    } catch (error) {
      console.error('Erreur aperçu:', error)
      toast.error('Erreur lors de la génération de l\'aperçu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Projet introuvable</h2>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour aux projets
          </button>
        </div>
      </div>
    )
  }

  return (
    <ModernProjectLayout
      projectId={projectId}
      projectName={project.basicInfo?.name || 'Sans nom'}
      project={project}
      currentSection="export"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-6xl mx-auto">

          {/* Header avec gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <ArrowDownTrayIcon className="w-12 h-12" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Export PDF Professionnel</h1>
                  <p className="text-blue-100 text-lg">{project.basicInfo?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    <span className="font-semibold">15+ Sections</span>
                  </div>
                  <p className="text-sm text-blue-100">Business Plan + FONGIP complet</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircleIcon className="w-6 h-6" />
                    <span className="font-semibold">4 Templates</span>
                  </div>
                  <p className="text-sm text-blue-100">FONGIP, Banque, Pitch, Complet</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <SparklesIcon className="w-6 h-6" />
                    <span className="font-semibold">Personnalisable</span>
                  </div>
                  <p className="text-sm text-blue-100">Sélection section par section</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards d'actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* Export personnalisé */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Export Personnalisé</h3>
                  <p className="text-gray-600">Choisissez exactement ce que vous voulez inclure</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <DocumentTextIcon className="w-8 h-8 text-white" />
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Sélection granulaire des sections
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Templates prédéfinis (FONGIP, Banque, Pitch)
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Palette de couleurs personnalisée
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Options de mise en page avancées
                </li>
              </ul>

              <button
                onClick={() => setDialogOpen(true)}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                <SparklesIcon className="w-6 h-6 mr-2" />
                Configurer l'Export
              </button>
            </div>

            {/* Aperçu rapide */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Aperçu Rapide</h3>
                  <p className="text-gray-600">Visualisez votre business plan avant export</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <EyeIcon className="w-8 h-8 text-white" />
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Prévisualisation instantanée
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Format optimisé pour impression
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Vérification visuelle du contenu
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  Aucune configuration nécessaire
                </li>
              </ul>

              <button
                onClick={handleQuickPreview}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                <EyeIcon className="w-6 h-6 mr-2" />
                Aperçu Rapide
              </button>
            </div>

          </div>

          {/* Templates rapides */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">🚀 Export Rapide avec Templates</h3>
            <p className="text-gray-600 mb-8">Utilisez un template prédéfini pour un export en un clic</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* FONGIP */}
              <button
                onClick={() => {
                  setDialogOpen(true)
                  // Le dialog appliquera automatiquement le template FONGIP
                }}
                className="p-6 rounded-xl border-2 border-blue-200 hover:border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DocumentTextIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">FONGIP Complet</h4>
                  <p className="text-sm text-gray-600 mb-3">Business Plan + tous les modules FONGIP</p>
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    15 sections
                  </span>
                </div>
              </button>

              {/* Banque */}
              <button
                onClick={() => {
                  setDialogOpen(true)
                }}
                className="p-6 rounded-xl border-2 border-green-200 hover:border-green-600 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Banque</h4>
                  <p className="text-sm text-gray-600 mb-3">Focus données financières et bancaires</p>
                  <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                    11 sections
                  </span>
                </div>
              </button>

              {/* Pitch */}
              <button
                onClick={() => {
                  setDialogOpen(true)
                }}
                className="p-6 rounded-xl border-2 border-purple-200 hover:border-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Pitch Investisseurs</h4>
                  <p className="text-sm text-gray-600 mb-3">Version synthétique pour présentation</p>
                  <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                    7 sections
                  </span>
                </div>
              </button>

              {/* Complet */}
              <button
                onClick={() => {
                  setDialogOpen(true)
                }}
                className="p-6 rounded-xl border-2 border-indigo-200 hover:border-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-all group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowDownTrayIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Complet</h4>
                  <p className="text-sm text-gray-600 mb-3">Toutes les sections disponibles</p>
                  <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                    16 sections
                  </span>
                </div>
              </button>

            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2">💡 Astuce Professionnelle</h4>
                <p className="text-blue-800 text-sm">
                  Pour une demande de financement FONGIP, utilisez le template "FONGIP Complet" qui inclut tous les documents requis :
                  fiche synoptique, analyse financière historique, tableaux financiers détaillés, et scoring FONGIP.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Dialog d'export */}
      <ExportPDFDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projectId={projectId}
        projectName={project.basicInfo?.name || 'Sans nom'}
        onExport={handleExport}
      />
    </ModernProjectLayout>
  )
}
