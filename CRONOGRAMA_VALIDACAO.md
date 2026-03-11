# PLANO DE VALIDAÇÃO DE SOFTWARE – VETBALANCE

**Identificador do Documento:** VETBALANCE-PVS-001  
**Versão:** 1.0  
**Data de Emissão:** 24 de fevereiro de 2026  
**Classificação:** Documento Técnico de Validação  
**Normas de Referência:** IEEE 829-2008 (Standard for Software Test Documentation), ISO/IEC 25010:2011 (Systems and software Quality Requirements and Evaluation — SQuaRE), NBR ISO/IEC 12207:2009 (Processos de Ciclo de Vida de Software)  
**URL do Software:** https://vetbalance.app.br

---

## SUMÁRIO

1. [Introdução](#1-introdução)
2. [Escopo da Validação](#2-escopo-da-validação)
3. [Referências Normativas](#3-referências-normativas)
4. [Definições e Terminologia](#4-definições-e-terminologia)
5. [Desenho Experimental](#5-desenho-experimental)
6. [Critérios de Aceitação](#6-critérios-de-aceitação)
7. [Ambiente de Teste](#7-ambiente-de-teste)
8. [Procedimentos de Teste](#8-procedimentos-de-teste)
9. [Cronograma de Execução](#9-cronograma-de-execução)
10. [Instrumentos de Coleta de Dados](#10-instrumentos-de-coleta-de-dados)
11. [Métricas de Qualidade de Software](#11-métricas-de-qualidade-de-software)
12. [Análise Estatística](#12-análise-estatística)
13. [Rastreabilidade de Dados](#13-rastreabilidade-de-dados)
14. [Gestão de Riscos](#14-gestão-de-riscos)
15. [Considerações Éticas](#15-considerações-éticas)
16. [Critérios de Encerramento](#16-critérios-de-encerramento)
17. [Aprovações](#17-aprovações)

---

## 1. INTRODUÇÃO

### 1.1 Propósito

Este documento estabelece o plano de validação do software educacional **VetBalance**, definindo os procedimentos, critérios e cronograma para avaliação da eficácia pedagógica do sistema como ferramenta de m-learning gamificada no ensino de equilíbrio ácido-base em medicina veterinária.

### 1.2 Objetivo da Validação

Verificar se o software atende aos requisitos de qualidade definidos pela ISO/IEC 25010 e se produz resultados pedagógicos mensuráveis e estatisticamente significativos quando utilizado como recurso complementar ao ensino presencial.

### 1.3 Escopo Temporal

| Item | Valor |
|------|-------|
| **Data de início** | 10/03/2026 |
| **Data de término** | 31/07/2026 |
| **Duração total** | ~5 meses (20 semanas) |
| **Agosto/2026** | Reservado para redação e defesa do mestrado |

---

## 2. ESCOPO DA VALIDAÇÃO

### 2.1 Item de Teste

| Atributo | Descrição |
|----------|-----------|
| **Nome do software** | VetBalance |
| **Versão** | 1.0 (produção) |
| **Tipo** | Aplicação web responsiva (PWA) |
| **Plataforma** | Navegadores modernos (Chrome ≥ 90, Firefox ≥ 88, Safari ≥ 14, Edge ≥ 90) |
| **Stack tecnológico** | React 18, TypeScript, Tailwind CSS, PostgreSQL (Supabase), Edge Functions (Deno) |
| **URL de produção** | https://vetbalance.app.br |

### 2.2 Funcionalidades Sob Teste

| ID | Funcionalidade | Módulo |
|----|---------------|--------|
| F-01 | Simulação de casos clínicos em tempo real | `useSimulation.ts` |
| F-02 | Sistema de HP (Health Points) e deterioração temporal | `HPDisplay.tsx` |
| F-03 | Aplicação e validação de tratamentos | `TreatmentPanel.tsx` |
| F-04 | Monitoramento de 10 parâmetros fisiológicos | `PatientMonitor.tsx` |
| F-05 | Sistema de badges e conquistas (17 badges) | `BadgeSystem.tsx` |
| F-06 | Ranking semanal com reset automático | `WeeklyLeaderboard.tsx` |
| F-07 | Feedback de sessão via IA | `generate-session-feedback` (Edge Function) |
| F-08 | Modo Prática vs. Modo Avaliação | `SimulationModeSelector.tsx` |
| F-09 | Exportação de relatórios (CSV/TXT) | `ReportPanel.tsx` |
| F-10 | Histórico e replay de sessões | `SessionHistory.tsx`, `SessionReplay.tsx` |

### 2.3 Funcionalidades Fora do Escopo

- Dashboard do professor e gerenciamento de turmas
- Criação de casos personalizados via IA
- Configurações administrativas do sistema

---

## 3. REFERÊNCIAS NORMATIVAS

| Norma | Título | Aplicação |
|-------|--------|-----------|
| IEEE 829-2008 | Standard for Software and System Test Documentation | Estrutura do plano de testes |
| ISO/IEC 25010:2011 | SQuaRE — System and software quality models | Modelo de qualidade de software |
| ISO/IEC 25022:2016 | Measurement of quality in use | Métricas de usabilidade |
| NBR ISO/IEC 12207:2009 | Processos de ciclo de vida de software | Processo de validação |
| ISO 14155:2020 | Clinical investigation of medical devices | Referência para desenho experimental |
| APA 7ª edição | Manual de publicação | Formatação do relatório final |

---

## 4. DEFINIÇÕES E TERMINOLOGIA

> **Glossário unificado completo:** Consulte [`GLOSSARIO.md`](GLOSSARIO.md) para a lista padronizada de todos os 43 termos técnicos, clínicos, metodológicos e normativos do projeto.

Abaixo, resumo dos termos mais frequentes neste documento:

| Termo | Definição |
|-------|-----------|
| **GE** | Grupo Experimental — participantes com acesso ao software |
| **GC** | Grupo Controle — participantes sem acesso ao software |
| **SUT** | System Under Test — VetBalance v1.0 |
| **HP** | Health Points — métrica de saúde do paciente virtual (0–100) |
| **Win Rate** | Taxa de vitória — percentual de sessões com HP ≥ 100 |
| **Badge** | Conquista gamificada desbloqueada por critérios de desempenho |
| **Tick** | Ciclo de simulação (intervalo de 1 segundo) |
| **RLS** | Row Level Security — controle de acesso por linha no banco de dados |
| **m-learning** | Mobile learning — aprendizagem por dispositivos móveis |

> Para definições completas e termos adicionais (clínicos, normativos), consulte [`GLOSSARIO.md`](GLOSSARIO.md).

---

## 5. DESENHO EXPERIMENTAL

### 5.1 Tipo de Estudo

Estudo **quase-experimental**, controlado, com pré e pós-teste, conforme modelo de Campbell & Stanley (1963).

### 5.2 Variáveis

| Tipo | Variável | Operacionalização |
|------|----------|--------------------|
| **Independente** | Uso do VetBalance | Presença/ausência de acesso ao software |
| **Dependente primária** | Desempenho acadêmico | Nota nas avaliações (escala 0–10) |
| **Dependente secundária** | Engajamento | Sessões completadas, win rate, badges |
| **Dependente terciária** | Satisfação | Escala Likert (questionário pós-intervenção) |
| **Controle** | Conteúdo ministrado | Mesmo conteúdo teórico para GE e GC |
| **Controle** | Docente | Mesmo professor para ambos os grupos |

### 5.3 Disciplinas e Participantes

| Disciplina | Conteúdo Avaliado | Divisão |
|------------|-------------------|---------|
| Fisiologia Animal | Equilíbrio ácido-base: mecanismos fisiológicos, compensação respiratória e renal | 50% GE / 50% GC |
| Farmacologia | Farmacoterapia dos distúrbios ácido-base: bicarbonato, fluidoterapia, oxigenoterapia | 50% GE / 50% GC |

### 5.4 Randomização

Método: **sorteio simples** estratificado por disciplina, garantindo distribuição equilibrada entre GE e GC em cada turma. A alocação será registrada em documento selado antes do início da intervenção.

### 5.5 Diagrama do Desenho Experimental

```
O₁  X  O₂  O₃  O₄    ← Grupo Experimental (GE)
O₁     O₂  O₃  O₄    ← Grupo Controle (GC)

Onde:
O₁ = Pré-teste diagnóstico (Março/2026)
X  = Intervenção com VetBalance (Março–Junho/2026)
O₂ = Avaliação intermediária 1 (Maio/2026)
O₃ = Avaliação intermediária 2 (Junho/2026)
O₄ = Pós-teste final (Junho/2026)
```

---

## 6. CRITÉRIOS DE ACEITAÇÃO

### 6.1 Critérios de Eficácia Pedagógica

| ID | Critério | Métrica | Valor Alvo |
|----|----------|---------|------------|
| CA-01 | Ganho de aprendizagem do GE | Δ(pós-teste − pré-teste) | > 0 com p < 0,05 |
| CA-02 | Superioridade do GE sobre GC | Diferença de médias no pós-teste | p < 0,05 (teste t) |
| CA-03 | Tamanho do efeito | d de Cohen | d ≥ 0,8 (efeito grande) |
| CA-04 | Correlação software × desempenho | r de Pearson (win rate × nota) | r ≥ 0,3 com p < 0,05 |

### 6.2 Critérios de Qualidade de Software (ISO/IEC 25010)

| Característica | Subcaracterística | Critério de Aceitação | Método de Verificação |
|----------------|--------------------|-----------------------|-----------------------|
| **Adequação funcional** | Completude funcional | 100% das funcionalidades F-01 a F-10 operacionais | Teste funcional |
| **Adequação funcional** | Correção funcional | Taxa de erro < 1% nas simulações | Logs do sistema |
| **Eficiência de desempenho** | Comportamento temporal | Tempo de resposta < 2s para ações do usuário | Monitoramento |
| **Usabilidade** | Facilidade de aprendizado | ≥ 80% dos usuários completam o tutorial sem assistência | Observação + logs |
| **Usabilidade** | Satisfação do usuário | Média ≥ 4,0/5,0 no questionário de satisfação | Questionário Likert |
| **Confiabilidade** | Disponibilidade | Uptime ≥ 99% durante o período de validação | Monitoramento |
| **Confiabilidade** | Tolerância a falhas | Nenhuma perda de dados de sessão | Auditoria de banco |
| **Segurança** | Confidencialidade | RLS ativo em 100% das tabelas com dados de usuário | Auditoria SQL |
| **Portabilidade** | Adaptabilidade | Funcional em Chrome, Firefox, Safari, Edge (desktop e mobile) | Teste cross-browser |

---

## 7. AMBIENTE DE TESTE

### 7.1 Infraestrutura

| Componente | Especificação |
|------------|---------------|
| **Servidor** | Supabase Cloud (PostgreSQL 15, Edge Functions Deno) |
| **CDN** | Lovable Cloud (deploy automático) |
| **Domínio** | vetbalance.app.br (HTTPS/TLS 1.3) |
| **Banco de dados** | 32 tabelas com RLS, backups automáticos |
| **Autenticação** | E-mail + senha com verificação obrigatória |

### 7.2 Dispositivos de Teste

| Dispositivo | Navegador | Resolução |
|-------------|-----------|-----------|
| Desktop (Windows/macOS) | Chrome ≥ 90, Firefox ≥ 88 | 1366×768 a 1920×1080 |
| Tablet (iPad/Android) | Safari ≥ 14, Chrome ≥ 90 | 768×1024 a 834×1194 |
| Smartphone (iOS/Android) | Safari ≥ 14, Chrome ≥ 90 | 360×800 a 414×896 |

---

## 8. PROCEDIMENTOS DE TESTE

### 8.1 Fase 1 — Preparação (10/03 – 28/03/2026)

| Semana | Período | Procedimento | Responsável | Entregável |
|--------|---------|-------------|-------------|------------|
| 1 | 10/03 – 14/03 | Submissão do protocolo ao Comitê de Ética em Pesquisa (CEP) | Pesquisador | Protocolo aprovado |
| 2 | 17/03 – 21/03 | Apresentação do projeto aos docentes das disciplinas | Pesquisador | Ata de reunião |
| 2 | 17/03 – 23/03 | Cadastro dos participantes no SUT e randomização GE/GC | Pesquisador + Docentes | Lista de alocação selada |
| 3 | 24/03 – 28/03 | Aplicação do **pré-teste diagnóstico** (O₁) — ambos os grupos | Docentes | Dados do pré-teste tabulados |

### 8.2 Fase 2 — Intervenção Inicial (30/03 – 18/04/2026)

| Semana | Período | Procedimento | Responsável | Entregável |
|--------|---------|-------------|-------------|------------|
| 4 | 30/03 – 04/04 | Aulas teóricas sobre equilíbrio ácido-base — parte 1 (GE + GC) | Docentes | Registro de frequência |
| 5 | 07/04 – 11/04 | Aulas teóricas sobre equilíbrio ácido-base — parte 2 (GE + GC); início do treinamento GE no SUT | Docentes / Pesquisador | Registro de frequência; logs do tutorial |
| 6 | 14/04 – 18/04 | Treinamento do GE no SUT: tutorial guiado + primeiros casos clínicos; uso supervisionado (acidose e alcalose metabólica) | Pesquisador / Alunos GE | Logs de conclusão do tutorial; relatório de sessões |

> **Nota:** A semana de 20/04 a 25/04/2026 constitui intervalo entre as fases F2 e F3, sem atividades programadas.

### 8.3 Fase 3 — Avaliação Intermediária 1 (27/04 – 16/05/2026)

| Semana | Período | Procedimento | Responsável | Entregável |
|--------|---------|-------------|-------------|------------|
| 7 | 27/04 – 02/05 | Uso intensivo do SUT pelo GE; atividades tradicionais pelo GC | Alunos / Docentes | Logs do sistema |
| 8 | 04/05 – 09/05 | Continuação do uso intensivo GE; preparação da avaliação | Alunos / Docentes | Logs do sistema |
| 8–9 | 11/05 – 14/05 | **Avaliação intermediária 1** (O₂) — distúrbios metabólicos | Docentes | Notas tabuladas |
| 9 | 15/05 – 16/05 | Análise parcial dos dados no RStudio | Pesquisador | Relatório parcial |

### 8.4 Fase 4 — Intervenção Avançada (18/05 – 06/06/2026)

| Semana | Período | Procedimento | Responsável | Entregável |
|--------|---------|-------------|-------------|------------|
| 10 | 18/05 – 23/05 | Casos avançados no SUT: cetoacidose diabética, hipercapnia, distúrbios mistos | Alunos GE | Dados de sessões avançadas |
| 11 | 25/05 – 01/06 | Aulas avançadas sobre compensação e protocolos terapêuticos (GE + GC) | Docentes | Registro de frequência |
| 12 | 01/06 – 06/06 | Modo Avaliação do SUT (sem dicas de IA) — simulação de cenário real | Alunos GE | Dados do modo avaliação |

### 8.5 Fase 5 — Avaliação Final e Coleta (08/06 – 27/06/2026)

| Semana | Período | Procedimento | Responsável | Entregável |
|--------|---------|-------------|-------------|------------|
| 13 | 08/06 – 13/06 | Revisão geral no SUT — todos os casos disponíveis | Alunos GE | Dados consolidados |
| 13–14 | 14/06 – 16/06 | **Avaliação intermediária 2** (O₃) — distúrbios respiratórios e mistos | Docentes | Notas tabuladas |
| 14 | 17/06 – 19/06 | Aplicação do **questionário de satisfação** (SUS adaptado) ao GE | Pesquisador | Respostas tabuladas |
| 14–15 | 20/06 – 23/06 | **Pós-teste final** (O₄) — avaliação abrangente (GE + GC) | Docentes | Notas tabuladas |
| 15 | 24/06 – 27/06 | Exportação completa dos dados do SUT (CSV/TXT) | Pesquisador | Arquivos de dados |

### 8.6 Fase 6 — Análise e Relatório (30/06 – 31/07/2026)

| Semana | Período | Procedimento | Responsável | Entregável |
|--------|---------|-------------|-------------|------------|
| 17 | 30/06 – 04/07 | Processamento estatístico: testes t de Student (pareado e independente), teste de Shapiro-Wilk | Pesquisador | Tabelas estatísticas |
| 18 | 07/07 – 11/07 | Análise dos dados do SUT: sessões, win rate, badges, ranking; cálculo do d de Cohen | Pesquisador | Relatório de uso |
| 19 | 14/07 – 18/07 | Cruzamento: desempenho no software × notas nas avaliações; correlação de Pearson | Pesquisador | Análise cruzada |
| 20 | 21/07 – 28/07 | Redação do relatório final de validação | Pesquisador | Rascunho do relatório |
| 20 | 29/07 – 31/07 | **Entrega do relatório final de validação** (IEEE 829 — Test Summary Report) | Pesquisador | Documento final ✅ |

> **Nota:** O mês de agosto de 2026 está reservado exclusivamente para a redação da dissertação e defesa do mestrado, com base nos dados consolidados até 31/07/2026.

---

## 9. CRONOGRAMA DE EXECUÇÃO

### 9.1 Tabela Cronológica Detalhada

| Sem. | Data Início | Data Fim | Fase | Atividade | Marco (Milestone) |
|------|------------|----------|------|-----------|-------------------|
| 1 | 10/03/2026 | 14/03/2026 | F1 — Preparação | Submissão do protocolo ao CEP | |
| 2 | 17/03/2026 | 23/03/2026 | F1 — Preparação | Apresentação aos docentes; cadastro e randomização GE/GC | |
| 3 | 24/03/2026 | 28/03/2026 | F1 — Preparação | **Pré-teste diagnóstico (O₁)** | 🔴 O₁ |
| 4 | 30/03/2026 | 04/04/2026 | F2 — Interv. Inicial | Aulas teóricas — parte 1 (GE + GC) | |
| 5 | 07/04/2026 | 11/04/2026 | F2 — Interv. Inicial | Aulas teóricas — parte 2; início treinamento GE | |
| 6 | 14/04/2026 | 18/04/2026 | F2 — Interv. Inicial | Treinamento GE no SUT + uso supervisionado (acidose/alcalose metabólica) | |
| — | 20/04/2026 | 25/04/2026 | — | *Intervalo entre fases F2 e F3* | |
| 7 | 27/04/2026 | 02/05/2026 | F3 — Aval. Interm. 1 | Uso intensivo GE; atividades tradicionais GC | |
| 8 | 04/05/2026 | 09/05/2026 | F3 — Aval. Interm. 1 | Continuação uso intensivo GE; preparação da avaliação | |
| 9 | 11/05/2026 | 16/05/2026 | F3 — Aval. Interm. 1 | **Avaliação intermediária 1 (O₂)**; análise parcial RStudio | 🔴 O₂ |
| 10 | 18/05/2026 | 23/05/2026 | F4 — Interv. Avançada | Casos avançados GE (cetoacidose, hipercapnia, mistos) | |
| 11 | 25/05/2026 | 01/06/2026 | F4 — Interv. Avançada | Aulas avançadas (compensação e protocolos) — GE + GC | |
| 12 | 01/06/2026 | 06/06/2026 | F4 — Interv. Avançada | Modo Avaliação do SUT (sem IA) | |
| 13 | 08/06/2026 | 13/06/2026 | F5 — Aval. Final | Revisão geral GE; **Avaliação intermediária 2 (O₃)** | 🔴 O₃ |
| 14 | 15/06/2026 | 23/06/2026 | F5 — Aval. Final | Questionário SUS (GE); **Pós-teste final (O₄)** | 🔴 O₄ |
| 15 | 24/06/2026 | 27/06/2026 | F5 — Aval. Final | Exportação completa dos dados do SUT (CSV/TXT) | ✅ Coleta encerrada |
| 16 | 30/06/2026 | 04/07/2026 | F6 — Análise | Processamento estatístico (testes t, Shapiro-Wilk) | |
| 17 | 07/07/2026 | 11/07/2026 | F6 — Análise | Análise dados SUT (sessões, win rate, badges); d de Cohen | |
| 18 | 14/07/2026 | 18/07/2026 | F6 — Análise | Cruzamento de dados (software × notas); Pearson | |
| 19 | 21/07/2026 | 28/07/2026 | F6 — Relatório | Redação do relatório final de validação | |
| 20 | 29/07/2026 | 31/07/2026 | F6 — Relatório | **Entrega do relatório final** (IEEE 829) | ✅ Relatório final |
| — | 01/08/2026 | 31/08/2026 | **MESTRADO** | **Redação da dissertação e defesa** | 🎓 Defesa |

### 9.2 Resumo por Fase

| Fase | Início | Término | Duração | Semanas |
|------|--------|---------|---------|---------|
| F1 — Preparação | 10/03/2026 | 28/03/2026 | 19 dias | 1–3 |
| F2 — Intervenção Inicial | 30/03/2026 | 18/04/2026 | 20 dias | 4–6 |
| F3 — Avaliação Intermediária 1 | 27/04/2026 | 16/05/2026 | 20 dias | 7–9 |
| F4 — Intervenção Avançada | 18/05/2026 | 06/06/2026 | 20 dias | 10–12 |
| F5 — Avaliação Final e Coleta | 08/06/2026 | 27/06/2026 | 20 dias | 13–15 |
| F6 — Análise e Relatório | 30/06/2026 | 31/07/2026 | 32 dias | 16–20 |
| **Total da validação** | **10/03/2026** | **31/07/2026** | **144 dias** | **20 semanas** |
| Mestrado (redação + defesa) | 01/08/2026 | 31/08/2026 | 31 dias | — |

### 9.3 Marcos Críticos (Milestones)

| Marco | Data | Descrição |
|-------|------|-----------|
| 🔴 O₁ | 24/03 – 28/03/2026 | Pré-teste diagnóstico (GE + GC) |
| 🔴 O₂ | 11/05 – 14/05/2026 | Avaliação intermediária 1 — distúrbios metabólicos |
| 🔴 O₃ | 14/06 – 16/06/2026 | Avaliação intermediária 2 — distúrbios respiratórios e mistos |
| 🔴 O₄ | 20/06 – 23/06/2026 | Pós-teste final — avaliação abrangente |
| ✅ Coleta | 27/06/2026 | Encerramento da coleta de dados |
| ✅ Relatório | 31/07/2026 | Entrega do relatório final de validação (IEEE 829) |
| 🎓 Defesa | Agosto/2026 | Defesa do mestrado |

### 9.4 Diagrama de Gantt

```mermaid
gantt
    title Plano de Validação — VetBalance v1.0 (Mar–Jul 2026)
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Fase 1 — Preparação
    Aprovação CEP                     :done, f1a, 2026-03-10, 2026-03-14
    Apresentação + Cadastro + Random. :active, f1b, 2026-03-17, 2026-03-23
    Pré-teste diagnóstico (O₁)       :crit, f1c, 2026-03-24, 2026-03-28

    section Fase 2 — Intervenção Inicial
    Aulas teóricas pt.1 (GE + GC)    :f2a, 2026-03-30, 2026-04-04
    Aulas teóricas pt.2 + Trein. GE  :f2b, 2026-04-07, 2026-04-11
    Treinamento + Uso superv. GE     :f2c, 2026-04-14, 2026-04-18

    section Intervalo
    Buffer entre F2 e F3             :done, buf, 2026-04-20, 2026-04-25

    section Fase 3 — Avaliação Intermediária 1
    Uso intensivo GE + Atividades GC :f3a, 2026-04-27, 2026-05-09
    Avaliação intermediária 1 (O₂)  :crit, f3b, 2026-05-11, 2026-05-14
    Análise parcial RStudio          :f3c, 2026-05-15, 2026-05-16

    section Fase 4 — Intervenção Avançada
    Casos avançados GE               :f4a, 2026-05-18, 2026-05-23
    Aulas avançadas (GE + GC)        :f4b, 2026-05-25, 2026-06-01
    Modo Avaliação GE (sem IA)       :f4c, 2026-06-01, 2026-06-06

    section Fase 5 — Avaliação Final
    Revisão geral GE                 :f5a, 2026-06-08, 2026-06-13
    Avaliação intermediária 2 (O₃)  :crit, f5b, 2026-06-14, 2026-06-16
    Questionário SUS (GE)            :f5c, 2026-06-17, 2026-06-19
    Pós-teste final (O₄)            :crit, f5d, 2026-06-20, 2026-06-23
    Exportação e tabulação           :f5e, 2026-06-24, 2026-06-27

    section Fase 6 — Análise e Relatório
    Testes t + Shapiro-Wilk          :f6a, 2026-06-30, 2026-07-04
    Análise SUT + d de Cohen         :f6b, 2026-07-07, 2026-07-11
    Cruzamento dados + Pearson       :f6c, 2026-07-14, 2026-07-18
    Redação relatório final          :f6d, 2026-07-21, 2026-07-28
    Entrega relatório IEEE 829       :crit, f6e, 2026-07-29, 2026-07-31

    section Agosto — Mestrado
    Redação dissertação + Defesa     :milestone, m1, 2026-08-01, 2026-08-31
```

---

## 10. INSTRUMENTOS DE COLETA DE DADOS

### 10.1 Instrumentos Aplicados pelo Pesquisador

| ID | Instrumento | Momento | Amostra | Formato | Referência |
|----|-------------|---------|---------|---------|------------|
| I-01 | Pré-teste diagnóstico | 24/03 – 28/03/2026 (O₁) | GE + GC | 20 objetivas + 3 discursivas (0–10) | PROTOCOLO_CEP.md, Apêndice A |
| I-02 | Avaliação intermediária 1 | 11/05 – 14/05/2026 (O₂) | GE + GC | Prova teórico-prática (0–10) | — |
| I-03 | Avaliação intermediária 2 | 14/06 – 16/06/2026 (O₃) | GE + GC | Prova teórico-prática (0–10) | — |
| I-04 | Pós-teste final | 20/06 – 23/06/2026 (O₄) | GE + GC | 20 objetivas + 3 discursivas (0–10) | PROTOCOLO_CEP.md, Apêndice A |
| I-05 | Questionário de satisfação | 17/06 – 19/06/2026 | GE apenas | Escala Likert 5 pontos (SUS adaptado) | PROTOCOLO_CEP.md, Apêndice B |

### 10.2 Dados Coletados Automaticamente pelo SUT

| ID | Dado | Tabela no Banco | Tipo | Granularidade |
|----|------|-----------------|------|---------------|
| D-01 | Sessões de simulação | `simulation_sessions` | Quantitativo | Por sessão |
| D-02 | Snapshots de parâmetros | `session_history` | Quantitativo | Por tick (1s) |
| D-03 | Decisões clínicas | `session_decisions` | Qualitativo/Quantitativo | Por evento |
| D-04 | Tratamentos aplicados | `session_treatments` | Quantitativo | Por evento |
| D-05 | Badges conquistados | `user_badges` | Quantitativo | Por conquista |
| D-06 | Ranking semanal | `weekly_ranking_history` | Quantitativo | Semanal |
| D-07 | Notas de simulação | `simulation_notes` | Qualitativo | Por anotação |

---

## 11. MÉTRICAS DE QUALIDADE DE SOFTWARE (ISO/IEC 25010)

### 11.1 Métricas de Qualidade em Uso

| Métrica | Fórmula | Fonte |
|---------|---------|-------|
| Eficácia | Tarefas concluídas com sucesso / Total de tarefas × 100 | Logs `simulation_sessions` (status = 'vitoria') |
| Eficiência | Tempo médio para vitória (s) | `simulation_sessions.duracao_segundos` |
| Satisfação | Média das respostas do questionário SUS | Questionário I-05 |
| Cobertura de contexto | % de casos clínicos tentados pelo GE | `simulation_sessions.case_id` |

### 11.2 Métricas de Qualidade do Produto

| Métrica | Medição | Critério |
|---------|---------|----------|
| Taxa de erro funcional | Erros registrados / Total de sessões | < 1% |
| Disponibilidade | Uptime monitorado durante 6 meses | ≥ 99% |
| Tempo de resposta | P95 de latência para ações do usuário | < 2.000 ms |
| Integridade de dados | Sessões sem perda de registros | 100% |

---

## 12. ANÁLISE ESTATÍSTICA

### 12.1 Plano de Análise

| Análise | Teste Estatístico | Variáveis | Software |
|---------|-------------------|-----------|----------|
| Homogeneidade dos grupos (pré-teste) | Teste t de Student (independente) | Nota pré-teste GE vs GC | RStudio |
| Evolução intra-grupo | Teste t de Student (pareado) | Pré-teste vs pós-teste (dentro de cada grupo) | RStudio |
| Comparação inter-grupos (pós-teste) | Teste t de Student (independente) | Nota pós-teste GE vs GC | RStudio |
| Tamanho do efeito | d de Cohen | Magnitude da diferença GE vs GC | RStudio |
| Correlação software × desempenho | Correlação de Pearson | Win rate × nota pós-teste | RStudio |
| Normalidade dos dados | Teste de Shapiro-Wilk | Distribuição das notas | RStudio |

### 12.2 Parâmetros Estatísticos

| Parâmetro | Valor |
|-----------|-------|
| Nível de significância (α) | 0,05 |
| Poder estatístico (1 − β) | 0,80 |
| Tipo de teste | Bicaudal |
| Software de processamento | RStudio (R ≥ 4.3) |
| Pacotes R previstos | `t.test()`, `cohen.d()` (effsize), `cor.test()`, `shapiro.test()` |

---

## 13. RASTREABILIDADE DE DADOS

### 13.1 Matriz de Rastreabilidade: Requisitos → Dados → Análise

| Requisito de Validação | Dado Coletado | Instrumento | Análise |
|------------------------|---------------|-------------|---------|
| Eficácia pedagógica | Notas GE vs GC | I-01 a I-04 | Teste t, d de Cohen |
| Engajamento | Sessões, win rate, badges | D-01, D-04, D-05 | Estatística descritiva |
| Usabilidade | Respostas do questionário | I-05 | Média e DP (Likert) |
| Correlação uso × desempenho | Win rate + notas | D-01 + I-04 | Pearson |
| Integridade funcional | Logs de erro, sessões | D-01, D-02 | Taxa de erro |

### 13.2 Cadeia de Custódia dos Dados

1. **Coleta automática** → Banco PostgreSQL com RLS (acesso restrito por `user_id`)
2. **Exportação** → Formato CSV/TXT via funcionalidade nativa do SUT
3. **Processamento** → RStudio com scripts versionados
4. **Armazenamento** → Repositório institucional com backup criptografado
5. **Anonimização** → Substituição de identificadores por códigos antes da publicação

---

## 14. GESTÃO DE RISCOS

| ID | Risco | Probabilidade | Impacto | Mitigação |
|----|-------|---------------|---------|-----------|
| R-01 | Indisponibilidade do servidor durante período de testes | Baixa | Alto | Monitoramento de uptime; plano de contingência com backup local |
| R-02 | Amostra insuficiente por desistência de participantes | Média | Alto | Cadastro de participantes excedentes (10% a mais) |
| R-03 | Contaminação entre grupos (GC acessando o software) | Baixa | Alto | Controle de acesso por autenticação; monitoramento de logs |
| R-04 | Viés do pesquisador na aplicação dos testes | Média | Médio | Avaliações aplicadas por docentes independentes |
| R-05 | Perda de dados por falha técnica | Baixa | Alto | Backups automáticos; replicação de banco |
| R-06 | Incompatibilidade de dispositivos dos alunos | Baixa | Médio | Teste cross-browser prévio; suporte a PWA responsiva |

---

## 15. CONSIDERAÇÕES ÉTICAS

| Item | Descrição |
|------|-----------|
| **Comitê de Ética** | Protocolo submetido ao CEP da instituição (se aplicável conforme resolução CNS 510/2016) |
| **TCLE** | Termo de Consentimento Livre e Esclarecido assinado por todos os participantes |
| **Equidade** | Após conclusão da coleta, o GC receberá acesso ao VetBalance |
| **Privacidade** | RLS habilitado em 100% das tabelas; dados anonimizados na publicação |
| **Armazenamento** | Dados mantidos por 5 anos conforme normas institucionais |
| **Direito de desistência** | Participantes podem retirar-se a qualquer momento sem prejuízo acadêmico |

---

## 16. CRITÉRIOS DE ENCERRAMENTO

A validação será considerada **concluída** quando:

1. ✅ Todas as 4 avaliações (O₁ a O₄) forem aplicadas e tabuladas
2. ✅ O questionário de satisfação (I-05) for coletado do GE
3. ✅ Os dados do SUT forem exportados integralmente
4. ✅ A análise estatística for processada no RStudio
5. ✅ O relatório final de validação (IEEE 829 — Test Summary Report) for redigido

A validação será considerada **malsucedida** se:

- ❌ Menos de 70% dos participantes concluírem todas as avaliações
- ❌ O SUT apresentar indisponibilidade superior a 5% do período de intervenção
- ❌ Houver evidência de contaminação sistemática entre GE e GC

---

## 17. APROVAÇÕES

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| Pesquisador responsável | | | |
| Orientador | | | |
| Docente — Fisiologia Animal | | | |
| Docente — Farmacologia | | | |

---

---

## REFERÊNCIAS CRUZADAS

| Documento | Relação com este PVS-001 |
|-----------|--------------------------|
| `DOCUMENTACAO_SOFTWARE.md` | Seção 22 replica fases, marcos e instrumentos deste plano; Seção 22.4 detalha funcionalidades F-01 a F-10 (= Seção 2.2 deste documento) |
| `ARTIGO_RESUMO_EXPANDIDO.md` | Material e Métodos fundamenta-se no desenho experimental (Seção 5) e análise estatística (Seção 12) deste documento |
| `RESUMO_EXECUTIVO.md` | Seção 6 sintetiza as fases e marcos definidos nas Seções 8–9 deste documento |
| `DIAGRAMAS_MERMAID.md` | Diagramas de arquitetura complementam o ambiente de teste (Seção 7) |
| `GLOSSARIO.md` | Glossário unificado (43 termos, 5 categorias); Seção 4 deste documento referencia o glossário |
| `cronograma-validacao-vetbalance.csv` | Espelho tabulado (importável) das Seções 8, 9 e 10 deste documento |

---

## ANEXO A — CHECKLIST DE PRÉ-VALIDAÇÃO

> **Referência:** `DOCUMENTACAO_SOFTWARE.md`, Seção 22.7

Este checklist deve ser executado **integralmente** antes do início da Fase F1 (10/03/2026) para garantir que todas as funcionalidades sob teste estejam operacionais em ambiente de produção.

### A.1 Funcionalidades do Simulador (F-01 a F-10)

| # | ID | Funcionalidade | Módulo | Critério de Aceite | Status |
|---|-----|---------------|--------|-------------------|--------|
| 1 | F-01 | Simulação de casos clínicos em tempo real | `useSimulation.ts` | Iniciar, pausar e reiniciar simulação nos 7 casos pré-definidos; tick de 1s registrado em `session_history` | ☐ |
| 2 | F-02 | Sistema de HP e deterioração temporal | `HPDisplay.tsx` | HP inicia em 50, decai -1/5s; vitória em HP ≥ 100; derrota em HP ≤ 0 ou tempo > 5min | ☐ |
| 3 | F-03 | Aplicação e validação de tratamentos | `TreatmentPanel.tsx` | 8 tratamentos disponíveis; validação contra gabarito; HP +10~+25 (adequado) ou -15 (inadequado) | ☐ |
| 4 | F-04 | Monitoramento de 10 parâmetros fisiológicos | `PatientMonitor.tsx` | pH, PaO₂, PaCO₂, FC, FR, Temp, HCO₃, Lactato, PA, Hb exibidos em tempo real | ☐ |
| 5 | F-05 | Sistema de badges e conquistas | `BadgeSystem.tsx` | 17 badges em 5 categorias desbloqueáveis e persistidos em `user_badges` | ☐ |
| 6 | F-06 | Ranking semanal com reset automático | `WeeklyLeaderboard.tsx` | Ranking exibido; reset às segundas-feiras; histórico em `weekly_ranking_history` | ☐ |
| 7 | F-07 | Feedback de sessão via IA | `generate-session-feedback` | Edge Function responde com feedback personalizado ao final de cada sessão | ☐ |
| 8 | F-08 | Modo Prática vs. Modo Avaliação | `SimulationModeSelector.tsx` | Prática: dicas habilitadas; Avaliação: dicas desabilitadas | ☐ |
| 9 | F-09 | Exportação de relatórios (CSV/TXT) | `ReportPanel.tsx` | Download funcional em desktop e mobile com dados válidos | ☐ |
| 10 | F-10 | Histórico e replay de sessões | `SessionHistory.tsx`, `SessionReplay.tsx` | Sessões listadas; replay reproduz snapshots em ordem cronológica | ☐ |

### A.2 Infraestrutura e Backend

| # | Item | Critério de Aceite | Status |
|---|------|-------------------|--------|
| 11 | Banco de dados em produção | 32 tabelas com RLS; dados de seed presentes (7 casos, 9 condições, 10 parâmetros, 8 tratamentos, 17 badges) | ☐ |
| 12 | 5 Edge Functions operacionais | Todas retornam HTTP 200 com JWT válido | ☐ |
| 13 | Autenticação e papéis | Registro de aluno e professor funcional; `has_role()` correto | ☐ |
| 14 | Chaves de acesso de professor | `validate_professor_access_key()` funcional; chaves expiradas rejeitadas | ☐ |
| 15 | Persistência de sessões | Tabelas `simulation_sessions`, `session_history`, `session_decisions`, `session_treatments` recebem dados | ☐ |

### A.3 Interface e Usabilidade

| # | Item | Critério de Aceite | Status |
|---|------|-------------------|--------|
| 16 | Responsividade mobile | Funcional em Chrome/Safari mobile (≥ 360px) | ☐ |
| 17 | Tema claro/escuro | Alternância funcional sem quebra visual | ☐ |
| 18 | Tempo de resposta | Ações do usuário respondem em < 2s | ☐ |
| 19 | Dashboard do professor | Turmas, relatórios, casos personalizados e compartilhamento operacionais | ☐ |
| 20 | Coleta automática (D-01 a D-07) | 7 categorias de dados registradas durante sessão de teste completa | ☐ |

### A.4 Procedimento de Execução

| Item | Detalhe |
|------|---------|
| **Responsável** | Pesquisador principal |
| **Prazo** | Concluir até **07/03/2026** (3 dias antes de F1) |
| **Ambiente** | Produção (https://vetbalance.app.br) |
| **Método** | Executar com conta de aluno-teste e professor-teste |
| **Registro** | ✅ Aprovado / ❌ Falha + evidências (screenshots/logs) |
| **Critério** | 100% aprovado (20/20) |
| **Contingência** | Itens reprovados corrigidos e retestados antes de 10/03/2026 |

---

**Documento vinculado ao projeto:** [VetBalance](https://vetbalance.app.br)
**Repositório:** [GitHub](https://github.com/KyoFaBraL/vet-sim-buddy)  
**Identificador:** VETBALANCE-PVS-001 v1.0
