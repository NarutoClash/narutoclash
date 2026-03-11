'use client';

/**
 * /app/(dashboard)/(authenticated)/guerra/page.tsx
 * Guerra de Clãs — 2v2 (pronto para 5v5: mude TEAM_SIZE em clan-war-types.ts)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { useWarRooms, useWarLobby, useActiveClanWar, useMyWarInvites, useWarCountdown, useSpectator } from '@/lib/clan-war/use-clan-war';
import { createWarMemberSnapshot, getWarAvailableActions, ACTION_COOLDOWNS } from '@/lib/clan-war/clan-war-engine';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { TEAM_SIZE, WarRoom, ClanWarMember, WarActionType } from '@/lib/clan-war/clan-war-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Swords, Shield, Zap, Eye, BatteryCharging, Flame, Sparkles,
  Users, Clock, Crown, UserPlus, Loader2, Skull, Trophy,
  AlertTriangle, Wifi, WifiOff,
} from 'lucide-react';

// ── Constantes visuais ────────────────────────────────────────────────
const ACTION_ICONS: Record<WarActionType, React.ReactNode> = {
  taijutsu:    <Swords          className="h-4 w-4" />,
  ninjutsu:    <Zap             className="h-4 w-4 text-blue-400" />,
  genjutsu:    <Eye             className="h-4 w-4 text-purple-400" />,
  defend:      <Shield          className="h-4 w-4 text-green-400" />,
  charge:      <BatteryCharging className="h-4 w-4 text-amber-400" />,
  doujutsu:    <Eye             className="h-4 w-4 text-red-400" />,
  cursed_seal: <Flame           className="h-4 w-4 text-orange-400" />,
  summon:      <Sparkles        className="h-4 w-4 text-pink-400" />,
};
const ACTION_LABELS: Record<WarActionType, string> = {
  taijutsu: 'Taijutsu', ninjutsu: 'Ninjutsu', genjutsu: 'Genjutsu',
  defend: 'Defender', charge: 'Chakra',
  doujutsu: 'Dōjutsu', cursed_seal: 'Selo', summon: 'Invocar',
};

// ── HP Bar ────────────────────────────────────────────────────────────
function HpBar({ current, max, showText = false }: { current: number; max: number; showText?: boolean }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (current / max) * 100 : 0));
  const color = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-0.5">
      <div className="relative h-2 rounded-full overflow-hidden bg-black/40">
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
      {showText && (
        <p className="text-xs text-right font-mono" style={{ color }}>
          {current}/{max}
        </p>
      )}
    </div>
  );
}

// ── Chakra Bar ────────────────────────────────────────────────────────
function ChakraBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (current / max) * 100 : 0));
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden bg-black/40">
      <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: '#60a5fa', boxShadow: '0 0 6px #60a5fa60' }} />
    </div>
  );
}

// ── Countdown Ring ────────────────────────────────────────────────────
function CountdownRing({ seconds, total = 30 }: { seconds: number; total?: number }) {
  const r = 18, circ = 2 * Math.PI * r, pct = Math.min(1, seconds / total);
  const color = seconds > 15 ? '#22c55e' : seconds > 8 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="absolute rotate-[-90deg]" width="48" height="48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#ffffff10" strokeWidth="3" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s' }} />
      </svg>
      <span className="text-sm font-black" style={{ color }}>{seconds}</span>
    </div>
  );
}

// ── Card de membro ────────────────────────────────────────────────────
function MemberCard({
  member,
  isMe = false,
  isTarget = false,
  onSelect,
  dead = false,
  disconnected = false,
}: {
  member: ClanWarMember;
  isMe?: boolean;
  isTarget?: boolean;
  onSelect?: () => void;
  dead?: boolean;
  disconnected?: boolean;
}) {
  return (
    <div
      onClick={!dead && !isMe && onSelect ? onSelect : undefined}
      className={cn(
        'relative p-3 rounded-xl border transition-all duration-200',
        dead       ? 'opacity-40 border-red-900/40 bg-black/20' :
        isTarget   ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20 cursor-pointer' :
        isMe       ? 'border-blue-500/60 bg-blue-500/10' :
        onSelect   ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 cursor-pointer' :
                     'border-white/10 bg-white/5'
      )}
    >
      {isTarget && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black">
          ALVO
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.player_avatar || undefined} />
            <AvatarFallback className="text-xs bg-white/10">{member.player_name[0]}</AvatarFallback>
          </Avatar>
          {dead && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/70">
              <Skull className="h-4 w-4 text-red-400" />
            </div>
          )}
          {disconnected && !dead && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange-500 border border-black flex items-center justify-center">
              <WifiOff className="h-2 w-2 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-bold truncate', isMe && 'text-blue-300')}>
            {member.player_name}
            {isMe && ' (você)'}
          </p>
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-white/20">
            {member.build}
          </Badge>
        </div>
      </div>
      {!dead && (
        <div className="space-y-1">
          <HpBar current={member.hp_current} max={member.hp_max} showText />
          <ChakraBar current={member.chakra_current} max={member.chakra_max} />
        </div>
      )}
    </div>
  );
}

// ── Slot vazio no lobby ───────────────────────────────────────────────
function EmptySlot({ slot, canInvite, onInvite }: { slot: number; canInvite: boolean; onInvite?: () => void }) {
  return (
    <div
      onClick={canInvite ? onInvite : undefined}
      className={cn(
        'p-3 rounded-xl border border-dashed transition-all duration-200 flex items-center justify-center gap-2 h-[90px]',
        canInvite
          ? 'border-white/20 hover:border-white/40 hover:bg-white/5 cursor-pointer text-white/40 hover:text-white/70'
          : 'border-white/10 text-white/20'
      )}
    >
      {canInvite ? (
        <>
          <UserPlus className="h-4 w-4" />
          <span className="text-xs">Convidar membro</span>
        </>
      ) : (
        <span className="text-xs">Slot {slot} — aguardando...</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TELA 1 — Lista de Salas
// ═══════════════════════════════════════════════════════════════════════
function RoomList({
  rooms,
  userProfile,
  clanData,
  userRole,
  onEnterRoom,
  onOpenRoom,
  onSpectate,
}: {
  rooms: WarRoom[];
  userProfile: any;
  clanData: any;
  userRole: string | undefined;
  onEnterRoom: (room: WarRoom) => void;
  onOpenRoom: (roomId: number) => Promise<void>;
  onSpectate: (room: WarRoom) => void;
}) {
  const isLeader = userRole === 'Líder';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Swords className="h-6 w-6 text-red-400" />
          Guerra de Clãs
        </h1>
        <p className="text-sm text-white/50 mt-1">
          10 salas disponíveis · {TEAM_SIZE}v{TEAM_SIZE} · Apenas líderes podem iniciar
        </p>
      </div>

      {rooms.map(room => {
        const isInvolved = room.clan_a_id === clanData?.id || room.clan_b_id === clanData?.id;
        const statusColor = room.status === 'active' ? 'text-green-400' : room.status === 'waiting' ? 'text-yellow-400' : room.status === 'finished' ? 'text-red-400' : 'text-white/40';
        const statusLabel = { available: 'Disponível', waiting: 'Aguardando', active: 'Em batalha', finished: 'Encerrada' }[room.status];

        return (
          <Card key={room.id} className="bg-black/40 border-white/10 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/40 font-mono">SALA {room.id}</p>
                  <p className={cn('text-sm font-bold', statusColor)}>{statusLabel}</p>
                </div>
                {room.status === 'active' && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">AO VIVO</span>
                  </div>
                )}
              </div>

              {/* Times */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('flex-1 p-3 rounded-lg text-center', room.clan_a_id ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/10 border-dashed')}>
                  {room.clan_a_id ? (
                    <>
                      <Crown className="h-3 w-3 text-yellow-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-white truncate">{room.clan_a_name}</p>
                    </>
                  ) : (
                    <p className="text-xs text-white/30">Vazio</p>
                  )}
                </div>
                <span className="text-white/40 font-black text-sm">VS</span>
                <div className={cn('flex-1 p-3 rounded-lg text-center', room.clan_b_id ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10 border-dashed')}>
                  {room.clan_b_id ? (
                    <p className="text-xs font-bold text-white truncate">{room.clan_b_name}</p>
                  ) : (
                    <p className="text-xs text-white/30">Aguardando</p>
                  )}
                </div>
              </div>

              {/* Botão */}
              {room.status === 'available' && isLeader && clanData && (
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-500 text-white"
                  onClick={() => onOpenRoom(room.id)}>
                  <Crown className="h-4 w-4 mr-1" /> Abrir Sala
                </Button>
              )}
              {(room.status === 'waiting' || room.status === 'active') && isInvolved && (
                <Button size="sm" className="w-full bg-white/10 hover:bg-white/20"
                  onClick={() => onEnterRoom(room)}>
                  Entrar na Sala
                </Button>
              )}
              {(room.status === 'waiting' || room.status === 'active') && !isInvolved && isLeader && clanData && room.status === 'waiting' && !room.clan_b_id && (
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-500"
                  onClick={() => onEnterRoom(room)}>
                  Aceitar Desafio
                </Button>
              )}
              {room.status === 'active' && !isInvolved && (
                <Button size="sm" variant="outline" className="w-full border-white/20 text-white/70 hover:bg-white/10"
                  onClick={() => onSpectate(room)}
                  disabled={(room.spectator_count || 0) >= 5}>
                  👁️ Espectrar {(room.spectator_count || 0) >= 5 ? '(Lotado)' : `(${room.spectator_count || 0}/5)`}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TELA 2 — Lobby
// ═══════════════════════════════════════════════════════════════════════
function WarLobby({
  roomId,
  war,
  members,
  invites,
  userProfile,
  clanData,
  userRole,
  supabase,
  onWarStart,
  onLeave,
}: any) {
  const { toast } = useToast();
  const [clanMembers, setClanMembers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isLeader = userRole === 'Líder';
  const isMyClan = (id: string) => id === clanData?.id;
  const myTeam    = members.filter((m: ClanWarMember) => m.clan_id === clanData?.id);
  const enemyTeam = members.filter((m: ClanWarMember) => m.clan_id !== clanData?.id);

  // Carregar membros do clã para convidar
  useEffect(() => {
    if (!supabase || !clanData?.id || !showInviteModal) return;
    supabase.from('clan_members')
      .select('user_id, profiles(id, name, avatar_url, level)')
      .eq('clan_id', clanData.id)
      .then(({ data }: any) => {
        const already = members.map((m: ClanWarMember) => m.player_id);
        const invited = invites.map((i: any) => i.player_id);
        setClanMembers((data || [])
          .map((cm: any) => cm.profiles)
          .filter((p: any) => p && !already.includes(p.id) && !invited.includes(p.id))
        );
      });
  }, [supabase, clanData?.id, showInviteModal, members, invites]);

  const handleInvite = async (player: any) => {
    if (!supabase || !war || inviting) return;
    setInviting(true);

    const { error } = await supabase.from('clan_war_invites').insert({
      room_id: roomId, war_id: war.id, player_id: player.id,
      player_name: player.name, clan_id: clanData.id,
      invited_by: userProfile.id, status: 'pending',
    });
    if (error) {
      toast({ title: 'Erro ao convidar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Convite enviado para ${player.name}!` });
      setShowInviteModal(false);
    }
    setInviting(false);
  };

  const handleStartWar = async () => {
    if (!supabase || !war) return;
    const phaseEnd = new Date(Date.now() + 30_000).toISOString();
    const { error } = await supabase.from('clan_wars')
      .update({ status: 'active', current_phase: 'submit', phase_ends_at: phaseEnd, started_at: new Date().toISOString() })
      .eq('id', war.id);
    await supabase.from('war_rooms').update({ status: 'active' }).eq('id', roomId);
    if (!error) onWarStart?.();
  };

  const canStart = isLeader && myTeam.length === TEAM_SIZE && enemyTeam.length === TEAM_SIZE;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" /> Lobby — Sala {roomId}
          </h2>
          <p className="text-xs text-white/40">
            {war ? `${war.clan_a_name} vs ${war.clan_b_name || 'Aguardando...'}` : 'Carregando...'}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onLeave} className="text-white/40 hover:text-white">
          Sair
        </Button>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        {/* Time A */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <p className="text-xs font-bold text-blue-300">{war?.clan_a_name || '...'}</p>
          </div>
          {Array.from({ length: TEAM_SIZE }, (_, i) => {
            const m = members.find((m: ClanWarMember) => m.clan_id === war?.clan_a_id && m.slot === i + 1);
            return m ? (
              <div key={i} className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.player_avatar || undefined} />
                    <AvatarFallback className="text-xs">{m.player_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-white">{m.player_name}</p>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-2.5 w-2.5 text-green-400" />
                      <span className="text-[10px] text-green-400">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptySlot key={i} slot={i + 1}
                canInvite={isLeader && isMyClan(war?.clan_a_id || '')}
                onInvite={() => setShowInviteModal(true)} />
            );
          })}
        </div>

        {/* Time B */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <p className="text-xs font-bold text-red-300">{war?.clan_b_name || 'Aguardando clã...'}</p>
          </div>
          {Array.from({ length: TEAM_SIZE }, (_, i) => {
            const m = members.find((m: ClanWarMember) => m.clan_id === war?.clan_b_id && m.slot === i + 1);
            return m ? (
              <div key={i} className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.player_avatar || undefined} />
                    <AvatarFallback className="text-xs">{m.player_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-white">{m.player_name}</p>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-2.5 w-2.5 text-green-400" />
                      <span className="text-[10px] text-green-400">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptySlot key={i} slot={i + 1}
                canInvite={isLeader && isMyClan(war?.clan_b_id || '')}
                onInvite={() => setShowInviteModal(true)} />
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-xs text-white/50">
          {myTeam.length}/{TEAM_SIZE} no seu time ·{' '}
          {enemyTeam.length}/{TEAM_SIZE} no time inimigo
        </p>
        {!canStart && (
          <p className="text-xs text-yellow-400/80 mt-1">
            {myTeam.length < TEAM_SIZE
              ? `Convide mais ${TEAM_SIZE - myTeam.length} membro(s)`
              : `Aguardando time adversário (${enemyTeam.length}/${TEAM_SIZE})`}
          </p>
        )}
      </div>

      {/* Botão iniciar */}
      {canStart && (
        <Button className="w-full bg-red-600 hover:bg-red-500 text-white font-black"
          onClick={handleStartWar}>
          <Swords className="h-4 w-4 mr-2" /> Iniciar Guerra!
        </Button>
      )}

      {/* Modal de convite */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-3">Convidar membro</h3>
            {clanMembers.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">Nenhum membro disponível</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clanMembers.map((p: any) => (
                  <button key={p.id}
                    onClick={() => handleInvite(p)}
                    disabled={inviting}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.avatar_url} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-white/40">Nv {p.level}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3 text-white/40"
              onClick={() => setShowInviteModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TELA 3 — Batalha Ativa
// ═══════════════════════════════════════════════════════════════════════
function EffectTag({ effect }: { effect: any }) {
  const DAMAGE_TYPES = new Set([
    'burn_damage','item_veneno','item_veneno_tick','item_queimadura',
    'item_paralisia','item_refletir','barrier_blocked','item_barreira_absorveu',
    'burn_applied','paralysis_skipped','weaken_applied',
  ]);
  const HEAL_TYPES = new Set(['regen','item_regeneracao','item_lifesteal','survived_death']);
  const isDamage = DAMAGE_TYPES.has(effect.type);
  const isHeal   = HEAL_TYPES.has(effect.type);
  const color  = isDamage ? '#ef4444' : isHeal ? '#22c55e' : (effect.color || '#ffcc00');
  const showValue = effect.value != null && effect.value > 0 && (isDamage || isHeal);
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}33` }}>
      <span>{effect.label}</span>
      {showValue && <span className="font-bold opacity-90">{isDamage ? '-' : '+'}{Math.round(effect.value)}</span>}
    </div>
  );
}

function WarMemberCard({
  member, isMe, isTarget, onSelect, showAction, submittedAction,
}: {
  member: ClanWarMember;
  isMe?: boolean;
  isTarget?: boolean;
  onSelect?: () => void;
  showAction?: boolean;
  submittedAction?: WarActionType | null;
}) {
  const borderColor = isMe ? '#facc15' : isTarget ? '#f87171' : '#ffffff20';
  const hpPct = Math.max(0, Math.min(100, member.hp_max > 0 ? (member.hp_current / member.hp_max) * 100 : 0));
  const hpColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
  const ckPct = Math.max(0, Math.min(100, member.chakra_max > 0 ? (member.chakra_current / member.chakra_max) * 100 : 0));

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-lg p-2.5 flex flex-col gap-1.5 transition-all duration-150",
        onSelect && member.is_alive ? "cursor-pointer hover:scale-[1.02]" : "",
        !member.is_alive ? "opacity-40" : "",
      )}
      style={{
        background: '#0e090088',
        borderLeft: `3px solid ${borderColor}`,
        border: isTarget ? `2px solid #f87171` : `1px solid ${borderColor}`,
        boxShadow: isTarget ? '0 0 12px #f8717140' : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={member.player_avatar || undefined} />
          <AvatarFallback className="text-xs">{member.player_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: borderColor }}>
            {member.player_name}
            {isMe && <span className="ml-1 text-[9px] text-white/40">(você)</span>}
          </p>
          <p className="text-[9px] text-white/40">{member.build}</p>
        </div>
        {member.disconnected && <WifiOff className="h-3 w-3 text-orange-400 shrink-0" />}
        {!member.is_alive && <Skull className="h-3 w-3 text-red-400 shrink-0" />}
      </div>

      {/* HP */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-[9px]">
          <span className="text-white/40">HP</span>
          <span className="font-mono" style={{ color: hpColor }}>{Math.max(0,member.hp_current)}/{member.hp_max}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-black/40">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${hpPct}%`, backgroundColor: hpColor, boxShadow: `0 0 6px ${hpColor}60` }} />
        </div>
      </div>

      {/* Chakra */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-[9px]">
          <span className="text-white/40">Chakra</span>
          <span className="font-mono text-blue-300">{Math.max(0,member.chakra_current)}/{member.chakra_max}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-black/40">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${ckPct}%` }} />
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1">
        {member.doujutsu?.isActive && (
          <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">👁️ {member.doujutsu.type}</span>
        )}
        {member.cursed_seal?.isActive && (
          <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">⚡ Selo Nv{member.cursed_seal.level}</span>
        )}
        {member.is_defending && (
          <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold">🛡️ Defendendo</span>
        )}
      </div>

      {/* Ação submetida */}
      {showAction && (
        <div className="text-[9px] font-semibold">
          {submittedAction
            ? <span className="text-green-400">✅ {ACTION_LABELS[submittedAction]}</span>
            : <span className="text-amber-400 animate-pulse">⏳ Escolhendo...</span>}
        </div>
      )}
    </div>
  );
}

function WarTurnCard({ event, memberMap }: { event: any; memberMap: Record<string, ClanWarMember> }) {
  if (!event || event.type === 'defend') return null;
  const actor = event.actor_id ? memberMap[event.actor_id] : null;
  const target = event.target_id ? memberMap[event.target_id] : null;

  const isAttack = event.type === 'attack';
  const isDeath  = event.type === 'death';
  const isSpecial = event.type === 'special';

  const borderColor = isDeath ? '#ef4444' : isSpecial ? '#a855f7' : '#facc15';
  const attackTypeColor =
    event.action_type === 'ninjutsu' ? '#60a5fa' :
    event.action_type === 'genjutsu' ? '#c084fc' :
    event.action_type === 'taijutsu' ? '#fb923c' : '#94a3b8';

  return (
    <div className="rounded-lg p-2.5 flex flex-col gap-1.5 mb-1.5"
      style={{ background: '#0e090088', borderLeft: `3px solid ${borderColor}` }}>
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-xs font-bold" style={{ color: borderColor }}>
          {isDeath ? '☠️' : isSpecial ? '✨' : '⚔️'} {event.actor_name}
          {target && <span className="text-white/40"> → {target.player_name}</span>}
        </span>
        {event.action_type && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: `${attackTypeColor}22`, color: attackTypeColor }}>
            {ACTION_LABELS[event.action_type as WarActionType] || event.action_type}
          </span>
        )}
      </div>

      {/* GIF do jutsu */}
      {event.jutsu_gif && (
        <div className="flex justify-center">
          <img src={event.jutsu_gif} alt={event.jutsu_used || 'jutsu'}
            className="w-20 h-20 rounded-lg object-cover"
            style={{ border: `2px solid ${borderColor}` }}
            loading="lazy" />
        </div>
      )}

      {event.jutsu_used && (
        <p className="text-xs font-bold" style={{ color: borderColor }}>{event.jutsu_used}</p>
      )}

      <p className="text-[11px] text-[#a87800] font-mono leading-snug">{event.log_text}</p>

      {isAttack && event.damage > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-base font-black" style={{ color: borderColor }}>
            💥 {Math.round(event.damage)}
          </span>
          {event.is_critical && (
            <span className="text-[10px] font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded">
              CRÍTICO ×1.5
            </span>
          )}
        </div>
      )}

      {event.build_effects?.length > 0 && (
        <div className="flex flex-col gap-1">
          {event.build_effects.map((ef: any, i: number) => <EffectTag key={i} effect={ef} />)}
        </div>
      )}
    </div>
  );
}

function WarTurnLog({ log, memberMap }: { log: any; memberMap: Record<string, ClanWarMember> }) {
  if (!log) return null;
  return (
    <div className="rounded-lg overflow-hidden mb-2"
      style={{ background: '#0e090088', border: '1px solid #ffcc0022' }}>
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: 'linear-gradient(90deg, #1a120888, #0e090088)', borderBottom: '1px solid #ffcc0022' }}>
        <span className="text-xs font-mono font-bold text-[#ffcc00]">⚔️ Turno {log.turn}</span>
        <span className="text-[10px] text-[#7a5c12] font-mono">
          {log.team_a_alive}v{log.team_b_alive} vivos
        </span>
      </div>
      <div className="p-2 space-y-1">
        {log.events?.map((ev: any, i: number) => (
          <WarTurnCard key={i} event={ev} memberMap={memberMap} />
        ))}
      </div>
    </div>
  );
}


// ── Card compacto para lista 5v5 ─────────────────────────────────────
function CompactMemberCard({ member, isMe, isTarget, onSelect, submittedAction, isBlocked, attackCount }: {
  member: ClanWarMember; isMe?: boolean; isTarget?: boolean;
  onSelect?: () => void; submittedAction?: string;
  isBlocked?: boolean; attackCount?: number;
}) {
  const hpPct = Math.max(0, (member.hp_current / member.hp_max) * 100);
  const chakraPct = Math.max(0, (member.chakra_current / member.chakra_max) * 100);
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all',
        onSelect ? 'cursor-pointer' : '',
        isTarget ? 'ring-1 ring-red-400 bg-red-500/10' : isBlocked ? 'bg-orange-500/5' : 'bg-white/5',
        isMe ? 'border border-blue-500/30' : isBlocked ? 'border border-orange-500/20' : 'border border-white/5',
        !member.is_alive ? 'opacity-40' : isBlocked ? 'opacity-60' : '',
      )}
    >
      {/* Indicador lado */}
      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', member.is_alive ? (isMe !== undefined ? 'bg-blue-400' : 'bg-red-400') : 'bg-white/20')} />

      {/* Nome */}
      <span className={cn('text-xs font-semibold truncate', isMe ? 'text-blue-200' : 'text-white/80')}
        style={{ width: 72 }}>
        {member.player_name}{isMe ? ' 👤' : ''}
      </span>

      {/* Barras */}
      <div className="flex-1 space-y-0.5">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${hpPct}%`, background: hpColor }} />
        </div>
        <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${chakraPct}%` }} />
        </div>
      </div>

      {/* HP e Chakra */}
      <div className="flex-shrink-0 text-right" style={{ width: 52 }}>
        <div className="text-[9px] text-green-400 leading-none">{member.hp_current}<span className="text-white/20">/{member.hp_max}</span></div>
        <div className="text-[9px] text-sky-400 leading-none mt-0.5">{member.chakra_current}<span className="text-white/20">/{member.chakra_max}</span></div>
      </div>

      {/* Ação / contador */}
      <div className="flex-shrink-0 text-center" style={{ width: 28 }}>
        {!member.is_alive
          ? <span className="text-xs">💀</span>
          : submittedAction
            ? <span className="text-xs">✅</span>
            : isBlocked
              ? <span className="text-[9px] text-orange-400 font-bold">2/2</span>
              : attackCount && attackCount > 0
                ? <span className="text-[9px] text-yellow-400 font-bold">{attackCount}/2</span>
                : <span className="text-xs text-white/20">⏳</span>
        }
      </div>
    </div>
  );
}

function ActiveBattle({ warId, userProfile, clanData }: { warId: string; userProfile: any; clanData: any }) {
  const { supabase } = useSupabase();
  const { war, members, lastLog, myAction, phase, submittedCount, currentActions, submitAction, turnLogs } = useActiveClanWar(supabase, warId);
  const countdown = useWarCountdown(war?.phase_ends_at);
  const [spectators, setSpectators] = useState<any[]>([]);

  // Buscar espectadores da sala (polling 8s)
  useEffect(() => {
    if (!supabase || !war?.room_id) return;
    const fetchSpecs = async () => {
      const { data } = await supabase
        .from('war_spectators')
        .select('user_id, profiles(name, avatar_url)')
        .eq('room_id', war.room_id);
      setSpectators(data || []);
    };
    fetchSpecs();
    const interval = setInterval(fetchSpecs, 8000);
    return () => clearInterval(interval);
  }, [supabase, war?.room_id]);

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<WarActionType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const logEndRef = useRef<HTMLDivElement>(null);
  const logTopRef = useRef<HTMLDivElement>(null);

  const me = members.find(m => m.player_id === userProfile?.id);
  const myTeam    = members.filter(m => m.clan_id === clanData?.id);
  const enemyTeam = members.filter(m => m.clan_id !== clanData?.id);
  const availableActions = me ? getWarAvailableActions(me, war?.current_turn || 1) : [];

  // Contar quantos já escolheram cada inimigo como alvo neste turno
  const attacksOnTarget = (currentActions || []).reduce((acc: Record<string, number>, a: any) => {
    if (a.target_player_id) acc[a.target_player_id] = (acc[a.target_player_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Limite de 2 atacantes por alvo, exceto se não houver outra opção
  const aliveEnemies = enemyTeam.filter(m => m.is_alive);
  const isTargetBlocked = (targetId: string) => {
    if (aliveEnemies.length <= 2) return false; // poucos inimigos — sem restrição
    return (attacksOnTarget[targetId] || 0) >= 2;
  };

  // Map de membros para lookup rápido no log
  const memberMap = members.reduce((acc, m) => { acc[m.player_id] = m; return acc; }, {} as Record<string, ClanWarMember>);

  const needsTarget = (a: WarActionType) =>
    ['taijutsu','ninjutsu','genjutsu','summon'].includes(a);

  useEffect(() => {
    logTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turnLogs?.length]);

  const handleSubmit = async () => {
    if (!selectedAction || !me || submitting) return;
    if (needsTarget(selectedAction) && !selectedTarget) {
      toast({ title: 'Selecione um alvo!', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    const target = needsTarget(selectedAction) ? selectedTarget! : me.player_id;
    const { error } = await submitAction(me.player_id, clanData.id, selectedAction, target);
    if (error) {
      toast({ title: 'Erro ao submeter ação', description: String(error), variant: 'destructive' });
    } else {
      toast({ title: '⚔️ Ação registrada!', description: 'Aguardando os outros jogadores...' });
      setSelectedAction(null);
      setSelectedTarget(null);
    }
    setSubmitting(false);
  };

  if (!war || !me) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  const ACTION_CHAKRA_COSTS: Record<WarActionType, number> = {
    taijutsu: 0, ninjutsu: 30, genjutsu: 25, defend: 10,
    charge: 0, doujutsu: 0, cursed_seal: 0, summon: 50,
  };
  const ACTION_COOLDOWNS_WAR: Record<WarActionType, number> = {
    taijutsu: 2, ninjutsu: 3, genjutsu: 2, defend: 2,
    charge: 0, doujutsu: 0, cursed_seal: 0, summon: 0,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Swords className="h-5 w-5 text-red-400" />
            Turno {war.current_turn}
          </h2>
          <p className="text-xs text-white/40">
            {war.clan_a_name} vs {war.clan_b_name} · {members.filter(m=>m.is_alive).length}/{members.length} vivos
          </p>
        </div>
        {phase === 'submit' && <CountdownRing seconds={countdown} total={30} />}
        {phase === 'resolving' && (
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-white/60" />
            <span className="text-xs text-white/60">Resolvendo...</span>
          </div>
        )}
      </div>

      {/* Progresso de submissões */}
      {phase === 'submit' && (
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/50">Ações submetidas</span>
          <span className="text-xs font-bold text-white">
            {submittedCount}/{members.filter(m => m.is_alive).length}
          </span>
        </div>
      )}

      {/* Espectadores */}
      {spectators.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <SpectatorBadge spectators={spectators} />
        </div>
      )}

      {/* Fim de guerra — Relatório de pontos */}
      {war.status === 'finished' && (() => {
        const isWinner = war.winner_clan_id === clanData?.id;
        const report = (war as any).points_report;
        const mySide = report ? (isWinner ? report.winner : report.loser) : null;
        const enemySide = report ? (isWinner ? report.loser : report.winner) : null;
        const players = report?.players || {};
        const dmgByPlayer = report?.dmg_by_player || {};
        const mvpId = report?.mvp_player_id;
        const worstId = report?.worst_player_id;
        return (
          <div className={cn(
            'rounded-2xl border-2 space-y-0 animate-in fade-in zoom-in duration-500 overflow-hidden',
            isWinner
              ? 'bg-gradient-to-br from-amber-950/40 to-yellow-900/20 border-amber-500'
              : 'bg-gradient-to-br from-red-950/40 to-red-900/20 border-red-500'
          )}>
            {/* Header */}
            <div className="text-center p-5 space-y-1">
              <p className="text-5xl">{isWinner ? '🏆' : '💀'}</p>
              <p className="text-2xl font-black text-white">{isWinner ? 'VITÓRIA!' : 'DERROTA'}</p>
              <p className="text-xs text-white/40">{enemySide?.clan_name} {isWinner ? 'foi derrotado' : 'venceu'}</p>
            </div>

            {/* Relatório de pontos dos clãs */}
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest text-center">Relatório de Pontos</p>

              {/* Meu clã */}
              {mySide && (
                <div className={cn(
                  'rounded-xl p-3 space-y-2',
                  isWinner ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-red-500/10 border border-red-500/30'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{mySide.clan_name}</span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', isWinner ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300')}>
                      {isWinner ? 'Vencedor' : 'Perdedor'}
                    </span>
                  </div>
                  {/* Breakdown */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-white/50">
                      <span>Base {isWinner ? '(vitória)' : '(derrota)'}</span>
                      <span className={isWinner ? 'text-green-400' : 'text-red-400'}>
                        {isWinner ? `+${mySide.breakdown?.base}` : mySide.breakdown?.base}
                      </span>
                    </div>
                    {isWinner && mySide.breakdown?.survivors > 0 && (
                      <div className="flex justify-between text-white/50">
                        <span>Aliados vivos</span>
                        <span className="text-green-400">+{mySide.breakdown.survivors}</span>
                      </div>
                    )}
                    {!isWinner && mySide.breakdown?.no_kill < 0 && (
                      <div className="flex justify-between text-white/50">
                        <span>Nenhum inimigo eliminado</span>
                        <span className="text-red-400">{mySide.breakdown.no_kill}</span>
                      </div>
                    )}
                    {mySide.breakdown?.streak > 0 && (
                      <div className="flex justify-between text-white/50">
                        <span>🔥 Bônus de streak</span>
                        <span className="text-amber-400">+{mySide.breakdown.streak}</span>
                      </div>
                    )}
                    {/* MVP/Worst individuais do clã */}
                    {Object.entries(players).filter(([pid, info]: any) => info.clan_id === mySide.clan_id).map(([pid, info]: any) => (
                      <div key={pid} className="flex justify-between text-white/50">
                        <span>{info.bonus > 0 ? '⚔️' : '💤'} {info.name} ({info.bonus > 0 ? 'mais dano' : 'menos dano'})</span>
                        <span className={info.bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                          {info.bonus > 0 ? '+' : ''}{info.bonus}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Total */}
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                    <div className="text-xs text-white/40">
                      {mySide.pts_before} pts → <span className="text-white font-bold">{mySide.pts_after} pts</span>
                    </div>
                    <div className={cn('text-sm font-black', mySide.pts_earned >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {mySide.pts_earned >= 0 ? '+' : ''}{mySide.pts_earned} pts
                    </div>
                  </div>
                </div>
              )}

              {/* Clã inimigo */}
              {enemySide && (
                <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/70">{enemySide.clan_name}</span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', !isWinner ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300')}>
                      {!isWinner ? 'Vencedor' : 'Perdedor'}
                    </span>
                  </div>
                  {/* Breakdown do inimigo */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-white/40">
                      <span>Base ({!isWinner ? 'vitória' : 'derrota'})</span>
                      <span className={!isWinner ? 'text-green-400' : 'text-red-400'}>
                        {!isWinner ? `+${enemySide.breakdown?.base}` : enemySide.breakdown?.base}
                      </span>
                    </div>
                    {!isWinner && enemySide.breakdown?.survivors > 0 && (
                      <div className="flex justify-between text-white/40">
                        <span>Aliados vivos</span>
                        <span className="text-green-400">+{enemySide.breakdown.survivors}</span>
                      </div>
                    )}
                    {isWinner && enemySide.breakdown?.no_kill < 0 && (
                      <div className="flex justify-between text-white/40">
                        <span>Nenhum inimigo eliminado</span>
                        <span className="text-red-400">{enemySide.breakdown.no_kill}</span>
                      </div>
                    )}
                    {Object.entries(players).filter(([pid, info]: any) => info.clan_id === enemySide.clan_id).map(([pid, info]: any) => (
                      <div key={pid} className="flex justify-between text-white/40">
                        <span>{info.bonus > 0 ? '⚔️' : '💤'} {info.name} ({info.bonus > 0 ? 'mais dano' : 'menos dano'})</span>
                        <span className={info.bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                          {info.bonus > 0 ? '+' : ''}{info.bonus}
                        </span>
                      </div>
                    ))}
                    {enemySide.breakdown?.disconnects > 0 && (
                      <div className="flex justify-between text-white/40">
                        <span>🚪 Membro(s) eliminado(s) por inatividade</span>
                        <span className="text-red-400">-{enemySide.breakdown.disconnects}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                    <div className="text-xs text-white/40">
                      {enemySide.pts_before} pts → <span className="text-white/70 font-bold">{enemySide.pts_after} pts</span>
                    </div>
                    <div className={cn('text-sm font-black', enemySide.pts_earned >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {enemySide.pts_earned >= 0 ? '+' : ''}{enemySide.pts_earned} pts
                    </div>
                  </div>
                </div>
              )}

              {/* Bônus/penalidade individual */}
              {(mvpId || worstId) && (
                <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Performance Individual</p>
                  {mvpId && players[mvpId] && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>⚔️</span>
                        <div>
                          <p className="text-white font-bold">{players[mvpId].name}</p>
                          <p className="text-white/40">Mais dano — {dmgByPlayer[mvpId] || 0} total</p>
                        </div>
                      </div>
                      <span className="text-green-400 font-black">+{players[mvpId].bonus}</span>
                    </div>
                  )}
                  {worstId && players[worstId] && mvpId !== worstId && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>💤</span>
                        <div>
                          <p className="text-white font-bold">{players[worstId].name}</p>
                          <p className="text-white/40">Menos dano — {dmgByPlayer[worstId] || 0} total</p>
                        </div>
                      </div>
                      <span className="text-red-400 font-black">{players[worstId].bonus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Campo de batalha */}
      {war.status === 'active' && (
        <>
          {/* Times — layout compacto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-300 flex items-center gap-1 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {clanData?.name}
              </div>
              {myTeam.map(m => (
                <CompactMemberCard key={m.player_id} member={m}
                  isMe={m.player_id === userProfile?.id}
                  submittedAction={m.player_id === userProfile?.id ? myAction?.action_type : undefined}
                />
              ))}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-red-300 flex items-center gap-1 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Inimigos
              </div>
              {enemyTeam.map(m => (
                <CompactMemberCard key={m.player_id} member={m}
                  isTarget={selectedTarget === m.player_id}
                  onSelect={m.is_alive && phase === 'submit' && !myAction && !isTargetBlocked(m.player_id) ? () => setSelectedTarget(m.player_id) : undefined}
                  isBlocked={isTargetBlocked(m.player_id)}
                  attackCount={attacksOnTarget[m.player_id] || 0}
                />
              ))}
            </div>
          </div>

          {/* Painel de ações */}
          {phase === 'submit' && !myAction && me?.is_alive && (
            <Card className={cn('border', selectedAction ? 'border-yellow-500/40' : 'border-white/10')}
              style={{ background: '#0a060088' }}>
              <CardHeader className="pb-2 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/50">
                    {needsTarget(selectedAction!) && !selectedTarget
                      ? '⬆️ Selecione um alvo inimigo acima'
                      : '⚔️ Escolha sua ação:'}
                  </p>
                  <CountdownRing seconds={countdown} total={30} />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-2 pb-3">
                {(Object.keys(ACTION_LABELS) as WarActionType[]).map(action => {
                  const available  = availableActions.includes(action);
                  const isSelected = selectedAction === action;
                  const cdLeft     = ((me.cooldowns?.[action] ?? 0) - (war.current_turn || 1));
                  const onCooldown = cdLeft > 0;
                  const usedOnce   = (action === 'doujutsu' && me.doujutsu_used) ||
                                     (action === 'cursed_seal' && me.cursed_seal_used) ||
                                     (action === 'summon' && me.summon_used);
                  return (
                    <button key={action} disabled={!available} onClick={() => setSelectedAction(action)}
                      className={cn(
                        'relative flex flex-col items-center justify-center gap-1',
                        'h-20 rounded-xl border-2 transition-all duration-150 text-center',
                        available ? 'cursor-pointer hover:scale-105 hover:border-yellow-400/60 hover:bg-yellow-400/5' : 'opacity-30 cursor-not-allowed',
                        isSelected ? 'border-yellow-400 bg-yellow-400/10 scale-105 ring-2 ring-yellow-400/40' : 'border-white/10 bg-white/5',
                      )}>
                      {ACTION_ICONS[action]}
                      <span className="text-[10px] font-bold leading-tight text-white/80">{ACTION_LABELS[action]}</span>
                      <span className="text-[9px] text-white/40">
                        {ACTION_CHAKRA_COSTS[action] > 0 ? `${ACTION_CHAKRA_COSTS[action]} ck` : 'grátis'}
                      </span>
                      {onCooldown && <span className="absolute top-1 right-1 text-[8px] bg-red-500/30 text-red-400 px-1 rounded-full font-bold">{cdLeft}t</span>}
                      {!onCooldown && !usedOnce && ACTION_COOLDOWNS_WAR[action] > 0 && available && (
                        <span className="absolute top-1 left-1 text-[8px] bg-white/10 text-white/40 px-1 rounded-full">cd{ACTION_COOLDOWNS_WAR[action]}</span>
                      )}
                      {(action === 'doujutsu' || action === 'cursed_seal' || action === 'summon') && !usedOnce && available && (
                        <span className="absolute top-1 right-1 text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded-full">1x</span>
                      )}
                    </button>
                  );
                })}
              </CardContent>
              <div className="px-4 pb-4">
                <Button
                  className="w-full bg-red-600 hover:bg-red-500 font-bold"
                  disabled={!selectedAction || (needsTarget(selectedAction) && !selectedTarget) || submitting}
                  onClick={handleSubmit}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '⚔️ Confirmar Ação'}
                </Button>
              </div>
            </Card>
          )}

          {/* Já submeteu */}
          {phase === 'submit' && myAction && me?.is_alive && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-sm text-green-300 font-bold">
                ✅ Ação: {ACTION_LABELS[myAction.action_type]}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Aguardando {submittedCount}/{members.filter(m=>m.is_alive).length} jogadores...
              </p>
            </div>
          )}

          {/* Morto */}
          {me && !me.is_alive && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <Skull className="h-6 w-6 text-red-400 mx-auto mb-1" />
              <p className="text-sm text-red-300">Você foi derrotado. Aguarde o fim da batalha.</p>
            </div>
          )}
        </>
      )}

      {/* Relatório de combate */}
      <Card style={{ background: '#0a060088' }}>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-white/40">📜 Relatório de Combate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-[32rem] overflow-y-auto pr-1">
          {/* Header VS */}
          {(turnLogs?.length > 0 || lastLog) && (
            <div className="rounded-lg p-3 mb-2 text-center"
              style={{ background: 'linear-gradient(135deg, #1a1208, #0e0900)', border: '1px solid #ffcc0044' }}>
              <p className="text-xs text-[#7a5c12] font-bold mb-2 tracking-widest">⚔️ GUERRA DE CLÃS</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-left">
                  <p className="font-black text-sm text-[#facc15]">{war.clan_a_name}</p>
                  <p className="text-xs text-[#7a5c12]">{myTeam.length} ninja(s)</p>
                </div>
                <div className="text-[#ffcc00] font-black text-lg">⚡VS⚡</div>
                <div className="flex-1 text-right">
                  <p className="font-black text-sm text-red-400">{war.clan_b_name}</p>
                  <p className="text-xs text-[#7a5c12]">{enemyTeam.length} ninja(s)</p>
                </div>
              </div>
            </div>
          )}

          <div ref={logTopRef} />
          {(!turnLogs || turnLogs.length === 0) && !lastLog
            ? <p className="text-xs text-white/30 text-center py-6">
                Batalha iniciada! Faça sua primeira escolha.
              </p>
            : (turnLogs || (lastLog ? [lastLog] : []))
                .slice()
                .reverse()
                .map((log: any, i: number) => (
                  <WarTurnLog key={i} log={log} memberMap={memberMap} />
                ))
          }
        </CardContent>
      </Card>
    </div>
  );
}


// ── Componente de lista de espectadores ─────────────────────────────
function SpectatorBadge({ spectators }: { spectators: any[] }) {
  if (!spectators || spectators.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-white/30">👁️</span>
      {spectators.map((s: any, i: number) => (
        <span key={i} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/50">
          {s.profiles?.name || 'Anon'}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TELA ESPECTADOR
// ═══════════════════════════════════════════════════════════════════════
function SpectatorView({ war, members, turnLogs, spectators, room, onLeave }: {
  war: any; members: any[]; turnLogs: any[]; spectators: any[]; room: any; onLeave: () => void;
}) {
  const memberMap = Object.fromEntries((members || []).map((m: any) => [m.player_id, m]));
  const teamA = members.filter((m: any) => m.clan_id === war?.clan_a_id);
  const teamB = members.filter((m: any) => m.clan_id === war?.clan_b_id);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 font-mono">SALA {room.id} · ESPECTADOR</p>
          <p className="text-lg font-black text-white flex items-center gap-2">
            👁️ {room.clan_a_name} <span className="text-white/40 text-sm">vs</span> {room.clan_b_name}
          </p>
          <SpectatorBadge spectators={spectators} />
        </div>
        <Button size="sm" variant="outline" className="border-white/20 text-white/60" onClick={onLeave}>
          Sair
        </Button>
      </div>

      {/* Status da guerra */}
      {war && (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40">Turno {war.current_turn}</span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                war.current_phase === 'resolving' ? 'bg-orange-500/20 text-orange-400' :
                war.status === 'finished' ? 'bg-red-500/20 text-red-400' :
                'bg-green-500/20 text-green-400'
              )}>
                {war.status === 'finished' ? 'Encerrada' : war.current_phase === 'resolving' ? 'Resolvendo...' : 'Em batalha'}
              </span>
            </div>
            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-bold text-blue-300">{war.clan_a_name}</p>
                {teamA.map((m: any) => (
                  <WarMemberCard key={m.player_id} member={m} isMe={false} showAction={false} />
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-300">{war.clan_b_name}</p>
                {teamB.map((m: any) => (
                  <WarMemberCard key={m.player_id} member={m} isMe={false} showAction={false} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {war?.status === 'finished' && (
        <Card className="bg-amber-950/30 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-white">
              🏆 {war.winner_clan_id === war.clan_a_id ? war.clan_a_name : war.clan_b_name} venceu!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Log de turnos */}
      <Card style={{ background: '#0a060088' }}>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-white/40">📜 Relatório de Combate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-[32rem] overflow-y-auto pr-1">
          {turnLogs.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-6">Aguardando o primeiro turno ser resolvido...</p>
          ) : (
            turnLogs.map((log: any, i: number) => (
              <WarTurnLog key={i} log={log} memberMap={memberMap} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════
export default function GuerraPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [currentRoom, setCurrentRoom] = useState<number | null>(null);
  const [activeWarId, setActiveWarId] = useState<string | null>(null);
  const [view, setView] = useState<'rooms' | 'lobby' | 'battle' | 'spectator'>('rooms');
  const [spectatorRoom, setSpectatorRoom] = useState<WarRoom | null>(null);

  const userProfileRef = useMemoSupabase(() =>
    user ? { table: 'profiles', id: user.id } : null, [user]);
  const { data: userProfile } = useDoc(userProfileRef);

  const clanRef = useMemoSupabase(() =>
    userProfile?.clan_id ? { table: 'clans', id: userProfile.clan_id } : null,
    [userProfile?.clan_id]);
  const { data: clanData } = useDoc(clanRef);

  const { rooms } = useWarRooms(supabase);
  const { war, members, invites } = useWarLobby(supabase, currentRoom, activeWarId);
  const { invites: myInvites, refresh: refreshInvites } = useMyWarInvites(supabase, user?.id);
  const { war: specWar, members: specMembers, turnLogs: specLogs, spectators: specList,
    joined: isSpectating, joinAsSpectator, leaveAsSpectator } = useSpectator(supabase, spectatorRoom?.war_id || null, user?.id || null);

  // Detectar userRole via members/clan
  const [userRole, setUserRole] = useState<string | undefined>();
  useEffect(() => {
    if (!supabase || !user || !clanData) return;
    supabase.from('clan_members').select('role')
      .eq('user_id', user.id).eq('clan_id', clanData.id).single()
      .then(({ data }: any) => setUserRole(data?.role));
  }, [supabase, user, clanData]);

  // Quando a guerra do lobby virar 'active', ir para batalha
  useEffect(() => {
    if (war?.status === 'active' && war.id && view === 'lobby') {
      setActiveWarId(war.id);
      setView('battle');
    }
  }, [war?.status, war?.id, view]);

  // Verificar se já está numa sala ao carregar
  useEffect(() => {
    if (!clanData || rooms.length === 0 || !user || !supabase) return;
    const myRoom = rooms.find(r => r.clan_a_id === clanData.id || r.clan_b_id === clanData.id);
    if (!myRoom || !myRoom.war_id) return;

    // Só redireciona automaticamente se o usuário já é membro da guerra
    // Se não for membro, fica na tela de rooms para ver o convite pendente
    supabase
      .from('clan_war_members')
      .select('id')
      .eq('war_id', myRoom.war_id)
      .eq('player_id', user.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setCurrentRoom(myRoom.id);
          setActiveWarId(myRoom.war_id);
          setView(myRoom.status === 'active' ? 'battle' : 'lobby');
        }
        // Se não é membro da guerra, permanece na tela de rooms
        // e o banner de convite pendente ficará visível
      });
  }, [clanData, rooms, user, supabase]);

  const handleOpenRoom = async (roomId: number) => {
    if (!supabase || !clanData || !user) return;
    // Criar guerra
    const { data: warData, error } = await supabase.from('clan_wars').insert({
      room_id: roomId,
      clan_a_id: clanData.id,
      clan_a_name: clanData.name,
      status: 'lobby',
    }).select().single();

    if (error || !warData) {
      toast({ title: 'Erro ao abrir sala', description: error?.message, variant: 'destructive' });
      return;
    }

    // Atualizar sala
    await supabase.from('war_rooms').update({
      status: 'waiting',
      war_id: warData.id,
      clan_a_id: clanData.id,
      clan_a_name: clanData.name,
      opened_by: user.id,
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    }).eq('id', roomId);

    // Verificar HP mínimo
    const _stats1  = calculateFinalStats(userProfile);
    const _maxHp1  = _stats1?.maxHealth ?? 1;
    const _curHp1  = userProfile.current_health ?? _maxHp1;
    if ((_curHp1 / _maxHp1) < 0.5) {
      toast({ title: '❤️ HP insuficiente', description: `Você precisa de pelo menos 50% de HP para entrar na guerra. HP atual: ${Math.floor(_curHp1)}/${Math.floor(_maxHp1)} (${Math.floor((_curHp1/_maxHp1)*100)}%)`, variant: 'destructive' });
      return;
    }
    // Entrar como primeiro membro (líder — slot 1)
    const snapshot = createWarMemberSnapshot(userProfile, warData.id, clanData.id, 1);
    await supabase.from('clan_war_members').insert({ ...snapshot });

    setCurrentRoom(roomId);
    setActiveWarId(warData.id);
    setView('lobby');
    toast({ title: `Sala ${roomId} aberta!`, description: 'Convide seus membros.' });
  };

  const handleAcceptInvite = async (invite: any) => {
    if (!supabase || !clanData || !userProfile) return;
    // Aceitar convite
    await supabase.from('clan_war_invites').update({ status: 'accepted' }).eq('id', invite.id);

    // Pegar slot disponível
    const { data: existingMembers } = await supabase
      .from('clan_war_members').select('slot')
      .eq('war_id', invite.war_id).eq('clan_id', invite.clan_id);
    const usedSlots = (existingMembers || []).map((m: any) => m.slot);
    let slot = 1;
    while (usedSlots.includes(slot)) slot++;

    // Verificar HP mínimo
    const _stats2  = calculateFinalStats(userProfile);
    const _maxHp2  = _stats2?.maxHealth ?? 1;
    const _curHp2  = userProfile.current_health ?? _maxHp2;
    if ((_curHp2 / _maxHp2) < 0.5) {
      toast({ title: '❤️ HP insuficiente', description: `Você precisa de pelo menos 50% de HP para entrar na guerra. HP atual: ${Math.floor(_curHp2)}/${Math.floor(_maxHp2)} (${Math.floor((_curHp2/_maxHp2)*100)}%)`, variant: 'destructive' });
      return;
    }
    const snapshot = createWarMemberSnapshot(userProfile, invite.war_id, invite.clan_id, slot);
    const { error } = await supabase.from('clan_war_members').insert({ ...snapshot });

    if (!error) {
      setCurrentRoom(invite.room_id);
      setActiveWarId(invite.war_id);
      setView('lobby');
      refreshInvites();
      toast({ title: 'Você entrou na guerra!' });
    }
  };

  const handleLeave = async () => {
    if (supabase && activeWarId && user) {
      // Remover o jogador da guerra
      await supabase.from('clan_war_members')
        .delete()
        .eq('war_id', activeWarId)
        .eq('player_id', user.id);

      // Se for líder, verificar se deve desfazer a sala
      if (userRole === 'Líder' && currentRoom) {
        const { data: warData } = await supabase
          .from('clan_wars').select('clan_b_id').eq('id', activeWarId).single();

        if (!warData?.clan_b_id) {
          // Nenhum clan adversário entrou ainda — desfazer tudo
          await supabase.from('clan_war_members').delete().eq('war_id', activeWarId);
          await supabase.from('clan_war_invites').delete().eq('war_id', activeWarId);
          await supabase.from('clan_wars').delete().eq('id', activeWarId);
          await supabase.from('war_spectators').delete().eq('room_id', currentRoom);
          await supabase.from('war_rooms').update({
            status: 'available',
            war_id: null,
            clan_a_id: null,
            clan_a_name: null,
            clan_b_id: null,
            clan_b_name: null,
            opened_by: null,
            expires_at: null,
          }).eq('id', currentRoom);
        }
      }
    }
    setCurrentRoom(null);
    setActiveWarId(null);
    setView('rooms');
  };

  // Notificação de convites pendentes
  useEffect(() => {
    if (myInvites.length > 0 && view === 'rooms') {
      toast({
        title: '⚔️ Convite de Guerra!',
        description: `${myInvites[0].player_name ? 'Você foi convidado' : 'Novo convite'} para a Guerra de Clãs`,
      });
    }
  }, [myInvites.length]);

  if (!userProfile || !clanData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!clanData.id) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-white/70">Você precisa estar em um clã para participar das guerras.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black p-4">
      {/* Convites pendentes */}
      {myInvites.length > 0 && view === 'rooms' && (
        <div className="max-w-2xl mx-auto mb-4">
          {myInvites.map(invite => (
            <div key={invite.id} className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">⚔️ Convite de Guerra!</p>
                <p className="text-xs text-white/60">Sala {invite.room_id} — {invite.clan_id}</p>
              </div>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-500"
                onClick={() => handleAcceptInvite(invite)}>
                Aceitar
              </Button>
            </div>
          ))}
        </div>
      )}

      {view === 'rooms' && (
        <RoomList
          rooms={rooms}
          userProfile={userProfile}
          clanData={clanData}
          userRole={userRole}
          onEnterRoom={async room => {
            if (!supabase || !clanData || !userProfile || !room.war_id) return;

            // Verificar se já é membro
            const { data: existing } = await supabase
              .from('clan_war_members')
              .select('id')
              .eq('war_id', room.war_id)
              .eq('player_id', user?.id)
              .single();

            if (!existing) {
              // Líder adversário aceitando o desafio — entrar no slot 1 do time B
              const { error: warError } = await supabase.from('clan_wars').update({
                clan_b_id: clanData.id,
                clan_b_name: clanData.name,
              }).eq('id', room.war_id);

              await supabase.from('war_rooms').update({
                clan_b_id: clanData.id,
                clan_b_name: clanData.name,
              }).eq('id', room.id);

              // Verificar HP mínimo
              const _stats3  = calculateFinalStats(userProfile);
              const _maxHp3  = _stats3?.maxHealth ?? 1;
              const _curHp3  = userProfile.current_health ?? _maxHp3;
              if ((_curHp3 / _maxHp3) < 0.5) {
                toast({ title: '❤️ HP insuficiente', description: `Você precisa de pelo menos 50% de HP para entrar na guerra. HP atual: ${Math.floor(_curHp3)}/${Math.floor(_maxHp3)} (${Math.floor((_curHp3/_maxHp3)*100)}%)`, variant: 'destructive' });
                return;
              }
              const snapshot = createWarMemberSnapshot(userProfile, room.war_id, clanData.id, 1);
              const { error } = await supabase.from('clan_war_members').insert({ ...snapshot });
              if (error) {
                toast({ title: 'Erro ao entrar na sala', description: error.message, variant: 'destructive' });
                return;
              }
              toast({ title: `Sala ${room.id} aceita!`, description: 'Convide seus membros.' });
            }

            setCurrentRoom(room.id);
            setActiveWarId(room.war_id);
            setView(room.status === 'active' ? 'battle' : 'lobby');
          }}
          onOpenRoom={handleOpenRoom}
          onSpectate={async (room) => {
            if (!room.war_id) return;
            const { error } = await joinAsSpectator(room.id);
            if (error) {
              toast({ title: 'Não foi possível entrar', description: error, variant: 'destructive' });
              return;
            }
            setSpectatorRoom(room);
            setView('spectator');
          }}
        />
      )}

      {view === 'spectator' && spectatorRoom && (
        <SpectatorView
          war={specWar}
          members={specMembers}
          turnLogs={specLogs}
          spectators={specList}
          room={spectatorRoom}
          onLeave={async () => {
            await leaveAsSpectator(spectatorRoom.id);
            setSpectatorRoom(null);
            setView('rooms');
          }}
        />
      )}

      {view === 'lobby' && currentRoom && (
        <WarLobby
          roomId={currentRoom}
          war={war}
          members={members}
          invites={invites}
          userProfile={userProfile}
          clanData={clanData}
          userRole={userRole}
          supabase={supabase}
          onWarStart={() => setView('battle')}
          onLeave={handleLeave}
        />
      )}

      {view === 'battle' && activeWarId && (
        <ActiveBattle warId={activeWarId} userProfile={userProfile} clanData={clanData} />
      )}
    </div>
  );
}