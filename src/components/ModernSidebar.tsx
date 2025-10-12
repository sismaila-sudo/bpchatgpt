'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  BuildingLibraryIcon,
  TableCellsIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import {
  DocumentTextIcon as DocumentTextSolid,
  ChartBarIcon as ChartBarSolid,
  CalculatorIcon as CalculatorSolid,
  ShieldCheckIcon as ShieldCheckSolid,
  MegaphoneIcon as MegaphoneSolid,
  UserGroupIcon as UserGroupSolid,
  UsersIcon as UsersSolid,
  CurrencyDollarIcon as CurrencyDollarSolid,
  ArrowDownTrayIcon as ArrowDownTraySolid,
  ClipboardDocumentListIcon as ClipboardDocumentListSolid,
  BuildingLibraryIcon as BuildingLibrarySolid,
  TableCellsIcon as TableCellsSolid
} from '@heroicons/react/24/solid'

interface ModernSidebarProps {
  projectId: string
  projectName: string
  onNavigate?: (href: string) => void
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

const menuItems = [
  // ========== BUSINESS PLAN CLASSIQUE ==========
  {
    name: 'Vue d\'ensemble',
    href: '',
    icon: HomeIcon,
    solidIcon: HomeIcon,
    color: 'from-blue-500 to-blue-600',
    description: 'Aperçu général du projet',
    section: 'business'
  },
  {
    name: 'Synopsis / Résumé Exécutif',
    href: '/fiche-synoptique',
    icon: DocumentTextIcon,
    solidIcon: DocumentTextSolid,
    color: 'from-purple-500 to-purple-600',
    description: 'Résumé exécutif et fiche synoptique FONGIP',
    section: 'business'
  },
  {
    name: 'Étude de marché',
    href: '/market-study',
    icon: ChartBarIcon,
    solidIcon: ChartBarSolid,
    color: 'from-green-500 to-green-600',
    description: 'Analyse du marché',
    section: 'business'
  },
  {
    name: 'Analyse SWOT',
    href: '/swot',
    icon: ShieldCheckIcon,
    solidIcon: ShieldCheckSolid,
    color: 'from-orange-500 to-orange-600',
    description: 'Forces, faiblesses, opportunités',
    section: 'business'
  },
  {
    name: 'Stratégie Marketing',
    href: '/marketing',
    icon: MegaphoneIcon,
    solidIcon: MegaphoneSolid,
    color: 'from-pink-500 to-pink-600',
    description: 'Plan marketing et communication',
    section: 'business'
  },
  {
    name: 'Ressources Humaines',
    href: '/hr',
    icon: UserGroupIcon,
    solidIcon: UserGroupSolid,
    color: 'from-indigo-500 to-indigo-600',
    description: 'Équipe et organisation',
    section: 'business'
  },
  {
    name: 'Projections Financières',
    href: '/financial-engine',
    icon: CalculatorIcon,
    solidIcon: CalculatorSolid,
    color: 'from-blue-500 to-blue-600',
    description: 'Moteur de calculs avancés (VAN, TRI, ROE, ROCE)',
    section: 'business'
  },

  // ========== MODULES FONGIP/BANCAIRES ==========
  {
    name: 'Analyse Financière Historique',
    href: '/analyse-financiere',
    icon: CalculatorIcon,
    solidIcon: CalculatorSolid,
    color: 'from-amber-500 to-amber-600',
    description: 'Historique 3 ans & Ratios bancaires',
    section: 'fongip'
  },
  {
    name: 'Tableaux Financiers',
    href: '/tableaux-financiers',
    icon: TableCellsIcon,
    solidIcon: TableCellsSolid,
    color: 'from-cyan-500 to-cyan-600',
    description: '15+ tableaux financiers FONGIP',
    section: 'fongip'
  },
  {
    name: 'VAN / TRI / DRCI',
    href: '/rentabilite',
    icon: SparklesIcon,
    solidIcon: SparklesIcon,
    color: 'from-purple-500 to-pink-600',
    description: 'Analyse de rentabilité avancée',
    section: 'fongip'
  },
  {
    name: 'Relations Bancaires',
    href: '/relations-bancaires',
    icon: BuildingLibraryIcon,
    solidIcon: BuildingLibrarySolid,
    color: 'from-violet-500 to-violet-600',
    description: 'Historique et situation bancaire',
    section: 'fongip'
  },

  // ========== EXPORT ==========
  {
    name: 'Export Preview',
    href: '/export-preview',
    icon: DocumentTextIcon,
    solidIcon: DocumentTextSolid,
    color: 'from-blue-500 to-blue-600',
    description: 'Voir, éditer et imprimer le business plan',
    section: 'export'
  },
  {
    name: 'Historique Exports',
    href: '/export-history',
    icon: ClipboardDocumentListIcon,
    solidIcon: ClipboardDocumentListSolid,
    color: 'from-purple-500 to-purple-600',
    description: 'Gérer vos exports sauvegardés',
    section: 'export'
  }
]

export default function ModernSidebar({ projectId, projectName, onNavigate, isMobileMenuOpen = false, onCloseMobileMenu }: ModernSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === '') {
      return pathname === `/projects/${projectId}`
    }
    return pathname === `/projects/${projectId}${href}`
  }

  // Gérer le clic sur un item de menu
  const handleItemClick = (e: React.MouseEvent, href: string) => {
    // Fermer le menu mobile si ouvert
    if (onCloseMobileMenu) {
      onCloseMobileMenu()
    }
    
    if (onNavigate) {
      e.preventDefault() // Empêcher la navigation par défaut
      onNavigate(href) // Appeler le callback pour le scroll
    }
    // Sinon, laisser le Link gérer la navigation normale
  }

  const businessItems = menuItems.filter(item => item.section === 'business')
  const fongipItems = menuItems.filter(item => item.section === 'fongip')
  const exportItems = menuItems.filter(item => item.section === 'export')

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50/50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{projectName}</h1>
              <p className="text-xs text-gray-500 mt-0.5">Business Plan Designer</p>
            </div>
          )}
          
          {/* Bouton close mobile / collapse desktop */}
          <button
            onClick={() => {
              if (onCloseMobileMenu) {
                onCloseMobileMenu()
              } else {
                setIsCollapsed(!isCollapsed)
              }
            }}
            className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors border border-gray-200 ml-2"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            ) : isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Bouton retour accueil */}
        {!isCollapsed ? (
          <Link
            href="/"
            className="inline-flex items-center px-3 py-2 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 text-gray-700 hover:text-gray-900 group border border-gray-200 text-sm"
            title="Retour à l'accueil"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Accueil</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            title="Retour à l'accueil"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-6">
        {/* Business Plan Classique */}
        {!isCollapsed && (
          <div>
            <div className="px-3 mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Plan</h3>
            </div>
            <div className="space-y-1">
              {businessItems.map((item) => {
                const active = isActive(item.href)
                const Icon = active ? item.solidIcon : item.icon

                return (
                  <Link
                    key={item.name}
                    href={`/projects/${projectId}${item.href}`}
                    onClick={(e) => handleItemClick(e, item.href)}
                    className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? `bg-gradient-to-r ${item.color} shadow-md text-white`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      active ? 'bg-white/20' : 'bg-white'
                    } transition-colors flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-900'} truncate`}>
                        {item.name}
                      </p>
                    </div>

                    <ArrowRightIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'} group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2`} />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Collapsed view - Business Plan */}
        {isCollapsed && (
          <div className="space-y-2">
            {businessItems.map((item) => {
              const active = isActive(item.href)
              const Icon = active ? item.solidIcon : item.icon

              return (
                <Link
                  key={item.name}
                  href={`/projects/${projectId}${item.href}`}
                  onClick={(e) => handleItemClick(e, item.href)}
                  className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                    active
                      ? `bg-gradient-to-r ${item.color} shadow-md`
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                </Link>
              )
            })}
          </div>
        )}

        {/* Collapsed view - FONGIP */}
        {isCollapsed && fongipItems.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            {fongipItems.map((item) => {
              const active = isActive(item.href)
              const Icon = active ? item.solidIcon : item.icon

              return (
                <Link
                  key={item.name}
                  href={`/projects/${projectId}${item.href}`}
                  onClick={(e) => handleItemClick(e, item.href)}
                  className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                    active
                      ? `bg-gradient-to-r ${item.color} shadow-md`
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                </Link>
              )
            })}
          </div>
        )}

        {/* Collapsed view - Export */}
        {isCollapsed && exportItems.map((item) => {
          const active = isActive(item.href)
          const Icon = active ? item.solidIcon : item.icon

          return (
            <Link
              key={item.name}
              href={`/projects/${projectId}${item.href}`}
              onClick={(e) => handleItemClick(e, item.href)}
              className={`flex items-center justify-center p-3 rounded-lg transition-all mt-2 ${
                active
                  ? `bg-gradient-to-r ${item.color} shadow-md`
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              title={item.name}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
            </Link>
          )
        })}

        {/* Modules FONGIP */}
        {!isCollapsed && fongipItems.length > 0 && (
          <div>
            <div className="px-3 mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modules FONGIP</h3>
            </div>
            <div className="space-y-1">
              {fongipItems.map((item) => {
                const active = isActive(item.href)
                const Icon = active ? item.solidIcon : item.icon

                return (
                  <Link
                    key={item.name}
                    href={`/projects/${projectId}${item.href}`}
                    onClick={(e) => handleItemClick(e, item.href)}
                    className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? `bg-gradient-to-r ${item.color} shadow-md text-white`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      active ? 'bg-white/20' : 'bg-white'
                    } transition-colors flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-900'} truncate`}>
                        {item.name}
                      </p>
                    </div>

                    <ArrowRightIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'} group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2`} />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Export */}
        {!isCollapsed && exportItems.map((item) => {
          const active = isActive(item.href)
          const Icon = active ? item.solidIcon : item.icon

          return (
            <Link
              key={item.name}
              href={`/projects/${projectId}${item.href}`}
              onClick={(e) => handleItemClick(e, item.href)}
              className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active
                  ? `bg-gradient-to-r ${item.color} shadow-md text-white`
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-sm'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                active ? 'bg-white/20' : 'bg-white'
              } transition-colors flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />
              </div>

              <div className="ml-3 flex-1 min-w-0">
                <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-900'} truncate`}>
                  {item.name}
                </p>
              </div>

              <ArrowRightIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'} group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2`} />
            </Link>
          )
        })}
      </nav>

      {/* Footer - Assistant IA */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAIAssistant'))
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-white flex-shrink-0" />
              <div className="ml-3 text-left flex-1">
                <p className="text-sm font-semibold text-white">Assistant IA</p>
                <p className="text-xs text-blue-100">Obtenez de l'aide</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-white opacity-70 flex-shrink-0" />
            </div>
          </button>
        ) : (
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAIAssistant'))
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center"
            title="Assistant IA"
          >
            <SparklesIcon className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  )

  // Sur mobile, wrapper dans un drawer
  if (isMobileMenuOpen) {
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
        
        {/* Drawer */}
        <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 md:hidden overflow-hidden">
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop: sidebar normale
  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-80'} hidden md:flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200 bg-white`}>
      {sidebarContent}
    </div>
  )
}
