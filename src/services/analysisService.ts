import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { ProjectAnalysis, UploadedDocument, CreditAnalysisResult } from '@/types/analysis'

const COLLECTION_NAME = 'projectAnalyses'

class AnalysisService {
  // Créer une nouvelle analyse
  async createAnalysis(
    userId: string,
    projectName: string,
    description?: string
  ): Promise<string> {
    const analysisRef = doc(collection(db, COLLECTION_NAME))
    const analysisId = analysisRef.id

    const newAnalysis: Omit<ProjectAnalysis, 'id'> = {
      userId,
      projectName,
      description,
      uploadedDocuments: [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await setDoc(analysisRef, {
      ...newAnalysis,
      createdAt: Timestamp.fromDate(newAnalysis.createdAt),
      updatedAt: Timestamp.fromDate(newAnalysis.updatedAt)
    })

    return analysisId
  }

  // Upload des documents
  async uploadDocuments(
    analysisId: string,
    files: File[]
  ): Promise<UploadedDocument[]> {
    const uploadedDocs: UploadedDocument[] = []

    for (const file of files) {
      const storageRef = ref(storage, `analyses/${analysisId}/${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      uploadedDocs.push({
        name: file.name,
        url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      })
    }

    // Mettre à jour l'analyse avec les documents
    const analysisRef = doc(db, COLLECTION_NAME, analysisId)
    await updateDoc(analysisRef, {
      uploadedDocuments: uploadedDocs.map(doc => ({
        ...doc,
        uploadedAt: Timestamp.fromDate(doc.uploadedAt)
      })),
      updatedAt: Timestamp.now()
    })

    return uploadedDocs
  }

  // Mettre à jour le statut de l'analyse
  async updateAnalysisStatus(
    analysisId: string,
    status: ProjectAnalysis['status'],
    error?: string
  ): Promise<void> {
    const analysisRef = doc(db, COLLECTION_NAME, analysisId)
    await updateDoc(analysisRef, {
      status,
      ...(error && { error }),
      updatedAt: Timestamp.now()
    })
  }

  // Sauvegarder le résultat de l'analyse IA
  async saveAnalysisResult(
    analysisId: string,
    aiAnalysis: CreditAnalysisResult
  ): Promise<void> {
    const analysisRef = doc(db, COLLECTION_NAME, analysisId)
    await updateDoc(analysisRef, {
      aiAnalysis,
      status: 'completed',
      updatedAt: Timestamp.now()
    })
  }

  // Récupérer une analyse par ID
  async getAnalysis(analysisId: string): Promise<ProjectAnalysis | null> {
    const analysisRef = doc(db, COLLECTION_NAME, analysisId)
    const analysisSnap = await getDoc(analysisRef)

    if (!analysisSnap.exists()) {
      return null
    }

    const data = analysisSnap.data()
    return {
      id: analysisSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      uploadedDocuments: data.uploadedDocuments?.map((doc: any) => ({
        ...doc,
        uploadedAt: doc.uploadedAt?.toDate() || new Date()
      })) || []
    } as ProjectAnalysis
  }

  // Récupérer toutes les analyses d'un utilisateur
  async getUserAnalyses(
    userId: string,
    includeArchived: boolean = false
  ): Promise<ProjectAnalysis[]> {
    const analysesRef = collection(db, COLLECTION_NAME)
    const conditions = [
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    ]

    if (!includeArchived) {
      conditions.splice(1, 0, where('status', '!=', 'archived'))
    }

    const q = query(analysesRef, ...conditions)
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        uploadedDocuments: data.uploadedDocuments?.map((doc: any) => ({
          ...doc,
          uploadedAt: doc.uploadedAt?.toDate() || new Date()
        })) || []
      } as ProjectAnalysis
    })
  }

  // Archiver une analyse
  async archiveAnalysis(analysisId: string): Promise<void> {
    const analysisRef = doc(db, COLLECTION_NAME, analysisId)
    await updateDoc(analysisRef, {
      status: 'archived',
      updatedAt: Timestamp.now()
    })
  }

  // Supprimer une analyse (et ses documents)
  async deleteAnalysis(analysisId: string): Promise<void> {
    // Récupérer l'analyse pour obtenir les documents
    const analysis = await this.getAnalysis(analysisId)

    if (analysis) {
      // Supprimer les documents du storage
      for (const doc of analysis.uploadedDocuments) {
        try {
          const storageRef = ref(storage, `analyses/${analysisId}/${doc.name}`)
          await deleteObject(storageRef)
        } catch (error) {
          console.error(`Erreur lors de la suppression du document ${doc.name}:`, error)
        }
      }
    }

    // Supprimer le document Firestore
    const analysisRef = doc(db, COLLECTION_NAME, analysisId)
    await deleteDoc(analysisRef)
  }

  // Obtenir les statistiques d'un analyste
  async getAnalystStats(userId: string): Promise<{
    total: number
    completed: number
    pending: number
    archived: number
  }> {
    const analyses = await this.getUserAnalyses(userId, true)

    return {
      total: analyses.length,
      completed: analyses.filter(a => a.status === 'completed').length,
      pending: analyses.filter(a => a.status === 'pending' || a.status === 'processing').length,
      archived: analyses.filter(a => a.status === 'archived').length
    }
  }
}

export const analysisService = new AnalysisService()