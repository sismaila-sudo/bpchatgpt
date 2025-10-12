'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TagIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface Template {
  id: string
  name: string
  description: string
  category: string
  industry: string
  sections: {
    synopsis: boolean
    market: boolean
    swot: boolean
    marketing: boolean
    hr: boolean
    financial: boolean
  }
  status: 'active' | 'draft' | 'archived'
  createdBy: string
  createdAt: string
  lastModified: string
  usageCount: number
  tags: string[]
  isDefault: boolean
}

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  // Simulation des données templates
  useEffect(() => {
    setTimeout(() => {
      setTemplates([
        {
          id: '1',
          name: 'Plan d\'affaires Restaurant',
          description: 'Template complet pour les restaurants et établissements de restauration au Sénégal',
          category: 'Restauration',
          industry: 'Restauration',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: true,
            financial: true
          },
          status: 'active',
          createdBy: 'Administrateur',
          createdAt: '2024-01-15',
          lastModified: '2024-03-10',
          usageCount: 15,
          tags: ['restaurant', 'gastronomie', 'service', 'dakar'],
          isDefault: true
        },
        {
          id: '2',
          name: 'Startup Technologique',
          description: 'Template optimisé pour les startups tech et plateformes numériques',
          category: 'Technologie',
          industry: 'Technologie',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: true,
            financial: true
          },
          status: 'active',
          createdBy: 'Marie Diallo',
          createdAt: '2024-02-01',
          lastModified: '2024-03-12',
          usageCount: 8,
          tags: ['tech', 'startup', 'digital', 'innovation'],
          isDefault: false
        },
        {
          id: '3',
          name: 'Agriculture Moderne',
          description: 'Plan d\'affaires pour l\'agriculture et l\'agro-business en Afrique de l\'Ouest',
          category: 'Agriculture',
          industry: 'Agriculture',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: true,
            financial: true
          },
          status: 'active',
          createdBy: 'Ibrahima Ndiaye',
          createdAt: '2024-02-15',
          lastModified: '2024-03-08',
          usageCount: 12,
          tags: ['agriculture', 'agrobusiness', 'cedeao', 'rural'],
          isDefault: true
        },
        {
          id: '4',
          name: 'E-commerce B2B',
          description: 'Template pour plateformes e-commerce inter-entreprises',
          category: 'Commerce',
          industry: 'Commerce électronique',
          sections: {
            synopsis: true,
            market: true,
            swot: false,
            marketing: true,
            hr: false,
            financial: true
          },
          status: 'draft',
          createdBy: 'Fatou Sall',
          createdAt: '2024-03-01',
          lastModified: '2024-03-14',
          usageCount: 2,
          tags: ['ecommerce', 'b2b', 'plateforme', 'digital'],
          isDefault: false
        },
        {
          id: '5',
          name: 'Centre de Formation',
          description: 'Template pour centres de formation et instituts d\'éducation',
          category: 'Éducation',
          industry: 'Éducation',
          sections: {
            synopsis: true,
            market: true,
            swot: true,
            marketing: true,
            hr: true,
            financial: true
          },
          status: 'archived',
          createdBy: 'Administrateur',
          createdAt: '2024-01-20',
          lastModified: '2024-02-28',
          usageCount: 5,
          tags: ['formation', 'education', 'competences', 'certification'],
          isDefault: false
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="h-4 w-4" />
      case 'draft': return <ClockIcon className="h-4 w-4" />
      case 'archived': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'draft': return 'Brouillon'
      case 'archived': return 'Archivé'
      default: return status
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const completedSections = (sections: Template['sections']) => {
    return Object.values(sections).filter(Boolean).length
  }

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(templates.map(template =>
      template.id === templateId
        ? { ...template, status: template.status === 'active' ? 'archived' : 'active' as any }
        : template
    ))
  }

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copie)`,
        status: 'draft' as const,
        usageCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        isDefault: false
      }
      setTemplates([...templates, newTemplate])
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
            <DocumentTextIcon className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Gestion des templates</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouveau template
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{templates.length}</p>
                <p className="text-sm text-orange-700">Total templates</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {templates.filter(t => t.status === 'active').length}
                </p>
                <p className="text-sm text-green-700">Actifs</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TagIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {templates.filter(t => t.isDefault).length}
                </p>
                <p className="text-sm text-blue-700">Par défaut</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {templates.reduce((acc, t) => acc + t.usageCount, 0)}
                </p>
                <p className="text-sm text-purple-700">Utilisations</p>
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
              placeholder="Rechercher par nom, description ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Toutes les catégories</option>
            <option value="Restauration">Restauration</option>
            <option value="Technologie">Technologie</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Commerce">Commerce</option>
            <option value="Éducation">Éducation</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
      </div>

      {/* Liste des templates */}
      <div className="divide-y divide-gray-200">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                    {getStatusIcon(template.status)}
                    <span className="ml-1">{getStatusText(template.status)}</span>
                  </span>
                  {template.isDefault && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Par défaut
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-3 text-sm">{template.description}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {template.category}
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {template.createdBy}
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  <div>
                    <span className="font-medium">{template.usageCount}</span> utilisations
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-500">Sections: </span>
                    <span className="text-sm font-medium text-gray-900">{completedSections(template.sections)}/6 définies</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {template.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    Sections définies:
                  </div>
                  {Object.entries(template.sections).map(([section, defined]) => (
                    <span
                      key={section}
                      className={`px-2 py-1 text-xs rounded-full ${
                        defined ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-6">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Voir le template"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => duplicateTemplate(template.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Dupliquer"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setEditingTemplate(template.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toggleTemplateStatus(template.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    template.status === 'active'
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {template.status === 'active' ? 'Archiver' : 'Activer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Aucun template ne correspond à vos critères de recherche.'
              : 'Aucun template n\'est encore créé.'}
          </p>
        </div>
      )}

      {/* Modal de création de template */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau template</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du template</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nom du template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">Sélectionner une catégorie</option>
                    <option value="Restauration">Restauration</option>
                    <option value="Technologie">Technologie</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Éducation">Éducation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Description du template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sections à inclure</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Synopsis', 'Étude de marché', 'Analyse SWOT', 'Plan marketing', 'Ressources humaines', 'Plan financier'].map((section) => (
                    <label key={section} className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">{section}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="restaurant, gastronomie, service..."
                />
              </div>

              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-sm font-medium text-gray-700">Template par défaut</label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                Créer le template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}