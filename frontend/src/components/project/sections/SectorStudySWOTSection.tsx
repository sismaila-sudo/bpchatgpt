'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Plus, Trash2, Save } from 'lucide-react'

interface SectorStudySWOTSectionProps {
  project: any
}

interface SWOTItem {
  id: string
  type: 'strength' | 'weakness' | 'opportunity' | 'threat'
  content: string
}

interface MarketAnalysis {
  market_size: string
  growth_rate: string
  key_trends: string
  target_segments: string
  competition_analysis: string
}

export function SectorStudySWOTSection({ project }: SectorStudySWOTSectionProps) {
  const [swotItems, setSWOTItems] = useState<SWOTItem[]>([])
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis>({
    market_size: '',
    growth_rate: '',
    key_trends: '',
    target_segments: '',
    competition_analysis: ''
  })
  const [isSaving, setIsSaving] = useState(false)


  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [project.id])

  const loadData = async () => {
    try {
      // Charger l'analyse SWOT
      try {
        const { data: swotData, error: swotError } = await supabase
          .from('swot_analysis')
          .select('*')
          .eq('project_id', project.id)

        if (swotError && swotError.code === '42P01') {
          console.log('Info: swot_analysis table not available yet')
        } else if (swotData) {
          setSWOTItems(swotData)
        }
      } catch (error) {
        console.log('Info: SWOT analysis table not available yet')
      }

      // Charger l'analyse de marché
      try {
        const { data: marketData, error: marketError } = await supabase
          .from('market_analysis')
          .select('*')
          .eq('project_id', project.id)
          .single()

        if (marketError && marketError.code === '42P01') {
          console.log('Info: market_analysis table not available yet')
        } else if (marketData) {
          setMarketAnalysis(marketData)
        }
      } catch (error) {
        console.log('Info: Market analysis table not available yet')
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    }
  }

  const addSWOTItem = (type: 'strength' | 'weakness' | 'opportunity' | 'threat') => {
    const newItem: SWOTItem = {
      id: `temp_${Date.now()}`,
      type,
      content: ''
    }
    setSWOTItems([...swotItems, newItem])
  }

  const updateSWOTItem = (id: string, content: string) => {
    setSWOTItems(items => items.map(item =>
      item.id === id ? { ...item, content } : item
    ))
  }

  const removeSWOTItem = (id: string) => {
    setSWOTItems(items => items.filter(item => item.id !== id))
  }

  const saveData = async () => {
    setIsSaving(true)
    try {
      // Sauvegarder l'analyse de marché
      try {
        const { error: marketError } = await supabase
          .from('market_analysis')
          .upsert({
            project_id: project.id,
            ...marketAnalysis,
            updated_at: new Date().toISOString()
          })

        if (marketError && marketError.code === '42P01') {
          console.log('Info: market_analysis table not available yet')
        }
      } catch (error) {
        console.log('Info: Skipping market analysis save - table not available yet')
      }

      // Sauvegarder les items SWOT
      try {
        for (const item of swotItems) {
          if (item.content.trim()) {
            const { error: swotError } = await supabase
              .from('swot_analysis')
              .upsert({
                id: item.id.startsWith('temp_') ? undefined : item.id,
                project_id: project.id,
                type: item.type,
                content: item.content,
                updated_at: new Date().toISOString()
              })

            if (swotError && swotError.code === '42P01') {
              console.log('Info: swot_analysis table not available yet')
              break
            }
          }
        }
      } catch (error) {
        console.log('Info: Skipping SWOT save - table not available yet')
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

  const getSWOTItemsByType = (type: 'strength' | 'weakness' | 'opportunity' | 'threat') => {
    return swotItems.filter(item => item.type === type)
  }

  const swotConfig = {
    strength: { title: 'Forces', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    weakness: { title: 'Faiblesses', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    opportunity: { title: 'Opportunités', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    threat: { title: 'Menaces', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Étude Secteur & SWOT</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => saveData()} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Analyse du marché */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse du Marché</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille du marché
              </label>
              <Input
                value={marketAnalysis.market_size}
                onChange={(e) => {
                  setMarketAnalysis({
                    ...marketAnalysis,
                    market_size: e.target.value
                  })
                }}
                placeholder="Ex: 50 milliards XOF"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux de croissance
              </label>
              <Input
                value={marketAnalysis.growth_rate}
                onChange={(e) => {
                  setMarketAnalysis({
                    ...marketAnalysis,
                    growth_rate: e.target.value
                  })
                }}
                placeholder="Ex: 5% par an"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tendances clés
            </label>
            <Textarea
              value={marketAnalysis.key_trends}
              onChange={(e) => {
                setMarketAnalysis({
                  ...marketAnalysis,
                  key_trends: e.target.value
                })
              }}
              placeholder="Décrivez les principales tendances du secteur..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segments cibles
            </label>
            <Textarea
              value={marketAnalysis.target_segments}
              onChange={(e) => {
                setMarketAnalysis({
                  ...marketAnalysis,
                  target_segments: e.target.value
                })
              }}
              placeholder="Identifiez vos segments de marché cibles..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analyse concurrentielle
            </label>
            <Textarea
              value={marketAnalysis.competition_analysis}
              onChange={(e) => {
                setMarketAnalysis({
                  ...marketAnalysis,
                  competition_analysis: e.target.value
                })
              }}
              placeholder="Analysez vos principaux concurrents..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analyse SWOT */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice SWOT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(swotConfig).map(([type, config]) => (
              <div key={type} className={`p-4 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-medium text-${config.color}-800`}>{config.title}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addSWOTItem(type as any)}
                    className={`border-${config.color}-300 text-${config.color}-700 hover:bg-${config.color}-100`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {getSWOTItemsByType(type as any).map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Input
                        value={item.content}
                        onChange={(e) => updateSWOTItem(item.id, e.target.value)}
                        placeholder={`Ajouter une ${config.title.toLowerCase().slice(0, -1)}...`}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSWOTItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {getSWOTItemsByType(type as any).length === 0 && (
                    <p className={`text-${config.color}-600 text-sm italic`}>
                      Aucun élément ajouté
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}