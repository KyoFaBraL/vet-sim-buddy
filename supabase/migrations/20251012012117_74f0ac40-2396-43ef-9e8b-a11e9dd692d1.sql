-- Criar tabela para parâmetros secundários por caso
CREATE TABLE IF NOT EXISTS public.parametros_secundarios_caso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id INTEGER NOT NULL,
  parametro_id INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parametros_secundarios_caso ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública de parâmetros secundários
CREATE POLICY "Todos podem ver parâmetros secundários"
ON public.parametros_secundarios_caso
FOR SELECT
USING (true);

-- Criar tabela para tratamentos adequados por caso (personalizado)
CREATE TABLE IF NOT EXISTS public.tratamentos_caso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id INTEGER NOT NULL,
  tratamento_id INTEGER NOT NULL,
  prioridade INTEGER NOT NULL DEFAULT 1,
  justificativa TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tratamentos_caso ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública de tratamentos por caso
CREATE POLICY "Todos podem ver tratamentos por caso"
ON public.tratamentos_caso
FOR SELECT
USING (true);