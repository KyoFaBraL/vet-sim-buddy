import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, History, LogIn, FileCheck2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface LogRow {
  id: string;
  user_id: string;
  nome_completo: string | null;
  email: string | null;
  tipo: string;
  instituicao: string | null;
  codigo: string | null;
  versao_tcle: string | null;
  criado_em: string;
}

type Filtro = 'todos' | 'login' | 'tcle_aceito';

const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

export const ParticipationLogManager = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_participation_log_for_professor');
      if (error) throw error;
      setRows((data ?? []) as LogRow[]);
    } catch (err) {
      console.error('Erro ao carregar log de participação:', err);
      toast({
        title: 'Erro ao carregar log',
        description: 'Não foi possível buscar os registros de participação.',
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
    const logins = rows.filter((r) => r.tipo === 'login');
    const aceites = rows.filter((r) => r.tipo === 'tcle_aceito');
    return {
      logins: logins.length,
      aceites: aceites.length,
      alunosUnicos: new Set(logins.map((r) => r.user_id)).size,
      uni: aceites.filter((r) => r.instituicao === 'UNINASSAU').length,
      ufpi: aceites.filter((r) => r.instituicao === 'UFPI').length,
    };
  }, [rows]);

  const filtradas = useMemo(
    () => (filtro === 'todos' ? rows : rows.filter((r) => r.tipo === filtro)),
    [rows, filtro],
  );

  const exportCsv = () => {
    const header = [
      'Evento',
      'Codigo',
      'Instituicao',
      'Nome',
      'Email',
      'Versao_TCLE',
      'Data',
      'Hora',
    ];
    const lines = filtradas.map((r) => {
      const d = new Date(r.criado_em);
      return [
        r.tipo === 'login' ? 'Login' : 'Aceite TCLE',
        r.codigo ?? '',
        r.instituicao ?? '',
        (r.nome_completo ?? '').replace(/[\r\n;]+/g, ' '),
        r.email ?? '',
        r.versao_tcle ?? '',
        d.toLocaleDateString('pt-BR'),
        d.toLocaleTimeString('pt-BR'),
      ];
    });
    const csv = ['sep=;', header.join(';'), ...lines.map((l) => l.join(';'))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vetbalance_log_participacao_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Log de participação
        </CardTitle>
        <CardDescription>
          Registro de acessos (login) e aceites do TCLE por aluno, com data, horário e instituição.
          Logins repetidos em menos de 30 minutos são agrupados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Logins: {stats.logins}</Badge>
          <Badge variant="secondary">Aceites TCLE: {stats.aceites}</Badge>
          <Badge variant="outline">Alunos com acesso: {stats.alunosUnicos}</Badge>
          <Badge variant="outline">UNINASSAU: {stats.uni}</Badge>
          <Badge variant="outline">UFPI: {stats.ufpi}</Badge>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant={filtro === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filtro === 'login' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('login')}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Logins
            </Button>
            <Button
              variant={filtro === 'tcle_aceito' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('tcle_aceito')}
            >
              <FileCheck2 className="h-4 w-4 mr-2" />
              TCLE
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" onClick={exportCsv} disabled={!filtradas.length}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {filtradas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? 'Carregando...' : 'Nenhum registro encontrado.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead>TCLE</TableHead>
                  <TableHead>Data e hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={r.tipo === 'login' ? 'outline' : 'default'}>
                        {r.tipo === 'login' ? 'Login' : 'Aceite TCLE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.codigo ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                      {r.nome_completo ?? '—'}
                      {r.email && (
                        <span className="block text-xs text-muted-foreground">{r.email}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{r.instituicao ?? '—'}</TableCell>
                    <TableCell className="text-sm">{r.versao_tcle ?? '—'}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatarDataHora(r.criado_em)}
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
