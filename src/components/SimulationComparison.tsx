import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GitCompare, TrendingUp, Clock, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Session {
  id: string;
  nome: string;
  duracao_segundos: number;
  status: string;
  criado_em: string;
}

interface SessionHistory {
  timestamp: number;
  parametro_id: number;
  valor: number;
}

interface ComparisonData {
  session1: {
    info: Session;
    history: SessionHistory[];
    treatments: any[];
  } | null;
  session2: {
    info: Session;
    history: SessionHistory[];
    treatments: any[];
  } | null;
}

interface SimulationComparisonProps {
  caseId: number;
  parameters: any[];
}

export const SimulationComparison = ({ caseId, parameters }: SimulationComparisonProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession1, setSelectedSession1] = useState<string>("");
  const [selectedSession2, setSelectedSession2] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    session1: null,
    session2: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [caseId]);

  useEffect(() => {
    if (parameters.length > 0 && !selectedParameter) {
      setSelectedParameter(parameters[0].id);
    }
  }, [parameters]);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("simulation_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("case_id", caseId)
      .order("criado_em", { ascending: false });

    if (data) {
      setSessions(data);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadSessionData = async (sessionId: string) => {
    const { data: sessionInfo } = await supabase
      .from("simulation_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    const { data: history } = await supabase
      .from("session_history")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp");

    const { data: treatments } = await supabase
      .from("session_treatments")
      .select("*, tratamentos(*)")
      .eq("session_id", sessionId)
      .order("timestamp_simulacao");

    return {
      info: sessionInfo,
      history: history || [],
      treatments: treatments || [],
    };
  };

  const compareSimulations = async () => {
    if (!selectedSession1 || !selectedSession2) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione duas sessões para comparar",
        variant: "destructive",
      });
      return;
    }

    if (selectedSession1 === selectedSession2) {
      toast({
        title: "Sessões idênticas",
        description: "Selecione duas sessões diferentes",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [session1Data, session2Data] = await Promise.all([
        loadSessionData(selectedSession1),
        loadSessionData(selectedSession2),
      ]);

      setComparisonData({
        session1: session1Data,
        session2: session2Data,
      });

      toast({
        title: "Comparação pronta!",
        description: "Simulações carregadas para análise",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar simulações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = () => {
    if (!comparisonData.session1 || !comparisonData.session2 || !selectedParameter) {
      return [];
    }

    const timestamps = new Set([
      ...comparisonData.session1.history.map(h => h.timestamp),
      ...comparisonData.session2.history.map(h => h.timestamp),
    ]);

    return Array.from(timestamps).sort((a, b) => a - b).map(timestamp => {
      const session1Value = comparisonData.session1!.history.find(
        h => h.timestamp === timestamp && h.parametro_id === selectedParameter
      );
      const session2Value = comparisonData.session2!.history.find(
        h => h.timestamp === timestamp && h.parametro_id === selectedParameter
      );

      return {
        time: formatTime(timestamp),
        [comparisonData.session1!.info.nome]: session1Value ? parseFloat(session1Value.valor.toString()) : null,
        [comparisonData.session2!.info.nome]: session2Value ? parseFloat(session2Value.valor.toString()) : null,
      };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <GitCompare className="mr-2 h-4 w-4" />
          Comparar Simulações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparação de Simulações</DialogTitle>
          <DialogDescription>
            Compare diferentes abordagens ao mesmo caso clínico
          </DialogDescription>
        </DialogHeader>

        {sessions.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Você precisa de pelo menos 2 sessões salvas para comparar
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Simulação 1</label>
                <Select value={selectedSession1} onValueChange={setSelectedSession1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.nome} - {new Date(session.criado_em).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Simulação 2</label>
                <Select value={selectedSession2} onValueChange={setSelectedSession2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.nome} - {new Date(session.criado_em).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={compareSimulations}
              disabled={isLoading || !selectedSession1 || !selectedSession2}
              className="w-full"
            >
              {isLoading ? "Carregando..." : "Comparar"}
            </Button>

            {/* Comparison Results */}
            {comparisonData.session1 && comparisonData.session2 && (
              <div className="space-y-6">
                {/* Session Info Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">{comparisonData.session1.info.nome}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Duração: {formatTime(comparisonData.session1.info.duracao_segundos || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Tratamentos: {comparisonData.session1.treatments.length}</span>
                      </div>
                      <Badge variant="outline">{comparisonData.session1.info.status}</Badge>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">{comparisonData.session2.info.nome}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Duração: {formatTime(comparisonData.session2.info.duracao_segundos || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Tratamentos: {comparisonData.session2.treatments.length}</span>
                      </div>
                      <Badge variant="outline">{comparisonData.session2.info.status}</Badge>
                    </div>
                  </Card>
                </div>

                {/* Parameter Selection for Chart */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parâmetro a comparar</label>
                  <Select
                    value={selectedParameter?.toString()}
                    onValueChange={(value) => setSelectedParameter(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {parameters.map((param) => (
                        <SelectItem key={param.id} value={param.id.toString()}>
                          {param.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comparison Chart */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Evolução Comparativa</h4>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={comparisonData.session1.info.nome}
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey={comparisonData.session2.info.nome}
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Treatments Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Tratamentos Aplicados</h4>
                    <div className="space-y-2">
                      {comparisonData.session1.treatments.map((treatment, idx) => (
                        <div key={idx} className="text-sm p-2 bg-muted rounded">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTime(treatment.timestamp_simulacao)}
                          </span>
                          <p className="mt-1">{treatment.tratamentos?.nome}</p>
                        </div>
                      ))}
                      {comparisonData.session1.treatments.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum tratamento aplicado</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Tratamentos Aplicados</h4>
                    <div className="space-y-2">
                      {comparisonData.session2.treatments.map((treatment, idx) => (
                        <div key={idx} className="text-sm p-2 bg-muted rounded">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTime(treatment.timestamp_simulacao)}
                          </span>
                          <p className="mt-1">{treatment.tratamentos?.nome}</p>
                        </div>
                      ))}
                      {comparisonData.session2.treatments.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum tratamento aplicado</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
