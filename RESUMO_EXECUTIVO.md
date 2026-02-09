# RESUMO EXECUTIVO – VETBALANCE

## Simulador Veterinário Gamificado para Ensino de Equilíbrio Ácido-Base em Pequenos Animais

**Programa de Pós-Graduação:** Mestrado em Ciência Animal  
**Documento:** Resumo Executivo do Software Desenvolvido  
**Data:** Fevereiro de 2026  
**URL de Produção:** https://vetbalance.app.br

---

## 1. O QUE É O VETBALANCE

O VetBalance é um software educacional gamificado, desenvolvido como ferramenta de m-learning, que simula cenários clínicos veterinários de equilíbrio ácido-base em cães e gatos. O sistema permite que estudantes pratiquem a identificação e o tratamento de distúrbios como acidose metabólica, alcalose respiratória, cetoacidose diabética e hipercapnia em ambiente virtual seguro, com feedback imediato e rastreabilidade completa de decisões.

O software está disponível como aplicação web responsiva (PWA), acessível via navegadores modernos em desktop e dispositivos móveis, atendendo à proposta de aprendizagem móvel com dispositivos amplamente acessíveis.

---

## 2. FUNCIONALIDADES PRINCIPAIS

### Para Estudantes (Alunos)
- **Simulação em tempo real** de 7 casos clínicos pré-definidos (cães e gatos) com 10 parâmetros fisiológicos monitorados simultaneamente (pH, PaO₂, PaCO₂, FC, PA, Lactato, Hemoglobina, entre outros)
- **Sistema de HP (Health Points):** o paciente virtual inicia com HP 50, que decai com o tempo (-1 HP/5s) e é afetado pelas decisões do aluno — tratamentos adequados restauram HP (+10 a +25), inadequados penalizam (-15 HP)
- **8 tratamentos disponíveis** com validação contra gabarito e efeitos fisiológicos modelados
- **2 modos de jogo:** Prática (com dicas de IA) e Avaliação (sem dicas)
- **17 badges/conquistas** em 5 categorias (Bronze, Prata, Ouro, Streaks, Milestones)
- **Ranking semanal** com reset automático às segundas-feiras e histórico de evolução
- **Exportação de relatórios** em CSV e TXT para análise acadêmica

### Para Professores (Docentes)
- **Criação de casos personalizados** com geração automática de parâmetros via Inteligência Artificial (Gemini/GPT)
- **Compartilhamento de casos** com alunos via códigos de acesso únicos (8 caracteres)
- **Gerenciamento de turmas** com vínculo professor-aluno por e-mail
- **Relatórios de desempenho** individuais e por turma, com exportação de dados
- **Chaves de acesso institucionais** para controle de registro de professores

---

## 3. ARQUITETURA E TECNOLOGIA

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| **Backend** | PostgreSQL (Supabase), 5 Edge Functions (Deno), Row Level Security (RLS) |
| **IA** | Google Gemini 2.5, OpenAI GPT — feedback de sessão, dicas de tratamento, geração de casos |
| **Mobile** | PWA responsiva — compatível com navegadores mobile (Chrome, Safari, Firefox) |
| **Banco de Dados** | 32 tabelas com RLS em todas, autenticação por papel (professor/aluno) |

### Algoritmo de Simulação (Resumo)
O motor de simulação opera em ciclos de 1 segundo (ticks), registrando snapshots de todos os parâmetros. O HP decai automaticamente, simulando a deterioração do paciente crítico. Tratamentos aplicados são validados contra um gabarito (tabelas `tratamentos_adequados` / `tratamentos_caso`) e seus efeitos propagados nos parâmetros fisiológicos conforme magnitudes pré-definidas. A sessão termina em **vitória** (HP ≥ 100), **derrota por HP** (HP ≤ 0) ou **derrota por tempo** (> 5 minutos). Todo o histórico é persistido no banco de dados para análise posterior.

---

## 4. DADOS DO SISTEMA EM PRODUÇÃO

| Métrica | Valor |
|---------|-------|
| Casos clínicos cadastrados | 7 pré-definidos + ilimitados personalizados |
| Condições clínicas modeladas | 9 (Acidose, Alcalose, Hipoxia, Hipercapnia, etc.) |
| Parâmetros fisiológicos | 10 principais + secundários por caso |
| Tratamentos disponíveis | 8 (Bicarbonato, Oxigenoterapia, Fluidoterapia, etc.) |
| Badges/Conquistas | 17 em 5 categorias |
| Tabelas no banco | 32 com RLS |
| Edge Functions (IA) | 5 funções serverless |
| Componentes React | 60+ |
| Linhas de código | ~15.000+ TypeScript/TSX |

---

## 5. SEGURANÇA

- **Autenticação:** E-mail + senha com verificação obrigatória de e-mail
- **Autorização:** Dois papéis (`professor`, `aluno`) com permissões segregadas
- **RLS (Row Level Security):** Habilitado em todas as 32 tabelas — cada usuário acessa apenas seus próprios dados
- **Chaves de acesso:** Professores necessitam de chave institucional para registro
- **Funções seguras:** `has_role()` evita recursão em políticas RLS; `validate_professor_access_key()` valida chaves sem exposição

---

## 6. VALIDAÇÃO PROPOSTA

A validação seguirá metodologia comparativa com **20 estudantes** randomizados em dois grupos (n=10 cada):
- **Grupo experimental:** Com acesso ao VetBalance durante 3 semanas
- **Grupo controle:** Sem acesso ao software

**Análise estatística:** Teste t de Student (α=0,05) comparando médias de desempenho em avaliações convencionais sobre equilíbrio ácido-base, com processamento estatístico realizado no **RStudio**.

**Resultados esperados:** O grupo experimental deverá apresentar desempenho significativamente superior, demonstrando a eficácia da metodologia m-learning gamificada no ensino de conceitos complexos de equilíbrio ácido-base em medicina veterinária.

---

## 7. JUSTIFICATIVA PARA PRORROGAÇÃO

Apesar da conclusão técnica do simulador, a etapa de **validação clínica com a turma de veterinária é um requisito indispensável** para a conclusão da dissertação.

**Justificativa:** A execução dos testes depende do calendário acadêmico e da disponibilidade das turmas de graduação para a coleta de dados de campo.

**Solicitação:** Diante da necessidade de concluir este ciclo de testes práticos, realizar o processamento estatístico no RStudio e redigir a discussão final dos dados, solicita-se a **prorrogação do prazo de defesa do mestrado**.

---

## 8. DOCUMENTAÇÃO COMPLEMENTAR

| Documento | Conteúdo |
|-----------|----------|
| `DOCUMENTACAO_SOFTWARE.md` | Documentação técnica completa (21 seções, ~1.200 linhas) |
| `DIAGRAMAS_MERMAID.md` | 10 diagramas visuais (arquitetura, fluxos, ER, sequência, segurança) |
| `PERMISSIONS_GUIDE.md` | Guia de permissões e políticas RLS |
| `ARTIGO_RESUMO_EXPANDIDO.md` | Resumo expandido para publicação |

---

**Software desenvolvido e disponível em:** https://vetbalance.app.br  
**Compatível com:** Navegadores modernos (Chrome, Firefox, Safari, Edge) em desktop e dispositivos móveis
