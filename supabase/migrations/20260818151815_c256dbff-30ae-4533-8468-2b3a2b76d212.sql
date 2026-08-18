CREATE TABLE public.participation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('login', 'tcle_aceito')),
  instituicao text,
  codigo text,
  versao_tcle text,
  user_agent text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.participation_log TO authenticated;
GRANT ALL ON public.participation_log TO service_role;

ALTER TABLE public.participation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participation log"
ON public.participation_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Professors and admins can view all participation logs"
ON public.participation_log FOR SELECT TO authenticated
USING (public.is_professor_or_admin(auth.uid()));

CREATE INDEX participation_log_user_idx ON public.participation_log (user_id, criado_em DESC);
CREATE INDEX participation_log_tipo_idx ON public.participation_log (tipo, criado_em DESC);

CREATE OR REPLACE FUNCTION public.log_participation_event(
  p_tipo text,
  p_instituicao text DEFAULT NULL,
  p_versao_tcle text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_codigo text;
  v_inst text;
  v_last timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF p_tipo NOT IN ('login', 'tcle_aceito') THEN
    RETURN json_build_object('success', false, 'error', 'invalid_type');
  END IF;

  SELECT codigo, instituicao INTO v_codigo, v_inst
  FROM public.participant_codes WHERE user_id = v_user LIMIT 1;

  -- Deduplicate: ignore repeated logins within 30 minutes
  IF p_tipo = 'login' THEN
    SELECT criado_em INTO v_last
    FROM public.participation_log
    WHERE user_id = v_user AND tipo = 'login'
    ORDER BY criado_em DESC LIMIT 1;

    IF v_last IS NOT NULL AND v_last > now() - interval '30 minutes' THEN
      RETURN json_build_object('success', true, 'skipped', true);
    END IF;
  END IF;

  INSERT INTO public.participation_log (user_id, tipo, instituicao, codigo, versao_tcle, user_agent)
  VALUES (v_user, p_tipo, COALESCE(p_instituicao, v_inst), v_codigo, p_versao_tcle, left(COALESCE(p_user_agent, ''), 300));

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.log_participation_event(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_participation_event(text, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_participation_log_for_professor()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  nome_completo text,
  email text,
  tipo text,
  instituicao text,
  codigo text,
  versao_tcle text,
  criado_em timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_professor_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT l.id, l.user_id, p.nome_completo, p.email, l.tipo, l.instituicao, l.codigo, l.versao_tcle, l.criado_em
  FROM public.participation_log l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  ORDER BY l.criado_em DESC
  LIMIT 2000;
END;
$$;

REVOKE ALL ON FUNCTION public.get_participation_log_for_professor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_participation_log_for_professor() TO authenticated, service_role;