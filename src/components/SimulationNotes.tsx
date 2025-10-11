import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Trash2, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Note {
  id: string;
  tipo: string;
  conteudo: string;
  timestamp_simulacao: number;
  criado_em: string;
}

interface SimulationNotesProps {
  caseId: number;
  elapsedTime: number;
  currentState: Record<number, number>;
  sessionId?: string;
}

export const SimulationNotes = ({ 
  caseId, 
  elapsedTime, 
  currentState,
  sessionId 
}: SimulationNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"observacao" | "decisao" | "hipotese">("observacao");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [caseId]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from("simulation_notes")
      .select("*")
      .eq("case_id", caseId)
      .order("timestamp_simulacao", { ascending: false });

    if (data) {
      setNotes(data);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "decisao":
        return "default";
      case "hipotese":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case "decisao":
        return "Decisão Clínica";
      case "hipotese":
        return "Hipótese";
      default:
        return "Observação";
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Nota vazia",
        description: "Digite uma anotação antes de salvar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("simulation_notes")
        .insert({
          user_id: user.id,
          case_id: caseId,
          session_id: sessionId || null,
          timestamp_simulacao: elapsedTime,
          tipo: noteType,
          conteudo: newNote.trim(),
          parametros_relevantes: currentState,
        });

      if (error) throw error;

      toast({
        title: "Nota salva!",
        description: `${getNoteTypeLabel(noteType)} registrada`,
      });

      setNewNote("");
      setNoteType("observacao");
      loadNotes();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar nota",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from("simulation_notes")
      .delete()
      .eq("id", noteId);

    if (!error) {
      loadNotes();
      toast({
        title: "Nota deletada",
        description: "Anotação removida com sucesso",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Notas Clínicas</h3>
        </div>

        {/* New Note Form */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(elapsedTime)}
            </span>
            <Select
              value={noteType}
              onValueChange={(value: "observacao" | "decisao" | "hipotese") => setNoteType(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="observacao">Observação</SelectItem>
                <SelectItem value="decisao">Decisão Clínica</SelectItem>
                <SelectItem value="hipotese">Hipótese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Digite sua anotação clínica aqui..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={addNote}
            disabled={isLoading || !newNote.trim()}
            className="w-full"
          >
            {isLoading ? "Salvando..." : "Adicionar Nota"}
          </Button>
        </div>

        {/* Notes List */}
        <ScrollArea className="h-[400px] rounded-lg border p-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma anotação ainda</p>
              <p className="text-xs mt-1">
                Registre suas observações e decisões durante a simulação
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getNoteTypeColor(note.tipo)}>
                        {getNoteTypeLabel(note.tipo)}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTime(note.timestamp_simulacao)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.conteudo}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(note.criado_em).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>
            💡 As notas são salvas automaticamente e vinculadas ao caso atual
          </p>
        </div>
      </div>
    </Card>
  );
};
