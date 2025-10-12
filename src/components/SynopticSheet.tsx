'use client'

import { Project } from '@/types/project'
import { BUSINESS_SECTOR_LABELS, SENEGAL_COMPANY_TYPE_LABELS, COMPANY_STATUS_LABELS } from '@/lib/constants'
import { BuildingOfficeIcon, UserGroupIcon, MapPinIcon, CurrencyDollarIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface SynopticSheetProps {
  project: Project
  className?: string
}

export default function SynopticSheet({ project, className = '' }: SynopticSheetProps) {
  const identification = project.sections?.identification
  const financialData = project.sections?.financialData

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className={`bg-white ${className}`} style={{ minHeight: '297mm', width: '210mm' }}>
      {/* En-tête avec logo et titre */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">FICHE SYNOPTIQUE</h1>
            <h2 className="text-xl">{project.basicInfo.name}</h2>
          </div>
          {identification?.logo && (
            <img
              src={identification.logo}
              alt="Logo entreprise"
              className="h-16 w-16 rounded-lg bg-white p-2"
            />
          )}
        </div>
      </div>

      <div className="px-8 pb-8 space-y-8">
        {/* Section Identification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">IDENTIFICATION ENTREPRISE</h3>
            </div>
            <div className="space-y-3 text-sm">
              {identification && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Dénomination sociale :</span>
                    <span className="text-right">{identification.legalName}</span>
                  </div>
                  {identification.commercialName && (
                    <div className="flex justify-between">
                      <span className="font-medium">Nom commercial :</span>
                      <span className="text-right">{identification.commercialName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Forme juridique :</span>
                    <span className="text-right">{SENEGAL_COMPANY_TYPE_LABELS[identification.legalForm]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Statut :</span>
                    <span className="text-right">{COMPANY_STATUS_LABELS[identification.status]}</span>
                  </div>
                  {identification.ninea && (
                    <div className="flex justify-between">
                      <span className="font-medium">NINEA :</span>
                      <span className="text-right">{identification.ninea}</span>
                    </div>
                  )}
                  {identification.registreCommerce && (
                    <div className="flex justify-between">
                      <span className="font-medium">Registre Commerce :</span>
                      <span className="text-right">{identification.registreCommerce}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Capital social :</span>
                    <span className="text-right">{formatCurrency(identification.capital)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MapPinIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">LOCALISATION & CONTACTS</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Région :</span>
                <span className="text-right">{project.basicInfo.location.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ville :</span>
                <span className="text-right">{project.basicInfo.location.city}</span>
              </div>
              {identification?.headquarters && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Adresse :</span>
                    <span className="text-right">{identification.headquarters.address}</span>
                  </div>
                  {identification.headquarters.phone && (
                    <div className="flex justify-between">
                      <span className="font-medium">Téléphone :</span>
                      <span className="text-right">{identification.headquarters.phone}</span>
                    </div>
                  )}
                  {identification.headquarters.email && (
                    <div className="flex justify-between">
                      <span className="font-medium">Email :</span>
                      <span className="text-right">{identification.headquarters.email}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section Projet */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">PROJET BUSINESS</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="font-medium text-gray-700">Secteur d'activité :</span>
              <p className="text-gray-900 mt-1">{BUSINESS_SECTOR_LABELS[project.basicInfo.sector]}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type de projet :</span>
              <p className="text-gray-900 mt-1">
                {project.basicInfo.projectType === 'creation' ? 'Création d\'entreprise' :
                 project.basicInfo.projectType === 'expansion' ? 'Extension d\'activité' :
                 project.basicInfo.projectType === 'diversification' ? 'Diversification' :
                 'Reprise d\'entreprise'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Taille envisagée :</span>
              <p className="text-gray-900 mt-1">
                {project.basicInfo.companySize === 'micro' ? 'Micro-entreprise' :
                 project.basicInfo.companySize === 'small' ? 'Petite entreprise' :
                 project.basicInfo.companySize === 'medium' ? 'Moyenne entreprise' :
                 'Grande entreprise'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <span className="font-medium text-gray-700">Description :</span>
            <p className="text-gray-900 mt-1 text-sm leading-relaxed">{project.basicInfo.description}</p>
          </div>
        </div>

        {/* Section Financière */}
        {financialData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">INVESTISSEMENT</h3>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(financialData.investment?.total || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Investissement total</div>
                </div>
                {financialData.investment?.breakdown && (
                  <div className="space-y-2 text-sm">
                    {financialData.investment.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.category} :</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">FINANCEMENT</h3>
              </div>
              <div className="space-y-3 text-sm">
                {financialData.financing?.ownFunds && (
                  <div className="flex justify-between">
                    <span className="font-medium">Fonds propres :</span>
                    <span className="text-right">{formatCurrency(financialData.financing.ownFunds)}</span>
                  </div>
                )}
                {financialData.financing?.loans && financialData.financing.loans.length > 0 && (
                  <div>
                    <span className="font-medium">Emprunts :</span>
                    {financialData.financing.loans.map((loan, index) => (
                      <div key={index} className="ml-4 mt-1 flex justify-between">
                        <span>{loan.source} :</span>
                        <span>{formatCurrency(loan.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {financialData.financing?.grants && financialData.financing.grants.length > 0 && (
                  <div>
                    <span className="font-medium">Subventions :</span>
                    {financialData.financing.grants.map((grant, index) => (
                      <div key={index} className="ml-4 mt-1 flex justify-between">
                        <span>{grant.source} :</span>
                        <span>{formatCurrency(grant.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section Management */}
        {identification?.manager && (
          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">DIRECTION & FONDATEURS</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Dirigeant principal :</h4>
                <div className="space-y-1">
                  <div><strong>Nom :</strong> {identification.manager.name}</div>
                  <div><strong>Fonction :</strong> {identification.manager.function}</div>
                  <div><strong>Email :</strong> {identification.manager.email}</div>
                  <div><strong>Téléphone :</strong> {identification.manager.phone}</div>
                </div>
              </div>
              {identification.founders && identification.founders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Structure actionnariale :</h4>
                  <div className="space-y-1">
                    {identification.founders.map((founder, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{founder.name} :</span>
                        <span className="font-medium">{founder.equity}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section Timeline */}
        <div className="bg-indigo-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CalendarIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">CALENDRIER PROJET</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">
                {formatDate(project.basicInfo.timeline.startDate)}
              </div>
              <div className="text-gray-600">Date de démarrage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">
                {project.basicInfo.timeline.duration} mois
              </div>
              <div className="text-gray-600">Durée prévue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">
                {identification?.effectifPrevu || 'N/A'}
              </div>
              <div className="text-gray-600">Effectif prévu</div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center text-xs text-gray-500 border-t pt-4">
          <p>Fiche synoptique générée le {formatDate(new Date())} - Business Plan Designer</p>
        </div>
      </div>
    </div>
  )
}