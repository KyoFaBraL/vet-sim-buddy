
-- Table to store TCLE (Informed Consent) acceptances
CREATE TABLE public.tcle_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  versao TEXT NOT NULL DEFAULT '1.0',
  aceito BOOLEAN NOT NULL DEFAULT false,
  aceito_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tcle_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Usuários podem ver seus próprios consentimentos"
  ON public.tcle_consents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Usuários podem registrar seu consentimento"
  ON public.tcle_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Professors/admins can view consents (for audit)
CREATE POLICY "Professores podem ver consentimentos de alunos vinculados"
  ON public.tcle_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professor_students ps
      WHERE ps.student_id = tcle_consents.user_id
        AND ps.professor_id = auth.uid()
        AND ps.ativo = true
        AND has_role(auth.uid(), 'professor'::app_role)
    )
  );

-- Admins can see all consents
CREATE POLICY "Admins podem ver todos os consentimentos"
  ON public.tcle_consents
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
