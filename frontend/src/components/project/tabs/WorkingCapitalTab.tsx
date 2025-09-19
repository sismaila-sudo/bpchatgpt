'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Clock, Package, CreditCard, TrendingDown, TrendingUp, Calculator } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WorkingCapitalItem {
  id?: string
  project_id: string
  item_type: 'DSO' | 'DPO' | 'STOCK_MP' | 'STOCK_PF' | 'AUTRES_CREANCES' | 'AUTRES_DETTES'
  name: string
  days: number
  percentage_of_ca?: number
  fixed_amount?: number
  calculation_type: 'PERCENTAGE_CA' | 'FIXED_AMOUNT' | 'DAYS_CA'
  notes?: string
}

interface WorkingCapitalTabProps {
  project: any
}

export function WorkingCapitalTab({ project }: WorkingCapitalTabProps) {
  const [wcItems, setWcItems] = useState<WorkingCapitalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Omit<WorkingCapitalItem, 'id'>>({
    project_id: project.id,
    item_type: 'DSO',
    name: '',
    days: 30,
    percentage_of_ca: 0,
    fixed_amount: 0,
    calculation_type: 'DAYS_CA',
    notes: ''
  })

  const supabase = createClient()

  const itemTypes = [
    { value: 'DSO', label: 'DSO - Délai de recouvrement clients', icon: Clock, description: 'Créances clients' },
    { value: 'DPO', label: 'DPO - Délai de paiement fournisseurs', icon: CreditCard, description: 'Dettes fournisseurs' },
    { value: 'STOCK_MP', label: 'Stock matières premières', icon: Package, description: 'Rotation stock MP' },
    { value: 'STOCK_PF', label: 'Stock produits finis', icon: Package, description: 'Rotation stock PF' },
    { value: 'AUTRES_CREANCES', label: 'Autres créances', icon: TrendingUp, description: 'TVA, avances...' },
    { value: 'AUTRES_DETTES', label: 'Autres dettes', icon: TrendingDown, description: 'Charges sociales, fiscales...' }
  ]

  const calculationTypes = [
    { value: 'DAYS_CA', label: 'Nombre de jours de CA' },
    { value: 'PERCENTAGE_CA', label: 'Pourcentage du CA' },
    { value: 'FIXED_AMOUNT', label: 'Montant fixe' }
  ]

  useEffect(() => {
    if (project?.id) {
      fetchWCItems()
    }
  }, [project])

  const fetchWCItems = async () => {
    try {
      const { data, error } = await supabase
        .from('working_capital_items')
        .select('*')
        .eq('project_id', project.id)
        .order('item_type')

      if (error) throw error
      setWcItems(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement du BFR:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const { error } = await supabase
          .from('working_capital_items')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('working_capital_items')
          .insert([formData])

        if (error) throw error
      }

      await fetchWCItems()
      resetForm()
      alert(editingId ? 'Élément BFR mis à jour !' : 'Élément BFR créé !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (item: WorkingCapitalItem) => {
    setFormData({
      project_id: item.project_id,
      item_type: item.item_type,
      name: item.name,
      days: item.days,
      percentage_of_ca: item.percentage_of_ca,
      fixed_amount: item.fixed_amount,
      calculation_type: item.calculation_type,
      notes: item.notes
    })
    setEditingId(item.id || null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet élément du BFR ?')) return

    try {
      const { error } = await supabase
        .from('working_capital_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchWCItems()
      alert('Élément supprimé !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: project.id,
      item_type: 'DSO',
      name: '',
      days: 30,
      percentage_of_ca: 0,
      fixed_amount: 0,
      calculation_type: 'DAYS_CA',
      notes: ''
    })
    setEditingId(null)
  }

  const handleItemTypeChange = (value: string) => {
    const itemType = itemTypes.find(t => t.value === value)
    setFormData(prev => ({
      ...prev,
      item_type: value as WorkingCapitalItem['item_type'],
      name: itemType?.label || '',
      calculation_type: value.includes('STOCK') ? 'DAYS_CA' : value === 'DSO' || value === 'DPO' ? 'DAYS_CA' : 'PERCENTAGE_CA'
    }))
  }

  const calculateTotalWC = () => {
    // Simulation basée sur un CA estimé de 10M XOF
    const estimatedCA = 10000000
    const dailyCA = estimatedCA / 365

    let totalCreances = 0
    let totalDettes = 0

    wcItems.forEach(item => {
      let amount = 0

      if (item.calculation_type === 'DAYS_CA') {
        amount = dailyCA * item.days
      } else if (item.calculation_type === 'PERCENTAGE_CA') {
        amount = estimatedCA * ((item.percentage_of_ca || 0) / 100)
      } else {
        amount = item.fixed_amount || 0
      }

      if (['DSO', 'STOCK_MP', 'STOCK_PF', 'AUTRES_CREANCES'].includes(item.item_type)) {
        totalCreances += amount
      } else {
        totalDettes += amount
      }
    })

    return { totalCreances, totalDettes, bfr: totalCreances - totalDettes }
  }

  const wcCalculation = calculateTotalWC()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé du BFR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Créances Totales</p>
                <p className="text-2xl font-bold text-blue-900">
                  {wcCalculation.totalCreances.toLocaleString()} XOF
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Dettes Totales</p>
                <p className="text-2xl font-bold text-red-900">
                  {wcCalculation.totalDettes.toLocaleString()} XOF
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${
          wcCalculation.bfr >= 0
            ? 'from-green-50 to-green-100'
            : 'from-orange-50 to-orange-100'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  wcCalculation.bfr >= 0 ? 'text-green-800' : 'text-orange-800'
                }`}>
                  BFR (Besoin en Fonds de Roulement)
                </p>
                <p className={`text-2xl font-bold ${
                  wcCalculation.bfr >= 0 ? 'text-green-900' : 'text-orange-900'
                }`}>
                  {wcCalculation.bfr.toLocaleString()} XOF
                </p>
              </div>
              <Calculator className={`h-8 w-8 ${
                wcCalculation.bfr >= 0 ? 'text-green-600' : 'text-orange-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout/modification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingId ? 'Modifier l\'élément BFR' : 'Ajouter un élément BFR'}
          </CardTitle>
          <CardDescription>
            Configurez les éléments du besoin en fonds de roulement (DSO, DPO, stocks)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item_type">Type d'élément</Label>
                <Select value={formData.item_type} onValueChange={handleItemTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    {itemTypes.map(type => (
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
                  placeholder="Description de l'élément"
                  required
                />
              </div>

              <div>
                <Label htmlFor="calculation_type">Mode de calcul</Label>
                <Select value={formData.calculation_type} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, calculation_type: value as WorkingCapitalItem['calculation_type'] }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    {calculationTypes.map(calc => (
                      <SelectItem key={calc.value} value={calc.value}>
                        {calc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.calculation_type === 'DAYS_CA' && (
                <div>
                  <Label htmlFor="days">Nombre de jours</Label>
                  <Input
                    id="days"
                    type="number"
                    min="0"
                    value={formData.days === 0 ? '' : formData.days}
                    onChange={(e) => setFormData(prev => ({ ...prev, days: Number(e.target.value) || 0 }))}
                    placeholder="Ex: 30"
                    required
                  />
                </div>
              )}

              {formData.calculation_type === 'PERCENTAGE_CA' && (
                <div>
                  <Label htmlFor="percentage_of_ca">Pourcentage du CA (%)</Label>
                  <Input
                    id="percentage_of_ca"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.percentage_of_ca === 0 ? '' : formData.percentage_of_ca || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, percentage_of_ca: Number(e.target.value) || 0 }))}
                    placeholder="Ex: 5.5"
                    required
                  />
                </div>
              )}

              {formData.calculation_type === 'FIXED_AMOUNT' && (
                <div>
                  <Label htmlFor="fixed_amount">Montant fixe (XOF)</Label>
                  <Input
                    id="fixed_amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.fixed_amount === 0 ? '' : formData.fixed_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fixed_amount: Number(e.target.value) || 0 }))}
                    placeholder="Ex: 100000"
                    required
                  />
                </div>
              )}
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

      {/* Liste des éléments BFR */}
      <Card>
        <CardHeader>
          <CardTitle>Éléments du BFR</CardTitle>
          <CardDescription>
            {wcItems.length} élément(s) configuré(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wcItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun élément BFR configuré</p>
              <p className="text-sm">Commencez par ajouter des éléments ci-dessus</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Nom</th>
                    <th className="text-left py-2">Calcul</th>
                    <th className="text-right py-2">Valeur</th>
                    <th className="text-right py-2">Impact BFR</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wcItems.map((item) => {
                    const itemTypeInfo = itemTypes.find(t => t.value === item.item_type)
                    const isAsset = ['DSO', 'STOCK_MP', 'STOCK_PF', 'AUTRES_CREANCES'].includes(item.item_type)

                    let displayValue = ''
                    if (item.calculation_type === 'DAYS_CA') {
                      displayValue = `${item.days} jours`
                    } else if (item.calculation_type === 'PERCENTAGE_CA') {
                      displayValue = `${item.percentage_of_ca}% du CA`
                    } else {
                      displayValue = `${(item.fixed_amount || 0).toLocaleString()} XOF`
                    }

                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 font-medium">{item.item_type}</td>
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-gray-600">
                          {calculationTypes.find(c => c.value === item.calculation_type)?.label}
                        </td>
                        <td className="py-2 text-right">{displayValue}</td>
                        <td className="py-2 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isAsset
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isAsset ? 'Besoin' : 'Ressource'}
                          </span>
                        </td>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}