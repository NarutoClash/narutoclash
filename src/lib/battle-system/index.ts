/**
 * Sistema de Batalha - Exports Centralizados
 * VERSÃO 2.0 - Com builds, passivas, elementos e relatórios ricos
 */

// ========== TYPES ==========
export type {
  Element,
  AttackType,
  DoujutsuType,
  EquipmentType,
  Equipment,
  DoujutsuStage,
  DoujutsuInfo,
  Fighter,
  DynamicStats,
  AttackResult,
  BattleTurn,
  ValidationError,
  CursedSealActivationResult,
  BuildEffect,
  BuildEffectType,
  RichBattleLogEntry,
} from './types';

// ========== CONSTANTS ==========
export {
  ELEMENTS,
  JUTSUS_BY_ELEMENT,
  ALL_JUTSUS,
  CURSED_SEAL_MULTIPLIERS,
  ELEMENT_BONUSES,
  STAT_FORMULAS,
  DAMAGE_MULTIPLIERS,
  MAX_DAMAGE_PERCENT_PER_HIT,
  COOLDOWNS,
  CURSED_SEAL_REQUIREMENTS,
  VALIDATION_LIMITS,
  CRITICAL_HIT,
} from './constants';

export { JUTSU_GIFS } from './jutsu-gifs';

// ========== CALCULATOR FUNCTIONS ==========
export {
  calculateDynamicStats,
  calculateDamage,
  calculateDamageToBoss,
  getRandomAttackType,
} from './calculator';

export type { DamageOptions } from './calculator';

// ========== VALIDATORS ==========
export {
  validateFighter,
  validateCursedSealActivation,
  validateDoujutsuActivation,
  calculateCursedSealCooldown,
  calculateDoujutsuCooldown,
  isAlive,
  clamp,
  sanitizeFighterStats,
} from './validators';

// ========== EQUIPMENT SYSTEM ==========
export type { EquipmentBonuses } from './equipment-loader';

export {
  calculateEquipmentBonuses,
  canEquipItem,
  equipItem,
  unequipItem,
  getEquippedItems,
} from './equipment-loader';

// ========== DOUJUTSU SYSTEM ==========
export type { DoujutsuBonuses } from './doujutsu-loader';

export {
  DOUJUTSU_DATA,
  EVOLUTION_PATHS,
  calculateDoujutsuBonuses,
  canEvolveDoujutsu,
  evolveDoujutsu,
  getDoujutsuInfo,
} from './doujutsu-loader';

// ========== BUILD SYSTEM v2.0 ==========
export type { BuildType, BuildInfo, BuildPassive, FighterBattleState } from './build-detector';
export { detectBuild, getBuildInfo, emptyBattleState } from './build-detector';

// ========== RICH BATTLE LOG ==========
export { buildLogEntry, calcLogStats } from './battle-log-builder';
