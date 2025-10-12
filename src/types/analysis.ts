export interface UploadedDocument {
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Date
}

export interface SourcesEmplois {
  sources: {
    description: string
    montant: number
  }[]
  emplois: {
    description: string
    montant: number
  }[]
  totalSources: number
  totalEmplois: number
}

export interface RiskItem {
  type: string
  description: string
  mitigation: string
  severity?: 'low' | 'medium' | 'high'
}

export interface FinancialRatios {
  dscr: {
    [year: string]: number
  }
  autonomieFinanciere?: number
  liquiditeGenerale?: number
  fondsRoulement?: number
}

export interface ProjectionData {
  year: number
  ca: number
  ebe?: number
  caf?: number
  dscr?: number
}

export type DecisionType = 'approve' | 'conditional' | 'decline'

export interface CreditAnalysisResult {
  decision: DecisionType
  reasons: string[]
  requestedFacilities: {
    type: string
    montant: number
    taux: number
    tenor: number
    differe?: number
  }[]
  sourcesEmplois: SourcesEmplois
  ratios: FinancialRatios
  tri?: number
  van?: number
  payback?: string
  projections?: ProjectionData[]
  risks: RiskItem[]
  mitigants: string[]
  covenants: string[]
  evidence: string[]
  noteDeCredit: string // Version textuelle complète
}

export interface ProjectAnalysis {
  id: string
  userId: string
  projectName: string
  description?: string
  uploadedDocuments: UploadedDocument[]
  aiAnalysis?: CreditAnalysisResult
  status: 'pending' | 'processing' | 'completed' | 'archived' | 'error'
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateAnalysisInput {
  projectName: string
  description?: string
  documents: File[]
}