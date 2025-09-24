'use client'

import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, FileText, BarChart3, Users, TrendingUp, Eye, UserPlus, Building2 } from 'lucide-react'
import { RecentProjects } from '@/components/RecentProjects'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const stats = useDashboardStats(user)

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Business Plan Generator</CardTitle>
            <CardDescription>
              Transformez vos données en business plans bancables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/login">Se connecter</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/register">Créer un compte</Link>
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              En vous connectant, vous acceptez nos conditions d'utilisation
            </p>
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Business Plan Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {user.email}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">
                  Profil
                </Link>
              </Button>
              <Button variant="outline" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord
          </h2>
          <p className="text-gray-600">
            Créez et gérez vos business plans professionnels
          </p>
        </div>

        {/* Statistics Cards - Seulement 2 KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-lg font-medium">Total Projets</p>
                  <p className="text-4xl font-bold mt-2">{stats.loading ? '...' : stats.totalProjects}</p>
                  <p className="text-blue-100 text-sm mt-1">Tous statuts confondus</p>
                </div>
                <FileText className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-lg font-medium">Projets en Cours</p>
                  <p className="text-4xl font-bold mt-2">{stats.loading ? '...' : stats.activeProjects}</p>
                  <p className="text-emerald-100 text-sm mt-1">Brouillon + En création</p>
                </div>
                <TrendingUp className="h-12 w-12 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gros bouton Nouveau Projet centré */}
        <div className="text-center mb-12">
          <Link href="/projects/new">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-12 py-6 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <PlusCircle className="h-8 w-8 mr-4" />
              Nouveau Projet
            </Button>
          </Link>
          <p className="text-gray-600 mt-4 text-lg">
            Créez un nouveau business plan adapté au modèle bancaire sénégalais
          </p>
        </div>

        {/* Actions secondaires */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
            <Link href="/projects">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-blue-50 border-blue-200 w-full">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-blue-800">
                    Tous mes Projets
                  </CardTitle>
                  <FileText className="h-6 w-6 text-blue-600 ml-auto" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700">
                    Gérer l'ensemble de vos business plans
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects?filter=archived">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-gray-50 border-gray-200 w-full">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-gray-800">
                    Archives
                  </CardTitle>
                  <Building2 className="h-6 w-6 text-gray-600 ml-auto" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Consulter les projets archivés
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Projects */}
        <RecentProjects user={user} />
      </main>
    </div>
  )
}
