CREATE OR REPLACE FUNCTION public.assign_participant_code(p_user_id uuid DEFAULT NULL::uuid, p_instituicao text DEFAULT 'UFPI'::text)
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

  IF v_inst NOT IN ('UFPI', 'UNINASSAU', 'DELTA_SAUDE_2026') THEN
    v_inst := 'UFPI';
  END IF;
  v_prefix := CASE
    WHEN v_inst = 'UNINASSAU' THEN 'UNI'
    WHEN v_inst = 'DELTA_SAUDE_2026' THEN 'DS26'
    ELSE 'UFPI'
  END;

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

  IF v_inst = 'DELTA_SAUDE_2026' THEN
    -- Visitantes do congresso: fora dos grupos experimentais da pesquisa
    v_grupo := 'VIS';
    v_codigo := v_prefix || '-VIS-' || LPAD(v_next::text, 3, '0');
  ELSE
    v_grupo := CASE WHEN v_next % 2 = 1 THEN 'GE' ELSE 'GC' END;
    v_codigo := v_prefix || '-' || v_grupo || '-' || LPAD(((v_next + 1) / 2)::text, 3, '0');
  END IF;

  INSERT INTO public.participant_codes (user_id, turma_id, grupo, sequencia, codigo, instituicao)
  VALUES (v_user_id, v_turma, v_grupo, v_next, v_codigo, v_inst);

  RETURN json_build_object('success', true, 'codigo', v_codigo, 'grupo', v_grupo, 'instituicao', v_inst, 'existente', false);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Erro ao atribuir código');
END;
$function$;