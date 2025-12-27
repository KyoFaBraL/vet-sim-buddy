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
      badges: {
        Row: {
          criado_em: string
          criterio: Json
          descricao: string
          icone: string
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          criterio: Json
          descricao: string
          icone: string
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          criado_em?: string
          criterio?: Json
          descricao?: string
          icone?: string
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "casos_clinicos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_profiles_safe"
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
      email_lookup_attempts: {
        Row: {
          attempted_at: string
          found: boolean
          id: string
          professor_id: string
          searched_email: string
        }
        Insert: {
          attempted_at?: string
          found: boolean
          id?: string
          professor_id: string
          searched_email: string
        }
        Update: {
          attempted_at?: string
          found?: boolean
          id?: string
          professor_id?: string
          searched_email?: string
        }
        Relationships: []
      }
      metas_alcancadas: {
        Row: {
          alcancada_em: string
          criado_em: string
          id: string
          meta_id: string
          pontos_ganhos: number
          session_id: string
          tempo_decorrido_segundos: number
          user_id: string
        }
        Insert: {
          alcancada_em?: string
          criado_em?: string
          id?: string
          meta_id: string
          pontos_ganhos: number
          session_id: string
          tempo_decorrido_segundos: number
          user_id: string
        }
        Update: {
          alcancada_em?: string
          criado_em?: string
          id?: string
          meta_id?: string
          pontos_ganhos?: number
          session_id?: string
          tempo_decorrido_segundos?: number
          user_id?: string
        }
        Relationships: []
      }
      metas_aprendizado: {
        Row: {
          case_id: number
          criado_em: string
          descricao: string
          id: string
          parametro_alvo: string | null
          pontos: number | null
          tempo_limite_segundos: number | null
          tipo: string
          titulo: string
          tolerancia: number | null
          tratamento_requerido: number | null
          valor_alvo: number | null
        }
        Insert: {
          case_id: number
          criado_em?: string
          descricao: string
          id?: string
          parametro_alvo?: string | null
          pontos?: number | null
          tempo_limite_segundos?: number | null
          tipo: string
          titulo: string
          tolerancia?: number | null
          tratamento_requerido?: number | null
          valor_alvo?: number | null
        }
        Update: {
          case_id?: number
          criado_em?: string
          descricao?: string
          id?: string
          parametro_alvo?: string | null
          pontos?: number | null
          tempo_limite_segundos?: number | null
          tipo?: string
          titulo?: string
          tolerancia?: number | null
          tratamento_requerido?: number | null
          valor_alvo?: number | null
        }
        Relationships: []
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
      parametros_secundarios_caso: {
        Row: {
          case_id: number
          criado_em: string
          id: string
          parametro_id: number
          valor: number
        }
        Insert: {
          case_id: number
          criado_em?: string
          id?: string
          parametro_id: number
          valor: number
        }
        Update: {
          case_id?: number
          criado_em?: string
          id?: string
          parametro_id?: number
          valor?: number
        }
        Relationships: []
      }
      professor_access_keys: {
        Row: {
          access_key: string
          ativo: boolean | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          expira_em: string | null
          id: string
          usado: boolean | null
          usado_em: string | null
          usado_por: string | null
        }
        Insert: {
          access_key: string
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          expira_em?: string | null
          id?: string
          usado?: boolean | null
          usado_em?: string | null
          usado_por?: string | null
        }
        Update: {
          access_key?: string
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          expira_em?: string | null
          id?: string
          usado?: boolean | null
          usado_em?: string | null
          usado_por?: string | null
        }
        Relationships: []
      }
      professor_private_notes: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          nota: string
          professor_id: string
          student_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nota: string
          professor_id: string
          student_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nota?: string
          professor_id?: string
          student_id?: string
        }
        Relationships: []
      }
      professor_students: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          professor_id: string
          student_id: string
          turma_id: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          professor_id: string
          student_id: string
          turma_id?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          professor_id?: string
          student_id?: string
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_students_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
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
      session_decisions: {
        Row: {
          criado_em: string
          dados: Json
          hp_antes: number | null
          hp_depois: number | null
          id: string
          session_id: string
          timestamp_simulacao: number
          tipo: string
        }
        Insert: {
          criado_em?: string
          dados: Json
          hp_antes?: number | null
          hp_depois?: number | null
          id?: string
          session_id: string
          timestamp_simulacao: number
          tipo: string
        }
        Update: {
          criado_em?: string
          dados?: Json
          hp_antes?: number | null
          hp_depois?: number | null
          id?: string
          session_id?: string
          timestamp_simulacao?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_history: {
        Row: {
          criado_em: string
          id: string
          parametro_id: number
          session_id: string
          timestamp: number
          valor: number
        }
        Insert: {
          criado_em?: string
          id?: string
          parametro_id: number
          session_id: string
          timestamp: number
          valor: number
        }
        Update: {
          criado_em?: string
          id?: string
          parametro_id?: number
          session_id?: string
          timestamp?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_history_parametro_id_fkey"
            columns: ["parametro_id"]
            isOneToOne: false
            referencedRelation: "parametros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_treatments: {
        Row: {
          aplicado_em: string
          id: string
          session_id: string
          timestamp_simulacao: number
          tratamento_id: number
        }
        Insert: {
          aplicado_em?: string
          id?: string
          session_id: string
          timestamp_simulacao: number
          tratamento_id: number
        }
        Update: {
          aplicado_em?: string
          id?: string
          session_id?: string
          timestamp_simulacao?: number
          tratamento_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_treatments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_treatments_tratamento_id_fkey"
            columns: ["tratamento_id"]
            isOneToOne: false
            referencedRelation: "tratamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_case_access: {
        Row: {
          acessado_em: string
          id: string
          shared_case_id: string
          user_id: string
        }
        Insert: {
          acessado_em?: string
          id?: string
          shared_case_id: string
          user_id: string
        }
        Update: {
          acessado_em?: string
          id?: string
          shared_case_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_case_access_shared_case_id_fkey"
            columns: ["shared_case_id"]
            isOneToOne: false
            referencedRelation: "shared_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_cases: {
        Row: {
          access_code: string
          acessos: number | null
          ativo: boolean
          case_id: number
          criado_em: string
          descricao: string | null
          expira_em: string | null
          id: string
          shared_by: string
          titulo: string
        }
        Insert: {
          access_code: string
          acessos?: number | null
          ativo?: boolean
          case_id: number
          criado_em?: string
          descricao?: string | null
          expira_em?: string | null
          id?: string
          shared_by: string
          titulo: string
        }
        Update: {
          access_code?: string
          acessos?: number | null
          ativo?: boolean
          case_id?: number
          criado_em?: string
          descricao?: string | null
          expira_em?: string | null
          id?: string
          shared_by?: string
          titulo?: string
        }
        Relationships: []
      }
      simulation_notes: {
        Row: {
          case_id: number
          conteudo: string
          criado_em: string
          id: string
          parametros_relevantes: Json | null
          session_id: string | null
          timestamp_simulacao: number
          tipo: string
          user_id: string
        }
        Insert: {
          case_id: number
          conteudo: string
          criado_em?: string
          id?: string
          parametros_relevantes?: Json | null
          session_id?: string | null
          timestamp_simulacao: number
          tipo?: string
          user_id: string
        }
        Update: {
          case_id?: number
          conteudo?: string
          criado_em?: string
          id?: string
          parametros_relevantes?: Json | null
          session_id?: string | null
          timestamp_simulacao?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_sessions: {
        Row: {
          case_id: number
          criado_em: string
          data_fim: string | null
          data_inicio: string
          duracao_segundos: number | null
          id: string
          nome: string
          notas: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          case_id: number
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          duracao_segundos?: number | null
          id?: string
          nome: string
          notas?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          case_id?: number
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          duracao_segundos?: number | null
          id?: string
          nome?: string
          notas?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_sessions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "casos_clinicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
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
      tratamentos_adequados: {
        Row: {
          condicao_id: number
          criado_em: string
          id: string
          justificativa: string | null
          prioridade: number
          tratamento_id: number
        }
        Insert: {
          condicao_id: number
          criado_em?: string
          id?: string
          justificativa?: string | null
          prioridade?: number
          tratamento_id: number
        }
        Update: {
          condicao_id?: number
          criado_em?: string
          id?: string
          justificativa?: string | null
          prioridade?: number
          tratamento_id?: number
        }
        Relationships: []
      }
      tratamentos_caso: {
        Row: {
          case_id: number
          criado_em: string
          id: string
          justificativa: string | null
          prioridade: number
          tratamento_id: number
        }
        Insert: {
          case_id: number
          criado_em?: string
          id?: string
          justificativa?: string | null
          prioridade?: number
          tratamento_id: number
        }
        Update: {
          case_id?: number
          criado_em?: string
          id?: string
          justificativa?: string | null
          prioridade?: number
          tratamento_id?: number
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ano_letivo: string | null
          ativo: boolean
          atualizado_em: string
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          periodo: string | null
          professor_id: string
        }
        Insert: {
          ano_letivo?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          periodo?: string | null
          professor_id: string
        }
        Update: {
          ano_letivo?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          periodo?: string | null
          professor_id?: string
        }
        Relationships: []
      }
      tutorial_steps: {
        Row: {
          acao_esperada: Json | null
          case_id: number | null
          criado_em: string
          descricao: string
          dica: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          acao_esperada?: Json | null
          case_id?: number | null
          criado_em?: string
          descricao: string
          dica?: string | null
          id?: string
          ordem: number
          titulo: string
        }
        Update: {
          acao_esperada?: Json | null
          case_id?: number | null
          criado_em?: string
          descricao?: string
          dica?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_steps_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "casos_clinicos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          conquistado_em: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          conquistado_em?: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          conquistado_em?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tutorial_progress: {
        Row: {
          completado: boolean
          completado_em: string | null
          id: string
          tutorial_step_id: string
          user_id: string
        }
        Insert: {
          completado?: boolean
          completado_em?: string | null
          id?: string
          tutorial_step_id: string
          user_id: string
        }
        Update: {
          completado?: boolean
          completado_em?: string | null
          id?: string
          tutorial_step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tutorial_progress_tutorial_step_id_fkey"
            columns: ["tutorial_step_id"]
            isOneToOne: false
            referencedRelation: "tutorial_steps"
            referencedColumns: ["id"]
          },
        ]
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
      weekly_ranking_history: {
        Row: {
          criado_em: string
          id: string
          points: number
          position: number
          total_sessions: number
          user_id: string
          week_end: string
          week_start: string
          win_rate: number
          wins: number
        }
        Insert: {
          criado_em?: string
          id?: string
          points?: number
          position: number
          total_sessions?: number
          user_id: string
          week_end: string
          week_start: string
          win_rate?: number
          wins?: number
        }
        Update: {
          criado_em?: string
          id?: string
          points?: number
          position?: number
          total_sessions?: number
          user_id?: string
          week_end?: string
          week_start?: string
          win_rate?: number
          wins?: number
        }
        Relationships: []
      }
    }
    Views: {
      student_profiles_safe: {
        Row: {
          created_at: string | null
          id: string | null
          nome_completo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      demote_to_student: { Args: { target_user_id: string }; Returns: Json }
      generate_access_code: { Args: never; Returns: string }
      get_shared_case_by_code: {
        Args: { code: string }
        Returns: {
          case_id: number
          descricao: string
          expira_em: string
          id: string
          titulo: string
        }[]
      }
      get_student_id_by_email: {
        Args: { student_email: string }
        Returns: string
      }
      get_student_profile_for_professor: {
        Args: { student_user_id: string }
        Returns: {
          created_at: string
          id: string
          nome_completo: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_professor: { Args: { target_user_id: string }; Returns: Json }
      purge_old_email_lookups: { Args: never; Returns: undefined }
      register_aluno: {
        Args: { email: string; nome_completo: string; user_id: string }
        Returns: Json
      }
      register_professor:
        | {
            Args: { email: string; nome_completo: string; user_id: string }
            Returns: Json
          }
        | {
            Args: {
              access_key?: string
              email: string
              nome_completo: string
              user_id: string
            }
            Returns: Json
          }
      validate_professor_access_key: {
        Args: { key_to_check: string }
        Returns: boolean
      }
      validate_professor_key: {
        Args: { key_to_validate: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "professor" | "aluno"
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
    Enums: {
      app_role: ["professor", "aluno"],
    },
  },
} as const
