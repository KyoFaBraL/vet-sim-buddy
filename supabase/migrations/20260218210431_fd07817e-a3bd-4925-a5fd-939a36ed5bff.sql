
-- Update casos_clinicos SELECT policy to allow students to see all cases
DROP POLICY IF EXISTS "Usuários podem ver casos públicos, próprios e compartilhados" ON public.casos_clinicos;

CREATE POLICY "Usuários podem ver casos públicos, próprios e compartilhados"
ON public.casos_clinicos
FOR SELECT
USING (
  (user_id IS NULL)
  OR (user_id = auth.uid())
  OR has_role(auth.uid(), 'aluno'::app_role)
);
