import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Clock, Mail, RefreshCw, ScrollText, Trash2 } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { SUS_DEADLINE_LABEL } from '@/constants/susItems';

interface TargetRow {
  user_id: string;
  nome_completo: string | null;
  email: string | null;
  codigo: string | null;
  grupo: string | null;
  respondeu: boolean;
  aberturas: number | null;
  ultima_abertura: string | null;
  respondido_em: string | null;
}

type LogStatus = 'enviado' | 'ignorado' | 'falha';

interface AttemptLog {
  id: string;
  hora: string;
  alvo: string;
  status: LogStatus;
  motivo: string;
}

const MOTIVOS: Record<string, string> = {
  ok: 'Enviado com sucesso',
  ja_respondeu: 'Já respondeu o questionário',
  email_invalido: 'E-mail ausente ou inválido',
  recipient_suppressed: 'Endereço bloqueado (descadastro/retorno de erro)',
  domain_not_verified: 'Domínio de e-mail ainda em verificação',
  emails_disabled: 'Envio de e-mails desativado no projeto',
  rate_limited: 'Limite de envios por hora atingido',
  unknown: 'Erro não identificado',
  erro_desconhecido: 'Erro não identificado',
};

const traduzMotivo = (motivo?: string | null) =>
  (motivo && MOTIVOS[motivo]) || motivo || 'Sem detalhes';

export const SusReminderManager = () => {
  const [rows, setRows] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<AttemptLog[]>([]);
  const { toast } = useToast();

  const addLogs = useCallback((entries: Array<Omit<AttemptLog, 'id' | 'hora'>>) => {
    const hora = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) =>
      [
        ...entries.map((e, i) => ({
          ...e,
          hora,
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        })),
        ...prev,
      ].slice(0, 200)
    );
  }, []);

  const extractReason = async (err: unknown): Promise<string> => {
    if (err instanceof FunctionsHttpError) {
      try {
        const body = await err.context.json();
        return body?.reason ?? body?.error ?? 'unknown';
      } catch {
        return 'unknown';
      }
    }
    return (err as { message?: string })?.message ?? 'unknown';
  };


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_sus_reminder_targets');
      if (error) throw error;
      setRows((data ?? []) as unknown as TargetRow[]);
    } catch (err) {
      console.error('Erro ao carregar alunos UNINASSAU:', err);
      toast({
        title: 'Erro ao carregar turma',
        description: 'Não foi possível buscar os alunos da turma UNINASSAU.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const responderam = rows.filter((r) => r.respondeu).length;
    const abriram = rows.filter((r) => (r.aberturas ?? 0) > 0).length;
    const abriuSemResponder = rows.filter((r) => (r.aberturas ?? 0) > 0 && !r.respondeu).length;
    return {
      total,
      responderam,
      pendentes: total - responderam,
      abriram,
      abriuSemResponder,
      taxaResposta: total ? Math.round((responderam / total) * 100) : 0,
      taxaAbertura: total ? Math.round((abriram / total) * 100) : 0,
      conversao: abriram ? Math.round((responderam / abriram) * 100) : 0,
    };
  }, [rows]);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const [sendingAll, setSendingAll] = useState(false);

  const enviarTodos = async () => {
    setSendingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sus-reminder', {
        body: { all_pending: true },
      });
      if (error) throw error;
      const result = data as { sent?: number; skipped?: number; failed?: number } | null;
      toast({
        title: 'Lembretes enviados',
        description: `${result?.sent ?? 0} e-mail(s) enviados, ${result?.skipped ?? 0} ignorados, ${
          result?.failed ?? 0
        } com falha.`,
      });
      await load();
    } catch (err) {
      console.error('Erro ao enviar lembretes em lote:', err);
      toast({
        title: 'Erro ao enviar lembretes',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setSendingAll(false);
    }
  };

  const enviar = async (row: TargetRow) => {

    setSendingId(row.user_id);
    try {
      const { data, error } = await supabase.functions.invoke('send-sus-reminder', {
        body: { student_id: row.user_id },
      });
      if (error) throw error;
      const result = data as { sent?: boolean; reason?: string; error?: string } | null;

      if (result?.sent) {
        setEnviados((prev) => ({ ...prev, [row.user_id]: new Date().toLocaleTimeString('pt-BR') }));
        toast({
          title: 'Lembrete enviado',
          description: `E-mail enviado para ${row.nome_completo ?? row.email ?? 'o aluno'}.`,
        });
      } else if (result?.reason === 'recipient_suppressed') {
        toast({
          title: 'E-mail não entregue',
          description: 'Este aluno optou por não receber e-mails ou o endereço está inválido.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Envio indisponível',
          description:
            'O domínio de e-mail ainda está em verificação. Use o aviso dentro do aplicativo até a liberação.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Erro ao enviar lembrete:', err);
      toast({
        title: 'Erro ao enviar lembrete',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Lembretes do questionário SUS — turma UNINASSAU
        </CardTitle>
        <CardDescription>
          Envie o lembrete individual por e-mail para cada aluno da turma UNINASSAU (prazo:{' '}
          {SUS_DEADLINE_LABEL}). Todos os alunos da turma aparecem na lista, tenham respondido ou
          não. Dentro do aplicativo, o aviso do questionário é exibido automaticamente a cada dia
          para quem ainda está pendente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Taxa de resposta</p>
            <p className="text-2xl font-semibold text-primary">{stats.taxaResposta}%</p>
            <p className="text-xs text-muted-foreground">
              {stats.responderam} de {stats.total} aluno(s)
            </p>
            <Progress value={stats.taxaResposta} className="mt-2 h-2" />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Abriram o questionário</p>
            <p className="text-2xl font-semibold">{stats.taxaAbertura}%</p>
            <p className="text-xs text-muted-foreground">{stats.abriram} aluno(s) abriram ao menos uma vez</p>
            <Progress value={stats.taxaAbertura} className="mt-2 h-2" />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Concluíram após abrir</p>
            <p className="text-2xl font-semibold">{stats.conversao}%</p>
            <p className="text-xs text-muted-foreground">
              {stats.abriuSemResponder} abriram e não concluíram
            </p>
            <Progress value={stats.conversao} className="mt-2 h-2" />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-semibold text-destructive">{stats.pendentes}</p>
            <p className="text-xs text-muted-foreground">Prazo: {SUS_DEADLINE_LABEL}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Turma: {stats.total}</Badge>
          <Badge variant="secondary">Responderam: {stats.responderam}</Badge>
          <Badge variant={stats.pendentes ? 'destructive' : 'secondary'}>
            Pendentes: {stats.pendentes}
          </Badge>
          <Button
            size="sm"
            className="ml-auto"
            onClick={enviarTodos}

            disabled={sendingAll || loading || stats.pendentes === 0}
          >
            <Mail className="h-4 w-4 mr-2" />
            {sendingAll ? 'Enviando...' : `Avisar pendentes (${stats.pendentes})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? 'Carregando turma...' : 'Nenhum aluno da UNINASSAU cadastrado ainda.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>SUS</TableHead>
                  <TableHead>Engajamento</TableHead>
                  <TableHead className="text-right">Lembrete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-mono text-xs">{r.codigo ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                      {r.nome_completo ?? '—'}
                      {r.email && (
                        <span className="block text-xs text-muted-foreground">{r.email}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.respondeu ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Respondido
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="block">
                        {(r.aberturas ?? 0) > 0
                          ? `${r.aberturas} abertura(s) — última em ${fmt(r.ultima_abertura)}`
                          : 'Nunca abriu o questionário'}
                      </span>
                      {r.respondeu && (
                        <span className="block">Concluído em {fmt(r.respondido_em)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {enviados[r.user_id] && (
                          <span className="text-xs text-muted-foreground">
                            enviado {enviados[r.user_id]}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant={r.respondeu ? 'outline' : 'default'}
                          onClick={() => enviar(r)}
                          disabled={sendingId === r.user_id || !r.email}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {sendingId === r.user_id ? 'Enviando...' : 'Enviar e-mail'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
