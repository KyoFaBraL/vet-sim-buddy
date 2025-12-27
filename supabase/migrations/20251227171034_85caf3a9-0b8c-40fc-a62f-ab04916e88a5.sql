-- Fix the SECURITY DEFINER view warning by using SECURITY INVOKER
-- This will enforce RLS of the querying user instead of the view creator

DROP VIEW IF EXISTS public.student_profiles_safe;

CREATE VIEW public.student_profiles_safe 
WITH (security_invoker = true)
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