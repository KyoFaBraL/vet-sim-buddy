# Registro do lote 3 de fontes na base do projeto

Objetivo: gravar os 10 PDFs recém-enviados na memória do projeto, sem gerar nenhum documento e sem tocar na dissertação. Mantida a proporção 70% desenvolvimento/qualidade de software, 20% medicina veterinária, 10% educação e tecnologia.

## O que já foi identificado nos arquivos

| Fonte | Eixo | Por que interessa ao VetBalance |
| --- | --- | --- |
| Kofránek et al. (MEDINFO 2001, IOS Press) — GOLEM, simulador multimídia | Software | Simulador de distúrbios críticos com 39 equações diferenciais, 89 entradas e 179 saídas, cobrindo equilíbrio ácido-base, gases sanguíneos e volemia. Precedente direto do motor fisiológico do VetBalance. |
| Rawson e Quinlan (2002, JVME) — Acid/Base Primer | Software | Software de ácido-base para veterinária avaliado com 75 de 81 alunos (93%); pré-teste 53% → pós-teste 74%. Paralelo metodológico mais próximo do nosso teste piloto. |
| Rawson et al. (2009, Adv Physiol Educ 33:202-208) — simulação de fluidoterapia | Software | Modelo dinâmico de fluidos e eletrólitos em Cornell, substituindo casos em papel por paciente que responde ao longo do tempo. Justifica o tick contínuo e a resposta ao tratamento. |
| Seguino et al. (2014, JVME) — Virtual Slaughterhouse Simulator | Software | Desenvolvimento e avaliação de simulador veterinário quando o campo real fica indisponível. |
| Møller Klit, Nielsen e Stege (2020, JVME) — desenvolvimento iterativo de DGBL em rebanho suíno virtual | Software | Relata o atrito entre especialistas (conteúdo x jogo) e o ciclo iterativo de desenvolvimento — base para a seção de método de construção. |
| Drummond, Hadchouel e Tesnière (2017, Adv Simul 2:3) — serious games for health | Educação | Convergência de motivação intrínseca/extrínseca, "quatro pilares da aprendizagem" e como avaliar serious games. |
| Braun et al. (2019, Diagnosis 6(2):137-149) — scaffolding com pacientes virtuais | Educação | 148 alunos, 5 grupos, 15 casos virtuais; efeito de scaffolding e feedback na acurácia e nos erros diagnósticos. Sustenta o modo guiado e o sistema de dicas. |
| Curtis, DiazGranados e Feldman (2012, J Contin Educ Health Prof 32(4):255-260) — uso judicioso de simulação | Educação | Discute nível adequado de fidelidade: fidelidade alta não é automaticamente melhor. Justifica as escolhas de simplificação do simulador. |
| Lentz e Ackil (2023, Emerg Med Clin N Am 41:849-862) — distúrbios metabólicos ácido-base | Veterinária/clínica | Ânion gap ajustado para hipoalbuminemia, delta-delta, distúrbios mistos e condutas. Referência para as regras clínicas do motor. |
| Judge (2022, Emerg Med Clin N Am 40:251-264) — acidose metabólica no paciente intoxicado | Veterinária/clínica | Causas toxicológicas de acidose e abordagem em etapas — insumo para novos casos clínicos. |

## Passos

1. Completar os metadados que faltam diretamente nos PDFs (volume, número e páginas de Rawson e Quinlan 2002, Seguino 2014 e Møller Klit 2020) para fechar cada citação ABNT.
2. Criar `mem://reference/fontes-lote3-simulacao-e-acido-base` com, por fonte: citação ABNT completa, eixo temático (software / veterinária / educação), números-chave verificados no próprio arquivo e a decisão do VetBalance que ela sustenta.
3. Atualizar `mem://reference/referencial-teorico-fontes-internacionais` e `mem://reference/fontes-lote2-simuladores-e-serious-games` com o ponteiro cruzado para o lote 3, mantendo os três lotes como um corpus único de 30 fontes.
4. Atualizar `mem://index.md` acrescentando o lote 3 à lista de memórias.
5. Registrar as sobreposições para evitar citação duplicada mais adiante: Rawson aparece em 2002 e 2009 (trabalhos distintos, mesmo grupo de Cornell) e o tema pacientes virtuais já tem fontes nos lotes 1 e 2.

## Fora do escopo

Nenhum arquivo .docx ou .pdf será gerado, e o capítulo de revisão de literatura da dissertação não será alterado neste passo.
