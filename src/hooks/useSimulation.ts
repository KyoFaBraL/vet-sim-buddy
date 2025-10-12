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
  const [isRunning, setIsRunning] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [hp, setHp] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
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

      // Resetar HP e game status
      setHp(0);
      setGameStatus('playing');
    } catch (error: any) {
      toast({
        title: "Erro ao carregar caso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Motor da simulação - atualiza timer e verifica condição de derrota
  const tick = useCallback(() => {
    setPreviousState(currentState);
    setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    
    // Perder HP com o tempo (deterioração do paciente)
    setHp(prev => {
      const newHp = Math.max(0, prev - 2);
      if (newHp <= 0 && gameStatus === 'playing') {
        setGameStatus('lost');
        setIsRunning(false);
        toast({
          title: "Paciente faleceu",
          description: "O HP chegou a zero. Tente novamente!",
          variant: "destructive",
        });
      }
      return newHp;
    });
  }, [currentState, startTime, gameStatus, toast]);

  // Timer da simulação
  useEffect(() => {
    if (!isRunning || gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tick();
    }, 3000); // Atualiza a cada 3 segundos

    return () => clearInterval(interval);
  }, [isRunning, tick, gameStatus]);

  // Verificar limite de tempo (10 minutos = 600 segundos)
  useEffect(() => {
    if (elapsedTime >= 600 && gameStatus === 'playing') {
      setGameStatus('lost');
      setIsRunning(false);
      toast({
        title: "Tempo esgotado",
        description: "O paciente não resistiu. O tempo máximo de 10 minutos foi atingido.",
        variant: "destructive",
      });
    }
  }, [elapsedTime, gameStatus, toast]);

  const toggleSimulation = () => {
    setIsRunning((prev) => !prev);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setPreviousState({});
    setStartTime(Date.now());
    setElapsedTime(0);
    setHp(0);
    setGameStatus('playing');
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

      // Verificar se o tratamento é adequado para a condição
      const { data: adequateTreatment } = await supabase
        .from("tratamentos_adequados")
        .select("prioridade")
        .eq("condicao_id", caseData?.id_condicao_primaria)
        .eq("tratamento_id", treatmentId)
        .maybeSingle();

      // Carregar efeitos do tratamento
      const { data: treatmentEffects, error } = await supabase
        .from("efeitos_tratamento")
        .select("*")
        .eq("id_tratamento", treatmentId);

      if (error) throw error;

      // Aplicar efeitos imediatamente aos parâmetros
      setCurrentState((prevState) => {
        const newState = { ...prevState };
        treatmentEffects?.forEach((effect) => {
          const currentValue = newState[effect.id_parametro] || 0;
          const magnitude = typeof effect.magnitude === 'number' ? effect.magnitude : parseFloat(effect.magnitude);
          newState[effect.id_parametro] = currentValue + magnitude;
        });
        return newState;
      });

      // Calcular impacto no HP baseado na adequação do tratamento
      let hpChange = 0;
      if (adequateTreatment) {
        // Tratamento adequado - ganha HP
        switch (adequateTreatment.prioridade) {
          case 1: // Alta prioridade
            hpChange = 25;
            break;
          case 2: // Média prioridade
            hpChange = 15;
            break;
          case 3: // Baixa prioridade
            hpChange = 10;
            break;
        }
      } else {
        // Tratamento inadequado - perde HP
        hpChange = -15;
      }

      setHp(prev => {
        const newHp = Math.min(100, Math.max(0, prev + hpChange));
        
        // Verificar vitória
        if (newHp >= 100 && gameStatus === 'playing') {
          setGameStatus('won');
          setIsRunning(false);
          toast({
            title: "🎉 Paciente Estabilizado!",
            description: "Você conseguiu normalizar o quadro do paciente. Parabéns!",
            variant: "default",
          });
        }
        
        // Verificar derrota
        if (newHp <= 0 && gameStatus === 'playing') {
          setGameStatus('lost');
          setIsRunning(false);
          toast({
            title: "Paciente faleceu",
            description: "O HP chegou a zero. Tente novamente!",
            variant: "destructive",
          });
        }
        
        return newHp;
      });

      toast({
        title: adequateTreatment ? "✓ Tratamento Correto" : "✗ Tratamento Inadequado",
        description: `${treatmentData.nome} foi aplicado. HP ${hpChange > 0 ? '+' : ''}${hpChange}`,
        variant: adequateTreatment ? "default" : "destructive",
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

    const duracao = Math.floor((Date.now() - startTime) / 1000);

    const { error: sessionError } = await supabase
      .from("simulation_sessions")
      .insert({
        user_id: user.id,
        case_id: caseId,
        nome,
        notas,
        data_fim: new Date().toISOString(),
        duracao_segundos: duracao,
        status: gameStatus === 'won' ? 'concluida' : 'em_andamento'
      });

    if (sessionError) {
      console.error("Erro ao salvar sessão:", sessionError);
      return;
    }

    console.log("Sessão salva com sucesso!");
  };

  const loadSession = async (sessionId: string) => {
    const { data: session, error: sessionError } = await supabase
      .from("simulation_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Erro ao carregar sessão:", sessionError);
      return;
    }

    toast({
      title: "Sessão carregada",
      description: "Sessão anterior foi restaurada",
    });
  };

  return {
    parameters,
    currentState,
    previousState,
    isRunning,
    caseData,
    elapsedTime,
    hp,
    gameStatus,
    toggleSimulation,
    resetSimulation,
    applyTreatment,
    getParameterStatus,
    getParameterTrend,
    saveSession,
    loadSession,
  };
};
