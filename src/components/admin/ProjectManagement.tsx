'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface Project {
  id: string
  name: string
  owner: {
    name: string
    email: string
    organization?: string
  }
  industry: string
  status: 'draft' | 'in_progress' | 'completed' | 'review'
  progress: number
  createdAt: string
  lastModified: string
  sections: {
    synopsis: boolean
    market: boolean
    swot: boolean
    marketing: boolean
    hr: boolean
    financial: boolean
  }
  budget: {
    initial: number
    projected: number
  }
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Simulation des données projets
  useEffect(() => {
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'Restaurant Teranga Dakar',
          owner: {
            name: 'Amadou Ba',
            email: 'amadou@example.com',
            organization: 'Startup Tech SN'
          },
          industry: 'Restauration',
          status: 'completed',
          progress: 100,
          createdAt: '2024-02-15',
          lastModified: '2024-03-10',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: true,
            financial: true
          },
          budget: {
            initial: 15000000,
            projected: 18000000
          }
        },
        {
          id: '2',
          name: 'Plateforme E-commerce Sénégal',
          owner: {
            name: 'Fatou Sall',
            email: 'fatou@example.com',
            organization: 'Digital Solutions'
          },
          industry: 'Technologie',
          status: 'in_progress',
          progress: 75,
          createdAt: '2024-03-01',
          lastModified: '2024-03-14',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: false,
            financial: true
          },
          budget: {
            initial: 25000000,
            projected: 32000000
          }
        },
        {
          id: '3',
          name: 'Ferme Avicole Moderne Casamance',
          owner: {
            name: 'Ibrahima Diop',
            email: 'ibrahima@example.com',
            organization: 'Agri-Business Casamance'
          },
          industry: 'Agriculture',
          status: 'in_progress',
          progress: 60,
          createdAt: '2024-02-20',
          lastModified: '2024-03-12',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: false,
            hr: false,
            financial: true
          },
          budget: {
            initial: 35000000,
            projected: 45000000
          }
        },
        {
          id: '4',
          name: 'Centre de Formation Numérique',
          owner: {
            name: 'Marie Diallo',
            email: 'marie@consultplus.sn',
            organization: 'ConsultPlus Thiès'
          },
          industry: 'Éducation',
          status: 'draft',
          progress: 25,
          createdAt: '2024-03-05',
          lastModified: '2024-03-08',
          sections: {
            synopsis: true,
            market: false,
            swot: false,
            marketing: false,
            hr: false,
            financial: false
          },
          budget: {
            initial: 12000000,
            projected: 0
          }
        },
        {
          id: '5',
          name: 'Clinique Dentaire Moderne',
          owner: {
            name: 'Dr. Ousmane Sy',
            email: 'ousmane@clinique.sn',
            organization: 'Cabinet Médical Dakar'
          },
          industry: 'Santé',
          status: 'review',
          progress: 90,
          createdAt: '2024-01-20',
          lastModified: '2024-03-11',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: true,
            financial: true
          },
          budget: {
            initial: 28000000,
            projected: 35000000
          }
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      case 'in_progress': return <ClockIcon className="h-4 w-4" />
      case 'review': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'draft': return <DocumentArrowDownIcon className="h-4 w-4" />
      default: return <DocumentArrowDownIcon className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'in_progress': return 'En cours'
      case 'review': return 'En révision'
      case 'draft': return 'Brouillon'
      default: return status
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.industry.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus
    const matchesIndustry = selectedIndustry === 'all' || project.industry === selectedIndustry
    return matchesSearch && matchesStatus && matchesIndustry
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const completedSections = (sections: Project['sections']) => {
    return Object.values(sections).filter(Boolean).length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Gestion des projets</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ChartBarIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ChartPieIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{projects.length}</p>
                <p className="text-sm text-blue-700">Total projets</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-sm text-green-700">Terminés</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-yellow-900">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
                <p className="text-sm text-yellow-700">En cours</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
                </p>
                <p className="text-sm text-purple-700">Progression moy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, propriétaire ou secteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="in_progress">En cours</option>
            <option value="review">En révision</option>
            <option value="completed">Terminé</option>
          </select>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les secteurs</option>
            <option value="Restauration">Restauration</option>
            <option value="Technologie">Technologie</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Éducation">Éducation</option>
            <option value="Santé">Santé</option>
          </select>
        </div>
      </div>

      {/* Liste des projets */}
      <div className="divide-y divide-gray-200">
        {filteredProjects.map((project) => (
          <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{getStatusText(project.status)}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {project.owner.name}
                  </div>
                  {project.owner.organization && (
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {project.owner.organization}
                    </div>
                  )}
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="flex items-center space-x-6 mb-3">
                  <div>
                    <span className="text-sm text-gray-500">Secteur: </span>
                    <span className="text-sm font-medium text-gray-900">{project.industry}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Budget initial: </span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(project.budget.initial)}</span>
                  </div>
                  {project.budget.projected > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Projection: </span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(project.budget.projected)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progression</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {completedSections(project.sections)}/6 sections
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-6">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="p-12 text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || selectedStatus !== 'all' || selectedIndustry !== 'all'
              ? 'Aucun projet ne correspond à vos critères de recherche.'
              : 'Aucun projet n\'est encore créé.'}
          </p>
        </div>
      )}
    </div>
  )
}