export type ParameterTier = "primario" | "secundario";

export interface ParameterDescription {
  description: string;
  normal: string;
  clinical: string;
  tier: ParameterTier;
}

export const parameterDescriptions: Record<string, ParameterDescription> = {
  /* ───────── Parâmetros fisiológicos principais ───────── */
  pH: {
    description: "Medida da acidez ou alcalinidade do sangue arterial",
    normal: "Normal: 7.35 - 7.45",
    clinical: "pH < 7.35 indica acidemia; pH > 7.45 indica alcalemia. Essencial para função enzimática e homeostase celular.",
    tier: "primario"
  },
  PaO2: {
    description: "Pressão parcial de oxigênio no sangue arterial",
    normal: "Normal: 80 - 100 mmHg",
    clinical: "Indica a capacidade de oxigenação pulmonar. Valores baixos sugerem hipoxemia e comprometimento respiratório.",
    tier: "primario"
  },
  PaCO2: {
    description: "Pressão parcial de dióxido de carbono no sangue arterial",
    normal: "Normal: 35 - 45 mmHg",
    clinical: "Reflete a ventilação alveolar. Valores elevados indicam hipoventilação (acidose respiratória); valores baixos, hiperventilação (alcalose respiratória).",
    tier: "primario"
  },
  FrequenciaRespiratoria: {
    description: "Número de incursões respiratórias por minuto",
    normal: "Normal: 16 - 30 mpm (cães) / 20 - 40 mpm (gatos)",
    clinical: "Taquipneia acompanha hipoxemia, dor e acidose metabólica (respiração compensatória). Bradipneia sugere depressão do centro respiratório e retenção de CO₂.",
    tier: "primario"
  },
  FrequenciaCardiaca: {
    description: "Número de batimentos cardíacos por minuto",
    normal: "Normal: 70 - 120 bpm (cães) / 140 - 220 bpm (gatos)",
    clinical: "Taquicardia pode indicar hipovolemia, dor ou choque. Bradicardia sugere hiperpotassemia, bloqueio de condução ou hipotermia.",
    tier: "primario"
  },
  PressaoArterial: {
    description: "Pressão arterial sistólica",
    normal: "Normal: 90 - 140 mmHg",
    clinical: "Hipotensão (< 90 mmHg) compromete a perfusão tecidual e agrava acidose lática. Hipertensão sustentada causa lesão de órgãos-alvo.",
    tier: "primario"
  },
  Hemoglobina: {
    description: "Concentração de hemoglobina circulante",
    normal: "Normal: 12 - 18 g/dL (cães) / 9 - 15 g/dL (gatos)",
    clinical: "Determina a capacidade de transporte de oxigênio. Anemia reduz a oferta tecidual de O₂ mesmo com PaO₂ e SpO₂ normais.",
    tier: "primario"
  },
  Lactato: {
    description: "Produto do metabolismo anaeróbico",
    normal: "Normal: < 2.5 mmol/L",
    clinical: "Elevação indica hipoperfusão tecidual, choque ou sepse; principal causa de acidose metabólica com ânion gap aumentado.",
    tier: "primario"
  },
  ResistenciaVascular: {
    description: "Resistência vascular sistêmica ao fluxo sanguíneo",
    normal: "Normal: 1200 - 1800 dyn·s/cm⁵",
    clinical: "Valores baixos caracterizam choque distributivo (vasodilatação/sepse); valores altos indicam vasoconstrição compensatória com má perfusão periférica.",
    tier: "primario"
  },
  DebitoCardiaco: {
    description: "Volume de sangue ejetado pelo coração por minuto",
    normal: "Normal: 100 - 200 mL/kg/min",
    clinical: "Junto com a hemoglobina define a oferta de oxigênio (DO₂). Redução leva a acidose lática progressiva mesmo com ventilação adequada.",
    tier: "primario"
  },

  /* ───────── Parâmetros secundários (conforme o caso clínico) ───────── */
  HCO3: {
    description: "Bicarbonato sérico (tampão metabólico principal)",
    normal: "Normal: 22 - 26 mEq/L (cães) / 17 - 24 mEq/L (gatos)",
    clinical: "Valores baixos indicam acidose metabólica; valores altos, alcalose metabólica. Reflete o componente renal do equilíbrio ácido-básico.",
    tier: "secundario"
  },
  BE: {
    description: "Base Excess - excesso de base",
    normal: "Normal: -3 a +3 mEq/L",
    clinical: "Quantifica o componente metabólico dos distúrbios ácido-básicos. Valores negativos indicam déficit de base (acidose metabólica).",
    tier: "secundario"
  },
  SpO2: {
    description: "Saturação periférica de oxigênio (oximetria de pulso)",
    normal: "Normal: > 95%",
    clinical: "Estima a fração de hemoglobina saturada. Valores < 90% correspondem a hipoxemia grave e exigem oxigenoterapia imediata.",
    tier: "secundario"
  },
  AnionGap: {
    description: "Ânion gap - diferença entre cátions e ânions mensurados",
    normal: "Normal: 8 - 12 mEq/L (cães) / 10 - 18 mEq/L (gatos)",
    clinical: "Aumento sugere acúmulo de ácidos fixos (lactato, cetoácidos, uremia). Valor normal com acidose aponta perda de bicarbonato.",
    tier: "secundario"
  },
  Temperatura: {
    description: "Temperatura corporal central",
    normal: "Normal: 37.5 - 39.2 °C",
    clinical: "Hipotermia acompanha choque e sepse, deslocando a curva de dissociação da hemoglobina. Hipertermia aumenta o consumo de oxigênio.",
    tier: "secundario"
  },
  Glicose: {
    description: "Concentração sérica de glicose",
    normal: "Normal: 70 - 150 mg/dL",
    clinical: "Hipoglicemia causa convulsões e coma. Hiperglicemia acentuada com cetose gera acidose metabólica de ânion gap alto.",
    tier: "secundario"
  },
  Sodio: {
    description: "Concentração sérica de sódio",
    normal: "Normal: 140 - 155 mEq/L (cães) / 145 - 158 mEq/L (gatos)",
    clinical: "Determina a osmolaridade plasmática e entra no cálculo do ânion gap. Correções rápidas causam lesão neurológica.",
    tier: "secundario"
  },
  Potassio: {
    description: "Concentração sérica de potássio",
    normal: "Normal: 3.5 - 5.5 mEq/L",
    clinical: "Move-se em direção oposta ao pH: acidose eleva o potássio plasmático. Alterações graves provocam arritmias fatais.",
    tier: "secundario"
  },
  Cloro: {
    description: "Concentração sérica de cloreto",
    normal: "Normal: 105 - 115 mEq/L",
    clinical: "Diferencia acidose hiperclorêmica (ânion gap normal) de acidose por ácidos orgânicos. Cai na alcalose metabólica por perda gástrica.",
    tier: "secundario"
  },
  Calcio: {
    description: "Concentração sérica de cálcio",
    normal: "Normal: 8.5 - 11.5 mg/dL",
    clinical: "A fração ionizada aumenta na acidemia e diminui na alcalemia; hipocalcemia ionizada causa tetania e hipotensão.",
    tier: "secundario"
  },
  Fosforo: {
    description: "Concentração sérica de fósforo",
    normal: "Normal: 2.5 - 6.0 mg/dL",
    clinical: "Eleva-se na doença renal e contribui para acidose metabólica; hipofosfatemia grave cursa com hemólise e fraqueza muscular.",
    tier: "secundario"
  },
  Albumina: {
    description: "Concentração sérica de albumina",
    normal: "Normal: 2.6 - 4.0 g/dL",
    clinical: "Principal ânion fraco do plasma: hipoalbuminemia produz efeito alcalinizante e mascara elevações do ânion gap, exigindo correção do cálculo.",
    tier: "secundario"
  },

  /* Compatibilidade retroativa com casos que registram SatO2 */
  SatO2: {
    description: "Saturação de oxigênio da hemoglobina medida na gasometria",
    normal: "Normal: > 95%",
    clinical: "Percentual de hemoglobina ligada ao oxigênio no sangue arterial; valores < 90% caracterizam hipoxemia grave.",
    tier: "secundario"
  }
};

export const primaryParameters = Object.keys(parameterDescriptions).filter(
  (k) => parameterDescriptions[k].tier === "primario"
);

export const secondaryParameters = Object.keys(parameterDescriptions).filter(
  (k) => parameterDescriptions[k].tier === "secundario"
);
