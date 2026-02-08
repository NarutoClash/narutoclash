'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { shouldResetClanMissions, generateClanMissions, getTimeUntilReset } from '@/lib/clan-missions-helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Shield, LogOut, Send, UserCheck, UserX } from 'lucide-react';
import { useSupabase, useMemoSupabase, useDoc, useCollection, WithId } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Gift, Clock, CheckCircle, Timer } from 'lucide-react';
import { ClanChat } from '../(authenticated)/clan/clanchat';


// Função para calcular limite de membros baseado no nível do clã
const getClanMemberLimit = (clanLevel: number): number => {
  return Math.min(5 + (clanLevel - 1), 30);
};


const createClanSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(20, 'O nome deve ter no máximo 20 caracteres.'),
  tag: z.string().min(2, 'A tag deve ter 2-4 caracteres.').max(4, 'A tag deve ter 2-4 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.').max(100, 'A descrição deve ter no máximo 100 caracteres.'),
});

type CreateClanValues = z.infer<typeof createClanSchema>;

type ClanData = {
  name: string;
  tag: string;
  description: string;
  leader_id: string;
  leader_name: string;
  level: number;
  xp: number;
  xp_required: number;
  active_missions?: {
    missions: string[];  // ✅ Array de strings (IDs)
    nextReset: number;
  };
};

type ClanMember = { 
  name: string; 
  level: number; 
  role: 'Líder' | 'Conselheiro' | 'Membro';
  active_clan_mission?: {
    missionId: string;
    startTime: number;
    endTime: number;
  };
  // ✅ Removemos daily_missions (agora é do clã)
};

type MissionWithMember = {
  mission: WithId<ClanMission>;
  assignedTo: {
    userId: string;
    userName: string;
    startTime: number;
    endTime: number;
  } | null;
};

type JoinRequest = { 
  user_id: string; 
  user_name: string; 
  user_level: number; 
};

type ClanMission = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  chakra_cost: number;
  difficulty: 'Fácil' | 'Média' | 'Difícil' | 'Extrema';
  duration_hours: number;
  requirements: { min_level: number; min_clan_level: number };
};

type MissionCompletion = {
  mission_id: string;
  user_id: string;
};

export default function ClanPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPendingClan, setLocalPendingClan] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState<{
    missionId: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const [dailyMissionsResetTimer, setDailyMissionsResetTimer] = useState('');

  const userProfileRef = useMemoSupabase(() => user ? { table: 'profiles', id: user.id } : null, [user]);
  const { data: userProfile, isLoading: isUserLoading } = useDoc(userProfileRef);

  const clanRef = useMemoSupabase(() => userProfile?.clan_id ? { table: 'clans', id: userProfile.clan_id } : null, [userProfile]);
  const { data: clanData, isLoading: isClanLoading } = useDoc<ClanData>(clanRef, {
    subscribe: true,
  });
  
  // Query for clan members
  const membersQuery = useMemoSupabase(() => {
    if (!clanRef) return null;
    return {
      table: 'clan_members',
      query: (builder: any) => builder.eq('clan_id', clanRef.id).select('*'),
    };
  }, [clanRef]);
  const { data: clanMembers, isLoading: areMembersLoading } = useCollection<WithId<ClanMember & { clan_id: string; user_id: string }>>(membersQuery);

  const userRole = useMemo(() => clanMembers?.find(m => m.user_id === user?.id)?.role, [clanMembers, user]);
  const isManager = userRole === 'Líder' || userRole === 'Conselheiro';
  const currentMember = useMemo(() => clanMembers?.find(m => m.user_id === user?.id), [clanMembers, user]);
  const memberActiveMission = currentMember?.active_clan_mission;
  
  // Query for join requests
  const joinRequestsQuery = useMemoSupabase(() => {
    if (!clanRef || !isManager) return null;
    return {
      table: 'clan_join_requests',
      query: (builder: any) => builder.eq('clan_id', clanRef.id),
    };
  }, [clanRef, isManager]);
  const { data: joinRequests, isLoading: areRequestsLoading } = useCollection<WithId<JoinRequest & { clan_id: string }>>(joinRequestsQuery);

  // Query for clan missions
  const missionsQuery = useMemoSupabase(() => {
    return {
      table: 'clan_missions',
      query: (builder: any) => builder.eq('is_active', true),
    };
  }, []);
  const { data: clanMissions, isLoading: areMissionsLoading } = useCollection<WithId<ClanMission>>(missionsQuery);

  // Query for user's completed missions
  const completionsQuery = useMemoSupabase(() => {
    if (!clanRef) return null;
    return {
      table: 'clan_mission_completions',
      query: (builder: any) => 
        builder.eq('clan_id', clanRef.id),  // ✅ De todo o clã
    };
  }, [clanRef]);
  const { data: userCompletions, isLoading: areCompletionsLoading } = useCollection<WithId<MissionCompletion>>(completionsQuery);

  // Filtrar missões baseado nas missões diárias do membro
  // ✅ NOVO: Missões do clã com status de quem está fazendo
const missionsWithStatus = useMemo((): MissionWithMember[] => {
  if (!clanMissions || !clanData?.active_missions?.missions || !clanMembers) return [];
  
  const activeMissionIds = clanData.active_missions.missions;
  
  return clanMissions
    .filter(mission => activeMissionIds.includes(mission.id))
    .map(mission => {
      // Verificar se algum membro está fazendo essa missão
      const memberDoingMission = clanMembers.find(
        m => m.active_clan_mission?.missionId === mission.id
      );
      
      return {
        mission,
        assignedTo: memberDoingMission?.active_clan_mission ? {
          userId: memberDoingMission.user_id,
          userName: memberDoingMission.name,
          startTime: memberDoingMission.active_clan_mission.startTime,
          endTime: memberDoingMission.active_clan_mission.endTime,
        } : null,
      };
    });
}, [clanMissions, clanData?.active_missions, clanMembers]);

  // Available clans query
  const availableClansQuery = useMemoSupabase(() => {
    if (!userProfile || userProfile.clan_id) return null;
    return {
      table: 'clans',
      query: (builder: any) => builder,
    };
  }, [userProfile?.clan_id, userProfile]);
  
  const { data: availableClans, isLoading: areClansLoading } = useCollection<WithId<ClanData>>(availableClansQuery);

  // Sync local pending clan state
  useEffect(() => {
    if (userProfile?.pending_clan_request) {
      setLocalPendingClan(userProfile.pending_clan_request);
    } else {
      setLocalPendingClan(null);
    }
  }, [userProfile?.pending_clan_request]);

  // Sync clan state
  useEffect(() => {
    if (!user || !supabase || !userProfile) return;
    if (userRole === 'Líder' || userRole === 'Conselheiro') return;

    let isSyncing = false;

    const syncClanState = async () => {
      if (isSyncing) return;
      isSyncing = true;

      try {
        if (!userProfile.clan_id && userProfile.pending_clan_request) {
          const { data: member } = await supabase
            .from('clan_members')
            .select('*')
            .eq('clan_id', userProfile.pending_clan_request)
            .eq('user_id', user.id)
            .maybeSingle();

          if (member) {
            const { data: clan } = await supabase
              .from('clans')
              .select('*')
              .eq('id', userProfile.pending_clan_request)
              .maybeSingle();

            if (clan) {
              await supabase
                .from('profiles')
                .update({
                  clan_id: clan.id,
                  clan_name: clan.name,
                  pending_clan_request: null,
                })
                .eq('id', user.id);
            }
          }
        }

        if (userProfile.clan_id) {
          const [memberResult, clanResult] = await Promise.all([
            supabase
              .from('clan_members')
              .select('*')
              .eq('clan_id', userProfile.clan_id)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('clans')
              .select('*')
              .eq('id', userProfile.clan_id)
              .maybeSingle(),
          ]);
        
          if (!clanResult.data || !memberResult.data) {
            await supabase
              .from('profiles')
              .update({
                clan_id: null,
                clan_name: null,
                pending_clan_request: null,
              })
              .eq('id', user.id);
          }
        }
      } catch (error) {
        console.error('Error syncing clan state:', error);
      } finally {
        isSyncing = false;
      }
    };

    syncClanState();
  }, [user?.id, supabase, userProfile?.clan_id, userProfile?.pending_clan_request, userRole]);

  // Sincronizar missão ativa
  useEffect(() => {
    if (!clanMembers || !user) return;
    
    const member = clanMembers.find(m => m.user_id === user.id);
    
    if (member?.active_clan_mission) {
      const now = Date.now();
      if (now < member.active_clan_mission.endTime) {
        setActiveMission(member.active_clan_mission);
      } else {
        if (supabase && clanRef) {
          supabase
            .from('clan_members')
            .update({ active_clan_mission: null })
            .eq('clan_id', clanRef.id)
            .eq('user_id', user.id)
            .then(() => setActiveMission(null));
        }
      }
    } else {
      setActiveMission(null);
    }
  }, [clanMembers, user, supabase, clanRef]);

  // Timer para missão completada
  useEffect(() => {
    if (!activeMission) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= activeMission.endTime) {
        clearInterval(interval);
        toast({
          title: "Missão Completada!",
          description: "Sua missão de clã foi concluída. Colete sua recompensa!",
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMission, toast]);

// ✅ Sistema de missões compartilhadas do clã (reseta às 00:00 BRT)
useEffect(() => {
  if (!clanData || !supabase || !clanRef) return;

  const checkAndResetClanMissions = async () => {
    const clanActiveMissions = clanData.active_missions;
    const now = Date.now();

    // ✅ CORREÇÃO: Verificar corretamente se precisa resetar
    const needsReset = !clanActiveMissions || 
                      !clanActiveMissions.nextReset || 
                      now >= clanActiveMissions.nextReset;

    if (needsReset) {
      console.log('🕐 Resetando missões do clã automaticamente (00:00 BRT)...');

      // Buscar todas as missões disponíveis
      const { data: allMissions } = await supabase
        .from('clan_missions')
        .select('id')
        .eq('is_active', true);

      if (!allMissions || allMissions.length === 0) {
        console.warn('⚠️ Nenhuma missão disponível para reset automático');
        return;
      }

      // Verificar se tem pelo menos 10 missões
      if (allMissions.length < 10) {
        console.warn(`⚠️ Apenas ${allMissions.length} missões disponíveis. Necessário 10.`);
        return;
      }

      // Gerar 10 missões aleatórias
      const missionIds = allMissions.map(m => m.id);
      const newActiveMissions = generateClanMissions(missionIds);

      // Atualizar clã
      const { error } = await supabase
        .from('clans')
        .update({ active_missions: newActiveMissions })
        .eq('id', clanRef.id);

      if (error) {
        console.error('❌ Erro ao atualizar missões do clã:', error);
      } else {
        console.log('✅ Missões do clã resetadas automaticamente');
        console.log('📅 Próximo reset:', new Date(newActiveMissions.nextReset).toLocaleString('pt-BR'));
      }
    } else {
      console.log('⏰ Missões ainda válidas. Próximo reset:', new Date(clanActiveMissions.nextReset).toLocaleString('pt-BR'));
    }
  };

  checkAndResetClanMissions();

  const updateTimer = () => {
    setDailyMissionsResetTimer(getTimeUntilReset());
  };

  updateTimer();
  const intervalId = setInterval(updateTimer, 1000);

  return () => clearInterval(intervalId);
}, [clanData?.active_missions?.nextReset, supabase, clanRef?.id]);

  const form = useForm<CreateClanValues>({
    resolver: zodResolver(createClanSchema),
    defaultValues: { name: '', tag: '', description: '' },
  });

  const handleCreateClan = async (values: CreateClanValues) => {
    if (!user || !supabase || !userProfile || userProfile.clan_id || !userProfileRef) return;
    setIsSubmitting(true);

    try {
      const { data: newClan, error: clanError } = await supabase
        .from('clans')
        .insert({
          name: values.name,
          tag: values.tag,
          description: values.description,
          leader_id: user.id,
          leader_name: userProfile.name,
        })
        .select()
        .single();

      if (clanError) throw clanError;
      if (!newClan) throw new Error('Failed to create clan');

      const { error: memberError } = await supabase
        .from('clan_members')
        .insert({
          clan_id: newClan.id,
          user_id: user.id,
          name: userProfile.name,
          level: userProfile.level,
          role: 'Líder',
        });

      if (memberError) throw memberError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          clan_id: newClan.id,
          clan_name: values.name,
          pending_clan_request: null,
          ryo: (userProfile.ryo || 0) - 10000,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({ title: 'Clã Criado!', description: `Bem-vindo ao ${values.name}!` });
      window.location.reload();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao criar clã', 
        description: error.message || 'Erro desconhecido ao criar o clã'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRequest = async (clanToJoin: WithId<ClanData>) => {
    if (!user || !supabase || !userProfile || userProfile.clan_id || localPendingClan || !userProfileRef) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('clan_join_requests')
        .insert({
          clan_id: clanToJoin.id,
          user_id: user.id,
          user_name: userProfile.name,
          user_level: userProfile.level,
        });

      if (error) throw error;

      setLocalPendingClan(clanToJoin.id);
      await supabase
        .from('profiles')
        .update({ pending_clan_request: clanToJoin.id })
        .eq('id', user.id);

      toast({ title: 'Solicitação Enviada!', description: `Seu pedido para entrar em ${clanToJoin.name} foi enviado.` });
      window.location.reload();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao enviar solicitação', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageRequest = async (request: WithId<JoinRequest & { clan_id: string }>, accept: boolean) => {
    if (!supabase || !clanRef) return;
    setIsSubmitting(true);

    try {
      if (accept) {
        if (!clanData) throw new Error('Dados do clã não disponíveis');
        
        const currentMemberCount = clanMembers?.length ?? 0;
        const memberLimit = Math.min(5 + (clanData.level - 1), 30);
        
        if (currentMemberCount >= memberLimit) {
          toast({
            variant: 'destructive',
            title: 'Limite de Membros Atingido',
            description: `O clã atingiu o limite de ${memberLimit} membros. Aumente o nível do clã para aceitar mais membros.`,
          });
          setIsSubmitting(false);
          return;
        }

        const { error: memberError } = await supabase
          .from('clan_members')
          .insert({
            clan_id: clanRef.id,
            user_id: request.user_id,
            name: request.user_name,
            level: request.user_level,
            role: 'Membro',
          });

        if (memberError) throw memberError;

        const { data: clan } = await supabase
          .from('clans')
          .select('name')
          .eq('id', clanRef.id)
          .single();

        if (clan) {
          await supabase
            .from('profiles')
            .update({
              clan_id: clanRef.id,
              clan_name: clan.name,
              pending_clan_request: null,
            })
            .eq('id', request.user_id);
        }

        await supabase
          .from('clan_join_requests')
          .delete()
          .eq('id', request.id);

        toast({
          title: 'Membro Aceito!',
          description: `${request.user_name} agora faz parte do clã.`,
        });
        window.location.reload();
      } else {
        await supabase
          .from('profiles')
          .update({ pending_clan_request: null })
          .eq('id', request.user_id);

        await supabase
          .from('clan_join_requests')
          .delete()
          .eq('id', request.id);

        toast({ title: 'Solicitação Recusada' });
      }
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerenciar solicitação',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteMission = async (mission: WithId<ClanMission>) => {
    if (!user || !supabase || !userProfile || !clanRef || !clanData || !currentMember) return;
    
    const chakraCost = mission.chakra_cost || 0;
    const currentChakra = userProfile.current_chakra || 0;
    
    if (currentChakra < chakraCost) {
      toast({
        variant: "destructive",
        title: "Chakra Insuficiente!",
        description: `Você precisa de ${chakraCost} chakra, mas só tem ${currentChakra}. Descanse para recuperar chakra.`,
      });
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const startTime = Date.now();
      const durationMs = (mission.duration_hours || 1) * 60 * 60 * 1000;
      const endTime = startTime + durationMs;
  
      const { error: chakraError } = await supabase
        .from('profiles')
        .update({ 
          current_chakra: currentChakra - chakraCost 
        })
        .eq('id', user.id);
  
      if (chakraError) throw chakraError;
  
      const { error: memberError } = await supabase
        .from('clan_members')
        .update({
          active_clan_mission: {
            missionId: mission.id,
            startTime,
            endTime,
          }
        })
        .eq('id', currentMember.id)
        .select();
  
      if (memberError) throw memberError;
  
      setActiveMission({ missionId: mission.id, startTime, endTime });
  
      toast({
        title: 'Missão Iniciada!',
        description: `Completando "${mission.title}"... Tempo: ${mission.duration_hours}h. Chakra usado: ${chakraCost}.`,
      });
  
      // ✅ ADICIONAR: Reload após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar missão',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectMissionReward = async () => {
    if (!user || !supabase || !userProfile || !clanRef || !clanData || !activeMission || !currentMember) return;
    
    const mission = clanMissions?.find(m => m.id === activeMission.missionId);
    if (!mission) return;
  
    if (Date.now() < activeMission.endTime) {
      toast({
        variant: "destructive",
        title: "Missão ainda em andamento",
        description: "Aguarde o tempo necessário para completar a missão.",
      });
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const { error: completionError } = await supabase
        .from('clan_mission_completions')
        .insert({
          clan_id: clanRef.id,
          mission_id: mission.id,
          user_id: user.id,
          user_name: userProfile.name,
          xp_earned: mission.xp_reward,
        });
  
      if (completionError) throw completionError;
  
      const newXp = clanData.xp + mission.xp_reward;
      const newLevel = clanData.level;
      const xpRequired = clanData.xp_required;
  
      let updateData: any = { xp: newXp };
      
      if (newXp >= xpRequired) {
        updateData = {
          level: newLevel + 1,
          xp: 0,
          xp_required: Math.floor(1000 * (newLevel + 1) * 1.5),
        };
      }
  
      const { error: clanError } = await supabase
        .from('clans')
        .update(updateData)
        .eq('id', clanRef.id);
  
      if (clanError) throw clanError;
  
      const { error: memberError } = await supabase
        .from('clan_members')
        .update({ active_clan_mission: null })
        .eq('clan_id', clanRef.id)
        .eq('user_id', user.id);
  
      if (memberError) throw memberError;
  
      toast({
        title: '✅ Recompensa Coletada!',
        description: `Você ganhou ${mission.xp_reward} XP para o clã!`,
      });
  
      setActiveMission(null);
  
      // ✅ JÁ EXISTE: Reload após 1 segundo (mantém como está)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao coletar recompensa',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveClan = async () => {
    if (!user || !supabase || !userProfile || !userProfile.clan_id || !userProfileRef) return;

    setIsSubmitting(true);

    try {
      const clanId = userProfile.clan_id;
      const isLeader = userRole === 'Líder';
      const totalMembers = clanMembers?.length ?? 0;

      if (isLeader && totalMembers > 1) {
        toast({
          variant: 'destructive',
          title: 'Ação Bloqueada',
          description: 'Você não pode sair do clã como líder enquanto houver outros membros. Expulse todos primeiro ou passe a liderança.',
        });
        setIsSubmitting(false);
        return;
      }

      if (isLeader && totalMembers <= 1) {
        await supabase.from('clan_members').delete().eq('clan_id', clanId);
        await supabase.from('clan_join_requests').delete().eq('clan_id', clanId);
        await supabase.from('clans').delete().eq('id', clanId);
      } else {
        await supabase
          .from('clan_members')
          .delete()
          .eq('clan_id', clanId)
          .eq('user_id', user.id);
      }

      await supabase
        .from('profiles')
        .update({
          clan_id: null,
          clan_name: null,
          pending_clan_request: null,
        })
        .eq('id', user.id);

      toast({
        title: isLeader ? 'Clã desbandado' : 'Você saiu do clã',
        description: isLeader ? 'O clã foi dissolvido com sucesso.' : 'Sua saída foi realizada com sucesso.',
      });
      window.location.reload();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair do clã',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpelMember = async (memberId: string, memberName: string) => {
    if (!user || !supabase || !userProfile || !userProfile.clan_id) return;

    setIsSubmitting(true);
    try {
      if (memberId === user.id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Você não pode se expulsar. Use o botão de sair do clã.',
        });
        setIsSubmitting(false);
        return;
      }

      await supabase
        .from('clan_members')
        .delete()
        .eq('clan_id', userProfile.clan_id)
        .eq('user_id', memberId);

      await supabase
        .from('clan_join_requests')
        .delete()
        .eq('user_id', memberId);

      await supabase
        .from('profiles')
        .update({
          clan_id: null,
          clan_name: null,
          pending_clan_request: null,
        })
        .eq('id', memberId);

      toast({ title: 'Membro Expulso', description: `${memberName} foi removido do clã.` });
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao expulsar membro", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferLeadership = async (newLeaderId: string, newLeaderName: string) => {

    if (!user || !supabase || !userProfile || !userProfile.clan_id || !clanData) return;

    setIsSubmitting(true);
    try {
      const { error: newLeaderError } = await supabase
        .from('clan_members')
        .update({ role: 'Líder' })
        .eq('clan_id', userProfile.clan_id)
        .eq('user_id', newLeaderId);

      if (newLeaderError) throw newLeaderError;

      const { error: oldLeaderError } = await supabase
        .from('clan_members')
        .update({ role: 'Membro' })
        .eq('clan_id', userProfile.clan_id)
        .eq('user_id', user.id);

      if (oldLeaderError) throw oldLeaderError;

      const { error: clanError } = await supabase
        .from('clans')
        .update({
          leader_id: newLeaderId,
          leader_name: newLeaderName,
        })
        .eq('id', userProfile.clan_id);

      if (clanError) throw clanError;

      toast({ 
        title: 'Liderança Transferida', 
        description: `${newLeaderName} agora é o líder do clã.` 
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao transferir liderança", 
        description: error.message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isUserLoading || isClanLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (userProfile?.clan_id && clanData) {
    const isLeader = userRole === 'Líder';
    const totalMembros = clanMembers?.length ?? 0;

    return (
      <div>
        <PageHeader title={clanData.name} description={`[${clanData.tag}] - ${clanData.description}`} />
        
        <Card className="mt-6">
        <CardHeader>
  <div className="flex justify-between items-center">
    <div>
      <CardTitle className="flex items-center gap-2">
        <Trophy className="text-primary" />
        Informações do Clã
      </CardTitle>
      <CardDescription>
        Nível {clanData.level} • {totalMembros}/{getClanMemberLimit(clanData.level)} Membros
      </CardDescription>
    </div>
    {dailyMissionsResetTimer && (
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">Próximo reset:</span>
        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm">
          <Timer className="h-4 w-4 text-primary"/>
          <span className="font-mono font-semibold">{dailyMissionsResetTimer}</span>
        </div>
      </div>
    )}
  </div>
</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nível do Clã</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{clanData.level}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Membros</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">
                      {totalMembros}
                      <span className="text-base text-muted-foreground">/{getClanMemberLimit(clanData.level)}</span>
                    </span>
                  </div>
                  {totalMembros >= getClanMemberLimit(clanData.level) && (
                    <Badge variant="destructive" className="text-xs">Limite Atingido</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-primary" />
                    XP para Próximo Nível
                  </span>
                  <span className="font-semibold">{clanData.xp} / {clanData.xp_required}</span>
                </div>
                <Progress value={(clanData.xp / clanData.xp_required) * 100} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {Math.floor((clanData.xp / clanData.xp_required) * 100)}% completo
                  </span>
                  <span>
                    {clanData.xp_required - clanData.xp} XP restante
                  </span>
                </div>
              </div>

              {clanData.level < 30 && (
                <div className="p-2 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    ⭐ <strong>Nível {clanData.level + 1}:</strong> Desbloqueará {getClanMemberLimit(clanData.level + 1)} vagas de membros
                    {getClanMemberLimit(clanData.level + 1) <= getClanMemberLimit(clanData.level) 
                      ? ' (máximo atingido)' 
                      : ` (+${getClanMemberLimit(clanData.level + 1) - getClanMemberLimit(clanData.level)} vaga${getClanMemberLimit(clanData.level + 1) - getClanMemberLimit(clanData.level) > 1 ? 's' : ''})`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="text-primary"/>Membros ({totalMembros})</CardTitle>
            </CardHeader>
            <CardContent>
              {areMembersLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="space-y-4">
                  {clanMembers?.sort((a, b) => b.level - a.level).map(member => (
                    <div key={member.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                      <div>
                        <span className="font-semibold">{member.name}</span>
                        <Badge variant={member.role === 'Líder' ? 'default' : member.role === 'Conselheiro' ? 'secondary' : 'outline'} className="ml-2">{member.role}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Nível: {member.level}</span>
                        {isManager && member.role !== 'Líder' && member.user_id !== user?.id && (
                          <div className="flex gap-2">
                            {isLeader && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="outline" disabled={isSubmitting}>
                                    <Shield className="h-4 w-4 text-yellow-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Transferir Liderança para {member.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. {member.name} se tornará o novo líder do clã e você se tornará um membro comum.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleTransferLeadership(member.user_id, member.name)} 
                                      className={cn(buttonVariants({variant: 'default'}))}
                                    >
                                      Confirmar Transferência
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="destructive" disabled={isSubmitting}>
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Expulsar {member.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O membro será removido do clã.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleExpelMember(member.user_id, member.name)} className={cn(buttonVariants({variant: 'destructive'}))}>Confirmar Expulsão</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="text-primary"/>Opções do Clã</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">Líder: {clanData.leader_name}</p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSubmitting}>
                      <LogOut className="mr-2"/>{isLeader ? 'Disbandar Clã' : 'Sair do Clã'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {isLeader && totalMembros > 1 
                          ? 'Você não pode sair do clã como líder enquanto houver outros membros. Expulse todos primeiro ou passe a liderança.'
                          : isLeader
                          ? 'Esta ação irá dissolver o clã permanentemente.'
                          : 'Você será removido do clã.'
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLeaveClan} className={cn(buttonVariants({variant: 'destructive'}))}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {user && userProfile && clanRef && (
              <ClanChat 
                clanId={clanRef.id}
                userId={user.id}
                userName={userProfile.name}
                supabase={supabase}
              />
            )}

            {isManager && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck />Solicitações</CardTitle></CardHeader>
                <CardContent>
                  {areRequestsLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : 
                    joinRequests && joinRequests.length > 0 ? (
                      <div className="space-y-3">
                        {joinRequests.map(req => (
                          <div key={req.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                            <div>
                              <p className="font-semibold">{req.user_name}</p>
                              <p className="text-xs text-muted-foreground">Nível: {req.user_level}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-500/10" onClick={() => handleManageRequest(req as WithId<JoinRequest & { clan_id: string }>, false)} disabled={isSubmitting}><UserX /></Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleManageRequest(req as WithId<JoinRequest & { clan_id: string }>, true)} disabled={isSubmitting}><UserCheck /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground text-center">Nenhuma solicitação pendente.</p>
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-primary" />
              Missões Diárias do Clã
            </CardTitle>
            <CardDescription>
              Complete suas 3 missões diárias para ganhar XP e evoluir o clã. Resetam às 00:00 BRT.
            </CardDescription>
          </CardHeader>
          <CardContent>
          {areMissionsLoading || areCompletionsLoading ? (
  <div className="flex justify-center">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
) : missionsWithStatus && missionsWithStatus.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {missionsWithStatus.map(({ mission, assignedTo }) => {
      const isMyMission = assignedTo?.userId === user?.id;
      const isOccupied = !!assignedTo;
      const hasEnoughChakra = (userProfile?.current_chakra || 0) >= (mission.chakra_cost || 0);
      const isMissionComplete = isMyMission && Date.now() >= (assignedTo?.endTime || 0);
      const timeRemaining = isOccupied ? Math.max(0, (assignedTo?.endTime || 0) - Date.now()) : 0;
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      // Verificar se foi completada (não aparece mais)
      const isCompleted = userCompletions?.some(c => c.mission_id === mission.id);
      if (isCompleted) return null;

      return (
        <Card key={mission.id} className={cn(
          "border-2",
          isOccupied && "border-yellow-500/50 bg-yellow-500/5"
        )}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{mission.title}</CardTitle>
              <Badge
                variant={
                  mission.difficulty === 'Fácil'
                    ? 'outline'
                    : mission.difficulty === 'Média'
                    ? 'secondary'
                    : mission.difficulty === 'Difícil'
                    ? 'default'
                    : 'destructive'
                }
              >
                {mission.difficulty}
              </Badge>
            </div>
            <CardDescription>{mission.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Gift className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{mission.xp_reward} XP</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                • <span className="text-blue-400">⚡</span> Chakra: {mission.chakra_cost}
              </p>
              <p className="flex items-center gap-1">
                • <Clock className="h-3 w-3 inline" /> Duração: {mission.duration_hours}h
              </p>
            </div>
            
            {/* Status da Missão */}
            {isOccupied && (
              <div className="space-y-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">
                    {isMyMission ? 'Você está fazendo esta missão' : `${assignedTo.userName} está fazendo`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Tempo Restante:</span>
                  <span className="font-mono">{hours}h {minutes}m</span>
                </div>
                <Progress 
                  value={((Date.now() - assignedTo.startTime) / (assignedTo.endTime - assignedTo.startTime)) * 100} 
                  className="h-2" 
                />
              </div>
            )}
            
            {/* Botões de Ação */}
            {isMyMission && isMissionComplete ? (
              <Button 
                className="w-full" 
                onClick={handleCollectMissionReward}
                disabled={isSubmitting}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Coletar Recompensa
              </Button>
            ) : isMyMission ? (
              <Button className="w-full" disabled>
                <Timer className="mr-2 h-4 w-4 animate-spin"/>
                Missão em Andamento...
              </Button>
            ) : isOccupied ? (
              <Button className="w-full" disabled variant="secondary">
                <Users className="mr-2 h-4 w-4" />
                Missão Ocupada
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    disabled={isSubmitting || !!activeMission || !hasEnoughChakra}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    {!hasEnoughChakra ? `Chakra Insuficiente (${mission.chakra_cost})` :
                     activeMission ? 'Você já está em outra missão' : 
                     'Iniciar Missão'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Iniciar {mission.title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta missão levará {mission.duration_hours} hora(s) para ser completada e custará {mission.chakra_cost} de chakra. 
                      Você ganhará {mission.xp_reward} XP para o clã ao concluir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCompleteMission(mission)}
                      className={cn(buttonVariants({ variant: 'default' }))}
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      );
    })}
  </div>
) : (
  <div className="text-center py-8">
    <p className="text-muted-foreground">
      Nenhuma missão disponível no momento. Aguarde o próximo reset às 00:00 BRT!
    </p>
  </div>
)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Clã" description="Junte-se a um clã ou crie o seu próprio para lutar ao lado de seus companheiros." />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateClan)}>
              <CardHeader>
                <CardTitle>Criar um Novo Clã</CardTitle>
                <CardDescription>Lidere seus próprios ninjas para a glória. (Custo: 10,000 Ryo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Clã</FormLabel><FormControl><Input placeholder="Akatsuki" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tag" render={({ field }) => (
                  <FormItem><FormLabel>Tag (2-4 caracteres)</FormLabel><FormControl><Input placeholder="AKTK" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Um grupo de ninjas renegados..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting || (userProfile?.ryo || 0) < 10000 || !!localPendingClan}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!!localPendingClan ? 'Solicitação pendente' : (userProfile?.ryo || 0) < 10000 ? 'Ryo Insuficiente' : 'Fundar Clã'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Juntar-se a um Clã</CardTitle>
            <CardDescription>Encontre um clã e envie uma solicitação para fazer parte de uma equipe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <h3 className="text-lg font-semibold text-center">Clãs Disponíveis</h3>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {areClansLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>}
              {!areClansLoading && availableClans?.length === 0 && <p className="text-center text-muted-foreground">Nenhum clã encontrado ainda.</p>}
              {availableClans?.map(clan => (
                <div key={clan.id} className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                  <div className="space-y-1">
                    <p className="font-bold">{clan.name} [{clan.tag}]</p>
                  </div>
                  <Button size="sm" onClick={() => handleJoinRequest(clan)} disabled={isSubmitting || !!localPendingClan}>
                    <Send className="mr-2 h-3 w-3"/>
                    {localPendingClan === clan.id ? 'Pendente' : 'Solicitar'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
