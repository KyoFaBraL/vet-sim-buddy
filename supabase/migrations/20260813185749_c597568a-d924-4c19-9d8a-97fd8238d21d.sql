REVOKE ALL ON FUNCTION public.validate_professor_access_key(text) FROM anon;
REVOKE ALL ON FUNCTION public.validate_professor_access_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_professor_access_key(text) TO authenticated, service_role;