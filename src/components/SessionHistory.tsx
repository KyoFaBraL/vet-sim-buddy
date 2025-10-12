import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Eye, Trash2, Clock, Calendar, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Session {
  id: string;
  nome: string;
  status: string;
  duracao_segundos: number;
  data_inicio: string;
  data_fim: string;
  notas: string;
  case_id: number;
  casos_clinicos?: {
    nome: string;
  };
}

interface SessionHistoryProps {
  onLoadSession?: (sessionId: string) => void;
  caseId?: number;
}

export const SessionHistory = ({ onLoadSession, caseId }: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [caseId]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let query = supabase
        .from('simulation_sessions')
        .select(`
          *,
          casos_clinicos (nome)
        `)
        .eq('user_id', userData.user.id)
        .order('data_inicio', { ascending: false });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar sessões:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de sessões",
          variant: "destructive",
        });
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('simulation_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sessão deletada com sucesso",
      });

      loadSessions();
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a sessão",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vitoria':
        return <Badge variant="default" className="bg-green-500">Vitória</Badge>;
      case 'derrota':
        return <Badge variant="destructive">Derrota</Badge>;
      case 'em_andamento':
        return <Badge variant="secondary">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Sessões
        </CardTitle>
        <CardDescription>
          {caseId ? 'Sessões deste caso' : 'Todas as suas sessões de simulação'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sessão encontrada</p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{session.nome}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Caso: {session.casos_clinicos?.nome || 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(session.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.duracao_segundos || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(session)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Dialog de Detalhes */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Sessão</DialogTitle>
              <DialogDescription>
                Informações completas da simulação
              </DialogDescription>
            </DialogHeader>
            {selectedSession && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Nome da Sessão</p>
                    <p className="text-sm text-muted-foreground">{selectedSession.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedSession.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Duração</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(selectedSession.duracao_segundos || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Caso Clínico</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.casos_clinicos?.nome || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data de Início</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedSession.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedSession.data_fim && (
                    <div>
                      <p className="text-sm font-medium">Data de Término</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedSession.data_fim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
                {selectedSession.notas && (
                  <div>
                    <p className="text-sm font-medium mb-2">Notas</p>
                    <ScrollArea className="h-[100px] rounded-md border p-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedSession.notas}
                      </p>
                    </ScrollArea>
                  </div>
                )}
                {onLoadSession && (
                  <Button
                    onClick={() => {
                      onLoadSession(selectedSession.id);
                      setIsDialogOpen(false);
                    }}
                    className="w-full"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Carregar esta Sessão
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};