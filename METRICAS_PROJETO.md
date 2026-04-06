# MÉTRICAS CONSOLIDADAS DO PROJETO — VETBALANCE

**Referência rápida para defesa de mestrado**  
**Última atualização:** 06/04/2026

---

## 📊 RESUMO EXECUTIVO

| Categoria | Quantidade |
|-----------|------------|
| **Tabelas PostgreSQL** | 32 (+ 1 view) |
| **Políticas RLS** | 32/32 tabelas protegidas |
| **Edge Functions** | 9 |
| **Componentes React** | 99 (50 custom + 49 UI/shadcn) |
| **Hooks customizados** | 8 |
| **Páginas (routes)** | 6 |
| **Diagramas Mermaid** | 10 |
| **Documentos .md** | 12 |
| **Linhas de código** | ~15.000+ TypeScript/TSX |

---

## 🗄️ BANCO DE DADOS — 32 TABELAS

### Casos Clínicos e Simulação (7 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 1 | `casos_clinicos` | Casos clínicos (7 pré-definidos + customizados) |
| 2 | `condicoes` | 9 condições clínicas modeladas |
| 3 | `parametros` | 10 parâmetros fisiológicos monitorados |
| 4 | `valores_iniciais_caso` | Valores iniciais por caso/parâmetro |
| 5 | `parametros_secundarios_caso` | Parâmetros secundários por caso |
| 6 | `efeitos_condicao` | Efeitos de cada condição nos parâmetros |
| 7 | `tratamentos` | 8 tratamentos disponíveis |

### Tratamentos e Gabarito (3 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 8 | `efeitos_tratamento` | Efeitos de cada tratamento nos parâmetros |
| 9 | `tratamentos_adequados` | Gabarito: tratamento ↔ condição |
| 10 | `tratamentos_caso` | Gabarito: tratamento ↔ caso específico |

### Sessões e Histórico (4 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 11 | `simulation_sessions` | Sessões de simulação |
| 12 | `session_history` | Snapshots de parâmetros por tick |
| 13 | `session_decisions` | Decisões do aluno com HP antes/depois |
| 14 | `session_treatments` | Tratamentos aplicados com timestamp |

### Gamificação (4 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 15 | `badges` | 17 badges em 5 categorias |
| 16 | `user_badges` | Badges conquistados por usuário |
| 17 | `weekly_ranking_history` | Histórico de ranking semanal |
| 18 | `simulation_notes` | Anotações do aluno durante simulação |

### Metas de Aprendizado (2 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 19 | `metas_aprendizado` | Metas configuráveis por caso |
| 20 | `metas_alcancadas` | Registro de metas atingidas |

### Usuários e Autenticação (4 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 21 | `profiles` | Perfil público do usuário |
| 22 | `user_roles` | Papéis (professor/aluno/admin) — tabela separada |
| 23 | `professor_access_keys` | Chaves institucionais para registro de professores |
| 24 | `email_lookup_attempts` | Rate limiting de buscas por e-mail |

### Professor–Aluno (3 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 25 | `professor_students` | Vínculo professor ↔ aluno |
| 26 | `turmas` | Gerenciamento de turmas |
| 27 | `professor_private_notes` | Notas privadas do professor sobre alunos |

### Compartilhamento (2 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 28 | `shared_cases` | Casos compartilhados via código de acesso |
| 29 | `shared_case_access` | Registro de acessos a casos compartilhados |

### Tutorial e Consentimento (3 tabelas)
| # | Tabela | Finalidade |
|---|--------|-----------|
| 30 | `tutorial_steps` | Passos do tutorial guiado |
| 31 | `user_tutorial_progress` | Progresso do tutorial por usuário |
| 32 | `tcle_consents` | Consentimento TCLE para pesquisa |

### Views (1)
| View | Finalidade |
|------|-----------|
| `student_profiles_safe` | Perfis de alunos sem e-mail (segurança) |

---

## ⚡ EDGE FUNCTIONS — 9 FUNÇÕES SERVERLESS

| # | Função | Finalidade | Modelo IA |
|---|--------|-----------|-----------|
| 1 | `analyze-custom-case` | Análise de caso personalizado | Gemini/GPT |
| 2 | `autofix-case` | Correção automática de parâmetros inconsistentes | Gemini/GPT |
| 3 | `generate-differential-diagnosis` | Diagnóstico diferencial por IA | Gemini/GPT |
| 4 | `generate-random-case` | Geração aleatória de caso clínico | Gemini/GPT |
| 5 | `generate-session-feedback` | Feedback personalizado pós-sessão | Gemini/GPT |
| 6 | `populate-case-data` | Popular dados de caso via IA | Gemini/GPT |
| 7 | `treatment-hints` | Dicas contextualizadas de tratamento | Gemini/GPT |
| 8 | `update-case-data` | Atualização de dados de caso | Gemini/GPT |
| 9 | `validate-case-acidbase` | Validação de consistência ácido-base | Gemini/GPT |

---

## 🧩 COMPONENTES REACT — 99 TOTAL

### Componentes Custom (50)
| Categoria | Componentes | Qtd |
|-----------|------------|-----|
| **Simulação** | `PatientMonitor`, `MonitorDisplay`, `ParameterChart`, `HPDisplay`, `SimulationControls`, `SimulationWorkspace`, `SimulationModeSelector`, `SimulationComparison`, `SimulationNotes`, `SoundAlerts`, `SoundAlertsExtended`, `TreatmentPanel`, `TreatmentFeedback`, `TreatmentHints`, `DiagnosticChallenge` | 15 |
| **Casos** | `CaseInfo`, `CaseLibrary`, `CaseManager`, `CaseDataPopulator`, `CaseDetailsPanel`, `CaseShareManager`, `AddCaseDataForm` | 7 |
| **Sessão** | `SessionManager`, `SessionHistory`, `SessionComparison`, `SessionReplay`, `SessionFeedbackReport` | 5 |
| **Gamificação** | `BadgeSystem`, `WeeklyLeaderboard`, `StudentRanking`, `WeeklyRankingHistory`, `WinLossStats`, `RankingNotifications`, `LearningGoals` | 7 |
| **Professor** | `StudentManagement`, `StudentReports`, `AdvancedReports`, `ReportPanel`, `PerformanceStatistics`, `PerformanceStats`, `ProfessorAccessKeys`, `ClassManager`, `UserManagement`, `TcleConsentStatus` | 10 |
| **Auth/UI** | `Auth`, `RoleSelection`, `AccessCodeInput`, `ThemeToggle`, `VetBalanceLogo`, `GuidedTutorial` | 6 |

### Componentes UI/shadcn (49)
`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `toggle-group`, `tooltip` + `use-toast`

---

## 🪝 HOOKS CUSTOMIZADOS — 8

| Hook | Finalidade |
|------|-----------|
| `useAuth` | Autenticação e sessão do usuário |
| `useUserRole` | Verificação de papel (professor/aluno/admin) |
| `useSimulation` | Motor de simulação (game loop, HP, parâmetros) |
| `useTcleConsent` | Status do consentimento TCLE |
| `useRankingBadges` | Badges de ranking do usuário |
| `useAchievementAnimation` | Animação de conquistas |
| `useWeeklyResetNotification` | Notificação de reset semanal |
| `use-mobile` | Detecção de dispositivo móvel |

---

## 📄 PÁGINAS — 6

| Página | Rota | Finalidade |
|--------|------|-----------|
| `Index` | `/` | Seleção de papel + dashboard do aluno |
| `AuthAluno` | `/auth/aluno` | Login/cadastro do aluno |
| `AuthProfessor` | `/auth/professor` | Login/cadastro do professor |
| `ProfessorDashboard` | `/professor` | Dashboard do professor |
| `ConsentimentoTCLE` | `/consentimento` | Termo de consentimento |
| `ResetPassword` | `/reset-password` | Redefinição de senha |
| `PreValidation` | `/pre-validation` | Pré-validação |

---

## 📐 DIAGRAMAS MERMAID — 10

| # | Diagrama | Tipo |
|---|----------|------|
| 1 | Arquitetura Geral | Flowchart |
| 2 | Fluxo de Autenticação | Sequence |
| 3 | Game Loop da Simulação | Flowchart |
| 4 | Fluxo de Tratamento | Sequence |
| 5 | Sistema de Badges | Flowchart |
| 6 | Ranking Semanal | Flowchart |
| 7 | Entidade-Relacionamento | ER |
| 8 | Fluxo do Professor | Flowchart |
| 9 | Segurança e RLS | Flowchart |
| 10 | Pipeline de IA | Sequence |

---

## 🔐 SEGURANÇA — 5 CAMADAS

| Camada | Implementação |
|--------|---------------|
| 1. Client-side | Validação com Zod + TypeScript |
| 2. Autenticação | JWT via Supabase Auth (1h + auto-refresh) |
| 3. RBAC | Enum PostgreSQL (`professor`, `aluno`, `admin`) em tabela separada |
| 4. RLS | Row Level Security em 32/32 tabelas |
| 5. Sanitização | 3 camadas em 9 Edge Functions (anti-prompt injection) |

### Funções SQL de Segurança
| Função | Finalidade |
|--------|-----------|
| `has_role()` | Verificação de papel (SECURITY DEFINER, evita recursão RLS) |
| `validate_professor_access_key()` | Validação de chave institucional |
| `register_aluno()` / `register_professor()` | Registro seguro com papel |
| `get_student_id_by_email()` | Busca de aluno por e-mail (rate-limited) |
| `promote_to_professor()` / `demote_to_student()` | Gerenciamento de papéis (admin) |
| `get_all_profiles_for_admin()` | Listagem segura para admin |
| `get_linked_students_for_professor()` | Alunos vinculados ao professor |
| `generate_access_code()` | Geração de códigos de compartilhamento |

---

## 📚 DOCUMENTAÇÃO — 12 ARTEFATOS

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 1 | `DOCUMENTACAO_SOFTWARE.md` | Documentação técnica completa (22 seções) |
| 2 | `CRONOGRAMA_VALIDACAO.md` | Plano de Validação IEEE 829 (PVS-001) |
| 3 | `RESUMO_EXECUTIVO.md` | Síntese executiva para banca |
| 4 | `ARTIGO_RESUMO_EXPANDIDO.md` | Resumo expandido para publicação |
| 5 | `PROTOCOLO_CEP.md` | Protocolo CEP/UFPI (12 seções + Anexos A–J) |
| 6 | `DIAGRAMAS_MERMAID.md` | 10 diagramas visuais de arquitetura |
| 7 | `GUIA_TECNICO_DEFESA.md` | Guia de perguntas e respostas para defesa |
| 8 | `CHECKLIST_PRE_DEFESA.md` | 20 itens de verificação pré-defesa |
| 9 | `ROTEIRO_DEMONSTRACAO.md` | Script de demonstração (15 min) |
| 10 | `PERMISSIONS_GUIDE.md` | Guia de permissões e políticas RLS |
| 11 | `GLOSSARIO.md` | Glossário unificado (43 termos, 5 categorias) |
| 12 | `METRICAS_PROJETO.md` | Este documento |

---

## 🎮 DADOS DE CONTEÚDO

| Métrica | Valor |
|---------|-------|
| Casos clínicos pré-definidos | 7 (cães e gatos) |
| Condições clínicas modeladas | 9 |
| Parâmetros fisiológicos | 10 principais |
| Tratamentos disponíveis | 8 |
| Badges/Conquistas | 17 (5 categorias: Bronze, Prata, Ouro, Streaks, Milestones) |
| Modos de jogo | 2 (Prática com IA, Avaliação sem IA) |

---

## ⚙️ PERFORMANCE

| Métrica | Valor |
|---------|-------|
| Bundle size (gzipped) | ~300 KB |
| Latência Edge Functions (IA) | 3–8 s |
| Queries por sessão típica | ~80 |
| Flush de histórico | A cada 5 s (batch write) |
| Decaimento HP | -1 HP / 5 s |
| Duração máxima de sessão | 5 min (300 s) |

---

**URL de produção:** https://vetbalance.lovable.app  
**Stack:** React 18 · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Deno Edge Functions · Gemini/GPT
