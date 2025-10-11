import { useState, useEffect } from "react";
import { Activity, LogOut } from "lucide-react";
import MonitorDisplay from "@/components/MonitorDisplay";
import CaseInfo from "@/components/CaseInfo";
import SimulationControls from "@/components/SimulationControls";
import TreatmentPanel from "@/components/TreatmentPanel";
import ParameterChart from "@/components/ParameterChart";
import ReportPanel from "@/components/ReportPanel";
import { Auth } from "@/components/Auth";
import { CaseManager } from "@/components/CaseManager";
import { SessionManager } from "@/components/SessionManager";
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
  
  const {
    parameters,
    currentState,
    isRunning,
    caseData,
    history,
    toggleSimulation,
    resetSimulation,
    applyTreatment,
    getParameterStatus,
    saveSession,
    loadSession,
  } = useSimulation(selectedCaseId);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appliedTreatments, setAppliedTreatments] = useState<string[]>([]);

  useEffect(() => {
    loadTreatments();
    loadCases();
  }, [user]);

  const loadTreatments = async () => {
    const { data } = await supabase
      .from("tratamentos")
      .select("*");
    
    if (data) setTreatments(data);
  };

  const loadCases = async () => {
    const { data } = await supabase
      .from("casos_clinicos")
      .select("id, nome, especie, user_id")
      .order("criado_em", { ascending: false });
    
    if (data) setAvailableCases(data);
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(parseInt(caseId));
    setAppliedTreatments([]);
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
    }
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
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Sistema de simulação médica veterinária para distúrbios ácido-base
          </p>
        </div>

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
          <div>
            <label className="text-sm font-medium mb-2 block">Gerenciar Casos</label>
            <CaseManager onCaseCreated={loadCases} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Histórico de Sessões</label>
            <SessionManager 
              onSaveSession={saveSession}
              onLoadSession={loadSession}
            />
          </div>
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

        {/* Temporal Charts */}
        <div className="mb-8">
          <ParameterChart 
            history={history}
            parameters={parameters}
          />
        </div>

        {/* Treatments Panel */}
        <div className="max-w-2xl mx-auto mb-8">
          <TreatmentPanel
            treatments={treatments}
            onApplyTreatment={handleApplyTreatment}
          />
        </div>

        {/* Report Export */}
        <div className="mb-8">
          <ReportPanel
            caseData={caseData}
            parameters={parameters}
            currentState={currentState}
            history={history}
            appliedTreatments={appliedTreatments}
          />
        </div>

        {/* Additional Parameters (Secondary Monitor) */}
        <div className="mt-8">
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
