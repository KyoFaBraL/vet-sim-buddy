-- 1. Remove simulation_sessions from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.simulation_sessions;

-- 2. Recreate student_profiles_safe as explicit SECURITY INVOKER view
DROP VIEW IF EXISTS public.student_profiles_safe;

CREATE VIEW public.student_profiles_safe
WITH (security_invoker = true)
AS
SELECT p.id, p.nome_completo, p.created_at
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'aluno'::app_role;

GRANT SELECT ON public.student_profiles_safe TO authenticated;