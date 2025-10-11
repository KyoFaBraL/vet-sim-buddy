import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Activity, 
  Award,
  BarChart3,
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PerformanceStats {
  totalSessions: number;
  completedSessions: number;
  successRate: number;
  averageTime: number;
  totalGoalsAchieved: number;
  totalPoints: number;
  averageTreatments: number;
  mostUsedTreatment: string | null;
  fastestSession: number | null;
  slowestSession: number | null;
}

interface PerformanceStatisticsProps {
  caseId: number | null;
}

export const PerformanceStatistics = ({ caseId }: PerformanceStatisticsProps) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "all">("30");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [caseId, timeRange]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calcular data de início baseada no timeRange
      let startDate = new Date();
      if (timeRange === "7") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === "30") {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate = new Date(0); // All time
      }

      // Query base para sessões
      let sessionsQuery = supabase
        .from("simulation_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("criado_em", startDate.toISOString());

      if (caseId) {
        sessionsQuery = sessionsQuery.eq("case_id", caseId);
      }

      const { data: sessions } = await sessionsQuery;

      if (!sessions || sessions.length === 0) {
        setStats({
          totalSessions: 0,
          completedSessions: 0,
          successRate: 0,
          averageTime: 0,
          totalGoalsAchieved: 0,
          totalPoints: 0,
          averageTreatments: 0,
          mostUsedTreatment: null,
          fastestSession: null,
          slowestSession: null,
        });
        setIsLoading(false);
        return;
      }

      // Calcular estatísticas de sessões
      const completedSessions = sessions.filter(s => s.status === "concluida").length;
      const totalTime = sessions.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0);
      const averageTime = sessions.length > 0 ? totalTime / sessions.length : 0;

      const times = sessions
        .map(s => s.duracao_segundos)
        .filter(t => t !== null)
        .sort((a, b) => (a || 0) - (b || 0));

      const fastestSession = times.length > 0 ? times[0] : null;
      const slowestSession = times.length > 0 ? times[times.length - 1] : null;

      // Buscar metas alcançadas
      const sessionIds = sessions.map(s => s.id);
      const { data: goalsAchieved } = await supabase
        .from("metas_alcancadas")
        .select("*")
        .in("session_id", sessionIds);

      const totalGoalsAchieved = goalsAchieved?.length || 0;
      const totalPoints = goalsAchieved?.reduce((acc, g) => acc + g.pontos_ganhos, 0) || 0;

      // Buscar tratamentos aplicados
      const { data: treatments } = await supabase
        .from("session_treatments")
        .select("*, tratamentos(*)")
        .in("session_id", sessionIds);

      const averageTreatments = sessions.length > 0 ? (treatments?.length || 0) / sessions.length : 0;

      // Encontrar tratamento mais usado
      const treatmentCounts = treatments?.reduce((acc, t) => {
        const name = t.tratamentos?.nome || "Desconhecido";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const mostUsedTreatment = Object.entries(treatmentCounts).length > 0
        ? Object.entries(treatmentCounts).sort((a, b) => b[1] - a[1])[0][0]
        : null;

      // Calcular taxa de sucesso (sessões com metas alcançadas / total de sessões)
      const sessionsWithGoals = new Set(goalsAchieved?.map(g => g.session_id) || []);
      const successRate = sessions.length > 0 ? (sessionsWithGoals.size / sessions.length) * 100 : 0;

      setStats({
        totalSessions: sessions.length,
        completedSessions,
        successRate,
        averageTime,
        totalGoalsAchieved,
        totalPoints,
        averageTreatments,
        mostUsedTreatment,
        fastestSession,
        slowestSession,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
          <p className="text-sm">Carregando estatísticas...</p>
        </div>
      </Card>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma estatística disponível</p>
          <p className="text-xs mt-1">Complete algumas simulações para ver suas estatísticas</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Estatísticas de Performance</h3>
          </div>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Sessões</span>
            </div>
            <div className="text-3xl font-bold text-primary">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedSessions} concluídas
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-muted-foreground">Taxa de Sucesso</span>
            </div>
            <div className="text-3xl font-bold text-success">
              {stats.successRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              com metas alcançadas
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Tempo Médio</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">
              {formatTime(Math.round(stats.averageTime))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              por simulação
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Pontos Totais</span>
            </div>
            <div className="text-3xl font-bold text-amber-500">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalGoalsAchieved} metas alcançadas
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Decisões Clínicas
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Média de tratamentos:</span>
                <span className="font-semibold">{stats.averageTreatments.toFixed(1)}</span>
              </div>
              {stats.mostUsedTreatment && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mais usado:</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.mostUsedTreatment}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tempos de Simulação
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mais rápida:</span>
                <span className="font-semibold font-mono text-success">
                  {formatTime(stats.fastestSession)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mais lenta:</span>
                <span className="font-semibold font-mono text-muted-foreground">
                  {formatTime(stats.slowestSession)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>
            📊 As estatísticas são calculadas automaticamente com base em suas sessões salvas
          </p>
        </div>
      </div>
    </Card>
  );
};
