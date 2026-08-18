DROP POLICY IF EXISTS "Todos podem ver tratamentos adequados" ON public.tratamentos_adequados;

CREATE POLICY "Professores e admins podem ver gabarito de tratamentos"
ON public.tratamentos_adequados
FOR SELECT
TO authenticated
USING (public.is_professor_or_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.check_treatment_adequacy(p_condicao_id integer, p_tratamento_id integer)
RETURNS TABLE(prioridade integer, justificativa text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ta.prioridade, ta.justificativa
  FROM public.tratamentos_adequados ta
  WHERE ta.condicao_id = p_condicao_id
    AND ta.tratamento_id = p_tratamento_id
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.check_treatment_adequacy(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_treatment_adequacy(integer, integer) TO authenticated, service_role;