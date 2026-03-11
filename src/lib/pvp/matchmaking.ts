'use client';

/**
 * Sistema de Matchmaking por Elo + Rank
 * ──────────────────────────────────────────────────────────────────────────
 * Funcionamento:
 *  1. Jogador entra na fila (pvp_queue table no Supabase)
 *  2. Sistema procura oponente com ≤200 pts Elo E mesmo rank geral
 *  3. Após 60s sem match: range de Elo expande para ≤400 pts, qualquer rank
 *  4. Após 120s: range expande para ≤800 pts (busca ampla)
 *  5. Ao encontrar match: cria batalha e remove ambos da fila
 * ──────────────────────────────────────────────────────────────────────────
 * SQL necessário (rodar no Supabase):
 *
 *   CREATE TABLE IF NOT EXISTS pvp_queue (
 *     id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id        uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
 *     pvp_points     int  NOT NULL DEFAULT 1000,
 *     rank           text NOT NULL DEFAULT 'Genin',
 *     joined_at      timestamptz NOT NULL DEFAULT now(),
 *     expanded_at    timestamptz,      -- quando o range começou a expandir
 *     expanded_2x    boolean DEFAULT false -- segunda expansão
 *   );
 *
 *   CREATE INDEX IF NOT EXISTS pvp_queue_points_idx ON pvp_queue(pvp_points);
 *   ALTER TABLE pvp_queue ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can manage own queue entry"
 *     ON pvp_queue FOR ALL USING (auth.uid() = user_id);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateRank } from '@/lib/rank-calculator';

// ── Configuração do matchmaking ────────────────────────────────────────────
export const MATCHMAKING_CONFIG = {
  /** Intervalo de polling da fila (ms) */
  POLL_INTERVAL_MS: 3000,
  /** Fase 1: range Elo ≤ 200 pts, mesmo rank → dura 60s */
  PHASE1_ELO_RANGE: 200,
  PHASE1_DURATION_MS: 60_000,
  /** Fase 2: range Elo ≤ 400 pts, qualquer rank → dura mais 60s */
  PHASE2_ELO_RANGE: 400,
  PHASE2_DURATION_MS: 60_000,
  /** Fase 3 (120s+): range Elo ≤ 800 pts, qualquer rank */
  PHASE3_ELO_RANGE: 800,
} as const;

export type QueueStatus = 'idle' | 'searching' | 'matched' | 'error';
export type MatchPhase = 1 | 2 | 3;

export interface QueueEntry {
  id: string;
  user_id: string;
  pvp_points: number;
  rank: string;
  joined_at: string;
  expanded_at: string | null;
  expanded_2x: boolean;
}

export interface MatchmakingState {
  status: QueueStatus;
  phase: MatchPhase;
  waitSeconds: number;
  matchedBattleId: string | null;
  error: string | null;
}

// ── Hook principal ─────────────────────────────────────────────────────────
export function useMatchmaking(
  supabase: any,
  userId: string | undefined,
  userProfile: {
    pvp_points?: number;
    level?: number;
  } | null
) {
  const [state, setState] = useState<MatchmakingState>({
    status: 'idle',
    phase: 1,
    waitSeconds: 0,
    matchedBattleId: null,
    error: null,
  });

  const timerRef     = useRef<NodeJS.Timeout | null>(null);
  const pollRef      = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current)  clearInterval(timerRef.current);
    if (pollRef.current)   clearInterval(pollRef.current);
  }, []);

  // ── Entra na fila ─────────────────────────────────────────────────────
  const joinQueue = useCallback(async () => {
    if (!supabase || !userId || !userProfile) return;

    const pvpPoints = userProfile.pvp_points ?? 1000;
    const rank      = calculateRank(userProfile.level ?? 1);

    // Upsert na fila
    const { error } = await supabase.from('pvp_queue').upsert({
      user_id:    userId,
      pvp_points: pvpPoints,
      rank,
      joined_at:  new Date().toISOString(),
      expanded_at: null,
      expanded_2x: false,
    }, { onConflict: 'user_id' });

    if (error) {
      setState(s => ({ ...s, status: 'error', error: error.message }));
      return;
    }

    startTimeRef.current = Date.now();
    setState({
      status: 'searching',
      phase: 1,
      waitSeconds: 0,
      matchedBattleId: null,
      error: null,
    });
  }, [supabase, userId, userProfile]);

  // ── Sai da fila ───────────────────────────────────────────────────────
  const leaveQueue = useCallback(async () => {
    clearTimers();
    if (!supabase || !userId) return;
    await supabase.from('pvp_queue').delete().eq('user_id', userId);
    setState({ status: 'idle', phase: 1, waitSeconds: 0, matchedBattleId: null, error: null });
  }, [supabase, userId, clearTimers]);

  // ── Tenta fazer match ─────────────────────────────────────────────────
  const tryMatch = useCallback(async () => {
    if (!supabase || !userId) return;

    const elapsed = Date.now() - startTimeRef.current;
    const pvpPoints = userProfile?.pvp_points ?? 1000;

    // Determina fase e range
    let phase: MatchPhase = 1;
    let eloRange = MATCHMAKING_CONFIG.PHASE1_ELO_RANGE;
    let sameRankOnly = true;

    if (elapsed >= MATCHMAKING_CONFIG.PHASE1_DURATION_MS + MATCHMAKING_CONFIG.PHASE2_DURATION_MS) {
      phase = 3;
      eloRange = MATCHMAKING_CONFIG.PHASE3_ELO_RANGE;
      sameRankOnly = false;
    } else if (elapsed >= MATCHMAKING_CONFIG.PHASE1_DURATION_MS) {
      phase = 2;
      eloRange = MATCHMAKING_CONFIG.PHASE2_ELO_RANGE;
      sameRankOnly = false;
    }

    // Atualiza fase na UI
    setState(s => ({
      ...s,
      phase,
      waitSeconds: Math.floor(elapsed / 1000),
    }));

    // Expande range no DB se necessário
    if (phase === 2) {
      await supabase.from('pvp_queue')
        .update({ expanded_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('expanded_at', null);
    }
    if (phase === 3) {
      await supabase.from('pvp_queue')
        .update({ expanded_2x: true })
        .eq('user_id', userId);
    }

    // Busca candidatos na fila
    let query = supabase
      .from('pvp_queue')
      .select('*')
      .neq('user_id', userId)
      .gte('pvp_points', pvpPoints - eloRange)
      .lte('pvp_points', pvpPoints + eloRange)
      .order('joined_at', { ascending: true })
      .limit(5);

    if (sameRankOnly) {
      const myRank = calculateRank(userProfile?.level ?? 1);
      query = query.eq('rank', myRank);
    }

    const { data: candidates, error } = await query;

    if (error || !candidates || candidates.length === 0) return;

    // Pega o candidato com maior tempo na fila (primeiro da lista ordenada)
    const opponent = candidates[0] as QueueEntry;

    // Tenta criar a batalha de forma atômica usando RPC ou insert direto
    // Verifica se oponente ainda está na fila (evita race condition)
    const { data: opponentCheck } = await supabase
      .from('pvp_queue')
      .select('user_id')
      .eq('user_id', opponent.user_id)
      .single();

    if (!opponentCheck) return; // oponente saiu da fila

    // Chama a função que cria a batalha PvP
    // (reutiliza a lógica existente do use-pvp / pvp-engine)
    const { data: newBattle, error: battleErr } = await supabase
      .from('pvp_battles')
      .insert({
        challenger_id: userId,
        opponent_id:   opponent.user_id,
        status:        'waiting',
        current_turn_user_id: userId,
        turn_number:   1,
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      })
      .select('id')
      .single();

    if (battleErr || !newBattle) return;

    // Remove ambos da fila
    await supabase.from('pvp_queue')
      .delete()
      .in('user_id', [userId, opponent.user_id]);

    clearTimers();
    setState(s => ({
      ...s,
      status: 'matched',
      matchedBattleId: newBattle.id,
    }));
  }, [supabase, userId, userProfile, clearTimers]);

  // ── Efeito: inicia polling quando status = 'searching' ────────────────
  useEffect(() => {
    if (state.status !== 'searching') return;

    // Tenta match imediatamente
    tryMatch();

    // Polling
    pollRef.current = setInterval(tryMatch, MATCHMAKING_CONFIG.POLL_INTERVAL_MS);

    // Contador de espera
    timerRef.current = setInterval(() => {
      setState(s => ({
        ...s,
        waitSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    return clearTimers;
  }, [state.status, tryMatch, clearTimers]);

  // ── Subscrição realtime: detecta batalha criada para mim ─────────────
  useEffect(() => {
    if (!supabase || !userId || state.status !== 'searching') return;

    const channel = supabase
      .channel(`matchmaking_${userId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'pvp_battles',
        filter: `opponent_id=eq.${userId}`,
      }, async (payload: any) => {
        // Fui desafiado como oponente pelo matchmaking
        const battleId = payload.new?.id;
        if (!battleId) return;

        await supabase.from('pvp_queue').delete().eq('user_id', userId);
        clearTimers();
        setState(s => ({
          ...s,
          status: 'matched',
          matchedBattleId: battleId,
        }));
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [supabase, userId, state.status, clearTimers]);

  // ── Cleanup ao desmontar ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimers();
      // Sai da fila silenciosamente ao desmontar
      if (supabase && userId && state.status === 'searching') {
        supabase.from('pvp_queue').delete().eq('user_id', userId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    joinQueue,
    leaveQueue,
  };
}

// ── Utilitário: label da fase de matchmaking ───────────────────────────────
export function getMatchmakingPhaseLabel(phase: MatchPhase, waitSeconds: number): string {
  if (phase === 1) return `Procurando oponente de nível similar... (${waitSeconds}s)`;
  if (phase === 2) return `Expandindo busca — rank flexível... (${waitSeconds}s)`;
  return `Busca ampla em andamento... (${waitSeconds}s)`;
}

export function getMatchmakingPhaseDescription(phase: MatchPhase): string {
  if (phase === 1) return `±200 pts Elo • Mesmo rank`;
  if (phase === 2) return `±400 pts Elo • Qualquer rank`;
  return `±800 pts Elo • Qualquer rank`;
}
