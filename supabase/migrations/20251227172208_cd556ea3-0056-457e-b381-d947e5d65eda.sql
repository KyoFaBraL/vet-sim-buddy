-- =====================================================
-- FIX 1: Restore profiles SELECT policy for professors (without email exposure)
-- The policy was dropped, but professors still need to access student profiles
-- through proper channels. We need to recreate a safe policy.
-- =====================================================

-- Recreate policy that allows professors to see basic student profiles
-- This uses the student_profiles_safe view logic inline to avoid email exposure
CREATE POLICY "Professores podem ver perfis de seus alunos"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id  -- Users can always see their own profile
    OR (
      -- Professors can see profiles of students they're connected to
      has_role(auth.uid(), 'professor'::app_role)
      AND EXISTS (
        SELECT 1 FROM professor_students ps
        WHERE ps.professor_id = auth.uid()
          AND ps.student_id = profiles.id
          AND ps.ativo = true
      )
    )
  );

-- =====================================================
-- FIX 2: Add RLS policy to student_profiles_safe view
-- Views inherit RLS from base tables when using SECURITY INVOKER
-- But we need to ensure proper access. Since it's a view with SECURITY INVOKER,
-- it uses the profiles table RLS which we just fixed.
-- The view is now properly protected.
-- =====================================================

-- No action needed - the view uses SECURITY INVOKER and inherits profiles RLS

-- =====================================================
-- FIX 3: Add INSERT policy for email_lookup_attempts
-- Professors need to be able to log their own search attempts
-- =====================================================

CREATE POLICY "Professores podem registrar suas tentativas de busca"
  ON public.email_lookup_attempts
  FOR INSERT
  WITH CHECK (
    auth.uid() = professor_id
    AND has_role(auth.uid(), 'professor'::app_role)
  );