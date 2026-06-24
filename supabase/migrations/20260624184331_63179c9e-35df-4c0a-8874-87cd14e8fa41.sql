
-- Restrict case data to authenticated users only
DROP POLICY IF EXISTS "Permitir leitura pública de valores iniciais" ON public.valores_iniciais_caso;
CREATE POLICY "Authenticated can read valores iniciais" ON public.valores_iniciais_caso FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.valores_iniciais_caso FROM anon;

DROP POLICY IF EXISTS "Todos podem ver tratamentos por caso" ON public.tratamentos_caso;
CREATE POLICY "Authenticated can read tratamentos_caso" ON public.tratamentos_caso FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.tratamentos_caso FROM anon;

DROP POLICY IF EXISTS "Todos podem ver parâmetros secundários" ON public.parametros_secundarios_caso;
CREATE POLICY "Authenticated can read parametros_secundarios_caso" ON public.parametros_secundarios_caso FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.parametros_secundarios_caso FROM anon;

DROP POLICY IF EXISTS "Todos podem ver metas de aprendizado" ON public.metas_aprendizado;
CREATE POLICY "Authenticated can read metas_aprendizado" ON public.metas_aprendizado FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.metas_aprendizado FROM anon;

DROP POLICY IF EXISTS "Permitir leitura pública de efeitos" ON public.efeitos_condicao;
CREATE POLICY "Authenticated can read efeitos_condicao" ON public.efeitos_condicao FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.efeitos_condicao FROM anon;

DROP POLICY IF EXISTS "Permitir leitura pública de efeitos de tratamento" ON public.efeitos_tratamento;
CREATE POLICY "Authenticated can read efeitos_tratamento" ON public.efeitos_tratamento FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.efeitos_tratamento FROM anon;

DROP POLICY IF EXISTS "Permitir leitura pública de condições" ON public.condicoes;
CREATE POLICY "Authenticated can read condicoes" ON public.condicoes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.condicoes FROM anon;

DROP POLICY IF EXISTS "Permitir leitura pública de tratamentos" ON public.tratamentos;
CREATE POLICY "Authenticated can read tratamentos" ON public.tratamentos FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.tratamentos FROM anon;

DROP POLICY IF EXISTS "Permitir leitura pública de parâmetros" ON public.parametros;
CREATE POLICY "Authenticated can read parametros" ON public.parametros FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.parametros FROM anon;
