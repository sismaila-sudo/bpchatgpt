'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

/**
 * 👁️ PAGE VISUALISATION EXPORT SAUVEGARDÉ - Phase 10
 *
 * Affiche un export personnalisé sauvegardé depuis l'historique
 * Version read-only avec possibilité d'imprimer
 *
 * Route: /projects/[id]/export-history/[exportId]
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeftIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { CustomExportService } from '@/services/customExportService'
import { CustomExport } from '@/types/customExport'
import toast from 'react-hot-toast'

export default function ViewExportPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string
  const exportId = params.exportId as string

  const [export_, setExport] = useState<CustomExport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadExport()
    }
  }, [user, projectId, exportId])

  const loadExport = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await CustomExportService.getCustomExport(user.uid, projectId, exportId)
      if (data) {
        setExport(data)
      } else {
        toast.error('Export introuvable')
        router.push(`/projects/${projectId}/export-history`)
      }
    } catch (error) {
      console.error('Erreur chargement export:', error)
      toast.error('Erreur lors du chargement')
      router.push(`/projects/${projectId}/export-history`)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadHTML = () => {
    if (!export_) return

    const html = export_.editedHTML
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${export_.name.replace(/\s+/g, '-').toLowerCase()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('HTML téléchargé')

    // Incrémenter compteur
    if (user) {
      CustomExportService.incrementDownloadCount(user.uid, projectId, exportId, 'html')
    }
  }

  const handlePrintClick = () => {
    handlePrint()

    // Incrémenter compteur
    if (user) {
      CustomExportService.incrementPrintCount(user.uid, projectId, exportId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'export...</p>
        </div>
      </div>
    )
  }

  if (!export_) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ========== BARRE D'ACTIONS ========== */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">

            {/* Gauche */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}/export-history`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden md:inline">Retour historique</span>
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              <div>
                <h1 className="text-lg font-semibold text-gray-900">{export_.name}</h1>
                <p className="text-xs text-gray-500">
                  {export_.template.toUpperCase()} • Créé le {export_.createdAt.toDate().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Droite */}
            <div className="flex items-center gap-2">
              {export_.hasEdits && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <PencilIcon className="w-4 h-4" />
                  Édité
                </span>
              )}

              <button
                onClick={handleDownloadHTML}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Télécharger HTML"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span className="hidden md:inline">HTML</span>
              </button>

              <button
                onClick={handlePrintClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <PrinterIcon className="w-5 h-5" />
                <span className="hidden md:inline">Imprimer / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== CONTENU ========== */}
      <div className="pt-20 pb-8 print:pt-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">

          {/* Contenu HTML */}
          <div
            className="business-plan-content"
            dangerouslySetInnerHTML={{ __html: export_.editedHTML }}
          />
        </div>
      </div>

      {/* ========== STYLES ========== */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:pt-0 {
            padding-top: 0 !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:max-w-none {
            max-width: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 2cm;
          }

          .page, .section {
            page-break-inside: avoid;
          }

          .page-break {
            page-break-before: always;
          }
        }

        .business-plan-content {
          min-height: 297mm;
        }
      `}</style>
    </div>
  )
}
