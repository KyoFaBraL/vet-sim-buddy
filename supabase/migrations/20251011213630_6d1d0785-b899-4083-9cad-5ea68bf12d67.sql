-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  nome_completo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome_completo');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Adicionar coluna user_id em casos_clinicos
ALTER TABLE public.casos_clinicos 
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Criar índice
CREATE INDEX idx_casos_clinicos_user_id ON public.casos_clinicos(user_id);

-- Atualizar RLS policies para casos_clinicos
DROP POLICY IF EXISTS "Permitir leitura pública de casos" ON public.casos_clinicos;

-- Todos podem ver casos públicos (sem user_id) e seus próprios casos
CREATE POLICY "Usuários podem ver casos públicos e próprios"
ON public.casos_clinicos FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());

-- Usuários autenticados podem criar seus próprios casos
CREATE POLICY "Usuários autenticados podem criar casos"
ON public.casos_clinicos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios casos
CREATE POLICY "Usuários podem atualizar próprios casos"
ON public.casos_clinicos FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios casos
CREATE POLICY "Usuários podem deletar próprios casos"
ON public.casos_clinicos FOR DELETE
USING (auth.uid() = user_id);