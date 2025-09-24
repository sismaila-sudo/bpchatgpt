'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Plus, Trash2, Save, Shield } from 'lucide-react'

interface RiskAnalysisSectionProps {
  project: any
}

interface Risk {
  id: string
  category: 'commercial' | 'operational' | 'financial' | 'external' | 'technical'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  probability: 'low' | 'medium' | 'high'
  mitigation_measures: string
  responsible: string
  timeline: string
}

export function RiskAnalysisSection({ project }: RiskAnalysisSectionProps) {
  const [risks, setRisks] = useState<Risk[]>([])
  const [isSaving, setIsSaving] = useState(false)


  const supabase = createClient()

  useEffect(() => {
    loadRisks()
  }, [project.id])

  const loadRisks = async () => {
    try {
      const { data, error } = await supabase
        .from('risk_analysis')
        .select('*')
        .eq('project_id', project.id)
        .order('category')

      if (error && error.code === '42P01') {
        console.log('Info: risk_analysis table not available yet')
        return
      }

      if (data) {
        setRisks(data)
      }
    } catch (error) {
      console.log('Info: Risk analysis table not available yet')
    }
  }

  const addRisk = () => {
    const newRisk: Risk = {
      id: `temp_${Date.now()}`,
      category: 'commercial',
      title: '',
      description: '',
      impact: 'medium',
      probability: 'medium',
      mitigation_measures: '',
      responsible: '',
      timeline: ''
    }
    setRisks([...risks, newRisk])
  }

  const updateRisk = (id: string, field: keyof Risk, value: any) => {
    setRisks(risks => risks.map(risk =>
      risk.id === id ? { ...risk, [field]: value } : risk
    ))
  }

  const removeRisk = (id: string) => {
    setRisks(risks => risks.filter(risk => risk.id !== id))
  }

  const saveRisks = async () => {
    setIsSaving(true)
    try {
      for (const risk of risks) {
        if (risk.title.trim()) {
          const { error } = await supabase
            .from('risk_analysis')
            .upsert({
              id: risk.id.startsWith('temp_') ? undefined : risk.id,
              project_id: project.id,
              category: risk.category,
              title: risk.title,
              description: risk.description,
              impact: risk.impact,
              probability: risk.probability,
              mitigation_measures: risk.mitigation_measures,
              responsible: risk.responsible,
              timeline: risk.timeline,
              updated_at: new Date().toISOString()
            })

          if (error && error.code === '42P01') {
            console.log('Info: risk_analysis table not available yet')
            return
          }
        }
      }

      alert('Risques sauvegardés avec succès!')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const getRisksByCategory = (category: string) => {
    return risks.filter(risk => risk.category === category)
  }

  const getRiskScore = (impact: string, probability: string) => {
    const impactScore = { low: 1, medium: 2, high: 3 }[impact] || 2
    const probabilityScore = { low: 1, medium: 2, high: 3 }[probability] || 2
    return impactScore * probabilityScore
  }

  const getRiskLevel = (score: number) => {
    if (score <= 2) return { level: 'Faible', color: 'green' }
    if (score <= 4) return { level: 'Moyen', color: 'yellow' }
    return { level: 'Élevé', color: 'red' }
  }

  const categoryConfig = {
    commercial: { title: 'Risques Commerciaux', color: 'blue', icon: AlertTriangle },
    operational: { title: 'Risques Opérationnels', color: 'green', icon: AlertTriangle },
    financial: { title: 'Risques Financiers', color: 'red', icon: AlertTriangle },
    technical: { title: 'Risques Techniques', color: 'purple', icon: AlertTriangle },
    external: { title: 'Risques Externes', color: 'orange', icon: AlertTriangle }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Risques & Mesures d'Atténuation</h2>
        </div>
        <div className="flex space-x-2">
          <Button onClick={addRisk} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un risque
          </Button>
          <Button onClick={() => saveRisks()} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Matrice des risques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Matrice des Risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique matrice des risques */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Répartition par niveau de risque</h4>
              <div className="space-y-2">
                {['Faible', 'Moyen', 'Élevé'].map(level => {
                  const count = risks.filter(risk => {
                    const score = getRiskScore(risk.impact, risk.probability)
                    return getRiskLevel(score).level === level
                  }).length
                  const color = level === 'Faible' ? 'green' : level === 'Moyen' ? 'yellow' : 'red'

                  return (
                    <div key={level} className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800`}>
                        {level}
                      </span>
                      <span className="font-medium">{count} risques</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Statistiques */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Répartition par catégorie</h4>
              <div className="space-y-2">
                {Object.entries(categoryConfig).map(([category, config]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{config.title}</span>
                    <span className="font-medium">{getRisksByCategory(category).length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des risques */}
      <div className="space-y-4">
        {risks.map((risk, index) => {
          const riskScore = getRiskScore(risk.impact, risk.probability)
          const riskLevel = getRiskLevel(riskScore)

          return (
            <Card key={risk.id} className="border-l-4" style={{ borderLeftColor:
              riskLevel.color === 'green' ? '#10b981' :
              riskLevel.color === 'yellow' ? '#f59e0b' : '#ef4444'
            }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">
                      Risque #{index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${riskLevel.color}-100 text-${riskLevel.color}-800`}>
                      {riskLevel.level}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRisk(risk.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <Select
                      value={risk.category}
                      onValueChange={(value) => updateRisk(risk.id, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impact
                    </label>
                    <Select
                      value={risk.impact}
                      onValueChange={(value) => updateRisk(risk.id, 'impact', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Probabilité
                    </label>
                    <Select
                      value={risk.probability}
                      onValueChange={(value) => updateRisk(risk.id, 'probability', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsable
                    </label>
                    <Input
                      value={risk.responsible}
                      onChange={(e) => updateRisk(risk.id, 'responsible', e.target.value)}
                      placeholder="Qui gère ce risque ?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du risque
                  </label>
                  <Input
                    value={risk.title}
                    onChange={(e) => updateRisk(risk.id, 'title', e.target.value)}
                    placeholder="Titre court du risque"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description du risque
                  </label>
                  <Textarea
                    value={risk.description}
                    onChange={(e) => updateRisk(risk.id, 'description', e.target.value)}
                    placeholder="Décrivez le risque en détail..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesures d'atténuation
                  </label>
                  <Textarea
                    value={risk.mitigation_measures}
                    onChange={(e) => updateRisk(risk.id, 'mitigation_measures', e.target.value)}
                    placeholder="Quelles mesures prenez-vous pour réduire ce risque ?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Échéancier
                  </label>
                  <Input
                    value={risk.timeline}
                    onChange={(e) => updateRisk(risk.id, 'timeline', e.target.value)}
                    placeholder="Quand mettre en place les mesures ?"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {risks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucun risque identifié</p>
            <Button onClick={addRisk}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le premier risque
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}