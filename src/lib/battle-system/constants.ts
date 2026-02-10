/**
 * Constantes do sistema de batalha
 * VERSÃO ATUALIZADA - Nomenclatura padronizada
 * ✅ CORRIGIDO: Nomes dos jutsus agora BATEM EXATAMENTE com JUTSU_GIFS
 */

import { Element } from './types';

// Elementos disponíveis
export const ELEMENTS: readonly Element[] = ['Katon', 'Futon', 'Raiton', 'Doton', 'Suiton'] as const;

// Jutsus organizados por elemento
// ✅ NOMES CORRIGIDOS PARA BATER EXATAMENTE COM JUTSU_GIFS
export const JUTSUS_BY_ELEMENT: Record<Element, readonly string[]> = {
  Katon: [
    'Katon: Endan',
    'Katon: Gōkakyū no Jutsu',
    'Katon: Gōryūka no Jutsu',
    'Katon: Haisekishō',
    'Katon: Hōsenka no Jutsu',
  ],
  Suiton: [
    'Suiton: Bakusui Shōha',
    'Suiton: Daibaku no Jutsu no Jutsu',  // ✅ JÁ ESTÁ CORRETO
    'Suiton: Goshokuzame',
    'Suiton: Suijinheki',
    'Suiton: Suiryūdan no Jutsu',
  ],
  Raiton: [
    'Raiton: Senbon Chidori',
    'Raiton: Raijū Tsuiga',
    'Raiton: Liger Bomb',
    'Raiton: Kuroi Panther',
    'Raiton: Kirin',
  ],
  Futon: [
    'Futon: Atsugai',
    'Futon: Daitoppa',
    'Futon: Shinkūha',
    'Futon: Rasenshuriken',
    'Futon: Shinkū Renpa',
  ],
  Doton: [
    'Doton: Arijigoku',
    'Doton: Doryūtaiga',
    'Doton: Doryūheki',
    'Doton: Sando',
    'Doton: Doryūdan',
  ],
};

// Todos os jutsus em uma lista única
export const ALL_JUTSUS = Object.values(JUTSUS_BY_ELEMENT).flat();

// Multiplicadores do Selo Amaldiçoado
export const CURSED_SEAL_MULTIPLIERS = {
  level1: {
    vitality: 0.85,    // -15%
    ninjutsu: 1.20,    // +20%
    taijutsu: 1.20,    // +20%
    selo: 1.15,        // +15%
  },
  level2: {
    vitality: 0.70,    // -30%
    ninjutsu: 1.40,    // +40%
    taijutsu: 1.40,    // +40%
    selo: 1.30,        // +30%
  },
};

// Bônus de elementos por atributo
export const ELEMENT_BONUSES = {
  Futon: { attribute: 'taijutsu', multiplier: 2 },
  Katon: { attribute: 'ninjutsu', multiplier: 2 },
  Doton: { attribute: 'genjutsu', multiplier: 2 },
  Raiton: { attribute: 'selo', multiplier: 2 },
  Suiton: { attribute: 'intelligence', multiplier: 2 },
} as const;

// Fórmulas de cálculo de stats
export const STAT_FORMULAS = {
  maxHealth: {
    base: 100,
    vitalityMultiplier: 15,
  },
  maxChakra: {
    base: 100,
    intelligenceMultiplier: 5,
  },
};

// Multiplicadores de dano por tipo de ataque
export const DAMAGE_MULTIPLIERS = {
  taijutsu: {
    attackStat: 1.3,
    seloBonus: 0.3,
    defenseReduction: 0.9,
    minimumDamagePercent: 0.05,
  },
  ninjutsu: {
    attackStat: 1.4,
    seloBonus: 0.5,
    defenseReduction: 0.7,
    elementBonus: 0.04,      // Por nível de elemento
    jutsuBonus: 0.06,        // Aumentado de 0.04 para 0.06 para melhor scaling
    jutstuPower: 0.85,       // Aumentado de 0.7 para 0.85 para melhor scaling
    minimumDamagePercent: 0.05,
  },
  genjutsu: {
    attackStat: 1.2,
    defenseReduction: 1.2,
    minimumDamagePercent: 0.05,
  },
};

// Limite máximo de dano por golpe (apenas PvP)
export const MAX_DAMAGE_PERCENT_PER_HIT = 0.35; // 35% da vida máxima do defensor

// Cooldowns (em milissegundos)
export const COOLDOWNS = {
  cursedSeal: {
    level1: 5 * 60 * 1000,    // 5 minutos
    level2: 10 * 60 * 1000,   // 10 minutos
  },
  doujutsu: {
    default: 3 * 60 * 1000,   // 3 minutos
  },
};

// Requisitos para ativação de Selo Amaldiçoado
export const CURSED_SEAL_REQUIREMENTS = {
  minimumHealthPercent: 0.5,  // Precisa ter pelo menos 50% de vida
};

// Limites de validação
export const VALIDATION_LIMITS = {
  elementLevel: {
    min: 0,
    max: 10,
  },
  jutsuLevel: {
    min: 0,
    max: 25,
  },
  stats: {
    min: 0,
    max: 9999,
  },
};

// Chance de crítico
export const CRITICAL_HIT = {
  baseChance: 0.05,           // 5% base
  seloMultiplier: 0.001,      // +0.1% por ponto de selo
  damageMultiplier: 1.5,      // Dano crítico = 150%
};