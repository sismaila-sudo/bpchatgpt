import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { DecisionType } from '@/types/analysis'

interface DecisionBadgeProps {
  decision: DecisionType
  size?: 'sm' | 'md' | 'lg'
}

export default function DecisionBadge({ decision, size = 'md' }: DecisionBadgeProps) {
  const getDecisionConfig = () => {
    switch (decision) {
      case 'approve':
        return {
          label: 'Approuvé',
          icon: CheckCircleIcon,
          gradient: 'from-green-500 to-emerald-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700'
        }
      case 'conditional':
        return {
          label: 'Conditionnel',
          icon: ExclamationCircleIcon,
          gradient: 'from-yellow-500 to-orange-500',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700'
        }
      case 'decline':
        return {
          label: 'Refusé',
          icon: XCircleIcon,
          gradient: 'from-red-500 to-pink-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700'
        }
    }
  }

  const config = getDecisionConfig()
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${config.bg} ${config.border} ${config.text} border-2 rounded-full font-bold ${sizeClasses[size]}`}>
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  )
}