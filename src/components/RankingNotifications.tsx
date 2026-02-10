import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, TrendingDown, TrendingUp, Award } from "lucide-react";

interface RankingEntry {
  userId: string;
  userName: string;
  wins: number;
  rank: number;
}

interface RankingNotificationsProps {
  enabled?: boolean;
}

export const RankingNotifications = ({ enabled = true }: RankingNotificationsProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [previousRankings, setPreviousRankings] = useState<Map<string, number>>(new Map());
  const { toast } = useToast();

  const calculateRankings = useCallback(async (): Promise<RankingEntry[]> => {
    try {
      const { data: sessions } = await supabase
        .from("simulation_sessions")
        .select("user_id, status");

      if (!sessions) return [];

      const { data: profiles } = await supabase
        .from("student_profiles_safe")
        .select("id, nome_completo");

      // Aggregate wins by user
      const userWins: Record<string, number> = {};
      sessions.forEach(session => {
        if (session.status === 'won') {
          userWins[session.user_id] = (userWins[session.user_id] || 0) + 1;
        }
      });

      // Create ranking entries
      const entries: RankingEntry[] = Object.entries(userWins)
        .map(([userId, wins]) => ({
          userId,
          userName: profiles?.find(p => p.id === userId)?.nome_completo || "Usuário",
          wins,
          rank: 0,
        }))
        .sort((a, b) => b.wins - a.wins);

      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    } catch (error) {
      console.error("Error calculating rankings:", error);
      return [];
    }
  }, []);

  const checkForRankingChanges = useCallback(async () => {
    if (!currentUserId || !enabled) return;

    const rankings = await calculateRankings();
    const currentUserRanking = rankings.find(r => r.userId === currentUserId);
    
    if (!currentUserRanking) return;

    const currentRank = currentUserRanking.rank;

    // Check if user's rank changed
    if (previousRank !== null && currentRank !== previousRank) {
      if (currentRank < previousRank) {
        // User moved up
        toast({
          title: "🎉 Você subiu no ranking!",
          description: `Você passou da posição #${previousRank} para #${currentRank}!`,
          duration: 5000,
        });

        // Check for special achievements
        if (currentRank === 1) {
          toast({
            title: "👑 Você é o número 1!",
            description: "Parabéns! Você conquistou o topo do ranking!",
            duration: 8000,
          });
        } else if (currentRank <= 3 && previousRank > 3) {
          toast({
            title: "🥇 Pódio conquistado!",
            description: "Você entrou para o top 3 do ranking!",
            duration: 6000,
          });
        } else if (currentRank <= 10 && previousRank > 10) {
          toast({
            title: "🏆 Top 10!",
            description: "Você entrou para a elite do ranking!",
            duration: 5000,
          });
        }
      } else {
        // User moved down - check if someone overtook them
        const newRankingsMap = new Map(rankings.map(r => [r.userId, r.rank]));
        
        // Find who passed the user
        for (const [userId, oldRank] of previousRankings) {
          const newRank = newRankingsMap.get(userId);
          if (newRank && oldRank > previousRank && newRank < currentRank) {
            const overtaker = rankings.find(r => r.userId === userId);
            if (overtaker && overtaker.userId !== currentUserId) {
              toast({
                title: "📊 Mudança no ranking",
                description: `${overtaker.userName} passou você no ranking. Você agora está em #${currentRank}.`,
                duration: 5000,
              });
              break;
            }
          }
        }
      }
    }

    setPreviousRank(currentRank);
    setPreviousRankings(new Map(rankings.map(r => [r.userId, r.rank])));
  }, [currentUserId, previousRank, previousRankings, calculateRankings, toast, enabled]);

  // Initialize user and rankings
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Get initial rankings
        const rankings = await calculateRankings();
        const userRanking = rankings.find(r => r.userId === user.id);
        if (userRanking) {
          setPreviousRank(userRanking.rank);
          setPreviousRankings(new Map(rankings.map(r => [r.userId, r.rank])));
        }
      }
    };
    
    initUser();
  }, [calculateRankings]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('ranking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulation_sessions'
        },
        (payload) => {
          console.log('Session change detected:', payload);
          // Delay check to allow database to be consistent
          setTimeout(() => {
            checkForRankingChanges();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, checkForRankingChanges]);

  // This component doesn't render anything visible
  return null;
};
