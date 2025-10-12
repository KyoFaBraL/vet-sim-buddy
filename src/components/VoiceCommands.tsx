import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface VoiceCommandsProps {
  onCommand: (command: string) => void;
  enabled: boolean;
}

export const VoiceCommands = ({ onCommand, enabled }: VoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = "pt-BR";

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Comando de voz:", transcript);
      
      onCommand(transcript);
      
      toast({
        title: "Comando reconhecido",
        description: transcript,
      });
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
      
      toast({
        title: "Erro no reconhecimento de voz",
        description: "Tente novamente",
        variant: "destructive",
      });
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
  }, [onCommand, toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Reconhecimento de voz não disponível",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Escutando...",
        description: "Diga um comando",
      });
    }
  };

  if (!enabled) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "outline"}
          size="sm"
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              Parar
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Comandos de Voz
            </>
          )}
        </Button>
        <div className="text-sm text-muted-foreground">
          {isListening ? (
            <span className="text-destructive font-medium">Escutando...</span>
          ) : (
            "Clique para ativar comandos de voz"
          )}
        </div>
      </div>
      {recognition && (
        <div className="mt-3 text-xs text-muted-foreground">
          <p>Exemplos de comandos:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>"Aplicar oxigênio"</li>
            <li>"Iniciar simulação"</li>
            <li>"Pausar simulação"</li>
            <li>"Mostrar dicas"</li>
          </ul>
        </div>
      )}
    </Card>
  );
};
