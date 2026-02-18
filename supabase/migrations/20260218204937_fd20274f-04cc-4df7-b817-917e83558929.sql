-- Allow students to see active shared cases (needed for RLS subquery in casos_clinicos)
CREATE POLICY "Alunos podem ver casos compartilhados ativos"
ON public.shared_cases
FOR SELECT
USING (ativo = true AND has_role(auth.uid(), 'aluno'::app_role));