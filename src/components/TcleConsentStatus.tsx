import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentConsent {
  student_id: string;
  nome_completo: string | null;
  aceito: boolean | null;
  aceito_em: string | null;
  versao: string | null;
}

export function TcleConsentStatus() {
  const [students, setStudents] = useState<StudentConsent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get linked students
      const { data: linked, error: linkError } = await supabase
        .rpc('get_linked_students_for_professor');

      if (linkError || !linked) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = linked.map((s: any) => s.student_id);
      
      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Get TCLE consents for these students
      const { data: consents } = await supabase
        .from('tcle_consents')
        .select('user_id, aceito, aceito_em, versao')
        .in('user_id', studentIds)
        .order('aceito_em', { ascending: false });

      // Build merged list
      const consentMap = new Map<string, { aceito: boolean; aceito_em: string; versao: string }>();
      consents?.forEach((c) => {
        // Keep only the latest consent per student
        if (!consentMap.has(c.user_id)) {
          consentMap.set(c.user_id, {
            aceito: c.aceito,
            aceito_em: c.aceito_em,
            versao: c.versao,
          });
        }
      });

      const result: StudentConsent[] = linked.map((s: any) => {
        const consent = consentMap.get(s.student_id);
        return {
          student_id: s.student_id,
          nome_completo: s.nome_completo,
          aceito: consent?.aceito ?? null,
          aceito_em: consent?.aceito_em ?? null,
          versao: consent?.versao ?? null,
        };
      });

      // Sort: pending first, then by name
      result.sort((a, b) => {
        if (a.aceito === null && b.aceito !== null) return -1;
        if (a.aceito !== null && b.aceito === null) return 1;
        return (a.nome_completo ?? '').localeCompare(b.nome_completo ?? '');
      });

      setStudents(result);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const accepted = students.filter((s) => s.aceito === true).length;
  const declined = students.filter((s) => s.aceito === false).length;
  const pending = students.filter((s) => s.aceito === null).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhum aluno vinculado. Adicione alunos na aba "Alunos" para visualizar o status do TCLE.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
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
        <Button variant="ghost" size="sm" onClick={loadData} className="ml-auto h-6">
          <RefreshCw className="h-3 w-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
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
    </div>
  );
}
