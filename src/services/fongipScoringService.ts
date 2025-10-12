import {
  FONGIPScore,
  ScoringCategory,
  ScoringCriterion,
  FONGIP_CRITERIA,
  evaluateScore,
  evaluateEligibility,
  generateRecommendations
} from '@/types/fongipScoring'
import { FicheSynoptiqueService } from './ficheSynoptiqueService'
import { AnalyseFinanciereHistoriqueService } from './analyseFinanciereHistoriqueService'
import { TableauxFinanciersService } from './tableauxFinanciersService'
import { RelationsBancairesService } from './relationsBancairesService'

export class FONGIPScoringService {
  /**
   * Calcule le score FONGIP global d'un projet
   */
  static async calculateProjectScore(projectId: string): Promise<FONGIPScore> {
    const categories: ScoringCategory[] = []
    let pointsTotaux = 0
    let pointsObtenus = 0
    const sectionsManquantes: string[] = []

    // CATÉGORIE 1: Documents Administratifs
    const docsAdminCategory = await this.evaluateDocumentsAdministratifs(projectId)
    categories.push(docsAdminCategory)
    pointsTotaux += docsAdminCategory.pointsMax
    pointsObtenus += docsAdminCategory.pointsObtenus

    // CATÉGORIE 2: Analyse Financière
    const analyseFinCategory = await this.evaluateAnalyseFinanciere(projectId)
    categories.push(analyseFinCategory)
    pointsTotaux += analyseFinCategory.pointsMax
    pointsObtenus += analyseFinCategory.pointsObtenus

    // CATÉGORIE 3: Tableaux Financiers
    const tableauxCategory = await this.evaluateTableauxFinanciers(projectId)
    categories.push(tableauxCategory)
    pointsTotaux += tableauxCategory.pointsMax
    pointsObtenus += tableauxCategory.pointsObtenus

    // CATÉGORIE 4: Étude de Marché
    const marcheCategory = await this.evaluateEtudeMarche(projectId)
    categories.push(marcheCategory)
    pointsTotaux += marcheCategory.pointsMax
    pointsObtenus += marcheCategory.pointsObtenus

    // CATÉGORIE 5: Relations Bancaires
    const banquesCategory = await this.evaluateRelationsBancaires(projectId)
    categories.push(banquesCategory)
    pointsTotaux += banquesCategory.pointsMax
    pointsObtenus += banquesCategory.pointsObtenus

    // CATÉGORIE 6: Autres
    const autresCategory = await this.evaluateAutresElements(projectId)
    categories.push(autresCategory)
    pointsTotaux += autresCategory.pointsMax
    pointsObtenus += autresCategory.pointsObtenus

    // Calculer le score total sur 100
    const scoreTotal = pointsTotaux > 0 ? (pointsObtenus / pointsTotaux) * 100 : 0

    // Calculer critères obligatoires
    const criteresObligatoires = this.calculateCriteresObligatoires(categories)

    // Générer les recommandations
    const score: FONGIPScore = {
      scoreTotal,
      pointsObtenus,
      pointsMax: pointsTotaux,
      categories,
      niveau: evaluateScore(scoreTotal),
      eligibilite: evaluateEligibility(scoreTotal, criteresObligatoires),
      recommandations: [],
      sectionsManquantes,
      dateEvaluation: new Date()
    }

    score.recommandations = generateRecommendations(score)

    return score
  }

  /**
   * Évalue Documents Administratifs
   */
  private static async evaluateDocumentsAdministratifs(projectId: string): Promise<ScoringCategory> {
    const config = FONGIP_CRITERIA.documentsAdministratifs
    const criteres: ScoringCriterion[] = []
    let pointsObtenus = 0

    // Fiche Synoptique
    const ficheSynoptique = await FicheSynoptiqueService.getFicheSynoptique(projectId)
    const ficheScore = ficheSynoptique && this.isFicheSynoptiqueComplete(ficheSynoptique) ? 5 : 0
    criteres.push({
      ...config.criteres[0],
      pointsObtenus: ficheScore,
      statut: ficheScore === 5 ? 'complet' : ficheScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += ficheScore

    // ✅ RÈGLE STRICTE : Pas de score simulé
    const identificationScore = 0 // ✅ VIDE - L'utilisateur doit saisir
    criteres.push({
      ...config.criteres[1],
      pointsObtenus: identificationScore,
      statut: 'partiel'
    })
    pointsObtenus += identificationScore

    // ✅ RÈGLE STRICTE : Pas de score simulé
    const dirigeantsScore = 0 // ✅ VIDE - L'utilisateur doit saisir
    criteres.push({
      ...config.criteres[2],
      pointsObtenus: dirigeantsScore,
      statut: 'partiel'
    })
    pointsObtenus += dirigeantsScore

    return {
      id: config.id,
      nom: config.nom,
      description: 'Documents administratifs et légaux',
      pointsMax: config.pointsMax,
      pointsObtenus,
      criteres,
      progression: (pointsObtenus / config.pointsMax) * 100
    }
  }

  /**
   * Évalue Analyse Financière
   */
  private static async evaluateAnalyseFinanciere(projectId: string): Promise<ScoringCategory> {
    const config = FONGIP_CRITERIA.analyseFinanciere
    const criteres: ScoringCriterion[] = []
    let pointsObtenus = 0

    // Historique 3 ans
    const analyse = await AnalyseFinanciereHistoriqueService.getAnalyse(projectId)
    const historiqueScore = analyse && this.isAnalyseComplete(analyse) ? 10 : analyse ? 5 : 0
    criteres.push({
      ...config.criteres[0],
      pointsObtenus: historiqueScore,
      statut: historiqueScore === 10 ? 'complet' : historiqueScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += historiqueScore

    // Ratios bancaires
    let ratiosScore = 0
    if (analyse && analyse.ratiosDecision.length > 0) {
      const ratiosMoyens = this.evaluateRatios(analyse.ratiosDecision[analyse.ratiosDecision.length - 1])
      ratiosScore = ratiosMoyens >= 80 ? 10 : ratiosMoyens >= 60 ? 7 : ratiosMoyens >= 40 ? 4 : 0
    }
    criteres.push({
      ...config.criteres[1],
      pointsObtenus: ratiosScore,
      statut: ratiosScore === 10 ? 'complet' : ratiosScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += ratiosScore

    // ✅ RÈGLE STRICTE : Pas de score simulé
    const rentabiliteScore = 0 // ✅ VIDE - L'utilisateur doit saisir
    criteres.push({
      ...config.criteres[2],
      pointsObtenus: rentabiliteScore,
      statut: 'partiel'
    })
    pointsObtenus += rentabiliteScore

    return {
      id: config.id,
      nom: config.nom,
      description: 'Analyse financière historique et prévisionnelle',
      pointsMax: config.pointsMax,
      pointsObtenus,
      criteres,
      progression: (pointsObtenus / config.pointsMax) * 100
    }
  }

  /**
   * Évalue Tableaux Financiers
   */
  private static async evaluateTableauxFinanciers(projectId: string): Promise<ScoringCategory> {
    const config = FONGIP_CRITERIA.tableauxFinanciers
    const criteres: ScoringCriterion[] = []
    let pointsObtenus = 0

    const tableaux = await TableauxFinanciersService.getTableauxFinanciers(projectId)

    // Investissement/Financement
    const invFinScore = tableaux && tableaux.investissementFinancement.investissements.length > 0 &&
                       Math.abs(tableaux.investissementFinancement.ecart) < 1000 ? 5 : tableaux ? 2 : 0
    criteres.push({
      ...config.criteres[0],
      pointsObtenus: invFinScore,
      statut: invFinScore === 5 ? 'complet' : invFinScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += invFinScore

    // Plan de trésorerie
    const tresScore = tableaux && tableaux.planTresorerie.length >= 12 ? 5 : tableaux && tableaux.planTresorerie.length > 0 ? 2 : 0
    criteres.push({
      ...config.criteres[1],
      pointsObtenus: tresScore,
      statut: tresScore === 5 ? 'complet' : tresScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += tresScore

    // Compte de résultat prévisionnel
    const crScore = tableaux && tableaux.comptesResultatPrevisionnels.length >= 3 ? 5 : tableaux && tableaux.comptesResultatPrevisionnels.length > 0 ? 2 : 0
    criteres.push({
      ...config.criteres[2],
      pointsObtenus: crScore,
      statut: crScore === 5 ? 'complet' : crScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += crScore

    // Plan d'amortissement
    const amortScore = tableaux && tableaux.plansAmortissementEmprunts.length > 0 ? 5 : 0
    criteres.push({
      ...config.criteres[3],
      pointsObtenus: amortScore,
      statut: amortScore === 5 ? 'complet' : 'manquant'
    })
    pointsObtenus += amortScore

    // Bilan prévisionnel
    const bilanScore = tableaux && tableaux.bilansPrevisionnels.length >= 3 ? 5 : tableaux && tableaux.bilansPrevisionnels.length > 0 ? 2 : 0
    criteres.push({
      ...config.criteres[4],
      pointsObtenus: bilanScore,
      statut: bilanScore === 5 ? 'complet' : bilanScore > 0 ? 'partiel' : 'manquant'
    })
    pointsObtenus += bilanScore

    return {
      id: config.id,
      nom: config.nom,
      description: 'Tableaux financiers prévisionnels détaillés',
      pointsMax: config.pointsMax,
      pointsObtenus,
      criteres,
      progression: (pointsObtenus / config.pointsMax) * 100
    }
  }

  /**
   * Évalue Étude de Marché
   */
  private static async evaluateEtudeMarche(projectId: string): Promise<ScoringCategory> {
    const config = FONGIP_CRITERIA.etudeMarche
    const criteres: ScoringCriterion[] = []
    let pointsObtenus = 0

    // Simulé - à adapter selon votre structure de données
    criteres.push({
      ...config.criteres[0],
      pointsObtenus: 3,
      statut: 'partiel'
    })
    pointsObtenus += 3

    criteres.push({
      ...config.criteres[1],
      pointsObtenus: 2,
      statut: 'partiel'
    })
    pointsObtenus += 2

    criteres.push({
      ...config.criteres[2],
      pointsObtenus: 1,
      statut: 'partiel'
    })
    pointsObtenus += 1

    return {
      id: config.id,
      nom: config.nom,
      description: 'Analyse du marché et de la concurrence',
      pointsMax: config.pointsMax,
      pointsObtenus,
      criteres,
      progression: (pointsObtenus / config.pointsMax) * 100
    }
  }

  /**
   * Évalue Relations Bancaires
   */
  private static async evaluateRelationsBancaires(projectId: string): Promise<ScoringCategory> {
    const config = FONGIP_CRITERIA.relationsBancaires
    const criteres: ScoringCriterion[] = []
    let pointsObtenus = 0

    const relations = await RelationsBancairesService.getRelationsBancaires(projectId)

    // Historique crédit
    const historiqueScore = relations && relations.creditsHistoriques.length > 0 ? 5 : 0
    criteres.push({
      ...config.criteres[0],
      pointsObtenus: historiqueScore,
      statut: historiqueScore === 5 ? 'complet' : 'manquant'
    })
    pointsObtenus += historiqueScore

    // Encours actuels
    const encoursScore = relations && relations.encoursCredits.length >= 0 ? 3 : 0
    criteres.push({
      ...config.criteres[1],
      pointsObtenus: encoursScore,
      statut: encoursScore === 3 ? 'complet' : 'manquant'
    })
    pointsObtenus += encoursScore

    // Incidents
    const incidentsScore = relations && relations.nombreIncidentsDernier12Mois === 0 ? 2 : 0
    criteres.push({
      ...config.criteres[2],
      pointsObtenus: incidentsScore,
      statut: incidentsScore === 2 ? 'complet' : 'manquant'
    })
    pointsObtenus += incidentsScore

    return {
      id: config.id,
      nom: config.nom,
      description: 'Historique et situation bancaire',
      pointsMax: config.pointsMax,
      pointsObtenus,
      criteres,
      progression: (pointsObtenus / config.pointsMax) * 100
    }
  }

  /**
   * Évalue Autres Éléments
   */
  private static async evaluateAutresElements(projectId: string): Promise<ScoringCategory> {
    const config = FONGIP_CRITERIA.autresElements
    const criteres: ScoringCriterion[] = []
    let pointsObtenus = 0

    // Simulé - à adapter
    criteres.push({ ...config.criteres[0], pointsObtenus: 1, statut: 'partiel' })
    criteres.push({ ...config.criteres[1], pointsObtenus: 2, statut: 'partiel' })
    criteres.push({ ...config.criteres[2], pointsObtenus: 1, statut: 'partiel' })
    criteres.push({ ...config.criteres[3], pointsObtenus: 2, statut: 'partiel' })
    pointsObtenus = 6

    return {
      id: config.id,
      nom: config.nom,
      description: 'Éléments complémentaires du business plan',
      pointsMax: config.pointsMax,
      pointsObtenus,
      criteres,
      progression: (pointsObtenus / config.pointsMax) * 100
    }
  }

  // Helpers
  private static isFicheSynoptiqueComplete(fiche: any): boolean {
    return !!(
      fiche.presentationEntreprise?.raisonSociale &&
      fiche.presentationProjet?.descriptionProjet &&
      fiche.conditionsFinancement?.typesCredit?.length > 0
    )
  }

  private static isAnalyseComplete(analyse: any): boolean {
    return !!(
      analyse.comptesResultat?.length >= 3 &&
      analyse.bilansActif?.length >= 3 &&
      analyse.ratiosDecision?.length >= 3
    )
  }

  private static evaluateRatios(ratios: any): number {
    let score = 0
    let total = 0

    // Autonomie financière >= 20%
    if (ratios.autonomieFinanciere >= 20) score += 20
    total += 20

    // Capacité remboursement <= 4 ans
    if (ratios.capaciteRemboursement <= 4) score += 20
    total += 20

    // Rentabilité globale > 0%
    if (ratios.rentabiliteGlobale > 0) score += 20
    total += 20

    // Liquidité >= 1
    if (ratios.liquiditeGenerale >= 1) score += 20
    total += 20

    // Solvabilité >= 20%
    if (ratios.solvabilite >= 20) score += 20
    total += 20

    return total > 0 ? (score / total) * 100 : 0
  }

  private static calculateCriteresObligatoires(categories: ScoringCategory[]): number {
    let obligatoiresObtenus = 0
    let obligatoiresTotal = 0

    categories.forEach(cat => {
      cat.criteres.forEach(crit => {
        if (crit.obligatoire) {
          obligatoiresTotal += crit.pointsMax
          obligatoiresObtenus += crit.pointsObtenus
        }
      })
    })

    return obligatoiresTotal > 0 ? (obligatoiresObtenus / obligatoiresTotal) * 100 : 0
  }
}
