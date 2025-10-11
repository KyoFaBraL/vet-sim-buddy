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
      casos_clinicos: {
        Row: {
          criado_em: string | null
          descricao: string | null
          especie: string | null
          id: number
          id_condicao_primaria: number | null
          nome: string
          user_id: string | null
        }
        Insert: {
          criado_em?: string | null
          descricao?: string | null
          especie?: string | null
          id?: number
          id_condicao_primaria?: number | null
          nome: string
          user_id?: string | null
        }
        Update: {
          criado_em?: string | null
          descricao?: string | null
          especie?: string | null
          id?: number
          id_condicao_primaria?: number | null
          nome?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casos_clinicos_id_condicao_primaria_fkey"
            columns: ["id_condicao_primaria"]
            isOneToOne: false
            referencedRelation: "condicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_clinicos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      condicoes: {
        Row: {
          descricao: string | null
          id: number
          nome: string
        }
        Insert: {
          descricao?: string | null
          id?: number
          nome: string
        }
        Update: {
          descricao?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      efeitos_condicao: {
        Row: {
          descricao: string | null
          id: number
          id_condicao: number
          id_parametro: number
          magnitude: number
        }
        Insert: {
          descricao?: string | null
          id?: number
          id_condicao: number
          id_parametro: number
          magnitude: number
        }
        Update: {
          descricao?: string | null
          id?: number
          id_condicao?: number
          id_parametro?: number
          magnitude?: number
        }
        Relationships: [
          {
            foreignKeyName: "efeitos_condicao_id_condicao_fkey"
            columns: ["id_condicao"]
            isOneToOne: false
            referencedRelation: "condicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "efeitos_condicao_id_parametro_fkey"
            columns: ["id_parametro"]
            isOneToOne: false
            referencedRelation: "parametros"
            referencedColumns: ["id"]
          },
        ]
      }
      efeitos_tratamento: {
        Row: {
          descricao: string | null
          id: number
          id_parametro: number
          id_tratamento: number
          magnitude: number
        }
        Insert: {
          descricao?: string | null
          id?: number
          id_parametro: number
          id_tratamento: number
          magnitude: number
        }
        Update: {
          descricao?: string | null
          id?: number
          id_parametro?: number
          id_tratamento?: number
          magnitude?: number
        }
        Relationships: [
          {
            foreignKeyName: "efeitos_tratamento_id_parametro_fkey"
            columns: ["id_parametro"]
            isOneToOne: false
            referencedRelation: "parametros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "efeitos_tratamento_id_tratamento_fkey"
            columns: ["id_tratamento"]
            isOneToOne: false
            referencedRelation: "tratamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros: {
        Row: {
          descricao: string | null
          id: number
          nome: string
          unidade: string | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          descricao?: string | null
          id?: number
          nome: string
          unidade?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          descricao?: string | null
          id?: number
          nome?: string
          unidade?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome_completo: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome_completo?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string | null
        }
        Relationships: []
      }
      tratamentos: {
        Row: {
          descricao: string | null
          id: number
          nome: string
          tipo: string | null
        }
        Insert: {
          descricao?: string | null
          id?: number
          nome: string
          tipo?: string | null
        }
        Update: {
          descricao?: string | null
          id?: number
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      valores_iniciais_caso: {
        Row: {
          id: number
          id_caso: number
          id_parametro: number
          valor: number
        }
        Insert: {
          id?: number
          id_caso: number
          id_parametro: number
          valor: number
        }
        Update: {
          id?: number
          id_caso?: number
          id_parametro?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "valores_iniciais_caso_id_caso_fkey"
            columns: ["id_caso"]
            isOneToOne: false
            referencedRelation: "casos_clinicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valores_iniciais_caso_id_parametro_fkey"
            columns: ["id_parametro"]
            isOneToOne: false
            referencedRelation: "parametros"
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
