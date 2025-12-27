-- Fix 1: Secure register_aluno - only allow self-registration
CREATE OR REPLACE FUNCTION public.register_aluno(user_id uuid, email text, nome_completo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- SECURITY: Only allow users to register themselves
  IF user_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Você só pode registrar sua própria conta'
    );
  END IF;

  -- Check if user already has a role (prevent re-registration)
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = register_aluno.user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já possui uma role registrada'
    );
  END IF;

  -- Insert or update profile
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (register_aluno.user_id, register_aluno.email, register_aluno.nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Insert student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (register_aluno.user_id, 'aluno'::app_role);

  result := json_build_object(
    'success', true,
    'message', 'Aluno registrado com sucesso'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Fix 2: Secure register_professor - require self-registration + valid access key
CREATE OR REPLACE FUNCTION public.register_professor(user_id uuid, email text, nome_completo text, access_key text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  key_valid boolean;
BEGIN
  -- SECURITY: Only allow users to register themselves
  IF user_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Você só pode registrar sua própria conta'
    );
  END IF;

  -- Check if user already has a role (prevent re-registration/privilege escalation)
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = register_professor.user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já possui uma role registrada. Não é possível alterar roles.'
    );
  END IF;

  -- SECURITY: Require valid access key for professor registration
  IF access_key IS NULL OR access_key = '' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Chave de acesso é obrigatória para registro de professor'
    );
  END IF;

  -- Validate the access key
  SELECT EXISTS(
    SELECT 1 FROM public.professor_access_keys
    WHERE professor_access_keys.access_key = register_professor.access_key
      AND ativo = true
      AND usado = false
      AND (expira_em IS NULL OR expira_em > now())
  ) INTO key_valid;

  IF NOT key_valid THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Chave de acesso inválida, expirada ou já utilizada'
    );
  END IF;

  -- Mark the key as used
  UPDATE public.professor_access_keys
  SET usado = true,
      usado_por = user_id,
      usado_em = now()
  WHERE professor_access_keys.access_key = register_professor.access_key;

  -- Insert or update profile
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (register_professor.user_id, register_professor.email, register_professor.nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Insert professor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (register_professor.user_id, 'professor'::app_role);

  result := json_build_object(
    'success', true,
    'message', 'Professor registrado com sucesso'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Fix 3: Improve get_student_id_by_email to prevent email enumeration
-- Return same response for "not found" and "not a student" to prevent enumeration
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(student_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_user_id UUID;
  recent_attempts INT;
BEGIN
  -- Require professor role
  IF NOT has_role(auth.uid(), 'professor'::app_role) THEN
    RAISE EXCEPTION 'Apenas professores podem buscar alunos por email';
  END IF;

  -- Check attempts in last hour (rate limiting)
  SELECT COUNT(*) INTO recent_attempts
  FROM public.email_lookup_attempts
  WHERE professor_id = auth.uid()
  AND attempted_at > now() - interval '1 hour';
  
  -- Rate limit: max 10 lookups per hour
  IF recent_attempts >= 10 THEN
    RAISE EXCEPTION 'Limite de buscas excedido. Máximo de 10 buscas por hora. Tente novamente mais tarde.';
  END IF;
  
  -- Find user by email AND verify they are a student in a single query
  -- This prevents enumeration by returning NULL for both "not found" and "not a student"
  SELECT u.id INTO student_user_id
  FROM auth.users u
  INNER JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.email = LOWER(TRIM(student_email))
    AND ur.role = 'aluno';
  
  -- Log attempt for rate limiting (always log, regardless of result)
  INSERT INTO public.email_lookup_attempts (professor_id, searched_email, found)
  VALUES (auth.uid(), student_email, student_user_id IS NOT NULL);
  
  -- Return the student ID or NULL (same response format prevents enumeration)
  RETURN student_user_id;
END;
$$;