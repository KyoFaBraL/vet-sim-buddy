-- Adicionar política RLS para permitir que usuários insiram seus próprios roles
CREATE POLICY "Usuários podem inserir seus próprios roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);