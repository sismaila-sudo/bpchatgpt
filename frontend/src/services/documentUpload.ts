import { createClient } from '@/lib/supabase/client'

export interface UploadedDocument {
  id: string
  project_id: string
  document_type: 'bilan' | 'compte_resultat' | 'flux_tresorerie' | 'releves_bancaires' | 'documents_fiscaux'
  file_name: string
  file_url: string
  upload_date: string
  processing_status: 'pending' | 'processing' | 'completed' | 'error'
  extracted_data?: any
}

export interface DocumentExtractionResult {
  success: boolean
  data?: any
  errors?: string[]
  confidence_score?: number
}

export class DocumentUploadService {
  private supabase = createClient()

  /**
   * Upload un document vers Supabase Storage
   */
  async uploadDocument(
    file: File,
    documentType: UploadedDocument['document_type'],
    projectId: string
  ): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${documentType}_${Date.now()}.${fileExt}`

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return { success: false, error: uploadError.message }
      }

      // Obtenir l'URL publique
      const { data: urlData } = this.supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Enregistrer en base de données
      const { error: dbError } = await this.supabase
        .from('uploaded_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          processing_status: 'pending'
        })

      if (dbError) {
        console.error('Database error:', dbError)
        return { success: false, error: dbError.message }
      }

      return { success: true, fileUrl: urlData.publicUrl }
    } catch (error) {
      console.error('Upload service error:', error)
      return { success: false, error: 'Erreur lors de l\'upload' }
    }
  }

  /**
   * Récupère les documents uploadés pour un projet
   */
  async getProjectDocuments(projectId: string): Promise<UploadedDocument[]> {
    try {
      const { data, error } = await this.supabase
        .from('uploaded_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('upload_date', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Service error:', error)
      return []
    }
  }

  /**
   * Simule l'extraction automatique de données (MVP)
   */
  async extractDocumentData(
    fileUrl: string,
    documentType: UploadedDocument['document_type']
  ): Promise<DocumentExtractionResult> {
    // Simulation d'extraction pour MVP
    // En production, ceci appellerait un service OCR/IA

    await new Promise(resolve => setTimeout(resolve, 2000)) // Simule traitement

    const mockData = this.generateMockExtractedData(documentType)

    return {
      success: true,
      data: mockData,
      confidence_score: 0.85
    }
  }

  /**
   * Génère des données simulées selon le type de document
   */
  private generateMockExtractedData(documentType: UploadedDocument['document_type']) {
    switch (documentType) {
      case 'bilan':
        return {
          actif_immobilise: 2500000,
          actif_circulant: 1200000,
          total_actif: 3700000,
          capitaux_propres: 2000000,
          dettes_financieres: 1000000,
          dettes_exploitation: 700000,
          total_passif: 3700000,
          annee: new Date().getFullYear() - 1
        }

      case 'compte_resultat':
        return {
          chiffre_affaires: 5800000,
          charges_exploitation: 4200000,
          resultat_exploitation: 1600000,
          charges_financieres: 120000,
          resultat_net: 1050000,
          annee: new Date().getFullYear() - 1
        }

      case 'flux_tresorerie':
        return {
          flux_operationnel: 1200000,
          flux_investissement: -800000,
          flux_financement: -200000,
          variation_tresorerie: 200000,
          annee: new Date().getFullYear() - 1
        }

      case 'releves_bancaires':
        return {
          solde_moyen: 450000,
          entrees_mensuelles_moyennes: 485000,
          sorties_mensuelles_moyennes: 420000,
          nb_operations_mois: 125,
          periode: '12 derniers mois'
        }

      default:
        return {}
    }
  }

  /**
   * Traite tous les documents d'un projet et génère les données business plan
   */
  async processAllDocuments(projectId: string): Promise<{
    success: boolean
    extractedData?: any
    error?: string
  }> {
    try {
      const documents = await this.getProjectDocuments(projectId)
      const extractedData: any = {}

      for (const doc of documents) {
        if (doc.processing_status === 'pending') {
          const result = await this.extractDocumentData(doc.file_url, doc.document_type)

          if (result.success && result.data) {
            extractedData[doc.document_type] = result.data

            // Mettre à jour le statut en base
            await this.supabase
              .from('uploaded_documents')
              .update({
                processing_status: 'completed',
                extracted_data: result.data
              })
              .eq('id', doc.id)
          }
        }
      }

      // Générer les données consolidées pour le business plan
      const businessPlanData = this.generateBusinessPlanData(extractedData)

      return {
        success: true,
        extractedData: businessPlanData
      }
    } catch (error) {
      console.error('Processing error:', error)
      return {
        success: false,
        error: 'Erreur lors du traitement des documents'
      }
    }
  }

  /**
   * Génère les données structurées pour le business plan
   */
  private generateBusinessPlanData(extractedData: any) {
    const currentYear = new Date().getFullYear()

    // Calculs basés sur les données extraites
    const bilans = extractedData.bilan || {}
    const cr = extractedData.compte_resultat || {}
    const flux = extractedData.flux_tresorerie || {}

    return {
      // Produits/Services (estimés à partir du CA)
      products: [{
        name: 'Produit Principal',
        unit_price: Math.round((cr.chiffre_affaires || 0) / 1000), // Prix estimé
        unit_cost: Math.round((cr.charges_exploitation || 0) / 1200), // Coût estimé
        unit: 'unité'
      }],

      // Projections de ventes (basées sur historique)
      sales_projections: Array.from({ length: 36 }, (_, i) => ({
        month: i + 1,
        year: currentYear + Math.floor(i / 12),
        volume: Math.round(100 + (i * 2)), // Croissance graduelle
        product_name: 'Produit Principal'
      })),

      // OPEX (basés sur les charges d'exploitation)
      opex: [{
        name: 'Charges d\'exploitation',
        amount: Math.round((cr.charges_exploitation || 0) / 12),
        periodicity: 'monthly',
        is_variable: false
      }],

      // Situation financière actuelle
      financial_situation: {
        actif_total: bilans.total_actif,
        capitaux_propres: bilans.capitaux_propres,
        dettes_financieres: bilans.dettes_financieres,
        ca_derniere_annee: cr.chiffre_affaires,
        resultat_net: cr.resultat_net,
        flux_tresorerie: flux.flux_operationnel
      }
    }
  }
}

export const documentUploadService = new DocumentUploadService()