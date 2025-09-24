'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalRevenue: number
  totalCollaborators: number
  loading: boolean
}

export function useDashboardStats(user: User | null) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalRevenue: 0,
    totalCollaborators: 0,
    loading: true
  })

  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setStats(prev => ({ ...prev, loading: false }))
      return
    }

    fetchStats()
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    try {
      // 1. Compter le total des projets de l'utilisateur
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

      // 2. Compter les projets actifs
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'active')

      // 3. Calculer le CA total prévisionnel depuis financial_outputs
      // D'abord récupérer tous les projets de l'utilisateur
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', user.id)

      let totalRevenue = 0

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id)

        // Récupérer les données financières pour ces projets
        const { data: financialData } = await supabase
          .from('financial_outputs')
          .select('total_revenue')
          .in('project_id', projectIds)

        // Sommer tous les revenus
        totalRevenue = financialData?.reduce((sum, item) => {
          return sum + (item.total_revenue || 0)
        }, 0) || 0
      }

      // 4. Compter les collaborateurs (pour l'instant juste l'utilisateur)
      // TODO: Implémenter le système de collaboration réel
      const totalCollaborators = 1

      setStats({
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        totalRevenue,
        totalCollaborators,
        loading: false
      })

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  return stats
}