
-- 1. Tighten casos_clinicos public read to require authentication
DROP POLICY IF EXISTS "Usuários podem ver casos públicos, próprios e compartilhados" ON public.casos_clinicos;

CREATE POLICY "Usuários autenticados podem ver casos públicos, próprios e compartilhados"
ON public.casos_clinicos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    user_id IS NULL
    OR user_id = auth.uid()
    OR (has_role(auth.uid(), 'aluno'::app_role) AND EXISTS (
      SELECT 1 FROM shared_cases sc
      WHERE sc.case_id = casos_clinicos.id
        AND sc.ativo = true
        AND (sc.expira_em IS NULL OR sc.expira_em > now())
    ))
    OR has_role(auth.uid(), 'professor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 2. Revoke EXECUTE from PUBLIC and anon on all public SECURITY DEFINER functions
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

-- Re-grant EXECUTE to authenticated for functions that need it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_professor_access_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_professor_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_name(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_professor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_to_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_linked_students_for_professor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_profile_for_professor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_tcle_consents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_case_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_aluno(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_professor(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_professor(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_weekly_ranking(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_access_code() TO authenticated;
-- handle_new_user, increment_access_count, purge_old_email_lookups: trigger/admin only, no grants
