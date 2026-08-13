-- Helper: professor OR admin
CREATE OR REPLACE FUNCTION public.is_professor_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('professor'::app_role, 'admin'::app_role)
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_professor_or_admin(uuid) TO authenticated, service_role;

-- Rewrite every professor-only policy so admins are included
DO $do$
DECLARE
  r RECORD;
  new_qual TEXT;
  new_check TEXT;
  stmt TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual,'') || coalesce(with_check,'')) ILIKE '%''professor''%'
      AND (coalesce(qual,'') || coalesce(with_check,'')) NOT ILIKE '%''admin''%'
  LOOP
    new_qual := replace(coalesce(r.qual, ''), 'has_role(auth.uid(), ''professor''::app_role)', 'is_professor_or_admin(auth.uid())');
    new_check := replace(coalesce(r.with_check, ''), 'has_role(auth.uid(), ''professor''::app_role)', 'is_professor_or_admin(auth.uid())');

    stmt := format('ALTER POLICY %I ON public.%I', r.policyname, r.tablename);
    IF r.qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF r.with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;

    EXECUTE stmt;
  END LOOP;
END
$do$;

-- Allow admins to look up students by email
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(student_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  student_user_id UUID;
  recent_attempts INT;
  email_hash TEXT;
BEGIN
  IF NOT public.is_professor_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas professores ou administradores podem buscar alunos por email';
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

-- Allow admins to read linked student profiles
CREATE OR REPLACE FUNCTION public.get_student_profile_for_professor(student_user_id uuid)
RETURNS TABLE(id uuid, nome_completo text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_professor_or_admin(auth.uid()) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM professor_students ps
    WHERE ps.professor_id = auth.uid()
      AND ps.student_id = student_user_id
      AND ps.ativo = true
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.nome_completo, p.created_at
  FROM profiles p
  WHERE p.id = student_user_id;
END;
$function$;