'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  FileText,
  ArrowRight,
  Upload,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function ProjectModeSelectionPage() {
  const [selectedMode, setSelectedMode] = useState<'new-company' | 'existing-company' | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Rediriger si pas connecté
  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleContinue = async () => {
    if (!selectedMode) return

    try {
      // Créer le projet directement selon le type
      const projectData = {
        user_id: user.id,
        name: selectedMode === 'new-company'
          ? `Nouvelle Entreprise - ${new Date().toLocaleDateString('fr-FR')}`
          : `Entreprise en Activité - ${new Date().toLocaleDateString('fr-FR')}`,
        company_type: selectedMode === 'new-company' ? 'new' : 'existing',
        status: 'active',
        sector: 'Services',
        start_date: new Date().toISOString().split('T')[0],
        horizon_years: 3,
        mode: selectedMode === 'new-company' ? 'new-company' : 'existing-company'
      }


      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      const { project } = await response.json()

      // Rediriger vers le projet avec le bon onglet par défaut
      if (selectedMode === 'new-company') {
        router.push(`/projects/${project.id}`)
      } else {
        router.push(`/projects/${project.id}?tab=existing-analysis`)
      }

    } catch (error) {
      console.error('Erreur création projet:', error)
      alert('Erreur lors de la création du projet: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Nouveau Projet</h1>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Étape 1/2
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Quel type de projet souhaitez-vous créer ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choisissez le type qui correspond à votre situation pour bénéficier
              d'un accompagnement personnalisé et des outils adaptés.
            </p>
          </div>

          {/* Options */}
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8">
              <RadioGroup
                value={selectedMode || ''}
                onValueChange={(value) => setSelectedMode(value as 'new-company' | 'existing-company')}
                className="space-y-6"
              >
                {/* Nouvelle Entreprise */}
                <div className="space-y-2">
                  <Label
                    htmlFor="new-company"
                    className={`flex items-start space-x-4 p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      selectedMode === 'new-company'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="new-company" id="new-company" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Nouvelle Entreprise</h3>
                          <p className="text-sm text-gray-600">Création ou startup</p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">
                        Vous créez une nouvelle entreprise, une startup ou lancez une nouvelle activité.
                        Nous vous accompagnons depuis l'idée jusqu'au business plan complet.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            Inclus dans cette option :
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <FileText className="h-3 w-3 text-gray-400 mr-2" />
                              Modélisation financière complète
                            </li>
                            <li className="flex items-center">
                              <TrendingUp className="h-3 w-3 text-gray-400 mr-2" />
                              Projections et ratios
                            </li>
                            <li className="flex items-center">
                              <Building2 className="h-3 w-3 text-gray-400 mr-2" />
                              Fiche synoptique FONGIP
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Clock className="h-4 w-4 text-blue-500 mr-2" />
                            Temps estimé :
                          </h4>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-800">1-2 heures</p>
                            <p className="text-xs text-green-600">Configuration rapide</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Entreprise Existante */}
                <div className="space-y-2">
                  <Label
                    htmlFor="existing-company"
                    className={`flex items-start space-x-4 p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      selectedMode === 'existing-company'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="existing-company" id="existing-company" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Entreprise en Activité</h3>
                          <p className="text-sm text-gray-600">Expansion ou développement</p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">
                        Votre entreprise existe déjà et vous souhaitez développer une nouvelle activité,
                        vous étendre ou obtenir un financement. Nous analysons vos données historiques.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Upload className="h-4 w-4 text-blue-500 mr-2" />
                            Documents à préparer :
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <FileText className="h-3 w-3 text-gray-400 mr-2" />
                              Bilans (3 dernières années)
                            </li>
                            <li className="flex items-center">
                              <TrendingUp className="h-3 w-3 text-gray-400 mr-2" />
                              Comptes de résultat
                            </li>
                            <li className="flex items-center">
                              <Building2 className="h-3 w-3 text-gray-400 mr-2" />
                              Relevés bancaires
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Clock className="h-4 w-4 text-blue-500 mr-2" />
                            Temps estimé :
                          </h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-800">2-3 heures</p>
                            <p className="text-xs text-blue-600">Analyse approfondie</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-center pt-6">
            <Button
              onClick={handleContinue}
              disabled={!selectedMode}
              size="lg"
              className="px-8 py-3 text-lg font-semibold"
            >
              <span>Continuer</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Info Box */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-indigo-900 mb-2">
                      Pas sûr de votre choix ?
                    </h3>
                    <p className="text-sm text-indigo-700">
                      Vous pourrez toujours modifier le type de projet plus tard.
                      Les deux options génèrent un business plan complet conforme aux standards FONGIP.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}