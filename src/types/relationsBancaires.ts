// Types pour la section Relations Bancaires FONGIP

export interface BanquePartenaire {
  id?: string
  nomBanque: string
  typeBanque: 'commerciale' | 'islamique' | 'microfinance' | 'cooperative' | 'autre'
  agence: string
  adresse: string
  telephone: string
  email: string
  contactPrincipal: {
    nom: string
    fonction: string
    telephone: string
    email: string
  }
  dateOuvertureCompte: string
  numeroCompte: string
  typeRelation: 'principale' | 'secondaire'
}

export interface CreditHistorique {
  id?: string
  banque: string
  dateOctroi: string
  montant: number
  tauxInteret: number
  duree: number // En mois
  objet: string
  garanties: string[]
  etatRemboursement: 'en_cours' | 'solde' | 'restructure' | 'en_defaut'
  capitalRestantDu?: number
  retardsRemboursement: {
    nombre: number
    dureeMaximale: number // En jours
    motifs?: string
  }
  appreciationBanque?: 'excellent' | 'bon' | 'moyen' | 'problematique'
}

export interface EncoursCredit {
  id?: string
  banque: string
  typeCredit: 'investissement' | 'exploitation' | 'tresorerie' | 'decouvert' | 'leasing'
  montantInitial: number
  capitalRestantDu: number
  tauxInteret: number
  echeanceMensuelle: number
  dateDebut: string
  dateFin: string
  garantiesMobilisees: string[]
  classeRisque: '1' | '2' | '3' | '4' | '5' // 1=Excellent, 5=Défaut
}

export interface GarantieMobilisee {
  id?: string
  type: 'hypotheque' | 'nantissement' | 'caution_solidaire' | 'aval' | 'garantie_fongip' | 'depot_especes' | 'autres'
  description: string
  valeur: number
  banqueBeneficiaire: string
  dateConstitution: string
  dateMainlevee?: string
  statut: 'active' | 'mainlevee' | 'executee'
  documentJustificatif?: string
}

export interface ServicesUtilises {
  compteCourant: boolean
  compteEpargne: boolean
  virementsNationaux: boolean
  virementsInternationaux: boolean
  carteBancaire: boolean
  chequiers: boolean
  banqueEnLigne: boolean
  mobileMoney: boolean
  credocumentaire: boolean
  cautionMarche: boolean
  autres: string[]
}

export interface EvaluationServiceBancaire {
  banque: string
  dateEvaluation: string
  criteres: {
    rapiditeTraitement: number // 1-5
    qualiteConseil: number // 1-5
    disponibilitePersonnel: number // 1-5
    conditionsFinancieres: number // 1-5
    digitalisation: number // 1-5
    proximiteAgences: number // 1-5
  }
  noteMoyenne: number
  pointsForts: string[]
  pointsAmeliorer: string[]
  commentaire?: string
}

export interface IncidentBancaire {
  id?: string
  date: string
  banque: string
  type: 'cheque_impaye' | 'decouvert_non_autorise' | 'retard_remboursement' | 'rejet_prelevement' | 'autres'
  montant: number
  motif: string
  resolution: string
  dateResolution?: string
  impact: 'faible' | 'moyen' | 'grave'
  penaliteFinanciere?: number
}

export interface PrevisionBesoinsFinancement {
  annee: number

  besoinsInvestissement: {
    materielEquipement: number
    immobilier: number
    vehicules: number
    informatique: number
    autres: number
    total: number
  }

  besoinsExploitation: {
    financementStocks: number
    financementCreances: number
    besoinTresorerie: number
    total: number
  }

  totalBesoins: number

  sourcesEnvisagees: {
    autofinancement: number
    creditBancaire: number
    leasingCredit_bail: number
    subventions: number
    apportNouveaux: number
    total: number
  }

  ecart: number // Doit être proche de 0
}

export interface RelationsBancaires {
  id?: string
  projectId: string
  userId: string

  // Banques partenaires
  banquesPartenaires: BanquePartenaire[]
  banquePrincipale?: string // Nom de la banque

  // Historique
  creditsHistoriques: CreditHistorique[]
  noteBanqueDeFrance?: {
    cote: string
    date: string
    commentaire?: string
  }

  // Encours actuels
  encoursCredits: EncoursCredit[]
  totalEncoursCredits: number
  ratioEndettement: number // En %

  // Garanties
  garantiesMobilisees: GarantieMobilisee[]
  capaciteGarantieRestante: number

  // Services et évaluation
  servicesUtilises: ServicesUtilises
  evaluationsServices: EvaluationServiceBancaire[]

  // Incidents
  incidentsBancaires: IncidentBancaire[]
  nombreIncidentsDernier12Mois: number

  // Prévisions
  previsionsBesoins: PrevisionBesoinsFinancement[]

  // Commentaires et analyse
  analyseSituationActuelle?: string
  strategieBancaire?: string
  justificationBesoinFONGIP?: string

  // Métadonnées
  dateCreation?: Date
  dateModification?: Date
  version?: number
}

// Helper pour créer une relation bancaire vide
export function createEmptyRelationsBancaires(projectId: string, userId: string): RelationsBancaires {
  return {
    projectId,
    userId,
    banquesPartenaires: [],
    creditsHistoriques: [],
    encoursCredits: [],
    totalEncoursCredits: 0,
    ratioEndettement: 0,
    garantiesMobilisees: [],
    capaciteGarantieRestante: 0,
    servicesUtilises: {
      compteCourant: false,
      compteEpargne: false,
      virementsNationaux: false,
      virementsInternationaux: false,
      carteBancaire: false,
      chequiers: false,
      banqueEnLigne: false,
      mobileMoney: false,
      credocumentaire: false,
      cautionMarche: false,
      autres: []
    },
    evaluationsServices: [],
    incidentsBancaires: [],
    nombreIncidentsDernier12Mois: 0,
    previsionsBesoins: [],
    version: 1
  }
}

// Calculs automatiques
export function calculateTotalEncours(encoursCredits: EncoursCredit[]): number {
  return encoursCredits.reduce((sum, credit) => sum + credit.capitalRestantDu, 0)
}

export function calculateRatioEndettement(encoursTotal: number, capitauxPropres: number): number {
  if (capitauxPropres === 0) return 0
  return (encoursTotal / capitauxPropres) * 100
}

export function evaluateRisqueBancaire(relations: RelationsBancaires): {
  niveau: 'faible' | 'moyen' | 'eleve' | 'tres_eleve'
  score: number // 0-100
  facteurs: string[]
} {
  let score = 100
  const facteurs: string[] = []

  // Incidents bancaires
  if (relations.nombreIncidentsDernier12Mois > 0) {
    score -= relations.nombreIncidentsDernier12Mois * 10
    facteurs.push(`${relations.nombreIncidentsDernier12Mois} incident(s) sur 12 mois`)
  }

  // Taux d'endettement
  if (relations.ratioEndettement > 200) {
    score -= 30
    facteurs.push(`Endettement élevé (${relations.ratioEndettement.toFixed(0)}%)`)
  } else if (relations.ratioEndettement > 100) {
    score -= 15
    facteurs.push(`Endettement modéré (${relations.ratioEndettement.toFixed(0)}%)`)
  }

  // Crédits en défaut
  const creditsDefaut = relations.creditsHistoriques.filter(c => c.etatRemboursement === 'en_defaut')
  if (creditsDefaut.length > 0) {
    score -= 40
    facteurs.push(`${creditsDefaut.length} crédit(s) en défaut`)
  }

  // Garanties mobilisées
  if (relations.capaciteGarantieRestante < 0) {
    score -= 20
    facteurs.push('Capacité de garantie saturée')
  }

  score = Math.max(0, Math.min(100, score))

  let niveau: 'faible' | 'moyen' | 'eleve' | 'tres_eleve'
  if (score >= 80) niveau = 'faible'
  else if (score >= 60) niveau = 'moyen'
  else if (score >= 40) niveau = 'eleve'
  else niveau = 'tres_eleve'

  return { niveau, score, facteurs }
}

// Validation
export function validateRelationsBancaires(relations: RelationsBancaires): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Au moins une banque partenaire
  if (relations.banquesPartenaires.length === 0) {
    errors.push('Au moins une banque partenaire doit être renseignée')
  }

  // Banque principale définie
  if (!relations.banquePrincipale && relations.banquesPartenaires.length > 0) {
    errors.push('La banque principale doit être définie')
  }

  // Cohérence encours/historique
  const encoursEnCours = relations.encoursCredits.length
  const creditsHistoriquesEnCours = relations.creditsHistoriques.filter(c => c.etatRemboursement === 'en_cours').length

  if (encoursEnCours !== creditsHistoriquesEnCours) {
    errors.push('Incohérence entre les encours et l\'historique des crédits')
  }

  // Prévisions équilibrées
  relations.previsionsBesoins.forEach((prevision, index) => {
    if (Math.abs(prevision.ecart) > 1000) {
      errors.push(`Prévisions année ${prevision.annee}: besoins et sources ne sont pas équilibrés (écart: ${prevision.ecart.toFixed(0)} FCFA)`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}
