-- Fix: Students should only see public cases (user_id IS NULL), their own cases, 
-- or cases explicitly shared with them via shared_cases table
DROP POLICY IF EXISTS "Usuários podem ver casos públicos, próprios e compartilhados" ON public.casos_clinicos;

CREATE POLICY "Usuários podem ver casos públicos, próprios e compartilhados"
ON public.casos_clinicos
FOR SELECT
USING (
  (user_id IS NULL)
  OR (user_id = auth.uid())
  OR (
    has_role(auth.uid(), 'aluno'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.shared_cases sc
      WHERE sc.case_id = casos_clinicos.id
        AND sc.ativo = true
        AND (sc.expira_em IS NULL OR sc.expira_em > now())
    )
  )
  OR has_role(auth.uid(), 'professor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);