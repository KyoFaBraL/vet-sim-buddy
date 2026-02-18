
-- Update get_all_profiles_for_admin to allow admin AND professors, but hide admin users from non-admins
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE(id uuid, nome_completo text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admin and professors can call this
  IF NOT (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Apenas professores podem listar perfis';
  END IF;

  -- If caller is admin, show all (including other admins)
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
    SELECT p.id, p.nome_completo, p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
  ELSE
    -- Professors: hide admin users
    RETURN QUERY
    SELECT p.id, p.nome_completo, p.created_at
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin'
    )
    ORDER BY p.created_at DESC;
  END IF;
END;
$$;

-- Update promote_to_professor to allow admin
CREATE OR REPLACE FUNCTION public.promote_to_professor(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas professores podem promover usuários');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;

  -- Cannot modify admin users
  IF has_role(target_user_id, 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Não é possível modificar este usuário');
  END IF;

  DELETE FROM public.user_roles WHERE user_roles.user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'professor'::app_role);

  RETURN json_build_object('success', true, 'message', 'Usuário promovido a professor com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Update demote_to_student to allow admin
CREATE OR REPLACE FUNCTION public.demote_to_student(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas professores podem modificar roles');
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
$$;
