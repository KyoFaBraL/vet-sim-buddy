import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, ClipboardList } from 'lucide-react';
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
import {
  SUS_ITEMS,
  SUS_DEADLINE_LABEL,
  calcularEscoreSus,
  calcularMediaAjustada,
  type SusAnswers,
} from '@/constants/susItems';

interface Row {
  id: string;
  instituicao: string;
  codigo: string | null;
  respostas: SusAnswers;
  comentarios: string | null;
  criado_em: string;
}

export const SusResponsesManager = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sus_responses')
        .select('id, instituicao, codigo, respostas, comentarios, criado_em')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setRows(
        (data ?? []).map((r) => ({
          id: r.id,
          instituicao: r.instituicao,
          codigo: r.codigo,
          respostas: (r.respostas ?? {}) as SusAnswers,
          comentarios: r.comentarios,
          criado_em: r.criado_em,
        })),
      );
    } catch (err) {
      console.error('Erro ao carregar respostas do SUS:', err);
      toast({
        title: 'Erro ao carregar respostas',
        description: 'Não foi possível buscar os questionários SUS.',
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
    const uni = rows.filter((r) => r.instituicao === 'UNINASSAU').length;
    const ufpi = rows.filter((r) => r.instituicao === 'UFPI').length;
    const medias = rows.map((r) => calcularMediaAjustada(r.respostas));
    const escores = rows.map((r) => calcularEscoreSus(r.respostas));
    const media = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;
    const escore = escores.length ? escores.reduce((a, b) => a + b, 0) / escores.length : 0;
    return { total, uni, ufpi, media, escore };
  }, [rows]);

  const exportCsv = () => {
    const header = [
      'Codigo',
      'Instituicao',
      ...SUS_ITEMS.map((i) => `Item_${i.id}`),
      'Media_ajustada',
      'Escore_SUS_0_100',
      'Comentarios',
      'Enviado_em',
    ];
    const lines = rows.map((r) => [
      r.codigo ?? '',
      r.instituicao,
      ...SUS_ITEMS.map((i) => String(r.respostas[String(i.id)] ?? '')),
      calcularMediaAjustada(r.respostas).toFixed(2).replace('.', ','),
      calcularEscoreSus(r.respostas).toFixed(1).replace('.', ','),
      (r.comentarios ?? '').replace(/[\r\n;]+/g, ' '),
      new Date(r.criado_em).toLocaleString('pt-BR'),
    ]);
    const csv = ['sep=;', header.join(';'), ...lines.map((l) => l.join(';'))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vetbalance_sus_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Questionário SUS (Anexo A)
        </CardTitle>
        <CardDescription>
          Respostas enviadas pelos alunos no aplicativo. Prazo de preenchimento: {SUS_DEADLINE_LABEL}.
          Métrica DS-03 da pesquisa: média ajustada ≥ 4,0/5,0.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Total: {stats.total}</Badge>
          <Badge variant="outline">UNINASSAU: {stats.uni}</Badge>
          <Badge variant="outline">UFPI: {stats.ufpi}</Badge>
          <Badge variant={stats.media >= 4 ? 'default' : 'secondary'}>
            Média ajustada: {stats.media.toFixed(2)}/5,00
          </Badge>
          <Badge variant="outline">Escore SUS: {stats.escore.toFixed(1)}/100</Badge>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? 'Carregando...' : 'Nenhuma resposta registrada ainda.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Média ajustada</TableHead>
                  <TableHead>Escore SUS</TableHead>
                  <TableHead>Comentários</TableHead>
                  <TableHead>Enviado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.codigo ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.instituicao}</Badge>
                    </TableCell>
                    <TableCell>{calcularMediaAjustada(r.respostas).toFixed(2)}</TableCell>
                    <TableCell>{calcularEscoreSus(r.respostas).toFixed(1)}</TableCell>
                    <TableCell className="max-w-[280px] truncate" title={r.comentarios ?? ''}>
                      {r.comentarios ?? '—'}
                    </TableCell>
                    <TableCell>{new Date(r.criado_em).toLocaleDateString('pt-BR')}</TableCell>
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
