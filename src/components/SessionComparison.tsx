import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Trophy, Clock, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SessionSummary {
  id: string;
  nome: string;
  data_inicio: string;
  status: string;
  duracao_segundos: number;
  case_id: number;
}

interface SessionComparisonProps {
  currentCaseId: number;
  userId: string;
}

export const SessionComparison = ({ currentCaseId, userId }: SessionComparisonProps) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionA, setSessionA] = useState<string>("");
  const [sessionB, setSessionB] = useState<string>("");
  const [comparison, setComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [currentCaseId, userId]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('simulation_sessions')
      .select('id, nome, data_inicio, status, duracao_segundos, case_id')
      .eq('user_id', userId)
      .eq('case_id', currentCaseId)
      .order('data_inicio', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading sessions:", error);
      return;
    }

    setSessions(data || []);
  };

  const compareSessions = async () => {
    if (!sessionA || !sessionB) {
      toast({
        title: "Selecione duas sessões",
        description: "Escolha duas sessões para comparar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Carregar dados das duas sessões
      const [sessA, sessB] = await Promise.all([
        loadSessionData(sessionA),
        loadSessionData(sessionB),
      ]);

      // Comparar
      const comp = {
        sessionA: sessA,
        sessionB: sessB,
        improvements: calculateImprovements(sessA, sessB),
      };

      setComparison(comp);
    } catch (error) {
      console.error("Error comparing sessions:", error);
      toast({
        title: "Erro ao comparar",
        description: "Não foi possível comparar as sessões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionData = async (sessionId: string) => {
    const { data: session } = await supabase
      .from('simulation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    const { data: decisions } = await supabase
      .from('session_decisions')
      .select('*')
      .eq('session_id', sessionId);

    const { data: treatments } = await supabase
      .from('session_treatments')
      .select('*')
      .eq('session_id', sessionId);

    return {
      session,
      decisionsCount: decisions?.length || 0,
      treatmentsCount: treatments?.length || 0,
    };
  };

  const calculateImprovements = (sessA: any, sessB: any) => {
    const improvements = [];

    // Comparar tempo
    const timeDiff = sessA.session.duracao_segundos - sessB.session.duracao_segundos;
    if (Math.abs(timeDiff) > 5) {
      improvements.push({
        metric: "Tempo",
        direction: timeDiff > 0 ? "improved" : "declined",
        change: `${Math.abs(timeDiff)}s ${timeDiff > 0 ? "mais rápido" : "mais lento"}`,
      });
    }

    // Comparar tratamentos
    const treatmentDiff = sessA.treatmentsCount - sessB.treatmentsCount;
    if (treatmentDiff !== 0) {
      improvements.push({
        metric: "Tratamentos",
        direction: treatmentDiff > 0 ? "declined" : "improved",
        change: `${Math.abs(treatmentDiff)} ${treatmentDiff > 0 ? "mais" : "menos"} tratamentos`,
      });
    }

    // Comparar resultado
    const wonA = sessA.session.status === 'won' || sessA.session.status === 'vitoria';
    const wonB = sessB.session.status === 'won' || sessB.session.status === 'vitoria';
    
    if (wonA !== wonB) {
      improvements.push({
        metric: "Resultado",
        direction: wonB ? "improved" : "declined",
        change: wonB ? "Vitória alcançada" : "Vitória perdida",
      });
    }

    return improvements;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'won' || status === 'vitoria') {
      return <Badge variant="default" className="bg-green-500">Vitória</Badge>;
    }
    if (status === 'lost' || status === 'derrota') {
      return <Badge variant="destructive">Derrota</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTrendIcon = (direction: string) => {
    if (direction === "improved") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === "declined") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Comparação de Sessões
        </CardTitle>
        <CardDescription>
          Compare duas tentativas do mesmo caso para identificar melhorias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Complete pelo menos 2 sessões deste caso para comparar</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sessão A</label>
                <Select value={sessionA} onValueChange={setSessionA}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((sess) => (
                      <SelectItem key={sess.id} value={sess.id}>
                        {sess.nome} - {new Date(sess.data_inicio).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sessão B</label>
                <Select value={sessionB} onValueChange={setSessionB}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((sess) => (
                      <SelectItem key={sess.id} value={sess.id}>
                        {sess.nome} - {new Date(sess.data_inicio).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={compareSessions} disabled={isLoading} className="w-full">
              {isLoading ? "Comparando..." : "Comparar Sessões"}
            </Button>

            {comparison && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Sessão A</h4>
                    <div className="space-y-1 text-sm">
                      {getStatusBadge(comparison.sessionA.session.status)}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {comparison.sessionA.session.duracao_segundos}s
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {comparison.sessionA.treatmentsCount} tratamentos
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Sessão B</h4>
                    <div className="space-y-1 text-sm">
                      {getStatusBadge(comparison.sessionB.session.status)}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {comparison.sessionB.session.duracao_segundos}s
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {comparison.sessionB.treatmentsCount} tratamentos
                      </div>
                    </div>
                  </div>
                </div>

                {comparison.improvements.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Melhorias Identificadas
                    </h4>
                    <div className="space-y-2">
                      {comparison.improvements.map((imp: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                          {getTrendIcon(imp.direction)}
                          <div className="flex-1">
                            <span className="font-medium">{imp.metric}:</span>{" "}
                            <span className="text-muted-foreground">{imp.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
