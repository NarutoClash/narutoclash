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
} from '@/lib/battle-system';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';

type BattleLogEntry = string | {
  turn: number;
  attacker: 'player' | 'opponent';
  attackType?: string;
  jutsuName: string;
  jutsuGif: string | null;
  damageLog: string;
  damage: number;
  playerHealth?: string;
  opponentHealth?: string;
};

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
    console.log('🚀 handleClanBattle CHAMADA');
    
    if (!userProfile || !selectedOpponent || !supabase || !userId) {
      console.error('❌ Dados faltando!', {
        hasUserProfile: !!userProfile,
        hasOpponent: !!selectedOpponent,
        hasSupabase: !!supabase,
        hasUserId: !!userId
      });
      return;
    }
  
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
  
    const playerStats = calculateDynamicStats(playerFighter, EQUIPMENT_DATA);
    const opponentStats = calculateDynamicStats(opponentFighter, EQUIPMENT_DATA);
  
    let playerHealth = userProfile.current_health ?? playerStats.maxHealth;
    let opponentHealth = selectedOpponent.current_health ?? opponentStats.maxHealth;
    
    console.log('❤️ HP INICIAL:', { player: playerHealth, opponent: opponentHealth });
  
    const log: BattleLogEntry[] = [];
    log.push(`⚔️ BATALHA ENTRE CLÃS! ${playerFighter.name} (${playerFighter.clan_name}) vs ${opponentFighter.name} (${opponentFighter.clan_name})`);
    
    const roundsForDB: any[] = [];
    let turn = 1;
    let battleWinner = null;
    
    let minTurns = 1;
    let maxTurns = 50;
    
    console.log('🎮 INICIANDO BATALHA - Turno', turn);
  
    do {
      console.log(`\n━━━ TURNO ${turn} ━━━`);
      
      const roundData: any = {
        round_number: turn,
        player_damage: 0,
        opponent_damage: 0,
        player_jutsu: null,
        opponent_jutsu: null,
        winner: null,
      };
  
      const playerAttackType = getRandomAttackType(playerFighter);
      
      if (playerAttackType) {
        const { damage, log: damageLog, jutsuUsed, jutsuGif } = calculateDamage(
          playerFighter, 
          opponentFighter, 
          playerAttackType, 
          { equipmentData: EQUIPMENT_DATA }
        );
  
        roundData.player_damage = Math.round(damage);
        roundData.player_jutsu = jutsuUsed;
        
        opponentHealth -= damage;
        opponentHealth = Math.max(0, opponentHealth);
        
        console.log(`⚔️ Player causou ${roundData.player_damage} dano. HP oponente: ${opponentHealth}`);
        
        log.push({
          turn: turn,
          attacker: 'player',
          attackType: playerAttackType,
          jutsuName: jutsuUsed || 'Ataque básico',
          jutsuGif: jutsuGif || null,
          damageLog: damageLog,
          damage: damage,
          opponentHealth: `${opponentHealth.toFixed(0)} HP`
        });
      }
      
      if (opponentHealth <= 0) {
        battleWinner = 'player';
        roundData.winner = userId;
        log.push(`🏆 ${playerFighter.name} venceu!`);
        roundsForDB.push(roundData);
        console.log(`✅ ROUND ${turn} SALVO. Total: ${roundsForDB.length}`);
        break;
      }
  
      const opponentAttackType = getRandomAttackType(opponentFighter);
      
      if (opponentAttackType) {
        const { damage, log: damageLog, jutsuUsed, jutsuGif } = calculateDamage(
          opponentFighter, 
          playerFighter, 
          opponentAttackType, 
          { equipmentData: EQUIPMENT_DATA }
        );
  
        roundData.opponent_damage = Math.round(damage);
        roundData.opponent_jutsu = jutsuUsed;
        
        playerHealth -= damage;
        playerHealth = Math.max(0, playerHealth);
        
        console.log(`🤖 Oponente causou ${roundData.opponent_damage} dano. HP player: ${playerHealth}`);
        
        log.push({
          turn: turn,
          attacker: 'opponent',
          attackType: opponentAttackType,
          jutsuName: jutsuUsed || 'Ataque básico',
          jutsuGif: jutsuGif || null,
          damageLog: damageLog,
          damage: damage,
          playerHealth: `${playerHealth.toFixed(0)} HP`
        });
      }
  
      if (playerHealth <= 0) {
        battleWinner = 'opponent';
        roundData.winner = selectedOpponent.id;
        log.push(`💀 ${opponentFighter.name} venceu!`);
        roundsForDB.push(roundData);
        console.log(`✅ ROUND ${turn} SALVO. Total: ${roundsForDB.length}`);
        break;
      }
      
      if (roundData.player_damage > roundData.opponent_damage) {
        roundData.winner = userId;
      } else if (roundData.opponent_damage > roundData.player_damage) {
        roundData.winner = selectedOpponent.id;
      }
      
      roundsForDB.push(roundData);
      console.log(`✅ ROUND ${turn} SALVO. Total: ${roundsForDB.length}`);
      
      turn++;
    } while (playerHealth > 0 && opponentHealth > 0 && turn <= maxTurns);
    
    console.log('\n🏁 FIM DA BATALHA');
    console.log('📊 Total de rounds:', roundsForDB.length);
    console.log('🏆 Vencedor:', battleWinner);
    
    if (roundsForDB.length === 0) {
      console.error('❌ CRÍTICO: Nenhum round salvo. Adicionando round de emergência...');
      
      const emergencyRound = {
        round_number: 1,
        player_damage: 100,
        opponent_damage: 100,
        player_jutsu: 'Ataque básico',
        opponent_jutsu: 'Ataque básico',
        winner: battleWinner === 'player' ? userId : selectedOpponent.id,
      };
      
      roundsForDB.push(emergencyRound);
      console.log('✅ Round de emergência adicionado');
    }
  
    try {
      const { data: insertedBattle, error: insertError } = await supabase
        .from('clan_battles')
        .insert({
          attacker_id: userId,
          defender_id: selectedOpponent.id,
          attacker_clan_id: userProfile.clan_id,
          defender_clan_id: selectedOpponent.clan_id,
          winner_id: battleWinner === 'player' ? userId : selectedOpponent.id,
          rounds: roundsForDB,
          is_war_battle: false,
        })
        .select();
      
      if (insertError) {
        console.error('❌ Erro ao salvar:', insertError);
        throw insertError;
      }
      
      console.log('✅ Batalha salva!', insertedBattle);
      
      console.log('📊 Atualizando pontos de guerra...');
      
      const winnerClanId = battleWinner === 'player' ? userProfile.clan_id : selectedOpponent.clan_id;
      const loserClanId = battleWinner === 'player' ? selectedOpponent.clan_id : userProfile.clan_id;
      
      const { error: winnerUpdateError } = await supabase.rpc('increment_war_points', {
        clan_id_param: winnerClanId,
        points: 1
      });
      
      if (winnerUpdateError) {
        console.warn('⚠️ Erro ao atualizar pontos do vencedor:', winnerUpdateError);
        const { data: winnerClan } = await supabase
          .from('clans')
          .select('war_points')
          .eq('id', winnerClanId)
          .single();
        
        if (winnerClan) {
          await supabase
            .from('clans')
            .update({ war_points: (winnerClan.war_points || 0) + 1 })
            .eq('id', winnerClanId);
        }
      }
      
      const { error: loserUpdateError } = await supabase.rpc('increment_war_points', {
        clan_id_param: loserClanId,
        points: -1
      });
      
      if (loserUpdateError) {
        console.warn('⚠️ Erro ao atualizar pontos do perdedor:', loserUpdateError);
        const { data: loserClan } = await supabase
          .from('clans')
          .select('war_points')
          .eq('id', loserClanId)
          .single();
        
        if (loserClan) {
          await supabase
            .from('clans')
            .update({ war_points: (loserClan.war_points || 0) - 1 })
            .eq('id', loserClanId);
        }
      }
      
      console.log('✅ Pontos de guerra atualizados!', {
        winner: `${winnerClanId} (+1)`,
        loser: `${loserClanId} (-1)`
      });
      
    } catch (error) {
      console.error('❌ Erro crítico:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Veja o console.',
      });
      return;
    }
    
    await supabase.from('profiles').update({ 
      current_health: Math.max(0, Math.round(playerHealth)),
      is_recovering: false,
    }).eq('id', userId);
    
    await supabase.from('profiles').update({ 
      current_health: Math.max(0, Math.round(opponentHealth)),
      is_recovering: false,
    }).eq('id', selectedOpponent.id);
    
    const battleReport = {
      battleLog: log,
      winner: battleWinner === 'player' ? playerFighter.name : opponentFighter.name,
      opponent: selectedOpponent,
    };
    
    localStorage.setItem('lastClanBattleReport', JSON.stringify(battleReport));
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
          <Alert variant="default" className="max-h-96 overflow-y-auto">
            <ScrollText className="h-4 w-4" />
            <AlertTitle>Relatório de Batalha entre Clãs</AlertTitle>
            <AlertDescription className="font-mono text-xs space-y-3 mt-2">
              {battleLog.map((log, index) => {
                if (typeof log === 'string') {
                  return <p key={index} className="text-muted-foreground font-semibold">{log}</p>;
                }
                
                return (
                  <div key={index} className="space-y-2 pb-2 border-b border-border/50">
                    <p className="font-semibold">
                      Turno {log.turn} - {log.attacker === 'player' ? '⚔️ Você' : '🤖 Oponente'}
                    </p>
                    
                    {log.jutsuGif && (
                      <div className="flex justify-center my-2">
                        <img 
                          src={log.jutsuGif} 
                          alt={log.jutsuName}
                          className="w-32 h-32 rounded-md object-cover border-2 border-purple-500/20"
                        />
                      </div>
                    )}
                    
                    <p className="text-purple-500 font-medium">
                      {log.jutsuName}
                    </p>
                    
                    <p className={log.attacker === 'player' ? 'text-blue-600' : 'text-red-600'}>
                      {log.damageLog}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      {log.attacker === 'player' 
                        ? `Vida do oponente: ${log.opponentHealth}`
                        : `Sua vida: ${log.playerHealth}`
                      }
                    </p>
                  </div>
                );
              })}
            </AlertDescription>
          </Alert>
        )}
        
        {winner && (
          <div className="p-3 rounded-md bg-purple-500/20 text-center font-bold text-lg">
            <p>🏆 Vencedor: {winner} 🏆</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {/* ✅ BOTÃO CORRIGIDO: duas linhas para caber sem estourar */}
        <Button
          className="w-full h-auto py-2 bg-purple-600 hover:bg-purple-700 flex flex-col gap-0.5"
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
