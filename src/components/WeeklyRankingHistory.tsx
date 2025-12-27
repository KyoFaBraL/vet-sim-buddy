import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Trophy, Calendar, History } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RankingHistoryEntry {
  id: string;
  week_start: string;
  week_end: string;
  position: number;
  wins: number;
  total_sessions: number;
  points: number;
  win_rate: number;
}

export const WeeklyRankingHistory = () => {
  const [history, setHistory] = useState<RankingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Save current week's ranking first
      await saveCurrentWeekRanking(user.id);

      // Fetch history
      const { data, error } = await supabase
        .from("weekly_ranking_history")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching ranking history:", error);
      } else {
        setHistory(data || []);
      }
      
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const saveCurrentWeekRanking = async (currentUserId: string) => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Check if we already have an entry for this week
    const { data: existing } = await supabase
      .from("weekly_ranking_history")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("week_start", format(weekStart, "yyyy-MM-dd"))
      .single();

    // Get current week sessions
    const { data: sessions } = await supabase
      .from("simulation_sessions")
      .select("user_id, status, duracao_segundos")
      .gte("criado_em", weekStart.toISOString())
      .lte("criado_em", weekEnd.toISOString())
      .in("status", ["won", "lost"]);

    if (!sessions) return;

    // Calculate stats for all users
    const userStats: Record<string, { wins: number; total: number; points: number }> = {};
    
    sessions.forEach(session => {
      if (!userStats[session.user_id]) {
        userStats[session.user_id] = { wins: 0, total: 0, points: 0 };
      }
      userStats[session.user_id].total++;
      if (session.status === "won") {
        userStats[session.user_id].wins++;
        const basePoints = 100;
        const speedBonus = session.duracao_segundos && session.duracao_segundos < 300 ? 50 : 0;
        userStats[session.user_id].points += basePoints + speedBonus;
      }
    });

    // Calculate ranking
    const sortedUsers = Object.entries(userStats)
      .sort(([, a], [, b]) => b.points - a.points);
    
    const userPosition = sortedUsers.findIndex(([uid]) => uid === currentUserId) + 1;
    const myStats = userStats[currentUserId] || { wins: 0, total: 0, points: 0 };
    const winRate = myStats.total > 0 ? (myStats.wins / myStats.total) * 100 : 0;

    if (userPosition === 0 && myStats.total === 0) return;

    const historyData = {
      user_id: currentUserId,
      week_start: format(weekStart, "yyyy-MM-dd"),
      week_end: format(weekEnd, "yyyy-MM-dd"),
      position: userPosition || sortedUsers.length + 1,
      wins: myStats.wins,
      total_sessions: myStats.total,
      points: myStats.points,
      win_rate: winRate,
    };

    if (existing) {
      // Update existing entry
      await supabase
        .from("weekly_ranking_history")
        .update(historyData)
        .eq("id", existing.id);
    } else if (myStats.total > 0) {
      // Insert new entry
      await supabase
        .from("weekly_ranking_history")
        .insert(historyData);
    }
  };

  const getTrend = (index: number) => {
    if (index >= history.length - 1) return null;
    const current = history[index].position;
    const previous = history[index + 1].position;
    
    if (current < previous) return "up";
    if (current > previous) return "down";
    return "same";
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "same":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">🏆 1º</Badge>;
    }
    if (position === 2) {
      return <Badge className="bg-gray-400/20 text-gray-400 border-gray-400/30">🥈 2º</Badge>;
    }
    if (position === 3) {
      return <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">🥉 3º</Badge>;
    }
    if (position <= 10) {
      return <Badge variant="secondary">{position}º</Badge>;
    }
    return <Badge variant="outline">{position}º</Badge>;
  };

  // Prepare chart data (reversed for chronological order)
  const chartData = [...history].reverse().map(entry => ({
    week: format(new Date(entry.week_start), "dd/MM", { locale: ptBR }),
    position: entry.position,
    wins: entry.wins,
    points: entry.points,
  }));

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Carregando histórico...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Position Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução da Posição
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    reversed 
                    domain={[1, 'auto']}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'Posição', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'position') return [`${value}º`, 'Posição'];
                      return [value, name];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="position" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Dados insuficientes para o gráfico.</p>
              <p className="text-sm mt-1">Continue jogando para ver sua evolução!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum histórico de ranking ainda.</p>
              <p className="text-sm mt-1">Complete sessões para aparecer no ranking!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, index) => {
                const trend = getTrend(index);
                const isCurrentWeek = index === 0;
                
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCurrentWeek 
                        ? "bg-primary/10 border border-primary/30" 
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-shrink-0 w-20">
                      {getPositionBadge(entry.position)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(entry.week_start), "dd/MM", { locale: ptBR })} - {format(new Date(entry.week_end), "dd/MM", { locale: ptBR })}
                        </span>
                        {isCurrentWeek && (
                          <Badge variant="outline" className="text-xs">Semana Atual</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{entry.wins} vitórias</span>
                        <span>•</span>
                        <span>{entry.total_sessions} sessões</span>
                        <span>•</span>
                        <span>{entry.win_rate.toFixed(0)}% taxa</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend)}
                      <div className="text-right">
                        <div className="font-bold">{entry.points}</div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
