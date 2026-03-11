/**
 * battle-log-builder.ts
 * Helpers para construir RichBattleLogEntry a partir do resultado de calculateDamage
 */

import { AttackResult, AttackType, RichBattleLogEntry } from './types';
import { BuildType, getBuildInfo } from './build-detector';

interface BuildLogEntryOptions {
  turn: number;
  attacker: 'player' | 'opponent' | 'boss';
  attackType: AttackType;
  result: AttackResult;
  playerHealth: number;
  playerMaxHealth: number;
  opponentHealth: number;
  opponentMaxHealth: number;
  attackerBuild?: BuildType;
  defenderBuild?: BuildType;
  burnDamageApplied?: number;  // dano de queimadura/veneno já aplicado neste turno (vai para startOfTurnEffects)
  regenApplied?: number;       // regen de HP já aplicado neste turno (vai para startOfTurnEffects)
  reactionEffects?: BuildEffect[]; // barreira ativada, refletir (vai para reactionEffects)
}

export function buildLogEntry(opts: BuildLogEntryOptions): RichBattleLogEntry {
  const {
    turn, attacker, attackType, result,
    playerHealth, playerMaxHealth, opponentHealth, opponentMaxHealth,
    attackerBuild, burnDamageApplied, regenApplied, reactionEffects,
  } = opts;

  const info = attackerBuild ? getBuildInfo(attackerBuild) : null;

  const secondHit = (result.secondHitDamage && result.secondHitDamage > 0)
    ? { damage: result.secondHitDamage, jutsuName: result.secondHitJutsu || 'Segundo Ataque' }
    : undefined;

  const totalDamage = result.damage + (result.secondHitDamage || 0);

  // Efeitos ofensivos do ataque (passivas de build, etc)
  const buildEffects = [...(result.buildEffects || [])];

  // Efeitos de início de turno (burn/veneno tick + regen)
  const startOfTurnEffects: BuildEffect[] = [];
  if (burnDamageApplied && burnDamageApplied > 0) {
    startOfTurnEffects.push({
      type: 'burn_damage',
      label: `🔥 Queimadura/Veneno: ${burnDamageApplied.toFixed(0)} de dano`,
      color: '#f97316',
      value: burnDamageApplied,
    });
  }
  if (regenApplied && regenApplied > 0) {
    startOfTurnEffects.push({
      type: 'regen',
      label: `💚 Regeneração: +${regenApplied.toFixed(0)} HP`,
      color: '#22c55e',
      value: regenApplied,
    });
  }

  return {
    turn,
    attacker,
    attackType,
    jutsuName: result.jutsuUsed || (
      attackType === 'taijutsu' ? 'Ataque Físico' :
      attackType === 'genjutsu' ? 'Técnica de Ilusão' : 'Ninjutsu'
    ),
    jutsuGif: result.jutsuGif || null,
    damageLog: result.log,
    damage: result.damage,
    totalDamage,
    isCritical: result.isCritical,
    buildEffects,
    startOfTurnEffects: startOfTurnEffects.length > 0 ? startOfTurnEffects : undefined,
    reactionEffects: reactionEffects && reactionEffects.length > 0 ? reactionEffects : undefined,
    secondHit,
    playerHealth: `${Math.max(0, playerHealth).toFixed(0)} HP`,
    opponentHealth: `${Math.max(0, opponentHealth).toFixed(0)} HP`,
    playerHealthPct: Math.max(0, (playerHealth / playerMaxHealth) * 100),
    opponentHealthPct: Math.max(0, (opponentHealth / opponentMaxHealth) * 100),
    attackerBuild: info?.name,
    attackerBuildEmoji: info?.emoji,
    attackerBuildColor: info?.color,
  };
}

/** Conta estatísticas do log para o BattleResult */
export function calcLogStats(log: RichBattleLogEntry[], playerAttacker: 'player') {
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let critCount = 0;
  let passiveCount = 0;
  let totalTurns = 0;

  for (const entry of log) {
    if (typeof entry === 'string') continue;
    totalTurns = Math.max(totalTurns, entry.turn);
    if (entry.attacker === 'player') {
      totalDamageDealt += entry.totalDamage || entry.damage;
    } else {
      totalDamageTaken += entry.totalDamage || entry.damage;
    }
    if (entry.isCritical) critCount++;
    passiveCount += (entry.buildEffects?.length || 0);
  }

  return { totalTurns, totalDamageDealt, totalDamageTaken, critCount, passiveCount };
}
