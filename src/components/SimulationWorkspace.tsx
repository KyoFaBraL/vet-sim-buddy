import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Stethoscope, Lightbulb, FileText } from "lucide-react";
import TreatmentPanel from "@/components/TreatmentPanel";
import { TreatmentHints } from "@/components/TreatmentHints";
import { DiagnosticChallenge } from "@/components/DiagnosticChallenge";
import { SimulationNotes } from "@/components/SimulationNotes";

interface Treatment {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
}

interface SimulationWorkspaceProps {
  isRunning: boolean;
  simulationMode: 'practice' | 'evaluation';
  treatments: Treatment[];
  onApplyTreatment: (treatmentId: number) => void;
  currentState: Record<number, number>;
  parameters: any[];
  caseData: any;
  onHpChange: (delta: number) => void;
  caseId: number;
  elapsedTime: number;
  onDiagnosticSuccess: () => void;
  onNotesChange: (fn: any) => void;
}

export const SimulationWorkspace = ({
  isRunning,
  simulationMode,
  treatments,
  onApplyTreatment,
  currentState,
  parameters,
  caseData,
  onHpChange,
  caseId,
  elapsedTime,
  onDiagnosticSuccess,
  onNotesChange
}: SimulationWorkspaceProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Área de Trabalho
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tratamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tratamentos">
              <Activity className="h-4 w-4 mr-2" />
              Tratamentos
            </TabsTrigger>
            <TabsTrigger value="dicas">
              <Lightbulb className="h-4 w-4 mr-2" />
              Dicas
            </TabsTrigger>
            <TabsTrigger value="diagnostico">
              <Stethoscope className="h-4 w-4 mr-2" />
              Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="notas">
              <FileText className="h-4 w-4 mr-2" />
              Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tratamentos" className="mt-4">
            <TreatmentPanel
              treatments={treatments}
              onApplyTreatment={onApplyTreatment}
              disabled={!isRunning}
            />
          </TabsContent>

          <TabsContent value="dicas" className="mt-4">
            <TreatmentHints
              currentState={currentState}
              parameters={parameters}
              caseData={caseData}
              onHpChange={onHpChange}
              disabled={!isRunning}
              simulationMode={simulationMode}
              availableTreatments={treatments}
            />
          </TabsContent>

          <TabsContent value="diagnostico" className="mt-4">
            <DiagnosticChallenge
              caseId={caseId}
              currentState={currentState}
              parameters={parameters}
              onSuccess={onDiagnosticSuccess}
              disabled={!isRunning}
            />
          </TabsContent>

          <TabsContent value="notas" className="mt-4">
            <SimulationNotes
              caseId={caseId}
              elapsedTime={elapsedTime}
              currentState={currentState}
              onNotesChange={onNotesChange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
