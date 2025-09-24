'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus, Calculator } from 'lucide-react'

interface Scenario {
  id: string
  name: string
  type: string
  revenue_factor: number
  cost_factor: number
  opex_factor: number
  capex_factor: number
  description: string
  is_active: boolean
  created_at: string
}

interface ScenariosTabProps {
  project: any
}

const scenarioTypes = [
  {
    id: 'optimiste',
    label: 'Optimiste',
    icon: TrendingUp,
    color: 'green',
    defaultFactors: {
      revenue_factor: 1.2,
      cost_factor: 0.9,
      opex_factor: 0.95,
      capex_factor: 0.9
    }
  },
  {
    id: 'pessimiste',
    label: 'Pessimiste',
    icon: TrendingDown,
    color: 'red',
    defaultFactors: {
      revenue_factor: 0.8,
      cost_factor: 1.1,
      opex_factor: 1.05,
      capex_factor: 1.1
    }
  },
  {
    id: 'realiste',
    label: 'Réaliste',
    icon: Minus,
    color: 'blue',
    defaultFactors: {
      revenue_factor: 1.0,
      cost_factor: 1.0,
      opex_factor: 1.0,
      capex_factor: 1.0
    }
  }
]

export function ScenariosTab({ project }: ScenariosTabProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
  const [calculatingScenario, setCalculatingScenario] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'realiste',
    revenue_factor: 1.0,
    cost_factor: 1.0,
    opex_factor: 1.0,
    capex_factor: 1.0,
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadScenarios()
  }, [project.id])

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at')

      if (error) throw error
      setScenarios(data || [])
    } catch (error) {
      console.error('Erreur chargement scénarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Le nom du scénario est requis')
      return
    }

    console.log('Sauvegarde scénario:', { project_id: project.id, formData })

    try {
      if (editingScenario) {
        // Modifier
        const { data, error } = await supabase
          .from('scenarios')
          .update({
            name: formData.name.trim(),
            type: formData.type,
            revenue_factor: formData.revenue_factor,
            cost_factor: formData.cost_factor,
            opex_factor: formData.opex_factor,
            capex_factor: formData.capex_factor,
            description: formData.description.trim()
          })
          .eq('id', editingScenario.id)
          .select()

        if (error) {
          console.error('Erreur Supabase scénario update:', error)
          throw error
        }
        console.log('Scénario modifié:', data)
      } else {
        // Créer
        const insertData = {
          project_id: project.id,
          name: formData.name.trim(),
          type: formData.type,
          revenue_factor: formData.revenue_factor,
          cost_factor: formData.cost_factor,
          opex_factor: formData.opex_factor,
          capex_factor: formData.capex_factor,
          description: formData.description.trim(),
          is_active: false
        }

        console.log('Insertion scénario:', insertData)

        const { data, error } = await supabase
          .from('scenarios')
          .insert(insertData)
          .select()

        if (error) {
          console.error('Erreur Supabase scénario insert:', error)
          throw error
        }
        console.log('Scénario créé:', data)
      }

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        type: 'realiste',
        revenue_factor: 1.0,
        cost_factor: 1.0,
        opex_factor: 1.0,
        capex_factor: 1.0,
        description: ''
      })
      setEditingScenario(null)
      setShowForm(false)

      // Recharger la liste
      await loadScenarios()
    } catch (error: any) {
      console.error('Erreur sauvegarde scénario:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handleEdit = (scenario: Scenario) => {
    setFormData({
      name: scenario.name,
      type: scenario.type,
      revenue_factor: scenario.revenue_factor,
      cost_factor: scenario.cost_factor,
      opex_factor: scenario.opex_factor,
      capex_factor: scenario.capex_factor,
      description: scenario.description
    })
    setEditingScenario(scenario)
    setShowForm(true)
  }

  const handleDelete = async (scenarioId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce scénario ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', scenarioId)

      if (error) throw error

      loadScenarios()
    } catch (error) {
      console.error('Erreur suppression scénario:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleTypeChange = (type: string) => {
    const scenarioType = scenarioTypes.find(t => t.id === type)
    if (scenarioType) {
      setFormData({
        ...formData,
        type,
        ...scenarioType.defaultFactors
      })
    }
  }

  const handleCalculateScenario = async (scenarioId: string) => {
    setCalculatingScenario(scenarioId)
    try {
      console.log('Calcul scénario:', scenarioId)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/simple/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: project.id,
          scenario_id: scenarioId
        })
      })

      const result = await response.json()
      console.log('Réponse calcul scénario:', result)

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors du calcul')
      }

      alert(`Calcul du scénario terminé ! Revenue total: ${result.summary?.total_revenue?.toLocaleString()} XOF`)
    } catch (error) {
      console.error('Erreur calcul scénario:', error)
      alert('Erreur lors du calcul: ' + error.message)
    } finally {
      setCalculatingScenario(null)
    }
  }

  const getScenarioTypeInfo = (type: string) => {
    return scenarioTypes.find(t => t.id === type) || scenarioTypes[2]
  }

  const formatFactor = (factor: number) => {
    const percentage = (factor - 1) * 100
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Analyse de Scénarios
          </h2>
          <p className="text-gray-600 mt-1">
            Créez des scénarios optimiste, pessimiste et réaliste pour analyser la sensibilité de votre projet
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              name: '',
              type: 'realiste',
              revenue_factor: 1.0,
              cost_factor: 1.0,
              opex_factor: 1.0,
              capex_factor: 1.0,
              description: ''
            })
            setEditingScenario(null)
            setShowForm(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau scénario
        </Button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingScenario ? 'Modifier le scénario' : 'Nouveau scénario'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du scénario *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Croissance forte, Récession économique..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de scénario
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {scenarioTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facteur Revenus
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={formData.revenue_factor}
                    onChange={(e) => setFormData({ ...formData, revenue_factor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFactor(formData.revenue_factor)} par rapport au scénario de base
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facteur Coûts directs
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={formData.cost_factor}
                    onChange={(e) => setFormData({ ...formData, cost_factor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFactor(formData.cost_factor)} par rapport au scénario de base
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facteur OPEX
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={formData.opex_factor}
                    onChange={(e) => setFormData({ ...formData, opex_factor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFactor(formData.opex_factor)} par rapport au scénario de base
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facteur CAPEX
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={formData.capex_factor}
                    onChange={(e) => setFormData({ ...formData, capex_factor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFactor(formData.capex_factor)} par rapport au scénario de base
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Décrivez les hypothèses de ce scénario..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingScenario(null)
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingScenario ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des scénarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const typeInfo = getScenarioTypeInfo(scenario.type)
          const IconComponent = typeInfo.icon

          return (
            <Card key={scenario.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className={`h-5 w-5 mr-2 text-${typeInfo.color}-600`} />
                    <span className="truncate">{scenario.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(scenario)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(scenario.id)}
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
                      <span className="text-gray-600">Revenus:</span>
                      <span className={`ml-1 font-medium ${scenario.revenue_factor > 1 ? 'text-green-600' : scenario.revenue_factor < 1 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatFactor(scenario.revenue_factor)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Coûts:</span>
                      <span className={`ml-1 font-medium ${scenario.cost_factor > 1 ? 'text-red-600' : scenario.cost_factor < 1 ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatFactor(scenario.cost_factor)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">OPEX:</span>
                      <span className={`ml-1 font-medium ${scenario.opex_factor > 1 ? 'text-red-600' : scenario.opex_factor < 1 ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatFactor(scenario.opex_factor)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">CAPEX:</span>
                      <span className={`ml-1 font-medium ${scenario.capex_factor > 1 ? 'text-red-600' : scenario.capex_factor < 1 ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatFactor(scenario.capex_factor)}
                      </span>
                    </div>
                  </div>

                  {scenario.description && (
                    <p className="text-xs text-gray-600 mt-2">
                      {scenario.description}
                    </p>
                  )}

                  <Button
                    onClick={() => handleCalculateScenario(scenario.id)}
                    disabled={calculatingScenario === scenario.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-3"
                    size="sm"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {calculatingScenario === scenario.id ? 'Calcul...' : 'Calculer ce scénario'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {scenarios.length === 0 && !loading && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun scénario créé</h3>
          <p className="text-gray-600 mb-4">
            Créez votre premier scénario pour analyser différentes hypothèses
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un scénario
          </Button>
        </div>
      )}

      {/* Conseils */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-900 mb-2">
          💡 Conseils pour les scénarios
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Optimiste :</strong> Croissance forte, coûts maîtrisés (+20% revenus, -10% coûts)</li>
          <li>• <strong>Pessimiste :</strong> Marché difficile, inflation (+10% coûts, -20% revenus)</li>
          <li>• <strong>Réaliste :</strong> Conditions normales (facteurs à 1.0)</li>
          <li>• Analysez l'impact de chaque scénario sur la rentabilité</li>
          <li>• Préparez des plans d'action pour chaque situation</li>
        </ul>
      </div>
    </div>
  )
}