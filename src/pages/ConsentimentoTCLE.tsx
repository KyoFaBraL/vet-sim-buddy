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
              <section>
                <h3 className="font-bold text-base mb-2">Título da Pesquisa</h3>
                <p>
                  Simulador Veterinário Gamificado para Ensino de Equilíbrio Ácido-Base em Pequenos Animais:
                  Desenvolvimento e Validação de Ferramenta de M-Learning
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">Pesquisador Responsável</h3>
                <p><em>(Nome completo do pesquisador)</em></p>
                <p><strong>Orientador(a):</strong> <em>(Nome completo do orientador)</em></p>
                <p><strong>Instituição:</strong> <em>(Nome da instituição)</em></p>
                <p><strong>Contato:</strong> <em>(E-mail e telefone do pesquisador)</em></p>
              </section>

              <Separator />

              <section>
                <p>Prezado(a) participante,</p>
                <p className="mt-2">
                  Você está sendo convidado(a) a participar de uma pesquisa científica vinculada ao Programa
                  de Pós-Graduação em Ciência Animal. Antes de decidir, leia atentamente as informações abaixo.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">1. Objetivo da Pesquisa</h3>
                <p>
                  Esta pesquisa tem como objetivo avaliar a eficácia de um software educacional gamificado
                  chamado <strong>VetBalance</strong> como ferramenta complementar no ensino de equilíbrio ácido-base
                  em medicina veterinária de pequenos animais.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">2. Procedimentos</h3>
                <p>Caso aceite participar, você será alocado(a) por sorteio em um de dois grupos:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Grupo Experimental (GE):</strong> Além das aulas regulares, você terá acesso ao
                    software VetBalance para prática complementar de simulações clínicas em seu dispositivo pessoal.
                  </li>
                  <li>
                    <strong>Grupo Controle (GC):</strong> Você participará normalmente das aulas regulares.
                    Após o término da coleta de dados (junho/2026), você receberá acesso completo ao VetBalance.
                  </li>
                </ul>
                <p className="mt-2">
                  Independentemente do grupo, você realizará 4 avaliações ao longo do semestre. Se for alocado(a)
                  no GE, também responderá a um questionário de satisfação sobre o software.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">3. Duração</h3>
                <p>
                  A pesquisa terá duração de aproximadamente 20 semanas (março a julho de 2026). O uso do software
                  pelo GE será voluntário e complementar às atividades regulares.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">4. Riscos</h3>
                <p>
                  Esta pesquisa apresenta <strong>risco mínimo</strong>. Você poderá sentir desconforto emocional ao
                  perceber seu desempenho nas avaliações ou frustração ao utilizar o software. Caso isso ocorra,
                  feedback individual e confidencial será oferecido, e suporte técnico estará disponível.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">5. Benefícios</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Prática complementar de tomada de decisão clínica em ambiente seguro</li>
                  <li>Feedback personalizado sobre seu desempenho (GE)</li>
                  <li>Desenvolvimento de competências em equilíbrio ácido-base</li>
                  <li>Acesso gratuito a ferramenta educacional inovadora (todos, após o estudo)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">6. Confidencialidade e Proteção de Dados</h3>
                <p>
                  Seus dados pessoais serão mantidos em sigilo absoluto. O software utiliza sistema de segurança
                  com controle de acesso por linha (RLS), e seus dados serão anonimizados antes de qualquer publicação.
                  Apenas o pesquisador responsável e o orientador terão acesso aos dados identificados. Os dados serão
                  armazenados por 5 anos conforme normas institucionais e em conformidade com a LGPD (Lei 13.709/2018).
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">7. Voluntariedade e Direito de Desistência</h3>
                <p>
                  Sua participação é <strong>totalmente voluntária</strong>. Você pode recusar-se a participar ou
                  retirar seu consentimento a qualquer momento, sem necessidade de justificativa e{' '}
                  <strong>sem qualquer prejuízo à sua avaliação acadêmica</strong>. As avaliações realizadas fazem
                  parte das atividades regulares das disciplinas e não serão afetadas pela sua participação ou não
                  na pesquisa.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">8. Contatos</h3>
                <p>Em caso de dúvidas sobre a pesquisa, entre em contato com:</p>
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li><strong>Pesquisador Responsável:</strong> <em>(Nome – E-mail – Telefone)</em></li>
                  <li><strong>Orientador(a):</strong> <em>(Nome – E-mail)</em></li>
                  <li><strong>Comitê de Ética em Pesquisa (CEP):</strong> <em>(Nome do CEP, endereço, telefone e e-mail)</em></li>
                </ul>
              </section>

              <Separator />

              <section>
                <h3 className="font-bold text-base mb-2">9. Consentimento Digital</h3>
                <p>
                  Ao clicar em <strong>"Aceito Participar"</strong> abaixo, declaro que li e compreendi as informações
                  acima, tive a oportunidade de esclarecer minhas dúvidas e concordo em participar desta pesquisa de
                  forma voluntária. Este aceite digital tem o mesmo valor jurídico de uma assinatura manuscrita,
                  conforme previsto na legislação brasileira.
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
