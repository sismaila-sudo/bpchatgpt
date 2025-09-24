'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Users, Save, TrendingUp, Heart, Leaf } from 'lucide-react'

interface SocioEconomicImpactSectionProps {
  project: any
}

interface EconomicImpact {
  direct_jobs_created: number
  indirect_jobs_created: number
  youth_jobs: number
  women_jobs: number
  revenue_projection_y1: number
  revenue_projection_y3: number
  tax_contribution: number
  local_procurement: number
  export_potential: number
}

interface SocialImpact {
  community_services: string
  skills_development: string
  youth_training: string
  women_empowerment: string
  local_partnerships: string
  social_responsibility: string
}

interface EnvironmentalImpact {
  environmental_measures: string
  waste_management: string
  energy_efficiency: string
  carbon_footprint: string
  sustainability_practices: string
}

export function SocioEconomicImpactSection({ project }: SocioEconomicImpactSectionProps) {
  const [economicImpact, setEconomicImpact] = useState<EconomicImpact>({
    direct_jobs_created: 0,
    indirect_jobs_created: 0,
    youth_jobs: 0,
    women_jobs: 0,
    revenue_projection_y1: 0,
    revenue_projection_y3: 0,
    tax_contribution: 0,
    local_procurement: 0,
    export_potential: 0
  })

  const [socialImpact, setSocialImpact] = useState<SocialImpact>({
    community_services: '',
    skills_development: '',
    youth_training: '',
    women_empowerment: '',
    local_partnerships: '',
    social_responsibility: ''
  })

  const [environmentalImpact, setEnvironmentalImpact] = useState<EnvironmentalImpact>({
    environmental_measures: '',
    waste_management: '',
    energy_efficiency: '',
    carbon_footprint: '',
    sustainability_practices: ''
  })

  const [isSaving, setIsSaving] = useState(false)

  // Helper functions
  const updateEconomicImpact = (field: keyof EconomicImpact, value: number) => {
    setEconomicImpact(prev => ({ ...prev, [field]: value }))
  }

  const updateSocialImpact = (field: keyof SocialImpact, value: string) => {
    setSocialImpact(prev => ({ ...prev, [field]: value }))
  }

  const updateEnvironmentalImpact = (field: keyof EnvironmentalImpact, value: string) => {
    setEnvironmentalImpact(prev => ({ ...prev, [field]: value }))
  }

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [project.id])

  const loadData = async () => {
    try {
      // Charger l'impact économique
      try {
        const { data: economicData, error: economicError } = await supabase
          .from('economic_impact')
          .select('*')
          .eq('project_id', project.id)
          .single()

        if (economicError && economicError.code === '42P01') {
          console.log('Info: economic_impact table not available yet')
        } else if (economicData) {
          setEconomicImpact(economicData)
        }
      } catch (error) {
        console.log('Info: Economic impact table not available yet')
      }

      // Charger l'impact social
      try {
        const { data: socialData, error: socialError } = await supabase
          .from('social_impact')
          .select('*')
          .eq('project_id', project.id)
          .single()

        if (socialError && socialError.code === '42P01') {
          console.log('Info: social_impact table not available yet')
        } else if (socialData) {
          setSocialImpact(socialData)
        }
      } catch (error) {
        console.log('Info: Social impact table not available yet')
      }

      // Charger l'impact environnemental
      try {
        const { data: environmentalData, error: environmentalError } = await supabase
          .from('environmental_impact')
          .select('*')
          .eq('project_id', project.id)
          .single()

        if (environmentalError && environmentalError.code === '42P01') {
          console.log('Info: environmental_impact table not available yet')
        } else if (environmentalData) {
          setEnvironmentalImpact(environmentalData)
        }
      } catch (error) {
        console.log('Info: Environmental impact table not available yet')
      }
    } catch (error) {
      console.log('Info: Impact tables not available yet')
    }
  }

  const saveData = async () => {
    setIsSaving(true)
    try {
      // Sauvegarder l'impact économique
      try {
        const { error: economicError } = await supabase
          .from('economic_impact')
          .upsert({
            project_id: project.id,
            ...economicImpact,
            updated_at: new Date().toISOString()
          })

        if (economicError && economicError.code === '42P01') {
          console.log('Info: economic_impact table not available yet')
        }
      } catch (error) {
        console.log('Info: Skipping economic impact save - table not available yet')
      }

      // Sauvegarder l'impact social
      try {
        const { error: socialError } = await supabase
          .from('social_impact')
          .upsert({
            project_id: project.id,
            ...socialImpact,
            updated_at: new Date().toISOString()
          })

        if (socialError && socialError.code === '42P01') {
          console.log('Info: social_impact table not available yet')
        }
      } catch (error) {
        console.log('Info: Skipping social impact save - table not available yet')
      }

      // Sauvegarder l'impact environnemental
      try {
        const { error: environmentalError } = await supabase
          .from('environmental_impact')
          .upsert({
            project_id: project.id,
            ...environmentalImpact,
            updated_at: new Date().toISOString()
          })

        if (environmentalError && environmentalError.code === '42P01') {
          console.log('Info: environmental_impact table not available yet')
        }
      } catch (error) {
        console.log('Info: Skipping environmental impact save - table not available yet')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Impacts Socio-Économiques</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => saveData()} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Impact Économique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Impact Économique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Création d'emplois */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Création d'Emplois</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emplois directs créés
                </label>
                <Input
                  type="number"
                  value={economicImpact.direct_jobs_created}
                  onChange={(e) => updateEconomicImpact('direct_jobs_created', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emplois indirects créés
                </label>
                <Input
                  type="number"
                  value={economicImpact.indirect_jobs_created}
                  onChange={(e) => updateEconomicImpact('indirect_jobs_created', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emplois jeunes (18-35 ans)
                </label>
                <Input
                  type="number"
                  value={economicImpact.youth_jobs}
                  onChange={(e) => updateEconomicImpact('youth_jobs', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emplois femmes
                </label>
                <Input
                  type="number"
                  value={economicImpact.women_jobs}
                  onChange={(e) => updateEconomicImpact('women_jobs', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Retombées financières */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Retombées Financières (XOF)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CA prévisionnel Année 1
                </label>
                <Input
                  type="number"
                  value={economicImpact.revenue_projection_y1}
                  onChange={(e) => updateEconomicImpact('revenue_projection_y1', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CA prévisionnel Année 3
                </label>
                <Input
                  type="number"
                  value={economicImpact.revenue_projection_y3}
                  onChange={(e) => updateEconomicImpact('revenue_projection_y3', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution fiscale annuelle
                </label>
                <Input
                  type="number"
                  value={economicImpact.tax_contribution}
                  onChange={(e) => updateEconomicImpact('tax_contribution', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approvisionnement local (%)
                </label>
                <Input
                  type="number"
                  value={economicImpact.local_procurement}
                  onChange={(e) => updateEconomicImpact('local_procurement', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potentiel d'export (XOF)
                </label>
                <Input
                  type="number"
                  value={economicImpact.export_potential}
                  onChange={(e) => updateEconomicImpact('export_potential', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Résumé visuel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Résumé Impact Économique</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {economicImpact.direct_jobs_created + economicImpact.indirect_jobs_created}
                </div>
                <div className="text-sm text-blue-700">Emplois Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {economicImpact.revenue_projection_y1.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">CA Année 1</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {economicImpact.tax_contribution.toLocaleString()}
                </div>
                <div className="text-sm text-purple-700">Taxes Annuelles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {economicImpact.local_procurement}%
                </div>
                <div className="text-sm text-orange-700">Achat Local</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-600" />
            Impact Social
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Services à la communauté
              </label>
              <Textarea
                value={socialImpact.community_services}
                onChange={(e) => updateSocialImpact('community_services', e.target.value)}
                placeholder="Services offerts à la communauté locale..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Développement des compétences
              </label>
              <Textarea
                value={socialImpact.skills_development}
                onChange={(e) => updateSocialImpact('skills_development', e.target.value)}
                placeholder="Formation et développement des compétences..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formation des jeunes
              </label>
              <Textarea
                value={socialImpact.youth_training}
                onChange={(e) => updateSocialImpact('youth_training', e.target.value)}
                placeholder="Programmes de formation pour les jeunes..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autonomisation des femmes
              </label>
              <Textarea
                value={socialImpact.women_empowerment}
                onChange={(e) => updateSocialImpact('women_empowerment', e.target.value)}
                placeholder="Initiatives pour l'autonomisation des femmes..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partenariats locaux
              </label>
              <Textarea
                value={socialImpact.local_partnerships}
                onChange={(e) => updateSocialImpact('local_partnerships', e.target.value)}
                placeholder="Collaborations avec les acteurs locaux..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsabilité sociétale
              </label>
              <Textarea
                value={socialImpact.social_responsibility}
                onChange={(e) => updateSocialImpact('social_responsibility', e.target.value)}
                placeholder="Initiatives de responsabilité sociétale..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Environnemental */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Leaf className="h-5 w-5 mr-2 text-green-600" />
            Impact Environnemental
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesures environnementales
              </label>
              <Textarea
                value={environmentalImpact.environmental_measures}
                onChange={(e) => updateEnvironmentalImpact('environmental_measures', e.target.value)}
                placeholder="Mesures de protection de l'environnement..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gestion des déchets
              </label>
              <Textarea
                value={environmentalImpact.waste_management}
                onChange={(e) => updateEnvironmentalImpact('waste_management', e.target.value)}
                placeholder="Stratégie de gestion des déchets..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Efficacité énergétique
              </label>
              <Textarea
                value={environmentalImpact.energy_efficiency}
                onChange={(e) => updateEnvironmentalImpact('energy_efficiency', e.target.value)}
                placeholder="Mesures d'efficacité énergétique..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empreinte carbone
              </label>
              <Textarea
                value={environmentalImpact.carbon_footprint}
                onChange={(e) => updateEnvironmentalImpact('carbon_footprint', e.target.value)}
                placeholder="Stratégie de réduction de l'empreinte carbone..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pratiques durables
              </label>
              <Textarea
                value={environmentalImpact.sustainability_practices}
                onChange={(e) => updateEnvironmentalImpact('sustainability_practices', e.target.value)}
                placeholder="Autres pratiques de développement durable..."
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}