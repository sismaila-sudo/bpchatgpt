// Types pour l'Analyse Financière Historique (3 ans minimum - FONGIP)

// ==================== COMPTE DE RÉSULTAT ====================

export interface CompteResultat {
  annee: number

  // Revenus
  chiffreAffaires: number
  venteMarchandises?: number
  travauxServicesVendus?: number

  // Marges
  margeCommerciale: number
  margeBruteMatieres: number

  // Autres produits
  autresProduits?: number

  // Achats et charges
  achatsMatieresPremieres: number
  autresAchats: number
  variationStocks?: number
  transports: number
  servicesExterieurs: number
  impotsTaxes: number
  autresCharges?: number

  // Soldes intermédiaires de gestion
  valeurAjoutee: number
  chargesPersonnel: number
  excedentBrutExploitation: number

  // Amortissements et provisions
  reprisesProvisions?: number
  transfertsCharges?: number
  dotationsAmortissements: number

  // Résultats
  resultatExploitation: number
  fraisFinanciers: number
  resultatFinancier: number
  resultatActivitesOrdinaires: number
  resultatHorsActivitesOrdinaires?: number
  resultatHAO?: number
  impotsSurResultat: number
  resultatNet: number

  // Capacité d'autofinancement
  capaciteAutofinancement: number
}

// ==================== BILAN ACTIF ====================

export interface BilanActif {
  annee: number

  // Charges immobilisées
  chargesImmobilisees?: number
  primesRemboursement?: number

  // Immobilisations incorporelles
  immobilisationsIncorporelles: number
  fraisRechercheDevt?: number
  brevetsLicencesLogiciels?: number
  fondsCommercial?: number
  autresImmobilisationsIncorporelles?: number

  // Immobilisations corporelles
  immobilisationsCorporelles: number
  terrains?: number
  batiments?: number
  installationsAgencements?: number
  materiel?: number
  mobilierBureau?: number
  materielTransport?: number

  // Avances et acomptes
  avancesAcomptesImmobilisations?: number

  // Immobilisations financières
  immobilisationsFinancieres?: number
  titresParticipation?: number
  autresImmobilisationsFinancieres?: number

  // Total actif immobilisé
  totalActifImmobilise: number

  // Actif circulant
  stocks?: number
  marchandises?: number
  matieresPremieres?: number
  enCours?: number
  produitsFabriques?: number

  // Créances
  creancesEmploisAssimiles: number
  fournisseursAvancesVersees?: number
  clients: number
  autresCreances?: number

  totalActifCirculant: number

  // Trésorerie actif
  tresorerieActif: number
  banquesChequesPostauxCaisse: number

  // Total bilan
  totalBilan: number
}

// ==================== BILAN PASSIF ====================

export interface BilanPassif {
  annee: number

  // Capitaux propres
  capital: number
  actionnairesCapitalNonAppele?: number
  primesReserves: number
  primeApport?: number
  primeEmission?: number
  primeFusion?: number
  ecartReevaluation?: number
  reservesIndisponibles?: number
  reservesLibres?: number
  reportANouveau: number
  resultatNet: number

  // Autres fonds propres
  autresFondsPropres?: number
  subventionsInvestissement?: number
  provisionsReglementees?: number

  totalCapitauxPropres: number

  // Dettes financières
  emprunts: number
  provisionsFinancieres?: number
  dettesHAO?: number

  totalDettesFinancieres: number
  totalRessourcesStables: number

  // Passif circulant
  dettesCirculantesHAO?: number
  clientsAvancesRecues?: number
  fournisseursExploitation: number
  dettesFiscalesSociales: number
  autresDettes: number
  compteCourantAssocies?: number

  totalPassifCirculant: number

  // Trésorerie passif
  tresoreriePassif: number
  banquesDecouvert: number

  // Total bilan
  totalBilan: number
}

// ==================== ANALYSE FDR/BFR/TRÉSORERIE ====================

export interface AnalyseFondsRoulement {
  annee: number
  fondsRoulement: number
  besoinFondsRoulement: number
  tresorerieNette: number
}

// ==================== RATIOS DE DÉCISION ====================

export interface RatiosDecision {
  annee: number

  // Autonomie financière (>= 20%)
  autonomieFinanciere: number // Capitaux propres / Total passif

  // Capacité de remboursement (<= 4 ans)
  capaciteRemboursement: number // Dettes financières / CAFG

  // Rentabilité globale (> 0)
  rentabiliteGlobale: number // Résultat net / CA

  // Liquidité générale (> 1)
  liquiditeGenerale: number // Actif CT / Passif CT

  // Solvabilité (> 20%)
  solvabilite: number // Capitaux propres / Total bilan

  // Ratios complémentaires
  tauxEndettement?: number // Dettes financières / Capitaux propres
  rotationActif?: number // CA / Total actif
  margeNette?: number // Résultat net / CA
  margeExploitation?: number // Résultat exploitation / CA
  rentabiliteCapitauxPropres?: number // Résultat net / Capitaux propres (ROE)
  rentabiliteActifs?: number // Résultat net / Total actif (ROA)
}

// ==================== RELATIONS BANCAIRES ====================

export interface FluxCrediteur {
  annee: number
  totalRemisesCreditrices: number
  chiffreAffairesAnnee: number
  pourcentageRemisesDansCA: number
}

export interface EngagementBancaire {
  typeConcours: 'CMT' | 'Découvert' | 'Avance sur factures' | 'Crédit-bail' | 'Autre'
  montant: number
  dateMisePlace: string
  dureeValidite: string
  encoursActuel: number
  dateEcheance: string
  tauxInteret?: number
  garanties?: string
  statut: 'En cours' | 'Soldé' | 'En retard'
}

export interface RelationsBancaires {
  banquePrincipale: string
  autresBanques?: string[]
  fluxCrediteurs: FluxCrediteur[]
  engagements: EngagementBancaire[]
  historiquePaiements: 'Excellent' | 'Bon' | 'Moyen' | 'Problématique'
  incidentsImpayees?: number
  noteBancaire?: string
}

// ==================== ANALYSE FINANCIÈRE HISTORIQUE COMPLÈTE ====================

export interface AnalyseFinanciereHistorique {
  id?: string
  projectId: string
  userId: string

  // Période d'analyse (3 ans minimum)
  periodeDebut: number // Ex: 2022
  periodeFin: number // Ex: 2024

  // Données financières historiques
  comptesResultat: CompteResultat[] // 3 ans minimum
  bilansActif: BilanActif[] // 3 ans minimum
  bilansPassif: BilanPassif[] // 3 ans minimum

  // Analyses calculées
  analysesFondsRoulement: AnalyseFondsRoulement[]
  ratiosDecision: RatiosDecision[]

  // Relations bancaires
  relationsBancaires?: RelationsBancaires

  // Commentaires et analyses
  commentaireActiviteRentabilite?: string
  commentaireStructureFinanciere?: string
  commentaireEvolutionCA?: string
  commentaireEvolutionResultat?: string
  pointsForts?: string[]
  pointsVigilance?: string[]

  // Métadonnées
  createdAt?: Date
  updatedAt?: Date
  version?: number
}

// Interface pour le formulaire de saisie
export interface AnalyseFinanciereHistoriqueFormData extends Omit<AnalyseFinanciereHistorique, 'id' | 'createdAt' | 'updatedAt' | 'version'> {}

// ==================== HELPERS ====================

export interface SeuilsRatios {
  autonomieFinanciere: { seuil: number; comparaison: '>=' }
  capaciteRemboursement: { seuil: number; comparaison: '<=' }
  rentabiliteGlobale: { seuil: number; comparaison: '>' }
  liquiditeGenerale: { seuil: number; comparaison: '>' }
  solvabilite: { seuil: number; comparaison: '>=' }
}

export const SEUILS_RATIOS: SeuilsRatios = {
  autonomieFinanciere: { seuil: 20, comparaison: '>=' },
  capaciteRemboursement: { seuil: 4, comparaison: '<=' },
  rentabiliteGlobale: { seuil: 0, comparaison: '>' },
  liquiditeGenerale: { seuil: 1, comparaison: '>' },
  solvabilite: { seuil: 20, comparaison: '>=' }
}

export type EvaluationRatio = 'Excellent' | 'Bon' | 'Acceptable' | 'Problématique'

export function evaluerRatio(ratio: keyof SeuilsRatios, valeur: number): EvaluationRatio {
  const config = SEUILS_RATIOS[ratio]

  switch (ratio) {
    case 'autonomieFinanciere':
    case 'solvabilite':
      if (valeur >= 40) return 'Excellent'
      if (valeur >= 30) return 'Bon'
      if (valeur >= config.seuil) return 'Acceptable'
      return 'Problématique'

    case 'capaciteRemboursement':
      if (valeur <= 2) return 'Excellent'
      if (valeur <= 3) return 'Bon'
      if (valeur <= config.seuil) return 'Acceptable'
      return 'Problématique'

    case 'rentabiliteGlobale':
      if (valeur >= 15) return 'Excellent'
      if (valeur >= 10) return 'Bon'
      if (valeur > config.seuil) return 'Acceptable'
      return 'Problématique'

    case 'liquiditeGenerale':
      if (valeur >= 1.5) return 'Excellent'
      if (valeur >= 1.2) return 'Bon'
      if (valeur > config.seuil) return 'Acceptable'
      return 'Problématique'

    default:
      return 'Acceptable'
  }
}
