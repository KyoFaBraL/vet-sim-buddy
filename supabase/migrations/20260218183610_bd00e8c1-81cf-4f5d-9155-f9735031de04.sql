
DROP POLICY "Professores podem gerenciar suas próprias chaves" ON public.professor_access_keys;

CREATE POLICY "Professores e admins podem gerenciar suas próprias chaves"
ON public.professor_access_keys
FOR ALL
USING (
  (criado_por = auth.uid()) AND 
  (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  (criado_por = auth.uid()) AND 
  (has_role(auth.uid(), 'professor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);
