'use client';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { missionsData, type Mission } from '@/lib/missions-data';
import { elementImages } from '@/lib/element-images';
import Image from 'next/image';
import { Book, Award, Star, Clock, CheckCircle, Timer, Loader2, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useActiveMission } from '@/hooks/use-active-mission';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { getLevelFromXp, getXpForLevel } from '@/lib/xp-utils';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import seedrandom from 'seedrandom';
import { usePremiumStatus } from '@/hooks/use-premium-status';

const difficultyColors: { [key: string]: string } = {
  Fácil: 'text-green-400',
  Média: 'text-yellow-400',
  Difícil: 'text-orange-400',
  Heróica: 'text-red-500',
};

const difficultyOrder = ['Fácil', 'Média', 'Difícil', 'Heróica'];

const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);
  
    return parts.join(' ') || '0s';
};

const MissionCard = ({ mission, userProfile, onAccept, isDisabled, isDaily = false }: { mission: Mission; userProfile: any; onAccept: (mission: Mission) => void; isDisabled: boolean, isDaily?: boolean }) => {
    const isLevelSufficient = userProfile.level >= mission.requiredLevel;
    const isCompleted = isDaily && userProfile.daily_mission_state?.completedMissionIds?.includes(mission.id);
    
    const hasEnoughChakra = (userProfile.current_chakra || 0) >= (mission.chakraCost || 0);
    const canAccept = !isDisabled && isLevelSufficient && !isCompleted && hasEnoughChakra;

    return (
        <Card key={mission.id} className={cn("flex flex-col relative", isCompleted ? 'bg-muted/30 border-dashed' : '')}>
     {!isCompleted && !isLevelSufficient && (
        <div className="absolute inset-0 bg-red-900/40 rounded-lg z-10 flex items-center justify-center">
            <p className="text-white font-bold text-lg">Requer Nível {mission.requiredLevel}</p>
        </div>
    )}
    {!isCompleted && isLevelSufficient && !hasEnoughChakra && (
        <div className="absolute inset-0 bg-blue-900/40 rounded-lg z-10 flex items-center justify-center">
            <p className="text-white font-bold text-lg">Chakra Insuficiente</p>
        </div>
    )}
    <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{mission.name}</CardTitle>
                    <span className={`font-bold text-sm ${difficultyColors[mission.difficulty]}`}>{mission.difficulty}</span>
                </div>
                <CardDescription>{mission.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
            <div className="flex flex-col gap-2">
    <h4 className="font-semibold text-sm flex items-center gap-2"><Star className="h-4 w-4 text-yellow-400" /> Requisitos</h4>
    <p className="text-sm text-muted-foreground ml-6">Nível Mínimo: {mission.requiredLevel}</p>
    <p className="text-sm text-muted-foreground ml-6 flex items-center gap-1">
        <span className="text-blue-400">⚡</span> Chakra: {mission.chakraCost}
    </p>
    <p className="text-sm text-muted-foreground ml-6 flex items-center gap-1"><Clock className="h-4 w-4" /> Duração: {formatDuration(mission.durationSeconds)}</p>
</div>
                <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Recompensas</h4>
                    <div className="space-y-1 text-sm text-muted-foreground ml-6">
                        <p>Ryous: {mission.ryoReward}</p>
                        <p>Experiência: {mission.experienceReward} XP</p>
                         {mission.elementExperienceReward && (
                            <p className="flex items-center gap-1">
                                Exp. de Elemento: {mission.elementExperienceReward.xp} XP em {mission.elementExperienceReward.element}
                            </p>
                        )}
                        {mission.jutsuExperienceReward && (
                            <p>
                                Exp. de Jutsu: {mission.jutsuExperienceReward.xp} XP em {mission.jutsuExperienceReward.jutsuName}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
    <Button 
        className="w-full" 
        onClick={() => onAccept(mission)} 
        disabled={!canAccept}
    >
        {isCompleted ? 'Concluída' : 
         !isLevelSufficient ? `Requer Nível ${mission.requiredLevel}` :
         !hasEnoughChakra ? `Chakra Insuficiente (${mission.chakraCost})` :
         isDisabled ? 'Em outra atividade' : (
            <>
                <Book className="mr-2 h-4 w-4" />
                Aceitar Missão
            </>
        )}
    </Button>
</CardFooter>
        </Card>
    );
};

const generateNewMissions = (rngSeed: string): {id: string, difficulty: string}[] => {
    const rng = seedrandom(rngSeed);
    const newMissions: {id: string, difficulty: string}[] = [];
    const usedIds = new Set<string>();

    const levelOneMissions = missionsData.filter(m => m.requiredLevel === 1);
    if (levelOneMissions.length > 0) {
        const firstMission = levelOneMissions[Math.floor(rng() * levelOneMissions.length)];
        newMissions.push({ id: firstMission.id, difficulty: firstMission.difficulty });
        usedIds.add(firstMission.id);
    }

    const missionsByDifficulty = {
        'Fácil': missionsData.filter(m => m.difficulty === 'Fácil'),
        'Média': missionsData.filter(m => m.difficulty === 'Média'),
        'Difícil': missionsData.filter(m => m.difficulty === 'Difícil'),
        'Heróica': missionsData.filter(m => m.difficulty === 'Heróica'),
    };

    const missionDistribution = [
        'Fácil', 'Fácil', 'Fácil', 'Fácil',
        'Média', 'Média', 'Média', 'Média',
        'Difícil', 'Difícil', 'Difícil',
        'Heróica', 'Heróica', 'Heróica'
    ];
    
    while (newMissions.length < 15 && missionDistribution.length > 0) {
        const difficultyIndex = Math.floor(rng() * missionDistribution.length);
        const difficulty = missionDistribution.splice(difficultyIndex, 1)[0];

        const availableMissions = missionsByDifficulty[difficulty as keyof typeof missionsByDifficulty].filter(m => !usedIds.has(m.id));
        
        if (availableMissions.length > 0) {
            const mission = availableMissions[Math.floor(rng() * availableMissions.length)];
            newMissions.push({ id: mission.id, difficulty: mission.difficulty });
            usedIds.add(mission.id);
        } else {
            missionDistribution.push(difficulty);
        }
    }

    return newMissions;
}

const useActiveBoosts = (supabase: any, userId: string | undefined) => {
    const [activeBoosts, setActiveBoosts] = useState<any[] | null>(null);
    
    useEffect(() => {
      if (!userId || !supabase) return;
      
      const fetchBoosts = async () => {
        const { data } = await supabase
          .from('user_premium_inventory')
          .select('*')
          .eq('user_id', userId)
          .in('item_type', ['xp_boost', 'ryo_boost'])
          .gte('expires_at', new Date().toISOString());
        
        setActiveBoosts(data || []);
      };
      
      fetchBoosts();
    }, [userId, supabase]);
    
    return activeBoosts;
  };

const getBoostMultipliers = (activeBoosts: any[] | null) => {
    let xpMultiplier = 1;
    let ryoMultiplier = 1;
    
    if (activeBoosts && activeBoosts.length > 0) {
      activeBoosts.forEach((boost: any) => {
        if (boost.item_type === 'xp_boost' && boost.item_data?.boost_percentage) {
          xpMultiplier += boost.item_data.boost_percentage / 100;
        }
        if (boost.item_type === 'ryo_boost' && boost.item_data?.boost_percentage) {
          ryoMultiplier += boost.item_data.boost_percentage / 100;
        }
      });
    }
    
    return { xpMultiplier, ryoMultiplier };
  };

export default function MissionsPage() {
    const { user, supabase } = useSupabase();
    const { toast } = useToast();

    const { isActive: isPremium, isLoading: isPremiumLoading } = usePremiumStatus(supabase, user?.id);

    const userProfileRef = useMemoSupabase(() => {
        if (!user) return null;
        return { table: 'profiles', id: user.id };
    }, [user]);

    const { data: userProfile, isLoading } = useDoc(userProfileRef);
    
    const activeBoosts = useActiveBoosts(supabase, user?.id);

const [localActiveMission, setLocalActiveMission] = useState<{
    missionId: string;
    startTime: number;
    endTime: number;
} | null>(null);

const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
const [timeUntilReset, setTimeUntilReset] = useState('');

const effectiveActiveMission = localActiveMission || userProfile?.active_mission;
const { activeMission, missionDetails: activeMissionDetails, timeRemaining, progress, isMissionComplete } = useActiveMission(
  effectiveActiveMission ? { ...userProfile, active_mission: effectiveActiveMission } : userProfile,
  missionsData
);

useEffect(() => {
    if (!userProfile?.daily_mission_state?.nextReset) return;

    const calculateTimeUntilReset = () => {
        const now = Date.now();
        const remaining = Math.max(0, userProfile.daily_mission_state.nextReset - now);

        const hours = Math.floor(remaining / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000).toString().padStart(2, '0');

        setTimeUntilReset(`${hours}:${minutes}:${seconds}`);

        if (remaining === 0) {
            toast({
                title: "Novas Missões Disponíveis!",
                description: "A lista de missões foi atualizada.",
            });
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    };

    calculateTimeUntilReset();
    const intervalId = setInterval(calculateTimeUntilReset, 1000);

    return () => clearInterval(intervalId);
}, [userProfile?.daily_mission_state?.nextReset, toast]);

useEffect(() => {
    return () => {
        setLocalActiveMission(null);
    };
}, []);

useEffect(() => {
    if (!userProfile || !userProfileRef) return;

        const now = new Date();
        const nowUTC = now.getTime();
        const brtOffset = -3 * 60 * 60 * 1000;
        const nowInBRT = new Date(nowUTC + brtOffset);

        const nextResetBRT = new Date(nowInBRT);
        nextResetBRT.setUTCMinutes(0, 0, 0);

        if (nowInBRT.getUTCHours() < 12) {
             nextResetBRT.setUTCHours(12);
        } else {
             nextResetBRT.setUTCHours(24);
        }
        const nextResetTimestamp = nextResetBRT.getTime() - brtOffset;

        const shouldReset = !userProfile.daily_mission_state || now.getTime() >= (userProfile.daily_mission_state.nextReset || 0);
        
        let currentMissions = userProfile.daily_mission_state?.missions || [];

        if (shouldReset) {
            const newMissions = generateNewMissions(nextResetTimestamp.toString());
            
            const activeDailyMission = userProfile.active_mission ? userProfile.daily_mission_state?.missions.find((m: {id: string}) => m.id === userProfile.active_mission?.missionId) : undefined;
            const finalMissions = activeDailyMission ? [activeDailyMission, ...newMissions.filter(nm => nm.id !== activeDailyMission.id)].slice(0, 15) : newMissions;

            if (!supabase) return;
            updateDocumentNonBlocking(userProfileRef, {
                daily_mission_state: {
                    nextReset: nextResetTimestamp,
                    missions: finalMissions,
                    completedMissionIds: activeDailyMission ? userProfile.daily_mission_state.completedMissionIds : [],
                    refreshesUsed: 0
                }
            }, supabase);
            currentMissions = finalMissions;
        }
        
        const missions = currentMissions
            .map((m: {id: string}) => missionsData.find(md => md.id === m.id))
            .filter(Boolean) as Mission[];
        setDailyMissions(missions);

    }, [userProfile, userProfileRef, supabase]);

    const handleAcceptMission = async (mission: Mission) => {
        if (!userProfileRef || userProfile?.active_mission || userProfile?.active_hunt || !supabase) return;
      
        const chakraCost = mission.chakraCost || 0;
        const currentChakra = userProfile.current_chakra || 0;
        
        if (currentChakra < chakraCost) {
            toast({
                variant: "destructive",
                title: "Chakra Insuficiente!",
                description: `Você precisa de ${chakraCost} chakra, mas só tem ${currentChakra}. Descanse para recuperar chakra.`,
            });
            return;
        }
    
        const startTime = Date.now();
        const endTime = startTime + mission.durationSeconds * 1000;
      
        setLocalActiveMission({ missionId: mission.id, startTime, endTime });
      
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              active_mission: { missionId: mission.id, startTime, endTime },
              current_chakra: currentChakra - chakraCost
            })
            .eq('id', userProfileRef.id);
      
          if (error) {
            setLocalActiveMission(null);
            
            console.error('Erro ao aceitar missão:', error);
            toast({
              variant: "destructive",
              title: "Erro ao aceitar missão",
              description: error.message,
            });
            return;
          }
      
          toast({
            title: "Missão Aceita!",
            description: `Você começou a missão: ${mission.name}. Chakra usado: ${chakraCost}.`,
          });
        } catch (error) {
          setLocalActiveMission(null);
          
          console.error('Erro inesperado:', error);
          toast({
            variant: "destructive",
            title: "Erro ao aceitar missão",
          });
        }
    };

    const handleCancelMission = async () => {
        if (!userProfileRef || !userProfile || !supabase) return;
        
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              active_mission: null
            })
            .eq('id', userProfileRef.id);
          
          if (error) throw error;
          
          setLocalActiveMission(null);
          
          toast({
            title: "Missão Cancelada",
            description: "Você desistiu da missão. O chakra usado não será devolvido.",
            variant: "destructive"
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error: any) {
          console.error('Erro ao cancelar missão:', error);
          toast({
            variant: "destructive",
            title: "Erro ao cancelar missão",
            description: error?.message || "Tente novamente"
          });
        }
      };
    
      const handleRefreshMissions = () => {
        const refreshesUsed = userProfile?.daily_mission_state?.refreshesUsed || 0;
        const maxRefreshes = isPremium ? 3 : 1;
        
        if (!userProfileRef || refreshesUsed >= maxRefreshes || !supabase) return;
        
        const newMissions = generateNewMissions(Date.now().toString());
    
        updateDocumentNonBlocking(userProfileRef, {
            daily_mission_state: {
                ...userProfile.daily_mission_state,
                missions: newMissions,
                refreshesUsed: refreshesUsed + 1
            }
        }, supabase);
        
            toast({
                title: "Missões Atualizadas!",
                description: `Sua lista de missões foi atualizada.`,
            });
        
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        };
    
        const handleCompleteMission = async () => {
            if (!userProfile || !activeMissionDetails || !userProfileRef || !supabase) {
                console.error('❌ FALTAM DADOS:', { 
                    userProfile: !!userProfile, 
                    activeMissionDetails: !!activeMissionDetails, 
                    userProfileRef: !!userProfileRef, 
                    supabase: !!supabase 
                });
                return;
            }
        
            console.log('🚀 INICIANDO CONCLUSÃO DA MISSÃO');
            console.log('📋 Missão:', activeMissionDetails.name);
            console.log('👤 User ID:', userProfileRef.id);
        
            try {
                const { data: activeBoosts } = await supabase
                    .from('user_premium_inventory')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('item_type', ['xp_boost', 'ryo_boost'])
                    .gte('expires_at', new Date().toISOString());
        
                let xpMultiplier = 1;
                let ryoMultiplier = 1;
        
                if (activeBoosts && activeBoosts.length > 0) {
                    activeBoosts.forEach((boost: any) => {
                        if (boost.item_type === 'xp_boost' && boost.item_data?.boost_percentage) {
                            xpMultiplier += boost.item_data.boost_percentage / 100;
                        }
                        if (boost.item_type === 'ryo_boost' && boost.item_data?.boost_percentage) {
                            ryoMultiplier += boost.item_data.boost_percentage / 100;
                        }
                    });
                }
        
                const baseRyo = activeMissionDetails.ryoReward;
                const baseXP = activeMissionDetails.experienceReward;
                
                const finalRyo = Math.floor(baseRyo * ryoMultiplier);
                const finalXP = Math.floor(baseXP * xpMultiplier);
                
                const bonusRyo = finalRyo - baseRyo;
                const bonusXP = finalXP - baseXP;
        
                const updatePayload: any = {
                    active_mission: null,
                    ryo: (userProfile.ryo || 0) + finalRyo,
                    experience: (userProfile.experience || 0) + finalXP,
                };
        
                console.log('💰 Ryo atual:', userProfile.ryo, '→', updatePayload.ryo);
                console.log('⭐ XP atual:', userProfile.experience, '→', updatePayload.experience);
        
                const newExperience = (userProfile.experience || 0) + finalXP;
                const { level: newLevel } = getLevelFromXp(newExperience);
                
                if(newLevel > userProfile.level) {
                    const newMaxExperience = getXpForLevel(newLevel + 1);
                    const levelsGained = newLevel - userProfile.level;
                    const newStatPoints = (userProfile.stat_points || 0) + (levelsGained * 5);
                    
                    updatePayload.level = newLevel;
                    updatePayload.max_experience = newMaxExperience;
                    updatePayload.stat_points = newStatPoints;
                    
                    console.log('🎉 SUBIU DE NÍVEL!', userProfile.level, '→', newLevel);
                }
        
                // ✅ PROCESSAR ELEMENT XP - CORRIGIDO
                if (activeMissionDetails.elementExperienceReward) {
                    const { element, xp } = activeMissionDetails.elementExperienceReward;
                    
                    console.log('');
                    console.log('🔥 ==========================================');
                    console.log('🔥 PROCESSANDO XP DE ELEMENTO');
                    console.log('🔥 ==========================================');
                    console.log('🔥 Elemento:', element);
                    console.log('🔥 XP da missão:', xp);
                    
                    const currentElementExperience = userProfile.element_experience || {};
                    const currentElementXp = currentElementExperience[element] || 0;
                    const newElementXp = currentElementXp + xp;
                    
                    console.log('📊 XP Antigo:', currentElementXp);
                    console.log('📊 XP Novo:', newElementXp);
                    
                    updatePayload.element_experience = {
                        ...currentElementExperience,
                        [element]: newElementXp,
                    };
                    
                    console.log('✅ element_experience atualizado:', JSON.stringify(updatePayload.element_experience));
        
                    // 🔥 CALCULAR NÍVEL DO ELEMENTO CORRETAMENTE
                    const { level: newElementLevel } = getLevelFromXp(newElementXp, 10, 100, 1.5);
                    const currentElementLevels = userProfile.element_levels || {};
                    const oldElementLevel = currentElementLevels[element] || 0;
                    
                    console.log('⬆️ Nível Antigo:', oldElementLevel);
                    console.log('⬆️ Nível Novo:', newElementLevel);
                    
                    updatePayload.element_levels = {
                        ...currentElementLevels,
                        [element]: newElementLevel,
                    };
                    
                    console.log('✅ element_levels atualizado:', JSON.stringify(updatePayload.element_levels));
                    
                    if (newElementLevel > oldElementLevel) {
                        console.log('🎉 SUBIU DE NÍVEL EM', element, '!', oldElementLevel, '→', newElementLevel);
                    }
                    console.log('🔥 ==========================================');
                    console.log('');
                }
        
                // ✅ PROCESSAR JUTSU XP - CORRIGIDO
                if (activeMissionDetails.jutsuExperienceReward) {
                    const { jutsuName, xp } = activeMissionDetails.jutsuExperienceReward;
                    const jutsuLevel = userProfile.jutsus?.[jutsuName] || 0;
                    
                    if (jutsuLevel > 0) {
                        const currentJutsuXp = userProfile.jutsu_experience?.[jutsuName] || 0;
                        const newJutsuXp = currentJutsuXp + xp;
                        
                        updatePayload.jutsu_experience = {
                            ...(userProfile.jutsu_experience || {}),
                            [jutsuName]: newJutsuXp,
                        };
        
                        const { level: newJutsuLevel } = getLevelFromXp(newJutsuXp, 25, 120, 1.4);
                        
                        console.log('🥷 === JUTSU:', jutsuName, '===');
                        console.log('📊 XP:', currentJutsuXp, '→', newJutsuXp);
                        console.log('⬆️ Nível:', jutsuLevel, '→', newJutsuLevel);
                        
                        if (newJutsuLevel > jutsuLevel) {
                            updatePayload.jutsus = {
                                ...(userProfile.jutsus || {}),
                                [jutsuName]: newJutsuLevel,
                            };
                            console.log('🎉 SUBIU DE NÍVEL EM', jutsuName, '!');
                        }
                    }
                }
        
                const completedIds = [...(userProfile.daily_mission_state?.completedMissionIds || []), activeMissionDetails.id];
                updatePayload.daily_mission_state = {
                    ...userProfile.daily_mission_state,
                    completedMissionIds: completedIds,
                };
        
                console.log('');
                console.log('💾 ==========================================');
                console.log('💾 PAYLOAD FINAL QUE SERÁ ENVIADO AO BANCO');
                console.log('💾 ==========================================');
                console.log(JSON.stringify(updatePayload, null, 2));
                console.log('💾 ==========================================');
                console.log('');
        
                setLocalActiveMission(null);
        
                console.log('📤 ENVIANDO PARA O BANCO...');
                
                const { data, error } = await supabase
                    .from('profiles')
                    .update(updatePayload)
                    .eq('id', userProfileRef.id)
                    .select();
        
                if (error) {
                    console.error('🔴 ==========================================');
                    console.error('🔴 ERRO AO SALVAR NO BANCO');
                    console.error('🔴 ==========================================');
                    console.error('🔴 Erro:', error);
                    console.error('🔴 Mensagem:', error.message);
                    console.error('🔴 ==========================================');
                    
                    if (activeMission) {
                        setLocalActiveMission(activeMission as any);
                    }
                    throw error;
                }
        
                console.log('✅ ==========================================');
                console.log('✅ SUCESSO! DADOS SALVOS NO BANCO');
                console.log('✅ ==========================================');
                console.log('✅ Dados retornados:', data);
                console.log('✅ ==========================================');
        
                let message = `Você completou "${activeMissionDetails.name}"!`;
                
                if (bonusRyo > 0 || bonusXP > 0) {
                    message += '\n\n🎁 Bônus Premium Aplicado:';
                    if (bonusRyo > 0) message += `\n💰 +${bonusRyo} Ryo extra`;
                    if (bonusXP > 0) message += `\n⭐ +${bonusXP} XP extra`;
                }
                
                message += `\n\n💰 Total: ${finalRyo} Ryo\n⭐ Total: ${finalXP} XP`;
        
                toast({
                    title: "Missão Concluída! 🎉",
                    description: message,
                });
        
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
        
            } catch (error) {
                console.error('🔴 ERRO INESPERADO:', error);
                toast({ variant: "destructive", title: "Erro ao completar missão" });
            }
        };

    if (isLoading || !userProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <PageHeader title="Carregando Missões..." description="Buscando seu próximo desafio." />
                <Loader2 className="h-8 w-8 animate-spin mt-4" />
                 {!isLoading && !userProfile && (
                     <div className="mt-6">
                        <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para ver as missões." />
                        <Button asChild className="mt-6">
                          <Link href="/create-character">Criar Personagem</Link>
                        </Button>
                    </div>
                )}
            </div>
        );
    }
    
    if (activeMission && activeMissionDetails) {
        const { xpMultiplier, ryoMultiplier } = getBoostMultipliers(activeBoosts);
        
        const baseRyo = activeMissionDetails.ryoReward;
        const baseXP = activeMissionDetails.experienceReward;
        
        const finalRyo = Math.floor(baseRyo * ryoMultiplier);
        const finalXP = Math.floor(baseXP * xpMultiplier);
        
        const bonusRyo = finalRyo - baseRyo;
        const bonusXP = finalXP - baseXP;
        const hasBonus = bonusRyo > 0 || bonusXP > 0;
        
        return (
             <div>
                 <PageHeader
                    title="Missão em Andamento"
                    description="Concentre-se, sua missão ainda não terminou."
                />
                <Card className="mt-8 max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>{activeMissionDetails.name}</CardTitle>
                        <CardDescription>{activeMissionDetails.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className='space-y-2'>
                            <div className="flex justify-between items-baseline">
                                <p className="font-semibold">Progresso</p>
                                <p className="text-sm text-muted-foreground">{formatDuration(Math.floor(timeRemaining / 1000))}</p>
                            </div>
                            <Progress value={progress} />
                        </div>
                        
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-500" />
                            Recompensas ao Completar
                          </h4>
                          
                          <div className="space-y-3">
                            {/* Ryo e XP */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">💰 Ryo:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">{finalRyo}</span>
                                  {bonusRyo > 0 && (
                                    <span className="text-xs text-green-400">
                                      (+{bonusRyo} bônus)
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">⭐ XP:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">{finalXP}</span>
                                  {bonusXP > 0 && (
                                    <span className="text-xs text-green-400">
                                      (+{bonusXP} bônus)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Exp. de Elemento */}
                            {activeMissionDetails.elementExperienceReward && (
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">
                                  🔥 Exp. de Elemento: <span className="font-semibold text-foreground">{activeMissionDetails.elementExperienceReward.xp} XP</span> em {activeMissionDetails.elementExperienceReward.element}
                                </p>
                              </div>
                            )}

                            {/* Exp. de Jutsu */}
                            {activeMissionDetails.jutsuExperienceReward && (
                              <div className={activeMissionDetails.elementExperienceReward ? '' : 'pt-2 border-t'}>
                                <p className="text-sm text-muted-foreground">
                                  🥷 Exp. de Jutsu: <span className="font-semibold text-foreground">{activeMissionDetails.jutsuExperienceReward.xp} XP</span> em {activeMissionDetails.jutsuExperienceReward.jutsuName}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {hasBonus && (
                            <div className="flex items-center gap-2 text-xs text-yellow-500 pt-2 border-t">
                              <Star className="h-3 w-3" />
                              <span>Bônus Premium Aplicado!</span>
                            </div>
                          )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                         {isMissionComplete && !isLoading ? (
                            <Button className="w-full" onClick={handleCompleteMission}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completar Missão
                            </Button>
                        ) : (
                            <>
                              <Button className="flex-1" disabled>
                                  <Timer className="mr-2 h-4 w-4 animate-spin"/>
                                  Missão em Andamento...
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={handleCancelMission}
                                className="flex-shrink-0"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        )
    }

const refreshesUsed = userProfile?.daily_mission_state?.refreshesUsed || 0;
const maxRefreshes = isPremium ? 3 : 1;
const canRefresh = refreshesUsed < maxRefreshes;

    return (
        <div>
            <PageHeader
                title="Missões"
                description="Uma nova lista de desafios a cada 12 horas. Complete-as para ganhar recompensas!"
            />
            {timeUntilReset && (
                <div className="mt-6 mb-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 rounded-md border bg-muted px-4 py-2 text-base font-medium">
                        <Timer className="h-5 w-5 text-primary"/>
                        <span>Próxima atualização em:</span>
                        <span className="font-mono text-primary font-semibold tracking-wider">{timeUntilReset}</span>
                    </div>
                    <Button onClick={handleRefreshMissions} disabled={!canRefresh}>
    <RefreshCw className="mr-2 h-4 w-4" />
    {canRefresh 
      ? `Atualizar Missões (${refreshesUsed}/${maxRefreshes} ${isPremium ? '⭐' : ''})` 
      : 'Atualizações Esgotadas'}
</Button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dailyMissions.sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty)).map((mission) => (
                    <MissionCard 
                        key={mission.id}
                        mission={mission}
                        userProfile={userProfile}
                        onAccept={handleAcceptMission}
                        isDisabled={!!activeMission || !!userProfile.active_hunt}
                        isDaily={true}
                    />
                ))}
            </div>
        </div>
    );
}
