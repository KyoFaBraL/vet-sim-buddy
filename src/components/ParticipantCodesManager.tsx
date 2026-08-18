import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParticipantCodeRow {
  user_id: string;
  nome_completo: string | null;
  codigo: string;
  grupo: string;
  turma_id: string | null;
  turma_nome: string | null;
  criado_em: string;
}

export const ParticipantCodesManager = () => {
  const [rows, setRows] = useState<ParticipantCodeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_participant_codes_for_professor");
      if (error) throw error;
      setRows((data as ParticipantCodeRow[]) || []);
    } catch (err) {
      console.error("Erro ao carregar códigos:", err);
      toast.error("Erro ao carregar códigos dos participantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = () => {
    const header = ["Codigo", "Grupo", "Nome", "Turma", "Data de atribuicao"];
    const lines = rows.map((r) => [
      r.codigo,
      r.grupo,
      r.nome_completo || "",
      r.turma_nome || "Sem turma",
      new Date(r.criado_em).toLocaleDateString("pt-BR"),
    ]);
    const csv =
      "sep=;\n" +
      [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codigos_GE_GC_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalGE = rows.filter((r) => r.grupo === "GE").length;
  const totalGC = rows.filter((r) => r.grupo === "GC").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">GE: {totalGE}</Badge>
          <Badge variant="secondary">GC: {totalGC}</Badge>
          <span className="text-sm text-muted-foreground">
            Total de participantes: {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando códigos...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum código atribuído ainda. Os códigos são gerados automaticamente quando o aluno aceita o TCLE.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Atribuído em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell className="font-mono font-medium">{r.codigo}</TableCell>
                  <TableCell>
                    <Badge variant={r.grupo === "GE" ? "default" : "secondary"}>{r.grupo}</Badge>
                  </TableCell>
                  <TableCell>{r.nome_completo || "—"}</TableCell>
                  <TableCell>{r.turma_nome || "Sem turma"}</TableCell>
                  <TableCell>{new Date(r.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
