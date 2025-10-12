import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SoundAlertsExtendedProps {
  parameters: any[];
  currentState: Record<number, number>;
  getParameterStatus: (parameterId: number, value: number) => { isNormal: boolean; isCritical: boolean };
  isRunning: boolean;
}

export const SoundAlertsExtended = ({ parameters, currentState, getParameterStatus, isRunning }: SoundAlertsExtendedProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [volume, setVolume] = useState(30); // 0-100
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

  // Som de alerta CRÍTICO (frequência alta, beeps rápidos)
  const playCriticalAlert = () => {
    if (!audioContextRef.current || !isEnabled) return;

    const ctx = audioContextRef.current;
    const baseGain = volume / 100;

    // 3 beeps agudos e rápidos
    [0, 0.15, 0.3].forEach((delay) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(900, ctx.currentTime); // Frequência alta

        gainNode.gain.setValueAtTime(baseGain * 0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      }, delay * 1000);
    });
  };

  // Som de AVISO (frequência média, beep único)
  const playWarningAlert = () => {
    if (!audioContextRef.current || !isEnabled) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime); // Frequência média

    const baseGain = volume / 100;
    gainNode.gain.setValueAtTime(baseGain * 0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  };

  // Som NORMAL (frequência baixa, suave)
  const playNormalAlert = () => {
    if (!audioContextRef.current || !isEnabled) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime); // Frequência baixa

    const baseGain = volume / 100;
    gainNode.gain.setValueAtTime(baseGain * 0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  // Monitorar parâmetros
  useEffect(() => {
    if (!isEnabled || !isRunning) return;

    let hasCritical = false;
    let hasWarning = false;
    let allNormal = true;
    const criticalParams: string[] = [];

    parameters.forEach((param) => {
      const value = currentState[param.id];
      if (value === undefined) return;

      const { isNormal, isCritical } = getParameterStatus(param.id, value);

      if (isCritical) {
        hasCritical = true;
        allNormal = false;
        criticalParams.push(param.nome);
      } else if (!isNormal) {
        hasWarning = true;
        allNormal = false;
      }
    });

    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTime;

    // Tocar alerta apropriado
    if (timeSinceLastAlert > 5000) { // 5 segundos entre alertas
      if (hasCritical) {
        playCriticalAlert();
        setLastAlertTime(now);
        
        toast({
          title: "🚨 Alerta Crítico!",
          description: `Parâmetros críticos: ${criticalParams.join(", ")}`,
          variant: "destructive",
        });
      } else if (hasWarning && timeSinceLastAlert > 10000) { // 10 segundos para avisos
        playWarningAlert();
        setLastAlertTime(now);
      } else if (allNormal && timeSinceLastAlert > 15000) { // 15 segundos para normal
        playNormalAlert();
        setLastAlertTime(now);
      }
    }
  }, [currentState, parameters, isEnabled, isRunning, volume]);

  const toggleAlerts = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      toast({
        title: "🔔 Alertas sonoros ativados",
        description: "Você será notificado com sons diferenciados",
      });
    } else {
      toast({
        title: "🔕 Alertas sonoros desativados",
        description: "Notificações sonoras foram silenciadas",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
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

      {isEnabled && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Ajustar volume">
              <Volume2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-sm text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🚨 <strong>Crítico:</strong> 900 Hz (agudo)</p>
                <p>⚠️ <strong>Aviso:</strong> 600 Hz (médio)</p>
                <p>✅ <strong>Normal:</strong> 400 Hz (grave)</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
