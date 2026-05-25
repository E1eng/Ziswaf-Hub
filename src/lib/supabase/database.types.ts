export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allocation_plan_items: {
        Row: {
          actual_amount: number | null
          actual_beneficiaries: number | null
          allocated_amount: number
          confirmed_at: string | null
          created_at: string | null
          distributed_at: string | null
          est_beneficiaries: number
          id: string
          plan_id: string
          priority_rank: number | null
          program_template_id: string
          region_id: string
          status: string | null
        }
        Insert: {
          actual_amount?: number | null
          actual_beneficiaries?: number | null
          allocated_amount: number
          confirmed_at?: string | null
          created_at?: string | null
          distributed_at?: string | null
          est_beneficiaries?: number
          id?: string
          plan_id: string
          priority_rank?: number | null
          program_template_id: string
          region_id: string
          status?: string | null
        }
        Update: {
          actual_amount?: number | null
          actual_beneficiaries?: number | null
          allocated_amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          distributed_at?: string | null
          est_beneficiaries?: number
          id?: string
          plan_id?: string
          priority_rank?: number | null
          program_template_id?: string
          region_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allocation_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "allocation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocation_plan_items_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocation_plan_items_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "allocation_plan_items_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "allocation_plan_items_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "allocation_plan_items_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      allocation_plans: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          name: string
          preferences: Json | null
          quarter: number | null
          status: string
          total_budget: number
          total_est_beneficiaries: number | null
          total_kecamatan: number | null
          total_programs: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          name: string
          preferences?: Json | null
          quarter?: number | null
          status?: string
          total_budget: number
          total_est_beneficiaries?: number | null
          total_kecamatan?: number | null
          total_programs?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          name?: string
          preferences?: Json | null
          quarter?: number | null
          status?: string
          total_budget?: number
          total_est_beneficiaries?: number | null
          total_kecamatan?: number | null
          total_programs?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "allocation_plans_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      asnaf_categories: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
          name_arabic: string | null
          quran_reference: string | null
          sort_order: number
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
          name_arabic?: string | null
          quran_reference?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
          name_arabic?: string | null
          quran_reference?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      audit_ledger: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          fund_type: string
          id: string
          institution_id: string
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          fund_type: string
          id?: string
          institution_id: string
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          fund_type?: string
          id?: string
          institution_id?: string
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_ledger_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bps_indicators: {
        Row: {
          created_at: string | null
          gini_ratio: number | null
          id: string
          ipm: number | null
          muslim_population_pct: number | null
          pdrb: number | null
          pdrb_per_capita: number | null
          population: number | null
          poverty_count: number | null
          poverty_depth_index: number | null
          poverty_line: number | null
          poverty_rate: number | null
          poverty_severity_index: number | null
          region_id: string
          unemployment_rate: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          gini_ratio?: number | null
          id?: string
          ipm?: number | null
          muslim_population_pct?: number | null
          pdrb?: number | null
          pdrb_per_capita?: number | null
          population?: number | null
          poverty_count?: number | null
          poverty_depth_index?: number | null
          poverty_line?: number | null
          poverty_rate?: number | null
          poverty_severity_index?: number | null
          region_id: string
          unemployment_rate?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          gini_ratio?: number | null
          id?: string
          ipm?: number | null
          muslim_population_pct?: number | null
          pdrb?: number | null
          pdrb_per_capita?: number | null
          population?: number | null
          poverty_count?: number | null
          poverty_depth_index?: number | null
          poverty_line?: number | null
          poverty_rate?: number | null
          poverty_severity_index?: number | null
          region_id?: string
          unemployment_rate?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "bps_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "bps_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "bps_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "bps_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          amount: number
          collection_channel: string | null
          created_at: string | null
          donor_count: number | null
          donor_source: string | null
          id: string
          institution_id: string
          is_off_balance_sheet: boolean | null
          month: number | null
          notes: string | null
          region_id: string
          updated_at: string | null
          year: number
          ziswaf_category_id: string
        }
        Insert: {
          amount?: number
          collection_channel?: string | null
          created_at?: string | null
          donor_count?: number | null
          donor_source?: string | null
          id?: string
          institution_id: string
          is_off_balance_sheet?: boolean | null
          month?: number | null
          notes?: string | null
          region_id: string
          updated_at?: string | null
          year: number
          ziswaf_category_id: string
        }
        Update: {
          amount?: number
          collection_channel?: string | null
          created_at?: string | null
          donor_count?: number | null
          donor_source?: string | null
          id?: string
          institution_id?: string
          is_off_balance_sheet?: boolean | null
          month?: number | null
          notes?: string | null
          region_id?: string
          updated_at?: string | null
          year?: number
          ziswaf_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "collections_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "collections_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "collections_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_ziswaf_category_id_fkey"
            columns: ["ziswaf_category_id"]
            isOneToOne: false
            referencedRelation: "ziswaf_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_sectors: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      distributions: {
        Row: {
          amount: number
          asnaf_category_id: string | null
          beneficiary_count: number | null
          created_at: string | null
          distribution_type: string | null
          id: string
          institution_id: string
          month: number | null
          notes: string | null
          program_id: string | null
          region_id: string
          sector_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          amount?: number
          asnaf_category_id?: string | null
          beneficiary_count?: number | null
          created_at?: string | null
          distribution_type?: string | null
          id?: string
          institution_id: string
          month?: number | null
          notes?: string | null
          program_id?: string | null
          region_id: string
          sector_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number
          asnaf_category_id?: string | null
          beneficiary_count?: number | null
          created_at?: string | null
          distribution_type?: string | null
          id?: string
          institution_id?: string
          month?: number | null
          notes?: string | null
          program_id?: string | null
          region_id?: string
          sector_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "distributions_asnaf_category_id_fkey"
            columns: ["asnaf_category_id"]
            isOneToOne: false
            referencedRelation: "asnaf_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "distributions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "distributions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "distributions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "distribution_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_batches: {
        Row: {
          allocated_at: string | null
          batch_code: string
          beneficiary_count: number | null
          collected_at: string | null
          confirmed_at: string | null
          created_at: string | null
          description: string | null
          distributed_at: string | null
          donor_count: number
          id: string
          institution_id: string
          institution_name: string | null
          program_name: string | null
          program_template_id: string | null
          region_id: string | null
          region_name: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          allocated_at?: string | null
          batch_code: string
          beneficiary_count?: number | null
          collected_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          description?: string | null
          distributed_at?: string | null
          donor_count?: number
          id?: string
          institution_id: string
          institution_name?: string | null
          program_name?: string | null
          program_template_id?: string | null
          region_id?: string | null
          region_name?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          allocated_at?: string | null
          batch_code?: string
          beneficiary_count?: number | null
          collected_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          description?: string | null
          distributed_at?: string | null
          donor_count?: number
          id?: string
          institution_id?: string
          institution_name?: string | null
          program_name?: string | null
          program_template_id?: string | null
          region_id?: string | null
          region_name?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_batches_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_batches_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_batches_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "donation_batches_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "donation_batches_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "donation_batches_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_integrations: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          institution_id: string
          is_active: boolean
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          credentials?: Json
          id?: string
          institution_id: string
          is_active?: boolean
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          institution_id?: string
          is_active?: boolean
          provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_integrations_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_types: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          established_year: number | null
          id: string
          institution_type_id: string
          level: string
          license_number: string | null
          name: string
          phone: string | null
          region_id: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          established_year?: number | null
          id?: string
          institution_type_id: string
          level: string
          license_number?: string | null
          name: string
          phone?: string | null
          region_id?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          established_year?: number | null
          id?: string
          institution_type_id?: string
          level?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          region_id?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_institution_type_id_fkey"
            columns: ["institution_type_id"]
            isOneToOne: false
            referencedRelation: "institution_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "institutions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "institutions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "institutions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      kecamatan_indicators: {
        Row: {
          coverage_gap_score: number | null
          created_at: string | null
          est_fakir: number | null
          est_fisabilillah: number | null
          est_gharimin: number | null
          est_ibnu_sabil: number | null
          est_miskin: number | null
          est_mualaf: number | null
          est_riqab: number | null
          gini_ratio: number | null
          health_facility_count: number | null
          id: string
          ipm: number | null
          literacy_rate: number | null
          muslim_population_pct: number | null
          pesantren_count: number | null
          population: number | null
          poverty_count: number | null
          poverty_rate: number | null
          priority_score: number | null
          programs_active: number | null
          region_id: string
          school_count: number | null
          stunting_rate: number | null
          total_ziswaf_received: number | null
          unemployment_rate: number | null
          updated_at: string | null
          year: number
          ziswaf_per_capita: number | null
        }
        Insert: {
          coverage_gap_score?: number | null
          created_at?: string | null
          est_fakir?: number | null
          est_fisabilillah?: number | null
          est_gharimin?: number | null
          est_ibnu_sabil?: number | null
          est_miskin?: number | null
          est_mualaf?: number | null
          est_riqab?: number | null
          gini_ratio?: number | null
          health_facility_count?: number | null
          id?: string
          ipm?: number | null
          literacy_rate?: number | null
          muslim_population_pct?: number | null
          pesantren_count?: number | null
          population?: number | null
          poverty_count?: number | null
          poverty_rate?: number | null
          priority_score?: number | null
          programs_active?: number | null
          region_id: string
          school_count?: number | null
          stunting_rate?: number | null
          total_ziswaf_received?: number | null
          unemployment_rate?: number | null
          updated_at?: string | null
          year: number
          ziswaf_per_capita?: number | null
        }
        Update: {
          coverage_gap_score?: number | null
          created_at?: string | null
          est_fakir?: number | null
          est_fisabilillah?: number | null
          est_gharimin?: number | null
          est_ibnu_sabil?: number | null
          est_miskin?: number | null
          est_mualaf?: number | null
          est_riqab?: number | null
          gini_ratio?: number | null
          health_facility_count?: number | null
          id?: string
          ipm?: number | null
          literacy_rate?: number | null
          muslim_population_pct?: number | null
          pesantren_count?: number | null
          population?: number | null
          poverty_count?: number | null
          poverty_rate?: number | null
          priority_score?: number | null
          programs_active?: number | null
          region_id?: string
          school_count?: number | null
          stunting_rate?: number | null
          total_ziswaf_received?: number | null
          unemployment_rate?: number | null
          updated_at?: string | null
          year?: number
          ziswaf_per_capita?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kecamatan_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "kecamatan_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "kecamatan_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "kecamatan_indicators_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          avg_cost_per_beneficiary: number
          created_at: string | null
          description: string | null
          duration_months: number | null
          id: string
          is_active: boolean | null
          min_budget: number | null
          name: string
          sector_id: string | null
          sort_order: number | null
          target_asnaf: string[]
        }
        Insert: {
          avg_cost_per_beneficiary: number
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          min_budget?: number | null
          name: string
          sector_id?: string | null
          sort_order?: number | null
          target_asnaf: string[]
        }
        Update: {
          avg_cost_per_beneficiary?: number
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          min_budget?: number | null
          name?: string
          sector_id?: string | null
          sort_order?: number | null
          target_asnaf?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "program_templates_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "distribution_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          sector_id: string
          status: string | null
          target_beneficiary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sector_id: string
          status?: string | null
          target_beneficiary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sector_id?: string
          status?: string | null
          target_beneficiary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "distribution_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          bps_code: string
          created_at: string | null
          id: string
          island: string | null
          latitude: number | null
          longitude: number | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          bps_code: string
          created_at?: string | null
          id?: string
          island?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          bps_code?: string
          created_at?: string | null
          id?: string
          island?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      treasury_balances: {
        Row: {
          id: string
          infaq_balance: number
          institution_id: string
          last_updated: string
          wakaf_balance: number
          zakat_balance: number
        }
        Insert: {
          id?: string
          infaq_balance?: number
          institution_id: string
          last_updated?: string
          wakaf_balance?: number
          zakat_balance?: number
        }
        Update: {
          id?: string
          infaq_balance?: number
          institution_id?: string
          last_updated?: string
          wakaf_balance?: number
          zakat_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "treasury_balances_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: true
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      wakaf_asset_types: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      wakaf_assets: {
        Row: {
          address: string | null
          area_hectares: number | null
          asset_type_id: string
          certificate_number: string | null
          created_at: string | null
          estimated_value: number | null
          id: string
          is_certified: boolean | null
          is_productive: boolean | null
          latitude: number | null
          longitude: number | null
          nazhir_institution_id: string | null
          notes: string | null
          region_id: string
          status: string | null
          updated_at: string | null
          utilization_type_id: string | null
          year_registered: number | null
        }
        Insert: {
          address?: string | null
          area_hectares?: number | null
          asset_type_id: string
          certificate_number?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          is_certified?: boolean | null
          is_productive?: boolean | null
          latitude?: number | null
          longitude?: number | null
          nazhir_institution_id?: string | null
          notes?: string | null
          region_id: string
          status?: string | null
          updated_at?: string | null
          utilization_type_id?: string | null
          year_registered?: number | null
        }
        Update: {
          address?: string | null
          area_hectares?: number | null
          asset_type_id?: string
          certificate_number?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          is_certified?: boolean | null
          is_productive?: boolean | null
          latitude?: number | null
          longitude?: number | null
          nazhir_institution_id?: string | null
          notes?: string | null
          region_id?: string
          status?: string | null
          updated_at?: string | null
          utilization_type_id?: string | null
          year_registered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wakaf_assets_asset_type_id_fkey"
            columns: ["asset_type_id"]
            isOneToOne: false
            referencedRelation: "wakaf_asset_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wakaf_assets_nazhir_institution_id_fkey"
            columns: ["nazhir_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wakaf_assets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "wakaf_assets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "wakaf_assets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "wakaf_assets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wakaf_assets_utilization_type_id_fkey"
            columns: ["utilization_type_id"]
            isOneToOne: false
            referencedRelation: "wakaf_utilization_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wakaf_utilization_types: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      zakat_potential: {
        Row: {
          actual_collection: number | null
          assumptions: Json | null
          created_at: string | null
          estimated_potential: number | null
          gap_amount: number | null
          gap_percentage: number | null
          id: string
          methodology: string | null
          region_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_collection?: number | null
          assumptions?: Json | null
          created_at?: string | null
          estimated_potential?: number | null
          gap_amount?: number | null
          gap_percentage?: number | null
          id?: string
          methodology?: string | null
          region_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_collection?: number | null
          assumptions?: Json | null
          created_at?: string | null
          estimated_potential?: number | null
          gap_amount?: number | null
          gap_percentage?: number | null
          id?: string
          methodology?: string | null
          region_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      ziswaf_categories: {
        Row: {
          category: string
          description: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          sort_order: number | null
          subcategory: string
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          sort_order?: number | null
          subcategory: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          sort_order?: number | null
          subcategory?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      mv_collection_by_region_year: {
        Row: {
          record_count: number | null
          region_id: string | null
          region_name: string | null
          region_type: string | null
          total_amount: number | null
          total_donors: number | null
          year: number | null
          ziswaf_category: string | null
        }
        Relationships: []
      }
      mv_collection_monthly_trend: {
        Row: {
          month: number | null
          total_amount: number | null
          total_donors: number | null
          year: number | null
          ziswaf_category: string | null
        }
        Relationships: []
      }
      mv_distribution_by_region_year: {
        Row: {
          distribution_type: string | null
          record_count: number | null
          region_id: string | null
          region_name: string | null
          region_type: string | null
          sector_code: string | null
          sector_name: string | null
          total_amount: number | null
          total_beneficiaries: number | null
          year: number | null
        }
        Relationships: []
      }
      mv_gap_analysis: {
        Row: {
          actual_collection: number | null
          estimated_potential: number | null
          gap_amount: number | null
          gap_percentage: number | null
          gini_ratio: number | null
          ipm: number | null
          muslim_population_pct: number | null
          population: number | null
          poverty_rate: number | null
          region_id: string | null
          region_name: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_collection_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_distribution_by_region_year"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "mv_wakaf_summary_by_province"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "zakat_potential_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_wakaf_summary_by_province: {
        Row: {
          certified_count: number | null
          productive_count: number | null
          productive_percentage: number | null
          province_name: string | null
          region_id: string | null
          total_area_hectares: number | null
          total_estimated_value: number | null
          total_locations: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_disbursement: {
        Args: {
          p_amount: number
          p_description?: string
          p_fund_type: string
          p_institution_id: string
          p_reference_id: string
        }
        Returns: Json
      }
      refresh_all_materialized_views: { Args: never; Returns: undefined }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
