# SIMULADOR VETERINÁRIO GAMIFICADO PARA ENSINO DE EQUILÍBRIO ÁCIDO-BASE EM PEQUENOS ANIMAIS

## INTRODUÇÃO

A Revolução Industrial 4.0 tem transformado significativamente o cenário educacional, integrando tecnologias digitais aos processos de ensino-aprendizagem. Na medicina veterinária, os distúrbios do equilíbrio ácido-base representam um dos desafios mais complexos no intensivismo, envolvendo conceitos intrincados como pH sanguíneo, bicarbonato, pCO₂ e anion gap. Estes distúrbios exigem tomada de decisões clínicas rápidas e precisas, especialmente em pacientes críticos, constituindo um obstáculo significativo para estudantes e profissionais recém-formados.

A aprendizagem móvel (m-learning) emerge como alternativa promissora, aproveitando a ubiquidade dos dispositivos móveis – com 81,43% dos brasileiros utilizando Android – para transformar smartphones em ferramentas educacionais efetivas. A gamificação, estratégia que incorpora elementos de jogos em contextos não lúdicos, demonstra potencial para aumentar o engajamento, promover aprendizagem ativa e facilitar a aplicação prática de conhecimentos teóricos complexos. Neste contexto, o desenvolvimento de ferramentas digitais interativas que simulem situações clínicas reais torna-se fundamental para preparar adequadamente os futuros profissionais da medicina veterinária intensivista.

## OBJETIVO

Desenvolver e validar um software educacional gamificado, em modalidade m-learning acessível via navegadores web em dispositivos móveis, voltado ao treinamento de estudantes e profissionais da clínica médica veterinária de pequenos animais, focando especificamente na identificação e tratamento de distúrbios do equilíbrio ácido-base em cães e gatos, através de simulações clínicas interativas que promovam aprendizagem ativa e tomada de decisão em tempo real.

## MATERIAL E MÉTODOS

O simulador foi desenvolvido utilizando tecnologias web modernas (React, TypeScript, Tailwind CSS) com integração a banco de dados Supabase para persistência de dados e gerenciamento de usuários. A arquitetura contempla dois perfis: professores e estudantes, com funcionalidades específicas para cada categoria.

O sistema implementa casos clínicos customizáveis contendo parâmetros fisiológicos monitorados em tempo real (frequência cardíaca, frequência respiratória, temperatura, pH sanguíneo, pCO₂, HCO₃, entre outros). A mecânica gamificada inclui sistema de pontos de vida (HP) que decresce gradualmente, simulando a deterioração do paciente crítico, exigindo intervenções terapêuticas adequadas dentro de janelas temporais específicas.

Os estudantes aplicam tratamentos selecionando medicações e procedimentos, recebendo feedback imediato sobre suas decisões. O algoritmo de simulação registra todas as ações em banco de dados (session_history, session_decisions, session_treatments) para análise posterior. Sistema de badges reconhece conquistas específicas (diagnóstico preciso, estabilização rápida, uso eficiente de recursos) incentivando progressão.

Professores podem criar casos personalizados, acompanhar desempenho individual dos alunos através de relatórios detalhados, compartilhar casos via códigos de acesso e realizar análises comparativas entre sessões. O sistema incorpora inteligência artificial (Gemini/GPT) para geração de diagnósticos diferenciais, dicas contextualizadas e feedback personalizado.

A validação seguirá metodologia quase-experimental com 40 estudantes randomizados em dois grupos (n=20 cada): experimental (com acesso ao software) e controle (sem acesso, com acesso garantido após a coleta), durante 20 semanas nas disciplinas de Fisiologia Animal e Farmacologia. O projeto será submetido ao Comitê de Ética em Pesquisa da UFPI (CEP/UFPI) via Plataforma Brasil, com prazo estimado de 3 meses para tramitação (março–maio de 2026), conforme protocolo documentado em `PROTOCOLO_CEP.md` v2.0 (12 seções + Anexos A–J). O estudo contempla quatro pontos de medição: pré-teste diagnóstico (O₁), avaliação intermediária 1 sobre distúrbios metabólicos (O₂), avaliação intermediária 2 sobre distúrbios respiratórios e mistos (O₃) e pós-teste final abrangente (O₄). A análise estatística utilizará teste t de Student (α=0,05), d de Cohen (≥ 0,8), correlação de Pearson e questionário SUS adaptado, com processamento realizado no RStudio. Agosto de 2026 será reservado para redação da dissertação e defesa do mestrado.

## RESULTADOS ESPERADOS

Espera-se desenvolver ferramenta educacional inovadora que melhore significativamente a competência clínica de estudantes e profissionais na identificação e manejo de distúrbios do equilíbrio ácido-base. A gamificação deverá promover maior engajamento e motivação discente, traduzindo-se em melhor retenção de conhecimento e habilidade de aplicação prática.

Prevê-se que o grupo experimental apresente desempenho superior nas avaliações, demonstrando eficácia da metodologia m-learning gamificada. A disponibilização de nova modalidade de aprendizado baseada em TIC contribuirá para fortalecimento das ações tecnológicas educacionais, democratizando acesso à educação continuada de qualidade independente de limitações geográficas ou temporais.

A plataforma possibilitará formação de repositório de casos clínicos estruturados, fomentando cultura de aprendizagem colaborativa e compartilhamento de conhecimento entre instituições. Espera-se obter registro de software, contribuindo para produção científica e tecnológica nacional em educação veterinária, além de despertar maior interesse discente por áreas críticas da medicina veterinária intensivista.

---

## EVIDÊNCIAS VISUAIS DO SOFTWARE

As capturas de tela das principais interfaces do VetBalance estão disponíveis no repositório do projeto:  
📁 [`docs/screenshots/`](https://github.com/KyoFaBraL/vet-sim-buddy/tree/main/docs/screenshots)

| Figura | Descrição |
|--------|-----------|
| ![Seleção de Papel](docs/screenshots/01-role-selection.png) | **Figura 1** – Tela inicial de seleção de papel (Professor/Aluno) |
| ![Login Aluno](docs/screenshots/02-auth-aluno.png) | **Figura 2** – Formulário de autenticação do aluno |
| ![Login Professor](docs/screenshots/03-auth-professor.png) | **Figura 3** – Formulário de autenticação do professor com chave de acesso |
| ![Dashboard Aluno](docs/screenshots/04-dashboard-aluno.png) | **Figura 4** – Dashboard principal do simulador (interface do aluno) |
| ![Monitor de Parâmetros](docs/screenshots/05-monitor-parametros.png) | **Figura 5** – Monitor de parâmetros fisiológicos em tempo real |
| ![Painel de Tratamentos](docs/screenshots/06-painel-tratamentos.png) | **Figura 6** – Painel de seleção e aplicação de tratamentos |
| ![Sistema de Badges](docs/screenshots/07-sistema-badges.png) | **Figura 7** – Sistema de badges e conquistas gamificadas |
| ![Ranking Semanal](docs/screenshots/08-ranking-semanal.png) | **Figura 8** – Leaderboard com ranking semanal dos alunos |
| ![Histórico de Evolução](docs/screenshots/09-historico-evolucao.png) | **Figura 9** – Histórico de evolução no ranking ao longo das semanas |
| ![Dashboard Professor](docs/screenshots/10-dashboard-professor.png) | **Figura 10** – Dashboard de gerenciamento do professor |
| ![Resultado Vitória](docs/screenshots/11-resultado-vitoria.png) | **Figura 11** – Resultado de simulação: paciente estabilizado (vitória) |
| ![Resultado Derrota](docs/screenshots/12-resultado-derrota.png) | **Figura 12** – Resultado de simulação: paciente faleceu (derrota) |

---

## REFERÊNCIAS CRUZADAS

| Documento | Relação com este Resumo Expandido |
|-----------|-----------------------------------|
| `DOCUMENTACAO_SOFTWARE.md` | Documentação técnica completa — Seção 22 detalha cronograma, instrumentos e critérios de aceitação |
| `CRONOGRAMA_VALIDACAO.md` (PVS-001) | Plano de Validação IEEE 829 — Seções 5, 8–12 fundamentam o desenho experimental e análise estatística |
| `RESUMO_EXECUTIVO.md` | Síntese executiva — Seção 6 resume fases e marcos do estudo |
| `DIAGRAMAS_MERMAID.md` | Diagramas de arquitetura, fluxos e ER do sistema |
| `GLOSSARIO.md` | Glossário unificado — padroniza os 43 termos técnicos, clínicos e metodológicos utilizados neste resumo |
| `cronograma-validacao-vetbalance.csv` | Dados tabulares do cronograma (importável para planilhas) |

---

**Palavras-chave:** Gamificação. Ensino veterinário. M-learning. Equilíbrio ácido-base. Simulação clínica.
