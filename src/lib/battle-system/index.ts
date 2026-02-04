/**
 * Sistema de Batalha - Exports Centralizados
 * VERSÃO ATUALIZADA - Com validações, equipamentos e dōjutsus
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
