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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_calls: {
        Row: {
          call_duration_seconds: number | null
          caller_name: string | null
          caller_phone: string | null
          converted_booking_id: string | null
          created_at: string
          id: string
          intent: string | null
          intent_data: Json | null
          salon_id: string
          transcript: string | null
        }
        Insert: {
          call_duration_seconds?: number | null
          caller_name?: string | null
          caller_phone?: string | null
          converted_booking_id?: string | null
          created_at?: string
          id?: string
          intent?: string | null
          intent_data?: Json | null
          salon_id: string
          transcript?: string | null
        }
        Update: {
          call_duration_seconds?: number | null
          caller_name?: string | null
          caller_phone?: string | null
          converted_booking_id?: string | null
          created_at?: string
          id?: string
          intent?: string | null
          intent_data?: Json | null
          salon_id?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_calls_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_calls_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          client_id: string
          client_rating: number | null
          completed_at: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          rating_sent_at: string | null
          salon_id: string
          service_id: string
          service_notes: string | null
          staff_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          tip_amount: number | null
        }
        Insert: {
          client_id: string
          client_rating?: number | null
          completed_at?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          rating_sent_at?: string | null
          salon_id: string
          service_id: string
          service_notes?: string | null
          staff_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          tip_amount?: number | null
        }
        Update: {
          client_id?: string
          client_rating?: number | null
          completed_at?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          rating_sent_at?: string | null
          salon_id?: string
          service_id?: string
          service_notes?: string | null
          staff_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          salon_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          salon_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_records: {
        Row: {
          booking_id: string
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          salon_id: string
          salon_share: number
          staff_id: string
          tech_share: number
          tip_amount: number
          tip_to_salon: number
          tip_to_tech: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          gross_amount: number
          id?: string
          net_amount: number
          salon_id: string
          salon_share: number
          staff_id: string
          tech_share: number
          tip_amount?: number
          tip_to_salon?: number
          tip_to_tech?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          salon_id?: string
          salon_share?: number
          staff_id?: string
          tech_share?: number
          tip_amount?: number
          tip_to_salon?: number
          tip_to_tech?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_status: {
        Row: {
          current_booking_id: string | null
          id: string
          salon_id: string
          staff_id: string
          status: Database["public"]["Enums"]["floor_state"]
          updated_at: string
        }
        Insert: {
          current_booking_id?: string | null
          id?: string
          salon_id: string
          staff_id: string
          status?: Database["public"]["Enums"]["floor_state"]
          updated_at?: string
        }
        Update: {
          current_booking_id?: string | null
          id?: string
          salon_id?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["floor_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_status_current_booking_id_fkey"
            columns: ["current_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_status_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_status_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_alerts: {
        Row: {
          acknowledged_at: string | null
          booking_id: string
          client_phone: string
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          acknowledged_at?: string | null
          booking_id: string
          client_phone: string
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          acknowledged_at?: string | null
          booking_id?: string
          client_phone?: string
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "owner_alerts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      salons: {
        Row: {
          address: string | null
          business_hours: Json
          commission_split: number
          created_at: string
          holiday_schedule: Json
          id: string
          name: string
          phone: string | null
          tip_split_default: number
        }
        Insert: {
          address?: string | null
          business_hours?: Json
          commission_split?: number
          created_at?: string
          holiday_schedule?: Json
          id?: string
          name: string
          phone?: string | null
          tip_split_default?: number
        }
        Update: {
          address?: string | null
          business_hours?: Json
          commission_split?: number
          created_at?: string
          holiday_schedule?: Json
          id?: string
          name?: string
          phone?: string | null
          tip_split_default?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          buffer_after_minutes: number
          category: string | null
          created_at: string
          deposit_amount: number
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          salon_id: string
        }
        Insert: {
          buffer_after_minutes?: number
          category?: string | null
          created_at?: string
          deposit_amount?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          salon_id: string
        }
        Update: {
          buffer_after_minutes?: number
          category?: string | null
          created_at?: string
          deposit_amount?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          auth_user_id: string | null
          avatar_color: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          pin: string | null
          role: Database["public"]["Enums"]["app_role"]
          salon_id: string
          sort_order: number
          specialties: string[]
          title: string | null
          working_hours: Json
        }
        Insert: {
          auth_user_id?: string | null
          avatar_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pin?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salon_id: string
          sort_order?: number
          specialties?: string[]
          title?: string | null
          working_hours?: Json
        }
        Update: {
          auth_user_id?: string | null
          avatar_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pin?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salon_id?: string
          sort_order?: number
          specialties?: string[]
          title?: string | null
          working_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          client_name: string
          client_phone: string
          created_at: string
          flagged_booking_id: string | null
          id: string
          preferred_staff_id: string | null
          preferred_time_windows: Json
          salon_id: string
          service_id: string | null
          status: Database["public"]["Enums"]["waitlist_status"]
        }
        Insert: {
          client_name: string
          client_phone: string
          created_at?: string
          flagged_booking_id?: string | null
          id?: string
          preferred_staff_id?: string | null
          preferred_time_windows?: Json
          salon_id: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["waitlist_status"]
        }
        Update: {
          client_name?: string
          client_phone?: string
          created_at?: string
          flagged_booking_id?: string | null
          id?: string
          preferred_staff_id?: string | null
          preferred_time_windows?: Json
          salon_id?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["waitlist_status"]
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_flagged_booking_id_fkey"
            columns: ["flagged_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_preferred_staff_id_fkey"
            columns: ["preferred_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_salon_ids: { Args: never; Returns: string[] }
      get_busy_slots: {
        Args: { p_day_end: string; p_day_start: string; p_staff_id: string }
        Returns: {
          buffer_after_minutes: number
          end_time: string
          start_time: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _salon_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_salon_member: { Args: { _salon_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "staff"
      booking_status: "confirmed" | "completed" | "cancelled" | "no_show"
      floor_state: "with_client" | "available" | "offline"
      payment_method: "Credit/Debit" | "Cash" | "Venmo" | "Cash App"
      waitlist_status: "active" | "fulfilled" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "staff"],
      booking_status: ["confirmed", "completed", "cancelled", "no_show"],
      floor_state: ["with_client", "available", "offline"],
      payment_method: ["Credit/Debit", "Cash", "Venmo", "Cash App"],
      waitlist_status: ["active", "fulfilled", "cancelled"],
    },
  },
} as const
