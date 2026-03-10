import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StudentConsent {
  student_id: string;
  nome_completo: string | null;
  aceito: boolean | null;
  aceito_em: string | null;
  versao: string | null;
  turma_id: string | null;
  turma_nome: string | null;
}

interface Turma {
  id: string;
  nome: string;
}

function CountUp({ target, duration = 800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return <span className="text-2xl font-bold text-foreground">{value}</span>;
}

export function TcleConsentStatus() {
  const [allStudents, setAllStudents] = useState<StudentConsent[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load turmas and linked students in parallel
      const [turmasRes, linkedRes] = await Promise.all([
        supabase.from('turmas').select('id, nome').eq('professor_id', user.id).eq('ativo', true).order('nome'),
        supabase.rpc('get_linked_students_for_professor'),
      ]);

      setTurmas(turmasRes.data ?? []);

      const linked = linkedRes.data;
      if (linkedRes.error || !linked || linked.length === 0) {
        setAllStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = linked.map((s: any) => s.student_id);

      const { data: consents } = await supabase
        .from('tcle_consents')
        .select('user_id, aceito, aceito_em, versao')
        .in('user_id', studentIds)
        .order('aceito_em', { ascending: false });

      const consentMap = new Map<string, { aceito: boolean; aceito_em: string; versao: string }>();
      consents?.forEach((c) => {
        if (!consentMap.has(c.user_id)) {
          consentMap.set(c.user_id, { aceito: c.aceito, aceito_em: c.aceito_em, versao: c.versao });
        }
      });

      const turmaMap = new Map<string, string>();
      (turmasRes.data ?? []).forEach((t) => turmaMap.set(t.id, t.nome));

      const result: StudentConsent[] = linked.map((s: any) => {
        const consent = consentMap.get(s.student_id);
        return {
          student_id: s.student_id,
          nome_completo: s.nome_completo,
          aceito: consent?.aceito ?? null,
          aceito_em: consent?.aceito_em ?? null,
          versao: consent?.versao ?? null,
          turma_id: s.turma_id ?? null,
          turma_nome: s.turma_id ? (turmaMap.get(s.turma_id) ?? null) : null,
        };
      });

      result.sort((a, b) => {
        if (a.aceito === null && b.aceito !== null) return -1;
        if (a.aceito !== null && b.aceito === null) return 1;
        return (a.nome_completo ?? '').localeCompare(b.nome_completo ?? '');
      });

      setAllStudents(result);
    } catch {
      setAllStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const students = selectedTurma === 'all'
    ? allStudents
    : selectedTurma === 'none'
      ? allStudents.filter((s) => !s.turma_id)
      : allStudents.filter((s) => s.turma_id === selectedTurma);

  const accepted = students.filter((s) => s.aceito === true).length;
  const declined = students.filter((s) => s.aceito === false).length;
  const pending = students.filter((s) => s.aceito === null).length;

  const exportCsv = () => {
    const header = 'Aluno,Turma,Status,Data,Versão';
    const rows = students.map((s) => {
      const status = s.aceito === true ? 'Aceito' : s.aceito === false ? 'Recusado' : 'Pendente';
      const data = s.aceito_em
        ? format(new Date(s.aceito_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : '';
      const versao = s.versao ? `v${s.versao}` : '';
      const nome = (s.nome_completo ?? 'Sem nome').replace(/,/g, ' ');
      const turma = (s.turma_nome ?? 'Sem turma').replace(/,/g, ' ');
      return `${nome},${turma},${status},${data},${versao}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consentimentos-tcle-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (allStudents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhum aluno vinculado. Adicione alunos na aba "Alunos" para visualizar o status do TCLE.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter + actions row */}
      <div className="flex flex-wrap items-center gap-2">
        {turmas.length > 0 && (
          <Select value={selectedTurma} onValueChange={setSelectedTurma}>
            <SelectTrigger className="w-[200px] h-8 text-sm">
              <SelectValue placeholder="Filtrar por turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              <SelectItem value="none">Sem turma</SelectItem>
              {turmas.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {accepted} aceito{accepted !== 1 ? 's' : ''}
        </Badge>
        {declined > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {declined} recusado{declined !== 1 ? 's' : ''}
          </Badge>
        )}
        {pending > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {pending} pendente{pending !== 1 ? 's' : ''}
          </Badge>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="sm" onClick={exportCsv} className="h-6">
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={loadData} className="h-6">
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Pie Chart */}
      {students.length > 0 && (
        <div className="flex items-center justify-center gap-6 py-3 animate-fade-in">
          <div className="w-44 h-44 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <CountUp target={students.length} duration={800} />
                <span className="block text-[10px] text-muted-foreground leading-tight">aluno{students.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    ...(accepted > 0 ? [{ name: 'Aceitos', value: accepted }] : []),
                    ...(declined > 0 ? [{ name: 'Recusados', value: declined }] : []),
                    ...(pending > 0 ? [{ name: 'Pendentes', value: pending }] : []),
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {accepted > 0 && <Cell fill="hsl(142 71% 45%)" />}
                  {declined > 0 && <Cell fill="hsl(var(--destructive))" />}
                  {pending > 0 && <Cell fill="hsl(var(--muted-foreground) / 0.4)" />}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} aluno${value !== 1 ? 's' : ''}`, name]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 text-sm animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            {accepted > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: 'hsl(142 71% 45%)' }} />
                <span className="text-muted-foreground">Aceitos</span>
                <span className="font-semibold">{accepted}</span>
                <span className="text-xs text-muted-foreground">({Math.round((accepted / students.length) * 100)}%)</span>
              </div>
            )}
            {declined > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Recusados</span>
                <span className="font-semibold">{declined}</span>
                <span className="text-xs text-muted-foreground">({Math.round((declined / students.length) * 100)}%)</span>
              </div>
            )}
            {pending > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground">Pendentes</span>
                <span className="font-semibold">{pending}</span>
                <span className="text-xs text-muted-foreground">({Math.round((pending / students.length) * 100)}%)</span>
              </div>
            )}
            <div className="mt-1 pt-1 border-t text-xs text-muted-foreground">
              Total: <span className="font-medium text-foreground">{students.length}</span> aluno{students.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum aluno encontrado para o filtro selecionado.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Versão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.student_id}>
                  <TableCell className="font-medium">
                    {s.nome_completo ?? 'Sem nome'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.turma_nome ?? 'Sem turma'}
                  </TableCell>
                  <TableCell>
                    {s.aceito === true && (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        Aceito
                      </Badge>
                    )}
                    {s.aceito === false && (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        Recusado
                      </Badge>
                    )}
                    {s.aceito === null && (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Clock className="h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.aceito_em
                      ? format(new Date(s.aceito_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.versao ? `v${s.versao}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
