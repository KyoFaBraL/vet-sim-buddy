import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  SUS_ITEMS,
  SUS_SCALE,
  SUS_DEADLINE_LABEL,
  isSusPrazoEncerrado,
  type SusAnswers,
} from '@/constants/susItems';
import { useSusResponse } from '@/hooks/useSusResponse';
import type { ParticipantCode } from '@/hooks/useParticipantCode';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  participantCode: ParticipantCode | null;
}

export const SusSurveyDialog = ({ open, onOpenChange, user, participantCode }: Props) => {
  const { response, submit } = useSusResponse(user);
  const [answers, setAnswers] = useState<SusAnswers>({});
  const [comentarios, setComentarios] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const prazoEncerrado = isSusPrazoEncerrado();

  useEffect(() => {
    if (response) {
      setAnswers(response.respostas ?? {});
      setComentarios(response.comentarios ?? '');
    }
  }, [response]);

  const faltantes = SUS_ITEMS.filter((item) => !answers[String(item.id)]).length;

  const handleSubmit = async () => {
    if (faltantes > 0) {
      toast({
        title: 'Responda todos os itens',
        description: `Ainda faltam ${faltantes} afirmação(ões).`,
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const ok = await submit({
      respostas: answers,
      comentarios,
      instituicao: participantCode?.instituicao ?? 'UFPI',
      codigo: participantCode?.codigo ?? null,
    });
    setSaving(false);
    if (ok) {
      toast({
        title: 'Questionário enviado',
        description: 'Obrigado! Suas respostas serão usadas de forma anônima e agregada.',
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível registrar suas respostas. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Anexo A — Questionário de Satisfação (SUS Adaptado)</DialogTitle>
          <DialogDescription>
            Avaliação de qualidade e usabilidade do VetBalance. Prazo para preenchimento:{' '}
            <strong>{SUS_DEADLINE_LABEL}</strong>. Não informe seu nome — a identificação é feita pelo
            código de participante.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {participantCode ? (
            <Badge variant="outline" className="font-mono">
              {participantCode.codigo}
            </Badge>
          ) : (
            <Badge variant="secondary">Sem código atribuído</Badge>
          )}
          {response && <Badge variant="secondary">Já respondido — você pode revisar</Badge>}
          {prazoEncerrado && <Badge variant="destructive">Prazo encerrado</Badge>}
        </div>

        <ScrollArea className="flex-1 pr-4 max-h-[55vh]">
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Escala: 1 = Discordo totalmente • 2 = Discordo • 3 = Neutro • 4 = Concordo • 5 = Concordo
              totalmente
            </p>
            {SUS_ITEMS.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">
                  {item.id}. {item.texto}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUS_SCALE.map((opt) => {
                    const selected = answers[String(item.id)] === opt.value;
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        aria-label={`Item ${item.id} — nota ${opt.value}`}
                        aria-pressed={selected}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [String(item.id)]: opt.value }))
                        }
                      >
                        {opt.value}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <label htmlFor="sus-comentarios" className="text-sm font-medium">
                Comentários e sugestões (opcional)
              </label>
              <Textarea
                id="sus-comentarios"
                value={comentarios}
                maxLength={2000}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="O que funcionou bem? O que poderia melhorar?"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground sm:mr-auto">
            {faltantes === 0 ? 'Todos os itens respondidos.' : `${faltantes} item(ns) pendente(s).`}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Fechar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enviando...' : response ? 'Atualizar respostas' : 'Enviar respostas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
