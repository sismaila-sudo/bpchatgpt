/**
 * Widget de validation métier
 * 
 * ⚠️ COMPOSANT READ-ONLY - Affiche uniquement des informations
 * Ne modifie AUCUNE donnée du projet
 * 
 * Fournit un feedback visuel sur la qualité/cohérence des données
 */

'use client'

import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ValidationResult, ValidationError } from '@/lib/businessValidation'

interface ValidationWidgetProps {
  validationResult: ValidationResult | null
  title?: string
  className?: string
}

export default function ValidationWidget({ 
  validationResult, 
  title = "Validation",
  className = ""
}: ValidationWidgetProps) {
  if (!validationResult) {
    return null
  }

  const { isValid, errors, warnings, infos, score } = validationResult

  // Couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const hasMessages = errors.length > 0 || warnings.length > 0 || infos.length > 0

  return (
    <div className={`rounded-xl border-2 ${getScoreBgColor(score)} p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {isValid ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          ) : (
            <XCircleIcon className="w-6 h-6 text-red-600" />
          )}
          {title}
        </h3>
        
        {/* Score */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Score:</span>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xl font-medium text-slate-500">/100</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-yellow-500' :
              score >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      {hasMessages && (
        <div className="space-y-3">
          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <ValidationMessage key={`error-${index}`} error={error} />
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <ValidationMessage key={`warning-${index}`} error={warning} />
              ))}
            </div>
          )}

          {/* Infos */}
          {infos.length > 0 && (
            <div className="space-y-2">
              {infos.map((info, index) => (
                <ValidationMessage key={`info-${index}`} error={info} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message si tout est OK */}
      {!hasMessages && isValid && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="font-medium">Aucun problème détecté ! ✅</span>
        </div>
      )}
    </div>
  )
}

// Composant pour afficher un message de validation
function ValidationMessage({ error }: { error: ValidationError }) {
  const Icon = error.severity === 'error' 
    ? XCircleIcon 
    : error.severity === 'warning'
    ? ExclamationTriangleIcon
    : InformationCircleIcon

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors[error.severity]}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[error.severity]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{error.message}</p>
        {error.section && (
          <p className="text-xs opacity-75 mt-1">
            Section : {error.section}
          </p>
        )}
      </div>
    </div>
  )
}

