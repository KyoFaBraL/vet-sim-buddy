import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { VetBalanceLogo } from '@/components/VetBalanceLogo';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <VetBalanceLogo className="h-16 w-16" />
          </div>
          <div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              Termo de Consentimento Livre e Esclarecido
            </CardTitle>
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
                  Desenvolvimento e Validação de Ferramenta de M-Learning"</strong>. Esta pesquisa está sob a
                  responsabilidade do pesquisador <strong>Caio Farias Cabral</strong> (Programa de Pós-Graduação
                  em Ciência Animal – UFPI), sob orientação do <strong>Prof. Dr. Napoleão Martins Argôlo Neto</strong>, e tem como objetivos avaliar a eficácia do software educacional
                  gamificado <strong>VetBalance</strong> como ferramenta complementar no ensino de equilíbrio
                  ácido-base em medicina veterinária de pequenos animais.
                </p>
                <p className="mt-2">
                  Esta pesquisa tem por finalidade contribuir para a melhoria do ensino de fisiologia e clínica
                  veterinária, oferecendo uma ferramenta inovadora de aprendizado baseada em simulação clínica
                  gamificada, com potencial benefício direto aos participantes através do desenvolvimento de
                  competências em tomada de decisão clínica.
                </p>
                <p className="mt-2">
                  Neste sentido, solicitamos sua colaboração. Este documento, chamado Termo de Consentimento Livre
                  e Esclarecido (TCLE), visa assegurar seus direitos como participante. Após seu consentimento,
                  o aceite digital será registrado com data/hora e identificação do navegador, tendo o mesmo valor
                  jurídico de uma assinatura manuscrita.
                </p>
                <p className="mt-2">
                  Por favor, leia com atenção e calma, aproveite para esclarecer todas as suas dúvidas. Se houver
                  perguntas antes ou mesmo depois de indicar sua concordância, você poderá esclarecê-las com o
                  pesquisador responsável pela pesquisa: <strong>Caio Farias Cabral</strong> – (86) 98142-5389 – caiofcabral@ufpi.edu.br.
                </p>
                <p className="mt-2">
                  Se mesmo assim as dúvidas persistirem, você pode entrar em contato com o{' '}
                  <strong>Comitê de Ética em Pesquisa da UFPI</strong>, que acompanha e analisa as pesquisas
                  científicas que envolvem seres humanos, no Campus Universitário Ministro Petrônio Portella,
                  Bairro Ininga, Teresina–PI, telefone (86) 2222-4824, e-mail:{' '}
                  <strong>cep.ufpi@ufpi.edu.br</strong>; no horário de atendimento ao público, segunda a sexta,
                  manhã: 08h00 às 12h00 e tarde: 14h00 às 18h00.
                </p>
                <p className="mt-2">
                  Esclarecemos que sua participação é <strong>voluntária</strong>. Caso decida não participar ou
                  retirar seu consentimento a qualquer momento da pesquisa, não haverá nenhum tipo de penalização
                  ou prejuízo, e o pesquisador estará à sua disposição para qualquer esclarecimento.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="font-bold text-base mb-2">Justificativa e Procedimentos</h3>
                <p>
                  A pesquisa justifica-se pela necessidade de ferramentas educacionais inovadoras que complementem
                  o ensino tradicional de equilíbrio ácido-base, tema de alta complexidade na formação veterinária.
                </p>
                <p className="mt-2">Para a coleta de dados serão utilizados os seguintes procedimentos:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Aplicação de 4 avaliações ao longo do semestre (pré-teste, intermediárias e pós-teste)</li>
                  <li>Uso do software VetBalance em dispositivo pessoal (Grupo Experimental)</li>
                  <li>Registro automático de dados de uso do software (tempo de sessão, tratamentos aplicados, desempenho)</li>
                  <li>Questionário de satisfação e usabilidade (SUS adaptado) ao final do estudo</li>
                </ul>
                <p className="mt-2">
                  Caso aceite participar, você será alocado(a) por sorteio em um de dois grupos:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Grupo Experimental (GE):</strong> Além das aulas regulares, terá acesso ao VetBalance
                    para prática complementar de simulações clínicas.
                  </li>
                  <li>
                    <strong>Grupo Controle (GC):</strong> Participará normalmente das aulas regulares. Após o
                    término da coleta de dados (julho/2026), receberá acesso completo ao VetBalance.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Riscos e Benefícios</h3>
                <p>
                  Esta pesquisa apresenta <strong>risco mínimo</strong>. Você poderá sentir desconforto emocional
                  ao perceber seu desempenho nas avaliações ou frustração ao utilizar o software. Porém, os mesmos
                  serão contornados da seguinte forma: feedback individual e confidencial será oferecido pelo
                  pesquisador, suporte técnico estará disponível para dificuldades com o software, e você poderá
                  interromper o uso a qualquer momento sem prejuízo.
                </p>
                <p className="mt-2">Benefícios diretos e indiretos:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Prática complementar de tomada de decisão clínica em ambiente seguro</li>
                  <li>Feedback personalizado sobre seu desempenho (GE)</li>
                  <li>Desenvolvimento de competências em equilíbrio ácido-base</li>
                  <li>Acesso gratuito a ferramenta educacional inovadora (todos, após o estudo)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Sigilo e Confidencialidade</h3>
                <p>
                  Os resultados obtidos nesta pesquisa serão utilizados para fins acadêmico-científicos (divulgação
                  em revistas e em eventos científicos) e os pesquisadores se comprometem a manter o sigilo e
                  identidade anônima, como estabelecem as Resoluções do Conselho Nacional de Saúde nº 466/2012
                  e 510/2016 e a Norma Operacional 01 de 2013 do Conselho Nacional de Saúde. Você terá livre
                  acesso a todas as informações e esclarecimentos adicionais sobre o estudo, bem como lhe é
                  garantido acesso a seus resultados.
                </p>
                <p className="mt-2">
                  O software utiliza sistema de segurança com controle de acesso por linha (RLS), e seus dados
                  serão anonimizados antes de qualquer publicação. Os dados serão armazenados por 5 anos conforme
                  normas institucionais e em conformidade com a LGPD (Lei 13.709/2018).
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Custos e Indenização</h3>
                <p>
                  Esclarecemos que você não terá nenhum custo com a pesquisa, e caso haja por qualquer motivo,
                  asseguramos que você será devidamente ressarcido. Não haverá nenhum tipo de pagamento por sua
                  participação, ela é voluntária. Caso ocorra algum dano comprovadamente decorrente de sua
                  participação neste estudo, você poderá ser indenizado conforme determina a Resolução 466/12
                  do Conselho Nacional de Saúde, bem como lhe será garantida a assistência integral.
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="font-bold text-base mb-2">Consentimento Digital</h3>
                <p>
                  Após os devidos esclarecimentos e estando ciente de acordo com o que me foi exposto, ao clicar
                  em <strong>"Aceito Participar"</strong> abaixo, declaro que aceito participar desta pesquisa,
                  dando pleno consentimento para uso das informações por mim prestadas.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Registro digital: Seu aceite será armazenado com data/hora, versão do TCLE e identificação do
                  navegador, garantindo rastreabilidade conforme exigido pela Resolução CNS 466/2012.
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
  );
};

export default ConsentimentoTCLE;
