import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Target, Clock, Award, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface StudentStats {
  user_id: string;
  email: string;
  total_sessoes: number;
  taxa_sucesso: number;
  tempo_medio: number;
  badges_conquistados: number;
}

interface ReportStats {
  totalSessions: number;
  successRate: number;
  avgDuration: number;
  totalBadges: number;
  completedSessions: number;
  totalPoints: number;
  byDayOfWeek: Array<{ dia: string; sessoes: number }>;
  statusDist: Array<{ name: string; value: number; color: string }>;
  byHour: Array<{ hora: string; sessoes: number }>;
}

export const AdvancedReports = ({ userRole }: { userRole?: string }) => {
  const [timeRange, setTimeRange] = useState("30");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [studentData, setStudentData] = useState<StudentStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
    
    // Recarregar estatísticas quando houver mudanças em simulation_sessions
    const channel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulation_sessions'
        },
        () => {
          console.log('Nova sessão detectada, atualizando estatísticas...');
          loadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - parseInt(timeRange));

      // Carregar sessões do período do usuário atual
      const { data: sessions } = await supabase
        .from('simulation_sessions')
        .select('*')
        .eq('user_id', userData.user.id)
        .gte('data_inicio', dateFilter.toISOString());

      if (!sessions) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Estatísticas gerais
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'vitoria' || s.status === 'derrota').length;
      const successfulSessions = sessions.filter(s => s.status === 'vitoria').length;
      const successRate = completedSessions > 0 ? (successfulSessions / completedSessions) * 100 : 0;
      
      const avgDuration = sessions.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0) / totalSessions || 0;

      // Buscar badges do usuário
      const { data: badges } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userData.user.id);

      const totalBadges = badges?.length || 0;

      // Buscar pontos totais
      const sessionIds = sessions.map(s => s.id);
      const { data: goals } = await supabase
        .from('metas_alcancadas')
        .select('pontos_ganhos')
        .in('session_id', sessionIds);

      const totalPoints = goals?.reduce((acc, g) => acc + (g.pontos_ganhos || 0), 0) || 0;

      // Por dia da semana
      const byDayOfWeek = new Array(7).fill(0).map((_, i) => ({
        dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i],
        sessoes: 0
      }));

      sessions.forEach(session => {
        const day = new Date(session.data_inicio).getDay();
        byDayOfWeek[day].sessoes++;
      });

      // Status distribution
      const statusDist = [
        { name: 'Vitória', value: sessions.filter(s => s.status === 'vitoria').length, color: '#22c55e' },
        { name: 'Derrota', value: sessions.filter(s => s.status === 'derrota').length, color: '#ef4444' },
        { name: 'Em Andamento', value: sessions.filter(s => s.status === 'em_andamento').length, color: '#6b7280' },
      ];

      // Por hora do dia
      const byHour = new Array(24).fill(0).map((_, i) => ({
        hora: `${i}h`,
        sessoes: 0
      }));

      sessions.forEach(session => {
        const hour = new Date(session.data_inicio).getHours();
        byHour[hour].sessoes++;
      });

      setStats({
        totalSessions,
        successRate,
        avgDuration,
        totalBadges,
        completedSessions,
        totalPoints,
        byDayOfWeek,
        statusDist: statusDist.filter(s => s.value > 0),
        byHour: byHour.filter(h => h.sessoes > 0)
      });

      // Se for professor, carregar dados dos alunos
      if (userRole === 'professor') {
        await loadStudentStats(dateFilter);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentStats = async (dateFilter: Date) => {
    // Aqui você pode implementar lógica para carregar estatísticas dos alunos
    // Por enquanto, dados mockados
    const mockData: StudentStats[] = [
      {
        user_id: '1',
        email: 'aluno1@exemplo.com',
        total_sessoes: 15,
        taxa_sucesso: 73,
        tempo_medio: 180,
        badges_conquistados: 4
      },
      {
        user_id: '2',
        email: 'aluno2@exemplo.com',
        total_sessoes: 8,
        taxa_sucesso: 50,
        tempo_medio: 240,
        badges_conquistados: 2
      }
    ];

    setStudentData(mockData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  };

  const exportToCSV = () => {
    if (!stats) return;

    const csvContent = [
      ["Métrica", "Valor"],
      ["Total de Sessões", stats.totalSessions.toString()],
      ["Sessões Concluídas", stats.completedSessions.toString()],
      ["Taxa de Sucesso (%)", stats.successRate.toFixed(1)],
      ["Tempo Médio (min)", Math.floor(stats.avgDuration / 60).toString()],
      ["Pontos Totais", stats.totalPoints.toString()],
      ["Badges Conquistados", stats.totalBadges.toString()],
      ["", ""],
      ["Status", "Quantidade"],
      ...stats.statusDist.map(s => [s.name, s.value.toString()])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Relatório CSV exportado!");
  };

  const exportToTXT = () => {
    if (!stats) return;

    const txtContent = [
      "=".repeat(80),
      `RELATÓRIO DE DESEMPENHO - SIMULADOR VETERINÁRIO`,
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      "=".repeat(80),
      "",
      "📊 ESTATÍSTICAS GERAIS",
      "─".repeat(80),
      `Total de Sessões: ${stats.totalSessions}`,
      `Sessões Concluídas: ${stats.completedSessions}`,
      `Taxa de Sucesso: ${stats.successRate.toFixed(1)}%`,
      `Tempo Médio: ${Math.floor(stats.avgDuration / 60)} minutos`,
      `Pontos Totais: ${stats.totalPoints}`,
      `Badges Conquistados: ${stats.totalBadges}`,
      "",
      "─".repeat(80),
      "🎯 DISTRIBUIÇÃO DE RESULTADOS",
      "─".repeat(80),
      ...stats.statusDist.map(s => `${s.name}: ${s.value} (${((s.value / stats.totalSessions) * 100).toFixed(1)}%)`),
      "",
      "─".repeat(80),
      "📅 SESSÕES POR DIA DA SEMANA",
      "─".repeat(80),
      ...stats.byDayOfWeek.map(d => `${d.dia}: ${d.sessoes} sessões`),
      "",
      "=".repeat(80),
    ].join("\n");

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    toast.success("Relatório TXT exportado!");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando relatórios...</p>;
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum dado disponível</p>
            <p className="text-sm mt-1">Complete algumas simulações para gerar relatórios</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Relatórios Avançados
            </CardTitle>
            <CardDescription>
              Análise detalhada de desempenho e atividade
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
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
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            {userRole === 'professor' && (
              <TabsTrigger value="students">Alunos</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total de Sessões</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats.totalSessions}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-green-500">
                    {stats.successRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tempo Médio</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {formatTime(stats.avgDuration)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Badges Total</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats.totalBadges}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.statusDist}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.statusDist.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {/* Atividade por Dia da Semana */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessões por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessoes" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Atividade por Hora */}
            {stats.byHour.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sessões por Hora do Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.byHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sessoes" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {userRole === 'professor' && (
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Desempenho dos Alunos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {studentData.map((student) => (
                      <Card key={student.user_id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{student.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.total_sessoes} sessões • {student.taxa_sucesso}% sucesso
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                <Award className="inline h-4 w-4 mr-1" />
                                {student.badges_conquistados} badges
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};