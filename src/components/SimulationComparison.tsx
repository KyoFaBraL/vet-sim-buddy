import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GitCompare, Clock, Target, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Parameter {
  id: number;
  nome: string;
  unidade?: string;
}

interface Session {
  id: string;
  nome: string;
  criado_em: string;
  duracao_segundos: number;
  status: string;
}

interface SessionHistory {
  timestamp: number;
  parametro_id: number;
  valor: number;
}

interface SessionTreatment {
  tratamento_id: number;
  timestamp_simulacao: number;
  aplicado_em: string;
}

interface ComparisonData {
  session1: {
    info: Session;
    history: SessionHistory[];
    treatments: SessionTreatment[];
  };
  session2: {
    info: Session;
    history: SessionHistory[];
    treatments: SessionTreatment[];
  };
}

interface SimulationComparisonProps {
  caseId: number;
  parameters: Parameter[];
}

export const SimulationComparison = ({ caseId, parameters }: SimulationComparisonProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession1, setSelectedSession1] = useState<string>("");
  const [selectedSession2, setSelectedSession2] = useState<string>("");
  const [selectedParameter, setSelectedParameter] = useState<number>(1);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [treatments, setTreatments] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      loadTreatments();
    }
  }, [isOpen, caseId]);

  const loadTreatments = async () => {
    const { data } = await supabase
      .from("tratamentos")
      .select("*");
    
    if (data) {
      setTreatments(data);
    }
  };

  const loadSessions = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data, error } = await supabase
      .from("simulation_sessions")
      .select("*")
      .eq("user_id", user.user.id)
      .eq("case_id", caseId)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar sessões:", error);
      return;
    }

    setSessions(data || []);
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

    const { data: treatmentsData } = await supabase
      .from("session_treatments")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp_simulacao");

    return {
      info: sessionInfo,
      history: history || [],
      treatments: treatmentsData || []
    };
  };

  const compareSimulations = async () => {
    if (!selectedSession1 || !selectedSession2) return;

    const session1Data = await loadSessionData(selectedSession1);
    const session2Data = await loadSessionData(selectedSession2);

    setComparisonData({
      session1: session1Data,
      session2: session2Data
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getChartData = () => {
    if (!comparisonData) return [];

    const data1 = comparisonData.session1.history
      .filter(h => h.parametro_id === selectedParameter)
      .map(h => ({ timestamp: h.timestamp, valor1: h.valor }));

    const data2 = comparisonData.session2.history
      .filter(h => h.parametro_id === selectedParameter)
      .map(h => ({ timestamp: h.timestamp, valor2: h.valor }));

    const allTimestamps = [...new Set([...data1.map(d => d.timestamp), ...data2.map(d => d.timestamp)])].sort((a, b) => a - b);

    return allTimestamps.map(timestamp => {
      const point1 = data1.find(d => d.timestamp === timestamp);
      const point2 = data2.find(d => d.timestamp === timestamp);

      return {
        timestamp,
        valor1: point1?.valor1,
        valor2: point2?.valor2
      };
    });
  };

  const getTreatmentName = (treatmentId: number) => {
    return treatments.find(t => t.id === treatmentId)?.nome || `Tratamento ${treatmentId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitCompare className="h-4 w-4" />
          Comparar Simulações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparação de Simulações</DialogTitle>
          <DialogDescription>
            Compare duas sessões diferentes para analisar diferentes abordagens ao mesmo caso
          </DialogDescription>
        </DialogHeader>

        {sessions.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground">
            É necessário ter pelo menos 2 sessões salvas para fazer comparações.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sessão 1</label>
                <Select value={selectedSession1} onValueChange={setSelectedSession1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a primeira sessão" />
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

              <div>
                <label className="text-sm font-medium mb-2 block">Sessão 2</label>
                <Select value={selectedSession2} onValueChange={setSelectedSession2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a segunda sessão" />
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

            <Button onClick={compareSimulations} disabled={!selectedSession1 || !selectedSession2} className="w-full">
              Comparar Sessões
            </Button>

            {comparisonData && (
              <div className="space-y-6">
                {/* Session Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Sessão 1: {comparisonData.session1.info.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Duração: {formatTime(comparisonData.session1.info.duracao_segundos || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={comparisonData.session1.info.status === 'concluida' ? 'default' : 'secondary'}>
                          {comparisonData.session1.info.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span>{comparisonData.session1.treatments.length} tratamentos</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Sessão 2: {comparisonData.session2.info.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Duração: {formatTime(comparisonData.session2.info.duracao_segundos || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={comparisonData.session2.info.status === 'concluida' ? 'default' : 'secondary'}>
                          {comparisonData.session2.info.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span>{comparisonData.session2.treatments.length} tratamentos</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Parameter Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Parâmetro para Comparação</label>
                  <Select value={selectedParameter.toString()} onValueChange={(v) => setSelectedParameter(parseInt(v))}>
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

                {/* Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução do Parâmetro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          label={{ value: 'Tempo (s)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: parameters.find(p => p.id === selectedParameter)?.unidade || '', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="valor1" 
                          stroke="#8884d8" 
                          name={comparisonData.session1.info.nome}
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="valor2" 
                          stroke="#82ca9d" 
                          name={comparisonData.session2.info.nome}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Treatments Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tratamentos Aplicados - Sessão 1</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {comparisonData.session1.treatments.map((treatment, idx) => (
                          <div key={idx} className="text-sm flex justify-between items-center border-b pb-2">
                            <span>{getTreatmentName(treatment.tratamento_id)}</span>
                            <Badge variant="outline">{treatment.timestamp_simulacao}s</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tratamentos Aplicados - Sessão 2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {comparisonData.session2.treatments.map((treatment, idx) => (
                          <div key={idx} className="text-sm flex justify-between items-center border-b pb-2">
                            <span>{getTreatmentName(treatment.tratamento_id)}</span>
                            <Badge variant="outline">{treatment.timestamp_simulacao}s</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
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
