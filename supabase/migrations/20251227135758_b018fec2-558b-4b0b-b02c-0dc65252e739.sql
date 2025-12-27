-- Fix 1: Drop the all_users_with_roles view that exposes all user emails
DROP VIEW IF EXISTS public.all_users_with_roles;

-- Fix 2: Drop and recreate student_profiles_safe with RLS protection
DROP VIEW IF EXISTS public.student_profiles_safe;

-- Recreate student_profiles_safe as a table-like view with RLS
CREATE VIEW public.student_profiles_safe 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.created_at,
  p.nome_completo
FROM public.profiles p
INNER JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'aluno';

-- Grant access only to authenticated users
GRANT SELECT ON public.student_profiles_safe TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.student_profiles_safe IS 'View of student profiles without email. Uses SECURITY INVOKER so RLS on underlying profiles table is respected.';