-- Criar tabela de metas de aprendizado
CREATE TABLE public.metas_aprendizado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'parametro', 'tempo', 'tratamento'
  parametro_alvo TEXT,
  valor_alvo NUMERIC,
  tolerancia NUMERIC DEFAULT 0.5,
  tempo_limite_segundos INTEGER,
  tratamento_requerido INTEGER,
  pontos INTEGER DEFAULT 10,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.metas_aprendizado ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos podem ver metas dos casos
CREATE POLICY "Todos podem ver metas de aprendizado"
  ON public.metas_aprendizado
  FOR SELECT
  USING (true);

-- Criar índice para melhor performance
CREATE INDEX idx_metas_aprendizado_case_id ON public.metas_aprendizado(case_id);

-- Inserir metas exemplo para casos existentes
INSERT INTO public.metas_aprendizado (case_id, titulo, descricao, tipo, parametro_alvo, valor_alvo, tolerancia, tempo_limite_segundos, pontos)
VALUES 
  (1, 'Estabilize o pH', 'Normalize o pH do paciente entre 7.35 e 7.45', 'parametro', 'pH', 7.40, 0.05, 1200, 15),
  (1, 'Corrija a Hipoxemia', 'Eleve a PaO2 para acima de 80 mmHg', 'parametro', 'PaO2', 85, 5, 900, 15),
  (1, 'Normalize o Lactato', 'Reduza o lactato para níveis abaixo de 2.5 mmol/L', 'parametro', 'Lactato', 2.0, 0.5, 1800, 20);

-- Criar tabela para rastrear metas alcançadas pelos usuários
CREATE TABLE public.metas_alcancadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  meta_id UUID NOT NULL,
  user_id UUID NOT NULL,
  alcancada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tempo_decorrido_segundos INTEGER NOT NULL,
  pontos_ganhos INTEGER NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.metas_alcancadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas metas alcançadas"
  ON public.metas_alcancadas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas metas alcançadas"
  ON public.metas_alcancadas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar índice
CREATE INDEX idx_metas_alcancadas_session_id ON public.metas_alcancadas(session_id);
CREATE INDEX idx_metas_alcancadas_user_id ON public.metas_alcancadas(user_id);