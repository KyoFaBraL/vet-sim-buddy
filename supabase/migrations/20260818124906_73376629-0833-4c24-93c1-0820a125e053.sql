ALTER TABLE public.participant_codes
  ADD COLUMN IF NOT EXISTS instituicao text NOT NULL DEFAULT 'UFPI';

ALTER TABLE public.participant_codes
  DROP CONSTRAINT IF EXISTS participant_codes_instituicao_check;
ALTER TABLE public.participant_codes
  ADD CONSTRAINT participant_codes_instituicao_check CHECK (instituicao IN ('UFPI', 'UNINASSAU'));

CREATE OR REPLACE FUNCTION public.assign_participant_code(p_user_id uuid DEFAULT NULL::uuid, p_instituicao text DEFAULT 'UFPI')
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := COALESCE(p_user_id, auth.uid());
  v_inst text := UPPER(COALESCE(p_instituicao, 'UFPI'));
  v_prefix text;
  v_turma uuid;
  v_next int;
  v_grupo text;
  v_codigo text;
  v_existing record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  IF v_user_id <> auth.uid() AND NOT public.is_professor_or_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'message', 'Permissão negada');
  END IF;

  IF v_inst NOT IN ('UFPI', 'UNINASSAU') THEN
    v_inst := 'UFPI';
  END IF;
  v_prefix := CASE WHEN v_inst = 'UNINASSAU' THEN 'UNI' ELSE 'UFPI' END;

  SELECT * INTO v_existing FROM public.participant_codes WHERE user_id = v_user_id;
  IF FOUND THEN
    RETURN json_build_object('success', true, 'codigo', v_existing.codigo, 'grupo', v_existing.grupo,
                             'instituicao', v_existing.instituicao, 'existente', true);
  END IF;

  SELECT ps.turma_id INTO v_turma
  FROM public.professor_students ps
  WHERE ps.student_id = v_user_id AND ps.ativo = true AND ps.turma_id IS NOT NULL
  ORDER BY ps.criado_em DESC
  LIMIT 1;

  PERFORM pg_advisory_xact_lock(hashtext('participant_codes:' || v_inst || ':' || COALESCE(v_turma::text, 'global')));

  SELECT COALESCE(MAX(sequencia), 0) + 1 INTO v_next
  FROM public.participant_codes
  WHERE instituicao = v_inst
    AND COALESCE(turma_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(v_turma, '00000000-0000-0000-0000-000000000000'::uuid);

  v_grupo := CASE WHEN v_next % 2 = 1 THEN 'GE' ELSE 'GC' END;
  v_codigo := v_prefix || '-' || v_grupo || '-' || LPAD(((v_next + 1) / 2)::text, 3, '0');

  INSERT INTO public.participant_codes (user_id, turma_id, grupo, sequencia, codigo, instituicao)
  VALUES (v_user_id, v_turma, v_grupo, v_next, v_codigo, v_inst);

  RETURN json_build_object('success', true, 'codigo', v_codigo, 'grupo', v_grupo, 'instituicao', v_inst, 'existente', false);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Erro ao atribuir código');
END;
$function$;

REVOKE ALL ON FUNCTION public.assign_participant_code(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_participant_code(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reassign_participant_code(p_user_id uuid, p_turma_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_next int;
  v_grupo text;
  v_codigo text;
  v_inst text;
  v_prefix text;
BEGIN
  IF NOT public.is_professor_or_admin(auth.uid()) THEN
    RETURN json_build_object('success', false, 'message', 'Permissão negada');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professor_students ps
    WHERE ps.student_id = p_user_id
      AND (ps.professor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
      AND ps.ativo = true
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Aluno não vinculado');
  END IF;

  SELECT instituicao INTO v_inst FROM public.participant_codes WHERE user_id = p_user_id;
  v_inst := COALESCE(v_inst, 'UFPI');
  v_prefix := CASE WHEN v_inst = 'UNINASSAU' THEN 'UNI' ELSE 'UFPI' END;

  IF EXISTS (SELECT 1 FROM public.participant_codes WHERE user_id = p_user_id AND turma_id = p_turma_id) THEN
    RETURN json_build_object('success', true, 'message', 'Código já corresponde à turma');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('participant_codes:' || v_inst || ':' || COALESCE(p_turma_id::text, 'global')));

  SELECT COALESCE(MAX(sequencia), 0) + 1 INTO v_next
  FROM public.participant_codes
  WHERE instituicao = v_inst
    AND COALESCE(turma_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(p_turma_id, '00000000-0000-0000-0000-000000000000'::uuid);

  v_grupo := CASE WHEN v_next % 2 = 1 THEN 'GE' ELSE 'GC' END;
  v_codigo := v_prefix || '-' || v_grupo || '-' || LPAD(((v_next + 1) / 2)::text, 3, '0');

  INSERT INTO public.participant_codes (user_id, turma_id, grupo, sequencia, codigo, instituicao)
  VALUES (p_user_id, p_turma_id, v_grupo, v_next, v_codigo, v_inst)
  ON CONFLICT (user_id) DO UPDATE
  SET turma_id = EXCLUDED.turma_id,
      grupo = EXCLUDED.grupo,
      sequencia = EXCLUDED.sequencia,
      codigo = EXCLUDED.codigo,
      atualizado_em = now();

  RETURN json_build_object('success', true, 'codigo', v_codigo, 'grupo', v_grupo, 'instituicao', v_inst);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Erro ao recalcular código');
END;
$function$;

DROP FUNCTION IF EXISTS public.get_participant_codes_for_professor();
CREATE OR REPLACE FUNCTION public.get_participant_codes_for_professor()
 RETURNS TABLE(user_id uuid, nome_completo text, codigo text, grupo text, instituicao text, turma_id uuid, turma_nome text, criado_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_professor_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT pc.user_id, p.nome_completo, pc.codigo, pc.grupo, pc.instituicao, pc.turma_id, t.nome, pc.criado_em
  FROM public.participant_codes pc
  LEFT JOIN public.profiles p ON p.id = pc.user_id
  LEFT JOIN public.turmas t ON t.id = pc.turma_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR EXISTS (
       SELECT 1 FROM public.professor_students ps
       WHERE ps.student_id = pc.user_id AND ps.professor_id = auth.uid() AND ps.ativo = true
     )
  ORDER BY pc.instituicao, t.nome NULLS LAST, pc.sequencia;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_participant_codes_for_professor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_participant_codes_for_professor() TO authenticated;