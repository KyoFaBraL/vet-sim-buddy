import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Edit2, Trash2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Turma {
  id: string;
  nome: string;
  descricao: string | null;
  ano_letivo: string | null;
  periodo: string | null;
  ativo: boolean;
  criado_em: string;
  alunos_count?: number;
}

export const ClassManager = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ano_letivo: "",
    periodo: "",
  });

  useEffect(() => {
    loadTurmas();
  }, []);

  const loadTurmas = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: turmasData, error } = await supabase
        .from("turmas")
        .select("*")
        .eq("professor_id", userData.user.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Contar alunos por turma
      const turmasComContagem = await Promise.all(
        (turmasData || []).map(async (turma) => {
          const { count } = await supabase
            .from("professor_students")
            .select("*", { count: "exact", head: true })
            .eq("turma_id", turma.id)
            .eq("ativo", true);

          return { ...turma, alunos_count: count || 0 };
        })
      );

      setTurmas(turmasComContagem);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      toast.error("Erro ao carregar turmas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Nome da turma é obrigatório");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      if (editingTurma) {
        // Atualizar turma existente
        const { error } = await supabase
          .from("turmas")
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            ano_letivo: formData.ano_letivo.trim() || null,
            periodo: formData.periodo.trim() || null,
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", editingTurma.id);

        if (error) throw error;
        toast.success("Turma atualizada com sucesso!");
      } else {
        // Criar nova turma
        const { error } = await supabase.from("turmas").insert({
          professor_id: userData.user.id,
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          ano_letivo: formData.ano_letivo.trim() || null,
          periodo: formData.periodo.trim() || null,
        });

        if (error) throw error;
        toast.success("Turma criada com sucesso!");
      }

      setFormData({ nome: "", descricao: "", ano_letivo: "", periodo: "" });
      setEditingTurma(null);
      setIsDialogOpen(false);
      loadTurmas();
    } catch (error) {
      console.error("Erro ao salvar turma:", error);
      toast.error("Erro ao salvar turma");
    }
  };

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      descricao: turma.descricao || "",
      ano_letivo: turma.ano_letivo || "",
      periodo: turma.periodo || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (turmaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma? Os alunos não serão removidos, apenas desvinculados da turma.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("turmas")
        .delete()
        .eq("id", turmaId);

      if (error) throw error;
      toast.success("Turma excluída com sucesso!");
      loadTurmas();
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
      toast.error("Erro ao excluir turma");
    }
  };

  const toggleAtivo = async (turma: Turma) => {
    try {
      const { error } = await supabase
        .from("turmas")
        .update({ ativo: !turma.ativo })
        .eq("id", turma.id);

      if (error) throw error;
      toast.success(turma.ativo ? "Turma desativada" : "Turma ativada");
      loadTurmas();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status da turma");
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando turmas...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Gerenciar Turmas
            </CardTitle>
            <CardDescription>
              Crie e organize turmas para seus alunos
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTurma(null);
                setFormData({ nome: "", descricao: "", ano_letivo: "", periodo: "" });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTurma ? "Editar Turma" : "Nova Turma"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da turma
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Turma *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Turma A - Veterinária 2024"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Informações adicionais sobre a turma"
                    maxLength={500}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ano_letivo">Ano Letivo</Label>
                    <Input
                      id="ano_letivo"
                      value={formData.ano_letivo}
                      onChange={(e) => setFormData({ ...formData, ano_letivo: e.target.value })}
                      placeholder="2024"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Input
                      id="periodo"
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                      placeholder="1º Semestre"
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTurma ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {turmas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma turma criada</p>
            <p className="text-sm mt-1">Clique em "Nova Turma" para começar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ano Letivo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-center">Alunos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turmas.map((turma) => (
                <TableRow key={turma.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{turma.nome}</p>
                      {turma.descricao && (
                        <p className="text-sm text-muted-foreground">{turma.descricao}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{turma.ano_letivo || "-"}</TableCell>
                  <TableCell>{turma.periodo || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {turma.alunos_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={turma.ativo ? "default" : "secondary"}>
                      {turma.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAtivo(turma)}
                      >
                        {turma.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(turma)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(turma.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
