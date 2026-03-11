/**
 * Sistema de Batalha v2.0
 * Com sistema de builds, passivas de elementos e relatórios ricos
 */

import {
  Fighter, DynamicStats, AttackResult, AttackType, Element, Equipment, BuildEffect,
} from './types';
import { weaponsData } from '@/lib/weapons-data';
import { EQUIPMENT_DATA as EQ_DATA } from './equipment-data';
import type { ItemPassive } from './types';
import {
  ELEMENTS, JUTSUS_BY_ELEMENT, DAMAGE_MULTIPLIERS,
  MAX_DAMAGE_PERCENT_PER_HIT, CRITICAL_HIT,
} from './constants';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { JUTSU_GIFS } from './jutsu-gifs';
import {
  detectBuild, getBuildInfo, BuildType,
  FighterBattleState, emptyBattleState,
} from './build-detector';

export { detectBuild, getBuildInfo, emptyBattleState };
export type { BuildType, FighterBattleState };

// ─── Stats dinâmicos ──────────────────────────────────────────────────
export function calculateDynamicStats(
  fighter: Fighter,
  _equipmentData: Equipment[] = []
): DynamicStats {
  const finalStats = calculateFinalStats(fighter);
  if (!finalStats) {
    return {
      maxHealth: 100, maxChakra: 100,
      finalVitality: fighter.vitality || 100,
      finalTaijutsu: fighter.taijutsu || 100,
      finalNinjutsu: fighter.ninjutsu || 100,
      finalGenjutsu: fighter.genjutsu || 100,
      finalIntelligence: fighter.intelligence || 100,
      finalSelo: fighter.selo || 100,
    };
  }
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

// ─── Crítico ─────────────────────────────────────────────────────────
function calcCrit(seloStat: number, extraChance = 0): boolean {
  const chance = CRITICAL_HIT.baseChance + seloStat * CRITICAL_HIT.seloMultiplier + extraChance;
  return Math.random() < chance;
}

// ─── Taijutsu ─────────────────────────────────────────────────────────
function calcTaijutsu(
  atk: DynamicStats, def: DynamicStats,
  build: BuildType, defBuild: BuildType,
  state: FighterBattleState, defState: FighterBattleState,
  attacker: Fighter, isFirstTurn: boolean
): AttackResult {
  const m = DAMAGE_MULTIPLIERS.taijutsu;
  const effects: BuildEffect[] = [];

  // Físico Sábio (Shisaku): int entra no taijutsu
  const intBonus = build === 'fisico_sabio' ? atk.finalIntelligence * 0.3 : 0;

  let base = (atk.finalTaijutsu + intBonus) * m.attackStat + atk.finalSelo * m.seloBonus;
  let reduction = def.finalIntelligence * m.defenseReduction;

  // Daikabe: -20% dano recebido
  if (defBuild === 'tanque') { reduction *= 1.25; }
  // Shirogane: -15% todos os danos
  if (defBuild === 'protetor') { reduction *= 1.175; }
  // Defensor fraquecido: +20%
  if (defState.weakened) { base *= 1.2; }

  let dmg = Math.max(base * m.minimumDamagePercent, base - reduction);

  // Kyomei combo: genjutsu resistido → próximo tai +50%
  if (build === 'ilusionista' && state.comboReady) {
    dmg *= 1.5;
    state.comboReady = false;
    effects.push({ type: 'combo_triggered', label: '🎭 Golpe Exposto! +50% dano (Kyomei)', color: '#a855f7', value: dmg * 0.5 });
  }

  // Hachimon: +15% taijutsu
  if (build === 'berserker') { dmg *= 1.15; }

  // Crítico
  const vitCritBonus = build === 'senhor_guerra' ? Math.floor(atk.finalVitality / 100) * 0.01 : 0;
  let isCrit = false;
  if (build === 'ermitao' && isFirstTurn) {
    isCrit = true;
    effects.push({ type: 'first_crit', label: '🌙 Golpe Surpresa! Crítico garantido', color: '#7c3aed' });
  } else {
    if (vitCritBonus > 0) effects.push({ type: 'vit_crit_bonus', label: `🏆 +${(vitCritBonus * 100).toFixed(0)}% crítico (Vitalidade)`, color: '#dc2626' });
    isCrit = calcCrit(atk.finalSelo, (build === 'berserker' ? 0.05 : 0) + vitCritBonus);
  }
  if (isCrit) {
    dmg *= CRITICAL_HIT.damageMultiplier;
    if (build === 'berserker') {
      state.nextHitNoCap = true;
      effects.push({ type: 'no_cap_triggered', label: '⚔️ Golpe Fatal! Próximo ataque sem limite (Hachimon)', color: '#ef4444' });
    }
  }

  // Daikabe contra-ataque
  if (defBuild === 'tanque' && isCrit) {
    const counterDmg = dmg * 0.3;
    effects.push({ type: 'counter_attack', label: `🛡️ Contra-Ataque Daikabe! ${counterDmg.toFixed(0)} de dano devolvido`, color: '#22c55e', value: counterDmg });
  }

  return {
    damage: dmg,
    log: `causou ${dmg.toFixed(0)} de dano com Taijutsu${isCrit ? ' (CRÍTICO!)' : ''}.`,
    isCritical: isCrit,
    buildEffects: effects,
  };
}

// ─── Ninjutsu ─────────────────────────────────────────────────────────
function calcNinjutsu(
  attacker: Fighter, atk: DynamicStats, def: DynamicStats,
  build: BuildType, defBuild: BuildType,
  state: FighterBattleState, defState: FighterBattleState,
  isFirstTurn: boolean,
  preferredElement?: Element, preferredJutsu?: string,
): AttackResult {
  const effects: BuildEffect[] = [];

  // Selado: não pode usar ninjutsu
  if (state.sealed) {
    state.sealed = false;
    effects.push({ type: 'seal_blocked_ninjutsu', label: '🔒 Selado! Ninjutsu bloqueado', color: '#f59e0b' });
    return { damage: 0, log: 'tentou usar ninjutsu mas estava selado!', isCritical: false, buildEffects: effects };
  }

  const availableElements = ELEMENTS.filter(el => (attacker.elementLevels?.[el] || 0) > 0);
  if (!availableElements.length) {
    return { damage: 0, log: 'não possui elemento para usar Ninjutsu.', isCritical: false };
  }

  let selectedElement: Element;
  if (preferredElement && availableElements.includes(preferredElement)) {
    selectedElement = preferredElement;
  } else {
    selectedElement = availableElements[Math.floor(Math.random() * availableElements.length)];
  }

  const jutsusOfEl = JUTSUS_BY_ELEMENT[selectedElement];
  const learned = jutsusOfEl.filter(j => (attacker.jutsus?.[j] || 0) > 0);
  if (!learned.length) {
    return { damage: 0, log: `tem ${selectedElement} mas não sabe nenhum jutsu.`, isCritical: false };
  }

  let selectedJutsu: string;
  if (preferredJutsu && learned.includes(preferredJutsu)) {
    selectedJutsu = preferredJutsu;
  } else {
    selectedJutsu = learned[Math.floor(Math.random() * learned.length)];
  }

  const elementLevel = attacker.elementLevels![selectedElement]!;
  const jutsuLevel = attacker.jutsus![selectedJutsu]!;

  const m = DAMAGE_MULTIPLIERS.ninjutsu;

  // Chikan: elementBonus maior
  const elBonus = build === 'oraculo' ? 0.07 : m.elementBonus;
  // Jutsushi: jutsuMultiplier cap maior
  const jutsuMult = Math.min(
    build === 'feiticeiro' ? 2.2 : 1.78,
    1 + Math.pow(jutsuLevel, m.jutstuPower) * m.jutsuBonus
  );
  const elementMult = 1 + elementLevel * elBonus;

  let base = atk.finalNinjutsu * m.attackStat + atk.finalSelo * m.seloBonus;
  let reduction = def.finalIntelligence * m.defenseReduction;

  // Chikan: reduz dano ninjutsu recebido em 50%
  if (defBuild === 'oraculo') reduction *= 1.7;
  // Shisaku: -25% ninjutsu recebido
  if (defBuild === 'fisico_sabio') reduction *= 1.35;
  // Shirogane: -15% todos
  if (defBuild === 'protetor') reduction *= 1.175;
  // Defensor fraquecido
  if (defState.weakened) base *= 1.2;

  // Shugosha: mínimo maior
  const minPct = build === 'guardiao' ? 0.15 : m.minimumDamagePercent;

  let dmg = Math.max(base * minPct, (base - reduction) * elementMult * jutsuMult);

  // Artes proibidas combo: após genjutsu bem-sucedido +20%
  if (build === 'artes_proibidas' && state.nextNinjutsuBonus > 0) {
    dmg *= (1 + state.nextNinjutsuBonus);
    effects.push({ type: 'ninj_combo_bonus', label: `🔮 Encadeamento! +${(state.nextNinjutsuBonus * 100).toFixed(0)}% dano`, color: '#f59e0b', value: dmg * state.nextNinjutsuBonus });
    state.nextNinjutsuBonus = 0;
  }

  // Crítico
  let isCrit = false;
  if (build === 'ermitao' && isFirstTurn) {
    isCrit = true;
    effects.push({ type: 'first_crit', label: '🌙 Golpe Surpresa!', color: '#7c3aed' });
  } else {
    isCrit = calcCrit(atk.finalSelo, build === 'berserker' ? 0.05 : 0);
  }

  if (isCrit) {
    dmg *= CRITICAL_HIT.damageMultiplier;
    // Jutsushi: queimadura no crítico — acumula no defState (não sobrescreve)
    if (build === 'feiticeiro') {
      const burnDmg = dmg * 0.1;
      defState.burnDamage = (defState.burnDamage || 0) + burnDmg;
      effects.push({ type: 'burn_applied', label: `✨ Queimadura! ${burnDmg.toFixed(0)} dano no próximo turno`, color: '#f97316', value: burnDmg });
    }
  }

  return {
    damage: dmg,
    log: `usou ${selectedJutsu} e causou ${dmg.toFixed(0)} de dano${isCrit ? ' (CRÍTICO!)' : ''}.`,
    jutsuUsed: selectedJutsu,
    jutsuGif: JUTSU_GIFS[selectedJutsu] || null,
    elementUsed: selectedElement,
    isCritical: isCrit,
    buildEffects: effects,
  };
}

// ─── Genjutsu ─────────────────────────────────────────────────────────
function calcGenjutsu(
  atk: DynamicStats, def: DynamicStats,
  build: BuildType, defBuild: BuildType,
  state: FighterBattleState, defState: FighterBattleState,
  isFirstTurn: boolean
): AttackResult {
  const m = DAMAGE_MULTIPLIERS.genjutsu;
  const effects: BuildEffect[] = [];

  // Reikon: multiplicador maior + bônus de selo
  const attackMult = build === 'fantasma' ? 1.6 : 1.2;
  const seloBonus = build === 'fantasma' ? atk.finalSelo * 0.4 : 0;
  // Seishin: int entra no genjutsu
  const intBonus = build === 'monge' ? atk.finalIntelligence * 0.5 : 0;

  let base = (atk.finalGenjutsu + intBonus) * attackMult + seloBonus;

  // Resistência: reduzida (0.6 em vez de 1.2 para tornar genjutsu viável)
  let resistance = def.finalIntelligence * 0.6;

  // Seishin: -40% genjutsu recebido
  if (defBuild === 'monge') resistance *= 1.67;
  // Kyoshi: int reduz genjutsu em 60%
  if (defBuild === 'ermitao') resistance *= 2.5;
  // Shirogane: -15% todos
  if (defBuild === 'protetor') resistance *= 1.175;
  // Defensor fraquecido
  if (defState.weakened) base *= 1.2;

  if (base - resistance <= 0) {
    // Kyomei: genjutsu resistido seta combo para próximo tai
    if (build === 'ilusionista') {
      state.comboReady = true;
      effects.push({ type: 'combo_ready', label: '🎭 Ilusão Absorvida → Golpe Exposto preparado! (Kyomei)', color: '#a855f7' });
    }
    return {
      damage: 0,
      log: 'tentou um Genjutsu, mas o alvo resistiu.',
      isCritical: false,
      buildEffects: effects,
    };
  }

  let dmg = Math.max(base * m.minimumDamagePercent, base - resistance);

  // Crítico
  let isCrit = false;
  if (build === 'ermitao' && isFirstTurn) {
    isCrit = true;
    effects.push({ type: 'first_crit', label: '🌙 Golpe Surpresa!', color: '#7c3aed' });
  } else {
    isCrit = calcCrit(atk.finalSelo);
  }
  if (isCrit) dmg *= CRITICAL_HIT.damageMultiplier;

  // Kyomei: aplica fraqueza no alvo
  if (build === 'ilusionista' && dmg > 0) {
    defState.weakened = true;
    effects.push({ type: 'weaken_applied', label: '🎭 Ilusão Debilitante! (Kyomei) Alvo recebe +20% dano no próximo turno', color: '#a855f7' });
  }

  // Kinjutsu: 25% de chance de selar ninjutsu
  if (build === 'artes_proibidas' && dmg > 0 && Math.random() < 0.25) {
    defState.sealed = true;
    effects.push({ type: 'seal_applied', label: '🔮 Selo Proibido! Ninjutsu do alvo bloqueado no próximo turno', color: '#f59e0b' });
    // Kinjutsu: próximo ninjutsu do atacante +20%
    state.nextNinjutsuBonus = 0.2;
  }

  return {
    damage: dmg,
    log: `causou ${dmg.toFixed(0)} de dano com Genjutsu${isCrit ? ' (CRÍTICO!)' : ''}.`,
    isCritical: isCrit,
    buildEffects: effects,
  };
}

// ─── Passivas de Elementos Nível 10 ──────────────────────────────────
function applyElementPassives(
  attacker: Fighter, result: AttackResult,
  defState: FighterBattleState
): void {
  const els = attacker.elementLevels || {};

  // Futon lv10: 30% de chance de segundo ataque (40% dano)
  if ((els['Futon'] || 0) >= 10 && result.damage > 0 && Math.random() < 0.3) {
    result.secondHitDamage = result.damage * 0.4;
    result.secondHitJutsu = 'Futon: Rajada Dupla';
    result.buildEffects = result.buildEffects || [];
    result.buildEffects.push({
      type: 'second_hit', label: `💨 Passiva Futon! Segundo Ataque: ${result.secondHitDamage.toFixed(0)} de dano`, color: '#84cc16', value: result.secondHitDamage,
    });
  }

  // Raiton lv10: 10% de paralisia
  if ((els['Raiton'] || 0) >= 10 && result.damage > 0 && Math.random() < 0.1) {
    defState.paralyzed = true;
    result.buildEffects = result.buildEffects || [];
    result.buildEffects.push({ type: 'paralysis_applied', label: '⚡ Passiva Raiton! Paralisia aplicada', color: '#facc15' });
  }

  // Katon lv10: 20% de chance de aplicar Queimadura (10% do dano causado no próximo turno)
  if ((els['Katon'] || 0) >= 10 && result.damage > 0 && Math.random() < 0.2) {
    const burnDmg = result.damage * 0.1;
    defState.burnDamage = (defState.burnDamage || 0) + burnDmg;
    result.buildEffects = result.buildEffects || [];
    result.buildEffects.push({
      type: 'burn_applied', label: `🔥 Passiva Katon! Queimadura: ${burnDmg.toFixed(0)} no próximo turno`, color: '#f97316', value: burnDmg,
    });
  }
}

// ─── Passivas de Item (Arma + Equipamentos) ────────────────────────────
/**
 * Resolve quais passivas de um fighter devem ser avaliadas dado um gatilho.
 * Suporta condicional ativaApos50HP.
 */
function collectItemPassives(
  attacker: Fighter,
  gatilho: string,
  attackerCurrentHpPct: number   // 0-1, % atual do portador
): ItemPassive[] {
  const passives: ItemPassive[] = [];

  // Arma
  const weapon = weaponsData.find(w => w.id === (attacker.weaponId));
  if (weapon?.passivas) {
    for (const p of weapon.passivas) {
      if (p.gatilho !== gatilho) continue;
      if (p.ativaApos50HP && attackerCurrentHpPct > 0.5) continue;
      passives.push(p);
    }
  }

  // Equipamentos (peito, pernas, pés, mãos)
  const eqIds = [
    attacker.chestId,
    attacker.legsId,
    attacker.feetId,
    attacker.handsId,
  ].filter(Boolean) as string[];

  for (const eqId of eqIds) {
    const eq = EQ_DATA.find(e => e.id === eqId);
    if (!eq?.passivas) continue;
    for (const p of eq.passivas) {
      if (p.gatilho !== gatilho) continue;
      if (p.ativaApos50HP && attackerCurrentHpPct > 0.5) continue;
      passives.push(p);
    }
  }

  return passives;
}

/**
 * Aplica as passivas de item de um determinado gatilho.
 * Modifica result.buildEffects, defState e atkState in-place.
 * Retorna o lifesteal total para ser aplicado no loop.
 */
export function applyItemPassives(
  attacker: Fighter,
  gatilho: string,
  result: AttackResult,
  defState: FighterBattleState,
  atkState: FighterBattleState,
  attackerCurrentHpPct = 1.0,
  defenderCurrentHpPct = 1.0,
  maxHealth = 100,
): void {
  if (result.damage <= 0 && gatilho !== 'inicio_turno' && gatilho !== 'ao_receber_dano') return;

  const passives = collectItemPassives(attacker, gatilho, attackerCurrentHpPct);
  result.buildEffects = result.buildEffects || [];

  for (const p of passives) {
    const chanceNum = typeof p.chance === 'number' ? p.chance : 0;
    if (Math.random() >= chanceNum) continue; // não ativou

    const emoji = p.emoji || '⚡';
    const nome = p.nome;
    const valor = p.valor ?? 0;

    switch (p.efeito) {

      // ── Veneno: dano por turno no alvo ──
      case 'veneno': {
        const dmgTick = maxHealth * (valor || 0.06);
        defState.poisonDamage = Math.max(defState.poisonDamage, dmgTick);
        result.buildEffects.push({
          type: 'item_veneno',
          label: `${emoji} ${nome}! Veneno: ${dmgTick.toFixed(0)} HP/turno`,
          color: '#84cc16',
          value: dmgTick,
        });
        break;
      }

      // ── Queimadura: dano por turno no alvo ──
      case 'queimadura': {
        const burnTick = result.damage * (valor || 0.08);
        defState.burnDamage = (defState.burnDamage || 0) + burnTick;
        result.buildEffects.push({
          type: 'item_queimadura',
          label: `${emoji} ${nome}! Queimadura: ${burnTick.toFixed(0)} no próximo turno`,
          color: '#f97316',
          value: burnTick,
        });
        break;
      }

      // ── Paralisia: alvo perde próximo turno ──
      case 'paralisia': {
        defState.paralyzed = true;
        result.buildEffects.push({
          type: 'item_paralisia',
          label: `${emoji} ${nome}! Alvo paralisado no próximo turno`,
          color: '#facc15',
        });
        break;
      }

      // ── Selar Jutsu: bloqueia ninjutsu do alvo ──
      case 'selar_jutsu': {
        defState.sealed = true;
        result.buildEffects.push({
          type: 'item_selar_jutsu',
          label: `${emoji} ${nome}! Ninjutsu do alvo selado no próximo turno`,
          color: '#fbbf24',
        });
        break;
      }

      // ── Lifesteal: recupera % do dano como HP (acumulado no atkState) ──
      case 'lifesteal': {
        const healed = result.damage * (valor || 0.08);
        atkState.lifestealHealed = (atkState.lifestealHealed || 0) + healed;
        result.buildEffects.push({
          type: 'item_lifesteal',
          label: `${emoji} ${nome}! Roubo de vida: +${healed.toFixed(0)} HP`,
          color: '#ef4444',
          value: healed,
        });
        break;
      }

      // ── Regeneração: recupera % do HP máximo por turno ──
      case 'regeneracao': {
        const regenPct = valor || 0.02;
        atkState.regenPercent = Math.max(atkState.regenPercent, regenPct);
        result.buildEffects.push({
          type: 'item_regeneracao',
          label: `${emoji} ${nome}! Regen ativada: +${(regenPct * 100).toFixed(0)}% HP/turno`,
          color: '#34d399',
          value: regenPct,
        });
        break;
      }

      // ── Enfraquecer: alvo recebe +20% dano ──
      case 'enfraquecer': {
        defState.weakened = true;
        result.buildEffects.push({
          type: 'item_enfraquecer',
          label: `${emoji} ${nome}! Alvo enfraquecido: recebe +20% dano`,
          color: '#c084fc',
        });
        break;
      }

      // ── Barreira: absorve o próximo ataque (1× por turno) ──
      case 'barreira': {
        if (!atkState.barrierActiveThisTurn && !atkState.barrierPending) {
          atkState.barrierPending = true;
          result.buildEffects.push({
            type: 'item_barreira',
            label: `${emoji} ${nome}! Barreira ativada — absorverá o próximo ataque`,
            color: '#38bdf8',
          });
        }
        break;
      }

      // ── Refletir: devolve % do dano recebido ──
      case 'refletir': {
        const reflected = result.damage * (valor || 0.15);
        defState.reflectDamage = (defState.reflectDamage || 0) + reflected;
        result.buildEffects.push({
          type: 'item_refletir',
          label: `${emoji} ${nome}! ${reflected.toFixed(0)} dano refletido ao atacante`,
          color: '#f0abfc',
          value: reflected,
        });
        break;
      }

      // ── Ignorar Cap: próximo ataque sem limite de dano ──
      case 'ignorar_cap': {
        atkState.nextHitNoCap = true;
        result.buildEffects.push({
          type: 'item_ignorar_cap',
          label: `${emoji} ${nome}! Próximo ataque ignora o limite de dano`,
          color: '#60a5fa',
        });
        break;
      }
    }
  }
}

// ─── getWeightedAttackType ────────────────────────────────────────────
export function getRandomAttackType(
  fighter: Fighter,
  stats?: DynamicStats
): AttackType | null {
  const hasNinj = ELEMENTS.some(el => (fighter.elementLevels?.[el] || 0) > 0)
    && Object.values(JUTSUS_BY_ELEMENT).flat().some(j => (fighter.jutsus?.[j] || 0) > 0);

  if (stats) {
    // Ponderado por stat
    const weights: [AttackType, number][] = [
      ['taijutsu', stats.finalTaijutsu],
      ['genjutsu', stats.finalGenjutsu],
    ];
    if (hasNinj) weights.push(['ninjutsu', stats.finalNinjutsu]);
    const total = weights.reduce((s, [, w]) => s + w, 0);
    // Se todos os stats forem 0, cai no fallback aleatório simples
    if (total > 0) {
      let roll = Math.random() * total;
      for (const [type, weight] of weights) {
        roll -= weight;
        if (roll <= 0) return type;
      }
      return weights[0][0];
    }
  }

  // Fallback aleatório simples
  const types: AttackType[] = ['taijutsu', 'genjutsu'];
  if (hasNinj) types.push('ninjutsu');
  return types[Math.floor(Math.random() * types.length)];
}

// ─── DamageOptions ────────────────────────────────────────────────────
export interface DamageOptions {
  preferredElement?: Element;
  preferredJutsu?: string;
  equipmentData?: Equipment[];
  isBoss?: boolean;
  attackerBuild?: BuildType;
  defenderBuild?: BuildType;
  attackerState?: FighterBattleState;
  defenderState?: FighterBattleState;
  isFirstTurn?: boolean;
  // Para passivas condicionais de item
  attackerHpPct?: number;    // HP atual do atacante / HP máximo (0-1)
  defenderHpPct?: number;    // HP atual do defensor / HP máximo (0-1)
  defenderMaxHealth?: number; // HP máximo do defensor (para veneno fixo)
}

// ─── calculateDamage principal ────────────────────────────────────────
export function calculateDamage(
  attacker: Fighter,
  defender: Fighter,
  attackType: AttackType,
  options: DamageOptions = {}
): AttackResult {
  const {
    preferredElement, preferredJutsu,
    isBoss = false,
    isFirstTurn = false,
  } = options;

  const atkStats = calculateDynamicStats(attacker);
  const defStats = calculateDynamicStats(defender);

  // Detectar builds se não passadas
  const atkBuild: BuildType = options.attackerBuild || detectBuild(atkStats);
  const defBuild: BuildType = options.defenderBuild || detectBuild(defStats);

  // Estados de batalha
  const atkState = options.attackerState || emptyBattleState();
  const defState = options.defenderState || emptyBattleState();

  let result: AttackResult;

  // Paralisia: perde turno
  if (atkState.paralyzed && !isBoss) {
    atkState.paralyzed = false;
    return {
      damage: 0,
      log: 'estava paralisado e não conseguiu atacar!',
      isCritical: false,
      buildEffects: [{ type: 'paralysis_skipped', label: '⚡ Paralisado! Turno perdido', color: '#facc15' }],
    };
  }

  switch (attackType) {
    case 'taijutsu':
      result = calcTaijutsu(atkStats, defStats, atkBuild, defBuild, atkState, defState, attacker, isFirstTurn);
      break;
    case 'ninjutsu':
      result = calcNinjutsu(attacker, atkStats, defStats, atkBuild, defBuild, atkState, defState, isFirstTurn, preferredElement, preferredJutsu);
      break;
    case 'genjutsu':
      result = calcGenjutsu(atkStats, defStats, atkBuild, defBuild, atkState, defState, isFirstTurn);
      break;
  }

  // Cap de dano (PvP only, exceto nextHitNoCap)
  if (!isBoss && !atkState.nextHitNoCap) {
    const maxDmg = defStats.maxHealth * MAX_DAMAGE_PERCENT_PER_HIT;
    result.damage = Math.min(result.damage, maxDmg);
  } else if (atkState.nextHitNoCap) {
    atkState.nextHitNoCap = false;
  }

  result.damage = Math.max(0, result.damage);

  // Passivas de elemento (Futon, Raiton)
  applyElementPassives(attacker, result, defState);

  // ─── Passivas de Item ──────────────────────────────────────────────
  // Mapeamento de attackType → gatilhos de item correspondentes
  const attackTypeToGatilhos: Record<string, string[]> = {
    taijutsu: ['ao_atacar', 'ao_usar_taijutsu'],
    ninjutsu: ['ao_atacar', 'ao_usar_ninjutsu'],
    genjutsu: ['ao_atacar', 'ao_usar_genjutsu'],
  };

  const gatilhosAtaque = attackTypeToGatilhos[attackType] || ['ao_atacar'];

  // HP % do atacante (passado via options se disponível, fallback 1.0)
  const atkHpPct = options.attackerHpPct ?? 1.0;
  const defHpPct = options.defenderHpPct ?? 1.0;
  const defMaxHp = options.defenderMaxHealth ?? defStats.maxHealth;

  for (const gatilho of gatilhosAtaque) {
    applyItemPassives(attacker, gatilho, result, defState, atkState, atkHpPct, defHpPct, defMaxHp);
  }

  // Ankoku: 30% chance de ataque duplo
  if (atkBuild === 'sombra' && Math.random() < 0.3 && result.damage > 0) {
    result.secondHitDamage = (result.secondHitDamage || 0) + result.damage * 0.6;
    result.secondHitJutsu = result.jutsuUsed || 'Ankoku: Duplicada';
    result.buildEffects = result.buildEffects || [];
    result.buildEffects.push({
      type: 'dual_attack', label: `🌑 Ankoku: Ataque Duplo! +${(result.damage * 0.6).toFixed(0)} de dano`, color: '#6366f1', value: result.damage * 0.6,
    });
  }

  return result;
}

// ─── Boss (sem cap) ────────────────────────────────────────────────────
export function calculateDamageToBoss(
  attacker: Fighter, defender: Fighter, attackType: AttackType,
  options: Omit<DamageOptions, 'isBoss'> = {}
): AttackResult {
  return calculateDamage(attacker, defender, attackType, { ...options, isBoss: true });
}