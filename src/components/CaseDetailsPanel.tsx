import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AddCaseDataForm } from "@/components/AddCaseDataForm";
import {
  Loader2, Beaker, Pill, ChevronDown, ChevronUp,
  Pencil, Check, X, Trash2, GripVertical,
} from "lucide-react";

interface CaseParam {
  id: number | string;
  nome: string;
  valor: number;
  unidade?: string;
}

interface CaseTreatment {
  id: number | string;
  nome: string;
  prioridade: number;
  justificativa?: string;
}

interface CaseDetailsPanelProps {
  caseId: number;
  refreshKey?: number;
}

export const CaseDetailsPanel = ({ caseId, refreshKey = 0 }: CaseDetailsPanelProps) => {
  const [primarios, setPrimarios] = useState<CaseParam[]>([]);
  const [secundarios, setSecundarios] = useState<CaseParam[]>([]);
  const [tratamentos, setTratamentos] = useState<CaseTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // "prim-{id}" | "sec-{id}" | "trat-{id}"
  const [editValue, setEditValue] = useState("");
  const [editJustificativa, setEditJustificativa] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [primRes, secRes, tratRes] = await Promise.all([
        supabase
          .from("valores_iniciais_caso")
          .select("id, valor, parametros:id_parametro(nome, unidade)")
          .eq("id_caso", caseId),
        supabase
          .from("parametros_secundarios_caso")
          .select("id, valor, parametros:parametro_id(nome, unidade)")
          .eq("case_id", caseId),
        supabase
          .from("tratamentos_caso")
          .select("id, prioridade, justificativa, tratamentos:tratamento_id(nome)")
          .eq("case_id", caseId)
          .order("prioridade"),
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
      setTratamentos(
        (tratRes.data || []).map((t: any) => ({
          id: t.id, nome: t.tratamentos?.nome || "?",
          prioridade: t.prioridade, justificativa: t.justificativa,
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

  const handleSaveTreatment = (treatmentId: number | string) => {
    invokeUpdate({
      caseId, action: "update_treatment", treatmentId,
      prioridade: editValue, justificativa: editJustificativa,
    });
  };

  const handleDelete = (type: "primary" | "secondary" | "treatment", id: number | string) => {
    const actionMap = {
      primary: "delete_primary_param",
      secondary: "delete_secondary_param",
      treatment: "delete_treatment",
    };
    const idKey = type === "treatment" ? "treatmentId" : "paramId";
    invokeUpdate({ caseId, action: actionMap[type], [idKey]: id });
  };

  const startEditParam = (key: string, valor: number) => {
    setEditing(key);
    setEditValue(String(valor));
  };

  const startEditTreatment = (key: string, t: CaseTreatment) => {
    setEditing(key);
    setEditValue(String(t.prioridade));
    setEditJustificativa(t.justificativa || "");
  };

  const handleDrop = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const reordered = [...tratamentos];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // Optimistic update
    setTratamentos(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
    // Save new order
    const order = reordered.map((t, i) => ({ id: t.id, prioridade: i + 1 }));
    await invokeUpdate({ caseId, action: "reorder_treatments", order });
  };

  const total = primarios.length + secundarios.length + tratamentos.length;

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

          {/* Tratamentos */}
          <div>
            <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
              <Pill className="h-3 w-3 text-primary" /> Tratamentos
            </p>
            {tratamentos.length > 0 && (
              <div className="space-y-1">
                {tratamentos.map((t, idx) => {
                  const editKey = `trat-${t.id}`;
                  const isEditing = editing === editKey;
                  const isDragging = dragIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <div
                      key={t.id}
                      draggable={!isEditing}
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) handleDrop(dragIndex, idx); }}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                      className={`bg-background rounded px-2 py-1.5 border group transition-all ${
                        isDragging ? "opacity-40 border-primary/50" :
                        isDragOver ? "border-primary border-dashed bg-primary/5" :
                        "border-border/50"
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{t.nome}</span>
                            <label className="text-muted-foreground">Prioridade:</label>
                            <Input
                              type="number"
                              min={1} max={10}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-6 text-xs w-14 px-1"
                              autoFocus
                            />
                          </div>
                          <Input
                            placeholder="Justificativa clínica..."
                            value={editJustificativa}
                            onChange={(e) => setEditJustificativa(e.target.value)}
                            className="h-6 text-xs"
                            maxLength={500}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveTreatment(t.id);
                              if (e.key === "Escape") setEditing(null);
                            }}
                          />
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleSaveTreatment(t.id)} disabled={saving}>
                              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Salvar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditing(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing mt-0.5" />
                          <Badge variant="outline" className="text-[10px] shrink-0 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                            {idx + 1}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-foreground">{t.nome}</span>
                            {t.justificativa && (
                              <p className="text-muted-foreground mt-0.5 leading-snug">{t.justificativa}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => startEditTreatment(editKey, t)}>
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDelete("treatment", t.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <AddCaseDataForm caseId={caseId} type="treatment" onAdded={loadDetails} />
          </div>
        </div>
      )}
    </div>
  );
};
