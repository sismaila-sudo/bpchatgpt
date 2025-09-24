'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Users, MapPin, Megaphone, FileText, MoreHorizontal } from 'lucide-react'

interface OpexItem {
  id: string
  name: string
  category: string
  amount: number
  frequency: string
  start_year: number
  start_month: number
  escalation_rate: number
  description: string
  created_at: string
}

interface OpexTabProps {
  project: any
}

const categories = [
  { id: 'personnel', label: 'Personnel', icon: Users, color: 'blue' },
  { id: 'location', label: 'Location/Loyer', icon: MapPin, color: 'green' },
  { id: 'marketing', label: 'Marketing/Pub', icon: Megaphone, color: 'purple' },
  { id: 'frais_generaux', label: 'Frais généraux', icon: FileText, color: 'orange' },
  { id: 'autres', label: 'Autres', icon: MoreHorizontal, color: 'gray' }
]

const frequencies = [
  { id: 'monthly', label: 'Mensuel' },
  { id: 'quarterly', label: 'Trimestriel' },
  { id: 'yearly', label: 'Annuel' }
]

export function OpexTab({ project }: OpexTabProps) {
  const [opexItems, setOpexItems] = useState<OpexItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<OpexItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'personnel',
    amount: 0,
    frequency: 'monthly',
    start_year: new Date(project.start_date).getFullYear(),
    start_month: new Date(project.start_date).getMonth() + 1, // Vraie date projet par défaut
    escalation_rate: 0,
    description: '',
    use_custom_date: false // Nouvelle option pour personnaliser
  })

  const supabase = createClient()

  useEffect(() => {
    loadOpexItems()
  }, [project.id])

  // Effet pour gérer la synchronisation automatique avec la date projet
  useEffect(() => {
    if (!formData.use_custom_date) {
      const projectStartDate = new Date(project.start_date)
      setFormData(prev => ({
        ...prev,
        start_year: projectStartDate.getFullYear(),
        start_month: projectStartDate.getMonth() + 1
      }))
    }
  }, [formData.use_custom_date, project.start_date])

  const loadOpexItems = async () => {
    try {
      const { data, error } = await supabase
        .from('opex')
        .select('*')
        .eq('project_id', project.id)
        .order('category, created_at')

      if (error) throw error
      setOpexItems(data || [])
    } catch (error) {
      console.error('Erreur chargement OPEX:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Le nom de la charge est requis')
      return
    }

    if (formData.amount <= 0) {
      alert('Le montant doit être supérieur à 0')
      return
    }

    // Calculer les vraies dates à utiliser (par défaut = date projet)
    const finalStartYear = formData.use_custom_date ? formData.start_year : new Date(project.start_date).getFullYear()
    const finalStartMonth = formData.use_custom_date ? formData.start_month : new Date(project.start_date).getMonth() + 1

    console.log('Sauvegarde OPEX:', {
      project_id: project.id,
      formData,
      finalDates: { finalStartYear, finalStartMonth }
    })

    try {
      if (editingItem) {
        // Modifier
        const { data, error } = await supabase
          .from('opex')
          .update({
            name: formData.name.trim(),
            category: formData.category,
            amount: formData.amount,
            frequency: formData.frequency,
            start_year: finalStartYear,
            start_month: finalStartMonth,
            escalation_rate: formData.escalation_rate,
            description: formData.description.trim()
          })
          .eq('id', editingItem.id)
          .select()

        if (error) {
          console.error('Erreur Supabase OPEX update:', error)
          throw error
        }
        console.log('OPEX modifié:', data)
      } else {
        // Créer
        const insertData = {
          project_id: project.id,
          name: formData.name.trim(),
          category: formData.category,
          amount: formData.amount,
          frequency: formData.frequency,
          start_year: finalStartYear,
          start_month: finalStartMonth,
          escalation_rate: formData.escalation_rate,
          description: formData.description.trim()
        }

        console.log('Insertion OPEX:', insertData)

        const { data, error } = await supabase
          .from('opex')
          .insert(insertData)
          .select()

        if (error) {
          console.error('Erreur Supabase OPEX insert:', error)
          throw error
        }
        console.log('OPEX créé:', data)
      }

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        category: 'personnel',
        amount: 0,
        frequency: 'monthly',
        start_year: new Date(project.start_date).getFullYear(),
        start_month: new Date(project.start_date).getMonth() + 1,
        escalation_rate: 0,
        description: '',
        use_custom_date: false
      })
      setEditingItem(null)
      setShowForm(false)

      // Recharger la liste
      await loadOpexItems()
    } catch (error: any) {
      console.error('Erreur sauvegarde OPEX:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handleEdit = (item: OpexItem) => {
    // Déterminer si l'item utilise une date personnalisée
    const projectStartDate = new Date(project.start_date)
    const projectStartYear = projectStartDate.getFullYear()
    const projectStartMonth = projectStartDate.getMonth() + 1
    const isCustomDate = item.start_year !== projectStartYear || item.start_month !== projectStartMonth

    setFormData({
      name: item.name,
      category: item.category,
      amount: item.amount,
      frequency: item.frequency,
      start_year: item.start_year,
      start_month: item.start_month,
      escalation_rate: item.escalation_rate,
      description: item.description,
      use_custom_date: isCustomDate
    })
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('opex')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      loadOpexItems()
    } catch (error) {
      console.error('Erreur suppression OPEX:', error)
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

  const getFrequencyLabel = (frequencyId: string) => {
    return frequencies.find(f => f.id === frequencyId)?.label || frequencyId
  }

  const calculateMonthlyEquivalent = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'yearly': return amount / 12
      case 'quarterly': return amount / 3
      default: return amount
    }
  }

  const calculateAnnualTotal = () => {
    return opexItems.reduce((total, item) => {
      const monthlyEquiv = calculateMonthlyEquivalent(item.amount, item.frequency)
      return total + (monthlyEquiv * 12)
    }, 0)
  }

  const groupedItems = categories.map(category => ({
    ...category,
    items: opexItems.filter(item => item.category === category.id),
    total: opexItems
      .filter(item => item.category === category.id)
      .reduce((sum, item) => sum + calculateMonthlyEquivalent(item.amount, item.frequency) * 12, 0)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            Charges Opérationnelles (OPEX)
          </h2>
          <p className="text-gray-600 mt-1">
            Définissez vos charges récurrentes : personnel, loyer, marketing, etc.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total annuel</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(calculateAnnualTotal())}
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData({
                name: '',
                category: 'personnel',
                amount: 0,
                frequency: 'monthly',
                start_year: new Date(project.start_date).getFullYear(),
                start_month: new Date(project.start_date).getMonth() + 1,
                escalation_rate: 0,
                description: '',
                use_custom_date: false
              })
              setEditingItem(null)
              setShowForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle charge
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Modifier la charge' : 'Nouvelle charge'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la charge *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Salaire développeur, Loyer bureau..."
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
                    Fréquence
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {frequencies.map(freq => (
                      <option key={freq.id} value={freq.id}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant ({project.organizations?.currency || 'XOF'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    📅 Date de début de la charge
                  </label>

                  {/* Option par défaut */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="use_custom_date"
                        checked={formData.use_custom_date}
                        onChange={(e) => setFormData({ ...formData, use_custom_date: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="use_custom_date" className="text-sm text-gray-700">
                        Personnaliser la date de début
                      </label>
                    </div>

                    {/* Affichage conditionnel */}
                    {!formData.use_custom_date ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-sm text-green-800">
                          <strong>✅ Date automatique :</strong> {new Date(project.start_date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Cette charge démarrera avec le projet. Idéal pour la plupart des charges opérationnelles.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800 mb-3">
                          <strong>⚙️ Date personnalisée :</strong> Utile pour cas spéciaux (ex: loyer pour aménagements, décalage marketing)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Année de début
                            </label>
                            <input
                              type="number"
                              min={new Date(project.start_date).getFullYear()}
                              max={new Date(project.start_date).getFullYear() + project.horizon_years}
                              value={formData.start_year}
                              onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Mois de début
                            </label>
                            <select
                              value={formData.start_month}
                              onChange={(e) => setFormData({ ...formData, start_month: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month}>
                                  {new Date(2000, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                    placeholder="Détails sur cette charge..."
                  />
                </div>
              </div>

              {/* Équivalent mensuel */}
              {formData.amount > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Équivalent mensuel:</strong> {formatCurrency(calculateMonthlyEquivalent(formData.amount, formData.frequency))}
                    <br />
                    <strong>Impact annuel:</strong> {formatCurrency(calculateMonthlyEquivalent(formData.amount, formData.frequency) * 12)}
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
                  {formatCurrency(category.total)}/an
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {category.items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Aucune charge dans cette catégorie
                </p>
              ) : (
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.amount)} / {getFrequencyLabel(item.frequency)}
                          <span className="ml-2 text-xs">
                            (≈ {formatCurrency(calculateMonthlyEquivalent(item.amount, item.frequency))}/mois)
                          </span>
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
          💡 Conseils OPEX
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Personnel :</strong> Salaires, charges sociales, primes</li>
          <li>• <strong>Location :</strong> Loyer, charges locatives, assurances</li>
          <li>• <strong>Marketing :</strong> Publicité, événements, communication</li>
          <li>• <strong>Frais généraux :</strong> Comptabilité, juridique, fournitures</li>
          <li>• Pensez aux charges qui augmentent avec l'inflation</li>
        </ul>
      </div>
    </div>
  )
}