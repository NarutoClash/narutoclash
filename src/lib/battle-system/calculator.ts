/**
 * Cálculos do sistema de batalha
 * VERSÃO ATUALIZADA - Com validações, equipamentos e dōjutsus
 * ✅ AGORA USA calculateFinalStats para evitar duplicação de lógica
 */

import {
  Fighter,
  DynamicStats,
  AttackResult,
  AttackType,
  Element,
  Equipment,
} from './types';
import {
  ELEMENTS,
  JUTSUS_BY_ELEMENT,
  DAMAGE_MULTIPLIERS,
  MAX_DAMAGE_PERCENT_PER_HIT,
  CRITICAL_HIT,
} from './constants';
import { calculateFinalStats } from '@/lib/stats-calculator'; // ✅ IMPORT ADICIONADO
import { JUTSU_GIFS } from './jutsu-gifs'; // ✅ ADICIONAR

/**
 * Calcula os stats dinâmicos de um lutador
 * ✅ VERSÃO CORRIGIDA - Usa calculateFinalStats para garantir consistência
 * 
 * @param fighter - Lutador com stats base
 * @param equipmentData - Array de equipamentos (mantido por compatibilidade, mas não usado)
 * @returns Stats dinâmicos calculados com TODOS os bônus aplicados
 */
export function calculateDynamicStats(
  fighter: Fighter,
  equipmentData: Equipment[] = []
): DynamicStats {
  // ✅ Usar a função CORRETA que calcula TODOS os bônus
  // (equipamentos, elementos, dōjutsu, selo amaldiçoado)
  const finalStats = calculateFinalStats(fighter);
  
  if (!finalStats) {
    // Fallback se não conseguir calcular
    return {
      maxHealth: 100,
      maxChakra: 100,
      finalVitality: fighter.vitality || 100,
      finalTaijutsu: fighter.taijutsu || 100,
      finalNinjutsu: fighter.ninjutsu || 100,
      finalGenjutsu: fighter.genjutsu || 100,
      finalIntelligence: fighter.intelligence || 100,
      finalSelo: fighter.selo || 100,
    };
  }
  
  // ✅ Retornar os stats FINAIS (com TODOS os bônus já aplicados)
  return {
    maxHealth: finalStats.maxHealth,
    maxChakra: finalStats.maxChakra,
    finalVitality: finalStats.finalVitality,
    finalTaijutsu: finalStats.finalTaijutsu,
    finalNinjutsu: finalStats.finalNinjutsu,
    finalGenjutsu: finalStats.finalGenjutsu,
    finalIntelligence: finalStats.finalIntelligence,
    finalSelo: finalStats.finalSelo,
  };
}

/**
 * Calcula se o ataque foi crítico
 */
function calculateCriticalHit(seloStat: number): boolean {
  const critChance = CRITICAL_HIT.baseChance + (seloStat * CRITICAL_HIT.seloMultiplier);
  return Math.random() < critChance;
}

/**
 * Calcula o dano de um ataque de Taijutsu
 */
function calculateTaijutsuDamage(
  attackerStats: DynamicStats,
  defenderStats: DynamicStats
): AttackResult {
  const multipliers = DAMAGE_MULTIPLIERS.taijutsu;

  const baseDamage =
    attackerStats.finalTaijutsu * multipliers.attackStat +
    attackerStats.finalSelo * multipliers.seloBonus;

  const reduction = defenderStats.finalIntelligence * multipliers.defenseReduction;

  let finalDamage = Math.max(
    baseDamage * multipliers.minimumDamagePercent,
    baseDamage - reduction
  );

  // Verificar crítico
  const isCritical = calculateCriticalHit(attackerStats.finalSelo);
  if (isCritical) {
    finalDamage *= CRITICAL_HIT.damageMultiplier;
  }

  return {
    damage: finalDamage,
    log: `causou ${finalDamage.toFixed(0)} de dano com Taijutsu${isCritical ? ' (CRÍTICO!)' : ''}.`,
    isCritical,
  };
}

/**
 * Calcula o dano de um ataque de Ninjutsu
 */
function calculateNinjutsuDamage(
  attacker: Fighter,
  attackerStats: DynamicStats,
  defenderStats: DynamicStats,
  preferredElement?: Element,
  preferredJutsu?: string
): AttackResult {
  // Verificar se tem elementos disponíveis
  const availableElements = ELEMENTS.filter(
    (el) => (attacker.elementLevels?.[el] || 0) > 0
  );

  if (availableElements.length === 0) {
    return {
      damage: 0,
      log: 'não possui elemento para usar Ninjutsu.',
      isCritical: false,
    };
  }

  // Escolher elemento (preferido ou aleatório)
  let selectedElement: Element;
  if (preferredElement && availableElements.includes(preferredElement)) {
    selectedElement = preferredElement;
  } else {
    selectedElement = availableElements[Math.floor(Math.random() * availableElements.length)];
  }

  // Verificar jutsus aprendidos desse elemento
  const jutsusOfElement = JUTSUS_BY_ELEMENT[selectedElement];
  const learnedJutsus = jutsusOfElement.filter(
    (jutsu) => (attacker.jutsus?.[jutsu] || 0) > 0
  );

  if (learnedJutsus.length === 0) {
    return {
      damage: 0,
      log: `tem o elemento ${selectedElement} mas não sabe nenhum jutsu para usar.`,
      isCritical: false,
    };
  }

  // Escolher jutsu (preferido ou aleatório)
  let selectedJutsu: string;
  if (preferredJutsu && learnedJutsus.includes(preferredJutsu)) {
    selectedJutsu = preferredJutsu;
  } else {
    selectedJutsu = learnedJutsus[Math.floor(Math.random() * learnedJutsus.length)];
  }

  const elementLevel = attacker.elementLevels![selectedElement]!;
  const jutsuLevel = attacker.jutsus![selectedJutsu]!;

  const multipliers = DAMAGE_MULTIPLIERS.ninjutsu;

  // Calcular multiplicadores (scaling melhorado)
  const elementMultiplier = 1 + elementLevel * multipliers.elementBonus;
  const jutsuMultiplier = 1 + Math.pow(jutsuLevel, multipliers.jutstuPower) * multipliers.jutsuBonus;

  // Calcular dano base
  const baseDamage =
    attackerStats.finalNinjutsu * multipliers.attackStat +
    attackerStats.finalSelo * multipliers.seloBonus;

  const reduction = defenderStats.finalIntelligence * multipliers.defenseReduction;

  let finalDamage = Math.max(
    baseDamage * multipliers.minimumDamagePercent,
    (baseDamage - reduction) * elementMultiplier * jutsuMultiplier
  );

  // Verificar crítico
  const isCritical = calculateCriticalHit(attackerStats.finalSelo);
  if (isCritical) {
    finalDamage *= CRITICAL_HIT.damageMultiplier;
  }

  return {
    damage: finalDamage,
    log: `usou ${selectedJutsu} e causou ${finalDamage.toFixed(0)} de dano${isCritical ? ' (CRÍTICO!)' : ''}.`,
    jutsuUsed: selectedJutsu,
    jutsuGif: JUTSU_GIFS[selectedJutsu] || null, // ✅ ADICIONAR
    elementUsed: selectedElement,
    isCritical,
  };
}

/**
 * Calcula o dano de um ataque de Genjutsu
 */
function calculateGenjutsuDamage(
  attackerStats: DynamicStats,
  defenderStats: DynamicStats
): AttackResult {
  const multipliers = DAMAGE_MULTIPLIERS.genjutsu;

  const baseDamage = attackerStats.finalGenjutsu * multipliers.attackStat;
  const resistance = defenderStats.finalIntelligence * multipliers.defenseReduction;

  if (baseDamage - resistance <= 0) {
    return {
      damage: 0,
      log: 'tentou um Genjutsu, mas o alvo resistiu.',
      isCritical: false,
    };
  }

  let finalDamage = Math.max(
    baseDamage * multipliers.minimumDamagePercent,
    baseDamage - resistance
  );

  // Verificar crítico
  const isCritical = calculateCriticalHit(attackerStats.finalSelo);
  if (isCritical) {
    finalDamage *= CRITICAL_HIT.damageMultiplier;
  }

  return {
    damage: finalDamage,
    log: `causou ${finalDamage.toFixed(0)} de dano com Genjutsu${isCritical ? ' (CRÍTICO!)' : ''}.`,
    isCritical,
  };
}

/**
 * Opções para cálculo de dano
 */
export interface DamageOptions {
  preferredElement?: Element;
  preferredJutsu?: string;
  equipmentData?: Equipment[];
  isBoss?: boolean;
}

/**
 * Calcula o dano de um ataque
 * @param attacker - Lutador atacante
 * @param defender - Lutador defensor
 * @param attackType - Tipo de ataque (taijutsu, ninjutsu, genjutsu)
 * @param options - Opções adicionais (elemento/jutsu preferido, equipamentos, se é boss)
 * @returns Resultado do ataque com dano e log
 */
export function calculateDamage(
  attacker: Fighter,
  defender: Fighter,
  attackType: AttackType,
  options: DamageOptions = {}
): AttackResult {
  const { preferredElement, preferredJutsu, equipmentData = [], isBoss = false } = options;

  const attackerStats = calculateDynamicStats(attacker, equipmentData);
  const defenderStats = calculateDynamicStats(defender, equipmentData);

  let result: AttackResult;

  switch (attackType) {
    case 'taijutsu':
      result = calculateTaijutsuDamage(attackerStats, defenderStats);
      break;
    case 'ninjutsu':
      result = calculateNinjutsuDamage(
        attacker,
        attackerStats,
        defenderStats,
        preferredElement,
        preferredJutsu
      );
      break;
    case 'genjutsu':
      result = calculateGenjutsuDamage(attackerStats, defenderStats);
      break;
  }

  // Aplicar limite máximo de dano por golpe (APENAS para PvP, não para Boss)
  if (!isBoss) {
    const maxDamage = defenderStats.maxHealth * MAX_DAMAGE_PERCENT_PER_HIT;
    result.damage = Math.min(result.damage, maxDamage);
  }

  // Garantir que o dano seja não-negativo
  result.damage = Math.max(0, result.damage);

  return result;
}

/**
 * Calcula o dano de um ataque contra BOSS (sem limite de 35%)
 * @deprecated Use calculateDamage com options.isBoss = true
 */
export function calculateDamageToBoss(
  attacker: Fighter,
  defender: Fighter,
  attackType: AttackType,
  options: Omit<DamageOptions, 'isBoss'> = {}
): AttackResult {
  return calculateDamage(attacker, defender, attackType, { ...options, isBoss: true });
}

/**
 * Escolhe um tipo de ataque aleatório baseado nas habilidades do lutador
 * @param fighter - Lutador
 * @returns Tipo de ataque escolhido ou null se não puder atacar
 */
export function getRandomAttackType(fighter: Fighter): AttackType | null {
  const attackTypes: AttackType[] = ['taijutsu', 'genjutsu'];

  // Verificar se pode usar Ninjutsu
  const hasElements = ELEMENTS.some(
    (el) => (fighter.elementLevels?.[el] || 0) > 0
  );

  if (hasElements && fighter.jutsus) {
    const hasJutsus = Object.values(JUTSUS_BY_ELEMENT)
      .flat()
      .some((jutsu) => (fighter.jutsus?.[jutsu] || 0) > 0);

    if (hasJutsus) {
      attackTypes.push('ninjutsu');
    }
  }

  if (attackTypes.length === 0) return null;

  return attackTypes[Math.floor(Math.random() * attackTypes.length)];
}