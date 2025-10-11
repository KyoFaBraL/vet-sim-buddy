import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Copy, Eye, EyeOff, Calendar, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SharedCase {
  id: string;
  case_id: number;
  access_code: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  acessos: number;
  expira_em: string | null;
  criado_em: string;
}

interface CaseShareManagerProps {
  availableCases: any[];
}

export const CaseShareManager = ({ availableCases }: CaseShareManagerProps) => {
  const [sharedCases, setSharedCases] = useState<SharedCase[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSharedCases();
  }, []);

  const loadSharedCases = async () => {
    const { data } = await supabase
      .from("shared_cases")
      .select("*")
      .order("criado_em", { ascending: false });

    if (data) {
      setSharedCases(data);
    }
  };

  const generateShareCode = async () => {
    if (!selectedCaseId || !titulo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um caso e forneça um título",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar código de acesso
      const { data: codeData } = await supabase.rpc("generate_access_code");

      const { error } = await supabase
        .from("shared_cases")
        .insert({
          case_id: selectedCaseId,
          shared_by: user.id,
          access_code: codeData,
          titulo,
          descricao,
        });

      if (error) throw error;

      toast({
        title: "Código gerado!",
        description: `Código de acesso: ${codeData}`,
      });

      setIsOpen(false);
      setTitulo("");
      setDescricao("");
      setSelectedCaseId(null);
      loadSharedCases();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copiado!",
      description: "Código copiado para área de transferência",
    });
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("shared_cases")
      .update({ ativo: !currentStatus })
      .eq("id", id);

    if (!error) {
      loadSharedCases();
      toast({
        title: currentStatus ? "Desativado" : "Ativado",
        description: `Código ${currentStatus ? "desativado" : "ativado"} com sucesso`,
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Compartilhar Casos</h3>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Novo Compartilhamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compartilhar Caso Clínico</DialogTitle>
                <DialogDescription>
                  Gere um código de acesso para que alunos possam acessar este caso
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Caso Clínico</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedCaseId || ""}
                    onChange={(e) => setSelectedCaseId(parseInt(e.target.value))}
                  >
                    <option value="">Selecione um caso</option>
                    {availableCases.map((caso) => (
                      <option key={caso.id} value={caso.id}>
                        {caso.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Caso de Acidose Metabólica"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Adicione instruções ou contexto para os alunos"
                  />
                </div>
                <Button
                  onClick={generateShareCode}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Gerando..." : "Gerar Código de Acesso"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {sharedCases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum caso compartilhado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedCases.map((shared) => (
              <div
                key={shared.id}
                className="p-4 rounded-lg border-2 border-border bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{shared.titulo}</h4>
                    {shared.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {shared.descricao}
                      </p>
                    )}
                  </div>
                  <Badge variant={shared.ativo ? "default" : "secondary"}>
                    {shared.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-lg font-mono">
                    {shared.access_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyCode(shared.access_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(shared.id, shared.ativo)}
                  >
                    {shared.ativo ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{shared.acessos} acessos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(shared.criado_em).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
