'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Upload,
  FileSpreadsheet,
  Building2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { documentUploadService } from '@/services/documentUpload'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function ImportPage() {
  const [step, setStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [newProjectId, setNewProjectId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const requiredDocuments = [
    {
      name: 'Bilans (3 dernières années)',
      description: 'Bilans comptables N, N-1, N-2',
      icon: FileSpreadsheet,
      type: 'bilan' as const,
      uploaded: false,
      required: true
    },
    {
      name: 'Comptes de résultat (3 années)',
      description: 'CR N, N-1, N-2',
      icon: BarChart3,
      type: 'compte_resultat' as const,
      uploaded: false,
      required: true
    },
    {
      name: 'Tableaux de flux de trésorerie',
      description: 'Flux de trésorerie sur 3 ans',
      icon: DollarSign,
      type: 'flux_tresorerie' as const,
      uploaded: false,
      required: true
    },
    {
      name: 'Relevés bancaires',
      description: '12 derniers mois',
      icon: FileText,
      type: 'releves_bancaires' as const,
      uploaded: false,
      required: true
    },
    {
      name: 'Documents fiscaux',
      description: 'Liasses fiscales, TVA',
      icon: FileSpreadsheet,
      type: 'documents_fiscaux' as const,
      uploaded: false,
      required: false
    }
  ]

  // Créer un projet pour l'entreprise en activité
  const createExistingCompanyProject = async () => {
    if (!user) return null

    try {
      // Créer ou récupérer l'organisation par défaut de l'utilisateur
      let organization_id: string

      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .single()

      if (existingOrg) {
        organization_id = existingOrg.id
      } else {
        // Créer une organisation par défaut pour l'utilisateur
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `Organisation de ${user.user_metadata?.full_name || user.email}`,
            slug: `org-${user.id.slice(0, 8)}`,
            created_by: user.id
          })
          .select()
          .single()

        if (orgError) throw orgError
        organization_id = newOrg.id
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id,
          name: `Entreprise en Activité - ${new Date().toLocaleDateString('fr-FR')}`,
          sector: 'À définir',
          mode: 'existing-company', // Mode explicite pour entreprise en activité
          start_date: new Date().toISOString().split('T')[0],
          horizon_years: 3,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter l'utilisateur comme collaborateur admin du projet
      await supabase
        .from('project_collaborators')
        .insert({
          project_id: data.id,
          user_id: user.id,
          role: 'admin',
          invited_by: user.id,
          accepted_at: new Date().toISOString()
        })

      return data.id
    } catch (error) {
      console.error('Erreur création projet entreprise en activité:', error)
      return null
    }
  }

  const handleFileUpload = async (docName: string, docType: string) => {
    const input = fileInputRefs.current[docName]
    if (!input) return

    input.click()

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploadProgress(prev => ({ ...prev, [docName]: true }))

      try {
        // Créer un projet si pas encore fait
        let projectId = newProjectId
        if (!projectId) {
          projectId = await createExistingCompanyProject()
          if (!projectId) throw new Error('Impossible de créer le projet')
          setNewProjectId(projectId)
        }

        // Upload le document
        const result = await documentUploadService.uploadDocument(
          file,
          docType as any,
          projectId
        )

        if (result.success) {
          setUploadedFiles(prev => [...prev, docName])
        } else {
          alert(result.error || 'Erreur lors de l\'upload')
        }
      } catch (error) {
        console.error('Erreur upload:', error)
        alert('Erreur lors de l\'upload du fichier')
      } finally {
        setUploadProgress(prev => ({ ...prev, [docName]: false }))
      }
    }
  }

  const handleProcessDocuments = async () => {
    if (!newProjectId) return

    setIsProcessing(true)
    setStep(2)

    try {
      // Simuler le traitement avec des étapes visibles
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Traiter les documents
      const result = await documentUploadService.processAllDocuments(newProjectId)

      if (result.success && result.extractedData) {
        // Pré-remplir le projet avec les données extraites
        await populateProjectData(newProjectId, result.extractedData)

        await new Promise(resolve => setTimeout(resolve, 1000))
        setStep(3)
      } else {
        throw new Error(result.error || 'Erreur de traitement')
      }
    } catch (error) {
      console.error('Erreur traitement:', error)
      alert('Erreur lors du traitement des documents')
      setStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  const populateProjectData = async (projectId: string, extractedData: any) => {
    try {
      // Insérer les produits
      if (extractedData.products?.length > 0) {
        await supabase
          .from('products_services')
          .insert(extractedData.products.map((p: any) => ({
            ...p,
            project_id: projectId
          })))
      }

      // Insérer les projections de ventes
      if (extractedData.sales_projections?.length > 0) {
        await supabase
          .from('sales_projections')
          .insert(extractedData.sales_projections.map((s: any) => ({
            ...s,
            project_id: projectId
          })))
      }

      // Insérer les OPEX
      if (extractedData.opex?.length > 0) {
        await supabase
          .from('opex')
          .insert(extractedData.opex.map((o: any) => ({
            ...o,
            project_id: projectId
          })))
      }
    } catch (error) {
      console.error('Erreur population données:', error)
    }
  }

  const canProceed = requiredDocuments
    .filter(doc => doc.required)
    .every(doc => uploadedFiles.includes(doc.name))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/projects/new/select"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour à la sélection
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Entreprise en Activité</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Étape {step}/3</span>
              <div className="flex items-center space-x-1">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`w-2 h-2 rounded-full ${
                      step >= num ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Import Documents</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Traitement IA</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Business Plan</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Entreprise en Activité
              </h1>
              <p className="text-lg text-gray-600">
                Importez vos documents comptables pour générer automatiquement votre business plan
              </p>
            </div>

            {/* Alert Box */}
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800">Fonctionnalité disponible !</h3>
                    <p className="text-green-700 text-sm mt-1">
                      Téléchargez vos documents comptables et notre IA va automatiquement extraire les données
                      pour pré-remplir votre business plan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-600" />
                  Documents requis
                </CardTitle>
                <CardDescription>
                  Téléchargez vos documents comptables pour l'analyse automatique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredDocuments.map((doc, index) => {
                  const Icon = doc.icon
                  const isUploaded = uploadedFiles.includes(doc.name)

                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-6 w-6 ${isUploaded ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            {doc.required && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                Requis
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : uploadProgress[doc.name] ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        ) : (
                          <>
                            <input
                              ref={(el) => {
                                fileInputRefs.current[doc.name] = el
                              }}
                              type="file"
                              accept=".pdf,.xlsx,.xls,.csv"
                              className="hidden"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFileUpload(doc.name, doc.type)}
                              disabled={false}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {uploadedFiles.length} / {requiredDocuments.filter(d => d.required).length} documents requis téléchargés
                    </div>
                    <Button
                      onClick={handleProcessDocuments}
                      disabled={!canProceed}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continuer vers l'analyse
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Traitement automatique en cours
              </CardTitle>
              <CardDescription>
                Notre IA analyse vos documents comptables...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-4">Analyse des documents en cours...</p>
              <div className="max-w-md mx-auto space-y-2 text-sm text-gray-500">
                <div>✓ Extraction des données bilans</div>
                <div>✓ Analyse des comptes de résultat</div>
                <div>⏳ Calcul des ratios financiers</div>
                <div>⏳ Génération des projections</div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Business Plan généré !
              </CardTitle>
              <CardDescription>
                Votre business plan a été créé automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Votre business plan est prêt !
              </p>
              <p className="text-gray-600 mb-6">
                Tous vos onglets ont été remplis automatiquement avec vos données.
              </p>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => router.push(newProjectId ? `/projects/${newProjectId}` : '/projects')}
              >
                Voir mon business plan
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}