import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface CaseManagerProps {
  onCaseCreated: () => void;
}

interface Condition {
  id: number;
  nome: string;
}

interface CustomCase {
  id: number;
  nome: string;
  descricao: string;
  especie: string;
  id_condicao_primaria: number;
}

export const CaseManager = ({ onCaseCreated }: CaseManagerProps) => {
  const [open, setOpen] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [customCases, setCustomCases] = useState<CustomCase[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    especie: "canino",
    id_condicao_primaria: "",
  });

  useEffect(() => {
    loadConditions();
    loadCustomCases();
  }, []);

  const loadConditions = async () => {
    const { data, error } = await supabase
      .from("condicoes")
      .select("id, nome")
      .order("nome");

    if (error) {
      toast({
        title: "Erro ao carregar condições",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConditions(data || []);
  };

  const loadCustomCases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("casos_clinicos")
      .select("id, nome, descricao, especie, id_condicao_primaria")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar casos",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCustomCases(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: newCase, error } = await supabase
        .from("casos_clinicos")
        .insert({
          nome: formData.nome,
          descricao: formData.descricao,
          especie: formData.especie,
          id_condicao_primaria: parseInt(formData.id_condicao_primaria),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Caso criado!",
        description: "Gerando parâmetros e tratamentos com IA...",
      });

      // Acionar IA para popular dados do caso
      const { error: populateError } = await supabase.functions.invoke('populate-case-data', {
        body: { caseId: newCase.id }
      });

      if (populateError) {
        console.error('Erro ao popular dados do caso:', populateError);
        toast({
          title: "Caso criado com avisos",
          description: "O caso foi criado mas houve erro ao gerar dados automáticos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Caso completo!",
          description: "Parâmetros e tratamentos foram gerados automaticamente pela IA.",
        });
      }

      setFormData({
        nome: "",
        descricao: "",
        especie: "canino",
        id_condicao_primaria: "",
      });
      setOpen(false);
      loadCustomCases();
      onCaseCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao criar caso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (caseId: number) => {
    try {
      const { error } = await supabase
        .from("casos_clinicos")
        .delete()
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "Caso excluído",
        description: "O caso foi removido com sucesso.",
      });

      loadCustomCases();
      onCaseCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir caso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Criar Caso Personalizado
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Caso Clínico</DialogTitle>
            <DialogDescription>
              Crie um caso personalizado com suas próprias especificações
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Caso</Label>
              <Input
                id="nome"
                placeholder="Ex: Cão com Insuficiência Cardíaca"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especie">Espécie</Label>
              <Select
                value={formData.especie}
                onValueChange={(value) => setFormData({ ...formData, especie: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canino">Canino (Cão)</SelectItem>
                  <SelectItem value="felino">Felino (Gato)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicao">Condição Primária</Label>
              <Select
                value={formData.id_condicao_primaria}
                onValueChange={(value) => setFormData({ ...formData, id_condicao_primaria: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id.toString()}>
                      {condition.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Caso</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva os sintomas, histórico e contexto do caso..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Caso"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {customCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meus Casos Personalizados</CardTitle>
            <CardDescription>Gerencie seus casos salvos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {customCases.map((caso) => (
              <div
                key={caso.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{caso.nome}</p>
                  <p className="text-sm text-muted-foreground">{caso.especie}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(caso.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
