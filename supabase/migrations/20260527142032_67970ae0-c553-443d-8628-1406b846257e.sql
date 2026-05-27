
REVOKE EXECUTE ON FUNCTION public.validate_professor_access_key(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_email(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_name(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_shared_case_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.demote_to_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_professor(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_professor(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_linked_students_for_professor() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_professor_key(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_to_professor(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_student_profile_for_professor(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_all_profiles_for_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_student_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_weekly_ranking(date, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_badge(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_aluno(uuid, text, text) FROM anon;
