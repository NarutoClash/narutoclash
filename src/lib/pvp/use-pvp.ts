'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSnapshot, initPVPBattle } from './pvp-engine';
import { PVPBattleRow, PVPChallengeRow, PVPActionType } from './pvp-types';

export function usePVPChallenges(supabase: any, userId: string | undefined) {
  const [challenges, setChallenges] = useState<PVPChallengeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('pvp_challenges')
      .select('*, challenger:profiles!challenger_id(id,name,level,avatar_url,pvp_points,pvp_wins,pvp_losses)')
      .eq('opponent_id', userId).eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setChallenges(data || []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetch();
    const sub = supabase
      ?.channel(`pvp_challenges_incoming_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_challenges', filter: `opponent_id=eq.${userId}` }, fetch)
      .subscribe();
    return () => { sub?.unsubscribe(); };
  }, [fetch, supabase, userId]);

  return { challenges, loading, refresh: fetch };
}

export function usePVPBattles(supabase: any, userId: string | undefined) {
  const [battles, setBattles] = useState<PVPBattleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('pvp_battles')
      .select('*, challenger:profiles!challenger_id(id,name,level,avatar_url,pvp_points), opponent:profiles!opponent_id(id,name,level,avatar_url,pvp_points)')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .in('status', ['waiting', 'active'])
      .order('updated_at', { ascending: false });
    setBattles(data || []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetch();
    const sub = supabase
      ?.channel(`pvp_battles_active_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_battles', filter: `challenger_id=eq.${userId}` }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_battles', filter: `opponent_id=eq.${userId}` }, fetch)
      .subscribe();
    return () => { sub?.unsubscribe(); };
  }, [fetch, supabase, userId]);

  return { battles, loading, refresh: fetch };
}

export function usePVPBattle(supabase: any, battleId: string | undefined) {
  const [battle, setBattle] = useState<PVPBattleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!supabase || !battleId) { setLoading(false); return; }
    try {
      const { data, error: qErr } = await supabase
        .from('pvp_battles')
        .select('*, challenger:profiles!challenger_id(id,name,level,avatar_url,pvp_points,pvp_wins,pvp_losses), opponent:profiles!opponent_id(id,name,level,avatar_url,pvp_points,pvp_wins,pvp_losses)')
        .eq('id', battleId).single();
      if (qErr) { setError(qErr.message); }
      else if (data) {
        if (typeof data.state === 'string') data.state = JSON.parse(data.state);
        setBattle(data);
        setError(null);
      } else {
        setError('Batalha não encontrada');
      }
    } catch (e: any) {
      setError(e?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [supabase, battleId]);

  useEffect(() => {
    fetch();
    const sub = supabase
      ?.channel(`pvp_battle_${battleId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pvp_battles', filter: `id=eq.${battleId}`
      }, () => fetch())
      .subscribe();
    return () => { sub?.unsubscribe(); };
  }, [fetch, supabase, battleId]);

  return { battle, loading, error, refresh: fetch };
}

// Countdown sincronizado com o banco — reinicia automaticamente quando deadline muda
export function useTurnCountdown(deadline: string | null | undefined): number {
  const [seconds, setSeconds] = useState<number>(30);

  useEffect(() => {
    // Sem deadline: parar em 30
    if (!deadline) {
      setSeconds(30);
      return;
    }

    const tick = () => {
      const rem = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000));
      setSeconds(rem);
    };

    // Calcular imediatamente ao mudar o deadline
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]); // deadline como dep: reinicia o interval sempre que banco seta novo deadline

  return seconds;
}

export function usePVPActions(supabase: any, userId: string | undefined) {

  const sendChallenge = async (opponentId: string) => {
    if (!supabase || !userId) return { error: { message: 'Não autenticado' } };
    const { data: existing } = await supabase
      .from('pvp_challenges').select('id')
      .eq('challenger_id', userId).eq('opponent_id', opponentId).eq('status', 'pending')
      .maybeSingle();
    if (existing) return { error: { message: 'Você já enviou um desafio para este jogador' } };
    const { data, error } = await supabase
      .from('pvp_challenges').insert({ challenger_id: userId, opponent_id: opponentId }).select().single();
    return { data, error };
  };

  const acceptChallenge = async (challengeId: string, challengerProfile: any, opponentProfile: any) => {
    if (!supabase || !userId) return { error: { message: 'Não autenticado' } };

    const [{ data: fullChallenger }, { data: fullOpponent }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', challengerProfile.id).single(),
      supabase.from('profiles').select('*').eq('id', opponentProfile.id).single(),
    ]);

    if (!fullChallenger || !fullOpponent) return { error: { message: 'Erro ao carregar perfis' } };

    const battleState = initPVPBattle(createSnapshot(fullChallenger), createSnapshot(fullOpponent));

    const { error: challengeError } = await supabase
      .from('pvp_challenges').update({ status: 'accepted' }).eq('id', challengeId);
    if (challengeError) return { error: challengeError };

    const { data, error } = await supabase.rpc('pvp_create_battle', {
      p_challenger_id: fullChallenger.id,
      p_opponent_id: fullOpponent.id,
      p_state: battleState,
    });
    return { data, error };
  };

  const declineChallenge = async (challengeId: string) => {
    if (!supabase || !userId) return { error: { message: 'Não autenticado' } };
    const { error } = await supabase.from('pvp_challenges').update({ status: 'declined' }).eq('id', challengeId);
    return { error };
  };

  const submitAction = async (battle: PVPBattleRow, action: PVPActionType) => {
    if (!supabase || !userId) return { error: 'Não autenticado' };
    if (battle.status === 'finished') return { error: 'Batalha encerrada' };
    const { data, error } = await supabase.rpc('pvp_submit_action', {
      p_battle_id: battle.id,
      p_user_id: userId,
      p_action: action,
    });
    return { data, error };
  };

  return { sendChallenge, acceptChallenge, declineChallenge, submitAction };
}
// ─────────────────────────────────────────────────────────────────────────────
// HOOK DE MATCHMAKING (FILA AUTOMÁTICA)
// ─────────────────────────────────────────────────────────────────────────────
export type QueueStatus = 'idle' | 'searching' | 'matched' | 'error';

export interface UseMatchmakingReturn {
  status: QueueStatus;
  waitSeconds: number;
  phase: 1 | 2 | 3;
  matchedBattleId: string | null;
  error: string | null;
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
}

export function useMatchmaking(
  supabase: any,
  userId: string | undefined,
  userProfile: any,
): UseMatchmakingReturn {
  const [status,          setStatus]          = React.useState<QueueStatus>('idle');
  const [waitSeconds,     setWaitSeconds]      = React.useState(0);
  const [phase,           setPhase]            = React.useState<1|2|3>(1);
  const [matchedBattleId, setMatchedBattleId]  = React.useState<string | null>(null);
  const [error,           setError]            = React.useState<string | null>(null);

  const startTimeRef = React.useRef<number>(0);
  const pollRef      = React.useRef<NodeJS.Timeout | null>(null);
  const timerRef     = React.useRef<NodeJS.Timeout | null>(null);
  const matchingRef  = React.useRef(false); // evita race condition dupla

  const clear = React.useCallback(() => {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    matchingRef.current = false;
  }, []);

  // Sai da fila no banco
  const removeFromQueue = React.useCallback(async () => {
    if (supabase && userId) {
      await supabase.from('pvp_queue').delete().eq('user_id', userId);
    }
  }, [supabase, userId]);

  const leaveQueue = React.useCallback(async () => {
    clear();
    await removeFromQueue();
    setStatus('idle');
    setWaitSeconds(0);
    setPhase(1);
    setMatchedBattleId(null);
    setError(null);
  }, [clear, removeFromQueue]);

  // Tenta criar batalha com o candidato encontrado
  const createMatchBattle = React.useCallback(async (opponentId: string) => {
    if (!supabase || !userId) return null;

    const [{ data: me }, { data: opp }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('profiles').select('*').eq('id', opponentId).single(),
    ]);
    if (!me || !opp) return null;

    const { initPVPBattle, createSnapshot } = await import('./pvp-engine');
    const battleState = initPVPBattle(createSnapshot(me), createSnapshot(opp));

    const { data, error: battleErr } = await supabase.rpc('pvp_create_battle', {
      p_challenger_id: userId,
      p_opponent_id:   opponentId,
      p_state:         battleState,
    });
    if (battleErr || !data) return null;
    return typeof data === 'string' ? data : data?.id ?? null;
  }, [supabase, userId]);

  // Polling: tenta fazer match
  const tryMatch = React.useCallback(async () => {
    if (!supabase || !userId || !userProfile || matchingRef.current) return;
    matchingRef.current = true;

    try {
      const elapsed     = Date.now() - startTimeRef.current;
      const pvpPoints   = userProfile.pvp_points ?? 1000;
      const rank        = userProfile.rank ?? 'Genin';

      // Fase
      let currentPhase: 1|2|3 = 1;
      let eloRange = 200;
      let strictRank = true;
      if (elapsed >= 120_000) { currentPhase = 3; eloRange = 800; strictRank = false; }
      else if (elapsed >= 60_000) { currentPhase = 2; eloRange = 400; strictRank = false; }
      setPhase(currentPhase);

      // Busca candidatos na fila (exclui a si mesmo)
      let query = supabase
        .from('pvp_queue')
        .select('user_id, pvp_points, rank')
        .neq('user_id', userId)
        .gte('pvp_points', pvpPoints - eloRange)
        .lte('pvp_points', pvpPoints + eloRange)
        .order('joined_at', { ascending: true })
        .limit(5);

      if (strictRank) query = query.eq('rank', rank);

      const { data: candidates } = await query;
      if (!candidates || candidates.length === 0) {
        matchingRef.current = false;
        return;
      }

      const opponent = candidates[0];

      // Verifica se oponente ainda está na fila (anti race-condition)
      const { data: still } = await supabase
        .from('pvp_queue').select('user_id').eq('user_id', opponent.user_id).maybeSingle();
      if (!still) { matchingRef.current = false; return; }

      // Cria a batalha
      const battleId = await createMatchBattle(opponent.user_id);
      if (!battleId) { matchingRef.current = false; return; }

      // Remove ambos da fila
      await supabase.from('pvp_queue').delete().in('user_id', [userId, opponent.user_id]);

      clear();
      setMatchedBattleId(battleId);
      setStatus('matched');
    } finally {
      matchingRef.current = false;
    }
  }, [supabase, userId, userProfile, createMatchBattle, clear]);

  const joinQueue = React.useCallback(async () => {
    if (!supabase || !userId || !userProfile) return;

    const pvpPoints = userProfile.pvp_points ?? 1000;
    const rank      = userProfile.rank ?? 'Genin';

    const { error: upsertErr } = await supabase.from('pvp_queue').upsert({
      user_id:     userId,
      pvp_points:  pvpPoints,
      rank,
      joined_at:   new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (upsertErr) {
      setError(upsertErr.message);
      setStatus('error');
      return;
    }

    startTimeRef.current = Date.now();
    setStatus('searching');
    setWaitSeconds(0);
    setPhase(1);
    setError(null);
  }, [supabase, userId, userProfile]);

  // Inicia polling quando searching
  React.useEffect(() => {
    if (status !== 'searching') return;

    tryMatch(); // tenta imediatamente
    pollRef.current  = setInterval(tryMatch, 3000);
    timerRef.current = setInterval(() => {
      setWaitSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return clear;
  }, [status, tryMatch, clear]);

  // Realtime: detecta se fui matchado pelo outro lado (como opponent)
  React.useEffect(() => {
    if (!supabase || !userId || status !== 'searching') return;

    const channel = supabase
      .channel(`mm_incoming_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pvp_battles',
        filter: `opponent_id=eq.${userId}`,
      }, async (payload: any) => {
        const battleId = payload.new?.id;
        if (!battleId) return;
        await removeFromQueue();
        clear();
        setMatchedBattleId(battleId);
        setStatus('matched');
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [supabase, userId, status, clear, removeFromQueue]);

  // Cleanup ao desmontar
  React.useEffect(() => {
    return () => {
      clear();
      if (status === 'searching') removeFromQueue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, waitSeconds, phase, matchedBattleId, error, joinQueue, leaveQueue };
}