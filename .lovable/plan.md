# Geração automática dos códigos GE/GC no cadastro

Sim, o sistema pode gerar os códigos automaticamente. Cada aluno recebe um código no momento em que entra no estudo, sem digitação manual e sem expor o nome nos instrumentos.

## Como vai funcionar

- O aluno se cadastra com o e-mail e aceita o TCLE como já acontece hoje.
- Ao aceitar o TCLE, o sistema atribui automaticamente um código no formato `GE-001` / `GC-001`.
- A alocação é **alternada balanceada**: o primeiro participante da turma vai para GE, o segundo para GC, o terceiro para GE, e assim por diante — garantindo grupos do mesmo tamanho.
- A numeração é **por turma**: cada turma tem sua própria sequência começando em 001.
- Se o aluno ainda não estiver vinculado a uma turma, ele entra numa sequência geral e o código é recalculado quando o professor o vincular.
- O **aluno vê seu próprio código** em destaque (tela inicial e após o aceite do TCLE), para copiar no formulário SUS impresso.
- O **professor/admin** vê a lista completa de códigos no painel de alunos, com exportação em CSV compatível com a planilha mestre (turma, disciplina, data, código).

## O que muda na prática

- A planilha modelo de sorteio deixa de ser obrigatória — ela passa a ser apenas conferência, alimentada pelo CSV exportado.
- O código nunca muda depois de atribuído (a não ser em troca de turma, com registro da alteração).
- Nenhum nome aparece nos relatórios: apenas os códigos.

## Detalhes técnicos

1. Nova tabela `participant_codes` (banco): `user_id`, `turma_id`, `grupo` ('GE' | 'GC'), `sequencia`, `codigo`, `criado_em`, `atualizado_em`. Índice único por `user_id` e por (`turma_id`, `codigo`). GRANTs para `authenticated`/`service_role` e RLS: aluno lê apenas o próprio registro; professor lê os códigos dos alunos vinculados; admin lê tudo. Nenhuma escrita direta pelo cliente.
2. Função `assign_participant_code(p_user_id uuid)` em `SECURITY DEFINER`: lê a turma do aluno em `professor_students`, conta os códigos existentes daquele escopo, decide GE/GC pela paridade da próxima sequência, insere e retorna o código. Idempotente (se já existir, retorna o existente) e serializada com `pg_advisory_xact_lock` sobre o escopo, para evitar códigos duplicados em cadastros simultâneos.
3. Função `reassign_participant_code(p_user_id uuid, p_turma_id uuid)` para o caso de vínculo/troca de turma, chamada quando o professor vincula o aluno.
4. Função `get_participant_codes_for_professor()` em `SECURITY DEFINER`, retornando código, grupo, nome, turma e data apenas dos alunos vinculados ao professor autenticado (mesmo padrão de `get_linked_students_for_professor`).
5. `src/hooks/useTcleConsent.ts`: após gravar o consentimento aceito, chamar `assign_participant_code`; expor `codigoParticipante` no hook.
6. `src/pages/ConsentimentoTCLE.tsx`: exibir o código atribuído na confirmação de aceite, com instrução curta de uso no formulário impresso.
7. `src/pages/Index.tsx`: badge discreto com o código do participante para o aluno logado.
8. `src/pages/ProfessorDashboard.tsx`: nova aba/seção "Códigos GE/GC" com tabela e botão de exportar CSV (delimitador `;`, cabeçalho `sep=;`, BOM UTF-8, conforme o padrão do projeto).
