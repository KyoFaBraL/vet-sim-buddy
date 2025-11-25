-- Garantir que não há triggers criando roles automaticamente
-- O trigger handle_new_user apenas cria perfis, não roles

-- Adicionar constraint única para garantir que um usuário tenha apenas uma role
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Atualizar as funções de registro para garantir que substituem roles existentes
CREATE OR REPLACE FUNCTION public.register_professor(
  user_id uuid,
  email text,
  nome_completo text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Inserir ou atualizar perfil
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (user_id, email, nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Deletar qualquer role existente e inserir nova role de professor
  DELETE FROM public.user_roles WHERE user_id = register_professor.user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'professor'::app_role);

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

CREATE OR REPLACE FUNCTION public.register_aluno(
  user_id uuid,
  email text,
  nome_completo text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Inserir ou atualizar perfil
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (user_id, email, nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Deletar qualquer role existente e inserir nova role de aluno
  DELETE FROM public.user_roles WHERE user_id = register_aluno.user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'aluno'::app_role);

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