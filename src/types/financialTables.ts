/**
 * STRUCTURES COMPLÈTES POUR TABLEAUX FINANCIERS PROFESSIONNELS
 * Conformes aux standards FONGIP et bancaires du Sénégal
 */

// ========== 1. COMPTE DE RÉSULTAT PRÉVISIONNEL ==========

export interface CompteResultat {
  annee: number

  // Produits d'exploitation
  chiffreAffaires: number
  autresProduits: number
  totalProduits: number

  // Charges d'exploitation
  achatsConsommes: number           // Matières premières, marchandises
  margeCommerciale: number          // CA - Achats (pour commerce)

  chargesExternes: number           // Loyer, énergie, télécom, marketing...
  chargesPersonnel: number          // Salaires bruts
  chargesSociales: number           // Cotisations (24% au Sénégal)
  impotsTaxes: number              // Hors IS (patente, CFE, taxes...)

  totalChargesExploitation: number

  // Résultats intermédiaires
  valeureAjoutee: number           // Production - Consommations externes
  excedentBrutExploitation: number // EBE = VA - Charges personnel - Impôts/taxes

  dotationsAmortissements: number  // Amortissements des immobilisations

  resultatExploitation: number     // EBE - Dotations

  // Résultat financier
  produitsFinanciers: number
  chargesFinancieres: number       // Intérêts d'emprunts
  resultatFinancier: number

  // Résultat courant
  resultatCourantAvantImpots: number

  // Impôt sur les sociétés
  impotSocietes: number            // 30% au Sénégal

  // Résultat net
  resultatNet: number
}

// ========== 2. TABLEAU DES CHARGES DÉTAILLÉ ==========

export interface ChargeDetaille {
  categorie: string
  sousCategorie: string
  description: string
  montantAnnuel: number
  type: 'fixe' | 'variable'
  frequence: 'mensuel' | 'trimestriel' | 'annuel'
}

export interface TableauCharges {
  annee: number

  // Achats et charges externes
  achatsMatieresPremieres: number
  achatsMarchandises: number
  achatsFournitures: number

  // Charges externes
  loyerCharges: number
  electriciteEauGaz: number
  telecommunications: number
  assurances: number
  entretienMaintenance: number
  documentationFournitures: number
  transportDeplacements: number
  publiciteMarketing: number
  honorairesConseil: number
  autresChargesExternes: number
  totalChargesExternes: number

  // Charges de personnel
  salaireBrut: ChargePersonnelDetail[]
  totalSalaireBrut: number
  chargesSociales: number        // 24% du brut au Sénégal
  autresChargesPersonnel: number // Formation, médecine travail...
  totalChargesPersonnel: number

  // Impôts et taxes (hors IS)
  patenteContributionEconomique: number
  taxeFonciereEtablissement: number
  autresImpotsTaxes: number
  totalImpotsTaxes: number

  // Total général
  totalCharges: number
}

export interface ChargePersonnelDetail {
  poste: string
  nombreEmployes: number
  salaireMensuelBrut: number
  salaireAnnuelBrut: number
  chargesSociales: number
  coutTotal: number
}

// ========== 3. PLAN D'AMORTISSEMENT ==========

export interface Immobilisation {
  id: string
  nature: string
  categorie: 'incorporelle' | 'corporelle' | 'financiere'
  dateAcquisition: string
  valeurAcquisition: number
  dureeAmortissement: number    // en années
  tauxAmortissement: number     // %
  modeAmortissement: 'lineaire' | 'degressif'
  valeurResiduelle: number
}

export interface LigneAmortissement {
  immobilisationId: string
  nature: string
  annee: number
  valeurBrute: number
  dotationAnnuelle: number
  cumulAmortissements: number
  valeurNetteComptable: number
}

export interface PlanAmortissement {
  immobilisations: Immobilisation[]
  amortissementsParAnnee: {
    annee: number
    lignes: LigneAmortissement[]
    totalDotations: number
    totalVNC: number
  }[]
}

// ========== 4. BILAN PRÉVISIONNEL ==========

export interface BilanActif {
  annee: number

  // Actif immobilisé
  immobilisationsIncorporelles: {
    brut: number
    amortissements: number
    net: number
  }
  immobilisationsCorporelles: {
    brut: number
    amortissements: number
    net: number
  }
  immobilisationsFinancieres: {
    brut: number
    provisions: number
    net: number
  }
  totalActifImmobilise: number

  // Actif circulant
  stocks: {
    matieresPremieres: number
    produitsEnCours: number
    produitsFinis: number
    marchandises: number
    total: number
  }
  creances: {
    clients: number
    autresCreances: number
    total: number
  }
  disponibilites: {
    banque: number
    caisse: number
    total: number
  }
  totalActifCirculant: number

  // Total actif
  totalActif: number
}

export interface BilanPassif {
  annee: number

  // Capitaux propres
  capital: number
  reserves: number
  reportANouveau: number
  resultatExercice: number
  subventionsInvestissement: number
  totalCapitauxPropres: number

  // Dettes financières
  empruntsLongMoyenTerme: number     // > 1 an
  empruntsCourtTerme: number         // < 1 an
  decouvertsBancaires: number
  totalDettesFinancieres: number

  // Dettes d'exploitation
  dettesFournisseurs: number
  dettesFiscalesSociales: number
  autresDettes: number
  totalDettesExploitation: number

  // Total passif
  totalPassif: number
}

export interface BilanPrevisionnel {
  actif: BilanActif
  passif: BilanPassif

  // Vérifications
  equilibre: boolean  // Actif = Passif
  ecart: number
}

// ========== 5. PLAN DE TRÉSORERIE MENSUEL (Année 1) ==========

export interface FluxTresorerieMensuel {
  mois: number
  libelle: string

  // Encaissements
  ventesComptant: number
  encaissementCreances: number     // Ventes à crédit (N-1)
  apportCapital: number
  empruntsRecus: number
  subventionsRecues: number
  autresEncaissements: number
  totalEncaissements: number

  // Décaissements
  achatsComptant: number
  reglementFournisseurs: number    // Achats à crédit (N-1)
  salairesCharges: number
  chargesExternes: number
  impotsTaxes: number
  remboursementEmprunts: number    // Capital
  interetsEmprunts: number
  investissements: number
  autresDecaissements: number
  totalDecaissements: number

  // Trésorerie
  fluxNet: number
  tresorerieDebut: number
  tresorerieFin: number

  // BFR mensuel
  bfr: number
  variationBFR: number
}

export interface PlanTresorerie {
  annee: number
  mois: FluxTresorerieMensuel[]

  // Synthèse annuelle
  totalEncaissements: number
  totalDecaissements: number
  fluxNetAnnuel: number
  tresorerieFinale: number

  // Analyse
  moisNegatifs: number
  decouvertMaximal: number
  tresorerieMinimale: number
  tresorerieMoyenne: number
}

// ========== 6. CALCULS BFR / FDR / TN ==========

export interface CalculsBFR {
  annee: number

  // BFR - Besoin en Fonds de Roulement
  stocks: number
  creancesClients: number           // CA / 365 * délai clients
  autresCreances: number
  totalActifCirculant: number

  dettesFournisseurs: number        // Achats / 365 * délai fournisseurs
  dettesFiscalesSociales: number
  autresDettesCT: number
  totalPassifCirculant: number

  bfr: number                       // Actif circulant - Passif circulant
  bfrJours: number                  // BFR / (CA/365)

  // FDR - Fonds de Roulement
  capitauxPermanents: number        // Capitaux propres + Dettes LT
  actifImmobilise: number
  fdr: number                       // Capitaux permanents - Actif immobilisé

  // TN - Trésorerie Nette
  tresorerieNette: number           // FDR - BFR

  // Ratios
  ratioFDR: number                  // FDR / Actif immobilisé
  ratioBFR: number                  // BFR / CA
  ratioTN: number                   // TN / CA
}

// ========== 7. RATIOS ET INDICATEURS ==========

export interface RatiosFinanciers {
  annee: number

  // Rentabilité
  margeCommerciale: number          // %
  valeurAjouteeRatio: number        // % du CA
  tauxMargeEBE: number              // EBE / CA
  rentabiliteEconomique: number     // Résultat / Actif total (ROA)
  rentabiliteFinanciere: number     // Résultat / Capitaux propres (ROE)

  // Liquidité
  ratioLiquiditeGenerale: number    // Actif circulant / Dettes CT
  ratioLiquiditeReduite: number     // (Actif circ. - Stocks) / Dettes CT
  ratioLiquiditeImmediate: number   // Disponibilités / Dettes CT

  // Solvabilité
  ratioAutonomieFinanciere: number  // Capitaux propres / Total passif
  ratioEndettement: number          // Dettes / Capitaux propres
  capaciteRemboursement: number     // Dettes / CAF (années)

  // Activité
  rotationStocks: number            // Jours de stock
  delaiClientsJours: number         // Créances / (CA/365)
  delaiFournisseursJours: number    // Dettes fourn. / (Achats/365)
  rotationActif: number             // CA / Actif total

  // Charges
  tauxChargesPersonnel: number      // Charges personnel / VA
  tauxChargesFinancieres: number    // Charges fin. / CA

  // Couverture dette
  dscr: number                      // CAF / Service dette annuel
}

// ========== 8. EXPORT COMPLET ==========

export interface ExportTableauxFinanciers {
  projectId: string
  userId: string
  dateExport: Date

  // Période
  anneeDebut: number
  nombreAnnees: number
  years: number[]

  // 1. Compte de résultat (par année)
  comptesResultat: CompteResultat[]

  // 2. Tableau des charges (par année)
  tableauxCharges: TableauCharges[]

  // 3. Plan d'amortissement
  planAmortissement: PlanAmortissement

  // 4. Bilans prévisionnels (par année)
  bilans: BilanPrevisionnel[]

  // 5. Plan de trésorerie (mensuel année 1, annuel autres)
  planTresorerieAnnee1: PlanTresorerie
  fluxTresorerieAnnuels: {
    annee: number
    encaissements: number
    decaissements: number
    fluxNet: number
  }[]

  // 6. Calculs BFR/FDR/TN (par année)
  calculsBFR: CalculsBFR[]

  // 7. Ratios financiers (par année)
  ratios: RatiosFinanciers[]

  // 8. Indicateurs globaux
  indicateurs: {
    irr: number                     // Taux de rendement interne
    npv: number                     // Valeur actuelle nette
    paybackPeriod: number           // Délai récupération (années)
    breakEvenPoint: number          // Seuil rentabilité (mois)
    cafMoyenne: number              // CAF moyenne sur période
    detteTotale: number
    capaciteAutofinancement: number[]
  }
}
