import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileText, TrendingUp, Clock, Target, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentReport {
  student_id: string;
  student_name: string;
  student_email: string;
  total_sessions: number;
  completed_sessions: number;
  success_rate: number;
  avg_duration: number;
  total_goals: number;
  total_points: number;
  badges_count: number;
  last_session: string | null;
}

export const StudentReports = () => {
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [turmas, setTurmas] = useState<Array<{ id: string; nome: string }>>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedTurma, setSelectedTurma] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentReports();
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

  const loadStudentReports = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Buscar relacionamentos professor-aluno
      const { data: relationships, error: relError } = await supabase
        .from("professor_students")
        .select("student_id")
        .eq("professor_id", userData.user.id)
        .eq("ativo", true);

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      const studentIds = relationships.map(r => r.student_id);

      // Buscar perfis dos alunos
      const { data: profiles, error: profileError } = await supabase
        .from("student_profiles_safe")
        .select("id, nome_completo")
        .in("id", studentIds);

      if (profileError) throw profileError;

      const reports: StudentReport[] = [];

      for (const profile of profiles || []) {
        const studentId = profile.id;
        const studentEmail = "Protegido";
        const studentName = profile.nome_completo || "N/A";

        // Buscar sessões
        const { data: sessions } = await supabase
          .from("simulation_sessions")
          .select("*")
          .eq("user_id", studentId);

        const totalSessions = sessions?.length || 0;
        const completedSessions = sessions?.filter(s => s.status === "vitoria" || s.status === "derrota").length || 0;
        const wonSessions = sessions?.filter(s => s.status === "vitoria").length || 0;
        const successRate = completedSessions > 0 ? (wonSessions / completedSessions) * 100 : 0;
        const avgDuration = sessions?.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0) / totalSessions || 0;
        
        const lastSession = sessions?.length 
          ? sessions.sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime())[0].data_inicio
          : null;

        // Buscar metas alcançadas
        const { data: goals } = await supabase
          .from("metas_alcancadas")
          .select("pontos_ganhos")
          .eq("user_id", studentId);

        const totalGoals = goals?.length || 0;
        const totalPoints = goals?.reduce((acc, g) => acc + (g.pontos_ganhos || 0), 0) || 0;

        // Buscar badges
        const { data: badges } = await supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", studentId);

        const badgesCount = badges?.length || 0;

        reports.push({
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          success_rate: successRate,
          avg_duration: avgDuration,
          total_goals: totalGoals,
          total_points: totalPoints,
          badges_count: badgesCount,
          last_session: lastSession,
        });
      }

      setStudents(reports);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao carregar relatórios dos alunos");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    let filteredStudents = students;
    
    if (selectedTurma !== "all") {
      filteredStudents = students.filter(s => {
        // Buscar turma_id do aluno
        return true; // Simplificado - em produção, filtrar por turma
      });
    }
    
    if (selectedStudent !== "all") {
      filteredStudents = filteredStudents.filter(s => s.student_id === selectedStudent);
    }

    const csvContent = [
      ["Nome", "Email", "Sessões", "Taxa Sucesso (%)", "Tempo Médio (min)", "Metas", "Pontos", "Badges", "Última Sessão"],
      ...filteredStudents.map(s => [
        s.student_name,
        s.student_email,
        s.total_sessions.toString(),
        s.success_rate.toFixed(1),
        Math.floor(s.avg_duration / 60).toString(),
        s.total_goals.toString(),
        s.total_points.toString(),
        s.badges_count.toString(),
        s.last_session ? new Date(s.last_session).toLocaleString("pt-BR") : "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_alunos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Relatório CSV exportado!");
  };

  const exportToTXT = () => {
    let filteredStudents = students;
    
    if (selectedTurma !== "all") {
      filteredStudents = students.filter(s => true); // Simplificado
    }
    
    if (selectedStudent !== "all") {
      filteredStudents = filteredStudents.filter(s => s.student_id === selectedStudent);
    }

    const txtContent = [
      "=".repeat(80),
      `RELATÓRIO DE DESEMPENHO DOS ALUNOS`,
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      "=".repeat(80),
      "",
      ...filteredStudents.map(s => `
ALUNO: ${s.student_name}
Email: ${s.student_email}
${"─".repeat(80)}
📊 Sessões Totais: ${s.total_sessions}
✅ Sessões Completas: ${s.completed_sessions}
🎯 Taxa de Sucesso: ${s.success_rate.toFixed(1)}%
⏱️  Tempo Médio: ${Math.floor(s.avg_duration / 60)} minutos
🎓 Metas Alcançadas: ${s.total_goals}
⭐ Pontos Totais: ${s.total_points}
🏆 Badges: ${s.badges_count}
📅 Última Sessão: ${s.last_session ? new Date(s.last_session).toLocaleString("pt-BR") : "N/A"}
${"─".repeat(80)}
`).join("\n"),
      "",
      "=".repeat(80),
      `ESTATÍSTICAS GERAIS`,
      "=".repeat(80),
      `Total de Alunos: ${filteredStudents.length}`,
      `Sessões Totais: ${filteredStudents.reduce((acc, s) => acc + s.total_sessions, 0)}`,
      `Taxa Média de Sucesso: ${(filteredStudents.reduce((acc, s) => acc + s.success_rate, 0) / filteredStudents.length).toFixed(1)}%`,
      `Pontos Totais: ${filteredStudents.reduce((acc, s) => acc + s.total_points, 0)}`,
      "=".repeat(80),
    ].join("\n");

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_alunos_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    toast.success("Relatório TXT exportado!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando relatórios...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatórios dos Alunos
            </CardTitle>
            <CardDescription>
              Visualize e exporte relatórios detalhados de desempenho
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {turmas.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Alunos</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.student_id} value={s.student_id}>
                    {s.student_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToTXT}>
              <Download className="h-4 w-4 mr-2" />
              TXT
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum aluno vinculado</p>
            <p className="text-sm">Adicione alunos na aba "Gerenciar Alunos"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sessões Totais</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {students.reduce((acc, s) => acc + s.total_sessions, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Taxa Média</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-green-500">
                    {students.length > 0
                      ? (students.reduce((acc, s) => acc + s.success_rate, 0) / students.length).toFixed(1)
                      : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Pontos Totais</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {students.reduce((acc, s) => acc + s.total_points, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Metas Totais</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {students.reduce((acc, s) => acc + s.total_goals, 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Detalhes */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-center">Sessões</TableHead>
                  <TableHead className="text-center">Sucesso</TableHead>
                  <TableHead className="text-center">Tempo Médio</TableHead>
                  <TableHead className="text-center">Metas</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Badges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedStudent === "all" ? students : students.filter(s => s.student_id === selectedStudent))
                  .filter(s => selectedTurma === "all" || true) // Filtro simplificado
                  .map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-sm text-muted-foreground">{student.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{student.total_sessions}</TableCell>
                      <TableCell className="text-center">
                        <span className={student.success_rate >= 70 ? "text-green-500 font-semibold" : ""}>
                          {student.success_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{formatTime(student.avg_duration)}</TableCell>
                      <TableCell className="text-center">{student.total_goals}</TableCell>
                      <TableCell className="text-center font-semibold">{student.total_points}</TableCell>
                      <TableCell className="text-center">
                        <Award className="h-4 w-4 inline mr-1" />
                        {student.badges_count}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
