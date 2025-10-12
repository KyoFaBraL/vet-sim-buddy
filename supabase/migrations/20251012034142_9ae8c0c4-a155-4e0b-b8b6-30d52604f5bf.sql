-- Permitir que alunos vejam casos compartilhados ativos
-- Altera a política para permitir que alunos vejam casos através de shared_cases ativos

-- Remove política existente
DROP POLICY IF EXISTS "Usuários podem ver casos públicos e próprios" ON public.casos_clinicos;

-- Política atualizada: permite ver casos públicos, próprios, OU compartilhados ativos
CREATE POLICY "Usuários podem ver casos públicos, próprios e compartilhados" 
ON public.casos_clinicos 
FOR SELECT 
USING (
  -- Casos públicos (sem user_id)
  user_id IS NULL 
  OR 
  -- Casos próprios
  user_id = auth.uid()
  OR
  -- Casos compartilhados ativos
  EXISTS (
    SELECT 1 
    FROM public.shared_cases sc
    WHERE sc.case_id = casos_clinicos.id 
      AND sc.ativo = true
  )
);