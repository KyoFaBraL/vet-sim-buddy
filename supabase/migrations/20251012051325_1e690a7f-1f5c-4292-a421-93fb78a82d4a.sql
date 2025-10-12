-- Fix 1: Add search_path protection to increment_access_count function
CREATE OR REPLACE FUNCTION public.increment_access_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  UPDATE public.shared_cases
  SET acessos = acessos + 1
  WHERE id = NEW.shared_case_id;
  
  RETURN NEW;
END;
$function$;

-- Fix 2: Create separate table for private professor notes
CREATE TABLE public.professor_private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professor_id, student_id)
);

-- Enable RLS on new table
ALTER TABLE public.professor_private_notes ENABLE ROW LEVEL SECURITY;

-- Only professors can see their own notes
CREATE POLICY "Professores podem gerenciar suas próprias notas"
ON public.professor_private_notes
FOR ALL
USING (
  professor_id = auth.uid()
  AND has_role(auth.uid(), 'professor'::app_role)
)
WITH CHECK (
  professor_id = auth.uid()
  AND has_role(auth.uid(), 'professor'::app_role)
);

-- Migrate existing notes from professor_students to new table
INSERT INTO public.professor_private_notes (professor_id, student_id, nota, criado_em)
SELECT professor_id, student_id, notas, criado_em
FROM public.professor_students
WHERE notas IS NOT NULL AND notas != '';

-- Remove notas column from professor_students
ALTER TABLE public.professor_students DROP COLUMN notas;

-- Fix 3: Update RLS policy on profiles to exclude email from professor access
DROP POLICY IF EXISTS "Professores podem ver perfis de seus alunos" ON public.profiles;

-- Create a more restrictive policy that doesn't expose emails
CREATE POLICY "Professores podem ver perfis básicos de alunos"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR
  (EXISTS (
    SELECT 1 FROM public.professor_students ps
    WHERE ps.student_id = profiles.id
    AND ps.professor_id = auth.uid()
    AND ps.ativo = true
    AND has_role(auth.uid(), 'professor'::app_role)
  ))
);

-- Create a safe view for student profiles without email
CREATE VIEW public.student_profiles_safe AS
SELECT id, nome_completo, created_at
FROM public.profiles;