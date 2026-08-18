import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { ClipboardList, CalendarClock, CheckCircle2, Bell, BellOff, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SusSurveyDialog } from '@/components/SusSurveyDialog';
import { useSusResponse } from '@/hooks/useSusResponse';
import { useSusBrowserReminder } from '@/hooks/useSusBrowserReminder';
import { useToast } from '@/hooks/use-toast';
import {
  SUS_DEADLINE_LABEL,
  diasRestantesSus,
  isSusPrazoEncerrado,
} from '@/constants/susItems';
import type { ParticipantCode } from '@/hooks/useParticipantCode';

interface Props {
  user: User;
  participantCode: ParticipantCode | null;
}

export const SusReminderBanner = ({ user, participantCode }: Props) => {
  const { response, loading } = useSusResponse(user);
  const [open, setOpen] = useState(false);
  const dias = diasRestantesSus();
  const encerrado = isSusPrazoEncerrado();
  const respondido = !!response;
  const { toast } = useToast();
  const { permission, requestPermission, sendTestNotification } = useSusBrowserReminder({
    pendente: !respondido,
    ready: !loading,
    onOpenSurvey: () => setOpen(true),
  });

  const handleAtivar = async () => {
    const ok = await requestPermission();
    toast({
      title: ok ? 'Lembretes ativados' : 'Lembretes não ativados',
      description: ok
        ? 'Você receberá uma notificação do navegador até responder o questionário.'
        : 'Permita notificações nas configurações do navegador para receber os lembretes.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const handleTestar = async () => {
    const ok = await sendTestNotification();
    toast({
      title: ok ? 'Notificação de teste enviada' : 'Não foi possível notificar',
      description: ok
        ? 'Verifique a notificação exibida pelo navegador.'
        : 'As notificações estão bloqueadas neste navegador.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  if (loading) return null;

  return (
    <>
      <Card className={respondido ? 'border-primary/30' : 'border-primary bg-primary/5'}>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {respondido ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary" />
            ) : (
              <ClipboardList className="h-5 w-5 mt-0.5 text-primary" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {respondido
                  ? 'Questionário de satisfação (SUS) respondido'
                  : 'Preencha o questionário de satisfação (Anexo A — SUS)'}
              </p>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Suas respostas são usadas como métricas de qualidade e usabilidade do VetBalance na
                pesquisa de mestrado (defesa em 31/08/2026), de forma anônima e agregada.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={encerrado ? 'destructive' : 'secondary'} className="gap-1">
                  <CalendarClock className="h-3 w-3" />
                  Prazo: {SUS_DEADLINE_LABEL}
                </Badge>
                {!encerrado && !respondido && (
                  <Badge variant="outline">
                    {dias <= 0 ? 'Último dia' : `Faltam ${dias} dia(s)`}
                  </Badge>
                )}
                {participantCode && (
                  <Badge variant="outline" className="font-mono">
                    {participantCode.codigo}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!respondido && !encerrado && permission !== 'unsupported' && (
              <>
                {permission !== 'granted' ? (
                  <Button variant="outline" size="sm" onClick={handleAtivar} disabled={permission === 'denied'}>
                    {permission === 'denied' ? (
                      <BellOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Bell className="h-4 w-4 mr-1" />
                    )}
                    {permission === 'denied' ? 'Notificações bloqueadas' : 'Ativar lembretes'}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleTestar}>
                    <BellRing className="h-4 w-4 mr-1" />
                    Testar lembrete
                  </Button>
                )}
              </>
            )}
            <Button onClick={() => setOpen(true)} variant={respondido ? 'outline' : 'default'}>
              {respondido ? 'Revisar respostas' : 'Responder agora'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SusSurveyDialog
        open={open}
        onOpenChange={setOpen}
        user={user}
        participantCode={participantCode}
      />
    </>
  );
};
