import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LearningGoal {
  id: string;
  case_id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  parametro_alvo: string | null;
  valor_alvo: number | null;
  tolerancia: number;
  tempo_limite_segundos: number | null;
  pontos: number;
}

interface LearningGoalsProps {
  caseId: number;
  currentState: Record<number, number>;
  parameters: any[];
  elapsedTime: number;
  onGoalAchieved?: (goalId: string, points: number) => void;
}

export const LearningGoals = ({ 
  caseId, 
  currentState, 
  parameters,
  elapsedTime,
  onGoalAchieved 
}: LearningGoalsProps) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [achievedGoals, setAchievedGoals] = useState<Set<string>>(new Set());
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadGoals();
  }, [caseId]);

  useEffect(() => {
    checkGoals();
  }, [currentState, elapsedTime, goals]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from("metas_aprendizado")
      .select("*")
      .eq("case_id", caseId);
    
    if (data) {
      setGoals(data);
    }
  };

  const checkGoals = () => {
    goals.forEach((goal) => {
      if (achievedGoals.has(goal.id)) return;

      let isAchieved = false;

      if (goal.tipo === "parametro" && goal.parametro_alvo && goal.valor_alvo) {
        const param = parameters.find((p) => p.nome === goal.parametro_alvo);
        if (param) {
          const currentValue = currentState[param.id];
          const tolerance = goal.tolerancia || 0.5;
          
          isAchieved = Math.abs(currentValue - goal.valor_alvo) <= tolerance;
        }
      }

      if (isAchieved) {
        setAchievedGoals((prev) => new Set([...prev, goal.id]));
        setTotalPoints((prev) => prev + goal.pontos);
        onGoalAchieved?.(goal.id, goal.pontos);
      }
    });
  };

  const getGoalProgress = (goal: LearningGoal): number => {
    if (achievedGoals.has(goal.id)) return 100;

    if (goal.tipo === "parametro" && goal.parametro_alvo && goal.valor_alvo) {
      const param = parameters.find((p) => p.nome === goal.parametro_alvo);
      if (!param) return 0;

      const currentValue = currentState[param.id];
      const target = goal.valor_alvo;
      const tolerance = goal.tolerancia || 0.5;
      
      // Calcular distância do alvo
      const distance = Math.abs(currentValue - target);
      const maxDistance = tolerance * 3; // 3x a tolerância = 0% progresso
      
      const progress = Math.max(0, Math.min(100, ((maxDistance - distance) / maxDistance) * 100));
      return progress;
    }

    return 0;
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "Sem limite";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (goals.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Metas de Aprendizado</h3>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {totalPoints} pts
          </Badge>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => {
            const isAchieved = achievedGoals.has(goal.id);
            const progress = getGoalProgress(goal);

            return (
              <div
                key={goal.id}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  isAchieved
                    ? "bg-success/10 border-success"
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {isAchieved ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={cn(
                          "font-semibold",
                          isAchieved && "text-success"
                        )}>
                          {goal.titulo}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.descricao}
                        </p>
                      </div>
                      <Badge variant={isAchieved ? "default" : "outline"}>
                        {goal.pontos} pts
                      </Badge>
                    </div>

                    {!isAchieved && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {goal.tempo_limite_segundos && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Limite: {formatTime(goal.tempo_limite_segundos)}</span>
                            </div>
                          )}
                          {goal.parametro_alvo && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>Alvo: {goal.parametro_alvo} = {goal.valor_alvo}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Metas Alcançadas
            </span>
            <span className="font-semibold">
              {achievedGoals.size} / {goals.length}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
