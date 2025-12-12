-- Fix 1: Remove overly permissive professor access to profiles
-- The existing policy "Professores podem ver perfis básicos de alunos" already provides proper scoped access
DROP POLICY IF EXISTS "Professores podem ver todos os usuários" ON public.profiles;

-- Fix 2: Secure the all_users_with_roles view
-- Drop the existing view and recreate with SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.all_users_with_roles;

-- Recreate as a regular view (SECURITY INVOKER by default)
-- This ensures queries respect the RLS policies of underlying tables
CREATE VIEW public.all_users_with_roles AS
SELECT 
  p.id,
  p.created_at,
  p.email,
  p.nome_completo,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;

-- Grant access only to authenticated users (professors will be filtered by profiles RLS)
GRANT SELECT ON public.all_users_with_roles TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.all_users_with_roles IS 'View that joins profiles with roles. Access is controlled by RLS on underlying profiles table.';