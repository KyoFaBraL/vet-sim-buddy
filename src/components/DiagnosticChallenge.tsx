import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Check, X, Loader2 } from "lucide-react";

interface Diagnosis {
  name: string;
  probability: string;
  reasoning: string;
}

interface DiagnosticChallengeProps {
  caseId: number;
  currentState: Record<number, number>;
  parameters: any[];
  onSuccess: () => void;
  disabled?: boolean;
}

export const DiagnosticChallenge = ({
  caseId,
  currentState,
  parameters,
  onSuccess,
  disabled = false
}: DiagnosticChallengeProps) => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [correctDiagnosis, setCorrectDiagnosis] = useState<string>("");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!disabled) {
      generateDiagnosticChallenge();
    }
  }, [caseId, disabled]);

  const generateDiagnosticChallenge = async () => {
    setLoading(true);
    try {
      // Buscar dados do caso
      const { data: caseData } = await supabase
        .from("casos_clinicos")
        .select("*, condicoes(*)")
        .eq("id", caseId)
        .single();

      if (!caseData) return;

      // Preparar dados dos parâmetros para a IA
      const parametersData = parameters
        .map(p => {
          const value = currentState[p.id];
          if (value !== undefined) {
            return `${p.nome}: ${value.toFixed(2)} ${p.unidade || ''}`;
          }
          return null;
        })
        .filter(Boolean)
        .join(", ");

      const { data, error } = await supabase.functions.invoke('generate-differential-diagnosis', {
        body: {
          caseName: caseData.nome,
          species: caseData.especie,
          condition: caseData.condicoes?.nome,
          parameters: parametersData
        }
      });

      if (error) throw error;

      setDiagnoses(data.differentialDiagnoses);
      setCorrectDiagnosis(data.correctDiagnosis);
      setSelectedDiagnosis(null);
      setShowResult(false);
    } catch (error: any) {
      console.error('Erro ao gerar diagnóstico diferencial:', error);
      toast({
        title: "Erro ao gerar desafio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDiagnosis = (diagnosis: string) => {
    if (showResult) return;
    
    setSelectedDiagnosis(diagnosis);
    setShowResult(true);

    const isCorrect = diagnosis === correctDiagnosis;
    
    if (isCorrect) {
      toast({
        title: "Diagnóstico Correto! 🎯",
        description: "Excelente raciocínio clínico!",
      });
      onSuccess();
    } else {
      toast({
        title: "Diagnóstico Incorreto",
        description: `O diagnóstico correto era: ${correctDiagnosis}`,
        variant: "destructive"
      });
    }
  };

  if (disabled) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Desafio de Diagnóstico Diferencial
          </CardTitle>
          <CardDescription>
            Inicie a simulação para ativar o desafio
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Gerando diagnósticos diferenciais...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Desafio de Diagnóstico Diferencial
        </CardTitle>
        <CardDescription>
          Com base nos parâmetros atuais, selecione o diagnóstico mais provável
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {diagnoses.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>Nenhum diagnóstico disponível</p>
            <Button 
              onClick={generateDiagnosticChallenge}
              className="mt-4"
              size="sm"
            >
              Gerar Novo Desafio
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {diagnoses.map((diagnosis, index) => {
                const isSelected = selectedDiagnosis === diagnosis.name;
                const isCorrect = diagnosis.name === correctDiagnosis;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectDiagnosis(diagnosis.name)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      showCorrect
                        ? 'border-green-500 bg-green-500/10'
                        : showWrong
                        ? 'border-red-500 bg-red-500/10'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{diagnosis.name}</span>
                          <Badge variant="outline">{diagnosis.probability}</Badge>
                          {showCorrect && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                          {showWrong && (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        {showResult && (
                          <p className="text-sm text-muted-foreground">
                            {diagnosis.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <Button 
                onClick={generateDiagnosticChallenge}
                className="w-full"
                variant="outline"
              >
                Novo Desafio
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
