'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, X, AlertTriangle, Users, Building, FileText } from 'lucide-react'
import Link from 'next/link'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = []

    // Test 1: Authentification utilisateur
    try {
      if (user) {
        results.push({
          name: "Authentification utilisateur",
          status: "success",
          message: "Utilisateur connecté avec succès",
          details: `Email: ${user.email}, ID: ${user.id.slice(0, 8)}...`
        })
      } else {
        results.push({
          name: "Authentification utilisateur",
          status: "error",
          message: "Aucun utilisateur connecté",
          details: "Vous devez être connecté pour effectuer les tests"
        })
      }
    } catch (error) {
      results.push({
        name: "Authentification utilisateur",
        status: "error",
        message: "Erreur lors de la vérification de l'authentification",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      })
    }

    if (user) {
      // Test 2: Connexion à la base de données
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('count(*)')
          .eq('created_by', user.id)

        if (error) throw error

        results.push({
          name: "Connexion base de données",
          status: "success",
          message: "Connexion Supabase établie",
          details: `Projets trouvés pour l'utilisateur: ${data?.length || 0}`
        })
      } catch (error) {
        results.push({
          name: "Connexion base de données",
          status: "error",
          message: "Erreur de connexion à Supabase",
          details: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }

      // Test 3: Permissions sur les organisations
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('created_by', user.id)

        if (error) throw error

        results.push({
          name: "Accès aux organisations",
          status: "success",
          message: "Permissions organisations valides",
          details: `Organisations accessibles: ${data?.length || 0}`
        })
      } catch (error) {
        results.push({
          name: "Accès aux organisations",
          status: "warning",
          message: "Problème d'accès aux organisations",
          details: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }

      // Test 4: Permissions collaborateurs
      try {
        const { data, error } = await supabase
          .from('project_collaborators')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error

        results.push({
          name: "Système de collaboration",
          status: "success",
          message: "Permissions collaborateurs fonctionnelles",
          details: `Collaborations actives: ${data?.length || 0}`
        })
      } catch (error) {
        results.push({
          name: "Système de collaboration",
          status: "warning",
          message: "Problème avec les collaborations",
          details: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }

      // Test 5: Métadonnées utilisateur
      try {
        const metadata = user.user_metadata
        const hasProfile = metadata?.first_name || metadata?.last_name || metadata?.full_name

        results.push({
          name: "Profil utilisateur",
          status: hasProfile ? "success" : "warning",
          message: hasProfile ? "Profil utilisateur complet" : "Profil utilisateur partiellement rempli",
          details: `Métadonnées: ${Object.keys(metadata || {}).join(', ') || 'Aucune'}`
        })
      } catch (error) {
        results.push({
          name: "Profil utilisateur",
          status: "error",
          message: "Erreur lors de la lecture du profil",
          details: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }

      // Test 6: API Backend (optionnel)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
        if (response.ok) {
          results.push({
            name: "API Backend",
            status: "success",
            message: "Backend API accessible",
            details: `URL: ${process.env.NEXT_PUBLIC_API_URL}`
          })
        } else {
          throw new Error(`Status: ${response.status}`)
        }
      } catch (error) {
        results.push({
          name: "API Backend",
          status: "warning",
          message: "Backend API non accessible",
          details: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }
    }

    setTests(results)
    setIsRunning(false)
  }

  useEffect(() => {
    if (!loading && user) {
      runTests()
    }
  }, [user, loading])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <X className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const warningCount = tests.filter(t => t.status === 'warning').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              Accès Refusé
            </CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder aux tests d'authentification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Tests d'Authentification
              </h1>
            </div>
            <div className="flex space-x-4">
              <Button onClick={runTests} disabled={isRunning}>
                {isRunning ? 'Tests en cours...' : 'Relancer les tests'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Retour</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Succès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Avertissements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Erreurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Résultats des tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Résultats des Tests
            </CardTitle>
            <CardDescription>
              Vérification du bon fonctionnement du système d'authentification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRunning ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Tests en cours...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun test exécuté</p>
                <Button onClick={runTests} className="mt-4">
                  Lancer les tests
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map((test, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(test.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">
                          {test.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {test.message}
                        </p>
                        {test.details && (
                          <p className="text-xs text-gray-500 mt-2 font-mono bg-white p-2 rounded border">
                            {test.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions recommandées */}
        {tests.some(t => t.status === 'error' || t.status === 'warning') && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-yellow-600">Actions Recommandées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {errorCount > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Erreurs détectées :</strong> Vérifiez la configuration Supabase et les variables d'environnement
                    </AlertDescription>
                  </Alert>
                )}
                {warningCount > 0 && (
                  <Alert>
                    <AlertDescription>
                      <strong>Avertissements :</strong> Certaines fonctionnalités peuvent nécessiter une configuration supplémentaire
                    </AlertDescription>
                  </Alert>
                )}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Étapes de dépannage :</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Vérifiez le fichier .env.local</li>
                    <li>Confirmez la configuration Supabase</li>
                    <li>Exécutez les scripts SQL de migration</li>
                    <li>Vérifiez que le backend API est démarré</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/profile">
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Mon Profil</div>
                    <div className="text-sm text-gray-500">Gérer mes informations</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/projects/new">
                  <Building className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Nouveau Projet</div>
                    <div className="text-sm text-gray-500">Créer un business plan</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/">
                  <FileText className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Tableau de Bord</div>
                    <div className="text-sm text-gray-500">Voir mes projets</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}