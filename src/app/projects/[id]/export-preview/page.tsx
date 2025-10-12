'use client'

/**
 * 📄 PAGE EXPORT PREVIEW - Business Plan Complet HTML Éditable
 *
 * Affiche le business plan complet en HTML avec :
 * - Sélection template (FONGIP, Banque, Pitch, Complet)
 * - Édition inline (contentEditable)
 * - Impression optimisée
 * - Sauvegarde PDF via navigateur
 *
 * Route: /projects/[id]/export-preview
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import {
  ArrowLeftIcon,
  PrinterIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  BookmarkIcon,
  ClockIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ListBulletIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { EXPORT_TEMPLATES, type PDFExportOptions } from '@/services/completePDFExportService'
import { CustomExportService } from '@/services/customExportService'
import { projectService } from '@/services/projectService'
import toast from 'react-hot-toast'

type TemplateType = 'fongip' | 'banque' | 'pitch' | 'complet'

export default function ExportPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  // État
  const [html, setHtml] = useState<string>('')
  const [originalHTML, setOriginalHTML] = useState<string>('') // HTML original pour détecter éditions
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('complet')
  const [projectName, setProjectName] = useState('Business Plan')
  const [projectData, setProjectData] = useState<any>(null)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [darkMode, setDarkMode] = useState(false)
  const [fullscreenMode, setFullscreenMode] = useState(false)
  const [showToc, setShowToc] = useState(false)

  // Options export
  const [options, setOptions] = useState<PDFExportOptions>({
    ...EXPORT_TEMPLATES.complet,
    template: 'complet',
    pageNumbers: true,
    colorScheme: 'blue'
  } as PDFExportOptions)

  const contentRef = useRef<HTMLDivElement>(null)

  // Charger le HTML depuis l'API
  useEffect(() => {
    console.log('🔥 useEffect export-preview déclenché:', { projectId, selectedTemplate, user: !!user })
    if (!projectId) {
      console.warn('⚠️ projectId manquant, skip loadPreview')
      return
    }
    loadPreview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedTemplate])

  const loadPreview = async () => {
    console.log('📥 loadPreview START:', { projectId, selectedTemplate })
    setLoading(true)
    try {
      const templateOptions = EXPORT_TEMPLATES[selectedTemplate]
      console.log('📋 Template options:', templateOptions)

      const exportOptions = {
        ...templateOptions,
        template: selectedTemplate,
        pageNumbers: true
      } as PDFExportOptions

      setOptions(exportOptions)

      console.log('🌐 Calling /api/pdf/export...')
      
      // ✅ NOUVELLE APPROCHE : Charger le projet et la fiche synoptique depuis Firestore côté client
      let projectData = null
      let ficheSynoptiqueData = null
      
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId))
        if (projectDoc.exists()) {
          projectData = { id: projectDoc.id, ...projectDoc.data() }
          console.log('📦 Projet chargé côté client:', {
            id: projectData.id,
            name: projectData.basicInfo?.name,
            hasSections: !!projectData.sections,
            sectionsKeys: projectData.sections ? Object.keys(projectData.sections) : []
          })
        }
      } catch (error) {
        console.error('❌ Erreur chargement projet côté client:', error)
      }

      // Charger la fiche synoptique côté client
      try {
        const ficheDoc = await getDoc(doc(db, 'fichesSynoptiques', projectId))
        if (ficheDoc.exists()) {
          ficheSynoptiqueData = { id: ficheDoc.id, ...ficheDoc.data() }
          console.log('📋 Fiche synoptique chargée côté client:', {
            id: ficheSynoptiqueData.id,
            hasGaranties: !!ficheSynoptiqueData.garanties,
            garantiesCount: ficheSynoptiqueData.garanties?.garantiesProposees?.length || 0,
            garanties: ficheSynoptiqueData.garanties?.garantiesProposees || []
          })
        } else {
          console.log('📋 Aucune fiche synoptique trouvée pour ce projet')
        }
      } catch (error) {
        console.error('❌ Erreur chargement fiche synoptique côté client:', error)
      }

      const res = await fetch('/api/pdf/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          options: exportOptions, 
          userId: user?.uid,
          projectData, // ✅ Envoyer les données du projet
          ficheSynoptiqueData // ✅ Envoyer les données de la fiche synoptique
        })
      })

      console.log('📨 Response status:', res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ API Error:', errorText)
        throw new Error('Erreur chargement preview: ' + res.status)
      }

      const data = await res.json()
      console.log('✅ Data received:', {
        success: data.success,
        htmlLength: data.html?.length,
        htmlPreview: data.html?.substring(0, 200)
      })

      if (data.success && data.html) {
        setHtml(data.html)
        setOriginalHTML(data.html) // Sauvegarder HTML original
        setProjectName(data.projectName || 'Business Plan')
        console.log('✨ HTML set successfully')
      } else {
        throw new Error('HTML non disponible')
      }
    } catch (error: any) {
      console.error('❌ Error in loadPreview:', error)
      toast.error('Impossible de charger la prévisualisation: ' + error.message)
    } finally {
      setLoading(false)
      console.log('🏁 loadPreview END')
    }
  }

  // Charger données projet pour snapshot
  useEffect(() => {
    if (user && projectId) {
      projectService.getProjectById(projectId, user.uid).then(setProjectData)
    }
  }, [user, projectId])

  // Appliquer le mode sombre au document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Impression
  const handlePrint = () => {
    // Désactiver mode édition avant impression
    if (editMode) {
      setEditMode(false)
      setTimeout(() => {
        window.print()
      }, 300)
    } else {
      // Afficher un guide rapide avant impression
      toast.success('💡 Conseil: Utilisez "Enregistrer au format PDF" dans le dialogue d\'impression pour sauvegarder', {
        duration: 4000,
        icon: '📄'
      })
      setTimeout(() => {
        window.print()
      }, 100)
    }
  }

  // Télécharger HTML
  const handleDownloadHTML = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `business-plan-${projectName.replace(/\s+/g, '-').toLowerCase()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('HTML téléchargé')
  }


  // Sauvegarder modifications
  const handleSaveEdits = () => {
    if (contentRef.current) {
      const editedHTML = contentRef.current.innerHTML
      setHtml(editedHTML)
      setEditMode(false)
      toast.success('Modifications sauvegardées')
    }
  }

  // Annuler édition
  const handleCancelEdit = () => {
    setEditMode(false)
    // Recharger HTML original
    if (contentRef.current) {
      contentRef.current.innerHTML = html
    }
  }

  // Sauvegarder export personnalisé dans Firestore
  const handleSaveToFirestore = async (exportName: string) => {
    if (!user || !projectData) {
      toast.error('Impossible de sauvegarder')
      return
    }

    try {
      const currentHTML = contentRef.current?.innerHTML || html

      await CustomExportService.createCustomExport({
        projectId,
        userId: user.uid,
        name: exportName,
        description: `Export ${selectedTemplate.toUpperCase()} - ${new Date().toLocaleDateString('fr-FR')}`,
        template: selectedTemplate,
        colorScheme: options.colorScheme || 'blue',
        originalHTML: originalHTML,
        editedHTML: currentHTML,
        projectSnapshot: {
          name: projectData.basicInfo.name,
          description: projectData.basicInfo.description,
          sector: projectData.basicInfo.sector,
          location: projectData.basicInfo.location.city
        },
        tags: [selectedTemplate, new Date().getFullYear().toString()]
      })

      toast.success('Export sauvegardé avec succès !')
      setShowSaveDialog(false)
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  // Changer template
  const handleTemplateChange = (template: TemplateType) => {
    setSelectedTemplate(template)
  }

  // Gestion du zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
  }


  // Gestion du mode sombre
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  // Gestion du mode plein écran
  const toggleFullscreen = () => {
    setFullscreenMode(prev => !prev)
  }

  // Gestion de la table des matières
  const toggleToc = () => {
    setShowToc(prev => !prev)
  }

  // Insertion d'image
  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error('Veuillez entrer une URL d\'image')
      return
    }

    if (contentRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const img = document.createElement('img')
        img.src = imageUrl
        img.alt = imageAlt || 'Image'
        img.className = 'inserted-image'
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        img.style.margin = '1rem 0'
        img.style.borderRadius = '0.5rem'
        img.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        
        range.insertNode(img)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        
        setImageUrl('')
        setImageAlt('')
        setShowImageDialog(false)
        toast.success('Image insérée avec succès')
      }
    }
  }

  // Gestion de la sélection de texte
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection) {
      // Sélection de texte pour insertion d'images
      console.log('Texte sélectionné:', selection.toString())
    }
  }

  // Rendu conditionnel après tous les hooks
  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur: ID du projet manquant</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Génération de la prévisualisation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* ========== BARRE D'ACTIONS AMÉLIORÉE ========== */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm flex-shrink-0 transition-colors`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Gauche - Navigation */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Retour</span>
              </button>

              <div className="h-8 w-px bg-gray-300"></div>

              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {projectName}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Aperçu du Business Plan - Template {selectedTemplate.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Centre - Templates */}
            <div className="flex items-center gap-3">
              <TemplateButton
                template="fongip"
                label="FONGIP"
                active={selectedTemplate === 'fongip'}
                onClick={() => handleTemplateChange('fongip')}
              />
              <TemplateButton
                template="banque"
                label="Banque"
                active={selectedTemplate === 'banque'}
                onClick={() => handleTemplateChange('banque')}
              />
              <TemplateButton
                template="pitch"
                label="Pitch"
                active={selectedTemplate === 'pitch'}
                onClick={() => handleTemplateChange('pitch')}
              />
              <TemplateButton
                template="complet"
                label="Complet"
                active={selectedTemplate === 'complet'}
                onClick={() => handleTemplateChange('complet')}
              />
            </div>

            {/* Droite - Actions */}
            <div className="flex items-center gap-3">

              {/* Outils d'affichage */}
              <div className="flex items-center gap-2">
                {/* Zoom */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom arrière"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-sm font-medium min-w-[3rem] text-center">{zoomLevel}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom avant"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode sombre */}
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title={darkMode ? 'Mode clair' : 'Mode sombre'}
                >
                  {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                </button>

                {/* Plein écran */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  title={fullscreenMode ? 'Sortir du plein écran' : 'Plein écran'}
                >
                  {fullscreenMode ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
                </button>

                {/* Table des matières */}
                <button
                  onClick={toggleToc}
                  className={`p-2 rounded-lg transition-colors ${showToc ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title="Table des matières"
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="h-8 w-px bg-gray-300"></div>

              {/* Mode édition */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Éditer</span>
                </button>
              ) : (
                <>
                  {/* Barre d'outils d'édition */}
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <button
                      onClick={() => setShowImageDialog(true)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Insérer une image"
                    >
                      <PhotoIcon className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-blue-300"></div>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      <CheckIcon className="w-3 h-3" />
                      Sauvegarder
                    </button>
                  </div>
                </>
              )}

              <div className="h-8 w-px bg-gray-300"></div>

              {/* Actions groupées */}
              <div className="flex items-center gap-2">
                {/* Sauvegarder dans historique */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title="Sauvegarder dans historique"
                >
                  <BookmarkIcon className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </button>

                {/* Historique */}
                <button
                  onClick={() => router.push(`/projects/${projectId}/export-history`)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title="Voir historique"
                >
                  <ClockIcon className="w-4 h-4" />
                  <span>Historique</span>
                </button>

                {/* Télécharger HTML */}
                <button
                  onClick={handleDownloadHTML}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title="Télécharger HTML"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>HTML</span>
                </button>

              </div>

              <div className="h-8 w-px bg-gray-300"></div>

              {/* Imprimer / PDF */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                title="Imprimer ou sauvegarder en PDF"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Imprimer / PDF</span>
              </button>

              {/* Bouton de test pour vérifier les fonctionnalités */}
              <button
                onClick={() => {
                  toast.success(`Mode sombre: ${darkMode ? 'ON' : 'OFF'} | Zoom: ${zoomLevel}% | Plein écran: ${fullscreenMode ? 'ON' : 'OFF'} | TOC: ${showToc ? 'ON' : 'OFF'}`)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                title="Tester les fonctionnalités"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DIALOG SAUVEGARDE ========== */}
      {showSaveDialog && <SaveExportDialog onSave={handleSaveToFirestore} onClose={() => setShowSaveDialog(false)} projectName={projectName} />}

      {/* ========== DIALOG INSERTION D'IMAGE ========== */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Insérer une image</h3>
              <button
                onClick={() => setShowImageDialog(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte alternatif (optionnel)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Description de l'image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowImageDialog(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInsertImage}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Insérer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TABLE DES MATIÈRES ========== */}
      {showToc && (
        <div className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-40 overflow-y-auto toc-slide-in">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Table des matières</h3>
              <button
                onClick={() => setShowToc(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <a href="#resume" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                📋 Résumé Exécutif
              </a>
              <a href="#identification" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                🏢 Identification du Projet
              </a>
              <a href="#market-study" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                📊 Étude de Marché
              </a>
              <a href="#swot" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                🔍 Analyse SWOT
              </a>
              <a href="#marketing" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                📈 Plan Marketing
              </a>
              <a href="#financial" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                💰 Projections Financières
              </a>
              <a href="#tableaux" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                📊 Tableaux Financiers
              </a>
              <a href="#rentabilite" className="toc-link block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
                📈 Analyse de Rentabilité
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} ${showToc ? 'ml-80' : ''} ${fullscreenMode ? 'fixed inset-0 z-30' : ''}`}>
        <div className="h-full overflow-y-auto">
          <div className={`${fullscreenMode ? 'max-w-none px-4 py-4' : 'max-w-4xl mx-auto px-6 py-8'}`}>
            <div className={`${darkMode ? 'bg-gray-800 text-white dark-mode' : 'bg-white'} rounded-xl shadow-xl print:shadow-none print:rounded-none print:max-w-none min-h-full transition-all duration-300`} style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>

          {/* Badge mode édition */}
          {editMode && (
            <div className="bg-amber-50 border-b-2 border-amber-400 px-6 py-3 print:hidden">
              <div className="flex items-center gap-2 text-amber-800">
                <PencilIcon className="w-5 h-5" />
                <p className="font-medium">
                  Mode édition activé - Cliquez sur le texte pour modifier
                </p>
              </div>
            </div>
          )}

              {/* Contenu HTML éditable */}
              <div
                ref={contentRef}
                className={`business-plan-content px-8 py-6 ${editMode ? 'editable' : ''} ${darkMode ? 'dark-mode' : ''}`}
                contentEditable={editMode}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: html }}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========== STYLES ========== */}
      <style jsx global>{`
        /* Styles impression optimisés */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000 !important;
          }

          /* Masquer les éléments d'interface */
          .print\\:hidden,
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

          /* Contenu principal */
          .business-plan-content {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #000 !important;
          }

          /* Configuration des pages */
          @page {
            size: A4 portrait;
            margin: 1.5cm;
            @top-center {
              content: "Business Plan FONGIP";
              font-size: 10pt;
              color: #666;
            }
            @bottom-right {
              content: "Page " counter(page);
              font-size: 10pt;
              color: #666;
            }
          }

          /* Titres et sections */
          h1 {
            font-size: 18pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 20pt 0 15pt 0 !important;
            page-break-after: avoid;
            border-bottom: 2pt solid #000 !important;
            padding-bottom: 5pt !important;
          }

          h2 {
            font-size: 16pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 18pt 0 12pt 0 !important;
            page-break-after: avoid;
            border-bottom: 1pt solid #000 !important;
            padding-bottom: 3pt !important;
          }

          h3 {
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 15pt 0 10pt 0 !important;
            page-break-after: avoid;
          }

          h4 {
            font-size: 12pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 12pt 0 8pt 0 !important;
            page-break-after: avoid;
          }

          /* Paragraphes */
          p {
            margin: 8pt 0 !important;
            text-align: justify !important;
            color: #000 !important;
            orphans: 3;
            widows: 3;
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
            page-break-inside: avoid;
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
            page-break-inside: avoid;
            background: white !important;
          }

          /* Sauts de page intelligents */
          .page-break {
            page-break-before: always;
          }

          .no-break {
            page-break-inside: avoid;
          }

          /* Éviter les coupures */
          .section,
          .table,
          .financial-table,
          .risk-item,
          .installation-item {
            page-break-inside: avoid;
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
            page-break-inside: avoid;
          }

          /* Signature */
          .signature-section {
            margin-top: 30pt !important;
            padding: 15pt !important;
            border: 2pt solid #000 !important;
            text-align: right !important;
            background: white !important;
          }
        }

        /* Styles pour la présentation */
        .business-plan-content {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
        }

        .business-plan-content h1 {
          color: #1e40af;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #3b82f6;
        }

        .business-plan-content h2 {
          color: #1e40af;
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .business-plan-content h3 {
          color: #374151;
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .business-plan-content h4 {
          color: #4b5563;
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .business-plan-content p {
          margin-bottom: 1rem;
          text-align: justify;
        }

        .business-plan-content ul, .business-plan-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .business-plan-content li {
          margin-bottom: 0.5rem;
        }

        .business-plan-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .business-plan-content th,
        .business-plan-content td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .business-plan-content th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .business-plan-content tr:hover {
          background-color: #f9fafb;
        }

        .business-plan-content strong {
          font-weight: 600;
          color: #1f2937;
        }

        .business-plan-content .section {
          margin: 2rem 0;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background-color: #ffffff;
        }

        .business-plan-content .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .business-plan-content .financial-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }

        .business-plan-content .financial-table td:first-child {
          width: 60%;
          font-weight: 500;
          color: #374151;
        }

        .business-plan-content .financial-table td:last-child {
          width: 40%;
          text-align: right;
          font-weight: 600;
          color: #1f2937;
        }

        /* Mode éditable */
        .business-plan-content.editable {
          outline: 2px dashed #fbbf24;
          outline-offset: -2px;
        }

        .business-plan-content.editable:focus {
          outline: 2px solid #f59e0b;
        }

        /* Styles pour les images insérées */
        .inserted-image {
          max-width: 100% !important;
          height: auto !important;
          margin: 1rem 0 !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease !important;
        }

        .inserted-image:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }

        /* Mode sombre */
        .dark-mode .business-plan-content {
          color: #e5e7eb !important;
        }

        .dark-mode .business-plan-content h1,
        .dark-mode .business-plan-content h2 {
          color: #60a5fa !important;
        }

        .dark-mode .business-plan-content h3 {
          color: #9ca3af !important;
        }

        .dark-mode .business-plan-content h4 {
          color: #d1d5db !important;
        }

        .dark-mode .business-plan-content th {
          background-color: #374151 !important;
          color: #e5e7eb !important;
        }

        .dark-mode .business-plan-content td {
          border-color: #4b5563 !important;
        }

        .dark-mode .business-plan-content tr:hover {
          background-color: #374151 !important;
        }

        .dark-mode .business-plan-content .section {
          background-color: #1f2937 !important;
          border-color: #4b5563 !important;
        }

        /* Animations */
        .toc-slide-in {
          animation: slideInLeft 0.3s ease-out;
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .dialog-fade-in {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .toc-sidebar {
            width: 100% !important;
          }
          
          .main-content-with-toc {
            margin-left: 0 !important;
          }
        }

        /* Amélioration de l'accessibilité */
        .business-plan-content:focus-within {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Styles pour les liens de navigation */
        .toc-link {
          position: relative;
          transition: all 0.2s ease;
        }

        .toc-link:hover {
          background-color: #f3f4f6;
          transform: translateX(4px);
        }

        .toc-link:active {
          background-color: #e5e7eb;
        }

        .business-plan-content.editable h1,
        .business-plan-content.editable h2,
        .business-plan-content.editable h3,
        .business-plan-content.editable p {
          cursor: text;
        }

        /* Styles de base pour assurer rendu correct */
        .business-plan-content {
          min-height: 297mm; /* A4 height */
        }
      `}</style>
    </div>
  )
}

// ========== COMPOSANT BOUTON TEMPLATE ==========

interface TemplateButtonProps {
  template: TemplateType
  label: string
  active: boolean
  onClick: () => void
}

function TemplateButton({ template, label, active, onClick }: TemplateButtonProps) {
  const colors = {
    fongip: 'border-blue-600 bg-blue-50 text-blue-700',
    banque: 'border-green-600 bg-green-50 text-green-700',
    pitch: 'border-purple-600 bg-purple-50 text-purple-700',
    complet: 'border-indigo-600 bg-indigo-50 text-indigo-700'
  }

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border-2 font-medium text-sm transition-all ${
        active
          ? colors[template]
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

// ========== DIALOG SAUVEGARDE EXPORT ==========

interface SaveExportDialogProps {
  onSave: (name: string) => void
  onClose: () => void
  projectName: string
}

function SaveExportDialog({ onSave, onClose, projectName }: SaveExportDialogProps) {
  const [exportName, setExportName] = useState(`Export ${projectName} - ${new Date().toLocaleDateString('fr-FR')}`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (exportName.trim()) {
      onSave(exportName.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookmarkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sauvegarder l'export</h2>
            </div>
            <p className="text-sm text-gray-600">
              Enregistrez cette version du business plan dans votre historique pour y accéder plus tard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="exportName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'export
              </label>
              <input
                type="text"
                id="exportName"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Export FONGIP - Version finale"
                autoFocus
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💡 <strong>Conseil :</strong> Donnez un nom descriptif pour retrouver facilement cet export.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
