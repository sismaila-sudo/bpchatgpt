import { createClient } from '@/lib/supabase/client'

export interface DocumentTemplate {
  id: string
  name: string
  sector: string
  mode: 'new-company' | 'existing-company'
  description: string
  structure: {
    sections: string[]
  }
  created_at: string
  updated_at: string
}

export interface TemplateSection {
  id: string
  template_id: string
  section_key: string
  title: string
  description: string
  content_template: string
  order_index: number
  is_required: boolean
  ai_prompt_template: string
  created_at: string
}

export interface SectionImage {
  id: string
  section_id: string
  file_name: string
  file_url: string
  caption: string
  position: 'inline' | 'full-width' | 'side'
  order_index: number
  file_size: number
  file_type: string
  created_at: string
}

export interface CompanyHistory {
  id?: string
  project_id: string
  founding_year?: number
  legal_form?: string
  capital_amount?: number
  business_registration?: string
  tax_number?: string
  address?: string
  employees_count?: number
  annual_revenue?: number
  description?: string
}

export interface FinancialHistory {
  id?: string
  project_id: string
  year: number
  revenue: number
  expenses: number
  net_profit: number
  assets: number
  liabilities: number
  equity: number
}

export interface SectorAnalysis {
  id?: string
  project_id: string
  sector: string
  market_size?: number
  growth_rate?: number
  key_players?: string[]
  success_factors?: string[]
  barriers_to_entry?: string[]
  regulatory_environment?: string
  swot_strengths?: string[]
  swot_weaknesses?: string[]
  swot_opportunities?: string[]
  swot_threats?: string[]
}

class DocumentTemplateService {
  private supabase = createClient()

  // Templates
  async getTemplates(sector?: string, mode?: string): Promise<DocumentTemplate[]> {
    let query = this.supabase
      .from('document_templates')
      .select('*')
      .order('sector, mode, name')

    if (sector) {
      query = query.eq('sector', sector)
    }
    if (mode) {
      query = query.eq('mode', mode)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getTemplate(id: string): Promise<DocumentTemplate | null> {
    const { data, error } = await this.supabase
      .from('document_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getTemplateSections(templateId: string): Promise<TemplateSection[]> {
    const { data, error } = await this.supabase
      .from('template_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index')

    if (error) throw error
    return data || []
  }

  // Initialisation de projet avec template
  async initializeProjectWithTemplate(
    projectId: string,
    templateId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .rpc('initialize_project_sections', {
        p_project_id: projectId,
        p_template_id: templateId
      })

    if (error) throw error
  }

  // Gestion des images de section
  async uploadSectionImage(
    sectionId: string,
    file: File,
    caption?: string,
    position: 'inline' | 'full-width' | 'side' = 'inline'
  ): Promise<SectionImage> {
    // Upload vers Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `sections/${sectionId}/${fileName}`

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('business-plan-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Obtenir l'URL publique
    const { data: urlData } = this.supabase.storage
      .from('business-plan-images')
      .getPublicUrl(filePath)

    // Enregistrer en base
    const { data, error } = await this.supabase
      .from('section_images')
      .insert({
        section_id: sectionId,
        file_name: fileName,
        file_url: urlData.publicUrl,
        caption: caption || '',
        position,
        file_size: file.size,
        file_type: file.type,
        order_index: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getSectionImages(sectionId: string): Promise<SectionImage[]> {
    const { data, error } = await this.supabase
      .from('section_images')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index')

    if (error) throw error
    return data || []
  }

  async deleteSectionImage(imageId: string): Promise<void> {
    // Récupérer les infos de l'image
    const { data: image, error: fetchError } = await this.supabase
      .from('section_images')
      .select('file_url')
      .eq('id', imageId)
      .single()

    if (fetchError) throw fetchError

    // Supprimer de Supabase Storage
    if (image?.file_url) {
      const path = image.file_url.split('/').slice(-3).join('/')
      await this.supabase.storage
        .from('business-plan-images')
        .remove([path])
    }

    // Supprimer de la base
    const { error } = await this.supabase
      .from('section_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
  }

  // Gestion de l'historique entreprise
  async saveCompanyHistory(history: CompanyHistory): Promise<CompanyHistory> {
    const { data, error } = await this.supabase
      .from('company_history')
      .upsert(history)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getCompanyHistory(projectId: string): Promise<CompanyHistory | null> {
    const { data, error } = await this.supabase
      .from('company_history')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Gestion de l'historique financier
  async saveFinancialHistory(
    projectId: string,
    history: Omit<FinancialHistory, 'project_id'>[]
  ): Promise<FinancialHistory[]> {
    // Supprimer l'historique existant
    await this.supabase
      .from('financial_history')
      .delete()
      .eq('project_id', projectId)

    // Insérer le nouvel historique
    const historyWithProjectId = history.map(h => ({
      ...h,
      project_id: projectId
    }))

    const { data, error } = await this.supabase
      .from('financial_history')
      .insert(historyWithProjectId)
      .select()

    if (error) throw error
    return data || []
  }

  async getFinancialHistory(projectId: string): Promise<FinancialHistory[]> {
    const { data, error } = await this.supabase
      .from('financial_history')
      .select('*')
      .eq('project_id', projectId)
      .order('year')

    if (error) throw error
    return data || []
  }

  // Gestion de l'analyse sectorielle
  async saveSectorAnalysis(analysis: SectorAnalysis): Promise<SectorAnalysis> {
    const { data, error } = await this.supabase
      .from('sector_analyses')
      .upsert(analysis)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getSectorAnalysis(projectId: string): Promise<SectorAnalysis | null> {
    const { data, error } = await this.supabase
      .from('sector_analyses')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Génération IA contextuelle
  async prepareSectionForAI(
    sectionId: string,
    projectData: Record<string, any>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('prepare_section_for_ai_generation', {
        p_section_id: sectionId,
        p_project_data: projectData
      })

    if (error) throw error
    return data
  }

  // Sections étendues
  async getProjectSections(projectId: string) {
    const { data, error } = await this.supabase
      .from('business_plan_sections')
      .select(`
        *,
        template:document_templates(name, sector, mode)
      `)
      .eq('project_id', projectId)
      .order('order_index')

    if (error) throw error
    return data || []
  }

  async updateSectionOrder(sectionId: string, newOrder: number): Promise<void> {
    const { error } = await this.supabase
      .from('business_plan_sections')
      .update({ order_index: newOrder })
      .eq('id', sectionId)

    if (error) throw error
  }

  // Secteurs disponibles
  async getAvailableSectors(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('document_templates')
      .select('sector')
      .order('sector')

    if (error) throw error

    const sectors = [...new Set(data?.map(d => d.sector) || [])]
    return sectors
  }
}

export const documentTemplateService = new DocumentTemplateService()