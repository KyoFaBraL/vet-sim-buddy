import { useState, useEffect } from "react";
import { Activity, LogOut } from "lucide-react";
import MonitorDisplay from "@/components/MonitorDisplay";
import CaseInfo from "@/components/CaseInfo";
import SimulationControls from "@/components/SimulationControls";
import TreatmentPanel from "@/components/TreatmentPanel";
import HPDisplay from "@/components/HPDisplay";
import ReportPanel from "@/components/ReportPanel";
import { Auth } from "@/components/Auth";
import { CaseManager } from "@/components/CaseManager";
import { LearningGoals } from "@/components/LearningGoals";
import { TreatmentHints } from "@/components/TreatmentHints";
import { RoleSelector } from "@/components/RoleSelector";
import { CaseShareManager } from "@/components/CaseShareManager";
import { AccessCodeInput } from "@/components/AccessCodeInput";
import { SimulationNotes } from "@/components/SimulationNotes";
import { PerformanceStatistics } from "@/components/PerformanceStatistics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundAlerts } from "@/components/SoundAlerts";
import { SimulationComparison } from "@/components/SimulationComparison";
import { PerformanceStats } from "@/components/PerformanceStats";
import { SessionHistory } from "@/components/SessionHistory";
import { CaseDataPopulator } from "@/components/CaseDataPopulator";
import { useSimulation } from "@/hooks/useSimulation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parameterDescriptions } from "@/constants/parameterDescriptions";

interface Treatment {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<"professor" | "aluno" | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const {
    parameters,
    currentState,
    previousState,
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

  useEffect(() => {
    if (user) {
      loadTreatments();
      loadCases();
      checkUserRole();
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

  const checkUserRole = async () => {
    setRoleLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .maybeSingle();
    
    setUserRole(data?.role || null);
    setRoleLoading(false);
  };

  const handleCaseAccessed = (caseId: number) => {
    setSelectedCaseId(caseId);
    loadCases();
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(parseInt(caseId));
    setAppliedTreatments([]);
    setGoalPoints(0);
    resetSimulation();
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
    const treatmentName = await applyTreatment(treatmentId);
    if (treatmentName) {
      setAppliedTreatments(prev => [...prev, `${new Date().toLocaleTimeString('pt-BR')}: ${treatmentName}`]);
      
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
    return <RoleSelector userId={user.id} onRoleSet={checkUserRole} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Simulador Veterinário
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SoundAlerts
                parameters={parameters}
                currentState={currentState}
                getParameterStatus={getParameterStatus}
                isRunning={isRunning}
              />
              <ThemeToggle />
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Sistema de simulação médica veterinária para distúrbios ácido-base
          </p>
        </div>

        {/* Access Code Input for Students */}
        {userRole === "aluno" && (
          <div className="mb-8 max-w-2xl mx-auto">
            <AccessCodeInput onCaseAccessed={handleCaseAccessed} />
          </div>
        )}

        {/* Case Selection and Management */}
        <div className="mb-8 grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Caso</label>
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
          {userRole === "professor" ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Compartilhar Caso</label>
                <CaseShareManager availableCases={availableCases} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">IA do Caso</label>
                <CaseDataPopulator caseId={selectedCaseId} onDataGenerated={loadTreatments} />
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm font-medium mb-2 block">Gerenciar Casos</label>
              <CaseManager onCaseCreated={loadCases} />
            </div>
          )}
        </div>

        {/* Case Information */}
        {caseData && (
          <div className="mb-8">
            <CaseInfo
              caseName={caseData.nome}
              description={caseData.descricao}
              species={caseData.especie}
              condition={caseData.condicoes?.nome || "N/A"}
            />
          </div>
        )}

        {/* Simulation Controls */}
        <div className="mb-8 flex justify-center">
          <SimulationControls
            isRunning={isRunning}
            onToggle={toggleSimulation}
            onReset={resetSimulation}
          />
        </div>

        {/* Monitor Grid */}
        <div className="mb-8">
          <div className="p-6 rounded-xl bg-gradient-to-br from-monitor-bg to-monitor-bg/80 border-4 border-monitor-grid shadow-monitor">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainParameters.map((paramName) => {
                const param = parameters.find((p) => p.nome === paramName);
                if (!param) return null;

                const value = currentState[param.id] || 0;
                const { isNormal, isCritical } = getParameterStatus(param.id, value);

                return (
                  <MonitorDisplay
                    key={param.id}
                    label={param.nome}
                    value={value}
                    unit={param.unidade || ""}
                    isNormal={isNormal}
                    isCritical={isCritical}
                    tooltip={parameterDescriptions[param.nome]}
                    trend={getParameterTrend(param.id, value)}
                    previousValue={previousState[param.id]}
                  />
                );
              })}
            </div>

            {/* Heartbeat Line Indicator */}
            {isRunning && (
              <div className="mt-6 flex items-center gap-2 text-monitor-text/70">
                <div className="h-2 w-2 rounded-full bg-monitor-normal animate-pulse" />
                <span className="text-sm font-mono">SIMULAÇÃO ATIVA</span>
              </div>
            )}
          </div>
        </div>

        {/* HP Display */}
        <div className="mb-8 max-w-2xl mx-auto">
          <HPDisplay 
            hp={hp} 
            elapsedTime={elapsedTime} 
            gameStatus={gameStatus}
            animalType={caseData?.especie || ""}
            lastHpChange={lastHpChange}
          />
        </div>

        {/* Additional Parameters (Secondary Monitor) - Below Patient Display */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="h-1 w-8 bg-primary rounded-full" />
            Parâmetros Secundários
          </h2>
          <div className="p-6 rounded-xl bg-card border-2 shadow-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {parameters
                .filter((p) => !mainParameters.includes(p.nome))
                .map((param) => {
                  const value = currentState[param.id] || 0;
                  const { isNormal, isCritical } = getParameterStatus(param.id, value);

                  return (
                    <div key={param.id} className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">
                        {param.nome}
                      </div>
                      <div className={`text-2xl font-bold font-mono ${
                        isCritical ? 'text-destructive' : !isNormal ? 'text-warning' : 'text-success'
                      }`}>
                        {value.toFixed(2)}
                        {param.unidade && (
                          <span className="text-sm ml-1 text-muted-foreground">
                            {param.unidade}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Learning Goals */}
        <div className="mb-8">
          <LearningGoals
            key={selectedCaseId}
            caseId={selectedCaseId}
            currentState={currentState}
            parameters={parameters}
            elapsedTime={elapsedTime}
            onGoalAchieved={handleGoalAchieved}
          />
        </div>

        {/* Treatment Hints and Treatments */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <TreatmentHints
            key={selectedCaseId}
            currentState={currentState}
            parameters={parameters}
            caseData={caseData}
            onHpChange={changeHp}
            availableTreatments={treatments}
          />
          <TreatmentPanel
            treatments={treatments}
            onApplyTreatment={handleApplyTreatment}
          />
        </div>

        {/* Simulation Notes */}
        <div className="mb-8">
          <SimulationNotes
            caseId={selectedCaseId}
            elapsedTime={elapsedTime}
            currentState={currentState}
            onNotesChange={(addTreatmentLog) => setAddTreatmentLogFn(() => addTreatmentLog)}
          />
        </div>

        {/* Report Export */}
        <div className="mb-8">
          <ReportPanel
            caseData={caseData}
            parameters={parameters}
            currentState={currentState}
            history={[]}
            appliedTreatments={appliedTreatments}
          />
        </div>

        {/* Analysis Tools */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <SimulationComparison caseId={selectedCaseId} parameters={parameters} />
          </div>
          <PerformanceStats caseId={selectedCaseId} />
          <SessionHistory caseId={selectedCaseId} />
        </div>


        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Simulador desenvolvido para fins educacionais e pesquisa em medicina veterinária
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
