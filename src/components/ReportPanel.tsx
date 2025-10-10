import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Parameter {
  id: number;
  nome: string;
  unidade: string | null;
}

interface HistoryPoint {
  timestamp: number;
  values: { [parameterId: number]: number };
}

interface ReportPanelProps {
  caseData: any;
  parameters: Parameter[];
  currentState: { [parameterId: number]: number };
  history: HistoryPoint[];
  appliedTreatments?: string[];
}

const ReportPanel = ({ caseData, parameters, currentState, history, appliedTreatments = [] }: ReportPanelProps) => {
  const { toast } = useToast();

  const formatTimestamp = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Execute a simulação primeiro para gerar dados",
        variant: "destructive",
      });
      return;
    }

    // Cabeçalho do CSV
    const headers = ['Tempo (s)', ...parameters.map(p => `${p.nome} ${p.unidade ? `(${p.unidade})` : ''}`)];
    
    // Dados
    const rows = history.map(point => {
      const time = (point.timestamp / 1000).toFixed(2);
      const values = parameters.map(param => {
        const value = point.values[param.id];
        return value !== undefined ? value.toFixed(2) : '';
      });
      return [time, ...values];
    });

    // Criar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `simulacao_${caseData?.nome || 'dados'}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório CSV exportado",
      description: "Os dados foram salvos em formato CSV",
    });
  };

  const exportToText = () => {
    if (!caseData) {
      toast({
        title: "Sem dados para exportar",
        description: "Carregue um caso clínico primeiro",
        variant: "destructive",
      });
      return;
    }

    const currentDateTime = new Date().toLocaleString('pt-BR');
    
    let report = `
═══════════════════════════════════════════════════════════════
          RELATÓRIO DE SIMULAÇÃO MÉDICA VETERINÁRIA
═══════════════════════════════════════════════════════════════

Data e Hora: ${currentDateTime}

───────────────────────────────────────────────────────────────
INFORMAÇÕES DO CASO CLÍNICO
───────────────────────────────────────────────────────────────

Nome do Caso: ${caseData.nome}
Espécie: ${caseData.especie || 'Não especificada'}
Condição Primária: ${caseData.condicoes?.nome || 'Não especificada'}

Descrição:
${caseData.descricao || 'Sem descrição'}

───────────────────────────────────────────────────────────────
PARÂMETROS ATUAIS
───────────────────────────────────────────────────────────────

`;

    parameters.forEach(param => {
      const value = currentState[param.id];
      if (value !== undefined) {
        report += `${param.nome}: ${value.toFixed(2)} ${param.unidade || ''}\n`;
      }
    });

    if (appliedTreatments.length > 0) {
      report += `
───────────────────────────────────────────────────────────────
TRATAMENTOS APLICADOS
───────────────────────────────────────────────────────────────

${appliedTreatments.join('\n')}
`;
    }

    if (history.length > 0) {
      report += `
───────────────────────────────────────────────────────────────
HISTÓRICO DA SIMULAÇÃO
───────────────────────────────────────────────────────────────

Total de registros: ${history.length}
Duração: ${formatTimestamp(history[history.length - 1].timestamp)}

Resumo Estatístico:
`;

      parameters.forEach(param => {
        const values = history
          .map(h => h.values[param.id])
          .filter(v => v !== undefined);
        
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          
          report += `
${param.nome}:
  Mínimo: ${min.toFixed(2)} ${param.unidade || ''}
  Máximo: ${max.toFixed(2)} ${param.unidade || ''}
  Média: ${avg.toFixed(2)} ${param.unidade || ''}
`;
        }
      });
    }

    report += `
───────────────────────────────────────────────────────────────
FIM DO RELATÓRIO
───────────────────────────────────────────────────────────────
`;

    // Download
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${caseData.nome}_${Date.now()}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "O relatório completo foi salvo em formato texto",
    });
  };

  const exportSummary = () => {
    if (!caseData || history.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Execute a simulação primeiro para gerar dados",
        variant: "destructive",
      });
      return;
    }

    const summary = {
      caso: {
        nome: caseData.nome,
        especie: caseData.especie,
        condicao: caseData.condicoes?.nome,
        descricao: caseData.descricao,
      },
      simulacao: {
        data: new Date().toISOString(),
        duracao_segundos: history[history.length - 1].timestamp / 1000,
        total_registros: history.length,
      },
      parametros_finais: Object.fromEntries(
        parameters.map(param => [
          param.nome,
          {
            valor: currentState[param.id]?.toFixed(2),
            unidade: param.unidade,
          }
        ])
      ),
      tratamentos_aplicados: appliedTreatments,
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `resumo_${caseData.nome}_${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Resumo exportado",
      description: "Resumo JSON salvo com sucesso",
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="h-1 w-8 bg-primary rounded-full" />
          Exportar Relatórios
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Exporte os dados da simulação para análise
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <FileSpreadsheet className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold">Dados CSV</div>
            <div className="text-xs text-muted-foreground">
              Histórico completo
            </div>
          </div>
        </Button>

        <Button
          onClick={exportToText}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <FileText className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold">Relatório Texto</div>
            <div className="text-xs text-muted-foreground">
              Resumo detalhado
            </div>
          </div>
        </Button>

        <Button
          onClick={exportSummary}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <FileDown className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold">Resumo JSON</div>
            <div className="text-xs text-muted-foreground">
              Dados estruturados
            </div>
          </div>
        </Button>
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Dica:</strong> Use o CSV para análise em planilhas, o relatório texto para documentação,
          e o JSON para integração com outras ferramentas.
        </p>
      </div>
    </Card>
  );
};

export default ReportPanel;
