-- Criar tabela para sessões de simulação
CREATE TABLE public.simulation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id INTEGER NOT NULL REFERENCES public.casos_clinicos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  duracao_segundos INTEGER,
  status TEXT CHECK (status IN ('em_andamento', 'concluida', 'abandonada')) DEFAULT 'em_andamento',
  notas TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para histórico de parâmetros da sessão
CREATE TABLE public.session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  timestamp INTEGER NOT NULL,
  parametro_id INTEGER NOT NULL REFERENCES public.parametros(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para tratamentos aplicados na sessão
CREATE TABLE public.session_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  tratamento_id INTEGER NOT NULL REFERENCES public.tratamentos(id) ON DELETE CASCADE,
  aplicado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  timestamp_simulacao INTEGER NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_simulation_sessions_user_id ON public.simulation_sessions(user_id);
CREATE INDEX idx_simulation_sessions_case_id ON public.simulation_sessions(case_id);
CREATE INDEX idx_session_history_session_id ON public.session_history(session_id);
CREATE INDEX idx_session_treatments_session_id ON public.session_treatments(session_id);

-- Enable RLS
ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_treatments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para simulation_sessions
CREATE POLICY "Usuários podem ver suas próprias sessões"
ON public.simulation_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias sessões"
ON public.simulation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias sessões"
ON public.simulation_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias sessões"
ON public.simulation_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para session_history
CREATE POLICY "Usuários podem ver histórico de suas sessões"
ON public.session_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions
    WHERE id = session_history.session_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar histórico para suas sessões"
ON public.session_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions
    WHERE id = session_history.session_id
    AND user_id = auth.uid()
  )
);

-- RLS Policies para session_treatments
CREATE POLICY "Usuários podem ver tratamentos de suas sessões"
ON public.session_treatments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions
    WHERE id = session_treatments.session_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar tratamentos para suas sessões"
ON public.session_treatments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions
    WHERE id = session_treatments.session_id
    AND user_id = auth.uid()
  )
);