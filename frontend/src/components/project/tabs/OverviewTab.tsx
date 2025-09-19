'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  User,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SynopticSheet } from '../SynopticSheet'

interface OverviewTabProps {
  project: any
}

interface ProjectOwner {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  title?: string
  company?: string
  experience_years?: number
  motivation?: string
  vision?: string
}

export function OverviewTab({ project }: OverviewTabProps) {
  const [stats, setStats] = useState({
    products_count: 0,
    total_revenue: 0,
    total_profit: 0,
    months_calculated: 0,
    break_even_month: null as number | null,
    min_cash_balance: 0
  })
  const [loading, setLoading] = useState(true)
  const [owner, setOwner] = useState<ProjectOwner>({})
  const [editingOwner, setEditingOwner] = useState(false)
  const [savingOwner, setSavingOwner] = useState(false)
  const [showSynopticSheet, setShowSynopticSheet] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadStats()
    loadOwnerInfo()
  }, [project.id])

  async function loadStats() {
      try {
        // Compter les produits
        const { count: productsCount } = await supabase
          .from('products_services')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)

        // Obtenir les données financières
        const { data: financialData } = await supabase
          .from('financial_outputs')
          .select('*')
          .eq('project_id', project.id)
          .order('year')
          .order('month')

        let totalRevenue = 0
        let totalProfit = 0
        let minCashBalance = 0
        let breakEvenMonth = null

        if (financialData && financialData.length > 0) {
          totalRevenue = financialData.reduce((sum, row) => sum + (row.revenue || 0), 0)
          totalProfit = financialData.reduce((sum, row) => sum + (row.net_income || 0), 0)
          minCashBalance = Math.min(...financialData.map(row => row.cash_balance || 0))

          // Trouver le point d'équilibre (premier mois avec cash positif)
          const breakEvenData = financialData.find(row => (row.cash_balance || 0) > 0)
          if (breakEvenData) {
            const monthIndex = financialData.indexOf(breakEvenData)
            breakEvenMonth = monthIndex + 1
          }
        }

        setStats({
          products_count: productsCount || 0,
          total_revenue: totalRevenue,
          total_profit: totalProfit,
          months_calculated: financialData?.length || 0,
          break_even_month: breakEvenMonth,
          min_cash_balance: minCashBalance
        })
      } catch (error) {
        console.error('Erreur chargement stats:', error)
      } finally {
        setLoading(false)
      }
    }

  async function loadOwnerInfo() {
    try {
      const { data: ownerData } = await supabase
        .from('project_owners')
        .select('*')
        .eq('project_id', project.id)
        .single()

      if (ownerData) {
        setOwner(ownerData)
      }
    } catch (error) {
      console.log('Aucune information porteur trouvée, ce qui est normal pour un nouveau projet')
    }
  }

  async function saveOwnerInfo() {
    setSavingOwner(true)
    try {
      const ownerData = {
        project_id: project.id,
        ...owner
      }

      if (owner.id) {
        // Mise à jour
        const { error } = await supabase
          .from('project_owners')
          .update(ownerData)
          .eq('id', owner.id)

        if (error) throw error
      } else {
        // Création
        const { data, error } = await supabase
          .from('project_owners')
          .insert([ownerData])
          .select()
          .single()

        if (error) throw error
        if (data) setOwner(data)
      }

      setEditingOwner(false)
    } catch (error) {
      console.error('Erreur sauvegarde porteur:', error)
      alert('Erreur lors de la sauvegarde des informations')
    } finally {
      setSavingOwner(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: project.organizations?.currency || 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 text-${color}-600`} />
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Informations du projet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Informations du projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet
              </label>
              <p className="text-lg font-semibold">{project.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secteur d'activité
              </label>
              <p className="text-lg font-semibold">{project.sector}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <p className="text-lg font-semibold">
                {new Date(project.start_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations du porteur de projet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Porteur de Projet
            </CardTitle>
            {!editingOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingOwner(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {owner.first_name ? 'Modifier' : 'Ajouter'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingOwner ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={owner.first_name || ''}
                    onChange={(e) => setOwner({ ...owner, first_name: e.target.value })}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={owner.last_name || ''}
                    onChange={(e) => setOwner({ ...owner, last_name: e.target.value })}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={owner.email || ''}
                    onChange={(e) => setOwner({ ...owner, email: e.target.value })}
                    placeholder="votre.email@exemple.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={owner.phone || ''}
                    onChange={(e) => setOwner({ ...owner, phone: e.target.value })}
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre / Fonction</Label>
                  <Input
                    id="title"
                    value={owner.title || ''}
                    onChange={(e) => setOwner({ ...owner, title: e.target.value })}
                    placeholder="Ex: Directeur Général, Entrepreneur"
                  />
                </div>
                <div>
                  <Label htmlFor="experience_years">Années d'expérience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={owner.experience_years || ''}
                    onChange={(e) => setOwner({ ...owner, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="motivation">Motivation pour ce projet</Label>
                <Textarea
                  id="motivation"
                  value={owner.motivation || ''}
                  onChange={(e) => setOwner({ ...owner, motivation: e.target.value })}
                  placeholder="Décrivez ce qui vous motive à réaliser ce projet..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="vision">Vision à long terme</Label>
                <Textarea
                  id="vision"
                  value={owner.vision || ''}
                  onChange={(e) => setOwner({ ...owner, vision: e.target.value })}
                  placeholder="Quelle est votre vision pour l'avenir de ce projet ?"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingOwner(false)
                    loadOwnerInfo() // Recharger les données originales
                  }}
                  disabled={savingOwner}
                >
                  Annuler
                </Button>
                <Button
                  onClick={saveOwnerInfo}
                  disabled={savingOwner}
                >
                  {savingOwner ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {owner.first_name ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{owner.first_name} {owner.last_name}</span>
                    </div>
                    {owner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{owner.email}</span>
                      </div>
                    )}
                    {owner.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{owner.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {owner.title && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{owner.title}</span>
                      </div>
                    )}
                    {owner.experience_years && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Expérience :</span>
                        <span className="text-sm text-gray-600 ml-2">{owner.experience_years} ans</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucune information sur le porteur de projet</p>
                  <p className="text-xs text-gray-400">Cliquez sur "Ajouter" pour compléter votre profil</p>
                </div>
              )}

              {(owner.motivation || owner.vision) && (
                <div className="border-t pt-4 space-y-3">
                  {owner.motivation && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Motivation</h4>
                      <p className="text-sm text-gray-600">{owner.motivation}</p>
                    </div>
                  )}
                  {owner.vision && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Vision</h4>
                      <p className="text-sm text-gray-600">{owner.vision}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques clés */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Statistiques du projet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Produits/Services"
            value={stats.products_count}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Chiffre d'affaires total"
            value={formatCurrency(stats.total_revenue)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Bénéfice total"
            value={formatCurrency(stats.total_profit)}
            icon={TrendingUp}
            color={stats.total_profit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Mois calculés"
            value={`${stats.months_calculated}/${project.horizon_years * 12}`}
            icon={Calendar}
            color="purple"
          />
        </div>
      </div>

      {/* Alertes et indicateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Santé financière */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {stats.min_cash_balance >= 0 ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              )}
              Santé financière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trésorerie minimale:</span>
              <span className={`font-semibold ${stats.min_cash_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.min_cash_balance)}
              </span>
            </div>

            {stats.break_even_month && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Point d'équilibre:</span>
                <span className="font-semibold text-green-600">
                  Mois {stats.break_even_month}
                </span>
              </div>
            )}

            {stats.total_profit > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rentabilité:</span>
                <span className="font-semibold text-green-600">
                  {((stats.total_profit / stats.total_revenue) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions recommandées */}
        <Card>
          <CardHeader>
            <CardTitle>Actions recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.products_count === 0 && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ajouter des produits/services</p>
                    <p className="text-xs text-gray-600">
                      Commencez par définir vos offres dans l'onglet "Produits/Services"
                    </p>
                  </div>
                </div>
              )}

              {stats.months_calculated === 0 && stats.products_count > 0 && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ajouter des projections de ventes</p>
                    <p className="text-xs text-gray-600">
                      Définissez vos volumes de vente dans l'onglet "Ventes"
                    </p>
                  </div>
                </div>
              )}

              {stats.months_calculated > 0 && stats.min_cash_balance < 0 && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Besoin de financement détecté</p>
                    <p className="text-xs text-gray-600">
                      Votre projet nécessite un financement de {formatCurrency(Math.abs(stats.min_cash_balance))}
                    </p>
                  </div>
                </div>
              )}

              {stats.total_profit > 0 && stats.min_cash_balance >= 0 && (
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Projet viable financièrement</p>
                    <p className="text-xs text-gray-600">
                      Votre projet génère des bénéfices et maintient une trésorerie positive
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fiche Synoptique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Fiche Synoptique
              </div>
              <Button
                onClick={() => setShowSynopticSheet(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Générer Fiche
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Générez une fiche synoptique professionnelle de votre projet incluant toutes les informations
              essentielles : présentation de l'entreprise, détails du projet, conditions de financement
              et garanties requises.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affichage de la fiche synoptique */}
      {showSynopticSheet && (
        <SynopticSheet
          project={project}
          onBack={() => setShowSynopticSheet(false)}
        />
      )}
    </div>
  )
}