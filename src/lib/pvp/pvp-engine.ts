/**
 * Engine do Sistema PVP — Turnos Simultâneos v4
 * Integrado com calculator.ts para cálculos reais de dano
 */

import { calculateDamage, calculateDynamicStats } from '@/lib/battle-system/calculator';
import { detectBuild, emptyBattleState, FighterBattleState } from '@/lib/battle-system/build-detector';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';
import { JUTSUS_BY_ELEMENT, ELEMENTS } from '@/lib/battle-system/constants';
import { JUTSU_GIFS } from '@/lib/battle-system/jutsu-gifs';
import { Fighter, AttackType, Element } from '@/lib/battle-system/types';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { getSummonBuildAbility, getSummonById } from '@/lib/summons-data';

import {
  PVPFighterSnapshot, PVPFighterState, PVPBattleState,
  PVPActionType, ACTION_COOLDOWNS,
} from './pvp-types';

export const CHAKRA_COSTS: Record<PVPActionType, number> = {
  taijutsu: 0, ninjutsu: 30, genjutsu: 25, defend: 10,
  charge: 0, doujutsu: 0, cursed_seal: 0, summon: 50,
};

// Sistema Elo PVP
// K-factor escala com a diferença de pontos
function getKFactor(diff: number): number {
  const absDiff = Math.abs(diff);
  if (absDiff > 500) return 50;
  if (absDiff > 200) return 40;
  return 32;
}

export function calcElo(winnerPoints: number, loserPoints: number): {
  winnerGain: number;
  loserLoss: number;
} {
  const K = getKFactor(winnerPoints - loserPoints);

  // Probabilidade esperada de vitória do vencedor
  const E = 1 / (1 + Math.pow(10, (loserPoints - winnerPoints) / 400));

  const winnerGain = Math.max(1, Math.round(K * (1 - E)));
  const loserLoss  = Math.max(1, Math.round(K * E));

  return { winnerGain, loserLoss };
}

// Mantido por compatibilidade mas sem XP nem Ryo
export function calcRewards(winnerPoints: number, loserPoints: number) {
  const { winnerGain, loserLoss } = calcElo(winnerPoints, loserPoints);
  return {
    xp:        0,
    ryo:       0,
    pvpPoints: winnerGain,
    loserLoss,
  };
}

export function createSnapshot(profile: any): PVPFighterSnapshot {
  return {
    id:           profile.id,
    name:         profile.name,
    level:        profile.level || 1,
    avatar_url:   profile.avatar_url,
    vitality:     profile.vitality || 0,
    taijutsu:     profile.taijutsu || 0,
    ninjutsu:     profile.ninjutsu || 0,
    genjutsu:     profile.genjutsu || 0,
    intelligence: profile.intelligence || 0,
    selo:         profile.selo || 0,
    elementLevels: profile.element_levels || {},
    jutsus:       profile.jutsus || {},
    cursedSeal:   profile.cursed_seal || undefined,
    doujutsu:     profile.doujutsu || undefined,
    weaponId:     profile.weapon_id || null,
    summonId:     profile.summon_id || null,
    summonLevel:  profile.summon_level || null,
    summonTrainedStat: profile.summon_trained_stat || null,
    chestId:      profile.chest_id || null,
    legsId:       profile.legs_id || null,
    feetId:       profile.feet_id || null,
    handsId:      profile.hands_id || null,
    clanWarPoints: profile.clan_war_points || 0,
    // HP atual salvo no perfil (usado para iniciar batalha com vida real)
    savedCurrentHealth: profile.current_health ?? null,
  };
}

// Converte snapshot para Fighter — usando calculateFinalStats para aplicar
// todos os buffs de arma, equipamentos, invocação, elementos e clã.
// Doujutsu e Cursed Seal são SEMPRE desativados antes de passar para
// calculateFinalStats para evitar double-buff: o buff de batalha é aplicado
// manualmente abaixo, de forma única e controlada.
function snapshotToFighter(snap: PVPFighterSnapshot): Fighter {
  // Neutraliza doujutsu/cursed_seal para que calculateFinalStats não os aplique.
  // O buff de batalha será somado manualmente logo abaixo.
  const doujutsuForCalc = snap.doujutsu
    ? { ...snap.doujutsu, isActive: false }
    : undefined;
  // Passa cursedSeal como undefined quando inativo para calculateFinalStats
  // não aplicar a penalidade de vitalidade antes da batalha começar
  const cursedSealForCalc = snap.cursedSeal?.isActive
    ? snap.cursedSeal
    : undefined;

  const profileForCalc = {
    vitality:            snap.vitality,
    intelligence:        snap.intelligence,
    taijutsu:            snap.taijutsu,
    ninjutsu:            snap.ninjutsu,
    genjutsu:            snap.genjutsu,
    selo:                snap.selo,
    element_levels:      snap.elementLevels,
    cursed_seal:         cursedSealForCalc,
    doujutsu:            doujutsuForCalc,
    weapon_id:           snap.weaponId,
    summon_id:           snap.summonId,
    summon_level:        snap.summonLevel,
    summon_trained_stat: snap.summonTrainedStat,
    chest_id:            snap.chestId,
    legs_id:             snap.legsId,
    feet_id:             snap.feetId,
    hands_id:            snap.handsId,
    clan_war_points:     snap.clanWarPoints ?? 0,
  };

  const finalStats = calculateFinalStats(profileForCalc);

  // Se calculateFinalStats falhar por algum motivo, fallback para stats brutos
  let vit   = finalStats?.finalVitality    ?? snap.vitality;
  let tai   = finalStats?.finalTaijutsu    ?? snap.taijutsu;
  let ninj  = finalStats?.finalNinjutsu    ?? snap.ninjutsu;
  let genj  = finalStats?.finalGenjutsu    ?? snap.genjutsu;
  let intel = finalStats?.finalIntelligence ?? snap.intelligence;
  let selo  = finalStats?.finalSelo        ?? snap.selo;

  // Doujutsu ativo em batalha: aplica buff percentual uma única vez
  if (snap.doujutsu?.isActive) {
    const mult = snap.doujutsu.type === 'Rinnegan'           ? 1.4
               : snap.doujutsu.type === 'Mangekyō Sharingan' ? 1.35
               : snap.doujutsu.type === 'Tenseigan'          ? 1.35
               : snap.doujutsu.type === 'Byakugan'           ? 1.25
               : 1.3; // Sharingan, Jōgan e demais
    tai   = Math.floor(tai   * mult);
    ninj  = Math.floor(ninj  * mult);
    genj  = Math.floor(genj  * mult);
    intel = Math.floor(intel * mult);
    selo  = Math.floor(selo  * mult);
  }

  // Cursed Seal ativo em batalha: nível 1 → +40% ataque, nível 2 → +70%
  if (snap.cursedSeal?.isActive) {
    const mult = snap.cursedSeal.level === 2 ? 1.7 : 1.4;
    tai  = Math.floor(tai  * mult);
    ninj = Math.floor(ninj * mult);
    genj = Math.floor(genj * mult);
  }

  return {
    name: snap.name, level: snap.level,
    vitality: vit, taijutsu: tai, ninjutsu: ninj,
    genjutsu: genj, intelligence: intel, selo: selo,
    elementLevels: snap.elementLevels as any,
    jutsus: snap.jutsus,
    cursedSeal: snap.cursedSeal as any,
    doujutsu: snap.doujutsu as any,
    weaponId: snap.weaponId, summonId: snap.summonId, summonLevel: snap.summonLevel,
    chestId: snap.chestId, legsId: snap.legsId, feetId: snap.feetId, handsId: snap.handsId,
  };
}

export function initFighterState(snapshot: PVPFighterSnapshot): PVPFighterState {
  const fighter = snapshotToFighter(snapshot);
  const stats   = calculateDynamicStats(fighter, EQUIPMENT_DATA);
  const build   = detectBuild(stats);
  // Kairai: +25% HP máximo (BUILD_INFO: "Corpo Imortal")
  // Shirogane: +15% HP máximo (BUILD_INFO: "Muralha Viva")
  const hpMult = build === 'imortal'  ? 1.25
               : build === 'protetor' ? 1.15
               : 1;
  const maxHealth = Math.floor(stats.maxHealth * hpMult);
  // Inicia com a vida real do perfil, mínimo 50% do máximo
  const minHealth     = Math.floor(maxHealth * 0.5);
  const savedHp       = snapshot.savedCurrentHealth;
  const startHealth   = savedHp != null
    ? Math.max(minHealth, Math.min(maxHealth, Math.floor(savedHp)))
    : maxHealth;
  return {
    snapshot, currentHealth: startHealth, currentChakra: Math.floor(stats.maxChakra),
    maxHealth, maxChakra: Math.floor(stats.maxChakra), battleState: emptyBattleState(),
    build, doujutsuUsed: false, cursedSealUsed: false, summonUsed: false,
    isDefending: false, cooldowns: {},
  };
}

export function initPVPBattle(
  challengerSnapshot: PVPFighterSnapshot,
  opponentSnapshot: PVPFighterSnapshot
): PVPBattleState {
  return {
    challenger: initFighterState(challengerSnapshot),
    opponent:   initFighterState(opponentSnapshot),
    currentTurn: 1, log: [], status: 'waiting', startedAt: Date.now(),
  };
}

function pickJutsu(snap: PVPFighterSnapshot): { element: Element; jutsu: string } | null {
  const available = ELEMENTS.filter(el => (snap.elementLevels[el] || 0) > 0);
  if (!available.length) return null;
  const weights = available.map(el => snap.elementLevels[el] || 0);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total, selectedEl = available[0];
  for (let i = 0; i < available.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { selectedEl = available[i]; break; }
  }
  const learned = JUTSUS_BY_ELEMENT[selectedEl].filter(j => (snap.jutsus[j] || 0) > 0);
  if (!learned.length) return null;
  const jWeights = learned.map(j => snap.jutsus[j] || 0);
  const jTotal = jWeights.reduce((a, b) => a + b, 0);
  let jRoll = Math.random() * jTotal, selectedJutsu = learned[0];
  for (let i = 0; i < learned.length; i++) {
    jRoll -= jWeights[i];
    if (jRoll <= 0) { selectedJutsu = learned[i]; break; }
  }
  return { element: selectedEl, jutsu: selectedJutsu };
}

// Calcula o dano de invocação baseado nos stats reais do summon
function calcSummonDamage(actor: PVPFighterState): number {
  const summonLevel = actor.snapshot.summonLevel || 1;
  // Dano base: ninjutsu do personagem * multiplicador do nível do summon
  const actorFighter = snapshotToFighter(actor.snapshot);
  const stats = calculateDynamicStats(actorFighter, EQUIPMENT_DATA);
  const base = stats.finalNinjutsu * (0.8 + summonLevel * 0.15);
  return Math.floor(base);
}

function calcAction(
  actor: PVPFighterState,
  reactor: PVPFighterState,
  action: PVPActionType,
  turn: number,
  isFirst: boolean
) {
  const a = JSON.parse(JSON.stringify(actor)) as PVPFighterState;
  let damage = 0, totalDamage = 0, isCritical = false, buildEffects: any[] = [];
  let logText = '', jutsuUsed: string | undefined, jutsuGif: string | null = null;
  let attackType: AttackType | undefined, secondHit: { damage: number; jutsuName: string } | undefined;
  const cost = CHAKRA_COSTS[action];

  if (action === 'doujutsu') {
    a.doujutsuUsed = true;
    if (a.snapshot.doujutsu) a.snapshot.doujutsu.isActive = true;
    const type = a.snapshot.doujutsu?.type || 'Dōjutsu';
    const mult = type === 'Rinnegan' ? '+40%' : type === 'Byakugan' ? '+25%' : '+30%';
    logText = `${a.snapshot.name} ativou o ${type}!`;
    buildEffects = [{ type: 'first_crit', label: `👁️ ${type} ativado! ${mult} em todos os stats`, color: '#a855f7' }];

  } else if (action === 'cursed_seal') {
    a.cursedSealUsed = true;
    if (a.snapshot.cursedSeal) a.snapshot.cursedSeal.isActive = true;
    const lvl = a.snapshot.cursedSeal?.level || 1;
    const mult = lvl === 2 ? '+70%' : '+40%';
    // Ao ativar: drena HP (5% nv1, 10% nv2)
    const hpDrain = Math.floor(a.maxHealth * (lvl === 2 ? 0.10 : 0.05));
    a.currentHealth = Math.max(1, a.currentHealth - hpDrain);
    logText = `${a.snapshot.name} ativou o Selo Amaldiçoado Nv${lvl}!`;
    buildEffects = [
      { type: 'first_crit', label: `⚡ Selo Nv${lvl} ativado! ${mult} em ataque`, color: '#f97316' },
      { type: 'burn_damage', label: `💀 Custo do Selo: -${hpDrain} HP`, color: '#ef4444', value: hpDrain },
    ];

  } else if (action === 'defend') {
    a.currentChakra -= cost;
    a.isDefending = true;
    logText = `${a.snapshot.name} assumiu postura defensiva.`;
    buildEffects = [{ type: 'barrier_blocked', label: '🛡️ Postura Defensiva — dano recebido -50%', color: '#22c55e' }];

  } else if (action === 'charge') {
    const recovered = Math.floor(a.maxChakra * 0.3);
    a.currentChakra = Math.min(a.maxChakra, a.currentChakra + recovered);
    logText = `${a.snapshot.name} concentrou chakra e recuperou ${recovered} pontos.`;
    buildEffects = [{ type: 'regen', label: `⚡ +${recovered} Chakra recuperado`, color: '#60a5fa' }];

  } else if (action === 'summon') {
    a.currentChakra -= cost;
    a.summonUsed = true;

    // ── Lê a habilidade de build da invocação ──────────────────────────
    const summonId   = a.snapshot.summonId ?? '';
    const summonLv   = a.snapshot.summonLevel ?? 1;
    const summonData = getSummonById(summonId);
    const buildAbility = summonId ? getSummonBuildAbility(summonId, a.build) : null;

    if (buildAbility) {
      const summonName = summonData?.name ?? 'Invocação';
      const abilityEmoji = buildAbility.emoji;
      const abilityName  = buildAbility.name;
      const val          = buildAbility.value ?? 0;
      const lvBonus      = 1 + (summonLv - 1) * 0.05; // +5% de eficácia por nível de treino

      // ── Aplica o efeito conforme effectType ───────────────────────────
      switch (buildAbility.effectType) {

        // ── BUFF de stat direto ─────────────────────────────────────────
        case 'stat_bonus': {
          // Aplicado como bônus de chakra temporário no turno (sinaliza UI)
          // Stats base são fixos; registramos o buff no buildEffects para exibição
          logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName} ativado.`;
          buildEffects = [{
            type:  'summon_buff',
            label: `${abilityEmoji} ${abilityName} (${summonName} Nv${summonLv})`,
            color: '#f97316',
          }];
          break;
        }

        // ── PASSIVA de batalha: aplica efeito de estado ─────────────────
        case 'battle_passive':
        case 'aura': {
          // Muitas passivas são estruturais (já calculadas pelo build-detector
          // ou pelo calculator). A invocação REFORÇA a passiva da build:
          // aplica uma carga de regen/buff de turno como efeito imediato.
          if (buildAbility.targetStat === 'hp' && val > 0) {
            // Regen imediata de HP como representação visual da passiva
            const healAmt = Math.floor(a.maxHealth * val * lvBonus);
            a.currentHealth = Math.min(a.maxHealth, a.currentHealth + healAmt);
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName}: recuperou ${healAmt} HP.`;
            buildEffects = [{
              type: 'regen', label: `${abilityEmoji} ${abilityName} +${healAmt} HP`, color: '#22c55e', value: healAmt,
            }];
          } else if (buildAbility.targetStat === 'chakra' && val > 0) {
            const chakraAmt = Math.floor(a.maxChakra * val * lvBonus);
            a.currentChakra = Math.min(a.maxChakra, a.currentChakra + chakraAmt);
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName}: recuperou ${chakraAmt} Chakra.`;
            buildEffects = [{
              type: 'regen', label: `${abilityEmoji} ${abilityName} +${chakraAmt} Chakra`, color: '#60a5fa', value: chakraAmt,
            }];
          } else {
            // Passiva sem stat direto: aplica nextHitNoCap como buff do turno
            a.battleState.nextHitNoCap = true;
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName} ativo.`;
            buildEffects = [{
              type: 'summon_buff',
              label: `${abilityEmoji} ${abilityName} — próximo ataque potencializado`,
              color: '#f97316',
            }];
          }
          break;
        }

        // ── EFEITO de turno: aplica debuff no oponente ou buff pontual ──
        case 'turn_effect': {
          if (buildAbility.targetStat === 'hp' && val > 0 && val <= 0.5) {
            // Drena HP do oponente (ex: veneno, lifesteal)
            const drainAmt = Math.floor(reactor.maxHealth * val * lvBonus);
            damage      = drainAmt;
            totalDamage = drainAmt;
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName}: drenou ${drainAmt} HP do oponente.`;
            buildEffects = [{
              type: 'second_hit', label: `${abilityEmoji} ${abilityName}: -${drainAmt} HP`, color: '#ef4444', value: drainAmt,
            }];
          } else if (buildAbility.targetStat === 'hp' && val > 0.5) {
            // Cura de HP próprio (ex: regeneração ao sobreviver)
            const healAmt = Math.floor(a.maxHealth * (val <= 1 ? val : val / 100) * lvBonus);
            a.currentHealth = Math.min(a.maxHealth, a.currentHealth + healAmt);
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName}: recuperou ${healAmt} HP.`;
            buildEffects = [{
              type: 'regen', label: `${abilityEmoji} ${abilityName} +${healAmt} HP`, color: '#22c55e', value: healAmt,
            }];
          } else if (buildAbility.targetStat === 'chakra' && val > 0) {
            // Drena chakra do oponente
            const drainChakra = Math.floor(reactor.maxChakra * val * lvBonus);
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName}: drenou ${drainChakra} Chakra.`;
            buildEffects = [{
              type: 'summon_buff', label: `${abilityEmoji} ${abilityName}: oponente -${drainChakra} Chakra`, color: '#a855f7',
            }];
          } else {
            // Aplica weakened no oponente (debuff genérico)
            reactor.battleState.weakened = true;
            logText = `${a.snapshot.name} invocou ${summonName}! ${abilityName} aplicado.`;
            buildEffects = [{
              type: 'summon_buff',
              label: `${abilityEmoji} ${abilityName} — oponente debilitado`,
              color: '#f97316',
            }];
          }
          break;
        }

        default: {
          // Fallback: trata como passiva
          a.battleState.nextHitNoCap = true;
          logText = `${a.snapshot.name} invocou ${summonName}! Habilidade ativada.`;
          buildEffects = [{
            type: 'summon_buff', label: `${abilityEmoji} ${abilityName}`, color: '#f97316',
          }];
        }
      }

    } else {
      // Sem buildAbility mapeada — fallback para dano direto (legado)
      const summonDmg = calcSummonDamage(a);
      damage      = summonDmg;
      totalDamage = summonDmg;
      logText = `${a.snapshot.name} invocou e causou ${summonDmg} de dano!`;
      buildEffects = [{
        type: 'second_hit',
        label: `🐉 Invocação Nv${summonLv}! ${summonDmg} dmg`,
        color: '#f97316', value: summonDmg,
      }];
    }

  } else {
    // taijutsu / ninjutsu / genjutsu — usa calculateDamage do calculator.ts
    a.currentChakra -= cost;
    a.isDefending = false;
    attackType = action as AttackType;

    // Fighter com bônus de doujutsu/cursed_seal já aplicados
    const actorFighter   = snapshotToFighter(a.snapshot);
    const reactorFighter = snapshotToFighter(reactor.snapshot);

    let preferredElement: Element | undefined, preferredJutsu: string | undefined;
    if (attackType === 'ninjutsu') {
      const picked = pickJutsu(a.snapshot);
      if (picked) { preferredElement = picked.element; preferredJutsu = picked.jutsu; }
    }

    const result = calculateDamage(actorFighter, reactorFighter, attackType, {
      preferredElement, preferredJutsu,
      equipmentData: EQUIPMENT_DATA,
      isBoss: true, // desativa o cap de 35% do calculator — o cap de 60% é aplicado abaixo
      attackerBuild: a.build,
      defenderBuild: reactor.build,
      attackerState: a.battleState as FighterBattleState,
      defenderState: reactor.battleState as FighterBattleState,
      isFirstTurn: isFirst,
    });

    // Cap PVP: 60% do HP máximo do defensor (calculator usa 35%, sobrescrevemos aqui)
    const pvpCap = Math.floor(reactor.maxHealth * 0.60);
    result.damage = Math.min(result.damage, pvpCap);
    if (result.secondHitDamage) result.secondHitDamage = Math.min(result.secondHitDamage, pvpCap);

    damage      = result.damage;
    totalDamage = result.damage + (result.secondHitDamage || 0);
    isCritical  = result.isCritical;
    buildEffects = result.buildEffects || [];

    // No PvP a queimadura gerada NESTE turno já é somada ao dano do turno atual
    // (bloco "Queimadura acumulada" abaixo em processPVPTurn).
    // Atualiza os labels para refletir isso sem depender de replace de string.
    buildEffects = buildEffects.map(ef => {
      if (ef.type === 'burn_applied' || ef.type === 'item_queimadura') {
        return {
          ...ef,
          label: ef.label
            .replace(/no próximo turno/g, 'imediato')
            .replace(/dano no próximo/g, 'dano imediato'),
          pvpImmediate: true,
        };
      }
      return ef;
    });
    jutsuUsed   = result.jutsuUsed || preferredJutsu;
    jutsuGif    = preferredJutsu ? (JUTSU_GIFS[preferredJutsu] || null) : null;

    if (result.secondHitDamage) {
      secondHit = { damage: result.secondHitDamage, jutsuName: result.secondHitJutsu || '2º Golpe' };
    }

    // Shugosha: regen por atacar
    if (a.build === 'guardiao') {
      const regen = Math.floor(a.maxHealth * 0.03);
      a.currentHealth = Math.min(a.maxHealth, a.currentHealth + regen);
      buildEffects.push({ type: 'regen', label: `💚 Regen Shugosha +${regen} HP`, color: '#22c55e', value: regen });
    }

    // Reconstruir logText com o valor pós-cap para bater com o HP perdido
    if (attackType === 'ninjutsu' && jutsuUsed) {
      logText = `${a.snapshot.name} usou ${jutsuUsed} e causou ${damage.toFixed(0)} de dano${isCritical ? ' (CRÍTICO!)' : ''}.`;
    } else if (attackType === 'taijutsu') {
      logText = `${a.snapshot.name} causou ${damage.toFixed(0)} de dano com Taijutsu${isCritical ? ' (CRÍTICO!)' : ''}.`;
    } else if (attackType === 'genjutsu') {
      logText = damage > 0
        ? `${a.snapshot.name} causou ${damage.toFixed(0)} de dano com Genjutsu${isCritical ? ' (CRÍTICO!)' : ''}.`
        : `${a.snapshot.name} tentou um Genjutsu, mas o alvo resistiu.`;
    } else {
      logText = `${a.snapshot.name} ${result.log}`;
    }
  }

  // Aplicar cooldown
  if (ACTION_COOLDOWNS[action] > 0) a.cooldowns[action] = turn + ACTION_COOLDOWNS[action];

  return {
    actorAfter: a,
    reactorDmg: totalDamage,
    reactorBattleState: reactor.battleState, // estado modificado pelas passivas
    logData: { action, attackType, jutsuUsed, jutsuGif, damage, totalDamage, isCritical, buildEffects, secondHit, logText },
  };
}

export function processPVPTurn(
  state: PVPBattleState,
  challengerAction: PVPActionType,
  opponentAction: PVPActionType
): PVPBattleState {
  const s: PVPBattleState = JSON.parse(JSON.stringify(state));
  if (s.status === 'finished') return s;
  const isFirst = s.currentTurn === 1;

  // Calcular ações dos dois simultaneamente
  const chalResult = calcAction(s.challenger, s.opponent,  challengerAction, s.currentTurn, isFirst);
  const oppResult  = calcAction(s.opponent,  s.challenger, opponentAction,   s.currentTurn, isFirst);

  // Aplicar estados atualizados dos atores
  s.challenger = chalResult.actorAfter;
  s.opponent   = oppResult.actorAfter;

  // Aplicar estados do reactor (passivas de elemento modificam o defensor)
  s.opponent.battleState   = chalResult.reactorBattleState;
  s.challenger.battleState = oppResult.reactorBattleState;

  // Calcular danos com redução por defesa
  let chalDmg = chalResult.reactorDmg;
  let oppDmg  = oppResult.reactorDmg;

  if (s.opponent.isDefending && chalDmg > 0) {
    chalDmg = Math.floor(chalDmg * 0.5);
    chalResult.logData.buildEffects.push({ type: 'barrier_blocked', label: '🛡️ Postura Defensiva! Dano -50%', color: '#22c55e' });
  }
  if (s.challenger.isDefending && oppDmg > 0) {
    oppDmg = Math.floor(oppDmg * 0.5);
    oppResult.logData.buildEffects.push({ type: 'barrier_blocked', label: '🛡️ Postura Defensiva! Dano -50%', color: '#22c55e' });
  }

  // Queimadura acumulada (passiva Katon)
  const chalBurnDmg = s.opponent.battleState.burnDamage || 0;
  const oppBurnDmg  = s.challenger.battleState.burnDamage || 0;
  if (chalBurnDmg > 0) {
    chalDmg += chalBurnDmg;
    s.opponent.battleState.burnDamage = 0;
    chalResult.logData.buildEffects.push({ type: 'burn_applied', label: `🔥 Queimadura! +${chalBurnDmg.toFixed(0)} dmg`, color: '#f97316' });
  }
  if (oppBurnDmg > 0) {
    oppDmg += oppBurnDmg;
    s.challenger.battleState.burnDamage = 0;
    oppResult.logData.buildEffects.push({ type: 'burn_applied', label: `🔥 Queimadura! +${oppBurnDmg.toFixed(0)} dmg`, color: '#f97316' });
  }

  // Aplicar danos
  s.opponent.currentHealth   = Math.max(0, s.opponent.currentHealth   - chalDmg);
  s.challenger.currentHealth = Math.max(0, s.challenger.currentHealth - oppDmg);

  // ── Passiva Refletir: devolve dano ao atacante ──────────────────────
  // O dano refletido foi acumulado em battleState.reflectDamage do defensor
  // durante applyItemPassives (gatilho ao_receber_dano). Aplicamos aqui,
  // depois do dano principal, e zeramos o campo para o próximo turno.
  const chalReflect = s.opponent.battleState.reflectDamage || 0;
  const oppReflect  = s.challenger.battleState.reflectDamage || 0;
  if (chalReflect > 0) {
    s.challenger.currentHealth = Math.max(0, s.challenger.currentHealth - chalReflect);
    s.opponent.battleState.reflectDamage = 0;
    chalResult.logData.buildEffects.push({
      type: 'item_refletir',
      label: `🔮 Refletir! ${chalReflect.toFixed(0)} dmg devolvido ao atacante`,
      color: '#f0abfc',
      value: chalReflect,
    });
  }
  if (oppReflect > 0) {
    s.opponent.currentHealth = Math.max(0, s.opponent.currentHealth - oppReflect);
    s.challenger.battleState.reflectDamage = 0;
    oppResult.logData.buildEffects.push({
      type: 'item_refletir',
      label: `🔮 Refletir! ${oppReflect.toFixed(0)} dmg devolvido ao atacante`,
      color: '#f0abfc',
      value: oppReflect,
    });
  }

  // Kairai: sobrevive com 1 HP uma vez
  if (s.opponent.currentHealth <= 0 && !s.opponent.battleState.survivedDeathUsed && s.opponent.build === 'imortal') {
    s.opponent.currentHealth = 1;
    s.opponent.battleState.survivedDeathUsed = true;
    chalResult.logData.buildEffects.push({ type: 'survived_death', label: '💀 Vontade de Ferro! Sobreviveu com 1 HP', color: '#64748b' });
  }
  if (s.challenger.currentHealth <= 0 && !s.challenger.battleState.survivedDeathUsed && s.challenger.build === 'imortal') {
    s.challenger.currentHealth = 1;
    s.challenger.battleState.survivedDeathUsed = true;
    oppResult.logData.buildEffects.push({ type: 'survived_death', label: '💀 Vontade de Ferro! Sobreviveu com 1 HP', color: '#64748b' });
  }

  // Daikabe contra-ataque (crítico devolvido)
  if (chalResult.logData.isCritical && s.opponent.build === 'tanque') {
    const counter = Math.floor(chalDmg * 0.3);
    s.challenger.currentHealth = Math.max(0, s.challenger.currentHealth - counter);
    chalResult.logData.buildEffects.push({ type: 'counter_attack', label: `🛡️ Contra-Ataque Daikabe! ${counter} dmg devolvido`, color: '#22c55e' });
  }
  if (oppResult.logData.isCritical && s.challenger.build === 'tanque') {
    const counter = Math.floor(oppDmg * 0.3);
    s.opponent.currentHealth = Math.max(0, s.opponent.currentHealth - counter);
    oppResult.logData.buildEffects.push({ type: 'counter_attack', label: `🛡️ Contra-Ataque Daikabe! ${counter} dmg devolvido`, color: '#22c55e' });
  }

  // Resetar isDefending e barrierActiveThisTurn após turno
  s.challenger.isDefending = false;
  s.opponent.isDefending   = false;
  s.challenger.battleState.barrierActiveThisTurn = false;
  s.opponent.battleState.barrierActiveThisTurn   = false;

  // Log do turno
  s.log.push({
    turn: s.currentTurn,
    challenger: { actorId: s.challenger.snapshot.id, ...chalResult.logData },
    opponent:   { actorId: s.opponent.snapshot.id,   ...oppResult.logData },
    challengerHealthAfter: s.challenger.currentHealth,
    opponentHealthAfter:   s.opponent.currentHealth,
  });

  // Verificar fim de batalha
  const chalAlive = s.challenger.currentHealth > 0;
  const oppAlive  = s.opponent.currentHealth   > 0;

  if (!chalAlive || !oppAlive) {
    s.status = 'finished';
    s.winnerId = (!chalAlive && !oppAlive)
      ? (s.challenger.currentHealth >= s.opponent.currentHealth
          ? s.challenger.snapshot.id
          : s.opponent.snapshot.id)
      : (chalAlive ? s.challenger.snapshot.id : s.opponent.snapshot.id);
    s.finishedAt = Date.now();

    // ── Taishō (senhor_guerra): Sede de Batalha — recupera 20% do HP perdido ──
    // Aplicamos ao vencedor vivo após a batalha terminar.
    const winner = chalAlive && !oppAlive ? s.challenger
                 : !chalAlive && oppAlive ? s.opponent
                 : null; // empate: nenhum recupera
    if (winner && winner.build === 'senhor_guerra') {
      const hpLost   = winner.maxHealth - winner.currentHealth;
      const recovered = Math.floor(hpLost * 0.2);
      if (recovered > 0) {
        winner.currentHealth = Math.min(winner.maxHealth, winner.currentHealth + recovered);
        // Registrar no último log para exibição no relatório
        const lastLog = s.log[s.log.length - 1];
        if (lastLog) {
          const side = winner === s.challenger ? 'challenger' : 'opponent';
          lastLog[side].buildEffects = lastLog[side].buildEffects || [];
          lastLog[side].buildEffects.push({
            type: 'regen',
            label: `🏆 Sede de Batalha (Taishō)! +${recovered} HP recuperado após vitória`,
            color: '#dc2626',
            value: recovered,
          });
        }
      }
    }
  } else {
    s.currentTurn++;
    s.status = 'active';
  }

  return s;
}

export function getAvailableActions(fighterState: PVPFighterState, currentTurn: number): PVPActionType[] {
  const actions: PVPActionType[] = [];
  const snap   = fighterState.snapshot;
  const chakra = fighterState.currentChakra;
  const cds    = fighterState.cooldowns || {};
  const onCooldown = (a: PVPActionType) => (cds[a] ?? 0) > currentTurn;

  if (!onCooldown('taijutsu')) actions.push('taijutsu');
  if (!onCooldown('charge')) actions.push('charge');

  const hasNinjutsu = ELEMENTS.some(
    el => (snap.elementLevels[el] > 0) && JUTSUS_BY_ELEMENT[el].some(j => (snap.jutsus[j] || 0) > 0)
  );
  if (hasNinjutsu && chakra >= CHAKRA_COSTS.ninjutsu && !onCooldown('ninjutsu')) actions.push('ninjutsu');
  if ((snap.genjutsu || 0) > 0 && chakra >= CHAKRA_COSTS.genjutsu && !onCooldown('genjutsu')) actions.push('genjutsu');
  if (chakra >= CHAKRA_COSTS.defend && !onCooldown('defend')) actions.push('defend');
  if (snap.doujutsu && !fighterState.doujutsuUsed) actions.push('doujutsu');
  if (snap.cursedSeal && !fighterState.cursedSealUsed) actions.push('cursed_seal');
  if (snap.summonId && !fighterState.summonUsed && chakra >= CHAKRA_COSTS.summon) actions.push('summon');

  return actions;
}

export function pickRandomAction(fighterState: PVPFighterState, currentTurn: number): PVPActionType {
  const available = getAvailableActions(fighterState, currentTurn);
  const offensive = available.filter(a => ['taijutsu', 'ninjutsu', 'genjutsu', 'summon', 'doujutsu', 'cursed_seal'].includes(a));
  const pool = offensive.length > 0 ? offensive : available;
  return pool[Math.floor(Math.random() * pool.length)];
}

export { snapshotToFighter };