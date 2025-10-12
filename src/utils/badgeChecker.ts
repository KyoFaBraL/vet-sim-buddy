import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CheckBadgeParams {
  sessionId: string;
  userId: string;
  sessionData: {
    status: string;
    duracao_segundos: number;
    case_id: number;
  };
  usedHints: boolean;
  minHp: number;
  goalsAchieved: number;
  totalGoals: number;
}

export const checkAndAwardBadges = async (params: CheckBadgeParams) => {
  const { sessionId, userId, sessionData, usedHints, minHp, goalsAchieved, totalGoals } = params;

  try {
    // Carregar todos os badges disponíveis
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*');

    if (!allBadges) return;

    // Carregar badges já conquistados pelo usuário
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const conqueredBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    // Carregar estatísticas do usuário
    const { data: sessions } = await supabase
      .from('simulation_sessions')
      .select('*')
      .eq('user_id', userId);

    const totalSessions = sessions?.length || 0;
    const victorySessions = sessions?.filter(s => s.status === 'won' || s.status === 'vitoria').length || 0;
    const uniqueCases = new Set(sessions?.map(s => s.case_id) || []);

    // Verificar cada badge
    for (const badge of allBadges) {
      // Pular se já conquistado
      if (conqueredBadgeIds.has(badge.id)) continue;

      const criterio = badge.criterio as any;
      let shouldAward = false;

      switch (criterio.tipo) {
        case 'primeira_vitoria':
          shouldAward = (sessionData.status === 'won' || sessionData.status === 'vitoria') && victorySessions === 1;
          break;

        case 'sem_dicas':
          shouldAward = (sessionData.status === 'won' || sessionData.status === 'vitoria') && !usedHints;
          break;

        case 'tempo_recorde':
          shouldAward = (sessionData.status === 'won' || sessionData.status === 'vitoria') && 
                       sessionData.duracao_segundos <= criterio.tempo_maximo;
          break;

        case 'todas_metas':
          shouldAward = (sessionData.status === 'won' || sessionData.status === 'vitoria') && 
                       goalsAchieved === totalGoals && totalGoals > 0;
          break;

        case 'total_sessoes':
          shouldAward = totalSessions >= criterio.quantidade;
          break;

        case 'hp_alto':
          shouldAward = (sessionData.status === 'won' || sessionData.status === 'vitoria') && minHp >= criterio.hp_minimo;
          break;

        case 'casos_diferentes':
          shouldAward = uniqueCases.size >= criterio.quantidade;
          break;
      }

      if (shouldAward) {
        // Conceder badge
        const { error } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            session_id: sessionId
          });

        if (!error) {
          // Notificar usuário
          toast({
            title: "🏆 Nova Conquista!",
            description: `Você desbloqueou: ${badge.nome}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar badges:', error);
  }
};
