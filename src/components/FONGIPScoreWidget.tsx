'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { FONGIPScoringService } from '@/services/fongipScoringService'
import { FONGIPScore } from '@/types/fongipScoring'
import {
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface FONGIPScoreWidgetProps {
  projectId: string
}

function FONGIPScoreWidget({ projectId }: FONGIPScoreWidgetProps) {
  const [score, setScore] = useState<FONGIPScore | null>(null)
  const [loading, setLoading] = useState(true)

  // ⚡ Mémoriser la fonction de chargement
  const loadScore = useCallback(async () => {
    try {
      const calculatedScore = await FONGIPScoringService.calculateProjectScore(projectId)
      setScore(calculatedScore)
    } catch (error) {
      console.error('Erreur calcul score:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadScore()
  }, [loadScore])

  // ⚡ Mémoriser les fonctions de calcul de couleur
  const getScoreColor = useCallback((scoreValue: number) => {
    if (scoreValue >= 90) return 'text-green-600'
    if (scoreValue >= 75) return 'text-blue-600'
    if (scoreValue >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getScoreBgColor = useCallback((scoreValue: number) => {
    if (scoreValue >= 90) return 'bg-green-50 border-green-500'
    if (scoreValue >= 75) return 'bg-blue-50 border-blue-500'
    if (scoreValue >= 60) return 'bg-yellow-50 border-yellow-500'
    return 'bg-red-50 border-red-500'
  }, [])

  // ⚡ Mémoriser l'icône d'éligibilité
  const eligibilityIcon = useMemo(() => {
    if (!score) return null
    if (score.eligibilite === 'Éligible') return <CheckCircleIcon className="w-6 h-6 text-green-600" />
    if (score.eligibilite === 'Éligible sous conditions') return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
    return <XCircleIcon className="w-6 h-6 text-red-600" />
  }, [score])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!score) return null

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
          <ChartBarIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Score FONGIP</h2>
          <p className="text-sm text-gray-600">Conformité du dossier</p>
        </div>
      </div>

      {/* Score Principal */}
      <div className={`rounded-2xl border-2 p-8 mb-6 ${getScoreBgColor(score.scoreTotal)}`}>
        <div className="text-center">
          <div className={`text-7xl font-black ${getScoreColor(score.scoreTotal)}`}>
            {score.scoreTotal.toFixed(0)}
            <span className="text-4xl">/100</span>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${getScoreColor(score.scoreTotal)}`}>
              {score.niveau}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            {eligibilityIcon}
            <span className="text-lg font-semibold text-gray-700">{score.eligibilite}</span>
          </div>
        </div>
      </div>

      {/* Catégories */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-bold text-gray-900">Détails par Catégorie</h3>
        {score.categories.map((cat) => (
          <div key={cat.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{cat.nom}</span>
              <span className={`font-bold ${getScoreColor(cat.progression)}`}>
                {cat.pointsObtenus}/{cat.pointsMax} pts
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  cat.progression >= 90 ? 'bg-green-600' :
                  cat.progression >= 75 ? 'bg-blue-600' :
                  cat.progression >= 60 ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${cat.progression}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {cat.progression.toFixed(0)}% complété
            </div>
          </div>
        ))}
      </div>

      {/* Recommandations */}
      {score.recommandations.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Recommandations</h3>
          <ul className="space-y-2">
            {score.recommandations.slice(0, 5).map((rec, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bouton Rafraîchir */}
      <button
        onClick={loadScore}
        className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <ArrowPathIcon className="w-5 h-5" />
        Recalculer le Score
      </button>
    </div>
  )
}

// ⚡ Mémoriser le composant entier pour éviter les re-renders inutiles
export default memo(FONGIPScoreWidget)
