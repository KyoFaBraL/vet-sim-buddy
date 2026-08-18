-- 1) Restore EXECUTE for authenticated on role-check helpers used inside RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_professor_or_admin(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_professor_or_admin(uuid) FROM anon;

-- 2) Allow professor registration to upgrade the default 'aluno' role created by the signup trigger
CREATE OR REPLACE FUNCTION public.register_professor(user_id uuid, email text, nome_completo text, access_key text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  key_valid boolean;
BEGIN
  IF user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você só pode registrar sua própria conta');
  END IF;

  -- Block only if the user already has an elevated role (professor/admin)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = register_professor.user_id
      AND user_roles.role IN ('professor'::app_role, 'admin'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário já possui uma role elevada registrada. Não é possível alterar roles.');
  END IF;

  IF access_key IS NULL OR access_key = '' THEN
    RETURN json_build_object('success', false, 'message', 'Chave de acesso é obrigatória para registro de professor');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.professor_access_keys
    WHERE professor_access_keys.access_key = register_professor.access_key
      AND ativo = true
      AND usado = false
      AND (expira_em IS NULL OR expira_em > now())
  ) INTO key_valid;

  IF NOT key_valid THEN
    RETURN json_build_object('success', false, 'message', 'Chave de acesso inválida, expirada ou já utilizada');
  END IF;

  UPDATE public.professor_access_keys
  SET usado = true, usado_por = user_id, usado_em = now()
  WHERE professor_access_keys.access_key = register_professor.access_key;

  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (register_professor.user_id, register_professor.email, register_professor.nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, nome_completo = EXCLUDED.nome_completo;

  -- Replace the default student role with the professor role
  DELETE FROM public.user_roles
  WHERE user_roles.user_id = register_professor.user_id
    AND user_roles.role = 'aluno'::app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (register_professor.user_id, 'professor'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Professor registrado com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.register_professor(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_professor(uuid, text, text, text) TO authenticated;