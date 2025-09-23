'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Package,
  TrendingUp,
  DollarSign,
  Building,
  Users,
  Receipt,
  Calculator,
  CreditCard
} from 'lucide-react'

import { ProductsTab } from './ProductsTab'
import { SalesTab } from './SalesTab'
import { CapexTab } from './CapexTab'
import { OpexTab } from './OpexTab'
import { PayrollTab } from './PayrollTab'
import { TaxesTab } from './TaxesTab'
import { WorkingCapitalTab } from './WorkingCapitalTab'
import { FinancingTab } from './FinancingTab'

interface FinancialDataTabProps {
  project: any
}

const financialSections = [
  {
    id: 'products-services',
    label: 'Produits/Services & Ventes',
    icon: Package,
    description: 'Définir votre offre et projections de vente',
    component: ProductsTab,
    color: 'blue'
  },
  {
    id: 'sales',
    label: 'Ventes Prévisionnelles',
    icon: TrendingUp,
    description: 'Volumes et chiffre d\'affaires prévisionnel',
    component: SalesTab,
    color: 'green'
  },
  {
    id: 'investments',
    label: 'Investissements (CAPEX)',
    icon: DollarSign,
    description: 'Équipements, immobilisations, aménagements',
    component: CapexTab,
    color: 'purple'
  },
  {
    id: 'charges',
    label: 'Charges & Paie & Taxes',
    icon: Building,
    description: 'Charges d\'exploitation, paie et fiscalité',
    component: OpexTab,
    color: 'orange'
  },
  {
    id: 'payroll',
    label: 'Gestion de la Paie',
    icon: Users,
    description: 'Effectifs et coûts salariaux',
    component: PayrollTab,
    color: 'indigo'
  },
  {
    id: 'taxes',
    label: 'Taxes et Impôts',
    icon: Receipt,
    description: 'TVA, impôts sur sociétés, taxes diverses',
    component: TaxesTab,
    color: 'red'
  },
  {
    id: 'working-capital',
    label: 'Trésorerie & BFR',
    icon: Calculator,
    description: 'Besoin en fonds de roulement et trésorerie',
    component: WorkingCapitalTab,
    color: 'emerald'
  },
  {
    id: 'financing',
    label: 'Besoin de Financement',
    icon: CreditCard,
    description: 'Plan de financement et garanties',
    component: FinancingTab,
    color: 'amber'
  }
]

export function FinancialDataTab({ project }: FinancialDataTabProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [projectionYears, setProjectionYears] = useState(project.horizon_years || 3)
  const [sector, setSector] = useState(project.sector || 'Services')

  // Mettre à jour le projet quand les paramètres changent
  const handleUpdateProjectSettings = async (field: string, value: any) => {
    try {
      // TODO: Appeler l'API pour mettre à jour le projet
      console.log(`Mise à jour ${field}:`, value)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
    }
  }

  if (activeSection) {
    const section = financialSections.find(s => s.id === activeSection)
    if (section) {
      const SectionComponent = section.component
      return (
        <div>
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <section.icon className={`h-6 w-6 text-${section.color}-600`} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{section.label}</h2>
                  <p className="text-gray-600">{section.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveSection(null)}
              >
                ← Retour aux sections
              </Button>
            </div>
          </div>
          <SectionComponent project={project} />
        </div>
      )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Données Financières</h1>
        <p className="text-gray-600">
          Organisez vos données financières par section selon le modèle bancaire sénégalais
        </p>
      </div>

      {/* Paramètres des projections */}
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Paramètres des Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="projection-years" className="text-emerald-700 font-medium">
                Horizon de projection
              </Label>
              <Select
                value={projectionYears.toString()}
                onValueChange={(value) => {
                  const years = parseInt(value)
                  setProjectionYears(years)
                  handleUpdateProjectSettings('horizon_years', years)
                }}
              >
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 ans (Standard)</SelectItem>
                  <SelectItem value="5">5 ans (Bancaire)</SelectItem>
                  <SelectItem value="7">7 ans (Long terme)</SelectItem>
                  <SelectItem value="10">10 ans (Très long terme)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-emerald-600">
                {projectionYears === 3 && "🏦 Idéal pour la plupart des projets"}
                {projectionYears === 5 && "🏛️ Requis par certaines banques"}
                {projectionYears === 7 && "📈 Pour projets d'investissement"}
                {projectionYears === 10 && "🚀 Pour projets stratégiques"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector" className="text-emerald-700 font-medium">
                Secteur d'activité
              </Label>
              <Select
                value={sector}
                onValueChange={(value) => {
                  setSector(value)
                  handleUpdateProjectSettings('sector', value)
                }}
              >
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agriculture">🌾 Agriculture</SelectItem>
                  <SelectItem value="Commerce">🛍️ Commerce</SelectItem>
                  <SelectItem value="Services">💼 Services</SelectItem>
                  <SelectItem value="Industrie">🏭 Industrie</SelectItem>
                  <SelectItem value="Technologies">💻 Technologies</SelectItem>
                  <SelectItem value="Santé">🏥 Santé</SelectItem>
                  <SelectItem value="Education">🎓 Éducation</SelectItem>
                  <SelectItem value="Transport">🚛 Transport</SelectItem>
                  <SelectItem value="Immobilier">🏠 Immobilier</SelectItem>
                  <SelectItem value="Finance">💰 Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-emerald-700 font-medium">
                Statut actuel
              </Label>
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <div className="text-sm">
                  <p className="font-medium text-emerald-800">
                    Horizon: {projectionYears} ans
                  </p>
                  <p className="text-emerald-600">
                    Secteur: {sector}
                  </p>
                  <p className="text-emerald-600 text-xs mt-1">
                    Calculs basés sur ces paramètres
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
            <p className="text-sm text-emerald-700">
              💡 <strong>Conseil:</strong> Choisissez 5 ans si vous demandez un financement bancaire important.
              La plupart des banques exigent des projections sur 5 ans pour les prêts d'investissement.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {financialSections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-l-4 border-${section.color}-500`}
              onClick={() => setActiveSection(section.id)}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg bg-${section.color}-100`}>
                    <Icon className={`h-6 w-6 text-${section.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{section.label}</h3>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{section.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full border-${section.color}-200 text-${section.color}-700 hover:bg-${section.color}-50`}
                >
                  Configurer →
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Guide et aide */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Guide de saisie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-700">
            <p><strong>1. Produits/Services :</strong> Commencez par définir votre offre et vos prix</p>
            <p><strong>2. Ventes :</strong> Projetez vos volumes de vente mensuels</p>
            <p><strong>3. Investissements :</strong> Listez vos besoins en équipements et aménagements</p>
            <p><strong>4. Charges :</strong> Détaillez vos charges d'exploitation récurrentes</p>
            <p><strong>5. Paie :</strong> Planifiez vos effectifs et coûts salariaux</p>
            <p><strong>6. Taxes :</strong> Configurez votre régime fiscal</p>
            <p><strong>7. Trésorerie :</strong> Gérez votre besoin en fonds de roulement</p>
            <p><strong>8. Financement :</strong> Structurez votre plan de financement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}