export const parameterDescriptions: Record<string, { description: string; normal: string; clinical: string }> = {
  pH: {
    description: "Medida da acidez ou alcalinidade do sangue",
    normal: "Normal: 7.35 - 7.45",
    clinical: "pH < 7.35 indica acidose; pH > 7.45 indica alcalose. Essencial para função enzimática e homeostase celular."
  },
  PaO2: {
    description: "Pressão parcial de oxigênio no sangue arterial",
    normal: "Normal: 80 - 100 mmHg",
    clinical: "Indica a capacidade de oxigenação pulmonar. Valores baixos sugerem hipoxemia e comprometimento respiratório."
  },
  PaCO2: {
    description: "Pressão parcial de dióxido de carbono no sangue arterial",
    normal: "Normal: 35 - 45 mmHg",
    clinical: "Reflete a ventilação alveolar. Valores elevados indicam hipoventilação; valores baixos indicam hiperventilação."
  },
  FrequenciaCardiaca: {
    description: "Número de batimentos cardíacos por minuto",
    normal: "Normal: 60 - 120 bpm (varia por espécie)",
    clinical: "Taquicardia pode indicar estresse, dor ou choque. Bradicardia pode sugerir bloqueio cardíaco ou hipotermia."
  },
  PressaoArterial: {
    description: "Pressão do sangue nas artérias",
    normal: "Normal: 90 - 140 mmHg (sistólica)",
    clinical: "Hipotensão indica choque ou desidratação. Hipertensão pode causar danos aos órgãos-alvo."
  },
  Lactato: {
    description: "Produto do metabolismo anaeróbico",
    normal: "Normal: < 2.5 mmol/L",
    clinical: "Elevação indica hipoperfusão tecidual, choque ou sepse. Marcador importante de prognóstico."
  },
  HCO3: {
    description: "Bicarbonato sérico",
    normal: "Normal: 22 - 26 mEq/L",
    clinical: "Principal tampão do sangue. Valores baixos indicam acidose metabólica; valores altos indicam alcalose metabólica."
  },
  BE: {
    description: "Base Excess - Excesso de base",
    normal: "Normal: -2 a +2 mEq/L",
    clinical: "Indica componente metabólico dos distúrbios ácido-base. Valores negativos sugerem acidose metabólica."
  },
  SatO2: {
    description: "Saturação de oxigênio da hemoglobina",
    normal: "Normal: > 95%",
    clinical: "Indica percentual de hemoglobina saturada com oxigênio. Valores < 90% indicam hipoxemia grave."
  },
  Temperatura: {
    description: "Temperatura corporal",
    normal: "Normal: 37.5 - 39.2°C (varia por espécie)",
    clinical: "Hipotermia pode indicar choque ou sepse. Hipertermia pode ser febre, insolação ou infecção."
  },
  Glicose: {
    description: "Concentração de glicose no sangue",
    normal: "Normal: 70 - 150 mg/dL",
    clinical: "Hipoglicemia pode causar convulsões e coma. Hiperglicemia crônica indica diabetes mellitus."
  },
  Sodio: {
    description: "Concentração de sódio sérico",
    normal: "Normal: 140 - 155 mEq/L",
    clinical: "Hiponatremia causa fraqueza e convulsões. Hipernatremia causa desidratação celular."
  },
  Potassio: {
    description: "Concentração de potássio sérico",
    normal: "Normal: 3.5 - 5.5 mEq/L",
    clinical: "Crucial para função cardíaca e muscular. Alterações podem causar arritmias fatais."
  },
  Cloro: {
    description: "Concentração de cloreto sérico",
    normal: "Normal: 105 - 115 mEq/L",
    clinical: "Importante para equilíbrio ácido-base e osmolaridade. Varia em distúrbios renais e GI."
  },
  Calcio: {
    description: "Concentração de cálcio sérico",
    normal: "Normal: 8.5 - 11.5 mg/dL",
    clinical: "Essencial para contração muscular, coagulação e função neural. Hipocalcemia causa tetania."
  },
  Fosforo: {
    description: "Concentração de fósforo sérico",
    normal: "Normal: 2.5 - 6.0 mg/dL",
    clinical: "Importante para metabolismo energético e estrutura óssea. Alterações em doença renal."
  }
};
