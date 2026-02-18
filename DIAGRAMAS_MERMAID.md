# DIAGRAMAS VISUAIS – VETBALANCE

## Diagramas de Fluxo e Arquitetura

---

## Diagrama 1 – Arquitetura Geral do Sistema

```mermaid
graph TB
    subgraph "Camada de Apresentação"
        UI["React 18 + TypeScript"]
        TW["Tailwind CSS + shadcn/ui"]
        FM["Framer Motion<br/>(Animações)"]
        RC["Recharts<br/>(Gráficos)"]
    end

    subgraph "Camada de Lógica"
        SIM["useSimulation<br/>(Motor de Simulação)"]
        AUTH["useAuth<br/>(Autenticação)"]
        ROLE["useUserRole<br/>(Autorização)"]
        BADGE["badgeChecker<br/>(Conquistas)"]
        RANK["useRankingBadges<br/>(Rankings)"]
    end

    subgraph "Camada de Backend"
        API["Supabase Client<br/>(REST + Realtime)"]
        EF1["Edge Function:<br/>generate-session-feedback"]
        EF2["Edge Function:<br/>treatment-hints"]
        EF3["Edge Function:<br/>populate-case-data"]
        EF4["Edge Function:<br/>generate-differential-diagnosis"]
        EF5["Edge Function:<br/>analyze-custom-case"]
    end

    subgraph "Camada de Persistência"
        DB[("PostgreSQL<br/>32 tabelas + RLS")]
        AUTHDB[("Supabase Auth<br/>Usuários")]
        RT["Realtime<br/>(WebSocket)"]
    end

    subgraph "Camada Mobile"
        CAP["Capacitor.js"]
        APK["Android APK"]
    end

    UI --> SIM
    UI --> TW
    UI --> FM
    UI --> RC
    SIM --> API
    AUTH --> AUTHDB
    ROLE --> API
    BADGE --> API
    RANK --> API
    API --> DB
    API --> RT
    EF1 --> DB
    EF2 --> DB
    EF3 --> DB
    EF4 --> DB
    EF5 --> DB
    UI --> CAP --> APK

    style UI fill:#3b82f6,color:#fff
    style DB fill:#22c55e,color:#fff
    style CAP fill:#f59e0b,color:#fff
    style SIM fill:#8b5cf6,color:#fff
```

---

## Diagrama 2 – Fluxo de Autenticação e Autorização

```mermaid
flowchart TD
    A["Usuário acessa<br/>vetbalance.app.br"] --> B{"Já está<br/>autenticado?"}
    B -- Sim --> C{"Qual papel?"}
    B -- Não --> D["Tela de Seleção<br/>de Papel (/)"]

    D --> E["Escolhe:<br/>👨‍🏫 Professor"]
    D --> F["Escolhe:<br/>👨‍🎓 Aluno"]

    E --> G["/auth/professor"]
    F --> H["/auth/aluno"]

    G --> I{"Cadastro ou<br/>Login?"}
    H --> J{"Cadastro ou<br/>Login?"}

    I -- Cadastro --> K["Preenche:<br/>Nome, Email, Senha,<br/>🔑 Chave de Acesso"]
    I -- Login --> L["Preenche:<br/>Email, Senha"]

    J -- Cadastro --> M["Preenche:<br/>Nome, Email, Senha"]
    J -- Login --> N["Preenche:<br/>Email, Senha"]

    K --> O{"Chave válida?<br/>(professor_access_keys)"}
    O -- Não --> P["❌ Erro:<br/>Chave inválida"]
    O -- Sim --> Q["✅ Registro via<br/>register_professor()"]

    M --> R["✅ Registro via<br/>register_aluno()"]

    L --> S["Supabase Auth<br/>signInWithPassword"]
    N --> S

    Q --> T["📧 Verificação<br/>de e-mail"]
    R --> T

    T --> S
    S --> U{"Autenticado?"}
    U -- Não --> V["❌ Credenciais<br/>inválidas"]
    U -- Sim --> C

    C -- professor --> W["Dashboard Professor<br/>(/professor)"]
    C -- aluno --> X["Simulador<br/>(/app)"]

    style A fill:#3b82f6,color:#fff
    style W fill:#8b5cf6,color:#fff
    style X fill:#22c55e,color:#fff
    style P fill:#ef4444,color:#fff
    style V fill:#ef4444,color:#fff
```

---

## Diagrama 3 – Ciclo de Vida da Simulação

```mermaid
flowchart TD
    START["🎮 Aluno inicia<br/>simulação"] --> LOAD["Carregar caso clínico<br/>(casos_clinicos)"]
    LOAD --> PARAMS["Carregar parâmetros<br/>(valores_iniciais_caso +<br/>parametros_secundarios_caso)"]
    PARAMS --> INIT["Inicializar:<br/>HP = 50<br/>Timer = 0<br/>Status = 'playing'"]
    INIT --> SESSION["Criar sessão<br/>(simulation_sessions)"]
    SESSION --> LOOP

    subgraph LOOP["⏱️ LOOP PRINCIPAL (1s)"]
        TICK["tick(): Atualizar timer"] --> SNAP["Snapshot dos<br/>parâmetros"]
        SNAP --> BUFFER["Adicionar ao buffer<br/>de histórico"]
        BUFFER --> ALERT["Verificar alertas<br/>sonoros"]
    end

    LOOP --> HP_DECAY

    subgraph HP_DECAY["💔 HP DECAY (5s)"]
        DEC["HP = HP - 1"] --> CHECK_HP{"HP ≤ 0?"}
        CHECK_HP -- Sim --> DEATH["💀 Status = 'lost'<br/>Paciente faleceu"]
        CHECK_HP -- Não --> CONTINUE["Continuar"]
    end

    LOOP --> TIME_CHECK{"Tempo ≥ 300s?"}
    TIME_CHECK -- Sim --> TIMEOUT["⏰ Status = 'lost'<br/>Tempo esgotado"]
    TIME_CHECK -- Não --> WAIT_ACTION

    WAIT_ACTION["Aguardar ação<br/>do aluno"] --> TREAT{"Aplicar<br/>tratamento?"}
    TREAT -- Sim --> APPLY["Aplicar tratamento<br/>(applyTreatment)"]
    TREAT -- Não --> LOOP

    APPLY --> VALIDATE{"Tratamento<br/>adequado?"}
    VALIDATE -- Sim, Prioridade 1 --> HP_P1["HP + 25"]
    VALIDATE -- Sim, Prioridade 2 --> HP_P2["HP + 15"]
    VALIDATE -- Sim, Prioridade 3 --> HP_P3["HP + 10"]
    VALIDATE -- Não --> HP_NEG["HP - 15"]

    HP_P1 & HP_P2 & HP_P3 & HP_NEG --> EFFECTS["Aplicar efeitos nos<br/>parâmetros fisiológicos"]
    EFFECTS --> RECORD["Registrar em<br/>session_treatments +<br/>session_decisions"]
    RECORD --> WIN_CHECK{"HP ≥ 100?"}
    WIN_CHECK -- Sim --> WIN["🏆 Status = 'won'<br/>Paciente estabilizado!"]
    WIN_CHECK -- Não --> LOOP

    WIN & DEATH & TIMEOUT --> FINALIZE["Finalizar sessão:<br/>- Salvar duração/status<br/>- Flush buffer histórico<br/>- checkAndAwardBadges()"]

    FINALIZE --> FEEDBACK["📊 Gerar feedback<br/>com IA (opcional)"]
    FEEDBACK --> EXPORT["📁 Exportar<br/>relatório CSV/TXT"]

    style START fill:#3b82f6,color:#fff
    style WIN fill:#22c55e,color:#fff
    style DEATH fill:#ef4444,color:#fff
    style TIMEOUT fill:#f59e0b,color:#fff
    style LOOP fill:#f0f9ff,stroke:#3b82f6
    style HP_DECAY fill:#fef2f2,stroke:#ef4444
```

---

## Diagrama 4 – Sistema de Tratamentos e Validação

```mermaid
flowchart TD
    A["Aluno clica em<br/>tratamento"] --> B{"Já aplicando<br/>outro tratamento?"}
    B -- Sim --> C["⚠️ Ignorar<br/>(proteção race condition)"]
    B -- Não --> D{"gameStatus ==<br/>'playing'?"}
    D -- Não --> E["❌ Ação não permitida<br/>após fim do jogo"]
    D -- Sim --> F["Carregar info do<br/>tratamento (tratamentos)"]

    F --> G{"Caso tem<br/>user_id?<br/>(personalizado?)"}

    G -- Sim --> H["Consultar<br/>tratamentos_caso"]
    G -- Não --> I["Consultar<br/>tratamentos_adequados"]

    H --> J{"Encontrado<br/>no gabarito?"}
    I --> J

    J -- Sim --> K["✅ ADEQUADO<br/>Eficácia = 1.0"]
    J -- Não --> L["❌ INADEQUADO<br/>Eficácia = 0.3"]

    K --> M{"Prioridade?"}
    M -- 1 --> N["HP +25<br/>(tratamento ideal)"]
    M -- 2 --> O["HP +15<br/>(tratamento bom)"]
    M -- 3 --> P["HP +10<br/>(tratamento aceitável)"]

    L --> Q["HP -15<br/>(penalidade)"]

    N & O & P & Q --> R["Carregar efeitos<br/>(efeitos_tratamento)"]
    R --> S["Aplicar efeitos nos<br/>parâmetros × eficácia"]
    S --> T["Registrar em<br/>session_treatments"]
    T --> U["Registrar decisão em<br/>session_decisions"]
    U --> V["Exibir feedback<br/>visual ao aluno"]

    V --> W{"HP ≥ 100?"}
    W -- Sim --> X["🏆 VITÓRIA!"]
    W -- Não --> Y["Continuar simulação"]

    style A fill:#3b82f6,color:#fff
    style K fill:#22c55e,color:#fff
    style L fill:#ef4444,color:#fff
    style X fill:#22c55e,color:#fff
    style N fill:#16a34a,color:#fff
    style O fill:#65a30d,color:#fff
    style P fill:#ca8a04,color:#fff
    style Q fill:#dc2626,color:#fff
```

---

## Diagrama 5 – Modelo Entidade-Relacionamento

```mermaid
erDiagram
    profiles {
        uuid id PK
        string nome_completo
        string email
        timestamp created_at
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        enum role "professor | aluno"
        timestamp criado_em
    }

    casos_clinicos {
        int id PK
        string nome
        string especie
        string descricao
        int id_condicao_primaria FK
        uuid user_id FK
    }

    condicoes {
        int id PK
        string nome
        string descricao
    }

    parametros {
        int id PK
        string nome
        string unidade
        float valor_minimo
        float valor_maximo
    }

    valores_iniciais_caso {
        int id PK
        int id_caso FK
        int id_parametro FK
        float valor
    }

    tratamentos {
        int id PK
        string nome
        string tipo
        string descricao
    }

    efeitos_tratamento {
        int id PK
        int id_tratamento FK
        int id_parametro FK
        float magnitude
    }

    efeitos_condicao {
        int id PK
        int id_condicao FK
        int id_parametro FK
        float magnitude
    }

    simulation_sessions {
        uuid id PK
        uuid user_id FK
        int case_id FK
        string nome
        string status
        int duracao_segundos
    }

    session_history {
        uuid id PK
        uuid session_id FK
        int parametro_id FK
        int timestamp
        float valor
    }

    session_treatments {
        uuid id PK
        uuid session_id FK
        int tratamento_id FK
        int timestamp_simulacao
    }

    session_decisions {
        uuid id PK
        uuid session_id FK
        string tipo
        json dados
        int hp_antes
        int hp_depois
    }

    badges {
        uuid id PK
        string nome
        string tipo
        string icone
        json criterio
    }

    user_badges {
        uuid id PK
        uuid user_id FK
        uuid badge_id FK
        uuid session_id FK
        timestamp conquistado_em
    }

    shared_cases {
        uuid id PK
        uuid shared_by FK
        int case_id FK
        string access_code
        string titulo
        boolean ativo
    }

    weekly_ranking_history {
        uuid id PK
        uuid user_id FK
        date week_start
        date week_end
        int position
        int wins
        float win_rate
    }

    turmas {
        uuid id PK
        uuid professor_id FK
        string nome
        string periodo
        boolean ativo
    }

    professor_students {
        uuid id PK
        uuid professor_id FK
        uuid student_id FK
        uuid turma_id FK
    }

    profiles ||--o{ user_roles : "tem"
    profiles ||--o{ simulation_sessions : "realiza"
    profiles ||--o{ user_badges : "conquista"
    profiles ||--o{ weekly_ranking_history : "registra"
    profiles ||--o{ casos_clinicos : "cria"
    profiles ||--o{ turmas : "gerencia"
    profiles ||--o{ professor_students : "vincula"

    casos_clinicos ||--o| condicoes : "possui"
    casos_clinicos ||--o{ valores_iniciais_caso : "define"
    casos_clinicos ||--o{ simulation_sessions : "simula"
    casos_clinicos ||--o{ shared_cases : "compartilha"

    condicoes ||--o{ efeitos_condicao : "causa"

    parametros ||--o{ valores_iniciais_caso : "parametriza"
    parametros ||--o{ efeitos_tratamento : "afetado por"
    parametros ||--o{ efeitos_condicao : "afetado por"
    parametros ||--o{ session_history : "registrado em"

    tratamentos ||--o{ efeitos_tratamento : "produz"
    tratamentos ||--o{ session_treatments : "aplicado em"

    simulation_sessions ||--o{ session_history : "registra"
    simulation_sessions ||--o{ session_treatments : "contém"
    simulation_sessions ||--o{ session_decisions : "documenta"
    simulation_sessions ||--o{ user_badges : "concede"

    badges ||--o{ user_badges : "instanciado em"

    turmas ||--o{ professor_students : "agrupa"
```

---

## Diagrama 6 – Fluxo do Professor (Criação e Compartilhamento)

```mermaid
flowchart TD
    A["👨‍🏫 Professor acessa<br/>Dashboard (/professor)"] --> B["Criar novo<br/>caso clínico"]

    B --> C["Preencher:<br/>Nome, Espécie,<br/>Descrição"]
    C --> D["Selecionar condição<br/>primária"]
    D --> E["Salvar caso<br/>(casos_clinicos)"]

    E --> F{"Popular dados<br/>com IA?"}
    F -- Sim --> G["CaseDataPopulator:<br/>Enviar para Edge Function<br/>(populate-case-data)"]
    G --> H["IA gera:<br/>• Parâmetros iniciais<br/>• Efeitos de condições<br/>• Tratamentos adequados<br/>• Metas de aprendizado"]
    H --> I["Dados salvos nas<br/>tabelas correspondentes"]
    F -- Não --> J["Configurar<br/>manualmente"]

    I --> K{"Compartilhar<br/>com alunos?"}
    J --> K

    K -- Sim --> L["Gerar código de acesso<br/>(generate_access_code)"]
    L --> M["Código: ABC12345<br/>8 caracteres únicos"]
    M --> N["Definir expiração<br/>(opcional)"]
    N --> O["Salvar em<br/>shared_cases"]
    O --> P["📋 Copiar código e<br/>enviar aos alunos"]

    K -- Não --> Q["Caso disponível<br/>apenas para o professor"]

    A --> R["Gerenciar Turmas"]
    R --> S["Criar turma:<br/>Nome, Período,<br/>Ano Letivo"]
    S --> T["Vincular alunos<br/>por e-mail"]
    T --> U["Ver relatórios<br/>por turma/aluno"]
    U --> V["Exportar dados<br/>CSV/TXT"]

    style A fill:#8b5cf6,color:#fff
    style G fill:#f59e0b,color:#fff
    style M fill:#22c55e,color:#fff
    style V fill:#3b82f6,color:#fff
```

---

## Diagrama 7 – Sistema de Gamificação

```mermaid
flowchart TD
    subgraph GAME["🎮 Mecânicas de Gamificação"]
        HP["❤️ HP<br/>(Health Points)<br/>0-100"]
        TIME["⏱️ Timer<br/>Limite: 5 min"]
        MASCOT["🐕/🐈 Mascote<br/>Expressão dinâmica"]
        MODES["📋 Modos<br/>Prática / Avaliação"]
    end

    subgraph BADGES["🏅 Sistema de Badges (17)"]
        B1["🥉 Bronze<br/>Primeira Vitória<br/>Explorador"]
        B2["🥈 Prata<br/>Sem Dicas<br/>Dedicado"]
        B3["🥇 Ouro<br/>Expert Diagnóstico<br/>Mestre Recuperação<br/>Tempo Recorde"]
        B4["🔥 Streaks<br/>3, 5, 10 vitórias<br/>consecutivas"]
        B5["🌟 Milestones<br/>1ª Vitória, Mestre<br/>Salvador, Veterano"]
        B6["📊 Rankings<br/>Top 1, Top 3<br/>Top 10, Taxa 80%+"]
    end

    subgraph RANKING["🏆 Ranking Semanal"]
        WEEK["Reset: Segunda-feira<br/>00:00"]
        CRITERIA["Critérios:<br/>Vitórias → Pontos<br/>→ Taxa Sucesso"]
        HISTORY["Histórico de<br/>posições semanais"]
        NOTIFY["📱 Notificações<br/>de reset"]
    end

    subgraph REWARDS["🎊 Recompensas"]
        CONFETTI["🎉 Confetti<br/>(canvas-confetti)"]
        SOUND["🔊 Sons de<br/>conquista"]
        TOAST["💬 Notificação<br/>toast"]
        ANIM["✨ Animação<br/>de badge"]
    end

    HP --> |"HP ≥ 100"| WIN["🏆 Vitória"]
    HP --> |"HP ≤ 0"| LOSE["💀 Derrota"]
    TIME --> |"≥ 300s"| LOSE

    WIN --> CHECK["checkAndAwardBadges()"]
    CHECK --> BADGES
    BADGES --> REWARDS

    WIN --> RANKING
    RANKING --> HISTORY

    style GAME fill:#eff6ff,stroke:#3b82f6
    style BADGES fill:#fefce8,stroke:#ca8a04
    style RANKING fill:#f0fdf4,stroke:#22c55e
    style REWARDS fill:#fdf2f8,stroke:#ec4899
    style WIN fill:#22c55e,color:#fff
    style LOSE fill:#ef4444,color:#fff
```

---

## Diagrama 8 – Fluxo de Dados em Tempo Real

```mermaid
sequenceDiagram
    participant A as Aluno (Browser)
    participant H as Hook useSimulation
    participant B as Buffer de Histórico
    participant S as Supabase (PostgreSQL)
    participant R as Supabase Realtime
    participant O as Outros Alunos

    A->>H: Iniciar simulação
    H->>S: INSERT simulation_sessions
    S-->>H: session_id

    loop A cada 1 segundo (tick)
        H->>H: Atualizar timer + parâmetros
        H->>A: Renderizar monitor
        H->>B: Adicionar snapshot ao buffer
    end

    loop A cada 5 segundos (flush)
        B->>S: BATCH INSERT session_history
        S-->>B: Confirmação
    end

    loop A cada 5 segundos (HP decay)
        H->>H: HP = HP - 1
        H->>A: Atualizar barra de HP
    end

    A->>H: Aplicar tratamento
    H->>S: SELECT tratamentos_adequados
    S-->>H: Tratamento adequado? Prioridade?
    H->>H: Calcular HP change + efeitos
    H->>S: INSERT session_treatments
    H->>S: INSERT session_decisions
    H->>A: Feedback visual (HP ±)
    H->>R: Notificação de ranking

    R-->>O: Atualização em tempo real

    Note over H,S: Finalização
    H->>B: Flush buffer restante
    B->>S: INSERT histórico final
    H->>S: UPDATE simulation_sessions (status, duração)
    H->>S: checkAndAwardBadges()
    S-->>A: Badges conquistados
```

---

## Diagrama 9 – Segurança e Controle de Acesso (RLS)

```mermaid
flowchart TD
    subgraph AUTH["🔐 Autenticação"]
        EMAIL["Email + Senha<br/>(Supabase Auth)"]
        VERIFY["Verificação<br/>de e-mail"]
        KEY["Chave de Acesso<br/>(professores)"]
    end

    subgraph ROLES["👥 Papéis"]
        PROF["👨‍🏫 Professor"]
        ALUNO["👨‍🎓 Aluno"]
    end

    subgraph RLS["🛡️ Row Level Security"]
        direction TB
        R1["casos_clinicos:<br/>SELECT: públicos + próprios + compartilhados<br/>INSERT: apenas professores<br/>UPDATE/DELETE: apenas próprios"]
        R2["simulation_sessions:<br/>CRUD: apenas próprias sessões"]
        R3["user_badges:<br/>SELECT/INSERT: apenas próprios<br/>UPDATE/DELETE: bloqueado"]
        R4["shared_cases:<br/>SELECT: ativos (todos) + próprios (prof)<br/>INSERT/UPDATE/DELETE: professores"]
        R5["weekly_ranking_history:<br/>SELECT/INSERT: apenas próprio<br/>UPDATE/DELETE: bloqueado"]
    end

    subgraph FUNCS["⚙️ Funções de Segurança"]
        F1["has_role(role, user_id)<br/>Verifica papel sem recursão"]
        F2["validate_professor_access_key()<br/>Valida chave institucional"]
        F3["register_professor()<br/>Registro seguro com chave"]
        F4["register_aluno()<br/>Registro seguro de aluno"]
        F5["generate_access_code()<br/>Código único 8 chars"]
    end

    EMAIL --> VERIFY --> ROLES
    KEY --> F2 --> PROF
    PROF --> R1
    PROF --> R4
    ALUNO --> R2
    ALUNO --> R3
    ALUNO --> R5
    F1 --> RLS

    style AUTH fill:#fef2f2,stroke:#ef4444
    style ROLES fill:#eff6ff,stroke:#3b82f6
    style RLS fill:#f0fdf4,stroke:#22c55e
    style FUNCS fill:#fefce8,stroke:#ca8a04
```

---

## Diagrama 10 – Arquitetura Mobile (Capacitor)

```mermaid
flowchart TD
    subgraph WEB["🌐 Aplicação Web"]
        REACT["React 18<br/>TypeScript"]
        VITE["Vite Build<br/>(dist/)"]
    end

    subgraph CAP["📱 Capacitor Bridge"]
        CORE["@capacitor/core"]
        CLI["@capacitor/cli"]
    end

    subgraph PLUGINS["🔌 Plugins Nativos"]
        SS["SplashScreen<br/>Tela de abertura<br/>2s, #0f172a"]
        SB["StatusBar<br/>Estilo DARK<br/>#0f172a"]
        PN["PushNotifications<br/>badge + sound + alert"]
        HAP["Haptics<br/>Feedback tátil"]
        APP["App Plugin<br/>Ciclo de vida"]
    end

    subgraph ANDROID["🤖 Android"]
        WEBVIEW["WebView<br/>(Chromium)"]
        APK["APK<br/>Instalável"]
        NATIVE["APIs Nativas<br/>Android"]
    end

    subgraph SERVER["☁️ Servidor"]
        PREVIEW["Preview URL<br/>(vetbalance.app.br)"]
        SUPA["Supabase<br/>Backend"]
    end

    REACT --> VITE
    VITE --> CAP
    CAP --> PLUGINS
    CAP --> ANDROID
    WEBVIEW --> PREVIEW
    PREVIEW --> SUPA
    PLUGINS --> NATIVE

    style WEB fill:#eff6ff,stroke:#3b82f6
    style CAP fill:#fefce8,stroke:#ca8a04
    style PLUGINS fill:#f0fdf4,stroke:#22c55e
    style ANDROID fill:#fef2f2,stroke:#ef4444
    style SERVER fill:#f5f3ff,stroke:#8b5cf6
```

---

## Como Renderizar os Diagramas

- **GitHub:** Visualize este arquivo diretamente no GitHub — os diagramas Mermaid são renderizados automaticamente.
- **Mermaid Live Editor:** Acesse [mermaid.live](https://mermaid.live), cole o código do diagrama e exporte como PNG/SVG.
- **VS Code:** Instale a extensão "Markdown Preview Mermaid Support" e abra o preview do arquivo.
