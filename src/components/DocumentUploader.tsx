'use client'

import { useState, useRef } from 'react'
import { DocumentUpload } from '@/types/document'
import { DocumentAnalysisResult } from '@/services/openaiService'
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface DocumentUploaderProps {
  projectId: string
  userId: string
  onAnalysisComplete?: (analysis: DocumentAnalysisResult) => void
  onDocumentUploaded?: (document: DocumentUpload) => void
  className?: string
}

export default function DocumentUploader({
  projectId,
  userId,
  onAnalysisComplete,
  onDocumentUploaded,
  className = ''
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Valider le type de fichier
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'Le fichier ne peut pas dépasser 10MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier non supporté. Utilisez PDF, TXT, CSV ou Excel.' }
    }

    return { valid: true }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')

    // Validation du fichier
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    await processFile(file)
  }

  const processFile = async (file: File) => {
    setUploading(true)
    setProgress('Préparation...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      formData.append('userId', userId)

      setProgress('Upload et traitement...')

      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du traitement')
      }

      const { document, analysis } = await response.json()

      setSuccess(`Document "${file.name}" analysé avec succès !`)
      onDocumentUploaded?.(document)
      onAnalysisComplete?.(analysis)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Erreur traitement document:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du document')
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.error || 'Fichier invalide')
        return
      }
      processFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${success ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin mx-auto h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-blue-600 font-medium">{progress}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-gray-600">
                <span className="font-medium text-blue-600">Cliquez pour choisir</span> ou glissez un document ici
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PDF, TXT, CSV, Excel - Max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages d'état */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 text-xs mt-1"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-700 text-sm">{success}</p>
            <button
              onClick={() => setSuccess('')}
              className="text-green-600 hover:text-green-800 text-xs mt-1"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      {/* Aide */}
      <div className="mt-4 text-xs text-gray-500">
        <p className="font-medium mb-1">📄 Documents suggérés :</p>
        <ul className="space-y-1">
          <li>• Bilan comptable (PDF/Excel)</li>
          <li>• Compte de résultat (PDF/Excel)</li>
          <li>• Rapport d'activité (PDF/TXT)</li>
          <li>• États financiers (Excel/CSV)</li>
          <li>• Étude de marché existante (PDF)</li>
        </ul>
      </div>
    </div>
  )
}