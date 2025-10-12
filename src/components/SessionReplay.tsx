import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Activity, Syringe, Lightbulb, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Decision {
  id: string;
  timestamp_simulacao: number;
  tipo: string;
  dados: any;
  hp_antes: number;
  hp_depois: number;
  criado_em: string;
}

interface SessionReplayProps {
  sessionId: string;
}

export const SessionReplay = ({ sessionId }: SessionReplayProps) => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDecisions();
  }, [sessionId]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= decisions.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, decisions.length]);

  const loadDecisions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_decisions')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp_simulacao', { ascending: true });

      if (error) throw error;
      setDecisions(data || []);
    } catch (error) {
      console.error('Erro ao carregar decisões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDecisionIcon = (tipo: string) => {
    switch (tipo) {
      case 'treatment': return <Syringe className="h-4 w-4" />;
      case 'hint_used': return <Lightbulb className="h-4 w-4" />;
      case 'parameter_critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getDecisionLabel = (tipo: string) => {
    switch (tipo) {
      case 'treatment': return 'Tratamento Aplicado';
      case 'hint_used': return 'Dica Utilizada';
      case 'parameter_critical': return 'Parâmetro Crítico';
      default: return 'Evento';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando replay...</p>;
  }

  if (decisions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Nenhuma decisão registrada para esta sessão
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentDecision = decisions[currentIndex];
  const progress = ((currentIndex + 1) / decisions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Replay da Sessão
        </CardTitle>
        <CardDescription>
          Reveja suas decisões passo a passo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setIsPlaying(false);
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {decisions.length}
          </span>
        </div>

        {/* Decisão Atual */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1">
                  {getDecisionIcon(currentDecision.tipo)}
                  {getDecisionLabel(currentDecision.tipo)}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  {formatTime(currentDecision.timestamp_simulacao)}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Detalhes:</h4>
                <div className="bg-muted/50 p-3 rounded text-sm">
                  {currentDecision.tipo === 'treatment' && (
                    <p>Tratamento: <strong>{currentDecision.dados.nome}</strong></p>
                  )}
                  {currentDecision.tipo === 'hint_used' && (
                    <p>Dica utilizada (penalidade: -10 HP)</p>
                  )}
                  {currentDecision.dados.justificativa && (
                    <p className="mt-2 italic">{currentDecision.dados.justificativa}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">HP:</span>
                  <span className="font-mono font-bold text-lg">
                    {currentDecision.hp_antes}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className={`font-mono font-bold text-lg ${
                    currentDecision.hp_depois > currentDecision.hp_antes
                      ? 'text-green-500'
                      : currentDecision.hp_depois < currentDecision.hp_antes
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}>
                    {currentDecision.hp_depois}
                  </span>
                </div>
                <Badge variant={
                  currentDecision.hp_depois > currentDecision.hp_antes
                    ? 'default'
                    : currentDecision.hp_depois < currentDecision.hp_antes
                    ? 'destructive'
                    : 'secondary'
                }>
                  {currentDecision.hp_depois > currentDecision.hp_antes ? '+' : ''}
                  {currentDecision.hp_depois - currentDecision.hp_antes} HP
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Decisões */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Timeline Completa</h4>
          <ScrollArea className="h-[200px] rounded border p-2">
            <div className="space-y-2">
              {decisions.map((decision, index) => (
                <button
                  key={decision.id}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsPlaying(false);
                  }}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    index === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDecisionIcon(decision.tipo)}
                      <span className="text-sm">
                        {getDecisionLabel(decision.tipo)}
                      </span>
                    </div>
                    <span className="text-xs font-mono">
                      {formatTime(decision.timestamp_simulacao)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};