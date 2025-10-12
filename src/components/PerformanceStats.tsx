import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Clock, Target, Award, Pill, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PerformanceStatsProps {
  caseId?: number;
}

interface Stats {
  totalSessions: number;
  successRate: number;
  averageTime: number;
  fastestSession: number;
  slowestSession: number;
  totalGoals: number;
  totalPoints: number;
  averageTreatments: number;
  mostUsedTreatment: { nome: string; count: number } | null;
}

export const PerformanceStats = ({ caseId }: PerformanceStatsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeRange, setTimeRange] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [caseId, timeRange]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Build query with time range filter
      let query = supabase
        .from("simulation_sessions")
        .select("*")
        .eq("user_id", user.user.id);

      if (caseId) {
        query = query.eq("case_id", caseId);
      }

      // Apply time range
      if (timeRange !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        query = query.gte("criado_em", startDate.toISOString());
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Calculate statistics
      const completedSessions = sessions.filter(s => s.status === "concluida" || s.status === "won");
      const successRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

      const durations = sessions
        .filter(s => s.duracao_segundos)
        .map(s => s.duracao_segundos);

      const averageTime = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;

      const fastestSession = durations.length > 0 ? Math.min(...durations) : 0;
      const slowestSession = durations.length > 0 ? Math.max(...durations) : 0;

      // Get goals achieved
      const { data: goalsData } = await supabase
        .from("metas_alcancadas")
        .select("*")
        .eq("user_id", user.user.id)
        .in("session_id", sessions.map(s => s.id));

      const totalGoals = goalsData?.length || 0;
      const totalPoints = goalsData?.reduce((sum, goal) => sum + (goal.pontos_ganhos || 0), 0) || 0;

      // Get treatment statistics
      const { data: treatmentsData } = await supabase
        .from("session_treatments")
        .select("tratamento_id")
        .in("session_id", sessions.map(s => s.id));

      const averageTreatments = sessions.length > 0 
        ? (treatmentsData?.length || 0) / sessions.length 
        : 0;

      // Find most used treatment
      let mostUsedTreatment = null;
      if (treatmentsData && treatmentsData.length > 0) {
        const treatmentCounts = treatmentsData.reduce((acc, t) => {
          acc[t.tratamento_id] = (acc[t.tratamento_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const mostUsedId = Object.entries(treatmentCounts)
          .sort(([, a], [, b]) => b - a)[0];

        if (mostUsedId) {
          const { data: treatmentData } = await supabase
            .from("tratamentos")
            .select("nome")
            .eq("id", parseInt(mostUsedId[0]))
            .single();

          mostUsedTreatment = {
            nome: treatmentData?.nome || "Desconhecido",
            count: mostUsedId[1]
          };
        }
      }

      setStats({
        totalSessions: sessions.length,
        successRate,
        averageTime,
        fastestSession,
        slowestSession,
        totalGoals,
        totalPoints,
        averageTreatments,
        mostUsedTreatment
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Carregando estatísticas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma sessão encontrada para o período selecionado.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estatísticas de Performance</CardTitle>
            <CardDescription>Análise do seu desempenho nas simulações</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Sessions */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Total de Sessões</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </div>

          {/* Success Rate */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Taxa de Sucesso</span>
            </div>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
          </div>

          {/* Average Time */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tempo Médio</span>
            </div>
            <div className="text-2xl font-bold">{formatTime(stats.averageTime)}</div>
          </div>

          {/* Total Goals */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-sm">Metas Alcançadas</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
          </div>

          {/* Total Points */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-sm">Pontos Totais</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </div>

          {/* Average Treatments */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Pill className="h-4 w-4" />
              <span className="text-sm">Tratamentos/Sessão</span>
            </div>
            <div className="text-2xl font-bold">{stats.averageTreatments.toFixed(1)}</div>
          </div>

          {/* Fastest Session */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Sessão Mais Rápida</span>
            </div>
            <div className="text-2xl font-bold">{formatTime(stats.fastestSession)}</div>
          </div>

          {/* Slowest Session */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Sessão Mais Longa</span>
            </div>
            <div className="text-2xl font-bold">{formatTime(stats.slowestSession)}</div>
          </div>
        </div>

        {/* Most Used Treatment */}
        {stats.mostUsedTreatment && (
          <div className="mt-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Tratamento Mais Utilizado</span>
              </div>
              <Badge variant="secondary">
                {stats.mostUsedTreatment.nome} ({stats.mostUsedTreatment.count}x)
              </Badge>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Dados calculados com base nas sessões do período selecionado
        </div>
      </CardContent>
    </Card>
  );
};
