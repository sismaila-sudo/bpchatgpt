'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectorStudySWOTSection } from '../sections/SectorStudySWOTSection'
import { TechnicalStudySection } from '../sections/TechnicalStudySection'
import { RiskAnalysisSection } from '../sections/RiskAnalysisSection'
import { SocioEconomicImpactSection } from '../sections/SocioEconomicImpactSection'
import { Settings, TrendingUp, AlertTriangle, Users } from 'lucide-react'

interface TechnicalImpactTabProps {
  project: any
}

export function TechnicalImpactTab({ project }: TechnicalImpactTabProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Étude Technique & Impact</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Analyse complète du secteur, étude technique détaillée, gestion des risques et évaluation des impacts socio-économiques du projet.
        </p>
      </div>

      {/* Section 1: Étude Secteur & SWOT */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <TrendingUp className="h-6 w-6 mr-3" />
            Étude Secteur & SWOT
          </CardTitle>
          <p className="text-blue-700 text-sm">
            Analyse du marché, opportunités, menaces. Forces et faiblesses internes.
          </p>
        </CardHeader>
        <CardContent>
          <SectorStudySWOTSection project={project} />
        </CardContent>
      </Card>

      {/* Section 2: Étude Technique */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Settings className="h-6 w-6 mr-3" />
            Étude Technique
          </CardTitle>
          <p className="text-green-700 text-sm">
            Infrastructure, équipements, processus de production. Liste de ressources clés modifiable.
          </p>
        </CardHeader>
        <CardContent>
          <TechnicalStudySection project={project} />
        </CardContent>
      </Card>

      {/* Section 3: Risques & Mesures d'Atténuation */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <AlertTriangle className="h-6 w-6 mr-3" />
            Risques & Mesures d'Atténuation
          </CardTitle>
          <p className="text-orange-700 text-sm">
            Identification des risques et solutions proposées. Gestion proactive des menaces.
          </p>
        </CardHeader>
        <CardContent>
          <RiskAnalysisSection project={project} />
        </CardContent>
      </Card>

      {/* Section 4: Impacts Socio-Économiques */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <Users className="h-6 w-6 mr-3" />
            Impacts Socio-Économiques
          </CardTitle>
          <p className="text-purple-700 text-sm">
            Retombées économiques, emplois créés, impacts sociaux et contribution locale.
          </p>
        </CardHeader>
        <CardContent>
          <SocioEconomicImpactSection project={project} />
        </CardContent>
      </Card>
    </div>
  )
}