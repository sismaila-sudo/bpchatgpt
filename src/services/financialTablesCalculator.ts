/**
 * SERVICE DE CALCUL COMPLET DES TABLEAUX FINANCIERS
 * Génère tous les tableaux requis pour un business plan professionnel
 * Conformes aux standards FONGIP et bancaires du Sénégal
 */

import { FinancialInputs, FinancialProjections } from './financialEngine'
import {
  ExportTableauxFinanciers,
  CompteResultat,
  TableauCharges,
  ChargePersonnelDetail,
  PlanAmortissement,
  Immobilisation,
  LigneAmortissement,
  BilanPrevisionnel,
  BilanActif,
  BilanPassif,
  PlanTresorerie,
  FluxTresorerieMensuel,
  CalculsBFR,
  RatiosFinanciers
} from '@/types/financialTables'

// Constantes Sénégal
const TAUX_CHARGES_SOCIALES = 0.24  // 24%
const TAUX_IS = 0.30                  // 30%
const DELAI_CLIENTS_DEFAUT = 30       // 30 jours
const DELAI_FOURNISSEURS_DEFAUT = 60  // 60 jours
const DELAI_STOCKS_DEFAUT = 30        // 30 jours
const TAUX_ACTUALISATION = 0.12       // 12%

export class FinancialTablesCalculator {
  private inputs: FinancialInputs
  private projections: FinancialProjections

  constructor(inputs: FinancialInputs, projections: FinancialProjections) {
    this.inputs = inputs
    this.projections = projections
  }

  /**
   * MÉTHODE PRINCIPALE - Génère tous les tableaux financiers
   */
  generateCompleteFinancialTables(projectId: string, userId: string): ExportTableauxFinanciers {
    const years = this.projections.years
    const anneeDebut = years[0]
    const nombreAnnees = years.length

    return {
      projectId,
      userId,
      dateExport: new Date(),
      anneeDebut,
      nombreAnnees,
      years,

      // 1. Comptes de résultat
      comptesResultat: this.generateComptesResultat(),

      // 2. Tableaux des charges
      tableauxCharges: this.generateTableauxCharges(),

      // 3. Plan d'amortissement
      planAmortissement: this.generatePlanAmortissement(),

      // 4. Bilans prévisionnels
      bilans: this.generateBilans(),

      // 5. Plans de trésorerie
      planTresorerieAnnee1: this.generatePlanTresorerieAnnee1(),
      fluxTresorerieAnnuels: this.generateFluxTresorerieAnnuels(),

      // 6. Calculs BFR/FDR/TN
      calculsBFR: this.generateCalculsBFR(),

      // 7. Ratios financiers
      ratios: this.generateRatios(),

      // 8. Indicateurs globaux
      indicateurs: {
        irr: this.projections.irr,
        npv: this.projections.npv,
        paybackPeriod: this.projections.paybackPeriod,
        breakEvenPoint: this.projections.breakEvenPoint,
        cafMoyenne: this.calculateCAFMoyenne(),
        detteTotale: this.calculateDetteTotale(),
        capaciteAutofinancement: this.calculateCAF()
      }
    }
  }

  // ========== 1. COMPTE DE RÉSULTAT ==========

  private generateComptesResultat(): CompteResultat[] {
    return this.projections.years.map((annee, index) => {
      const chiffreAffaires = this.projections.revenues[index]
      const achatsConsommes = this.calculateAchatsConsommes(index)
      const margeCommerciale = chiffreAffaires - achatsConsommes

      // Charges détaillées
      const chargesExternes = this.calculateChargesExternes(index)
      const chargesPersonnel = this.calculateChargesPersonnelBrut(index)
      const chargesSociales = chargesPersonnel * TAUX_CHARGES_SOCIALES
      const impotsTaxes = this.calculateImpotsTaxesHorsIS(index)

      const totalChargesExploitation = achatsConsommes + chargesExternes +
                                       chargesPersonnel + chargesSociales + impotsTaxes

      // Valeur ajoutée et EBE
      const valeureAjoutee = chiffreAffaires - achatsConsommes - chargesExternes
      const excedentBrutExploitation = valeureAjoutee - chargesPersonnel -
                                       chargesSociales - impotsTaxes

      // Dotations aux amortissements
      const dotationsAmortissements = this.calculateDotationAmortissement(index)

      // Résultat d'exploitation
      const resultatExploitation = excedentBrutExploitation - dotationsAmortissements

      // Résultat financier
      const chargesFinancieres = this.calculateChargesFinancieres(index)
      const resultatFinancier = -chargesFinancieres

      // Résultat courant avant impôts
      const resultatCourantAvantImpots = resultatExploitation + resultatFinancier

      // Impôt sur les sociétés (seulement si résultat positif)
      const impotSocietes = Math.max(0, resultatCourantAvantImpots * TAUX_IS)

      // Résultat net
      const resultatNet = resultatCourantAvantImpots - impotSocietes

      return {
        annee,
        chiffreAffaires,
        autresProduits: 0,
        totalProduits: chiffreAffaires,

        achatsConsommes,
        margeCommerciale,

        chargesExternes,
        chargesPersonnel,
        chargesSociales,
        impotsTaxes,
        totalChargesExploitation,

        valeureAjoutee,
        excedentBrutExploitation,

        dotationsAmortissements,
        resultatExploitation,

        produitsFinanciers: 0,
        chargesFinancieres,
        resultatFinancier,

        resultatCourantAvantImpots,
        impotSocietes,
        resultatNet
      }
    })
  }

  // ========== 2. TABLEAU DES CHARGES ==========

  private generateTableauxCharges(): TableauCharges[] {
    return this.projections.years.map((annee, index) => {
      // Achats
      const achatsMatieresPremieres = this.calculateAchatsMatieresPremieres(index)
      const achatsMarchandises = this.calculateAchatsMarchandises(index)
      const achatsFournitures = this.calculateAchatsFournitures(index)

      // Charges externes détaillées
      const chargesExternesDetail = this.getChargesExternesDetail(index)

      // Charges de personnel détaillées
      const salaireBrut = this.getChargesPersonnelDetail(index)
      const totalSalaireBrut = salaireBrut.reduce((sum, s) => sum + s.salaireAnnuelBrut, 0)
      const chargesSociales = totalSalaireBrut * TAUX_CHARGES_SOCIALES
      const totalChargesPersonnel = totalSalaireBrut + chargesSociales

      // Impôts et taxes (hors IS)
      const taxesDetail = this.getImpotsTaxesDetail(index)

      return {
        annee,

        achatsMatieresPremieres,
        achatsMarchandises,
        achatsFournitures,

        ...chargesExternesDetail,
        totalChargesExternes: Object.values(chargesExternesDetail).reduce((a: number, b: number) => a + b, 0),

        salaireBrut,
        totalSalaireBrut,
        chargesSociales,
        autresChargesPersonnel: 0,
        totalChargesPersonnel,

        ...taxesDetail,
        totalImpotsTaxes: Object.values(taxesDetail).reduce((a: number, b: number) => a + b, 0),

        totalCharges: achatsMatieresPremieres + achatsMarchandises + achatsFournitures +
                      Object.values(chargesExternesDetail).reduce((a: number, b: number) => a + b, 0) +
                      totalChargesPersonnel +
                      Object.values(taxesDetail).reduce((a: number, b: number) => a + b, 0)
      }
    })
  }

  // ========== 3. PLAN D'AMORTISSEMENT ==========

  private generatePlanAmortissement(): PlanAmortissement {
    // Convertir les investissements en immobilisations
    const immobilisations: Immobilisation[] = this.inputs.initialInvestments.map(inv => ({
      id: inv.id,
      nature: inv.name,
      categorie: this.categoriePourInvestissement(inv.category),
      dateAcquisition: this.projections.years[0].toString(),
      valeurAcquisition: inv.amount,
      dureeAmortissement: inv.depreciationYears,
      tauxAmortissement: (100 / inv.depreciationYears),
      modeAmortissement: 'lineaire' as const,
      valeurResiduelle: inv.residualValue
    }))

    // Calculer les amortissements par année
    const amortissementsParAnnee = this.projections.years.map((annee, yearIndex) => {
      const lignes: LigneAmortissement[] = immobilisations.map(immo => {
        const anneeDepuisAcquisition = yearIndex
        const dotationAnnuelle = anneeDepuisAcquisition < immo.dureeAmortissement
          ? (immo.valeurAcquisition - immo.valeurResiduelle) / immo.dureeAmortissement
          : 0

        const cumulAmortissements = Math.min(
          dotationAnnuelle * (anneeDepuisAcquisition + 1),
          immo.valeurAcquisition - immo.valeurResiduelle
        )

        const valeurNetteComptable = immo.valeurAcquisition - cumulAmortissements

        return {
          immobilisationId: immo.id,
          nature: immo.nature,
          annee,
          valeurBrute: immo.valeurAcquisition,
          dotationAnnuelle,
          cumulAmortissements,
          valeurNetteComptable
        }
      })

      return {
        annee,
        lignes,
        totalDotations: lignes.reduce((sum, l) => sum + l.dotationAnnuelle, 0),
        totalVNC: lignes.reduce((sum, l) => sum + l.valeurNetteComptable, 0)
      }
    })

    return {
      immobilisations,
      amortissementsParAnnee
    }
  }

  // ========== 4. BILANS PRÉVISIONNELS ==========

  private generateBilans(): BilanPrevisionnel[] {
    return this.projections.years.map((annee, index) => {
      const actif = this.calculateBilanActif(annee, index)
      const passif = this.calculateBilanPassif(annee, index)

      return {
        actif,
        passif,
        equilibre: Math.abs(actif.totalActif - passif.totalPassif) < 1,
        ecart: actif.totalActif - passif.totalPassif
      }
    })
  }

  private calculateBilanActif(annee: number, index: number): BilanActif {
    // Immobilisations
    const immoBrut = this.inputs.initialInvestments.reduce((sum, inv) => sum + inv.amount, 0)
    const amortissements = this.calculateCumulAmortissements(index)

    const immobilisationsCorporelles = {
      brut: immoBrut,
      amortissements,
      net: immoBrut - amortissements
    }

    const totalActifImmobilise = immobilisationsCorporelles.net

    // Stocks (BFR)
    const ca = this.projections.revenues[index]
    const achats = this.calculateAchatsConsommes(index)
    const stocksValue = (achats / 365) * DELAI_STOCKS_DEFAUT

    const stocks = {
      matieresPremieres: stocksValue * 0.7,
      produitsEnCours: 0,
      produitsFinis: stocksValue * 0.3,
      marchandises: 0,
      total: stocksValue
    }

    // Créances clients
    const creancesClients = (ca / 365) * DELAI_CLIENTS_DEFAUT

    const creances = {
      clients: creancesClients,
      autresCreances: ca * 0.02,  // 2% du CA
      total: creancesClients + (ca * 0.02)
    }

    // Trésorerie
    const tresorerie = this.projections.cumulativeCashFlow[index]

    const disponibilites = {
      banque: Math.max(0, tresorerie),
      caisse: ca * 0.001,  // 0.1% du CA en caisse
      total: Math.max(0, tresorerie) + (ca * 0.001)
    }

    const totalActifCirculant = stocks.total + creances.total + disponibilites.total

    return {
      annee,
      immobilisationsIncorporelles: { brut: 0, amortissements: 0, net: 0 },
      immobilisationsCorporelles,
      immobilisationsFinancieres: { brut: 0, provisions: 0, net: 0 },
      totalActifImmobilise,
      stocks,
      creances,
      disponibilites,
      totalActifCirculant,
      totalActif: totalActifImmobilise + totalActifCirculant
    }
  }

  private calculateBilanPassif(annee: number, index: number): BilanPassif {
    // Capitaux propres
    const capital = this.inputs.ownFunds
    const reserves = index > 0 ? this.cumulResultatsAnterieurs(index - 1) : 0
    const resultatExercice = this.projections.netProfit[index]

    const totalCapitauxPropres = capital + reserves + resultatExercice

    // Dettes financières
    const dettesTotales = this.calculateDetteRestante(index)
    const empruntsLongMoyenTerme = dettesTotales * 0.7  // 70% long terme
    const empruntsCourtTerme = dettesTotales * 0.3      // 30% court terme

    const totalDettesFinancieres = dettesTotales

    // Dettes d'exploitation
    const achats = this.calculateAchatsConsommes(index)
    const dettesFournisseurs = (achats / 365) * DELAI_FOURNISSEURS_DEFAUT
    const dettesFiscalesSociales = this.projections.revenues[index] * 0.03  // 3% du CA

    const totalDettesExploitation = dettesFournisseurs + dettesFiscalesSociales

    const totalPassif = totalCapitauxPropres + totalDettesFinancieres + totalDettesExploitation

    return {
      annee,
      capital,
      reserves,
      reportANouveau: 0,
      resultatExercice,
      subventionsInvestissement: 0,
      totalCapitauxPropres,
      empruntsLongMoyenTerme,
      empruntsCourtTerme,
      decouvertsBancaires: 0,
      totalDettesFinancieres,
      dettesFournisseurs,
      dettesFiscalesSociales,
      autresDettes: 0,
      totalDettesExploitation,
      totalPassif
    }
  }

  // ========== 5. PLAN DE TRÉSORERIE ==========

  private generatePlanTresorerieAnnee1(): PlanTresorerie {
    const annee = this.projections.years[0]
    const caAnnuel = this.projections.revenues[0]
    const caMensuel = caAnnuel / 12

    const achatsAnnuels = this.calculateAchatsConsommes(0)
    const achatsMensuels = achatsAnnuels / 12

    const chargesPersonnelAnnuelles = this.calculateChargesPersonnelTotal(0)
    const chargesPersonnelMensuelles = chargesPersonnelAnnuelles / 12

    const chargesExternesAnnuelles = this.calculateChargesExternes(0)
    const chargesExternesMensuelles = chargesExternesAnnuelles / 12

    let tresorerieCourante = this.inputs.ownFunds

    const mois: FluxTresorerieMensuel[] = Array.from({ length: 12 }, (_, i) => {
      const moisNum = i + 1
      const libelle = new Date(annee, i).toLocaleDateString('fr-FR', { month: 'long' })

      // Encaissements
      const ventesComptant = caMensuel * 0.7  // 70% comptant
      const encaissementCreances = i > 0 ? caMensuel * 0.3 : 0  // 30% à crédit (30j)
      const apportCapital = i === 0 ? this.inputs.ownFunds : 0
      const empruntsRecus = i === 0 ? this.inputs.loans.reduce((sum, l) => sum + l.amount, 0) : 0

      const totalEncaissements = ventesComptant + encaissementCreances +
                                 apportCapital + empruntsRecus

      // Décaissements
      const achatsComptant = achatsMensuels * 0.5  // 50% comptant
      const reglementFournisseurs = i > 0 ? achatsMensuels * 0.5 : 0  // 50% à crédit (60j)
      const salairesCharges = chargesPersonnelMensuelles
      const chargesExternes = chargesExternesMensuelles
      const remboursementCapital = this.calculateRemboursementMensuel(moisNum)
      const interetsEmprunts = this.calculateInteretsMensuel(moisNum)
      const investissements = i === 0 ? this.inputs.initialInvestments.reduce((sum, inv) => sum + inv.amount, 0) : 0

      const totalDecaissements = achatsComptant + reglementFournisseurs +
                                 salairesCharges + chargesExternes +
                                 remboursementCapital + interetsEmprunts + investissements

      // Flux et trésorerie
      const fluxNet = totalEncaissements - totalDecaissements
      const tresorerieDebut = tresorerieCourante
      const tresorerieFin = tresorerieDebut + fluxNet

      tresorerieCourante = tresorerieFin

      // BFR mensuel
      const stocks = (achatsMensuels / 30) * DELAI_STOCKS_DEFAUT
      const clients = (caMensuel / 30) * DELAI_CLIENTS_DEFAUT
      const fournisseurs = (achatsMensuels / 30) * DELAI_FOURNISSEURS_DEFAUT
      const bfr = stocks + clients - fournisseurs
      const variationBFR = i === 0 ? bfr : 0  // Simplifié

      return {
        mois: moisNum,
        libelle,
        ventesComptant,
        encaissementCreances,
        apportCapital,
        empruntsRecus,
        subventionsRecues: 0,
        autresEncaissements: 0,
        totalEncaissements,
        achatsComptant,
        reglementFournisseurs,
        salairesCharges,
        chargesExternes,
        impotsTaxes: 0,
        remboursementEmprunts: remboursementCapital,
        interetsEmprunts,
        investissements,
        autresDecaissements: 0,
        totalDecaissements,
        fluxNet,
        tresorerieDebut,
        tresorerieFin,
        bfr,
        variationBFR
      }
    })

    // Calcul des métriques
    const totalEnc = mois.reduce((sum, m) => sum + m.totalEncaissements, 0)
    const totalDec = mois.reduce((sum, m) => sum + m.totalDecaissements, 0)
    const moisNegatifs = mois.filter(m => m.tresorerieFin < 0).length
    const tresorerieMin = Math.min(...mois.map(m => m.tresorerieFin))
    const tresorerieMoy = mois.reduce((sum, m) => sum + m.tresorerieFin, 0) / 12

    return {
      annee,
      mois,
      totalEncaissements: totalEnc,
      totalDecaissements: totalDec,
      fluxNetAnnuel: totalEnc - totalDec,
      tresorerieFinale: mois[11].tresorerieFin,
      moisNegatifs,
      decouvertMaximal: Math.abs(Math.min(0, tresorerieMin)),
      tresorerieMinimale: tresorerieMin,
      tresorerieMoyenne: tresorerieMoy
    }
  }

  private generateFluxTresorerieAnnuels() {
    return this.projections.years.map((annee, index) => ({
      annee,
      encaissements: this.projections.revenues[index],
      decaissements: this.projections.totalCosts[index] + this.calculateServiceDette(index),
      fluxNet: this.projections.netCashFlow[index]
    }))
  }

  // ========== 6. CALCULS BFR/FDR/TN ==========

  private generateCalculsBFR(): CalculsBFR[] {
    return this.projections.years.map((annee, index) => {
      const ca = this.projections.revenues[index]
      const achats = this.calculateAchatsConsommes(index)

      // BFR
      const stocks = (achats / 365) * DELAI_STOCKS_DEFAUT
      const creancesClients = (ca / 365) * DELAI_CLIENTS_DEFAUT
      const dettesFournisseurs = (achats / 365) * DELAI_FOURNISSEURS_DEFAUT
      const dettesFiscalesSociales = ca * 0.03

      const totalActifCirculant = stocks + creancesClients
      const totalPassifCirculant = dettesFournisseurs + dettesFiscalesSociales

      const bfr = totalActifCirculant - totalPassifCirculant
      const bfrJours = (bfr / ca) * 365

      // FDR
      const capitauxPropres = this.inputs.ownFunds + this.cumulResultatsAnterieurs(index)
      const dettesLT = this.calculateDetteRestante(index) * 0.7
      const capitauxPermanents = capitauxPropres + dettesLT

      const immoBrut = this.inputs.initialInvestments.reduce((sum, inv) => sum + inv.amount, 0)
      const amortissements = this.calculateCumulAmortissements(index)
      const actifImmobilise = immoBrut - amortissements

      const fdr = capitauxPermanents - actifImmobilise

      // TN
      const tresorerieNette = fdr - bfr

      return {
        annee,
        stocks,
        creancesClients,
        autresCreances: 0,
        totalActifCirculant,
        dettesFournisseurs,
        dettesFiscalesSociales,
        autresDettesCT: 0,
        totalPassifCirculant,
        bfr,
        bfrJours,
        capitauxPermanents,
        actifImmobilise,
        fdr,
        tresorerieNette,
        ratioFDR: fdr / actifImmobilise,
        ratioBFR: bfr / ca,
        ratioTN: tresorerieNette / ca
      }
    })
  }

  // ========== 7. RATIOS FINANCIERS ==========

  private generateRatios(): RatiosFinanciers[] {
    return this.projections.years.map((annee, index) => {
      const ca = this.projections.revenues[index]
      const achats = this.calculateAchatsConsommes(index)
      const resultat = this.projections.netProfit[index]

      // Via bilans
      const actif = this.projections.assets[index] || ca * 1.5
      const capitauxPropres = this.inputs.ownFunds + this.cumulResultatsAnterieurs(index)
      const dettes = this.calculateDetteRestante(index)

      const compte = this.generateComptesResultat()[index]

      return {
        annee,
        margeCommerciale: (compte.margeCommerciale / ca) * 100,
        valeurAjouteeRatio: (compte.valeureAjoutee / ca) * 100,
        tauxMargeEBE: (compte.excedentBrutExploitation / ca) * 100,
        rentabiliteEconomique: (resultat / actif) * 100,
        rentabiliteFinanciere: (resultat / capitauxPropres) * 100,

        ratioLiquiditeGenerale: 1.5,  // Simplifié
        ratioLiquiditeReduite: 1.2,
        ratioLiquiditeImmediate: 0.5,

        ratioAutonomieFinanciere: capitauxPropres / (capitauxPropres + dettes),
        ratioEndettement: dettes / capitauxPropres,
        capaciteRemboursement: dettes / (resultat + compte.dotationsAmortissements),

        rotationStocks: DELAI_STOCKS_DEFAUT,
        delaiClientsJours: DELAI_CLIENTS_DEFAUT,
        delaiFournisseursJours: DELAI_FOURNISSEURS_DEFAUT,
        rotationActif: ca / actif,

        tauxChargesPersonnel: (compte.chargesPersonnel + compte.chargesSociales) / compte.valeureAjoutee,
        tauxChargesFinancieres: (compte.chargesFinancieres / ca) * 100,

        dscr: this.projections.dscr[index]
      }
    })
  }

  // ========== MÉTHODES UTILITAIRES ==========

  private calculateAchatsConsommes(index: number): number {
    // Coûts variables = achats
    return this.inputs.variableCosts.reduce((sum, cost) => {
      const baseAmount = cost.frequency === 'monthly' ? cost.amount * 12 :
                        cost.frequency === 'quarterly' ? cost.amount * 4 :
                        cost.amount
      return sum + (baseAmount * Math.pow(1 + cost.growthRate, index))
    }, 0)
  }

  private calculateChargesExternes(index: number): number {
    return this.inputs.fixedCosts
      .filter(c => ['loyer', 'energie', 'marketing', 'administratif'].includes(c.category))
      .reduce((sum, cost) => {
        const baseAmount = cost.frequency === 'monthly' ? cost.amount * 12 :
                          cost.frequency === 'quarterly' ? cost.amount * 4 :
                          cost.amount
        return sum + (baseAmount * Math.pow(1 + cost.growthRate, index))
      }, 0)
  }

  private calculateChargesPersonnelBrut(index: number): number {
    return this.inputs.fixedCosts
      .filter(c => c.category === 'personnel')
      .reduce((sum, cost) => {
        const baseAmount = cost.frequency === 'monthly' ? cost.amount * 12 :
                          cost.frequency === 'quarterly' ? cost.amount * 4 :
                          cost.amount
        return sum + (baseAmount * Math.pow(1 + cost.growthRate, index))
      }, 0)
  }

  private calculateChargesPersonnelTotal(index: number): number {
    const brut = this.calculateChargesPersonnelBrut(index)
    return brut * (1 + TAUX_CHARGES_SOCIALES)
  }

  private calculateImpotsTaxesHorsIS(index: number): number {
    const ca = this.projections.revenues[index]
    return ca * 0.005  // 0.5% du CA (simplifié: patente, taxes diverses)
  }

  private calculateChargesFinancieres(index: number): number {
    return this.inputs.loans.reduce((sum, loan) => {
      const capitalRestant = this.calculateCapitalRestant(loan, index)
      return sum + (capitalRestant * loan.interestRate)
    }, 0)
  }

  private calculateDotationAmortissement(index: number): number {
    return this.inputs.initialInvestments.reduce((sum, inv) => {
      if (index < inv.depreciationYears) {
        return sum + ((inv.amount - inv.residualValue) / inv.depreciationYears)
      }
      return sum
    }, 0)
  }

  private calculateCumulAmortissements(index: number): number {
    return this.inputs.initialInvestments.reduce((sum, inv) => {
      const anneesEcoulees = Math.min(index + 1, inv.depreciationYears)
      return sum + ((inv.amount - inv.residualValue) / inv.depreciationYears) * anneesEcoulees
    }, 0)
  }

  private calculateCapitalRestant(loan: any, yearIndex: number): number {
    const monthlyRate = loan.interestRate / 12
    const totalMonths = loan.termYears * 12
    const monthsPassed = yearIndex * 12

    if (monthsPassed >= totalMonths) return 0

    const monthlyPayment = loan.amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
                          (Math.pow(1 + monthlyRate, totalMonths) - 1)

    let balance = loan.amount
    for (let m = 0; m < monthsPassed; m++) {
      const interest = balance * monthlyRate
      const principal = monthlyPayment - interest
      balance -= principal
    }

    return balance
  }

  private calculateDetteRestante(index: number): number {
    return this.inputs.loans.reduce((sum, loan) => sum + this.calculateCapitalRestant(loan, index), 0)
  }

  private cumulResultatsAnterieurs(index: number): number {
    let cumul = 0
    for (let i = 0; i <= index; i++) {
      cumul += this.projections.netProfit[i]
    }
    return cumul
  }

  private calculateServiceDette(index: number): number {
    const interets = this.calculateChargesFinancieres(index)
    const remboursements = this.inputs.loans.reduce((sum, loan) => {
      const capitalRestantDebut = this.calculateCapitalRestant(loan, index)
      const capitalRestantFin = this.calculateCapitalRestant(loan, index + 1)
      return sum + (capitalRestantDebut - capitalRestantFin)
    }, 0)
    return interets + remboursements
  }

  private calculateCAF(): number[] {
    return this.projections.years.map((_, index) => {
      const resultat = this.projections.netProfit[index]
      const dotations = this.calculateDotationAmortissement(index)
      return resultat + dotations
    })
  }

  private calculateCAFMoyenne(): number {
    const caf = this.calculateCAF()
    return caf.reduce((a, b) => a + b, 0) / caf.length
  }

  private calculateDetteTotale(): number {
    return this.inputs.loans.reduce((sum, loan) => sum + loan.amount, 0)
  }

  private calculateRemboursementMensuel(moisNum: number): number {
    // Simplifié: remboursement linéaire
    const total = this.inputs.loans.reduce((sum, loan) => {
      const monthlyPayment = loan.amount / (loan.termYears * 12)
      return sum + monthlyPayment
    }, 0)
    return total
  }

  private calculateInteretsMensuel(moisNum: number): number {
    const yearIndex = Math.floor((moisNum - 1) / 12)
    return this.calculateChargesFinancieres(yearIndex) / 12
  }

  private categoriePourInvestissement(cat: string): 'incorporelle' | 'corporelle' | 'financiere' {
    if (cat === 'software') return 'incorporelle'
    if (cat === 'other') return 'financiere'
    return 'corporelle'
  }

  private calculateAchatsMatieresPremieres(index: number): number {
    return this.calculateAchatsConsommes(index) * 0.7
  }

  private calculateAchatsMarchandises(index: number): number {
    return this.calculateAchatsConsommes(index) * 0.3
  }

  private calculateAchatsFournitures(index: number): number {
    return this.projections.revenues[index] * 0.02
  }

  private getChargesExternesDetail(index: number) {
    const total = this.calculateChargesExternes(index)
    return {
      loyerCharges: total * 0.30,
      electriciteEauGaz: total * 0.15,
      telecommunications: total * 0.05,
      assurances: total * 0.10,
      entretienMaintenance: total * 0.10,
      documentationFournitures: total * 0.05,
      transportDeplacements: total * 0.10,
      publiciteMarketing: total * 0.10,
      honorairesConseil: total * 0.03,
      autresChargesExternes: total * 0.02
    }
  }

  private getChargesPersonnelDetail(index: number): ChargePersonnelDetail[] {
    const totalBrut = this.calculateChargesPersonnelBrut(index)
    // Simplifié: 1 ligne directeur, reste employés
    return [
      {
        poste: 'Direction',
        nombreEmployes: 1,
        salaireMensuelBrut: totalBrut * 0.4 / 12,
        salaireAnnuelBrut: totalBrut * 0.4,
        chargesSociales: totalBrut * 0.4 * TAUX_CHARGES_SOCIALES,
        coutTotal: totalBrut * 0.4 * (1 + TAUX_CHARGES_SOCIALES)
      },
      {
        poste: 'Employés',
        nombreEmployes: 3,
        salaireMensuelBrut: (totalBrut * 0.6 / 3) / 12,
        salaireAnnuelBrut: totalBrut * 0.6,
        chargesSociales: totalBrut * 0.6 * TAUX_CHARGES_SOCIALES,
        coutTotal: totalBrut * 0.6 * (1 + TAUX_CHARGES_SOCIALES)
      }
    ]
  }

  private getImpotsTaxesDetail(index: number) {
    const total = this.calculateImpotsTaxesHorsIS(index)
    return {
      patenteContributionEconomique: total * 0.60,
      taxeFonciereEtablissement: total * 0.30,
      autresImpotsTaxes: total * 0.10
    }
  }
}
