import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HistoryPoint {
  timestamp: number;
  values: { [parameterId: number]: number };
}

interface Parameter {
  id: number;
  nome: string;
  unidade: string | null;
}

interface ParameterChartProps {
  history: HistoryPoint[];
  parameters: Parameter[];
  selectedParameters?: number[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const ParameterChart = ({ history, parameters, selectedParameters }: ParameterChartProps) => {
  // Se não houver parâmetros selecionados, usar os principais
  const defaultParams = ['pH', 'PaO2', 'PaCO2', 'FrequenciaCardiaca', 'Lactato'];
  const displayParams = selectedParameters || 
    parameters.filter(p => defaultParams.includes(p.nome)).map(p => p.id);

  // Transformar dados para o formato do Recharts
  const chartData = history.map((point) => {
    const dataPoint: any = {
      time: (point.timestamp / 1000).toFixed(0), // Converter para segundos
    };

    displayParams.forEach((paramId) => {
      const param = parameters.find(p => p.id === paramId);
      if (param && point.values[paramId] !== undefined) {
        dataPoint[param.nome] = Number(point.values[paramId].toFixed(2));
      }
    });

    return dataPoint;
  });

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Nenhum dado de histórico ainda</p>
          <p className="text-sm">Inicie a simulação para ver os gráficos de evolução temporal</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="h-1 w-8 bg-primary rounded-full" />
          Evolução Temporal dos Parâmetros
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe as mudanças fisiológicas ao longo do tempo
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Tempo (s)', position: 'insideBottom', offset: -5 }}
            stroke="hsl(var(--foreground))"
          />
          <YAxis 
            stroke="hsl(var(--foreground))"
            label={{ value: 'Valor', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            labelFormatter={(value) => `Tempo: ${value}s`}
          />
          <Legend />
          
          {displayParams.map((paramId, index) => {
            const param = parameters.find(p => p.id === paramId);
            if (!param) return null;
            
            return (
              <Line
                key={paramId}
                type="monotone"
                dataKey={param.nome}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={`${param.nome} ${param.unidade ? `(${param.unidade})` : ''}`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ParameterChart;
