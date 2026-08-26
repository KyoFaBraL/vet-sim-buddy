CREATE TABLE public.notification_broadcasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  url text,
  ativo boolean NOT NULL DEFAULT true,
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_broadcasts TO anon;
GRANT SELECT ON public.notification_broadcasts TO authenticated;
GRANT ALL ON public.notification_broadcasts TO service_role;

ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer visitante pode ver avisos ativos"
ON public.notification_broadcasts
FOR SELECT
TO anon, authenticated
USING (ativo = true AND expira_em > now());

CREATE POLICY "Admins gerenciam avisos"
ON public.notification_broadcasts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.create_notification_broadcast(
  p_titulo text,
  p_mensagem text,
  p_url text DEFAULT NULL,
  p_duracao_horas integer DEFAULT 168
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'not_authorized');
  END IF;

  IF coalesce(trim(p_titulo), '') = '' OR coalesce(trim(p_mensagem), '') = '' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_input');
  END IF;

  UPDATE public.notification_broadcasts SET ativo = false WHERE ativo = true;

  INSERT INTO public.notification_broadcasts (titulo, mensagem, url, expira_em, criado_por)
  VALUES (
    left(trim(p_titulo), 120),
    left(trim(p_mensagem), 400),
    nullif(left(coalesce(p_url, ''), 300), ''),
    now() + make_interval(hours => greatest(1, least(coalesce(p_duracao_horas, 168), 720))),
    auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN json_build_object('success', true, 'id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_notification_broadcasts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'not_authorized');
  END IF;
  UPDATE public.notification_broadcasts SET ativo = false WHERE ativo = true;
  RETURN json_build_object('success', true);
END;
$$;