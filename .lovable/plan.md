# Plano: Planilha Modelo de Códigos GE/GC

## Objetivo
Criar uma planilha Excel pronta para sorteio e controle dos códigos de anonimização GE (Grupo Experimental) e GC (Grupo Controle) dos participantes da pesquisa VetBalance na Uninassau.

## Entregável
Arquivo `.xlsx` salvo em `/mnt/documents/` contendo:

1. **Aba "Lista Mestre"**
   - Colunas: Código do Participante, Grupo (GE/GC), Turma, Disciplina, Data de Aplicação, Nome (uso interno), E-mail (uso interno), Observações.
   - Validação de dados no campo Grupo (dropdown GE/GC).
   - Código gerado automaticamente no formato `GE-001`, `GC-001` etc.
   - Formatação profissional com cabeçalhos destacados e largura de colunas ajustada.

2. **Aba "Instruções"**
   - Explicação do significado de GE e GC.
   - Orientações de preenchimento e armazenamento seguro.
   - Exemplo de linha preenchida.

3. **Aba "Sorteio"** (opcional)
   - Espaço para registrar a randomização dos participantes.

## Implementação
- Usar `openpyxl` para criar o workbook, aplicar estilos, validação de dados e fórmulas.
- Recalcular fórmulas com o script padrão do skill xlsx se necessário.
- Salvar como `/mnt/documents/VetBalance_Codigos_GE_GC_Modelo.xlsx`.

## Validação
- Abrir o arquivo gerado e verificar se as abas, colunas, dropdown e exemplo estão corretos.
