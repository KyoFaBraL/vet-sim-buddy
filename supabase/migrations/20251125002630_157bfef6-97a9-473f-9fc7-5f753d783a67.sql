-- Fix ambiguous user_id reference in register functions
CREATE OR REPLACE FUNCTION public.register_professor(user_id uuid, email text, nome_completo text)
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
  VALUES (register_professor.user_id, register_professor.email, register_professor.nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Deletar qualquer role existente e inserir nova role de professor
  DELETE FROM public.user_roles WHERE user_roles.user_id = register_professor.user_id;
  
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

CREATE OR REPLACE FUNCTION public.register_aluno(user_id uuid, email text, nome_completo text)
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
  VALUES (register_aluno.user_id, register_aluno.email, register_aluno.nome_completo)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = EXCLUDED.nome_completo;

  -- Deletar qualquer role existente e inserir nova role de aluno
  DELETE FROM public.user_roles WHERE user_roles.user_id = register_aluno.user_id;
  
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

-- Create table for professor access keys
CREATE TABLE IF NOT EXISTS public.professor_access_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key text NOT NULL UNIQUE,
  criado_por uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em timestamp with time zone DEFAULT now(),
  usado boolean DEFAULT false,
  usado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usado_em timestamp with time zone,
  expira_em timestamp with time zone,
  ativo boolean DEFAULT true,
  descricao text
);

-- Enable RLS
ALTER TABLE public.professor_access_keys ENABLE ROW LEVEL SECURITY;

-- Policies for professor_access_keys
CREATE POLICY "Professores podem gerenciar chaves"
ON public.professor_access_keys
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'professor'))
WITH CHECK (has_role(auth.uid(), 'professor'));

CREATE POLICY "Todos podem validar chaves ativas"
ON public.professor_access_keys
FOR SELECT
TO authenticated
USING (ativo = true AND usado = false AND (expira_em IS NULL OR expira_em > now()));

-- Function to validate and consume an access key
CREATE OR REPLACE FUNCTION public.validate_professor_key(key_to_validate text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_record record;
  result json;
BEGIN
  -- Check if key exists and is valid
  SELECT * INTO key_record
  FROM public.professor_access_keys
  WHERE access_key = key_to_validate
    AND ativo = true
    AND usado = false
    AND (expira_em IS NULL OR expira_em > now());
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Chave inválida, expirada ou já utilizada'
    );
  END IF;

  -- Mark key as used
  UPDATE public.professor_access_keys
  SET usado = true,
      usado_por = auth.uid(),
      usado_em = now()
  WHERE id = key_record.id;

  RETURN json_build_object(
    'valid', true,
    'message', 'Chave válida'
  );
END;
$$;