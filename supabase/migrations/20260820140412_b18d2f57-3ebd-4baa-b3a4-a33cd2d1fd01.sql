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

  -- Do NOT pre-create a code: the institution is only known when the student
  -- accepts the consent form (TCLE). Skip silently in that case.
  IF v_inst IS NULL THEN
    RETURN json_build_object('success', true, 'skipped', true,
      'message', 'Código será gerado no aceite do TCLE, com a instituição escolhida pelo aluno');
  END IF;

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