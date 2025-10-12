import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lightbulb, Loader2, AlertCircle, Target, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Hint {
  priority: "alta" | "média" | "baixa";
  problem: string;
  treatment: string;
  mechanism: string;
  targetParameter: string;
  expectedChange: string;
}

interface TreatmentHintsProps {
  currentState: Record<number, number>;
  parameters: any[];
  caseData: any;
  onHpChange: (delta: number) => void;
}

export const TreatmentHints = ({ currentState, parameters, caseData, onHpChange }: TreatmentHintsProps) => {
  const [hints, setHints] = useState<Hint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "destructive";
      case "média":
        return "default";
      case "baixa":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta":
        return "🔴";
      case "média":
        return "🟡";
      case "baixa":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const generateHints = async () => {
    setIsLoading(true);
    setRevealed([]);
    
    try {
      // Buscar tratamentos disponíveis
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from("tratamentos")
        .select("id, nome, descricao, tipo");

      if (treatmentsError) throw treatmentsError;

      const { data, error } = await supabase.functions.invoke('treatment-hints', {
        body: {
          currentState,
          parameters,
          condition: caseData?.condicoes?.nome || "Desconhecida",
          caseDescription: caseData?.descricao || "Sem descrição",
          availableTreatments: treatmentsData || []
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setHints(data.hints || []);
      
      // Aplicar penalidade de 10 HP
      onHpChange(-10);
      
      if (data.hints && data.hints.length > 0) {
        toast({
          title: "Dicas geradas!",
          description: `${data.hints.length} sugestões de tratamento disponíveis. Penalidade: -10 HP`,
        });
      }
    } catch (error: any) {
      console.error("Error generating hints:", error);
      toast({
        title: "Erro ao gerar dicas",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const handleGenerateClick = () => {
    setShowConfirmDialog(true);
  };

  const revealHint = (index: number) => {
    setRevealed(prev => [...prev, index]);
  };

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usar Sistema de Dicas?</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema de dicas irá analisar o estado atual do paciente e sugerir tratamentos apropriados.
              <br /><br />
              <strong className="text-destructive">⚠️ Atenção: Usar as dicas custará 10 HP</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={generateHints}>
              Confirmar (-10 HP)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Sistema de Dicas</h3>
            </div>
            <Button
              onClick={handleGenerateClick}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Gerar Dicas (-10 HP)
                </>
              )}
            </Button>
          </div>

        {hints.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Clique em "Gerar Dicas" para receber sugestões de tratamento<br />
              baseadas no estado atual do paciente
            </p>
          </div>
        )}

        {hints.length > 0 && (
          <div className="space-y-3">
            {hints.map((hint, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{getPriorityIcon(hint.priority)}</span>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getPriorityColor(hint.priority)}>
                            Prioridade {hint.priority}
                          </Badge>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-medium">{hint.problem}</p>
                        </div>
                      </div>
                    </div>

                    {revealed.includes(index) ? (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Tratamento Sugerido
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            {hint.treatment}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Mecanismo de Ação</h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            {hint.mechanism}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-success" />
                            Resultado Esperado
                          </h4>
                          <p className="text-sm text-muted-foreground pl-6">
                            <strong>{hint.targetParameter}:</strong> {hint.expectedChange}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revealHint(index)}
                        className="w-full"
                      >
                        Revelar Dica {index + 1}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hints.length > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>💡 Dica pedagógica: Tente aplicar os tratamentos na ordem de prioridade sugerida</p>
          </div>
        )}
        </div>
      </Card>
    </>
  );
};
