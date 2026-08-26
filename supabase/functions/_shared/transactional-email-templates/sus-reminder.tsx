import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  nome?: string
  codigo?: string
  prazo?: string
  respondeu?: boolean
  url?: string
}

const Email = ({
  nome,
  codigo,
  prazo = '28/08/2026',
  respondeu = false,
  url = 'https://vetbalance.app.br',
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      {respondeu
        ? `Obrigado por responder o questionário de satisfação do VetBalance`
        : `Preencha o questionário de satisfação do VetBalance até ${prazo}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>VetBalance</Heading>
        <Text style={subtitle}>
          Turma UNINASSAU — Faculdade Uninassau Teresina
        </Text>
        <Hr style={hr} />
        <Heading as="h2" style={h2}>
          {respondeu
            ? 'Confirmação do questionário de satisfação (SUS)'
            : 'Lembrete: questionário de satisfação (SUS)'}
        </Heading>
        <Text style={text}>
          {nome ? `Olá, ${nome}!` : 'Olá!'}
        </Text>
        <Text style={text}>
          {respondeu
            ? 'Sua resposta ao questionário de satisfação (Anexo A — SUS) já foi registrada. Se quiser revisar ou ajustar suas respostas, o formulário continua disponível no simulador até o prazo abaixo.'
            : 'Este é um lembrete para o preenchimento do questionário de satisfação (Anexo A — SUS) do VetBalance. O formulário leva cerca de cinco minutos e as respostas são utilizadas de forma anônima e agregada como métrica de qualidade e usabilidade do software.'}
        </Text>
        <Section style={infoBox}>
          <Text style={infoLine}>
            <strong>Prazo final:</strong> {prazo}
          </Text>
          {codigo ? (
            <Text style={infoLine}>
              <strong>Seu código de participante:</strong> {codigo}
            </Text>
          ) : null}
        </Section>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={url} style={button}>
            {respondeu ? 'Revisar minhas respostas' : 'Responder o questionário'}
          </Button>
        </Section>
        <Text style={muted}>
          Acesse o simulador com o e-mail cadastrado e o aviso do questionário aparecerá na tela
          inicial. Em caso de dúvidas, procure o professor responsável pela atividade.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          VetBalance — Simulador Gamificado de Cuidados Críticos em Distúrbios Ácido-Básico para
          Cães e Gatos
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data?.respondeu
      ? 'VetBalance — questionário de satisfação registrado'
      : `VetBalance — lembrete do questionário de satisfação (até ${data?.prazo ?? '28/08/2026'})`,
  displayName: 'Lembrete do questionário SUS (UNINASSAU)',
  previewData: {
    nome: 'Maria Silva',
    codigo: 'UNI-GE-001',
    prazo: '28/08/2026',
    respondeu: false,
    url: 'https://vetbalance.app.br',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '24px', margin: '0', color: '#0f766e' }
const h2 = { fontSize: '18px', margin: '16px 0 8px', color: '#134e4a' }
const subtitle = { fontSize: '13px', color: '#4b5563', margin: '4px 0 0' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#1f2937' }
const muted = { fontSize: '13px', lineHeight: '20px', color: '#4b5563' }
const infoBox = {
  backgroundColor: '#f0fdfa',
  borderLeft: '4px solid #0f766e',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '20px 0',
}
const infoLine = { fontSize: '14px', margin: '4px 0', color: '#134e4a' }
const button = {
  backgroundColor: '#0f766e',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#6b7280', lineHeight: '18px' }
