CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read settings" ON public.app_settings;
CREATE POLICY "Admins can read settings"
ON public.app_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_settings (key, value)
VALUES ('ai_feedback_mode', 'deterministic')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_ai_feedback_mode()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT value FROM public.app_settings WHERE key = 'ai_feedback_mode'), 'deterministic')
$$;

CREATE OR REPLACE FUNCTION public.set_ai_feedback_mode(new_mode text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem alterar esta configuração');
  END IF;

  IF new_mode NOT IN ('deterministic', 'auto', 'ai') THEN
    RETURN json_build_object('success', false, 'message', 'Modo inválido');
  END IF;

  INSERT INTO public.app_settings (key, value, updated_at, updated_by)
  VALUES ('ai_feedback_mode', new_mode, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now(), updated_by = auth.uid();

  RETURN json_build_object('success', true, 'message', 'Modo atualizado', 'mode', new_mode);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_feedback_mode() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.set_ai_feedback_mode(text) TO authenticated;