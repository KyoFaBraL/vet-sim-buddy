
CREATE OR REPLACE FUNCTION public.admin_update_user_name(target_user_id uuid, new_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem alterar nomes');
  END IF;

  IF TRIM(new_name) = '' THEN
    RETURN json_build_object('success', false, 'message', 'Nome não pode ser vazio');
  END IF;

  UPDATE public.profiles SET nome_completo = TRIM(new_name) WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Nome atualizado com sucesso');
END;
$function$;
