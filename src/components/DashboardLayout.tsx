'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import {
  FolderIcon,
  DocumentTextIcon,
  CogIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userProfile, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation harmonisée avec homepage */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 via-purple-50/50 to-blue-50 backdrop-blur-xl border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo et navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">BP Design Pro</span>
                  <div className="text-xs text-gray-500 font-medium">Powered by AI</div>
                </div>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                <Link
                  href="/projects"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/projects')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FolderIcon className="h-4 w-4" />
                  Mes Projets
                </Link>

                <Link
                  href="/templates"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/templates')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  Templates
                </Link>

                {userProfile?.role === UserRole.ADMIN && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <CogIcon className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </div>
            </div>

            {/* Profil utilisateur & Menu mobile */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.displayName || user?.email}
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
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                title="Se déconnecter"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>

              {/* Bouton menu burger mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Drawer mobile */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={closeMobileMenu}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-2xl z-50 md:hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">BP Design Pro</div>
                    <div className="text-xs text-gray-500">Powered by AI</div>
                  </div>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Profil */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {userProfile?.displayName || user?.email}
                </div>
                <div className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                  userProfile?.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                  userProfile?.role === UserRole.CONSULTANT ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {userProfile?.role || 'client'}
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <Link
                    href="/projects"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive('/projects')
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FolderIcon className="h-5 w-5" />
                    Mes Projets
                  </Link>

                  <Link
                    href="/templates"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive('/templates')
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    Templates
                  </Link>

                  {userProfile?.role === UserRole.ADMIN && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive('/admin')
                          ? 'bg-red-100 text-red-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <CogIcon className="h-5 w-5" />
                      Administration
                    </Link>
                  )}
                </div>
              </nav>

              {/* Footer - Déconnexion */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeMobileMenu()
                    signOut()
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contenu */}
      <main>{children}</main>
    </div>
  )
}

