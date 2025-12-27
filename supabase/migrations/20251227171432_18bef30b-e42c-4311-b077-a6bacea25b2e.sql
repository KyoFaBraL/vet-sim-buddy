-- =====================================================
-- FIX 1: Restrict profiles table - professors should NOT see student emails
-- =====================================================

-- Drop the existing policy that allows professors to see full profiles
DROP POLICY IF EXISTS "Professores podem ver perfis básicos de alunos" ON public.profiles;

-- Create a more restrictive policy - professors can see student profiles 
-- ONLY through the student_profiles_safe view, not directly
-- The profiles table SELECT should only allow users to see their own profile
-- Keep the existing "Usuários podem ver seu próprio perfil" policy

-- =====================================================
-- FIX 2: Add auto-purge for email_lookup_attempts (older than 30 days)
-- =====================================================

-- Create a function to purge old email lookup attempts
CREATE OR REPLACE FUNCTION public.purge_old_email_lookups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_lookup_attempts
  WHERE attempted_at < now() - interval '30 days';
END;
$$;

-- =====================================================
-- FIX 3: Fix professor_access_keys - create secure validation function
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Todos podem validar chaves ativas" ON public.professor_access_keys;

-- Create a SECURITY DEFINER function for secure key validation
-- This returns only boolean, not key details
CREATE OR REPLACE FUNCTION public.validate_professor_access_key(key_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.professor_access_keys
    WHERE access_key = key_to_check
      AND ativo = true
      AND usado = false
      AND (expira_em IS NULL OR expira_em > now())
  );
END;
$$;

-- =====================================================
-- FIX 4: Add DELETE policies for session_history and session_decisions
-- =====================================================

-- Allow users to delete their own session history
CREATE POLICY "Usuários podem deletar histórico de suas sessões"
  ON public.session_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM simulation_sessions
      WHERE simulation_sessions.id = session_history.session_id
        AND simulation_sessions.user_id = auth.uid()
    )
  );

-- Allow users to delete their own session decisions
CREATE POLICY "Usuários podem deletar decisões de suas sessões"
  ON public.session_decisions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM simulation_sessions
      WHERE simulation_sessions.id = session_decisions.session_id
        AND simulation_sessions.user_id = auth.uid()
    )
  );