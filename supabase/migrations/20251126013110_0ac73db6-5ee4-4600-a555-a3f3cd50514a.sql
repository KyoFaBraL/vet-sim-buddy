-- Função para professores promoverem usuários a professor
CREATE OR REPLACE FUNCTION public.promote_to_professor(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar se quem está chamando é professor
  IF NOT has_role(auth.uid(), 'professor'::app_role) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Apenas professores podem promover usuários'
    );
  END IF;

  -- Verificar se o usuário alvo existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário não encontrado'
    );
  END IF;

  -- Deletar role atual e inserir role de professor
  DELETE FROM public.user_roles WHERE user_roles.user_id = target_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'professor'::app_role);

  result := json_build_object(
    'success', true,
    'message', 'Usuário promovido a professor com sucesso'
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

-- Função para professores rebaixarem usuários a aluno
CREATE OR REPLACE FUNCTION public.demote_to_student(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar se quem está chamando é professor
  IF NOT has_role(auth.uid(), 'professor'::app_role) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Apenas professores podem modificar roles'
    );
  END IF;

  -- Não permitir rebaixar a si mesmo
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Você não pode modificar seu próprio role'
    );
  END IF;

  -- Deletar role atual e inserir role de aluno
  DELETE FROM public.user_roles WHERE user_roles.user_id = target_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'aluno'::app_role);

  result := json_build_object(
    'success', true,
    'message', 'Usuário rebaixado a aluno com sucesso'
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

-- View segura para professores verem todos os usuários
CREATE OR REPLACE VIEW public.all_users_with_roles AS
SELECT 
  p.id,
  p.email,
  p.nome_completo,
  p.created_at,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id;

-- RLS para a view
ALTER VIEW public.all_users_with_roles SET (security_barrier = true);

-- Política para professores verem todos os usuários
DROP POLICY IF EXISTS "Professores podem ver todos os usuários" ON public.profiles;
CREATE POLICY "Professores podem ver todos os usuários"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'professor'::app_role)
);