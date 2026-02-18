-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Usuários podem ver casos públicos, próprios e compartilhados" ON public.casos_clinicos;

CREATE POLICY "Usuários podem ver casos públicos, próprios e compartilhados"
ON public.casos_clinicos
FOR SELECT
USING (
  (user_id IS NULL)
  OR (user_id = auth.uid())
  OR (EXISTS (
    SELECT 1 FROM shared_cases sc
    WHERE sc.case_id = casos_clinicos.id AND sc.ativo = true
  ))
);