
CREATE OR REPLACE FUNCTION public.admin_update_user_email(target_user_id uuid, new_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem alterar emails');
  END IF;

  IF TRIM(new_email) = '' OR new_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN json_build_object('success', false, 'message', 'Email inválido');
  END IF;

  UPDATE public.profiles SET email = LOWER(TRIM(new_email)) WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Email atualizado com sucesso');
END;
$function$;
