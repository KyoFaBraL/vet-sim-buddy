// Motor determinístico (sem IA / sem consumo de créditos) para dicas de tratamento
// e relatórios de feedback pós-sessão. Usado quando AI_FEEDBACK_MODE = "deterministic"
// ou como fallback automático quando o gateway de IA responde 402/429.

export type Hint = {
  priority: "alta" | "média" | "baixa";
  problem: string;
  treatment: string;
  mechanism: string;
  targetParameter: string;
  expectedChange: string;
};

type ParamLike = {
  id?: number;
  nome?: string;
  unidade?: string;
  valor_minimo?: number;
  valor_maximo?: number;
};

type TreatmentLike = {
  nome?: string;
  descricao?: string;
  prioridade?: number;
  justificativa?: string;
};

const clean = (v: unknown, fallback = "") =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;

function deviation(value: number, min: number, max: number) {
  if (value < min) return { direction: "abaixo" as const, gap: min - value };
  if (value > max) return { direction: "acima" as const, gap: value - max };
  return { direction: "normal" as const, gap: 0 };
}

function priorityFor(index: number, relativeGap: number): Hint["priority"] {
  if (index === 0 || relativeGap > 0.25) return "alta";
  if (relativeGap > 0.1) return "média";
  return "baixa";
}

export function buildDeterministicHints(args: {
  currentState: Record<string | number, number>;
  parameters: ParamLike[];
  condition: string;
  appropriateTreatments: TreatmentLike[];
  availableTreatments: TreatmentLike[];
}): Hint[] {
  const { currentState, parameters, condition } = args;
  const treatments = (args.appropriateTreatments.length > 0
    ? args.appropriateTreatments
    : args.availableTreatments
  ).slice();

  const abnormal = (Array.isArray(parameters) ? parameters : [])
    .map((p) => {
      const value = Number(currentState?.[p.id as number] ?? 0);
      const min = Number(p.valor_minimo ?? 0);
      const max = Number(p.valor_maximo ?? 100);
      const dev = deviation(value, min, max);
      const span = Math.max(Math.abs(max - min), 0.0001);
      return {
        nome: clean(p.nome, "Parâmetro"),
        unidade: clean(p.unidade),
        value,
        min,
        max,
        ...dev,
        relativeGap: dev.gap / span,
      };
    })
    .filter((p) => p.direction !== "normal")
    .sort((a, b) => b.relativeGap - a.relativeGap)
    .slice(0, 3);

  if (abnormal.length === 0) {
    const t = treatments[0];
    return [
      {
        priority: "baixa",
        problem: "Nenhum parâmetro fora da faixa de referência no momento.",
        treatment: t?.nome
          ? `Manter suporte: ${clean(t.nome)}`
          : "Manter monitorização e suporte atual",
        mechanism:
          "O paciente está compensado. A conduta é sustentar a terapia vigente e reavaliar em intervalos curtos para detectar deterioração precoce.",
        targetParameter: "Todos os parâmetros monitorizados",
        expectedChange: "Manutenção dos valores dentro da faixa de referência.",
      },
    ];
  }

  return abnormal.map((p, i) => {
    const t = treatments[Math.min(i, Math.max(treatments.length - 1, 0))];
    const treatmentName = clean(t?.nome, "Reavaliar plano terapêutico disponível");
    const rationale = clean(
      t?.justificativa || t?.descricao,
      "Corrige a alteração identificada atuando sobre o distúrbio de base.",
    );
    const target = `${p.nome}${p.unidade ? ` (${p.unidade})` : ""}`;
    return {
      priority: priorityFor(i, p.relativeGap),
      problem: `${p.nome} está ${p.direction} da faixa de referência: ${p.value.toFixed(2)}${
        p.unidade ? ` ${p.unidade}` : ""
      } (normal ${p.min}–${p.max}).`,
      treatment: treatmentName,
      mechanism: `${rationale.replace(/\s*$/, "").replace(/([^.!?])$/, "$1.")} No contexto de ${clean(condition, "distúrbio ácido-base")}, essa intervenção atua diretamente sobre a alteração de ${p.nome}.`,
      targetParameter: target,
      expectedChange:
        p.direction === "abaixo"
          ? `Elevação progressiva de ${p.nome} em direção a ${p.min}–${p.max}.`
          : `Redução progressiva de ${p.nome} em direção a ${p.min}–${p.max}.`,
    };
  });
}

export type Feedback = {
  analiseGeral: string;
  pontoFortes: string[];
  areasMelhoria: string[];
  sugestoesEstudo: string[];
  recomendacao: string;
};

export function buildDeterministicFeedback(args: {
  caseName: string;
  caseSpecies: string;
  condition?: string;
  won: boolean;
  duration: number;
  decisionsCount: number;
  appliedTreatments: string[];
  appropriateTreatments: TreatmentLike[];
}): Feedback {
  const {
    caseName,
    caseSpecies,
    condition,
    won,
    duration,
    decisionsCount,
    appliedTreatments,
    appropriateTreatments,
  } = args;

  const expected = appropriateTreatments.map((t) => clean(t.nome)).filter(Boolean);
  const appliedSet = new Set(appliedTreatments.map((t) => t.toLowerCase()));
  const hits = expected.filter((e) => appliedSet.has(e.toLowerCase()));
  const misses = expected.filter((e) => !appliedSet.has(e.toLowerCase()));
  const extras = appliedTreatments.filter(
    (a) => !expected.some((e) => e.toLowerCase() === a.toLowerCase()),
  );
  const accuracy = expected.length > 0 ? Math.round((hits.length / expected.length) * 100) : null;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const tempo = minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;

  const analiseGeral = [
    `No caso "${caseName}"${caseSpecies ? ` (${caseSpecies})` : ""}${condition ? ` — ${condition}` : ""}, o paciente ${
      won ? "foi estabilizado" : "não foi estabilizado"
    } após ${tempo} de conduta.`,
    `Foram registradas ${decisionsCount} decisão(ões) clínicas e ${appliedTreatments.length} intervenção(ões) terapêutica(s).`,
    accuracy !== null
      ? `A aderência ao protocolo esperado para este caso foi de ${accuracy}% (${hits.length} de ${expected.length} tratamentos-chave).`
      : "Não há protocolo de referência cadastrado para comparação automática neste caso.",
  ].join(" ");

  const pontoFortes: string[] = [];
  if (won) pontoFortes.push("Conduziu o paciente à estabilização, atingindo o objetivo clínico da simulação.");
  if (hits.length > 0)
    pontoFortes.push(`Aplicou corretamente tratamento(s) prioritário(s): ${hits.join(", ")}.`);
  if (decisionsCount >= 3)
    pontoFortes.push("Manteve reavaliação ativa do paciente, com múltiplas decisões ao longo do atendimento.");
  if (duration <= 180 && won)
    pontoFortes.push("Agiu com boa velocidade de resposta, importante em cuidados críticos.");
  if (pontoFortes.length === 0)
    pontoFortes.push("Iniciou o atendimento e registrou condutas, base para evoluir no raciocínio clínico.");

  const areasMelhoria: string[] = [];
  if (misses.length > 0)
    areasMelhoria.push(`Deixou de aplicar tratamento(s) indicado(s): ${misses.join(", ")}.`);
  if (extras.length > 0)
    areasMelhoria.push(
      `Aplicou intervenção(ões) sem indicação prioritária neste caso: ${extras.slice(0, 4).join(", ")}.`,
    );
  if (!won) areasMelhoria.push("O paciente descompensou: revise a ordem de prioridade das intervenções e o tempo de resposta.");
  if (decisionsCount <= 1)
    areasMelhoria.push("Poucas reavaliações: monitorize os parâmetros com mais frequência antes e depois de cada conduta.");
  if (areasMelhoria.length === 0)
    areasMelhoria.push("Refine o tempo entre reavaliações para antecipar a deterioração dos parâmetros.");

  const sugestoesEstudo = [
    `Fisiopatologia e abordagem terapêutica de ${condition || "distúrbios ácido-base"} em ${caseSpecies || "cães e gatos"}.`,
    "Interpretação da hemogasometria: pH, pCO₂, HCO₃⁻, ânion gap e compensação esperada.",
    "Fluidoterapia em pacientes críticos: escolha da solução, taxa e monitorização de eletrólitos.",
    misses.length > 0
      ? `Indicações, mecanismo e riscos de: ${misses.slice(0, 3).join(", ")}.`
      : "Priorização de condutas em emergência (ABC) e reavaliação seriada.",
  ];

  const recomendacao = won
    ? misses.length > 0
      ? "Repita este caso buscando 100% de aderência ao protocolo e, em seguida, avance para um caso de maior complexidade."
      : "Avance para um caso de maior complexidade ou execute este em modo avaliação para consolidar o desempenho."
    : "Revise o protocolo do caso, refaça a simulação em modo prática usando o sistema de dicas e só depois tente o modo avaliação.";

  return { analiseGeral, pontoFortes, areasMelhoria, sugestoesEstudo, recomendacao };
}

export type AiMode = "deterministic" | "ai" | "auto";

function normalizeMode(raw: string | null | undefined): AiMode | null {
  const v = (raw || "").toLowerCase().trim();
  if (v === "ai" || v === "auto" || v === "deterministic") return v as AiMode;
  return null;
}

// "deterministic" (padrão): nunca chama IA. "ai": sempre IA. "auto": IA com fallback.
export function getAiMode(): AiMode {
  return normalizeMode(Deno.env.get("AI_FEEDBACK_MODE")) ?? "deterministic";
}

// Preferência configurada pelo admin no painel (tabela app_settings).
// Cai para a variável de ambiente se a consulta falhar.
export async function resolveAiMode(supabase: {
  rpc: (fn: string) => Promise<{ data: unknown; error: unknown }>;
}): Promise<AiMode> {
  try {
    const { data, error } = await supabase.rpc("get_ai_feedback_mode");
    if (!error) {
      const mode = normalizeMode(typeof data === "string" ? data : null);
      if (mode) return mode;
    }
  } catch (_e) {
    // ignora e usa fallback
  }
  return getAiMode();
}
