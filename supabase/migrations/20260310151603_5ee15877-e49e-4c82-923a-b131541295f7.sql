-- Fix 1: Restrict get_all_profiles_for_admin to not return emails for professors
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
 RETURNS TABLE(id uuid, nome_completo text, created_at timestamp with time zone, role text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Apenas professores podem listar perfis';
  END IF;

  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
    SELECT p.id, p.nome_completo, p.created_at, ur.role::text, p.email
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    ORDER BY p.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT p.id, p.nome_completo, p.created_at, ur.role::text, NULL::text AS email
    FROM profiles p
    INNER JOIN professor_students ps ON ps.student_id = p.id AND ps.professor_id = auth.uid() AND ps.ativo = true
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = p.id AND ur2.role = 'admin'
    )
    ORDER BY p.created_at DESC;
  END IF;
END;
$function$;

-- Fix 2: Allow professors to delete their own email lookup attempts
CREATE POLICY "Professores podem deletar suas tentativas"
ON public.email_lookup_attempts
FOR DELETE
TO public
USING (auth.uid() = professor_id AND has_role(auth.uid(), 'professor'::app_role));