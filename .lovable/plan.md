# Plan: Atualizar título do simulador

## Objetivo
Substituir o nome exibido no cabeçalho da tela do simulador para o texto enxuto solicitado:
**"VetBalance - Simulador Gamificado de Cuidados Críticos em Distúrbios Ácido Básico para cães e gatos"**

## Escopo
- Alterar o `<h1>` do cabeçalho do professor em `src/pages/Index.tsx` (linha ~200).
- Alterar o `<h1>` do cabeçalho do aluno em `src/pages/Index.tsx` (linha ~362).
- Ajustar o subtítulo abaixo de cada `<h1>` para não repetir informação já contida no título (ex.: manter apenas "Portal do Professor" / "Modo Aluno").
- Manter o restante da página inalterado.

## Fora de escopo (a menos que o usuário peça)
- `RoleSelection.tsx`, `index.html`, README e demais documentos não serão alterados nesta rodada, pois o pedido foca na tela do simulador.

## Validação
- Revisar visualmente o preview após a mudança para confirmar que o cabeçalho não quebra em largura padrão (1280 px).
