## Verificação do Checklist Plataforma Brasil vs. e-mail CEP-UFPI/CMPP

Comparei os 11 itens exigidos pelo CEP com o conteúdo atual de `/mnt/documents/`. Resumo do status:

| # | Item exigido pelo CEP | Arquivo atual | Status |
|---|---|---|---|
| 01 | Declaração dos Pesquisadores assinada por todos | `DECLARACAO_PESQUISADORES.docx` | OK em conteúdo — falta confirmar assinaturas de TODOS os pesquisadores |
| 02 | Currículos Lattes (atualizados <6 meses) | `Lattes_Napoleao_Argolo.pdf`, `Lattes_Caio_Cabral.pdf` | Confirmar data de atualização (hoje = 24/06/2026 → atualização exigida a partir de 24/12/2025) |
| 03 | Carta de Encaminhamento à atual coordenadora | `CARTA_ENCAMINHAMENTO_CEP.docx` | **Pendente** — dirigida a "Prof. Dr. Raimundo Nonato"; precisa ser à **Prof.ª Dr.ª Hilris Rocha e Silva** |
| 04 | Termo de Confidencialidade c/ guarda mín. 5 anos | `ANEXO_E_TERMO_CONFIDENCIALIDADE.docx` | Revisar cláusula de guarda mínima de 5 anos (Res. 510/2016, Cap. VI, Art. 28, IV) e assinaturas |
| 05 | Folha de Rosto assinada + carimbo instituição | `Folha_de_Rosto_Plataforma_Brasil.pdf` | Confirmar assinaturas físicas + carimbo da instituição proponente |
| 06 | Instrumento de coleta anonimizado | `ANEXO_H_INSTRUMENTO_AVALIACAO.docx`, `ANEXO_I_QUESTIONARIO_SUS.docx` | Verificar que não há campo "nome do participante" |
| 07 | TCLE com endereço/telefone/e-mail/horário CEP, 2 vias, paginação, sem assinatura prévia | `TCLE_VETBALANCE.docx` | **Pendente** — coordenador desatualizado (Raimundo Nonato → Hilris Rocha e Silva); restante OK |
| 08 | Autorização Institucional assinada e carimbada | `TERMO_ANUENCIA_INSTITUCIONAL.docx` | Confirmar assinatura + carimbo do responsável da instituição |
| 09 | Projeto completo | `PROJETO_PESQUISA_VETBALANCE.docx/.pdf` | OK |
| 10 | Cronograma com tramitação mín. 3 meses, em base **mensal** | `Cronograma_Geral.docx` | **Pendente** — atualmente tramitação CEP em ~6 semanas e granularidade semanal; precisa ser mensal e ≥3 meses (30+30+30) |
| 11 | Orçamento detalhado em arquivo separado + PB | `ORCAMENTO_VETBALANCE.docx` | OK; revisar detalhamento (item / tipo / valor R$) |

## Pendências a corrigir (bloqueantes)

**P1 — Carta de Encaminhamento (item 03)**
- Trocar destinatário para `Prof.ª Dr.ª Hilris Rocha e Silva — Coordenadora do CEP-UFPI/CMPP`.
- Atualizar Lattes da coordenadora e referência ao comitê (CEP-UFPI/CMPP).
- Manter assinatura do pesquisador responsável.

**P2 — TCLE (item 07)**
- Substituir, no item "11. Contatos", o coordenador para **Prof.ª Dr.ª Hilris Rocha e Silva (CEP-UFPI/CMPP)**.
- Confirmar endereço/telefone/e-mail/horário do CEP (já constam).
- Manter rubricas/assinaturas APENAS como linhas em branco (não pré-assinar).
- Versão na Plataforma Brasil: enviar SEM rubricas/assinaturas físicas.

**P3 — Cronograma (item 10)**
- Reescrever em granularidade **mensal** (não semanal).
- Garantir que o intervalo entre validação documental e início da coleta de dados seja **≥ 3 meses** (30 dias análise CEP + 30 dias pendências + 30 dias reavaliação).
- Ajustar datas finais (defesa) em cadeia.

**P4 — Termo de Confidencialidade (item 04)**
- Verificar/inserir cláusula explícita de guarda mínima de **5 anos** após o término da pesquisa, em arquivo físico ou digital, sob responsabilidade do pesquisador.

**P5 — Anexos do instrumento (item 06)**
- Conferir `ANEXO_H_INSTRUMENTO_AVALIACAO.docx` e `ANEXO_I_QUESTIONARIO_SUS.docx`: remover qualquer campo de identificação nominal (apenas ID/código anônimo).

**P6 — Checklist Plataforma Brasil**
- Atualizar `CHECKLIST_PLATAFORMA_BRASIL.docx` adicionando uma coluna "Atendimento à carta CEP" mapeando cada item 01–11 do e-mail ao arquivo correspondente, com status (OK / Revisado / Aguardando assinatura).

## Pendências de coleta de assinaturas (não bloqueiam edição, mas bloqueiam submissão)

- Assinaturas em: Declaração de Pesquisadores, Termo de Confidencialidade, Termo de Anuência Institucional, Folha de Rosto (assinatura + carimbo institucional), Carta de Encaminhamento.
- Atualização dos PDFs Lattes (gerar novamente se últimos uploads forem anteriores a 24/12/2025).

## Entregáveis após implementação

1. `CARTA_ENCAMINHAMENTO_CEP_v2.docx` — destinatária corrigida.
2. `TCLE_VETBALANCE_v3.docx` — coordenadora atualizada.
3. `Cronograma_Geral_v2.docx` — base mensal, tramitação ≥ 3 meses.
4. `ANEXO_E_TERMO_CONFIDENCIALIDADE_v2.docx` — cláusula 5 anos reforçada (se ausente).
5. `CHECKLIST_PLATAFORMA_BRASIL_v2.docx` — checklist cruzado com os 11 itens do CEP.
6. Nota técnica `CONFERENCIA_CEP_UFPI.md` em `/mnt/documents/` listando, por item 01–11, o arquivo correspondente e o status.

## Detalhes técnicos (formato/automação)

- Edição dos `.docx` via skill `docx` (unpack → editar XML → repack) preservando layout existente.
- QA: converter cada `.docx` resultante para PDF (LibreOffice) e inspecionar páginas para validar formatação e ausência de truncamentos.
- Não há alteração de código de aplicação nesta tarefa.

Confirma a execução desse plano? Se quiser, posso já tratar como bloqueante "P5" (anonimização dos instrumentos) e enviar uma versão revisada dos anexos H e I no mesmo lote.