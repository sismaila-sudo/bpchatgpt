'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Sprout,
  Laptop,
  Store,
  Factory,
  Users,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { documentTemplateService, DocumentTemplate } from '@/services/documentTemplateService'

interface TemplateSelectorProps {
  onTemplateSelected: (template: DocumentTemplate, mode: 'new-company' | 'existing-company') => void
  onBack: () => void
}

const sectorIcons = {
  general: Building2,
  agriculture: Sprout,
  technology: Laptop,
  commerce: Store,
  industry: Factory,
  services: Users
}

const sectorColors = {
  general: 'bg-blue-50 border-blue-200 text-blue-800',
  agriculture: 'bg-green-50 border-green-200 text-green-800',
  technology: 'bg-purple-50 border-purple-200 text-purple-800',
  commerce: 'bg-orange-50 border-orange-200 text-orange-800',
  industry: 'bg-gray-50 border-gray-200 text-gray-800',
  services: 'bg-pink-50 border-pink-200 text-pink-800'
}

export function TemplateSelector({ onTemplateSelected, onBack }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedMode, setSelectedMode] = useState<'new-company' | 'existing-company'>('new-company')
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await documentTemplateService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Erreur chargement templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => t.mode === selectedMode)
  const sectors = [...new Set(filteredTemplates.map(t => t.sector))]

  const handleContinue = () => {
    if (selectedTemplate) {
      onTemplateSelected(selectedTemplate, selectedMode)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Choisir un Template</h1>
        <p className="text-lg text-gray-600">
          Sélectionnez le type de projet et le secteur pour un business plan adapté
        </p>
      </div>

      {/* Mode de projet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Type de Projet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMode}
            onValueChange={(value) => {
              setSelectedMode(value as 'new-company' | 'existing-company')
              setSelectedTemplate(null) // Reset selection
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="new-company"
                className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
              >
                <RadioGroupItem value="new-company" id="new-company" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Nouvelle Entreprise</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Création d'une nouvelle entreprise ou startup
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Projet de création
                  </Badge>
                </div>
              </Label>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="existing-company"
                className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
              >
                <RadioGroupItem value="existing-company" id="existing-company" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Entreprise Existante</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Expansion ou développement d'une activité existante
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Projet d'expansion
                  </Badge>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Templates par secteur */}
      <div className="space-y-6">
        {sectors.map(sector => {
          const sectorTemplates = filteredTemplates.filter(t => t.sector === sector)
          const IconComponent = sectorIcons[sector] || Building2
          const colorClass = sectorColors[sector] || sectorColors.general

          return (
            <Card key={sector}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IconComponent className="h-5 w-5" />
                  <span className="capitalize">{sector === 'general' ? 'Général' : sector}</span>
                  <Badge variant="outline">{sectorTemplates.length} template(s)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {sectorTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            {selectedTemplate?.id === template.id && (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {template.description}
                          </p>

                          <div className="flex items-center space-x-4 mt-3">
                            <Badge className={colorClass}>
                              {template.sector}
                            </Badge>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <FileText className="h-4 w-4" />
                              <span>{template.structure.sections.length} sections</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>
                                {selectedMode === 'new-company' ? '1-2h' : '2-3h'} estimé
                              </span>
                            </div>
                          </div>

                          {/* Preview sections */}
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Sections incluses :
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {template.structure.sections.slice(0, 6).map(section => (
                                <Badge key={section} variant="secondary" className="text-xs">
                                  {section.replace(/-/g, ' ')}
                                </Badge>
                              ))}
                              {template.structure.sections.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.structure.sections.length - 6} autres
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>

        <div className="flex items-center space-x-4">
          {selectedTemplate && (
            <div className="text-sm text-gray-600">
              Template sélectionné : <strong>{selectedTemplate.name}</strong>
            </div>
          )}
          <Button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className="flex items-center space-x-2"
          >
            <span>Continuer</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}