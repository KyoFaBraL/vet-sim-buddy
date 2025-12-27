-- =====================================================
-- FIX 1: Restrict email visibility in profiles table
-- =====================================================
-- Drop and recreate the student_profiles_safe view to exclude email
-- This is a SECURITY DEFINER view that only exposes safe fields

DROP VIEW IF EXISTS public.student_profiles_safe;

CREATE VIEW public.student_profiles_safe 
WITH (security_invoker = false)
AS 
SELECT 
  p.id,
  p.nome_completo,
  p.created_at
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'aluno'::app_role;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.student_profiles_safe TO authenticated;

-- =====================================================
-- FIX 2: Add explicit denial for students on professor_private_notes
-- =====================================================
-- The existing policy already restricts to professor_id = auth.uid()
-- But we add an explicit check that user must be a professor

-- Drop the existing policy
DROP POLICY IF EXISTS "Professores podem gerenciar suas próprias notas" ON public.professor_private_notes;

-- Create a more restrictive policy that explicitly checks professor role
CREATE POLICY "Professores podem gerenciar suas próprias notas"
  ON public.professor_private_notes
  FOR ALL
  USING (
    professor_id = auth.uid() 
    AND has_role(auth.uid(), 'professor'::app_role)
  )
  WITH CHECK (
    professor_id = auth.uid() 
    AND has_role(auth.uid(), 'professor'::app_role)
  );

-- =====================================================
-- FIX 3: Modify profiles SELECT policy to exclude email from student access
-- =====================================================
-- Create a SECURITY DEFINER function to get limited profile info for professors
-- This returns student profiles WITHOUT email for non-owners

CREATE OR REPLACE FUNCTION public.get_student_profile_for_professor(student_user_id UUID)
RETURNS TABLE (
  id UUID,
  nome_completo TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a professor with an active relationship to this student
  IF NOT EXISTS (
    SELECT 1 FROM professor_students ps
    WHERE ps.professor_id = auth.uid()
      AND ps.student_id = student_user_id
      AND ps.ativo = true
  ) THEN
    RETURN;
  END IF;
  
  -- Verify caller is a professor
  IF NOT has_role(auth.uid(), 'professor'::app_role) THEN
    RETURN;
  END IF;
  
  -- Return limited profile data (no email)
  RETURN QUERY
  SELECT p.id, p.nome_completo, p.created_at
  FROM profiles p
  WHERE p.id = student_user_id;
END;
$$;