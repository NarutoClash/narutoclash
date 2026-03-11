/**
 * Engine de Guerra de Clãs
 * Reutiliza calculateDamage, snapshotToFighter e toda a lógica do pvp-engine existente.
 * Adaptado para batalhas em equipe (2v2 → 5v5).
 */

import { calculateDamage, calculateDynamicStats } from '@/lib/battle-system/calculator';
import { detectBuild, emptyBattleState, FighterBattleState } from '@/lib/battle-system/build-detector';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';
import { JUTSUS_BY_ELEMENT, ELEMENTS } from '@/lib/battle-system/constants';
import { JUTSU_GIFS } from '@/lib/battle-system/jutsu-gifs';
import { Fighter, AttackType, Element } from '@/lib/battle-system/types';
import { snapshotToFighter } from '@/lib/pvp/pvp-engine';

import {
  ClanWarMember, ClanWarAction, WarTurnEvent,
  WarActionType, WAR_CHAKRA_COSTS, calcTeamBonus, calcFocusBonus,
  TEAM_SIZE,
} from './clan-war-types';

// ── Snapshot do profile para ClanWarMember ───────────────────────────
export function createWarMemberSnapshot(profile: any, warId: string, clanId: string, slot: number): Omit<ClanWarMember, 'id'> {
  // Calcular stats finais (com equipamentos) usando o mesmo sistema do PVP
  const fighter = snapshotToFighter({
    id: profile.id,
    name: profile.name,
    level: profile.level || 1,
    avatar_url: profile.avatar_url,
    vitality: profile.vitality || 0,
    taijutsu: profile.taijutsu || 0,
    ninjutsu: profile.ninjutsu || 0,
    genjutsu: profile.genjutsu || 0,
    intelligence: profile.intelligence || 0,
    selo: profile.selo || 0,
    elementLevels: profile.element_levels || {},
    jutsus: profile.jutsus || {},
    cursedSeal: profile.cursed_seal || undefined,
    doujutsu: profile.doujutsu || undefined,
    weaponId: profile.weapon_id || null,
    summonId: profile.summon_id || null,
    summonLevel: profile.summon_level || null,
    summonTrainedStat: profile.summon_trained_stat || null,
    chestId: profile.chest_id || null,
    legsId: profile.legs_id || null,
    feetId: profile.feet_id || null,
    handsId: profile.hands_id || null,
    clanWarPoints: profile.clan_war_points || 0,
  });

  const stats = calculateDynamicStats(fighter, EQUIPMENT_DATA);
  const build = detectBuild(stats);

  // Kairai +25% HP / Shirogane +15% HP (igual ao pvp-engine)
  const hpMult = build === 'imortal' ? 1.25 : build === 'protetor' ? 1.15 : 1;
  const hpMax = Math.floor(stats.maxHealth * hpMult);
  const chakraMax = Math.floor(stats.maxChakra);

  return {
    war_id: warId,
    clan_id: clanId,
    player_id: profile.id,
    player_name: profile.name,
    player_avatar: profile.avatar_url || null,
    slot,
    vitality: profile.vitality || 0,
    taijutsu: profile.taijutsu || 0,
    ninjutsu: profile.ninjutsu || 0,
    genjutsu: profile.genjutsu || 0,
    intelligence: profile.intelligence || 0,
    selo: profile.selo || 0,
    element_levels: profile.element_levels || {},
    jutsus: profile.jutsus || {},
    weapon_id: profile.weapon_id || null,
    chest_id: profile.chest_id || null,
    legs_id: profile.legs_id || null,
    feet_id: profile.feet_id || null,
    hands_id: profile.hands_id || null,
    summon_id: profile.summon_id || null,
    summon_level: profile.summon_level || null,
    summon_trained_stat: profile.summon_trained_stat || null,
    doujutsu: profile.doujutsu || null,
    cursed_seal: profile.cursed_seal || null,
    build,
    hp_max: hpMax,
    // Inicia com a vida real do perfil, mínimo 50% do máximo
    hp_current: profile.current_health != null
      ? Math.max(Math.floor(hpMax * 0.5), Math.min(hpMax, Math.floor(profile.current_health)))
      : hpMax,
    chakra_max: chakraMax,
    chakra_current: chakraMax,
    is_alive: true,
    disconnected: false,
    inactive_turns: 0,
    battle_state: emptyBattleState(),
    doujutsu_used: false,
    cursed_seal_used: false,
    summon_used: false,
    is_defending: false,
    cooldowns: {},
  };
}

// ── Converte ClanWarMember para Fighter (usado pelo calculateDamage) ──
function memberToFighter(m: ClanWarMember): Fighter {
  return snapshotToFighter({
    id: m.player_id,
    name: m.player_name,
    level: 1, // level não afeta dano no sistema atual
    vitality: m.vitality,
    taijutsu: m.taijutsu,
    ninjutsu: m.ninjutsu,
    genjutsu: m.genjutsu,
    intelligence: m.intelligence,
    selo: m.selo,
    elementLevels: m.element_levels,
    jutsus: m.jutsus,
    cursedSeal: m.doujutsu_used ? null : (m.cursed_seal || undefined),
    doujutsu: m.doujutsu_used
      ? (m.doujutsu ? { ...m.doujutsu, isActive: true } : undefined)
      : (m.doujutsu || undefined),
    weaponId: m.weapon_id,
    summonId: m.summon_id,
    summonLevel: m.summon_level,
    summonTrainedStat: m.summon_trained_stat,
    chestId: m.chest_id,
    legsId: m.legs_id,
    feetId: m.feet_id,
    handsId: m.hands_id,
    clanWarPoints: 0,
  });
}

// ── Escolhe jutsu (igual ao pvp-engine) ──────────────────────────────
function pickJutsu(m: ClanWarMember): { element: Element; jutsu: string } | null {
  const available = ELEMENTS.filter(el => (m.element_levels[el] || 0) > 0);
  if (!available.length) return null;
  const weights = available.map(el => m.element_levels[el] || 0);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total, selectedEl = available[0];
  for (let i = 0; i < available.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { selectedEl = available[i]; break; }
  }
  const learned = JUTSUS_BY_ELEMENT[selectedEl].filter(j => (m.jutsus[j] || 0) > 0);
  if (!learned.length) return null;
  const jWeights = learned.map(j => m.jutsus[j] || 0);
  const jTotal = jWeights.reduce((a, b) => a + b, 0);
  let jRoll = Math.random() * jTotal, selectedJutsu = learned[0];
  for (let i = 0; i < learned.length; i++) {
    jRoll -= jWeights[i];
    if (jRoll <= 0) { selectedJutsu = learned[i]; break; }
  }
  return { element: selectedEl, jutsu: selectedJutsu };
}

// ── Ações disponíveis (igual ao pvp-engine, adaptado) ────────────────
// Cooldowns fixos por ação
export const ACTION_COOLDOWNS: Partial<Record<WarActionType, number>> = {
  taijutsu: 2,
  ninjutsu: 3,
  genjutsu: 2,
  defend: 2,
};

export function getWarAvailableActions(m: ClanWarMember, currentTurn: number): WarActionType[] {
  const actions: WarActionType[] = [];
  const onCooldown = (a: WarActionType) => (m.cooldowns[a] ?? 0) > currentTurn;

  // Taijutsu agora tem cooldown
  if (!onCooldown('taijutsu')) actions.push('taijutsu');

  // Charge sempre livre
  actions.push('charge');

  const hasNinjutsu = ELEMENTS.some(
    el => (m.element_levels[el] > 0) &&
          JUTSUS_BY_ELEMENT[el].some(j => (m.jutsus[j] || 0) > 0)
  );
  if (hasNinjutsu && m.chakra_current >= WAR_CHAKRA_COSTS.ninjutsu && !onCooldown('ninjutsu'))
    actions.push('ninjutsu');
  if ((m.genjutsu || 0) > 0 && m.chakra_current >= WAR_CHAKRA_COSTS.genjutsu && !onCooldown('genjutsu'))
    actions.push('genjutsu');
  if (m.chakra_current >= WAR_CHAKRA_COSTS.defend && !onCooldown('defend'))
    actions.push('defend');
  // 1x por batalha
  if (m.doujutsu && !m.doujutsu_used) actions.push('doujutsu');
  if (m.cursed_seal && !m.cursed_seal_used) actions.push('cursed_seal');
  if (m.summon_id && !m.summon_used && m.chakra_current >= WAR_CHAKRA_COSTS.summon)
    actions.push('summon');

  return actions;
}

// ── Auto-ação para quem não submeteu (ou se desconectou) ─────────────
export function pickAutoAction(m: ClanWarMember, enemies: ClanWarMember[], currentTurn: number): {
  action_type: WarActionType;
  target_player_id: string;
} {
  const available = getWarAvailableActions(m, currentTurn);
  const offensive = available.filter(a =>
    ['taijutsu', 'ninjutsu', 'genjutsu', 'summon', 'doujutsu', 'cursed_seal'].includes(a)
  );
  const pool = offensive.length > 0 ? offensive : available;
  const action_type = pool[Math.floor(Math.random() * pool.length)];
  // Ataca o inimigo mais fraco (menos HP)
  const target = enemies.reduce((prev, curr) =>
    curr.hp_current < prev.hp_current ? curr : prev
  );
  return { action_type, target_player_id: target.player_id };
}

// ── Resolve turno completo ────────────────────────────────────────────
export interface ResolveTurnResult {
  updatedMembers: ClanWarMember[];
  events: WarTurnEvent[];
  teamAAlive: number;
  teamBAlive: number;
  warFinished: boolean;
  winnerClanId: string | null;
}

export function resolveTurn(
  members: ClanWarMember[],
  actions: ClanWarAction[],
  clanAId: string,
  clanBId: string,
  currentTurn: number,
): ResolveTurnResult {
  // Clonar para não mutar o original
  const state = members.map(m => ({ ...m, battle_state: { ...m.battle_state } }));
  const events: WarTurnEvent[] = [];

  const alive = state.filter(m => m.is_alive);
  const teamA = alive.filter(m => m.clan_id === clanAId);
  const teamB = alive.filter(m => m.clan_id === clanBId);

  // Verificar inatividade e completar ações automáticas apenas para quem não está inativo
  const allActions = [...actions];
  alive.forEach(member => {
    const submitted = actions.find(a => a.player_id === member.player_id);

    if (!submitted && member.is_alive) {
      // Incrementar contador de inatividade
      const newInactiveTurns = (member.inactive_turns || 0) + 1;
      member.inactive_turns = newInactiveTurns;

      if (newInactiveTurns >= 999) { // DEV: inatividade desativada
        // 3 turnos sem ação — eliminar, sem ação automática
        member.hp_current = 0;
        member.is_alive = false;
        member.disconnected = true;
        events.push({
          type: 'disconnect',
          actor_id: member.player_id,
          actor_name: member.player_name,
          log_text: `💀 ${member.player_name} foi eliminado por inatividade (3 turnos sem ação).`,
          build_effects: [{ type: 'burn_damage', label: '💀 Eliminado por inatividade', color: '#ef4444' }],
        });
      } else {
        // Aviso de inatividade — empurra ação automática apenas para não travar o turno
        const enemies = member.clan_id === clanAId ? teamB : teamA;
        if (enemies.length > 0) {
          const auto = pickAutoAction(member, enemies, currentTurn);
          allActions.push({
            id: `auto_${member.player_id}`,
            war_id: actions[0]?.war_id || '',
            turn: currentTurn,
            player_id: member.player_id,
            clan_id: member.clan_id,
            action_type: auto.action_type,
            target_player_id: auto.target_player_id,
            submitted_at: new Date().toISOString(),
            was_auto: true,
          });
        }
        events.push({
          type: 'special',
          actor_id: member.player_id,
          actor_name: member.player_name,
          log_text: `⚠️ ${member.player_name} está inativo (${newInactiveTurns}/3). Na 3ª rodada será eliminado.`,
          build_effects: [{ type: 'paralysis_skipped', label: `⚠️ Inativo ${newInactiveTurns}/3`, color: '#f59e0b' }],
        });
      }
    } else if (submitted) {
      // Voltou a jogar — resetar contador
      member.inactive_turns = 0;
    }
  });

  // Bônus de equipe
  const teamABonus = calcTeamBonus(teamA.length);
  const teamBBonus = calcTeamBonus(teamB.length);

  // Calcular bônus de foco por alvo
  const attackCountByTarget: Record<string, number> = {};
  allActions.filter(a => ['taijutsu','ninjutsu','genjutsu'].includes(a.action_type))
    .forEach(a => {
      attackCountByTarget[a.target_player_id] = (attackCountByTarget[a.target_player_id] || 0) + 1;
    });

  // Aplicar cooldowns das ações usadas neste turno (apenas ações reais, não auto)
  allActions.forEach(action => {
    const actor = state.find(m => m.player_id === action.player_id);
    if (!actor || action.was_auto) return;
    const cd = ACTION_COOLDOWNS[action.action_type as WarActionType];
    if (cd) {
      actor.cooldowns = {
        ...actor.cooldowns,
        [action.action_type]: currentTurn + cd,
      };
    }
  });

  // Calcular danos pendentes (todos simultâneos, igual ao PVP)
  const pendingDamage: Record<string, number> = {};
  const pendingChakra: Record<string, number> = {};

  allActions.forEach(action => {
    const attacker = state.find(m => m.player_id === action.player_id);
    const target   = state.find(m => m.player_id === action.target_player_id);
    if (!attacker || !attacker.is_alive) return;

    const teamBonus = attacker.clan_id === clanAId ? teamABonus : teamBBonus;
    const cost = WAR_CHAKRA_COSTS[action.action_type];

    if (action.action_type === 'charge') {
      // Recupera 30% do chakra máximo (igual ao pvp-engine)
      const recovered = Math.floor(attacker.chakra_max * 0.3);
      pendingChakra[attacker.player_id] = recovered;
      events.push({
        type: 'charge',
        actor_id: attacker.player_id,
        actor_name: attacker.player_name,
        action_type: 'charge',
        log_text: `${attacker.player_name} concentrou chakra! +${recovered} chakra`,
      });
      return;
    }

    if (action.action_type === 'defend') {
      attacker.is_defending = true;
      attacker.chakra_current = Math.max(0, attacker.chakra_current - cost);
      events.push({
        type: 'defend',
        actor_id: attacker.player_id,
        actor_name: attacker.player_name,
        action_type: 'defend',
        log_text: `${attacker.player_name} assumiu postura defensiva.`,
      });
      return;
    }

    if (action.action_type === 'doujutsu') {
      attacker.doujutsu_used = true;
      if (attacker.doujutsu) attacker.doujutsu = { ...attacker.doujutsu, isActive: true };
      const type = attacker.doujutsu?.type || 'Dōjutsu';
      events.push({
        type: 'special',
        actor_id: attacker.player_id,
        actor_name: attacker.player_name,
        action_type: 'doujutsu',
        log_text: `${attacker.player_name} ativou o ${type}!`,
      });
      return;
    }

    if (action.action_type === 'cursed_seal') {
      attacker.cursed_seal_used = true;
      if (attacker.cursed_seal) attacker.cursed_seal = { ...attacker.cursed_seal, isActive: true };
      const lvl = attacker.cursed_seal?.level || 1;
      // Ao ativar: drena HP (5% nv1, 10% nv2)
      const hpDrain = Math.floor(attacker.hp_max * (lvl === 2 ? 0.10 : 0.05));
      attacker.hp_current = Math.max(1, attacker.hp_current - hpDrain);
      events.push({
        type: 'special',
        actor_id: attacker.player_id,
        actor_name: attacker.player_name,
        action_type: 'cursed_seal',
        build_effects: [
          { type: 'first_crit', label: `⚡ Selo Nv${lvl} ativado! ${lvl === 2 ? '+70%' : '+40%'} ataque`, color: '#f97316' },
          { type: 'burn_damage', label: `💀 Custo do Selo: -${hpDrain} HP`, color: '#ef4444', value: hpDrain },
        ],
        log_text: `${attacker.player_name} ativou o Selo Amaldiçoado Nv${lvl}! (-${hpDrain} HP)`,
      });
      return;
    }

    // ── Ataques ofensivos: tai / nin / gen / summon ─────────────────
    if (!target || !target.is_alive) return;
    attacker.chakra_current = Math.max(0, attacker.chakra_current - cost);

    const attackerFighter = memberToFighter(attacker);
    const targetFighter   = memberToFighter(target);
    const focusBonus = calcFocusBonus(attackCountByTarget[target.player_id] || 1);

    let damage = 0;
    let jutsuUsed: string | undefined;
    let jutsuGif: string | null = null;
    let isCritical = false;
    let buildEffects: any[] = [];

    if (action.action_type === 'summon') {
      attacker.summon_used = true;
      const summonLevel = attacker.summon_level || 1;
      const stats = calculateDynamicStats(attackerFighter, EQUIPMENT_DATA);
      damage = Math.floor(stats.finalNinjutsu * (0.8 + summonLevel * 0.15) * teamBonus * focusBonus);
      jutsuUsed = `Invocação Nv${summonLevel}`;
    } else {
      const attackType = action.action_type as AttackType;
      let preferredElement: Element | undefined;
      let preferredJutsu: string | undefined;
      if (attackType === 'ninjutsu') {
        const picked = pickJutsu(attacker);
        if (picked) { preferredElement = picked.element; preferredJutsu = picked.jutsu; }
      }

      const result = calculateDamage(attackerFighter, targetFighter, attackType, {
        preferredElement, preferredJutsu,
        equipmentData: EQUIPMENT_DATA,
        isBoss: true, // desativa cap interno — aplicamos cap de 60% abaixo
        attackerBuild: attacker.build,
        defenderBuild: target.build,
        attackerState: attacker.battle_state as FighterBattleState,
        defenderState: target.battle_state as FighterBattleState,
        isFirstTurn: currentTurn === 1,
      });

      // Cap PVP: 60% HP do defensor (igual ao pvp-engine)
      const pvpCap = Math.floor(target.hp_max * 0.60);
      damage = Math.min(result.damage + (result.secondHitDamage || 0), pvpCap);
      damage = Math.floor(damage * teamBonus * focusBonus);
      isCritical = result.isCritical;
      buildEffects = result.buildEffects || [];
      jutsuUsed = result.jutsuUsed;
      jutsuGif = jutsuUsed ? (JUTSU_GIFS[jutsuUsed] ?? null) : null;

      // Propagar battleState do defensor via options.defenderState (veneno, queimadura, etc.)
      // O defenderState é mutado dentro de calculateDamage via options.defenderState
      // já está atualizado em target.battle_state pela referência passada
    }

    // Redução por defesa (igual ao pvp-engine: -50%)
    if (target.is_defending && damage > 0) {
      damage = Math.floor(damage * 0.5);
      buildEffects.push({ type: 'barrier_blocked', label: '🛡️ Postura Defensiva! Dano -50%', color: '#22c55e' });
    }

    pendingDamage[target.player_id] = (pendingDamage[target.player_id] || 0) + damage;

    events.push({
      type: 'attack',
      actor_id: attacker.player_id,
      actor_name: attacker.player_name,
      target_id: target.player_id,
      target_name: target.player_name,
      action_type: action.action_type,
      damage,
      jutsu_used: jutsuUsed,
      jutsu_gif: jutsuGif,
      is_critical: isCritical,
      build_effects: buildEffects,
      log_text: `${attacker.player_name} usou ${action.action_type} em ${target.player_name} causando ${damage} de dano.${isCritical ? ' CRÍTICO!' : ''}`,
    });
  });

  // ── Aplicar veneno/queimadura do turno anterior ───────────────────
  state.forEach(m => {
    if (!m.is_alive) return;
    const bs = m.battle_state;
    if (bs.poisonDamage > 0) {
      pendingDamage[m.player_id] = (pendingDamage[m.player_id] || 0) + bs.poisonDamage;
      events.push({
        type: 'attack',
        actor_id: m.player_id,
        actor_name: m.player_name,
        damage: bs.poisonDamage,
        log_text: `${m.player_name} recebeu ${bs.poisonDamage.toFixed(0)} de dano por veneno.`,
      });
      m.battle_state = { ...bs, poisonDamage: 0 };
    }
    if (bs.burnDamage > 0) {
      pendingDamage[m.player_id] = (pendingDamage[m.player_id] || 0) + bs.burnDamage;
      events.push({
        type: 'attack',
        actor_id: m.player_id,
        actor_name: m.player_name,
        damage: bs.burnDamage,
        log_text: `${m.player_name} recebeu ${bs.burnDamage.toFixed(0)} de dano por queimadura.`,
      });
      m.battle_state = { ...bs, burnDamage: 0 };
    }
  });

  // ── Aplicar dano e chakra simultâneos ────────────────────────────
  state.forEach(m => {
    const dmg   = pendingDamage[m.player_id] || 0;
    const chakra = pendingChakra[m.player_id] || 0;

    // Kairai: sobrevive com 1 HP uma vez (igual ao pvp-engine)
    const newHp = Math.max(0, m.hp_current - dmg);
    if (newHp <= 0 && m.is_alive && !m.battle_state.survivedDeathUsed && m.build === 'imortal') {
      m.hp_current = 1;
      m.battle_state = { ...m.battle_state, survivedDeathUsed: true };
      events.push({
        type: 'special',
        actor_id: m.player_id,
        actor_name: m.player_name,
        log_text: `${m.player_name} — Vontade de Ferro (Kairai)! Sobreviveu com 1 HP.`,
      });
    } else {
      m.hp_current = newHp;
    }

    if (chakra > 0) {
      m.chakra_current = Math.min(m.chakra_max, m.chakra_current + chakra);
    }

    const died = m.hp_current <= 0 && m.is_alive;
    if (died) {
      m.is_alive = false;
      events.push({
        type: 'death',
        actor_id: m.player_id,
        actor_name: m.player_name,
        log_text: `☠️ ${m.player_name} foi derrotado!`,
      });
    }

    // Resetar defesa para próximo turno
    m.is_defending = false;
    m.battle_state = { ...m.battle_state, barrierActiveThisTurn: false };
  });

  const teamAAlive = state.filter(m => m.clan_id === clanAId && m.is_alive).length;
  const teamBAlive = state.filter(m => m.clan_id === clanBId && m.is_alive).length;
  const warFinished = teamAAlive === 0 || teamBAlive === 0;
  const winnerClanId = warFinished ? (teamAAlive > 0 ? clanAId : clanBId) : null;

  return {
    updatedMembers: state,
    events,
    teamAAlive,
    teamBAlive,
    warFinished,
    winnerClanId,
  };
}