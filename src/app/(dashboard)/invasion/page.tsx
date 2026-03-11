'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Swords, Hourglass, Shield, Heart, Loader2, RefreshCw, Skull, Target, Clock, Trophy, Coins, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import seedrandom from 'seedrandom';
import { bossesData, type BossData } from '@/lib/bosses-data';
import { 
  calculateDamage,
  getRandomAttackType,
  calculateDynamicStats,
  detectBuild,
  getBuildInfo,
  emptyBattleState,
  buildLogEntry,
  calcLogStats,
  JUTSU_GIFS
} from '@/lib/battle-system';
import type { RichBattleLogEntry, BuildEffect } from '@/lib/battle-system';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';
import { applyItemPassives } from '@/lib/battle-system/calculator';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { BattleReport, BattleResult } from '@/components/battle-report';

// ✅ CONSTANTES DO BOSS
const BOSS_DOC_ID = 'current_boss';
const ATTACK_COOLDOWN = 10 * 60 * 1000; // 10 minutes in milliseconds
const BOSS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const BOSS_RESPAWN_TIME = 24 * 60 * 60 * 1000; // 24 hours after defeat
const BOSS_DEFEAT_REWARD_RYO = 100000;
const BOSS_DEFEAT_REWARD_STAT_POINTS = 10;

// ✅ MILESTONES DE DANO
const DAMAGE_MILESTONES = [
  { damage: 10000, ryo: 500, label: "10k" },
  { damage: 25000, ryo: 1200, label: "25k" },
  { damage: 50000, ryo: 2500, label: "50k" },
  { damage: 75000, ryo: 4000, label: "75k" },
  { damage: 100000, ryo: 6000, label: "100k" },
  { damage: 150000, ryo: 9000, label: "150k" },
  { damage: 200000, ryo: 12500, label: "200k" },
  { damage: 300000, ryo: 18000, label: "300k" },
  { damage: 500000, ryo: 30000, label: "500k" },
  { damage: 750000, ryo: 45000, label: "750k" },
  { damage: 1000000, ryo: 65000, label: "1M" },
];

// ✅ SISTEMA DE DROPS
const BOSS_DROPS = {
  comum: [
    {
      id: 'xp_scroll_small',
      name: 'Pergaminho de XP Pequeno',
      description: 'Concede XP baseado no seu nível',
      effect: 'xp_multiplier',
      multiplier: 25,
      dropChance: 0.002,
      rarity: 'comum',
      icon: '📜'
    },
    {
      id: 'ryo_pouch_small',
      name: 'Bolsa de Ryo',
      description: 'Uma pequena fortuna em moedas (2.000 Ryo)',
      effect: 'ryo',
      amount: 2000,
      dropChance: 0.002,
      rarity: 'comum',
      icon: '💰'
    },
    {
      id: 'healing_ointment',
      name: 'Pomada Medicinal',
      description: 'Restaura 30% da vida máxima',
      effect: 'heal_percent',
      percent: 30,
      dropChance: 0.0015,
      rarity: 'comum',
      icon: '🧴'
    },
    {
      id: 'chakra_tonic',
      name: 'Tônico de Chakra',
      description: 'Restaura 25% do chakra máximo',
      effect: 'chakra_percent',
      percent: 25,
      dropChance: 0.0015,
      rarity: 'comum',
      icon: '⚗️'
    },
    {
      id: 'training_weights',
      name: 'Pesos de Treinamento',
      description: 'Aumenta ganho de XP em missões por 24h (15%)',
      effect: 'xp_boost_24h',
      percent: 15,
      dropChance: 0.001,
      rarity: 'comum',
      icon: '🏋️'
    },
    {
      id: 'fortune_charm',
      name: 'Amuleto da Fortuna',
      description: 'Aumenta Ryo ganho em missões por 24h (20%)',
      effect: 'ryo_boost_24h',
      percent: 20,
      dropChance: 0.001,
      rarity: 'comum',
      icon: '🧿'
    },
  ],
  raro: [
    {
      id: 'stat_enhancement_pill',
      name: 'Pílula de Aprimoramento',
      description: 'Libera pontos de atributo adicionais (+3)',
      effect: 'stat_points',
      amount: 3,
      dropChance: 0.0008,
      rarity: 'raro',
      icon: '💊'
    },
    {
      id: 'element_training_scroll',
      name: 'Pergaminho de Treinamento Elemental',
      description: 'Acelera o domínio de um elemento (+200 XP)',
      effect: 'element_xp',
      amount: 200,
      dropChance: 0.0008,
      rarity: 'raro',
      icon: '📖'
    },
    {
      id: 'xp_scroll_medium',
      name: 'Pergaminho de XP Médio',
      description: 'Maior quantidade de experiência',
      effect: 'xp_multiplier',
      multiplier: 50,
      dropChance: 0.0006,
      rarity: 'raro',
      icon: '📜'
    },
    {
      id: 'ryo_pouch_large',
      name: 'Bolsa de Ryo Grande',
      description: 'Uma fortuna considerável (8.000 Ryo)',
      effect: 'ryo',
      amount: 8000,
      dropChance: 0.0005,
      rarity: 'raro',
      icon: '💰'
    },
    {
      id: 'jutsu_refinement_manual',
      name: 'Manual de Refinamento de Jutsu',
      description: 'Melhora a eficiência dos jutsus (+500 XP)',
      effect: 'jutsu_xp',
      amount: 500,
      dropChance: 0.0003,
      rarity: 'raro',
      icon: '📕'
    },
  ],
  epico: [
    {
      id: 'xp_scroll_large',
      name: 'Pergaminho de XP Grande',
      description: 'Experiência massiva concentrada',
      effect: 'xp_multiplier',
      multiplier: 80,
      dropChance: 0.00015,
      rarity: 'épico',
      icon: '📜'
    },
    {
      id: 'master_training_manual',
      name: 'Manual do Mestre',
      description: 'Conhecimento condensado de múltiplas artes (+2 pontos em dois atributos diferentes)',
      effect: 'dual_stat_points',
      amount: 2,
      dropChance: 0.00015,
      rarity: 'épico',
      icon: '📚'
    },
    {
      id: 'elemental_mastery_orb',
      name: 'Orbe de Maestria Elemental',
      description: 'Energia elemental pura concentrada (+500 XP em dois elementos)',
      effect: 'dual_element_xp',
      amount: 500,
      dropChance: 0.0001,
      rarity: 'épico',
      icon: '🔮'
    },
  ],
  lendario: [
    {
      id: 'legendary_stat_orb',
      name: 'Orbe Lendário de Poder',
      description: 'Poder condensado dos deuses shinobi (+10 pontos em TODOS os atributos)',
      effect: 'all_stats',
      amount: 10,
      dropChance: 0.0001,
      rarity: 'lendário',
      icon: '✨'
    },
    {
      id: 'eternal_youth_elixir',
      name: 'Elixir da Juventude Eterna',
      description: 'Restaura completamente vida e chakra + buff temporário (+20% por 1 hora)',
      effect: 'full_restore_buff',
      buffDuration: 60 * 60 * 1000,
      buffPercent: 20,
      dropChance: 0.00005,
      rarity: 'lendário',
      icon: '🍶'
    },
    {
      id: 'sage_blessing_scroll',
      name: 'Pergaminho da Bênção do Sábio',
      description: 'Conhecimento ancestral dos Seis Caminhos (+5 pontos em três  atributo diferentes)',
      effect: 'triple_stat_points',
      amount: 5,
      dropChance: 0.00004,
      rarity: 'lendário',
      icon: '📜'
    },
    {
      id: 'forbidden_technique_scroll',
      name: 'Pergaminho de Técnica Proibida',
      description: 'Acelera drasticamente o aprendizado (+1000 XP em elementos E jutsus)',
      effect: 'element_and_jutsu_xp',
      amount: 1000,
      dropChance: 0.00001,
      rarity: 'lendário',
      icon: '📖'
    },
  ],
};

// ✅ FUNÇÃO PARA CALCULAR DROPS
const calculateDrops = () => {
  const droppedItems: any[] = [];
  const allDrops = [
    ...BOSS_DROPS.comum,
    ...BOSS_DROPS.raro,
    ...BOSS_DROPS.epico,
    ...BOSS_DROPS.lendario,
  ];

  allDrops.forEach(item => {
    const roll = Math.random();
    if (roll < item.dropChance) {
      droppedItems.push(item);
    }
  });

  return droppedItems;
};

// ✅ FUNÇÃO DE FORMATAÇÃO DE TEMPO
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
};

// ✅ TIPO DE BATTLE LOG
type BattleLogEntry = RichBattleLogEntry;

export default function InvasionPage() {
  const { user, supabase, isUserLoading: isAuthLoading } = useSupabase();
  const { toast } = useToast();
  
  // ✅ ESTADOS
  const [isAttacking, setIsAttacking] = useState(false);
  const [lastBattleLog, setLastBattleLog] = useState<BattleLogEntry[]>([]);
  const [lastDrops, setLastDrops] = useState<any[]>([]);
  const [lastBattlePlayerDied, setLastBattlePlayerDied] = useState(false);
  const [timeUntilAttack, setTimeUntilAttack] = useState(0);
  const [timeUntilRespawn, setTimeUntilRespawn] = useState(0);
  const [isPageReady, setIsPageReady] = useState(false);
  
  const [newMilestonesUnlocked, setNewMilestonesUnlocked] = useState<typeof DAMAGE_MILESTONES>([]);
 


  useEffect(() => {
    const savedLog = localStorage.getItem('lastBattleLog');
    if (savedLog) {
      try {
        const parsedLog = JSON.parse(savedLog);
        setLastBattleLog(parsedLog);
        localStorage.removeItem('lastBattleLog');
        setIsPageReady(true);
      } catch (error) {
        console.error('Erro ao recuperar battle log:', error);
      }
    }
  }, []);

  const userProfileRef = useMemoSupabase(() => user ? { table: 'profiles', id: user.id } : null, [user]);
  const bossRef = useMemoSupabase(() => ({ table: 'world_bosses', id: BOSS_DOC_ID }), []);
//                                               ^^^^^^^^^^^^^ com underscore

  const { data: userProfile, isLoading: isUserLoading, setData: setUserProfile } = useDoc(userProfileRef);
  const { data: boss, isLoading: isBossLoading, setData: setBossData } = useDoc(bossRef);

  const currentBossData = useMemo(() => {
    if (!boss?.boss_id) return null;
    return bossesData.find(b => b.id === boss.boss_id);
  }, [boss?.boss_id]);

  const setupNewBoss = async (bossReference: any, bossSetter: any) => {
    if (!bossReference || !supabase) return;
    
    const rng = seedrandom(Date.now().toString());
    const newBossTemplate = bossesData[Math.floor(rng() * bossesData.length)];
    
    const newBossData = {
      id: bossReference.id,
      boss_id: newBossTemplate.id,
      name: newBossTemplate.name,
      description: newBossTemplate.description,
      level: newBossTemplate.bossLevel,
      boss_level: newBossTemplate.bossLevel,
      max_health: newBossTemplate.totalHealth,
      current_health: newBossTemplate.totalHealth,
      status: 'active',
      last_defeated_at: null,
      last_defeated_by: null,
      total_attacks: 0,
      respawn_at: null,
      spawned_at: Date.now(),
      expires_at: Date.now() + BOSS_DURATION,
    };
    
    await supabase
      .from('world_bosses')
      .upsert(newBossData);
    
    // ✅ RESETAR DANO E MILESTONES DE TODOS OS JOGADORES
    // Nota: O Supabase pode bloquear updates em massa via Client SDK por segurança (RLS).
    // O ideal é usar uma RPC (Stored Procedure) para isso.
    try {
      await supabase
        .from('profiles')
        .update({ 
          boss_damage_dealt: 0,
          boss_damage_milestones_claimed: []
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.error("Erro ao resetar perfis globalmente:", err);
    }
    
    // ✅ RESETAR DANO NO PERFIL LOCAL TAMBÉM
    if (setUserProfile) {
      setUserProfile((prev: any) => prev ? {
        ...prev,
        boss_damage_dealt: 0,
        boss_damage_milestones_claimed: []
      } : prev);
    }

    bossSetter(newBossData);
    setLastBattleLog([]);
  };


  useEffect(() => {
    if (isBossLoading || isAuthLoading || !user || !supabase || !bossRef) return;
  
    const checkAndSetupBoss = async () => {
      const { data: bossData, error } = await supabase
        .from('world_bosses')
        .select('*')
        .eq('id', bossRef.id)
        .single();
      
      const now = Date.now();
      
      if (error || !bossData) {
          await setupNewBoss(bossRef, setBossData);
      } else if (bossData.status === 'defeated' && bossData.respawn_at && now >= bossData.respawn_at) {
          // Só reseta se o status for 'defeated' E o tempo de respawn passou
          await setupNewBoss(bossRef, setBossData);
      } else if (bossData.status === 'active' && bossData.expires_at && now >= bossData.expires_at) {
          // Só reseta por expiração se o boss ainda estiver ativo
          await setupNewBoss(bossRef, setBossData);
      } else if (bossData && userProfile) {
          // ✅ GARANTIR RESET LOCAL: Se o ID do boss mudou mas o dano do player não resetou
          // Isso resolve o problema de jogadores que ficaram com dano acumulado de bosses anteriores
          const currentBossInProfile = userProfile.boss_damage_milestones?.current_boss_id;
          const actualBossId = bossData.boss_id;

          if (currentBossInProfile && currentBossInProfile !== actualBossId) {
            const resetData = {
              boss_damage_dealt: 0,
              boss_damage_milestones_claimed: [],
              boss_damage_milestones: {
                ...userProfile.boss_damage_milestones,
                current_boss_id: actualBossId,
                total_damage: 0,
                claimed: []
              }
            };

            await supabase.from('profiles').update(resetData).eq('id', user.id);
            if (setUserProfile) setUserProfile((prev: any) => ({ ...prev, ...resetData }));
          }
      }
    }
  
    checkAndSetupBoss();
    
  }, [isBossLoading, isAuthLoading, user, supabase, bossRef, setBossData, userProfile, setUserProfile]);


  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      if (userProfile?.last_boss_attack) {
        const lastAttack = userProfile.last_boss_attack || 0;
        const timePassed = now - lastAttack;
        const remaining = Math.max(0, ATTACK_COOLDOWN - timePassed);
        setTimeUntilAttack(remaining);
      } else {
        setTimeUntilAttack(0);
      }

      if (boss) {
        if (boss.current_health <= 0 && boss.respawn_at) {
          const remainingRespawn = Math.max(0, boss.respawn_at - now);
          setTimeUntilRespawn(remainingRespawn);
          
          if (remainingRespawn === 0 && bossRef && user && supabase) {
            setupNewBoss(bossRef, setBossData);
          }
        } else if (boss.expires_at && boss.current_health > 0) {
          const remainingTime = Math.max(0, boss.expires_at - now);
          setTimeUntilRespawn(remainingTime);
          
          if (remainingTime === 0 && bossRef && user && supabase) {
            setupNewBoss(bossRef, setBossData);
          }
        } else {
          setTimeUntilRespawn(0);
        }
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [userProfile?.last_boss_attack, boss?.current_health, boss?.respawn_at, boss?.expires_at, bossRef, setBossData, user, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedLog = localStorage.getItem('lastBattleLog');
    if (savedLog) {
      try {
        const parsedLog = JSON.parse(savedLog);
        setLastBattleLog(parsedLog);
        localStorage.removeItem('lastBattleLog');
        setIsPageReady(true);
      } catch (error) {
        console.error('Erro ao recuperar battle log:', error);
      }
    }
  }, []);


  useEffect(() => {
    if (!supabase || !user) return;


    const channel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
        }
      )
      .subscribe((status) => {
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

// ✅ DEBUG: Mostrar info do último ataque
useEffect(() => {
  const debugInfo = localStorage.getItem('lastAttackDebug');
  if (debugInfo) {
    try {
      const parsed = JSON.parse(debugInfo);
      
      // Manter por 10 segundos antes de limpar
      setTimeout(() => {
        localStorage.removeItem('lastAttackDebug');
      }, 10000);
    } catch (error) {
      console.error('Erro ao ler debug:', error);
    }
  }
}, []);

  const canAttack = timeUntilAttack === 0;
  const isBossRespawning = boss?.current_health <= 0 && boss?.respawn_at && timeUntilRespawn > 0;



  const handleAttack = async () => {
    if (isAttacking || !isPageReady) {
      return;
    }
    
    if (!canAttack || !userProfile || !bossRef || !supabase || !userProfileRef || !boss || isBossRespawning) return;
    
    // ✅ ADICIONE ESTES LOGS AQUI
    
    setIsAttacking(true);
    setLastBattleLog([]);
  
    const playerStats = calculateFinalStats(userProfile);
    const bossLevel = boss?.boss_level || 100;
    const bossMaxHealth = boss?.max_health || 2000000;
    
    // ===== STATS DO BOSS (50% mais forte que o player) =====
    const bossStatsMultiplier = 1.5;
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
    const bossAttacker = {
      vitality:     (playerStats?.finalVitality    || 0) * bossStatsMultiplier,
      taijutsu:     (playerStats?.finalTaijutsu    || 0) * bossStatsMultiplier,
      ninjutsu:     (playerStats?.finalNinjutsu    || 0) * bossStatsMultiplier,
      genjutsu:     (playerStats?.finalGenjutsu    || 0) * bossStatsMultiplier,
      intelligence: (playerStats?.finalIntelligence|| 0) * bossStatsMultiplier,
      selo:         (playerStats?.finalSelo        || 0) * bossStatsMultiplier,
      elementLevels: userProfile.element_levels || {},
      jutsus: userProfile.jutsus || {},
      name: boss?.name || 'Boss',
      level: bossLevel,
    };

    // ===== BUILD DO PLAYER =====
    const playerBuild = detectBuild(playerStats!);
    const playerBuildInfo = getBuildInfo(playerBuild);
    const playerState = emptyBattleState();
    const bossState = emptyBattleState(); // boss não usa passivas ofensivas

    // Passivas de build que afetam HP máximo
    let playerMaxHealth = playerBuild === 'protetor'
      ? 100 + (playerStats?.finalVitality||0) * 15 + (playerStats?.finalIntelligence||0) * 8
      : playerStats?.maxHealth || 100;
    if (playerBuild === 'imortal') playerMaxHealth *= 1.25;

    // Regen
    if (playerBuild === 'guardiao') playerState.regenPercent = 0.03;
    const suitonLv = (playerFighter.elementLevels?.['Suiton'] || 0);
    if (suitonLv >= 10) playerState.regenPercent = Math.max(playerState.regenPercent, 0.05);

    // ===== MULTIPLICADOR DE DANO =====
    const PLAYER_DAMAGE_MULTIPLIER = Math.max(1, Math.floor(bossLevel / 10));

    // ===== VARIÁVEIS DE BATALHA =====
    // Começa com a vida atual do perfil (salva após cada batalha)
    const savedHp    = (userProfile as any)?.current_health ?? null;
    let playerHealth = savedHp != null
      ? Math.max(1, Math.min(playerMaxHealth, Math.floor(savedHp)))
      : playerMaxHealth;
    let totalPlayerDamage = 0;
    let playerDied = false;

    const battleLog: BattleLogEntry[] = [];
    battleLog.push(`⚔️ INVASÃO — ${boss.name} (Nível ${bossLevel}) | Build: ${playerBuildInfo.emoji} ${playerBuildInfo.name}`);
    battleLog.push(`[Boss: ${(bossMaxHealth / 1000000).toFixed(1)}M HP | Multiplicador: ×${PLAYER_DAMAGE_MULTIPLIER}]`);

    let turn = 1;
    while (playerHealth > 0) {

      // ── Promover barreira pending → ativa ──
      if (playerState.barrierPending) {
        playerState.barrierActiveThisTurn = true;
        playerState.barrierPending = false;
      } else {
        playerState.barrierActiveThisTurn = false;
      }

      // ── Passivas inicio_turno (regen de item, etc) ──
      const playerHpPct = playerHealth / playerMaxHealth;
      const dummyInvResult = { damage: 0, log: '', isCritical: false, buildEffects: [] } as any;
      applyItemPassives(playerFighter, 'inicio_turno', dummyInvResult, bossState, playerState, playerHpPct, 1.0, 999999);

      // Regen no início do turno
      let invPlayerRegen = 0;
      if (playerState.regenPercent > 0) {
        invPlayerRegen = playerMaxHealth * playerState.regenPercent;
        playerHealth = Math.min(playerMaxHealth, playerHealth + invPlayerRegen);
      }

      // Lifesteal do turno anterior
      if (playerState.lifestealHealed > 0) {
        playerHealth = Math.min(playerMaxHealth, playerHealth + playerState.lifestealHealed);
        invPlayerRegen += playerState.lifestealHealed;
        playerState.lifestealHealed = 0;
      }

      // Queimadura + Veneno
      let invPlayerBurn = 0;
      if (playerState.burnDamage > 0) {
        invPlayerBurn += playerState.burnDamage;
        playerHealth -= playerState.burnDamage;
        playerState.burnDamage = 0;
      }
      if (playerState.poisonDamage > 0) {
        invPlayerBurn += playerState.poisonDamage;
        playerHealth -= playerState.poisonDamage;
        playerState.poisonDamage = 0;
      }

      // ===== TURNO DO PLAYER =====
      const playerAttackType = getRandomAttackType(playerFighter, playerStats ?? undefined);

      if (playerAttackType) {
        const result = calculateDamage(playerFighter, bossAttacker, playerAttackType, {
          equipmentData: EQUIPMENT_DATA,
          isBoss: true,
          attackerBuild: playerBuild,
          attackerState: playerState,
          defenderState: bossState,
          isFirstTurn: turn === 1,
          attackerHpPct: playerHealth / playerMaxHealth,
          defenderHpPct: 1.0,
          defenderMaxHealth: bossMaxHealth,
        });

        const finalDamage = (result.damage + (result.secondHitDamage || 0)) * PLAYER_DAMAGE_MULTIPLIER;
        totalPlayerDamage += finalDamage;

        battleLog.push(buildLogEntry({
          turn,
          attacker: 'player',
          attackType: playerAttackType,
          result: { ...result, damage: result.damage * PLAYER_DAMAGE_MULTIPLIER, secondHitDamage: result.secondHitDamage ? result.secondHitDamage * PLAYER_DAMAGE_MULTIPLIER : undefined },
          playerHealth,
          playerMaxHealth,
          opponentHealth: Math.max(0, boss.current_health - totalPlayerDamage),
          opponentMaxHealth: bossMaxHealth,
          attackerBuild: playerBuild,
          regenApplied: invPlayerRegen,
          burnDamageApplied: invPlayerBurn,
        }));
      } else {
        battleLog.push(`Turno ${turn} (Você): Você não conseguiu atacar.`);
      }

      if (boss.current_health - totalPlayerDamage <= 0) break;

      // ===== TURNO DO BOSS =====
      const bossAttackType = getRandomAttackType(bossAttacker);

      if (bossAttackType) {
        const bossResult = calculateDamage(bossAttacker, playerFighter, bossAttackType, {
          equipmentData: EQUIPMENT_DATA,
          isBoss: true,
          defenderBuild: playerBuild,
          defenderState: playerState,
        });

        let bossDmg = bossResult.damage;

        // Passivas ao_receber_dano do player na invasion
        const recvInvResult = { damage: bossDmg, log: '', isCritical: false, buildEffects: [] } as any;
        applyItemPassives(playerFighter, 'ao_receber_dano', recvInvResult, bossState, playerState,
          playerHealth / playerMaxHealth, 1.0, bossMaxHealth);
        const invReactions: BuildEffect[] = [...(recvInvResult.buildEffects || [])];

        // Barreira de item do player
        if (playerState.barrierActiveThisTurn) {
          invReactions.push({ type: 'item_barreira_absorveu', label: '🛡️ Barreira absorveu o ataque!', color: '#38bdf8' });
          bossDmg = 0;
          playerState.barrierActiveThisTurn = false;
        }

        // Daikabe: -20% dano recebido
        if (playerBuild === 'tanque') bossDmg *= 0.80;
        // Shirogane: -15%
        if (playerBuild === 'protetor') bossDmg *= 0.85;
        // Doton lv10: barreira
        if (!playerState.barrierUsed && (playerFighter.elementLevels?.['Doton'] || 0) >= 10) {
          bossDmg *= 0.5;
          playerState.barrierUsed = true;
          invReactions.push({ type: 'barrier_blocked', label: '🪨 Barreira Doton absorveu 50%!', color: '#78716c' });
        }

        playerHealth -= bossDmg;

        // Kairai: sobreviver à morte (1x por batalha)
        if (playerBuild === 'imortal' && playerHealth <= 0 && !playerState.survivedDeathUsed && Math.random() < 0.2) {
          playerHealth = 1;
          playerState.survivedDeathUsed = true;
          invReactions.push({ type: 'survived_death', label: '💀 Vontade de Ferro! Sobreviveu com 1 HP!', color: '#64748b' });
        }

        battleLog.push(buildLogEntry({
          turn,
          attacker: 'boss',
          attackType: bossAttackType,
          result: { ...bossResult, damage: bossDmg },
          playerHealth: Math.max(0, playerHealth),
          playerMaxHealth,
          opponentHealth: Math.max(0, boss.current_health - totalPlayerDamage),
          opponentMaxHealth: bossMaxHealth,
          reactionEffects: invReactions,
        }));
      } else {
        battleLog.push(`Turno ${turn} (Chefe): ${boss.name} não conseguiu atacar.`);
      }

      if (playerHealth <= 0) {
        battleLog.push('💀 Você foi derrotado!');
        playerDied = true;
        break;
      }

      turn++;
      if (turn > 100) {
        battleLog.push('A batalha foi longa demais. Você sobreviveu!');
        break;
      }
    }

const finalDamageDealt = Math.max(0, Math.round(totalPlayerDamage));
    
// ===== ATUALIZAR BOSS NO BANCO =====
try {
  const newBossHealth = Math.max(0, (boss?.current_health || 0) - finalDamageDealt);
  
  const bossUpdate: any = {
    current_health: newBossHealth,
    total_attacks: (boss?.total_attacks || 0) + 1,
  };
  
  // ✅ CALCULAR DANO TOTAL E MILESTONES
  const currentPlayerDamage = userProfile.boss_damage_dealt || 0;
  const newPlayerDamage = currentPlayerDamage + finalDamageDealt;
  
  const claimedMilestones = userProfile.boss_damage_milestones_claimed || [];
  const unlockedMilestones = DAMAGE_MILESTONES.filter(
    milestone => newPlayerDamage >= milestone.damage && !claimedMilestones.includes(milestone.label)
  );
  
  let totalRyoReward = 0;
  const newClaimedMilestones = [...claimedMilestones];
  
  if (unlockedMilestones.length > 0) {
    unlockedMilestones.forEach(milestone => {
      totalRyoReward += milestone.ryo;
      newClaimedMilestones.push(milestone.label);
    });
    
    setNewMilestonesUnlocked(unlockedMilestones);
  }
  
  // ✅ VERIFICAR SE O BOSS FOI DERROTADO
  const isBossDefeated = newBossHealth < 10;
  
  // 🆕 CRIAR profileUpdate AQUI (ANTES DE USAR)
  const finalPlayerHealth = Math.max(0, Math.round(playerHealth));
  const profileUpdate: any = {
    last_boss_attack: Date.now(),
    current_health: finalPlayerHealth,
    boss_damage_dealt: newPlayerDamage,
    boss_damage_milestones: {
      ...userProfile.boss_damage_milestones,
      current_boss_id: boss.boss_id,
      total_damage: newPlayerDamage
    }
  };
  
  if (totalRyoReward > 0) {
    profileUpdate.ryo = (userProfile.ryo || 0) + totalRyoReward;
    profileUpdate.boss_damage_milestones_claimed = newClaimedMilestones;
  }
  
  // ✅ PROCESSAR DERROTA DO BOSS (DEPOIS DE CRIAR profileUpdate)
    if (isBossDefeated) {
      bossUpdate.status = 'defeated';
      bossUpdate.last_defeated_at = Date.now();
      bossUpdate.last_defeated_by = userProfile.name; // Alterado de character_name para name
      bossUpdate.respawn_at = Date.now() + BOSS_RESPAWN_TIME;
    
    battleLog.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    battleLog.push(`🎉 VITÓRIA! VOCÊ DERROTOU ${boss?.name?.toUpperCase()}! 🎉`);
    battleLog.push(`Vida final do boss: ${newBossHealth.toFixed(0)} HP`);
    
    // 🆕 RECOMPENSAS DO GOLPE FINAL
    battleLog.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    battleLog.push(`💰 RECOMPENSA DO GOLPE FINAL:`);
    battleLog.push(`+${BOSS_DEFEAT_REWARD_RYO.toLocaleString()} Ryo`);
    battleLog.push(`+${BOSS_DEFEAT_REWARD_STAT_POINTS} Pontos de Atributo`);
    
    // 🆕 ADICIONAR RECOMPENSAS AO PROFILE UPDATE
    totalRyoReward += BOSS_DEFEAT_REWARD_RYO;
    profileUpdate.ryo = (userProfile.ryo || 0) + totalRyoReward;
    profileUpdate.stat_points = (userProfile.stat_points || 0) + BOSS_DEFEAT_REWARD_STAT_POINTS;
  }
  
  // ✅ ATUALIZAR BOSS NO BANCO
  await supabase
    .from('world_bosses')
    .update(bossUpdate)
    .eq('id', BOSS_DOC_ID);
  
  setBossData({ ...boss, ...bossUpdate });
  
  // ✅ CALCULAR DROPS ANTES DO UPDATE
const droppedItems = calculateDrops();
setLastDrops(droppedItems);

if (droppedItems.length > 0) {
  const currentBossInventory = userProfile.boss_inventory || {};
  const updatedBossInventory = { ...currentBossInventory };
  droppedItems.forEach(item => {
    updatedBossInventory[item.id] = (updatedBossInventory[item.id] || 0) + 1;
  });
  profileUpdate.boss_inventory = updatedBossInventory;
}

// ✅ ATUALIZAR PERFIL DO JOGADOR (agora inclui boss_inventory)
await supabase
  .from('profiles')
  .update(profileUpdate)
  .eq('id', user!.id);

if (setUserProfile) {
  setUserProfile({ ...userProfile, ...profileUpdate });
}

setLastBattleLog(battleLog);
setLastBattlePlayerDied(playerDied);
localStorage.setItem('lastBattleLog', JSON.stringify(battleLog));

// ✅ FORÇAR RELOAD DO STATUS AO NAVEGAR
sessionStorage.removeItem('status-last-reload'); // ← ADICIONAR ESTA LINHA
  
  // ✅ TOAST COM RECOMPENSAS
  let toastDescription = `Você causou ${finalDamageDealt.toLocaleString()} de dano!`;
  
  if (totalRyoReward > 0) {
    toastDescription += `\n\n🎁 Bônus: +${totalRyoReward.toLocaleString()} Ryō!`;
    unlockedMilestones.forEach(m => {
      toastDescription += `\n• ${m.label} (${m.ryo.toLocaleString()} Ryō)`;
    });
    
    if (isBossDefeated) {
      toastDescription += `\n\n🏆 GOLPE FINAL!`;
      toastDescription += `\n• +${BOSS_DEFEAT_REWARD_RYO.toLocaleString()} Ryō`;
      toastDescription += `\n• +${BOSS_DEFEAT_REWARD_STAT_POINTS} Pontos de Atributo`;
    }
  }
  
  if (droppedItems.length > 0) {
    toastDescription += `\n\n🎁 Drops Recebidos:`;
    droppedItems.forEach(item => {
      toastDescription += `\n${item.icon} ${item.name}`;
    });
  }
  
  toast({
    title: isBossDefeated ? "🎉 Boss Derrotado!" : "✨ Ataque Realizado!",
    description: toastDescription,
    duration: isBossDefeated ? 12000 : (totalRyoReward > 0 || droppedItems.length > 0) ? 10000 : 4000,
  });
  
} catch (error) {
  console.error('Erro ao atacar boss:', error);
  toast({
    variant: 'destructive',
    title: 'Erro',
    description: 'Não foi possível registrar o ataque.',
  });
} finally {
  setIsAttacking(false);
}
  };
  
  if (isUserLoading || isBossLoading || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Carregando Invasão..." description="O grande alvo está sendo localizado." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }
    
  if (!boss && !isBossLoading) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
          <PageHeader title="Invocando o Chefe..." description="Um grande mal está sendo despertado. Aguarde um momento." />
          <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!userProfile) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center">
              <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para participar da invasão." />
              <Button asChild className="mt-6">
                  <Link href="/create-character">Criar Personagem</Link>
              </Button>
          </div>
      );
  }
    
  if (isBossRespawning) {
    return (
        <div>
            <PageHeader
                title="A Calmaria Antes da Tempestade"
                description={`${boss?.name} foi derrotado! Um novo chefe surgirá em breve.`}
            />
            <Card className="mt-8 max-w-2xl mx-auto text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Próximo Boss em:</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-center mt-4">
  <p className="text-5xl font-bold text-primary">
    {formatTime(timeUntilRespawn)}
  </p>
  <p className="text-sm text-muted-foreground mt-2">
    dias e horas restantes
  </p>
</div>
                </CardContent>
                <CardFooter className="flex-col gap-4 text-center">
  <div>
    <p className="text-muted-foreground mb-2">O último chefe foi derrotado por:</p>
    <p className="text-xl font-bold text-amber-400 flex items-center justify-center gap-2">
      <Trophy className="h-6 w-6"/>
      {boss?.last_defeated_by || 'Um herói anônimo'}
    </p>
  </div>
  
  <div className="w-full pt-4 border-t">
    <p className="text-sm text-muted-foreground mb-3">Recompensas do Golpe Final:</p>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <Coins className="h-5 w-5 text-amber-500" />
        <span className="text-lg font-bold text-amber-500">
          {BOSS_DEFEAT_REWARD_RYO.toLocaleString()} Ryo
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <Star className="h-5 w-5 text-blue-500" />
        <span className="text-lg font-bold text-blue-500">
          +{BOSS_DEFEAT_REWARD_STAT_POINTS} Pontos
        </span>
      </div>
    </div>
  </div>
</CardFooter>
            </Card>
        </div>
    );
  }

  const bossHealthPercentage = boss?.current_health && boss?.max_health 
    ? (boss.current_health / boss.max_health) * 100 
    : 0;
  const cooldownTime = formatTime(timeUntilAttack);

  return (
    <div>
      <PageHeader
        title="Invasão Global"
        description="Junte-se a todos os ninjas para derrotar um inimigo de poder imenso."
      />
      <div className="mt-8 flex justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
          {currentBossData?.imageUrl && (
  <div className="flex justify-center mb-4">
    <div className="w-[400px] h-[400px] flex items-center justify-center overflow-hidden rounded-lg shadow-2xl border-4 border-primary bg-black/5">
      <img 
        src={currentBossData.imageUrl} 
        alt={boss?.name || 'Boss'}
        className="max-w-full max-h-full w-auto h-auto object-contain"
      />
      
    </div>
  </div>
)}
            
            <CardTitle className="font-headline text-4xl">{boss?.name || 'Carregando...'}</CardTitle>
            <CardDescription className="text-lg">Nível {boss?.boss_level || 0}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="flex justify-around text-center">
  <div className="flex flex-col items-center gap-1">
    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
      <Target className="h-4 w-4"/> Ataques Recebidos
    </h3>
    <p className="text-xl font-bold">{boss?.total_attacks || 0}</p>
  </div>
  {/* ✅ NOVO: Barra de Progresso dos Milestones */}
<div className="mt-6 space-y-3">
  <h3 className="text-sm font-semibold text-center flex items-center justify-center gap-2">
    <Trophy className="h-4 w-4 text-amber-400"/> Recompensas por Dano
  </h3>
  
  <div className="space-y-2">
    {DAMAGE_MILESTONES.map((milestone, index) => {
      const currentDamage = userProfile?.boss_damage_dealt || 0;
      const claimed = (userProfile?.boss_damage_milestones_claimed || []).includes(milestone.label);
      const progress = Math.min((currentDamage / milestone.damage) * 100, 100);
      const isCompleted = currentDamage >= milestone.damage;
      
      return (
        <div key={milestone.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={claimed ? "text-green-500 font-semibold" : "text-muted-foreground"}>
              {claimed ? "✅" : isCompleted ? "🎁" : "🔒"} {milestone.label} de dano
            </span>
            <span className="text-amber-400 font-semibold">
              {claimed ? "Recebido!" : `${milestone.ryo.toLocaleString()} Ryō`}
            </span>
          </div>
          <Progress 
            value={progress} 
            className={`h-2 ${claimed ? "[&>div]:bg-green-500" : isCompleted ? "[&>div]:bg-amber-400" : "[&>div]:bg-primary"}`}
          />
        </div>
      );
    })}
  </div>
</div>
  
  {/* ✅ NOVO: Mostrar dano total do jogador */}
  <div className="flex flex-col items-center gap-1">
    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
      <Swords className="h-4 w-4"/> Seu Dano Total
    </h3>
    <p className="text-xl font-bold text-amber-400">
      {(userProfile?.boss_damage_dealt || 0).toLocaleString()}
    </p>
  </div>
</div>

            <div className="space-y-2">
                 <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-lg flex items-center gap-2"><Heart className="text-red-500"/> Vida do Chefe</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {Math.round(boss?.current_health || 0).toLocaleString()} / {(boss?.max_health || 0).toLocaleString()}
                    </p>
                 </div>
                <Progress value={bossHealthPercentage} className="h-6 [&>div]:bg-red-600" />
            </div>
            
            <div className="text-center text-muted-foreground">
                <p>{boss?.description || 'Um inimigo poderoso está se preparando...'}</p>
            </div>
            <div className="text-center">
              {/* Boss expirando */}
<p className="text-sm text-muted-foreground">
  {boss?.current_health <= 0 
    ? 'Boss derrotado! Aguardando próximo boss...' 
    : boss?.expires_at 
      ? `Boss disponível por mais: ${formatTime(timeUntilRespawn)}`
      : 'Carregando informações do boss...'
  }
</p>
            </div>
            {/* ✅ DROPS RECENTES */}
{lastDrops.length > 0 && (
  <Alert variant="default" className="border-amber-500 bg-amber-950/20">
    <Trophy className="h-4 w-4 text-amber-400" />
    <AlertTitle className="text-amber-400">🎁 Drops Recebidos</AlertTitle>
    <AlertDescription className="space-y-2 mt-2">
      <div className="grid grid-cols-1 gap-2">
        {lastDrops.map((item, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${
              item.rarity === 'lendário' ? 'border-yellow-500 bg-yellow-950/20' :
              item.rarity === 'épico' ? 'border-purple-500 bg-purple-950/20' :
              item.rarity === 'raro' ? 'border-blue-500 bg-blue-950/20' :
              'border-gray-500 bg-gray-950/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                <p className={`text-xs font-bold mt-2 ${
                  item.rarity === 'lendário' ? 'text-yellow-400' :
                  item.rarity === 'épico' ? 'text-purple-400' :
                  item.rarity === 'raro' ? 'text-blue-400' :
                  'text-gray-400'
                }`}>
                  {item.rarity.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AlertDescription>
  </Alert>
)}
            {lastBattleLog.length > 0 && (
      <BattleReport
        log={lastBattleLog}
        playerName={userProfile?.name || 'Você'}
        opponentName={boss?.name || 'Boss'}
        context="invasion"
        playerLevel={userProfile?.level}
        opponentLevel={boss?.level}
      />
    )}
    {lastBattleLog.length > 0 && (() => {
      const stats = calcLogStats(lastBattleLog, 'player');
      const bossDefeated = stats.totalDamageDealt > 0 && !lastBattlePlayerDied;
      return (
        <BattleResult
          winner={bossDefeated ? 'Você' : boss?.name || 'Boss'}
          totalTurns={stats.totalTurns}
          totalDamageDealt={stats.totalDamageDealt}
          totalDamageTaken={stats.totalDamageTaken}
          critCount={stats.critCount}
          passiveCount={stats.passiveCount}
          context="invasion"
        />
      );
    })()}
          </CardContent>
          <CardFooter className="flex-col gap-4">
          <Button 
  onClick={handleAttack} 
  disabled={!canAttack || isAttacking || !isPageReady}
  className="w-full text-lg py-6"
  style={{ pointerEvents: (!canAttack || isAttacking || !isPageReady) ? 'none' : 'auto' }}
>
  {isAttacking ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Atacando...
    </>
  ) : !isPageReady ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Carregando...
    </>
  ) : canAttack ? (
    <>
      <Swords className="mr-2 h-5 w-5" />
      Atacar Chefe
    </>
  ) : (
    <>
      <Clock className="mr-2 h-5 w-5 animate-pulse" />
      Descansando...
    </>
  )}
</Button>

<p className="text-xs text-muted-foreground text-center">
  {canAttack 
    ? 'Você pode atacar o chefe a cada 10 minutos.' 
    : 'Prepare-se para o próximo ataque!'
  }
</p>
            
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}