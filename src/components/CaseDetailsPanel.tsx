import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AddCaseDataForm } from "@/components/AddCaseDataForm";
import {
  Loader2, Beaker, ChevronDown, ChevronUp,
  Pencil, Check, X, Trash2, BarChart3, List,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

interface CaseParam {
  id: number | string;
  nome: string;
  valor: number;
  unidade?: string;
}


interface CaseDetailsPanelProps {
  caseId: number;
  refreshKey?: number;
}

export const CaseDetailsPanel = ({ caseId, refreshKey = 0 }: CaseDetailsPanelProps) => {
  const [primarios, setPrimarios] = useState<CaseParam[]>([]);
  const [secundarios, setSecundarios] = useState<CaseParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const { toast } = useToast();

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [primRes, secRes] = await Promise.all([
        supabase
          .from("valores_iniciais_caso")
          .select("id, valor, parametros:id_parametro(nome, unidade)")
          .eq("id_caso", caseId),
        supabase
          .from("parametros_secundarios_caso")
          .select("id, valor, parametros:parametro_id(nome, unidade)")
          .eq("case_id", caseId),
      ]);

      setPrimarios(
        (primRes.data || []).map((v: any) => ({
          id: v.id, nome: v.parametros?.nome || "?",
          valor: v.valor, unidade: v.parametros?.unidade || "",
        }))
      );
      setSecundarios(
        (secRes.data || []).map((v: any) => ({
          id: v.id, nome: v.parametros?.nome || "?",
          valor: v.valor, unidade: v.parametros?.unidade || "",
        }))
      );
    } catch (e) {
      console.error("Erro ao carregar detalhes do caso:", e);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadDetails(); }, [loadDetails, refreshKey]);

  const invokeUpdate = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-case-data", { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao salvar");
      toast({ title: "✅ Salvo", description: data.message });
      setEditing(null);
      await loadDetails();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrimary = (paramId: number | string) => {
    invokeUpdate({ caseId, action: "update_primary_param", paramId, valor: editValue });
  };

  const handleSaveSecondary = (paramId: number | string) => {
    invokeUpdate({ caseId, action: "update_secondary_param", paramId, valor: editValue });
  };

  const handleDelete = (type: "primary" | "secondary", id: number | string) => {
    const actionMap = { primary: "delete_primary_param", secondary: "delete_secondary_param" };
    invokeUpdate({ caseId, action: actionMap[type], paramId: id });
  };

  const startEditParam = (key: string, valor: number) => {
    setEditing(key);
    setEditValue(String(valor));
  };

  const total = primarios.length + secundarios.length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Carregando dados do caso...
      </div>
    );
  }

  if (total === 0 && !expanded) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground italic py-1">
          Nenhum parâmetro ou tratamento configurado.
        </p>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setExpanded(true)}>
          <ChevronDown className="h-3 w-3 mr-1" /> Adicionar dados
        </Button>
      </div>
    );
  }

  const renderParamRow = (
    p: CaseParam,
    keyPrefix: string,
    onSave: (id: number | string) => void,
    deleteType: "primary" | "secondary"
  ) => {
    const editKey = `${keyPrefix}-${p.id}`;
    const isEditing = editing === editKey;

    return (
      <div key={p.id} className="bg-background rounded px-2 py-1.5 border border-border/50 flex items-center gap-1.5 group">
        <span className="text-muted-foreground text-xs shrink-0">{p.nome}</span>
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input
              type="number"
              step="any"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 text-xs w-20 px-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave(p.id);
                if (e.key === "Escape") setEditing(null);
              }}
            />
            {p.unidade && <span className="text-muted-foreground text-xs">{p.unidade}</span>}
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onSave(p.id)} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-500" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditing(null)}>
              <X className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="font-mono font-semibold text-foreground text-xs">{p.valor}</span>
            {p.unidade && <span className="text-muted-foreground text-xs">{p.unidade}</span>}
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => startEditParam(editKey, p.valor)}>
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDelete(deleteType, p.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {primarios.length > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Beaker className="h-3 w-3" /> {primarios.length} primários
          </Badge>
        )}
        {secundarios.length > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Beaker className="h-3 w-3" /> {secundarios.length} secundários
          </Badge>
        )}
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><ChevronUp className="h-3 w-3 mr-1" /> Ocultar</> : <><ChevronDown className="h-3 w-3 mr-1" /> Detalhes</>}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-3 bg-muted/30 rounded-md p-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Toggle list/chart */}
          {total > 0 && (
            <div className="flex justify-end">
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <List className="h-3 w-3" /> Lista
                </button>
                <button
                  onClick={() => setViewMode("chart")}
                  className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                    viewMode === "chart" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <BarChart3 className="h-3 w-3" /> Gráfico
                </button>
              </div>
            </div>
          )}

          {viewMode === "chart" && total > 0 ? (
            <CaseParamsChart primarios={primarios} secundarios={secundarios} />
          ) : (
            <>
              {/* Parâmetros Primários */}
              <div>
                <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Beaker className="h-3 w-3 text-primary" /> Parâmetros Primários
                </p>
                {primarios.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {primarios.map((p) => renderParamRow(p, "prim", handleSavePrimary, "primary"))}
                  </div>
                )}
                <AddCaseDataForm caseId={caseId} type="primary" onAdded={loadDetails} />
              </div>

              {/* Parâmetros Secundários */}
              <div>
                <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Beaker className="h-3 w-3 text-secondary-foreground" /> Parâmetros Secundários
                </p>
                {secundarios.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {secundarios.map((p) => renderParamRow(p, "sec", handleSaveSecondary, "secondary"))}
                  </div>
                )}
                <AddCaseDataForm caseId={caseId} type="secondary" onAdded={loadDetails} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
