# VetBalance

Simulador gamificado de cuidados críticos veterinários para estudo de distúrbios do equilíbrio ácido-base em cães e gatos.

## Sobre o Projeto

O VetBalance é uma plataforma educacional interativa voltada ao treinamento de estudantes e profissionais de medicina veterinária na identificação e tratamento de distúrbios do equilíbrio ácido-base em pequenos animais. Utiliza gamificação e simulações clínicas em tempo real para promover aprendizagem ativa.

## Funcionalidades

- **Simulação clínica interativa** com parâmetros fisiológicos monitorados em tempo real (FC, FR, temperatura, pH, pCO₂, HCO₃⁻, etc.)
- **Sistema gamificado** com pontos de vida (HP), badges e ranking semanal
- **Casos clínicos customizáveis** criados por professores
- **Diagnóstico diferencial** com suporte de IA
- **Feedback personalizado** ao final de cada sessão
- **Histórico de sessões** e relatórios de desempenho
- **Dois perfis de usuário**: Professor e Aluno
- **Compartilhamento de casos** via códigos de acesso
- **Responsivo** para uso em dispositivos móveis (m-learning)

## Tecnologias

- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (autenticação, banco de dados, funções serverless)
- Recharts (gráficos)
- Framer Motion (animações)
- Capacitor (compilação Android)

## Acesso

- **Produção**: [vetbalance.app.br](https://vetbalance.app.br)

## Instalação Local

```sh
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
src/
├── components/     # Componentes React
├── hooks/          # Custom hooks
├── pages/          # Páginas da aplicação
├── assets/         # Imagens e recursos
├── constants/      # Constantes e configurações
├── integrations/   # Integrações com serviços externos
├── lib/            # Utilitários
└── utils/          # Funções auxiliares
```

## Contexto Acadêmico

Este software é parte de um projeto de mestrado em Ciência Animal, focado na validação de ferramentas digitais gamificadas para o ensino de medicina veterinária intensivista.

**Palavras-chave:** Gamificação, Ensino veterinário, M-learning, Equilíbrio ácido-base, Simulação clínica.

## Licença

Todos os direitos reservados.
