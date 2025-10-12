import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Award, Zap, Target, Heart, Shield, Compass, Brain, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface BadgeData {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  tipo: string;
  conquistado?: boolean;
  conquistado_em?: string;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  brain: Brain,
  zap: Zap,
  target: Target,
  heart: Heart,
  shield: Shield,
  compass: Compass,
};

export const BadgeSystem = () => {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [newBadge, setNewBadge] = useState<BadgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Carregar todos os badges
      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .order('tipo', { ascending: true });

      // Carregar badges do usuário
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, conquistado_em')
        .eq('user_id', userData.user.id);

      const userBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const userBadgeMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.conquistado_em]) || []);

      const combinedBadges = allBadges?.map(badge => ({
        ...badge,
        conquistado: userBadgeIds.has(badge.id),
        conquistado_em: userBadgeMap.get(badge.id)
      })) || [];

      setBadges(combinedBadges);
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'bronze': return 'bg-amber-700';
      case 'silver': return 'bg-slate-400';
      case 'gold': return 'bg-yellow-500';
      case 'special': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const IconComponent = ({ iconName }: { iconName: string }) => {
    const Icon = iconMap[iconName] || Award;
    return <Icon className="h-12 w-12" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Conquistas & Badges
          </CardTitle>
          <CardDescription>
            Seus badges conquistados e desafios disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    badge.conquistado
                      ? `${getBadgeColor(badge.tipo)} text-white shadow-lg`
                      : 'border-dashed border-muted bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    {badge.conquistado ? (
                      <IconComponent iconName={badge.icone} />
                    ) : (
                      <Lock className="h-12 w-12 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold text-sm">{badge.nome}</h3>
                    <p className="text-xs opacity-90">{badge.descricao}</p>
                    {badge.conquistado && badge.conquistado_em && (
                      <Badge variant="outline" className="mt-2 bg-white/20">
                        {new Date(badge.conquistado_em).toLocaleDateString('pt-BR')}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de nova conquista */}
      <AnimatePresence>
        {newBadge && (
          <Dialog open={!!newBadge} onOpenChange={() => setNewBadge(null)}>
            <DialogContent className="max-w-md">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <div className={`p-6 rounded-full ${getBadgeColor(newBadge.tipo)}`}>
                  <IconComponent iconName={newBadge.icone} />
                </div>
                <DialogHeader className="text-center">
                  <DialogTitle className="text-2xl">🎉 Nova Conquista!</DialogTitle>
                  <DialogDescription className="text-lg">
                    Você desbloqueou: <strong>{newBadge.nome}</strong>
                  </DialogDescription>
                </DialogHeader>
                <p className="text-center text-muted-foreground">{newBadge.descricao}</p>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};