import { DocumentAnalysisResult } from '@/services/openaiService'

export interface DocumentUpload {
  id: string
  projectId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  downloadUrl: string
  analysisResult?: DocumentAnalysisResult
  status: 'uploading' | 'analyzing' | 'completed' | 'error'
}