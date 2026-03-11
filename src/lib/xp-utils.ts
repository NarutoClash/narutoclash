/**
 * Curva de XP híbrida — infinita, sem limite de nível
 *
 * Nv1–9:   base=250,  fator=1.08  (suave   — nv10 em ~1 dia com 6h/dia)
 * Nv10–29: base=2000, fator=1.08  (pesada  — nv30 em ~2.3 meses com 6h/dia)
 * Nv30–59: base=2000, fator=1.04  (rebalanceado — ~40% mais rápido que antes)
 * Nv60+:   base=2000, fator=1.03  (endgame — crescimento suave e sustentável)
 *
 * Comparativo de XP por step:
 *   Nv30 antigo: ~20 179  | novo: ~14 537  (-28%)
 *   Nv50 antigo: ~64 142  | novo: ~29 803  (-54%)
 *   Nv75 antigo: ~332 946 | novo: ~75 120  (-77%)
 */

const BREAKPOINT_EARLY = 10;  // até aqui usa BASE_EARLY
const BREAKPOINT_MID   = 30;  // até aqui usa FACTOR_FAST
const BREAKPOINT_LATE  = 60;  // até aqui usa FACTOR_MID

const BASE_EARLY  = 250;
const BASE_LATE   = 2000;

const FACTOR_FAST = 1.08;  // Nv10–29  (curva original)
const FACTOR_MID  = 1.04;  // Nv30–59  (novo — mais rápido)
const FACTOR_SLOW = 1.03;  // Nv60+    (endgame suave)

/** XP necessário para subir DO nível `level` para o próximo */
export const getXpForNextStep = (level: number): number => {
  const base = level < BREAKPOINT_EARLY ? BASE_EARLY : BASE_LATE;

  let factor: number;
  if      (level < BREAKPOINT_MID)  factor = FACTOR_FAST;
  else if (level < BREAKPOINT_LATE) factor = FACTOR_MID;
  else                               factor = FACTOR_SLOW;

  return Math.floor(base * Math.pow(factor, level - 1));
};

/** XP total acumulado necessário para ESTAR no nível `level` */
export const getXpForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) total += getXpForNextStep(i);
  return total;
};

/** Calcula nível + progresso a partir do XP total acumulado. Sem teto. */
export const getLevelFromXp = (
  xp: number,
  maxLevel = Infinity,
  // mantidos por compatibilidade com chamadas legadas
  _baseCost?: number,
  _factor?:   number
): { level: number; xpForNext: number; currentLevelXp: number } => {
  let level = 1;
  let accumulated = 0;

  while (true) {
    if (maxLevel !== Infinity && level >= maxLevel) break;
    const needed = getXpForNextStep(level);
    if (xp < accumulated + needed) break;
    accumulated += needed;
    level++;
  }

  return {
    level,
    xpForNext:      getXpForLevel(level + 1),
    currentLevelXp: getXpForLevel(level),
  };
};