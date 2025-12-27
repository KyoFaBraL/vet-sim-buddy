import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAchievementAnimation } from "@/hooks/useAchievementAnimation";

interface BadgeCriteria {
  type: string;
  position?: number;
  count?: number;
  rate?: number;
  min_sessions?: number;
}

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  tipo: string;
  criterio: BadgeCriteria;
}

export const useRankingBadges = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { celebrateAchievement } = useAchievementAnimation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const checkAndAwardBadges = useCallback(async () => {
    if (!userId) return;

    try {
      // Get all ranking/streak/milestone badges
      const { data: badges } = await supabase
        .from("badges")
        .select("*")
        .in("tipo", ["ranking", "streak", "milestone", "performance"]);

      if (!badges) return;

      // Get user's already earned badges
      const { data: earnedBadges } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);

      const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

      // Get user's session stats
      const { data: sessions } = await supabase
        .from("simulation_sessions")
        .select("status, criado_em")
        .eq("user_id", userId)
        .order("criado_em", { ascending: false });

      if (!sessions) return;

      const wonSessions = sessions.filter(s => s.status === 'won').length;
      const lostSessions = sessions.filter(s => s.status === 'lost').length;
      const totalCompleted = wonSessions + lostSessions;
      const winRate = totalCompleted > 0 ? (wonSessions / totalCompleted) * 100 : 0;

      // Calculate current streak
      let currentStreak = 0;
      for (const session of sessions) {
        if (session.status === 'won') {
          currentStreak++;
        } else if (session.status === 'lost') {
          break;
        }
      }

      // Calculate best streak
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

      // Get ranking position
      const { data: allSessions } = await supabase
        .from("simulation_sessions")
        .select("user_id, status");

      const userWins: Record<string, number> = {};
      allSessions?.forEach(session => {
        if (session.status === 'won') {
          userWins[session.user_id] = (userWins[session.user_id] || 0) + 1;
        }
      });

      const sortedUsers = Object.entries(userWins)
        .sort(([, a], [, b]) => b - a);
      
      const rankingPosition = sortedUsers.findIndex(([uid]) => uid === userId) + 1;

      // Check each badge
      for (const badge of badges) {
        if (earnedBadgeIds.has(badge.id)) continue;

        const criterio = badge.criterio as unknown as BadgeCriteria;
        let shouldAward = false;

        switch (criterio.type) {
          case 'ranking_position':
            shouldAward = rankingPosition > 0 && rankingPosition <= (criterio.position || 0);
            break;
          case 'win_streak':
            shouldAward = bestStreak >= (criterio.count || 0);
            break;
          case 'total_wins':
            shouldAward = wonSessions >= (criterio.count || 0);
            break;
          case 'win_rate':
            shouldAward = winRate >= (criterio.rate || 0) && 
                         totalCompleted >= (criterio.min_sessions || 0);
            break;
        }

        if (shouldAward) {
          // Award badge
          const { error } = await supabase
            .from("user_badges")
            .insert({
              user_id: userId,
              badge_id: badge.id,
            });

          if (!error) {
            // Trigger celebration animation
            celebrateAchievement('badge');
            
            toast({
              title: `${badge.icone} Nova conquista desbloqueada!`,
              description: `${badge.nome}: ${badge.descricao}`,
              duration: 6000,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  }, [userId, toast, celebrateAchievement]);

  return { checkAndAwardBadges };
};
