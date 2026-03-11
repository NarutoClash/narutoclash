'use client';

import { useState, useEffect } from 'react';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Swords, Search, Trophy, Clock,
  ChevronRight, X, Check, Radar, Users, Zap,
} from 'lucide-react';
import { usePVPChallenges, usePVPBattles, usePVPActions, useMatchmaking } from '@/lib/pvp/use-pvp';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { cn } from '@/lib/utils';

function getPVPTier(points: number) {
  if (points >= 2000) return { label: 'Kage',      color: '#f59e0b', emoji: '👑' };
  if (points >= 1600) return { label: 'Jōnin',     color: '#8b5cf6', emoji: '⚡' };
  if (points >= 1300) return { label: 'Chūnin',    color: '#3b82f6', emoji: '🔵' };
  if (points >= 1100) return { label: 'Genin',     color: '#22c55e', emoji: '🟢' };
  return                      { label: 'Acadêmico', color: '#94a3b8', emoji: '⚪' };
}

function phaseLabel(phase: 1 | 2 | 3) {
  if (phase === 1) return '±200 pts Elo · Mesmo rank';
  if (phase === 2) return '±400 pts Elo · Qualquer rank';
  return                  '±800 pts Elo · Busca ampla';
}

export default function BatalharPage() {
  const { user, supabase } = useSupabase();

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);
  const { data: userProfile } = useDoc(userProfileRef);

  const { challenges, refresh: refreshChallenges } = usePVPChallenges(supabase, user?.id);
  const { battles,   refresh: refreshBattles }     = usePVPBattles(supabase, user?.id);
  const { sendChallenge, acceptChallenge, declineChallenge } = usePVPActions(supabase, user?.id);
  const mm = useMatchmaking(supabase, user?.id, userProfile);

  const [tab,           setTab]           = useState<'queue' | 'direct'>('queue');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching,     setSearching]     = useState(false);
  const [ranking,       setRanking]       = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    if (mm.status === 'matched' && mm.matchedBattleId) {
      showToast('Match encontrado! Iniciando batalha...', 'success');
      setTimeout(() => { window.location.href = `/batalhar/${mm.matchedBattleId}`; }, 800);
    }
  }, [mm.status, mm.matchedBattleId]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('pvp_ranking').select('*').limit(10)
      .then(({ data }: any) => setRanking(data || []));
  }, [supabase]);

  const handleSearch = async () => {
    if (!supabase || !searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id,name,level,avatar_url,pvp_points,pvp_wins,pvp_losses')
      .ilike('name', `%${searchQuery}%`)
      .neq('id', user?.id)
      .limit(8);
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleChallenge = async (opponent: any) => {
    if (hpTooLow) {
      showToast(`HP insuficiente (${myHpPct}%). Cure-se antes de batalhar.`, 'error');
      return;
    }
    setLoadingAction(`challenge_${opponent.id}`);
    const { error } = await sendChallenge(opponent.id);
    if (error) showToast((error as any).message || 'Erro ao enviar desafio', 'error');
    else       showToast(`Desafio enviado para ${opponent.name}!`);
    setLoadingAction(null);
  };

  const handleAccept = async (challenge: any) => {
    if (!userProfile) { showToast('Perfil não carregado.', 'error'); return; }
    if (hpTooLow) {
      showToast(`HP insuficiente (${myHpPct}%). Cure-se antes de batalhar.`, 'error');
      return;
    }
    setLoadingAction(`accept_${challenge.id}`);
    const { data, error } = await acceptChallenge(challenge.id, challenge.challenger, userProfile);
    if (error) {
      showToast((error as any).message || 'Erro ao aceitar desafio', 'error');
    } else {
      const battleId = typeof data === 'string' ? data : (data?.id ?? String(data));
      showToast('Batalha iniciada!');
      refreshBattles();
      window.location.href = `/batalhar/${battleId}`;
    }
    setLoadingAction(null);
  };

  const handleDecline = async (challengeId: string) => {
    setLoadingAction(`decline_${challengeId}`);
    await declineChallenge(challengeId);
    refreshChallenges();
    setLoadingAction(null);
  };

  const myPoints = (userProfile as any)?.pvp_points ?? 1000;
  const myTier   = getPVPTier(myPoints);

  // ── Verificação de HP mínimo (50%) para entrar em batalha ────────────────
  const calcStats   = userProfile ? calculateFinalStats(userProfile) : null;
  const myMaxHp     = calcStats?.maxHealth ?? null;
  const myCurHp     = (userProfile as any)?.current_health ?? null;
  const myHpPct     = (myMaxHp && myCurHp != null) ? Math.floor((myCurHp / myMaxHp) * 100) : 100;
  const hpTooLow    = myMaxHp != null && myCurHp != null && myHpPct < 50;

  return (
    <div className="space-y-6 pb-10">

      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
        )}>
          {toast.msg}
        </div>
      )}

      <PageHeader title="Arena PVP" description="Desafie outros ninjas e prove seu valor em combate por turnos." />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-amber-950/40 to-amber-900/20 border-amber-500/30">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-black text-amber-400">{myPoints}</p>
            <p className="text-xs text-muted-foreground">Pontos PVP</p>
            <Badge style={{ backgroundColor: myTier.color + '33', color: myTier.color }} className="mt-1 text-xs border-0">
              {myTier.emoji} {myTier.label}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-950/40 to-green-900/20 border-green-500/30">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-black text-green-400">{(userProfile as any)?.pvp_wins ?? 0}</p>
            <p className="text-xs text-muted-foreground">Vitórias</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-950/40 to-red-900/20 border-red-500/30">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-black text-red-400">{(userProfile as any)?.pvp_losses ?? 0}</p>
            <p className="text-xs text-muted-foreground">Derrotas</p>
          </CardContent>
        </Card>
      </div>

      {/* Desafios recebidos */}
      {challenges.length > 0 && (
        <Card className="border-2 border-orange-500/40 bg-orange-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Swords className="h-4 w-4 text-orange-400" />
              Desafios Recebidos
              <Badge variant="destructive" className="ml-auto">{challenges.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {challenges.map((ch: any) => (
              <div key={ch.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/50">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={ch.challenger?.avatar_url} />
                  <AvatarFallback>{ch.challenger?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ch.challenger?.name}</p>
                  <p className="text-xs text-muted-foreground">Nv {ch.challenger?.level} · {ch.challenger?.pvp_points ?? 1000} pts</p>
                </div>
                <Button size="sm" className="h-7 px-3 bg-green-600 hover:bg-green-500 text-white shrink-0"
                  disabled={loadingAction === `accept_${ch.id}`} onClick={() => handleAccept(ch)}>
                  {loadingAction === `accept_${ch.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="destructive" className="h-7 px-3 shrink-0"
                  disabled={loadingAction === `decline_${ch.id}`} onClick={() => handleDecline(ch.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Batalhas ativas */}
      {battles.length > 0 && (
        <Card className="border-2 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Batalhas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {battles.map((b: any) => {
              const isMyTurn = b.current_turn_user_id === user?.id;
              const opponent = b.challenger_id === user?.id ? b.opponent : b.challenger;
              return (
                <button key={b.id} onClick={() => window.location.href = `/batalhar/${b.id}`}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-all text-left">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={opponent?.avatar_url} />
                    <AvatarFallback>{opponent?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">vs {opponent?.name}</p>
                    <p className="text-xs text-muted-foreground">Turno {b.state?.currentTurn || 1}</p>
                  </div>
                  {isMyTurn
                    ? <Badge className="bg-orange-500 text-white text-xs animate-pulse shrink-0">Sua vez!</Badge>
                    : <Badge variant="secondary" className="text-xs shrink-0">Aguardando</Badge>
                  }
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Abas */}
      <div className="flex gap-2 rounded-xl bg-muted/40 p-1 border border-border/40">
        <button onClick={() => setTab('queue')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
            tab === 'queue' ? 'bg-background shadow-sm text-foreground border border-border/60' : 'text-muted-foreground hover:text-foreground',
          )}>
          <Radar className="h-4 w-4" /> Procurar Partida
        </button>
        <button onClick={() => setTab('direct')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
            tab === 'direct' ? 'bg-background shadow-sm text-foreground border border-border/60' : 'text-muted-foreground hover:text-foreground',
          )}>
          <Users className="h-4 w-4" /> Desafio Direto
        </button>
      </div>

      {/* ABA FILA */}
      {tab === 'queue' && (
        <Card className={cn(
          'border-2 transition-colors',
          mm.status === 'searching' && 'border-primary/50 bg-primary/5',
          mm.status === 'matched'   && 'border-green-500/60 bg-green-500/5',
          mm.status === 'error'     && 'border-red-500/40',
          mm.status === 'idle'      && 'border-border/40',
        )}>
          <CardContent className="pt-6 pb-6">

            {mm.status === 'idle' && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Radar className="h-9 w-9 text-primary/70" />
                </div>
                <div>
                  <p className="font-bold text-base">Procurar Partida Automática</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entre na fila e conectaremos você a outro ninja que também está procurando.
                    A batalha começa assim que o match for encontrado.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 w-full space-y-0.5">
                  <p className="font-semibold mb-1">Matchmaking por Elo:</p>
                  <p>0–60s → ±200 pts · mesmo rank</p>
                  <p>60–120s → ±400 pts · qualquer rank</p>
                  <p>120s+ → ±800 pts · busca ampla</p>
                </div>
                {hpTooLow && (
                  <div className="w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
                    ❤️ Você precisa ter pelo menos <strong>50% de HP</strong> para batalhar.
                    <div className="mt-1 text-xs text-red-300/80">
                      HP atual: {myCurHp}/{myMaxHp} ({myHpPct}%) — vá ao Status e use um item de cura.
                    </div>
                  </div>
                )}
                <Button size="lg" className="w-full font-bold gap-2" onClick={mm.joinQueue} disabled={!userProfile || hpTooLow}>
                  <Zap className="h-4 w-4" /> Entrar na Fila
                </Button>
              </div>
            )}

            {mm.status === 'searching' && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <span className="absolute inset-2 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  <div className="relative w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/50 flex items-center justify-center">
                    <Radar className="h-7 w-7 text-primary animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-base">Procurando oponente...</p>
                  <p className="text-3xl font-black text-primary mt-1">{mm.waitSeconds}s</p>
                  <p className="text-xs text-muted-foreground mt-1">Fase {mm.phase} · {phaseLabel(mm.phase)}</p>
                </div>
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Fase 1</span><span>Fase 2</span><span>Fase 3</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((mm.waitSeconds / 120) * 100, 100)}%` }} />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={mm.leaveQueue}>
                  <X className="h-3 w-3 mr-2" /> Cancelar busca
                </Button>
              </div>
            )}

            {mm.status === 'matched' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                  <Swords className="h-9 w-9 text-green-400 animate-bounce" />
                </div>
                <div>
                  <p className="font-black text-lg text-green-400">Match encontrado!</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecionando para a batalha...</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-green-400" />
              </div>
            )}

            {mm.status === 'error' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-red-400 text-sm">{mm.error || 'Erro ao entrar na fila'}</p>
                <Button variant="outline" size="sm" onClick={mm.joinQueue}>Tentar novamente</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ABA DESAFIO DIRETO */}
      {tab === 'direct' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" /> Desafiar Ninja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Buscar por nome..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} className="h-9" />
              <Button size="sm" onClick={handleSearch} disabled={searching} className="shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((p: any) => {
                  const tier = getPVPTier(p.pvp_points ?? 1000);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={p.avatar_url} />
                        <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Nv {p.level} · {tier.emoji} {tier.label} ({p.pvp_points ?? 1000} pts)</p>
                      </div>
                      <Button size="sm" className="h-7 px-3 shrink-0"
                        disabled={loadingAction === `challenge_${p.id}`} onClick={() => handleChallenge(p)}>
                        {loadingAction === `challenge_${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <><Swords className="h-3 w-3 mr-1" />Desafiar</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhum ninja encontrado.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" /> Ranking PVP
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0
            ? <p className="text-xs text-muted-foreground text-center py-4">Nenhuma batalha registrada ainda.</p>
            : (
              <div className="space-y-1">
                {ranking.map((r: any, i: number) => {
                  const tier = getPVPTier(r.pvp_points ?? 1000);
                  const isMe = r.id === user?.id;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={r.id} className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isMe ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30',
                    )}>
                      <span className="text-sm font-black w-6 text-center shrink-0">{i < 3 ? medals[i] : `${i+1}°`}</span>
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={r.avatar_url} />
                        <AvatarFallback className="text-xs">{r.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{r.name} {isMe && <span className="text-primary">(você)</span>}</p>
                        <p className="text-xs text-muted-foreground">{r.pvp_wins}V · {r.pvp_losses}D · {r.win_rate}%</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: tier.color }}>{r.pvp_points}</p>
                        <p className="text-xs text-muted-foreground">{tier.emoji} {tier.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}