import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Parameter {
  id: number;
  nome: string;
  unidade: string | null;
  valor_minimo: number | null;
  valor_maximo: number | null;
  descricao: string | null;
}

interface Effect {
  id_parametro: number;
  magnitude: number;
  descricao: string | null;
}

interface SimulationState {
  [parameterId: number]: number;
}

interface HistoryPoint {
  timestamp: number;
  values: SimulationState;
}

export const useSimulation = (caseId: number = 1) => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [currentState, setCurrentState] = useState<SimulationState>({});
  const [previousState, setPreviousState] = useState<SimulationState>({});
  const [effects, setEffects] = useState<Effect[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const { toast } = useToast();

  // Carregar dados iniciais
  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    try {
      // Carregar caso clínico
      const { data: caso, error: caseError } = await supabase
        .from("casos_clinicos")
        .select(`
          *,
          condicoes (nome, descricao)
        `)
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caso);

      // Carregar parâmetros
      const { data: params, error: paramsError } = await supabase
        .from("parametros")
        .select("*");

      if (paramsError) throw paramsError;
      setParameters(params || []);

      // Carregar valores iniciais
      const { data: valoresIniciais, error: valoresError } = await supabase
        .from("valores_iniciais_caso")
        .select("*")
        .eq("id_caso", caseId);

      if (valoresError) throw valoresError;

      // Montar estado inicial
      const initialState: SimulationState = {};
      valoresIniciais?.forEach((valor) => {
        initialState[valor.id_parametro] = typeof valor.valor === 'number' ? valor.valor : parseFloat(valor.valor);
      });
      setCurrentState(initialState);

      // Carregar efeitos da condição
      if (caso?.id_condicao_primaria) {
        const { data: efeitosData, error: efeitosError } = await supabase
          .from("efeitos_condicao")
          .select("*")
          .eq("id_condicao", caso.id_condicao_primaria);

        if (efeitosError) throw efeitosError;
        setEffects(efeitosData || []);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar caso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Motor da simulação - aplica efeitos aos parâmetros
  const tick = useCallback(() => {
    setCurrentState((prevState) => {
      // Salvar estado anterior antes de atualizar
      setPreviousState(prevState);
      
      const newState = { ...prevState };
      
      effects.forEach((effect) => {
        const currentValue = newState[effect.id_parametro] || 0;
        const magnitude = typeof effect.magnitude === 'number' ? effect.magnitude : parseFloat(effect.magnitude);
        // Aplicar 10% da magnitude por tick (para evolução gradual)
        newState[effect.id_parametro] = currentValue + (magnitude * 0.1);
      });

      // Adicionar ao histórico
      setHistory((prevHistory) => [
        ...prevHistory,
        {
          timestamp: Date.now() - startTime,
          values: { ...newState },
        },
      ]);

      return newState;
    });
  }, [effects, startTime]);

  // Timer da simulação
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      tick();
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 2000); // Atualiza a cada 2 segundos

    return () => clearInterval(interval);
  }, [isRunning, tick, startTime]);

  const toggleSimulation = () => {
    setIsRunning((prev) => !prev);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setHistory([]);
    setPreviousState({});
    setStartTime(Date.now());
    setElapsedTime(0);
    loadCase();
  };

  const applyTreatment = async (treatmentId: number) => {
    try {
      // Carregar informações do tratamento
      const { data: treatmentData, error: treatmentError } = await supabase
        .from("tratamentos")
        .select("nome")
        .eq("id", treatmentId)
        .single();

      if (treatmentError) throw treatmentError;

      // Carregar efeitos do tratamento
      const { data: treatmentEffects, error } = await supabase
        .from("efeitos_tratamento")
        .select("*")
        .eq("id_tratamento", treatmentId);

      if (error) throw error;

      // Aplicar efeitos imediatamente
      setCurrentState((prevState) => {
        const newState = { ...prevState };
        treatmentEffects?.forEach((effect) => {
          const currentValue = newState[effect.id_parametro] || 0;
          const magnitude = typeof effect.magnitude === 'number' ? effect.magnitude : parseFloat(effect.magnitude);
          newState[effect.id_parametro] = currentValue + magnitude;
        });
        return newState;
      });

      toast({
        title: "Tratamento aplicado",
        description: `${treatmentData.nome} foi aplicado ao paciente`,
      });

      return treatmentData.nome;
    } catch (error: any) {
      toast({
        title: "Erro ao aplicar tratamento",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const getParameterStatus = (parameterId: number, value: number) => {
    const param = parameters.find((p) => p.id === parameterId);
    if (!param) return { isNormal: true, isCritical: false };

    const min = param.valor_minimo ?? -Infinity;
    const max = param.valor_maximo ?? Infinity;

    const range = max - min;
    const warningThreshold = range * 0.1; // 10% de margem

    const isCritical = value < min || value > max;
    const isNormal = value >= (min + warningThreshold) && value <= (max - warningThreshold);

    return { isNormal, isCritical };
  };

  const getParameterTrend = (parameterId: number, currentValue: number): "up" | "down" | "stable" | null => {
    const previousValue = previousState[parameterId];
    if (previousValue === undefined) return null;
    
    const threshold = 0.01; // Threshold para considerar mudança significativa
    const change = currentValue - previousValue;
    
    if (Math.abs(change) < threshold) return "stable";
    return change > 0 ? "up" : "down";
  };

  const saveSession = async (nome: string, notas: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calcular duração
    const duracao = Math.floor((Date.now() - startTime) / 1000);

    // Criar sessão
    const { data: session, error: sessionError } = await supabase
      .from("simulation_sessions")
      .insert({
        user_id: user.id,
        case_id: caseId,
        nome,
        notas,
        data_fim: new Date().toISOString(),
        duracao_segundos: duracao,
        status: 'concluida'
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error("Erro ao salvar sessão:", sessionError);
      return;
    }

    // Salvar histórico de parâmetros
    const historyData = history.flatMap(point =>
      Object.entries(point.values).map(([paramId, value]) => ({
        session_id: session.id,
        timestamp: point.timestamp,
        parametro_id: parseInt(paramId),
        valor: Number(value)
      }))
    );

    const { error: historyError } = await supabase
      .from("session_history")
      .insert(historyData);

    if (historyError) {
      console.error("Erro ao salvar histórico:", historyError);
    }

    console.log("Sessão salva com sucesso!");
  };

  const loadSession = async (sessionId: string) => {
    // Carregar dados da sessão
    const { data: session, error: sessionError } = await supabase
      .from("simulation_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Erro ao carregar sessão:", sessionError);
      return;
    }

    // Carregar histórico
    const { data: historyData, error: historyError } = await supabase
      .from("session_history")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp");

    if (historyError) {
      console.error("Erro ao carregar histórico:", historyError);
      return;
    }

    // Reconstruir histórico
    const reconstructedHistory: HistoryPoint[] = [];
    const timestamps = [...new Set(historyData?.map(h => h.timestamp) || [])];

    timestamps.forEach(timestamp => {
      const stateAtTime: Record<number, number> = {};
      historyData
        ?.filter(h => h.timestamp === timestamp)
        .forEach(h => {
          stateAtTime[h.parametro_id] = parseFloat(h.valor.toString());
        });
      
      reconstructedHistory.push({
        timestamp,
        values: stateAtTime
      });
    });

    setHistory(reconstructedHistory);
    
    // Definir estado atual como o último ponto do histórico
    if (reconstructedHistory.length > 0) {
      setCurrentState(reconstructedHistory[reconstructedHistory.length - 1].values);
    }
  };

  return {
    parameters,
    currentState,
    previousState,
    isRunning,
    caseData,
    history,
    elapsedTime,
    toggleSimulation,
    resetSimulation,
    applyTreatment,
    getParameterStatus,
    getParameterTrend,
    saveSession,
    loadSession,
  };
};
