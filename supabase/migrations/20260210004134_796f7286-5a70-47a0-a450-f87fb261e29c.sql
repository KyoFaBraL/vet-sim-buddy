
-- Fix 1: Remove professor access to full profiles (including email)
-- Professors should use student_profiles_safe view or get_student_profile_for_professor RPC
DROP POLICY IF EXISTS "Professores podem ver perfis de seus alunos" ON public.profiles;

-- Fix 2: Restrict professor_access_keys so professors can only see their OWN keys
DROP POLICY IF EXISTS "Professores podem gerenciar chaves" ON public.professor_access_keys;

CREATE POLICY "Professores podem gerenciar suas próprias chaves"
ON public.professor_access_keys
FOR ALL
USING (
  criado_por = auth.uid() AND has_role(auth.uid(), 'professor'::app_role)
)
WITH CHECK (
  criado_por = auth.uid() AND has_role(auth.uid(), 'professor'::app_role)
);

-- Fix 3: Create RPC for UserManagement to list all profiles (without email) for professors
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE(id uuid, nome_completo text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only professors can call this
  IF NOT has_role(auth.uid(), 'professor'::app_role) THEN
    RAISE EXCEPTION 'Apenas professores podem listar perfis';
  END IF;

  RETURN QUERY
  SELECT p.id, p.nome_completo, p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;
