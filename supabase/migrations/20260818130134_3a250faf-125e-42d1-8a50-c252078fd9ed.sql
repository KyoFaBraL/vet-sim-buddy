CREATE TABLE public.sus_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  instituicao text NOT NULL DEFAULT 'UFPI',
  codigo text,
  respostas jsonb NOT NULL,
  comentarios text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sus_responses_user_unique UNIQUE (user_id),
  CONSTRAINT sus_responses_instituicao_check CHECK (instituicao IN ('UFPI','UNINASSAU'))
);

GRANT SELECT, INSERT, UPDATE ON public.sus_responses TO authenticated;
GRANT ALL ON public.sus_responses TO service_role;

ALTER TABLE public.sus_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sus_select_own" ON public.sus_responses
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "sus_select_professor_admin" ON public.sus_responses
  FOR SELECT TO authenticated USING (public.is_professor_or_admin(auth.uid()));

CREATE POLICY "sus_insert_own" ON public.sus_responses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "sus_update_own" ON public.sus_responses
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sus_set_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sus_responses_updated
BEFORE UPDATE ON public.sus_responses
FOR EACH ROW EXECUTE FUNCTION public.sus_set_atualizado_em();

INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('sus_deadline', '2026-08-28', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();