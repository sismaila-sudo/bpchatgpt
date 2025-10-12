'use client'

import { CheckIcon } from '@heroicons/react/24/outline'
import { PersistenceStatus } from '@/hooks/useProjectPersistence'

interface SaveIndicatorProps {
  status: PersistenceStatus
  className?: string
}

export default function SaveIndicator({ status, className = '' }: SaveIndicatorProps) {
  if (status === 'saved') {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <CheckIcon className="h-4 w-4 mr-2" />
        <span className="text-sm">Sauvegardé</span>
      </div>
    )
  }

  if (status === 'saving') {
    return (
      <div className={`flex items-center text-blue-600 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        <span className="text-sm">Sauvegarde...</span>
      </div>
    )
  }

  if (status === 'unsaved') {
    return (
      <div className={`flex items-center text-orange-600 ${className}`}>
        <span className="h-2 w-2 bg-orange-500 rounded-full mr-2"></span>
        <span className="text-sm">Non sauvegardé</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
        <span className="text-sm">Erreur sauvegarde</span>
      </div>
    )
  }

  return null
}