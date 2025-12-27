import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  XCircle, 
  Target, 
  TrendingUp,
  Award,
  Flame,
  Clock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WinLossData {
  totalSessions: number;
  wonSessions: number;
  lostSessions: number;
  inProgressSessions: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  averageWinTime: number | null;
  recentResults: ('won' | 'lost' | 'em_andamento')[];
}

interface WinLossStatsProps {
  caseId?: number | null;
}

export const WinLossStats = ({ caseId }: WinLossStatsProps) => {
  const [stats, setStats] = useState<WinLossData | null>(null);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "all">("30");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [caseId, timeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate = new Date();
      if (timeRange === "7") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === "30") {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate = new Date(0);
      }

      let query = supabase
        .from("simulation_sessions")
        .select("id, status, duracao_segundos, criado_em")
        .eq("user_id", user.id)
        .gte("criado_em", startDate.toISOString())
        .order("criado_em", { ascending: false });

      if (caseId) {
        query = query.eq("case_id", caseId);
      }

      const { data: sessions } = await query;

      if (!sessions || sessions.length === 0) {
        setStats({
          totalSessions: 0,
          wonSessions: 0,
          lostSessions: 0,
          inProgressSessions: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          averageWinTime: null,
          recentResults: [],
        });
        setIsLoading(false);
        return;
      }

      const wonSessions = sessions.filter(s => s.status === 'won').length;
      const lostSessions = sessions.filter(s => s.status === 'lost').length;
      const inProgressSessions = sessions.filter(s => s.status === 'em_andamento').length;
      const completedSessions = wonSessions + lostSessions;
      const winRate = completedSessions > 0 ? (wonSessions / completedSessions) * 100 : 0;

      // Calculate win times
      const winTimes = sessions
        .filter(s => s.status === 'won' && s.duracao_segundos)
        .map(s => s.duracao_segundos!);
      const averageWinTime = winTimes.length > 0 
        ? winTimes.reduce((a, b) => a + b, 0) / winTimes.length 
        : null;

      // Calculate streaks
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      for (const session of sessions) {
        if (session.status === 'won') {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else if (session.status === 'lost') {
          tempStreak = 0;
        }
      }

      // Current streak (from most recent)
      for (const session of sessions) {
        if (session.status === 'won') {
          currentStreak++;
        } else if (session.status === 'lost') {
          break;
        }
      }

      // Recent results (last 10)
      const recentResults = sessions
        .slice(0, 10)
        .map(s => s.status as 'won' | 'lost' | 'em_andamento');

      setStats({
        totalSessions: sessions.length,
        wonSessions,
        lostSessions,
        inProgressSessions,
        winRate,
        currentStreak,
        bestStreak,
        averageWinTime,
        recentResults,
      });
    } catch (error) {
      console.error("Error loading win/loss stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
          <p className="text-sm">Carregando estatísticas...</p>
        </div>
      </Card>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma sessão registrada</p>
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
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Vitórias e Derrotas</h3>
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

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Vitórias</span>
            </div>
            <div className="text-3xl font-bold text-emerald-500">{stats.wonSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pacientes salvos
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-muted-foreground">Derrotas</span>
            </div>
            <div className="text-3xl font-bold text-red-500">{stats.lostSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pacientes perdidos
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Taxa de Vitória</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {stats.winRate.toFixed(0)}%
            </div>
            <Progress value={stats.winRate} className="h-1.5 mt-2" />
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Sequência</span>
            </div>
            <div className="text-3xl font-bold text-amber-500">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">
              recorde: {stats.bestStreak} 🏆
            </p>
          </div>
        </div>

        {/* Recent Results */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Últimas Simulações
          </h4>
          <div className="flex gap-2 flex-wrap">
            {stats.recentResults.map((result, index) => (
              <Badge 
                key={index}
                variant={result === 'won' ? 'default' : result === 'lost' ? 'destructive' : 'secondary'}
                className={`${
                  result === 'won' 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : result === 'lost'
                    ? ''
                    : ''
                }`}
              >
                {result === 'won' ? '✓ Vitória' : result === 'lost' ? '✗ Derrota' : '⏳ Em andamento'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Tempo Médio de Vitória</p>
                <p className="text-xl font-bold font-mono">{formatTime(stats.averageWinTime)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total de Sessões</p>
                <p className="text-xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
