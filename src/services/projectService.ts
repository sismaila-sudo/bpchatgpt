import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface Project {
  id: string
  name: string
  sector?: string
  status: 'active' | 'archived' | 'draft'
  start_date?: string
  horizon_years?: number
  created_at: string
  updated_at: string
  created_by?: string
  organization_id?: string
  mode?: string
  template_id?: string
}

export const projectService = {
  // Récupérer tous les projets (en attendant la colonne status, tous sont considérés comme actifs)
  async getActiveProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }

    // Simuler le status pour la compatibilité
    return (data || []).map(project => ({
      ...project,
      status: 'active' as const
    }))
  },

  // Récupérer les projets archivés (vide pour le moment)
  async getArchivedProjects(): Promise<Project[]> {
    // Pour le moment, retourner un tableau vide
    // Cette fonctionnalité sera activée quand la colonne status sera ajoutée
    return []
  },

  // Archiver un projet (simulé pour le moment)
  async archiveProject(projectId: string): Promise<void> {
    console.log('Archive functionality will be available once status column is added to projects table')
    throw new Error('Fonctionnalité d\'archivage temporairement indisponible')
  },

  // Désarchiver un projet (simulé pour le moment)
  async unarchiveProject(projectId: string): Promise<void> {
    console.log('Unarchive functionality will be available once status column is added to projects table')
    throw new Error('Fonctionnalité de désarchivage temporairement indisponible')
  },

  // Supprimer définitivement un projet
  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
}