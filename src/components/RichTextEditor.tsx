'use client'

import { useState } from 'react'
import { PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import ImageUpload from './ImageUpload'

interface RichTextEditorProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  allowImages?: boolean
  className?: string
}

interface ImageBlock {
  id: string
  url: string
  caption?: string
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Commencez à saisir votre contenu...',
  minHeight = 200,
  allowImages = true,
  className = ''
}: RichTextEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [images, setImages] = useState<ImageBlock[]>([])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const insertImage = (url: string) => {
    const imageId = `img_${Date.now()}`
    const newImage: ImageBlock = { id: imageId, url }
    setImages(prev => [...prev, newImage])

    // Insérer le placeholder d'image dans le texte
    const imageMarkdown = `\n\n![Image](${url})\n\n`
    onChange(value + imageMarkdown)
    setShowImageUpload(false)
  }

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId)
    if (imageToRemove) {
      // Retirer l'image du texte
      const imageMarkdown = `![Image](${imageToRemove.url})`
      const newValue = value.replace(imageMarkdown, '')
      onChange(newValue)

      // Retirer de la liste des images
      setImages(prev => prev.filter(img => img.id !== imageId))
    }
  }

  const formatText = (format: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'header':
        formattedText = `## ${selectedText}`
        break
      case 'list':
        formattedText = `- ${selectedText}`
        break
      default:
        formattedText = selectedText
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end)
    onChange(newValue)
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Barre d'outils */}
      <div className="border-b border-gray-200 p-3 flex items-center space-x-2 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100"
          title="Gras"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100"
          title="Italique"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => formatText('header')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Titre"
        >
          H
        </button>
        <button
          type="button"
          onClick={() => formatText('list')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Liste"
        >
          •
        </button>

        <div className="border-l border-gray-300 h-6 mx-2"></div>

        {allowImages && (
          <button
            type="button"
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
            title="Insérer une image"
          >
            <PhotoIcon className="h-4 w-4" />
            <span>Image</span>
          </button>
        )}
      </div>

      {/* Zone d'upload d'image */}
      {showImageUpload && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Ajouter une image</h4>
          <ImageUpload
            onChange={(url) => url && insertImage(url)}
            placeholder="Sélectionnez une image à insérer"
            className="max-w-md"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowImageUpload(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Zone d'édition */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          style={{ minHeight: `${minHeight}px` }}
          className="w-full p-4 resize-none focus:outline-none focus:ring-0 border-0 rounded-b-lg"
        />

        {/* Indicateur de format */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          <DocumentTextIcon className="h-4 w-4 inline mr-1" />
          Markdown supporté
        </div>
      </div>

      {/* Aperçu des images insérées */}
      {images.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Images dans ce contenu :</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt="Contenu"
                  className="w-full h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer cette image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}