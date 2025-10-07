-- Tabela de parâmetros fisiológicos
CREATE TABLE public.parametros (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  unidade VARCHAR(50),
  valor_minimo DECIMAL(10, 4),
  valor_maximo DECIMAL(10, 4),
  descricao TEXT
);

-- Tabela de condições clínicas
CREATE TABLE public.condicoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT
);

-- Tabela de efeitos das condições sobre parâmetros
CREATE TABLE public.efeitos_condicao (
  id SERIAL PRIMARY KEY,
  id_condicao INTEGER NOT NULL REFERENCES public.condicoes(id) ON DELETE CASCADE,
  id_parametro INTEGER NOT NULL REFERENCES public.parametros(id) ON DELETE CASCADE,
  magnitude DECIMAL(10, 4) NOT NULL,
  descricao TEXT,
  UNIQUE(id_condicao, id_parametro)
);

-- Tabela de casos clínicos
CREATE TABLE public.casos_clinicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  especie VARCHAR(50),
  id_condicao_primaria INTEGER REFERENCES public.condicoes(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de valores iniciais para cada caso
CREATE TABLE public.valores_iniciais_caso (
  id SERIAL PRIMARY KEY,
  id_caso INTEGER NOT NULL REFERENCES public.casos_clinicos(id) ON DELETE CASCADE,
  id_parametro INTEGER NOT NULL REFERENCES public.parametros(id) ON DELETE CASCADE,
  valor DECIMAL(10, 4) NOT NULL,
  UNIQUE(id_caso, id_parametro)
);

-- Tabela de tratamentos disponíveis
CREATE TABLE public.tratamentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50)
);

-- Tabela de efeitos dos tratamentos
CREATE TABLE public.efeitos_tratamento (
  id SERIAL PRIMARY KEY,
  id_tratamento INTEGER NOT NULL REFERENCES public.tratamentos(id) ON DELETE CASCADE,
  id_parametro INTEGER NOT NULL REFERENCES public.parametros(id) ON DELETE CASCADE,
  magnitude DECIMAL(10, 4) NOT NULL,
  descricao TEXT,
  UNIQUE(id_tratamento, id_parametro)
);

-- Povoar parâmetros fisiológicos
INSERT INTO public.parametros (nome, unidade, valor_minimo, valor_maximo, descricao) VALUES
('pH', '', 7.0, 7.6, 'pH sanguíneo'),
('PaO2', 'mmHg', 80, 120, 'Pressão parcial de oxigênio'),
('PaCO2', 'mmHg', 35, 45, 'Pressão parcial de dióxido de carbono'),
('FrequenciaCardiaca', 'bpm', 60, 140, 'Frequência cardíaca em batimentos por minuto'),
('PressaoArterial', 'mmHg', 90, 140, 'Pressão arterial sistólica'),
('Hemoglobina', 'g/dL', 12, 18, 'Hemoglobina'),
('Lactato', 'mmol/L', 0.5, 2.0, 'Lactato sanguíneo'),
('ContratilidadeCardiaca', '%', 50, 100, 'Contractilidade cardíaca (percentual da normal)'),
('ResistenciaVascular', 'units', 800, 1500, 'Resistência vascular periférica'),
('DebitoCardiaco', 'L/min', 4.0, 8.0, 'Débito cardíaco');

-- Povoar condições clínicas
INSERT INTO public.condicoes (nome, descricao) VALUES
('Acidose', 'Acidose metabólica - pH sanguíneo baixo'),
('Alcalose', 'Alcalose metabólica - pH sanguíneo alto'),
('Hipoxia', 'Hipóxia - baixa pressão parcial de oxigênio'),
('Hipercapnia', 'Hipercapnia - alta pressão parcial de dióxido de carbono');

-- Povoar efeitos das condições (baseado na fonte de conhecimento)
-- ACIDOSE
INSERT INTO public.efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM public.condicoes WHERE nome = 'Acidose'), 
 (SELECT id FROM public.parametros WHERE nome = 'pH'), 
 -0.05, 'Redução do pH'),
((SELECT id FROM public.condicoes WHERE nome = 'Acidose'), 
 (SELECT id FROM public.parametros WHERE nome = 'ContratilidadeCardiaca'), 
 -15, 'Redução da contractilidade cardíaca'),
((SELECT id FROM public.condicoes WHERE nome = 'Acidose'), 
 (SELECT id FROM public.parametros WHERE nome = 'ResistenciaVascular'), 
 -150, 'Vasodilatação periférica'),
((SELECT id FROM public.condicoes WHERE nome = 'Acidose'), 
 (SELECT id FROM public.parametros WHERE nome = 'PressaoArterial'), 
 -20, 'Diminuição da pressão arterial'),
((SELECT id FROM public.condicoes WHERE nome = 'Acidose'), 
 (SELECT id FROM public.parametros WHERE nome = 'FrequenciaCardiaca'), 
 10, 'Taquicardia compensatória');

-- ALCALOSE
INSERT INTO public.efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM public.condicoes WHERE nome = 'Alcalose'), 
 (SELECT id FROM public.parametros WHERE nome = 'pH'), 
 0.05, 'Aumento do pH'),
((SELECT id FROM public.condicoes WHERE nome = 'Alcalose'), 
 (SELECT id FROM public.parametros WHERE nome = 'ContratilidadeCardiaca'), 
 10, 'Aumento da contractilidade cardíaca'),
((SELECT id FROM public.condicoes WHERE nome = 'Alcalose'), 
 (SELECT id FROM public.parametros WHERE nome = 'ResistenciaVascular'), 
 100, 'Vasoconstrição periférica'),
((SELECT id FROM public.condicoes WHERE nome = 'Alcalose'), 
 (SELECT id FROM public.parametros WHERE nome = 'PressaoArterial'), 
 15, 'Aumento da pressão arterial'),
((SELECT id FROM public.condicoes WHERE nome = 'Alcalose'), 
 (SELECT id FROM public.parametros WHERE nome = 'FrequenciaCardiaca'), 
 -5, 'Bradicardia leve');

-- HIPÓXIA
INSERT INTO public.efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM public.condicoes WHERE nome = 'Hipoxia'), 
 (SELECT id FROM public.parametros WHERE nome = 'PaO2'), 
 -25, 'Redução da PaO2'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipoxia'), 
 (SELECT id FROM public.parametros WHERE nome = 'FrequenciaCardiaca'), 
 20, 'Aumento da frequência cardíaca'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipoxia'), 
 (SELECT id FROM public.parametros WHERE nome = 'DebitoCardiaco'), 
 1.5, 'Aumento do débito cardíaco'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipoxia'), 
 (SELECT id FROM public.parametros WHERE nome = 'ResistenciaVascular'), 
 -100, 'Vasodilatação periférica'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipoxia'), 
 (SELECT id FROM public.parametros WHERE nome = 'PressaoArterial'), 
 10, 'Aumento da pressão arterial'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipoxia'), 
 (SELECT id FROM public.parametros WHERE nome = 'Lactato'), 
 1.5, 'Aumento do lactato (metabolismo anaeróbico)');

-- HIPERCAPNIA
INSERT INTO public.efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM public.condicoes WHERE nome = 'Hipercapnia'), 
 (SELECT id FROM public.parametros WHERE nome = 'PaCO2'), 
 15, 'Aumento da PaCO2'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipercapnia'), 
 (SELECT id FROM public.parametros WHERE nome = 'FrequenciaCardiaca'), 
 15, 'Aumento da frequência cardíaca'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipercapnia'), 
 (SELECT id FROM public.parametros WHERE nome = 'DebitoCardiaco'), 
 1.0, 'Aumento do débito cardíaco'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipercapnia'), 
 (SELECT id FROM public.parametros WHERE nome = 'ResistenciaVascular'), 
 -80, 'Vasodilatação cerebral e periférica'),
((SELECT id FROM public.condicoes WHERE nome = 'Hipercapnia'), 
 (SELECT id FROM public.parametros WHERE nome = 'PressaoArterial'), 
 12, 'Aumento da pressão arterial');

-- Criar caso clínico de exemplo
INSERT INTO public.casos_clinicos (nome, descricao, especie, id_condicao_primaria) VALUES
('Intoxicação Canina com Acidose', 
 'Cão de 5 anos apresentando acidose metabólica severa após intoxicação. Sinais de comprometimento cardiovascular.', 
 'Canino', 
 (SELECT id FROM public.condicoes WHERE nome = 'Acidose'));

-- Valores iniciais para o caso de exemplo
INSERT INTO public.valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
(1, (SELECT id FROM public.parametros WHERE nome = 'pH'), 7.15),
(1, (SELECT id FROM public.parametros WHERE nome = 'PaO2'), 95),
(1, (SELECT id FROM public.parametros WHERE nome = 'PaCO2'), 38),
(1, (SELECT id FROM public.parametros WHERE nome = 'FrequenciaCardiaca'), 130),
(1, (SELECT id FROM public.parametros WHERE nome = 'PressaoArterial'), 85),
(1, (SELECT id FROM public.parametros WHERE nome = 'Hemoglobina'), 14),
(1, (SELECT id FROM public.parametros WHERE nome = 'Lactato'), 3.2),
(1, (SELECT id FROM public.parametros WHERE nome = 'ContratilidadeCardiaca'), 60),
(1, (SELECT id FROM public.parametros WHERE nome = 'ResistenciaVascular'), 950),
(1, (SELECT id FROM public.parametros WHERE nome = 'DebitoCardiaco'), 5.5);

-- Criar tratamentos básicos
INSERT INTO public.tratamentos (nome, descricao, tipo) VALUES
('Bicarbonato de Sódio', 'Correção de acidose metabólica', 'Alcalinizante'),
('Oxigenoterapia', 'Suplementação de oxigênio', 'Suporte respiratório'),
('Fluidoterapia', 'Reposição volêmica e estabilização hemodinâmica', 'Suporte circulatório');

-- Efeitos dos tratamentos
INSERT INTO public.efeitos_tratamento (id_tratamento, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM public.tratamentos WHERE nome = 'Bicarbonato de Sódio'),
 (SELECT id FROM public.parametros WHERE nome = 'pH'),
 0.08, 'Correção do pH'),
((SELECT id FROM public.tratamentos WHERE nome = 'Oxigenoterapia'),
 (SELECT id FROM public.parametros WHERE nome = 'PaO2'),
 20, 'Aumento da oxigenação'),
((SELECT id FROM public.tratamentos WHERE nome = 'Fluidoterapia'),
 (SELECT id FROM public.parametros WHERE nome = 'PressaoArterial'),
 15, 'Aumento da pressão arterial');

-- Habilitar RLS em todas as tabelas (público para leitura, para fins educacionais)
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efeitos_condicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_clinicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valores_iniciais_caso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.efeitos_tratamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: permitir leitura pública (simulador educacional)
CREATE POLICY "Permitir leitura pública de parâmetros" ON public.parametros FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de condições" ON public.condicoes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de efeitos" ON public.efeitos_condicao FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de casos" ON public.casos_clinicos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de valores iniciais" ON public.valores_iniciais_caso FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de tratamentos" ON public.tratamentos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de efeitos de tratamento" ON public.efeitos_tratamento FOR SELECT USING (true);