'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

interface Collaborator {
  id: string
  user_id: string
  role: 'admin' | 'finance' | 'analyst' | 'reader'
  invited_by: string
  invited_at: string
  accepted_at: string | null
  user_email?: string
  user_name?: string
  inviter_name?: string
}

interface CollaboratorsTabProps {
  project: any
}

export function CollaboratorsTab({ project }: CollaboratorsTabProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'finance' | 'analyst' | 'reader'>('reader')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (project?.id) {
      loadCollaborators()
    }
  }, [project?.id])

  const loadCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          *,
          user:auth.users!user_id(email, raw_user_meta_data),
          inviter:auth.users!invited_by(raw_user_meta_data)
        `)
        .eq('project_id', project.id)
        .order('invited_at', { ascending: false })

      if (error) throw error

      const formattedCollaborators = data.map(collab => ({
        ...collab,
        user_email: collab.user?.email,
        user_name: collab.user?.raw_user_meta_data?.full_name || collab.user?.email,
        inviter_name: collab.inviter?.raw_user_meta_data?.full_name || 'Système'
      }))

      setCollaborators(formattedCollaborators)
    } catch (error: any) {
      console.error('Erreur lors du chargement des collaborateurs:', error)
      setError('Erreur lors du chargement des collaborateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !user) return

    setInviteLoading(true)
    setError('')
    setMessage('')

    try {
      // Vérifier si l'utilisateur existe déjà comme collaborateur
      const existingCollab = collaborators.find(c => c.user_email === inviteEmail)
      if (existingCollab) {
        setError('Cet utilisateur est déjà collaborateur sur ce projet')
        return
      }

      // Pour le MVP, on simule l'invitation sans vérifier l'existence de l'utilisateur
      // Dans un système complet, il faudrait d'abord vérifier si l'utilisateur existe

      // Créer l'invitation
      const { error: inviteError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: project.id,
          user_id: null, // Sera rempli quand l'utilisateur acceptera
          role: inviteRole,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          // Pour le MVP, on stocke l'email dans un champ temporaire
          invited_email: inviteEmail
        })

      if (inviteError) throw inviteError

      setMessage(`Invitation envoyée à ${inviteEmail} avec le rôle ${getRoleLabel(inviteRole)}`)
      setInviteEmail('')
      setInviteRole('reader')
      await loadCollaborators()

    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce collaborateur ?')) return

    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId)

      if (error) throw error

      setMessage('Collaborateur retiré avec succès')
      await loadCollaborators()
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur'
      case 'finance': return 'Financier'
      case 'analyst': return 'Analyste'
      case 'reader': return 'Lecteur'
      default: return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'finance': return <Edit className="h-4 w-4 text-blue-500" />
      case 'analyst': return <Edit className="h-4 w-4 text-green-500" />
      case 'reader': return <Eye className="h-4 w-4 text-gray-500" />
      default: return <Eye className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800'
      case 'finance': return 'bg-blue-100 text-blue-800'
      case 'analyst': return 'bg-green-100 text-green-800'
      case 'reader': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Vérifier si l'utilisateur actuel est admin du projet
  const currentUserCollaborator = collaborators.find(c => c.user_id === user?.id)
  const isCurrentUserAdmin = currentUserCollaborator?.role === 'admin' || project?.created_by === user?.id

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Collaborateurs</h2>
        <p className="text-gray-600">
          Gérez les accès et permissions pour ce projet
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Alert>
          <AlertDescription className="text-green-600">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Invitation Form - Seulement pour les admins */}
      {isCurrentUserAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
              Inviter un collaborateur
            </CardTitle>
            <CardDescription>
              Ajoutez des membres à votre équipe projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="inviteEmail">Email du collaborateur</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="collaborateur@exemple.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inviteRole">Rôle</Label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="reader">Lecteur</option>
                    <option value="analyst">Analyste</option>
                    <option value="finance">Financier</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <strong>Rôles :</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Lecteur :</strong> Consultation uniquement</li>
                  <li>• <strong>Analyste :</strong> Modification des données métier</li>
                  <li>• <strong>Financier :</strong> Accès complet aux données financières</li>
                </ul>
              </div>

              <Button type="submit" disabled={inviteLoading} className="w-full md:w-auto">
                {inviteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des collaborateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Équipe projet ({collaborators.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun collaborateur pour le moment</p>
              <p className="text-sm">Invitez des membres pour collaborer sur ce projet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRoleIcon(collaborator.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {collaborator.user_name || collaborator.user_email || 'Utilisateur inconnu'}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(collaborator.role)}`}>
                          {getRoleLabel(collaborator.role)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {collaborator.accepted_at ? (
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                              En attente
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        <span>Invité par {collaborator.inviter_name}</span>
                        <span className="mx-2">•</span>
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(collaborator.invited_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Seulement pour les admins et pas pour eux-mêmes */}
                  {isCurrentUserAdmin && collaborator.user_id !== user?.id && (
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations sur les permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Niveaux de permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <Crown className="h-4 w-4 text-yellow-500" />
              <div>
                <strong>Administrateur :</strong> Accès complet, gestion des collaborateurs, paramètres projet
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Edit className="h-4 w-4 text-blue-500" />
              <div>
                <strong>Financier :</strong> Modification complète des données financières et projections
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Edit className="h-4 w-4 text-green-500" />
              <div>
                <strong>Analyste :</strong> Modification des produits, ventes, et données métier
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Eye className="h-4 w-4 text-gray-500" />
              <div>
                <strong>Lecteur :</strong> Consultation uniquement, export des rapports
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}