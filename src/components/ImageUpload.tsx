'use client'

import { useState, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { PhotoIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  maxSize?: number // en MB
  accept?: string
  placeholder?: string
  className?: string
}

export default function ImageUpload({
  value,
  onChange,
  maxSize = 5,
  accept = 'image/*',
  placeholder = 'Cliquez pour ajouter une image',
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError('')

    // Vérifier la taille du fichier
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Le fichier est trop volumineux. Taille maximum: ${maxSize}MB`)
      return
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont autorisées')
      return
    }

    setUploading(true)

    try {
      // Supprimer l'ancienne image si elle existe
      if (value) {
        try {
          const oldRef = ref(storage, value)
          await deleteObject(oldRef)
        } catch (err) {
          console.log('Ancienne image introuvable:', err)
        }
      }

      // Générer un nom unique pour le fichier
      const timestamp = Date.now()
      const filename = `images/${timestamp}_${file.name}`
      const storageRef = ref(storage, filename)

      // Upload du fichier
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      onChange(downloadURL)
    } catch (err: any) {
      setError('Erreur lors de l\'upload: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = async () => {
    if (value) {
      try {
        const storageRef = ref(storage, value)
        await deleteObject(storageRef)
      } catch (err) {
        console.log('Erreur lors de la suppression:', err)
      }
      onChange(null)
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {value ? (
        // Image uploadée
        <div className="relative">
          <img
            src={value}
            alt="Image uploadée"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="Changer l'image"
            >
              <PhotoIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Supprimer l'image"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Upload en cours...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Zone d'upload
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full h-48 border-2 border-dashed border-gray-300 rounded-lg
            flex flex-col items-center justify-center cursor-pointer
            hover:border-gray-400 hover:bg-gray-50 transition-colors
            ${uploading ? 'pointer-events-none bg-gray-50' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-gray-600">Upload en cours...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{placeholder}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Glissez-déposez ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF jusqu'à {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  )
}