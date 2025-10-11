-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('professor', 'aluno');

-- Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver seus próprios roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Função security definer para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Tabela para casos compartilhados com códigos de acesso
CREATE TABLE public.shared_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER NOT NULL,
  shared_by UUID NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  expira_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acessos INTEGER DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.shared_cases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para shared_cases
CREATE POLICY "Professores podem criar compartilhamentos"
  ON public.shared_cases
  FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND 
    public.has_role(auth.uid(), 'professor')
  );

CREATE POLICY "Professores podem ver seus compartilhamentos"
  ON public.shared_cases
  FOR SELECT
  USING (
    auth.uid() = shared_by AND 
    public.has_role(auth.uid(), 'professor')
  );

CREATE POLICY "Professores podem atualizar seus compartilhamentos"
  ON public.shared_cases
  FOR UPDATE
  USING (
    auth.uid() = shared_by AND 
    public.has_role(auth.uid(), 'professor')
  );

CREATE POLICY "Professores podem deletar seus compartilhamentos"
  ON public.shared_cases
  FOR DELETE
  USING (
    auth.uid() = shared_by AND 
    public.has_role(auth.uid(), 'professor')
  );

CREATE POLICY "Todos podem ver compartilhamentos ativos por código"
  ON public.shared_cases
  FOR SELECT
  USING (ativo = true);

-- Tabela para rastrear acessos aos casos compartilhados
CREATE TABLE public.shared_case_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_case_id UUID NOT NULL REFERENCES public.shared_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acessado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (shared_case_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.shared_case_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem registrar seus acessos"
  ON public.shared_case_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus acessos"
  ON public.shared_case_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Criar índices
CREATE INDEX idx_shared_cases_access_code ON public.shared_cases(access_code);
CREATE INDEX idx_shared_cases_shared_by ON public.shared_cases(shared_by);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Função para gerar código de acesso único
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Gera código de 8 caracteres alfanuméricos
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.shared_cases WHERE access_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger para incrementar contador de acessos
CREATE OR REPLACE FUNCTION public.increment_access_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shared_cases
  SET acessos = acessos + 1
  WHERE id = NEW.shared_case_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_shared_case_access
  AFTER INSERT ON public.shared_case_access
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_access_count();