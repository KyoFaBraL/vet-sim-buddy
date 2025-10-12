import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import catNormal from "@/assets/cat-normal.png";
import catSad from "@/assets/cat-sad.png";
import catHappy from "@/assets/cat-happy.png";
import catRip from "@/assets/cat-rip.png";
import catVictory from "@/assets/cat-victory.png";
import dogNormal from "@/assets/dog-normal.png";
import dogSad from "@/assets/dog-sad.png";
import dogHappy from "@/assets/dog-happy.png";
import dogRip from "@/assets/dog-rip.png";
import dogVictory from "@/assets/dog-victory.png";

interface PatientMonitorProps {
  hp: number;
  elapsedTime: number;
  gameStatus: 'playing' | 'won' | 'lost';
  animalType: string;
  lastHpChange?: number;
  parameters: any[];
  currentState: Record<number, number>;
  getParameterStatus: (parameterId: number, value: number) => { isNormal: boolean; isCritical: boolean };
  getParameterTrend: (parameterId: number, currentValue: number) => 'up' | 'down' | 'stable';
}

export const PatientMonitor = ({
  hp,
  elapsedTime,
  gameStatus,
  animalType,
  lastHpChange,
  parameters,
  currentState,
  getParameterStatus,
  getParameterTrend
}: PatientMonitorProps) => {
  const getAnimalImage = () => {
    const isCat = animalType?.toLowerCase().includes('gato') || animalType?.toLowerCase().includes('felino');
    
    if (gameStatus === 'won') return isCat ? catVictory : dogVictory;
    if (gameStatus === 'lost') return isCat ? catRip : dogRip;
    if (hp >= 70) return isCat ? catHappy : dogHappy;
    if (hp >= 40) return isCat ? catNormal : dogNormal;
    return isCat ? catSad : dogSad;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-blue-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const mainParameters = ['pH', 'pCO2', 'HCO3-'];
  const mainParams = parameters.filter(p => mainParameters.includes(p.nome));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monitor do Paciente
          </span>
          <Badge variant="outline" className="font-mono">
            {formatTime(elapsedTime)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HP e Imagem do Animal */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={getAnimalImage()} 
              alt={animalType}
              className="w-32 h-32 object-contain"
            />
            {lastHpChange !== 0 && (
              <div className={`absolute -top-2 -right-2 text-xl font-bold animate-fade-in ${
                lastHpChange > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {lastHpChange > 0 ? '+' : ''}{lastHpChange}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">HP do Paciente</span>
                  <span className="text-2xl font-bold font-mono">{hp}</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      hp > 70 ? 'bg-green-500' : hp > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${hp}%` }}
                  />
                </div>
              </div>
            </div>

            {gameStatus !== 'playing' && (
              <Badge 
                variant={gameStatus === 'won' ? 'default' : 'destructive'}
                className="w-full justify-center py-2 text-lg"
              >
                {gameStatus === 'won' ? '🎉 Vitória!' : '💀 Derrota'}
              </Badge>
            )}
          </div>
        </div>

        {/* Parâmetros Principais */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Parâmetros Vitais
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {mainParams.map((param) => {
              const value = currentState[param.id] || 0;
              const { isNormal, isCritical } = getParameterStatus(param.id, value);
              const trend = getParameterTrend(param.id, value);

              return (
                <div 
                  key={param.id}
                  className={`p-3 rounded-lg border-2 ${
                    isCritical 
                      ? 'border-destructive bg-destructive/10' 
                      : !isNormal 
                        ? 'border-warning bg-warning/10' 
                        : 'border-success bg-success/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {param.nome}
                    </span>
                    {getTrendIcon(trend)}
                  </div>
                  <div className={`text-2xl font-bold font-mono ${
                    isCritical ? 'text-destructive' : !isNormal ? 'text-warning' : 'text-success'
                  }`}>
                    {value.toFixed(2)}
                    {param.unidade && (
                      <span className="text-sm ml-1 text-muted-foreground">
                        {param.unidade}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
