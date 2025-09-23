'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Shield, Plus, Trash2, Save, Settings } from 'lucide-react'

interface TechnicalStudySectionProps {
  project: any
}

interface TechnicalResource {
  id: string
  category: 'infrastructure' | 'equipment' | 'software' | 'human'
  name: string
  description: string
  quantity: number
  cost_estimate: number
}

interface TechnicalStudy {
  infrastructure_needs: string
  production_process: string
  quality_control: string
  technical_requirements: string
  regulatory_compliance: string
}

export function TechnicalStudySection({ project }: TechnicalStudySectionProps) {
  const [resources, setResources] = useState<TechnicalResource[]>([])
  const [technicalStudy, setTechnicalStudy] = useState<TechnicalStudy>({
    infrastructure_needs: '',
    production_process: '',
    quality_control: '',
    technical_requirements: '',
    regulatory_compliance: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [project.id])

  const loadData = async () => {
    try {
      // Charger les ressources techniques
      try {
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('technical_resources')
          .select('*')
          .eq('project_id', project.id)

        if (resourcesError && resourcesError.code === '42P01') {
          console.log('Info: technical_resources table not available yet')
        } else if (resourcesData) {
          setResources(resourcesData)
        }
      } catch (error) {
        console.log('Info: Technical resources table not available yet')
      }

      // Charger l'étude technique
      try {
        const { data: studyData, error: studyError } = await supabase
          .from('technical_study')
          .select('*')
          .eq('project_id', project.id)
          .single()

        if (studyError && studyError.code === '42P01') {
          console.log('Info: technical_study table not available yet')
        } else if (studyData) {
          setTechnicalStudy(studyData)
        }
      } catch (error) {
        console.log('Info: Technical study table not available yet')
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    }
  }

  const addResource = (category: 'infrastructure' | 'equipment' | 'software' | 'human') => {
    const newResource: TechnicalResource = {
      id: `temp_${Date.now()}`,
      category,
      name: '',
      description: '',
      quantity: 1,
      cost_estimate: 0
    }
    setResources([...resources, newResource])
  }

  const updateResource = (id: string, field: keyof TechnicalResource, value: any) => {
    setResources(resources => resources.map(resource =>
      resource.id === id ? { ...resource, [field]: value } : resource
    ))
  }

  const removeResource = (id: string) => {
    setResources(resources => resources.filter(resource => resource.id !== id))
  }

  const saveData = async () => {
    setIsSaving(true)
    try {
      // Sauvegarder l'étude technique
      try {
        const { error: studyError } = await supabase
          .from('technical_study')
          .upsert({
            project_id: project.id,
            ...technicalStudy,
            updated_at: new Date().toISOString()
          })

        if (studyError && studyError.code === '42P01') {
          console.log('Info: technical_study table not available yet')
        }
      } catch (error) {
        console.log('Info: Skipping technical study save - table not available yet')
      }

      // Sauvegarder les ressources
      try {
        for (const resource of resources) {
          if (resource.name.trim()) {
            const { error: resourceError } = await supabase
              .from('technical_resources')
              .upsert({
                id: resource.id.startsWith('temp_') ? undefined : resource.id,
                project_id: project.id,
                category: resource.category,
                name: resource.name,
                description: resource.description,
                quantity: resource.quantity,
                cost_estimate: resource.cost_estimate,
                updated_at: new Date().toISOString()
              })

            if (resourceError && resourceError.code === '42P01') {
              console.log('Info: technical_resources table not available yet')
              break
            }
          }
        }
      } catch (error) {
        console.log('Info: Skipping resources save - table not available yet')
      }

      alert('Données sauvegardées avec succès!')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const getResourcesByCategory = (category: 'infrastructure' | 'equipment' | 'software' | 'human') => {
    return resources.filter(resource => resource.category === category)
  }

  const categoryConfig = {
    infrastructure: { title: 'Infrastructure', color: 'blue', icon: Shield },
    equipment: { title: 'Équipements', color: 'green', icon: Settings },
    software: { title: 'Logiciels', color: 'purple', icon: Settings },
    human: { title: 'Ressources Humaines', color: 'orange', icon: Settings }
  }

  const getTotalCostByCategory = (category: string) => {
    return getResourcesByCategory(category as any)
      .reduce((total, resource) => total + (resource.cost_estimate * resource.quantity), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Étude Technique</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => saveData()} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Aspects techniques généraux */}
      <Card>
        <CardHeader>
          <CardTitle>Aspects Techniques Généraux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Besoins en infrastructure
            </label>
            <Textarea
              value={technicalStudy.infrastructure_needs}
              onChange={(e) => {
                setTechnicalStudy({
                  ...technicalStudy,
                  infrastructure_needs: e.target.value
                })
                          }}
              placeholder="Décrivez vos besoins en locaux, aménagements, réseaux..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processus de production/prestation
            </label>
            <Textarea
              value={technicalStudy.production_process}
              onChange={(e) => {
                setTechnicalStudy({
                  ...technicalStudy,
                  production_process: e.target.value
                })
                          }}
              placeholder="Décrivez votre chaîne de production ou processus de prestation..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contrôle qualité
            </label>
            <Textarea
              value={technicalStudy.quality_control}
              onChange={(e) => {
                setTechnicalStudy({
                  ...technicalStudy,
                  quality_control: e.target.value
                })
                          }}
              placeholder="Mesures de contrôle qualité, certifications..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exigences techniques spécifiques
            </label>
            <Textarea
              value={technicalStudy.technical_requirements}
              onChange={(e) => {
                setTechnicalStudy({
                  ...technicalStudy,
                  technical_requirements: e.target.value
                })
                          }}
              placeholder="Normes techniques, spécifications..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conformité réglementaire
            </label>
            <Textarea
              value={technicalStudy.regulatory_compliance}
              onChange={(e) => {
                setTechnicalStudy({
                  ...technicalStudy,
                  regulatory_compliance: e.target.value
                })
                          }}
              placeholder="Licences, autorisations, normes de sécurité..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ressources techniques par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(categoryConfig).map(([category, config]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <config.icon className={`h-5 w-5 mr-2 text-${config.color}-600`} />
                  {config.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Total: {getTotalCostByCategory(category).toLocaleString()} XOF
                  </span>
                  <Button
                    size="sm"
                    onClick={() => addResource(category as any)}
                    className={`bg-${config.color}-500 hover:bg-${config.color}-600`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getResourcesByCategory(category as any).map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={resource.name}
                        onChange={(e) => updateResource(resource.id, 'name', e.target.value)}
                        placeholder="Nom de la ressource"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeResource(resource.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <Textarea
                      value={resource.description}
                      onChange={(e) => updateResource(resource.id, 'description', e.target.value)}
                      placeholder="Description"
                      rows={2}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantité</label>
                        <Input
                          type="number"
                          value={resource.quantity}
                          onChange={(e) => updateResource(resource.id, 'quantity', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Coût unitaire (XOF)</label>
                        <Input
                          type="number"
                          value={resource.cost_estimate}
                          onChange={(e) => updateResource(resource.id, 'cost_estimate', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="text-right text-sm font-medium text-gray-700">
                      Sous-total: {(resource.quantity * resource.cost_estimate).toLocaleString()} XOF
                    </div>
                  </div>
                ))}

                {getResourcesByCategory(category as any).length === 0 && (
                  <p className="text-gray-500 text-sm italic text-center py-4">
                    Aucune ressource ajoutée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Résumé des coûts */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Coûts Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryConfig).map(([category, config]) => (
              <div key={category} className="text-center">
                <div className={`text-2xl font-bold text-${config.color}-600`}>
                  {getTotalCostByCategory(category).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{config.title}</div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 text-center">
            <div className="text-3xl font-bold text-gray-900">
              {Object.keys(categoryConfig).reduce((total, category) =>
                total + getTotalCostByCategory(category), 0
              ).toLocaleString()} XOF
            </div>
            <div className="text-sm text-gray-600">Coût technique total</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}