import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertSound {
  critical: OscillatorNode | null;
  warning: OscillatorNode | null;
}

interface SoundAlertsProps {
  parameters: any[];
  currentState: Record<number, number>;
  getParameterStatus: (parameterId: number, value: number) => { isNormal: boolean; isCritical: boolean };
  isRunning: boolean;
}

export const SoundAlerts = ({ parameters, currentState, getParameterStatus, isRunning }: SoundAlertsProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  // Inicializar AudioContext
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Função para criar som de alerta crítico
  const playCriticalAlert = () => {
    if (!audioContextRef.current || !isEnabled) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Som de alerta crítico: beep-beep-beep rápido
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);

    // Segundo beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, ctx.currentTime);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.1);
    }, 150);

    // Terceiro beep
    setTimeout(() => {
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(800, ctx.currentTime);
      gain3.gain.setValueAtTime(0.3, ctx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc3.start(ctx.currentTime);
      osc3.stop(ctx.currentTime + 0.1);
    }, 300);
  };

  // Função para criar som de alerta de aviso
  const playWarningAlert = () => {
    if (!audioContextRef.current || !isEnabled) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Som de aviso: beep único mais suave
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  // Monitorar parâmetros críticos
  useEffect(() => {
    if (!isEnabled || !isRunning) return;

    let hasCritical = false;
    let hasWarning = false;
    const criticalParams: string[] = [];

    parameters.forEach((param) => {
      const value = currentState[param.id];
      if (value === undefined) return;

      const { isNormal, isCritical } = getParameterStatus(param.id, value);

      if (isCritical) {
        hasCritical = true;
        criticalParams.push(param.nome);
      } else if (!isNormal) {
        hasWarning = true;
      }
    });

    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTime;

    // Tocar alerta apenas se passou tempo suficiente desde o último (evitar spam)
    if (timeSinceLastAlert > 5000) { // 5 segundos entre alertas
      if (hasCritical) {
        playCriticalAlert();
        setLastAlertTime(now);
        
        toast({
          title: "⚠️ Alerta Crítico!",
          description: `Parâmetros críticos: ${criticalParams.join(", ")}`,
          variant: "destructive",
        });
      } else if (hasWarning && timeSinceLastAlert > 10000) { // 10 segundos para avisos
        playWarningAlert();
        setLastAlertTime(now);
      }
    }
  }, [currentState, parameters, isEnabled, isRunning]);

  const toggleAlerts = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      // Inicializar AudioContext no primeiro clique (requisito do navegador)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      toast({
        title: "Alertas sonoros ativados",
        description: "Você será notificado quando valores críticos forem atingidos",
      });
    } else {
      toast({
        title: "Alertas sonoros desativados",
        description: "Notificações sonoras foram silenciadas",
      });
    }
  };

  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="icon"
      onClick={toggleAlerts}
      title={isEnabled ? "Desativar alertas sonoros" : "Ativar alertas sonoros"}
    >
      {isEnabled ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </Button>
  );
};
