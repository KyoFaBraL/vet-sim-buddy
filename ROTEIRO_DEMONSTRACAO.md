# ROTEIRO DE DEMONSTRAÇÃO — VETBALANCE

## Apresentação à Banca Examinadora

**Duração estimada:** 12–15 minutos  
**Pré-requisitos:** Navegador Chrome/Edge, conexão à internet, contas de teste (professor + aluno) já criadas  
**URL:** `https://vetbalance.lovable.app`

---

## PREPARAÇÃO (antes da defesa)

- [ ] Criar conta de professor de teste (com chave de acesso válida)
- [ ] Criar conta de aluno de teste (com TCLE aceito)
- [ ] Criar 1 caso clínico personalizado via professor
- [ ] Compartilhar o caso com código de acesso
- [ ] Realizar 1 sessão completa com o aluno (para ter histórico)
- [ ] Abrir 2 abas do navegador (1 professor, 1 aluno)
- [ ] Desativar notificações do sistema operacional
- [ ] Modo apresentação do navegador (F11) ou tela cheia

---

## PARTE 1 — TELA INICIAL E AUTENTICAÇÃO (2 min)

### 1.1 Seleção de Papel
**Narração:** *"O VetBalance possui dois portais de acesso distintos, cada um com seu fluxo de autenticação."*

- Mostrar a tela inicial com as opções "Sou Professor" e "Sou Aluno"
- **Destacar:** Design responsivo — funciona em celular e desktop

### 1.2 Login como Professor
- Clicar em "Sou Professor"
- Mostrar o formulário de login
- **Mencionar:** *"O registro de professor requer uma chave de acesso institucional de 16 caracteres, uso único, gerada por um administrador. Isso impede que qualquer pessoa se auto-registre como professor."*
- Fazer login com a conta de teste

### 1.3 Redirecionamento Automático
- **Destacar:** *"Após o login, o sistema verifica o papel do usuário no banco de dados e redireciona automaticamente para o painel correto. Um aluno não consegue acessar o painel do professor e vice-versa — isso é enforçado tanto no frontend (rotas protegidas) quanto no backend (Row Level Security)."*

---

## PARTE 2 — PAINEL DO PROFESSOR (3 min)

### 2.1 Dashboard
**Narração:** *"O professor tem acesso a ferramentas de gestão, criação de conteúdo e acompanhamento de alunos."*

- Mostrar as abas principais do painel

### 2.2 Criação de Caso Clínico
- Navegar até a seção de casos
- **Mostrar um caso já criado** (não criar do zero para economizar tempo)
- **Mencionar:** *"O professor pode criar casos manualmente ou usar a IA para popular automaticamente os parâmetros fisiológicos, garantindo consistência clínica."*
- Mostrar os parâmetros do caso (pH, pCO₂, HCO₃⁻, etc.)

### 2.3 Compartilhamento com Alunos
- Navegar até "Compartilhar Casos"
- Mostrar um caso já compartilhado com código de acesso
- **Destacar:** *"Cada código é único, com controle de expiração e contagem de acessos. O professor pode desativar o código a qualquer momento."*

### 2.4 Gestão de Turmas e Alunos
- Mostrar brevemente a lista de alunos vinculados
- **Mencionar:** *"O professor só visualiza dados de alunos explicitamente vinculados à sua conta. Isso é enforçado por Row Level Security — mesmo que um professor tente consultar diretamente a API, o banco de dados recusa dados de alunos não vinculados."*

---

## PARTE 3 — EXPERIÊNCIA DO ALUNO (5 min) ⭐ Parte principal

### 3.1 Login e TCLE
- **Alternar para a aba do aluno**
- Mostrar o login do aluno
- **Mencionar:** *"Antes de acessar o simulador, o aluno precisa aceitar o Termo de Consentimento Livre e Esclarecido (TCLE). O aceite é registrado com timestamp, IP e versão — exigência do Comitê de Ética."*

### 3.2 Seleção de Caso
- Mostrar a biblioteca de casos clínicos
- Mostrar os filtros (espécie, condição, busca)
- Selecionar um caso (ex: "Intoxicação Canina com Acidose")
- **Destacar:** *"O aluno vê apenas casos públicos e casos compartilhados pelo professor. Casos privados de outros professores são invisíveis — filtrados automaticamente pelo banco de dados."*

### 3.3 Modos de Simulação
- Mostrar a seleção entre **Modo Prática** e **Modo Avaliação**
- **Explicar:** *"No modo prática, o aluno tem acesso a dicas de tratamento geradas por IA, mas cada dica custa 10 pontos de HP. No modo avaliação, as dicas são desabilitadas — o aluno depende exclusivamente do seu conhecimento."*
- **Selecionar Modo Prática** (para demonstrar mais funcionalidades)

### 3.4 Simulação em Tempo Real ⭐
**Narração:** *"Este é o coração do sistema — o simulador de cuidados críticos."*

- **Iniciar a simulação**
- Mostrar o monitor de parâmetros fisiológicos (pH, pCO₂, HCO₃⁻, Na⁺, K⁺, etc.)
- **Destacar o HP** (barra de vida do paciente)
- **Explicar:** *"O game loop roda a 1 tick por segundo. A cada tick, a condição clínica altera os parâmetros. Se o aluno não intervir, o paciente deteriora progressivamente — o HP decai 1 ponto a cada 5 segundos de inatividade."*

### 3.5 Aplicação de Tratamento
- Abrir o painel de tratamentos
- Selecionar um tratamento adequado (ex: "Bicarbonato de Sódio" para acidose)
- **Aplicar o tratamento**
- **Mostrar o efeito:** *"Observe como o pH começa a subir e o HP aumenta. Cada tratamento tem efeitos pré-definidos nos parâmetros, cadastrados no banco de dados. A IA não controla esses efeitos — eles são determinísticos."*
- Se possível, aplicar um tratamento **inadequado** para mostrar a penalidade de HP

### 3.6 Dica de IA (Modo Prática)
- Clicar em "Pedir Dica"
- **Mostrar a dica gerada pela IA**
- **Destacar:** *"A dica é gerada em tempo real pelo Google Gemini, contextualizada com os parâmetros atuais do paciente. Note que o HP diminuiu 10 pontos — isso incentiva o aluno a pensar antes de pedir ajuda."*

### 3.7 Vitória ou Derrota
- Se o HP atingir 100: mostrar a **tela de vitória** com confetti
- Se o tempo acabar ou HP zerar: mostrar a **tela de derrota**
- **Mencionar:** *"Ao final, o sistema verifica automaticamente 17 badges de conquista e gera um relatório personalizado via IA."*

---

## PARTE 4 — GAMIFICAÇÃO E PROGRESSO (2 min)

### 4.1 Sistema de Badges
- Mostrar a seção de badges/conquistas
- **Destacar:** *"São 17 badges em 5 categorias: primeira vitória, sem dicas, tempo recorde, séries de vitórias, e metas de aprendizado. Os critérios são verificados automaticamente após cada sessão."*

### 4.2 Ranking Semanal
- Mostrar o ranking da semana
- **Mencionar:** *"O ranking reseta toda segunda-feira. Critérios: vitórias > taxa de vitória > total de sessões. Isso incentiva prática contínua."*

### 4.3 Histórico de Sessões
- Mostrar o histórico com sessões anteriores
- Abrir o gráfico de evolução de parâmetros de uma sessão passada
- **Destacar:** *"Cada sessão de 5 minutos gera aproximadamente 600 registros de histórico (10 parâmetros × 60 snapshots). O sistema usa batch writes a cada 5 segundos para otimizar a carga no banco."*

---

## PARTE 5 — RELATÓRIOS DO PROFESSOR (1 min)

### 5.1 Voltar ao Painel do Professor
- **Alternar para a aba do professor**
- Navegar até relatórios/estatísticas
- Mostrar dados de desempenho dos alunos
- **Destacar:** *"O professor acompanha o progresso individual dos alunos vinculados: taxa de vitória, sessões completadas, badges conquistados. Todos os dados são filtrados por RLS — cada professor vê apenas seus alunos."*

---

## PARTE 6 — DESTAQUES TÉCNICOS (1 min)

### Pontos para mencionar durante ou após a demonstração:

1. **Segurança em 5 camadas:** *"Validação client-side, JWT, RBAC, RLS em 32 tabelas, e sanitização de prompts."*

2. **IA como enriquecimento:** *"O motor do simulador é 100% determinístico. A IA gera dicas e feedback, mas o aluno pode completar uma simulação inteira sem IA."*

3. **Escalabilidade:** *"O game loop roda no navegador do aluno. O servidor não mantém estado — cada sessão é independente. 200 alunos simultâneos geram apenas ~2.800 queries/min."*

4. **Ética:** *"TCLE obrigatório, dados anonimizáveis, logs imutáveis de consentimento."*

---

## PERGUNTAS ANTECIPADAS DURANTE A DEMO

| Momento | Pergunta Provável | Resposta Preparada |
|---------|-------------------|-------------------|
| Login | "E se alguém tentar se registrar como professor?" | "Requer chave de acesso institucional de 16 caracteres, uso único." |
| Simulação | "Os valores clínicos são realistas?" | "Validados pela Edge Function validate-case-acidbase usando a equação de Henderson-Hasselbalch." |
| Dica IA | "E se a IA errar?" | "Dicas são orientações, não ações. O aluno decide. Tratamentos adequados estão no gabarito do banco." |
| Ranking | "O ranking é justo?" | "Modo avaliação sem dicas. Critérios objetivos: vitórias > taxa > sessões." |
| Geral | "Funciona no celular?" | "Sim, design responsivo. Também há configuração Capacitor para app Android nativo." |

---

## CHECKLIST PÓS-DEMO

- [ ] Mostrou os dois portais (professor + aluno)?
- [ ] Demonstrou a simulação em tempo real?
- [ ] Aplicou pelo menos um tratamento?
- [ ] Mostrou a dica de IA?
- [ ] Mencionou as 5 camadas de segurança?
- [ ] Diferenciou IA no desenvolvimento vs. no produto?
- [ ] Mostrou gamificação (badges/ranking)?
- [ ] Mencionou o TCLE?

---

*Dica: Ensaie a demonstração pelo menos 2 vezes antes da defesa. Cronometre cada parte. Tenha um plano B caso a internet falhe (screenshots em `docs/screenshots/`).*
