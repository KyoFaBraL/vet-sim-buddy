# RESUMO

**Simulador Veterinário Gamificado para Ensino de Equilíbrio Ácido-Base em Pequenos Animais**

## Introdução

Os distúrbios do equilíbrio ácido-base representam um dos temas mais complexos da medicina veterinária intensivista, exigindo interpretação rápida de parâmetros como pH, pCO₂, HCO₃⁻ e anion gap, além de tomada de decisão clínica imediata em pacientes críticos. Estudantes de graduação e profissionais recém-formados frequentemente apresentam dificuldades na aplicação prática desses conceitos. Nesse contexto, a aprendizagem móvel (m-learning) associada à gamificação surge como estratégia promissora, aproveitando a ampla penetração de dispositivos móveis no Brasil para transformar smartphones em ferramentas educacionais ativas, capazes de simular cenários clínicos realistas em ambiente seguro.

## Objetivo

Desenvolver e validar um software educacional gamificado, em modalidade m-learning acessível via navegadores web, voltado ao treinamento de estudantes de medicina veterinária na identificação e tratamento de distúrbios do equilíbrio ácido-base em cães e gatos, por meio de simulações clínicas interativas que promovam aprendizagem ativa e tomada de decisão em tempo real.

## Métodos

O VetBalance foi desenvolvido em React, TypeScript e Tailwind CSS, com backend em PostgreSQL (Lovable Cloud) composto por 32 tabelas com Row Level Security e 9 Edge Functions integradas a modelos de IA (Gemini e GPT). O sistema contempla dois perfis de usuário (professor e aluno) e implementa 7 casos clínicos pré-definidos, 10 parâmetros fisiológicos monitorados em tempo real, 8 tratamentos com efeitos modelados, sistema de HP (Health Points) que simula a deterioração do paciente crítico, 17 badges em 5 categorias e ranking semanal. Todas as decisões são registradas em banco para análise posterior.

A validação seguirá metodologia quase-experimental, com 40 estudantes randomizados em dois grupos (experimental, n=20, com acesso ao software; controle, n=20, sem acesso durante a coleta), ao longo de 20 semanas nas disciplinas de Fisiologia Animal e Farmacologia. O estudo prevê quatro pontos de medição (O₁ pré-teste, O₂ e O₃ intermediários, O₄ pós-teste final) e questionário SUS adaptado para avaliação de usabilidade. A análise estatística utilizará teste t de Student (α=0,05), d de Cohen e correlação de Pearson, com processamento no RStudio. O projeto será submetido ao CEP/UFPI via Plataforma Brasil.

## Resultados

Espera-se que o grupo experimental apresente desempenho significativamente superior ao grupo controle nas avaliações de identificação e manejo de distúrbios ácido-base, demonstrando a eficácia da metodologia m-learning gamificada. Prevê-se ainda maior engajamento discente, melhor retenção de conhecimento, alta aceitação no questionário SUS (média ≥ 4,0/5,0) e formação de repositório colaborativo de casos clínicos estruturados, ampliando o acesso à educação veterinária continuada de qualidade independentemente de barreiras geográficas.

## Conclusão

O VetBalance constitui ferramenta inovadora de m-learning gamificado para o ensino de equilíbrio ácido-base em medicina veterinária, integrando simulação clínica realista, inteligência artificial e mecânicas de jogo. Sua validação experimental contribuirá para fortalecer práticas educacionais baseadas em TIC, formar profissionais mais bem preparados para a clínica intensivista de pequenos animais e gerar produção científica e tecnológica nacional, com perspectiva de registro de software.

**Palavras-chave:** Gamificação. Ensino veterinário. M-learning. Equilíbrio ácido-base. Simulação clínica.
