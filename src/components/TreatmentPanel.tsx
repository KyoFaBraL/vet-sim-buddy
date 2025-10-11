import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Treatment {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  isAdequate?: boolean;
  prioridade?: number;
  justificativa?: string;
}

interface TreatmentPanelProps {
  treatments: Treatment[];
  onApplyTreatment: (treatmentId: number) => void;
  conditionId?: number;
}

const TreatmentPanel = ({ treatments, onApplyTreatment, conditionId }: TreatmentPanelProps) => {
  const [enrichedTreatments, setEnrichedTreatments] = useState<Treatment[]>(treatments);

  useEffect(() => {
    const loadAdequateTreatments = async () => {
      if (!conditionId) {
        setEnrichedTreatments(treatments);
        return;
      }

      const { data: adequateTreatments } = await supabase
        .from("tratamentos_adequados")
        .select("tratamento_id, prioridade, justificativa")
        .eq("condicao_id", conditionId);

      const enriched = treatments.map(treatment => {
        const adequateInfo = adequateTreatments?.find(
          at => at.tratamento_id === treatment.id
        );
        return {
          ...treatment,
          isAdequate: !!adequateInfo,
          prioridade: adequateInfo?.prioridade,
          justificativa: adequateInfo?.justificativa
        };
      });

      setEnrichedTreatments(enriched);
    };

    loadAdequateTreatments();
  }, [treatments, conditionId]);

  const getPriorityBadge = (treatment: Treatment) => {
    if (!treatment.isAdequate) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Inadequado
        </Badge>
      );
    }

    switch (treatment.prioridade) {
      case 1:
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Alta Prioridade
          </Badge>
        );
      case 2:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Média Prioridade
          </Badge>
        );
      case 3:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Baixa Prioridade
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-primary" />
          Tratamentos Disponíveis
        </CardTitle>
        <CardDescription>
          Selecione um tratamento para aplicar ao paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {enrichedTreatments.map((treatment) => (
            <div key={treatment.id} className="relative">
              <Button
                onClick={() => onApplyTreatment(treatment.id)}
                variant="outline"
                className="h-auto py-3 px-4 justify-start text-left w-full"
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold flex-1">{treatment.nome}</div>
                    {getPriorityBadge(treatment)}
                  </div>
                  <div className="text-xs text-muted-foreground">{treatment.descricao}</div>
                  {treatment.justificativa && (
                    <div className="text-xs italic text-primary/70">
                      💡 {treatment.justificativa}
                    </div>
                  )}
                </div>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPanel;
