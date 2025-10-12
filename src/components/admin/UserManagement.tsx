'use client'

import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { UserRole } from '@/types/auth'

interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  organization?: string
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)

  // Simulation des données utilisateurs
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          email: 'admin@bpdesign.sn',
          displayName: 'Administrateur Principal',
          role: UserRole.ADMIN,
          organization: 'BP Design Pro',
          createdAt: '2024-01-15',
          lastLogin: '2024-03-15',
          isActive: true
        },
        {
          id: '2',
          email: 'consultant@bpdesign.sn',
          displayName: 'Marie Diallo',
          role: UserRole.CONSULTANT,
          organization: 'Cabinet Conseil Dakar',
          createdAt: '2024-02-01',
          lastLogin: '2024-03-14',
          isActive: true
        },
        {
          id: '3',
          email: 'user1@example.com',
          displayName: 'Amadou Ba',
          role: UserRole.CLIENT,
          organization: 'Startup Tech SN',
          createdAt: '2024-02-15',
          lastLogin: '2024-03-10',
          isActive: true
        },
        {
          id: '4',
          email: 'user2@example.com',
          displayName: 'Fatou Sall',
          role: UserRole.CLIENT,
          organization: 'Agri-Business Casamance',
          createdAt: '2024-03-01',
          lastLogin: '2024-03-12',
          isActive: false
        },
        {
          id: '5',
          email: 'consultant2@bpdesign.sn',
          displayName: 'Ibrahima Ndiaye',
          role: UserRole.CONSULTANT,
          organization: 'ConsultPlus Thiès',
          createdAt: '2024-03-05',
          lastLogin: '2024-03-13',
          isActive: true
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-800'
      case UserRole.CONSULTANT: return 'bg-blue-100 text-blue-800'
      case UserRole.CLIENT: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <ShieldCheckIcon className="h-4 w-4" />
      case UserRole.CONSULTANT: return <UserIcon className="h-4 w-4" />
      case UserRole.CLIENT: return <UserIcon className="h-4 w-4" />
      default: return <UserIcon className="h-4 w-4" />
    }
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    ))
    setEditingUser(null)
  }

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou organisation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les rôles</option>
            <option value={UserRole.ADMIN}>Administrateur</option>
            <option value={UserRole.CONSULTANT}>Consultant</option>
            <option value={UserRole.CLIENT}>Client</option>
          </select>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="divide-y divide-gray-200">
        {filteredUsers.map((user) => (
          <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName}
                    </h3>
                    {!user.isActive && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Suspendu
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.organization && (
                    <p className="text-xs text-gray-400 truncate">{user.organization}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {editingUser === user.id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value={UserRole.CLIENT}>Client</option>
                        <option value={UserRole.CONSULTANT}>Consultant</option>
                        <option value={UserRole.ADMIN}>Administrateur</option>
                      </select>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role}</span>
                      </span>
                      <button
                        onClick={() => setEditingUser(user.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => toggleUserStatus(user.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    user.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {user.isActive ? 'Suspendre' : 'Activer'}
                </button>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
              <span>Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
              {user.lastLogin && (
                <span>Dernière connexion le {new Date(user.lastLogin).toLocaleDateString('fr-FR')}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || selectedRole !== 'all'
              ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
              : 'Aucun utilisateur n\'est encore enregistré.'}
          </p>
        </div>
      )}

      {/* Modal d'ajout d'utilisateur */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvel utilisateur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value={UserRole.CLIENT}>Client</option>
                  <option value={UserRole.CONSULTANT}>Consultant</option>
                  <option value={UserRole.ADMIN}>Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation (optionnel)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de l'organisation"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}