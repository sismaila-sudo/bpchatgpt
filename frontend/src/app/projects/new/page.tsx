'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function NewProjectPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Rediriger vers la page de sélection du mode
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      // Rediriger vers la page de sélection du mode projet
      router.push('/projects/new/select')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection...</p>
      </div>
    </div>
  )
}