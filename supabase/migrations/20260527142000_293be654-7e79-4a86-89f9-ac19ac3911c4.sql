
-- 1. email_lookup_attempts: replace plaintext email with hash
ALTER TABLE public.email_lookup_attempts
  ADD COLUMN IF NOT EXISTS searched_email_hash text;

UPDATE public.email_lookup_attempts
SET searched_email_hash = encode(digest(lower(trim(searched_email)), 'sha256'), 'hex')
WHERE searched_email_hash IS NULL AND searched_email IS NOT NULL;

ALTER TABLE public.email_lookup_attempts DROP COLUMN IF EXISTS searched_email;

-- Update RPC to use hash
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(student_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  student_user_id UUID;
  recent_attempts INT;
  email_hash TEXT;
BEGIN
  IF NOT has_role(auth.uid(), 'professor'::app_role) THEN
    RAISE EXCEPTION 'Apenas professores podem buscar alunos por email';
  END IF;

  SELECT COUNT(*) INTO recent_attempts
  FROM public.email_lookup_attempts
  WHERE professor_id = auth.uid()
  AND attempted_at > now() - interval '1 hour';

  IF recent_attempts >= 10 THEN
    RAISE EXCEPTION 'Limite de buscas excedido. Máximo de 10 buscas por hora. Tente novamente mais tarde.';
  END IF;

  SELECT u.id INTO student_user_id
  FROM auth.users u
  INNER JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.email = LOWER(TRIM(student_email))
    AND ur.role = 'aluno';

  email_hash := encode(digest(lower(trim(student_email)), 'sha256'), 'hex');

  INSERT INTO public.email_lookup_attempts (professor_id, searched_email_hash, found)
  VALUES (auth.uid(), email_hash, student_user_id IS NOT NULL);

  RETURN student_user_id;
END;
$function$;

-- Update the direct-insert policy to match new column
DROP POLICY IF EXISTS "Professores podem registrar suas tentativas de busca" ON public.email_lookup_attempts;
-- Keep INSERT blocked except via SECURITY DEFINER function
-- (existing "Ninguém pode inserir tentativas diretamente" policy already returns false)

-- 2. tcle_consents: remove ip/user_agent visibility from professors
DROP POLICY IF EXISTS "Professores podem ver consentimentos de alunos vinculados" ON public.tcle_consents;

CREATE OR REPLACE FUNCTION public.get_student_tcle_consents(student_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, versao text, aceito boolean, aceito_em timestamptz, criado_em timestamptz)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM professor_students ps
      WHERE ps.student_id = student_user_id
        AND ps.professor_id = auth.uid()
        AND ps.ativo = true
        AND has_role(auth.uid(), 'professor'::app_role)
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT c.id, c.user_id, c.versao, c.aceito, c.aceito_em, c.criado_em
  FROM tcle_consents c
  WHERE c.user_id = student_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_student_tcle_consents(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_student_tcle_consents(uuid) TO authenticated;

-- 3. shared_cases: remove broad student visibility; students must use access code RPC
DROP POLICY IF EXISTS "Alunos podem ver casos compartilhados ativos" ON public.shared_cases;

-- 4. user_roles: add RESTRICTIVE policies for hard block on writes
CREATE POLICY "Restrict insert on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Restrict update on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Restrict delete on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (false);

-- 5. Revoke EXECUTE on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_old_email_lookups() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_access_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_access_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_professor_access_key(text) FROM anon, authenticated;
