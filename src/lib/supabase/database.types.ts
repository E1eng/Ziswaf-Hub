export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allocations: {
        Row: {
          allocated_at: string | null
          amount: number
          assessment_id: string
          batch_id: string | null
          created_at: string | null
          duplicate_overridden_by: string | null
          duplicate_override: boolean
          duplicate_reason: string | null
          id: string
          program_id: string
          status: string
        }
        Insert: {
          allocated_at?: string | null
          amount: number
          assessment_id: string
          batch_id?: string | null
          created_at?: string | null
          duplicate_overridden_by?: string | null
          duplicate_override?: boolean
          duplicate_reason?: string | null
          id?: string
          program_id: string
          status?: string
        }
        Update: {
          allocated_at?: string | null
          amount?: number
          assessment_id?: string
          batch_id?: string | null
          created_at?: string | null
          duplicate_overridden_by?: string | null
          duplicate_override?: boolean
          duplicate_reason?: string | null
          id?: string
          program_id?: string
          status?: string
        }
        Relationships: [
          { foreignKeyName: "allocations_assessment_id_fkey"; columns: ["assessment_id"]; isOneToOne: false; referencedRelation: "mustahik_assessments"; referencedColumns: ["id"] },
          { foreignKeyName: "allocations_batch_id_fkey"; columns: ["batch_id"]; isOneToOne: false; referencedRelation: "disbursement_batches"; referencedColumns: ["id"] },
          { foreignKeyName: "allocations_program_id_fkey"; columns: ["program_id"]; isOneToOne: false; referencedRelation: "programs"; referencedColumns: ["id"] }
        ]
      }
      asnaf_categories: {
        Row: { code: string; description: string | null; id: string; name: string; name_arabic: string | null; quran_reference: string | null; sort_order: number }
        Insert: { code: string; description?: string | null; id?: string; name: string; name_arabic?: string | null; quran_reference?: string | null; sort_order?: number }
        Update: { code?: string; description?: string | null; id?: string; name?: string; name_arabic?: string | null; quran_reference?: string | null; sort_order?: number }
        Relationships: []
      }
      assistance_log: {
        Row: {
          allocation_id: string | null
          amount: number
          assistance_type: string
          batch_id: string
          created_at: string | null
          fund_type: string
          id: string
          institution_id: string
          mustahik_id: string
          period_end: string
          period_start: string
          program_id: string | null
        }
        Insert: {
          allocation_id?: string | null
          amount: number
          assistance_type: string
          batch_id: string
          created_at?: string | null
          fund_type: string
          id?: string
          institution_id: string
          mustahik_id: string
          period_end: string
          period_start: string
          program_id?: string | null
        }
        Update: {
          allocation_id?: string | null
          amount?: number
          assistance_type?: string
          batch_id?: string
          created_at?: string | null
          fund_type?: string
          id?: string
          institution_id?: string
          mustahik_id?: string
          period_end?: string
          period_start?: string
          program_id?: string | null
        }
        Relationships: []
      }
      audit_ledger: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          institution_id: string | null
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          institution_id?: string | null
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          institution_id?: string | null
          payload?: Json
        }
        Relationships: []
      }
      disbursement_batches: {
        Row: {
          batch_code: string
          beneficiary_count: number
          created_at: string | null
          disbursed_at: string | null
          fund_type: string
          id: string
          institution_id: string | null
          kecamatan_summary: Json | null
          notes: string | null
          program_id: string | null
          received_at: string | null
          status: string
          total_amount: number
          verified_at: string | null
        }
        Insert: {
          batch_code: string
          beneficiary_count?: number
          created_at?: string | null
          disbursed_at?: string | null
          fund_type: string
          id?: string
          institution_id?: string | null
          kecamatan_summary?: Json | null
          notes?: string | null
          program_id?: string | null
          received_at?: string | null
          status?: string
          total_amount?: number
          verified_at?: string | null
        }
        Update: {
          batch_code?: string
          beneficiary_count?: number
          created_at?: string | null
          disbursed_at?: string | null
          fund_type?: string
          id?: string
          institution_id?: string | null
          kecamatan_summary?: Json | null
          notes?: string | null
          program_id?: string | null
          received_at?: string | null
          status?: string
          total_amount?: number
          verified_at?: string | null
        }
        Relationships: []
      }
      distribution_sectors: {
        Row: { code: string; description: string | null; id: string; name: string; sort_order: number | null; type: string }
        Insert: { code: string; description?: string | null; id?: string; name: string; sort_order?: number | null; type: string }
        Update: { code?: string; description?: string | null; id?: string; name?: string; sort_order?: number | null; type?: string }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          channel: string | null
          created_at: string | null
          donation_code: string
          donor_email: string | null
          donor_name: string | null
          donor_phone: string | null
          email_error: string | null
          email_sent_at: string | null
          fund_type: string
          id: string
          institution_id: string
          is_anonymous: boolean
          notes: string | null
          received_at: string | null
          recorded_by: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          channel?: string | null
          created_at?: string | null
          donation_code: string
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          email_error?: string | null
          email_sent_at?: string | null
          fund_type: string
          id?: string
          institution_id: string
          is_anonymous?: boolean
          notes?: string | null
          received_at?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          channel?: string | null
          created_at?: string | null
          donation_code?: string
          donor_email?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          email_error?: string | null
          email_sent_at?: string | null
          fund_type?: string
          id?: string
          institution_id?: string
          is_anonymous?: boolean
          notes?: string | null
          received_at?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      field_workers: {
        Row: {
          activated_at: string | null
          created_at: string | null
          full_name: string
          id: string
          institution_id: string
          invite_code: string | null
          invite_expires_at: string | null
          invited_by: string | null
          last_active_at: string | null
          phone: string | null
          status: string
          telegram_chat_id: number | null
          telegram_username: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          institution_id: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
          phone?: string | null
          status?: string
          telegram_chat_id?: number | null
          telegram_username?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          institution_id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
          phone?: string | null
          status?: string
          telegram_chat_id?: number | null
          telegram_username?: string | null
        }
        Relationships: []
      }
      institution_types: {
        Row: { code: string; description: string | null; id: string; name: string }
        Insert: { code: string; description?: string | null; id?: string; name: string }
        Update: { code?: string; description?: string | null; id?: string; name?: string }
        Relationships: []
      }
      institution_users: {
        Row: { created_at: string | null; id: string; institution_id: string; role: string; user_id: string }
        Insert: { created_at?: string | null; id?: string; institution_id: string; role: string; user_id: string }
        Update: { created_at?: string | null; id?: string; institution_id?: string; role?: string; user_id?: string }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
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
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
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
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
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
        Relationships: []
      }
      mustahik_assessments: {
        Row: {
          asnaf_category: string
          created_at: string | null
          estimated_amount: number
          field_verified_at: string | null
          field_verified_by: string | null
          field_worker_id: string | null
          id: string
          institution_id: string
          metrics: Json
          mustahik_id: string
          priority_score: number
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          asnaf_category: string
          created_at?: string | null
          estimated_amount?: number
          field_verified_at?: string | null
          field_verified_by?: string | null
          field_worker_id?: string | null
          id?: string
          institution_id: string
          metrics?: Json
          mustahik_id: string
          priority_score?: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          asnaf_category?: string
          created_at?: string | null
          estimated_amount?: number
          field_verified_at?: string | null
          field_verified_by?: string | null
          field_worker_id?: string | null
          id?: string
          institution_id?: string
          metrics?: Json
          mustahik_id?: string
          priority_score?: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mustahik_registry: {
        Row: {
          address: string | null
          created_at: string | null
          first_registered_by_institution_id: string | null
          full_name: string
          id: string
          kecamatan_id: string | null
          lifecycle_changed_at: string | null
          lifecycle_changed_by: string | null
          lifecycle_reason: string | null
          lifecycle_status: string
          nik: string
          pdp_consent_at: string | null
          pdp_consent_collected_by_institution_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          first_registered_by_institution_id?: string | null
          full_name: string
          id?: string
          kecamatan_id?: string | null
          lifecycle_changed_at?: string | null
          lifecycle_changed_by?: string | null
          lifecycle_reason?: string | null
          lifecycle_status?: string
          nik: string
          pdp_consent_at?: string | null
          pdp_consent_collected_by_institution_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          first_registered_by_institution_id?: string | null
          full_name?: string
          id?: string
          kecamatan_id?: string | null
          lifecycle_changed_at?: string | null
          lifecycle_changed_by?: string | null
          lifecycle_reason?: string | null
          lifecycle_status?: string
          nik?: string
          pdp_consent_at?: string | null
          pdp_consent_collected_by_institution_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          assistance_type: string
          beneficiary_target: number | null
          budget: number
          created_at: string | null
          description: string | null
          fund_type: string
          id: string
          institution_id: string
          name: string
          period_end: string
          period_start: string
          program_type: string
          sector: string | null
          status: string
          target_asnaf: string[]
          updated_at: string | null
        }
        Insert: {
          assistance_type: string
          beneficiary_target?: number | null
          budget?: number
          created_at?: string | null
          description?: string | null
          fund_type: string
          id?: string
          institution_id: string
          name: string
          period_end: string
          period_start: string
          program_type?: string
          sector?: string | null
          status?: string
          target_asnaf?: string[]
          updated_at?: string | null
        }
        Update: {
          assistance_type?: string
          beneficiary_target?: number | null
          budget?: number
          created_at?: string | null
          description?: string | null
          fund_type?: string
          id?: string
          institution_id?: string
          name?: string
          period_end?: string
          period_start?: string
          program_type?: string
          sector?: string | null
          status?: string
          target_asnaf?: string[]
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      ziswaf_categories: {
        Row: { category: string; description: string | null; id: string; is_mandatory: boolean | null; name: string; sort_order: number | null; subcategory: string }
        Insert: { category: string; description?: string | null; id?: string; is_mandatory?: boolean | null; name: string; sort_order?: number | null; subcategory: string }
        Update: { category?: string; description?: string | null; id?: string; is_mandatory?: boolean | null; name?: string; sort_order?: number | null; subcategory?: string }
        Relationships: []
      }
    }
    Views: {
      fund_pool_view: {
        Row: {
          balance: number | null
          disbursement_pct: number | null
          fund_type: string | null
          institution_id: string | null
          total_disbursed: number | null
          total_donated: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_priority_score: {
        Args: { p_assessment_id: string }
        Returns: number
      }
      check_dedup: {
        Args: {
          p_assistance_type: string
          p_mustahik_ids: string[]
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          mustahik_id: string
          source_amount: number
          source_assistance_type: string
          source_batch_code: string
          source_batch_id: string
          source_institution_id: string
          source_institution_name: string
          source_period_end: string
          source_period_start: string
        }[]
      }
      generate_batch_code: { Args: never; Returns: string }
      generate_donation_code: { Args: never; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      has_role_in_institution: {
        Args: { p_institution_id: string; p_min_role: string }
        Returns: boolean
      }
      is_member_of_institution: {
        Args: { p_institution_id: string }
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
