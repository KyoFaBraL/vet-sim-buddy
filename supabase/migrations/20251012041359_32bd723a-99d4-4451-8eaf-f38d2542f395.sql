-- Tabela de relacionamento professor-aluno
CREATE TABLE public.professor_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true,
  notas text,
  UNIQUE(professor_id, student_id)
);

-- Enable RLS
ALTER TABLE public.professor_students ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar seus alunos
CREATE POLICY "Professores podem gerenciar seus alunos"
ON public.professor_students
FOR ALL
USING (
  auth.uid() = professor_id AND 
  has_role(auth.uid(), 'professor'::app_role)
)
WITH CHECK (
  auth.uid() = professor_id AND 
  has_role(auth.uid(), 'professor'::app_role)
);

-- Alunos podem ver seus professores
CREATE POLICY "Alunos podem ver seus professores"
ON public.professor_students
FOR SELECT
USING (
  auth.uid() = student_id AND 
  has_role(auth.uid(), 'aluno'::app_role)
);

-- Índices para performance
CREATE INDEX idx_professor_students_professor ON public.professor_students(professor_id);
CREATE INDEX idx_professor_students_student ON public.professor_students(student_id);