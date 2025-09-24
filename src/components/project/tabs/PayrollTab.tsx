'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Users, Calculator, TrendingUp, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PayrollItem {
  id?: string
  project_id: string
  role: string
  gross_monthly: number
  employer_charges_pct: number
  headcount_current: number
  headcount_plan: number[] // 36 mois
  hire_date: string
  department: string
}

interface PayrollTabProps {
  project: any
}

export function PayrollTab({ project }: PayrollTabProps) {
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Omit<PayrollItem, 'id'>>({
    project_id: project.id,
    role: '',
    gross_monthly: 0,
    employer_charges_pct: 22, // Charges patronales standard
    headcount_current: 1,
    headcount_plan: Array(36).fill(1),
    hire_date: new Date().toISOString().split('T')[0],
    department: 'General'
  })

  const supabase = createClient()

  const departments = [
    'Direction',
    'Commercial',
    'Production',
    'Administration',
    'Finance',
    'RH',
    'IT',
    'General'
  ]

  useEffect(() => {
    if (project?.id) {
      fetchPayrollItems()
    }
  }, [project])

  const fetchPayrollItems = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('project_id', project.id)
        .order('role')

      if (error) throw error
      setPayrollItems(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement de la paie:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Mise à jour
        const { error } = await supabase
          .from('payroll_items')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Création
        const { error } = await supabase
          .from('payroll_items')
          .insert([formData])

        if (error) throw error
      }

      await fetchPayrollItems()
      resetForm()
      alert(editingId ? 'Poste mis à jour !' : 'Poste créé !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (item: PayrollItem) => {
    setFormData({
      project_id: item.project_id,
      role: item.role,
      gross_monthly: item.gross_monthly,
      employer_charges_pct: item.employer_charges_pct,
      headcount_current: item.headcount_current,
      headcount_plan: item.headcount_plan,
      hire_date: item.hire_date,
      department: item.department
    })
    setEditingId(item.id || null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce poste ?')) return

    try {
      const { error } = await supabase
        .from('payroll_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchPayrollItems()
      alert('Poste supprimé !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: project.id,
      role: '',
      gross_monthly: 0,
      employer_charges_pct: 22,
      headcount_current: 1,
      headcount_plan: Array(36).fill(1),
      hire_date: new Date().toISOString().split('T')[0],
      department: 'General'
    })
    setEditingId(null)
  }

  const calculateTotalMonthlyCost = () => {
    return payrollItems.reduce((total, item) => {
      const grossCost = item.gross_monthly * item.headcount_current
      const employerCharges = grossCost * (item.employer_charges_pct / 100)
      return total + grossCost + employerCharges
    }, 0)
  }

  const calculateTotalHeadcount = () => {
    return payrollItems.reduce((total, item) => total + item.headcount_current, 0)
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
      {/* Résumé de la masse salariale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Effectif Total</p>
                <p className="text-2xl font-bold text-blue-900">{calculateTotalHeadcount()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Coût Mensuel Brut</p>
                <p className="text-2xl font-bold text-green-900">
                  {calculateTotalMonthlyCost().toLocaleString()} XOF
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Coût Annuel</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(calculateTotalMonthlyCost() * 12).toLocaleString()} XOF
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout/modification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingId ? 'Modifier le poste' : 'Ajouter un poste'}
          </CardTitle>
          <CardDescription>
            Définissez les postes, salaires et charges sociales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="role">Poste/Rôle</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Directeur, Commercial..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">Département</Label>
                <Select value={formData.department} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, department: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gross_monthly">Salaire Brut Mensuel (XOF)</Label>
                <Input
                  id="gross_monthly"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.gross_monthly === 0 ? '' : formData.gross_monthly}
                  onChange={(e) => setFormData(prev => ({ ...prev, gross_monthly: Number(e.target.value) || 0 }))}
                  placeholder="Ex: 500000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="employer_charges_pct">Charges Patronales (%)</Label>
                <Input
                  id="employer_charges_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.employer_charges_pct === 0 ? '' : formData.employer_charges_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, employer_charges_pct: Number(e.target.value) || 22 }))}
                  placeholder="Ex: 22"
                  required
                />
              </div>

              <div>
                <Label htmlFor="headcount_current">Effectif Actuel</Label>
                <Input
                  id="headcount_current"
                  type="number"
                  min="1"
                  value={formData.headcount_current === 0 ? '' : formData.headcount_current}
                  onChange={(e) => setFormData(prev => ({ ...prev, headcount_current: Number(e.target.value) || 1 }))}
                  placeholder="Ex: 2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hire_date">Date d'embauche</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                />
              </div>
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

      {/* Liste des postes */}
      <Card>
        <CardHeader>
          <CardTitle>Grille salariale</CardTitle>
          <CardDescription>
            {payrollItems.length} poste(s) défini(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun poste défini</p>
              <p className="text-sm">Commencez par ajouter des postes ci-dessus</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Poste</th>
                    <th className="text-left py-2">Département</th>
                    <th className="text-right py-2">Salaire Brut</th>
                    <th className="text-right py-2">Charges (%)</th>
                    <th className="text-right py-2">Effectif</th>
                    <th className="text-right py-2">Coût Total</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollItems.map((item) => {
                    const grossCost = item.gross_monthly * item.headcount_current
                    const employerCharges = grossCost * (item.employer_charges_pct / 100)
                    const totalCost = grossCost + employerCharges

                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 font-medium">{item.role}</td>
                        <td className="py-2 text-gray-600">{item.department}</td>
                        <td className="py-2 text-right">{item.gross_monthly.toLocaleString()}</td>
                        <td className="py-2 text-right">{item.employer_charges_pct}%</td>
                        <td className="py-2 text-right">{item.headcount_current}</td>
                        <td className="py-2 text-right font-medium">
                          {totalCost.toLocaleString()} XOF
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