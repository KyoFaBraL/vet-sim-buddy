export const SUS_DEADLINE = '2026-08-28';
export const SUS_DEADLINE_LABEL = '28/08/2026';
export const SUS_VERSION = 'ANEXO-A-1.0';

export interface SusItem {
  id: number;
  texto: string;
  /** Itens negativos: pontuação invertida no cálculo (6 - valor) */
  invertido?: boolean;
}

export const SUS_ITEMS: SusItem[] = [
  { id: 1, texto: 'Eu acharia fácil utilizar o VetBalance frequentemente durante o semestre.' },
  { id: 2, texto: 'Eu considerei o software desnecessariamente complexo.', invertido: true },
  { id: 3, texto: 'Eu achei o software fácil de usar.' },
  { id: 4, texto: 'Eu precisaria de ajuda de uma pessoa técnica para usar o software.', invertido: true },
  { id: 5, texto: 'Eu achei que as simulações clínicas do software eram realistas e relevantes.' },
  { id: 6, texto: 'Eu considerei que havia muita inconsistência no software.', invertido: true },
  { id: 7, texto: 'Eu imagino que a maioria dos estudantes aprenderia a usar o software rapidamente.' },
  { id: 8, texto: 'Eu achei o software muito difícil de navegar.', invertido: true },
  { id: 9, texto: 'Eu me senti confiante usando o software.' },
  { id: 10, texto: 'Eu precisei aprender muitas coisas antes de poder usar o software.', invertido: true },
  { id: 11, texto: 'O sistema de gamificação (HP, badges, ranking) me motivou a praticar mais.' },
  { id: 12, texto: 'O feedback ao final das sessões me ajudou a entender meus erros.' },
  { id: 13, texto: 'O software contribuiu para minha compreensão de equilíbrio ácido-base.' },
  { id: 14, texto: 'Eu recomendaria o VetBalance para outros estudantes de veterinária.' },
  { id: 15, texto: 'O software funcionou bem no meu dispositivo (celular/computador).' },
];

export const SUS_SCALE = [
  { value: 1, label: '1 — Discordo totalmente' },
  { value: 2, label: '2 — Discordo' },
  { value: 3, label: '3 — Neutro' },
  { value: 4, label: '4 — Concordo' },
  { value: 5, label: '5 — Concordo totalmente' },
];

export type SusAnswers = Record<string, number>;

/** Média ajustada (1–5) com itens negativos invertidos — indicador DS-03 (meta ≥ 4,0). */
export const calcularMediaAjustada = (respostas: SusAnswers): number => {
  const valores = SUS_ITEMS.map((item) => {
    const v = Number(respostas[String(item.id)]);
    if (!v) return null;
    return item.invertido ? 6 - v : v;
  }).filter((v): v is number => v !== null);
  if (!valores.length) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
};

/** Escore SUS clássico (0–100) usando os 10 primeiros itens da escala adaptada. */
export const calcularEscoreSus = (respostas: SusAnswers): number => {
  const dez = SUS_ITEMS.slice(0, 10);
  let soma = 0;
  let respondidos = 0;
  dez.forEach((item) => {
    const v = Number(respostas[String(item.id)]);
    if (!v) return;
    respondidos += 1;
    soma += item.invertido ? 5 - v : v - 1;
  });
  if (respondidos < 10) return 0;
  return soma * 2.5;
};

export const isSusPrazoEncerrado = (hoje: Date = new Date()): boolean => {
  const limite = new Date(`${SUS_DEADLINE}T23:59:59-03:00`);
  return hoje.getTime() > limite.getTime();
};

export const diasRestantesSus = (hoje: Date = new Date()): number => {
  const limite = new Date(`${SUS_DEADLINE}T23:59:59-03:00`);
  return Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
};
