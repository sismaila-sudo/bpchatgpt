'use client'

import { useState } from 'react'
import { CompanyIdentification, SenegalCompanyType, CompanyStatus } from '@/types/project'
import {
  SENEGAL_COMPANY_TYPE_LABELS,
  COMPANY_STATUS_LABELS,
  MANAGER_FUNCTIONS,
  SENEGAL_REGIONS
} from '@/lib/constants'
import { PlusIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

interface CompanyIdentificationFormProps {
  companyId?: CompanyIdentification
  onChange: (identification: CompanyIdentification) => void
  isCreation?: boolean
  className?: string
}

export default function CompanyIdentificationForm({
  companyId,
  onChange,
  isCreation = false,
  className = ''
}: CompanyIdentificationFormProps) {

  const [identification, setIdentification] = useState<CompanyIdentification>(
    companyId || {
      legalName: '',
      commercialName: '',
      legalForm: SenegalCompanyType.SARL,
      status: isCreation ? CompanyStatus.CREATION : CompanyStatus.ACTIVE,
      ninea: '',
      registreCommerce: '',
      nif: '',
      capital: 0,
      currency: 'XOF',
      manager: {
        name: '',
        function: 'Gérant',
        phone: '',
        email: ''
      },
      pointFocal: {
        name: '',
        function: '',
        phone: '',
        email: ''
      },
      founders: [{
        name: '',
        role: 'Fondateur',
        equity: 100,
        apport: 0
      }],
      headquarters: {
        address: '',
        city: '',
        region: 'Dakar',
        country: 'Sénégal',
        phone: '',
        email: '',
        website: ''
      },
      dates: {
        creation: new Date(),
        registrationRC: undefined,
        debutActivite: undefined
      },
      activitePrincipale: '',
      activitesSecondaires: [],
      effectifPrevu: 1,
      logo: ''
    }
  )

  const updateIdentification = (updates: Partial<CompanyIdentification>) => {
    const newIdentification = { ...identification, ...updates }
    setIdentification(newIdentification)
    onChange(newIdentification)
  }

  const updateManager = (updates: Partial<typeof identification.manager>) => {
    updateIdentification({
      manager: { ...identification.manager, ...updates }
    })
  }

  const updatePointFocal = (updates: Partial<typeof identification.pointFocal>) => {
    updateIdentification({
      pointFocal: { ...identification.pointFocal, ...updates } as typeof identification.pointFocal
    })
  }

  const updateHeadquarters = (updates: Partial<typeof identification.headquarters>) => {
    updateIdentification({
      headquarters: { ...identification.headquarters, ...updates }
    })
  }

  const updateDates = (updates: Partial<typeof identification.dates>) => {
    updateIdentification({
      dates: { ...identification.dates, ...updates }
    })
  }

  const addFounder = () => {
    const newFounders = [...identification.founders, {
      name: '',
      role: 'Associé',
      equity: 0,
      apport: 0
    }]
    updateIdentification({ founders: newFounders })
  }

  const removeFounder = (index: number) => {
    const newFounders = identification.founders.filter((_, i) => i !== index)
    updateIdentification({ founders: newFounders })
  }

  const updateFounder = (index: number, updates: Partial<typeof identification.founders[0]>) => {
    const newFounders = identification.founders.map((founder, i) =>
      i === index ? { ...founder, ...updates } : founder
    )
    updateIdentification({ founders: newFounders })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount)
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center space-x-3 mb-6">
        <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Fiche d'Identification de l'Entreprise
          </h2>
          <p className="text-gray-600">
            Informations légales et administratives pour le Sénégal
          </p>
        </div>
      </div>

      {/* Identification légale */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📄 Identification Légale
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dénomination sociale *
            </label>
            <input
              type="text"
              value={identification.legalName}
              onChange={(e) => updateIdentification({ legalName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SARL EXEMPLE BUSINESS"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom commercial (optionnel)
            </label>
            <input
              type="text"
              value={identification.commercialName || ''}
              onChange={(e) => updateIdentification({ commercialName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Exemple Business"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forme juridique *
            </label>
            <select
              value={identification.legalForm}
              onChange={(e) => updateIdentification({ legalForm: e.target.value as SenegalCompanyType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(SENEGAL_COMPANY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut de l'entreprise
            </label>
            <select
              value={identification.status}
              onChange={(e) => updateIdentification({ status: e.target.value as CompanyStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(COMPANY_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Numéros d'identification */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🆔 Numéros d'Identification Sénégalais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NINEA
            </label>
            <input
              type="text"
              value={identification.ninea || ''}
              onChange={(e) => updateIdentification({ ninea: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 123456789012345"
            />
            <p className="text-xs text-gray-500 mt-1">
              Numéro d'Identification Nationale des Entreprises
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registre de Commerce
            </label>
            <input
              type="text"
              value={identification.registreCommerce || ''}
              onChange={(e) => updateIdentification({ registreCommerce: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: SN.DKR.2024.A.123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIF (Numéro d'Identification Fiscale)
            </label>
            <input
              type="text"
              value={identification.nif || ''}
              onChange={(e) => updateIdentification({ nif: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 123456789"
            />
          </div>
        </div>
      </div>

      {/* Capital et actionnariat */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💰 Capital et Actionnariat
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capital social *
            </label>
            <div className="flex">
              <input
                type="number"
                value={identification.capital === 0 ? '' : identification.capital.toString()}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  updateIdentification({ capital: value })
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000000"
                required
              />
              <select
                value={identification.currency}
                onChange={(e) => updateIdentification({ currency: e.target.value as 'XOF' | 'EUR' | 'USD' })}
                className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="XOF">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effectif prévu
            </label>
            <input
              type="number"
              value={identification.effectifPrevu}
              onChange={(e) => updateIdentification({ effectifPrevu: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5"
              min="1"
            />
          </div>
        </div>

        {/* Fondateurs */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">Fondateurs / Associés</h4>
            <button
              onClick={addFounder}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter
            </button>
          </div>

          <div className="space-y-4">
            {identification.founders.map((founder, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h5 className="font-medium">Fondateur {index + 1}</h5>
                  {identification.founders.length > 1 && (
                    <button
                      onClick={() => removeFounder(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={founder.name}
                      onChange={(e) => updateFounder(index, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rôle
                    </label>
                    <input
                      type="text"
                      value={founder.role}
                      onChange={(e) => updateFounder(index, { role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Fondateur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parts (%)
                    </label>
                    <input
                      type="number"
                      value={founder.equity === 0 ? '' : founder.equity.toString()}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        updateFounder(index, { equity: value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apport (FCFA)
                    </label>
                    <input
                      type="number"
                      value={founder.apport === 0 ? '' : founder.apport.toString()}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                        updateFounder(index, { apport: value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="500000"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dirigeants et contacts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Dirigeants et Contacts
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gérant/Directeur */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Dirigeant Principal</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={identification.manager.name}
                  onChange={(e) => updateManager({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fonction
                </label>
                <select
                  value={identification.manager.function}
                  onChange={(e) => updateManager({ function: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MANAGER_FUNCTIONS.map((func) => (
                    <option key={func} value={func}>
                      {func}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={identification.manager.phone}
                  onChange={(e) => updateManager({ phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+221 70 123 45 67"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={identification.manager.email}
                  onChange={(e) => updateManager({ email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="gerant@entreprise.sn"
                  required
                />
              </div>
            </div>
          </div>

          {/* Point focal */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Point Focal (optionnel)</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={identification.pointFocal?.name || ''}
                  onChange={(e) => updatePointFocal({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fonction
                </label>
                <input
                  type="text"
                  value={identification.pointFocal?.function || ''}
                  onChange={(e) => updatePointFocal({ function: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Responsable Commercial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={identification.pointFocal?.phone || ''}
                  onChange={(e) => updatePointFocal({ phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+221 77 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={identification.pointFocal?.email || ''}
                  onChange={(e) => updatePointFocal({ email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@entreprise.sn"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Siège social */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏢 Siège Social
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète *
            </label>
            <input
              type="text"
              value={identification.headquarters.address}
              onChange={(e) => updateHeadquarters({ address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Avenue Lamine Guèye, Plateau"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville *
            </label>
            <input
              type="text"
              value={identification.headquarters.city}
              onChange={(e) => updateHeadquarters({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dakar"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Région *
            </label>
            <select
              value={identification.headquarters.region}
              onChange={(e) => updateHeadquarters({ region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {SENEGAL_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={identification.headquarters.phone || ''}
              onChange={(e) => updateHeadquarters({ phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+221 33 123 45 67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={identification.headquarters.email || ''}
              onChange={(e) => updateHeadquarters({ email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="info@entreprise.sn"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <input
              type="url"
              value={identification.headquarters.website || ''}
              onChange={(e) => updateHeadquarters({ website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.entreprise.sn"
            />
          </div>
        </div>
      </div>

      {/* Activités et dates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📅 Activités et Dates importantes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activité principale *
            </label>
            <input
              type="text"
              value={identification.activitePrincipale}
              onChange={(e) => updateIdentification({ activitePrincipale: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Commerce de détail de produits alimentaires"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activités secondaires (optionnel)
            </label>
            <textarea
              value={identification.activitesSecondaires?.join(', ') || ''}
              onChange={(e) => updateIdentification({
                activitesSecondaires: e.target.value.split(',').map(a => a.trim()).filter(Boolean)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Conseil commercial, Formation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de création
            </label>
            <input
              type="date"
              value={identification.dates.creation ? identification.dates.creation.toISOString().split('T')[0] : ''}
              onChange={(e) => updateDates({
                creation: e.target.value ? new Date(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'enregistrement RC
            </label>
            <input
              type="date"
              value={identification.dates.registrationRC ? identification.dates.registrationRC.toISOString().split('T')[0] : ''}
              onChange={(e) => updateDates({
                registrationRC: e.target.value ? new Date(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début d'activité
            </label>
            <input
              type="date"
              value={identification.dates.debutActivite ? identification.dates.debutActivite.toISOString().split('T')[0] : ''}
              onChange={(e) => updateDates({
                debutActivite: e.target.value ? new Date(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📊 Résumé de l'Identification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Entreprise:</span>
            <p className="text-blue-700">{identification.legalName || 'Non défini'}</p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Forme juridique:</span>
            <p className="text-blue-700">
              {SENEGAL_COMPANY_TYPE_LABELS[identification.legalForm]}
            </p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Capital:</span>
            <p className="text-blue-700">
              {formatCurrency(identification.capital)} {identification.currency}
            </p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Dirigeant:</span>
            <p className="text-blue-700">{identification.manager.name || 'Non défini'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}