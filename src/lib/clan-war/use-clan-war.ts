'use client';

/**
 * Hooks de Guerra de Clãs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WarRoom, ClanWar, ClanWarMember, ClanWarAction, ClanWarInvite, ClanWarTurnLog, WarActionType, TURN_DURATION_SECONDS } from './clan-war-types';

export function useWarRooms(supabase: any) {
  const [rooms, setRooms] = useState<WarRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('war_rooms').select('*').order('id');
    if (data) {
      // Buscar contagem real de espectadores por sala
      const { data: specData } = await supabase
        .from('war_spectators')
        .select('room_id');
      const specCount: Record<number, number> = {};
      for (const s of specData || []) {
        specCount[s.room_id] = (specCount[s.room_id] || 0) + 1;
      }
      setRooms(data.map((r: any) => ({ ...r, spectator_count: specCount[r.id] || 0 })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRooms();
    const sub = supabase
      ?.channel('war_rooms_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'war_rooms' }, fetchRooms)
      .subscribe();
    const interval = setInterval(fetchRooms, 5000);
    return () => { sub?.unsubscribe(); clearInterval(interval); };
  }, [fetchRooms, supabase]);

  return { rooms, loading, refresh: fetchRooms };
}

export function useWarLobby(supabase: any, roomId: number | null, warId: string | null) {
  const [war, setWar]         = useState<ClanWar | null>(null);
  const [members, setMembers] = useState<ClanWarMember[]>([]);
  const [invites, setInvites] = useState<ClanWarInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase || !roomId) return;
    const { data: roomData } = await supabase.from('war_rooms').select('*').eq('id', roomId).single();
    if (roomData?.war_id) {
      const { data: warData } = await supabase.from('clan_wars').select('*').eq('id', roomData.war_id).single();
      setWar(warData);
      const { data: membersData } = await supabase.from('clan_war_members').select('*').eq('war_id', roomData.war_id).order('clan_id').order('slot');
      setMembers(membersData || []);
      const { data: invitesData } = await supabase.from('clan_war_invites').select('*').eq('room_id', roomId).eq('war_id', roomData.war_id);
      setInvites(invitesData || []);
    } else {
      setWar(null); setMembers([]); setInvites([]);
    }
    setLoading(false);
  }, [supabase, roomId]);

  useEffect(() => {
    if (!roomId) return;
    fetchAll();
    const sub = supabase
      ?.channel(`war_lobby_${roomId}`)
      .on('broadcast', { event: 'lobby_update' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_war_members', filter: `war_id=eq.${warId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_war_invites', filter: `room_id=eq.${roomId}` }, fetchAll)
      .subscribe();
    const interval = setInterval(fetchAll, 3000);
    return () => { sub?.unsubscribe(); clearInterval(interval); };
  }, [fetchAll, supabase, roomId, warId]);

  return { war, members, invites, loading, refresh: fetchAll };
}

export function useMyWarInvites(supabase: any, userId: string | undefined) {
  const [invites, setInvites] = useState<ClanWarInvite[]>([]);

  const fetchInvites = useCallback(async () => {
    if (!supabase || !userId) return;
    const { data } = await supabase.from('clan_war_invites').select('*').eq('player_id', userId).eq('status', 'pending');
    setInvites(data || []);
  }, [supabase, userId]);

  useEffect(() => {
    fetchInvites();
    const interval = setInterval(fetchInvites, 5000);
    return () => clearInterval(interval);
  }, [fetchInvites]);

  return { invites, refresh: fetchInvites };
}

export function useActiveClanWar(supabase: any, warId: string | null) {
  const [war, setWar]               = useState<ClanWar | null>(null);
  const [members, setMembers]       = useState<ClanWarMember[]>([]);
  const [lastLog, setLastLog]       = useState<ClanWarTurnLog | null>(null);
  const [turnLogs, setTurnLogs]     = useState<ClanWarTurnLog[]>([]);
  const [myAction, setMyAction]     = useState<ClanWarAction | null>(null);
  const [phase, setPhase]           = useState<'submit' | 'resolving' | 'result'>('submit');
  const [submittedCount, setSubmittedCount] = useState(0);
  const [currentActions, setCurrentActions] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  const timerRef        = useRef<NodeJS.Timeout | null>(null);
  const isResolvingRef  = useRef(false);
  const lastTurnRef     = useRef(0);

  // ── Fetch completo do estado do banco ──────────────────────────────
  const fetchState = useCallback(async () => {
    if (!supabase || !warId) return;

    const { data: warData } = await supabase.from('clan_wars').select('*').eq('id', warId).single();
    if (!warData) return;

    const { data: membersData } = await supabase.from('clan_war_members').select('*').eq('war_id', warId);
    setMembers(membersData || []);

    const { data: actionsData, count } = await supabase
      .from('clan_war_actions')
      .select('*', { count: 'exact' })
      .eq('war_id', warId)
      .eq('turn', warData.current_turn);
    setSubmittedCount(count || 0);
    setCurrentActions(actionsData || []);

    const { data: logsData } = await supabase
      .from('clan_war_turn_logs').select('*').eq('war_id', warId).order('turn', { ascending: true });
    if (logsData?.length) {
      setTurnLogs(logsData);
      setLastLog(logsData[logsData.length - 1]);
    }

    // Se mudou de turno, limpar myAction e liberar o lock de resolução
    if (warData.current_turn !== lastTurnRef.current) {
      lastTurnRef.current = warData.current_turn;
      setMyAction(null);
      isResolvingRef.current = false;
    }

    const bankPhase: 'submit' | 'resolving' | 'result' =
      warData.status === 'finished' ? 'result' :
      (warData.current_phase as any) || 'submit';

    // Se o banco voltou para submit mas ainda estamos em resolving localmente,
    // liberar o lock e atualizar
    if (bankPhase === 'submit' && isResolvingRef.current) {
      isResolvingRef.current = false;
    }

    setWar(warData);
    setPhase(bankPhase);
    setLoading(false);
  }, [supabase, warId]);

  // ── Chamar API de resolução ────────────────────────────────────────
  const callResolveAPI = useCallback(async (warIdParam: string, turn: number) => {
    if (isResolvingRef.current) return;
    isResolvingRef.current = true;
    setPhase('resolving');

    // UPDATE condicional — só 1 cliente passa
    const { error } = await supabase
      .from('clan_wars')
      .update({ current_phase: 'resolving' })
      .eq('id', warIdParam)
      .eq('current_turn', turn)
      .eq('current_phase', 'submit');

    if (!error) {
      // Este cliente resolveu — chamar a API
      try {
        await fetch('/api/clan-war/resolve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.NEXT_PUBLIC_CLAN_WAR_INTERNAL_SECRET || '',
          },
          body: JSON.stringify({ war_id: warIdParam, turn }),
        });
      } catch (e) {
        console.error('[war] resolve API error:', e);
      }
      // Aguardar banco atualizar e buscar novo estado
      setTimeout(() => fetchState(), 600);
    } else {
      // Outro cliente já resolveu — apenas aguardar
      isResolvingRef.current = false;
      setPhase('resolving'); // mantém UI correta enquanto espera
    }
  }, [supabase, fetchState]);

  // ── Setup polling apenas (sem Realtime) ───────────────────────────
  useEffect(() => {
    if (!warId) return;
    fetchState();

    // Polling a cada 3s — único mecanismo de atualização
    const interval = setInterval(fetchState, 3000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchState, warId]);

  // ── Agendar resolve pelo timer do turno ───────────────────────────
  useEffect(() => {
    if (!war || war.status !== 'active' || war.current_phase !== 'submit') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!war.phase_ends_at) return;
    const ms = Math.max(0, new Date(war.phase_ends_at).getTime() - Date.now());
    timerRef.current = setTimeout(() => callResolveAPI(war.id, war.current_turn), ms);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [war?.id, war?.current_turn, war?.current_phase, war?.phase_ends_at, callResolveAPI]);

  // ── Resolver imediatamente quando todos submeteram ────────────────
  useEffect(() => {
    if (!war || war.status !== 'active' || war.current_phase !== 'submit') return;
    if (isResolvingRef.current) return;
    const aliveCount = members.filter(m => m.is_alive).length;
    if (aliveCount > 0 && submittedCount >= aliveCount) {
      callResolveAPI(war.id, war.current_turn);
    }
  }, [submittedCount, members.length, war?.id, war?.current_turn, war?.current_phase, callResolveAPI]);

  // ── Submeter ação ─────────────────────────────────────────────────
  const submitAction = useCallback(async (
    playerId: string, clanId: string, actionType: WarActionType, targetPlayerId: string,
  ) => {
    if (!supabase || !warId || !war) return { error: 'sem dados' };
    const { data, error } = await supabase
      .from('clan_war_actions')
      .insert({ war_id: warId, turn: war.current_turn, player_id: playerId, clan_id: clanId, action_type: actionType, target_player_id: targetPlayerId, was_auto: false })
      .select().single();
    if (!error && data) { setMyAction(data); fetchState(); }
    return { error };
  }, [supabase, warId, war, fetchState]);

  return { war, members, lastLog, turnLogs, myAction, phase, submittedCount, currentActions, loading, refresh: fetchState, submitAction };
}

// ── Countdown ────────────────────────────────────────────────────────
export function useWarCountdown(phaseEndsAt: string | null | undefined): number {
  const [seconds, setSeconds] = useState<number>(TURN_DURATION_SECONDS);
  useEffect(() => {
    if (!phaseEndsAt) { setSeconds(TURN_DURATION_SECONDS); return; }
    const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(phaseEndsAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phaseEndsAt]);
  return seconds;
}

// ── Espectador ────────────────────────────────────────────────────────
export function useSpectator(supabase: any, warId: string | null, userId: string | null) {
  const [war, setWar]           = useState<any>(null);
  const [members, setMembers]   = useState<any[]>([]);
  const [turnLogs, setTurnLogs] = useState<any[]>([]);
  const [spectators, setSpectators] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [joined, setJoined]     = useState(false);

  const fetchState = useCallback(async () => {
    if (!supabase || !warId) return;
    const { data: warData } = await supabase.from('clan_wars').select('*').eq('id', warId).single();
    if (!warData) return;
    setWar(warData);
    const { data: membersData } = await supabase.from('clan_war_members').select('*').eq('war_id', warId);
    setMembers(membersData || []);
    // Só busca logs de turnos já resolvidos (sem spoiler)
    const { data: logsData } = await supabase
      .from('clan_war_turn_logs').select('*').eq('war_id', warId)
      .lt('turn', warData.current_turn)
      .order('turn', { ascending: false });
    setTurnLogs(logsData || []);
    // Buscar lista de espectadores com nome
    const { data: specData } = await supabase
      .from('war_spectators')
      .select('user_id, profiles(name, avatar_url)')
      .eq('room_id', warData.room_id);
    setSpectators(specData || []);
    setLoading(false);
  }, [supabase, warId]);

  // Entrar como espectador
  const joinAsSpectator = useCallback(async (roomId: number) => {
    if (!supabase || !userId) return { error: 'sem usuário' };
    // Contar espectadores ativos (sem race condition)
    const { count } = await supabase
      .from('war_spectators')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);
    if ((count || 0) >= 5) return { error: 'Limite de 5 espectadores atingido' };
    // Upsert — se já existe, apenas atualiza o timestamp
    const { error: upsertError } = await supabase.from('war_spectators').upsert(
      { room_id: roomId, user_id: userId, joined_at: new Date().toISOString() },
      { onConflict: 'room_id,user_id' }
    );
    if (upsertError) {
      console.error('[spectator] upsert error:', upsertError);
      return { error: upsertError.message };
    }
    setJoined(true);
    return { error: null };
  }, [supabase, warId, userId]);

  // Sair como espectador
  const leaveAsSpectator = useCallback(async (roomId: number) => {
    if (!supabase || !userId) return;
    await supabase.from('war_spectators').delete().eq('room_id', roomId).eq('user_id', userId);
    setJoined(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (!warId) return;
    fetchState();
    // Polling mais lento para espectadores (8s)
    const interval = setInterval(fetchState, 8000);
    return () => clearInterval(interval);
  }, [fetchState, warId]);

  return { war, members, turnLogs, spectators, loading, joined, joinAsSpectator, leaveAsSpectator, refresh: fetchState };
}