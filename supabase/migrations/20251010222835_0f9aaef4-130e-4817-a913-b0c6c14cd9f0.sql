-- Adicionar novas condições médicas
INSERT INTO condicoes (nome, descricao) VALUES
('Acidose Respiratória', 'Acúmulo de CO2 devido a hipoventilação, causando diminuição do pH sanguíneo'),
('Alcalose Respiratória', 'Eliminação excessiva de CO2 por hiperventilação, causando aumento do pH'),
('Alcalose Metabólica', 'Aumento de bicarbonato ou perda de ácidos, elevando o pH sanguíneo'),
('Hipercapnia Aguda', 'Elevação rápida da PaCO2 com efeitos cardiovasculares significativos'),
('Hiperglicemia', 'Níveis elevados de glicose sanguínea com impacto hemodinâmico');

-- Adicionar efeitos para Acidose Respiratória
INSERT INTO efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM condicoes WHERE nome = 'Acidose Respiratória'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 2.0, 'Aumento progressivo de CO2'),
((SELECT id FROM condicoes WHERE nome = 'Acidose Respiratória'), (SELECT id FROM parametros WHERE nome = 'pH'), -0.02, 'Redução do pH por acúmulo de CO2'),
((SELECT id FROM condicoes WHERE nome = 'Acidose Respiratória'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 3.0, 'Taquicardia compensatória'),
((SELECT id FROM condicoes WHERE nome = 'Acidose Respiratória'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 2.0, 'Aumento da pressão arterial');

-- Adicionar efeitos para Alcalose Respiratória
INSERT INTO efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM condicoes WHERE nome = 'Alcalose Respiratória'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), -1.5, 'Diminuição de CO2 por hiperventilação'),
((SELECT id FROM condicoes WHERE nome = 'Alcalose Respiratória'), (SELECT id FROM parametros WHERE nome = 'pH'), 0.02, 'Aumento do pH'),
((SELECT id FROM condicoes WHERE nome = 'Alcalose Respiratória'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), -2.0, 'Bradicardia relativa'),
((SELECT id FROM condicoes WHERE nome = 'Alcalose Respiratória'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 0.1, 'Leve aumento do lactato');

-- Adicionar efeitos para Alcalose Metabólica
INSERT INTO efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM condicoes WHERE nome = 'Alcalose Metabólica'), (SELECT id FROM parametros WHERE nome = 'pH'), 0.03, 'Aumento significativo do pH'),
((SELECT id FROM condicoes WHERE nome = 'Alcalose Metabólica'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 3.0, 'Vasoconstrição periférica aumenta PA'),
((SELECT id FROM condicoes WHERE nome = 'Alcalose Metabólica'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 2.0, 'Aumento da contractilidade cardíaca');

-- Adicionar efeitos para Hipercapnia Aguda
INSERT INTO efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM condicoes WHERE nome = 'Hipercapnia Aguda'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 3.0, 'Elevação rápida de CO2'),
((SELECT id FROM condicoes WHERE nome = 'Hipercapnia Aguda'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 5.0, 'Taquicardia significativa'),
((SELECT id FROM condicoes WHERE nome = 'Hipercapnia Aguda'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 4.0, 'Vasodilatação cerebral e periférica'),
((SELECT id FROM condicoes WHERE nome = 'Hipercapnia Aguda'), (SELECT id FROM parametros WHERE nome = 'pH'), -0.03, 'Acidose respiratória aguda');

-- Adicionar efeitos para Hiperglicemia
INSERT INTO efeitos_condicao (id_condicao, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM condicoes WHERE nome = 'Hiperglicemia'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 4.0, 'Aumento da FC e débito cardíaco'),
((SELECT id FROM condicoes WHERE nome = 'Hiperglicemia'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 3.0, 'Vasodilatação periférica aumenta PA'),
((SELECT id FROM condicoes WHERE nome = 'Hiperglicemia'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 0.3, 'Metabolismo alterado aumenta lactato');

-- Adicionar novos casos clínicos
INSERT INTO casos_clinicos (nome, descricao, especie, id_condicao_primaria) VALUES
('Gato com Insuficiência Renal', 'Gato persa de 12 anos apresentando azotemia e acidose metabólica crônica', 'Felino', (SELECT id FROM condicoes WHERE nome = 'Acidose')),
('Cão com Pneumonia', 'Labrador de 5 anos com pneumonia bacteriana causando hipoxia e acidose respiratória', 'Canino', (SELECT id FROM condicoes WHERE nome = 'Acidose Respiratória')),
('Cão com Vômitos Persistentes', 'Poodle de 3 anos com vômitos há 2 dias, apresentando alcalose metabólica', 'Canino', (SELECT id FROM condicoes WHERE nome = 'Alcalose Metabólica')),
('Gato em Crise Convulsiva', 'Gato SRD apresentando hiperventilação pós-ictal com alcalose respiratória', 'Felino', (SELECT id FROM condicoes WHERE nome = 'Alcalose Respiratória')),
('Cão Diabético Descompensado', 'Schnauzer de 8 anos com cetoacidose diabética e hiperglicemia severa', 'Canino', (SELECT id FROM condicoes WHERE nome = 'Hiperglicemia')),
('Gato com Obstrução Uretral', 'Gato macho com obstrução uretral há 36h, acidose metabólica e hipercalemia', 'Felino', (SELECT id FROM condicoes WHERE nome = 'Acidose'));

-- Adicionar valores iniciais para o caso do gato com insuficiência renal (id presumido = 2)
INSERT INTO valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Insuficiência Renal'), (SELECT id FROM parametros WHERE nome = 'pH'), 7.25),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Insuficiência Renal'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 85.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Insuficiência Renal'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 32.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Insuficiência Renal'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 180.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Insuficiência Renal'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 90.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Insuficiência Renal'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 3.5);

-- Adicionar valores iniciais para o cão com pneumonia
INSERT INTO valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Pneumonia'), (SELECT id FROM parametros WHERE nome = 'pH'), 7.28),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Pneumonia'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 65.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Pneumonia'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 55.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Pneumonia'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 140.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Pneumonia'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 105.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Pneumonia'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 3.0);

-- Adicionar valores iniciais para o cão com vômitos
INSERT INTO valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Vômitos Persistentes'), (SELECT id FROM parametros WHERE nome = 'pH'), 7.52),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Vômitos Persistentes'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 95.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Vômitos Persistentes'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 38.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Vômitos Persistentes'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 110.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Vômitos Persistentes'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 115.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão com Vômitos Persistentes'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 1.5);

-- Adicionar valores iniciais para o gato em crise convulsiva
INSERT INTO valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
((SELECT id FROM casos_clinicos WHERE nome = 'Gato em Crise Convulsiva'), (SELECT id FROM parametros WHERE nome = 'pH'), 7.48),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato em Crise Convulsiva'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 100.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato em Crise Convulsiva'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 28.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato em Crise Convulsiva'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 200.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato em Crise Convulsiva'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 95.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato em Crise Convulsiva'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 2.8);

-- Adicionar valores iniciais para o cão diabético
INSERT INTO valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
((SELECT id FROM casos_clinicos WHERE nome = 'Cão Diabético Descompensado'), (SELECT id FROM parametros WHERE nome = 'pH'), 7.22),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão Diabético Descompensado'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 88.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão Diabético Descompensado'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 30.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão Diabético Descompensado'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 150.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão Diabético Descompensado'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 110.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Cão Diabético Descompensado'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 4.5);

-- Adicionar valores iniciais para o gato com obstrução uretral
INSERT INTO valores_iniciais_caso (id_caso, id_parametro, valor) VALUES
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Obstrução Uretral'), (SELECT id FROM parametros WHERE nome = 'pH'), 7.18),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Obstrução Uretral'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 82.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Obstrução Uretral'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), 35.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Obstrução Uretral'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), 190.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Obstrução Uretral'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 85.0),
((SELECT id FROM casos_clinicos WHERE nome = 'Gato com Obstrução Uretral'), (SELECT id FROM parametros WHERE nome = 'Lactato'), 5.0);

-- Adicionar novos tratamentos
INSERT INTO tratamentos (nome, descricao, tipo) VALUES
('Ventilação Mecânica', 'Suporte ventilatório para correção de hipoxia e hipercapnia', 'Respiratório'),
('Insulina Regular', 'Administração de insulina para controle glicêmico', 'Medicamento'),
('Antiemético', 'Controle de vômitos para prevenir alcalose metabólica', 'Medicamento'),
('Sondagem Uretral', 'Desobstrução uretral para aliviar retenção urinária', 'Procedimento'),
('Fluidoterapia com Cloreto de Potássio', 'Reposição de potássio e hidratação', 'Fluido');

-- Adicionar efeitos para Ventilação Mecânica
INSERT INTO efeitos_tratamento (id_tratamento, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM tratamentos WHERE nome = 'Ventilação Mecânica'), (SELECT id FROM parametros WHERE nome = 'PaO2'), 15.0, 'Melhora significativa da oxigenação'),
((SELECT id FROM tratamentos WHERE nome = 'Ventilação Mecânica'), (SELECT id FROM parametros WHERE nome = 'PaCO2'), -8.0, 'Redução de CO2 pela ventilação assistida'),
((SELECT id FROM tratamentos WHERE nome = 'Ventilação Mecânica'), (SELECT id FROM parametros WHERE nome = 'pH'), 0.05, 'Correção do pH');

-- Adicionar efeitos para Insulina
INSERT INTO efeitos_tratamento (id_tratamento, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM tratamentos WHERE nome = 'Insulina Regular'), (SELECT id FROM parametros WHERE nome = 'pH'), 0.04, 'Correção gradual da acidose'),
((SELECT id FROM tratamentos WHERE nome = 'Insulina Regular'), (SELECT id FROM parametros WHERE nome = 'Lactato'), -1.0, 'Redução do lactato'),
((SELECT id FROM tratamentos WHERE nome = 'Insulina Regular'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), -5.0, 'Normalização da FC');

-- Adicionar efeitos para Antiemético
INSERT INTO efeitos_tratamento (id_tratamento, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM tratamentos WHERE nome = 'Antiemético'), (SELECT id FROM parametros WHERE nome = 'pH'), -0.03, 'Normalização do pH'),
((SELECT id FROM tratamentos WHERE nome = 'Antiemético'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), -3.0, 'Redução da vasoconstrição');

-- Adicionar efeitos para Sondagem Uretral
INSERT INTO efeitos_tratamento (id_tratamento, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM tratamentos WHERE nome = 'Sondagem Uretral'), (SELECT id FROM parametros WHERE nome = 'pH'), 0.06, 'Correção rápida da acidose'),
((SELECT id FROM tratamentos WHERE nome = 'Sondagem Uretral'), (SELECT id FROM parametros WHERE nome = 'FrequenciaCardiaca'), -15.0, 'Melhora do estado geral'),
((SELECT id FROM tratamentos WHERE nome = 'Sondagem Uretral'), (SELECT id FROM parametros WHERE nome = 'Lactato'), -1.5, 'Redução do lactato');

-- Adicionar efeitos para Fluidoterapia com K+
INSERT INTO efeitos_tratamento (id_tratamento, id_parametro, magnitude, descricao) VALUES
((SELECT id FROM tratamentos WHERE nome = 'Fluidoterapia com Cloreto de Potássio'), (SELECT id FROM parametros WHERE nome = 'pH'), 0.03, 'Melhora gradual do pH'),
((SELECT id FROM tratamentos WHERE nome = 'Fluidoterapia com Cloreto de Potássio'), (SELECT id FROM parametros WHERE nome = 'PressaoArterial'), 5.0, 'Melhora da volemia'),
((SELECT id FROM tratamentos WHERE nome = 'Fluidoterapia com Cloreto de Potássio'), (SELECT id FROM parametros WHERE nome = 'Lactato'), -0.8, 'Melhora da perfusão');