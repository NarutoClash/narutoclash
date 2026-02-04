/**
 * Validações do sistema de batalha
 */

import { Fighter, ValidationError, CursedSealActivationResult } from './types';
import { 
  VALIDATION_LIMITS, 
  CURSED_SEAL_REQUIREMENTS, 
  COOLDOWNS 
} from './constants';

/**
 * Valida se o fighter possui dados válidos
 */
export function validateFighter(fighter: Fighter): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validar atributos base
  if (!fighter) {
    errors.push({ field: 'fighter', message: 'Fighter não pode ser nulo' });
    return errors;
  }

  const stats = ['vitality', 'taijutsu', 'ninjutsu', 'genjutsu', 'intelligence', 'selo'] as const;
  
  for (const stat of stats) {
    const value = fighter[stat];
    if (typeof value !== 'number' || value < VALIDATION_LIMITS.stats.min) {
      errors.push({ 
        field: stat, 
        message: `${stat} deve ser um número >= ${VALIDATION_LIMITS.stats.min}` 
      });
    }
    if (value > VALIDATION_LIMITS.stats.max) {
      errors.push({ 
        field: stat, 
        message: `${stat} não pode ser maior que ${VALIDATION_LIMITS.stats.max}` 
      });
    }
  }

  // Validar níveis de elementos
  if (fighter.elementLevels) {
    Object.entries(fighter.elementLevels).forEach(([element, level]) => {
      if (level < VALIDATION_LIMITS.elementLevel.min || level > VALIDATION_LIMITS.elementLevel.max) {
        errors.push({ 
          field: `elementLevels.${element}`, 
          message: `Nível do elemento ${element} deve estar entre ${VALIDATION_LIMITS.elementLevel.min} e ${VALIDATION_LIMITS.elementLevel.max}` 
        });
      }
    });
  }

  // Validar níveis de jutsus
  if (fighter.jutsus) {
    Object.entries(fighter.jutsus).forEach(([jutsu, level]) => {
      if (level < VALIDATION_LIMITS.jutsuLevel.min || level > VALIDATION_LIMITS.jutsuLevel.max) {
        errors.push({ 
          field: `jutsus.${jutsu}`, 
          message: `Nível do jutsu deve estar entre ${VALIDATION_LIMITS.jutsuLevel.min} e ${VALIDATION_LIMITS.jutsuLevel.max}` 
        });
      }
    });
  }

  // Validar selo amaldiçoado
  if (fighter.cursedSeal) {
    if (![0, 1, 2].includes(fighter.cursedSeal.level)) {
      errors.push({ 
        field: 'cursedSeal.level', 
        message: 'Nível do selo deve ser 0, 1 ou 2' 
      });
    }
  }

  // Validar vida atual
  if (fighter.currentHealth !== undefined && fighter.currentHealth < 0) {
    errors.push({ 
      field: 'currentHealth', 
      message: 'Vida atual não pode ser negativa' 
    });
  }

  return errors;
}

/**
 * Valida se o fighter pode ativar o Selo Amaldiçoado
 */
export function validateCursedSealActivation(
  fighter: Fighter,
  maxHealth: number,
  currentTime: number = Date.now()
): CursedSealActivationResult {
  const errors: ValidationError[] = [];

  // Verificar se tem selo amaldiçoado
  if (!fighter.cursedSeal || fighter.cursedSeal.level === 0) {
    return {
      success: false,
      message: 'Você não possui Selo Amaldiçoado',
      errors: [{ field: 'cursedSeal', message: 'Selo Amaldiçoado não encontrado' }],
    };
  }

  // Verificar se já está ativo
  if (fighter.cursedSeal.isActive) {
    return {
      success: false,
      message: 'Selo Amaldiçoado já está ativo',
      errors: [{ field: 'cursedSeal.isActive', message: 'Selo já ativado' }],
    };
  }

  // Verificar cooldown
  if (fighter.cursedSeal.cooldownUntil && fighter.cursedSeal.cooldownUntil > currentTime) {
    const remainingSeconds = Math.ceil((fighter.cursedSeal.cooldownUntil - currentTime) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return {
      success: false,
      message: `Selo Amaldiçoado em cooldown. Aguarde ${minutes}m ${seconds}s`,
      errors: [{ 
        field: 'cursedSeal.cooldownUntil', 
        message: `Cooldown ativo até ${new Date(fighter.cursedSeal.cooldownUntil).toLocaleTimeString()}` 
      }],
    };
  }

  // Verificar se tem vida suficiente (mínimo 50%)
  const currentHealth = fighter.currentHealth ?? maxHealth;
  const healthPercent = currentHealth / maxHealth;
  
  if (healthPercent < CURSED_SEAL_REQUIREMENTS.minimumHealthPercent) {
    const requiredHealth = Math.ceil(maxHealth * CURSED_SEAL_REQUIREMENTS.minimumHealthPercent);
    return {
      success: false,
      message: `Você precisa ter pelo menos 50% de vida (${requiredHealth} HP) para ativar o Selo Amaldiçoado`,
      errors: [{ 
        field: 'currentHealth', 
        message: `Vida atual: ${currentHealth}/${maxHealth} (${(healthPercent * 100).toFixed(1)}%)` 
      }],
    };
  }

  return {
    success: true,
    message: 'Selo Amaldiçoado ativado com sucesso!',
  };
}

/**
 * Valida se o fighter pode ativar o Dōjutsu
 */
export function validateDoujutsuActivation(
  fighter: Fighter,
  currentTime: number = Date.now()
): CursedSealActivationResult {
  // Verificar se tem dōjutsu
  if (!fighter.doujutsu) {
    return {
      success: false,
      message: 'Você não possui Dōjutsu',
      errors: [{ field: 'doujutsu', message: 'Dōjutsu não encontrado' }],
    };
  }

  // Verificar se já está ativo
  if (fighter.doujutsu.isActive) {
    return {
      success: false,
      message: 'Dōjutsu já está ativo',
      errors: [{ field: 'doujutsu.isActive', message: 'Dōjutsu já ativado' }],
    };
  }

  // Verificar cooldown
  if (fighter.doujutsu.cooldownUntil && fighter.doujutsu.cooldownUntil > currentTime) {
    const remainingSeconds = Math.ceil((fighter.doujutsu.cooldownUntil - currentTime) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return {
      success: false,
      message: `Dōjutsu em cooldown. Aguarde ${minutes}m ${seconds}s`,
      errors: [{ 
        field: 'doujutsu.cooldownUntil', 
        message: `Cooldown ativo até ${new Date(fighter.doujutsu.cooldownUntil).toLocaleTimeString()}` 
      }],
    };
  }

  return {
    success: true,
    message: 'Dōjutsu ativado com sucesso!',
  };
}

/**
 * Calcula o tempo de cooldown do Selo Amaldiçoado
 */
export function calculateCursedSealCooldown(level: 1 | 2, currentTime: number = Date.now()): number {
  const cooldownDuration = level === 1 
    ? COOLDOWNS.cursedSeal.level1 
    : COOLDOWNS.cursedSeal.level2;
  
  return currentTime + cooldownDuration;
}

/**
 * Calcula o tempo de cooldown do Dōjutsu
 */
export function calculateDoujutsuCooldown(currentTime: number = Date.now()): number {
  return currentTime + COOLDOWNS.doujutsu.default;
}

/**
 * Verifica se o defensor está vivo
 */
export function isAlive(currentHealth: number): boolean {
  return currentHealth > 0;
}

/**
 * Garante que um valor esteja dentro de um intervalo
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Garante que os stats do fighter sejam não-negativos
 */
export function sanitizeFighterStats(fighter: Fighter): Fighter {
  return {
    ...fighter,
    vitality: Math.max(0, fighter.vitality),
    taijutsu: Math.max(0, fighter.taijutsu),
    ninjutsu: Math.max(0, fighter.ninjutsu),
    genjutsu: Math.max(0, fighter.genjutsu),
    intelligence: Math.max(0, fighter.intelligence),
    selo: Math.max(0, fighter.selo),
    currentHealth: fighter.currentHealth !== undefined 
      ? Math.max(0, fighter.currentHealth) 
      : undefined,
  };
}
