'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import { analysisService } from '@/services/analysisService'
import { useRouter } from 'next/navigation'
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NewAnalysisPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'comprehensive'>('quick')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Vérifier les permissions
  if (userProfile && userProfile.role !== UserRole.ADMIN && userProfile.role !== UserRole.FINANCIAL_ANALYST) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h1>
          <p className="text-slate-600 mb-6">Vous n'avez pas les permissions pour accéder à cette fonctionnalité.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('Vous devez être connecté')
      return
    }

    if (!projectName.trim()) {
      setError('Le nom du projet est requis')
      return
    }

    if (files.length === 0) {
      setError('Veuillez uploader au moins un document')
      return
    }

    try {
      setUploading(true)
      setError(null)

      // Créer l'analyse
      const analysisId = await analysisService.createAnalysis(
        user.uid,
        projectName.trim(),
        description.trim() || undefined
      )

      // Upload des documents
      await analysisService.uploadDocuments(analysisId, files)

      // Marquer comme en cours de traitement
      await analysisService.updateAnalysisStatus(analysisId, 'processing')

      // Lire le contenu des fichiers PDF/texte pour l'analyse IA
      setAnalyzing(true)

      // Pour chaque fichier, extraire le texte
      let businessPlanText = ''
      for (const file of files) {
        if (file.type === 'application/pdf') {
          // Extraction PDF côté serveur
          const text = await extractPdfText(file)
          businessPlanText += `\n\n--- ${file.name} ---\n\n${text}`
        } else if (file.type === 'text/plain') {
          const text = await readFileAsText(file)
          businessPlanText += `\n\n--- ${file.name} ---\n\n${text}`
        }
      }

      // Appeler l'API d'analyse de crédit
      console.log(`📊 Mode d'analyse: ${analysisMode}`)
      const response = await fetch('/api/ai/credit-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessPlanText,
          mode: analysisMode
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const result = await response.json()

      // Sauvegarder le résultat
      await analysisService.saveAnalysisResult(analysisId, {
        ...result.analysis,
        noteDeCredit: result.noteDeCredit
      })

      // Rediriger vers la page de visualisation
      router.push(`/analysis/${analysisId}`)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      console.error('Erreur:', err)
      setError(errorMessage)
      setAnalyzing(false)
      setUploading(false)
    }
  }

  const extractPdfText = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/extract-pdf', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Erreur extraction PDF: ${file.name}`)
    }

    const result = await response.json()
    return result.text || ''
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string || '')
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Nouvelle Analyse de Crédit</h1>
                <p className="text-slate-600 mt-1">Évaluez un business plan avec l'IA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du projet */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Informations du projet</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-2">
                  Nom du projet *
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ex: Ferme Multi-Activités"
                  required
                  disabled={uploading || analyzing}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Brève description du projet..."
                  disabled={uploading || analyzing}
                />
              </div>

              {/* Mode d'analyse */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Mode d'analyse *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quick Mode */}
                  <button
                    type="button"
                    onClick={() => setAnalysisMode('quick')}
                    disabled={uploading || analyzing}
                    className={`relative p-5 border-2 rounded-xl text-left transition-all ${
                      analysisMode === 'quick'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚡</span>
                        <h3 className="font-bold text-slate-900">Quick Analysis</h3>
                      </div>
                      {analysisMode === 'quick' && (
                        <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Analyse rapide du business plan uniquement
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>✓ Analyse financière complète</li>
                      <li>✓ Calcul ratios BCEAO</li>
                      <li>✓ Note de crédit professionnelle</li>
                      <li className="text-slate-400">✗ Pas de recherches externes</li>
                    </ul>
                    <div className="mt-3 text-xs font-semibold text-emerald-600">
                      Recommandé pour institutions financières
                    </div>
                  </button>

                  {/* Comprehensive Mode */}
                  <button
                    type="button"
                    onClick={() => setAnalysisMode('comprehensive')}
                    disabled={uploading || analyzing}
                    className={`relative p-5 border-2 rounded-xl text-left transition-all ${
                      analysisMode === 'comprehensive'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🔍</span>
                        <h3 className="font-bold text-slate-900">Comprehensive</h3>
                      </div>
                      {analysisMode === 'comprehensive' && (
                        <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Analyse approfondie avec contexte marché
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>✓ Tout de Quick Analysis</li>
                      <li>✓ 1,244 documents officiels (RAG)</li>
                      <li>✓ Recherche web temps réel</li>
                      <li>✓ Données ANSD, BCEAO, BM</li>
                    </ul>
                    <div className="mt-3 text-xs font-semibold text-blue-600">
                      Recommandé pour création de BP
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upload de documents */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Documents à analyser</h2>
            <p className="text-slate-600 mb-6">
              Uploadez le business plan complet et les documents financiers (bilans, relevés, factures, etc.)
            </p>

            {/* Zone de drop */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                className="hidden"
                disabled={uploading || analyzing}
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer block"
              >
                <ArrowUpTrayIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700 mb-2">
                  Cliquez pour uploader des fichiers
                </p>
                <p className="text-sm text-slate-500">
                  PDF, Word, Excel, TXT acceptés
                </p>
              </label>
            </div>

            {/* Liste des fichiers */}
            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Fichiers sélectionnés ({files.length})
                </h3>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                      disabled={uploading || analyzing}
                    >
                      <XMarkIcon className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={uploading || analyzing || !projectName.trim() || files.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Upload en cours...</span>
                </>
              ) : analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Lancer l'analyse</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}