import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserPlus, X, Users, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  notas: string | null;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("professor_students")
        .select(`
          id,
          student_id,
          criado_em,
          ativo,
          notas,
          profiles!professor_students_student_id_fkey (
            email,
            nome_completo
          )
        `)
        .eq("professor_id", userData.user.id)
        .eq("ativo", true);

      if (error) throw error;

      const formattedStudents = (data || []).map((item: any) => ({
        id: item.id,
        student_id: item.student_id,
        email: item.profiles?.email || "Email não disponível",
        nome_completo: item.profiles?.nome_completo || "Nome não disponível",
        criado_em: item.criado_em,
        ativo: item.ativo,
        notas: item.notas,
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      toast.error("Erro ao carregar lista de alunos");
    }
  };

  const addStudent = async () => {
    if (!studentEmail.trim()) {
      toast.error("Digite o email do aluno");
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Buscar o ID do aluno pelo email
      const { data: studentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", studentEmail.trim().toLowerCase())
        .single();

      if (profileError || !studentProfile) {
        toast.error("Aluno não encontrado. Verifique o email.");
        return;
      }

      // Verificar se o aluno tem role de aluno
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", studentProfile.id)
        .eq("role", "aluno")
        .single();

      if (!roleData) {
        toast.error("O usuário encontrado não é um aluno.");
        return;
      }

      // Adicionar relacionamento
      const { error: insertError } = await supabase
        .from("professor_students")
        .insert({
          professor_id: userData.user.id,
          student_id: studentProfile.id,
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
      loadStudents();
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error);
      toast.error("Erro ao adicionar aluno");
    } finally {
      setIsLoading(false);
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
          <div className="flex gap-2">
            <Input
              placeholder="Email do aluno"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addStudent()}
            />
            <Button
              onClick={addStudent}
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

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
