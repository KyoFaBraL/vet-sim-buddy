-- Drop the overly permissive policy that allows enumeration of all active shared cases
DROP POLICY IF EXISTS "Todos podem ver compartilhamentos ativos por código" ON public.shared_cases;

-- Create a SECURITY DEFINER function to get shared case by exact access code
-- This prevents enumeration while still allowing access by code
CREATE OR REPLACE FUNCTION public.get_shared_case_by_code(code TEXT)
RETURNS TABLE (
  id UUID,
  case_id INT,
  titulo TEXT,
  descricao TEXT,
  expira_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sc.id, sc.case_id, sc.titulo, sc.descricao, sc.expira_em
  FROM shared_cases sc
  WHERE sc.access_code = UPPER(TRIM(code))
    AND sc.ativo = true
    AND (sc.expira_em IS NULL OR sc.expira_em > now());
END;
$$;