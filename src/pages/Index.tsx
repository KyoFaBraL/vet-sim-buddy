import { useState, useEffect } from "react";
import { Activity, LogOut, Settings } from "lucide-react";
import MonitorDisplay from "@/components/MonitorDisplay";
import CaseInfo from "@/components/CaseInfo";
import SimulationControls from "@/components/SimulationControls";
import { Auth } from "@/components/Auth";
import { CaseManager } from "@/components/CaseManager";
import { LearningGoals } from "@/components/LearningGoals";
import { RoleSelector } from "@/components/RoleSelector";
import { VoiceCommands } from "@/components/VoiceCommands";
import { useUserRole } from "@/hooks/useUserRole";
import { CaseShareManager } from "@/components/CaseShareManager";
import { AccessCodeInput } from "@/components/AccessCodeInput";
import { PerformanceStatistics } from "@/components/PerformanceStatistics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundAlertsExtended } from "@/components/SoundAlertsExtended";
import { SessionComparison } from "@/components/SessionComparison";
import { PerformanceStats } from "@/components/PerformanceStats";
import { SessionHistory } from "@/components/SessionHistory";
import { CaseDataPopulator } from "@/components/CaseDataPopulator";
import { BadgeSystem } from "@/components/BadgeSystem";
import { GuidedTutorial } from "@/components/GuidedTutorial";
import { AdvancedReports } from "@/components/AdvancedReports";
import { TreatmentFeedback } from "@/components/TreatmentFeedback";
import { CaseLibrary } from "@/components/CaseLibrary";
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

  const loadTreatments = async () => {
    // Carregar tratamentos gerais
    const { data: allTreatments } = await supabase
      .from("tratamentos")
      .select("*");
    
    // Carregar tratamentos específicos do caso (se existirem)
    const { data: caseTreatments } = await supabase
      .from("tratamentos_caso")
      .select("tratamento_id")
      .eq("case_id", selectedCaseId);
    
    if (caseTreatments && caseTreatments.length > 0) {
      // Filtrar apenas tratamentos adequados para este caso
      const treatmentIds = caseTreatments.map(ct => ct.tratamento_id);
      const filteredTreatments = allTreatments?.filter(t => treatmentIds.includes(t.id)) || [];
      setTreatments(filteredTreatments);
    } else {
      // Usar todos os tratamentos se não houver específicos
      if (allTreatments) setTreatments(allTreatments);
    }
  };

  const loadCases = async () => {
    const { data } = await supabase
      .from("casos_clinicos")
      .select("id, nome, especie, user_id")
      .order("criado_em", { ascending: false });
    
    if (data) setAvailableCases(data);
  };


  const handleCaseAccessed = (caseId: number) => {
    setSelectedCaseId(caseId);
    loadCases();
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(parseInt(caseId));
    setAppliedTreatments([]);  // Reset do log de tratamentos
    setGoalPoints(0);           // Reset das metas
    setDiagnosticPoints(0);     // Reset dos pontos de diagnóstico
    setCompletedSessionId(null); // Reset da sessão
    resetSimulation();
  };

  const handleSimulationEnd = (sessionId: string) => {
    setCompletedSessionId(sessionId);
    if (simulationMode === 'evaluation') {
      setShowFeedbackDialog(true);
    }
  };

  // Parâmetros principais para exibir no monitor
  const mainParameters = [
    'pH',
    'PaO2',
    'PaCO2',
    'FrequenciaCardiaca',
    'PressaoArterial',
    'Lactato',
  ];

  const handleApplyTreatment = async (treatmentId: number) => {
    // Capturar estado antes do tratamento
    const estadoAntes = { ...currentState };
    
    const treatmentName = await applyTreatment(treatmentId);
    if (treatmentName) {
      setAppliedTreatments(prev => [...prev, `${new Date().toLocaleTimeString('pt-BR')}: ${treatmentName}`]);
      
      // Aguardar um pequeno delay para capturar o novo estado
      setTimeout(() => {
        const estadoDepois = currentState;
        
        // Identificar parâmetros afetados (principais)
        const mainParamNames = ['pH', 'PaO2', 'PaCO2', 'FrequenciaCardiaca', 'PressaoArterial', 'Lactato'];
        const parametrosAfetados = parameters
          .filter(p => mainParamNames.includes(p.nome))
          .map(p => ({
            nome: p.nome,
            valorAntes: estadoAntes[p.id] || 0,
            valorDepois: estadoDepois[p.id] || 0,
            unidade: p.unidade || ''
          }))
          .filter(p => Math.abs(p.valorDepois - p.valorAntes) > 0.01); // Apenas mudanças significativas

        if (parametrosAfetados.length > 0) {
          setFeedbackData({
            treatmentName,
            effects: parametrosAfetados
          });
          setShowFeedback(true);
        }
      }, 100);
      
      // Log tratamento nas notas clínicas automaticamente
      if (addTreatmentLogFn) {
        await addTreatmentLogFn(treatmentName);
      }
    }
  };

  const handleGoalAchieved = (goalId: string, points: number) => {
    setGoalPoints(prev => prev + points);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (!userRole) {
    return <RoleSelector userId={user.id} onRoleSet={() => window.location.reload()} />;
  }

  const isProfessor = userRole === "professor";
  const isAluno = userRole === "aluno";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-6">
        {/* Header Compacto */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Simulador Veterinário</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant={isProfessor ? "default" : "secondary"} className="text-xs">
                    {isProfessor ? "👨‍🏫 Professor" : "👨‍🎓 Aluno"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SoundAlertsExtended
                parameters={parameters}
                currentState={currentState}
                getParameterStatus={getParameterStatus}
                isRunning={isRunning}
              />
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <Separator className="mb-6" />

        {/* Seleção de Modo e Caso */}
        <div className="mb-6 space-y-4">
          <SimulationModeSelector
            currentMode={simulationMode}
            onModeChange={setSimulationMode}
            disabled={isRunning}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Caso
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Caso Selecionado</label>
                <Select value={selectedCaseId.toString()} onValueChange={handleCaseChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCases.map((caso) => (
                      <SelectItem key={caso.id} value={caso.id.toString()}>
                        {caso.nome} {caso.user_id ? "(Personalizado)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isProfessor && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Compartilhar</label>
                    <CaseShareManager availableCases={availableCases} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">IA do Caso</label>
                    <CaseDataPopulator caseId={selectedCaseId} onDataGenerated={loadTreatments} />
                  </div>
                </>
              )}
              {isAluno && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Acessar Caso Compartilhado</label>
                  <AccessCodeInput onCaseAccessed={handleCaseAccessed} />
                </div>
              )}
            </CardContent>
          </Card>

          {caseData && (
            <CaseInfo
              caseName={caseData.nome}
              description={caseData.descricao}
              species={caseData.especie}
              condition={caseData.condicoes?.nome || "N/A"}
            />
          )}
        </div>

        {/* Comandos de Voz (apenas para Alunos) */}
        {isAluno && selectedCaseId && (
          <div className="mb-6">
            <VoiceCommands
              enabled={isRunning}
              onCommand={(command) => {
                if (command.includes("parar") || command.includes("pausar")) {
                  if (isRunning) toggleSimulation();
                } else if (command.includes("iniciar") || command.includes("começar")) {
                  if (!isRunning) toggleSimulation();
                } else if (command.includes("resetar") || command.includes("reiniciar")) {
                  resetSimulation();
                }
              }}
            />
          </div>
        )}

        {/* Controles de Simulação */}
        <Card className="mb-6">
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
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Coluna Esquerda: Monitor do Paciente */}
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Parâmetros Secundários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {parameters
                    .filter((p) => !mainParameters.includes(p.nome))
                    .map((param) => {
                      const value = currentState[param.id] || 0;
                      const { isNormal, isCritical } = getParameterStatus(param.id, value);

                      return (
                        <div key={param.id} className={`p-2 rounded-lg border ${
                          isCritical ? 'border-destructive bg-destructive/10' : 
                          !isNormal ? 'border-warning bg-warning/10' : 
                          'border-success bg-success/10'
                        }`}>
                          <div className="text-xs text-muted-foreground font-medium">
                            {param.nome}
                          </div>
                          <div className={`text-lg font-bold font-mono ${
                            isCritical ? 'text-destructive' : !isNormal ? 'text-warning' : 'text-success'
                          }`}>
                            {value.toFixed(2)}
                            {param.unidade && (
                              <span className="text-xs ml-1 text-muted-foreground">
                                {param.unidade}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Workspace */}
          <div>
            <SimulationWorkspace
              isRunning={isRunning}
              simulationMode={simulationMode}
              treatments={treatments}
              onApplyTreatment={handleApplyTreatment}
              currentState={currentState}
              parameters={parameters}
              caseData={caseData}
              onHpChange={changeHp}
              caseId={selectedCaseId}
              elapsedTime={elapsedTime}
              onDiagnosticSuccess={() => {
                setDiagnosticPoints(prev => prev + 10);
                changeHp(5);
              }}
              onNotesChange={setAddTreatmentLogFn}
            />
          </div>
        </div>

        {/* Gráfico de Evolução */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Evolução Temporal</CardTitle>
              <CardDescription>Linha do tempo dos parâmetros principais</CardDescription>
            </CardHeader>
            <CardContent>
              <ParameterChart 
                history={history}
                parameters={parameters}
                selectedParameters={parameters.filter(p => mainParameters.includes(p.nome)).map(p => p.id)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Feedback Visual de Tratamento */}
        {feedbackData && (
          <TreatmentFeedback
            treatmentName={feedbackData.treatmentName}
            effects={feedbackData.effects}
            show={showFeedback}
            onHide={() => {
              setShowFeedback(false);
              setFeedbackData(null);
            }}
          />
        )}

        {/* Relatório de Feedback (Modo Avaliação) */}
        {completedSessionId && simulationMode === 'evaluation' && (
          <div className="mb-6">
            <SessionFeedbackReport sessionId={completedSessionId} />
          </div>
        )}

        {/* SEÇÃO DE RELATÓRIOS E ESTATÍSTICAS */}
        <Separator className="my-8" />
        
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            {isProfessor ? "Relatórios e Estatísticas" : "Minhas Estatísticas"}
          </h2>

          <Tabs defaultValue={isProfessor ? "desempenho" : "badges"} className="w-full">
            <TabsList className={isProfessor ? "grid w-full grid-cols-5" : "grid w-full grid-cols-3"}>
              {isProfessor && (
                <>
                  <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
                  <TabsTrigger value="biblioteca">Biblioteca</TabsTrigger>
                </>
              )}
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="comparacao">Comparação</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            {isProfessor && (
              <>
                <TabsContent value="desempenho" className="space-y-6">
                  <PerformanceStatistics caseId={selectedCaseId} />
                  <PerformanceStats caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="biblioteca">
                  <CaseLibrary 
                    selectedCaseId={selectedCaseId}
                    onCaseSelect={(id) => handleCaseChange(id.toString())}
                  />
                </TabsContent>
              </>
            )}

            <TabsContent value="historico">
              <SessionHistory caseId={selectedCaseId} />
            </TabsContent>

            <TabsContent value="comparacao">
              {user && (
                <SessionComparison
                  currentCaseId={selectedCaseId}
                  userId={user.id}
                />
              )}
            </TabsContent>

            <TabsContent value="badges">
              <BadgeSystem />
            </TabsContent>
          </Tabs>

          {isProfessor && (
            <AdvancedReports userRole={userRole} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-6">
          <p>
            Simulador desenvolvido para fins educacionais e pesquisa em medicina veterinária
          </p>
        </div>
      </div>

      {/* Tutorial */}
      {showTutorial && selectedCaseId && (
        <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tutorial Guiado</DialogTitle>
              <DialogDescription>
                Aprenda a usar o simulador passo a passo
              </DialogDescription>
            </DialogHeader>
            <GuidedTutorial caseId={selectedCaseId} onClose={() => setShowTutorial(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Index;
