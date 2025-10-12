import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from "@/utils/badgeChecker";

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
  const [hp, setHp] = useState<number>(50);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [lastHpChange, setLastHpChange] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [usedHints, setUsedHints] = useState(false);
  const [minHpDuringSession, setMinHpDuringSession] = useState(50);
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

      // Carregar valores iniciais (parâmetros principais)
      const { data: valoresIniciais, error: valoresError } = await supabase
        .from("valores_iniciais_caso")
        .select("*")
        .eq("id_caso", caseId);

      if (valoresError) throw valoresError;

      // Carregar parâmetros secundários
      const { data: parametrosSecundarios } = await supabase
        .from("parametros_secundarios_caso")
        .select("parametro_id, valor")
        .eq("case_id", caseId);

      // Montar estado inicial
      const initialState: SimulationState = {};
      
      // Adicionar valores principais
      valoresIniciais?.forEach((valor) => {
        initialState[valor.id_parametro] = typeof valor.valor === 'number' ? valor.valor : parseFloat(valor.valor);
      });

      // Adicionar valores secundários
      parametrosSecundarios?.forEach((valor) => {
        initialState[valor.parametro_id] = typeof valor.valor === 'number' ? valor.valor : parseFloat(valor.valor);
      });

      setCurrentState(initialState);

      // Resetar HP e game status
      setHp(50);
      setGameStatus('playing');
      setLastHpChange(0);
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
  }, [currentState, startTime]);

  // Timer da simulação - atualiza a cada segundo
  useEffect(() => {
    if (!isRunning || gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, tick, gameStatus]);

  // HP decay - perde 1 HP a cada 5 segundos
  useEffect(() => {
    if (!isRunning || gameStatus !== 'playing') return;

    const hpDecayInterval = setInterval(() => {
      setHp(prev => {
        const newHp = Math.max(0, prev - 1);
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
      setLastHpChange(-1);
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(hpDecayInterval);
  }, [isRunning, gameStatus, toast]);

  // Verificar limite de tempo (5 minutos = 300 segundos)
  useEffect(() => {
    if (elapsedTime >= 300 && gameStatus === 'playing') {
      setGameStatus('lost');
      setIsRunning(false);
      toast({
        title: "Tempo esgotado",
        description: "O paciente não resistiu. O tempo máximo de 5 minutos foi atingido.",
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
    setHp(50);
    setGameStatus('playing');
    setLastHpChange(0);
    setCurrentSessionId(null);
    setUsedHints(false);
    setMinHpDuringSession(50);
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

      let isAdequate = false;
      let eficacia = 0.3;
      let justificativa = "";
      let hpChange = -15;

      // Verificar se é caso personalizado (tem user_id)
      if (caseData?.user_id) {
        // Usar IA para analisar caso personalizado
        try {
          const { data: analysisData, error: aiError } = await supabase.functions.invoke('analyze-custom-case', {
            body: { 
              caseData, 
              treatmentName: treatmentData.nome,
              currentState
            }
          });

          if (!aiError && analysisData) {
            isAdequate = analysisData.adequado;
            eficacia = analysisData.eficacia;
            justificativa = analysisData.justificativa;
            hpChange = isAdequate ? 20 : -15;
          }
        } catch (error) {
          console.error('Erro ao analisar caso personalizado:', error);
        }
      } else {
        // Verificar gabarito para casos pré-definidos
        const { data: adequateTreatment } = await supabase
          .from("tratamentos_adequados")
          .select("prioridade, justificativa")
          .eq("condicao_id", caseData?.id_condicao_primaria)
          .eq("tratamento_id", treatmentId)
          .maybeSingle();

        isAdequate = !!adequateTreatment;
        eficacia = isAdequate ? 1.0 : 0.3;
        justificativa = adequateTreatment?.justificativa || "";
        
        if (adequateTreatment) {
          switch (adequateTreatment.prioridade) {
            case 1: hpChange = 25; break;
            case 2: hpChange = 15; break;
            case 3: hpChange = 10; break;
          }
        }
      }

      // Carregar e aplicar efeitos do tratamento
      const { data: treatmentEffects, error } = await supabase
        .from("efeitos_tratamento")
        .select("*")
        .eq("id_tratamento", treatmentId);

      if (error) throw error;

      setCurrentState((prevState) => {
        const newState = { ...prevState };
        
        treatmentEffects?.forEach((effect) => {
          const currentValue = newState[effect.id_parametro] || 0;
          const magnitude = typeof effect.magnitude === 'number' ? effect.magnitude : parseFloat(effect.magnitude);
          newState[effect.id_parametro] = currentValue + (magnitude * eficacia);
        });
        
        return newState;
      });

      setLastHpChange(hpChange);
      
      setHp(prev => {
        const newHp = Math.min(100, Math.max(0, prev + hpChange));
        
        // Atualizar HP mínimo
        setMinHpDuringSession(minHp => Math.min(minHp, newHp));
        
        // Registrar decisão
        if (currentSessionId) {
          supabase
            .from('session_decisions')
            .insert({
              session_id: currentSessionId,
              timestamp_simulacao: elapsedTime,
              tipo: 'treatment',
              dados: {
                nome: treatmentData.nome,
                adequado: isAdequate,
                justificativa
              },
              hp_antes: prev,
              hp_depois: newHp
            })
            .then(({ error }) => {
              if (error) console.error('Erro ao registrar decisão:', error);
            });
        }
        
        if (newHp >= 100 && gameStatus === 'playing') {
          setGameStatus('won');
          setIsRunning(false);
          toast({
            title: "🎉 Paciente Estabilizado!",
            description: "Você conseguiu normalizar o quadro do paciente. Parabéns!",
            variant: "default",
          });
        }
        
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
        title: isAdequate ? "✓ Tratamento Correto" : "✗ Tratamento Inadequado",
        description: justificativa || `${treatmentData.nome} foi aplicado. HP ${hpChange > 0 ? '+' : ''}${hpChange}`,
        variant: isAdequate ? "default" : "destructive",
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

  const changeHp = (delta: number) => {
    if (delta < 0 && delta === -10) {
      // Registrar uso de dica
      setUsedHints(true);
      if (currentSessionId) {
        supabase
          .from('session_decisions')
          .insert({
            session_id: currentSessionId,
            timestamp_simulacao: elapsedTime,
            tipo: 'hint_used',
            dados: { penalidade: delta },
            hp_antes: hp,
            hp_depois: hp + delta
          })
          .then(({ error }) => {
            if (error) console.error('Erro ao registrar uso de dica:', error);
          });
      }
    }

    setHp(prev => {
      const newHp = Math.min(100, Math.max(0, prev + delta));
      setMinHpDuringSession(minHp => Math.min(minHp, newHp));
      setLastHpChange(delta);
      return newHp;
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
    lastHpChange,
    toggleSimulation,
    resetSimulation,
    applyTreatment,
    getParameterStatus,
    getParameterTrend,
    saveSession,
    loadSession,
    changeHp,
  };
};
