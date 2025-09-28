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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          allocated_percentage: number
          created_at: string | null
          display_schedule: string
          id: string
          is_system: boolean | null
          linked_goal_id: string | null
          name: string
          user_id: string
        }
        Insert: {
          allocated_percentage: number
          created_at?: string | null
          display_schedule?: string
          id?: string
          is_system?: boolean | null
          linked_goal_id?: string | null
          name: string
          user_id: string
        }
        Update: {
          allocated_percentage?: number
          created_at?: string | null
          display_schedule?: string
          id?: string
          is_system?: boolean | null
          linked_goal_id?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_schedules: {
        Row: {
          amount: number
          created_at: string | null
          day_of_month: number
          goal_id: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          day_of_month: number
          goal_id: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          day_of_month?: number
          goal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_schedules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          goal_name: string
          id: string
          is_completed: boolean | null
          target_amount: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          goal_name: string
          id?: string
          is_completed?: boolean | null
          target_amount: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          goal_name?: string
          id?: string
          is_completed?: boolean | null
          target_amount?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          created_at: string | null
          frequency: string
          id: string
          is_recurring: boolean | null
          payment_date: string | null
          source_name: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          frequency: string
          id?: string
          is_recurring?: boolean | null
          payment_date?: string | null
          source_name: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          frequency?: string
          id?: string
          is_recurring?: boolean | null
          payment_date?: string | null
          source_name?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_actions: {
        Row: {
          created_at: string | null
          due_date: string
          id: string
          kind: string
          payload: Json
          resolved: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          id?: string
          kind: string
          payload: Json
          resolved?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          id?: string
          kind?: string
          payload?: Json
          resolved?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      reconciliation_decisions: {
        Row: {
          created_at: string | null
          decision: string | null
          id: string
          month_start: string
          processed: boolean | null
          surplus_amount: number
          target_goal_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          decision?: string | null
          id?: string
          month_start: string
          processed?: boolean | null
          surplus_amount: number
          target_goal_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          decision?: string | null
          id?: string
          month_start?: string
          processed?: boolean | null
          surplus_amount?: number
          target_goal_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_decisions_target_goal_id_fkey"
            columns: ["target_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      rollovers: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          month_start: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          month_start: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          month_start?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_cycle: string | null
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          next_due_date: string
          payment_type: string
          payoff_period_months: number | null
          total_loan_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          next_due_date: string
          payment_type: string
          payoff_period_months?: number | null
          total_loan_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          billing_cycle?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          next_due_date?: string
          payment_type?: string
          payoff_period_months?: number | null
          total_loan_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          id: string
          name: string
          note: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          name: string
          note?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          note?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
