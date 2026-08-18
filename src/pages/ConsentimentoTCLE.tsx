import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { VetBalanceLogo } from '@/components/VetBalanceLogo';
import { Seo } from '@/components/Seo';
import { useAuth } from '@/hooks/useAuth';
import { useTcleConsent } from '@/hooks/useTcleConsent';
import { useToast } from '@/hooks/use-toast';
import { FileText, Shield, AlertTriangle, LogOut } from 'lucide-react';

const ConsentimentoTCLE = () => {
  const { user, signOut } = useAuth();
  const { acceptConsent, declineConsent, TCLE_VERSION } = useTcleConsent(user);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;
    setSubmitting(true);
    const success = await acceptConsent();
    if (success) {
      toast({
        title: 'Consentimento registrado',
        description: 'Obrigado por aceitar o Termo de Consentimento. Você será redirecionado ao simulador.',
      });
      navigate('/app', { replace: true });
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu consentimento. Tente novamente.',
        variant: 'destructive',
      });
    }
    setSubmitting(false);
  };

  const handleDecline = async () => {
    setSubmitting(true);
    await declineConsent();
    toast({
      title: 'Consentimento recusado',
      description: 'Você recusou o TCLE. Será desconectado do sistema.',
    });
    await signOut();
    setSubmitting(false);
  };

  return (
    <>
      <Seo
        title="Termo de Consentimento (TCLE) — VetBalance"
        description="Termo de Consentimento Livre e Esclarecido da pesquisa VetBalance, conforme a Resolução CNS 466/2012."
        path="/consentimento"
        noindex
      />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <VetBalanceLogo className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              Termo de Consentimento Livre e Esclarecido
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline">TCLE v{TCLE_VERSION}</Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Resolução CNS 466/2012
              </Badge>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <ScrollArea className="h-[400px] rounded-md border p-6 bg-muted/20">
            <div className="space-y-6 text-sm leading-relaxed">
              <div className="text-center space-y-1 mb-4">
                <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground">Ministério da Educação</p>
                <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground">Universidade Federal do Piauí</p>
                <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground">Comitê de Ética em Pesquisa Humana</p>
              </div>

              <Separator />

              <section>
                <p>Prezado(a) Senhor(a),</p>
                <p className="mt-2">
                  Você está sendo convidado(a) a participar como voluntário(a) de uma pesquisa denominada{' '}
                  <strong>"Simulador Veterinário Gamificado para Ensino de Equilíbrio Ácido-Base em Pequenos Animais:
                  Desenvolvimento e Validação de Ferramenta Educacional de M-Learning"</strong>. Esta pesquisa está
                  sob a responsabilidade do pesquisador responsável <strong>Prof. Dr. Napoleão Martins Argôlo Neto</strong>,
                  docente da Universidade Federal do Piauí, e do pesquisador executor <strong>Caio Farias Cabral</strong>,
                  mestrando do Programa de Pós-Graduação da UFPI. Tem como objetivo geral avaliar a eficácia de um
                  simulador veterinário gamificado (<strong>VetBalance</strong>) como ferramenta complementar de
                  m-learning no ensino de distúrbios do equilíbrio ácido-base em cães e gatos.
                </p>
                <p className="mt-2">
                  Neste sentido, solicitamos sua colaboração mediante o aceite deste termo. Este documento, chamado
                  Termo de Consentimento Livre e Esclarecido (TCLE), visa assegurar seus direitos como participante.
                  Nesta versão digital, o aceite eletrônico substitui a assinatura manuscrita e a rubrica das páginas:
                  será registrado com data, hora, versão do termo e identificação do navegador, ficando uma via
                  disponível para consulta e download pelo participante e outra sob a guarda dos pesquisadores.
                  Por favor, leia com atenção e calma, aproveite para esclarecer todas as suas dúvidas.
                </p>
                <p className="mt-2">
                  Se houver perguntas antes ou mesmo depois de indicar sua concordância, você poderá esclarecê-las
                  com o pesquisador responsável, <strong>Prof. Dr. Napoleão Martins Argôlo Neto</strong>, pelo
                  telefone (86) 2222-3620, pelo e-mail <strong>argolo_napoleao@ufpi.edu.br</strong>, ou pelo endereço
                  profissional/institucional: Universidade Federal do Piauí — Centro de Ciências Agrárias, Campus
                  Universitário Ministro Petrônio Portella, Bairro Ininga, CEP 64049-550, Teresina — PI. O pesquisador
                  executor, <strong>Caio Farias Cabral</strong>, pode ser contatado pelo telefone (86) 98142-5389 e
                  pelo e-mail <strong>caiofcabral@ufpi.edu.br</strong>, no mesmo endereço institucional.
                </p>
                <p className="mt-2">
                  Se, mesmo assim, as dúvidas ainda persistirem, você pode entrar em contato com o{' '}
                  <strong>Comitê de Ética em Pesquisa da UFPI (CEP-UFPI/CMPP)</strong> — Campus Universitário
                  Ministro Petrônio Portella, Bairro Ininga, Teresina — PI, CEP 64049-550. Telefone: (86) 2222-4824.
                  E-mail: <strong>cep.ufpi@ufpi.edu.br</strong>. Horário de atendimento ao público: segunda a
                  sexta-feira, manhã: 08h00 às 12h00 e tarde: 14h00 às 18h00. O CEP acompanha e analisa as pesquisas
                  científicas que envolvem seres humanos.
                </p>
                <p className="mt-2">
                  Se preferir, pode salvar ou imprimir este Termo e consultar seus familiares ou outras pessoas antes
                  de decidir participar. Esclarecemos, mais uma vez, que sua participação é <strong>voluntária</strong>.
                  Caso decida não participar ou retirar seu consentimento a qualquer momento da pesquisa, não haverá
                  nenhum tipo de penalização ou prejuízo, e os pesquisadores estarão à sua disposição para qualquer
                  esclarecimento. A não participação ou a desistência não acarretará qualquer prejuízo acadêmico,
                  avaliativo ou de frequência.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="font-bold text-base mb-2">Justificativa</h3>
                <p>
                  A pesquisa justifica-se pela necessidade de ferramentas educacionais que complementem o ensino
                  tradicional de equilíbrio ácido-base, tema de elevada complexidade na formação veterinária,
                  permitindo prática clínica simulada em ambiente seguro, sem envolvimento de animais vivos.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Período de execução</h3>
                <p>
                  A coleta de dados terá início somente <strong>após a aprovação do CEP-UFPI/CMPP</strong>, com
                  previsão de execução entre <strong>agosto e outubro de 2026</strong>, distribuída em
                  aproximadamente 20 semanas a partir da aprovação (pré-teste na semana inicial, uso do software por
                  cerca de 4 semanas, pós-teste e questionário de satisfação ao final). A redação da dissertação está
                  prevista para <strong>24/08/2026</strong> e a defesa para <strong>31/08/2026</strong>, conforme
                  cronograma institucional aprovado.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Procedimentos de coleta de dados</h3>
                <p>Caso aceite participar, você será submetido(a) aos seguintes procedimentos:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    Preenchimento de um instrumento de avaliação de conhecimentos (pré-teste), composto por 20
                    questões objetivas e 3 questões discursivas, com duração aproximada de 60 minutos, aplicado em
                    sala de aula e <strong>de responsabilidade do docente da disciplina</strong>;
                  </li>
                  <li>
                    Participação em atividade de ensino, na condição de <strong>grupo experimental</strong> (uso do
                    software VetBalance em dispositivo próprio ou do laboratório de informática, por aproximadamente
                    4 semanas, em horários livres) ou de <strong>grupo controle</strong> (ensino tradicional, com
                    acesso integral ao software após o término da coleta);
                  </li>
                  <li>Preenchimento do mesmo instrumento de avaliação ao final do período (pós-teste);</li>
                  <li>
                    Preenchimento do <strong>questionário de satisfação e usabilidade (SUS adaptado)</strong>, apenas
                    para o grupo experimental, com duração aproximada de 10 minutos, aplicado pelos pesquisadores.
                  </li>
                </ul>
                <p className="mt-2">
                  Durante o uso do software, serão registrados automaticamente dados de desempenho (sessões
                  realizadas, decisões clínicas, tratamentos aplicados e pontuação). Todos os instrumentos de coleta
                  são <strong>anonimizados</strong>: você será identificado(a) exclusivamente por um código
                  alfanumérico (padrão GE/GC), sem qualquer registro do seu nome nos instrumentos.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Riscos</h3>
                <p>
                  Esta pesquisa acarreta os seguintes riscos: desconforto, cansaço ou ansiedade durante o
                  preenchimento dos instrumentos avaliativos; constrangimento ao responder questões de conhecimento
                  ou de opinião; possibilidade de quebra de sigilo dos dados; cansaço visual ou fadiga decorrentes do
                  uso de dispositivos digitais; e eventual sensação de competitividade associada ao sistema de
                  pontuação e ranking do software.
                </p>
                <p className="mt-2">
                  Esses riscos serão contornados pelas seguintes medidas: aplicação dos instrumentos em ambiente
                  reservado, silencioso e em horário previamente combinado, com possibilidade de interrupção e
                  retomada a qualquer momento; garantia de que nenhuma resposta influenciará notas, frequência ou
                  avaliação acadêmica; anonimização dos instrumentos por código, guarda dos documentos físicos em
                  armário sob chave e dos arquivos digitais em repositório criptografado de acesso restrito aos
                  pesquisadores; orientação de pausas periódicas durante o uso do software e ausência de tempo mínimo
                  obrigatório de uso; possibilidade de ocultação do ranking a pedido do participante; e
                  disponibilidade permanente dos pesquisadores para acolhimento e esclarecimentos. Em caso de
                  qualquer desconforto, o participante poderá interromper imediatamente sua participação, sem
                  prejuízo.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Benefícios</h3>
                <p>
                  Benefícios diretos: oportunidade de prática clínica simulada e de aprofundamento no diagnóstico e
                  tratamento de distúrbios do equilíbrio ácido-base, com feedback formativo imediato, contribuindo
                  para o desenvolvimento de competências em tomada de decisão clínica. Como benefícios indiretos, a
                  pesquisa contribuirá para a produção de conhecimento sobre metodologias ativas e tecnologias
                  educacionais no ensino veterinário, com potencial disponibilização gratuita da ferramenta a outras
                  instituições de ensino.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Sigilo, custos e assistência</h3>
                <p>
                  Os resultados obtidos nesta pesquisa serão utilizados para fins acadêmico-científicos (divulgação
                  em dissertação, revistas e eventos científicos) e os pesquisadores se comprometem a manter o sigilo
                  e a identidade anônima, como estabelecem as Resoluções do Conselho Nacional de Saúde nº 466/2012 e
                  nº 510/2016 e a Norma Operacional nº 01/2013 do Conselho Nacional de Saúde. Você terá livre acesso
                  a todas as informações e esclarecimentos adicionais sobre o estudo, bem como lhe é garantido acesso
                  a seus resultados.
                </p>
                <p className="mt-2">
                  Esclarecemos ainda que você não terá nenhum custo com a pesquisa, mas, caso haja, por qualquer
                  motivo, asseguramos que você será devidamente ressarcido. Não haverá nenhum tipo de pagamento por
                  sua participação, ela é voluntária. Durante e após o encerramento da pesquisa, será garantido o
                  acompanhamento e a assistência ao participante, conforme previsto na Resolução CNS nº 466/2012
                  (item IV.3.c). Em caso de danos decorrentes da pesquisa, será assegurada a assistência integral e a
                  indenização conforme previsto em norma.
                </p>
                <p className="mt-2">
                  O software utiliza controle de acesso por linha (RLS) e os dados serão anonimizados antes de
                  qualquer publicação, sendo armazenados por 5 (cinco) anos em conformidade com a LGPD
                  (Lei 13.709/2018), sob a responsabilidade do Prof. Dr. Napoleão Martins Argôlo Neto, e
                  posteriormente eliminados.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="font-bold text-base mb-2">Consentimento</h3>
                <p>
                  Após os devidos esclarecimentos e estando ciente e de acordo com o que me foi exposto, ao clicar em{' '}
                  <strong>"Aceito Participar"</strong> declaro que aceito participar desta pesquisa, dando pleno
                  consentimento para uso das informações por mim prestadas.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Registro digital: seu aceite será armazenado com data/hora, versão do TCLE (v2.0) e identificação do
                  navegador, garantindo rastreabilidade e equivalência à assinatura em duas vias, conforme as
                  Resoluções CNS nº 466/2012 e nº 510/2016.
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="flex items-start gap-3 mt-6 p-4 rounded-lg border bg-muted/30">
            <Checkbox
              id="consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              Declaro que li e compreendi o Termo de Consentimento Livre e Esclarecido acima e concordo em
              participar voluntariamente desta pesquisa.
            </label>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Recusar e Sair
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!agreed || submitting}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            {submitting ? 'Registrando...' : 'Aceito Participar'}
          </Button>
        </CardFooter>

        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Logado como: {user?.email}
          </p>
        </div>
      </Card>
    </div>
    </>
  );
};

export default ConsentimentoTCLE;
