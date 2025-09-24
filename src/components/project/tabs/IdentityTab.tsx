'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  Building,
  FileText,
  Users,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  User
} from 'lucide-react'


interface IdentityTabProps {
  project: any
}

interface Director {
  id: string
  name: string
  function: string
  qualifications: string
}

interface Client {
  id: string
  name: string
  contact: string
  sector: string
}

interface Supplier {
  id: string
  name: string
  contact: string
  products_services: string
}

interface Bank {
  id: string
  name: string
  account_type: string
  contact: string
}

interface CompanyIdentity {
  id?: string
  project_id: string
  company_name?: string
  legal_form?: string
  sector?: string
  rc_number?: string
  ifu_number?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  establishment_date?: string
  capital?: number
  activity_description?: string
  dirigeants?: string
  clients_principaux?: string
  fournisseurs_principaux?: string
  banques_partenaires?: string
  certifications?: string
  created_at?: string
  updated_at?: string
}

interface ProjectOwner {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  title?: string
  company?: string
  experience_years?: number
  motivation?: string
  vision?: string
}

const LEGAL_FORMS = [
  'SARL - Société à Responsabilité Limitée',
  'SA - Société Anonyme',
  'SAS - Société par Actions Simplifiée',
  'SUARL - Société Unipersonnelle à Responsabilité Limitée',
  'SNC - Société en Nom Collectif',
  'SCS - Société en Commandite Simple',
  'EI - Entreprise Individuelle',
  'Auto-entrepreneur',
  'GIE - Groupement d\'Intérêt Économique',
  'Coopérative',
  'Association',
  'ONG',
  'Autre'
]

const SECTORS = [
  'Agriculture, sylviculture et pêche',
  'Industries extractives',
  'Industrie manufacturière',
  'Production et distribution d\'électricité, de gaz, de vapeur et d\'air conditionné',
  'Production et distribution d\'eau; assainissement, gestion des déchets',
  'Construction',
  'Commerce; réparation d\'automobiles et de motocycles',
  'Transport et entreposage',
  'Hébergement et restauration',
  'Information et communication',
  'Activités financières et d\'assurance',
  'Activités immobilières',
  'Activités spécialisées, scientifiques et techniques',
  'Activités de services administratifs et de soutien',
  'Administration publique',
  'Enseignement',
  'Santé humaine et action sociale',
  'Arts, spectacles et activités récréatives',
  'Autres activités de services',
  'Activités des ménages en tant qu\'employeurs',
  'Activités des organisations et organismes extraterritoriaux',
  'Autre'
]

export function IdentityTab({ project }: IdentityTabProps) {
  const [identity, setIdentity] = useState<CompanyIdentity>({
    project_id: project.id
  })
  const [directors, setDirectors] = useState<Director[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [owner, setOwner] = useState<ProjectOwner>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingOwner, setEditingOwner] = useState(false)
  const [savingOwner, setSavingOwner] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadIdentityData()
    loadOwnerInfo()
  }, [project.id])

  const loadIdentityData = async () => {
    try {
      // Charger l'identité de l'entreprise
      const { data, error } = await supabase
        .from('company_identity')
        .select('*')
        .eq('project_id', project.id)
        .single()

      if (data) {
        setIdentity(data)

        // Charger les listes depuis le JSON si elles existent
        try {
          if (data.dirigeants) setDirectors(JSON.parse(data.dirigeants))
          if (data.clients_principaux) setClients(JSON.parse(data.clients_principaux))
          if (data.fournisseurs_principaux) setSuppliers(JSON.parse(data.fournisseurs_principaux))
          if (data.banques_partenaires) setBanks(JSON.parse(data.banques_partenaires))
        } catch (e) {
          console.log('Info: Error parsing JSON data, using empty arrays')
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement identité:', error)
      }

      // Charger les listes dynamiques (sans bloquer si les tables n'existent pas)
      try {
        await Promise.all([
          loadDirectors(),
          loadClients(),
          loadSuppliers(),
          loadBanks()
        ])
      } catch (error) {
        console.log('Info: Some dynamic tables not available yet')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadOwnerInfo() {
    try {
      const { data: ownerData } = await supabase
        .from('project_owners')
        .select('*')
        .eq('project_id', project.id)
        .single()

      if (ownerData) {
        setOwner(ownerData)
      }
    } catch (error) {
      console.log('Aucune information porteur trouvée, ce qui est normal pour un nouveau projet')
    }
  }

  async function saveOwnerInfo() {
    setSavingOwner(true)
    try {
      const ownerData = {
        project_id: project.id,
        ...owner
      }

      if (owner.id) {
        // Mise à jour
        const { error } = await supabase
          .from('project_owners')
          .update(ownerData)
          .eq('id', owner.id)

        if (error) throw error
      } else {
        // Création
        const { data, error } = await supabase
          .from('project_owners')
          .insert([ownerData])
          .select()
          .single()

        if (error) throw error
        if (data) setOwner(data)
      }

      setEditingOwner(false)
    } catch (error) {
      console.error('Erreur sauvegarde porteur:', error)
      alert('Erreur lors de la sauvegarde des informations')
    } finally {
      setSavingOwner(false)
    }
  }

  const loadDirectors = async () => {
    try {
      const { data, error } = await supabase
        .from('company_directors')
        .select('*')
        .eq('project_id', project.id)

      if (error && error.code === '42P01') {
        // Table doesn't exist yet, that's ok
        console.log('Table company_directors not found - using default empty array')
        return
      }

      if (data) setDirectors(data)
    } catch (error) {
      console.log('Info: company_directors table not available yet')
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('company_clients')
        .select('*')
        .eq('project_id', project.id)

      if (error && error.code === '42P01') {
        console.log('Table company_clients not found - using default empty array')
        return
      }

      if (data) setClients(data)
    } catch (error) {
      console.log('Info: company_clients table not available yet')
    }
  }

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('company_suppliers')
        .select('*')
        .eq('project_id', project.id)

      if (error && error.code === '42P01') {
        console.log('Table company_suppliers not found - using default empty array')
        return
      }

      if (data) setSuppliers(data)
    } catch (error) {
      console.log('Info: company_suppliers table not available yet')
    }
  }

  const loadBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('company_banks')
        .select('*')
        .eq('project_id', project.id)

      if (error && error.code === '42P01') {
        console.log('Table company_banks not found - using default empty array')
        return
      }

      if (data) setBanks(data)
    } catch (error) {
      console.log('Info: company_banks table not available yet')
    }
  }

  const saveIdentity = async () => {
    setIsSaving(true)
    try {
      // Préparer toutes les données à sauvegarder, y compris les listes
      const identityData = {
        ...identity,
        project_id: project.id,
        dirigeants: JSON.stringify(directors),
        clients_principaux: JSON.stringify(clients),
        fournisseurs_principaux: JSON.stringify(suppliers),
        banques_partenaires: JSON.stringify(banks),
        updated_at: new Date().toISOString()
      }

      if (identity.id) {
        const { error } = await supabase
          .from('company_identity')
          .update(identityData)
          .eq('id', identity.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('company_identity')
          .insert([{ ...identityData, created_at: new Date().toISOString() }])
          .select()
          .single()

        if (error) throw error
        if (data) setIdentity(data)
      }

      setIsEditing(false)
      alert('Informations sauvegardées avec succès!')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || error}`)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const saveDirectors = async () => {
    try {
      for (const director of directors) {
        if (director.name.trim()) {
          const { error } = await supabase
            .from('company_directors')
            .upsert({
              id: director.id.startsWith('temp_') ? undefined : director.id,
              project_id: project.id,
              name: director.name,
              function: director.function,
              qualifications: director.qualifications,
              updated_at: new Date().toISOString()
            })

          if (error && error.code === '42P01') {
            console.log('Info: company_directors table not available yet')
            return
          }
        }
      }
    } catch (error) {
      console.log('Info: Skipping directors save - table not available yet')
    }
  }

  const saveClients = async () => {
    try {
      for (const client of clients) {
        if (client.name.trim()) {
          const { error } = await supabase
            .from('company_clients')
            .upsert({
              id: client.id.startsWith('temp_') ? undefined : client.id,
              project_id: project.id,
              name: client.name,
              contact: client.contact,
              sector: client.sector,
              updated_at: new Date().toISOString()
            })

          if (error && error.code === '42P01') {
            console.log('Info: company_clients table not available yet')
            return
          }
        }
      }
    } catch (error) {
      console.log('Info: Skipping clients save - table not available yet')
    }
  }

  const saveSuppliers = async () => {
    try {
      for (const supplier of suppliers) {
        if (supplier.name.trim()) {
          const { error } = await supabase
            .from('company_suppliers')
            .upsert({
              id: supplier.id.startsWith('temp_') ? undefined : supplier.id,
              project_id: project.id,
              name: supplier.name,
              contact: supplier.contact,
              products_services: supplier.products_services,
              updated_at: new Date().toISOString()
            })

          if (error && error.code === '42P01') {
            console.log('Info: company_suppliers table not available yet')
            return
          }
        }
      }
    } catch (error) {
      console.log('Info: Skipping suppliers save - table not available yet')
    }
  }

  const saveBanks = async () => {
    try {
      for (const bank of banks) {
        if (bank.name.trim()) {
          const { error } = await supabase
            .from('company_banks')
            .upsert({
              id: bank.id.startsWith('temp_') ? undefined : bank.id,
              project_id: project.id,
              name: bank.name,
              account_type: bank.account_type,
              contact: bank.contact,
              updated_at: new Date().toISOString()
            })

          if (error && error.code === '42P01') {
            console.log('Info: company_banks table not available yet')
            return
          }
        }
      }
    } catch (error) {
      console.log('Info: Skipping banks save - table not available yet')
    }
  }


  const handleInputChange = (field: keyof CompanyIdentity, value: string | number) => {
    setIdentity(prev => ({ ...prev, [field]: value }))
  }

  // Functions for managing dynamic lists
  const addDirector = () => {
    const newDirector: Director = {
      id: `temp_${Date.now()}`,
      name: '',
      function: '',
      qualifications: ''
    }
    setDirectors([...directors, newDirector])
  }

  const updateDirector = (id: string, field: keyof Director, value: string) => {
    setDirectors(directors => directors.map(director =>
      director.id === id ? { ...director, [field]: value } : director
    ))
  }

  const removeDirector = (id: string) => {
    setDirectors(directors => directors.filter(director => director.id !== id))
  }

  const addClient = () => {
    const newClient: Client = {
      id: `temp_${Date.now()}`,
      name: '',
      contact: '',
      sector: ''
    }
    setClients([...clients, newClient])
  }

  const updateClient = (id: string, field: keyof Client, value: string) => {
    setClients(clients => clients.map(client =>
      client.id === id ? { ...client, [field]: value } : client
    ))
  }

  const removeClient = (id: string) => {
    setClients(clients => clients.filter(client => client.id !== id))
  }

  const addSupplier = () => {
    const newSupplier: Supplier = {
      id: `temp_${Date.now()}`,
      name: '',
      contact: '',
      products_services: ''
    }
    setSuppliers([...suppliers, newSupplier])
  }

  const updateSupplier = (id: string, field: keyof Supplier, value: string) => {
    setSuppliers(suppliers => suppliers.map(supplier =>
      supplier.id === id ? { ...supplier, [field]: value } : supplier
    ))
  }

  const removeSupplier = (id: string) => {
    setSuppliers(suppliers => suppliers.filter(supplier => supplier.id !== id))
  }

  const addBank = () => {
    const newBank: Bank = {
      id: `temp_${Date.now()}`,
      name: '',
      account_type: '',
      contact: ''
    }
    setBanks([...banks, newBank])
  }

  const updateBank = (id: string, field: keyof Bank, value: string) => {
    setBanks(banks => banks.map(bank =>
      bank.id === id ? { ...bank, [field]: value } : bank
    ))
  }

  const removeBank = (id: string) => {
    setBanks(banks => banks.filter(bank => bank.id !== id))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-lg h-32"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiche d'Identification</h1>
          <p className="text-gray-600">
            Informations légales et administratives de l'entreprise
          </p>
        </div>
        <div className="flex items-center space-x-4">

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    loadIdentityData()
                  }}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={() => saveIdentity()}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Porteur de Projet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Porteur de Projet
            </CardTitle>
            {!editingOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingOwner(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {owner.first_name ? 'Modifier' : 'Ajouter'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingOwner ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={owner.first_name || ''}
                    onChange={(e) => setOwner({ ...owner, first_name: e.target.value })}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={owner.last_name || ''}
                    onChange={(e) => setOwner({ ...owner, last_name: e.target.value })}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={owner.email || ''}
                    onChange={(e) => setOwner({ ...owner, email: e.target.value })}
                    placeholder="votre.email@exemple.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={owner.phone || ''}
                    onChange={(e) => setOwner({ ...owner, phone: e.target.value })}
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre / Fonction</Label>
                  <Input
                    id="title"
                    value={owner.title || ''}
                    onChange={(e) => setOwner({ ...owner, title: e.target.value })}
                    placeholder="Ex: Directeur Général, Entrepreneur"
                  />
                </div>
                <div>
                  <Label htmlFor="experience_years">Années d'expérience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={owner.experience_years || ''}
                    onChange={(e) => setOwner({ ...owner, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="motivation">Motivation pour ce projet</Label>
                <Textarea
                  id="motivation"
                  value={owner.motivation || ''}
                  onChange={(e) => setOwner({ ...owner, motivation: e.target.value })}
                  placeholder="Décrivez ce qui vous motive à réaliser ce projet..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="vision">Vision à long terme</Label>
                <Textarea
                  id="vision"
                  value={owner.vision || ''}
                  onChange={(e) => setOwner({ ...owner, vision: e.target.value })}
                  placeholder="Quelle est votre vision pour l'avenir de ce projet ?"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingOwner(false)
                    loadOwnerInfo() // Recharger les données originales
                  }}
                  disabled={savingOwner}
                >
                  Annuler
                </Button>
                <Button
                  onClick={saveOwnerInfo}
                  disabled={savingOwner}
                >
                  {savingOwner ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {owner.first_name ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{owner.first_name} {owner.last_name}</span>
                    </div>
                    {owner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{owner.email}</span>
                      </div>
                    )}
                    {owner.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{owner.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {owner.title && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{owner.title}</span>
                      </div>
                    )}
                    {owner.experience_years && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Expérience :</span>
                        <span className="text-sm text-gray-600 ml-2">{owner.experience_years} ans</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucune information sur le porteur de projet</p>
                  <p className="text-xs text-gray-400">Cliquez sur "Ajouter" pour compléter votre profil</p>
                </div>
              )}

              {(owner.motivation || owner.vision) && (
                <div className="border-t pt-4 space-y-3">
                  {owner.motivation && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Motivation</h4>
                      <p className="text-sm text-gray-600">{owner.motivation}</p>
                    </div>
                  )}
                  {owner.vision && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Vision</h4>
                      <p className="text-sm text-gray-600">{owner.vision}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations générales de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            Informations Générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Raison sociale *</Label>
              <Input
                id="company_name"
                value={identity.company_name || ''}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Nom de l'entreprise"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="legal_form">Forme juridique</Label>
              {isEditing ? (
                <Select
                  value={identity.legal_form || ''}
                  onValueChange={(value) => handleInputChange('legal_form', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une forme juridique" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_FORMS.map((form) => (
                      <SelectItem key={form} value={form}>
                        {form}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={identity.legal_form || ''}
                  disabled
                  placeholder="Non défini"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rc_number">Numéro RC</Label>
              <Input
                id="rc_number"
                value={identity.rc_number || ''}
                onChange={(e) => handleInputChange('rc_number', e.target.value)}
                placeholder="Registre de Commerce"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="ifu_number">Numéro IFU</Label>
              <Input
                id="ifu_number"
                value={identity.ifu_number || ''}
                onChange={(e) => handleInputChange('ifu_number', e.target.value)}
                placeholder="Identifiant Fiscal Unique"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="capital">Capital social (XOF)</Label>
              <Input
                id="capital"
                type="number"
                value={identity.capital || ''}
                onChange={(e) => handleInputChange('capital', parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sector">Secteur d'activité</Label>
            {isEditing ? (
              <Select
                value={identity.sector || ''}
                onValueChange={(value) => handleInputChange('sector', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un secteur d'activité" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={identity.sector || ''}
                disabled
                placeholder="Non défini"
              />
            )}
          </div>

          <div>
            <Label htmlFor="activity_description">Description de l'activité</Label>
            <Textarea
              id="activity_description"
              value={identity.activity_description || ''}
              onChange={(e) => handleInputChange('activity_description', e.target.value)}
              placeholder="Décrivez l'activité principale de l'entreprise..."
              rows={3}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Adresse et coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Adresse et Coordonnées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={identity.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Adresse complète"
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={identity.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Dakar"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={identity.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="12500"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                value={identity.country || 'Sénégal'}
                onChange={(e) => handleInputChange('country', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={identity.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+221 XX XXX XX XX"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={identity.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@entreprise.sn"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                value={identity.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="www.entreprise.sn"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dirigeants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Dirigeants
            </CardTitle>
            {isEditing && (
              <Button size="sm" onClick={addDirector} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un dirigeant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {directors.map((director) => (
              <div key={director.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Dirigeant</span>
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDirector(director.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Nom complet</Label>
                    <Input
                      value={director.name}
                      onChange={(e) => updateDirector(director.id, 'name', e.target.value)}
                      placeholder="Nom et prénom"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Fonction</Label>
                    <Input
                      value={director.function}
                      onChange={(e) => updateDirector(director.id, 'function', e.target.value)}
                      placeholder="Ex: Directeur Général"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Qualifications</Label>
                    <Input
                      value={director.qualifications}
                      onChange={(e) => updateDirector(director.id, 'qualifications', e.target.value)}
                      placeholder="Formation, expérience"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            ))}
            {directors.length === 0 && (
              <p className="text-gray-500 text-center py-8 italic">
                Aucun dirigeant ajouté
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banques Partenaires */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
              Banques Partenaires
            </CardTitle>
            {isEditing && (
              <Button size="sm" onClick={addBank} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une banque
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {banks.map((bank) => (
              <div key={bank.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Banque</span>
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeBank(bank.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Nom de la banque</Label>
                    <Input
                      value={bank.name}
                      onChange={(e) => updateBank(bank.id, 'name', e.target.value)}
                      placeholder="Ex: CBAO, SGBS..."
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Type de compte</Label>
                    <Input
                      value={bank.account_type}
                      onChange={(e) => updateBank(bank.id, 'account_type', e.target.value)}
                      placeholder="Courant, Épargne..."
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={bank.contact}
                      onChange={(e) => updateBank(bank.id, 'contact', e.target.value)}
                      placeholder="Nom du contact, téléphone"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            ))}
            {banks.length === 0 && (
              <p className="text-gray-500 text-center py-8 italic">
                Aucune banque ajoutée
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clients et fournisseurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Clients Principaux
              </CardTitle>
              {isEditing && (
                <Button size="sm" onClick={addClient} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Client</span>
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeClient(client.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Nom du client</Label>
                      <Input
                        value={client.name}
                        onChange={(e) => updateClient(client.id, 'name', e.target.value)}
                        placeholder="Nom de l'entreprise"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Contact</Label>
                      <Input
                        value={client.contact}
                        onChange={(e) => updateClient(client.id, 'contact', e.target.value)}
                        placeholder="Nom, téléphone, email"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Secteur</Label>
                      <Input
                        value={client.sector}
                        onChange={(e) => updateClient(client.id, 'sector', e.target.value)}
                        placeholder="Secteur d'activité"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <p className="text-gray-500 text-center py-8 italic">
                  Aucun client ajouté
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fournisseurs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Fournisseurs Principaux
              </CardTitle>
              {isEditing && (
                <Button size="sm" onClick={addSupplier} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un fournisseur
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Fournisseur</span>
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSupplier(supplier.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Nom du fournisseur</Label>
                      <Input
                        value={supplier.name}
                        onChange={(e) => updateSupplier(supplier.id, 'name', e.target.value)}
                        placeholder="Nom de l'entreprise"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Contact</Label>
                      <Input
                        value={supplier.contact}
                        onChange={(e) => updateSupplier(supplier.id, 'contact', e.target.value)}
                        placeholder="Nom, téléphone, email"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Produits/Services</Label>
                      <Input
                        value={supplier.products_services}
                        onChange={(e) => updateSupplier(supplier.id, 'products_services', e.target.value)}
                        placeholder="Ce qu'il fournit"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="text-gray-500 text-center py-8 italic">
                  Aucun fournisseur ajouté
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications et dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
            Informations Complémentaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="establishment_date">Date de création</Label>
            <Input
              id="establishment_date"
              type="date"
              value={identity.establishment_date || ''}
              onChange={(e) => handleInputChange('establishment_date', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="certifications">Certifications et agréments</Label>
            <Textarea
              id="certifications"
              value={identity.certifications || ''}
              onChange={(e) => handleInputChange('certifications', e.target.value)}
              placeholder="ISO, agréments sectoriels, certifications qualité..."
              rows={3}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}