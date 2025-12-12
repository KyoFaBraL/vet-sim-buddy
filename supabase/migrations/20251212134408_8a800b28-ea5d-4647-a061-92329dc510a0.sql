-- Fix the all_users_with_roles view to use SECURITY INVOKER explicitly
DROP VIEW IF EXISTS public.all_users_with_roles;

-- Recreate with explicit SECURITY INVOKER option
CREATE VIEW public.all_users_with_roles 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.created_at,
  p.email,
  p.nome_completo,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;

-- Grant access only to authenticated users
GRANT SELECT ON public.all_users_with_roles TO authenticated;

-- Add comment
COMMENT ON VIEW public.all_users_with_roles IS 'View that joins profiles with roles. Uses SECURITY INVOKER so RLS on underlying tables is respected.';