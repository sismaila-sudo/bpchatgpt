'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ImagePlus,
  Upload,
  Trash2,
  Eye,
  Move,
  FileImage,
  Maximize,
  PanelRight,
  Minus
} from 'lucide-react'
import { documentTemplateService, SectionImage } from '@/services/documentTemplateService'
import { toast } from 'sonner'

interface SectionImageManagerProps {
  sectionId: string
  className?: string
}

export function SectionImageManager({ sectionId, className = '' }: SectionImageManagerProps) {
  const [images, setImages] = useState<SectionImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<SectionImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // États pour l'upload
  const [newImageCaption, setNewImageCaption] = useState('')
  const [newImagePosition, setNewImagePosition] = useState<'inline' | 'full-width' | 'side'>('inline')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadImages()
  }, [sectionId])

  const loadImages = async () => {
    setLoading(true)
    try {
      const data = await documentTemplateService.getSectionImages(sectionId)
      setImages(data)
    } catch (error) {
      console.error('Erreur chargement images:', error)
      toast.error('Erreur lors du chargement des images')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image')
        return
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB')
        return
      }

      setSelectedFile(file)
      setUploadDialogOpen(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const newImage = await documentTemplateService.uploadSectionImage(
        sectionId,
        selectedFile,
        newImageCaption,
        newImagePosition
      )

      setImages(prev => [...prev, newImage])
      toast.success('Image uploadée avec succès')

      // Reset
      setSelectedFile(null)
      setNewImageCaption('')
      setNewImagePosition('inline')
      setUploadDialogOpen(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erreur upload:', error)
      toast.error('Erreur lors de l\'upload de l\'image')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      await documentTemplateService.deleteSectionImage(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('Image supprimée')
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'full-width':
        return <Maximize className="h-4 w-4" />
      case 'side':
        return <PanelRight className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'full-width':
        return 'Pleine largeur'
      case 'side':
        return 'Côté'
      default:
        return 'En ligne'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <FileImage className="h-5 w-5" />
          <span>Images de la section</span>
          <Badge variant="outline">{images.length}</Badge>
        </h3>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2"
          >
            <ImagePlus className="h-4 w-4" />
            <span>Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Liste des images */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileImage className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune image
            </h3>
            <p className="text-gray-600 mb-4">
              Ajoutez des images pour enrichir cette section de votre business plan
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <ImagePlus className="h-4 w-4" />
              <span>Ajouter la première image</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={image.file_url}
                  alt={image.caption || image.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedImage(image)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{image.caption || image.file_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <img
                          src={image.file_url}
                          alt={image.caption || image.file_name}
                          className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Position :</span>
                            <div className="flex items-center space-x-1 mt-1">
                              {getPositionIcon(image.position)}
                              <span>{getPositionLabel(image.position)}</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Taille :</span>
                            <div className="mt-1">{formatFileSize(image.file_size)}</div>
                          </div>
                        </div>
                        {image.caption && (
                          <div>
                            <span className="font-medium">Légende :</span>
                            <p className="mt-1 text-gray-600">{image.caption}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer l'image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm truncate">
                        {image.caption || image.file_name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.file_size)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getPositionIcon(image.position)}
                      <Badge variant="outline" className="text-xs">
                        {getPositionLabel(image.position)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog d'upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <div className="space-y-4">
                {/* Preview de l'image */}
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Informations du fichier */}
                <div className="text-sm text-gray-600">
                  <strong>Fichier :</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>

                {/* Légende */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Légende (optionnel)</Label>
                  <Textarea
                    id="caption"
                    value={newImageCaption}
                    onChange={(e) => setNewImageCaption(e.target.value)}
                    placeholder="Description de l'image..."
                    rows={2}
                  />
                </div>

                {/* Position */}
                <div className="space-y-3">
                  <Label>Position dans le document</Label>
                  <RadioGroup
                    value={newImagePosition}
                    onValueChange={(value) => setNewImagePosition(value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inline" id="inline" />
                      <Label htmlFor="inline" className="flex items-center space-x-2">
                        <Minus className="h-4 w-4" />
                        <span>En ligne avec le texte</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full-width" id="full-width" />
                      <Label htmlFor="full-width" className="flex items-center space-x-2">
                        <Maximize className="h-4 w-4" />
                        <span>Pleine largeur</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="side" id="side" />
                      <Label htmlFor="side" className="flex items-center space-x-2">
                        <PanelRight className="h-4 w-4" />
                        <span>Sur le côté</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={uploading}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Upload...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Ajouter</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}