/**
 * Núcleo do sistema de batalha
 * ⚠️ Arquivo PURAMENTE LÓGICO (não usar 'use client')
 */

import type {
  Fighter,
  AttackType,
  DynamicStats,
  AttackResult,
} from './types';

import {
  STAT_FORMULAS,
  DAMAGE_MULTIPLIERS,
  MAX_DAMAGE_PERCENT_PER_HIT,
} from './constants';

/**
 * Aplica bônus de itens
 */
function applyItemBonuses(base: Fighter): Fighter {
  if (!base.equipped_items_data) return base;

  const result: Fighter = { ...base };

  for (const item of base.equipped_items_data) {
    for (const key in item.bonuses) {
      const value = item.bonuses[key as keyof typeof item.bonuses];
      if (value) {
        (result as any)[key] += value;
      }
    }
  }

  return result;
}

/**
 * Calcula stats finais
 */
export function calculateDynamicStats(
  fighter: Fighter
): DynamicStats {
  const f = applyItemBonuses(fighter);

  return {
    maxHealth:
      STAT_FORMULAS.maxHealth.base +
      f.vitality * STAT_FORMULAS.maxHealth.vitalityMultiplier,

    maxChakra:
      STAT_FORMULAS.maxChakra.base +
      f.intelligence * STAT_FORMULAS.maxChakra.intelligenceMultiplier,

    finalVitality: f.vitality,
    finalTaijutsu: f.taijutsu,
    finalNinjutsu: f.ninjutsu,
    finalGenjutsu: f.genjutsu,
    finalSelo: f.selo,
    finalIntelligence: f.intelligence,
  };
}

/**
 * Calcula dano (PvP e Boss)
 */
export function calculateDamage(
  attacker: Fighter,
  defender: Fighter,
  attackType: AttackType,
  mode: 'pvp' | 'boss' = 'pvp'
): AttackResult {
  const atk = calculateDynamicStats(attacker);
  const def = calculateDynamicStats(defender);

  const cfg = DAMAGE_MULTIPLIERS[attackType];

  let attackPower = 0;

  if (attackType === 'taijutsu') {
    attackPower = atk.finalTaijutsu;
  } else if (attackType === 'ninjutsu') {
    attackPower = atk.finalNinjutsu + atk.finalSelo * cfg.seloBonus;
  } else {
    attackPower = atk.finalGenjutsu;
  }

  const defensePower =
    def.finalVitality * cfg.defenseReduction;

  let damage =
    attackPower * cfg.attackStat - defensePower;

  damage = Math.max(
    damage,
    def.maxHealth * cfg.minimumDamagePercent
  );

  const maxHit =
    def.maxHealth * MAX_DAMAGE_PERCENT_PER_HIT;

  damage = Math.min(damage, maxHit);

  if (mode === 'boss') {
    damage *= 0.75;
  }

  return {
    damage: Math.floor(damage),
    log: `${attackType.toUpperCase()} causou ${Math.floor(damage)} de dano`,
  };
}

/**
 * Ataque aleatório (NPC/Boss)
 */
  export function getRandomAttackType(): AttackType {
  const types: AttackType[] = ['taijutsu', 'ninjutsu', 'genjutsu'];
  return types[Math.floor(Math.random() * types.length)];
}
/**
 * ✅ FUNÇÃO DE COMPATIBILIDADE
 * Mantém o sistema antigo funcionando sem alterar as páginas
 */
export function calculateDamageToBoss(
  attacker: Fighter,
  defender: Fighter,
  attackType: AttackType,
  attackerItems: Item[] = [],
  defenderItems: Item[] = []
): AttackResult {
  return calculateDamage(
    attacker,
    defender,
    attackType,
    attackerItems,
    defenderItems,
    'boss'
  );
}
