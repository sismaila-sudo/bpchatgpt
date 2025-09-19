'use client'

import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, FileText, BarChart3, Users, TrendingUp, Eye, UserPlus, Building2, Upload } from 'lucide-react'
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Projets</p>
                  <p className="text-2xl font-bold">{stats.loading ? '...' : stats.totalProjects}</p>
                  <p className="text-blue-100 text-xs">Tous projets</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">CA Total Prévisionnel</p>
                  <p className="text-2xl font-bold">
                    {stats.loading ? '...' : `${stats.totalRevenue.toLocaleString()} XOF`}
                  </p>
                  <p className="text-green-100 text-xs">Tous projets</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Projets Actifs</p>
                  <p className="text-2xl font-bold">{stats.loading ? '...' : stats.activeProjects}</p>
                  <p className="text-purple-100 text-xs">En cours</p>
                </div>
                <Eye className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Collaborateurs</p>
                  <p className="text-2xl font-bold">{stats.loading ? '...' : stats.totalCollaborators}</p>
                  <p className="text-orange-100 text-xs">Total</p>
                </div>
                <UserPlus className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link href="/projects/new">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-emerald-50 border-emerald-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">
                  Nouveau Projet
                </CardTitle>
                <PlusCircle className="h-4 w-4 text-emerald-600 ml-auto" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-700">
                  Créer un nouveau business plan
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/import">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-indigo-50 border-indigo-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-800">
                  Entreprise Existante
                </CardTitle>
                <Building2 className="h-4 w-4 text-indigo-600 ml-auto" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-indigo-700">
                  Import automatique documents
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/projects">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">
                  Mes Projets
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-600 ml-auto" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-700">
                  Voir tous vos projets
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-purple-50 border-purple-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">
                  Analytics
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600 ml-auto" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-purple-700">
                  Analyses et ratios
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/collaboration">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-orange-50 border-orange-200">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">
                  Collaboration
                </CardTitle>
                <Users className="h-4 w-4 text-orange-600 ml-auto" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-orange-700">
                  Partager et collaborer
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Projects */}
        <RecentProjects user={user} />
      </main>
    </div>
  )
}
