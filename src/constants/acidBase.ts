// ============================================================================
// Modelo simplificado de equilíbrio ácido-básico (cães e gatos)
// ----------------------------------------------------------------------------
// A simulação foca nos parâmetros essenciais da gasometria:
//   pH, PaCO2, HCO3-, Base Excess (BE) e Anion Gap (AG).
// HCO3-, BE e AG são estimados a partir de pH e PaCO2 (Henderson-Hasselbalch),
// evitando a necessidade de monitorar dezenas de variáveis.
// ============================================================================

export type Species = "canino" | "felino";

export interface Range {
  min: number;
  max: number;
  unit: string;
  label: string;
}

export interface AcidBaseRanges {
  pH: Range;
  PaCO2: Range;
  HCO3: Range;
  BE: Range;
  AG: Range;
}

// Valores de referência por espécie (gasometria arterial)
export const ACID_BASE_RANGES: Record<Species, AcidBaseRanges> = {
  canino: {
    pH: { min: 7.35, max: 7.45, unit: "", label: "pH" },
    PaCO2: { min: 35, max: 45, unit: "mmHg", label: "PaCO₂" },
      HCO3: { min: 22, max: 26, unit: "mEq/L", label: "HCO₃⁻" },
      BE: { min: -3, max: 3, unit: "mEq/L", label: "BE" },

    AG: { min: 8, max: 12, unit: "mEq/L", label: "Anion Gap" },
  },
  felino: {
    pH: { min: 7.31, max: 7.42, unit: "", label: "pH" },
    PaCO2: { min: 30, max: 41, unit: "mmHg", label: "PaCO₂" },
    HCO3: { min: 17, max: 24, unit: "mEq/L", label: "HCO₃⁻" },
    BE: { min: -5, max: 3, unit: "mEq/L", label: "BE" },
    AG: { min: 10, max: 18, unit: "mEq/L", label: "Anion Gap" },
  },
};

export const normalizeSpecies = (especie?: string | null): Species => {
  const s = (especie || "").toLowerCase();
  if (s.includes("felin") || s.includes("gato") || s.includes("cat")) return "felino";
  return "canino";
};

export const getRanges = (especie?: string | null): AcidBaseRanges =>
  ACID_BASE_RANGES[normalizeSpecies(especie)];

/** Bicarbonato estimado pela equação de Henderson-Hasselbalch. */
export const estimateHCO3 = (pH: number, paco2: number): number =>
  Number((0.0301 * paco2 * Math.pow(10, pH - 6.1)).toFixed(1));

/** Base Excess (Siggaard-Andersen simplificado). */
export const estimateBE = (pH: number, hco3: number): number =>
  Number((hco3 - 24.4 + 14.8 * (pH - 7.4)).toFixed(1));

/** Anion Gap estimado: aumenta com o consumo de bicarbonato por ácidos fixos. */
export const estimateAG = (hco3: number, ranges: AcidBaseRanges): number => {
  const mid = (ranges.AG.min + ranges.AG.max) / 2;
  const deficit = Math.max(0, ranges.HCO3.min - hco3);
  return Number(Math.min(35, mid + deficit * 0.9).toFixed(1));
};

export interface AcidBasePanel {
  pH: number;
  PaCO2: number;
  HCO3: number;
  BE: number;
  AG: number;
  ranges: AcidBaseRanges;
  disturbance: string;
  species: Species;
}

/** Classificação do distúrbio primário a partir de pH, PaCO2 e HCO3-. */
export const classifyDisturbance = (
  pH: number,
  paco2: number,
  hco3: number,
  ranges: AcidBaseRanges
): string => {
  const lowPh = pH < ranges.pH.min;
  const highPh = pH > ranges.pH.max;
  const highCo2 = paco2 > ranges.PaCO2.max;
  const lowCo2 = paco2 < ranges.PaCO2.min;
  const lowHco3 = hco3 < ranges.HCO3.min;
  const highHco3 = hco3 > ranges.HCO3.max;

  if (lowPh && highCo2) return "Acidose respiratória";
  if (lowPh && lowHco3) return "Acidose metabólica";
  if (highPh && lowCo2) return "Alcalose respiratória";
  if (highPh && highHco3) return "Alcalose metabólica";
  if (lowPh) return "Acidemia (origem mista)";
  if (highPh) return "Alcalemia (origem mista)";
  if (highCo2 || lowCo2 || lowHco3 || highHco3) return "pH compensado com alteração residual";
  return "Equilíbrio ácido-básico normal";
};

export const buildAcidBasePanel = (
  pH: number,
  paco2: number,
  especie?: string | null
): AcidBasePanel => {
  const species = normalizeSpecies(especie);
  const ranges = ACID_BASE_RANGES[species];
  const hco3 = estimateHCO3(pH, paco2);
  const be = estimateBE(pH, hco3);
  const ag = estimateAG(hco3, ranges);
  return {
    pH: Number(pH.toFixed(2)),
    PaCO2: Number(paco2.toFixed(1)),
    HCO3: hco3,
    BE: be,
    AG: ag,
    ranges,
    disturbance: classifyDisturbance(pH, paco2, hco3, ranges),
    species,
  };
};

export const isInRange = (value: number, range: Range) =>
  value >= range.min && value <= range.max;
