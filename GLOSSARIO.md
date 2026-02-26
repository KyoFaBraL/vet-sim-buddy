# GLOSSÁRIO UNIFICADO – VETBALANCE

**Documento de referência terminológica para todos os artefatos do projeto.**  
**Versão:** 1.0  
**Data:** Fevereiro de 2026

> Este glossário padroniza a terminologia técnica, clínica e metodológica utilizada nos documentos do projeto VetBalance. Todos os artefatos (`DOCUMENTACAO_SOFTWARE.md`, `CRONOGRAMA_VALIDACAO.md`, `ARTIGO_RESUMO_EXPANDIDO.md`, `RESUMO_EXECUTIVO.md`, `DIAGRAMAS_MERMAID.md`) referenciam este glossário como fonte canônica de definições.

---

## Termos Técnicos (Software e Infraestrutura)

| Termo | Sigla | Definição |
|-------|-------|-----------|
| Batch Insert | — | Inserção em lote no banco de dados para otimização de performance, utilizada no flush do buffer de histórico de sessões |
| Backoff Exponencial | — | Estratégia de retry com intervalos crescentes entre tentativas, usada em chamadas a APIs e Edge Functions |
| Edge Function | EF | Função serverless executada na borda da rede via Deno runtime (Supabase), responsável por integrações com IA e lógica de backend |
| Progressive Web App | PWA | Aplicação web com capacidades nativas (instalação, offline, push notifications), padrão de distribuição do VetBalance |
| Row Level Security | RLS | Políticas de segurança em nível de linha no PostgreSQL; garante que cada usuário acesse apenas seus próprios dados |
| Single Page Application | SPA | Aplicação de página única onde a navegação ocorre no lado do cliente sem recarregamento completo |
| WebSocket | — | Protocolo de comunicação bidirecional em tempo real, utilizado pelo Supabase Realtime para sincronização de dados |

---

## Termos da Simulação e Gamificação

| Termo | Sigla | Definição |
|-------|-------|-----------|
| Badge | — | Conquista/medalha gamificada desbloqueada por critérios específicos de desempenho (17 badges em 5 categorias: Bronze, Prata, Ouro, Streaks, Milestones) |
| Gamificação | — | Estratégia pedagógica que incorpora mecânicas de jogos (pontos, rankings, conquistas) em contextos educacionais não lúdicos |
| Health Points | HP | Métrica de saúde do paciente virtual (escala 0–100); inicia em 50, decai -1/5s; vitória em HP ≥ 100, derrota em HP ≤ 0 |
| Leaderboard | — | Quadro de classificação semanal dos alunos, ordenado por vitórias, pontos e taxa de sucesso; reset automático às segundas-feiras |
| Streak | — | Sequência consecutiva de vitórias; critério para badges específicos (3, 5 e 10 vitórias seguidas) |
| Tick | — | Ciclo unitário de atualização da simulação, com intervalo fixo de 1 segundo; a cada tick, parâmetros são recalculados e registrados |
| Win Rate | — | Taxa de vitória — percentual de sessões finalizadas com HP ≥ 100 em relação ao total de sessões do aluno |

---

## Termos Clínicos Veterinários

| Termo | Sigla | Definição |
|-------|-------|-----------|
| Acidose | — | Condição clínica de pH sanguíneo abaixo de 7,35; pode ser metabólica (↓ HCO₃) ou respiratória (↑ PaCO₂) |
| Alcalose | — | Condição clínica de pH sanguíneo acima de 7,45; pode ser metabólica (↑ HCO₃) ou respiratória (↓ PaCO₂) |
| Anion Gap | AG | Diferença entre cátions e ânions medidos no sangue; auxilia na classificação de acidoses metabólicas |
| Bicarbonato | HCO₃ | Principal sistema tampão do sangue; parâmetro-chave para avaliação de distúrbios metabólicos do equilíbrio ácido-base |
| Cetoacidose Diabética | CAD | Complicação grave do diabetes mellitus com acidose metabólica por acúmulo de corpos cetônicos |
| Equilíbrio Ácido-Base | EAB | Estado fisiológico de regulação do pH sanguíneo dentro da faixa de normalidade (7,35–7,45) |
| Frequência Cardíaca | FC | Número de batimentos cardíacos por minuto; parâmetro hemodinâmico monitorado na simulação |
| Frequência Respiratória | FR | Número de ciclos respiratórios por minuto; parâmetro ventilatório monitorado na simulação |
| Hemoglobina | Hb | Proteína transportadora de oxigênio no sangue; indicador de capacidade de oxigenação tecidual |
| Hipercapnia | — | Elevação da pressão parcial de CO₂ arterial (PaCO₂ > 45 mmHg); causa acidose respiratória |
| Hipoxia | — | Redução da pressão parcial de O₂ arterial (PaO₂ < 80 mmHg); indica déficit de oxigenação |
| Lactato | — | Metabólito do metabolismo anaeróbico; elevação indica hipoperfusão tecidual ou sepse |
| Pressão Arterial | PA | Força exercida pelo sangue nas paredes arteriais; parâmetro hemodinâmico monitorado na simulação |
| Pressão Parcial de CO₂ | PaCO₂ | Pressão parcial de dióxido de carbono no sangue arterial; reflete a ventilação alveolar |
| Pressão Parcial de O₂ | PaO₂ | Pressão parcial de oxigênio no sangue arterial; reflete a capacidade de oxigenação pulmonar |
| Temperatura Corporal | Temp | Parâmetro fisiológico monitorado; alterações indicam febre, hipotermia ou resposta inflamatória |

---

## Termos Metodológicos (Validação e Estatística)

| Termo | Sigla | Definição |
|-------|-------|-----------|
| Comitê de Ética em Pesquisa | CEP | Órgão institucional responsável pela aprovação de protocolos de pesquisa envolvendo seres humanos |
| d de Cohen | d | Medida de tamanho do efeito; valores ≥ 0,5 indicam efeito médio; meta do estudo: d ≥ 0,5 |
| Grupo Controle | GC | Participantes sem acesso ao software durante o período de intervenção; recebem ensino tradicional |
| Grupo Experimental | GE | Participantes com acesso ao VetBalance durante o período de intervenção |
| Mobile Learning | m-learning | Modalidade de aprendizagem mediada por dispositivos móveis (smartphones, tablets) |
| Pré-teste / Pós-teste | O₁ / O₄ | Avaliações aplicadas antes (O₁) e após (O₄) o período de intervenção para mensurar ganho de aprendizagem |
| r de Pearson | r | Coeficiente de correlação linear; meta do estudo: r ≥ 0,3 com p < 0,05 |
| System Under Test | SUT | Sistema sob teste — refere-se ao VetBalance v1.0 em ambiente de produção |
| System Usability Scale | SUS | Escala padronizada de avaliação de usabilidade; adaptada com escala Likert 1–5; meta: média ≥ 4,0 |
| Termo de Consentimento Livre e Esclarecido | TCLE | Documento que formaliza a participação voluntária dos sujeitos na pesquisa |
| Teste t de Student | t | Teste estatístico para comparação de médias entre dois grupos; utilizado com α = 0,05 |
| Teste de Shapiro-Wilk | W | Teste de normalidade aplicado aos dados antes da análise paramétrica |

---

## Termos de Documentação e Normas

| Termo | Sigla | Definição |
|-------|-------|-----------|
| IEEE 829-2008 | — | Norma para documentação de testes de software; base estrutural do `CRONOGRAMA_VALIDACAO.md` (PVS-001) |
| ISO/IEC 25010:2011 | SQuaRE | Modelo de qualidade de software; define as 8 características de qualidade avaliadas na validação |
| NBR ISO/IEC 12207:2009 | — | Norma brasileira para processos de ciclo de vida de software |
| Plano de Validação de Software | PVS | Documento formal que estabelece escopo, critérios e cronograma da validação; identificador: VETBALANCE-PVS-001 |

---

## Referências Cruzadas

| Documento | Uso deste Glossário |
|-----------|---------------------|
| `DOCUMENTACAO_SOFTWARE.md` | Seção 21 (Glossário Técnico) → referencia este glossário unificado |
| `CRONOGRAMA_VALIDACAO.md` | Seção 4 (Definições e Terminologia) → referencia este glossário unificado |
| `ARTIGO_RESUMO_EXPANDIDO.md` | Palavras-chave → termos definidos neste glossário |
| `RESUMO_EXECUTIVO.md` | Seção 9 (Documentação Complementar) → referencia este glossário |
| `DIAGRAMAS_MERMAID.md` | Referências Cruzadas → referencia este glossário |

---

**Total de termos padronizados:** 43  
**Categorias:** 5 (Técnicos, Simulação/Gamificação, Clínicos, Metodológicos, Normativos)
