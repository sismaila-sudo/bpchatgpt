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
  RelationsBancaires,
  createEmptyRelationsBancaires,
  calculateTotalEncours,
  calculateRatioEndettement,
  evaluateRisqueBancaire
} from '@/types/relationsBancaires'

const COLLECTION_NAME = 'relationsBancaires'

export class RelationsBancairesService {
  /**
   * Récupère les relations bancaires d'un projet
   */
  static async getRelationsBancaires(projectId: string): Promise<RelationsBancaires | null> {
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
        } as RelationsBancaires
      }

      return null
    } catch (error) {
      console.error('Erreur lors de la récupération des relations bancaires:', error)
      throw error
    }
  }

  /**
   * Sauvegarde les relations bancaires
   */
  static async saveRelationsBancaires(
    projectId: string,
    userId: string,
    data: Partial<RelationsBancaires>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId)
      const docSnap = await getDoc(docRef)

      // Recalculer les totaux automatiquement
      if (data.encoursCredits) {
        data.totalEncoursCredits = calculateTotalEncours(data.encoursCredits)
      }

      if (docSnap.exists()) {
        // Mise à jour
        await updateDoc(docRef, {
          ...data,
          dateModification: serverTimestamp(),
          version: (docSnap.data().version || 0) + 1
        })
      } else {
        // Création
        const newData = createEmptyRelationsBancaires(projectId, userId)
        await setDoc(docRef, {
          ...newData,
          ...data,
          dateCreation: serverTimestamp(),
          dateModification: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des relations bancaires:', error)
      throw error
    }
  }

  /**
   * Calcule le ratio d'endettement
   */
  static calculateRatioEndettement(
    encoursTotal: number,
    capitauxPropres: number
  ): number {
    return calculateRatioEndettement(encoursTotal, capitauxPropres)
  }

  /**
   * Évalue le risque bancaire
   */
  static evaluateRisque(relations: RelationsBancaires): {
    niveau: 'faible' | 'moyen' | 'eleve' | 'tres_eleve'
    score: number
    facteurs: string[]
  } {
    return evaluateRisqueBancaire(relations)
  }

  /**
   * Génère un rapport de synthèse
   */
  static generateRapportSynthese(relations: RelationsBancaires): {
    nombreBanques: number
    totalEncours: number
    ratioEndettement: number
    nombreIncidents: number
    nombreCreditsActifs: number
    nombreCreditsHistoriques: number
    evaluationMoyenneService: number
    risque: ReturnType<typeof evaluateRisqueBancaire>
  } {
    const evaluationMoyenne = relations.evaluationsServices.length > 0
      ? relations.evaluationsServices.reduce((sum, ev) => sum + ev.noteMoyenne, 0) / relations.evaluationsServices.length
      : 0

    return {
      nombreBanques: relations.banquesPartenaires.length,
      totalEncours: relations.totalEncoursCredits,
      ratioEndettement: relations.ratioEndettement,
      nombreIncidents: relations.nombreIncidentsDernier12Mois,
      nombreCreditsActifs: relations.encoursCredits.length,
      nombreCreditsHistoriques: relations.creditsHistoriques.length,
      evaluationMoyenneService: evaluationMoyenne,
      risque: evaluateRisqueBancaire(relations)
    }
  }

  /**
   * Vérifie l'éligibilité à un nouveau crédit
   */
  static checkEligibiliteCredit(
    relations: RelationsBancaires,
    montantDemande: number,
    capitauxPropres: number
  ): {
    eligible: boolean
    raisons: string[]
    recommandations: string[]
  } {
    const raisons: string[] = []
    const recommandations: string[] = []

    // Vérifier incidents
    if (relations.nombreIncidentsDernier12Mois > 0) {
      raisons.push(`${relations.nombreIncidentsDernier12Mois} incident(s) bancaire(s) sur les 12 derniers mois`)
      recommandations.push('Régulariser tous les incidents bancaires avant toute nouvelle demande')
    }

    // Vérifier crédits en défaut
    const creditsDefaut = relations.creditsHistoriques.filter(c => c.etatRemboursement === 'en_defaut')
    if (creditsDefaut.length > 0) {
      raisons.push(`${creditsDefaut.length} crédit(s) en situation de défaut`)
      recommandations.push('Apurer les crédits en défaut ou négocier un rééchelonnement')
    }

    // Vérifier ratio d'endettement
    const nouveauEncours = relations.totalEncoursCredits + montantDemande
    const nouveauRatio = calculateRatioEndettement(nouveauEncours, capitauxPropres)

    if (nouveauRatio > 300) {
      raisons.push(`Ratio d'endettement trop élevé: ${nouveauRatio.toFixed(0)}% (> 300%)`)
      recommandations.push('Augmenter les fonds propres ou réduire le montant demandé')
    } else if (nouveauRatio > 200) {
      raisons.push(`Ratio d'endettement élevé: ${nouveauRatio.toFixed(0)}% (> 200%)`)
      recommandations.push('Prévoir des garanties solides')
    }

    // Vérifier capacité de garantie
    if (relations.capaciteGarantieRestante < montantDemande * 0.8) {
      raisons.push('Capacité de garantie insuffisante')
      recommandations.push('Identifier de nouvelles garanties mobilisables')
    }

    // Évaluation des services
    const evalMoyenne = relations.evaluationsServices.length > 0
      ? relations.evaluationsServices.reduce((sum, e) => sum + e.noteMoyenne, 0) / relations.evaluationsServices.length
      : 0

    if (evalMoyenne < 3) {
      recommandations.push('Améliorer la relation avec les banques actuelles')
    }

    const eligible = raisons.length === 0

    if (eligible) {
      raisons.push('Profil bancaire sain')
      recommandations.push('Préparer un dossier complet avec business plan, garanties et prévisions financières')
    }

    return {
      eligible,
      raisons,
      recommandations
    }
  }

  /**
   * Calcule la note bancaire globale (score sur 100)
   */
  static calculateNoteBancaire(relations: RelationsBancaires): {
    note: number
    details: { critere: string; note: number; poids: number }[]
    mention: 'Excellent' | 'Très Bien' | 'Bien' | 'Passable' | 'Insuffisant'
  } {
    const details = []

    // 1. Historique de crédit (30%)
    let noteHistorique = 100
    const creditsDefaut = relations.creditsHistoriques.filter(c => c.etatRemboursement === 'en_defaut').length
    const creditsRestructures = relations.creditsHistoriques.filter(c => c.etatRemboursement === 'restructure').length

    noteHistorique -= creditsDefaut * 30
    noteHistorique -= creditsRestructures * 15

    const totalRetards = relations.creditsHistoriques.reduce((sum, c) => sum + c.retardsRemboursement.nombre, 0)
    noteHistorique -= Math.min(totalRetards * 5, 40)

    noteHistorique = Math.max(0, noteHistorique)
    details.push({ critere: 'Historique de crédit', note: noteHistorique, poids: 30 })

    // 2. Incidents bancaires (25%)
    let noteIncidents = 100
    noteIncidents -= relations.nombreIncidentsDernier12Mois * 20
    noteIncidents = Math.max(0, noteIncidents)
    details.push({ critere: 'Incidents bancaires', note: noteIncidents, poids: 25 })

    // 3. Ratio d'endettement (20%)
    let noteEndettement = 100
    if (relations.ratioEndettement > 300) noteEndettement = 0
    else if (relations.ratioEndettement > 200) noteEndettement = 40
    else if (relations.ratioEndettement > 100) noteEndettement = 70
    else if (relations.ratioEndettement > 50) noteEndettement = 90
    details.push({ critere: 'Niveau d\'endettement', note: noteEndettement, poids: 20 })

    // 4. Qualité de la relation bancaire (15%)
    let noteRelation = 0
    if (relations.evaluationsServices.length > 0) {
      const moyenneEval = relations.evaluationsServices.reduce((sum, e) => sum + e.noteMoyenne, 0) / relations.evaluationsServices.length
      noteRelation = (moyenneEval / 5) * 100
    }
    details.push({ critere: 'Qualité relation bancaire', note: noteRelation, poids: 15 })

    // 5. Garanties disponibles (10%)
    let noteGaranties = 100
    if (relations.capaciteGarantieRestante < 0) {
      noteGaranties = 20
    } else if (relations.capaciteGarantieRestante < relations.totalEncoursCredits * 0.5) {
      noteGaranties = 50
    } else if (relations.capaciteGarantieRestante < relations.totalEncoursCredits) {
      noteGaranties = 75
    }
    details.push({ critere: 'Garanties disponibles', note: noteGaranties, poids: 10 })

    // Calcul de la note finale
    const noteFinale = details.reduce((sum, d) => sum + (d.note * d.poids / 100), 0)

    // Mention
    let mention: 'Excellent' | 'Très Bien' | 'Bien' | 'Passable' | 'Insuffisant'
    if (noteFinale >= 85) mention = 'Excellent'
    else if (noteFinale >= 70) mention = 'Très Bien'
    else if (noteFinale >= 55) mention = 'Bien'
    else if (noteFinale >= 40) mention = 'Passable'
    else mention = 'Insuffisant'

    return {
      note: noteFinale,
      details,
      mention
    }
  }

  /**
   * Génère des recommandations personnalisées
   */
  static generateRecommendations(relations: RelationsBancaires): string[] {
    const recommandations: string[] = []
    const noteBancaire = this.calculateNoteBancaire(relations)

    // Basé sur la note globale
    if (noteBancaire.note < 40) {
      recommandations.push('🔴 Situation critique: Assainir d\'urgence votre situation bancaire avant toute nouvelle demande de crédit')
    }

    // Incidents
    if (relations.nombreIncidentsDernier12Mois > 0) {
      recommandations.push('⚠️ Éviter tout nouvel incident bancaire pendant au moins 12 mois')
    }

    // Endettement
    if (relations.ratioEndettement > 200) {
      recommandations.push('📊 Réduire le niveau d\'endettement en augmentant les fonds propres ou en remboursant anticipativement certains crédits')
    } else if (relations.ratioEndettement > 100) {
      recommandations.push('💡 Surveiller le ratio d\'endettement et privilégier l\'autofinancement pour les petits investissements')
    }

    // Garanties
    if (relations.capaciteGarantieRestante < relations.totalEncoursCredits * 0.5) {
      recommandations.push('🏦 Constituer de nouvelles garanties (nantissement, caution, etc.) pour futures demandes de crédit')
    }

    // Diversification
    if (relations.banquesPartenaires.length === 1) {
      recommandations.push('🌐 Diversifier les relations bancaires en ouvrant des comptes dans 2-3 banques')
    }

    // Relation bancaire
    const evalMoyenne = relations.evaluationsServices.length > 0
      ? relations.evaluationsServices.reduce((sum, e) => sum + e.noteMoyenne, 0) / relations.evaluationsServices.length
      : 0

    if (evalMoyenne < 3.5 && evalMoyenne > 0) {
      recommandations.push('🤝 Améliorer la communication avec vos chargés de clientèle et honorer vos engagements')
    }

    // Crédits en défaut
    const creditsDefaut = relations.creditsHistoriques.filter(c => c.etatRemboursement === 'en_defaut')
    if (creditsDefaut.length > 0) {
      recommandations.push('❗ Régulariser immédiatement les crédits en défaut ou négocier un rééchelonnement avec les banques')
    }

    // Si tout va bien
    if (noteBancaire.note >= 70 && recommandations.length === 0) {
      recommandations.push('✅ Votre situation bancaire est saine. Continuez à honorer vos engagements et maintenir cette relation de confiance')
      recommandations.push('💼 Vous pouvez envisager sereinement de nouvelles demandes de financement')
    }

    return recommandations
  }
}
