import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, X, Users, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  id: string;
  student_id: string;
  email: string;
  nome_completo: string;
  criado_em: string;
  ativo: boolean;
  turma_id: string | null;
}

interface Turma {
  id: string;
  nome: string;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedTurma, setSelectedTurma] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    loadTurmas();
  }, []);

  const loadTurmas = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome")
        .eq("professor_id", userData.user.id)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Buscar relacionamentos professor-aluno
      const { data: relationships, error: relError } = await supabase
        .from("professor_students")
        .select("id, student_id, criado_em, ativo, turma_id")
        .eq("professor_id", userData.user.id)
        .eq("ativo", true);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setStudents([]);
        return;
      }

      // Buscar perfis dos alunos
      const studentIds = relationships.map(r => r.student_id);
      const { data: profiles, error: profileError } = await supabase
        .from("student_profiles_safe")
        .select("id, nome_completo")
        .in("id", studentIds);

      if (profileError) throw profileError;

      // Combinar dados
      const formattedStudents = relationships.map((rel) => {
        const profile = profiles?.find(p => p.id === rel.student_id);
        return {
          id: rel.id,
          student_id: rel.student_id,
          email: "Protegido",
          nome_completo: profile?.nome_completo || "Nome não disponível",
          criado_em: rel.criado_em,
          ativo: rel.ativo,
          turma_id: rel.turma_id,
        };
      });

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      toast.error("Erro ao carregar lista de alunos");
    }
  };

  const addStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!studentEmail.trim()) {
      toast.error("Digite o email do aluno");
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Usar função segura para buscar ID do aluno
      const { data: studentId, error: functionError } = await supabase
        .rpc("get_student_id_by_email", {
          student_email: studentEmail.trim().toLowerCase()
        });

      if (functionError) {
        console.error("Erro ao buscar aluno:", functionError);
        toast.error("Erro ao buscar aluno");
        return;
      }

      if (!studentId) {
        toast.error("Aluno não encontrado. Verifique se o email está correto e se o usuário tem perfil de aluno.");
        return;
      }

      // Adicionar relacionamento
      const { error: insertError } = await supabase
        .from("professor_students")
        .insert({
          professor_id: userData.user.id,
          student_id: studentId,
          turma_id: selectedTurma === "none" ? null : selectedTurma,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("Este aluno já está vinculado a você");
        } else {
          throw insertError;
        }
        return;
      }

      toast.success("Aluno adicionado com sucesso!");
      setStudentEmail("");
      setSelectedTurma("none");
      loadStudents();
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error);
      toast.error("Erro ao adicionar aluno");
    } finally {
      setIsLoading(false);
    }
  };

  const changeTurma = async (studentRelId: string, turmaId: string | null) => {
    try {
      const { error } = await supabase
        .from("professor_students")
        .update({ turma_id: turmaId })
        .eq("id", studentRelId);

      if (error) throw error;
      toast.success("Turma atualizada!");
      loadStudents();
    } catch (error) {
      console.error("Erro ao alterar turma:", error);
      toast.error("Erro ao alterar turma do aluno");
    }
  };

  const removeStudent = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from("professor_students")
        .update({ ativo: false })
        .eq("id", relationshipId);

      if (error) throw error;

      toast.success("Aluno removido da sua lista");
      loadStudents();
    } catch (error) {
      console.error("Erro ao remover aluno:", error);
      toast.error("Erro ao remover aluno");
    }
  };

  const exportStudentsList = () => {
    const csvContent = [
      ["Nome", "Email", "Data de Cadastro"],
      ...students.map(s => [
        s.nome_completo,
        s.email,
        new Date(s.criado_em).toLocaleDateString("pt-BR")
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Lista exportada!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Gerenciar Alunos
            </CardTitle>
            <CardDescription>
              Adicione e gerencie seus alunos vinculados
            </CardDescription>
          </div>
          {students.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportStudentsList}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Lista
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Adicionar Aluno */}
          <form onSubmit={addStudent} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="email">Email do Aluno</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="aluno@exemplo.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="turma">Turma (Opcional)</Label>
                <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem turma</SelectItem>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isLoading ? "Adicionando..." : "Adicionar Aluno"}
            </Button>
          </form>

          {/* Lista de Alunos */}
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum aluno vinculado ainda</p>
              <p className="text-sm">Adicione alunos usando o email deles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.nome_completo}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Select
                        value={student.turma_id || "none"}
                        onValueChange={(value) => changeTurma(student.id, value === "none" ? null : value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sem turma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem turma</SelectItem>
                          {turmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(student.criado_em).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudent(student.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="pt-4 border-t">
            <Badge variant="outline">
              {students.length} {students.length === 1 ? "aluno" : "alunos"} vinculados
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
