import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface SimulationControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const SimulationControls = ({ isRunning, onToggle, onReset }: SimulationControlsProps) => {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onToggle}
        size="lg"
        className="gap-2"
        variant={isRunning ? "secondary" : "default"}
      >
        {isRunning ? (
          <>
            <Pause className="h-5 w-5" />
            Pausar Simulação
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            Iniciar Simulação
          </>
        )}
      </Button>
      <Button
        onClick={onReset}
        size="lg"
        variant="outline"
        className="gap-2"
      >
        <RotateCcw className="h-5 w-5" />
        Reiniciar
      </Button>
    </div>
  );
};

export default SimulationControls;
