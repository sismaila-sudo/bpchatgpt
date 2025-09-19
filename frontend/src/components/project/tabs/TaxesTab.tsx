'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Calculator, Receipt, Percent, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TaxItem {
  id?: string
  project_id: string
  tax_type: 'IS' | 'TVA' | 'PATENTE' | 'TAXE_FORMATION' | 'AUTRE'
  name: string
  rate: number
  base_calculation: 'CA' | 'BENEFICE' | 'MASSE_SALARIALE' | 'FIXE'
  amount_fixed?: number
  is_active: boolean
  application_start_month: number
  notes?: string
}

interface TaxesTabProps {
  project: any
}

export function TaxesTab({ project }: TaxesTabProps) {
  const [taxItems, setTaxItems] = useState<TaxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Omit<TaxItem, 'id'>>({
    project_id: project.id,
    tax_type: 'TVA',
    name: '',
    rate: 18, // TVA standard Côte d'Ivoire
    base_calculation: 'CA',
    amount_fixed: 0,
    is_active: true,
    application_start_month: 1,
    notes: ''
  })

  const supabase = createClient()

  const taxTypes = [
    { value: 'IS', label: 'Impôt sur les Sociétés (IS)', defaultRate: 25 },
    { value: 'TVA', label: 'Taxe sur la Valeur Ajoutée (TVA)', defaultRate: 18 },
    { value: 'PATENTE', label: 'Patente', defaultRate: 0 },
    { value: 'TAXE_FORMATION', label: 'Taxe Formation Professionnelle', defaultRate: 1.2 },
    { value: 'AUTRE', label: 'Autre taxe', defaultRate: 0 }
  ]

  const baseCalculations = [
    { value: 'CA', label: 'Chiffre d\'affaires (CA)' },
    { value: 'BENEFICE', label: 'Bénéfice avant impôt' },
    { value: 'MASSE_SALARIALE', label: 'Masse salariale' },
    { value: 'FIXE', label: 'Montant fixe' }
  ]

  useEffect(() => {
    if (project?.id) {
      fetchTaxItems()
    }
  }, [project])

  const fetchTaxItems = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_items')
        .select('*')
        .eq('project_id', project.id)
        .order('tax_type')

      if (error) throw error
      setTaxItems(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des taxes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const { error } = await supabase
          .from('tax_items')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tax_items')
          .insert([formData])

        if (error) throw error
      }

      await fetchTaxItems()
      resetForm()
      alert(editingId ? 'Taxe mise à jour !' : 'Taxe créée !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (item: TaxItem) => {
    setFormData({
      project_id: item.project_id,
      tax_type: item.tax_type,
      name: item.name,
      rate: item.rate,
      base_calculation: item.base_calculation,
      amount_fixed: item.amount_fixed,
      is_active: item.is_active,
      application_start_month: item.application_start_month,
      notes: item.notes
    })
    setEditingId(item.id || null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette taxe ?')) return

    try {
      const { error } = await supabase
        .from('tax_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchTaxItems()
      alert('Taxe supprimée !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: project.id,
      tax_type: 'TVA',
      name: '',
      rate: 18,
      base_calculation: 'CA',
      amount_fixed: 0,
      is_active: true,
      application_start_month: 1,
      notes: ''
    })
    setEditingId(null)
  }

  const handleTaxTypeChange = (value: string) => {
    const taxType = taxTypes.find(t => t.value === value)
    setFormData(prev => ({
      ...prev,
      tax_type: value as TaxItem['tax_type'],
      name: taxType?.label || '',
      rate: taxType?.defaultRate || 0,
      base_calculation: value === 'IS' ? 'BENEFICE' : value === 'TVA' ? 'CA' : value === 'TAXE_FORMATION' ? 'MASSE_SALARIALE' : 'FIXE'
    }))
  }

  const calculateTotalTaxBurden = () => {
    return taxItems
      .filter(item => item.is_active)
      .reduce((total, item) => {
        if (item.base_calculation === 'FIXE') {
          return total + (item.amount_fixed || 0)
        }
        // Pour une estimation approximative, on suppose un CA de base
        const estimatedBase = 10000000 // 10M XOF
        return total + (estimatedBase * (item.rate / 100))
      }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé des taxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Taxes Actives</p>
                <p className="text-2xl font-bold text-red-900">
                  {taxItems.filter(item => item.is_active).length}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Charge Fiscale Estimée</p>
                <p className="text-2xl font-bold text-orange-900">
                  {calculateTotalTaxBurden().toLocaleString()} XOF
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Taux Moyen</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {taxItems.length > 0
                    ? (taxItems.reduce((sum, item) => sum + item.rate, 0) / taxItems.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout/modification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingId ? 'Modifier la taxe' : 'Ajouter une taxe'}
          </CardTitle>
          <CardDescription>
            Configurez les taxes et impôts applicables à votre projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax_type">Type de taxe</Label>
                <Select value={formData.tax_type} onValueChange={handleTaxTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    {taxTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Nom/Description</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de la taxe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="base_calculation">Base de calcul</Label>
                <Select value={formData.base_calculation} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, base_calculation: value as TaxItem['base_calculation'] }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    {baseCalculations.map(base => (
                      <SelectItem key={base.value} value={base.value}>
                        {base.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.base_calculation === 'FIXE' ? (
                <div>
                  <Label htmlFor="amount_fixed">Montant fixe (XOF)</Label>
                  <Input
                    id="amount_fixed"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.amount_fixed === 0 ? '' : formData.amount_fixed || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_fixed: Number(e.target.value) || 0 }))}
                    placeholder="Ex: 50000"
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="rate">Taux (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.rate === 0 ? '' : formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: Number(e.target.value) || 0 }))}
                    placeholder="Ex: 18"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="application_start_month">Mois d'application (1-36)</Label>
                <Input
                  id="application_start_month"
                  type="number"
                  min="1"
                  max="36"
                  value={formData.application_start_month === 0 ? '' : formData.application_start_month}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_start_month: Number(e.target.value) || 1 }))}
                  placeholder="Ex: 1"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Taxe active</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes ou commentaires"
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="h-4 w-4 mr-2" />
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Liste des taxes */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration fiscale</CardTitle>
          <CardDescription>
            {taxItems.length} taxe(s) configurée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune taxe configurée</p>
              <p className="text-sm">Commencez par ajouter des taxes ci-dessus</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Nom</th>
                    <th className="text-left py-2">Base</th>
                    <th className="text-right py-2">Taux/Montant</th>
                    <th className="text-center py-2">Active</th>
                    <th className="text-center py-2">Mois</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2 font-medium">{item.tax_type}</td>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-gray-600">
                        {baseCalculations.find(b => b.value === item.base_calculation)?.label}
                      </td>
                      <td className="py-2 text-right">
                        {item.base_calculation === 'FIXE'
                          ? `${(item.amount_fixed || 0).toLocaleString()} XOF`
                          : `${item.rate}%`
                        }
                      </td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="py-2 text-center">{item.application_start_month}</td>
                      <td className="py-2 text-right">
                        <div className="flex space-x-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}