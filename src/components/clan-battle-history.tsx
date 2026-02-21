'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Swords, Trophy, Skull, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

type ClanBattle = {
  id: string;
  created_at: string;
  attacker_id: string;
  defender_id: string;
  attacker_clan_id: string;
  defender_clan_id: string;
  winner_id: string;
  rounds: Array<{
    round_number: number;
    player_damage: number;
    opponent_damage: number;
    player_jutsu: string | null;
    opponent_jutsu: string | null;
    winner: string | null;
  }>;
  attacker: { name: string; clan_name: string };
  defender: { name: string; clan_name: string };
};

type ClanBattleHistoryProps = {
  clanId: string;
  clanName: string;
  supabase: any;
};

export function ClanBattleHistory({ clanId, clanName, supabase }: ClanBattleHistoryProps) {
  const [battles, setBattles] = useState<ClanBattle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBattle, setExpandedBattle] = useState<string | null>(null);
  const [battleReport, setBattleReport] = useState<{ [key: string]: BattleLogEntry[] }>({});
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchBattles = async () => {
      try {
        const { data, error } = await supabase
          .from('clan_battles')
          .select(`
            id,
            created_at,
            attacker_id,
            defender_id,
            attacker_clan_id,
            defender_clan_id,
            winner_id,
            rounds,
            attacker:attacker_id(name, clan_name),
            defender:defender_id(name, clan_name)
          `)
          .or(`attacker_clan_id.eq.${clanId},defender_clan_id.eq.${clanId}`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        setBattles(data || []);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBattles();
  }, [clanId, supabase]);

  const reconstructBattleLog = async (battle: ClanBattle): Promise<BattleLogEntry[]> => {
    console.log('🔍 DEBUG - Reconstruindo batalha:', {
      battleId: battle.id,
      attackerId: battle.attacker_id,
      defenderId: battle.defender_id,
      roundsCount: battle.rounds?.length || 0,
    });

    const isAttacker = battle.attacker_clan_id === clanId;
    const playerName = isAttacker ? battle.attacker.name : battle.defender.name;
    const opponentName = isAttacker ? battle.defender.name : battle.attacker.name;
    
    const log: BattleLogEntry[] = [];
    log.push(`⚔️ BATALHA ENTRE CLÃS! ${battle.attacker.name} (${battle.attacker.clan_name}) vs ${battle.defender.name} (${battle.defender.clan_name})`);
    
    if (!battle.rounds || battle.rounds.length === 0) {
      log.push('Nenhum dado de batalha disponível.');
      return log;
    }
    
    // 🔥 CORREÇÃO PRINCIPAL: Buscar jutsus dos dois lutadores
    let attackerJutsus: any = {};
    let defenderJutsus: any = {};
    
    try {
      // Buscar jutsus do atacante
      const { data: attackerData, error: attackerError } = await supabase
        .from('profiles')
        .select('jutsus')
        .eq('id', battle.attacker_id)
        .single();
      
      // Buscar jutsus do defensor
      const { data: defenderData, error: defenderError } = await supabase
        .from('profiles')
        .select('jutsus')
        .eq('id', battle.defender_id)
        .single();
      
      if (!attackerError && attackerData?.jutsus) {
        attackerJutsus = attackerData.jutsus;
        console.log('✅ Jutsus do atacante carregados:', Object.keys(attackerJutsus));
      }
      
      if (!defenderError && defenderData?.jutsus) {
        defenderJutsus = defenderData.jutsus;
        console.log('✅ Jutsus do defensor carregados:', Object.keys(defenderJutsus));
      }
    } catch (error) {
      console.error('❌ Erro ao buscar jutsus:', error);
    }
    
    // 🔥 BUSCAR HP REAL DOS JOGADORES NO INÍCIO DA BATALHA
    let attackerHP = 1000; // fallback
    let defenderHP = 1000; // fallback
    
    try {
      // Buscar stats reais do atacante
      const { data: attackerProfile } = await supabase
        .from('profiles')
        .select('vitality, current_health')
        .eq('id', battle.attacker_id)
        .single();
      
      // Buscar stats reais do defensor
      const { data: defenderProfile } = await supabase
        .from('profiles')
        .select('vitality, current_health')
        .eq('id', battle.defender_id)
        .single();
      
      // Calcular HP máximo baseado na vitalidade (10 HP por ponto)
      if (attackerProfile) {
        const maxHP = (attackerProfile.vitality || 100) * 10;
        // Assumir que começou com HP cheio ou pelo menos 80% do máximo
        attackerHP = maxHP;
      }
      
      if (defenderProfile) {
        const maxHP = (defenderProfile.vitality || 100) * 10;
        defenderHP = maxHP;
      }
      
      console.log('❤️ HP Real Calculado:', { attackerHP, defenderHP });
    } catch (error) {
      console.warn('⚠️ Não foi possível buscar HP real, usando fallback de 1000');
    }
    
    // 🔥 PROCESSAR CADA TURNO
    battle.rounds.forEach((round) => {
      console.log(`📋 Processando round ${round.round_number}:`, round);

      // ===== TURNO DO ATACANTE =====
      if (round.player_damage > 0) {
        defenderHP -= round.player_damage;
        defenderHP = Math.max(0, defenderHP);
        
        // Buscar GIF do jutsu usado
        let jutsuGif = null;
        const jutsuName = round.player_jutsu;
        
        if (jutsuName && attackerJutsus[jutsuName]) {
          jutsuGif = attackerJutsus[jutsuName].gif || null;
          console.log(`🎭 Jutsu do atacante: ${jutsuName} - GIF: ${jutsuGif ? '✅' : '❌'}`);
        }
        
        log.push({
          turn: round.round_number,
          attacker: isAttacker ? 'player' : 'opponent',
          jutsuName: jutsuName || 'Ataque básico',
          jutsuGif: jutsuGif,
          damageLog: `Causou ${round.player_damage} de dano`,
          damage: round.player_damage,
          [isAttacker ? 'opponentHealth' : 'playerHealth']: `${defenderHP.toFixed(0)} HP`
        });
      }
      
      // ===== TURNO DO DEFENSOR (só se ainda tiver vida) =====
      if (round.opponent_damage > 0 && defenderHP > 0) {
        attackerHP -= round.opponent_damage;
        attackerHP = Math.max(0, attackerHP);
        
        // Buscar GIF do jutsu usado
        let jutsuGif = null;
        const jutsuName = round.opponent_jutsu;
        
        if (jutsuName && defenderJutsus[jutsuName]) {
          jutsuGif = defenderJutsus[jutsuName].gif || null;
          console.log(`🎭 Jutsu do defensor: ${jutsuName} - GIF: ${jutsuGif ? '✅' : '❌'}`);
        }
        
        log.push({
          turn: round.round_number,
          attacker: isAttacker ? 'opponent' : 'player',
          jutsuName: jutsuName || 'Ataque básico',
          jutsuGif: jutsuGif,
          damageLog: `Causou ${round.opponent_damage} de dano`,
          damage: round.opponent_damage,
          [isAttacker ? 'playerHealth' : 'opponentHealth']: `${attackerHP.toFixed(0)} HP`
        });
      }
    });
    
    const winnerName = battle.winner_id === battle.attacker_id ? battle.attacker.name : battle.defender.name;
    log.push(`🏆 Vencedor: ${winnerName} 🏆`);
    
    console.log(`✅ Log de batalha reconstruído com ${log.length} entradas`);
    return log;
  };

  const toggleBattleDetails = async (battleId: string) => {
    if (expandedBattle === battleId) {
      setExpandedBattle(null);
      return;
    }
    
    setExpandedBattle(battleId);
    
    // Se já temos o relatório, não precisa buscar novamente
    if (battleReport[battleId]) return;
    
    setLoadingReport(battleId);
    
    const battle = battles.find(b => b.id === battleId);
    if (battle) {
      const log = await reconstructBattleLog(battle);
      setBattleReport(prev => ({ ...prev, [battleId]: log }));
    }
    
    setLoadingReport(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (battles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Swords className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma batalha registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
      {battles.map((battle) => {
        const isAttacker = battle.attacker_clan_id === clanId;
        const won = battle.winner_id === (isAttacker ? battle.attacker_id : battle.defender_id);
        const opponentClan = isAttacker ? battle.defender.clan_name : battle.attacker.clan_name;
        const playerName = isAttacker ? battle.attacker.name : battle.defender.name;
        const opponentName = isAttacker ? battle.defender.name : battle.attacker.name;
        const isExpanded = expandedBattle === battle.id;
        const isLoadingThisReport = loadingReport === battle.id;
        
        return (
          <Card key={battle.id} className={won ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header da Batalha */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {won ? (
                        <Trophy className="h-4 w-4 text-green-500" />
                      ) : (
                        <Skull className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold">
                        {playerName} vs {opponentName}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {clanName} vs {opponentClan}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(battle.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={won ? 'default' : 'destructive'}>
                      {won ? 'Vitória' : 'Derrota'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBattleDetails(battle.id)}
                      disabled={isLoadingThisReport}
                    >
                      {isLoadingThisReport ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* 🔥 RELATÓRIO COMPLETO DA BATALHA - ESTILO HUNTS */}
                {isExpanded && battleReport[battle.id] && (
                  <div className="pt-3 border-t">
                    <Alert variant="default" className="max-h-96 overflow-y-auto">
                      <ScrollText className="h-4 w-4" />
                      <AlertTitle>Relatório de Batalha</AlertTitle>
                      <AlertDescription className="font-mono text-xs space-y-3 mt-2">
                        {battleReport[battle.id].map((log, index) => {
                          if (typeof log === 'string') {
                            return (
                              <p key={index} className="text-muted-foreground font-semibold">
                                {log}
                              </p>
                            );
                          }
                          
                          return (
                            <div key={index} className="space-y-2 pb-2 border-b border-border/50">
                              <p className="font-semibold">
                                Turno {log.turn} - {log.attacker === 'player' ? `⚔️ ${playerName}` : `🤖 ${opponentName}`}
                              </p>
                              
                              {/* 🎭 MOSTRAR GIF DO JUTSU */}
                              {log.jutsuGif && (
                                <div className="flex justify-center my-2">
                                  <img 
                                    src={log.jutsuGif} 
                                    alt={log.jutsuName}
                                    className="w-32 h-32 rounded-md object-cover border-2 border-purple-500/20 shadow-lg"
                                  />
                                </div>
                              )}
                              
                              {/* 📛 NOME DO JUTSU */}
                              <p className="text-purple-500 font-medium">
                                {log.jutsuName}
                              </p>
                              
                              {/* 💥 DANO CAUSADO */}
                              <p className={log.attacker === 'player' ? 'text-blue-600' : 'text-red-600'}>
                                {log.damageLog}
                              </p>
                              
                              {/* ❤️ HP RESTANTE */}
                              <p className="text-xs text-muted-foreground">
                                {log.attacker === 'player' 
                                  ? `Vida do oponente: ${log.opponentHealth}`
                                  : `Vida de ${playerName}: ${log.playerHealth}`
                                }
                              </p>
                            </div>
                          );
                        })}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
