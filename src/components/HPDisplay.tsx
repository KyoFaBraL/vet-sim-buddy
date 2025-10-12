import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Clock, Trophy, Skull } from "lucide-react";
import { useEffect, useState } from "react";
import catNormal from "@/assets/cat-normal.png";
import catHappy from "@/assets/cat-happy.png";
import catSad from "@/assets/cat-sad.png";
import catVictory from "@/assets/cat-victory.png";
import catRip from "@/assets/cat-rip.png";
import dogNormal from "@/assets/dog-normal.png";
import dogHappy from "@/assets/dog-happy.png";
import dogSad from "@/assets/dog-sad.png";
import dogVictory from "@/assets/dog-victory.png";
import dogRip from "@/assets/dog-rip.png";

interface HPDisplayProps {
  hp: number;
  elapsedTime: number;
  gameStatus: 'playing' | 'won' | 'lost';
  animalType: string;
  lastHpChange: number;
}

const HPDisplay = ({ hp, elapsedTime, gameStatus, animalType, lastHpChange }: HPDisplayProps) => {
  const maxTime = 300; // 5 minutos em segundos
  const [currentImage, setCurrentImage] = useState<string>("");
  const timeRemaining = Math.max(0, maxTime - elapsedTime);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const getHPColor = () => {
    if (hp >= 70) return "bg-green-500";
    if (hp >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getAnimalImages = () => {
    // Detectar tipo de animal com base na espécie (canino = cão, felino = gato)
    const animalLower = animalType?.toLowerCase() || '';
    const isCat = animalLower.includes('felino') || 
                  animalLower.includes('gato') || 
                  animalLower.includes('cat');
    
    return {
      normal: isCat ? catNormal : dogNormal,
      happy: isCat ? catHappy : dogHappy,
      sad: isCat ? catSad : dogSad,
      victory: isCat ? catVictory : dogVictory,
      rip: isCat ? catRip : dogRip,
    };
  };

  useEffect(() => {
    const images = getAnimalImages();
    
    if (gameStatus === 'won') {
      setCurrentImage(images.victory);
    } else if (gameStatus === 'lost' || hp === 0) {
      setCurrentImage(images.rip);
    } else if (lastHpChange > 0) {
      setCurrentImage(images.happy);
      const timer = setTimeout(() => setCurrentImage(images.normal), 2000);
      return () => clearTimeout(timer);
    } else if (lastHpChange < 0 && lastHpChange !== -1) {
      setCurrentImage(images.sad);
      const timer = setTimeout(() => setCurrentImage(images.normal), 2000);
      return () => clearTimeout(timer);
    } else {
      setCurrentImage(images.normal);
    }
  }, [hp, gameStatus, lastHpChange, animalType]);

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

        {/* Figura do Animal e HP do Paciente */}
        <div className="flex gap-6 items-start">
          {/* Figura do Animal */}
          <div className="flex-shrink-0">
            <img 
              src={currentImage} 
              alt="Patient animal" 
              className={`w-32 h-32 object-contain ${
                gameStatus === 'won' ? 'animate-bounce' : ''
              } ${lastHpChange > 0 && gameStatus === 'playing' ? 'animate-pulse' : ''}`}
            />
          </div>

          {/* HP do Paciente */}
          <div className="flex-1 space-y-3">
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
