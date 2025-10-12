'use client'

// Force le rendu dynamique pour éviter DataCloneError
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import Link from 'next/link'
import {
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import UserManagement from '@/components/admin/UserManagement'
import ProjectManagement from '@/components/admin/ProjectManagement'
import SystemSettings from '@/components/admin/SystemSettings'
import TemplateManagement from '@/components/admin/TemplateManagement'

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0
  })

  useEffect(() => {
    // Simuler le chargement des statistiques
    // En production, ceci ferait des appels API réels
    setStats({
      totalUsers: 25,
      totalProjects: 47,
      activeProjects: 23,
      completedProjects: 24
    })
  }, [])

  const navigationItems = [
    { id: 'dashboard', name: 'Tableau de bord', icon: ChartBarIcon },
    { id: 'users', name: 'Utilisateurs', icon: UserGroupIcon },
    { id: 'projects', name: 'Projets', icon: FolderIcon },
    { id: 'settings', name: 'Configuration', icon: CogIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || userProfile?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                BP Design Pro
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/projects" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <FolderIcon className="h-5 w-5 mr-1" />
                  Mes Projets
                </Link>
                <Link href="/templates" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-1" />
                  Templates
                </Link>
                <Link
                  href="/admin"
                  className="text-red-600 font-medium border-b-2 border-red-600 pb-1 flex items-center"
                >
                  <CogIcon className="h-5 w-5 mr-1" />
                  Administration
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.displayName || user.email}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                {userProfile?.role}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration
          </h1>
          <p className="text-gray-600">
            Gérez les utilisateurs, projets et configurations du système
          </p>
        </div>

        {/* Navigation des sections */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeSection === item.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenu dynamique selon la section active */}
        {activeSection === 'dashboard' && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <UserGroupIcon className="h-12 w-12 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
                    <p className="text-gray-600">Utilisateurs</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <FolderIcon className="h-12 w-12 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalProjects}</h3>
                    <p className="text-gray-600">Projets total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <ClockIcon className="h-12 w-12 text-yellow-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.activeProjects}</h3>
                    <p className="text-gray-600">En cours</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-12 w-12 text-purple-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.completedProjects}</h3>
                    <p className="text-gray-600">Terminés</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sections spécialisées */}
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'projects' && <ProjectManagement />}
        {activeSection === 'settings' && <SystemSettings />}

        {activeSection === 'templates' && <TemplateManagement />}

        {activeSection === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Aperçu rapide des utilisateurs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Utilisateurs récents</h2>
                </div>
                <button
                  onClick={() => setActiveSection('users')}
                  className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                >
                  Voir tout →
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Marie Diallo', email: 'marie@consultplus.sn', role: 'Consultant', time: '2h' },
                  { name: 'Amadou Ba', email: 'amadou@example.com', role: 'Utilisateur', time: '4h' },
                  { name: 'Fatou Sall', email: 'fatou@example.com', role: 'Utilisateur', time: '6h' }
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{user.role}</p>
                      <p className="text-xs text-gray-500">il y a {user.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aperçu rapide des projets */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FolderIcon className="h-6 w-6 text-green-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Projets récents</h2>
                </div>
                <button
                  onClick={() => setActiveSection('projects')}
                  className="text-green-600 text-sm hover:text-green-800 font-medium"
                >
                  Voir tout →
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Restaurant Teranga Dakar', owner: 'Amadou Ba', progress: 100, status: 'Terminé' },
                  { name: 'E-commerce Sénégal', owner: 'Fatou Sall', progress: 75, status: 'En cours' },
                  { name: 'Centre Formation Numérique', owner: 'Marie Diallo', progress: 25, status: 'Brouillon' }
                ].map((project, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'Terminé' ? 'bg-green-100 text-green-800' :
                        project.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">par {project.owner}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}