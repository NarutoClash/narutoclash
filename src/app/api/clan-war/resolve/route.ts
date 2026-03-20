/**
 * POST /api/clan-war/resolve
 * Resolve turno + sistema de pontuação completo:
 *  - Pontos por abate (+1 por kill no clã)
 *  - Pontos por sobrevivente ao fim da guerra (+1 por membro vivo)
 *  - Pontos por dano acumulado (mesmo perdendo)
 *  - Bônus de vitória (+5 vencer, -2 perder, mínimo 0)
 *  - Liga semanal e mensal separadas
 *  - Streak de vitórias (bônus +1 a cada 3 seguidas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveTurn } from '@/lib/clan-war/clan-war-engine';
import { TURN_DURATION_SECONDS } from '@/lib/clan-war/clan-war-types';

// ── Tabela de pontos ────────────────────────────────────────────────────
const PTS = {
  WIN:          5,   // vencer a guerra
  LOSE:        -5,   // perder
  SURVIVOR:     1,   // +1 por aliado vivo ao fim (vencedor)
  NO_KILL:     -1,   // nenhum inimigo eliminado (perdedor)
  MVP_DMG:      1,   // jogador com mais dano total (todos)
  WORST_DMG:   -1,   // jogador com menos dano total (todos)
  DISCONNECT:  -1,   // por cada membro desconectado por inatividade
} as const;

// ── Helpers ─────────────────────────────────────────────────────────────
function getWeekKey(date: Date): string {
  // ISO week: "2025-W23"
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function upsertLeaguePoints(
  supabase: any,
  clanId: string,
  clanName: string,
  points: number,
  periodType: 'weekly' | 'monthly',
  periodKey: string,
  isWinner: boolean,
) {
  const { data: existing } = await supabase
    .from('clan_league_points')
    .select('id, points, wars_played, wars_won')
    .eq('clan_id', clanId)
    .eq('period_type', periodType)
    .eq('period_key', periodKey)
    .single();

  if (existing) {
    await supabase
      .from('clan_league_points')
      .update({
        points: Math.max(0, existing.points + points),
        wars_played: existing.wars_played + 1,
        wars_won: existing.wars_won + (isWinner ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('clan_league_points').insert({
      clan_id: clanId,
      clan_name: clanName,
      period_type: periodType,
      period_key: periodKey,
      points: Math.max(0, points),
      wars_played: 1,
      wars_won: isWinner ? 1 : 0,
    });
  }
}

// ── Route Handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Validar internal secret para evitar chamadas externas não autorizadas
    const internalSecret = process.env.CLAN_WAR_INTERNAL_SECRET;
    if (internalSecret) {
      const providedSecret = req.headers.get('x-internal-secret');
      if (providedSecret !== internalSecret) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    const { war_id, turn } = await req.json();
    if (!war_id || !turn) {
      return NextResponse.json({ error: 'war_id e turn são obrigatórios' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Verificar fase 'resolving' — proteção duplo disparo
    const { data: war, error: warErr } = await supabase
      .from('clan_wars')
      .select('*')
      .eq('id', war_id)
      .eq('current_turn', turn)
      .eq('current_phase', 'resolving')
      .single();

    if (warErr || !war) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // 2. Membros
    const { data: members, error: membersErr } = await supabase
      .from('clan_war_members').select('*').eq('war_id', war_id);
    if (membersErr || !members) {
      return NextResponse.json({ error: 'Membros não encontrados' }, { status: 500 });
    }

    // 3. Ações do turno
    const { data: actions } = await supabase
      .from('clan_war_actions').select('*').eq('war_id', war_id).eq('turn', turn);

    // 4. Desconectados → hp=0
    const membersWithDisconnect = members.map((m: any) =>
      m.disconnected && m.is_alive ? { ...m, hp_current: 0, is_alive: false } : m
    );

    // 5. Resolver turno
    const result = resolveTurn(
      membersWithDisconnect,
      actions || [],
      war.clan_a_id,
      war.clan_b_id,
      turn,
    );

    // 6. Persistir membros
    for (const m of result.updatedMembers) {
      await supabase.from('clan_war_members').update({
        hp_current: m.hp_current,
        chakra_current: m.chakra_current,
        is_alive: m.is_alive,
        is_defending: m.is_defending,
        battle_state: m.battle_state,
        doujutsu_used: m.doujutsu_used,
        cursed_seal_used: m.cursed_seal_used,
        summon_used: m.summon_used,
        cooldowns: m.cooldowns,
        doujutsu: m.doujutsu,
        cursed_seal: m.cursed_seal,
        inactive_turns: m.inactive_turns || 0,
        disconnected: m.disconnected || false,
      }).eq('war_id', war_id).eq('player_id', m.player_id);
    }

    // 7. Log do turno — inclui kills por clã neste turno
    const killsThisTurn: Record<string, number> = {};
    result.events
      .filter(e => e.type === 'death' && e.actor_id)
      .forEach(e => {
        // quem matou = atacante do mesmo clã que causou o dano mortal
        // obtemos pelo evento attack anterior ao death
        const killer = result.events.find(
          ev => ev.type === 'attack' && ev.target_id === e.actor_id && ev.damage && ev.damage > 0
        );
        if (killer?.actor_id) {
          const killerMember = result.updatedMembers.find(m => m.player_id === killer.actor_id);
          if (killerMember) {
            killsThisTurn[killerMember.clan_id] = (killsThisTurn[killerMember.clan_id] || 0) + 1;
          }
        }
      });

    await supabase.from('clan_war_turn_logs').insert({
      war_id,
      turn,
      events: result.events,
      team_a_alive: result.teamAAlive,
      team_b_alive: result.teamBAlive,
    });

    // ── Acumular kills totais na guerra (coluna kills_a / kills_b) ────────
    await supabase.from('clan_wars').update({
      kills_a: (war.kills_a || 0) + (killsThisTurn[war.clan_a_id] || 0),
      kills_b: (war.kills_b || 0) + (killsThisTurn[war.clan_b_id] || 0),
      total_damage_a: (war.total_damage_a || 0) + result.events
        .filter(e => e.type === 'attack' && result.updatedMembers.find(m => m.player_id === e.actor_id)?.clan_id === war.clan_a_id)
        .reduce((sum, e) => sum + (e.damage || 0), 0),
      total_damage_b: (war.total_damage_b || 0) + result.events
        .filter(e => e.type === 'attack' && result.updatedMembers.find(m => m.player_id === e.actor_id)?.clan_id === war.clan_b_id)
        .reduce((sum, e) => sum + (e.damage || 0), 0),
    }).eq('id', war_id);

    // 8. Guerra terminou → calcular pontuação completa
    if (result.warFinished) {
      // Ler guerra atualizada (kills e dano acumulados)
      const { data: warFinal } = await supabase
        .from('clan_wars').select('*').eq('id', war_id).single();

      const winnerClanId = result.winnerClanId;
      const loserClanId  = winnerClanId === war.clan_a_id ? war.clan_b_id : war.clan_a_id;
      const isA = (id: string) => id === war.clan_a_id;

      // ── Calcular dano por jogador (para MVP/Worst) ───────────────────
      const dmgByPlayer: Record<string, number> = {};
      for (const log of await supabase.from('clan_war_turn_logs').select('events').eq('war_id', war_id).then((r: any) => r.data || [])) {
        for (const ev of (log.events || [])) {
          if (ev.type === 'attack' && ev.actor_id && ev.damage) {
            dmgByPlayer[ev.actor_id] = Math.round((dmgByPlayer[ev.actor_id] || 0) + ev.damage);
          }
        }
      }
      const allPlayers = result.updatedMembers.map(m => m.player_id);
      const sortedByDmg = [...allPlayers].sort((a, b) => (dmgByPlayer[b] || 0) - (dmgByPlayer[a] || 0));
      const mvpPlayerId   = sortedByDmg[0] || null;
      const worstPlayerId = sortedByDmg[sortedByDmg.length - 1] || null;

      // ── Calcular pontos de cada clã ──────────────────────────────────
      const calcPoints = (clanId: string, isWinner: boolean) => {
        let pts = 0;
        pts += isWinner ? PTS.WIN : PTS.LOSE;

        if (isWinner) {
          const survivors = result.updatedMembers.filter(m => m.clan_id === clanId && m.is_alive).length;
          // +1 apenas se 2 ou mais aliados sobreviveram
          if (survivors >= 2) pts += PTS.SURVIVOR;
        } else {
          // -1 se nenhum inimigo foi eliminado
          const enemyKills = isA(clanId) ? (warFinal?.kills_a || 0) : (warFinal?.kills_b || 0);
          if (enemyKills === 0) pts += PTS.NO_KILL;
        }

        return pts;
      };

      const winnerPts = winnerClanId ? calcPoints(winnerClanId, true)  : 0;
      const loserPts  = loserClanId  ? calcPoints(loserClanId,  false) : 0;

      const now      = new Date();
      const weekKey  = getWeekKey(now);
      const monthKey = getMonthKey(now);

      // ── Buscar dados atuais dos clãs (streak, war_points) ────────────
      const [{ data: winnerClan }, { data: loserClan }] = await Promise.all([
        winnerClanId ? supabase.from('clans').select('war_points, win_streak, name').eq('id', winnerClanId).single() : { data: null },
        loserClanId  ? supabase.from('clans').select('war_points, win_streak, name').eq('id', loserClanId).single()  : { data: null },
      ]);

      // ── Streak do vencedor ───────────────────────────────────────────
      let winnerStreakBonus = 0;
      const winnerPtsBefore = winnerClan?.war_points || 0;
      const loserPtsBefore  = loserClan?.war_points  || 0;

      if (winnerClan && winnerClanId) {
        const newStreak = (winnerClan.win_streak || 0) + 1;
        await supabase.from('clans').update({
          war_points: Math.max(0, winnerPtsBefore + winnerPts + winnerStreakBonus),
          win_streak: newStreak,
        }).eq('id', winnerClanId);
        await upsertLeaguePoints(supabase, winnerClanId, winnerClan.name, winnerPts + winnerStreakBonus, 'weekly',  weekKey, true);
        await upsertLeaguePoints(supabase, winnerClanId, winnerClan.name, winnerPts + winnerStreakBonus, 'monthly', monthKey, true);
      }

      if (loserClan && loserClanId) {
        await supabase.from('clans').update({
          war_points: Math.max(0, loserPtsBefore + loserPts),
          win_streak: 0,
        }).eq('id', loserClanId);
        await upsertLeaguePoints(supabase, loserClanId, loserClan.name, loserPts, 'weekly',  weekKey, false);
        await upsertLeaguePoints(supabase, loserClanId, loserClan.name, loserPts, 'monthly', monthKey, false);
      }

      // ── Pontos MVP/Worst vão para o clã do jogador ───────────────────
      const playerPointsReport: Record<string, { name: string; bonus: number; clan_id: string }> = {};
      if (mvpPlayerId && worstPlayerId && mvpPlayerId !== worstPlayerId) {
        const mvpMember   = result.updatedMembers.find(m => m.player_id === mvpPlayerId);
        const worstMember = result.updatedMembers.find(m => m.player_id === worstPlayerId);
        if (mvpMember)   playerPointsReport[mvpPlayerId]   = { name: mvpMember.player_name,   bonus: PTS.MVP_DMG,   clan_id: mvpMember.clan_id };
        if (worstMember) playerPointsReport[worstPlayerId] = { name: worstMember.player_name, bonus: PTS.WORST_DMG, clan_id: worstMember.clan_id };

        // Aplicar no clã do MVP
        if (mvpMember) {
          const isWinnerClan = mvpMember.clan_id === winnerClanId;
          const clanData = isWinnerClan ? winnerClan : loserClan;
          const currentPts = isWinnerClan
            ? Math.max(0, (winnerPtsBefore) + winnerPts + winnerStreakBonus)
            : Math.max(0, (loserPtsBefore) + loserPts);
          await supabase.from('clans').update({
            war_points: Math.max(0, currentPts + PTS.MVP_DMG),
          }).eq('id', mvpMember.clan_id);
        }

        // Aplicar no clã do Worst
        if (worstMember) {
          const isWinnerClan = worstMember.clan_id === winnerClanId;
          const currentPts = isWinnerClan
            ? Math.max(0, (winnerPtsBefore) + winnerPts + winnerStreakBonus)
            : Math.max(0, (loserPtsBefore) + loserPts);
          await supabase.from('clans').update({
            war_points: Math.max(0, currentPts + PTS.WORST_DMG),
          }).eq('id', worstMember.clan_id);
        }
      }

      // ── Relatório de pontos para o frontend ──────────────────────────
      // Calcular bônus/penalidade MVP/Worst por clã
      const mvpClanBonus: Record<string, number> = {};
      for (const [pid, info] of Object.entries(playerPointsReport)) {
        mvpClanBonus[info.clan_id] = (mvpClanBonus[info.clan_id] || 0) + info.bonus;
      }
      const winnerMvpBonus = mvpClanBonus[winnerClanId || ''] || 0;
      const loserMvpBonus  = mvpClanBonus[loserClanId  || ''] || 0;

      const pointsReport = {
        winner: {
          clan_id: winnerClanId,
          clan_name: winnerClan?.name,
          pts_before: winnerPtsBefore,
          pts_earned: winnerPts + winnerStreakBonus + winnerMvpBonus,
          pts_after: Math.max(0, winnerPtsBefore + winnerPts + winnerStreakBonus + winnerMvpBonus),
          breakdown: {
            base: PTS.WIN,
            survivors: winnerPts - PTS.WIN > 0 ? 1 : 0,
            streak: winnerStreakBonus,
            mvp_bonus: winnerMvpBonus,
            disconnects: result.updatedMembers.filter(m => m.clan_id === winnerClanId && m.disconnected).length,
          },
        },
        loser: {
          clan_id: loserClanId,
          clan_name: loserClan?.name,
          pts_before: loserPtsBefore,
          pts_earned: loserPts + loserMvpBonus,
          pts_after: Math.max(0, loserPtsBefore + loserPts + loserMvpBonus),
          breakdown: {
            base: PTS.LOSE,
            no_kill: loserPts - PTS.LOSE,
            mvp_bonus: loserMvpBonus,
            disconnects: result.updatedMembers.filter(m => m.clan_id === loserClanId && m.disconnected).length,
          },
        },
        players: playerPointsReport,
        mvp_player_id: mvpPlayerId,
        worst_player_id: worstPlayerId,
        dmg_by_player: dmgByPlayer,
      };

      // ── Salvar HP persistente de cada jogador após a guerra ─────────
      for (const m of result.updatedMembers) {
        const hpToSave = m.is_alive ? Math.max(1, m.hp_current) : 1;
        await supabase.from('profiles')
          .update({ current_health: hpToSave })
          .eq('id', m.player_id);
      }

      // ── Finalizar guerra e liberar sala ──────────────────────────────
      await supabase.from('clan_wars').update({
        status: 'finished',
        current_phase: 'result',
        winner_clan_id: winnerClanId,
        finished_at: now.toISOString(),
        winner_pts: winnerPts + winnerStreakBonus,
        loser_pts: loserPts,
        points_report: pointsReport,
      }).eq('id', war_id);

      const { data: roomData } = await supabase.from('war_rooms').select('id').eq('war_id', war_id).single();
      if (roomData) {
        await supabase.from('war_spectators').delete().eq('room_id', roomData.id);
      }
      await supabase.from('war_rooms').update({
        status: 'available',
        war_id: null,
        clan_a_id: null, clan_a_name: null,
        clan_b_id: null, clan_b_name: null,
        opened_by: null, expires_at: null,
      }).eq('war_id', war_id);

      // Broadcast
      // Sem broadcast — clientes usam polling

    } else {
      // ── Próximo turno ────────────────────────────────────────────────
      const nextTurn    = turn + 1;
      const nextPhaseEnd = new Date(Date.now() + TURN_DURATION_SECONDS * 1000).toISOString();

      await supabase.from('clan_wars').update({
        current_turn: nextTurn,
        current_phase: 'submit',
        phase_ends_at: nextPhaseEnd,
        team_a_bonus: result.teamAAlive,
        team_b_bonus: result.teamBAlive,
      }).eq('id', war_id);

      // Sem broadcast — clientes usam polling
    }

    return NextResponse.json({ ok: true, events: result.events.length });
  } catch (err: any) {
    console.error('[clan-war/resolve]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}