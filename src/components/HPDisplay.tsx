import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Clock, Trophy, Skull } from "lucide-react";

interface HPDisplayProps {
  hp: number;
  elapsedTime: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

const HPDisplay = ({ hp, elapsedTime, gameStatus }: HPDisplayProps) => {
  const maxTime = 600; // 10 minutos em segundos
  const timeRemaining = Math.max(0, maxTime - elapsedTime);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const getHPColor = () => {
    if (hp >= 70) return "bg-green-500";
    if (hp >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusDisplay = () => {
    if (gameStatus === 'won') {
      return (
        <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
          <Trophy className="h-6 w-6" />
          PACIENTE ESTABILIZADO!
        </div>
      );
    }
    if (gameStatus === 'lost') {
      return (
        <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
          <Skull className="h-6 w-6" />
          PACIENTE FALECEU
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 border-4 shadow-xl">
      <div className="space-y-6">
        {/* Status do Jogo */}
        {gameStatus !== 'playing' && (
          <div className="flex justify-center">
            {getStatusDisplay()}
          </div>
        )}

        {/* HP do Paciente */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="text-lg font-bold">HP do Paciente</span>
            </div>
            <span className="text-3xl font-bold font-mono">{hp}/100</span>
          </div>
          <Progress value={hp} className="h-6">
            <div 
              className={`h-full transition-all ${getHPColor()}`}
              style={{ width: `${hp}%` }}
            />
          </Progress>
          {hp === 0 && gameStatus === 'playing' && (
            <p className="text-sm text-destructive font-semibold">
              ⚠️ Crítico! O paciente está à beira da morte!
            </p>
          )}
          {hp >= 100 && (
            <p className="text-sm text-green-600 font-semibold">
              ✓ Quadro normalizado! Paciente estável!
            </p>
          )}
        </div>

        {/* Tempo Restante */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">Tempo Restante</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${timeRemaining < 120 ? 'text-red-500 animate-pulse' : ''}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          {timeRemaining < 120 && gameStatus === 'playing' && (
            <p className="text-sm text-destructive font-semibold">
              ⏰ Tempo crítico! Menos de 2 minutos restantes!
            </p>
          )}
        </div>

        {/* Instruções */}
        {gameStatus === 'playing' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Meta:</strong> Estabilize o paciente atingindo 100 HP antes que o tempo acabe
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HPDisplay;
