
CREATE OR REPLACE FUNCTION public.get_linked_students_for_professor()
 RETURNS TABLE(rel_id uuid, student_id uuid, nome_completo text, email text, criado_em timestamptz, ativo boolean, turma_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Apenas professores podem listar alunos vinculados';
  END IF;

  RETURN QUERY
  SELECT ps.id as rel_id, ps.student_id, p.nome_completo, p.email, ps.criado_em, ps.ativo, ps.turma_id
  FROM professor_students ps
  LEFT JOIN profiles p ON p.id = ps.student_id
  WHERE ps.professor_id = auth.uid()
    AND ps.ativo = true
  ORDER BY ps.criado_em DESC;
END;
$function$;
