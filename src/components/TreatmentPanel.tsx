import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Syringe } from "lucide-react";

interface Treatment {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
}

interface TreatmentPanelProps {
  treatments: Treatment[];
  onApplyTreatment: (treatmentId: number) => void;
}

const TreatmentPanel = ({ treatments, onApplyTreatment }: TreatmentPanelProps) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-primary" />
          Tratamentos Disponíveis
        </CardTitle>
        <CardDescription>
          Selecione um tratamento para aplicar ao paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {treatments.map((treatment) => (
            <Button
              key={treatment.id}
              onClick={() => onApplyTreatment(treatment.id)}
              variant="outline"
              className="h-auto py-3 px-4 justify-start text-left w-full"
            >
              <div className="flex flex-col gap-2 w-full">
                <div className="font-semibold">{treatment.nome}</div>
                <div className="text-xs text-muted-foreground">{treatment.descricao}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPanel;
