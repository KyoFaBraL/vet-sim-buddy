-- Criar função segura para professores encontrarem alunos por email
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(student_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_user_id UUID;
BEGIN
  -- Busca o ID do usuário pelo email
  SELECT id INTO student_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(student_email));
  
  -- Se não encontrou, retorna NULL
  IF student_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verifica se o usuário tem role de aluno
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = student_user_id
    AND role = 'aluno'
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Retorna o ID do aluno
  RETURN student_user_id;
END;
$$;

-- Adicionar policy para professores verem informações básicas de seus alunos
CREATE POLICY "Professores podem ver perfis de seus alunos"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_students ps
    WHERE ps.student_id = profiles.id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  )
);