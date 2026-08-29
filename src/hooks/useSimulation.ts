import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from "@/utils/badgeChecker";
import { buildAcidBasePanel, getRanges } from "@/constants/acidBase";


// Utility function for retrying critical database operations
async function retryOperation(
  operation: () => Promise<any>,
  maxRetries = 3,
  operationName = 'operation'
): Promise<{ success: boolean; error?: any }> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await operation();
    if (!result.error) return { success: true };
    
    console.warn(`${operationName} failed (attempt ${i + 1}/${maxRetries}):`, result.error);
    
    if (i < maxRetries - 1) {
      // Exponential backoff: wait 1s, 2s, 3s
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  // Return last failed result
  const finalResult = await operation();
  if (finalResult.error) {
    console.error(`${operationName} failed after ${maxRetries} attempts:`, finalResult.error);
    return { success: false, error: finalResult.error };
  }
  return { success: true };
}

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

export const useSimulation = (caseId: number = 1, simulationMode: 'practice' | 'evaluation' = 'practice') => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [currentState, setCurrentState] = useState<SimulationState>({});
  const [previousState, setPreviousState] = useState<SimulationState>({});
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [hp, setHp] = useState<number>(50);
  const hpRef = useRef<number>(50);
  // Parâmetros exigidos para a estabilização do paciente (balanceamento)
  const targetParamIds = useRef<number[]>([]);

  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [lastHpChange, setLastHpChange] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [usedHints, setUsedHints] = useState(false);
  const [minHpDuringSession, setMinHpDuringSession] = useState(50);
  const [isApplyingTreatment, setIsApplyingTreatment] = useState(false);
  const { toast } = useToast();
  
  // Buffer for batching session history inserts
  const historyBuffer = useRef<Array<{
    session_id: string;
    timestamp: number;
    parametro_id: number;
    valor: number;
  }>>([]);

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
      
      // Garantir que a espécie seja normalizada
      if (caso) {
        caso.especie = caso.especie?.toLowerCase() || 'canino';
      }
      
      setCaseData(caso);

      // Carregar parâmetros
      const { data: params, error: paramsError } = await supabase
        .from("parametros")
        .select("*");

      if (paramsError) throw paramsError;

      // Ajustar as faixas de referência de acordo com a espécie do paciente
      const ranges = getRanges(caso?.especie);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const speciesParams = (params || []).map((p) => {
        const key = norm(p.nome);
        if (key === 'ph') {
          return { ...p, valor_minimo: ranges.pH.min, valor_maximo: ranges.pH.max };
        }
        if (key === 'paco2' || key === 'pco2') {
          return { ...p, valor_minimo: ranges.PaCO2.min, valor_maximo: ranges.PaCO2.max };
        }
        if (key === 'hco3' || key === 'hco3-' || key === 'bicarbonato') {
          return { ...p, valor_minimo: ranges.HCO3.min, valor_maximo: ranges.HCO3.max };
        }
        return p;
      });
      setParameters(speciesParams);

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

      // Simulação simplificada: a estabilização depende apenas dos
      // parâmetros essenciais da gasometria (pH e PaCO2). HCO3-, BE e
      // Anion Gap são derivados desses dois valores.
      const coreIds = speciesParams
        .filter((p) => ['ph', 'paco2', 'pco2'].includes(norm(p.nome)))
        .filter((p) => initialState[p.id] !== undefined)
        .map((p) => p.id);

      targetParamIds.current = coreIds.length > 0
        ? coreIds
        : Object.keys(initialState).map(Number).slice(0, 1);


      // Resetar HP e game status
      setHp(50);
      hpRef.current = 50;
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

  // Motor da simulação - atualiza timer e salva histórico
  const tick = useCallback(() => {
    setPreviousState(currentState);
    setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    
    // Adicionar ponto ao histórico
    setHistory(prev => [...prev, {
      timestamp: Date.now() - startTime,
      values: currentState
    }]);
    
    // Adicionar ao buffer de histórico para batch insert
    if (currentSessionId && isRunning) {
      const timestamp = Math.floor((Date.now() - startTime) / 1000);
      const historyData = parameters.map(param => ({
        session_id: currentSessionId,
        timestamp: timestamp,
        parametro_id: param.id,
        valor: currentState[param.id] || 0
      }));
      
      historyBuffer.current.push(...historyData);
    }
  }, [currentState, startTime, currentSessionId, isRunning, parameters]);

  // Timer da simulação - atualiza a cada segundo
  useEffect(() => {
    if (!isRunning || gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, tick, gameStatus]);

  // Batch flush session history every 5 seconds
  useEffect(() => {
    if (!isRunning || !currentSessionId) return;

    const flushInterval = setInterval(() => {
      if (historyBuffer.current.length > 0) {
        const dataToInsert = [...historyBuffer.current];
        historyBuffer.current = [];
        
        supabase
          .from('session_history')
          .insert(dataToInsert)
          .then(({ error }) => {
            if (error) {
              console.error('Erro ao salvar histórico em lote:', error);
              // Re-add to buffer for retry on next flush
              historyBuffer.current.push(...dataToInsert);
            }
          });
      }
    }, 5000);

    return () => {
      clearInterval(flushInterval);
      // Flush remaining data on unmount
      if (historyBuffer.current.length > 0) {
        supabase.from('session_history').insert(historyBuffer.current);
        historyBuffer.current = [];
      }
    };
  }, [isRunning, currentSessionId]);

  // Cleanup: finalizar sessão ao desmontar o componente (evita sessões órfãs)
  const currentSessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const gameStatusRef = useRef<'playing' | 'won' | 'lost'>('playing');
  
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
  
  useEffect(() => {
    return () => {
      const sessionId = currentSessionIdRef.current;
      if (sessionId && gameStatusRef.current === 'playing') {
        const duracao = Math.floor((Date.now() - startTimeRef.current) / 1000);
        supabase
          .from('simulation_sessions')
          .update({
            data_fim: new Date().toISOString(),
            duracao_segundos: duracao,
            status: 'abandonada'
          })
          .eq('id', sessionId)
          .then(({ error }) => {
            if (error) console.error('Erro ao finalizar sessão ao desmontar:', error);
          });
      }
    };
  }, []);

  // HP decay - perde 1 HP a cada 5 segundos
  useEffect(() => {
    if (!isRunning || gameStatus !== 'playing') return;

    const hpDecayInterval = setInterval(() => {
      setHp(prev => {
        const newHp = Math.max(0, prev - 1);
        hpRef.current = newHp;
        return newHp;
      });

      // Side effects outside state updater using ref
      setMinHpDuringSession(minHp => Math.min(minHp, hpRef.current));
      setLastHpChange(-1);
      
      if (hpRef.current <= 0 && gameStatus === 'playing') {
        setGameStatus('lost');
        setIsRunning(false);
        
        if (currentSessionId) {
          const duracao = Math.floor((Date.now() - startTime) / 1000);
          
          supabase.auth.getUser().then(({ data: { user } }) => {
            retryOperation(
              async () => supabase
                .from('simulation_sessions')
                .update({
                  data_fim: new Date().toISOString(),
                  duracao_segundos: duracao,
                  status: 'lost'
                })
                .eq('id', currentSessionId)
                .select(),
              3,
              'Finalização de sessão (HP zero)'
            ).then(({ success, error }) => {
              if (!success) {
                toast({
                  title: "Erro ao salvar sessão",
                  description: "Não foi possível salvar o resultado da sessão.",
                  variant: "destructive",
                });
              } else if (user) {
                checkAndAwardBadges({
                  sessionId: currentSessionId,
                  userId: user.id,
                  sessionData: { status: 'lost', duracao_segundos: duracao, case_id: caseId },
                  usedHints,
                  minHp: 0,
                  goalsAchieved: 0,
                  totalGoals: 0
                });
              }
            });
          });
        }
        
        toast({
          title: "Paciente faleceu",
          description: "O HP chegou a zero. Tente novamente!",
          variant: "destructive",
        });
      }
    }, 5000);

    return () => clearInterval(hpDecayInterval);
  }, [isRunning, gameStatus, toast, currentSessionId, startTime, usedHints, caseId]);

  // Verificar limite de tempo (5 minutos = 300 segundos) - APENAS no modo avaliação
  useEffect(() => {
    if (simulationMode === 'evaluation' && elapsedTime >= 300 && gameStatus === 'playing') {
      setGameStatus('lost');
      setIsRunning(false);
      
      // Finalizar sessão por tempo com retry
      if (currentSessionId) {
        const duracao = Math.floor((Date.now() - startTime) / 1000);
        
        supabase.auth.getUser().then(({ data: { user } }) => {
          retryOperation(
            async () => supabase
              .from('simulation_sessions')
              .update({
                data_fim: new Date().toISOString(),
                duracao_segundos: duracao,
                status: 'lost'
              })
              .eq('id', currentSessionId)
              .select(),
            3,
            'Finalização de sessão (timeout)'
          ).then(({ success, error }) => {
            if (!success) {
              toast({
                title: "Erro ao salvar sessão",
                description: "Não foi possível salvar o resultado da sessão.",
                variant: "destructive",
              });
            } else if (user) {
              checkAndAwardBadges({
                sessionId: currentSessionId,
                userId: user.id,
                sessionData: { status: 'lost', duracao_segundos: duracao, case_id: caseId },
                usedHints,
                minHp: minHpDuringSession,
                goalsAchieved: 0,
                totalGoals: 0
              });
            }
          });
        });
      }
      
      toast({
        title: "Tempo esgotado",
        description: "O paciente não resistiu. O tempo máximo de 5 minutos foi atingido.",
        variant: "destructive",
      });
    }
  }, [elapsedTime, gameStatus, toast, currentSessionId, startTime, usedHints, minHpDuringSession, simulationMode]);

  const toggleSimulation = async () => {
    if (!isRunning) {
      // Iniciando a simulação - criar nova sessão e resetar log de tratamentos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newSession, error } = await supabase
        .from('simulation_sessions')
        .insert({
          user_id: user.id,
          case_id: caseId,
          nome: `Sessão ${new Date().toLocaleString('pt-BR')}`,
          status: 'em_andamento'
        })
        .select()
        .single();

      if (!error && newSession) {
        setCurrentSessionId(newSession.id);
        setStartTime(Date.now());
        setElapsedTime(0);
      }
    } else {
      // Pausando a simulação
    }
    setIsRunning((prev) => !prev);
  };

  const resetSimulation = async () => {
    // Finalizar sessão atual se existir
    if (currentSessionId) {
      const duracao = Math.floor((Date.now() - startTime) / 1000);
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('simulation_sessions')
        .update({
          data_fim: new Date().toISOString(),
          duracao_segundos: duracao,
          status: gameStatus
        })
        .eq('id', currentSessionId);
      
      // Verificar e conceder badges
      if (user) {
        await checkAndAwardBadges({
          sessionId: currentSessionId,
          userId: user.id,
          sessionData: { status: gameStatus, duracao_segundos: duracao, case_id: caseId },
          usedHints,
          minHp: minHpDuringSession,
          goalsAchieved: 0,
          totalGoals: 0
        });
      }
    }
    
    setIsRunning(false);
    setPreviousState({});
    setStartTime(Date.now());
    setElapsedTime(0);
    setHp(50);
    hpRef.current = 50;
    setGameStatus('playing');
    setLastHpChange(0);
    setCurrentSessionId(null);
    setUsedHints(false);
    setMinHpDuringSession(50);
    treatmentUsage.current = {};
    wasStableRef.current = false;
    loadCase();
  };

  // ===== Verificação de estabilização =====
  // O paciente é considerado recuperado quando os parâmetros-alvo do caso
  // (até 2 dos mais críticos, definidos em loadCase) estão na faixa de
  // referência, com uma tolerância clínica de 15% da amplitude da faixa.

  const isParamNormal = useCallback((param: Parameter, value: number) => {
    const min = param.valor_minimo ?? -Infinity;
    const max = param.valor_maximo ?? Infinity;
    const span = Number.isFinite(min) && Number.isFinite(max) ? (max - min) : 0;
    const tol = span * 0.15;
    return value >= min - tol && value <= max + tol;
  }, []);

  const getAbnormalFrom = useCallback((state: SimulationState) => {
    const targets = targetParamIds.current;
    return parameters
      .filter((p) => targets.length === 0 || targets.includes(p.id))
      .filter((p) => state[p.id] !== undefined && !isParamNormal(p, state[p.id]))
      .map((p) => p.nome);
  }, [parameters, isParamNormal]);

  const abnormalParameters = getAbnormalFrom(currentState);
  const allParametersNormal =
    Object.keys(currentState).length > 0 && abnormalParameters.length === 0;


  // Notificação em tempo real quando o paciente atinge (ou perde) a estabilização
  const wasStableRef = useRef(false);
  useEffect(() => {
    if (!isRunning || gameStatus !== 'playing') return;
    if (allParametersNormal && !wasStableRef.current) {
      wasStableRef.current = true;
      toast({
        title: "✓ Todos os parâmetros normalizados",
        description: "Mantenha o suporte: o paciente pode agora alcançar a recuperação total (100 HP).",
      });
    } else if (!allParametersNormal && wasStableRef.current) {
      wasStableRef.current = false;
      toast({
        title: "⚠️ Paciente desestabilizou",
        description: `Parâmetros fora da faixa: ${abnormalParameters.join(', ')}`,
        variant: "destructive",
      });
    }
  }, [allParametersNormal, abnormalParameters.join(','), isRunning, gameStatus, toast]);

  // Contagem de aplicações por tratamento (evita farm de HP repetindo o mesmo tratamento)
  const treatmentUsage = useRef<Record<number, number>>({});

  const applyTreatment = async (treatmentId: number) => {

    // Prevenir múltiplas aplicações simultâneas (race condition protection)
    if (isApplyingTreatment) {
      console.log('Tratamento já em aplicação, ignorando click duplicado');
      return;
    }

    // Validar estado do jogo
    if (gameStatus !== 'playing') {
      toast({
        title: "Ação não permitida",
        description: "Não é possível aplicar tratamentos após o fim do jogo.",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingTreatment(true);

    try {
      // Carregar informações do tratamento
      const { data: treatmentData, error: treatmentError } = await supabase
        .from("tratamentos")
        .select("nome, descricao, tipo")
        .eq("id", treatmentId)
        .single();

      if (treatmentError) throw treatmentError;

      let isAdequate = false;
      let eficacia = 0.3;
      let justificativa = "";
      let hpChange = -15;

      // 1) Gabarito específico do caso (vale para casos personalizados e pré-definidos)
      const { data: caseTreatment } = await supabase
        .from("tratamentos_caso")
        .select("prioridade, justificativa")
        .eq("case_id", caseData?.id)
        .eq("tratamento_id", treatmentId)
        .maybeSingle();

      let match: { prioridade: number; justificativa: string | null } | null =
        caseTreatment ?? null;

      // 2) Fallback: gabarito da condição primária (casos pré-definidos)
      // Consultado via RPC segura: o gabarito completo não é exposto ao aluno.
      if (!match && !caseData?.user_id && caseData?.id_condicao_primaria) {
        const { data: adequateTreatment } = await supabase.rpc(
          "check_treatment_adequacy",
          {
            p_condicao_id: caseData.id_condicao_primaria,
            p_tratamento_id: treatmentId,
          }
        );
        match = adequateTreatment?.[0] ?? null;
      }

      isAdequate = !!match;
      eficacia = isAdequate ? 1.0 : 0.3;
      justificativa = match?.justificativa || "";

      if (match) {
        switch (match.prioridade) {
          case 1: hpChange = 25; break;
          case 2: hpChange = 15; break;
          case 3: hpChange = 10; break;
          default: hpChange = 10; break;
        }
      }


      // Carregar e aplicar efeitos do tratamento
      const { data: treatmentEffects, error } = await supabase
        .from("efeitos_tratamento")
        .select("*")
        .eq("id_tratamento", treatmentId);

      if (error) throw error;

      // Rendimento decrescente: repetir o mesmo tratamento perde eficácia
      const timesUsed = treatmentUsage.current[treatmentId] ?? 0;
      treatmentUsage.current[treatmentId] = timesUsed + 1;
      const repeatFactor = isAdequate ? Math.max(0.3, 1 - 0.35 * timesUsed) : 1;
      eficacia = eficacia * repeatFactor;

      // Calcular novo estado e medir se houve melhora real em parâmetros anormais
      const baseState = { ...currentState };
      const newState = { ...baseState };
      treatmentEffects?.forEach((effect) => {
        const currentValue = newState[effect.id_parametro] ?? 0;
        const magnitude = typeof effect.magnitude === 'number' ? effect.magnitude : parseFloat(effect.magnitude);
        // Só altera parâmetros efetivamente monitorizados neste caso
        if (baseState[effect.id_parametro] === undefined) return;

        let delta = magnitude * eficacia;

        const param = parameters.find((p) => p.id === effect.id_parametro);
        const hasRange = !!param && param.valor_minimo !== null && param.valor_maximo !== null;
        const min = hasRange ? Number(param!.valor_minimo) : null;
        const max = hasRange ? Number(param!.valor_maximo) : null;

        // Proteção: parâmetro já normalizado não pode ser degradado/reduzido
        // por um novo tratamento — ele permanece dentro da faixa.
        const alreadyNormal = param ? isParamNormal(param, currentValue) : false;

        if (isAdequate && hasRange) {
          const mid = (min! + max!) / 2;
          const gap = mid - currentValue;
          if (alreadyNormal) {
            // Parâmetro já normal permanece normal (não é afastado da faixa)
            delta = 0;
          } else {
            // Tratamento correto normaliza o parâmetro em qualquer direção:
            // leva direto ao ponto médio da faixa (sem hipercorreção).
            // Isso corrige casos como PaCO2 baixo, em que a magnitude
            // cadastrada só apontava para baixo.
            delta = gap;
          }
        } else if (alreadyNormal && hasRange) {

          // Tratamento inadequado só pode desviar de forma limitada e
          // nunca tirar o parâmetro já normalizado da faixa
          const target = Math.min(max!, Math.max(min!, currentValue + delta));
          delta = target - currentValue;
        }

        let nextValue = currentValue + delta;

        // Nenhum parâmetro fisiológico pode ser negativo
        const floor = hasRange ? Math.max(0, min! * 0.4) : 0;
        const ceiling = hasRange ? max! * 2.5 : Infinity;
        nextValue = Math.min(ceiling, Math.max(floor, nextValue));

        newState[effect.id_parametro] = Number(nextValue.toFixed(2));
      });

      // Rede de segurança: um tratamento adequado também melhora
      // parcialmente os parâmetros-alvo que não possuem efeito cadastrado
      // (ex.: PaCO2 sem tratamento específico no caso), garantindo que a
      // estabilização completa seja sempre alcançável.
      if (isAdequate) {
        targetParamIds.current.forEach((pid) => {
          if (baseState[pid] === undefined) return;
          const param = parameters.find((p) => p.id === pid);
          if (!param || param.valor_minimo === null || param.valor_maximo === null) return;
          const value = newState[pid];
          if (isParamNormal(param, value)) return;
          const min = Number(param.valor_minimo);
          const max = Number(param.valor_maximo);
          const mid = (min + max) / 2;
          const next = value + (mid - value) * 0.5 * eficacia;
          newState[pid] = Number(Math.max(0, next).toFixed(2));
        });
      }





      const abnormalBefore = getAbnormalFrom(baseState);
      const abnormalAfter = getAbnormalFrom(newState);

      // Melhora real = algum parâmetro anormal se aproximou/entrou na faixa
      let improved = false;
      parameters.forEach((p) => {
        const before = baseState[p.id];
        const after = newState[p.id];
        if (before === undefined || after === undefined || before === after) return;
        const min = p.valor_minimo ?? -Infinity;
        const max = p.valor_maximo ?? Infinity;
        const distBefore = before < min ? min - before : before > max ? before - max : 0;
        const distAfter = after < min ? min - after : after > max ? after - max : 0;
        if (distAfter < distBefore) improved = true;
      });

      setCurrentState(newState);

      // HP só é ganho quando o tratamento realmente melhora algum parâmetro anormal
      if (hpChange > 0 && !improved) {
        hpChange = 0;
        toast({
          title: "Sem efeito clínico",
          description: abnormalAfter.length > 0
            ? `Este tratamento não corrigiu nenhum parâmetro alterado. Ainda faltam: ${abnormalAfter.join(', ')}.`
            : "Este tratamento não alterou o quadro do paciente.",
          variant: "destructive",
        });
      } else if (hpChange > 0 && repeatFactor < 1) {
        hpChange = Math.max(1, Math.round(hpChange * repeatFactor));
      }

      const allNormalAfter = Object.keys(newState).length > 0 && abnormalAfter.length === 0;

      setLastHpChange(hpChange);

      const prevHp = hpRef.current;
      // Recuperação total (100 HP) exige TODOS os parâmetros normalizados
      const hpCeiling = allNormalAfter ? 100 : 99;
      const newHp = Math.min(hpCeiling, Math.max(0, prevHp + hpChange));
      hpRef.current = newHp;
      setHp(newHp);

      // Side effects using ref value - no state updater needed
      setMinHpDuringSession(minHp => Math.min(minHp, newHp));

      // Aviso em tempo real dos parâmetros pendentes
      if (!allNormalAfter && abnormalAfter.length > 0 && newHp >= 90) {
        toast({
          title: "Paciente ainda instável",
          description: `Estabilize os parâmetros críticos para a recuperação total. Pendentes: ${abnormalAfter.join(', ')}.`,
        });
      }
      void abnormalBefore;
      

      
      // Registrar decisão e tratamento aplicado com retry
      if (currentSessionId) {
        retryOperation(
          async () => supabase
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
              hp_antes: prevHp,
              hp_depois: newHp
            })
            .select(),
          2,
          'Registro de decisão'
        ).then(({ success, error }) => {
          if (!success) {
            console.error('Erro ao registrar decisão após retries:', error);
          } else {
            console.log('Decisão registrada:', { type: 'treatment', nome: treatmentData.nome, hp: { antes: prevHp, depois: newHp } });
          }
        });
        
        retryOperation(
          async () => supabase
            .from('session_treatments')
            .insert({
              session_id: currentSessionId,
              tratamento_id: treatmentId,
              timestamp_simulacao: elapsedTime
            })
            .select(),
          2,
          'Registro de tratamento'
        ).then(({ success, error }) => {
          if (!success) console.error('Erro ao registrar tratamento após retries:', error);
        });
      }
      
      if (newHp >= 100 && allNormalAfter && gameStatus === 'playing') {
        setGameStatus('won');
        setIsRunning(false);
        
        if (currentSessionId) {
          const duracao = Math.floor((Date.now() - startTime) / 1000);
          
          supabase.auth.getUser().then(({ data: { user } }) => {
            retryOperation(
              async () => supabase
                .from('simulation_sessions')
                .update({
                  data_fim: new Date().toISOString(),
                  duracao_segundos: duracao,
                  status: 'won'
                })
                .eq('id', currentSessionId)
                .select(),
              3,
              'Finalização de sessão (vitória)'
            ).then(({ success, error }) => {
              if (!success) {
                toast({
                  title: "Aviso",
                  description: "Vitória registrada, mas houve erro ao salvar no servidor.",
                  variant: "destructive",
                });
              } else if (user) {
                checkAndAwardBadges({
                  sessionId: currentSessionId,
                  userId: user.id,
                  sessionData: { status: 'won', duracao_segundos: duracao, case_id: caseId },
                  usedHints,
                  minHp: newHp,
                  goalsAchieved: 0,
                  totalGoals: 0
                });
              }
            });
          });
        }
        
        toast({
          title: "🎉 Paciente Estabilizado!",
          description: "Você conseguiu normalizar o quadro do paciente. Parabéns!",
          variant: "default",
        });
      }
      
      if (newHp <= 0 && gameStatus === 'playing') {
        setGameStatus('lost');
        setIsRunning(false);
        
        if (currentSessionId) {
          const duracao = Math.floor((Date.now() - startTime) / 1000);
          
          supabase.auth.getUser().then(({ data: { user } }) => {
            retryOperation(
              async () => supabase
                .from('simulation_sessions')
                .update({
                  data_fim: new Date().toISOString(),
                  duracao_segundos: duracao,
                  status: 'lost'
                })
                .eq('id', currentSessionId)
                .select(),
              3,
              'Finalização de sessão (derrota por tratamento)'
            ).then(({ success, error }) => {
              if (!success) {
                toast({
                  title: "Erro ao salvar sessão",
                  description: "Não foi possível salvar o resultado da sessão.",
                  variant: "destructive",
                });
              } else if (user) {
                checkAndAwardBadges({
                  sessionId: currentSessionId,
                  userId: user.id,
                  sessionData: { status: 'lost', duracao_segundos: duracao, case_id: caseId },
                  usedHints,
                  minHp: 0,
                  goalsAchieved: 0,
                  totalGoals: 0
                });
              }
            });
          });
        }
        
        toast({
          title: "Paciente faleceu",
          description: "O HP chegou a zero. Tente novamente!",
          variant: "destructive",
        });
      }

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
    } finally {
      setIsApplyingTreatment(false);
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
            dados: { penalidade_hp: delta },
            hp_antes: hp,
            hp_depois: Math.max(0, Math.min(100, hp + delta))
          })
          .then(({ error }) => {
            if (error) console.error('Erro ao registrar uso de dica:', error);
          });
      }
    }
    
    const hpCeiling = allParametersNormal ? 100 : 99;
    const newHp = Math.max(0, Math.min(hpCeiling, hpRef.current + delta));
    hpRef.current = newHp;
    setHp(newHp);
    setMinHpDuringSession(prev => Math.min(prev, newHp));
    setLastHpChange(delta);

    // Encerrar a partida quando o HP atinge os extremos por ajuste direto
    // (ex.: penalidade de dica), mantendo a UI consistente com o resultado.
    if (gameStatus === 'playing' && ((newHp >= 100 && allParametersNormal) || newHp <= 0)) {
      setGameStatus(newHp >= 100 ? 'won' : 'lost');
      setIsRunning(false);
    }
  };

  return {
    parameters,
    currentState,
    previousState,
    history,
    isRunning,
    caseData,
    elapsedTime,
    hp,
    gameStatus,
    lastHpChange,
    abnormalParameters,
    allParametersNormal,
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
