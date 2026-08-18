CREATE TABLE public.participant_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
  grupo text NOT NULL CHECK (grupo IN ('GE','GC')),
  sequencia integer NOT NULL,
  codigo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX participant_codes_turma_codigo_idx
  ON public.participant_codes (COALESCE(turma_id, '00000000-0000-0000-0000-000000000000'::uuid), codigo);

GRANT SELECT ON public.participant_codes TO authenticated;
GRANT ALL ON public.participant_codes TO service_role;

ALTER TABLE public.participant_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos veem o proprio codigo"
ON public.participant_codes FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Professores veem codigos dos alunos vinculados"
ON public.participant_codes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professor_students ps
    WHERE ps.student_id = participant_codes.user_id
      AND ps.professor_id = auth.uid()
      AND ps.ativo = true
  )
);

CREATE POLICY "Admins veem todos os codigos"
ON public.participant_codes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.assign_participant_code(p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := COALESCE(p_user_id, auth.uid());
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

  SELECT * INTO v_existing FROM public.participant_codes WHERE user_id = v_user_id;
  IF FOUND THEN
    RETURN json_build_object('success', true, 'codigo', v_existing.codigo, 'grupo', v_existing.grupo, 'existente', true);
  END IF;

  SELECT ps.turma_id INTO v_turma
  FROM public.professor_students ps
  WHERE ps.student_id = v_user_id AND ps.ativo = true AND ps.turma_id IS NOT NULL
  ORDER BY ps.criado_em DESC
  LIMIT 1;

  PERFORM pg_advisory_xact_lock(hashtext('participant_codes:' || COALESCE(v_turma::text, 'global')));

  SELECT COALESCE(MAX(sequencia), 0) + 1 INTO v_next
  FROM public.participant_codes
  WHERE COALESCE(turma_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(v_turma, '00000000-0000-0000-0000-000000000000'::uuid);

  v_grupo := CASE WHEN v_next % 2 = 1 THEN 'GE' ELSE 'GC' END;
  v_codigo := v_grupo || '-' || LPAD(((v_next + 1) / 2)::text, 3, '0');

  INSERT INTO public.participant_codes (user_id, turma_id, grupo, sequencia, codigo)
  VALUES (v_user_id, v_turma, v_grupo, v_next, v_codigo);

  RETURN json_build_object('success', true, 'codigo', v_codigo, 'grupo', v_grupo, 'existente', false);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Erro ao atribuir código');
END;
$$;

CREATE OR REPLACE FUNCTION public.reassign_participant_code(p_user_id uuid, p_turma_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next int;
  v_grupo text;
  v_codigo text;
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

  IF EXISTS (SELECT 1 FROM public.participant_codes WHERE user_id = p_user_id AND turma_id = p_turma_id) THEN
    RETURN json_build_object('success', true, 'message', 'Código já corresponde à turma');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('participant_codes:' || COALESCE(p_turma_id::text, 'global')));

  SELECT COALESCE(MAX(sequencia), 0) + 1 INTO v_next
  FROM public.participant_codes
  WHERE COALESCE(turma_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(p_turma_id, '00000000-0000-0000-0000-000000000000'::uuid);

  v_grupo := CASE WHEN v_next % 2 = 1 THEN 'GE' ELSE 'GC' END;
  v_codigo := v_grupo || '-' || LPAD(((v_next + 1) / 2)::text, 3, '0');

  INSERT INTO public.participant_codes (user_id, turma_id, grupo, sequencia, codigo)
  VALUES (p_user_id, p_turma_id, v_grupo, v_next, v_codigo)
  ON CONFLICT (user_id) DO UPDATE
  SET turma_id = EXCLUDED.turma_id,
      grupo = EXCLUDED.grupo,
      sequencia = EXCLUDED.sequencia,
      codigo = EXCLUDED.codigo,
      atualizado_em = now();

  RETURN json_build_object('success', true, 'codigo', v_codigo, 'grupo', v_grupo);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Erro ao recalcular código');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_participant_codes_for_professor()
RETURNS TABLE(user_id uuid, nome_completo text, codigo text, grupo text, turma_id uuid, turma_nome text, criado_em timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_professor_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT pc.user_id, p.nome_completo, pc.codigo, pc.grupo, pc.turma_id, t.nome, pc.criado_em
  FROM public.participant_codes pc
  LEFT JOIN public.profiles p ON p.id = pc.user_id
  LEFT JOIN public.turmas t ON t.id = pc.turma_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR EXISTS (
       SELECT 1 FROM public.professor_students ps
       WHERE ps.student_id = pc.user_id AND ps.professor_id = auth.uid() AND ps.ativo = true
     )
  ORDER BY t.nome NULLS LAST, pc.sequencia;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_participant_code(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.reassign_participant_code(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_participant_codes_for_professor() FROM anon;