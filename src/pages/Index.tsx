import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import MonitorDisplay from "@/components/MonitorDisplay";
import CaseInfo from "@/components/CaseInfo";
import SimulationControls from "@/components/SimulationControls";
import TreatmentPanel from "@/components/TreatmentPanel";
import ParameterChart from "@/components/ParameterChart";
import { useSimulation } from "@/hooks/useSimulation";
import { supabase } from "@/integrations/supabase/client";

interface Treatment {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
}

const Index = () => {
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
  } = useSimulation(1);

  const [treatments, setTreatments] = useState<Treatment[]>([]);

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    const { data } = await supabase
      .from("tratamentos")
      .select("*");
    
    if (data) setTreatments(data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Simulador Veterinário
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sistema de simulação médica veterinária para distúrbios ácido-base
          </p>
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
        <div className="max-w-2xl mx-auto">
          <TreatmentPanel
            treatments={treatments}
            onApplyTreatment={applyTreatment}
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
