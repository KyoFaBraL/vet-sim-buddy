-- Casos clínicos: admin gerencia tudo
CREATE POLICY "Admins podem gerenciar todos os casos"
ON public.casos_clinicos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Turmas
CREATE POLICY "Admins podem gerenciar todas as turmas"
ON public.turmas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Vínculos professor-aluno
CREATE POLICY "Admins podem gerenciar todos os vinculos"
ON public.professor_students FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Compartilhamentos
CREATE POLICY "Admins podem gerenciar todos os compartilhamentos"
ON public.shared_cases FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Leitura global de dados de desempenho
CREATE POLICY "Admins podem ver todas as sessoes"
ON public.simulation_sessions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todo o historico"
ON public.session_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todas as decisoes"
ON public.session_decisions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todos os tratamentos aplicados"
ON public.session_treatments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todas as metas alcancadas"
ON public.metas_alcancadas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todos os badges"
ON public.user_badges FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todo o ranking historico"
ON public.weekly_ranking_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));