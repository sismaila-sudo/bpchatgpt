'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, DollarSign, Wrench, Car, Monitor, Building, MoreHorizontal } from 'lucide-react'

interface CapexItem {
  id: string
  name: string
  category: string
  amount: number
  purchase_year: number
  purchase_month: number
  depreciation_years: number
  depreciation_method: string
  residual_value: number
  description: string
  created_at: string
}

interface CapexTabProps {
  project: any
}

const categories = [
  { id: 'equipement', label: 'Équipements', icon: Wrench, color: 'blue' },
  { id: 'vehicules', label: 'Véhicules', icon: Car, color: 'green' },
  { id: 'informatique', label: 'Informatique', icon: Monitor, color: 'purple' },
  { id: 'travaux', label: 'Travaux/Aménagement', icon: Building, color: 'orange' },
  { id: 'autres', label: 'Autres', icon: MoreHorizontal, color: 'gray' }
]

const depreciationMethods = [
  { id: 'linear', label: 'Linéaire' },
  { id: 'declining', label: 'Dégressif' }
]

export function CapexTab({ project }: CapexTabProps) {
  const [capexItems, setCapexItems] = useState<CapexItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<CapexItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'equipement',
    amount: 0,
    purchase_year: new Date(project.start_date).getFullYear(),
    purchase_month: 1,
    depreciation_years: 5,
    depreciation_method: 'linear',
    residual_value: 0,
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadCapexItems()
  }, [project.id])

  const loadCapexItems = async () => {
    try {
      const { data, error } = await supabase
        .from('capex')
        .select('*')
        .eq('project_id', project.id)
        .order('purchase_year, purchase_month, created_at')

      if (error) throw error
      setCapexItems(data || [])
    } catch (error) {
      console.error('Erreur chargement CAPEX:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Le nom de l\'investissement est requis')
      return
    }

    if (formData.amount <= 0) {
      alert('Le montant doit être supérieur à 0')
      return
    }

    console.log('Sauvegarde CAPEX:', { project_id: project.id, formData })

    try {
      if (editingItem) {
        // Modifier
        const { data, error } = await supabase
          .from('capex')
          .update({
            name: formData.name.trim(),
            category: formData.category,
            amount: formData.amount,
            purchase_year: formData.purchase_year,
            purchase_month: formData.purchase_month,
            depreciation_years: formData.depreciation_years,
            depreciation_method: formData.depreciation_method,
            residual_value: formData.residual_value,
            description: formData.description.trim()
          })
          .eq('id', editingItem.id)
          .select()

        if (error) {
          console.error('Erreur Supabase CAPEX update:', error)
          throw error
        }
        console.log('CAPEX modifié:', data)
      } else {
        // Créer
        const insertData = {
          project_id: project.id,
          name: formData.name.trim(),
          category: formData.category,
          amount: formData.amount,
          purchase_year: formData.purchase_year,
          purchase_month: formData.purchase_month,
          depreciation_years: formData.depreciation_years,
          depreciation_method: formData.depreciation_method,
          residual_value: formData.residual_value,
          description: formData.description.trim()
        }

        console.log('Insertion CAPEX:', insertData)

        const { data, error } = await supabase
          .from('capex')
          .insert(insertData)
          .select()

        if (error) {
          console.error('Erreur Supabase CAPEX insert:', error)
          throw error
        }
        console.log('CAPEX créé:', data)
      }

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        category: 'equipement',
        amount: 0,
        purchase_year: new Date(project.start_date).getFullYear(),
        purchase_month: 1,
        depreciation_years: 5,
        depreciation_method: 'linear',
        residual_value: 0,
        description: ''
      })
      setEditingItem(null)
      setShowForm(false)

      // Recharger la liste
      await loadCapexItems()
    } catch (error: any) {
      console.error('Erreur sauvegarde CAPEX:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handleEdit = (item: CapexItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      amount: item.amount,
      purchase_year: item.purchase_year,
      purchase_month: item.purchase_month,
      depreciation_years: item.depreciation_years,
      depreciation_method: item.depreciation_method,
      residual_value: item.residual_value,
      description: item.description
    })
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet investissement ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('capex')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      loadCapexItems()
    } catch (error) {
      console.error('Erreur suppression CAPEX:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: project.organizations?.currency || 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    const IconComponent = category?.icon || MoreHorizontal
    return <IconComponent className="h-4 w-4" />
  }

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.label || categoryId
  }

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ]
    return months[month - 1]
  }

  const calculateMonthlyDepreciation = (item: CapexItem) => {
    return (item.amount - item.residual_value) / (item.depreciation_years * 12)
  }

  const calculateTotalInvestment = () => {
    return capexItems.reduce((total, item) => total + item.amount, 0)
  }

  const calculateTotalDepreciation = () => {
    return capexItems.reduce((total, item) => total + calculateMonthlyDepreciation(item), 0)
  }

  const groupedItems = categories.map(category => ({
    ...category,
    items: capexItems.filter(item => item.category === category.id),
    total: capexItems
      .filter(item => item.category === category.id)
      .reduce((sum, item) => sum + item.amount, 0)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-blue-600" />
            Investissements (CAPEX)
          </h2>
          <p className="text-gray-600 mt-1">
            Définissez vos investissements : équipements, véhicules, travaux, etc.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total investissements</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(calculateTotalInvestment())}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Amortissement mensuel</p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(calculateTotalDepreciation())}
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData({
                name: '',
                category: 'equipement',
                amount: 0,
                purchase_year: new Date(project.start_date).getFullYear(),
                purchase_month: 1,
                depreciation_years: 5,
                depreciation_method: 'linear',
                residual_value: 0,
                description: ''
              })
              setEditingItem(null)
              setShowForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel investissement
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Modifier l\'investissement' : 'Nouvel investissement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'investissement *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Four professionnel, Camionnette, Ordinateur..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant ({project.organizations?.currency || 'XOF'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année d'achat
                  </label>
                  <input
                    type="number"
                    min={new Date(project.start_date).getFullYear()}
                    max={new Date(project.start_date).getFullYear() + project.horizon_years}
                    value={formData.purchase_year}
                    onChange={(e) => setFormData({ ...formData, purchase_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois d'achat
                  </label>
                  <select
                    value={formData.purchase_month}
                    onChange={(e) => setFormData({ ...formData, purchase_month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée d'amortissement (années)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.depreciation_years}
                    onChange={(e) => setFormData({ ...formData, depreciation_years: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeur résiduelle ({project.organizations?.currency || 'XOF'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.residual_value || ''}
                    onChange={(e) => setFormData({ ...formData, residual_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Détails sur cet investissement..."
                  />
                </div>
              </div>

              {/* Calcul amortissement */}
              {formData.amount > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Amortissement mensuel:</strong> {formatCurrency((formData.amount - formData.residual_value) / (formData.depreciation_years * 12))}
                    <br />
                    <strong>Impact annuel:</strong> {formatCurrency((formData.amount - formData.residual_value) / formData.depreciation_years)}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste par catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupedItems.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <category.icon className="h-5 w-5 mr-2 text-blue-600" />
                  {category.label}
                </span>
                <span className="text-sm font-normal text-gray-600">
                  {formatCurrency(category.total)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {category.items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Aucun investissement dans cette catégorie
                </p>
              ) : (
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.amount)} • {getMonthName(item.purchase_month)} {item.purchase_year}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          Amortissement: {formatCurrency(calculateMonthlyDepreciation(item))}/mois
                          ({item.depreciation_years} ans)
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conseils */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-900 mb-2">
          💡 Conseils CAPEX
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Équipements :</strong> Machines, outils, mobilier professionnel</li>
          <li>• <strong>Véhicules :</strong> Voitures, camionnettes, matériel de transport</li>
          <li>• <strong>Informatique :</strong> Ordinateurs, serveurs, logiciels</li>
          <li>• <strong>Travaux :</strong> Aménagements, rénovations, installations</li>
          <li>• L'amortissement étale le coût sur plusieurs années</li>
          <li>• Pensez à la valeur de revente (valeur résiduelle)</li>
        </ul>
      </div>
    </div>
  )
}