# Registro dos 10 novos PDFs na base de conhecimento do projeto

Objetivo: ler os 10 arquivos enviados, extrair o que interessa e gravar tudo na memória do projeto. Nenhum documento Word/PDF será gerado agora, e a dissertação não será alterada nesta etapa.

## Nova proporção temática (passa a valer como padrão)

- 70% desenvolvimento e qualidade de software
- 20% medicina veterinária
- 10% educação e tecnologia / curva de aprendizagem

Essa proporção substitui a antiga 50/30/20 em toda a redação futura do referencial teórico e da revisão de literatura.

## O que será lido

Oito artigos internacionais (eixo de conteúdo):

1. Development of In-Browser Simulators for Medical Education — toolchain de software
2. Dhein (2015) — Online Small Animal Case Simulations / Virtual Veterinary Clinic
3. eMedOffice — serious game web colaborativo
4. Evaluation of a computer program for teaching laboratory diagnosis of acid-base disorders
5. Features and uses of high-fidelity medical simulations (revisão sistemática BEME)
6. Fletcher et al. (2012) — simulador canino de alta fidelidade
7. Game design elements of serious games in health education (revisão sistemática mista)
8. Gamification and Game-Based Learning for VET (revisão sistemática)

Duas dissertações brasileiras (conteúdo **e** modelo de formatação, conforme sua escolha):

9. Bruno de Melo Tavares
10. Francisco M. Cubo Neto

## O que será extraído de cada arquivo

- Referência completa em ABNT (autores, ano, título, veículo, volume, páginas, DOI)
- Tipo de estudo e amostra (n)
- Achado principal e números-chave utilizáveis como argumento
- Eixo temático (software / veterinária / educação) segundo a nova proporção
- Aplicação concreta no VetBalance (qual decisão de projeto ou de avaliação a fonte fundamenta)

Das duas dissertações, adicionalmente: estrutura de capítulos, elementos pré-textuais, padrão de legendas e de citação, e organização de anexos/apêndices — para reforçar os critérios de formatação já registrados.

## Onde os dados serão gravados

- Novo arquivo de memória com as 10 fontes, citações ABNT e aplicação de cada uma no VetBalance.
- Atualização da memória existente de fontes internacionais, para que as 20 referências (10 anteriores + 10 novas) fiquem consolidadas e sem duplicidade.
- Atualização da memória de padrões de dissertação, incorporando o que as duas dissertações acrescentam em estrutura e formatação.
- Atualização do índice de memória e da regra de proporção temática (70/20/10).

## Detalhes técnicos

- Extração com a ferramenta de parsing de documentos, arquivo por arquivo, lendo página de identificação, resumo, métodos e resultados de cada PDF; os PDFs longos (dissertações) serão lidos até o limite de 50 páginas e complementados por busca textual direcionada.
- Metadados de publicação (volume, páginas, DOI) serão conferidos no próprio PDF; nada será inferido.
- As memórias seguem o formato padrão do projeto (frontmatter com name/description/type) e ficam disponíveis automaticamente nas próximas conversas.

## Fora do escopo desta etapa

- Gerar documento Word/PDF de referencial teórico
- Reescrever o Capítulo 3 da dissertação
- Qualquer alteração no código do VetBalance

Depois de aprovado e registrado, basta pedir para eu gerar o documento consolidado ou reescrever a revisão de literatura com a nova proporção 70/20/10.
