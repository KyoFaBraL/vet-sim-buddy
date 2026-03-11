import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, X } from "lucide-react";

interface Option { id: number; nome: string; unidade?: string | null }

interface AddCaseDataFormProps {
  caseId: number;
  type: "primary" | "secondary" | "treatment";
  onAdded: () => void;
}

export const AddCaseDataForm = ({ caseId, type, onAdded }: AddCaseDataFormProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [prioridade, setPrioridade] = useState("1");
  const [justificativa, setJustificativa] = useState("");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const loadOptions = async () => {
      setLoading(true);
      const table = type === "treatment" ? "tratamentos" : "parametros";
      const { data } = await supabase.from(table).select("id, nome, unidade").order("nome");
      setOptions((data as Option[]) || []);
      setLoading(false);
    };
    loadOptions();
  }, [open, type]);

  const filtered = options.filter((o) =>
    o.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const actionMap = { primary: "add_primary_param", secondary: "add_secondary_param", treatment: "add_treatment" };
      const body: Record<string, unknown> = { caseId, action: actionMap[type] };

      if (type === "treatment") {
        body.tratamentoId = selectedId;
        body.prioridade = prioridade;
        body.justificativa = justificativa;
      } else {
        body.parametroId = selectedId;
        body.valor = valor;
      }

      const { data, error } = await supabase.functions.invoke("update-case-data", { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao adicionar");

      toast({ title: "✅ Adicionado", description: data.message });
      setOpen(false);
      setSelectedId(null);
      setValor("");
      setPrioridade("1");
      setJustificativa("");
      setSearch("");
      onAdded();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const labels = {
    primary: "parâmetro primário",
    secondary: "parâmetro secundário",
    treatment: "tratamento",
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-6 text-xs gap-1 mt-1" onClick={() => setOpen(true)}>
        <Plus className="h-3 w-3" /> Adicionar {labels[type]}
      </Button>
    );
  }

  return (
    <div className="mt-2 border border-border rounded-md p-2.5 bg-background space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Adicionar {labels[type]}</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Input
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-7 text-xs"
      />

      {loading ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="max-h-32 overflow-y-auto space-y-0.5">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-1">Nenhum resultado</p>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                selectedId === o.id
                  ? "bg-primary/10 text-primary font-medium border border-primary/30"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              {o.nome}
              {o.unidade && <span className="text-muted-foreground ml-1">({o.unidade})</span>}
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          {type !== "treatment" ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground shrink-0">Valor:</label>
              <Input
                type="number"
                step="any"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-6 text-xs w-24 px-1"
                placeholder="0.00"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">Prioridade:</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="h-6 text-xs w-14 px-1"
                  autoFocus
                />
              </div>
              <Input
                placeholder="Justificativa clínica (opcional)..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="h-6 text-xs"
                maxLength={500}
              />
            </>
          )}
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              className="h-6 text-xs"
              onClick={handleAdd}
              disabled={saving || (type !== "treatment" && !valor)}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Adicionar
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
