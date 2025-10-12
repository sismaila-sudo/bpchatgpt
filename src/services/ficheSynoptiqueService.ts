import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FicheSynoptique, FicheSynoptiqueFormData } from '@/types/ficheSynoptique'

const COLLECTION_NAME = 'fichesSynoptiques'

export class FicheSynoptiqueService {
  /**
   * Récupère la fiche synoptique d'un projet
   */
  static async getFicheSynoptique(projectId: string): Promise<FicheSynoptique | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as FicheSynoptique
      }

      return null
    } catch (error) {
      console.error('Erreur lors de la récupération de la fiche synoptique:', error)
      throw error
    }
  }

  /**
   * Crée ou met à jour la fiche synoptique d'un projet
   */
  static async saveFicheSynoptique(
    projectId: string,
    data: FicheSynoptiqueFormData
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const existingDoc = await getDoc(docRef)

      if (existingDoc.exists()) {
        // Mise à jour
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
          version: (existingDoc.data().version || 0) + 1
        })
      } else {
        // Création
        await setDoc(docRef, {
          ...data,
          projectId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          version: 1
        })
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la fiche synoptique:', error)
      throw error
    }
  }

  /**
   * Génère une fiche synoptique automatique à partir des données du projet
   */
  static async generateFromProject(projectId: string, userId: string): Promise<FicheSynoptiqueFormData> {
    try {
      // Récupérer les données du projet
      const projectDoc = await getDoc(doc(db, 'projects', projectId))

      if (!projectDoc.exists()) {
        throw new Error('Projet non trouvé')
      }

      const projectData = projectDoc.data()

      // Générer la fiche synoptique avec les données disponibles
      const ficheSynoptique: FicheSynoptiqueFormData = {
        projectId,
        userId,

        presentationEntreprise: {
          raisonSociale: projectData.basicInfo?.name || '',
          dateCreation: projectData.basicInfo?.timeline?.startDate ? new Date(projectData.basicInfo.timeline.startDate.seconds * 1000).toISOString().split('T')[0] : '',
          formeJuridique: '', // ✅ PAS de valeur par défaut
          registreCommerce: '',
          identificationFiscale: '',
          adresse: projectData.basicInfo?.location ? `${projectData.basicInfo.location.address}, ${projectData.basicInfo.location.city}, ${projectData.basicInfo.location.region}` : '',
          telephone: '',
          email: '',
          presidentFondateur: '',
          capitalSocial: 0,
          repartitionCapital: '', // ✅ PAS de valeur par défaut
          secteurActivite: projectData.basicInfo?.sector || '',
          activites: projectData.basicInfo?.description || ''
        },

        presentationProjet: {
          objetFinancement: projectData.basicInfo?.description || '',
          besoinTotalFinancement: (() => {
            // Calculer le besoin total à partir des investissements initiaux
            const financialEngine = projectData.sections?.financialEngine
            if (financialEngine?.initialInvestments) {
              return financialEngine.initialInvestments.reduce((total: number, inv: any) => total + (inv.amount || 0), 0)
            }
            return 0
          })(),
          apportPromoteur: projectData.sections?.financialEngine?.ownFunds || 0,
          montantSollicite: (() => {
            const financialEngine = projectData.sections?.financialEngine
            if (financialEngine?.loans) {
              return financialEngine.loans.reduce((total: number, loan: any) => total + (loan.amount || 0), 0)
            }
            return 0
          })(),
          detailsBesoins: {
            construction: 0,
            equipements: 0,
            fraisDossier: 0,
            creditSpot: 0,
            decouvert: 0,
            bfr: 0,
            autres: 0
          },
          apportPromoteur: projectData.financialData?.personalContribution || 0,
          montantSollicite: (projectData.financialData?.totalBudget || 0) - (projectData.financialData?.personalContribution || 0)
        },

        conditionsFinancement: {
          typesCredit: (() => {
            const financialEngine = projectData.sections?.financialEngine
            if (financialEngine?.loans && financialEngine.loans.length > 0) {
              return financialEngine.loans.map((loan: any) => ({
                type: loan.source || 'CMT',
                montant: loan.amount || 0,
                dureeRemboursement: `${loan.termYears * 12} mois`,
                taux: (loan.interestRate * 100) || 9,
                echeanceValidite: 'Trimestrielle'
              }))
            }
            return [{
              type: 'CMT',
              montant: 0,
              dureeRemboursement: '60 mois',
              taux: 9,
              echeanceValidite: 'Trimestrielle'
            }]
          })()
        },

        garanties: {
          garantiesProposees: []
        },

        donneesPrevisionnelles: {
          annees: [2025, 2026, 2027],
          margeCommerciale: [0, 0, 0],
          chiffreAffaires: [0, 0, 0],
          valeurAjoutee: [0, 0, 0],
          excedentBrutExploitation: [0, 0, 0],
          resultatExploitation: [0, 0, 0],
          resultatFinancier: [0, 0, 0],
          resultatActivitesOrdinaires: [0, 0, 0],
          resultatHorsActivitesOrdinaires: [0, 0, 0],
          impotsSurResultat: [0, 0, 0],
          resultatNet: [0, 0, 0],
          cashFlows: [0, 0, 0],
          cashFlowsCumules: [0, 0, 0],
          rentabiliteGlobale: [0, 0, 0]
        }
      }

      return ficheSynoptique
    } catch (error) {
      console.error('Erreur lors de la génération de la fiche synoptique:', error)
      throw error
    }
  }

  /**
   * Calcule automatiquement les données prévisionnelles à partir des projections financières
   */
  static calculateDonneesPrevisionnelles(
    projections: any[]
  ): FicheSynoptique['donneesPrevisionnelles'] {
    const annees = projections.map(p => p.year)
    const chiffreAffaires = projections.map(p => p.revenue || 0)
    const achats = projections.map(p => p.costs || 0)
    const charges = projections.map(p => (p.operatingExpenses || 0) + (p.salaries || 0))

    const margeCommerciale = chiffreAffaires.map((ca, i) => ca - achats[i])
    const valeurAjoutee = margeCommerciale.map((mc, i) => mc - charges[i])
    const excedentBrutExploitation = valeurAjoutee.map(va => va * 0.85) // Estimation
    const resultatExploitation = excedentBrutExploitation.map(ebe => ebe * 0.90) // Estimation
    const resultatFinancier = projections.map(p => -(p.financialExpenses || 0))
    const resultatActivitesOrdinaires = resultatExploitation.map((re, i) => re + resultatFinancier[i])
    const impotsSurResultat = resultatActivitesOrdinaires.map(rao => -rao * 0.30) // Taux d'imposition 30%
    const resultatNet = resultatActivitesOrdinaires.map((rao, i) => rao + impotsSurResultat[i])
    const cashFlows = resultatNet.map((rn, i) => rn + (projections[i].depreciation || 0))

    let cumul = 0
    const cashFlowsCumules = cashFlows.map(cf => {
      cumul += cf
      return cumul
    })

    const rentabiliteGlobale = resultatNet.map((rn, i) =>
      chiffreAffaires[i] > 0 ? (rn / chiffreAffaires[i]) * 100 : 0
    )

    return {
      annees,
      margeCommerciale,
      chiffreAffaires,
      valeurAjoutee,
      excedentBrutExploitation,
      resultatExploitation,
      resultatFinancier,
      resultatActivitesOrdinaires,
      resultatHorsActivitesOrdinaires: new Array(annees.length).fill(0),
      impotsSurResultat,
      resultatNet,
      cashFlows,
      cashFlowsCumules,
      rentabiliteGlobale
    }
  }
}
