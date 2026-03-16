# CHECKLIST FINAL DE PRÉ-VALIDAÇÃO — VETBALANCE

## Status Geral: 🟢 Pronto para Validação

**Última atualização:** 12/03/2026  
**Responsável:** Equipe VetBalance  
**Referência:** VETBALANCE-PVS-001 (IEEE 829-2008)

---

## 1. INFRAESTRUTURA E DEPLOY

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1.1 | App publicado e acessível | ✅ | `vetbalance.lovable.app` |
| 1.2 | Banco de dados operacional | ✅ | 27 tabelas, todas com RLS |
| 1.3 | Edge Functions deployadas (8) | ✅ | Deploy automático |
| 1.4 | Secrets configurados (API keys) | ✅ | LOVABLE_API_KEY, SUPABASE_* |
| 1.5 | Favicon e metadados personalizados | ✅ | Sem referências a plataformas externas |
| 1.6 | HTTPS ativo | ✅ | Via CDN |
| 1.7 | Domínio customizado configurado | ⚠️ | Usando subdomínio lovable.app (suficiente para validação) |

---

## 2. SEGURANÇA

| # | Item | Status | Observação |
|---|------|--------|------------|
| 2.1 | RLS ativado em todas as tabelas | ✅ | 27/27 tabelas protegidas |
| 2.2 | RBAC com enum PostgreSQL | ✅ | `professor`, `aluno`, `admin` |
| 2.3 | Papéis em tabela separada (`user_roles`) | ✅ | Previne escalonamento de privilégios |
| 2.4 | Sanitização de prompts (8 Edge Functions) | ✅ | 3 camadas: filtro, system prompt, validação de saída |
| 2.5 | Rate limiting em busca de e-mail | ✅ | 10 buscas/hora por professor |
| 2.6 | Chaves de acesso professor (16 chars) | ✅ | Uso único, com expiração |
| 2.7 | Privacidade de e-mails de alunos | ✅ | RPCs `SECURITY DEFINER`, view segura |
| 2.8 | TCLE imutável (sem UPDATE/DELETE) | ✅ | IP e user-agent registrados |
| 2.9 | Auditoria de vulnerabilidades (npm audit) | ✅ | 0 vulnerabilidades high/critical |
| 2.10 | Nenhuma referência a "Lovable" no frontend | ✅ | Verificado em busca completa |
| 2.11 | Proteção contra leaked passwords | ⚠️ | Requer ativação manual no dashboard de Auth |

---

## 3. FUNCIONALIDADES CORE (F-01 a F-10)

| # | Funcionalidade | Status | Teste |
|---|----------------|--------|-------|
| F-01 | Autenticação (login/registro aluno) | ✅ | Portais separados, RBAC pós-auth |
| F-02 | Autenticação (login/registro professor) | ✅ | Chave de acesso obrigatória |
| F-03 | Seleção de caso clínico | ✅ | Biblioteca com filtros, casos públicos + compartilhados |
| F-04 | Simulação com game loop | ✅ | HP, parâmetros, tempo real, batch write 5s |
| F-05 | Aplicação de tratamentos | ✅ | Feedback visual, efeitos nos parâmetros |
| F-06 | Dicas de tratamento via IA | ✅ | Edge Function `treatment-hints` |
| F-07 | Sistema de badges/conquistas | ✅ | Verificação automática pós-sessão |
| F-08 | Histórico de sessões | ✅ | Replay, comparação, gráficos |
| F-09 | Dashboard do professor | ✅ | Relatórios, gestão de alunos/turmas |
| F-10 | Compartilhamento de casos | ✅ | Códigos de acesso, expiração, contagem |

---

## 4. PERSISTÊNCIA E DADOS

| # | Item | Status | Observação |
|---|------|--------|------------|
| 4.1 | Batch write de `session_history` (5s) | ✅ | 10 params × 5 ticks = 50 registros/batch |
| 4.2 | Sessões com status e duração | ✅ | `em_andamento` → `finalizada` |
| 4.3 | Decisões e tratamentos registrados | ✅ | `session_decisions`, `session_treatments` |
| 4.4 | Metas de aprendizado persistidas | ✅ | `metas_aprendizado`, `metas_alcancadas` |
| 4.5 | Ranking semanal com histórico | ✅ | `weekly_ranking_history` |
| 4.6 | Notas de simulação por aluno | ✅ | `simulation_notes` com timestamp |
| 4.7 | Casos clínicos com dados completos | ✅ | 7 casos públicos + casos de professores |

---

## 5. DOCUMENTAÇÃO ACADÊMICA

| # | Documento | Status | Arquivo |
|---|-----------|--------|---------|
| 5.1 | Documentação do Software (IEEE 829) | ✅ | `DOCUMENTACAO_SOFTWARE.md` |
| 5.2 | Protocolo CEP (v2.0 — 12 seções Plataforma Brasil) | ✅ | `PROTOCOLO_CEP.md` |
| 5.3 | Guia Técnico para Defesa | ✅ | `GUIA_TECNICO_DEFESA.md` (16 seções) |
| 5.4 | Glossário Unificado (43 termos) | ✅ | `GLOSSARIO.md` |
| 5.5 | Resumo Executivo | ✅ | `RESUMO_EXECUTIVO.md` |
| 5.6 | Artigo / Resumo Expandido | ✅ | `ARTIGO_RESUMO_EXPANDIDO.md` |
| 5.7 | Cronograma de Validação | ✅ | `CRONOGRAMA_VALIDACAO.md` |
| 5.8 | Guia de Permissões | ✅ | `PERMISSIONS_GUIDE.md` |
| 5.9 | Diagramas de Arquitetura (6 Mermaid) | ✅ | `public/diagramas-arquitetura.html` |
| 5.10 | Screenshots documentadas (12) | ✅ | `docs/screenshots/` |

### 5.2.1 Estrutura do Protocolo CEP (v2.0)

| # | Seção obrigatória (Plataforma Brasil) | Status |
|---|----------------------------------------|--------|
| 1 | Capa (cabeçalho, título, pesquisadores, data) | ✅ |
| 2 | Sumário | ✅ |
| 3 | Introdução | ✅ |
| 4 | Tema e Delimitação | ✅ |
| 5 | Problema da Pesquisa (questão central, antecedentes) | ✅ |
| 6 | Revisão da Literatura | ✅ |
| 7 | Objetivos (geral + 4 específicos) | ✅ |
| 8 | Metodologia (amostra n=40, TCLE, riscos 5 camadas, critérios inclusão/exclusão) | ✅ |
| 9 | Orçamento detalhado (pesquisador, CAPES, UFPI) | ✅ |
| 10 | Cronograma (≥3 meses tramitação CEP-UFPI, fases F1–F6) | ✅ |
| 11 | Bibliografia (30+ referências) | ✅ |
| 12 | Anexos (A–J: TCLE oficial, concordância institucional, compromisso, confidencialidade, carta de encaminhamento, Lattes, instrumento, SUS, checklist) | ✅ |

---

## 6. GUIA TÉCNICO DE DEFESA — SEÇÕES

| # | Seção | Conteúdo |
|---|-------|----------|
| 1 | Linguagens e Tecnologias | TypeScript, React, Tailwind |
| 2 | Arquitetura Frontend | SPA, componentes, roteamento |
| 3 | Arquitetura Backend | Supabase, Edge Functions, PostgREST |
| 4 | Banco de Dados | Schema, 27 tabelas, relações |
| 5 | Autenticação e Autorização | JWT, RBAC, RLS |
| 6 | Game Loop e Simulação | HP, parâmetros, tempo real |
| 7 | Sistema de Gamificação | Badges, ranking, metas |
| 8 | Integração com IA | Gemini 2.5, sanitização, fallbacks |
| 9 | Performance | Bundle ~300KB, batch writes, lazy loading |
| 10 | Testes e Qualidade | Pré-validação automatizada (20 testes) |
| 11 | Decisões Arquiteturais | Trade-offs, justificativas |
| 12 | Escalabilidade | Connection pooling, CDN, edge |
| 13 | Acessibilidade | WCAG, temas, responsividade |
| 14 | Deploy e CI/CD | Deploy automático, versionamento |
| 15 | IA Generativa no Projeto | Desenvolvimento vs. funcionamento |
| 16 | Arquitetura de Segurança | RLS, RBAC, sanitização, rate limiting |

---

## 7. PREPARAÇÃO PARA A BANCA

| # | Item | Status |
|---|------|--------|
| 7.1 | Frases-chave preparadas por tema | ✅ |
| 7.2 | Perguntas frequentes com respostas | ✅ |
| 7.3 | Métricas de performance documentadas | ✅ |
| 7.4 | Diferenciação IA construção vs. produto | ✅ |
| 7.5 | Justificativa ética (TCLE, CEP) | ✅ |
| 7.6 | Diagramas exportáveis em PNG | ✅ |

---

## 8. ITENS PENDENTES / ATENÇÃO

| # | Item | Prioridade | Ação necessária |
|---|------|------------|-----------------|
| 8.1 | Ativar proteção contra leaked passwords | 🟡 Média | Ativar no dashboard de Auth > Password Security |
| 8.2 | Domínio customizado (opcional) | 🔵 Baixa | Configurar `vetbalance.app.br` se desejado |
| 8.3 | Validação com usuários reais (n=40) | 🔴 Alta | Fase F3 do cronograma (25/04–30/05/2026) |
| 8.4 | Coleta de dados SUS pós-uso | 🔴 Alta | Instrumento no Apêndice A do PVS-001 |
| 8.5 | Análise estatística (Cohen's d, Pearson) | 🔴 Alta | Após coleta de dados (F4: 01/06–20/06/2026) |

---

## 9. CRONOGRAMA RESTANTE

| Fase | Período | Atividade | Status |
|------|---------|-----------|--------|
| F1 | 10/03–31/03/2026 | Preparação e configuração | ✅ Concluída |
| F2 | 01/04–19/04/2026 | Pré-teste e calibração | 🟡 Próxima |
| — | 20/04–25/04/2026 | Intervalo técnico | — |
| F3 | 25/04–30/05/2026 | Coleta de dados (n=40) | ⬜ Pendente |
| F4 | 01/06–20/06/2026 | Análise estatística | ⬜ Pendente |
| F5 | 21/06–15/07/2026 | Redação dos resultados | ⬜ Pendente |
| F6 | 16/07–31/07/2026 | Revisão final e submissão | ⬜ Pendente |
| — | Agosto/2026 | Defesa de mestrado | ⬜ Pendente |

---

## 10. CRITÉRIOS DE SUCESSO (PVS-001)

| Critério | Meta | Como verificar |
|----------|------|----------------|
| Significância estatística | p < 0.05 | Teste t pareado pré/pós |
| Satisfação do usuário | SUS ≥ 4.0/5.0 | Questionário pós-uso |
| Correlação uso × desempenho | r ≥ 0.3 | Pearson entre sessões e nota |
| Tamanho de efeito | Cohen's d ≈ 0.91 | Diferença padronizada das médias |
| Poder estatístico | ≥ 80% | Com n=40, α=0.05 |
| Uptime do sistema | > 99% | Monitoramento durante coleta |
| Taxa de erro | < 1% | Logs de Edge Functions |
| Latência | < 2s | Tempo de resposta das APIs |
| Checklist pré-validação | 100% | Página `/pre-validation` |

---

*Documento gerado em 12/03/2026. Atualizar conforme progresso das fases F2–F6.*
