
-- Fix #1: Restrict promote_to_professor to admin-only
CREATE OR REPLACE FUNCTION public.promote_to_professor(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Only admins can promote users
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem promover usuários');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  -- Cannot modify admin users
  IF has_role(target_user_id, 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Não é possível modificar este usuário');
  END IF;

  -- Cannot modify self
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você não pode modificar seu próprio role');
  END IF;

  DELETE FROM public.user_roles WHERE user_roles.user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'professor'::app_role);

  RETURN json_build_object('success', true, 'message', 'Usuário promovido a professor com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;

-- Fix #1b: Restrict demote_to_student to admin-only
CREATE OR REPLACE FUNCTION public.demote_to_student(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Only admins can demote users
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem modificar roles');
  END IF;

  IF target_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você não pode modificar seu próprio role');
  END IF;

  -- Cannot modify admin users
  IF has_role(target_user_id, 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Não é possível modificar este usuário');
  END IF;

  DELETE FROM public.user_roles WHERE user_roles.user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'aluno'::app_role);

  RETURN json_build_object('success', true, 'message', 'Usuário rebaixado a aluno com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;
