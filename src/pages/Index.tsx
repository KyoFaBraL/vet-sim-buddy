import { useState, useEffect } from "react";
import { LogOut, Settings } from "lucide-react";
import vetbalanceLogo from "@/assets/vetbalance-logo.png";
import MonitorDisplay from "@/components/MonitorDisplay";
import CaseInfo from "@/components/CaseInfo";
import SimulationControls from "@/components/SimulationControls";
import { Auth } from "@/components/Auth";
import { CaseManager } from "@/components/CaseManager";
import { LearningGoals } from "@/components/LearningGoals";


import { useUserRole } from "@/hooks/useUserRole";
import { CaseShareManager } from "@/components/CaseShareManager";
import { AccessCodeInput } from "@/components/AccessCodeInput";
import { PerformanceStatistics } from "@/components/PerformanceStatistics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundAlertsExtended } from "@/components/SoundAlertsExtended";
import { SessionComparison } from "@/components/SessionComparison";
import { SessionHistory } from "@/components/SessionHistory";
import { CaseDataPopulator } from "@/components/CaseDataPopulator";
import { BadgeSystem } from "@/components/BadgeSystem";
import { GuidedTutorial } from "@/components/GuidedTutorial";
import { AdvancedReports } from "@/components/AdvancedReports";
import { TreatmentFeedback } from "@/components/TreatmentFeedback";
import { CaseLibrary } from "@/components/CaseLibrary";
import { ClassManager } from "@/components/ClassManager";
import { StudentManagement } from "@/components/StudentManagement";
import { StudentReports } from "@/components/StudentReports";
import { SimulationModeSelector } from "@/components/SimulationModeSelector";
import { SessionFeedbackReport } from "@/components/SessionFeedbackReport";
import ParameterChart from "@/components/ParameterChart";
import { PatientMonitor } from "@/components/PatientMonitor";
import { SimulationWorkspace } from "@/components/SimulationWorkspace";
import { useSimulation } from "@/hooks/useSimulation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { parameterDescriptions } from "@/constants/parameterDescriptions";
import { useToast } from "@/hooks/use-toast";

type SimulationMode = 'practice' | 'evaluation';

interface Treatment {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role: userRole, loading: roleLoading } = useUserRole(user);
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const { toast } = useToast();
  
  const {
    parameters,
    currentState,
    previousState,
    history,
    isRunning,
    caseData,
    elapsedTime,
    hp,
    gameStatus,
    lastHpChange,
    toggleSimulation,
    resetSimulation,
    applyTreatment,
    getParameterStatus,
    getParameterTrend,
    changeHp,
  } = useSimulation(selectedCaseId);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appliedTreatments, setAppliedTreatments] = useState<string[]>([]);
  const [goalPoints, setGoalPoints] = useState(0);
  const [addTreatmentLogFn, setAddTreatmentLogFn] = useState<((treatmentName: string) => Promise<void>) | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    treatmentName: string;
    effects: Array<{nome: string; valorAntes: number; valorDepois: number; unidade: string}>;
  } | null>(null);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('practice');
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [diagnosticPoints, setDiagnosticPoints] = useState(0);

  useEffect(() => {
    if (user) {
      loadTreatments();
      loadCases();
    }
  }, [user, selectedCaseId]);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from("casos_clinicos")
        .select("id, nome, especie, descricao, user_id")
        .order("id");

      if (error) throw error;
      setAvailableCases(data || []);
    } catch (error) {
      console.error("Erro ao carregar casos:", error);
    }
  };

  const handleCaseAccessed = async (caseId: number) => {
    try {
      // Buscar o caso compartilhado diretamente (RLS permite acesso público a casos ativos)
      const { data: caseData, error } = await supabase
        .from("casos_clinicos")
        .select("id, nome, especie, descricao, user_id")
        .eq("id", caseId)
        .single();

      if (error) throw error;

      // Adicionar caso à lista se não existir
      setAvailableCases(prev => {
        const exists = prev.some(c => c.id === caseId);
        if (!exists && caseData) {
          return [...prev, caseData];
        }
        return prev;
      });

      setSelectedCaseId(caseId);
      toast({
        title: "Caso carregado!",
        description: `Você agora tem acesso ao caso "${caseData?.nome}".`,
      });
    } catch (error: any) {
      console.error("Erro ao carregar caso compartilhado:", error);
      toast({
        title: "Erro ao carregar caso",
        description: error.message || "Não foi possível carregar o caso compartilhado.",
        variant: "destructive",
      });
    }
  };

  const loadTreatments = async () => {
    const { data, error } = await supabase
      .from("tratamentos")
      .select("*")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar tratamentos:", error);
      return;
    }

    setTreatments(data || []);
  };

  const handleGoalAchieved = (goalId: string, points: number) => {
    setGoalPoints(prev => prev + points);
  };

  const isProfessor = userRole === 'professor';
  const isAluno = userRole === 'aluno';

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="text-center">
          <img src={vetbalanceLogo} alt="VetBalance" className="h-16 w-16 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="text-center">
          <img src={vetbalanceLogo} alt="VetBalance" className="h-16 w-16 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // INTERFACE DO PROFESSOR - Criação e Gerenciamento de Casos
  // ============================================
  if (isProfessor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header do Professor */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={vetbalanceLogo} alt="VetBalance Logo" className="h-12 w-12 object-contain" />
                <div>
                  <h1 className="text-xl font-bold">VetBalance</h1>
                  <p className="text-sm text-muted-foreground">Painel do Professor</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default">Professor</Badge>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <ThemeToggle />
                <Button variant="outline" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal do Professor */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Seção de Criação de Casos */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Casos Clínicos</CardTitle>
                <CardDescription>
                  Crie e gerencie casos clínicos para seus alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaseManager onCaseCreated={loadCases} />
              </CardContent>
            </Card>

            {/* Seção de Geração de Dados com IA */}
            <Card>
              <CardHeader>
                <CardTitle>Casos Existentes</CardTitle>
                <CardDescription>
                  Gere dados adicionais com IA para casos existentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableCases.length > 0 ? (
                  availableCases.map((caso) => (
                    <div key={caso.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{caso.nome}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            Espécie: {caso.especie}
                          </p>
                          {caso.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {caso.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      <CaseDataPopulator 
                        caseId={caso.id} 
                        onDataGenerated={() => {
                          toast({
                            title: "Dados gerados!",
                            description: "Os dados do caso foram atualizados com sucesso.",
                          });
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum caso disponível. Crie seu primeiro caso acima.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Seção de Compartilhamento */}
            <Card>
              <CardHeader>
                <CardTitle>Compartilhar Casos com Alunos</CardTitle>
                <CardDescription>
                  Gere códigos de acesso para seus alunos acessarem os casos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaseShareManager availableCases={availableCases} />
              </CardContent>
            </Card>

            {/* Seção de Relatórios */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Alunos</CardTitle>
                <CardDescription>
                  Acompanhe o desempenho dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="classes" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="classes">Turmas</TabsTrigger>
                    <TabsTrigger value="students">Alunos</TabsTrigger>
                    <TabsTrigger value="reports">Relatórios</TabsTrigger>
                    <TabsTrigger value="library">Biblioteca</TabsTrigger>
                  </TabsList>
                  <TabsContent value="classes" className="space-y-4">
                    <ClassManager />
                  </TabsContent>
                  <TabsContent value="students" className="space-y-4">
                    <StudentManagement />
                  </TabsContent>
                  <TabsContent value="reports" className="space-y-4">
                    <StudentReports />
                  </TabsContent>
                  <TabsContent value="library" className="space-y-4">
                    <CaseLibrary onCaseSelect={(caseId) => console.log("Caso selecionado:", caseId)} selectedCaseId={selectedCaseId} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
          <p>
            Este é um simulador educacional. Os casos são fictícios e destinados
            apenas para fins de aprendizado.
          </p>
        </footer>
      </div>
    );
  }

  // ============================================
  // INTERFACE DO ALUNO - Simulação
  // ============================================
  const secondaryParameters = parameters.filter(
    (p) => !['pH', 'PaCO2', 'HCO3-', 'FrequenciaCardiaca'].includes(p.nome)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header do Aluno */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={vetbalanceLogo} alt="VetBalance Logo" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-xl font-bold">VetBalance</h1>
                <p className="text-sm text-muted-foreground">Modo Aluno</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Aluno</Badge>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <SoundAlertsExtended 
                parameters={parameters}
                currentState={currentState}
                getParameterStatus={getParameterStatus}
                isRunning={isRunning}
              />
              <ThemeToggle />
              <Button variant="outline" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Configuração de Simulação - Apenas para Alunos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Modo de Simulação */}
            <div>
              <SimulationModeSelector 
                currentMode={simulationMode}
                onModeChange={setSimulationMode}
              />
            </div>

            {/* Seleção de Caso */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Caso Clínico</label>
              <Select
                value={selectedCaseId.toString()}
                onValueChange={(value) => setSelectedCaseId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um caso" />
                </SelectTrigger>
                <SelectContent>
                  {availableCases.map((caso) => (
                    <SelectItem key={caso.id} value={caso.id.toString()}>
                      {caso.nome} ({caso.especie})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Acesso a Casos Compartilhados */}
            <div className="pt-4 border-t">
              <AccessCodeInput onCaseAccessed={handleCaseAccessed} />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Caso */}
        {caseData && (
          <CaseInfo
            caseName={caseData.nome}
            description={caseData.descricao}
            species={caseData.especie}
            condition={caseData.condicoes?.nome || "N/A"}
          />
        )}


        {/* Controles de Simulação */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <SimulationControls
                isRunning={isRunning}
                onToggle={toggleSimulation}
                onReset={resetSimulation}
              />
              <div className="flex gap-4">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  🎯 Metas: {goalPoints}
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  🔬 Diagnósticos: {diagnosticPoints}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ÁREA PRINCIPAL DE SIMULAÇÃO */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Monitor do Paciente e Metas */}
          <div className="space-y-6">
            <PatientMonitor
              hp={hp}
              elapsedTime={elapsedTime}
              gameStatus={gameStatus}
              animalType={caseData?.especie || ""}
              lastHpChange={lastHpChange}
              parameters={parameters}
              currentState={currentState}
              getParameterStatus={getParameterStatus}
              getParameterTrend={getParameterTrend}
            />

            {/* Metas de Aprendizado */}
            <LearningGoals
              key={selectedCaseId}
              caseId={selectedCaseId}
              currentState={currentState}
              parameters={parameters}
              elapsedTime={elapsedTime}
              onGoalAchieved={handleGoalAchieved}
            />

            {/* Parâmetros Secundários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parâmetros Secundários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {secondaryParameters.map((param) => {
                    const status = getParameterStatus(param.id, currentState[param.id]);
                    const statusVariant = status.isCritical ? 'destructive' : !status.isNormal ? 'default' : 'secondary';
                    return (
                      <div key={param.nome} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{param.nome}</span>
                          <Badge variant={statusVariant}>
                            {currentState[param.id]?.toFixed(1)} {param.unidade}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Workspace (Tratamentos, Dicas, Diagnóstico, Notas) */}
          <div>
            <SimulationWorkspace
              isRunning={isRunning}
              simulationMode={simulationMode}
              treatments={treatments}
              onApplyTreatment={async (treatmentId: number) => {
                const treatment = treatments.find(t => t.id === treatmentId);
                
                if (treatment) {
                  setAppliedTreatments([...appliedTreatments, treatment.nome]);
                  applyTreatment(treatmentId);
                  setShowFeedback(true);
                  setFeedbackData({
                    treatmentName: treatment.nome,
                    effects: []
                  });

                  if (addTreatmentLogFn) {
                    await addTreatmentLogFn(treatment.nome);
                  }
                }
              }}
              currentState={currentState}
              parameters={parameters}
              caseData={caseData}
              onHpChange={changeHp}
              caseId={selectedCaseId}
              elapsedTime={elapsedTime}
              onDiagnosticSuccess={() => setDiagnosticPoints(prev => prev + 10)}
              onNotesChange={(fn) => setAddTreatmentLogFn(() => fn)}
            />
          </div>
        </div>

        {/* Gráfico de Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal dos Parâmetros</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterChart history={history} parameters={parameters} />
          </CardContent>
        </Card>

        {/* Feedback de Tratamento */}
        {feedbackData && (
          <TreatmentFeedback
            treatmentName={feedbackData.treatmentName}
            effects={feedbackData.effects}
            show={showFeedback}
            onHide={() => setShowFeedback(false)}
          />
        )}

        {/* Relatório de Feedback da Sessão */}
        {completedSessionId && (
          <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Relatório de Desempenho</DialogTitle>
                <DialogDescription>
                  Análise detalhada da sua sessão de simulação
                </DialogDescription>
              </DialogHeader>
              <SessionFeedbackReport sessionId={completedSessionId} />
            </DialogContent>
          </Dialog>
        )}

        {/* Seção de Relatórios e Estatísticas - Apenas para Alunos */}
        <Separator className="my-8" />
        
        <Card>
          <CardHeader>
            <CardTitle>Meu Progresso</CardTitle>
            <CardDescription>
              Acompanhe suas sessões e conquistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="comparison">Comparação</TabsTrigger>
                <TabsTrigger value="badges">Conquistas</TabsTrigger>
                <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
                <TabsTrigger value="reports">Relatórios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="history" className="space-y-4">
                <SessionHistory />
              </TabsContent>
              
              <TabsContent value="comparison" className="space-y-4">
                <SessionComparison currentCaseId={selectedCaseId} userId={user.id} />
              </TabsContent>
              
              <TabsContent value="badges" className="space-y-4">
                <BadgeSystem />
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                <PerformanceStatistics caseId={selectedCaseId} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <AdvancedReports />
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Exportar Dados de Simulação</CardTitle>
                      <CardDescription>
                        Exporte seus dados de desempenho para análise externa. Estes relatórios estarão disponíveis para seu professor.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>
          Este é um simulador educacional. Os casos são fictícios e destinados
          apenas para fins de aprendizado.
        </p>
      </footer>

      {/* Tutorial Guiado */}
      {showTutorial && selectedCaseId && (
        <GuidedTutorial
          caseId={selectedCaseId}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
};

export default Index;
