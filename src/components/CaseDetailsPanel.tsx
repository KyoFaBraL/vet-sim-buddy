import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Beaker, Pill, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  /** Increment this to force a refresh */
  refreshKey?: number;
}

export const CaseDetailsPanel = ({ caseId, refreshKey = 0 }: CaseDetailsPanelProps) => {
  const [primarios, setPrimarios] = useState<CaseParam[]>([]);
  const [secundarios, setSecundarios] = useState<CaseParam[]>([]);
  const [tratamentos, setTratamentos] = useState<CaseTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [caseId, refreshKey]);

  const loadDetails = async () => {
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
          id: v.id,
          nome: v.parametros?.nome || "?",
          valor: v.valor,
          unidade: v.parametros?.unidade || "",
        }))
      );

      setSecundarios(
        (secRes.data || []).map((v: any) => ({
          id: v.id,
          nome: v.parametros?.nome || "?",
          valor: v.valor,
          unidade: v.parametros?.unidade || "",
        }))
      );

      setTratamentos(
        (tratRes.data || []).map((t: any) => ({
          id: t.id,
          nome: t.tratamentos?.nome || "?",
          prioridade: t.prioridade,
          justificativa: t.justificativa,
        }))
      );
    } catch (e) {
      console.error("Erro ao carregar detalhes do caso:", e);
    } finally {
      setLoading(false);
    }
  };

  const total = primarios.length + secundarios.length + tratamentos.length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Carregando dados do caso...
      </div>
    );
  }

  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-1">
        Nenhum parâmetro ou tratamento configurado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Summary badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {primarios.length > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Beaker className="h-3 w-3" />
            {primarios.length} primários
          </Badge>
        )}
        {secundarios.length > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Beaker className="h-3 w-3" />
            {secundarios.length} secundários
          </Badge>
        )}
        {tratamentos.length > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Pill className="h-3 w-3" />
            {tratamentos.length} tratamentos
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Ocultar
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Detalhes
            </>
          )}
        </Button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-3 bg-muted/30 rounded-md p-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Primary parameters */}
          {primarios.length > 0 && (
            <div>
              <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                <Beaker className="h-3 w-3 text-primary" />
                Parâmetros Primários
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {primarios.map((p) => (
                  <div
                    key={p.id}
                    className="bg-background rounded px-2 py-1 border border-border/50"
                  >
                    <span className="text-muted-foreground">{p.nome}</span>
                    <span className="ml-1 font-mono font-semibold text-foreground">
                      {p.valor}
                    </span>
                    {p.unidade && (
                      <span className="text-muted-foreground ml-0.5">{p.unidade}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary parameters */}
          {secundarios.length > 0 && (
            <div>
              <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                <Beaker className="h-3 w-3 text-secondary-foreground" />
                Parâmetros Secundários
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {secundarios.map((p) => (
                  <div
                    key={p.id}
                    className="bg-background rounded px-2 py-1 border border-border/50"
                  >
                    <span className="text-muted-foreground">{p.nome}</span>
                    <span className="ml-1 font-mono font-semibold text-foreground">
                      {p.valor}
                    </span>
                    {p.unidade && (
                      <span className="text-muted-foreground ml-0.5">{p.unidade}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Treatments */}
          {tratamentos.length > 0 && (
            <div>
              <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                <Pill className="h-3 w-3 text-primary" />
                Tratamentos
              </p>
              <div className="space-y-1">
                {tratamentos.map((t) => (
                  <div
                    key={t.id}
                    className="bg-background rounded px-2 py-1.5 border border-border/50 flex items-start gap-2"
                  >
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 h-5 w-5 flex items-center justify-center p-0 rounded-full"
                    >
                      {t.prioridade}
                    </Badge>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{t.nome}</span>
                      {t.justificativa && (
                        <p className="text-muted-foreground mt-0.5 leading-snug">
                          {t.justificativa}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
