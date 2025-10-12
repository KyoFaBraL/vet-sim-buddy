import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, Lightbulb, Clock, Target } from "lucide-react";

type SimulationMode = 'practice' | 'evaluation';

interface SimulationModeSelectorProps {
  currentMode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  disabled?: boolean;
}

export const SimulationModeSelector = ({ 
  currentMode, 
  onModeChange,
  disabled = false 
}: SimulationModeSelectorProps) => {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modo de Simulação</CardTitle>
        <CardDescription>
          Escolha entre treinar livremente ou ser avaliado
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        {/* Modo Prática */}
        <button
          onClick={() => onModeChange('practice')}
          disabled={disabled}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            currentMode === 'practice'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Modo Prática</h3>
                <p className="text-sm text-muted-foreground">Treino sem pressão</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                <span>Dicas ilimitadas</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Sem limite de tempo</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Foco no aprendizado</span>
              </div>
            </div>
          </div>
        </button>

        {/* Modo Avaliação */}
        <button
          onClick={() => onModeChange('evaluation')}
          disabled={disabled}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            currentMode === 'evaluation'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Modo Avaliação</h3>
                <p className="text-sm text-muted-foreground">Teste suas habilidades</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lightbulb className="h-4 w-4 opacity-50 line-through" />
                <span>Sem dicas</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tempo limitado (5 min)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span>Pontuação final</span>
              </div>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
};
