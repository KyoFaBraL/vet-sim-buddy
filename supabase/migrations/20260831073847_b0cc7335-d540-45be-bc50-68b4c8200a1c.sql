alter table public.parametros
  add column if not exists tipo text not null default 'primario';

alter table public.parametros
  drop constraint if exists parametros_tipo_check;
alter table public.parametros
  add constraint parametros_tipo_check check (tipo in ('primario','secundario'));

-- Parâmetro principal que faltava
insert into public.parametros (nome, descricao, unidade, valor_minimo, valor_maximo, tipo)
select 'FrequenciaRespiratoria', 'Frequência respiratória em movimentos por minuto', 'mpm', 16, 30, 'primario'
where not exists (select 1 from public.parametros where nome = 'FrequenciaRespiratoria');

-- Parâmetros secundários definidos conforme o caso clínico
insert into public.parametros (nome, descricao, unidade, valor_minimo, valor_maximo, tipo)
select v.nome, v.descricao, v.unidade, v.vmin, v.vmax, 'secundario'
from (values
  ('HCO3', 'Bicarbonato sérico', 'mEq/L', 22, 26),
  ('BE', 'Excesso de base (base excess)', 'mEq/L', -3, 3),
  ('SpO2', 'Saturação periférica de oxigênio', '%', 95, 100),
  ('AnionGap', 'Ânion gap', 'mEq/L', 8, 12),
  ('Temperatura', 'Temperatura corporal central', '°C', 37.5, 39.2),
  ('Glicose', 'Concentração sérica de glicose', 'mg/dL', 70, 150),
  ('Sodio', 'Concentração sérica de sódio', 'mEq/L', 140, 155),
  ('Potassio', 'Concentração sérica de potássio', 'mEq/L', 3.5, 5.5),
  ('Cloro', 'Concentração sérica de cloreto', 'mEq/L', 105, 115),
  ('Calcio', 'Concentração sérica de cálcio', 'mg/dL', 8.5, 11.5),
  ('Fosforo', 'Concentração sérica de fósforo', 'mg/dL', 2.5, 6.0),
  ('Albumina', 'Concentração sérica de albumina', 'g/dL', 2.6, 4.0)
) as v(nome, descricao, unidade, vmin, vmax)
where not exists (select 1 from public.parametros p where p.nome = v.nome);

-- Classificação dos parâmetros já existentes
update public.parametros
set tipo = 'primario'
where nome in ('pH','PaO2','PaCO2','FrequenciaRespiratoria','FrequenciaCardiaca','PressaoArterial','Hemoglobina','Lactato','ResistenciaVascular','DebitoCardiaco');

update public.parametros
set tipo = 'secundario'
where nome = 'ContratilidadeCardiaca';