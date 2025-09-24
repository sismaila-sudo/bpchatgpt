'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, CreditCard, Building, Users, Calculator } from 'lucide-react'

interface Loan {
  id: string
  name: string
  type: string
  principal_amount: number
  interest_rate: number
  duration_months: number
  start_year: number
  start_month: number
  grace_period_months: number
  description: string
  created_at: string
}

interface FinancingTabProps {
  project: any
}

const loanTypes = [
  { id: 'bank_loan', label: 'Prêt bancaire', icon: Building, color: 'blue' },
  { id: 'microfinance', label: 'Microfinance', icon: CreditCard, color: 'green' },
  { id: 'investor', label: 'Investisseur', icon: Users, color: 'purple' },
  { id: 'equipment', label: 'Crédit équipement', icon: Building, color: 'orange' },
  { id: 'working_capital', label: 'Crédit fonds de roulement', icon: CreditCard, color: 'red' }
]

export function FinancingTab({ project }: FinancingTabProps) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank_loan',
    principal_amount: 0,
    interest_rate: 10,
    duration_months: 36,
    start_year: new Date(project.start_date).getFullYear(),
    start_month: 1,
    grace_period_months: 0,
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadLoans()
  }, [project.id])

  const loadLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at')

      if (error) throw error
      setLoans(data || [])
    } catch (error) {
      console.error('Erreur chargement financements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Le nom du financement est requis')
      return
    }

    if (formData.principal_amount <= 0) {
      alert('Le montant doit être supérieur à 0')
      return
    }

    if (formData.interest_rate < 0 || formData.interest_rate > 50) {
      alert('Le taux d\'intérêt doit être entre 0 et 50%')
      return
    }

    console.log('Sauvegarde financement:', { project_id: project.id, formData })

    try {
      if (editingLoan) {
        // Modifier
        const { data, error } = await supabase
          .from('loans')
          .update({
            name: formData.name.trim(),
            type: formData.type,
            principal_amount: formData.principal_amount,
            interest_rate: formData.interest_rate,
            duration_months: formData.duration_months,
            start_year: formData.start_year,
            start_month: formData.start_month,
            grace_period_months: formData.grace_period_months,
            description: formData.description.trim()
          })
          .eq('id', editingLoan.id)
          .select()

        if (error) {
          console.error('Erreur Supabase financement update:', error)
          throw error
        }
        console.log('Financement modifié:', data)
      } else {
        // Créer
        const insertData = {
          project_id: project.id,
          name: formData.name.trim(),
          type: formData.type,
          principal_amount: formData.principal_amount,
          interest_rate: formData.interest_rate,
          duration_months: formData.duration_months,
          start_year: formData.start_year,
          start_month: formData.start_month,
          grace_period_months: formData.grace_period_months,
          description: formData.description.trim()
        }

        console.log('Insertion financement:', insertData)

        const { data, error } = await supabase
          .from('loans')
          .insert(insertData)
          .select()

        if (error) {
          console.error('Erreur Supabase financement insert:', error)
          throw error
        }
        console.log('Financement créé:', data)
      }

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        type: 'bank_loan',
        principal_amount: 0,
        interest_rate: 10,
        duration_months: 36,
        start_year: new Date(project.start_date).getFullYear(),
        start_month: 1,
        grace_period_months: 0,
        description: ''
      })
      setEditingLoan(null)
      setShowForm(false)

      // Recharger la liste
      await loadLoans()
    } catch (error: any) {
      console.error('Erreur sauvegarde financement:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handleEdit = (loan: Loan) => {
    setFormData({
      name: loan.name,
      type: loan.type,
      principal_amount: loan.principal_amount,
      interest_rate: loan.interest_rate,
      duration_months: loan.duration_months,
      start_year: loan.start_year,
      start_month: loan.start_month,
      grace_period_months: loan.grace_period_months,
      description: loan.description
    })
    setEditingLoan(loan)
    setShowForm(true)
  }

  const handleDelete = async (loanId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce financement ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId)

      if (error) throw error

      loadLoans()
    } catch (error) {
      console.error('Erreur suppression financement:', error)
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

  const calculateMonthlyPayment = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 100 / 12
    if (monthlyRate === 0) return principal / months
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  }

  const calculateTotalInterest = (principal: number, rate: number, months: number) => {
    const monthlyPayment = calculateMonthlyPayment(principal, rate, months)
    return (monthlyPayment * months) - principal
  }

  const getLoanTypeInfo = (type: string) => {
    return loanTypes.find(t => t.id === type) || loanTypes[0]
  }

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ]
    return months[month - 1]
  }

  const calculateTotalFinancing = () => {
    return loans.reduce((total, loan) => total + loan.principal_amount, 0)
  }

  const calculateTotalInterestPayable = () => {
    return loans.reduce((total, loan) => total + calculateTotalInterest(loan.principal_amount, loan.interest_rate, loan.duration_months), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
            Financements & Emprunts
          </h2>
          <p className="text-gray-600 mt-1">
            Définissez vos sources de financement : prêts bancaires, investisseurs, etc.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total financements</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(calculateTotalFinancing())}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Intérêts totaux</p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(calculateTotalInterestPayable())}
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData({
                name: '',
                type: 'bank_loan',
                principal_amount: 0,
                interest_rate: 10,
                duration_months: 36,
                start_year: new Date(project.start_date).getFullYear(),
                start_month: 1,
                grace_period_months: 0,
                description: ''
              })
              setEditingLoan(null)
              setShowForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau financement
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLoan ? 'Modifier le financement' : 'Nouveau financement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du financement *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Prêt équipement Banque ABC"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de financement
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {loanTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
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
                    step="1"
                    value={formData.principal_amount || ''}
                    onChange={(e) => setFormData({ ...formData, principal_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux d'intérêt annuel (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={formData.interest_rate || ''}
                    onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (mois)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 36 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année de début
                  </label>
                  <input
                    type="number"
                    min={new Date(project.start_date).getFullYear()}
                    max={new Date(project.start_date).getFullYear() + project.horizon_years}
                    value={formData.start_year}
                    onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois de début
                  </label>
                  <select
                    value={formData.start_month}
                    onChange={(e) => setFormData({ ...formData, start_month: parseInt(e.target.value) })}
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
                    Période de grâce (mois)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.grace_period_months}
                    onChange={(e) => setFormData({ ...formData, grace_period_months: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nombre de mois sans remboursement au début</p>
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
                    placeholder="Détails sur ce financement..."
                  />
                </div>
              </div>

              {/* Simulation */}
              {formData.principal_amount > 0 && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Simulation du remboursement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Mensualité :</span>
                      <div className="font-bold text-blue-900">
                        {formatCurrency(calculateMonthlyPayment(formData.principal_amount, formData.interest_rate, formData.duration_months))}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-700">Total intérêts :</span>
                      <div className="font-bold text-blue-900">
                        {formatCurrency(calculateTotalInterest(formData.principal_amount, formData.interest_rate, formData.duration_months))}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-700">Coût total :</span>
                      <div className="font-bold text-blue-900">
                        {formatCurrency(formData.principal_amount + calculateTotalInterest(formData.principal_amount, formData.interest_rate, formData.duration_months))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingLoan(null)
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingLoan ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des financements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans.map((loan) => {
          const typeInfo = getLoanTypeInfo(loan.type)
          const IconComponent = typeInfo.icon
          const monthlyPayment = calculateMonthlyPayment(loan.principal_amount, loan.interest_rate, loan.duration_months)
          const totalInterest = calculateTotalInterest(loan.principal_amount, loan.interest_rate, loan.duration_months)

          return (
            <Card key={loan.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className={`h-5 w-5 mr-2 text-${typeInfo.color}-600`} />
                    <span className="truncate">{loan.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(loan)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(loan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Capital :</span>
                      <div className="font-medium text-blue-600">{formatCurrency(loan.principal_amount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Taux :</span>
                      <div className="font-medium">{loan.interest_rate}% / an</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Durée :</span>
                      <div className="font-medium">{loan.duration_months} mois</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Début :</span>
                      <div className="font-medium">{getMonthName(loan.start_month)} {loan.start_year}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Mensualité :</span>
                        <div className="font-bold text-green-600">{formatCurrency(monthlyPayment)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total intérêts :</span>
                        <div className="font-bold text-orange-600">{formatCurrency(totalInterest)}</div>
                      </div>
                    </div>
                  </div>

                  {loan.grace_period_months > 0 && (
                    <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                      ⏳ Période de grâce : {loan.grace_period_months} mois
                    </div>
                  )}

                  {loan.description && (
                    <p className="text-xs text-gray-600 mt-2">
                      {loan.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loans.length === 0 && !loading && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun financement défini</h3>
          <p className="text-gray-600 mb-4">
            Ajoutez vos sources de financement pour calculer l'impact sur votre trésorerie
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un financement
          </Button>
        </div>
      )}

      {/* Conseils */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-900 mb-2">
          💡 Conseils financements
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Prêt bancaire :</strong> Taux généralement plus bas, garanties requises</li>
          <li>• <strong>Microfinance :</strong> Accessible aux PME, taux plus élevés</li>
          <li>• <strong>Investisseur :</strong> Apport en capital, pas de remboursement fixe</li>
          <li>• <strong>Période de grâce :</strong> Temps accordé avant le début des remboursements</li>
          <li>• Négociez les taux et conditions selon votre profil de risque</li>
        </ul>
      </div>
    </div>
  )
}