export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          legal_form: string | null
          country: string
          currency: string
          tax_profile: any
          contacts: any
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          legal_form?: string | null
          country?: string
          currency?: string
          tax_profile?: any
          contacts?: any
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          legal_form?: string | null
          country?: string
          currency?: string
          tax_profile?: any
          contacts?: any
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          sector: string
          size: 'TPE' | 'PME' | 'ETI' | 'GE'
          mode: 'simple' | 'advanced'
          start_date: string
          horizon_years: number
          status: 'draft' | 'active' | 'validated' | 'archived'
          scenario_set_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          sector: string
          size: 'TPE' | 'PME' | 'ETI' | 'GE'
          mode?: 'simple' | 'advanced'
          start_date: string
          horizon_years?: number
          status?: 'draft' | 'active' | 'validated' | 'archived'
          scenario_set_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          sector?: string
          size?: 'TPE' | 'PME' | 'ETI' | 'GE'
          mode?: 'simple' | 'advanced'
          start_date?: string
          horizon_years?: number
          status?: 'draft' | 'active' | 'validated' | 'archived'
          scenario_set_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products_services: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          category: string | null
          unit: string
          revenue_model: 'unitaire' | 'abonnement' | 'm2' | 'forfait' | 'licence'
          price: number
          vat_rate: number
          cogs_unit: number
          bom: any
          seasonality: number[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          category?: string | null
          unit: string
          revenue_model: 'unitaire' | 'abonnement' | 'm2' | 'forfait' | 'licence'
          price: number
          vat_rate?: number
          cogs_unit?: number
          bom?: any
          seasonality?: number[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          category?: string | null
          unit?: string
          revenue_model?: 'unitaire' | 'abonnement' | 'm2' | 'forfait' | 'licence'
          price?: number
          vat_rate?: number
          cogs_unit?: number
          bom?: any
          seasonality?: number[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sales_projections: {
        Row: {
          id: string
          project_id: string
          product_service_id: string
          year: number
          month: number
          volume: number
          price: number
          revenue: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          product_service_id: string
          year: number
          month: number
          volume?: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          product_service_id?: string
          year?: number
          month?: number
          volume?: number
          price?: number
          created_at?: string
        }
      }
      capex: {
        Row: {
          id: string
          project_id: string
          label: string
          category: string
          amount: number
          date: string
          life_months: number
          method: 'linear' | 'degressive'
          salvage_value: number
          vat_rate: number
          vat_recoverable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          label: string
          category: string
          amount: number
          date: string
          life_months: number
          method?: 'linear' | 'degressive'
          salvage_value?: number
          vat_rate?: number
          vat_recoverable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          label?: string
          category?: string
          amount?: number
          date?: string
          life_months?: number
          method?: 'linear' | 'degressive'
          salvage_value?: number
          vat_rate?: number
          vat_recoverable?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          project_id: string
          lender: string
          loan_type: 'bank_loan' | 'bond' | 'equity' | 'grant'
          principal: number
          rate: number
          term_months: number
          grace_principal: number
          grace_interest: number
          fees_pct: number
          insurance_pct: number
          balloon_pct: number
          disbursement_date: string
          covenant_dscr: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          lender: string
          loan_type: 'bank_loan' | 'bond' | 'equity' | 'grant'
          principal: number
          rate: number
          term_months: number
          grace_principal?: number
          grace_interest?: number
          fees_pct?: number
          insurance_pct?: number
          balloon_pct?: number
          disbursement_date: string
          covenant_dscr?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          lender?: string
          loan_type?: 'bank_loan' | 'bond' | 'equity' | 'grant'
          principal?: number
          rate?: number
          term_months?: number
          grace_principal?: number
          grace_interest?: number
          fees_pct?: number
          insurance_pct?: number
          balloon_pct?: number
          disbursement_date?: string
          covenant_dscr?: number
          created_at?: string
          updated_at?: string
        }
      }
      financial_outputs: {
        Row: {
          id: string
          project_id: string
          scenario_id: string | null
          year: number
          month: number
          revenue: number
          cogs: number
          gross_profit: number
          opex_total: number
          ebitda: number
          depreciation: number
          ebit: number
          interest_expense: number
          taxes: number
          net_income: number
          operating_cash_flow: number
          investing_cash_flow: number
          financing_cash_flow: number
          net_cash_flow: number
          cash_balance: number
          bfr: number
          bfr_change: number
          gross_margin: number
          ebitda_margin: number
          net_margin: number
          roa: number
          roe: number
          current_ratio: number
          debt_to_equity: number
          dscr: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scenario_id?: string | null
          year: number
          month: number
          revenue?: number
          cogs?: number
          gross_profit?: number
          opex_total?: number
          ebitda?: number
          depreciation?: number
          ebit?: number
          interest_expense?: number
          taxes?: number
          net_income?: number
          operating_cash_flow?: number
          investing_cash_flow?: number
          financing_cash_flow?: number
          net_cash_flow?: number
          cash_balance?: number
          bfr?: number
          bfr_change?: number
          gross_margin?: number
          ebitda_margin?: number
          net_margin?: number
          roa?: number
          roe?: number
          current_ratio?: number
          debt_to_equity?: number
          dscr?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scenario_id?: string | null
          year?: number
          month?: number
          revenue?: number
          cogs?: number
          gross_profit?: number
          opex_total?: number
          ebitda?: number
          depreciation?: number
          ebit?: number
          interest_expense?: number
          taxes?: number
          net_income?: number
          operating_cash_flow?: number
          investing_cash_flow?: number
          financing_cash_flow?: number
          net_cash_flow?: number
          cash_balance?: number
          bfr?: number
          bfr_change?: number
          gross_margin?: number
          ebitda_margin?: number
          net_margin?: number
          roa?: number
          roe?: number
          current_ratio?: number
          debt_to_equity?: number
          dscr?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProductService = Database['public']['Tables']['products_services']['Row']
export type SalesProjection = Database['public']['Tables']['sales_projections']['Row']
export type Capex = Database['public']['Tables']['capex']['Row']
export type Loan = Database['public']['Tables']['loans']['Row']
export type FinancialOutput = Database['public']['Tables']['financial_outputs']['Row']

export type InsertOrganization = Database['public']['Tables']['organizations']['Insert']
export type InsertProject = Database['public']['Tables']['projects']['Insert']
export type InsertProductService = Database['public']['Tables']['products_services']['Insert']
export type InsertCapex = Database['public']['Tables']['capex']['Insert']
export type InsertLoan = Database['public']['Tables']['loans']['Insert']