import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { RiskItem } from '@/types/analysis'

interface RiskCardProps {
  risk: RiskItem
}

export default function RiskCard({ risk }: RiskCardProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-400 bg-red-50'
      case 'medium':
        return 'border-yellow-400 bg-yellow-50'
      case 'low':
        return 'border-blue-400 bg-blue-50'
      default:
        return 'border-slate-400 bg-slate-50'
    }
  }

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Élevé</span>
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Moyen</span>
      case 'low':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Faible</span>
      default:
        return null
    }
  }

  return (
    <div className={`border-l-4 rounded-xl p-5 ${getSeverityColor(risk.severity)} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <h5 className="font-bold text-slate-900">{risk.type}</h5>
        </div>
        {risk.severity && getSeverityBadge(risk.severity)}
      </div>

      <p className="text-sm text-slate-700 mb-4">{risk.description}</p>

      <div className="flex items-start space-x-2 bg-white/70 rounded-lg p-3 border border-slate-200">
        <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-700 mb-1">Mitigation</p>
          <p className="text-sm text-slate-700">{risk.mitigation}</p>
        </div>
      </div>
    </div>
  )
}