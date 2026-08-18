CREATE OR REPLACE FUNCTION public.register_professor(user_id uuid, email text, nome_completo text, access_key text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := register_professor.user_id;
  v_email text := register_professor.email;
  v_nome text := register_professor.nome_completo;
  v_key text := register_professor.access_key;
  key_valid boolean;
BEGIN
  IF v_user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você só pode registrar sua própria conta');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_user_id
      AND ur.role IN ('professor'::app_role, 'admin'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário já possui uma role elevada registrada. Não é possível alterar roles.');
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    RETURN json_build_object('success', false, 'message', 'Chave de acesso é obrigatória para registro de professor');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.professor_access_keys k
    WHERE k.access_key = v_key
      AND k.ativo = true
      AND k.usado = false
      AND (k.expira_em IS NULL OR k.expira_em > now())
  ) INTO key_valid;

  IF NOT key_valid THEN
    RETURN json_build_object('success', false, 'message', 'Chave de acesso inválida, expirada ou já utilizada');
  END IF;

  UPDATE public.professor_access_keys k
  SET usado = true, usado_por = v_user_id, usado_em = now()
  WHERE k.access_key = v_key;

  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (v_user_id, v_email, v_nome)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, nome_completo = EXCLUDED.nome_completo;

  DELETE FROM public.user_roles ur
  WHERE ur.user_id = v_user_id AND ur.role = 'aluno'::app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'professor'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Professor registrado com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.register_professor(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_professor(uuid, text, text, text) TO authenticated;