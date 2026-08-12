# Piloto na Uninassau sem prejuízo de aprendizado

Desenho definido: turma dividida em dois grupos (metade usa o VetBalance, metade não), sem valer nota. Suas duas preocupações são conteúdo clínico incorreto e falhas técnicas durante a aula.

A boa notícia: "sem prejuízo de aprendizado" é atingível com duas garantias — (1) o grupo controle recebe o mesmo conteúdo por método tradicional e ganha acesso ao software **depois** da coleta; (2) o simulador não pode ensinar nada errado nem falhar no meio da aula. O plano abaixo cobre as duas.

## 1. Blindagem do conteúdo clínico (prioridade)

O que foi verificado no banco agora:

- Casos 1 a 7 (os casos oficiais) têm valores iniciais e gabarito de tratamentos completos.
- **Metas de aprendizado estão rasas**: o caso 1 tem 5 metas; os casos 2 a 7 têm apenas 2 metas cada. Com só 2 metas, o feedback pedagógico e a pontuação ficam pobres e podem induzir leitura errada de desempenho.
- **Existem casos de teste/rascunho no banco** (caso 14 "teste", além dos casos 15 a 18 criados por professor) sem metas de aprendizado. Se qualquer um deles aparecer para os alunos do piloto, o aluno roda um caso sem objetivos e sem feedback.
- A tabela de passos do tutorial está vazia (0 registros) — o tutorial hoje roda 100% pelo conteúdo local do aplicativo.

Ações:

- Revisão clínica caso a caso (1 a 7): conferir valores iniciais, faixas de referência, gabarito de tratamentos e justificativas contra a literatura, e registrar isso num documento de validação de conteúdo assinável por você e pelo orientador.
- Ampliar as metas de aprendizado dos casos 2 a 7 para o mesmo nível do caso 1 (diagnóstico, correção do distúrbio ácido-base, estabilização e tempo), cada uma com justificativa clínica.
- Definir o conjunto oficial do piloto: apenas os casos 1 a 7. Garantir que casos de rascunho de outros usuários não sejam listados para os alunos da turma.

## 2. Blindagem técnica da aula

- Ensaio geral (dry run) com 2 ou 3 contas de aluno simulando ao mesmo tempo, percorrendo cadastro, aceite do TCLE, tutorial, simulação completa e relatório final.
- Teste dos 7 casos de ponta a ponta, verificando que HP, monitor de sinais vitais, metas e pontuação respondem coerentemente.
- Verificação de resiliência: recarregar a página no meio da simulação, perder conexão por alguns segundos e voltar — o progresso do aluno não pode desaparecer.
- Plano B de aula: roteiro impresso do caso e das perguntas, para o professor continuar a atividade caso a internet do laboratório caia.

## 3. Protocolo do piloto (grupo A x grupo B)

- Alocação aleatória da turma em dois grupos de tamanho semelhante, registrada previamente.
- Grupo A: aula com o simulador. Grupo B: mesma aula com método tradicional (caso clínico em papel e discussão), com o mesmo tempo e o mesmo conteúdo.
- Pré-teste idêntico para os dois grupos antes da aula e pós-teste idêntico depois — usando o instrumento de avaliação já existente no projeto (Anexo A).
- Só o grupo A responde o questionário SUS (Anexo B), por ser sobre usabilidade do software.
- **Compensação pedagógica**: ao final da coleta, o grupo B recebe acesso liberado ao simulador e uma sessão de reposição com os mesmos casos. É isso que garante ausência de prejuízo, e deve estar escrito no TCLE e no roteiro do professor.
- Resultado não vale nota para nenhum dos grupos; deixar isso explícito para a turma no início.

## 4. Entregáveis

- Documento de validação de conteúdo clínico dos 7 casos (para o orientador assinar).
- Roteiro de aula do professor, uma versão para o grupo A e uma para o grupo B, com tempos.
- Checklist de sala de aula: o que testar 30 minutos antes de começar.
- Relatório do ensaio geral com o que foi corrigido.

## Detalhes técnicos

- Ampliação das metas: inserções em `metas_aprendizado` para os casos 2 a 7, seguindo o padrão de tipos já usado no caso 1.
- Restrição do catálogo do piloto: revisar a listagem de casos exibida ao aluno para que rascunhos de outros usuários (casos 14 a 18) não apareçam, mantendo as políticas de acesso atuais.
- Validação técnica com Playwright contra o preview local, cobrindo os 7 casos, mais consultas ao banco para confirmar que sessões, decisões e metas alcançadas são persistidas.
- Nenhuma mudança na mecânica do simulador (HP inicia em 50, dica custa -10, tick de 1s, salvamento em lote a cada 5s) — apenas conteúdo, listagem e verificação.

## Fora de escopo

- Alterar pontuação, gamificação ou ranking.
- Novos casos clínicos além dos 7 já existentes.
