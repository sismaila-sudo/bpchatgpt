import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import pdf from 'pdf-parse'
import { DocumentAnalysisResult, OpenAIService } from './openaiService'
import { DocumentUpload } from '@/types/document'

export class DocumentServiceServer {

  // Upload un document vers Firebase Storage
  static async uploadDocument(
    projectId: string,
    file: File,
    userId: string
  ): Promise<{ documentId: string; downloadUrl: string }> {
    try {
      const documentId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const storageRef = ref(storage, `projects/${projectId}/documents/${documentId}`)

      const snapshot = await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(snapshot.ref)

      return { documentId, downloadUrl }
    } catch (error) {
      console.error('Erreur upload document:', error)
      throw new Error('Erreur lors de l\'upload du document')
    }
  }

  // Extraire le texte d'un fichier
  static async extractTextFromFile(file: File): Promise<string> {
    try {
      const fileType = file.type

      if (fileType === 'application/pdf') {
        return await this.extractTextFromPDF(file)
      } else if (fileType.includes('text/') || fileType.includes('csv')) {
        return await this.extractTextFromText(file)
      } else if (fileType.includes('sheet') || fileType.includes('excel')) {
        // Pour Excel, on va extraire ce qu'on peut comme texte
        return await this.extractTextFromText(file)
      } else {
        throw new Error('Type de fichier non supporté')
      }
    } catch (error) {
      console.error('Erreur extraction texte:', error)
      throw new Error('Impossible d\'extraire le texte du fichier')
    }
  }

  // Extraire texte d'un PDF
  private static async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const data = await pdf(Buffer.from(arrayBuffer))
      return data.text
    } catch (error) {
      console.error('Erreur extraction PDF:', error)
      throw new Error('Erreur lors de la lecture du PDF')
    }
  }

  // Extraire texte d'un fichier texte
  private static async extractTextFromText(file: File): Promise<string> {
    try {
      return await file.text()
    } catch (error) {
      console.error('Erreur extraction texte:', error)
      throw new Error('Erreur lors de la lecture du fichier texte')
    }
  }

  // Process complet : Upload + Extraction + Analyse
  static async processDocument(
    projectId: string,
    file: File,
    userId: string
  ): Promise<{ document: DocumentUpload; analysis: DocumentAnalysisResult }> {
    try {
      // 1. Upload vers Firebase
      const { documentId, downloadUrl } = await this.uploadDocument(projectId, file, userId)

      // 2. Extraction du texte
      const documentText = await this.extractTextFromFile(file)

      // 3. Analyse IA
      const analysis = await OpenAIService.analyzeDocument(documentText, file.name)

      // 4. Création de l'objet document
      const document: DocumentUpload = {
        id: documentId,
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date(),
        downloadUrl,
        analysisResult: analysis,
        status: 'completed'
      }

      return { document, analysis }
    } catch (error) {
      console.error('Erreur traitement document:', error)
      throw error
    }
  }

  // Supprimer un document
  static async deleteDocument(projectId: string, documentId: string): Promise<void> {
    try {
      const storageRef = ref(storage, `projects/${projectId}/documents/${documentId}`)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Erreur suppression document:', error)
      throw new Error('Erreur lors de la suppression du document')
    }
  }

  // Valider le type de fichier
  static validateFile(file: File): { valid: boolean; error?: string } {
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
}