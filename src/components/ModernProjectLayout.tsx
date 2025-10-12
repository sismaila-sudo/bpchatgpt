'use client'

import { ReactNode, useState, useEffect } from 'react'
import ModernSidebar from './ModernSidebar'
import GlobalAIAssistant from './GlobalAIAssistant'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Project } from '@/types/project'
import { useAuth } from '@/contexts/AuthContext'

interface ModernProjectLayoutProps {
  children: ReactNode
  projectId: string
  projectName: string
  title?: string
  subtitle?: string
  actions?: ReactNode
  onSectionClick?: (sectionId: string) => void
  project?: Project | null
  currentSection?: string
}

export default function ModernProjectLayout({
  children,
  projectId,
  projectName,
  title,
  subtitle,
  actions,
  onSectionClick,
  project,
  currentSection
}: ModernProjectLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showGlobalAIAssistant, setShowGlobalAIAssistant] = useState(false)
  const { user } = useAuth()

  // Écoute de l'événement pour ouvrir l'assistant IA depuis la sidebar
  useEffect(() => {
    const handleOpenAIAssistant = () => {
      if (project) {
        setShowGlobalAIAssistant(true)
      }
    }

    window.addEventListener('openAIAssistant', handleOpenAIAssistant)
    
    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
    }
  }, [project])

  // Mapping entre les hrefs de la sidebar et les IDs de sections pour le scroll
  const handleSidebarNavigation = (href: string) => {
    if (!onSectionClick) return

    // Extraire l'ID de section depuis le href
    const sectionMap: { [key: string]: string } = {
      '': 'overview',
      '/synopsis': 'synopsis',
      '/market-study': 'market',
      '/swot': 'swot',
      '/marketing': 'marketing',
      '/hr': 'hr',
      '/financial': 'financial',
      '/financial-engine': 'financial-engine',
      '/export': 'export'
    }

    const sectionId = sectionMap[href]
    if (sectionId) {
      onSectionClick(sectionId)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop + Mobile Drawer */}
      <ModernSidebar
        projectId={projectId}
        projectName={projectName}
        onNavigate={onSectionClick ? handleSidebarNavigation : undefined}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header avec burger mobile */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Bouton burger mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>

              {/* Title */}
              {title && (
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {actions}
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Assistant IA Global */}
      {project && showGlobalAIAssistant && (
        <GlobalAIAssistant
          project={project}
          currentSection={currentSection}
          isOpen={showGlobalAIAssistant}
          onClose={() => setShowGlobalAIAssistant(false)}
          userId={user?.uid}
        />
      )}
    </div>
  )
}
