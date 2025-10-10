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
  const [effects, setEffects] = useState<Effect[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [startTime] = useState<number>(Date.now());
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
    }, 2000); // Atualiza a cada 2 segundos

    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const toggleSimulation = () => {
    setIsRunning((prev) => !prev);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setHistory([]);
    loadCase();
  };

  const applyTreatment = async (treatmentId: number) => {
    try {
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
        description: "Os efeitos do tratamento foram aplicados ao paciente",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao aplicar tratamento",
        description: error.message,
        variant: "destructive",
      });
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

  return {
    parameters,
    currentState,
    isRunning,
    caseData,
    history,
    toggleSimulation,
    resetSimulation,
    applyTreatment,
    getParameterStatus,
  };
};
