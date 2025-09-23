'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import '../../../styles/synoptic-print.css'

interface FAISETemplateProps {
  project: any
  onBack: () => void
}

interface ProjectData {
  projectOwner: any
  companyIdentity: any
  products: any[]
  salesProjections: any[]
  technicalStudy: any[]
  financialOutputs: any[]
  capex: any[]
  opex: any[]
}

const FAISE_CRITERIA = {
  project: [
    'Localisation du projet au Sénégal (les régions sont favorisées)',
    'Secteur d\'activités éligible : agriculture, agrobusiness, TIC, tourisme, industrie culturelle, artisanat, textile, produits de la mer, aquaculture',
    'Nombre d\'emplois créés (priorité jeunes et femmes)',
    'Viabilité économique du projet',
    'Impact socio-économique local',
    'Financement plafonné à 15 000 000 FCFA',
    'Taux d\'intérêt : 6%',
    'Durée de remboursement : 5 ans',
    'Différé : 6 mois'
  ],
  promoteur: [
    'Être Sénégalais de l\'Extérieur (carte consulaire requise)',
    'Compétences et expériences dans le domaine',
    'Engagement du promoteur (apport personnel 10%)',
    'Calcul du Taux de Rentabilité Interne (TRI)',
    'Calcul de la Valeur Actuelle Nette (VAN)',
    'Délai de Récupération du Capital',
    'Étude de faisabilité en 4 exemplaires',
    'Demande de financement au Ministre'
  ]
}

export function FAISETemplate({ project, onBack }: FAISETemplateProps) {
  const [projectData, setProjectData] = useState<ProjectData>({
    projectOwner: null,
    companyIdentity: null,
    products: [],
    salesProjections: [],
    technicalStudy: [],
    financialOutputs: [],
    capex: [],
    opex: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProjectData()
  }, [project.id])

  const loadProjectData = async () => {
    try {
      const [
        { data: ownerData },
        { data: companyData },
        { data: productsData },
        { data: salesData },
        { data: technicalData },
        { data: financialData },
        { data: capexData },
        { data: opexData }
      ] = await Promise.all([
        supabase.from('project_owners').select('*').eq('project_id', project.id).single(),
        supabase.from('company_identity').select('*').eq('project_id', project.id).single(),
        supabase.from('products_services').select('*').eq('project_id', project.id),
        supabase.from('sales_projections').select('*').eq('project_id', project.id),
        supabase.from('technical_study').select('*').eq('project_id', project.id),
        supabase.from('financial_outputs').select('*').eq('project_id', project.id),
        supabase.from('capex').select('*').eq('project_id', project.id),
        supabase.from('opex').select('*').eq('project_id', project.id)
      ])

      setProjectData({
        projectOwner: ownerData,
        companyIdentity: companyData,
        products: productsData || [],
        salesProjections: salesData || [],
        technicalStudy: technicalData || [],
        financialOutputs: financialData || [],
        capex: capexData || [],
        opex: opexData || []
      })
    } catch (error) {
      console.error('Erreur chargement données FAISE:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalRevenue = () => {
    return projectData.financialOutputs.reduce((sum, item) => sum + (item.revenue || 0), 0)
  }

  const calculateTotalInvestment = () => {
    return projectData.capex.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const calculateOperatingCosts = () => {
    return projectData.opex.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA'
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec contrôles */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex space-x-3">
            <Button onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Critères d'éligibilité FAISE */}
      <div className="print:hidden bg-blue-50 border-l-4 border-blue-400 p-4 m-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Critères d'éligibilité FAISE
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Critères relatifs au projet :</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {FAISE_CRITERIA.project.map((criterion, index) => (
                      <li key={index}>{criterion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Critères relatifs au promoteur :</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {FAISE_CRITERIA.promoteur.map((criterion, index) => (
                      <li key={index}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal du business plan FAISE */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">

        {/* En-tête FAISE */}
        <div className="text-center border-b-2 border-blue-600 pb-6 mb-8 p-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            FONDS D'APPUI À L'INVESTISSEMENT DES SÉNÉGALAIS DE L'EXTÉRIEUR
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            ÉTUDE DE FAISABILITÉ
          </h2>
          <h3 className="text-2xl font-bold text-gray-900">
            {project.name || 'Nom du Projet'}
          </h3>
          {projectData.companyIdentity?.company_name && (
            <p className="text-lg text-gray-600 mt-2">
              {projectData.companyIdentity.company_name}
            </p>
          )}
        </div>

        <div className="p-6 space-y-8">

          {/* I. PRÉSENTATION GÉNÉRALE */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              I. PRÉSENTATION GÉNÉRALE
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Présentation du projet</h3>
                <p className="text-gray-700 leading-relaxed">
                  {project.description || 'Description du projet à compléter'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Contexte et Justification du projet</h3>
                <p className="text-gray-700 leading-relaxed">
                  Le projet s'inscrit dans le secteur {project.sector || '[Secteur à préciser]'} et vise à répondre aux besoins identifiés sur le marché local et régional.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Objectifs et résultats attendus</h3>
                <p className="text-gray-700 leading-relaxed">
                  • Créer une activité économique viable<br/>
                  • Générer des emplois locaux<br/>
                  • Contribuer au développement socio-économique de la région
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Description du Projet</h3>
                <p className="text-gray-700 leading-relaxed">
                  {project.description || 'Description détaillée à compléter'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Présentation du site du projet</h3>
                <p className="text-gray-700 leading-relaxed">
                  Localisation : {projectData.companyIdentity?.city || '[Ville]'}, {projectData.companyIdentity?.country || 'Sénégal'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Présentation du/des promoteur(s)</h3>
                {projectData.projectOwner ? (
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>Nom :</strong> {projectData.projectOwner.first_name} {projectData.projectOwner.last_name}</p>
                    <p><strong>Fonction :</strong> {projectData.projectOwner.title || 'Non précisé'}</p>
                    <p><strong>Expérience :</strong> {projectData.projectOwner.experience_years || 'Non précisé'} ans</p>
                    <p><strong>Email :</strong> {projectData.projectOwner.email || 'Non précisé'}</p>
                    <p><strong>Téléphone :</strong> {projectData.projectOwner.phone || 'Non précisé'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Informations du promoteur à compléter</p>
                )}
              </div>
            </div>
          </section>

          {/* II. ÉTUDE DE MARCHÉ */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              II. ÉTUDE DE MARCHÉ
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Description des produits</h3>
                {projectData.products.length > 0 ? (
                  <div className="space-y-2">
                    {projectData.products.map((product, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p><strong>{product.name}</strong> - {formatCurrency(product.unit_price)}/{product.unit}</p>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Produits/services à définir</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Analyse de la demande</h3>
                <p className="text-gray-700">Analyse de la demande à compléter selon l'étude de marché</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Analyse de l'offre</h3>
                <p className="text-gray-700">Analyse concurrentielle à compléter</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Les prix de ventes</h3>
                {projectData.products.length > 0 ? (
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-2 text-left">Produit/Service</th>
                        <th className="border border-gray-300 p-2 text-right">Prix Unitaire</th>
                        <th className="border border-gray-300 p-2 text-left">Unité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectData.products.map((product, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{product.name}</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(product.unit_price)}</td>
                          <td className="border border-gray-300 p-2">{product.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic">Grille tarifaire à définir</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Les fournisseurs de matière première</h3>
                <p className="text-gray-700">Liste des fournisseurs à compléter</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">6. La stratégie de distribution</h3>
                <p className="text-gray-700">Canaux de distribution à détailler</p>
              </div>
            </div>
          </section>

          {/* III. ÉTUDE TECHNIQUE */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              III. ÉTUDE TECHNIQUE
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Le procédé technique de production</h3>
                <p className="text-gray-700">Description du processus de production à compléter</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Description des constructions et aménagements</h3>
                <p className="text-gray-700">Infrastructures nécessaires à détailler</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Description des équipements</h3>
                <p className="text-gray-700">Liste des équipements nécessaires</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Estimation des besoins en Fonds de Roulement</h3>
                <p className="text-gray-700">Calcul du BFR à effectuer</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Coût total du projet</h3>
                <div className="bg-blue-50 p-4 rounded">
                  <p><strong>Investissements (CAPEX) :</strong> {formatCurrency(calculateTotalInvestment())}</p>
                  <p><strong>Charges opérationnelles (OPEX) :</strong> {formatCurrency(calculateOperatingCosts())}</p>
                  <p className="text-lg font-bold text-blue-600">
                    <strong>Coût total estimé :</strong> {formatCurrency(calculateTotalInvestment() + calculateOperatingCosts())}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Plan de financement du projet (emprunt, apport de 10%)</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Financement FAISE (max 15M FCFA) :</strong> [À calculer]</p>
                  <p><strong>Apport personnel (10%) :</strong> [À calculer]</p>
                  <p><strong>Autres financements :</strong> [Si applicable]</p>
                </div>
              </div>
            </div>
          </section>

          {/* IV. ÉTUDE FINANCIÈRE */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              IV. ÉTUDE FINANCIÈRE DU PROJET
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Le tableau du chiffre d'affaires prévisionnel</h3>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-lg font-semibold text-green-700">
                    Chiffre d'affaires total prévisionnel : {formatCurrency(calculateTotalRevenue())}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">8. Calcul des ratios financiers</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">a. La valeur actualisée nette (VAN)</h4>
                    <p className="text-gray-700">Calcul à effectuer avec taux d'actualisation</p>
                  </div>
                  <div>
                    <h4 className="font-medium">b. Le taux de rentabilité interne (TRI)</h4>
                    <p className="text-gray-700">Calcul du TRI à effectuer</p>
                  </div>
                  <div>
                    <h4 className="font-medium">c. Durée de récupération du capital</h4>
                    <p className="text-gray-700">Délai de récupération à calculer</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* V. IMPACT SOCIO-ÉCONOMIQUE */}
          <section>
            <h2 className="text-xl font-bold text-blue-800 border-b-2 border-blue-200 pb-2 mb-4">
              V. IMPACT DU PROJET AU PLAN ÉCONOMIQUE ET SOCIAL
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Impact du projet sur le plan économique</h3>
                <p className="text-gray-700">Retombées économiques à détailler</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Impact du projet sur le plan social et environnemental</h3>
                <p className="text-gray-700">Impacts sociaux et environnementaux à analyser</p>
              </div>
            </div>
          </section>

        </div>

        {/* Pied de page */}
        <div className="text-center text-gray-500 text-sm border-t pt-4 mt-8 p-6">
          <p>Document généré automatiquement - Format FAISE</p>
          <p>Fonds d'Appui à l'Investissement des Sénégalais de l'Extérieur</p>
        </div>
      </div>
    </div>
  )
}