import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  TableauxFinanciers,
  createEmptyTableauxFinanciers,
  FluxTresorerie,
  CompteResultatPrevisionnel,
  PlanAmortissementEmprunt,
  EcheanceEmprunt,
  VariationBFR,
  BilanPrevisionnel,
  SeuilRentabilite,
  RatiosStructure,
  InvestissementDetaille,
  SourceFinancement
} from '@/types/tableauxFinanciers'

const COLLECTION_NAME = 'tableauxFinanciers'

export class TableauxFinanciersService {
  /**
   * Récupère les tableaux financiers d'un projet
   */
  static async getTableauxFinanciers(projectId: string): Promise<TableauxFinanciers | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          dateCreation: data.dateCreation?.toDate(),
          dateModification: data.dateModification?.toDate()
        } as TableauxFinanciers
      }

      return null
    } catch (error) {
      console.error('Erreur lors de la récupération des tableaux financiers:', error)
      throw error
    }
  }

  /**
   * Sauvegarde les tableaux financiers
   */
  static async saveTableauxFinanciers(
    projectId: string,
    userId: string,
    data: Partial<TableauxFinanciers>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        // Mise à jour
        await updateDoc(docRef, {
          ...data,
          dateModification: serverTimestamp(),
          version: (docSnap.data().version || 0) + 1
        })
      } else {
        // Création
        const newData = createEmptyTableauxFinanciers(projectId, userId)
        await setDoc(docRef, {
          ...newData,
          ...data,
          dateCreation: serverTimestamp(),
          dateModification: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tableaux financiers:', error)
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // 🔽 AJOUT ICI : Exporter les projections vers la page "Tableaux Financiers"
  // ---------------------------------------------------------------------------
  static async exportFromProjections(projectId: string, userId: string, exportBundle: any) {
    try {
      const ref = doc(db, `users/${userId}/projects/${projectId}/sections/financialTablesExport`)
      await setDoc(ref, exportBundle, { merge: true })
      console.log('✅ Export envoyé vers Tableaux Financiers')
      return true
    } catch (error) {
      console.error('❌ Erreur export vers tableaux financiers:', error)
      throw error
    }
  }
  // ---------------------------------------------------------------------------

  /**
   * Calcule le plan d'amortissement d'un emprunt
   */
  static calculatePlanAmortissement(
    montant: number,
    tauxAnnuel: number,
    dureeMois: number,
    typeAmortissement: 'constant' | 'lineaire' | 'in_fine' = 'constant',
    periodeDifferee: number = 0
  ): PlanAmortissementEmprunt {
    const echeances: EcheanceEmprunt[] = []
    const tauxMensuel = tauxAnnuel / 12 / 100

    let capitalRestant = montant
    let totalInterets = 0

    if (typeAmortissement === 'constant') {
      // Mensualité constante
      const mensualite = montant * (tauxMensuel * Math.pow(1 + tauxMensuel, dureeMois)) /
                        (Math.pow(1 + tauxMensuel, dureeMois) - 1)

      for (let mois = 1; mois <= dureeMois; mois++) {
        const interet = capitalRestant * tauxMensuel
        const principal = mensualite - interet

        echeances.push({
          periode: mois,
          capitalRestantDu: capitalRestant,
          interet,
          principal,
          mensualite,
          capitalRestantDuApres: capitalRestant - principal
        })

        capitalRestant -= principal
        totalInterets += interet
      }
    } else if (typeAmortissement === 'lineaire') {
      // Amortissement linéaire
      const principalMensuel = montant / dureeMois

      for (let mois = 1; mois <= dureeMois; mois++) {
        const interet = capitalRestant * tauxMensuel
        const mensualite = principalMensuel + interet

        echeances.push({
          periode: mois,
          capitalRestantDu: capitalRestant,
          interet,
          principal: principalMensuel,
          mensualite,
          capitalRestantDuApres: capitalRestant - principalMensuel
        })

        capitalRestant -= principalMensuel
        totalInterets += interet
      }
    } else if (typeAmortissement === 'in_fine') {
      // In fine: intérêts uniquement, puis remboursement du capital à la fin
      for (let mois = 1; mois <= dureeMois; mois++) {
        const interet = montant * tauxMensuel
        const principal = mois === dureeMois ? montant : 0
        const mensualite = interet + principal

        echeances.push({
          periode: mois,
          capitalRestantDu: montant,
          interet,
          principal,
          mensualite,
          capitalRestantDuApres: mois === dureeMois ? 0 : montant
        })

        totalInterets += interet
      }
    }

    return {
      idEmprunt: `emprunt_${Date.now()}`,
      nomEmprunt: 'Emprunt',
      montantEmprunte: montant,
      tauxInteret: tauxAnnuel,
      duree: dureeMois,
      dateDebut: new Date().toISOString().split('T')[0],
      typeAmortissement,
      periodeDifferee,
      echeances,
      totalInterets,
      totalRembourse: montant + totalInterets
    }
  }

  /**
   * Génère le plan de trésorerie mensuel pour l'année 1
   */
  static generatePlanTresorerieAnnee1(
    compteResultat: CompteResultatPrevisionnel,
    investissementInitial: number,
    apportCapital: number,
    creditBancaire: number,
    tauxTVA: number = 18
  ): FluxTresorerie[] {
    const fluxMensuels: FluxTresorerie[] = []
    let tresorerieCourante = 0

    // Répartition uniforme sur 12 mois
    const venteMensuelle = compteResultat.totalProduits / 12
    const achatsMensuels = compteResultat.achatsConsommes / 12
    const salairesMensuels = compteResultat.totalChargesPersonnel / 12
    const chargesExternesMensuelles = compteResultat.totalChargesExternes / 12
    const impotsMensuels = (compteResultat.impotSurSocietes + compteResultat.totalImpotsTaxes) / 12

    for (let mois = 1; mois <= 12; mois++) {
      const apport = mois === 1 ? apportCapital : 0
      const credit = mois === 1 ? creditBancaire : 0
      const investissement = mois === 1 ? investissementInitial : 0

      const flux: FluxTresorerie = {
        periode: `Mois ${mois}`,
        annee: 1,
        mois,
        ventesComptant: venteMensuelle * 0.7,
        recouvrementCreances: mois > 1 ? venteMensuelle * 0.3 : 0,
        apportCapital: apport,
        creditBancaire: credit,
        autresEncaissements: 0,
        totalEncaissements: 0,
        achatsMatieresPremieres: achatsMensuels,
        salairesChargesSociales: salairesMensuels,
        loyersCharges: chargesExternesMensuelles * 0.2,
        utilitesEnergie: chargesExternesMensuelles * 0.15,
        fraisMarketing: chargesExternesMensuelles * 0.1,
        remboursementCredit: 0,
        interetsCredit: 0,
        impotsTaxes: impotsMensuels,
        autresDecaissements: chargesExternesMensuelles * 0.55 + investissement,
        totalDecaissements: 0,
        fluxNet: 0,
        tresorerieDebut: tresorerieCourante,
        tresorerieFin: 0,
        decouvertNecessaire: 0,
        tresorerieExcedentaire: 0
      }

      flux.totalEncaissements =
        flux.ventesComptant + flux.recouvrementCreances +
        flux.apportCapital + flux.creditBancaire + flux.autresEncaissements

      flux.totalDecaissements =
        flux.achatsMatieresPremieres + flux.salairesChargesSociales +
        flux.loyersCharges + flux.utilitesEnergie + flux.fraisMarketing +
        flux.remboursementCredit + flux.interetsCredit + flux.impotsTaxes +
        flux.autresDecaissements

      flux.fluxNet = flux.totalEncaissements - flux.totalDecaissements
      flux.tresorerieFin = flux.tresorerieDebut + flux.fluxNet

      if (flux.tresorerieFin < 0) {
        flux.decouvertNecessaire = Math.abs(flux.tresorerieFin)
        flux.tresorerieExcedentaire = 0
      } else {
        flux.decouvertNecessaire = 0
        flux.tresorerieExcedentaire = flux.tresorerieFin
      }

      tresorerieCourante = flux.tresorerieFin
      fluxMensuels.push(flux)
    }

    return fluxMensuels
  }

  // ... le reste de tes méthodes (ratios, bilan, seuil, etc.) inchangées
}

// --- ADD-ONLY: PDF bundle helper ---
import type { FinancialTablesBundle } from '@/types/tableauxFinanciers'
import { buildFinancialTablesBundle, type BasicBuilderInput } from './financialTablesBundleBuilder'

export interface BundleSourceMinimal {
  years: number[];
  revenue: number[];
  variableCosts: number[];
  fixedCosts: number[];
  depreciation: number[];
  taxRate: number;
  cfo: number[];
  cfi: number[];
  cff: number[];
  debtSchedule?: { year: number; principal: number; interest: number; payment: number; balance: number }[];
}

export function getFinancialTablesBundleFromSource(src: BundleSourceMinimal): FinancialTablesBundle {
  const input: BasicBuilderInput = {
    years: Array.isArray(src.years) ? src.years : [],
    revenue: Array.isArray(src.revenue) ? src.revenue : [],
    variableCosts: Array.isArray(src.variableCosts) ? src.variableCosts : [],
    fixedCosts: Array.isArray(src.fixedCosts) ? src.fixedCosts : [],
    depreciation: Array.isArray(src.depreciation) ? src.depreciation : [],
    taxRate: Number.isFinite(src.taxRate) ? src.taxRate : 0,
    cfo: Array.isArray(src.cfo) ? src.cfo : [],
    cfi: Array.isArray(src.cfi) ? src.cfi : [],
    cff: Array.isArray(src.cff) ? src.cff : [],
    debtSchedule: src.debtSchedule,
  }

  return buildFinancialTablesBundle(input)
}
