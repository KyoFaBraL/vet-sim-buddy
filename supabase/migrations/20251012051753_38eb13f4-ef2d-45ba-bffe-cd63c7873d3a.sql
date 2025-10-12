-- Fix #1: Recreate student_profiles_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.student_profiles_safe;

CREATE VIEW public.student_profiles_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome_completo,
  created_at
FROM public.profiles;

-- Fix #2: Add rate limiting to email lookup function
-- Create table to track email lookup attempts
CREATE TABLE IF NOT EXISTS public.email_lookup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL,
  searched_email TEXT NOT NULL,
  found BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_lookup_professor_time 
ON public.email_lookup_attempts(professor_id, attempted_at);

-- Enable RLS on the tracking table
ALTER TABLE public.email_lookup_attempts ENABLE ROW LEVEL SECURITY;

-- Allow professors to see their own attempts
CREATE POLICY "Professores podem ver suas tentativas"
ON public.email_lookup_attempts
FOR SELECT
USING (auth.uid() = professor_id);

-- Recreate the function with rate limiting
CREATE OR REPLACE FUNCTION public.get_student_id_by_email(student_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_user_id UUID;
  recent_attempts INT;
BEGIN
  -- Check attempts in last hour
  SELECT COUNT(*) INTO recent_attempts
  FROM public.email_lookup_attempts
  WHERE professor_id = auth.uid()
  AND attempted_at > now() - interval '1 hour';
  
  -- Rate limit: max 10 lookups per hour
  IF recent_attempts >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 10 email lookups per hour. Please try again later.';
  END IF;
  
  -- Busca o ID do usuário pelo email
  SELECT id INTO student_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(student_email));
  
  -- Verifica se o usuário tem role de aluno (se encontrou)
  IF student_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = student_user_id
      AND role = 'aluno'
    ) THEN
      student_user_id := NULL;
    END IF;
  END IF;
  
  -- Log attempt for rate limiting
  INSERT INTO public.email_lookup_attempts (professor_id, searched_email, found)
  VALUES (auth.uid(), student_email, student_user_id IS NOT NULL);
  
  -- Retorna o ID do aluno ou NULL
  RETURN student_user_id;
END;
$$;