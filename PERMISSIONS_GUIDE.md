# Guia de Organização e Permissões de Usuários

## Tipos de Usuários

### 👨‍🏫 Professor
**Objetivo:** Criar e gerenciar conteúdo educacional para os alunos.

#### Permissões de Acesso:
✅ **Criar e Gerenciar Casos**
- Criar novos casos clínicos
- Editar seus próprios casos
- Deletar seus próprios casos
- Ver todos os casos que criou

✅ **Geração de Dados com IA**
- Usar CaseDataPopulator para gerar dados automaticamente
- Popular casos com parâmetros, tratamentos e condições

✅ **Compartilhamento de Casos**
- Gerar códigos de acesso (8 caracteres)
- Definir data de expiração dos códigos
- Ativar/desativar códigos de acesso
- Ver quantidade de acessos por código
- Gerenciar casos compartilhados

✅ **Relatórios e Análises**
- Ver estatísticas de performance dos alunos
- Acessar relatórios avançados
- Ver biblioteca de casos
- Análise detalhada de sessões

❌ **Sem Acesso a:**
- Modo de simulação (interface do aluno)
- Comandos de voz
- Badges individuais de alunos

---

### 👨‍🎓 Aluno
**Objetivo:** Praticar e aprender através de simulações clínicas.

#### Permissões de Acesso:
✅ **Simulações**
- Acessar modo prática (practice)
- Acessar modo avaliação (evaluation)
- Executar simulações completas
- Pausar/retomar/resetar simulações

✅ **Acesso a Casos**
- Ver casos públicos (sem user_id)
- Acessar casos compartilhados via código de acesso
- Ver informações detalhadas dos casos disponíveis

✅ **Comandos de Voz**
- Controlar simulação por voz (português brasileiro)
- Comandos: "iniciar", "parar", "pausar", "aplicar tratamento"

✅ **Tratamentos e Diagnósticos**
- Aplicar tratamentos durante simulação
- Receber dicas de tratamento
- Realizar desafios diagnósticos
- Ver feedback de ações

✅ **Progresso e Conquistas**
- Ver histórico de sessões
- Comparar sessões anteriores
- Conquistar e ver badges
- Acompanhar metas de aprendizado
- Ver pontuação e estatísticas pessoais

✅ **Anotações**
- Criar notas durante simulação
- Organizar anotações por timestamp
- Revisar notas de sessões anteriores

❌ **Sem Acesso a:**
- Criar novos casos
- Gerar dados com IA
- Compartilhar casos
- Relatórios avançados de outros alunos
- Estatísticas de performance de outros alunos

---

## Tabelas e Políticas RLS

### `user_roles`
- **Enum:** `app_role` ('professor', 'aluno')
- **SELECT:** Usuários veem apenas seu próprio role
- **INSERT:** Usuários podem inserir apenas seu próprio role
- **UPDATE/DELETE:** ❌ Bloqueado (role é permanente)

### `casos_clinicos`
- **SELECT:** 
  - Casos públicos (user_id IS NULL)
  - Casos próprios (user_id = auth.uid())
  - Casos compartilhados ativos (via shared_cases)
- **INSERT:** Apenas professores
- **UPDATE/DELETE:** Apenas próprios casos

### `shared_cases`
- **SELECT:** 
  - Professores veem seus compartilhamentos
  - Todos veem compartilhamentos ativos (por código)
- **INSERT/UPDATE/DELETE:** Apenas professores (seus próprios)

### `shared_case_access`
- **SELECT:** Usuários veem seus próprios acessos
- **INSERT:** Usuários registram seus próprios acessos
- **UPDATE/DELETE:** ❌ Bloqueado (log permanente)

### `simulation_sessions`
- **SELECT/INSERT/UPDATE/DELETE:** Apenas próprias sessões

### `user_badges`
- **SELECT/INSERT:** Apenas próprios badges
- **UPDATE/DELETE:** ❌ Bloqueado

---

## Fluxo de Compartilhamento de Casos

### 1️⃣ Professor Compartilha Caso
1. Professor acessa "Compartilhar Casos com Alunos"
2. Seleciona caso existente
3. Define título e descrição (opcional)
4. Sistema gera código único (ex: ABC12345)
5. Professor pode definir data de expiração
6. Professor copia código e envia aos alunos

### 2️⃣ Aluno Acessa Caso
1. Aluno acessa campo "Código de Acesso"
2. Digita código fornecido pelo professor
3. Sistema valida:
   - Código existe?
   - Está ativo?
   - Não expirou?
4. Sistema registra acesso em `shared_case_access`
5. Caso é carregado e adicionado aos casos disponíveis do aluno
6. Aluno pode executar simulações com o caso

---

## Segurança Implementada

✅ **Row Level Security (RLS)** ativado em todas as tabelas
✅ **Security Definer Functions** para evitar recursão em RLS
✅ **Enum Types** para roles fixos e seguros
✅ **Foreign Keys** para integridade referencial
✅ **Validações de usuário** em INSERT/UPDATE
✅ **Logs de acesso** permanentes e imutáveis
✅ **Códigos únicos** gerados automaticamente
✅ **Controle de expiração** de códigos de acesso

---

## Recomendações de UX

### Para Professores:
- Interface focada em **criação e gerenciamento**
- Dashboard com **métricas de engajamento dos alunos**
- **Notificações** quando alunos acessam casos compartilhados
- **Exportação** de relatórios em PDF/Excel

### Para Alunos:
- Interface focada em **simulação e aprendizado**
- **Gamificação** com badges e pontos
- **Feedback imediato** em ações
- **Tutorial interativo** para novos usuários
- **Comandos de voz** para acessibilidade
- **Progresso visual** claro e motivador

---

## Próximas Melhorias Sugeridas

1. **Analytics para Professores:**
   - Taxa de conclusão de casos
   - Tempo médio de simulação
   - Tratamentos mais/menos utilizados
   - Erros comuns dos alunos

2. **Colaboração:**
   - Professores podem compartilhar casos entre si
   - Casos podem ser marcados como "públicos" ou "privados"
   - Biblioteca comunitária de casos

3. **Personalização:**
   - Alunos podem configurar preferências de som/voz
   - Temas visuais personalizados
   - Níveis de dificuldade ajustáveis

4. **Exportação:**
   - Alunos exportam certificados de conclusão
   - Professores exportam relatórios consolidados
   - Exportação de histórico completo em JSON
