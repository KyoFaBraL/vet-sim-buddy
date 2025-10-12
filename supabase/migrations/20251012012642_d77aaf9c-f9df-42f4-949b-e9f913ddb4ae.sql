-- Criar tabela de badges/conquistas
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'special'
  criterio JSONB NOT NULL, -- Critério para ganhar o badge
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de badges conquistados pelos usuários
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  conquistado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_id)
);

-- Criar tabela para passos do tutorial
CREATE TABLE IF NOT EXISTS public.tutorial_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id INTEGER REFERENCES public.casos_clinicos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  dica TEXT,
  acao_esperada JSONB, -- O que o usuário deve fazer
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para progresso do tutorial do usuário
CREATE TABLE IF NOT EXISTS public.user_tutorial_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_step_id UUID NOT NULL REFERENCES public.tutorial_steps(id) ON DELETE CASCADE,
  completado BOOLEAN NOT NULL DEFAULT false,
  completado_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tutorial_step_id)
);

-- Criar tabela para decisões detalhadas (replay)
CREATE TABLE IF NOT EXISTS public.session_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  timestamp_simulacao INTEGER NOT NULL,
  tipo TEXT NOT NULL, -- 'treatment', 'hint_used', 'parameter_critical', etc
  dados JSONB NOT NULL, -- Detalhes da decisão
  hp_antes INTEGER,
  hp_depois INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_decisions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para badges
CREATE POLICY "Todos podem ver badges disponíveis"
ON public.badges
FOR SELECT
USING (true);

-- Políticas RLS para user_badges
CREATE POLICY "Usuários podem ver seus próprios badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para tutorial_steps
CREATE POLICY "Todos podem ver passos do tutorial"
ON public.tutorial_steps
FOR SELECT
USING (true);

-- Políticas RLS para user_tutorial_progress
CREATE POLICY "Usuários podem ver seu próprio progresso"
ON public.user_tutorial_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso"
ON public.user_tutorial_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso"
ON public.user_tutorial_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas RLS para session_decisions
CREATE POLICY "Usuários podem ver decisões de suas sessões"
ON public.session_decisions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.simulation_sessions
  WHERE simulation_sessions.id = session_decisions.session_id
  AND simulation_sessions.user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir decisões em suas sessões"
ON public.session_decisions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.simulation_sessions
  WHERE simulation_sessions.id = session_decisions.session_id
  AND simulation_sessions.user_id = auth.uid()
));

-- Inserir badges iniciais
INSERT INTO public.badges (nome, descricao, icone, tipo, criterio) VALUES
('Primeira Vitória', 'Complete sua primeira simulação com sucesso', 'trophy', 'bronze', '{"tipo": "primeira_vitoria"}'),
('Sem Usar Dicas', 'Vença uma simulação sem usar o sistema de dicas', 'brain', 'silver', '{"tipo": "sem_dicas"}'),
('Tempo Recorde', 'Complete uma simulação em menos de 2 minutos', 'zap', 'gold', '{"tipo": "tempo_recorde", "tempo_maximo": 120}'),
('Expert em Diagnóstico', 'Alcance todas as metas de aprendizado em uma sessão', 'target', 'gold', '{"tipo": "todas_metas"}'),
('Veterinário Dedicado', 'Complete 10 simulações', 'heart', 'silver', '{"tipo": "total_sessoes", "quantidade": 10}'),
('Mestre da Recuperação', 'Mantenha HP acima de 80 durante toda uma simulação', 'shield', 'gold', '{"tipo": "hp_alto", "hp_minimo": 80}'),
('Explorador de Casos', 'Complete simulações de 5 casos diferentes', 'compass', 'bronze', '{"tipo": "casos_diferentes", "quantidade": 5}')
ON CONFLICT DO NOTHING;