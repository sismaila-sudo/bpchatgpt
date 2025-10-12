// Types pour la Fiche Synoptique (Document FONGIP/FAISE)

export interface PresentationEntreprise {
  raisonSociale: string
  dateCreation: string
  formeJuridique: string
  registreCommerce: string
  identificationFiscale: string // NINEA
  adresse: string
  telephone: string
  email: string
  presidentFondateur: string
  capitalSocial: number
  repartitionCapital: string // Ex: "100% National" ou "60% National, 40% Étranger"
  secteurActivite: string
  activites: string
}

export interface PresentationProjet {
  objetFinancement: string
  besoinTotalFinancement: number
  detailsBesoins: {
    construction?: number
    equipements?: number
    fraisDossier?: number
    creditSpot?: number
    decouvert?: number
    bfr?: number
    autres?: number
  }
  apportPromoteur: number
  montantSollicite: number
}

export interface ConditionsFinancement {
  typesCredit: TypeCredit[]
}

export interface TypeCredit {
  type: 'CMT' | 'Découvert' | 'Avance sur factures' | 'Crédit-bail' | 'Autre'
  montant: number
  dureeRemboursement: string // Ex: "60 mois", "12 mois renouvelable"
  taux: number // En pourcentage
  echeanceValidite: string // Ex: "Trimestrielle", "120 jours"
}

export interface Garanties {
  garantiesProposees: GarantieItem[]
}

export interface GarantieItem {
  type: string // Ex: "Garantie financière FONGIP", "Caution hypothécaire", "Dépôt de garantie"
  description: string
  montant?: number
}

export interface DonneesPrevisionnelles {
  annees: number[] // Ex: [2025, 2026, 2027, 2028, 2029, 2030, 2031]
  margeCommerciale: number[]
  chiffreAffaires: number[]
  valeurAjoutee: number[]
  excedentBrutExploitation: number[]
  resultatExploitation: number[]
  resultatFinancier: number[]
  resultatActivitesOrdinaires: number[]
  resultatHorsActivitesOrdinaires: number[]
  impotsSurResultat: number[]
  resultatNet: number[]
  cashFlows: number[]
  cashFlowsCumules: number[]
  rentabiliteGlobale: number[] // En pourcentage
}

export interface FicheSynoptique {
  id?: string
  projectId: string
  userId: string

  // Sections principales
  presentationEntreprise: PresentationEntreprise
  presentationProjet: PresentationProjet
  conditionsFinancement: ConditionsFinancement
  garanties: Garanties
  donneesPrevisionnelles: DonneesPrevisionnelles

  // Métadonnées
  createdAt?: Date
  updatedAt?: Date
  version?: number
}

// Interface pour le formulaire de saisie
export interface FicheSynoptiqueFormData extends Omit<FicheSynoptique, 'id' | 'createdAt' | 'updatedAt' | 'version'> {}
