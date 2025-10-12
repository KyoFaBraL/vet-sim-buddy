-- Fix #1: Add professor access policies to student data tables
-- Allow professors to view their students' simulation sessions
CREATE POLICY "Professores podem ver sessões de seus alunos"
ON public.simulation_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professor_students ps
    WHERE ps.student_id = simulation_sessions.user_id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Allow professors to view their students' session decisions
CREATE POLICY "Professores podem ver decisões de seus alunos"
ON public.session_decisions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions ss
    JOIN public.professor_students ps ON ps.student_id = ss.user_id
    WHERE ss.id = session_decisions.session_id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Allow professors to view their students' session history
CREATE POLICY "Professores podem ver histórico de seus alunos"
ON public.session_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions ss
    JOIN public.professor_students ps ON ps.student_id = ss.user_id
    WHERE ss.id = session_history.session_id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Allow professors to view their students' session treatments
CREATE POLICY "Professores podem ver tratamentos de seus alunos"
ON public.session_treatments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.simulation_sessions ss
    JOIN public.professor_students ps ON ps.student_id = ss.user_id
    WHERE ss.id = session_treatments.session_id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Allow professors to view their students' achieved goals
CREATE POLICY "Professores podem ver metas alcançadas de seus alunos"
ON public.metas_alcancadas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professor_students ps
    WHERE ps.student_id = metas_alcancadas.user_id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Allow professors to view their students' badges
CREATE POLICY "Professores podem ver badges de seus alunos"
ON public.user_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professor_students ps
    WHERE ps.student_id = user_badges.user_id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);

-- Fix #2: Secure role assignment - auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome_completo');
  
  -- Auto-assign student role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'aluno');
  
  RETURN new;
END;
$$;

-- Remove self-service role assignment policy
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios roles" ON public.user_roles;

-- Only allow users to view their own roles (kept for reading)
-- INSERT is no longer allowed for regular users - roles must be assigned by system or admin