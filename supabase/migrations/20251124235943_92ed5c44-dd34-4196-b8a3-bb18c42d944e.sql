-- Criar função segura para registrar professor
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
  -- Inserir perfil
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (user_id, email, nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Inserir role de professor
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'professor'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

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

-- Criar função segura para registrar aluno
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
  -- Inserir perfil
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (user_id, email, nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Inserir role de aluno
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'aluno'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

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