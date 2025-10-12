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
  AnalyseFinanciereHistorique,
  AnalyseFinanciereHistoriqueFormData,
  CompteResultat,
  BilanActif,
  BilanPassif,
  AnalyseFondsRoulement,
  RatiosDecision
} from '@/types/analyseFinanciereHistorique'

const COLLECTION_NAME = 'analysesFinancieresHistoriques'

export class AnalyseFinanciereHistoriqueService {
  /**
   * Récupère l'analyse financière historique d'un projet
   */
  static async getAnalyse(projectId: string): Promise<AnalyseFinanciereHistorique | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, unknown>
        const createdAt = (data as any).createdAt
        const updatedAt = (data as any).updatedAt

        return {
          id: docSnap.id,
          ...data,
          // Convertir les timestamps uniquement si la méthode toDate existe
          createdAt: createdAt && typeof (createdAt as any).toDate === 'function' ? (createdAt as any).toDate() : createdAt,
          updatedAt: updatedAt && typeof (updatedAt as any).toDate === 'function' ? (updatedAt as any).toDate() : updatedAt
        } as AnalyseFinanciereHistorique
      }

      return null
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'analyse financière:', error)
      // Fail-soft: retourner null pour laisser le composant initialiser des données locales
      return null
    }
  }

  /**
   * Sauvegarde l'analyse financière historique
   */
  static async saveAnalyse(
    projectId: string,
    data: AnalyseFinanciereHistoriqueFormData
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const existingDoc = await getDoc(docRef)

      if (existingDoc.exists()) {
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
          version: (existingDoc.data().version || 0) + 1
        })
      } else {
        await setDoc(docRef, {
          ...data,
          projectId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          version: 1
        })
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'analyse financière:', error)
      throw error
    }
  }

  /**
   * Calcule le Fonds de Roulement, BFR et Trésorerie
   */
  static calculateFDR_BFR_Tresorerie(
    bilanActif: BilanActif,
    bilanPassif: BilanPassif
  ): AnalyseFondsRoulement {
    // Fonds de Roulement = Ressources stables - Actif immobilisé
    const fondsRoulement = bilanPassif.totalRessourcesStables - bilanActif.totalActifImmobilise

    // Besoin en Fonds de Roulement = Actif circulant - Passif circulant
    const besoinFondsRoulement = bilanActif.totalActifCirculant - bilanPassif.totalPassifCirculant

    // Trésorerie nette = FDR - BFR (ou Trésorerie actif - Trésorerie passif)
    const tresorerieNette = bilanActif.tresorerieActif - bilanPassif.tresoreriePassif

    return {
      annee: bilanActif.annee,
      fondsRoulement,
      besoinFondsRoulement,
      tresorerieNette
    }
  }

  /**
   * Calcule tous les ratios de décision pour une année
   */
  static calculateRatios(
    compteResultat: CompteResultat,
    bilanActif: BilanActif,
    bilanPassif: BilanPassif
  ): RatiosDecision {
    // Autonomie financière = Capitaux propres / Total passif * 100
    const autonomieFinanciere = bilanPassif.totalBilan > 0
      ? (bilanPassif.totalCapitauxPropres / bilanPassif.totalBilan) * 100
      : 0

    // Capacité de remboursement = Dettes financières / CAFG (en années)
    const capaciteRemboursement = compteResultat.capaciteAutofinancement > 0
      ? bilanPassif.totalDettesFinancieres / compteResultat.capaciteAutofinancement
      : 0

    // Rentabilité globale = Résultat net / Chiffre d'affaires * 100
    const rentabiliteGlobale = compteResultat.chiffreAffaires > 0
      ? (compteResultat.resultatNet / compteResultat.chiffreAffaires) * 100
      : 0

    // Liquidité générale = Actif Court Terme / Passif Court Terme
    const actifCourtTerme = bilanActif.totalActifCirculant + bilanActif.tresorerieActif
    const passifCourtTerme = bilanPassif.totalPassifCirculant + bilanPassif.tresoreriePassif
    const liquiditeGenerale = passifCourtTerme > 0
      ? actifCourtTerme / passifCourtTerme
      : 0

    // Solvabilité = Capitaux propres / Total bilan * 100
    const solvabilite = bilanActif.totalBilan > 0
      ? (bilanPassif.totalCapitauxPropres / bilanActif.totalBilan) * 100
      : 0

    // Ratios complémentaires
    const tauxEndettement = bilanPassif.totalCapitauxPropres > 0
      ? (bilanPassif.totalDettesFinancieres / bilanPassif.totalCapitauxPropres) * 100
      : 0

    const rotationActif = bilanActif.totalBilan > 0
      ? compteResultat.chiffreAffaires / bilanActif.totalBilan
      : 0

    const margeNette = compteResultat.chiffreAffaires > 0
      ? (compteResultat.resultatNet / compteResultat.chiffreAffaires) * 100
      : 0

    const margeExploitation = compteResultat.chiffreAffaires > 0
      ? (compteResultat.resultatExploitation / compteResultat.chiffreAffaires) * 100
      : 0

    const rentabiliteCapitauxPropres = bilanPassif.totalCapitauxPropres > 0
      ? (compteResultat.resultatNet / bilanPassif.totalCapitauxPropres) * 100
      : 0

    const rentabiliteActifs = bilanActif.totalBilan > 0
      ? (compteResultat.resultatNet / bilanActif.totalBilan) * 100
      : 0

    return {
      annee: compteResultat.annee,
      autonomieFinanciere,
      capaciteRemboursement,
      rentabiliteGlobale,
      liquiditeGenerale,
      solvabilite,
      tauxEndettement,
      rotationActif,
      margeNette,
      margeExploitation,
      rentabiliteCapitauxPropres,
      rentabiliteActifs
    }
  }

  /**
   * Recalcule automatiquement tous les indicateurs
   */
  static recalculateAll(
    data: AnalyseFinanciereHistoriqueFormData
  ): AnalyseFinanciereHistoriqueFormData {
    const analysesFondsRoulement: AnalyseFondsRoulement[] = []
    const ratiosDecision: RatiosDecision[] = []

    // Pour chaque année, calculer FDR/BFR/Trésorerie et Ratios
    for (let i = 0; i < data.comptesResultat.length; i++) {
      const compteResultat = data.comptesResultat[i]
      const bilanActif = data.bilansActif[i]
      const bilanPassif = data.bilansPassif[i]

      if (compteResultat && bilanActif && bilanPassif) {
        // Calcul FDR/BFR/Trésorerie
        const analyseFDR = this.calculateFDR_BFR_Tresorerie(bilanActif, bilanPassif)
        analysesFondsRoulement.push(analyseFDR)

        // Calcul Ratios
        const ratios = this.calculateRatios(compteResultat, bilanActif, bilanPassif)
        ratiosDecision.push(ratios)
      }
    }

    return {
      ...data,
      analysesFondsRoulement,
      ratiosDecision
    }
  }

  /**
   * Crée une structure vide pour une année
   */
  static createEmptyYear(annee: number): {
    compteResultat: CompteResultat
    bilanActif: BilanActif
    bilanPassif: BilanPassif
  } {
    const compteResultat: CompteResultat = {
      annee,
      chiffreAffaires: 0,
      margeCommerciale: 0,
      margeBruteMatieres: 0,
      achatsMatieresPremieres: 0,
      autresAchats: 0,
      transports: 0,
      servicesExterieurs: 0,
      impotsTaxes: 0,
      valeurAjoutee: 0,
      chargesPersonnel: 0,
      excedentBrutExploitation: 0,
      dotationsAmortissements: 0,
      resultatExploitation: 0,
      fraisFinanciers: 0,
      resultatFinancier: 0,
      resultatActivitesOrdinaires: 0,
      impotsSurResultat: 0,
      resultatNet: 0,
      capaciteAutofinancement: 0
    }

    const bilanActif: BilanActif = {
      annee,
      immobilisationsIncorporelles: 0,
      immobilisationsCorporelles: 0,
      totalActifImmobilise: 0,
      creancesEmploisAssimiles: 0,
      clients: 0,
      totalActifCirculant: 0,
      tresorerieActif: 0,
      banquesChequesPostauxCaisse: 0,
      totalBilan: 0
    }

    const bilanPassif: BilanPassif = {
      annee,
      capital: 0,
      primesReserves: 0,
      reportANouveau: 0,
      resultatNet: 0,
      totalCapitauxPropres: 0,
      emprunts: 0,
      totalDettesFinancieres: 0,
      totalRessourcesStables: 0,
      fournisseursExploitation: 0,
      dettesFiscalesSociales: 0,
      autresDettes: 0,
      totalPassifCirculant: 0,
      tresoreriePassif: 0,
      banquesDecouvert: 0,
      totalBilan: 0
    }

    return { compteResultat, bilanActif, bilanPassif }
  }

  /**
   * Initialise une analyse financière pour 3 ans
   */
  static initializeAnalyse(
    projectId: string,
    userId: string,
    anneeDebut: number = new Date().getFullYear() - 3
  ): AnalyseFinanciereHistoriqueFormData {
    const comptesResultat: CompteResultat[] = []
    const bilansActif: BilanActif[] = []
    const bilansPassif: BilanPassif[] = []

    // Créer 3 années de données vides
    for (let i = 0; i < 3; i++) {
      const annee = anneeDebut + i
      const { compteResultat, bilanActif, bilanPassif } = this.createEmptyYear(annee)
      comptesResultat.push(compteResultat)
      bilansActif.push(bilanActif)
      bilansPassif.push(bilanPassif)
    }

    return {
      projectId,
      userId,
      periodeDebut: anneeDebut,
      periodeFin: anneeDebut + 2,
      comptesResultat,
      bilansActif,
      bilansPassif,
      analysesFondsRoulement: [],
      ratiosDecision: []
    }
  }

  /**
   * ✅ RÈGLE STRICTE : Ne génère PAS de commentaires automatiques
   * Retourne des champs vides - l'utilisateur doit saisir ses propres analyses
   */
  static generateAnalysisComments(data: AnalyseFinanciereHistorique): {
    commentaireActiviteRentabilite: string
    commentaireStructureFinanciere: string
    commentaireEvolutionCA: string
    commentaireEvolutionResultat: string
    pointsForts: string[]
    pointsVigilance: string[]
  } {
    // ✅ RÈGLE STRICTE : Aucun commentaire généré automatiquement
    return {
      commentaireActiviteRentabilite: '', // ✅ VIDE - L'utilisateur doit saisir
      commentaireStructureFinanciere: '', // ✅ VIDE - L'utilisateur doit saisir
      commentaireEvolutionCA: '', // ✅ VIDE - L'utilisateur doit saisir
      commentaireEvolutionResultat: '', // ✅ VIDE - L'utilisateur doit saisir
      pointsForts: [], // ✅ VIDE - L'utilisateur doit saisir
      pointsVigilance: [] // ✅ VIDE - L'utilisateur doit saisir
    }
    // ✅ Code supprimé - Aucune génération automatique de commentaires
  }
}
