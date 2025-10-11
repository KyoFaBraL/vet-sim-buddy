-- Criar tabela para relacionar condições com tratamentos adequados
CREATE TABLE IF NOT EXISTS public.tratamentos_adequados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condicao_id INTEGER NOT NULL,
  tratamento_id INTEGER NOT NULL,
  prioridade INTEGER NOT NULL DEFAULT 1, -- 1=alta, 2=média, 3=baixa
  justificativa TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(condicao_id, tratamento_id)
);

-- Enable RLS
ALTER TABLE public.tratamentos_adequados ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Todos podem ver tratamentos adequados"
ON public.tratamentos_adequados
FOR SELECT
USING (true);

-- Inserir relações de tratamentos adequados para cada condição
-- Acidose Metabólica (id=1)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(1, 1, 1, 'Essencial para corrigir hipotensão e melhorar perfusão'),
(1, 2, 2, 'Necessário se hipotensão persistir após fluidos'),
(1, 3, 1, 'Corrige acidose metabólica diretamente');

-- Acidose Respiratória (id=2)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(2, 4, 1, 'Melhora ventilação e elimina CO2'),
(2, 5, 1, 'Essencial para suporte ventilatório'),
(2, 6, 2, 'Trata causa subjacente se presente');

-- Alcalose Metabólica (id=3)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(3, 7, 1, 'Corrige depleção de volume e cloro'),
(3, 8, 1, 'Essencial para corrigir hipocalemia'),
(3, 9, 2, 'Trata vômitos persistentes');

-- Alcalose Respiratória (id=4)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(4, 10, 1, 'Trata ansiedade e hiperventilação'),
(4, 11, 1, 'Essencial se dor for causa'),
(4, 12, 2, 'Reduz frequência respiratória');

-- Cetoacidose Diabética (id=5)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(5, 13, 1, 'Essencial para rehidratação'),
(5, 14, 1, 'Fundamental para reduzir glicose'),
(5, 15, 1, 'Corrige hipocalemia comum em CAD'),
(5, 16, 2, 'Corrige acidose se pH muito baixo');

-- Obstrução Uretral (id=6)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(6, 17, 1, 'Essencial para desobstrução'),
(6, 18, 1, 'Corrige hipercalemia grave'),
(6, 19, 1, 'Estabiliza membrana cardíaca'),
(6, 20, 2, 'Necessário para rehidratação'),
(6, 21, 2, 'Manejo da dor pós-desobstrução');

-- Insuficiência Renal (id=7)
INSERT INTO public.tratamentos_adequados (condicao_id, tratamento_id, prioridade, justificativa) VALUES
(7, 22, 1, 'Essencial para corrigir azotemia'),
(7, 23, 2, 'Se oligúria persistir'),
(7, 24, 2, 'Reduz náusea e vômito'),
(7, 25, 1, 'Corrige acidose metabólica'),
(7, 26, 2, 'Gerencia hipercalemia'),
(7, 27, 2, 'Estimula apetite');