'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Loader2, Search, Timer, Swords, ScrollText, CheckCircle, Users } from 'lucide-react';
import { BattleReport, BattleResult } from '@/components/battle-report';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getLevelFromXp, getXpForLevel } from '@/lib/xp-utils';
import { 
  calculateDamage, 
  calculateDynamicStats, 
  getRandomAttackType,
  detectBuild,
  getBuildInfo,
  emptyBattleState,
  buildLogEntry,
  calcLogStats,
} from '@/lib/battle-system';
import { applyItemPassives } from '@/lib/battle-system/calculator';
import type { RichBattleLogEntry, FighterBattleState, BuildEffect } from '@/lib/battle-system';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';
import { useCollection } from '@/supabase';

type BattleLogEntry = RichBattleLogEntry;

const DAILY_HUNT_LIMIT_SECONDS = 3600; // 1 hour (base)
const DAILY_HUNT_LIMIT_SECONDS_VIP = 7200; // 2 hours (VIP)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_COOLDOWN_SECONDS = 10; // 10 segundos de cooldown

const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function HuntsPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);

  const { data: userProfile, isLoading: isUserLoading } = useDoc(userProfileRef);

// 🆕 BUSCAR PREMIUM PASS ATIVO
const premiumPassQuery = useMemoSupabase(() => {
  if (!user) return null;
  return {
    table: 'user_premium_inventory',
    query: (builder: any) => 
      builder
        .eq('user_id', user.id)
        .eq('item_type', 'premium_pass')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
  };
}, [user]);

const { data: activePremiumPass } = useCollection(premiumPassQuery);
const hasPremiumPass = activePremiumPass && activePremiumPass.length > 0;

  const [isSearching, setIsSearching] = useState(false);
  const [opponent, setOpponent] = useState<any | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  
  // useEffect para recuperar dados da batalha após reload
useEffect(() => {
  const savedBattleData = localStorage.getItem('lastBattleReport');
  if (savedBattleData) {
    try {
      const { battleLog, winner, opponent } = JSON.parse(savedBattleData);
      setBattleLog(battleLog);
      setWinner(winner);
      setOpponent(opponent);
      
      // Inicia o cooldown automaticamente quando carregar o relatório de batalha
      setSearchCooldown(SEARCH_COOLDOWN_SECONDS);
      
      localStorage.removeItem('lastBattleReport');
      
      toast({
        title: 'Relatório de Batalha',
        description: 'Sua última batalha foi carregada.',
      });
    } catch (error) {
      console.error('Erro ao recuperar relatório de batalha:', error);
      localStorage.removeItem('lastBattleReport');
    }
  }
}, [toast]);

  const [huntDuration, setHuntDuration] = useState<string>('300');
  const [huntTimeRemaining, setHuntTimeRemaining] = useState<number | null>(null);
  const [searchCooldown, setSearchCooldown] = useState<number>(0);
  
  const activeHunt = userProfile?.active_hunt;

  // Reset diário do tempo de caçada
  useEffect(() => {
    if (!userProfile || !supabase || !user) return;

    const checkDailyReset = async () => {
      const now = Date.now();
      const lastReset = userProfile.last_hunt_reset || 0;
      const timeSinceReset = now - lastReset;

      if (timeSinceReset >= ONE_DAY_MS) {
        await supabase
          .from('profiles')
          .update({
            daily_hunt_time_used: 0,
            last_hunt_reset: now,
          })
          .eq('id', user.id);
      }
    };

    checkDailyReset();
  }, [userProfile, supabase, user]);

  useEffect(() => {
    if (!activeHunt) {
      setHuntTimeRemaining(0);
      return;
    };
    
    const initialRemaining = Math.max(0, activeHunt.endTime - Date.now());
    setHuntTimeRemaining(initialRemaining / 1000);

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, activeHunt.endTime - now);
      setHuntTimeRemaining(remaining / 1000);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHunt]);

  useEffect(() => {
    if (searchCooldown <= 0) return;
  
    const interval = setInterval(() => {
      setSearchCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Se houver um vencedor (batalha terminada), recarrega a página
          if (winner) {
            // Mantém o valor em 1 para manter o botão desabilitado durante o reload
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



  const handleBattle = async () => {
    if (!userProfile || !opponent || !supabase || !user) return;
  
    const playerFighter = {
      ...userProfile,
      elementLevels: userProfile.element_levels || {},
      jutsus: userProfile.jutsus || {},
      // Mapear snake_case → camelCase para o sistema de passivas
      weaponId: userProfile.weapon_id,
      chestId:  userProfile.chest_id,
      legsId:   userProfile.legs_id,
      feetId:   userProfile.feet_id,
      handsId:  userProfile.hands_id,
    };
    
    const opponentFighter = {
      ...opponent,
      elementLevels: opponent.element_levels || {},
      jutsus: opponent.jutsus || {},
      weaponId: opponent.weapon_id,
      chestId:  opponent.chest_id,
      legsId:   opponent.legs_id,
      feetId:   opponent.feet_id,
      handsId:  opponent.hands_id,
    };
  
    const playerStats = calculateDynamicStats(playerFighter, EQUIPMENT_DATA);
    const opponentStats = calculateDynamicStats(opponentFighter, EQUIPMENT_DATA);

    // Detectar builds
    const playerBuild = detectBuild(playerStats);
    const opponentBuild = detectBuild(opponentStats);
    const playerBuildInfo = getBuildInfo(playerBuild);
    const opponentBuildInfo = getBuildInfo(opponentBuild);

    // Estados de batalha (passivas, burns, etc)
    const playerState = emptyBattleState();
    const opponentState = emptyBattleState();

    // Shirogane: HP máximo aumentado
    let playerMaxHealth = playerBuild === 'protetor'
      ? 100 + playerStats.finalVitality * 15 + playerStats.finalIntelligence * 8
      : playerStats.maxHealth;
    let opponentMaxHealth = opponentBuild === 'protetor'
      ? 100 + opponentStats.finalVitality * 15 + opponentStats.finalIntelligence * 8
      : opponentStats.maxHealth;

    // Kairai: +25% HP máximo
    if (playerBuild === 'imortal') playerMaxHealth *= 1.25;
    if (opponentBuild === 'imortal') opponentMaxHealth *= 1.25;

    // Regen: Shugosha e Suiton lv10
    if (playerBuild === 'guardiao') playerState.regenPercent = 0.03;
    if (opponentBuild === 'guardiao') opponentState.regenPercent = 0.03;
    const playerSuitonLv = (playerFighter.elementLevels?.['Suiton'] || 0);
    const opponentSuitonLv = (opponentFighter.elementLevels?.['Suiton'] || 0);
    if (playerSuitonLv >= 10) playerState.regenPercent = Math.max(playerState.regenPercent, 0.05);
    if (opponentSuitonLv >= 10) opponentState.regenPercent = Math.max(opponentState.regenPercent, 0.05);

    // Doton lv10: barreira inicial
    if ((playerFighter.elementLevels?.['Doton'] || 0) >= 10) playerState.barrierUsed = false;
    if ((opponentFighter.elementLevels?.['Doton'] || 0) >= 10) opponentState.barrierUsed = false;

    let playerHealth = userProfile.current_health ?? playerMaxHealth;
    let opponentHealth = opponent.current_health ?? opponentMaxHealth;
  
    const log: BattleLogEntry[] = [];
    log.push(`⚔️ ${playerFighter.name} [${playerBuildInfo.emoji} ${playerBuildInfo.name}] vs ${opponentFighter.name} [${opponentBuildInfo.emoji} ${opponentBuildInfo.name}]`);
    
    let turn = 1;
    let battleWinner = null;
    const roundsForDB: any[] = [];
    const isFirstTurn = true;
  
    while (playerHealth > 0 && opponentHealth > 0 && turn < 50) {
      const roundData: any = {
        round_number: turn,
        player_damage: 0,
        opponent_damage: 0,
        player_jutsu: null,
        opponent_jutsu: null,
        winner: null,
      };

      // ── Promover barreira pending → ativa (ativada no turno anterior) ──
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

      // ── Passivas de início de turno ──
      const playerHpPct = playerHealth / playerMaxHealth;
      const oppHpPct = opponentHealth / opponentMaxHealth;

      // Gatilho inicio_turno para ambos (regen de item, etc)
      const dummyResultP = { damage: 0, log: '', isCritical: false, buildEffects: [] } as any;
      applyItemPassives(playerFighter, 'inicio_turno', dummyResultP, opponentState, playerState, playerHpPct, oppHpPct, opponentMaxHealth);
      const dummyResultO = { damage: 0, log: '', isCritical: false, buildEffects: [] } as any;
      applyItemPassives(opponentFighter, 'inicio_turno', dummyResultO, playerState, opponentState, oppHpPct, playerHpPct, playerMaxHealth);

      // Regen no início do turno
      let playerRegen = 0;
      let opponentRegen = 0;
      if (playerState.regenPercent > 0) {
        playerRegen = playerMaxHealth * playerState.regenPercent;
        playerHealth = Math.min(playerMaxHealth, playerHealth + playerRegen);
      }
      if (opponentState.regenPercent > 0) {
        opponentRegen = opponentMaxHealth * opponentState.regenPercent;
        opponentHealth = Math.min(opponentMaxHealth, opponentHealth + opponentRegen);
      }

      // Lifesteal do turno anterior → curar
      if (playerState.lifestealHealed > 0) {
        playerHealth = Math.min(playerMaxHealth, playerHealth + playerState.lifestealHealed);
        playerRegen += playerState.lifestealHealed;
        playerState.lifestealHealed = 0;
      }
      if (opponentState.lifestealHealed > 0) {
        opponentHealth = Math.min(opponentMaxHealth, opponentHealth + opponentState.lifestealHealed);
        opponentRegen += opponentState.lifestealHealed;
        opponentState.lifestealHealed = 0;
      }

      // Queimadura + Veneno no início do turno
      let playerBurnThisTurn = 0;
      let opponentBurnThisTurn = 0;
      if (playerState.burnDamage > 0) {
        playerBurnThisTurn = playerState.burnDamage;
        playerHealth -= playerBurnThisTurn;
        playerState.burnDamage = 0;
      }
      if (playerState.poisonDamage > 0) {
        playerBurnThisTurn += playerState.poisonDamage;
        playerHealth -= playerState.poisonDamage;
        playerState.poisonDamage = 0;
      }
      if (opponentState.burnDamage > 0) {
        opponentBurnThisTurn = opponentState.burnDamage;
        opponentHealth -= opponentBurnThisTurn;
        opponentState.burnDamage = 0;
      }
      if (opponentState.poisonDamage > 0) {
        opponentBurnThisTurn += opponentState.poisonDamage;
        opponentHealth -= opponentState.poisonDamage;
        opponentState.poisonDamage = 0;
      }
  
      // ===== TURNO DO PLAYER =====
      const playerAttackType = getRandomAttackType(playerFighter, playerStats);
      
      if (playerAttackType) {
        const result = calculateDamage(playerFighter, opponentFighter, playerAttackType, {
          equipmentData: EQUIPMENT_DATA,
          attackerBuild: playerBuild,
          defenderBuild: opponentBuild,
          attackerState: playerState,
          defenderState: opponentState,
          isFirstTurn: turn === 1,
          attackerHpPct: playerHealth / playerMaxHealth,
          defenderHpPct: opponentHealth / opponentMaxHealth,
          defenderMaxHealth: opponentMaxHealth,
        });

        // Passivas ao_receber_dano do oponente (barreira de item, refletir)
        const recvResultOpp = { damage: result.damage, log: '', isCritical: false, buildEffects: [] } as any;
        applyItemPassives(opponentFighter, 'ao_receber_dano', recvResultOpp, playerState, opponentState,
          opponentHealth / opponentMaxHealth, playerHealth / playerMaxHealth, playerMaxHealth);
        // NÃO misturar no buildEffects — vão para reactionEffects separado
        const playerTurnReactions: BuildEffect[] = [...(recvResultOpp.buildEffects || [])];

        // Refletir: dano devolvido ao player
        if (opponentState.reflectDamage > 0) {
          const reflected = opponentState.reflectDamage;
          opponentState.reflectDamage = 0;
          playerHealth = Math.max(0, playerHealth - reflected);
          playerTurnReactions.push({ type: 'item_refletir', label: `💥 Refletiu ${reflected.toFixed(0)} de dano de volta!`, color: '#f0abfc', value: reflected });
        }

        // Barreira de item do oponente (absorve ataque inteiro)
        let actualDamage = result.damage + (result.secondHitDamage || 0);
        if (opponentState.barrierActiveThisTurn) {
          playerTurnReactions.push({ type: 'item_barreira_absorveu', label: '🛡️ Barreira absorveu o ataque!', color: '#38bdf8' });
          actualDamage = 0;
          opponentState.barrierActiveThisTurn = false;
        }
        // Doton lv10: barreira absorve 50% do primeiro dano
        if (!opponentState.barrierUsed && (opponentFighter.elementLevels?.['Doton'] || 0) >= 10) {
          actualDamage *= 0.5;
          opponentState.barrierUsed = true;
          playerTurnReactions.push({ type: 'barrier_blocked', label: '🪨 Passiva Doton! Barreira absorveu 50% do dano', color: '#78716c' });
        }
        
        roundData.player_damage = Math.round(actualDamage);
        roundData.player_jutsu = result.jutsuUsed;

        result.damage = actualDamage;
        result.secondHitDamage = undefined;
        
        opponentHealth -= actualDamage;
        opponentHealth = Math.max(0, opponentHealth);
        
        log.push(buildLogEntry({
          turn, attacker: 'player', attackType: playerAttackType, result,
          playerHealth, playerMaxHealth, opponentHealth, opponentMaxHealth,
          attackerBuild: playerBuild, regenApplied: playerRegen, burnDamageApplied: playerBurnThisTurn,
          reactionEffects: playerTurnReactions,
        }));
      } else {
        log.push(`Turno ${turn} (Você): Você não conseguiu atacar.`);
      }
      
      if (opponentHealth <= 0) {
        battleWinner = 'player';
        roundData.winner = user.id;
        const ryoWon = Math.floor((opponent.ryo || 0) * 0.05);
        const xpWon = 20;
        log.push(`${playerFighter.name} venceu a batalha e ganhou ${ryoWon} Ryo e ${xpWon} XP!`);
        
        roundsForDB.push(roundData);
        
        const newExperience = (userProfile.experience || 0) + xpWon;
        const { level: newLevel } = getLevelFromXp(newExperience);
        
        const playerFinalHealth = Math.max(0, Math.round(playerHealth));
        
        const playerUpdatePayload: any = {
          ryo: (userProfile.ryo || 0) + ryoWon,
          experience: newExperience,
          current_health: playerFinalHealth,
          is_recovering: false,
        };
      
        if (newLevel > userProfile.level) {
          const newMaxExperience = getXpForLevel(newLevel + 1);
          const levelsGained = newLevel - userProfile.level;
          const newStatPoints = (userProfile.stat_points || 0) + (levelsGained * 5);
          
          playerUpdatePayload.level = newLevel;
          playerUpdatePayload.max_experience = newMaxExperience;
          playerUpdatePayload.stat_points = newStatPoints;
        }
      
        await supabase
          .from('profiles')
          .update(playerUpdatePayload)
          .eq('id', user.id);
        
        await supabase
          .from('battle_reports')
          .insert({
            user_id: user.id,
            opponent_id: opponent.id,
            is_victory: true,
            ryo_gained: ryoWon,
            xp_gained: xpWon,
            ryo_lost: 0,
            final_health: playerFinalHealth,
            rounds: roundsForDB,
            rich_log: log,
            viewed: false,
          });
        
        await supabase
          .from('battle_reports')
          .insert({
            user_id: opponent.id,
            opponent_id: user.id,
            is_victory: false,
            ryo_gained: 0,
            xp_gained: 0,
            ryo_lost: Math.floor((opponent.ryo || 0) * 0.05),
            final_health: 0,
            rounds: roundsForDB.map(r => ({
              ...r,
              player_damage: r.opponent_damage,
              opponent_damage: r.player_damage,
              player_jutsu: r.opponent_jutsu,
              opponent_jutsu: r.player_jutsu,
              winner: r.winner === user.id ? opponent.id : user.id,
            })),
            rich_log: log,
            viewed: false,
          });
  
        await supabase
          .from('profiles')
          .update({ 
            current_health: 0,
            is_recovering: false,
          })
          .eq('id', opponent.id);
        
        break;
      }
  
      // ===== TURNO DO OPONENTE =====
      const opponentAttackType = getRandomAttackType(opponentFighter, opponentStats);
      
      if (opponentAttackType) {
        const resultOpp = calculateDamage(opponentFighter, playerFighter, opponentAttackType, {
          equipmentData: EQUIPMENT_DATA,
          attackerBuild: opponentBuild,
          defenderBuild: playerBuild,
          attackerState: opponentState,
          defenderState: playerState,
          isFirstTurn: turn === 1,
          attackerHpPct: opponentHealth / opponentMaxHealth,
          defenderHpPct: playerHealth / playerMaxHealth,
          defenderMaxHealth: playerMaxHealth,
        });

        // Passivas ao_receber_dano do player (barreira de item, refletir)
        const recvResultP = { damage: resultOpp.damage, log: '', isCritical: false, buildEffects: [] } as any;
        applyItemPassives(playerFighter, 'ao_receber_dano', recvResultP, opponentState, playerState,
          playerHealth / playerMaxHealth, opponentHealth / opponentMaxHealth, opponentMaxHealth);
        // NÃO misturar no buildEffects — vão para reactionEffects separado
        const oppTurnReactions: BuildEffect[] = [...(recvResultP.buildEffects || [])];

        // Refletir: dano devolvido ao oponente
        if (playerState.reflectDamage > 0) {
          const reflected = playerState.reflectDamage;
          playerState.reflectDamage = 0;
          opponentHealth = Math.max(0, opponentHealth - reflected);
          oppTurnReactions.push({ type: 'item_refletir', label: `💥 Refletiu ${reflected.toFixed(0)} de dano de volta!`, color: '#f0abfc', value: reflected });
        }

        // Barreira de item do player
        let actualDmgOpp = resultOpp.damage + (resultOpp.secondHitDamage || 0);
        if (playerState.barrierActiveThisTurn) {
          oppTurnReactions.push({ type: 'item_barreira_absorveu', label: '🛡️ Barreira absorveu o ataque!', color: '#38bdf8' });
          actualDmgOpp = 0;
          playerState.barrierActiveThisTurn = false;
        }
        // Doton lv10: barreira player
        if (!playerState.barrierUsed && (playerFighter.elementLevels?.['Doton'] || 0) >= 10) {
          actualDmgOpp *= 0.5;
          playerState.barrierUsed = true;
          oppTurnReactions.push({ type: 'barrier_blocked', label: '🪨 Passiva Doton! Barreira absorveu 50% do dano', color: '#78716c' });
        }
        
        roundData.opponent_damage = Math.round(actualDmgOpp);
        roundData.opponent_jutsu = resultOpp.jutsuUsed;

        resultOpp.damage = actualDmgOpp;
        resultOpp.secondHitDamage = undefined;
        
        playerHealth -= actualDmgOpp;
        playerHealth = Math.max(0, playerHealth);

        // Kairai: sobreviver à morte
        if (playerBuild === 'imortal' && playerHealth <= 0 && !playerState.survivedDeathUsed && Math.random() < 0.2) {
          playerHealth = 1;
          playerState.survivedDeathUsed = true;
          oppTurnReactions.push({ type: 'survived_death', label: '💀 Vontade de Ferro! Sobreviveu com 1 HP!', color: '#64748b' });
        }
        
        log.push(buildLogEntry({
          turn, attacker: 'opponent', attackType: opponentAttackType, result: resultOpp,
          playerHealth, playerMaxHealth, opponentHealth, opponentMaxHealth,
          attackerBuild: opponentBuild, regenApplied: opponentRegen, burnDamageApplied: opponentBurnThisTurn,
          reactionEffects: oppTurnReactions,
        }));
      } else {
        log.push(`Turno ${turn} (Oponente): ${opponentFighter.name} não conseguiu atacar.`);
      }
      
      if (roundData.player_damage > roundData.opponent_damage) {
        roundData.winner = user.id;
      } else if (roundData.opponent_damage > roundData.player_damage) {
        roundData.winner = opponent.id;
      } else {
        roundData.winner = null;
      }
      
      roundsForDB.push(roundData);
  
      if (playerHealth <= 0) {
        battleWinner = 'opponent';
        const ryoLost = Math.floor((userProfile.ryo || 0) * 0.05);
        log.push(`${opponentFighter.name} venceu. Você perdeu ${ryoLost} Ryo.`);
        
        const opponentFinalHealth = Math.max(0, Math.round(opponentHealth));
        
        await supabase
          .from('battle_reports')
          .insert({
            user_id: user.id,
            opponent_id: opponent.id,
            is_victory: false,
            ryo_gained: 0,
            xp_gained: 0,
            ryo_lost: ryoLost,
            final_health: 0,
            rounds: roundsForDB,
            rich_log: log,
            viewed: false,
          });
        
        await supabase
          .from('battle_reports')
          .insert({
            user_id: opponent.id,
            opponent_id: user.id,
            is_victory: true,
            ryo_gained: ryoLost,
            xp_gained: 20,
            ryo_lost: 0,
            final_health: opponentFinalHealth,
            rounds: roundsForDB.map(r => ({
              ...r,
              player_damage: r.opponent_damage,
              opponent_damage: r.player_damage,
              player_jutsu: r.opponent_jutsu,
              opponent_jutsu: r.player_jutsu,
              winner: r.winner === user.id ? opponent.id : r.winner === opponent.id ? user.id : null,
            })),
            rich_log: log,
            viewed: false,
          });
  
        await supabase
          .from('profiles')
          .update({
            ryo: Math.max(0, (userProfile.ryo || 0) - ryoLost),
            current_health: 0,
            is_recovering: false,
          })
          .eq('id', user.id);
        
        await supabase
          .from('profiles')
          .update({ 
            current_health: opponentFinalHealth,
            ryo: (opponent.ryo || 0) + ryoLost,
            experience: (opponent.experience || 0) + 20,
            is_recovering: false,
          })
          .eq('id', opponent.id);
        
        break;
      }
      
      turn++;
    }
  
    if (turn >= 50) {
      log.push("A batalha foi longa demais e terminou em empate.");
      battleWinner = "Empate";
    }
  
    const battleReport = {
      battleLog: log,
      winner: battleWinner === 'player' ? playerFighter.name : battleWinner === 'opponent' ? opponentFighter.name : "Empate",
      opponent: opponent,
    };
    
    localStorage.setItem('lastBattleReport', JSON.stringify(battleReport));

    // Inicia cooldown após batalha
    setSearchCooldown(SEARCH_COOLDOWN_SECONDS);

    window.location.reload();
  };

  const handleStartHunt = async () => {
    if (!userProfileRef || !supabase || !userProfile || userProfile.active_mission) return;

    const duration = parseInt(huntDuration);
    if (isNaN(duration) || duration <= 0) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    try {
      await supabase
        .from('profiles')
        .update({
          active_hunt: {
            startTime,
            endTime,
            duration,
          },
          daily_hunt_time_used: (userProfile.daily_hunt_time_used || 0) + duration,
        })
        .eq('id', user!.id);
      
      toast({ title: 'Caçada Iniciada!', description: `Você começou a caçar por ${duration/60} minutos.` });
      window.location.reload();
    } catch (error) {
      console.error("Error starting hunt:", error);
      toast({ variant: 'destructive', title: 'Erro ao iniciar caçada' });
    }
  };

  const handleSearchOpponent = async () => {
    if (!userProfile || !supabase || !user) return;
    
    if (userProfile.active_mission) {
      toast({
        variant: 'destructive',
        title: 'Impossível Buscar Oponente',
        description: 'Você está em uma missão. Complete-a primeiro.',
      });
      return;
    }
    
    // ✅ VERIFICAÇÃO DE VIDA
    const currentHealth = userProfile.current_health ?? 0;
    if (currentHealth < 100) {
      toast({
        variant: 'destructive',
        title: 'Vida Insuficiente',
        description: `Você precisa de pelo menos 100 de vida para procurar um oponente. Você tem ${currentHealth}.`,
      });
      return;
    }
    
    // ✅ VERIFICAÇÃO DE CHAKRA
    const currentChakra = userProfile.current_chakra ?? userProfile.max_chakra ?? 150;
    if (currentChakra < 50) {
      toast({
        variant: 'destructive',
        title: 'Chakra Insuficiente',
        description: `Você precisa de 50 chakra para procurar um oponente. Você tem ${currentChakra}.`,
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      const minLevel = Math.max(1, userProfile.level - 2);
      const maxLevel = userProfile.level + 2;
      
      const { data: potentialOpponents, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, level, avatar_url, village, vitality, intelligence, taijutsu, ninjutsu, genjutsu, selo, element_levels, weapon_id, summon_id, chest_id, legs_id, feet_id, hands_id, cursed_seal, doujutsu, current_health, ryo, experience')
        .neq('id', user.id)
        .gte('level', minLevel)
        .lte('level', maxLevel)
        .limit(20);
      
      if (fetchError) throw fetchError;
      
      if (!potentialOpponents || potentialOpponents.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum Oponente Encontrado',
          description: 'Não há ninjas disponíveis no seu nível.',
        });
        setIsSearching(false);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * potentialOpponents.length);
      const selectedOpponent = potentialOpponents[randomIndex];
      
      setOpponent(selectedOpponent);
      
      // ✅ DESCONTAR 50 CHAKRA
      const newChakra = Math.max(0, currentChakra - 50);
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_chakra: newChakra
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar chakra:', updateError);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar oponente',
          description: updateError.message || 'Erro ao atualizar dados.',
        });
        setIsSearching(false);
        return;
      }
      
      if (!updateData || updateData.length === 0) {
        console.error('⚠️ Nenhum registro atualizado');
        toast({
          variant: 'destructive',
          title: 'Erro na atualização',
          description: 'Nenhum dado foi modificado.',
        });
        setIsSearching(false);
        return;
      }
      
      toast({
        title: 'Oponente Encontrado!',
        description: `Você encontrou ${selectedOpponent.name} (Nv. ${selectedOpponent.level}). Chakra restante: ${newChakra}`,
      });
      
      // Inicia cooldown após procurar oponente
      setSearchCooldown(SEARCH_COOLDOWN_SECONDS);
      
    } catch (error: any) {
      console.error('Erro ao buscar oponente:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Buscar Oponente',
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setIsSearching(false);
    }
  };


  const handleCompleteHunt = async () => {
    if (!userProfileRef || !userProfile || !activeHunt || !supabase) return;
    
    // Recompensas fixas independente do tempo
const ryoReward = 100;
const xpReward = 10;

    try {
      const updatePayload: any = {
        active_hunt: null,
        ryo: (userProfile.ryo || 0) + ryoReward,
        experience: (userProfile.experience || 0) + xpReward
      };

      const newExperience = (userProfile.experience || 0) + xpReward;
      const { level: newLevel } = getLevelFromXp(newExperience);
      
      if(newLevel > userProfile.level) {
          const newMaxExperience = getXpForLevel(newLevel + 1);
          const levelsGained = newLevel - userProfile.level;
          const newStatPoints = (userProfile.stat_points || 0) + (levelsGained * 5);
          
          updatePayload.level = newLevel;
          updatePayload.max_experience = newMaxExperience;
          updatePayload.stat_points = newStatPoints;
      }

      await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user!.id);

      toast({ title: 'Caçada Concluída!', description: `Você obteve ${ryoReward.toFixed(0)} Ryo e ${xpReward.toFixed(0)} XP!` });
      window.location.reload();
    } catch (error) {
      console.error("Error completing hunt:", error);
      toast({ variant: 'destructive', title: 'Erro ao completar a caçada' });
    }
  };

  // 🆕 CALCULAR LIMITE BASEADO NO VIP
const huntLimit = hasPremiumPass ? DAILY_HUNT_LIMIT_SECONDS_VIP : DAILY_HUNT_LIMIT_SECONDS;

// 🆕 CALCULAR OPÇÕES DE TEMPO (12 slots para base, 24 para VIP)
const maxSlots = hasPremiumPass ? 24 : 12;
const timeOptions = Array.from({ length: maxSlots }, (_, i) => (i + 1) * 5);

const dailyHuntTimeUsed = userProfile?.daily_hunt_time_used || 0;
const remainingHuntTime = Math.max(0, huntLimit - dailyHuntTimeUsed);
  const isHuntComplete = activeHunt && huntTimeRemaining !== null && huntTimeRemaining <= 0;

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Carregando Caçadas..." description="Preparando as áreas de caça." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para começar a caçar." />
        <Button asChild className="mt-6">
          <Link href="/create-character">Criar Personagem</Link>
        </Button>
      </div>
    );
  }
  
  if (activeHunt) {
    return (
      <div>
        <PageHeader
          title="Caçando..."
          description="Você está em busca de alvos. Aguarde o resultado."
        />
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Missão de Caça em Andamento</CardTitle>
            <CardDescription>Aguarde o tempo selecionado para ver os resultados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
            <Timer className="h-16 w-16 text-primary animate-pulse" />
            <p className="font-mono text-4xl font-bold text-primary">
              {huntTimeRemaining !== null ? formatDuration(Math.floor(huntTimeRemaining)) : '00:00'}
            </p>
            <p className="text-muted-foreground">Tempo restante para concluir a caçada</p>
          </CardContent>
          {!isUserLoading && isHuntComplete && (
            <CardFooter>
              <Button className="w-full" onClick={handleCompleteHunt}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Concluir Caçada
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Caçadas"
        description="Cace outros ninjas para ganhar recompensas e provar seu valor."
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Buscar Alvo por Nível</CardTitle>
            <CardDescription>Encontre um oponente aleatório com um nível próximo ao seu (±2 níveis). Custo: 50 Chakra</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSearching && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
              </div>
            )}
            
            {opponent && (
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-4">
                  <img 
                    src={opponent.avatar_url || 'https://images.unsplash.com/photo-1608745128320-9291dfb0e12d'} 
                    alt={opponent.name} 
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <div className="space-y-1">
                    <p className="text-xl font-bold">{opponent.name}</p>
                    <p className="text-sm text-muted-foreground">Nível: {opponent.level}</p>
                    <p className="text-sm text-muted-foreground">Vila: {opponent.village || 'Desconhecida'}</p>
                  </div>
                </div>
              </Card>
            )}

            {battleLog.length > 0 && opponent && (
              <BattleReport
                log={battleLog}
                playerName={userProfile?.name || 'Você'}
                opponentName={opponent.name || 'Oponente'}
                context="hunt"
                playerLevel={userProfile?.level}
                opponentLevel={opponent?.level}
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
                  context="hunt"
                />
              );
            })()}
          </CardContent>  {/* ← Fechar CardContent aqui */}
          <CardFooter>  {/* ← CardFooter fora de CardContent */}
  {!opponent || winner ? (
    <Button 
      className="w-full" 
      onClick={handleSearchOpponent} 
      disabled={
        isSearching || 
        !!userProfile.active_mission || 
        (userProfile.current_health ?? 0) < 100 ||
        (userProfile.current_chakra ?? 150) < 50 ||
        searchCooldown > 0
      }
    >
      <Search className="mr-2 h-4 w-4" />
      {searchCooldown > 0
  ? `Aguarde ${searchCooldown}s`
  : !!userProfile.active_mission 
    ? 'Você está em uma missão' 
    : (userProfile.current_health ?? 0) < 100
      ? `Vida insuficiente (${userProfile.current_health ?? 0}/100)`
      : (userProfile.current_chakra ?? 150) < 50
        ? `Chakra insuficiente (${userProfile.current_chakra ?? 150}/50)`
        : winner 
          ? 'Procurar Outro Oponente (50 Chakra)' 
          : 'Procurar Oponente (50 Chakra)'}
    </Button>
  ) : (
    <Button className="w-full" onClick={handleBattle} disabled={!!winner}>
      <Swords className="mr-2 h-4 w-4" />
      Batalhar
    </Button>
  )}
</CardFooter>
        </Card>



        <Card>
          <CardHeader>
            <CardTitle>Caçar por Tempo</CardTitle>
            <CardDescription>Envie seu personagem para caçar por um período. Você não poderá fazer outras ações durante este tempo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="p-3 rounded-md border text-center">
  <p className="text-sm text-muted-foreground">
    Tempo diário de caçada restante
    {hasPremiumPass && (
      <span className="ml-2 text-xs font-bold text-yellow-500">⭐ VIP (120 min)</span>
    )}
  </p>
  <p className="text-2xl font-bold text-primary">
    {Math.floor(remainingHuntTime/60)} minutos
  </p>
</div>
            
            <div className="space-y-2">
  <label className="text-sm font-medium">Selecione a duração</label>
  <Select value={huntDuration} onValueChange={setHuntDuration}>
    <SelectTrigger className="h-12 text-base font-semibold bg-card border-2">
      <SelectValue placeholder="Selecionar tempo..." />
    </SelectTrigger>
    <SelectContent 
      className="max-h-[300px] bg-card border-2 shadow-xl z-50"
      position="popper"
      sideOffset={5}
    >
      {timeOptions.map(time => (
        <SelectItem 
          key={time} 
          value={(time * 60).toString()} 
          disabled={time*60 > remainingHuntTime}
          className="text-base font-medium py-3 cursor-pointer hover:bg-accent focus:bg-accent data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
        >
          <div className="flex items-center justify-between w-full gap-4">
            <span className="font-bold">{time} minutos</span>
            <span className="text-xs text-muted-foreground">
  (100 Ryo / 10 XP)
</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleStartHunt} 
              disabled={remainingHuntTime <= 0 || !!activeHunt || !!userProfile.active_mission}
            >
              <Timer className="mr-2 h-4 w-4" />
              {!!userProfile.active_mission ? 'Você está em uma missão' : remainingHuntTime <= 0 ? 'Tempo diário esgotado' : 'Iniciar Caçada'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}