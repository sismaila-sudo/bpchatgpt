'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { ExcelImportService } from '@/services/excelImport'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projectId: string
  type: 'products' | 'sales' | 'opex' | 'capex'
}

const importConfig = {
  products: {
    title: 'Importer des produits/services',
    description: 'Importez vos produits depuis un fichier Excel',
    template: 'Template_Produits.xlsx',
    columns: ['Nom', 'Prix unitaire', 'Coût unitaire', 'Unité'],
    generateTemplate: () => ExcelImportService.generateProductTemplate(),
    importFunction: (file: File, projectId: string) => ExcelImportService.importProducts(file, projectId)
  },
  sales: {
    title: 'Importer des projections de ventes',
    description: 'Importez vos projections de ventes depuis un fichier Excel',
    template: 'Template_Ventes.xlsx',
    columns: ['Produit', 'Année', 'Mois', 'Volume'],
    generateTemplate: () => ExcelImportService.generateSalesTemplate(),
    importFunction: (file: File, projectId: string) => ExcelImportService.importSalesProjections(file, projectId)
  },
  opex: {
    title: 'Importer des charges OPEX',
    description: 'Importez vos charges opérationnelles depuis un fichier Excel',
    template: 'Template_OPEX.xlsx',
    columns: ['Nom', 'Montant', 'Fréquence', 'Catégorie', 'Année début'],
    generateTemplate: () => ExcelImportService.generateOpexTemplate(),
    importFunction: (file: File, projectId: string) => ExcelImportService.importOpex(file, projectId)
  },
  capex: {
    title: 'Importer des investissements CAPEX',
    description: 'Importez vos investissements depuis un fichier Excel',
    template: 'Template_CAPEX.xlsx',
    columns: ['Nom', 'Montant', 'Catégorie', 'Année achat', 'Durée amortissement', 'Valeur résiduelle'],
    generateTemplate: () => ExcelImportService.generateCapexTemplate(),
    importFunction: (file: File, projectId: string) => ExcelImportService.importCapex(file, projectId)
  }
}

export function ImportDialog({ isOpen, onClose, onSuccess, projectId, type }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [step, setStep] = useState<'select' | 'result'>('select')

  const config = importConfig[type]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
      setStep('select')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImporting(true)
    try {
      const result = await config.importFunction(selectedFile, projectId)
      setImportResult(result)
      setStep('result')

      if (result.success) {
        // Attendre un peu avant de fermer automatiquement
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur import:', error)
      setImportResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', message: 'Erreur lors de l\'import' }]
      })
      setStep('result')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setStep('select')
    onClose()
  }

  const handleDownloadTemplate = () => {
    config.generateTemplate()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
          <Button variant="outline" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {step === 'select' && (
          <div className="space-y-6">
            <p className="text-gray-600">{config.description}</p>

            {/* Template download */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Download className="h-5 w-5 mr-2 text-blue-600" />
                  1. Télécharger le template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Téléchargez notre template Excel avec la structure requise :
                </p>
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <p className="text-sm font-medium">Colonnes requises :</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {config.columns.map((col, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                <Button onClick={handleDownloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger {config.template}
                </Button>
              </CardContent>
            </Card>

            {/* File upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-green-600" />
                  2. Sélectionner votre fichier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Glissez-déposez votre fichier Excel ici ou cliquez pour sélectionner
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Fichier sélectionné : {selectedFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import button */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {importing ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Lancer l'import
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            {/* Résultat */}
            <div className={`p-4 rounded-md ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <h3 className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.success ? 'Import réussi !' : 'Erreurs détectées'}
                </h3>
              </div>
              <p className={`mt-1 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {importResult.success
                  ? `${importResult.imported} éléments importés avec succès`
                  : `${importResult.errors.length} erreurs détectées`
                }
              </p>
            </div>

            {/* Erreurs */}
            {importResult.errors && importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">Erreurs détectées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error: any, index: number) => (
                      <div key={index} className="p-2 bg-red-50 rounded text-sm">
                        <span className="font-medium text-red-800">
                          Ligne {error.row}
                        </span>
                        {error.field !== 'general' && (
                          <span className="text-red-600"> - {error.field}</span>
                        )}
                        <span className="text-red-700"> : {error.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              {!importResult.success && (
                <Button onClick={() => setStep('select')} className="bg-blue-600 hover:bg-blue-700">
                  Réessayer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}