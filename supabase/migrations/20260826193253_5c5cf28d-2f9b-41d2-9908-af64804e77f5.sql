ALTER TABLE public.participation_log DROP CONSTRAINT IF EXISTS participation_log_tipo_check;
ALTER TABLE public.participation_log ADD CONSTRAINT participation_log_tipo_check
  CHECK (tipo = ANY (ARRAY['login'::text, 'tcle_aceito'::text, 'sus_aberto'::text, 'sus_respondido'::text]));

CREATE OR REPLACE FUNCTION public.log_participation_event(p_tipo text, p_instituicao text DEFAULT NULL::text, p_versao_tcle text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_codigo text;
  v_inst text;
  v_last timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF p_tipo NOT IN ('login', 'tcle_aceito', 'sus_aberto', 'sus_respondido') THEN
    RETURN json_build_object('success', false, 'error', 'invalid_type');
  END IF;

  SELECT codigo, instituicao INTO v_codigo, v_inst
  FROM public.participant_codes WHERE user_id = v_user LIMIT 1;

  IF p_tipo = 'login' THEN
    SELECT criado_em INTO v_last
    FROM public.participation_log
    WHERE user_id = v_user AND tipo = 'login'
    ORDER BY criado_em DESC LIMIT 1;

    IF v_last IS NOT NULL AND v_last > now() - interval '30 minutes' THEN
      RETURN json_build_object('success', true, 'skipped', true);
    END IF;
  END IF;

  IF p_tipo = 'sus_aberto' THEN
    SELECT criado_em INTO v_last
    FROM public.participation_log
    WHERE user_id = v_user AND tipo = 'sus_aberto'
    ORDER BY criado_em DESC LIMIT 1;

    IF v_last IS NOT NULL AND v_last > now() - interval '5 minutes' THEN
      RETURN json_build_object('success', true, 'skipped', true);
    END IF;
  END IF;

  INSERT INTO public.participation_log (user_id, tipo, instituicao, codigo, versao_tcle, user_agent)
  VALUES (v_user, p_tipo, COALESCE(p_instituicao, v_inst), v_codigo, p_versao_tcle, left(COALESCE(p_user_agent, ''), 300));

  RETURN json_build_object('success', true);
END;
$function$;

DROP FUNCTION IF EXISTS public.get_sus_reminder_targets();

CREATE FUNCTION public.get_sus_reminder_targets()
 RETURNS TABLE(user_id uuid, nome_completo text, email text, codigo text, grupo text, respondeu boolean, aberturas integer, ultima_abertura timestamp with time zone, respondido_em timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT pc.user_id,
         p.nome_completo,
         p.email,
         pc.codigo,
         pc.grupo,
         (s.id IS NOT NULL) AS respondeu,
         COALESCE(l.aberturas, 0)::int AS aberturas,
         l.ultima_abertura,
         s.criado_em AS respondido_em
  FROM public.participant_codes pc
  JOIN public.profiles p ON p.id = pc.user_id
  LEFT JOIN public.sus_responses s ON s.user_id = pc.user_id
  LEFT JOIN (
    SELECT pl.user_id, COUNT(*) AS aberturas, MAX(pl.criado_em) AS ultima_abertura
    FROM public.participation_log pl
    WHERE pl.tipo = 'sus_aberto'
    GROUP BY pl.user_id
  ) l ON l.user_id = pc.user_id
  WHERE pc.instituicao = 'UNINASSAU'
    AND public.is_professor_or_admin(auth.uid())
  ORDER BY pc.codigo;
$function$;