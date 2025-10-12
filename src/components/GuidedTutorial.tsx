import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, ChevronRight, Lightbulb, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TutorialStep {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  dica: string;
  completado: boolean;
}

interface GuidedTutorialProps {
  caseId: number;
  onClose?: () => void;
}

export const GuidedTutorial = ({ caseId, onClose }: GuidedTutorialProps) => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTutorialSteps();
  }, [caseId]);

  const loadTutorialSteps = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Carregar passos do tutorial
      const { data: tutorialSteps } = await supabase
        .from('tutorial_steps')
        .select('*')
        .eq('case_id', caseId)
        .order('ordem', { ascending: true });

      if (!tutorialSteps || tutorialSteps.length === 0) {
        // Criar tutorial padrão se não existir
        await createDefaultTutorial();
        return;
      }

      // Carregar progresso do usuário
      const { data: userProgress } = await supabase
        .from('user_tutorial_progress')
        .select('tutorial_step_id, completado')
        .eq('user_id', userData.user.id);

      const progressMap = new Map(
        userProgress?.map(p => [p.tutorial_step_id, p.completado]) || []
      );

      const stepsWithProgress = tutorialSteps.map(step => ({
        ...step,
        completado: progressMap.get(step.id) || false
      }));

      setSteps(stepsWithProgress);

      // Encontrar primeiro passo não completado
      const firstIncomplete = stepsWithProgress.findIndex(s => !s.completado);
      setCurrentStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    } catch (error) {
      console.error('Erro ao carregar tutorial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultTutorial = async () => {
    const defaultSteps = [
      {
        case_id: caseId,
        ordem: 1,
        titulo: "Observe os Parâmetros",
        descricao: "Primeiro, observe os parâmetros vitais do paciente no monitor. Identifique quais estão fora do normal (em amarelo ou vermelho).",
        dica: "Parâmetros críticos aparecem em vermelho e requerem atenção imediata!"
      },
      {
        case_id: caseId,
        ordem: 2,
        titulo: "Revise as Informações do Caso",
        descricao: "Leia atentamente a descrição do caso clínico, espécie e condição do paciente. Isso ajudará a escolher o tratamento adequado.",
        dica: "A condição primária do paciente indica o tipo de distúrbio ácido-base presente."
      },
      {
        case_id: caseId,
        ordem: 3,
        titulo: "Escolha um Tratamento",
        descricao: "Com base nos parâmetros alterados, selecione um tratamento apropriado na lista de tratamentos disponíveis.",
        dica: "Você pode usar o sistema de dicas (com penalidade de -10 HP) se estiver em dúvida!"
      },
      {
        case_id: caseId,
        ordem: 4,
        titulo: "Monitore o HP",
        descricao: "Observe como suas decisões afetam a saúde do paciente (HP). Tratamentos adequados aumentam o HP, inadequados diminuem.",
        dica: "O HP diminui 1 ponto a cada 5 segundos. Aja rápido mas com sabedoria!"
      },
      {
        case_id: caseId,
        ordem: 5,
        titulo: "Complete as Metas",
        descricao: "Alcance as metas de aprendizado para ganhar pontos e demonstrar seu conhecimento clínico.",
        dica: "Metas alcançadas ficam marcadas em verde. Tente completar todas!"
      }
    ];

    const { data, error } = await supabase
      .from('tutorial_steps')
      .insert(defaultSteps)
      .select();

    if (!error) {
      await loadTutorialSteps();
    }
  };

  const handleCompleteStep = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const currentStep = steps[currentStepIndex];

      await supabase
        .from('user_tutorial_progress')
        .upsert({
          user_id: userData.user.id,
          tutorial_step_id: currentStep.id,
          completado: true,
          completado_em: new Date().toISOString()
        });

      const updatedSteps = [...steps];
      updatedSteps[currentStepIndex].completado = true;
      setSteps(updatedSteps);

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setShowHint(false);
      } else {
        toast({
          title: "🎉 Tutorial Completo!",
          description: "Você completou o modo guiado. Continue praticando!",
        });
      }
    } catch (error) {
      console.error('Erro ao completar passo:', error);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando tutorial...</p>;
  }

  if (steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  const progress = ((steps.filter(s => s.completado).length) / steps.length) * 100;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Modo Guiado
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Siga os passos para aprender a usar o simulador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso do Tutorial</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Passo Atual */}
        <Card className="border-2 border-primary">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Badge variant="outline">
                Passo {currentStep.ordem} de {steps.length}
              </Badge>
              {currentStep.completado && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{currentStep.titulo}</h3>
              <p className="text-sm text-muted-foreground">{currentStep.descricao}</p>
            </div>

            {showHint && currentStep.dica && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>{currentStep.dica}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              {!currentStep.completado && (
                <>
                  <Button
                    onClick={handleCompleteStep}
                    className="flex-1"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Completo
                  </Button>
                  {currentStep.dica && !showHint && (
                    <Button
                      variant="outline"
                      onClick={() => setShowHint(true)}
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              {currentStep.completado && currentStepIndex < steps.length - 1 && (
                <Button
                  onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                  className="flex-1"
                >
                  Próximo Passo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Passos */}
        <div className="space-y-1">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                index === currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : step.completado
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'hover:bg-muted'
              }`}
            >
              {step.completado ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 flex-shrink-0 rounded-full border-2" />
              )}
              <span>{step.titulo}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};