import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RankingEntry {
  userId: string;
  userName: string;
  wins: number;
  losses: number;
  winRate: number;
  totalPoints: number;
  totalSessions: number;
  averageTime: number | null;
  rank: number;
}

interface StudentRankingProps {
  showCurrentUser?: boolean;
}

export const StudentRanking = ({ showCurrentUser = true }: StudentRankingProps) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<RankingEntry | null>(null);
  const [sortBy, setSortBy] = useState<"wins" | "winRate" | "points">("wins");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadRankings();
  }, [sortBy]);

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // Get all sessions grouped by user
      const { data: sessions } = await supabase
        .from("simulation_sessions")
        .select("user_id, status, duracao_segundos");

      if (!sessions) {
        setIsLoading(false);
        return;
      }

      // Get all user profiles (via safe view, no email exposed)
      const { data: profiles } = await supabase
        .from("student_profiles_safe")
        .select("id, nome_completo");

      // Get all goals achieved
      const { data: goalsAchieved } = await supabase
        .from("metas_alcancadas")
        .select("user_id, pontos_ganhos");

      // Aggregate data by user
      const userStats: Record<string, {
        wins: number;
        losses: number;
        totalSessions: number;
        totalTime: number;
        completedSessions: number;
      }> = {};

      sessions.forEach(session => {
        if (!userStats[session.user_id]) {
          userStats[session.user_id] = {
            wins: 0,
            losses: 0,
            totalSessions: 0,
            totalTime: 0,
            completedSessions: 0,
          };
        }
        
        userStats[session.user_id].totalSessions++;
        
        if (session.status === 'won') {
          userStats[session.user_id].wins++;
          userStats[session.user_id].completedSessions++;
          if (session.duracao_segundos) {
            userStats[session.user_id].totalTime += session.duracao_segundos;
          }
        } else if (session.status === 'lost') {
          userStats[session.user_id].losses++;
          userStats[session.user_id].completedSessions++;
        }
      });

      // Aggregate points by user
      const userPoints: Record<string, number> = {};
      goalsAchieved?.forEach(goal => {
        if (!userPoints[goal.user_id]) {
          userPoints[goal.user_id] = 0;
        }
        userPoints[goal.user_id] += goal.pontos_ganhos;
      });

      // Create ranking entries
      const rankingEntries: RankingEntry[] = Object.entries(userStats)
        .filter(([_, stats]) => stats.completedSessions > 0) // Only users with completed sessions
        .map(([userId, stats]) => {
          const profile = profiles?.find(p => p.id === userId);
          const winRate = stats.completedSessions > 0 
            ? (stats.wins / stats.completedSessions) * 100 
            : 0;
          const averageTime = stats.wins > 0 
            ? stats.totalTime / stats.wins 
            : null;

          return {
            userId,
            userName: profile?.nome_completo || "Usuário Anônimo",
            wins: stats.wins,
            losses: stats.losses,
            winRate,
            totalPoints: userPoints[userId] || 0,
            totalSessions: stats.totalSessions,
            averageTime,
            rank: 0,
          };
        });

      // Sort rankings
      rankingEntries.sort((a, b) => {
        if (sortBy === "wins") return b.wins - a.wins;
        if (sortBy === "winRate") return b.winRate - a.winRate;
        return b.totalPoints - a.totalPoints;
      });

      // Assign ranks
      rankingEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Find current user's rank
      const userRank = rankingEntries.find(e => e.userId === user.id);
      setCurrentUserRank(userRank || null);

      // Get top 10
      setRankings(rankingEntries.slice(0, 10));
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
          <p className="text-sm">Carregando ranking...</p>
        </div>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum ranking disponível</p>
          <p className="text-xs mt-1">Complete simulações para aparecer no ranking</p>
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
            <h3 className="text-lg font-semibold">Ranking de Alunos</h3>
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wins">Por Vitórias</SelectItem>
              <SelectItem value="winRate">Por Taxa de Vitória</SelectItem>
              <SelectItem value="points">Por Pontos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current User Position */}
        {showCurrentUser && currentUserRank && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sua Posição</p>
                  <p className="text-2xl font-bold text-primary">#{currentUserRank.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {currentUserRank.wins} vitórias • {currentUserRank.winRate.toFixed(0)}%
                </p>
                <p className="text-sm font-medium">{currentUserRank.totalPoints} pts</p>
              </div>
            </div>
          </Card>
        )}

        {/* Ranking List */}
        <div className="space-y-3">
          {rankings.map((entry) => (
            <div 
              key={entry.userId}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.userId === currentUserId 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-muted/30 hover:bg-muted/50'
              } ${entry.rank <= 3 ? getRankBadgeColor(entry.rank) : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={entry.rank <= 3 ? 'bg-white/20 text-inherit' : ''}>
                    {getInitials(entry.userName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`font-medium ${entry.rank <= 3 ? '' : ''}`}>
                    {entry.userName}
                    {entry.userId === currentUserId && (
                      <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                    )}
                  </p>
                  <p className={`text-xs ${entry.rank <= 3 ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {entry.totalSessions} sessões
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className={`text-lg font-bold ${entry.rank <= 3 ? '' : 'text-emerald-500'}`}>
                      {entry.wins}
                    </p>
                    <p className={`text-xs ${entry.rank <= 3 ? 'opacity-80' : 'text-muted-foreground'}`}>
                      vitórias
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${entry.rank <= 3 ? '' : 'text-primary'}`}>
                      {entry.winRate.toFixed(0)}%
                    </p>
                    <p className={`text-xs ${entry.rank <= 3 ? 'opacity-80' : 'text-muted-foreground'}`}>
                      taxa
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${entry.rank <= 3 ? '' : 'text-amber-500'}`}>
                      {entry.totalPoints}
                    </p>
                    <p className={`text-xs ${entry.rank <= 3 ? 'opacity-80' : 'text-muted-foreground'}`}>
                      pts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-3 w-3" />
          <p>Ranking atualizado em tempo real com base nas sessões completadas</p>
        </div>
      </div>
    </Card>
  );
};
