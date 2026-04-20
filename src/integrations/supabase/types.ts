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
      active_routes: {
        Row: {
          created_at: string
          helper_cost: number
          id: string
          km_start: number
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helper_cost?: number
          id?: string
          km_start: number
          started_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          helper_cost?: number
          id?: string
          km_start?: number
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extra_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date: string
          description: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_costs: {
        Row: {
          accumulated: number
          active: boolean
          created_at: string
          cycle_start: string
          id: string
          name: string
          per_route_amount: number
          period: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accumulated?: number
          active?: boolean
          created_at?: string
          cycle_start?: string
          id?: string
          name: string
          per_route_amount?: number
          period?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accumulated?: number
          active?: boolean
          created_at?: string
          cycle_start?: string
          id?: string
          name?: string
          per_route_amount?: number
          period?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          auto_generated: boolean | null
          avg_consumption: number
          created_at: string
          daily_value: number
          date: string
          earnings_per_hour: number
          fixed_fee: number
          fuel_cost: number
          helper_cost: number
          hours_worked: number
          id: string
          km_driven: number
          km_end: number
          km_start: number
          liters_used: number
          net_profit: number
          platform: string | null
          price_per_liter: number
          recommended_reserve: number
          reserve_per_km: number
          time_end: string | null
          time_start: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_generated?: boolean | null
          avg_consumption?: number
          created_at?: string
          daily_value?: number
          date: string
          earnings_per_hour?: number
          fixed_fee?: number
          fuel_cost?: number
          helper_cost?: number
          hours_worked?: number
          id?: string
          km_driven?: number
          km_end?: number
          km_start?: number
          liters_used?: number
          net_profit?: number
          platform?: string | null
          price_per_liter?: number
          recommended_reserve?: number
          reserve_per_km?: number
          time_end?: string | null
          time_start?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_generated?: boolean | null
          avg_consumption?: number
          created_at?: string
          daily_value?: number
          date?: string
          earnings_per_hour?: number
          fixed_fee?: number
          fuel_cost?: number
          helper_cost?: number
          hours_worked?: number
          id?: string
          km_driven?: number
          km_end?: number
          km_start?: number
          liters_used?: number
          net_profit?: number
          platform?: string | null
          price_per_liter?: number
          recommended_reserve?: number
          reserve_per_km?: number
          time_end?: string | null
          time_start?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          avg_consumption: number
          created_at: string
          default_daily_value: number
          default_price_per_liter: number
          fixed_fee: number
          fortnight_goal: number
          helper_cost: number
          hourly_goal: number
          id: string
          monthly_goal: number
          reserve_per_km: number
          route_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_consumption?: number
          created_at?: string
          default_daily_value?: number
          default_price_per_liter?: number
          fixed_fee?: number
          fortnight_goal?: number
          helper_cost?: number
          hourly_goal?: number
          id?: string
          monthly_goal?: number
          reserve_per_km?: number
          route_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_consumption?: number
          created_at?: string
          default_daily_value?: number
          default_price_per_liter?: number
          fixed_fee?: number
          fortnight_goal?: number
          helper_cost?: number
          hourly_goal?: number
          id?: string
          monthly_goal?: number
          reserve_per_km?: number
          route_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
