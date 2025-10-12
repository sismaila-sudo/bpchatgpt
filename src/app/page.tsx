'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import Link from 'next/link'
import Image from 'next/image'
import {
  PlusIcon,
  FolderIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowRightIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BeakerIcon,
  BoltIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const { user, userProfile, loading, signOut } = useAuth()
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const loadRecentProjects = useCallback(async () => {
    if (!user) return

    setProjectsLoading(true)
    try {
      const projects = await projectService.getUserProjects(user.uid)
      const recent = projects
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 3)
      setRecentProjects(recent)
    } catch (error) {
      console.error('Erreur lors du chargement des projets récents:', error)
    } finally {
      setProjectsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadRecentProjects()
    }
  }, [user, loadRecentProjects])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Page d'accueil publique (non connecté)
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation moderne avec couleur harmonieuse */}
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 via-purple-50/50 to-blue-50 backdrop-blur-xl border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">BP Design Pro</span>
                  <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Powered by AI</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <a
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900 px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Connexion
                </a>
                <a
                  href="/auth/register"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Démarrer
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section - Design Compact et Honnête */}
        <div className="relative bg-white">
          {/* Gradient subtil */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-white"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
            <div className="text-center space-y-6 sm:space-y-8">
              {/* Badge discret */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                  <SparklesIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Assistant IA pour l&apos;Afrique</span>
                </div>
              </div>

              {/* Titre compact */}
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight px-4">
                  <span className="block text-gray-900">Créez votre</span>
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    business plan professionnel
                  </span>
                </h1>
                
                <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                  Un assistant intelligent qui vous aide à structurer et rédiger votre business plan.
                  <br className="hidden sm:block" />
                  <span className="inline sm:block"> Conforme aux exigences <span className="font-semibold text-gray-900">FONGIP, BNDE, DER</span>.</span>
                </p>
              </div>

              {/* CTA simple */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
                <a
                  href="/auth/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Créer un compte
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
                <a
                  href="/auth/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Se connecter
                </a>
              </div>

              {/* Image compacte */}
              <div className="max-w-4xl mx-auto pt-6 sm:pt-8 px-4">
                <div className="relative rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src="/image.png"
                      alt="Assistant IA BP Design Pro"
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 768px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Fonctionnalités */}
        <div className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* En-tête section */}
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 px-4">
                Comment ça marche ?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-4">
                Notre assistant IA vous guide à chaque étape
              </p>
            </div>

            {/* Grille simple et compacte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Structuration guidée</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  L&apos;IA vous aide à organiser vos idées et structurer chaque section de votre business plan
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Données du marché</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Accès aux données économiques du Sénégal et de la CEDEAO pour des analyses pertinentes
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Format professionnel</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Documents conformes aux exigences FONGIP, BNDE et DER avec export PDF
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="py-12 sm:py-16 bg-gradient-to-br from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 px-4">
              Commencez votre business plan dès maintenant
            </h2>
            <p className="text-sm sm:text-base text-blue-100 mb-6 sm:mb-8 px-4">
              Créez un compte et accédez à l&apos;assistant IA
            </p>
            <a
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-all"
            >
              Créer un compte
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>

        {/* Footer simple */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold">BP Design Pro</span>
            </div>
            <p className="text-gray-400 text-sm">
              Assistant IA pour business plans professionnels
            </p>
            <p className="text-gray-500 text-xs mt-3">
              © 2025 BP Design Pro. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Page connectée (Dashboard)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation avec mobile burger menu */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 via-purple-50/50 to-blue-50 backdrop-blur-xl border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">BP Design Pro</span>
                  <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Powered by AI</div>
                </div>
              </Link>
              <div className="hidden md:flex items-center space-x-1">
                <Link href="/projects" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <FolderIcon className="h-4 w-4" />
                  Mes Projets
                </Link>
                <Link href="/templates" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <DocumentTextIcon className="h-4 w-4" />
                  Templates
                </Link>
                {userProfile?.role === UserRole.ADMIN && (
                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <CogIcon className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.displayName || user.email}
                </div>
                <div className={`text-xs font-medium ${
                  userProfile?.role === UserRole.ADMIN ? 'text-red-600' :
                  userProfile?.role === UserRole.CONSULTANT ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {userProfile?.role || 'client'}
                </div>
              </div>
              <button
                onClick={signOut}
                className="hidden md:block text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Déconnexion
              </button>
              
              {/* Menu burger mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-2xl z-50 md:hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">BP Design Pro</div>
                    <div className="text-xs text-gray-500">Powered by AI</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {userProfile?.displayName || user.email}
                </div>
                <div className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                  userProfile?.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                  userProfile?.role === UserRole.CONSULTANT ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {userProfile?.role || 'client'}
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">
                    <FolderIcon className="h-5 w-5" />
                    Mes Projets
                  </Link>
                  <Link href="/templates" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">
                    <DocumentTextIcon className="h-5 w-5" />
                    Templates
                  </Link>
                  {userProfile?.role === UserRole.ADMIN && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">
                      <CogIcon className="h-5 w-5" />
                      Admin
                    </Link>
                  )}
                </div>
              </nav>
              <div className="p-4 border-t">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); signOut() }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* En-tête avec stats */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Bonjour, {userProfile?.displayName || user.email?.split('@')[0]} 👋
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Voici un aperçu de vos projets et activités
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FolderIcon className="w-6 h-6" />
                </div>
                <ChartBarIcon className="w-8 h-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">{recentProjects.length}</div>
              <div className="text-blue-100 text-sm">Projets actifs</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <SparklesIcon className="w-8 h-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">IA</div>
              <div className="text-purple-100 text-sm">Assistant disponible</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <RocketLaunchIcon className="w-8 h-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-emerald-100 text-sm">Conformité FONGIP</div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className={`grid grid-cols-1 ${
            userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.FINANCIAL_ANALYST
              ? 'md:grid-cols-2 lg:grid-cols-4'
              : 'md:grid-cols-3'
          } gap-4`}>
            <Link
              href="/projects/new"
              className="group bg-white border-2 border-blue-200 hover:border-blue-400 p-6 rounded-xl hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Nouveau Projet</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Créer un business plan</p>
            </Link>

            {(userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.FINANCIAL_ANALYST) && (
              <Link
                href="/analysis/new"
                className="group bg-white border-2 border-emerald-200 hover:border-emerald-400 p-6 rounded-xl hover:shadow-lg transition-all"
              >
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-100 transition-colors">
                    <ChartBarIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analyse Projet</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Évaluation financière</p>
              </Link>
            )}

            <Link
              href="/projects"
              className="group bg-white border-2 border-gray-200 hover:border-gray-300 p-6 rounded-xl hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-100 transition-colors">
                  <FolderIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mes Projets</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Gérer mes projets</p>
            </Link>

            <Link
              href="/templates"
              className="group bg-white border-2 border-purple-200 hover:border-purple-400 p-6 rounded-xl hover:shadow-lg transition-all"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                  <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Templates</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Modèles professionnels</p>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projets récents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Projets récents</h2>
                  <p className="text-xs text-gray-500">Continuez où vous vous êtes arrêté</p>
                </div>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Voir tout
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {projectsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-4 hover:shadow-md border border-gray-100 hover:border-blue-200 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {project.basicInfo.name}
                            </h3>
                            <div className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                              Actif
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {project.basicInfo.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Modifié le {project.updatedAt.toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="ml-4 text-blue-600 group-hover:translate-x-1 transition-transform">
                          <ArrowRightIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FolderIcon className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Aucun projet pour le moment
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                    Commencez dès maintenant et créez votre premier business plan professionnel
                  </p>
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg transition-all"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Créer mon premier projet
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Panel latéral */}
          <div className="space-y-6">
            {/* Statut Admin */}
            {userProfile?.role === UserRole.ADMIN && (
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-bold text-red-900">Admin</h3>
                </div>
                <p className="text-sm text-red-700 mb-4 leading-relaxed">
                  Accès complet aux fonctionnalités
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 hover:shadow-md transition-all"
                >
                  <CogIcon className="w-4 h-4" />
                  Panneau Admin
                </Link>
              </div>
            )}

            {/* Statistiques */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">Aperçu</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Projets</span>
                  <span className="text-lg font-bold text-blue-600">{recentProjects.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-50/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Organisation</span>
                  <span className="text-xs font-semibold text-purple-600">
                    {userProfile?.organization || 'Individuel'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statut système */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <BoltIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900">Statut</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-800">Auth</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-800">Projets</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">✓</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-800">IA</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
