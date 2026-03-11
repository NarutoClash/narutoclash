'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ScrollText, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateDamage, 
  calculateDynamicStats, 
  getRandomAttackType,
  detectBuild, getBuildInfo, emptyBattleState,
  buildLogEntry, calcLogStats,
} from '@/lib/battle-system';
import type { RichBattleLogEntry, BuildEffect } from '@/lib/battle-system';
import { BattleReport, BattleResult } from '@/components/battle-report';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';

type BattleLogEntry = RichBattleLogEntry;

const SEARCH_COOLDOWN_SECONDS = 10;

type ClanBattleSearchProps = {
  userProfile: any;
  supabase: any;
  userId: string;
};

export function ClanBattleSearch({ userProfile, supabase, userId }: ClanBattleSearchProps) {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [opponent, setOpponent] = useState<any | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [searchCooldown, setSearchCooldown] = useState<number>(0);

  useEffect(() => {
    const savedBattleData = localStorage.getItem('lastClanBattleReport');
    if (savedBattleData) {
      try {
        const { battleLog, winner, opponent } = JSON.parse(savedBattleData);
        setBattleLog(battleLog);
        setWinner(winner);
        setOpponent(opponent);
        setSearchCooldown(SEARCH_COOLDOWN_SECONDS);
        localStorage.removeItem('lastClanBattleReport');
        
        toast({
          title: 'Relatório de Batalha entre Clãs',
          description: 'Sua última batalha foi carregada.',
        });
      } catch (error) {
        console.error('Erro ao recuperar relatório:', error);
        localStorage.removeItem('lastClanBattleReport');
      }
    }
  }, [toast]);

  useEffect(() => {
    if (searchCooldown <= 0) return;
  
    const interval = setInterval(() => {
      setSearchCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (winner) {
            setTimeout(() => window.location.reload(), 0);
            return 1;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, [searchCooldown, winner]);

  const handleSearchClanOpponent = async () => {
    if (!userProfile || !supabase || !userId || !userProfile.clan_id) return;
    
    if (userProfile.active_mission) {
      toast({
        variant: 'destructive',
        title: 'Impossível Buscar Oponente',
        description: 'Você está em uma missão. Complete-a primeiro.',
      });
      return;
    }
    
    const currentHealth = userProfile.current_health ?? 0;
    if (currentHealth < 100) {
      toast({
        variant: 'destructive',
        title: 'Vida Insuficiente',
        description: `Você precisa de pelo menos 100 de vida. Você tem ${currentHealth}.`,
      });
      return;
    }
    
    const currentChakra = userProfile.current_chakra ?? userProfile.max_chakra ?? 150;
    if (currentChakra < 50) {
      toast({
        variant: 'destructive',
        title: 'Chakra Insuficiente',
        description: `Você precisa de 50 chakra. Você tem ${currentChakra}.`,
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      const minLevel = Math.max(1, userProfile.level - 10);
      const maxLevel = userProfile.level + 10;
      
      const { data: potentialOpponents, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, level, avatar_url, village, vitality, intelligence, taijutsu, ninjutsu, genjutsu, selo, element_levels, weapon_id, summon_id, chest_id, legs_id, feet_id, hands_id, cursed_seal, doujutsu, current_health, ryo, experience, clan_id, clan_name, jutsus')
        .neq('id', userId)
        .neq('clan_id', userProfile.clan_id)
        .not('clan_id', 'is', null)
        .gte('level', minLevel)
        .lte('level', maxLevel)
        .limit(20);
      
      if (fetchError) throw fetchError;
      
      if (!potentialOpponents || potentialOpponents.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum Oponente Encontrado',
          description: 'Não há ninjas de outros clãs disponíveis.',
        });
        setIsSearching(false);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * potentialOpponents.length);
      const selectedOpponent = potentialOpponents[randomIndex];
      
      setOpponent(selectedOpponent);
      
      const newChakra = Math.max(0, currentChakra - 50);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_chakra: newChakra })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Oponente Encontrado!',
        description: `Você encontrou ${selectedOpponent.name} do clã ${selectedOpponent.clan_name}!`,
      });
      
      setSearchCooldown(3);
      
      setTimeout(() => {
        handleClanBattle(selectedOpponent);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao buscar oponente:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Tente novamente.',
      });
      setIsSearching(false);
    }
  };

  const handleClanBattle = async (selectedOpponent: any) => {
    if (!userProfile || !selectedOpponent || !supabase || !userId) return;

    const playerFighter = {
      ...userProfile,
      elementLevels: userProfile.element_levels || {},
      jutsus: userProfile.jutsus || {},
    };
    const opponentFighter = {
      ...selectedOpponent,
      elementLevels: selectedOpponent.element_levels || {},
      jutsus: selectedOpponent.jutsus || {},
    };

    // Stats e builds
    const playerStats = calculateDynamicStats(playerFighter, EQUIPMENT_DATA);
    const opponentStats = calculateDynamicStats(opponentFighter, EQUIPMENT_DATA);
    const playerBuild = detectBuild(playerStats);
    const opponentBuild = detectBuild(opponentStats);
    const playerBuildInfo = getBuildInfo(playerBuild);
    const opponentBuildInfo = getBuildInfo(opponentBuild);
    const playerState = emptyBattleState();
    const opponentState = emptyBattleState();

    // Passivas de regen
    if (playerBuild === 'guardiao') playerState.regenPercent = 0.03;
    if (opponentBuild === 'guardiao') opponentState.regenPercent = 0.03;
    if ((playerFighter.elementLevels?.['Suiton'] || 0) >= 10) playerState.regenPercent = Math.max(playerState.regenPercent, 0.05);
    if ((opponentFighter.elementLevels?.['Suiton'] || 0) >= 10) opponentState.regenPercent = Math.max(opponentState.regenPercent, 0.05);

    // HP máximo com passivas
    let playerMaxHealth = playerBuild === 'protetor'
      ? 100 + playerStats.finalVitality * 15 + playerStats.finalIntelligence * 8
      : playerStats.maxHealth;
    let opponentMaxHealth = opponentBuild === 'protetor'
      ? 100 + opponentStats.finalVitality * 15 + opponentStats.finalIntelligence * 8
      : opponentStats.maxHealth;
    if (playerBuild === 'imortal') playerMaxHealth *= 1.25;
    if (opponentBuild === 'imortal') opponentMaxHealth *= 1.25;

    let playerHealth = userProfile.current_health ?? playerMaxHealth;
    let opponentHealth = selectedOpponent.current_health ?? opponentMaxHealth;

    const log: BattleLogEntry[] = [];
    log.push(`🏯 BATALHA ENTRE CLÃS! ${playerFighter.name} [${playerBuildInfo.emoji} ${playerBuildInfo.name}] vs ${opponentFighter.name} [${opponentBuildInfo.emoji} ${opponentBuildInfo.name}]`);

    const roundsForDB: any[] = [];
    let turn = 1;
    let battleWinner = null;

    do {
      const roundData: any = {
        round_number: turn,
        player_damage: 0,
        opponent_damage: 0,
        player_jutsu: null,
        opponent_jutsu: null,
        winner: null,
      };

      // ── Promover barreira pending → ativa ──
      if (playerState.barrierPending) {
        playerState.barrierActiveThisTurn = true;
        playerState.barrierPending = false;
      } else {
        playerState.barrierActiveThisTurn = false;
      }
      if (opponentState.barrierPending) {
        opponentState.barrierActiveThisTurn = true;
        opponentState.barrierPending = false;
      } else {
        opponentState.barrierActiveThisTurn = false;
      }

      // Regen
      let clanPlayerRegen = 0, clanOppRegen = 0;
      if (playerState.regenPercent > 0) { clanPlayerRegen = playerMaxHealth * playerState.regenPercent; playerHealth = Math.min(playerMaxHealth, playerHealth + clanPlayerRegen); }
      if (opponentState.regenPercent > 0) { clanOppRegen = opponentMaxHealth * opponentState.regenPercent; opponentHealth = Math.min(opponentMaxHealth, opponentHealth + clanOppRegen); }
      // Queimadura
      let clanPlayerBurn = 0, clanOppBurn = 0;
      if (playerState.burnDamage > 0) { clanPlayerBurn = playerState.burnDamage; playerHealth -= clanPlayerBurn; playerState.burnDamage = 0; }
      if (opponentState.burnDamage > 0) { clanOppBurn = opponentState.burnDamage; opponentHealth -= clanOppBurn; opponentState.burnDamage = 0; }

      // ===== TURNO DO PLAYER =====
      const playerAttackType = getRandomAttackType(playerFighter, playerStats);
      if (playerAttackType) {
        const result = calculateDamage(playerFighter, opponentFighter, playerAttackType, {
          equipmentData: EQUIPMENT_DATA,
          attackerBuild: playerBuild, defenderBuild: opponentBuild,
          attackerState: playerState, defenderState: opponentState,
          isFirstTurn: turn === 1,
        });
        let actualDmg = result.damage + (result.secondHitDamage || 0);
        const clanPlayerReactions: BuildEffect[] = [];
        if (!opponentState.barrierUsed && (opponentFighter.elementLevels?.['Doton'] || 0) >= 10) {
          actualDmg *= 0.5; opponentState.barrierUsed = true;
          clanPlayerReactions.push({ type: 'barrier_blocked', label: '🪨 Barreira Doton absorveu 50%!', color: '#78716c' });
        }
        if (opponentState.barrierActiveThisTurn) {
          clanPlayerReactions.push({ type: 'item_barreira_absorveu', label: '🛡️ Barreira absorveu o ataque!', color: '#38bdf8' });
          actualDmg = 0;
          opponentState.barrierActiveThisTurn = false;
        }
        roundData.player_damage = Math.round(actualDmg);
        roundData.player_jutsu = result.jutsuUsed;
        opponentHealth -= actualDmg;
        opponentHealth = Math.max(0, opponentHealth);
        log.push(buildLogEntry({
          turn, attacker: 'player', attackType: playerAttackType, result,
          playerHealth, playerMaxHealth, opponentHealth, opponentMaxHealth,
          attackerBuild: playerBuild,
          regenApplied: clanPlayerRegen, burnDamageApplied: clanPlayerBurn,
          reactionEffects: clanPlayerReactions,
        }));
      }

      if (opponentHealth <= 0) {
        battleWinner = 'player';
        roundData.winner = userId;
        log.push(`🏆 ${playerFighter.name} venceu!`);
        roundsForDB.push(roundData);
        break;
      }

      // ===== TURNO DO OPONENTE =====
      const opponentAttackType = getRandomAttackType(opponentFighter, opponentStats);
      if (opponentAttackType) {
        const resultOpp = calculateDamage(opponentFighter, playerFighter, opponentAttackType, {
          equipmentData: EQUIPMENT_DATA,
          attackerBuild: opponentBuild, defenderBuild: playerBuild,
          attackerState: opponentState, defenderState: playerState,
          isFirstTurn: turn === 1,
        });
        let actualDmgOpp = resultOpp.damage + (resultOpp.secondHitDamage || 0);
        const clanOppReactions: BuildEffect[] = [];
        if (!playerState.barrierUsed && (playerFighter.elementLevels?.['Doton'] || 0) >= 10) {
          actualDmgOpp *= 0.5; playerState.barrierUsed = true;
          clanOppReactions.push({ type: 'barrier_blocked', label: '🪨 Barreira Doton absorveu 50%!', color: '#78716c' });
        }
        if (playerState.barrierActiveThisTurn) {
          clanOppReactions.push({ type: 'item_barreira_absorveu', label: '🛡️ Barreira absorveu o ataque!', color: '#38bdf8' });
          actualDmgOpp = 0;
          playerState.barrierActiveThisTurn = false;
        }
        if (playerBuild === 'imortal' && playerHealth - actualDmgOpp <= 0 && !playerState.survivedDeathUsed && Math.random() < 0.2) {
          actualDmgOpp = playerHealth - 1;
          playerState.survivedDeathUsed = true;
          clanOppReactions.push({ type: 'survived_death', label: '💀 Vontade de Ferro! Sobreviveu com 1 HP!', color: '#64748b' });
        }
        roundData.opponent_damage = Math.round(actualDmgOpp);
        roundData.opponent_jutsu = resultOpp.jutsuUsed;
        playerHealth -= actualDmgOpp;
        playerHealth = Math.max(0, playerHealth);
        log.push(buildLogEntry({
          turn, attacker: 'opponent', attackType: opponentAttackType, result: resultOpp,
          playerHealth, playerMaxHealth, opponentHealth, opponentMaxHealth,
          attackerBuild: opponentBuild,
          regenApplied: clanOppRegen, burnDamageApplied: clanOppBurn,
          reactionEffects: clanOppReactions,
        }));
      }

      if (playerHealth <= 0) {
        battleWinner = 'opponent';
        roundData.winner = selectedOpponent.id;
        log.push(`💀 ${opponentFighter.name} venceu!`);
        roundsForDB.push(roundData);
        break;
      }

      if (roundData.player_damage > roundData.opponent_damage) roundData.winner = userId;
      else if (roundData.opponent_damage > roundData.player_damage) roundData.winner = selectedOpponent.id;

      roundsForDB.push(roundData);
      turn++;
    } while (playerHealth > 0 && opponentHealth > 0 && turn <= 50);

    if (roundsForDB.length === 0) {
      roundsForDB.push({
        round_number: 1, player_damage: 100, opponent_damage: 100,
        player_jutsu: 'Ataque básico', opponent_jutsu: 'Ataque básico',
        winner: battleWinner === 'player' ? userId : selectedOpponent.id,
      });
    }

    try {
      const { error: insertError } = await supabase
        .from('clan_battles')
        .insert({
          attacker_id: userId,
          defender_id: selectedOpponent.id,
          attacker_clan_id: userProfile.clan_id,
          defender_clan_id: selectedOpponent.clan_id,
          winner_id: battleWinner === 'player' ? userId : selectedOpponent.id,
          rounds: roundsForDB,
          is_war_battle: false,
        });
      if (insertError) throw insertError;

      const winnerClanId = battleWinner === 'player' ? userProfile.clan_id : selectedOpponent.clan_id;
      const loserClanId  = battleWinner === 'player' ? selectedOpponent.clan_id : userProfile.clan_id;

      const { error: winErr } = await supabase.rpc('increment_war_points', { clan_id_param: winnerClanId, points: 1 });
      if (winErr) {
        const { data: wc } = await supabase.from('clans').select('war_points').eq('id', winnerClanId).single();
        if (wc) await supabase.from('clans').update({ war_points: (wc.war_points || 0) + 1 }).eq('id', winnerClanId);
      }
      const { error: loseErr } = await supabase.rpc('increment_war_points', { clan_id_param: loserClanId, points: -1 });
      if (loseErr) {
        const { data: lc } = await supabase.from('clans').select('war_points').eq('id', loserClanId).single();
        if (lc) await supabase.from('clans').update({ war_points: (lc.war_points || 0) - 1 }).eq('id', loserClanId);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Veja o console.' });
      return;
    }

    await supabase.from('profiles').update({ current_health: Math.max(0, Math.round(playerHealth)), is_recovering: false }).eq('id', userId);
    await supabase.from('profiles').update({ current_health: Math.max(0, Math.round(opponentHealth)), is_recovering: false }).eq('id', selectedOpponent.id);

    localStorage.setItem('lastClanBattleReport', JSON.stringify({
      battleLog: log,
      winner: battleWinner === 'player' ? playerFighter.name : opponentFighter.name,
      opponent: selectedOpponent,
    }));
    setSearchCooldown(SEARCH_COOLDOWN_SECONDS);
    setTimeout(() => window.location.reload(), 1000);
  };

    // Determina o estado atual do botão para renderização
  const getButtonContent = () => {
    if (searchCooldown > 0) {
      return {
        line1: `Aguarde ${searchCooldown}s`,
        line2: null,
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
      };
    }
    if (!!userProfile.active_mission) {
      return {
        line1: 'Você está em uma missão',
        line2: null,
        icon: <Search className="h-4 w-4" />,
      };
    }
    if ((userProfile.current_health ?? 0) < 100) {
      return {
        line1: 'Vida insuficiente',
        line2: `${userProfile.current_health ?? 0} / 100 HP necessário`,
        icon: <Search className="h-4 w-4" />,
      };
    }
    if ((userProfile.current_chakra ?? 150) < 50) {
      return {
        line1: 'Chakra insuficiente',
        line2: `${userProfile.current_chakra ?? 150} / 50 ⚡ necessário`,
        icon: <Search className="h-4 w-4" />,
      };
    }
    return {
      line1: 'Buscar Oponente de Clã',
      line2: '50 Chakra ⚡',
      icon: <Search className="h-4 w-4" />,
    };
  };

  const buttonContent = getButtonContent();
  const isDisabled =
    isSearching ||
    !!userProfile.active_mission ||
    (userProfile.current_health ?? 0) < 100 ||
    (userProfile.current_chakra ?? 150) < 50 ||
    searchCooldown > 0;

  return (
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Batalha entre Clãs
        </CardTitle>
        <CardDescription>
          Encontre um adversário de outro clã (±10 níveis). Custo: 50 Chakra
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isSearching && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500"/>
          </div>
        )}
        
        {opponent && (
          <Card className="p-4 bg-muted/30 border-purple-500/30">
            <div className="flex items-center gap-4">
              <img 
                src={opponent.avatar_url || 'https://images.unsplash.com/photo-1608745128320-9291dfb0e12d'} 
                alt={opponent.name} 
                className="h-20 w-20 rounded-md object-cover"
              />
              <div className="space-y-1">
                <p className="text-xl font-bold">{opponent.name}</p>
                <p className="text-sm text-muted-foreground">Nível: {opponent.level}</p>
                <p className="text-sm text-purple-400">Clã: {opponent.clan_name}</p>
              </div>
            </div>
          </Card>
        )}

        {battleLog.length > 0 && (
          <BattleReport
            log={battleLog}
            playerName={userProfile?.name || 'Você'}
            opponentName={opponent?.name || 'Oponente'}
            context="clan"
            clanName={userProfile?.clan_name}
            opponentClanName={opponent?.clan_name}
          />
        )}

        {winner && battleLog.length > 0 && (() => {
          const stats = calcLogStats(battleLog, 'player');
          return (
            <BattleResult
              winner={winner}
              totalTurns={stats.totalTurns}
              totalDamageDealt={stats.totalDamageDealt}
              totalDamageTaken={stats.totalDamageTaken}
              critCount={stats.critCount}
              passiveCount={stats.passiveCount}
              context="clan"
            />
          );
        })()}
      </CardContent>
      
      <CardFooter>
        {/* ✅ BOTÃO CORRIGIDO: duas linhas para caber sem estourar */}
        <Button
          className="w-full h-auto py-2 flex flex-col gap-0.5 bg-gradient-to-b from-[#a855f7] to-[#7e22ce] text-white border-t border-l border-r border-b-2 border-t-[#c084fc] border-l-[#a855f7] border-r-[#581c87] border-b-[#2e1065] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,220,255,0.2)] hover:from-[#b56ef8] hover:to-[#9333ea] hover:shadow-[0_3px_14px_rgba(168,85,247,0.45)] rounded-[3px]"
          onClick={handleSearchClanOpponent}
          disabled={isDisabled}
        >
          <span className="flex items-center gap-2 font-semibold text-sm leading-tight">
            {buttonContent.icon}
            {buttonContent.line1}
          </span>
          {buttonContent.line2 && (
            <span className="text-xs opacity-75 font-normal leading-tight">
              {buttonContent.line2}
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}