import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Calendar, Clock, Flame } from "lucide-react";
import { startOfWeek, endOfWeek, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyPlayer {
  user_id: string;
  nome: string;
  wins: number;
  totalSessions: number;
  winRate: number;
  points: number;
}

export const WeeklyLeaderboard = () => {
  const [players, setPlayers] = useState<WeeklyPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekEnd, setWeekEnd] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    const now = new Date();
    setWeekStart(startOfWeek(now, { weekStartsOn: 1 }));
    setWeekEnd(endOfWeek(now, { weekStartsOn: 1 }));
  }, []);

  useEffect(() => {
    const fetchWeeklyRanking = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Get sessions from current week only
      const { data: sessions } = await supabase
        .from("simulation_sessions")
        .select("user_id, status, duracao_segundos")
        .gte("criado_em", weekStart.toISOString())
        .lte("criado_em", weekEnd.toISOString())
        .in("status", ["won", "lost"]);

      if (!sessions) {
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(sessions.map(s => s.user_id))];

      // Get profiles for these users (via safe view, no email exposed)
      const { data: profiles } = await supabase
        .from("student_profiles_safe")
        .select("id, nome_completo")
        .in("id", userIds);

      // Calculate weekly stats per user
      const userStats: Record<string, { wins: number; total: number; points: number }> = {};
      
      sessions.forEach(session => {
        if (!userStats[session.user_id]) {
          userStats[session.user_id] = { wins: 0, total: 0, points: 0 };
        }
        userStats[session.user_id].total++;
        if (session.status === "won") {
          userStats[session.user_id].wins++;
          // Points based on speed bonus
          const basePoints = 100;
          const speedBonus = session.duracao_segundos && session.duracao_segundos < 300 ? 50 : 0;
          userStats[session.user_id].points += basePoints + speedBonus;
        }
      });

      // Build ranking
      const ranking: WeeklyPlayer[] = Object.entries(userStats)
        .map(([userId, stats]) => {
          const profile = profiles?.find(p => p.id === userId);
          return {
            user_id: userId,
            nome: profile?.nome_completo || "Estudante",
            wins: stats.wins,
            totalSessions: stats.total,
            winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
            points: stats.points,
          };
        })
        .sort((a, b) => b.points - a.points);

      setPlayers(ranking);
      setLoading(false);
    };

    fetchWeeklyRanking();

    // Listen for real-time updates
    const channel = supabase
      .channel('weekly-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulation_sessions'
        },
        () => {
          fetchWeeklyRanking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weekStart, weekEnd]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{position}</span>;
    }
  };

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">🏆 Campeão da Semana</Badge>;
      case 2:
        return <Badge className="bg-gray-400/20 text-gray-400 border-gray-400/30">🥈 Vice-Campeão</Badge>;
      case 3:
        return <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">🥉 Bronze</Badge>;
      default:
        return null;
    }
  };

  const daysUntilReset = () => {
    const now = new Date();
    const nextMonday = new Date(weekEnd);
    nextMonday.setDate(nextMonday.getDate() + 1);
    return Math.max(0, differenceInDays(nextMonday, now));
  };

  const currentUserRank = players.findIndex(p => p.user_id === currentUserId) + 1;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Carregando leaderboard semanal...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Flame className="h-6 w-6 text-orange-500" />
            Leaderboard Semanal
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Reset em {daysUntilReset()} dias
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
        </div>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma sessão completada esta semana ainda.</p>
            <p className="text-sm mt-1">Seja o primeiro a conquistar o topo!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.slice(0, 10).map((player, index) => {
              const position = index + 1;
              const isCurrentUser = player.user_id === currentUserId;
              
              return (
                <div
                  key={player.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrentUser 
                      ? "bg-primary/10 border border-primary/30 shadow-sm" 
                      : position <= 3 
                        ? "bg-muted/50" 
                        : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(position)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isCurrentUser ? "text-primary" : ""}`}>
                        {player.nome}
                        {isCurrentUser && " (Você)"}
                      </span>
                      {getRankBadge(position)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{player.wins} vitórias</span>
                      <span>•</span>
                      <span>{player.winRate.toFixed(0)}% taxa</span>
                      <span>•</span>
                      <span>{player.totalSessions} sessões</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="font-bold text-lg">{player.points}</div>
                    <div className="text-xs text-muted-foreground">pontos</div>
                  </div>
                </div>
              );
            })}

            {currentUserRank > 10 && (
              <>
                <div className="text-center py-2 text-muted-foreground">• • •</div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex-shrink-0">
                    <span className="w-6 h-6 flex items-center justify-center text-primary font-bold">
                      {currentUserRank}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-primary">
                      {players[currentUserRank - 1]?.nome} (Você)
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{players[currentUserRank - 1]?.wins} vitórias</span>
                      <span>•</span>
                      <span>{players[currentUserRank - 1]?.winRate.toFixed(0)}% taxa</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-bold text-lg">{players[currentUserRank - 1]?.points}</div>
                    <div className="text-xs text-muted-foreground">pontos</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
