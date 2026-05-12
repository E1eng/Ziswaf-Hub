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
            referencedRelation: "regions"
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
            referencedRelation: "regions"
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
          total_amount: number | null
          total_donors: number | null
          month: number | null
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
        Relationships: []
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
      refresh_all_materialized_views: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName] extends {
  Update: infer U
}
  ? U
  : never
