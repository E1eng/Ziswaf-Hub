export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      mustahik_proposals: {
        Row: {
          id: string
          nik: string
          full_name: string
          kecamatan_id: string | null
          asnaf_category: string
          metrics: Json
          priority_score: number
          allocated_amount: number
          status: string
          disbursement_batch_id: string | null
          source: string | null
          submitted_at: string | null
          reviewed_at: string | null
          disbursed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nik: string
          full_name: string
          kecamatan_id?: string | null
          asnaf_category: string
          metrics?: Json
          priority_score?: number
          allocated_amount?: number
          status?: string
          disbursement_batch_id?: string | null
          source?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          disbursed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nik?: string
          full_name?: string
          kecamatan_id?: string | null
          asnaf_category?: string
          metrics?: Json
          priority_score?: number
          allocated_amount?: number
          status?: string
          disbursement_batch_id?: string | null
          source?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          disbursed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          institution_id: string
          region_id: string
          ziswaf_category_id: string
          year: number
          month: number | null
          amount: number
          donor_count: number | null
          donor_source: string | null
          collection_channel: string | null
          is_off_balance_sheet: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          institution_id: string
          region_id: string
          ziswaf_category_id: string
          year: number
          month?: number | null
          amount?: number
          donor_count?: number | null
          donor_source?: string | null
          collection_channel?: string | null
          is_off_balance_sheet?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          institution_id?: string
          region_id?: string
          ziswaf_category_id?: string
          year?: number
          month?: number | null
          amount?: number
          donor_count?: number | null
          donor_source?: string | null
          collection_channel?: string | null
          is_off_balance_sheet?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      distributions: {
        Row: {
          id: string
          institution_id: string
          region_id: string
          sector_id: string
          program_id: string | null
          asnaf_category_id: string | null
          year: number
          month: number | null
          amount: number
          beneficiary_count: number | null
          distribution_type: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          institution_id: string
          region_id: string
          sector_id: string
          program_id?: string | null
          asnaf_category_id?: string | null
          year: number
          month?: number | null
          amount?: number
          beneficiary_count?: number | null
          distribution_type?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          institution_id?: string
          region_id?: string
          sector_id?: string
          program_id?: string | null
          asnaf_category_id?: string | null
          year?: number
          month?: number | null
          amount?: number
          beneficiary_count?: number | null
          distribution_type?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          id: string
          name: string
          institution_type_id: string
          level: string
          region_id: string | null
          license_number: string | null
          established_year: number | null
          status: string | null
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          institution_type_id: string
          level: string
          region_id?: string | null
          license_number?: string | null
          established_year?: number | null
          status?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          institution_type_id?: string
          level?: string
          region_id?: string | null
          license_number?: string | null
          established_year?: number | null
          status?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      institution_types: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          id: string
          name: string
          type: string
          parent_id: string | null
          code: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          parent_id?: string | null
          code?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          parent_id?: string | null
          code?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ziswaf_categories: {
        Row: {
          id: string
          name: string
          category: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          category: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          category?: string
          sort_order?: number
        }
        Relationships: []
      }
      distribution_sectors: {
        Row: {
          id: string
          name: string
          code: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          code: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          code?: string
          sort_order?: number
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          institution_id: string | null
          name: string
          program_type: string
          target_asnaf: string[]
          sector: string | null
          budget: number
          period: string | null
          beneficiary_target: number
          description: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          institution_id?: string | null
          name: string
          program_type: string
          target_asnaf?: string[]
          sector?: string | null
          budget?: number
          period?: string | null
          beneficiary_target?: number
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          institution_id?: string | null
          name?: string
          program_type?: string
          target_asnaf?: string[]
          sector?: string | null
          budget?: number
          period?: string | null
          beneficiary_target?: number
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_beneficiaries: {
        Row: {
          id: string
          program_id: string
          disbursement_batch_id: string | null
          nik: string
          full_name: string
          asnaf_category: string
          amount: number
          status: string
          duplicate_note: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          program_id: string
          disbursement_batch_id?: string | null
          nik: string
          full_name: string
          asnaf_category: string
          amount?: number
          status?: string
          duplicate_note?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          program_id?: string
          disbursement_batch_id?: string | null
          nik?: string
          full_name?: string
          asnaf_category?: string
          amount?: number
          status?: string
          duplicate_note?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      disbursement_batches: {
        Row: {
          id: string
          batch_code: string
          total_amount: number
          beneficiary_count: number
          fund_type: string
          status: string
          kecamatan_summary: Json | null
          notes: string | null
          verified_at: string | null
          disbursed_at: string | null
          received_at: string | null
          program_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          batch_code: string
          total_amount?: number
          beneficiary_count?: number
          fund_type: string
          status?: string
          kecamatan_summary?: Json | null
          notes?: string | null
          verified_at?: string | null
          disbursed_at?: string | null
          received_at?: string | null
          program_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          batch_code?: string
          total_amount?: number
          beneficiary_count?: number
          fund_type?: string
          status?: string
          kecamatan_summary?: Json | null
          notes?: string | null
          verified_at?: string | null
          disbursed_at?: string | null
          received_at?: string | null
          program_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      audit_ledger: {
        Row: {
          id: string
          institution_id: string
          transaction_type: string
          fund_type: string
          amount: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          transaction_type: string
          fund_type: string
          amount: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          transaction_type?: string
          fund_type?: string
          amount?: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_collection_by_region_year: {
        Row: Record<string, any>
        Relationships: []
      }
      mv_distribution_by_region_year: {
        Row: Record<string, any>
        Relationships: []
      }
      mv_gap_analysis: {
        Row: Record<string, any>
        Relationships: []
      }
      mv_wakaf_summary_by_province: {
        Row: Record<string, any>
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}