/**
 * Module de validation métier
 * 
 * ⚠️ IMPORTANT: Ce module effectue uniquement des LECTURES
 * Il ne modifie AUCUNE donnée, juste des vérifications
 * 
 * @module businessValidation
 */

import { Project } from '@/types/project'
import { FinancialProjections } from '@/services/financialEngine'

// ============ TYPES ============

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
  section: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  infos: ValidationError[]
  score: number // 0-100
}

// ============ VALIDATION PROJET GLOBAL ============

/**
 * Valide la cohérence globale d'un projet
 * 
 * ⚠️ LECTURE SEULE - Ne modifie rien
 * 
 * @param project - Le projet à valider
 * @returns Résultat de validation avec score et messages
 */
export function validateProject(project: Project): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const infos: ValidationError[] = []

  // Validation 1: Informations de base
  if (!project.basicInfo.name || project.basicInfo.name.length < 3) {
    errors.push({
      field: 'basicInfo.name',
      message: 'Le nom du projet doit contenir au moins 3 caractères',
      severity: 'error',
      section: 'Informations générales'
    })
  }

  if (!project.basicInfo.description || project.basicInfo.description.length < 10) {
    warnings.push({
      field: 'basicInfo.description',
      message: 'La description devrait être plus détaillée (minimum 10 caractères)',
      severity: 'warning',
      section: 'Informations générales'
    })
  }

  // Validation 2: Cohérence temporelle
  const createdAt = project.createdAt instanceof Date 
    ? project.createdAt 
    : new Date(project.createdAt)
  const updatedAt = project.updatedAt instanceof Date
    ? project.updatedAt
    : new Date(project.updatedAt)
    
  if (updatedAt < createdAt) {
    errors.push({
      field: 'dates',
      message: 'Date de modification antérieure à la date de création',
      severity: 'error',
      section: 'Métadonnées'
    })
  }

  // Validation 3: Statut du projet
  if (project.status === 'completed' && !project.sections.financialData) {
    warnings.push({
      field: 'status',
      message: 'Projet marqué comme terminé mais sans données financières',
      severity: 'warning',
      section: 'État du projet'
    })
  }

  // Calcul du score
  const totalChecks = 10
  const errorCount = errors.length
  const warningCount = warnings.length
  const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5))

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
    score
  }
}

// ============ VALIDATION PROJECTIONS FINANCIÈRES ============

/**
 * Valide la cohérence des projections financières
 * 
 * ⚠️ LECTURE SEULE - Ne modifie rien
 * Détecte les incohérences dans les calculs financiers
 * 
 * @param projections - Les projections à valider
 * @returns Résultat de validation avec score et messages
 */
export function validateFinancialProjections(
  projections: FinancialProjections
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const infos: ValidationError[] = []

  // Validation 1: Présence de données
  if (!projections.revenues || projections.revenues.length === 0) {
    warnings.push({
      field: 'revenues',
      message: 'Aucun revenu projeté',
      severity: 'warning',
      section: 'Projections financières'
    })
  }

  // Validation 2: Revenus négatifs
  projections.revenues.forEach((rev, index) => {
    if (rev < 0) {
      errors.push({
        field: `revenues[${index}]`,
        message: `Revenu négatif pour l'année ${projections.years[index]} : ${rev.toLocaleString('fr-FR')} FCFA`,
        severity: 'error',
        section: 'Revenus'
      })
    }
  })

  // Validation 3: Revenus = 0 sur toute la période
  const totalRevenue = projections.revenues.reduce((sum, rev) => sum + rev, 0)
  if (totalRevenue === 0) {
    errors.push({
      field: 'revenues',
      message: 'Aucun revenu projeté sur toute la période',
      severity: 'error',
      section: 'Revenus'
    })
  }

  // Validation 4: Coûts > Revenus de manière persistante
  let consecutiveLoss = 0
  projections.netProfit.forEach((profit, index) => {
    if (profit < 0) {
      consecutiveLoss++
    } else {
      consecutiveLoss = 0
    }

    // Si pertes pendant 3 ans ou plus
    if (consecutiveLoss >= 3) {
      warnings.push({
        field: 'netProfit',
        message: `Pertes nettes persistantes (${consecutiveLoss} années consécutives)`,
        severity: 'warning',
        section: 'Rentabilité'
      })
    }
  })

  // Validation 5: Marges négatives
  projections.netMargin.forEach((margin, index) => {
    if (margin < 0 && projections.revenues[index] > 0) {
      infos.push({
        field: `netMargin[${index}]`,
        message: `Marge nette négative année ${projections.years[index]} : ${margin.toFixed(1)}%`,
        severity: 'info',
        section: 'Marges'
      })
    }
  })

  // Validation 6: Marge brute < 0 (problème grave)
  projections.grossMargin.forEach((margin, index) => {
    if (margin < 0 && projections.revenues[index] > 0) {
      errors.push({
        field: `grossMargin[${index}]`,
        message: `Marge brute négative année ${projections.years[index]} : ${margin.toFixed(1)}% (Coûts variables > Revenus)`,
        severity: 'error',
        section: 'Marges'
      })
    }
  })

  // Validation 7: Cash flow cumulé négatif en fin de période
  const lastCumulativeCF = projections.cumulativeCashFlow[projections.cumulativeCashFlow.length - 1]
  if (lastCumulativeCF < 0) {
    warnings.push({
      field: 'cumulativeCashFlow',
      message: `Cash flow cumulé négatif en fin de période : ${lastCumulativeCF.toLocaleString('fr-FR')} FCFA`,
      severity: 'warning',
      section: 'Trésorerie'
    })
  }

  // Validation 8: VAN négative
  if (projections.npv < 0) {
    warnings.push({
      field: 'npv',
      message: `VAN négative : ${projections.npv.toLocaleString('fr-FR')} FCFA - Projet non rentable`,
      severity: 'warning',
      section: 'Rentabilité'
    })
  }

  // Validation 9: TRI < Taux d'actualisation
  if (projections.irr < 0.12) { // 12% = taux bancaire Sénégal
    warnings.push({
      field: 'irr',
      message: `TRI faible (${(projections.irr * 100).toFixed(1)}% < 12%) - Rendement inférieur au coût du capital`,
      severity: 'warning',
      section: 'Rentabilité'
    })
  }

  // Validation 10: Délai de récupération > durée des projections
  if (projections.paybackPeriod === null || projections.paybackPeriod > projections.years.length) {
    warnings.push({
      field: 'paybackPeriod',
      message: 'Délai de récupération supérieur à la durée des projections',
      severity: 'warning',
      section: 'Rentabilité'
    })
  }

  // Calcul du score
  const totalChecks = 15
  const errorPenalty = errors.length * 15
  const warningPenalty = warnings.length * 5
  const infoPenalty = infos.length * 2
  const score = Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
    score
  }
}

// ============ VALIDATION ÉLIGIBILITÉ FONGIP ============

/**
 * Valide l'éligibilité selon les critères FONGIP
 * 
 * ⚠️ LECTURE SEULE - Ne modifie rien
 * 
 * Critères FONGIP:
 * - Autonomie financière ≥ 20%
 * - Liquidité > 1.0
 * - DSCR > 1.2
 * 
 * @param autonomieFinanciere - Ratio d'autonomie (0-1, ex: 0.25 = 25%)
 * @param liquidite - Ratio de liquidité (ex: 1.5)
 * @param dscr - Debt Service Coverage Ratio (ex: 1.8)
 * @returns Résultat de validation avec recommandations
 */
export function validateFONGIPEligibility(
  autonomieFinanciere: number,
  liquidite: number,
  dscr: number
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const infos: ValidationError[] = []

  // Critère 1: Autonomie financière (OBLIGATOIRE)
  if (autonomieFinanciere < 0.20) {
    errors.push({
      field: 'autonomieFinanciere',
      message: `Autonomie financière insuffisante : ${(autonomieFinanciere * 100).toFixed(1)}% < 20% (critère FONGIP)`,
      severity: 'error',
      section: 'Critères FONGIP'
    })
  } else if (autonomieFinanciere < 0.30) {
    warnings.push({
      field: 'autonomieFinanciere',
      message: `Autonomie financière faible : ${(autonomieFinanciere * 100).toFixed(1)}% < 30% (recommandation: augmenter les fonds propres)`,
      severity: 'warning',
      section: 'Critères FONGIP'
    })
  } else {
    infos.push({
      field: 'autonomieFinanciere',
      message: `✅ Bonne autonomie financière : ${(autonomieFinanciere * 100).toFixed(1)}%`,
      severity: 'info',
      section: 'Critères FONGIP'
    })
  }

  // Critère 2: Liquidité (OBLIGATOIRE)
  if (liquidite < 1.0) {
    errors.push({
      field: 'liquidite',
      message: `Liquidité insuffisante : ${liquidite.toFixed(2)} < 1.0 (critère FONGIP)`,
      severity: 'error',
      section: 'Critères FONGIP'
    })
  } else if (liquidite < 1.2) {
    warnings.push({
      field: 'liquidite',
      message: `Liquidité limite : ${liquidite.toFixed(2)} < 1.2 (recommandation: améliorer le fonds de roulement)`,
      severity: 'warning',
      section: 'Critères FONGIP'
    })
  } else {
    infos.push({
      field: 'liquidite',
      message: `✅ Bonne liquidité : ${liquidite.toFixed(2)}`,
      severity: 'info',
      section: 'Critères FONGIP'
    })
  }

  // Critère 3: DSCR (OBLIGATOIRE)
  if (dscr < 1.2) {
    errors.push({
      field: 'dscr',
      message: `DSCR insuffisant : ${dscr.toFixed(2)} < 1.2 (critère FONGIP)`,
      severity: 'error',
      section: 'Critères FONGIP'
    })
  } else if (dscr < 1.5) {
    warnings.push({
      field: 'dscr',
      message: `DSCR acceptable : ${dscr.toFixed(2)} < 1.5 (recommandation: améliorer la capacité de remboursement)`,
      severity: 'warning',
      section: 'Critères FONGIP'
    })
  } else {
    infos.push({
      field: 'dscr',
      message: `✅ Excellent DSCR : ${dscr.toFixed(2)}`,
      severity: 'info',
      section: 'Critères FONGIP'
    })
  }

  // Calcul du score
  const criticalErrors = errors.length
  const score = Math.max(0, 100 - (criticalErrors * 34)) // 3 critères obligatoires = ~33 points chacun

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
    score
  }
}

// ============ VALIDATION COHÉRENCE DONNÉES ============

/**
 * Valide la cohérence entre différentes sections du projet
 * 
 * ⚠️ LECTURE SEULE - Ne modifie rien
 * 
 * @param project - Le projet complet
 * @param projections - Les projections financières
 * @returns Résultat de validation
 */
export function validateDataConsistency(
  project: Project,
  projections?: FinancialProjections
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const infos: ValidationError[] = []

  // Validation 1: Projet avec projections mais sans investissement initial
  if (projections && projections.revenues.length > 0) {
    const hasInvestment = projections.investmentCashFlow.some(cf => cf !== 0)
    if (!hasInvestment) {
      warnings.push({
        field: 'initialInvestment',
        message: 'Projections définies mais aucun investissement initial renseigné',
        severity: 'warning',
        section: 'Cohérence financière'
      })
    }
  }

  // Validation 2: Durée du projet vs projections
  if ((project.basicInfo as any).duration && projections) {
    const durationYears = Math.ceil((project.basicInfo as any).duration / 12)
    if (projections.years.length < durationYears) {
      infos.push({
        field: 'duration',
        message: `Projections sur ${projections.years.length} ans mais projet prévu sur ${durationYears} ans`,
        severity: 'info',
        section: 'Cohérence temporelle'
      })
    }
  }

  const score = Math.max(0, 100 - (errors.length * 15) - (warnings.length * 5))

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
    score
  }
}

