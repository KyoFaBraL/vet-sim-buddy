import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Save, FolderOpen, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string | null;
  duracao_segundos: number | null;
  status: string;
  notas: string | null;
  casos_clinicos: {
    nome: string;
  };
}

interface SessionManagerProps {
  onSaveSession: (nome: string, notas: string) => Promise<void>;
  onLoadSession: (sessionId: string) => Promise<void>;
}

export const SessionManager = ({ onSaveSession, onLoadSession }: SessionManagerProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("simulation_sessions")
      .select(`
        *,
        casos_clinicos (nome)
      `)
      .order("criado_em", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar sessões",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSessions(data || []);
  };

  const handleSave = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a sessão",
        variant: "destructive",
      });
      return;
    }

    await onSaveSession(sessionName, sessionNotes);
    setSessionName("");
    setSessionNotes("");
    setIsDialogOpen(false);
    loadSessions();
  };

  const handleDelete = async (sessionId: string) => {
    const { error } = await supabase
      .from("simulation_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      toast({
        title: "Erro ao deletar sessão",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sessão deletada",
      description: "Sessão removida com sucesso",
    });
    loadSessions();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      em_andamento: "secondary",
      concluida: "default",
      abandonada: "destructive",
    };
    
    const labels: Record<string, string> = {
      em_andamento: "Em Andamento",
      concluida: "Concluída",
      abandonada: "Abandonada",
    };

    return <Badge variant={variants[status] || "default"}>{labels[status]}</Badge>;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Save Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Salvar Sessão Atual
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Sessão de Simulação</DialogTitle>
            <DialogDescription>
              Salve esta simulação para revisão posterior
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Nome da Sessão</Label>
              <Input
                id="session-name"
                placeholder="Ex: Acidose Metabólica - Primeira tentativa"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-notes">Notas (opcional)</Label>
              <Textarea
                id="session-notes"
                placeholder="Observações sobre a simulação..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <Button onClick={handleSave}>Salvar Sessão</Button>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSession?.nome}</DialogTitle>
            <DialogDescription>
              Caso: {selectedSession?.casos_clinicos?.nome}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSession.status)}</div>
                </div>
                <div>
                  <Label>Duração</Label>
                  <p className="text-sm mt-1">{formatDuration(selectedSession.duracao_segundos)}</p>
                </div>
                <div>
                  <Label>Início</Label>
                  <p className="text-sm mt-1">{new Date(selectedSession.data_inicio).toLocaleString('pt-BR')}</p>
                </div>
                {selectedSession.data_fim && (
                  <div>
                    <Label>Fim</Label>
                    <p className="text-sm mt-1">{new Date(selectedSession.data_fim).toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>
              {selectedSession.notas && (
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{selectedSession.notas}</p>
                </div>
              )}
              <Button 
                onClick={() => {
                  onLoadSession(selectedSession.id);
                  setSelectedSession(null);
                }}
                className="w-full"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Carregar Sessão
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Salvas</CardTitle>
          <CardDescription>Histórico de simulações anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma sessão salva ainda
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{session.nome}</h4>
                      {getStatusBadge(session.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.casos_clinicos?.nome} • {new Date(session.data_inicio).toLocaleDateString('pt-BR')} • {formatDuration(session.duracao_segundos)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedSession(session)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
