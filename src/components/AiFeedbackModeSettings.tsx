import { useEffect, useState } from "react";
import { Brain, Cpu, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AiMode = "deterministic" | "auto" | "ai";

const MODE_LABEL: Record<AiMode, string> = {
  deterministic: "Local (sem consumo de créditos)",
  auto: "Automático (IA com fallback local)",
  ai: "Online (sempre IA)",
};

export function AiFeedbackModeSettings() {
  const [mode, setMode] = useState<AiMode>("deterministic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AiMode | null>(null);

  const loadMode = async () => {
    const { data, error } = await supabase.rpc("get_ai_feedback_mode");
    if (!error && typeof data === "string") {
      setMode((data as AiMode) ?? "deterministic");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMode();
  }, []);

  const updateMode = async (next: AiMode) => {
    setSaving(next);
    const { data, error } = await supabase.rpc("set_ai_feedback_mode", { new_mode: next });
    setSaving(null);

    const result = data as { success?: boolean; message?: string } | null;
    if (error || !result?.success) {
      toast.error(result?.message || "Não foi possível alterar o modo de feedback");
      return;
    }

    setMode(next);
    toast.success(`Modo de feedback: ${MODE_LABEL[next]}`);
  };

  const online = mode !== "deterministic";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Feedback de IA
            </CardTitle>
            <CardDescription>
              Escolha se as dicas e os relatórios pós-sessão usam análise local (sem custo) ou
              inteligência artificial online (consome créditos).
            </CardDescription>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Badge variant={online ? "default" : "secondary"}>{online ? "Online" : "Local"}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="ai-feedback-switch" className="flex items-center gap-2">
              {online ? <Sparkles className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
              Usar inteligência artificial online
            </Label>
            <p className="text-sm text-muted-foreground">
              Desligado: análise local determinística, ideal para testes com turmas.
            </p>
          </div>
          <Switch
            id="ai-feedback-switch"
            checked={online}
            disabled={loading || saving !== null}
            onCheckedChange={(checked) => updateMode(checked ? "auto" : "deterministic")}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Modo atual: {MODE_LABEL[mode]}</Label>
          <div className="flex flex-wrap gap-2">
            {(["deterministic", "auto", "ai"] as AiMode[]).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "default" : "outline"}
                disabled={loading || saving !== null}
                onClick={() => updateMode(m)}
              >
                {saving === m && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                {MODE_LABEL[m]}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            A alteração vale imediatamente para todos os alunos, sem precisar republicar o sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
