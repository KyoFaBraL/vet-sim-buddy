-- Criar tabela para notas durante a simulação
CREATE TABLE public.simulation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  case_id INTEGER NOT NULL,
  timestamp_simulacao INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'observacao', -- 'observacao', 'decisao', 'hipotese'
  conteudo TEXT NOT NULL,
  parametros_relevantes JSONB,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.simulation_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem criar suas próprias notas"
  ON public.simulation_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas próprias notas"
  ON public.simulation_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notas"
  ON public.simulation_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias notas"
  ON public.simulation_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar índices
CREATE INDEX idx_simulation_notes_user_id ON public.simulation_notes(user_id);
CREATE INDEX idx_simulation_notes_case_id ON public.simulation_notes(case_id);
CREATE INDEX idx_simulation_notes_session_id ON public.simulation_notes(session_id);