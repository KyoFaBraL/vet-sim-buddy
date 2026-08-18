import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { ClipboardList, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SusSurveyDialog } from '@/components/SusSurveyDialog';
import { useSusResponse } from '@/hooks/useSusResponse';
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

  if (loading) return null;

  const respondido = !!response;

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
          <Button onClick={() => setOpen(true)} variant={respondido ? 'outline' : 'default'}>
            {respondido ? 'Revisar respostas' : 'Responder agora'}
          </Button>
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
