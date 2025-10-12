-- Criar tabela de turmas
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ano_letivo TEXT,
  periodo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para turmas
CREATE POLICY "Professores podem ver suas turmas"
  ON public.turmas
  FOR SELECT
  USING (auth.uid() = professor_id AND has_role(auth.uid(), 'professor'));

CREATE POLICY "Professores podem criar turmas"
  ON public.turmas
  FOR INSERT
  WITH CHECK (auth.uid() = professor_id AND has_role(auth.uid(), 'professor'));

CREATE POLICY "Professores podem atualizar suas turmas"
  ON public.turmas
  FOR UPDATE
  USING (auth.uid() = professor_id AND has_role(auth.uid(), 'professor'));

CREATE POLICY "Professores podem deletar suas turmas"
  ON public.turmas
  FOR DELETE
  USING (auth.uid() = professor_id AND has_role(auth.uid(), 'professor'));

-- Adicionar coluna turma_id na tabela professor_students
ALTER TABLE public.professor_students 
ADD COLUMN turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX idx_turmas_professor_id ON public.turmas(professor_id);
CREATE INDEX idx_turmas_ativo ON public.turmas(ativo);
CREATE INDEX idx_professor_students_turma_id ON public.professor_students(turma_id);

-- Política para alunos verem suas turmas
CREATE POLICY "Alunos podem ver turmas onde estão matriculados"
  ON public.turmas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professor_students
      WHERE professor_students.turma_id = turmas.id
      AND professor_students.student_id = auth.uid()
      AND professor_students.ativo = true
    )
  );