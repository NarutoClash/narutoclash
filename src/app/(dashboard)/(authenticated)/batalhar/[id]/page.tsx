'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Swords, Zap, Shield, BatteryCharging,
  Heart, Eye, Flame, ArrowLeft, Sparkles,
} from 'lucide-react';
import { usePVPBattle, usePVPActions, useTurnCountdown } from '@/lib/pvp/use-pvp';
import { getAvailableActions, processPVPTurn, calcRewards } from '@/lib/pvp/pvp-engine';
import { PVPActionType, PVPBattleState, PVPTurnLogEntry, ACTION_COOLDOWNS } from '@/lib/pvp/pvp-types';
import { cn } from '@/lib/utils';
import { BuildEffect } from '@/lib/battle-system/types';

const ACTION_ICONS: Record<PVPActionType, React.ReactNode> = {
  taijutsu:    <Swords          className="h-5 w-5" />,
  ninjutsu:    <Zap             className="h-5 w-5 text-blue-400" />,
  genjutsu:    <Eye             className="h-5 w-5 text-purple-400" />,
  defend:      <Shield          className="h-5 w-5 text-green-400" />,
  charge:      <BatteryCharging className="h-5 w-5 text-amber-400" />,
  doujutsu:    <Eye             className="h-5 w-5 text-red-400" />,
  cursed_seal: <Flame           className="h-5 w-5 text-orange-400" />,
  summon:      <Sparkles        className="h-5 w-5 text-pink-400" />,
};
const ACTION_LABELS: Record<PVPActionType, string> = {
  taijutsu: 'Taijutsu', ninjutsu: 'Ninjutsu', genjutsu: 'Genjutsu', defend: 'Defender',
  charge: 'Chakra', doujutsu: 'Dōjutsu', cursed_seal: 'Selo', summon: 'Invocar',
};
const ACTION_CHAKRA: Record<PVPActionType, number> = {
  taijutsu: 0, ninjutsu: 30, genjutsu: 25, defend: 10,
  charge: 0, doujutsu: 0, cursed_seal: 0, summon: 50,
};

function HealthBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const bar = pct > 50 ? color : pct > 25 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative h-3 rounded-full overflow-hidden bg-black/40">
      <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: bar, boxShadow: `0 0 8px ${bar}80` }} />
    </div>
  );
}

function CountdownRing({ seconds, total = 30 }: { seconds: number; total?: number }) {
  const r = 20, circ = 2 * Math.PI * r, pct = Math.min(1, seconds / total);
  const color = seconds > 15 ? '#22c55e' : seconds > 8 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="absolute rotate-[-90deg]" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ffffff10" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s' }} />
      </svg>
      <span className="text-lg font-black" style={{ color }}>{seconds}</span>
    </div>
  );
}

// ── Helpers visuais (mesmo estilo do battle-report.tsx) ─────────────────────

const DAMAGE_EFFECT_TYPES = new Set([
  'burn_damage', 'item_veneno', 'item_veneno_tick', 'item_queimadura',
  'item_paralisia', 'item_refletir', 'barrier_blocked', 'item_barreira_absorveu',
  'burn_applied', 'paralysis_skipped', 'weaken_applied',
]);
const HEAL_EFFECT_TYPES = new Set([
  'regen', 'item_regeneracao', 'item_lifesteal', 'survived_death',
]);

function EffectTag({ effect }: { effect: BuildEffect }) {
  const isDamage = DAMAGE_EFFECT_TYPES.has(effect.type);
  const isHeal   = HEAL_EFFECT_TYPES.has(effect.type);
  const color  = isDamage ? '#ef4444' : isHeal ? '#22c55e' : (effect.color || '#ffcc00');
  const prefix = isDamage ? '-' : '+';
  const showValue = effect.value != null && effect.value > 0 && (isDamage || isHeal);
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}33` }}>
      <span>{effect.label}</span>
      {showValue && <span className="font-bold opacity-90">{prefix}{Math.round(effect.value!)}</span>}
    </div>
  );
}

function HpBar({ pct }: { pct: number }) {
  const safe = Math.max(0, Math.min(100, pct));
  const color = safe > 60 ? '#22c55e' : safe > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${safe}%`, backgroundColor: color }} />
    </div>
  );
}

function PvPFighterCard({
  side, name, data, healthAfter, maxHealth,
}: {
  side: 'mine' | 'theirs';
  name: string;
  data: PVPTurnLogEntry['challenger'];
  healthAfter: number;
  maxHealth: number;
}) {
  const isMe = side === 'mine';
  const borderColor = isMe ? '#facc15' : '#f87171';
  const icon = isMe ? '🔵' : '🔴';
  const attackTypeColor =
    data.attackType === 'ninjutsu' ? '#60a5fa' :
    data.attackType === 'genjutsu' ? '#c084fc' :
    data.attackType === 'taijutsu' ? '#fb923c' : '#94a3b8';

  return (
    <div className="rounded-lg p-2.5 flex flex-col gap-1.5"
      style={{ background: '#0e090088', borderLeft: `3px solid ${borderColor}` }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-xs font-bold" style={{ color: borderColor }}>{icon} {name}</span>
        {data.attackType && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: `${attackTypeColor}22`, color: attackTypeColor }}>
            {ACTION_LABELS[data.action as PVPActionType] || data.action}
          </span>
        )}
      </div>

      {/* GIF do jutsu */}
      {data.jutsuGif && (
        <div className="flex justify-center">
          <img src={data.jutsuGif} alt={data.jutsuUsed || 'jutsu'}
            className="w-24 h-24 rounded-lg object-cover border-2"
            style={{ borderColor }}
            loading="lazy" />
        </div>
      )}

      {/* Nome do jutsu */}
      {data.jutsuUsed && (
        <p className="text-xs font-bold" style={{ color: borderColor }}>{data.jutsuUsed}</p>
      )}

      {/* Log de texto */}
      <p className="text-[11px] text-[#a87800] font-mono leading-snug">{data.logText}</p>

      {/* Dano total */}
      {data.totalDamage > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-base font-black" style={{ color: borderColor }}>
            💥 {Math.round(data.totalDamage)}
          </span>
          {data.isCritical && (
            <span className="text-[10px] font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded">
              CRÍTICO ×1.5
            </span>
          )}
        </div>
      )}

      {/* Segundo hit */}
      {data.secondHit && (
        <div className="text-xs font-semibold text-emerald-400">
          ➕ {data.secondHit.jutsuName}: +{Math.round(data.secondHit.damage)} dmg
        </div>
      )}

      {/* Efeitos de build/passiva */}
      {data.buildEffects?.length > 0 && (
        <div className="flex flex-col gap-1">
          {data.buildEffects.map((ef, i) => <EffectTag key={i} effect={ef} />)}
        </div>
      )}

      {/* HP bar */}
      <div className="mt-1">
        <div className="flex justify-between text-[10px] mb-0.5" style={{ color: borderColor }}>
          <span>{name}</span>
          <span className="font-mono">{Math.max(0, Math.round(healthAfter))} HP</span>
        </div>
        <HpBar pct={(healthAfter / maxHealth) * 100} />
      </div>
    </div>
  );
}

function LogEntry({ entry, myId, challengerId, challengerName, opponentName, challengerMaxHp, opponentMaxHp }: {
  entry: PVPTurnLogEntry;
  myId: string;
  challengerId: string;
  challengerName: string;
  opponentName: string;
  challengerMaxHp: number;
  opponentMaxHp: number;
}) {
  const iAmChallenger = challengerId === myId;
  const mySide   = iAmChallenger ? 'mine' : 'theirs';
  const theirSide = iAmChallenger ? 'theirs' : 'mine';
  const myData    = iAmChallenger ? entry.challenger : entry.opponent;
  const theirData = iAmChallenger ? entry.opponent   : entry.challenger;
  const myName    = iAmChallenger ? challengerName   : opponentName;
  const theirName = iAmChallenger ? opponentName     : challengerName;
  const myMaxHp   = iAmChallenger ? challengerMaxHp  : opponentMaxHp;
  const theirMaxHp = iAmChallenger ? opponentMaxHp   : challengerMaxHp;
  const myHpAfter    = iAmChallenger ? entry.challengerHealthAfter : entry.opponentHealthAfter;
  const theirHpAfter = iAmChallenger ? entry.opponentHealthAfter   : entry.challengerHealthAfter;

  return (
    <div className="rounded-lg overflow-hidden mb-2 last:mb-0"
      style={{ background: '#0e090088', border: '1px solid #ffcc0022' }}>
      {/* Cabeçalho do turno */}
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: 'linear-gradient(90deg, #1a120888, #0e090088)', borderBottom: '1px solid #ffcc0022' }}>
        <span className="text-xs font-mono font-bold text-[#ffcc00]">⚔️ Turno {entry.turn}</span>
        <span className="text-[10px] text-[#7a5c12] font-mono">
          Simultâneo
        </span>
      </div>

      {/* Dois combatentes lado a lado */}
      <div className="grid grid-cols-2 gap-2 p-2">
        <PvPFighterCard side={mySide}    name={myName}    data={myData}    healthAfter={myHpAfter}    maxHealth={myMaxHp} />
        <PvPFighterCard side={theirSide} name={theirName} data={theirData} healthAfter={theirHpAfter} maxHealth={theirMaxHp} />
      </div>
    </div>
  );
}

export default function PVPBattlePage() {
  const params = useParams<{ id: string }>();
  const { user, supabase } = useSupabase();

  const { battle, loading, error: battleError } = usePVPBattle(supabase, params.id);
  const { submitAction } = usePVPActions(supabase, user?.id);

  const [selectedAction, setSelectedAction] = useState<PVPActionType | null>(null);
  const [showResult,     setShowResult]      = useState(false);
  const [resolving,      setResolving]       = useState(false);
  const logTopRef    = useRef<HTMLDivElement>(null);
  const resolvedRef = useRef<string>('');

  const countdown = useTurnCountdown(battle?.turn_deadline);

  const isChallenger = battle?.challenger_id === user?.id;
  const myPending    = isChallenger ? battle?.pending_challenger_action : battle?.pending_opponent_action;
  const enemyPending = isChallenger ? battle?.pending_opponent_action  : battle?.pending_challenger_action;
  const submitted    = !!myPending;

  // ── Heartbeat ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !user?.id || !battle?.id) return;
    if (battle.status === 'finished') return;
    const ping = async () => {
      await supabase.rpc('pvp_heartbeat', { p_battle_id: battle.id, p_user_id: user.id });
    };
    ping();
    const id = setInterval(ping, 4000);
    return () => clearInterval(id);
  }, [supabase, user?.id, battle?.id, battle?.status]);

  // ── Limpar highlight quando muda turno ────────────────────────────────────
  useEffect(() => {
    setSelectedAction(null);
  }, [battle?.turn_number]);

  // ── Scroll log: sempre mostra o último turno (topo da lista invertida) ──
  useEffect(() => {
    logTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battle?.state?.log?.length]);

  // ── Resultado final ────────────────────────────────────────────────────────
  useEffect(() => {
    if (battle?.status === 'finished' && !showResult) setTimeout(() => setShowResult(true), 600);
  }, [battle?.status]);

  // ── Resolução do turno ─────────────────────────────────────────────────────
  const resolveTurn = useCallback(async () => {
    if (!battle || !supabase || resolving) return;
    if (battle.status === 'finished') return;
    if (!isChallenger) return;

    const key = `${battle.turn_number}_${battle.turn_deadline}`;
    if (resolvedRef.current === key) return;

    const { data: fresh } = await supabase
      .from('pvp_battles').select('*').eq('id', battle.id).single();

    if (!fresh || fresh.status === 'finished' || !fresh.turn_deadline) return;

    const deadlinePassed = new Date(fresh.turn_deadline).getTime() <= Date.now() + 500;
    const bothChose = fresh.pending_challenger_action && fresh.pending_opponent_action;
    if (!deadlinePassed && !bothChose) return;

    resolvedRef.current = key;
    setResolving(true);

    const chalAction = (fresh.pending_challenger_action || 'taijutsu') as PVPActionType;
    const oppAction  = (fresh.pending_opponent_action   || 'taijutsu') as PVPActionType;
    const rawState   = typeof fresh.state === 'string' ? JSON.parse(fresh.state) : fresh.state;
    const newState   = processPVPTurn(rawState, chalAction, oppAction);
    const finished   = newState.status === 'finished';

    if (finished) {
      // Buscar pontos PVP atuais dos dois jogadores para o cálculo Elo
      const isWinnerChallenger = newState.winnerId === fresh.challenger_id;
      const winnerId = newState.winnerId;
      const loserId  = isWinnerChallenger ? fresh.opponent_id : fresh.challenger_id;

      const [{ data: winnerProfile }, { data: loserProfile }] = await Promise.all([
        supabase.from('profiles').select('pvp_points').eq('id', winnerId).single(),
        supabase.from('profiles').select('pvp_points').eq('id', loserId).single(),
      ]);

      const winnerPts = winnerProfile?.pvp_points ?? 1000;
      const loserPts  = loserProfile?.pvp_points  ?? 1000;
      const rewards   = calcRewards(winnerPts, loserPts);

      // HP final de cada jogador ao fim da batalha
      const isWinnerChal = newState.winnerId === fresh.challenger_id;
      const chalFinalHp  = newState.challenger?.currentHealth ?? 0;
      const oppFinalHp   = newState.opponent?.currentHealth   ?? 0;
      const winnerFinalHp = isWinnerChal ? chalFinalHp : oppFinalHp;
      const loserFinalHp  = isWinnerChal ? oppFinalHp  : chalFinalHp;
      // Vencedor mantém o HP que sobrou; perdedor fica com 1
      const winnerHpSave = Math.max(1, winnerFinalHp);
      const loserHpSave  = 1;

      await Promise.all([
        supabase.rpc('pvp_advance_turn', {
          p_battle_id: battle.id, p_new_state: newState,
          p_finished: true, p_winner_id: winnerId,
        }),
        supabase.rpc('pvp_apply_rewards', {
          p_winner_id:    winnerId,
          p_loser_id:     loserId,
          p_xp:           0,
          p_ryo:          0,
          p_pvp_points:   rewards.pvpPoints,
          p_loser_loss:   rewards.loserLoss,
        }),
        supabase.from('pvp_battles').update({
          xp_reward: 0, ryo_reward: 0, pvp_points_change: rewards.pvpPoints,
        }).eq('id', battle.id),
        // Salvar HP persistente após a batalha
        supabase.from('profiles').update({ current_health: winnerHpSave }).eq('id', winnerId),
        supabase.from('profiles').update({ current_health: loserHpSave  }).eq('id', loserId),
      ]);
    } else {
      await supabase.rpc('pvp_advance_turn', {
        p_battle_id: battle.id, p_new_state: newState, p_finished: false,
      });
    }

    setResolving(false);
  }, [battle, supabase, resolving, isChallenger]);

  useEffect(() => {
    if (countdown === 0 && battle?.status === 'active') resolveTurn();
  }, [countdown]);

  useEffect(() => {
    if (
      battle?.pending_challenger_action &&
      battle?.pending_opponent_action &&
      battle.status === 'active'
    ) resolveTurn();
  }, [battle?.pending_challenger_action, battle?.pending_opponent_action]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (battleError || (!loading && !battle)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <p className="text-4xl">⚠️</p>
          <p className="font-bold text-lg">Batalha não encontrada</p>
          <p className="text-muted-foreground text-sm">{battleError || 'Esta batalha não existe.'}</p>
          <a href="/batalhar"><Button className="w-full"><ArrowLeft className="h-4 w-4 mr-2" />Voltar à Arena</Button></a>
        </div>
      </div>
    );
  }

  const bs: PVPBattleState = battle.state;
  const myFighter      = isChallenger ? bs.challenger : bs.opponent;
  const enemyFighter   = isChallenger ? bs.opponent   : bs.challenger;
  const currentTurn    = bs.currentTurn;
  const availableActs  = getAvailableActions(myFighter, currentTurn);
  const battleFinished = battle.status === 'finished';
  const waitingForBoth = battle.status === 'waiting';
  const iWon           = battle.winner_id === user?.id;

  const handleSelect = async (action: PVPActionType) => {
    if (submitted || battleFinished || waitingForBoth) return;
    setSelectedAction(action);
    await submitAction(battle, action);
  };

  return (
    <div className="space-y-4 pb-10 max-w-2xl mx-auto">

      <div className="flex items-center gap-3">
        <a href="/batalhar">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />Arena
          </Button>
        </a>
        <div className="flex-1 text-center">
          <span className="text-xs text-muted-foreground">Turno {currentTurn}</span>
        </div>
        {!battleFinished && !waitingForBoth && (
          <Badge className={cn('text-xs', submitted ? 'bg-blue-500' : 'bg-orange-500 animate-pulse')}>
            {submitted ? '✅ Aguardando' : '⚔️ Escolha!'}
          </Badge>
        )}
        {resolving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {waitingForBoth && (
        <Card className="border-2 border-amber-500/40 bg-amber-950/10">
          <CardContent className="pt-4 pb-4 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
            <p className="font-bold text-amber-300">Aguardando oponente entrar...</p>
            <div className="flex justify-center gap-8">
              {[
                { name: (battle as any).challenger?.name || 'Desafiante', online: battle.challenger_online },
                { name: (battle as any).opponent?.name   || 'Oponente',   online: battle.opponent_online  },
              ].map(({ name, online }) => (
                <span key={name} className={cn('flex items-center gap-2 text-sm', online ? 'text-green-400' : 'text-muted-foreground')}>
                  <span className={cn('w-2.5 h-2.5 rounded-full', online ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground')} />
                  {name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">O timer inicia quando os dois estiverem aqui</p>
          </CardContent>
        </Card>
      )}

      {battleFinished && showResult && (
        <div className={cn('rounded-2xl p-6 text-center border-2 space-y-3 animate-in fade-in zoom-in duration-500',
          iWon ? 'bg-gradient-to-br from-amber-950/40 to-yellow-900/20 border-amber-500'
               : 'bg-gradient-to-br from-red-950/40 to-red-900/20 border-red-500')}>
          <p className="text-5xl">{iWon ? '🏆' : '💀'}</p>
          <p className="text-2xl font-black">{iWon ? 'VITÓRIA!' : 'DERROTA'}</p>
          <div className="flex justify-center gap-4 text-sm font-bold">
            {iWon
              ? <span className="text-green-400">+{battle.pvp_points_change} pts PVP</span>
              : <span className="text-red-400">-{battle.pvp_points_change} pts PVP</span>
            }
          </div>
          <a href="/batalhar"><Button className="w-full mt-2">Voltar à Arena</Button></a>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { fighter: myFighter,    color: '#22c55e', label: 'Você',     pending: myPending,    border: 'border-primary/60' },
          { fighter: enemyFighter, color: '#ef4444', label: 'Oponente', pending: enemyPending, border: 'border-red-500/30'  },
        ].map(({ fighter, color, label, pending, border }) => (
          <Card key={label} className={cn('border-2', border)}>
            <CardContent className="pt-3 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={fighter.snapshot.avatar_url} />
                  <AvatarFallback className="text-xs">{fighter.snapshot.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{fighter.snapshot.name}</p>
                  <p className="text-[10px] text-muted-foreground">Nv {fighter.snapshot.level} · {fighter.build}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5 text-red-400" />HP</span>
                  <span className="font-mono">{Math.max(0, fighter.currentHealth).toFixed(0)}/{fighter.maxHealth}</span>
                </div>
                <HealthBar current={fighter.currentHealth} max={fighter.maxHealth} color={color} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-blue-400" />Chakra</span>
                  <span className="font-mono">{Math.max(0, fighter.currentChakra)}/{fighter.maxChakra}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-black/40">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(fighter.currentChakra / fighter.maxChakra) * 100}%`, opacity: label === 'Oponente' ? 0.6 : 1 }} />
                </div>
              </div>
              {!battleFinished && !waitingForBoth && (
                <div className="text-[10px] font-semibold">
                  {pending
                    ? label === 'Você'
                      ? <span className="text-green-400">✅ {ACTION_LABELS[pending as PVPActionType] || pending}</span>
                      : <span className="text-green-400">✅ Pronto</span>
                    : <span className="text-amber-400 animate-pulse">⏳ Escolhendo...</span>}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {fighter.snapshot.doujutsu?.isActive && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">👁️ {fighter.snapshot.doujutsu.type}</span>
                )}
                {fighter.snapshot.cursedSeal?.isActive && (
                  <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">⚡ Selo Nv{fighter.snapshot.cursedSeal.level}</span>
                )}
                {fighter.isDefending && (
                  <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold">🛡️ Defendendo</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!battleFinished && !waitingForBoth && (
        <Card className={cn('border', submitted ? 'border-blue-500/30' : 'border-primary/40')}>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-muted-foreground">
                {submitted
                  ? `✅ ${ACTION_LABELS[(selectedAction ?? myPending) as PVPActionType] ?? myPending} — aguardando...`
                  : '⚔️ Escolha sua ação agora!'}
              </CardTitle>
              <CountdownRing seconds={countdown} total={30} />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2 pb-3">
            {(Object.keys(ACTION_LABELS) as PVPActionType[]).map(action => {
              const available  = availableActs.includes(action);
              const isSelected = (selectedAction ?? myPending) === action;
              const cdLeft     = (myFighter.cooldowns?.[action] ?? 0) - currentTurn;
              const onCooldown = cdLeft > 0;
              const isOneTime  = action === 'doujutsu' || action === 'cursed_seal' || action === 'summon';
              const usedOnce   = (action === 'doujutsu'    && myFighter.doujutsuUsed)   ||
                                 (action === 'cursed_seal' && myFighter.cursedSealUsed) ||
                                 (action === 'summon'      && myFighter.summonUsed);
              return (
                <button key={action} disabled={!available || submitted} onClick={() => handleSelect(action)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1',
                    'h-20 rounded-xl border-2 border-border/50 bg-background/50 transition-all duration-150 text-center',
                    available && !submitted ? 'cursor-pointer hover:scale-105 hover:border-primary/60 hover:bg-primary/5' : 'opacity-30 cursor-not-allowed',
                    isSelected && 'border-primary bg-primary/10 scale-105 ring-2 ring-primary/40',
                  )}>
                  {ACTION_ICONS[action]}
                  <span className="text-[10px] font-bold leading-tight">{ACTION_LABELS[action]}</span>
                  <span className="text-[9px] text-muted-foreground">{ACTION_CHAKRA[action] > 0 ? `${ACTION_CHAKRA[action]} ck` : 'grátis'}</span>
                  {onCooldown && <span className="absolute top-1 right-1 text-[8px] bg-red-500/30 text-red-400 px-1 rounded-full font-bold">{cdLeft}t</span>}
                  {isOneTime && !usedOnce && available && !onCooldown && <span className="absolute top-1 right-1 text-[8px] bg-primary/20 text-primary px-1 rounded-full">1x</span>}
                  {!onCooldown && !isOneTime && ACTION_COOLDOWNS[action] > 0 && available && (
                    <span className="absolute top-1 left-1 text-[8px] bg-muted/40 text-muted-foreground px-1 rounded-full">cd{ACTION_COOLDOWNS[action]}</span>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-muted-foreground">📜 Relatório de Combate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[28rem] overflow-y-auto pr-1"
          style={{ background: '#0a060088' }}>
          {/* Cabeçalho VS */}
          {bs.log.length > 0 && (
            <div className="rounded-lg p-3 mb-2 text-center"
              style={{ background: 'linear-gradient(135deg, #1a1208, #0e0900)', border: '1px solid #ffcc0044' }}>
              <p className="text-xs text-[#7a5c12] font-bold mb-2 tracking-widest">⚔️ PVP — DUELO</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-left">
                  <p className="font-black text-sm text-[#facc15]">{bs.challenger.snapshot.name}</p>
                  <p className="text-xs text-[#7a5c12]">Nível {bs.challenger.snapshot.level}</p>
                </div>
                <div className="text-[#ffcc00] font-black text-lg">⚡VS⚡</div>
                <div className="flex-1 text-right">
                  <p className="font-black text-sm text-red-400">{bs.opponent.snapshot.name}</p>
                  <p className="text-xs text-[#7a5c12]">Nível {bs.opponent.snapshot.level}</p>
                </div>
              </div>
            </div>
          )}
          <div ref={logTopRef} />
          {bs.log.length === 0
            ? <p className="text-xs text-muted-foreground text-center py-6">
                {waitingForBoth ? 'Aguardando ambos os jogadores...' : 'Batalha iniciada! Faça sua primeira escolha.'}
              </p>
            : bs.log.slice().reverse().map((entry, i) => (
                <LogEntry
                  key={i}
                  entry={entry}
                  myId={user!.id}
                  challengerId={battle.challenger_id}
                  challengerName={bs.challenger.snapshot.name}
                  opponentName={bs.opponent.snapshot.name}
                  challengerMaxHp={bs.challenger.maxHealth}
                  opponentMaxHp={bs.opponent.maxHealth}
                />
              ))
          }
        </CardContent>
      </Card>
    </div>
  );
}