/**
 * Types pour les tableaux financiers normalisés (PDF-ready).
 * Add-only — aucun import cyclique, aucun effet de bord.
 */
export type Cell = string | number;

export interface FinancialTable {
  /** Identifiant stable pour références croisées (toc/renvois). */
  id: string;
  /** Titre affichable du tableau. */
  title: string;
  /** En-têtes de colonnes (ligne unique). */
  headers: string[];
  /** Corps du tableau ; chaque sous-tableau = ligne. */
  rows: Cell[][];
  /** Ligne(s) de total ou notes éventuelles. */
  footers?: Cell[][];
  /** Métadonnées optionnelles (unité, devise, période, etc.). */
  meta?: Record<string, unknown>;
}

export interface FinancialTablesBundle {
  /** Liste ordonnée des tableaux à exporter. */
  tables: FinancialTable[];
  /**
   * Optionnel : index de numérotation si nécessaire,
   * ex. tableIndex = 1 pour "Tableau 1", figureIndex = 3, etc.
   */
  tableIndexStart?: number;
  figureIndexStart?: number;
}

// Types pour les Tableaux Financiers Détaillés FONGIP

// TABLEAU 1: Investissements et Financement
export interface InvestissementDetaille {
  nature: string // Ex: "Terrain", "Bâtiment", "Matériel"
  quantite: number
  prixUnitaire: number
  montantTotal: number
  categorie: 'immobilisations_incorporelles' | 'immobilisations_corporelles' | 'immobilisations_financieres' | 'bfr' | 'autres'
}

export interface SourceFinancement {
  source: string // Ex: "Crédit FONGIP", "Apport personnel", "Subvention"
  montant: number
  pourcentage: number
  type: 'fonds_propres' | 'credit_moyen_terme' | 'credit_court_terme' | 'subvention' | 'autre'
  tauxInteret?: number // Pour les crédits
  duree?: number // En mois
}

export interface TableauInvestissementFinancement {
  investissements: InvestissementDetaille[]
  sourcesFinancement: SourceFinancement[]
  totalInvestissements: number
  totalFinancement: number
  ecart: number // Doit être 0
}

// TABLEAU 2: Plan de Trésorerie
export interface FluxTresorerie {
  periode: string // "Mois 1", "T1 Année 2", etc.
  annee: number
  mois?: number // 1-12 pour année 1
  trimestre?: number // 1-4 pour années suivantes

  // Encaissements
  ventesComptant: number
  recouvrementCreances: number
  apportCapital: number
  creditBancaire: number
  autresEncaissements: number
  totalEncaissements: number

  // Décaissements
  achatsMatieresPremieres: number
  salairesChargesSociales: number
  loyersCharges: number
  utilitesEnergie: number
  fraisMarketing: number
  remboursementCredit: number
  interetsCredit: number
  impotsTaxes: number
  autresDecaissements: number
  totalDecaissements: number

  // Trésorerie
  fluxNet: number
  tresorerieDebut: number
  tresorerieFin: number
  decouvertNecessaire: number
  tresorerieExcedentaire: number
}

// TABLEAU 3: Compte de Résultat Prévisionnel Détaillé
export interface CompteResultatPrevisionnel {
  annee: number

  // Produits d'exploitation
  ventesProduitsActivite1: number
  ventesProduitsActivite2: number
  ventesProduitsActivite3: number
  autresProduits: number
  totalProduits: number

  // Achats consommés
  achatsMatieresPremieres: number
  variationStock: number
  achatsConsommes: number

  // Valeur ajoutée
  valeurAjoutee: number

  // Charges externes
  locationImmobiliere: number
  locationMateriel: number
  entretienReparations: number
  primasAssurances: number
  etudesRecherches: number
  documentationFormation: number
  fourniturestBureau: number
  energieEau: number
  telephoneInternet: number
  posteCourrier: number
  fraisTransport: number
  fraisMissionDeplacement: number
  publiciteMarketing: number
  honorairesPrestations: number
  autresServices: number
  totalChargesExternes: number

  // Valeur ajoutée nette
  valeurAjouteeNette: number

  // Charges de personnel
  salairesTraitements: number
  chargesSociales: number
  autresChargesPersonnel: number
  totalChargesPersonnel: number

  // Impôts et taxes
  taxesSurSalaires: number
  autresImpotsTaxes: number
  totalImpotsTaxes: number

  // EBE
  excedentBrutExploitation: number

  // Dotations
  dotationsAmortissementsImmobilisations: number
  dotationsProvisionsRisques: number
  totalDotations: number

  // Résultat d'exploitation
  resultatExploitation: number

  // Charges financières
  interetsEmprunts: number
  autresChargesFinancieres: number
  totalChargesFinancieres: number

  // Produits financiers
  produitsFinanciers: number

  // Résultat financier
  resultatFinancier: number

  // Résultat courant avant impôt
  resultatCourantAvantImpot: number

  // IS
  impotSurSocietes: number

  // Résultat net
  resultatNet: number

  // CAF
  capaciteAutofinancement: number
}

// TABLEAU 4: Plan d'Amortissement des Emprunts
export interface EcheanceEmprunt {
  periode: number // Mois ou année
  capitalRestantDu: number
  interet: number
  principal: number
  mensualite: number
  capitalRestantDuApres: number
}

export interface PlanAmortissementEmprunt {
  idEmprunt: string
  nomEmprunt: string
  montantEmprunte: number
  tauxInteret: number
  duree: number // En mois
  dateDebut: string
  typeAmortissement: 'constant' | 'lineaire' | 'in_fine'
  periodeDifferee?: number // Mois de différé
  echeances: EcheanceEmprunt[]
  totalInterets: number
  totalRembourse: number
}

// TABLEAU 5: Variation du BFR
export interface VariationBFR {
  annee: number

  // Actif circulant
  stocksMatieresPremieres: number
  stocksProduitsFinis: number
  creancesClients: number
  autresCreances: number
  totalActifCirculant: number

  // Passif circulant
  dettesFournisseurs: number
  dettesFiscalesSociales: number
  autresDettes: number
  totalPassifCirculant: number

  // BFR
  besoinFondsRoulement: number
  variationBFR: number // Par rapport à l'année précédente
}

// TABLEAU 6: Bilan Prévisionnel
export interface BilanPrevisionnel {
  annee: number

  // ACTIF
  actifImmobilise: {
    immobilisationsIncorporelles: number
    immobilisationsCorporelles: number
    immobilisationsFinancieres: number
    totalImmobilisations: number
  }

  actifCirculant: {
    stocks: number
    creances: number
    disponibilites: number
    totalActifCirculant: number
  }

  totalActif: number

  // PASSIF
  capitauxPropres: {
    capital: number
    reserves: number
    reportANouveau: number
    resultatExercice: number
    totalCapitauxPropres: number
  }

  dettes: {
    empruntsLongTerme: number
    empruntsCourtTerme: number
    dettesFournisseurs: number
    dettesFiscales: number
    autresDettes: number
    totalDettes: number
  }

  totalPassif: number

  equilibreBilanOK: boolean // totalActif === totalPassif
}

// TABLEAU 7: Seuil de Rentabilité
export interface SeuilRentabilite {
  annee: number
  chiffreAffaires: number
  chargesVariables: number
  margeContribution: number
  tauxMargeContribution: number // En %
  chargesFixes: number
  seuilRentabilite: number // En FCFA
  seuilRentabiliteJours: number // En jours
  margeSecurite: number // CA - SR
  indiceSecurite: number // (CA - SR) / CA en %
}

// TABLEAU 8: Ratios de Structure Financière
export interface RatiosStructure {
  annee: number

  // Structure financière
  autonomieFinanciere: number // Capitaux propres / Total bilan
  capaciteRemboursement: number // Dettes financières / CAF
  tauxEndettement: number // Dettes / Capitaux propres

  // Liquidité
  liquiditeGenerale: number // Actif circulant / Passif circulant
  liquiditeReduite: number // (Créances + Dispo) / Passif circulant
  liquiditeImmediate: number // Dispo / Passif circulant

  // Rotation
  rotationStocks: number // Jours
  rotationCreances: number // Jours
  rotationFournisseurs: number // Jours
  cycleCaisse: number // Rotation stocks + créances - fournisseurs

  // Rentabilité
  margeCommerciale: number // %
  tauxMarqueCommerciale: number // %
  rentabiliteEconomique: number // Résultat exploitation / Actif total
  rentabiliteFinanciere: number // Résultat net / Capitaux propres
  rentabiliteNette: number // Résultat net / CA
}

// TABLEAU 9: Compte de Gestion Prévisionnel
export interface CompteGestion {
  annee: number
  mois: number // 1-12

  recettes: {
    ventesComptant: number
    ventesCredit: number
    autresRecettes: number
    total: number
  }

  depenses: {
    achats: number
    loyers: number
    salaires: number
    electricite: number
    eau: number
    telephone: number
    transport: number
    entretien: number
    fournitures: number
    impotsTaxes: number
    assurances: number
    publicite: number
    autresDepenses: number
    total: number
  }

  resultatMensuel: number
  resultatCumule: number
}

// TABLEAU 10: Analyse de Sensibilité
export interface AnalyseSensibilite {
  scenario: 'pessimiste' | 'realiste' | 'optimiste'
  hypotheses: {
    variationCA: number // En %
    variationChargesVariables: number // En %
    variationChargesFixes: number // En %
  }

  resultats: {
    chiffreAffaires: number
    chargesVariables: number
    chargesFixes: number
    resultatNet: number
    van: number
    tri: number
    drci: number
  }

  impact: 'tres_favorable' | 'favorable' | 'defavorable' | 'tres_defavorable'
}

// TABLEAU COMPLET
export interface TableauxFinanciers {
  id?: string
  projectId: string
  userId: string

  // Tableaux
  investissementFinancement: TableauInvestissementFinancement
  planTresorerie: FluxTresorerie[]
  comptesResultatPrevisionnels: CompteResultatPrevisionnel[]
  plansAmortissementEmprunts: PlanAmortissementEmprunt[]
  variationsBFR: VariationBFR[]
  bilansPrevisionnels: BilanPrevisionnel[]
  seuilsRentabilite: SeuilRentabilite[]
  ratiosStructure: RatiosStructure[]
  comptesGestion: CompteGestion[]
  analyseSensibilite: AnalyseSensibilite[]

  // Données exportées depuis Projections Financières
  exportProjections?: Record<string, unknown>

  // Métadonnées
  dateCreation?: Date
  dateModification?: Date
  version?: number
}

// Helper pour créer des tableaux vides
export function createEmptyTableauxFinanciers(projectId: string, userId: string): TableauxFinanciers {
  return {
    projectId,
    userId,
    investissementFinancement: {
      investissements: [],
      sourcesFinancement: [],
      totalInvestissements: 0,
      totalFinancement: 0,
      ecart: 0
    },
    planTresorerie: [],
    comptesResultatPrevisionnels: [],
    plansAmortissementEmprunts: [],
    variationsBFR: [],
    bilansPrevisionnels: [],
    seuilsRentabilite: [],
    ratiosStructure: [],
    comptesGestion: [],
    analyseSensibilite: [],
    version: 1
  }
}

// Validation
export function validateTableauxFinanciers(tableaux: TableauxFinanciers): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifier équilibre investissement/financement
  if (Math.abs(tableaux.investissementFinancement.ecart) > 1) {
    errors.push('Le total des investissements doit égaler le total du financement')
  }

  // Vérifier bilans équilibrés
  tableaux.bilansPrevisionnels.forEach((bilan, index) => {
    if (!bilan.equilibreBilanOK) {
      errors.push(`Le bilan de l'année ${bilan.annee} n'est pas équilibré`)
    }
  })

  // Vérifier cohérence des années
  const annees = tableaux.comptesResultatPrevisionnels.map(c => c.annee)
  if (annees.length !== new Set(annees).size) {
    errors.push('Certaines années sont dupliquées dans les comptes de résultat')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
