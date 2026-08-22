ALTER TABLE public.participant_codes DROP CONSTRAINT participant_codes_grupo_check;
ALTER TABLE public.participant_codes ADD CONSTRAINT participant_codes_grupo_check CHECK (grupo = ANY (ARRAY['GE'::text, 'GC'::text, 'VIS'::text]));

ALTER TABLE public.participant_codes DROP CONSTRAINT participant_codes_instituicao_check;
ALTER TABLE public.participant_codes ADD CONSTRAINT participant_codes_instituicao_check CHECK (instituicao = ANY (ARRAY['UFPI'::text, 'UNINASSAU'::text, 'DELTA_SAUDE_2026'::text]));