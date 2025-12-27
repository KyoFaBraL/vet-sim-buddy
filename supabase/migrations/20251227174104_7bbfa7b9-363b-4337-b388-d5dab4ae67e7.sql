-- Create table to store weekly ranking snapshots
CREATE TABLE public.weekly_ranking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  position integer NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  total_sessions integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  win_rate numeric(5,2) NOT NULL DEFAULT 0,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_ranking_history ENABLE ROW LEVEL SECURITY;

-- Users can see their own ranking history
CREATE POLICY "Usuários podem ver seu próprio histórico de ranking"
ON public.weekly_ranking_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own ranking history
CREATE POLICY "Usuários podem inserir seu histórico de ranking"
ON public.weekly_ranking_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Professors can see ranking history of their students
CREATE POLICY "Professores podem ver histórico de ranking de seus alunos"
ON public.weekly_ranking_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM professor_students ps
    WHERE ps.student_id = weekly_ranking_history.user_id
      AND ps.professor_id = auth.uid()
      AND ps.ativo = true
      AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Create index for efficient queries
CREATE INDEX idx_weekly_ranking_history_user_week ON public.weekly_ranking_history(user_id, week_start DESC);