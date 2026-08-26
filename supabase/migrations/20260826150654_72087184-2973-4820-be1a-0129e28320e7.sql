CREATE OR REPLACE FUNCTION public.get_sus_reminder_targets()
RETURNS TABLE(
  user_id uuid,
  nome_completo text,
  email text,
  codigo text,
  grupo text,
  respondeu boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pc.user_id,
         p.nome_completo,
         p.email,
         pc.codigo,
         pc.grupo,
         (s.id IS NOT NULL) AS respondeu
  FROM public.participant_codes pc
  JOIN public.profiles p ON p.id = pc.user_id
  LEFT JOIN public.sus_responses s ON s.user_id = pc.user_id
  WHERE pc.instituicao = 'UNINASSAU'
    AND public.is_professor_or_admin(auth.uid())
  ORDER BY pc.codigo;
$$;

REVOKE ALL ON FUNCTION public.get_sus_reminder_targets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sus_reminder_targets() TO authenticated;