-- Add explicit deny policies for defense-in-depth on user_roles
-- (RLS default-deny already blocks these, but explicit is better)
CREATE POLICY "Ninguém pode inserir roles diretamente" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Ninguém pode atualizar roles diretamente" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Ninguém pode deletar roles diretamente" ON public.user_roles
  FOR DELETE TO authenticated
  USING (false);

-- Add explicit INSERT policy for email_lookup_attempts (only via RPC)
CREATE POLICY "Ninguém pode inserir tentativas diretamente" ON public.email_lookup_attempts
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Ninguém pode atualizar tentativas" ON public.email_lookup_attempts
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Ninguém pode deletar tentativas" ON public.email_lookup_attempts
  FOR DELETE TO authenticated
  USING (false);