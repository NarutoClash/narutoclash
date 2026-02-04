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
import { Swords, Hourglass, Shield, Heart, Loader2, RefreshCw, Skull, Target, Clock, Trophy } from 'lucide-react';
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
  JUTSU_GIFS  // ✅ ADICIONAR (opcional, já vem no calculateDamage)
} from '@/lib/battle-system';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';
import { calculateFinalStats } from '@/lib/stats-calculator';  // ✅ Apenas UMA vez
import { BattleReportModal } from '@/components/battle-report-modal';


const BOSS_DOC_ID = 'current_boss';
const ATTACK_COOLDOWN = 10 * 60 * 1000; // 10 minutes in milliseconds
const BOSS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

// ✅ Tipo FORA do componente
type BattleLogEntry = string | {
  turn: number;
  attacker: 'player' | 'boss';
  attackType?: string;
  jutsuName: string;
  jutsuGif: string | null;
  damageLog: string;
  damage: number;
  playerHealth?: string;
};

export default function InvasionPage() {
  const { user, supabase, isUserLoading: isAuthLoading } = useSupabase();
  const { toast } = useToast();
  const [isAttacking, setIsAttacking] = useState(false);
  const [lastBattleLog, setLastBattleLog] = useState<BattleLogEntry[]>([]);
  const [timeUntilAttack, setTimeUntilAttack] = useState(0);
  const [timeUntilRespawn, setTimeUntilRespawn] = useState(0);
  const [isPageReady, setIsPageReady] = useState(false);
  const [showBattleReport, setShowBattleReport] = useState(false);
const [reportData, setReportData] = useState<{
  battleLog: BattleLogEntry[];
  totalDamage: number;
  bossDefeated: boolean;
}>({
  battleLog: [],
  totalDamage: 0,
  bossDefeated: false,
});
  
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
      const RESPAWN_TIME = 24 * 60 * 60 * 1000;
  
      if (error || !bossData) {
          await setupNewBoss(bossRef, setBossData);
      } else if (bossData.current_health <= 0 && bossData.respawn_at && now >= bossData.respawn_at) {
          await setupNewBoss(bossRef, setBossData);
      } else if (bossData.expires_at && bossData.current_health > 0 && now >= bossData.expires_at) {
          await setupNewBoss(bossRef, setBossData);
      }
    }
  
    checkAndSetupBoss();
    
  }, [isBossLoading, isAuthLoading, user, supabase, bossRef, setBossData]);


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

    console.log('🔌 Iniciando subscription do perfil do usuário...');

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
          console.log('👤 Perfil atualizado via subscription:', payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription do perfil:', status);
      });

    return () => {
      console.log('🔌 Desconectando subscription do perfil...');
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

// ✅ DEBUG: Mostrar info do último ataque
useEffect(() => {
  const debugInfo = localStorage.getItem('lastAttackDebug');
  if (debugInfo) {
    try {
      const parsed = JSON.parse(debugInfo);
      console.log('🎯 ÚLTIMO ATAQUE DEBUG:', parsed);
      
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
      console.log('⚠️ Página ainda não está pronta, ignorando clique');
      return;
    }
    
    if (!canAttack || !userProfile || !bossRef || !supabase || !userProfileRef || !boss || isBossRespawning) return;
    
    // ✅ ADICIONE ESTES LOGS AQUI
    console.log('🔍 ===== USER PROFILE COMPLETO =====');
    console.log('userProfile:', userProfile);
    console.log('Campos importantes:', {
      id: userProfile.id,
      name: userProfile.name,
      vitality: userProfile.vitality,
      taijutsu: userProfile.taijutsu,
      ninjutsu: userProfile.ninjutsu,
      genjutsu: userProfile.genjutsu,
      selo: userProfile.selo,
      intelligence: userProfile.intelligence,
      elementLevels: userProfile.elementLevels,
      element_levels: userProfile.element_levels,
      jutsus: userProfile.jutsus,
      weapon_id: userProfile.weapon_id,
      weaponId: userProfile.weaponId,
    });
    console.log('====================================');
    
    setIsAttacking(true);
    setLastBattleLog([]);
  
    const playerStats = calculateFinalStats(userProfile);
    console.log('📊 PLAYER STATS CALCULADOS:', playerStats);
    const bossLevel = boss?.boss_level || 100;
    const bossMaxHealth = boss?.max_health || 2000000;
    
    // ===== STATS DO BOSS (50% mais forte que o player) =====
    const bossStatsMultiplier = 1.5;
    
    const bossAttacker = {
      vitality: (playerStats?.finalVitality || 0) * bossStatsMultiplier,
      taijutsu: (playerStats?.finalTaijutsu || 0) * bossStatsMultiplier,
      ninjutsu: (playerStats?.finalNinjutsu || 0) * bossStatsMultiplier,
      genjutsu: (playerStats?.finalGenjutsu || 0) * bossStatsMultiplier,
      intelligence: (playerStats?.finalIntelligence || 0) * bossStatsMultiplier,
      selo: (playerStats?.finalSelo || 0) * bossStatsMultiplier,
      elementLevels: userProfile.element_levels || {},  // ✅ CORRETO
      jutsus: userProfile.jutsus || {},
      name: boss?.name || 'Boss',
      level: bossLevel,
    };
    
    // ===== MULTIPLICADOR DE DANO =====
    const PLAYER_DAMAGE_MULTIPLIER = Math.floor(bossLevel / 10);
    
    // ===== VARIÁVEIS DE BATALHA =====
    let playerHealth = playerStats?.maxHealth || 100;
    let totalPlayerDamage = 0;
    
    const battleLog: BattleLogEntry[] = [];
    battleLog.push(`Batalha iniciada! Você (${playerHealth.toFixed(0)} HP) vs ${boss.name} (Nível ${bossLevel}).`);
    battleLog.push(`[Boss: ${(bossMaxHealth / 1000000).toFixed(1)}M HP | Multiplicador: x${PLAYER_DAMAGE_MULTIPLIER}]`);
    
// ===== LOOP DE BATALHA =====
// ✅ CRIAR OBJETO playerFighter ANTES DO LOOP
const playerFighter = {
  ...userProfile,
  elementLevels: userProfile.element_levels || {},  // ✅ Converter snake_case → camelCase
  jutsus: userProfile.jutsus || {},
};

let turn = 1;
while (playerHealth > 0) {
// ===== TURNO DO PLAYER =====
const playerAttackType = getRandomAttackType(playerFighter);

if (playerAttackType) {
  const { damage, log, jutsuUsed, jutsuGif } = calculateDamage(playerFighter, bossAttacker, playerAttackType, {
    equipmentData: EQUIPMENT_DATA,
    isBoss: true,
  });
   // ✅ SALVAR DEBUG NO LOCALSTORAGE
   const debugInfo = {
    attackType: playerAttackType,
    jutsuUsed,
    jutsuGif,
    log,
    damage
  };
  localStorage.setItem('lastAttackDebug', JSON.stringify(debugInfo));
  
  const finalDamage = damage * PLAYER_DAMAGE_MULTIPLIER;
  totalPlayerDamage += finalDamage;
  
  // ✅ NOVO FORMATO: objeto com informações do jutsu
  battleLog.push({
    turn,
    attacker: 'player',
    attackType: playerAttackType,
    jutsuName: jutsuUsed || (playerAttackType === 'taijutsu' ? 'Taijutsu' : playerAttackType === 'genjutsu' ? 'Genjutsu' : 'Ataque'),
    jutsuGif: jutsuGif || null,
    damageLog: log,
    damage: Math.round(finalDamage)
  });
} else {
  battleLog.push(`Turno ${turn} (Você): Você não conseguiu atacar.`);
}

if (boss.current_health - totalPlayerDamage <= 0) {
  break;
}

// ===== TURNO DO BOSS =====
const bossAttackType = getRandomAttackType(bossAttacker);

if (bossAttackType) {
  const { damage, log, jutsuUsed, jutsuGif } = calculateDamage(bossAttacker, playerFighter, bossAttackType, {
    equipmentData: EQUIPMENT_DATA,
    isBoss: true,
  });
  
  playerHealth -= damage;
  
  // ✅ NOVO FORMATO: objeto com informações do jutsu
  battleLog.push({
    turn,
    attacker: 'boss',
    attackType: bossAttackType,
    jutsuName: jutsuUsed || (bossAttackType === 'taijutsu' ? 'Taijutsu' : bossAttackType === 'genjutsu' ? 'Genjutsu' : 'Ataque do Boss'),
    jutsuGif: jutsuGif || null,
    damageLog: `${boss.name} ${log}`,
    damage: Math.round(damage),
    playerHealth: Math.max(0, playerHealth).toFixed(0)
  });
} else {
  battleLog.push(`Turno ${turn} (Chefe): ${boss.name} não conseguiu atacar.`);
}

if (playerHealth <= 0) {
  battleLog.push("Você foi derrotado!");
  break;
}

turn++;

if (turn > 100) {
  battleLog.push("A batalha foi longa demais e terminou. Você sobreviveu!");
  break;
}
}  // ✅ FECHAR O WHILE AQUI!

const finalDamageDealt = Math.max(0, Math.round(totalPlayerDamage));
    
    // ===== ATUALIZAR BOSS NO BANCO =====
    try {
      const newBossHealth = Math.max(0, (boss?.current_health || 0) - finalDamageDealt);
      
      const bossUpdate: any = {
        current_health: newBossHealth,
        total_attacks: (boss?.total_attacks || 0) + 1,
      };
      
      const isBossDefeated = newBossHealth < 10;
  
      if (isBossDefeated) {
        bossUpdate.status = 'defeated';
        bossUpdate.last_defeated_at = Date.now();
        bossUpdate.last_defeated_by = userProfile.character_name;
        bossUpdate.respawn_at = Date.now() + (24 * 60 * 60 * 1000);
        battleLog.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        battleLog.push(`🎉 VITÓRIA! VOCÊ DERROTOU ${boss?.name?.toUpperCase()}! 🎉`);
        battleLog.push(`Vida final do boss: ${newBossHealth.toFixed(0)} HP`);
      }
      
      await supabase
        .from('world_bosses')
        .update(bossUpdate)
        .eq('id', BOSS_DOC_ID);
      
      setBossData({ ...boss, ...bossUpdate });
      
      await supabase
  .from('profiles')
  .update({
    last_boss_attack: Date.now(),
    current_health: playerStats?.maxHealth || 100,  // ✅ VIDA FULL
  })
  .eq('id', user!.id);

if (setUserProfile) {
  setUserProfile({
    ...userProfile,
    last_boss_attack: Date.now(),
    current_health: playerStats?.maxHealth || 100,  // ✅ ATUALIZA ESTADO LOCAL
  });
}
      
setLastBattleLog(battleLog);
localStorage.setItem('lastBattleLog', JSON.stringify(battleLog));

// ✅ Abrir modal com relatório
setReportData({
  battleLog,
  totalDamage: finalDamageDealt,
  bossDefeated: isBossDefeated,
});
setShowBattleReport(true);

toast({
  title: isBossDefeated ? "🎉 Boss Derrotado!" : "Ataque Realizado!",
  description: `Você causou ${finalDamageDealt.toLocaleString()} de dano!`,
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
                    <p className="text-5xl font-bold font-mono tracking-widest text-primary">{formatTime(timeUntilRespawn)}</p>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-center">
                    <p className="text-muted-foreground">O último chefe foi derrotado por:</p>
                    <p className="text-xl font-bold text-amber-400 flex items-center gap-2">
                        <Trophy className="h-6 w-6"/>
                        {boss?.last_defeated_by || 'Um herói anônimo'}
                    </p>
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
      {/* ✅ ADICIONAR O MODAL AQUI */}
    <BattleReportModal
      isOpen={showBattleReport}
      onClose={() => setShowBattleReport(false)}
      battleLog={reportData.battleLog}
      totalDamage={reportData.totalDamage}
      bossDefeated={reportData.bossDefeated}
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
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4"/> Ataques Recebidos</h3>
                    <p className="text-xl font-bold">{boss?.total_attacks || 0}</p>
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
              <p className="text-sm text-muted-foreground">
                  {boss?.current_health <= 0 
                      ? 'Boss derrotado! Aguardando próximo boss...' 
                      : boss?.expires_at 
                          ? `Boss expira em: ${formatTime(timeUntilRespawn)}`
                          : 'Carregando informações do boss...'
                  }
              </p>
            </div>
            
            {lastBattleLog.length > 0 && (
    <Alert variant="default">
        <Swords className="h-4 w-4" />
        <AlertTitle>Último Relatório de Batalha</AlertTitle>
        <AlertDescription className="space-y-3 mt-2 max-h-96 overflow-y-auto">
            {lastBattleLog.map((log, index) => {
                // Se for string (logs antigos ou mensagens gerais)
                if (typeof log === 'string') {
                    return <p key={index} className="font-mono text-xs">{log}</p>;
                }
                
                // Se for objeto (novo formato com jutsu e gif)
                return (
                    <div key={index} className="border-b border-border pb-3 mb-3 last:border-0">
                        <p className="font-mono text-xs font-semibold mb-2">
                            Turno {log.turn} ({log.attacker === 'player' ? 'Você' : 'Chefe'}): 
                            <span className="text-primary ml-1">{log.jutsuName}</span>
                        </p>
                        
                        {log.jutsuGif && (
                            <div className="flex justify-center my-2">
                                <img 
                                    src={log.jutsuGif} 
                                    alt={log.jutsuName}
                                    className="w-full max-w-[200px] rounded-lg border-2 border-primary shadow-lg"
                                />
                            </div>
                        )}
                        
                        <p className="font-mono text-xs text-muted-foreground">{log.damageLog}</p>
                        <p className="font-mono text-xs text-amber-400 font-bold mt-1">
                            [{log.damage.toLocaleString()} de dano]
                        </p>
                    </div>
                );
            })}
        </AlertDescription>
    </Alert>
)}
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
                  <Hourglass className="mr-2 h-5 w-5" />
                  Aguarde {cooldownTime} para atacar
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">Você pode atacar o chefe a cada 10 minutos.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}