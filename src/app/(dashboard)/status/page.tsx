'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { elementImages } from '@/lib/element-images';
import type { Jutsu } from '@/lib/jutsus-data'; // ✅ ADICIONAR
import { defaultJutsuImage } from '@/lib/jutsus-data'; // ✅ ADICIONAR
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, UserPlus, LucideIcon, Trash2, CheckCircle, ScrollText, Utensils, Swords, Footprints, Shirt, Hand, User, Loader2, Crown, Eye, Sparkles, Clock, Award, Coins, Star, X, Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { useCollection, WithId } from '@/supabase';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import * as LucideIcons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { villageImages } from '@/lib/village-images';
import { getXpForLevel, getLevelFromXp } from '@/lib/xp-utils';
import { missionsData } from '@/lib/missions-data';
import { useActiveMission } from '@/hooks/use-active-mission';
import { doujutsuData } from '@/lib/dojutsu-data';
import { doujutsuImages } from '@/lib/dojutsu-images';
import { ShieldQuestion } from 'lucide-react';
import { ichirakuMenu, IchirakuItem } from '@/lib/ichiraku-data';
import { weaponsData, type Weapon } from '@/lib/weapons-data';
import { summonsData, type Summon, TRAINING_BONUS_PER_LEVEL } from '@/lib/summons-data';
import { equipmentsData, type Equipment } from '@/lib/equipments-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { usePlayerRank } from '@/hooks/use-player-rank';
import { calculateRank } from '@/lib/rank-calculator';
import { Gift } from 'lucide-react'
import { usePathname } from 'next/navigation';


const bossDrops = {
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
      description: 'Uma pequena fortuna em moedas',
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
      description: 'Aumenta ganho de XP em missões por 24h',
      effect: 'xp_boost_24h',
      percent: 15,
      dropChance: 0.001,
      rarity: 'comum',
      icon: '🏋️'
    },
    {
      id: 'fortune_charm',
      name: 'Amuleto da Fortuna',
      description: 'Aumenta Ryo ganho em missões por 24h',
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
      description: 'Libera pontos de atributo adicionais',
      effect: 'stat_points',
      amount: 3,
      dropChance: 0.0008,
      rarity: 'raro',
      icon: '💊'
    },
    {
      id: 'element_training_scroll',
      name: 'Pergaminho de Treinamento Elemental',
      description: 'Acelera o domínio de um elemento',
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
      description: 'Uma fortuna considerável',
      effect: 'ryo',
      amount: 8000,
      dropChance: 0.0005,
      rarity: 'raro',
      icon: '💰'
    },
    {
      id: 'jutsu_refinement_manual',
      name: 'Manual de Refinamento de Jutsu',
      description: 'Melhora a eficiência dos jutsus',
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
      description: 'Conhecimento condensado de múltiplas artes',
      effect: 'dual_stat_points',
      amount: 2,
      dropChance: 0.00015,
      rarity: 'épico',
      icon: '📚'
    },
    {
      id: 'elemental_mastery_orb',
      name: 'Orbe de Maestria Elemental',
      description: 'Energia elemental pura concentrada',
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
      description: 'Poder condensado dos deuses shinobi',
      effect: 'all_stats',
      amount: 10,
      dropChance: 0.0001,
      rarity: 'lendário',
      icon: '✨'
    },
    {
      id: 'eternal_youth_elixir',
      name: 'Elixir da Juventude Eterna',
      description: 'Restaura completamente vida e chakra + buff temporário',
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
      description: 'Conhecimento ancestral dos Seis Caminhos',
      effect: 'triple_stat_points',
      amount: 5,
      dropChance: 0.00004,
      rarity: 'lendário',
      icon: '📜'
    },
    {
      id: 'forbidden_technique_scroll',
      name: 'Pergaminho de Técnica Proibida',
      description: 'Acelera drasticamente o aprendizado',
      effect: 'element_and_jutsu_xp',
      amount: 1000,
      dropChance: 0.00001,
      rarity: 'lendário',
      icon: '📖'
    },
  ],
};

const StatItem = ({
  label,
  value,
  onIncrement,
  isUpgradeable = false,
  baseValue,
  tooltipContent,
  isDistributionDisabled = false,
  tooltipSide = "top",
}: {
  label: string;
  value: number;
  onIncrement?: () => void;
  isUpgradeable?: boolean;
  baseValue: number;
  tooltipContent?: React.ReactNode;
  isDistributionDisabled?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}) => {
  const bonus = value - baseValue;
  const showTooltip = tooltipContent || bonus !== 0;

  const content = (
     <div className="flex flex-col items-center justify-between rounded-lg border bg-muted/30 p-3 shadow-sm transition-all hover:bg-muted/60 h-full">
      <span className="font-medium text-sm">{label}</span>
      <div className="flex flex-col items-center gap-1 text-right mt-2">
        <div className="flex items-end gap-1">
        <span className="text-xl font-bold text-foreground leading-none">
  {isNaN(value) ? 0 : Math.round(value)}
</span>
             {bonus !== 0 && (
               <span className={cn("text-xs leading-none", bonus > 0 ? "text-green-400" : "text-red-500")}>
                  ({bonus > 0 ? `+${Math.round(bonus)}` : Math.round(bonus)})
              </span>
            )}
        </div>
        {isUpgradeable && (
          <Button size="icon" variant="outline" className="h-6 w-6 shrink-0 mt-1" onClick={onIncrement} disabled={isDistributionDisabled}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
    
  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side={tooltipSide} sideOffset={5} className="z-50 max-w-xs">
        <div className="p-2 space-y-1 text-xs">
        <div className="flex justify-between gap-4"><span>Base:</span> <span>{Math.round(baseValue)}</span></div>
        {tooltipContent}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

const StatBuffDisplay = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold", Number(value) > 0 ? "text-green-400" : "text-red-500")}>
            {Number(value) > 0 ? `+${value}` : value}
        </span>
    </div>
);

const ProgressBarStat = ({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number;
  max: number;
  className?: string;
}) => (
  <div className="w-full">
    <div className="mb-1 flex items-baseline justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">
        {Math.round(value)} / {Math.round(max)}
      </span>
    </div>
    <Progress value={(value / max) * 100} className={cn('h-3', className)} />
  </div>
);

const elementIconMap: { [key: string]: LucideIcon } = {
  'Katon': LucideIcons.Flame,
  'Futon': LucideIcons.Wind,
  'Raiton': LucideIcons.Zap,
  'Doton': LucideIcons.Mountain,
  'Suiton': LucideIcons.Waves,
};

const allElements = ['Katon', 'Futon', 'Raiton', 'Doton', 'Suiton'];

// 🆕 ADICIONAR ESTAS LINHAS
const SEAL_IMAGES = {
  level1: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Selo/selo1.png',
  level2: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Selo/selo3%20.png',
};

const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const SEAL_DURATION = 30 * 60 * 1000;
const SEAL_COOLDOWN = 24 * 60 * 60 * 1000;

type StatKey = 'vitalidade' | 'inteligencia' | 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'selo';

const SelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  options,
  maxSelections,
  icon 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selected: string[]) => void;
  title: string;
  description: string;
  options: { value: string; label: string }[];
  maxSelections: number;
  icon: string;
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  // ✅ ADICIONE ESTAS 5 LINHAS AQUI (ANTES DO IF)
  useEffect(() => {
    if (!isOpen) {
      setSelected([]);
    }
  }, [isOpen]);
  // ✅ FIM DAS LINHAS ADICIONADAS

  if (!isOpen) return null;  // ← Agora o IF vem DEPOIS do useEffect

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else if (selected.length < maxSelections) {
      setSelected([...selected, value]);
    }
  };

  const handleConfirm = () => {
    if (selected.length === maxSelections) {
      onConfirm(selected);
      setSelected([]); // ✅ Resetar seleção
      onClose();
    }
  };

  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md border-2">
        <CardHeader>
          <CardTitle className="text-center text-2xl flex items-center justify-center gap-3">
            <span className="text-4xl">{icon}</span>
            {title}
          </CardTitle>
          <CardDescription className="text-center mt-2">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            Selecionados: {selected.length} / {maxSelections}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              const isDisabled = !isSelected && selected.length >= maxSelections;

              return (
                <Button
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start text-left",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleToggle(option.value)}
                  disabled={isDisabled}
                >
                  {isSelected && <CheckCircle className="mr-2 h-4 w-4" />}
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            disabled={selected.length !== maxSelections}
          >
            Confirmar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default function StatusPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [hasCheckedReload, setHasCheckedReload] = useState(false);

  // 🆕 Reload ao entrar na página (ALTERNATIVA MAIS LIMPA)
  useEffect(() => {
    if (!hasCheckedReload) {
      setHasCheckedReload(true);
      
      const lastReload = sessionStorage.getItem('status-last-reload');
      const now = Date.now();
      
      // Só recarrega se passou mais de 2 segundos desde o último reload
      if (!lastReload || now - parseInt(lastReload) > 2000) {
        sessionStorage.setItem('status-last-reload', now.toString());
        window.location.reload();
      }
    }
  }, [hasCheckedReload]);

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);

  const { data: userProfile, isLoading } = useDoc(userProfileRef);

// ✅ BUSCAR JUTSUS DO BANCO DE DADOS
const jutsusQuery = useMemoSupabase(() => {
  return {
    table: 'jutsus',
    query: (builder: any) => builder.select('*')
  };
}, []);

const { data: jutsusFromDB } = useCollection(jutsusQuery);

// ✅ CRIAR MAPA DE JUTSUS POR NOME
const jutsusMap = useMemo(() => {
  if (!jutsusFromDB) return new Map<string, Jutsu>();
  
  const map = new Map<string, Jutsu>();
  jutsusFromDB.forEach((jutsu: any) => {
    map.set(jutsu.name, {
      id: jutsu.id,
      name: jutsu.name,
      element: jutsu.element,
      requiredLevel: jutsu.required_level,
      imageUrl: jutsu.image_url || defaultJutsuImage,
      description: jutsu.description,
    });
  });
  
  return map;
}, [jutsusFromDB]);

// Hook para buscar o rank do jogador
const { rank: playerRank, isKage, isLoading: isRankLoading } = usePlayerRank(
  supabase,
  user?.id,
  userProfile?.village,
  userProfile?.level
);

// 🆕 BUSCAR APENAS BOOSTS ATIVOS (SEM POÇÕES)
const boostsQuery = useMemoSupabase(() => {
  if (!user) return null;
  return {
    table: 'user_premium_inventory',
    query: (builder: any) => 
      builder
        .eq('user_id', user.id)
        .in('item_type', ['boost', 'ryo_boost', 'xp_boost']) // ✅ REMOVIDO chakra_potion e health_potion
        .gte('expires_at', new Date().toISOString())
  };
}, [user]);

const { data: activeBoosts } = useCollection(boostsQuery);


// 🆕 BUSCAR POÇÕES SEM JOIN
const potionsQuery = useMemoSupabase(() => {
  if (!user) return null;
  return {
    table: 'user_premium_inventory',
    query: (builder: any) => 
      builder
        .eq('user_id', user.id)
        .in('item_type', ['chakra_potion', 'health_potion'])
        .gte('expires_at', new Date().toISOString())
  };
}, [user]);

const { data: activePotions } = useCollection(potionsQuery);

// 🆕 BUSCAR DADOS DOS PREMIUM ITEMS
const premiumItemsQuery = useMemoSupabase(() => ({
  table: 'premium_items',
  query: (builder: any) => builder.select('*')
}), []);

const { data: allPremiumItems } = useCollection(premiumItemsQuery);

// 🆕 CRIAR MAPA DE PREMIUM ITEMS
const premiumItemsMap = useMemo(() => {
  if (!allPremiumItems) return new Map();
  const map = new Map();
  allPremiumItems.forEach((item: any) => {
    map.set(item.id, item);
  });
  return map;
}, [allPremiumItems]);

// 🆕 BUSCAR PREMIUM PASS ATIVO (inclui item_data)
const premiumPassQuery = useMemoSupabase(() => {
  if (!user) return null;
  return {
    table: 'user_premium_inventory',
    query: (builder: any) => 
      builder
        .eq('user_id', user.id)
        .eq('item_type', 'premium_pass')
        .gte('expires_at', new Date().toISOString())
        .select('*')  // ✅ MUDANÇA: Usar '*'
        .order('expires_at', { ascending: false })
        // ✅ MUDANÇA: Remover .limit(1)
  };
}, [user]);

const { data: activePremiumPass } = useCollection(premiumPassQuery);
const hasPremiumPass = activePremiumPass && activePremiumPass.length > 0;
const premiumPassData = hasPremiumPass ? activePremiumPass[0] : null;

// 🔍 DEBUG - Ver o que está retornando
useEffect(() => {
  console.log('🔍 Premium Pass Query Result:', {
    activePremiumPass,
    hasPremiumPass,
    premiumPassData,
    item_data: premiumPassData?.item_data
  });
}, [activePremiumPass, hasPremiumPass, premiumPassData]);

useEffect(() => {
  console.log('=== DEBUG PREMIUM COMPLETO ===');
  console.log('User ID:', user?.id);
  console.log('Premium Pass:', activePremiumPass);
  console.log('Active Boosts:', activeBoosts);
  console.log('Active Potions:', activePotions);
  console.log('Has Premium Pass:', hasPremiumPass);
  
  if (hasPremiumPass && premiumPassData) {
    console.log('📦 Premium Pass Data:', {
      name: premiumPassData.item_data?.name,
      expires_at: premiumPassData.expires_at,
      created_at: premiumPassData.created_at,
      benefits: premiumPassData.item_data?.benefits,
    });
  }
}, [activePremiumPass, activeBoosts, activePotions, user]);

  const [huntTimeRemaining, setHuntTimeRemaining] = useState(0);
  const [huntProgress, setHuntProgress] = useState(0);
  const [sealTimeRemaining, setSealTimeRemaining] = useState(0);
  const [sealCooldownRemaining, setSealCooldownRemaining] = useState(0);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [localActiveMission, setLocalActiveMission] = useState<{
      missionId: string;
      startTime: number;
      endTime: number;
  } | null>(null);
  const [missionJustCompleted, setMissionJustCompleted] = useState(false);
  const [doujutsuCooldownRemaining, setDoujutsuCooldownRemaining] = useState(0);
  const [chakraRegenTimeRemaining, setChakraRegenTimeRemaining] = useState(0);

  const effectiveActiveMission = missionJustCompleted ? null : (localActiveMission || userProfile?.active_mission);
  const { 
      activeMission, 
      missionDetails: activeMissionDetails, 
      timeRemaining: missionTimeRemaining, 
      progress: missionProgress, 
      isMissionComplete 
  } = useActiveMission(
      effectiveActiveMission ? { ...userProfile, active_mission: effectiveActiveMission } : userProfile as any, 
      missionsData
  );

  const activeHunt = userProfile?.active_hunt;
  const sealData = userProfile?.cursed_seal;
  const doujutsu = userProfile?.doujutsu;
  const isHuntComplete = !isLoading && userProfile && activeHunt && huntTimeRemaining <= 0;
  
  const isSealCurrentlyActive = useMemo(() => {
      if (sealData?.isActive && sealData?.activationTime) {
          const now = Date.now();
          const elapsed = now - sealData.activationTime;
          return elapsed < SEAL_DURATION;
      }
      return false;
  }, [sealData]);
  
  const isDoujutsuActive = useMemo(() => {
      return doujutsu?.isActive || false;
  }, [doujutsu]);

  
  // ✅ VERSÃO COMPLETA E CORRIGIDA DA FUNÇÃO getBonusTooltip
// Substitua a função inteira no seu código por esta versão:

const getBonusTooltip = (stat: StatKey, userProfile: any): React.ReactNode => {
  if (!userProfile) return null;

  const equippedWeapon = weaponsData.find(w => w.id === userProfile.weapon_id);
  const equippedSummon = summonsData.find(s => s.id === userProfile.summon_id);
  const equippedChest = equipmentsData.find(e => e.id === userProfile.chest_id);
  const equippedLegs = equipmentsData.find(e => e.id === userProfile.legs_id);
  const equippedFeet = equipmentsData.find(e => e.id === userProfile.feet_id);
  const equippedHands = equipmentsData.find(e => e.id === userProfile.hands_id);

  const weaponBuff = equippedWeapon?.buffs[stat] || 0;
  const equipmentBuff = 
    (equippedChest?.buffs[stat] || 0) +
    (equippedLegs?.buffs[stat] || 0) +
    (equippedFeet?.buffs[stat] || 0) +
    (equippedHands?.buffs[stat] || 0);

  let summonBuff = 0;
  if (equippedSummon) {
    const statKey = stat as keyof Summon['buffs'];
    const baseBuff = equippedSummon.buffs[statKey] || 0;
    
    const trainedStat = userProfile.summon_trained_stat;
    const summonLevel = userProfile.summon_level || 1;
    
    if (trainedStat === stat && summonLevel > 1) {
      summonBuff = baseBuff + ((summonLevel - 1) * TRAINING_BONUS_PER_LEVEL);
    } else {
      summonBuff = baseBuff;
    }
  }

  let sealMultiplier = 1;
  const cursedSeal = userProfile.cursed_seal;
  const isSealActive = cursedSeal?.isActive && cursedSeal?.activationTime 
    && (Date.now() - cursedSeal.activationTime) < (30 * 60 * 1000);

  if (isSealActive && cursedSeal) {
    if (cursedSeal.level === 1) {
      if (stat === 'vitalidade') sealMultiplier = 0.85;
      if (stat === 'ninjutsu' || stat === 'taijutsu') sealMultiplier = 1.20;
      if (stat === 'selo') sealMultiplier = 1.15;
    } else if (cursedSeal.level === 2) {
      if (stat === 'vitalidade') sealMultiplier = 0.70;
      if (stat === 'ninjutsu' || stat === 'taijutsu') sealMultiplier = 1.40;
      if (stat === 'selo') sealMultiplier = 1.30;
    }
  }

  let doujutsuMultiplier = 1;
  const doujutsuProfile = userProfile.doujutsu;
  const isDoujutsuActive = doujutsuProfile?.isActive || false;

  if (isDoujutsuActive && doujutsuProfile) {
    const doujutsuInfo = doujutsuData[doujutsuProfile.type];
    if (doujutsuInfo) {
      const buffs = doujutsuInfo.stages[1]?.buffs as Record<string, number> | undefined;
      const statKeyMap: Record<string, string> = {
        'vitalidade': 'vitality',
        'inteligencia': 'intelligence',
        'taijutsu': 'taijutsu',
        'ninjutsu': 'ninjutsu',
        'genjutsu': 'genjutsu',
        'selo': 'selo',
      };
      const mappedStat = statKeyMap[stat];
      doujutsuMultiplier = buffs?.[mappedStat] || 1;
    }
  }

  let elementBonus = 0;
  const elementLevels = userProfile.element_levels || {};

  if (stat === 'taijutsu') elementBonus = (elementLevels['Futon'] || 0) * 2;
  if (stat === 'ninjutsu') elementBonus = (elementLevels['Katon'] || 0) * 2;
  if (stat === 'genjutsu') elementBonus = (elementLevels['Doton'] || 0) * 2;
  if (stat === 'selo') elementBonus = (elementLevels['Raiton'] || 0) * 2;
  if (stat === 'inteligencia') elementBonus = (elementLevels['Suiton'] || 0) * 2;

  // ✅ CALCULAR BÔNUS PREMIUM
  const boostBonuses = calculateBoostBonuses(activeBoosts);
  const premiumBoostBonus = boostBonuses[stat] || 0;

  // ✅ ADICIONAR BÔNUS PREMIUM AOS SOURCES
  const sources = [
    { name: 'Arma', value: weaponBuff },
    { name: 'Invocação', value: summonBuff },
    { name: 'Equipamento', value: equipmentBuff },
    { name: 'Boosts Premium', value: premiumBoostBonus },
    { name: 'Selo Amaldiçoado', value: (sealMultiplier - 1), isPercent: true },
    { name: 'Dōjutsu', value: (doujutsuMultiplier - 1), isPercent: true },
    { name: 'Elemento', value: elementBonus }
  ].filter(s => s.value !== 0);

  if (sources.length === 0) return null;

  return (
    <>
      {sources.map((source) => (
        <div key={source.name} className="flex justify-between gap-4">
          <span>{source.name}:</span> 
          <span className={cn(source.value > 0 ? "text-green-400" : "text-red-500")}>
            {source.value > 0 ? '+' : ''}
            {source.isPercent ? `${(source.value * 100).toFixed(0)}%` : Math.round(source.value)}
          </span>
        </div>
      ))}
    </>
  ) as React.ReactNode;
};

// 🆕 CALCULAR BÔNUS DOS BOOSTS PREMIUM
// 🆕 CALCULAR BÔNUS DOS BOOSTS PREMIUM (VERSÃO CORRIGIDA)
const calculateBoostBonuses = (activeBoosts: any[] | null) => {
  // ✅ VALORES PADRÃO GARANTIDOS
  const defaultBonuses = {
    vitalidade: 0,
    inteligencia: 0,
    taijutsu: 0,
    ninjutsu: 0,
    genjutsu: 0,
    selo: 0,
  };

  if (!activeBoosts || activeBoosts.length === 0) {
    return defaultBonuses;
  }

  const bonuses = { ...defaultBonuses };

  activeBoosts.forEach((boost) => {
    const boostData = boost?.item_data;
    if (boostData?.stat_bonuses && typeof boostData.stat_bonuses === 'object') {
      Object.entries(boostData.stat_bonuses).forEach(([stat, value]) => {
        if (stat in bonuses) {
          const numValue = Number(value);
          // ✅ GARANTIR QUE SEJA UM NÚMERO VÁLIDO
          if (!isNaN(numValue) && isFinite(numValue)) {
            bonuses[stat as keyof typeof bonuses] += numValue;
          }
        }
      });
    }
  });

  return bonuses;
};

// ✅ calculatedStats CORRIGIDO
const calculatedStats = useMemo(() => {
  if (!userProfile) return null;

  // 🆕 CALCULAR BÔNUS DOS BOOSTS COM VALIDAÇÃO
  const boostBonuses = calculateBoostBonuses(activeBoosts);

  // ✅ FUNÇÃO AUXILIAR PARA GARANTIR NÚMEROS VÁLIDOS
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  const profileWithUpdates = {
    ...userProfile,
    vitality: safeNumber(userProfile.vitality) + safeNumber(pendingUpdates.vitality) + safeNumber(boostBonuses.vitalidade),
    intelligence: safeNumber(userProfile.intelligence) + safeNumber(pendingUpdates.intelligence) + safeNumber(boostBonuses.inteligencia),
    taijutsu: safeNumber(userProfile.taijutsu) + safeNumber(pendingUpdates.taijutsu) + safeNumber(boostBonuses.taijutsu),
    ninjutsu: safeNumber(userProfile.ninjutsu) + safeNumber(pendingUpdates.ninjutsu) + safeNumber(boostBonuses.ninjutsu),
    genjutsu: safeNumber(userProfile.genjutsu) + safeNumber(pendingUpdates.genjutsu) + safeNumber(boostBonuses.genjutsu),
    selo: safeNumber(userProfile.selo) + safeNumber(pendingUpdates.selo) + safeNumber(boostBonuses.selo),
  };

  const stats = calculateFinalStats(profileWithUpdates);
    
  if (!stats) return null;

  return {
    ...stats,
    profileVitality: safeNumber(profileWithUpdates.vitality),
    profileIntelligence: safeNumber(profileWithUpdates.intelligence),
    profileTaijutsu: safeNumber(profileWithUpdates.taijutsu),
    profileNinjutsu: safeNumber(profileWithUpdates.ninjutsu),
    profileGenjutsu: safeNumber(profileWithUpdates.genjutsu),
    profileSelo: safeNumber(profileWithUpdates.selo),
  };
}, [userProfile, pendingUpdates, activeBoosts]);


// 🆕 Função para calcular bônus de XP e Ryo dos boosts premium
const getActiveBoostMultipliers = () => {
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
// 🆕 Função para calcular recompensas da missão ativa com bônus
const calculateMissionRewards = (missionDetails: any) => {
  if (!missionDetails || !activeBoosts) return null;
  
  const { xpMultiplier, ryoMultiplier } = getActiveBoostMultipliers();
  
  const baseRyo = missionDetails.ryoReward;
  const baseXP = missionDetails.experienceReward;
  
  const finalRyo = Math.floor(baseRyo * ryoMultiplier);
  const finalXP = Math.floor(baseXP * xpMultiplier);
  
  const bonusRyo = finalRyo - baseRyo;
  const bonusXP = finalXP - baseXP;
  
  return {
    baseRyo,
    baseXP,
    finalRyo,
    finalXP,
    bonusRyo,
    bonusXP,
    hasBonus: bonusRyo > 0 || bonusXP > 0
  };
};
const handleDeactivateSeal = (autoDeactivated = false) => {
    if (!userProfileRef || sealData?.level === 0 || !supabase) return;
    
     updateDocumentNonBlocking(userProfileRef, {
      cursed_seal: {
        ...userProfile?.cursed_seal,
        isActive: false,
        activationTime: null,
        cooldownUntil: Date.now() + SEAL_COOLDOWN,
      },
    }, supabase);
     
    if(autoDeactivated) {
        toast({
          title: 'Selo Desativado Automaticamente',
          description: 'A duração de 30 minutos acabou. O selo entrou em cooldown.',
        });
    } else {
        toast({
          title: 'Selo Amaldiçoado Desativado.',
          description: 'O poder sombrio recua. O selo entrou em cooldown.',
        });
    }
};

  useEffect(() => {
    if (!sealData) return;
    
    const interval = setInterval(() => {
        const now = Date.now();

        if (isSealCurrentlyActive && sealData.activationTime) {
            const elapsed = now - sealData.activationTime;
            const remaining = SEAL_DURATION - elapsed;
            if (remaining <= 0) {
                handleDeactivateSeal(true);
            } else {
                setSealTimeRemaining(remaining);
            }
        } else {
            setSealTimeRemaining(0);
        }

        if (sealData.cooldownUntil && now < sealData.cooldownUntil) {
            const remaining = sealData.cooldownUntil - now;
            setSealCooldownRemaining(remaining);
        } else {
            setSealCooldownRemaining(0);
        }

    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSealCurrentlyActive, sealData, userProfileRef]);

  // Timer para consumo de chakra do Dōjutsu
  useEffect(() => {
    if (!doujutsu || !userProfileRef || !supabase || !user) return;

    const interval = setInterval(async () => {
      const now = Date.now();

      // Gerenciar cooldown
      if (doujutsu.cooldownUntil && now < doujutsu.cooldownUntil) {
        const remaining = doujutsu.cooldownUntil - now;
        setDoujutsuCooldownRemaining(remaining);
      } else {
        setDoujutsuCooldownRemaining(0);
      }

      // Consumir chakra se ativo
      if (isDoujutsuActive && userProfile) {
        try {
          // Buscar chakra atual do banco
          const { data: currentData, error: fetchError } = await supabase
            .from('profiles')
            .select('current_chakra, doujutsu')
            .eq('id', user.id)
            .single();

          if (fetchError || !currentData) {
            console.error('Erro ao buscar chakra:', fetchError);
            return;
          }

          const currentChakra = currentData.current_chakra || 0;

          if (currentChakra <= 1) {
            // Auto-desativar se chakra acabou
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                doujutsu: {
                  ...currentData.doujutsu,
                  isActive: false,
                  cooldownUntil: Date.now() + (60 * 60 * 1000), // 1 hora
                },
                current_chakra: 0,
              })
              .eq('id', user.id);

            if (updateError) {
              console.error('Erro ao desativar Dōjutsu:', updateError);
              return;
            }

            toast({
              variant: 'destructive',
              title: 'Dōjutsu Desativado',
              description: 'Seu chakra se esgotou. Aguarde 1 hora para reativar.',
            });

            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            // Consumir 1 de chakra
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                current_chakra: currentChakra - 1,
              })
              .eq('id', user.id);

            if (updateError) {
              console.error('Erro ao consumir chakra:', updateError);
            }
          }
        } catch (error) {
          console.error('Erro no timer do Dōjutsu:', error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDoujutsuActive, doujutsu?.cooldownUntil, user?.id, supabase, toast]);
  useEffect(() => {
    if (!sealData) return;
    
    const interval = setInterval(() => {
        const now = Date.now();

        if (isSealCurrentlyActive && sealData.activationTime) {
            const elapsed = now - sealData.activationTime;
            const remaining = SEAL_DURATION - elapsed;
            if (remaining <= 0) {
                handleDeactivateSeal(true);
            } else {
                setSealTimeRemaining(remaining);
            }
        } else {
            setSealTimeRemaining(0);
        }

        if (sealData.cooldownUntil && now < sealData.cooldownUntil) {
            const remaining = sealData.cooldownUntil - now;
            setSealCooldownRemaining(remaining);
        } else {
            setSealCooldownRemaining(0);
        }

    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSealCurrentlyActive, sealData, userProfileRef]);

  // Timer para consumo de chakra do Dōjutsu
  useEffect(() => {
    if (!doujutsu || !userProfileRef || !supabase || !user) return;

    const interval = setInterval(async () => {
      const now = Date.now();

      // Gerenciar cooldown
      if (doujutsu.cooldownUntil && now < doujutsu.cooldownUntil) {
        const remaining = doujutsu.cooldownUntil - now;
        setDoujutsuCooldownRemaining(remaining);
      } else {
        setDoujutsuCooldownRemaining(0);
      }

      // Consumir chakra se ativo
      if (isDoujutsuActive && userProfile) {
        try {
          // Buscar chakra atual do banco
          const { data: currentData, error: fetchError } = await supabase
            .from('profiles')
            .select('current_chakra, doujutsu')
            .eq('id', user.id)
            .single();

          if (fetchError || !currentData) {
            console.error('Erro ao buscar chakra:', fetchError);
            return;
          }

          const currentChakra = currentData.current_chakra || 0;

          if (currentChakra <= 1) {
            // Auto-desativar se chakra acabou
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                doujutsu: {
                  ...currentData.doujutsu,
                  isActive: false,
                  cooldownUntil: Date.now() + (60 * 60 * 1000), // 1 hora
                },
                current_chakra: 0,
              })
              .eq('id', user.id);

            if (updateError) {
              console.error('Erro ao desativar Dōjutsu:', updateError);
              return;
            }

            toast({
              variant: 'destructive',
              title: 'Dōjutsu Desativado',
              description: 'Seu chakra se esgotou. Aguarde 1 hora para reativar.',
            });

            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            // Consumir 1 de chakra
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                current_chakra: currentChakra - 1,
              })
              .eq('id', user.id);

            if (updateError) {
              console.error('Erro ao consumir chakra:', updateError);
            }
          }
        } catch (error) {
          console.error('Erro no timer do Dōjutsu:', error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDoujutsuActive, doujutsu?.cooldownUntil, user?.id, supabase, toast]);
// Timer para regeneração automática de chakra (1 por minuto)
useEffect(() => {
  if (!userProfileRef || !supabase || !user || !userProfile || !calculatedStats) return;

  const interval = setInterval(async () => {
    try {
      const now = Date.now();
      const lastRegen = userProfile.last_chakra_regen || now;
      const timeSinceLastRegen = now - lastRegen;
      const timeUntilNextRegen = 60000 - (timeSinceLastRegen % 60000);
      
      // Atualizar contador visual (em segundos)
      setChakraRegenTimeRemaining(Math.ceil(timeUntilNextRegen / 1000));

      // Se passou 1 minuto ou mais desde a última regeneração
      if (timeSinceLastRegen >= 60000) {
        const currentChakra = userProfile.current_chakra ?? calculatedStats.maxChakra;
        const maxChakra = calculatedStats.maxChakra;

        if (currentChakra < maxChakra) {
          // Buscar dados atuais
          const { data: currentData, error: fetchError } = await supabase
            .from('profiles')
            .select('current_chakra, last_chakra_regen')
            .eq('id', user.id)
            .single();

          if (fetchError) return;
          if (!currentData) return;

          // Calcular quantos minutos se passaram
          const lastRegenTime = currentData.last_chakra_regen || now;
          const minutesPassed = Math.floor((now - lastRegenTime) / 60000);
          
          if (minutesPassed >= 1) {
            // Regenerar chakra
            const chakraToAdd = Math.min(minutesPassed, maxChakra - currentData.current_chakra);
            const newChakra = Math.min(maxChakra, currentData.current_chakra + chakraToAdd);

            await supabase
              .from('profiles')
              .update({ 
                current_chakra: newChakra,
                last_chakra_regen: now
              })
              .eq('id', user.id);
          }
        } else {
          // Chakra está cheio, apenas atualizar o timestamp
          await supabase
            .from('profiles')
            .update({ last_chakra_regen: now })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      // Silencioso - regeneração não é crítica
    }
  }, 1000);

  return () => clearInterval(interval);
}, [userProfileRef, supabase, user, userProfile?.current_chakra, userProfile?.last_chakra_regen, calculatedStats?.maxChakra]);


  useEffect(() => {
    return () => {
      setLocalActiveMission(null);
      setMissionJustCompleted(false);
    };
  }, []);

  useEffect(() => {
    if (!userProfile?.active_mission && missionJustCompleted) {
      const timer = setTimeout(() => {
        setMissionJustCompleted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userProfile?.active_mission, missionJustCompleted]);

  useEffect(() => {
    if (!activeHunt) {
      setHuntTimeRemaining(0);
      setHuntProgress(0);
      return;
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, activeHunt.endTime - now);
      setHuntTimeRemaining(remaining);
      
      const totalDuration = activeHunt.endTime - activeHunt.startTime;
      const elapsed = totalDuration - remaining;
      const currentProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 100;
      setHuntProgress(Math.min(100, currentProgress));
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    const initialRemaining = Math.max(0, activeHunt.endTime - Date.now());
    setHuntTimeRemaining(initialRemaining);

    return () => clearInterval(interval);
  }, [activeHunt]);

// 🆕 Estado para controlar o modal de relatório de batalha
const [showBattleReport, setShowBattleReport] = useState(false);
const [battleReport, setBattleReport] = useState<any>(null);
// 🆕 ESTADOS PARA MODAIS DE SELEÇÃO
const [showStatSelection, setShowStatSelection] = useState(false);
const [showElementSelection, setShowElementSelection] = useState(false);
const [showJutsuSelection, setShowJutsuSelection] = useState(false);
const [currentItem, setCurrentItem] = useState<any>(null);

// 🆕 Verificar relatório de batalha pendente ao carregar
useEffect(() => {
  if (!userProfile || !supabase || !user || !calculatedStats) return;

  const checkPendingBattleReport = async () => {
    if (userProfile.pending_battle_report) {
      const report = userProfile.pending_battle_report;
      console.log('📋 Relatório de Batalha:', report);
      
      setBattleReport(report);
      setShowBattleReport(true);
    }
  };

  checkPendingBattleReport();
}, [userProfile, supabase, user, calculatedStats]);

// 🆕 Função para fechar o relatório e recuperar o jogador
const handleCloseBattleReport = async () => {
  if (!supabase || !user || !calculatedStats) return;
  
  setShowBattleReport(false);
  
  await supabase
    .from('profiles')
    .update({
      current_health: calculatedStats.maxHealth,
      is_recovering: false,
      pending_battle_report: null,
    })
    .eq('id', user.id);

  toast({
    title: 'Recuperação Completa!',
    description: 'Sua vida foi restaurada. Você está pronto para novas batalhas!',
  });

  setTimeout(() => {
    window.location.reload();
  }, 1500);
};
  
  const handleIncrement = async (stat: 'vitality' | 'intelligence' | 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'selo') => {
    if (!userProfile || !userProfileRef || !supabase || isUpdating) return;
    
    const availablePoints = userProfile.stat_points - (pendingUpdates.stat_points_used || 0);
    if (availablePoints <= 0) {
      toast({
        variant: "destructive",
        title: "Sem pontos disponíveis",
        description: "Você não tem pontos de atributo para distribuir.",
      });
      return;
    }
    
    setIsUpdating(true);
    
    setPendingUpdates(prev => ({
      ...prev,
      [stat]: (prev[stat] || 0) + 1,
      stat_points_used: (prev.stat_points_used || 0) + 1,
    }));
    
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select(`${stat}, stat_points`)
        .eq('id', userProfileRef.id)
        .single();
      
      if (fetchError || !currentData) {
        throw new Error('Erro ao buscar dados atuais');
      }
      
      if (currentData.stat_points <= 0) {
        setPendingUpdates(prev => {
          const newState = { ...prev };
          newState[stat] = Math.max(0, (newState[stat] || 0) - 1);
          newState.stat_points_used = Math.max(0, (newState.stat_points_used || 0) - 1);
          return newState;
        });
        
        toast({
          variant: "destructive",
          title: "Sem pontos disponíveis",
          description: "Você não tem pontos de atributo para distribuir.",
        });
        setIsUpdating(false);
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          [stat]: (currentData[stat] || 0) + 1,
          stat_points: currentData.stat_points - 1,
        })
        .eq('id', userProfileRef.id);
  
      if (error) throw error;
  
      await new Promise(resolve => setTimeout(resolve, 300));
  
  
    } catch (error: any) {
      setPendingUpdates(prev => {
        const newState = { ...prev };
        newState[stat] = Math.max(0, (newState[stat] || 0) - 1);
        newState.stat_points_used = Math.max(0, (newState.stat_points_used || 0) - 1);
        return newState;
      });
      
      console.error('Erro ao distribuir ponto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao distribuir ponto",
        description: error?.message || "Tente novamente",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDoujutsu = () => {
    if (!userProfileRef || !doujutsu || !supabase) return;
    
    const newStatus = !doujutsu.isActive;
    const currentChakra = userProfile?.current_chakra || 0;
    
    // Verificar cooldown ao tentar ativar
    if (newStatus && doujutsuCooldownRemaining > 0) {
      const minutesRemaining = Math.ceil(doujutsuCooldownRemaining / (60 * 1000));
      toast({
        variant: 'destructive',
        title: 'Cooldown Ativo',
        description: `Aguarde ${minutesRemaining} minutos para reativar o Dōjutsu.`,
      });
      return;
    }
    
    // Verificar chakra ao tentar ativar
    if (newStatus && currentChakra < 10) {
      toast({
        variant: 'destructive',
        title: 'Chakra Insuficiente',
        description: 'Você precisa de pelo menos 10 de chakra para ativar o Dōjutsu.',
      });
      return;
    }
    
    const updateData: any = {
      doujutsu: {
        ...userProfile?.doujutsu,
        isActive: newStatus,
      },
    };
    
    // Se está desativando, adiciona cooldown de 1 hora
    if (!newStatus) {
      updateData.doujutsu.cooldownUntil = Date.now() + (60 * 60 * 1000);
    }
    
    updateDocumentNonBlocking(userProfileRef, updateData, supabase);
    
    toast({
      title: `Dōjutsu ${newStatus ? 'Ativado' : 'Desativado'}`,
      description: newStatus 
        ? 'O poder dos seus olhos flui. Chakra será consumido a cada segundo.' 
        : 'O poder recua. Aguarde 1 hora para reativar.',
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  

  const handleActivateSeal = () => {
    if (!userProfileRef || sealData?.level === 0 || sealCooldownRemaining > 0 || !supabase) return;
    
    // Se está ativo, desativa
    if (isSealCurrentlyActive) {
      updateDocumentNonBlocking(userProfileRef, {
        cursed_seal: {
          ...userProfile?.cursed_seal,
          isActive: false,
          activationTime: null,
          cooldownUntil: Date.now() + SEAL_COOLDOWN,
        },
      }, supabase);
      
      toast({
        title: 'Selo Amaldiçoado Desativado',
        description: 'O poder sombrio recua. O selo entrou em cooldown.',
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } else {
      // Se está inativo, ativa
      updateDocumentNonBlocking(userProfileRef, {
        cursed_seal: {
          ...userProfile?.cursed_seal,
          isActive: true,
          activationTime: Date.now(),
        },
      }, supabase);
      
      toast({
        title: 'Selo Amaldiçoado Ativado!',
        description: 'Você sente o poder sombrio fluindo...',
        variant: 'destructive'
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
};

  const handleCompleteMission = async () => {
    if (!userProfile || !activeMissionDetails || !userProfileRef || !supabase) return;
    
    try {
        const updatePayload: any = {
            active_mission: null,
            ryo: (userProfile.ryo || 0) + activeMissionDetails.ryoReward,
            experience: (userProfile.experience || 0) + activeMissionDetails.experienceReward,
        };

        const newExperience = (userProfile.experience || 0) + activeMissionDetails.experienceReward;
        const { level: newLevel } = getLevelFromXp(newExperience);
        
        if(newLevel > userProfile.level) {
            const newMaxExperience = getXpForLevel(newLevel + 1);
            const levelsGained = newLevel - userProfile.level;
            const newStatPoints = (userProfile.stat_points || 0) + (levelsGained * 5);
            
            // Atualiza o rank baseado no novo nível
            const newRank = calculateRank(newLevel);
            
            updatePayload.level = newLevel;
            updatePayload.max_experience = newMaxExperience;
            updatePayload.stat_points = newStatPoints;
            updatePayload.rank = newRank;
        }

        const completedIds = [...(userProfile.daily_mission_state?.completedMissionIds || []), activeMissionDetails.id];
        updatePayload.daily_mission_state = {
            ...userProfile.daily_mission_state,
            completedMissionIds: completedIds,
        };

        setMissionJustCompleted(true);
        setLocalActiveMission(null);

        const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', userProfileRef.id);

        if (error) {
            setMissionJustCompleted(false);
            if (activeMission) {
                setLocalActiveMission(activeMission as any);
            }
            throw error;
        }

        toast({
            title: "Missão Concluída!",
            description: `Você completou "${activeMissionDetails.name}" e recebeu suas recompensas.`,
        });

        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error: any) {
        console.error("Error completing mission:", error);
        toast({ 
            variant: "destructive", 
            title: "Erro ao completar missão",
            description: error?.message || "Tente novamente"
        });
    }
};

const handleCompleteHunt = async () => {
  if (!userProfileRef || !userProfile || !activeHunt || !supabase) return;
  
  const ryoReward = (activeHunt.duration / 60) * 20;
  const xpReward = (activeHunt.duration / 60) * 30;

  try {
    const updatePayload: any = {
      active_hunt: null,
      ryo: (userProfile.ryo || 0) + ryoReward,
      experience: (userProfile.experience || 0) + xpReward,
    };

    const newExperience = (userProfile.experience || 0) + xpReward;
    const { level: newLevel } = getLevelFromXp(newExperience);
    
    if(newLevel > userProfile.level) {
        const newMaxExperience = getXpForLevel(newLevel + 1);
        const levelsGained = newLevel - userProfile.level;
        const newStatPoints = (userProfile.stat_points || 0) + (levelsGained * 5);
        
        // Atualiza o rank baseado no novo nível
        const newRank = calculateRank(newLevel);
        
        updatePayload.level = newLevel;
        updatePayload.max_experience = newMaxExperience;
        updatePayload.stat_points = newStatPoints;
        updatePayload.rank = newRank;
    }

    await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userProfileRef.id);

    toast({ title: 'Caçada Concluída!', description: `Você obteve ${ryoReward.toFixed(0)} Ryo e ${xpReward.toFixed(0)} XP!` });
    
    // ✅ ADICIONAR RELOAD APÓS 1.5 SEGUNDOS
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error("Error completing hunt:", error);
    toast({ variant: 'destructive', title: 'Erro ao completar a caçada' });
  }
};

  const handleUseItem = (item: IchirakuItem) => {
    if (!userProfile || !userProfileRef || !calculatedStats) return;

    const currentQuantity = userProfile.inventory?.[item.id] || 0;
    if (currentQuantity <= 0) return;

    const newHealth = Math.min(calculatedStats.maxHealth, (userProfile.current_health || 0) + (item.healthRecovery || 0));
    const newChakra = userProfile.current_chakra || 0;

    if (!supabase) return;

    updateDocumentNonBlocking(userProfileRef, {
        inventory: {
            ...userProfile.inventory,
            [item.id]: Math.max(0, currentQuantity - 1),
        },
        current_health: newHealth,
        current_chakra: newChakra,
    }, supabase);

    toast({
        title: "Item Usado!",
        description: `Você usou ${item.name}.`,
    });

    setTimeout(() => {
        window.location.reload();
    }, 1500);
};

const handleUsePremiumItem = async (item: any, premiumItem?: any) => {
  if (!userProfileRef || !supabase || !userProfile || !calculatedStats) return;
  
  try {
    let updateData: any = {};
    
    // ✅ BUSCAR DADOS CORRETOS DO ITEM
    const itemData = premiumItem?.item_data || item.item_data || {};
    const itemName = premiumItem?.name || item.item_data?.name || 'Item';
    
    if (item.item_type === 'chakra_potion') {
      const restoreAmount = itemData.restore_amount 
        ? itemData.restore_amount 
        : Math.floor((calculatedStats.maxChakra * (itemData.restore_percentage || 100)) / 100);
      
      const newChakra = Math.min(calculatedStats.maxChakra, currentChakra + restoreAmount);
      updateData.current_chakra = newChakra;
      
      toast({
        title: `🧪 ${itemName} Usado!`,
        description: `Você restaurou ${restoreAmount} de chakra!`,
      });
    } else if (item.item_type === 'health_potion') {
      const restoreAmount = itemData.restore_amount 
        ? itemData.restore_amount 
        : Math.floor((calculatedStats.maxHealth * (itemData.restore_percentage || 100)) / 100);
      
      const newHealth = Math.min(calculatedStats.maxHealth, currentHealth + restoreAmount);
      updateData.current_health = newHealth;
      
      toast({
        title: `🧪 ${itemName} Usado!`,
        description: `Você restaurou ${restoreAmount} de vida!`,
      });
    }
    
    // Atualizar profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    // 🆕 DECREMENTAR QUANTIDADE OU DELETAR ITEM
    if (item.quantity > 1) {
      await supabase
        .from('user_premium_inventory')
        .update({ quantity: item.quantity - 1 })
        .eq('id', item.id);
    } else {
      await supabase
        .from('user_premium_inventory')
        .delete()
        .eq('id', item.id);
    }
    
    setTimeout(() => window.location.reload(), 1500);
  } catch (error: any) {
    console.error('Erro ao usar item:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao usar item',
      description: error.message,
    });
  }
};

// ✅ LOCALIZAÇÃO: Junto com as outras funções de handler

const handleUseBossItem = async (item: any) => {
  if (!userProfile || !userProfileRef || !supabase || !calculatedStats || !user) return;

  const currentQuantity = userProfile.boss_inventory?.[item.id] || 0;
  if (currentQuantity <= 0) return;

  try {
    const updateData: any = {
      boss_inventory: {
        ...userProfile.boss_inventory,
        [item.id]: Math.max(0, currentQuantity - 1),
      },
    };

    // ✅ PROCESSAR EFEITOS DO ITEM
    switch (item.effect) {
      // 🆕 BOOST DE XP POR 24H
      case 'xp_boost_24h': {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await supabase
          .from('active_boss_buffs')
          .insert({
            user_id: user.id,
            buff_type: 'xp_boost',
            buff_value: item.percent,
            expires_at: expiresAt.toISOString(),
          });
        
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `+${item.percent}% XP por 24 horas!`,
        });
        break;
      }

      // 🆕 BOOST DE RYO POR 24H
      case 'ryo_boost_24h': {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await supabase
          .from('active_boss_buffs')
          .insert({
            user_id: user.id,
            buff_type: 'ryo_boost',
            buff_value: item.percent,
            expires_at: expiresAt.toISOString(),
          });
        
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `+${item.percent}% Ryo por 24 horas!`,
        });
        break;
      }

      // ✅ CORRIGIDO: XP_MULTIPLIER AGORA VERIFICA LEVEL-UP
      case 'xp_multiplier': {
        const xpGain = userProfile.level * item.multiplier;
        const newExperience = (userProfile.experience || 0) + xpGain;
        
        updateData.experience = newExperience;
        
        // ✅ VERIFICAR SE SUBIU DE NÍVEL
        const { level: newLevel } = getLevelFromXp(newExperience);
        
        if (newLevel > userProfile.level) {
          const newMaxExperience = getXpForLevel(newLevel + 1);
          const levelsGained = newLevel - userProfile.level;
          const newStatPoints = (userProfile.stat_points || 0) + (levelsGained * 5);
          const newRank = calculateRank(newLevel);
          
          updateData.level = newLevel;
          updateData.max_experience = newMaxExperience;
          updateData.stat_points = newStatPoints;
          updateData.rank = newRank;
          
          toast({
            title: `${item.icon} ${item.name} Usado!`,
            description: `Você ganhou ${xpGain} XP e subiu para o nível ${newLevel}! (+${levelsGained * 5} pontos de atributo)`,
            duration: 5000,
          });
        } else {
          toast({
            title: `${item.icon} ${item.name} Usado!`,
            description: `Você ganhou ${xpGain} XP!`,
          });
        }
        break;
      }

      case 'ryo': {
        updateData.ryo = (userProfile.ryo || 0) + item.amount;
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `Você ganhou ${item.amount} Ryo!`,
        });
        break;
      }

      case 'heal_percent': {
        const healAmount = Math.floor((calculatedStats.maxHealth * item.percent) / 100);
        updateData.current_health = Math.min(
          calculatedStats.maxHealth,
          (userProfile.current_health || 0) + healAmount
        );
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `Você restaurou ${healAmount} de vida!`,
        });
        break;
      }

      case 'chakra_percent': {
        const chakraAmount = Math.floor((calculatedStats.maxChakra * item.percent) / 100);
        updateData.current_chakra = Math.min(
          calculatedStats.maxChakra,
          (userProfile.current_chakra || 0) + chakraAmount
        );
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `Você restaurou ${chakraAmount} de chakra!`,
        });
        break;
      }

      case 'stat_points': {
        updateData.stat_points = (userProfile.stat_points || 0) + item.amount;
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `Você ganhou ${item.amount} pontos de atributo!`,
        });
        break;
      }

      case 'full_restore_buff': {
        updateData.current_health = calculatedStats.maxHealth;
        updateData.current_chakra = calculatedStats.maxChakra;
        
        const expiresAt = new Date(Date.now() + item.buffDuration);
        
        await supabase.from('active_boss_buffs').insert([
          {
            user_id: user.id,
            buff_type: 'xp_boost',
            buff_value: item.buffPercent,
            expires_at: expiresAt.toISOString(),
          },
          {
            user_id: user.id,
            buff_type: 'ryo_boost',
            buff_value: item.buffPercent,
            expires_at: expiresAt.toISOString(),
          }
        ]);
        
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `Vida e Chakra restaurados! +${item.buffPercent}% XP e Ryo por 1 hora!`,
        });
        break;
      }

      case 'triple_stat_points':
      case 'dual_stat_points': {
        setCurrentItem(item);
        setShowStatSelection(true);
        return;
      }

      case 'element_xp':
      case 'dual_element_xp': {
        setCurrentItem(item);
        setShowElementSelection(true);
        return;
      }

      case 'jutsu_xp': {
        setCurrentItem(item);
        setShowJutsuSelection(true);
        return;
      }

      case 'element_and_jutsu_xp': {
        setCurrentItem(item);
        setShowElementSelection(true);
        return;
      }

      case 'all_stats': {
        updateData.vitality = (userProfile.vitality || 0) + item.amount;
        updateData.intelligence = (userProfile.intelligence || 0) + item.amount;
        updateData.taijutsu = (userProfile.taijutsu || 0) + item.amount;
        updateData.ninjutsu = (userProfile.ninjutsu || 0) + item.amount;
        updateData.genjutsu = (userProfile.genjutsu || 0) + item.amount;
        updateData.selo = (userProfile.selo || 0) + item.amount;
        toast({
          title: `${item.icon} ${item.name} Usado!`,
          description: `+${item.amount} em TODOS os atributos!`,
        });
        break;
      }

      default:
        console.warn('Efeito não implementado:', item.effect);
        toast({
          variant: 'destructive',
          title: 'Item não implementado',
          description: 'Este item ainda não está funcional.',
        });
        return;
    }

    // ✅ ATUALIZAR INVENTÁRIO (SEMPRE)
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      toast({
        variant: 'destructive',
        title: 'Erro ao usar item',
        description: updateError.message,
      });
      return;
    }

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error: any) {
    console.error('Erro ao usar item:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao usar item',
      description: error.message,
    });
  }
};


// 🆕 FUNÇÕES DE CONFIRMAÇÃO DOS MODAIS
const handleStatSelection = async (selectedStats: string[]) => {
  if (!currentItem || !userProfile || !supabase || !user) return;

  const updateData: any = {
    boss_inventory: {
      ...userProfile.boss_inventory,
      [currentItem.id]: Math.max(0, (userProfile.boss_inventory?.[currentItem.id] || 0) - 1),
    },
  };

  selectedStats.forEach(stat => {
    const statMap: Record<string, string> = {
      'Vitalidade': 'vitality',
      'Inteligência': 'intelligence',
      'Taijutsu': 'taijutsu',
      'Ninjutsu': 'ninjutsu',
      'Genjutsu': 'genjutsu',
      'Selo': 'selo',
    };
    
    const dbStat = statMap[stat];
    updateData[dbStat] = (userProfile[dbStat] || 0) + currentItem.amount;
  });

  await supabase.from('profiles').update(updateData).eq('id', user.id);

  toast({
    title: `${currentItem.icon} ${currentItem.name} Usado!`,
    description: `+${currentItem.amount} em ${selectedStats.join(', ')}!`,
  });

  setTimeout(() => window.location.reload(), 1500);
};

const handleElementSelection = async (selectedElements: string[]) => {
  if (!currentItem || !userProfile || !supabase || !user) return;

  const updateData: any = {
    boss_inventory: {
      ...userProfile.boss_inventory,
      [currentItem.id]: Math.max(0, (userProfile.boss_inventory?.[currentItem.id] || 0) - 1),
    },
    element_experience: { ...(userProfile.element_experience || {}) },
    element_levels: { ...(userProfile.element_levels || {}) }
  };

  // ✅ RECALCULAR NÍVEIS DOS ELEMENTOS
  selectedElements.forEach(element => {
    const currentXp = (userProfile.element_experience?.[element] || 0);
    const newXp = currentXp + currentItem.amount;
    
    updateData.element_experience[element] = newXp;
    
    // ✅ CALCULAR NOVO NÍVEL (usando a função do missions/page.tsx)
    const getLevelFromXp = (xp: number, maxLevel = 10) => {
      let level = 0;
      let requiredXp = 0;
      const baseCost = 100;
      const factor = 1.5;
      
      while (level < maxLevel) {
        requiredXp += Math.floor(baseCost * Math.pow(factor, level));
        if (xp >= requiredXp) {
          level++;
        } else {
          break;
        }
      }
      return level;
    };
    
    const newLevel = getLevelFromXp(newXp);
    updateData.element_levels[element] = newLevel;
  });

  await supabase.from('profiles').update(updateData).eq('id', user.id);

  toast({
    title: `${currentItem.icon} ${currentItem.name} Usado!`,
    description: `+${currentItem.amount} XP em ${selectedElements.join(', ')}!`,
  });

  // ✅ Se for "element_and_jutsu_xp", abrir modal de jutsu
  if (currentItem.effect === 'element_and_jutsu_xp') {
    // ✅ RESETAR MODAL DE ELEMENTO ANTES DE ABRIR O DE JUTSU
    setShowElementSelection(false);
    
    // ✅ AGUARDAR 500MS ANTES DE ABRIR O MODAL DE JUTSU
    setTimeout(() => {
      setShowJutsuSelection(true);
    }, 500);
  } else {
    setTimeout(() => window.location.reload(), 1500);
  }
};

const handleJutsuSelection = async (selectedJutsus: string[]) => {
  if (!currentItem || !userProfile || !supabase || !user) return;

  const updateData: any = {
    boss_inventory: {
      ...userProfile.boss_inventory,
      [currentItem.id]: Math.max(0, (userProfile.boss_inventory?.[currentItem.id] || 0) - 1),
    },
    jutsu_experience: { ...(userProfile.jutsu_experience || {}) },
    jutsus: { ...(userProfile.jutsus || {}) }
  };

  // ✅ RECALCULAR NÍVEIS DOS JUTSUS
  selectedJutsus.forEach(jutsu => {
    const currentXp = (userProfile.jutsu_experience?.[jutsu] || 0);
    const newXp = currentXp + currentItem.amount;
    
    updateData.jutsu_experience[jutsu] = newXp;
    
    // ✅ CALCULAR NOVO NÍVEL (usando a função do elements/page.tsx)
    const getLevelFromXp = (xp: number, maxLevel = 25) => {
      let level = 0;
      let requiredXp = 0;
      const baseCost = 120;
      const factor = 1.4;
      
      while (level < maxLevel) {
        requiredXp += Math.floor(baseCost * Math.pow(factor, level));
        if (xp >= requiredXp) {
          level++;
        } else {
          break;
        }
      }
      return level;
    };
    
    const currentLevel = userProfile.jutsus?.[jutsu] || 1;
    const newLevel = Math.max(currentLevel, getLevelFromXp(newXp));
    
    updateData.jutsus[jutsu] = newLevel;
  });

  await supabase.from('profiles').update(updateData).eq('id', user.id);

  toast({
    title: `${currentItem.icon} ${currentItem.name} Usado!`,
    description: `+${currentItem.amount} XP em ${selectedJutsus.join(', ')}!`,
  });

  setTimeout(() => window.location.reload(), 1500);
};

// 🆕 Modal de Relatório de Batalha
const BattleReportModal = () => {
  if (!showBattleReport || !battleReport) return null;

  const isVictory = battleReport.winner === user?.id;
  const opponent = battleReport.opponent_name || 'Ninja Desconhecido';
  const opponentLevel = battleReport.opponent_level || '?';
  const rounds = battleReport.rounds || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2">
        <CardHeader className={cn(
          "border-b-2",
          isVictory ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500"
        )}>
          <CardTitle className="text-center text-2xl flex items-center justify-center gap-3">
            {isVictory ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-500" />
                Você Venceu!
              </>
            ) : (
              <>
                <X className="h-8 w-8 text-red-500" />
                Você Foi Derrotado!
              </>
            )}
          </CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            ⚔️ Batalha contra {opponent} (Nv. {opponentLevel})
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Informações da Batalha */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Você</h4>
              <p className="text-lg font-bold">{userProfile?.name}</p>
              <p className="text-sm">Nível {userProfile?.level}</p>
            </div>
            <div className="space-y-2 text-right">
              <h4 className="font-semibold text-sm text-muted-foreground">Oponente</h4>
              <p className="text-lg font-bold">{opponent}</p>
              <p className="text-sm">Nível {opponentLevel}</p>
            </div>
          </div>

          {/* Rounds da Batalha */}
          {rounds.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-center">📜 Rounds da Batalha</h4>
              {rounds.map((round: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">Round {index + 1}</span>
                    <span className={cn(
                      "text-xs font-bold",
                      round.winner === user?.id ? "text-green-500" : "text-red-500"
                    )}>
                      {round.winner === user?.id ? "Vitória" : "Derrota"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Seu Ataque:</p>
                      <p className="font-bold">{round.player_damage || 0} de dano</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Ataque Inimigo:</p>
                      <p className="font-bold">{round.opponent_damage || 0} de dano</p>
                    </div>
                  </div>

                  {round.player_jutsu && (
                    <p className="text-xs text-blue-400 mt-1">
                      🔥 Você usou: {round.player_jutsu}
                    </p>
                  )}
                  {round.opponent_jutsu && (
                    <p className="text-xs text-orange-400 mt-1">
                      ⚡ Oponente usou: {round.opponent_jutsu}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recompensas ou Perdas */}
          <div className={cn(
            "p-4 rounded-lg border-2",
            isVictory ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"
          )}>
            <h4 className="font-semibold text-center mb-3">
              {isVictory ? "🎉 Recompensas" : "💀 Consequências"}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              {battleReport.ryo_gained && (
                <div>
                  <p className="text-sm text-muted-foreground">Ryo</p>
                  <p className={cn(
                    "text-xl font-bold",
                    isVictory ? "text-green-500" : "text-red-500"
                  )}>
                    {isVictory ? '+' : '-'}{battleReport.ryo_gained}
                  </p>
                </div>
              )}
              {battleReport.xp_gained && (
                <div>
                  <p className="text-sm text-muted-foreground">XP</p>
                  <p className={cn(
                    "text-xl font-bold",
                    isVictory ? "text-green-500" : "text-red-500"
                  )}>
                    {isVictory ? '+' : '-'}{battleReport.xp_gained}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleCloseBattleReport}
          >
            Fechar e Recuperar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

  if (isLoading || !calculatedStats) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
             <PageHeader
                title="Carregando..."
                description="Buscando os dados do seu personagem."
            />
            <Loader2 className="h-8 w-8 animate-spin mt-4" />
        </div>
    );
  }


  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader
          title="Nenhum Personagem Encontrado"
          description="Você ainda não criou seu personagem."
        />
        <Button asChild className="mt-6">
          <Link href="/create-character">
            <UserPlus className="mr-2 h-4 w-4" />
            Criar Personagem
          </Link>
        </Button>
      </div>
    );
  }
  
  const villageImage = userProfile.village ? villageImages[userProfile.village] : null;

  const unlockedElements = allElements.filter(
    (elementName) => (userProfile.element_levels?.[elementName] || 0) > 0
  );

  const learnedJutsus = Object.entries(userProfile.jutsus || {})
  .filter(([_, level]) => (level as number) > 0)
    .sort(([jutsuNameA], [jutsuNameB]) => jutsuNameA.localeCompare(jutsuNameB));
    
  const inventoryItems = Object.entries(userProfile.inventory || {})
    .map(([id, quantity]) => {
        const itemData = ichirakuMenu.find(item => item.id === id);
        return itemData ? { ...itemData, quantity } : null;
    })
    .filter((item): item is IchirakuItem & { quantity: number } => item !== null && Number(item.quantity) > 0);

  const currentHealth = Math.min(userProfile.current_health ?? calculatedStats.maxHealth, calculatedStats.maxHealth);
  const currentChakra = userProfile.current_chakra ?? calculatedStats.maxChakra;
  
  const xpForCurrentLevel = getXpForLevel(userProfile.level);
  const xpForNextLevel = userProfile.max_experience;
  const currentXpProgress = userProfile.experience - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeededForNextLevel > 0 ? (currentXpProgress / xpNeededForNextLevel) * 100 : 100;
  
  const sealLevel = userProfile.cursed_seal?.level || 0;
  const canActivateSeal = !isSealCurrentlyActive && sealCooldownRemaining <= 0;
  
  const equippedWeapon = weaponsData.find(w => w.id === userProfile.weapon_id);
  const equippedSummon = summonsData.find(s => s.id === userProfile.summon_id);

  const equippedChest = equipmentsData.find(e => e.id === userProfile.chest_id);
  const equippedLegs = equipmentsData.find(e => e.id === userProfile.legs_id);
  const equippedFeet = equipmentsData.find(e => e.id === userProfile.feet_id);
  const equippedHands = equipmentsData.find(e => e.id === userProfile.hands_id);
  
  const equipmentIcons = {
    Peito: Layers ,
    Pernas: Layers ,
    Pés: Layers ,
    Mãos: Layers ,
  };

  return (
    <div>
      <PageHeader
  title="Status"
  description="Veja e aprimore os atributos do seu personagem."
/>

{/* 🆕 INDICADOR DE PREMIUM PASS + BOOSTS ATIVOS */}
{(hasPremiumPass || (activeBoosts && activeBoosts.length > 0)) && (
  <div className="mt-4 mx-auto max-w-4xl">
    <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
      <Crown className="h-5 w-5 text-yellow-500 animate-pulse" />
      <span className="text-sm font-semibold text-yellow-500">
        {hasPremiumPass && 'Premium Pass Ativo'}
        {hasPremiumPass && activeBoosts && activeBoosts.length > 0 && ' + '}
        {activeBoosts && activeBoosts.length > 0 && `${activeBoosts.length} Boost${activeBoosts.length > 1 ? 's' : ''}`}
      </span>
    </div>
  </div>
)}

{ (activeMission || activeHunt) && (
  <Card className="mx-auto max-w-4xl mt-8">
    <CardHeader>
      <CardTitle>Atividade Atual</CardTitle>
    </CardHeader>
    <CardContent>
      {activeMission && activeMissionDetails && (() => {
        // 🆕 Calcular recompensas com bônus
        const { xpMultiplier, ryoMultiplier } = getActiveBoostMultipliers();
        
        const baseRyo = activeMissionDetails.ryoReward;
        const baseXP = activeMissionDetails.experienceReward;
        
        const finalRyo = Math.floor(baseRyo * ryoMultiplier);
        const finalXP = Math.floor(baseXP * xpMultiplier);
        
        const bonusRyo = finalRyo - baseRyo;
        const bonusXP = finalXP - baseXP;
        const hasBonus = bonusRyo > 0 || bonusXP > 0;
        
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{activeMissionDetails.name}</h3>
            <div className='space-y-2'>
              <div className="flex justify-between items-baseline">
                <p className="font-semibold">Progresso da Missão</p>
                <p className="text-sm text-muted-foreground">{formatDuration(missionTimeRemaining / 1000)}</p>
              </div>
              <Progress value={missionProgress} />
            </div>
            
            {/* 🆕 SEÇÃO DE RECOMPENSAS */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Recompensas ao Completar
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Ryo:</span>
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
                    <Star className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">XP:</span>
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
              
              {hasBonus && (
                <div className="flex items-center gap-2 text-xs text-yellow-500 pt-2 border-t">
                  <Sparkles className="h-3 w-3" />
                  <span>Bônus Premium Aplicado!</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {activeHunt && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Caçando...</h3>
          <div className='space-y-2'>
            <div className="flex justify-between items-baseline">
              <p className="font-semibold">Progresso da Caçada</p>
              <p className="text-sm text-muted-foreground">{formatDuration(huntTimeRemaining / 1000)}</p>
            </div>
            <Progress value={huntProgress} />
          </div>
        </div>
      )}
    </CardContent>
    <CardFooter>
  {!isLoading && isMissionComplete && (
    <Button className="w-full" asChild>
      <Link href="/missions">
        <CheckCircle className="mr-2 h-4 w-4" />
        Ir para Missões
      </Link>
    </Button>
  )}
  {isHuntComplete && (
    <Button className="w-full" onClick={handleCompleteHunt}>
      <CheckCircle className="mr-2 h-4 w-4" />
      Concluir Caçada
    </Button>
  )}
</CardFooter>
  </Card>
)}

      <div className="mt-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-28 w-28 rounded-md border-2 border-primary shadow-lg">
                <AvatarImage
                  src={userProfile.avatar_url}
                  alt={userProfile.name}
                />
                <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <CardTitle className="font-headline text-3xl">
                    {userProfile.name}
                  </CardTitle>
                  {villageImage && (
  <Image 
    src={villageImage.imageUrl} 
    alt={villageImage.description}
    width={30}
    height={30}
    className="object-contain"
  />
)}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
  <CardDescription className="text-md">
    Nível {userProfile.level} - {userProfile.village}
  </CardDescription>
  
  {/* Badge do Rank Base (sempre aparece) */}
  {!isRankLoading && playerRank && (
    <Badge 
      variant="secondary"
      className="text-sm font-semibold"
    >
      {playerRank}
    </Badge>
  )}
  
  {/* Badge de Kage (só aparece se for Kage) */}
  {!isRankLoading && isKage && (
    <Badge 
      variant="default"
      className="text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    >
      <Crown className="h-3 w-3 mr-1" />
      Kage
    </Badge>
  )}
</div>
      <div className="mt-4">
        <ProgressBarStat
          label="Experiência"
          value={userProfile.experience}
          max={userProfile.max_experience}
        />
      </div>
      
      {/* 🆕 MOEDA E CLASH POINTS */}
      <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-500">
            {userProfile.ryo?.toLocaleString() || 0} Ryo
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-500">
            {userProfile.clash_points?.toLocaleString() || 0} CP
          </span>
        </div>
      </div>
    </div>
  </div>
</CardHeader>
          <CardContent className="p-6">
             <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                 <p className="text-lg">
                    Pontos de Atributo:{' '}
                    <span className="text-xl font-bold text-primary">
  {userProfile.stat_points - (pendingUpdates.stat_points_used || 0)}
</span>
                </p>
                {(isDoujutsuActive || isSealCurrentlyActive) && (
                    <div className="text-sm font-semibold text-destructive flex items-center justify-center">
                        <p>Desative os poderes especiais para distribuir pontos.</p>
                    </div>
                )}
            </div>
            
            <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
  <div className="w-full space-y-1">
    <div className="mb-1 flex items-baseline justify-between text-sm">
      <span className="font-medium text-red-400">Vida</span>
      <span className="text-xs text-red-400">
        {Math.round(currentHealth)} / {Math.round(calculatedStats.maxHealth)}
      </span>
    </div>
    <div className="w-full bg-gray-900/80 rounded-full h-3 overflow-hidden border border-red-900/30">
      <div 
        className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-red-500"
        style={{
          width: `${(currentHealth / calculatedStats.maxHealth) * 100}%`,
          boxShadow: '0 0 10px rgba(220, 38, 38, 0.8), 0 0 20px rgba(249, 115, 22, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
      />
    </div>
  </div>

  <div className="w-full space-y-1">
    <div className="mb-1 flex items-baseline justify-between text-sm">
      <span className="font-medium text-blue-400">Chakra</span>
      <span className="text-xs text-blue-400">
        {Math.round(currentChakra)} / {Math.round(calculatedStats.maxChakra)}
      </span>
    </div>
    <div className="w-full bg-gray-900/80 rounded-full h-3 overflow-hidden border border-blue-900/30">
      <div 
        className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500"
        style={{
          width: `${(currentChakra / calculatedStats.maxChakra) * 100}%`,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.8), 0 0 20px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
      />
    </div>
    {currentChakra < calculatedStats.maxChakra && (
      <p className="text-xs text-muted-foreground text-center">
        Próxima regeneração: {chakraRegenTimeRemaining}s | 
        Cheio em: {Math.ceil((calculatedStats.maxChakra - currentChakra))} min
      </p>
    )}
  </div>
</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative">
<StatItem
  label="Vitalidade"
  value={calculatedStats.finalVitality}
  baseValue={calculatedStats.profileVitality}
  onIncrement={() => handleIncrement('vitality')}
  isUpgradeable={(userProfile.stat_points - (pendingUpdates.stat_points_used || 0)) > 0}
  tooltipContent={getBonusTooltip('vitalidade', userProfile)}
  isDistributionDisabled={isDoujutsuActive || isSealCurrentlyActive}
  tooltipSide="top"
/>
<StatItem
  label="Inteligência"
  value={calculatedStats.finalIntelligence}
  baseValue={calculatedStats.profileIntelligence}
  onIncrement={() => handleIncrement('intelligence')}
  isUpgradeable={(userProfile.stat_points - (pendingUpdates.stat_points_used || 0)) > 0}
  tooltipContent={getBonusTooltip('inteligencia', userProfile)}
  isDistributionDisabled={isDoujutsuActive || isSealCurrentlyActive}
  tooltipSide="top"
/>
<StatItem
  label="Taijutsu"
  value={calculatedStats.finalTaijutsu}
  baseValue={calculatedStats.profileTaijutsu}
  onIncrement={() => handleIncrement('taijutsu')}
  isUpgradeable={(userProfile.stat_points - (pendingUpdates.stat_points_used || 0)) > 0}
  tooltipContent={getBonusTooltip('taijutsu', userProfile)}
  isDistributionDisabled={isDoujutsuActive || isSealCurrentlyActive}
  tooltipSide="top"
/>
<StatItem
  label="Ninjutsu"
  value={calculatedStats.finalNinjutsu}
  baseValue={calculatedStats.profileNinjutsu}
  onIncrement={() => handleIncrement('ninjutsu')}
  isUpgradeable={(userProfile.stat_points - (pendingUpdates.stat_points_used || 0)) > 0}
  tooltipContent={getBonusTooltip('ninjutsu', userProfile)}
  isDistributionDisabled={isDoujutsuActive || isSealCurrentlyActive}
  tooltipSide="bottom"
/>
<StatItem
  label="Genjutsu"
  value={calculatedStats.finalGenjutsu}
  baseValue={calculatedStats.profileGenjutsu}
  onIncrement={() => handleIncrement('genjutsu')}
  isUpgradeable={(userProfile.stat_points - (pendingUpdates.stat_points_used || 0)) > 0}
  tooltipContent={getBonusTooltip('genjutsu', userProfile)}
  isDistributionDisabled={isDoujutsuActive || isSealCurrentlyActive}
  tooltipSide="bottom"
/>
<StatItem
  label="Selo"
  value={calculatedStats.finalSelo}
  baseValue={calculatedStats.profileSelo}
  onIncrement={() => handleIncrement('selo')}
  isUpgradeable={(userProfile.stat_points - (pendingUpdates.stat_points_used || 0)) > 0}
  tooltipContent={getBonusTooltip('selo', userProfile)}
  isDistributionDisabled={isDoujutsuActive || isSealCurrentlyActive}
  tooltipSide="bottom"
/>
</div>
            </div>
            </TooltipProvider>

            <div className="mt-6 border-t pt-6">
    <h3 className="mb-4 text-lg font-semibold text-center">Equipamentos</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[equippedChest, equippedLegs, equippedFeet, equippedHands].map((item, index) => {
           const category = ['Peito', 'Pernas', 'Pés', 'Mãos'][index] as keyof typeof equipmentIcons;
           const Icon = equipmentIcons[category];

           if (item) {
               return (
                   <Card key={item.id} className="w-full flex flex-col items-center p-4">
                       <div className="relative w-24 h-24 mb-3 rounded-md overflow-hidden bg-muted/20">
                           <Image 
                               src={item.imageUrl} 
                               alt={item.name} 
                               fill
                               className="object-contain"
                               unoptimized
                           />
                       </div>
                       <CardTitle className="text-lg mb-2 text-center">
                           {item.name}
                       </CardTitle>
                       <CardContent className="w-full p-0 mt-2 space-y-1">
                           {Object.entries(item.buffs).map(([key, value]) => (
                               value !== 0 && <StatBuffDisplay key={key} label={key} value={value} />
                           ))}
                       </CardContent>
                   </Card>
               );
           }
           return (
               <Card key={category} className="w-full flex flex-col items-center p-4 bg-muted/20 border-dashed">
                    <Icon className="h-12 w-12 text-muted-foreground mb-3"/>
                    <CardTitle className="text-lg mb-2 text-muted-foreground">
                        Vazio
                    </CardTitle>
                    <CardContent className="w-full p-0 mt-2">
                       <p className="text-center text-xs text-muted-foreground">Visite o Arsenal para equipar.</p>
                    </CardContent>
               </Card>
           );
        })}
    </div>
</div>

            

{/* 🆕 SEÇÃO DE BOOSTS PREMIUM ATIVOS */}
{activeBoosts && activeBoosts.length > 0 && (
  <div className="mt-6 border-t pt-6">
    <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
      <Sparkles className="h-5 w-5 text-yellow-500" />
      Boosts Premium Ativos
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeBoosts.map((boost: any) => {
        const expiresAt = new Date(boost.expires_at);
        const now = new Date();
        const timeRemaining = expiresAt.getTime() - now.getTime();
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        const hasStatBonuses = boost.item_data?.stat_bonuses && Object.keys(boost.item_data.stat_bonuses).length > 0;
        const isResourceBoost = boost.item_type === 'ryo_boost' || boost.item_type === 'xp_boost';

        return (
          <Card key={boost.id} className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                {boost.item_data?.name || 'Boost Premium'}
              </CardTitle>
              <CardDescription className="text-xs">
                {boost.item_data?.description || 'Bônus temporário'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasStatBonuses && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Bônus de Atributos:</p>
                  {Object.entries(boost.item_data.stat_bonuses).map(([stat, value]: [string, any]) => (
                    <div key={stat} className="flex justify-between items-center text-sm">
                      <span className="capitalize">{stat}:</span>
                      <span className="font-bold text-green-400">+{value}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {isResourceBoost && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Efeito:</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="capitalize">
                      {boost.item_type === 'ryo_boost' ? 'Ganho de Ryo' : 'Ganho de XP'}:
                    </span>
                    <span className="font-bold text-green-400">
                      +{boost.item_data?.boost_percentage || 0}%
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>
                  Expira em: {hoursRemaining}h {minutesRemaining}m
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
)}
{/* 🆕 SEÇÃO DE ARMA EQUIPADA */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
    <Swords className="h-5 w-5 text-orange-500" />
    Arma Equipada
  </h3>
  <div className="flex justify-center">
    {equippedWeapon ? (
      <Card className="w-full max-w-sm flex flex-col items-center p-4 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/5">
        <div className="relative w-24 h-24 mb-4 rounded-md overflow-hidden bg-black/20">
          <Image 
            src={equippedWeapon.imageUrl} 
            alt={equippedWeapon.name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <CardTitle className="text-xl mb-2 text-center text-orange-400">
          {equippedWeapon.name}
        </CardTitle>
        <CardDescription className="text-center mb-4">
          {equippedWeapon.description}
        </CardDescription>
        <CardContent className="w-full p-0 mt-2 space-y-1">
          <h4 className="font-semibold text-sm mb-2 text-center text-orange-400">Bônus de Atributos</h4>
          {Object.entries(equippedWeapon.buffs).map(([stat, value]) => (
            value !== 0 && (
              <div key={stat} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground capitalize">{stat}:</span>
                <span className={cn("font-semibold", value > 0 ? "text-green-400" : "text-red-500")}>
                  {value > 0 ? '+' : ''}{value}
                </span>
              </div>
            )
          ))}
        </CardContent>
        <Button 
          className="w-full mt-4" 
          variant={isSealCurrentlyActive ? "destructive" : "default"}
          onClick={handleActivateSeal}
          disabled={sealCooldownRemaining > 0}
        >
          {isSealCurrentlyActive 
            ? "Desativar Selo" 
            : sealCooldownRemaining > 0 
              ? `Cooldown: ${Math.ceil(sealCooldownRemaining / (60 * 1000))} min`
              : "Ativar Selo"
          }
        </Button>
      </Card>
    ) : (
      <Card className="w-full max-w-sm flex flex-col items-center p-6 border-dashed border-2">
        <Swords className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground mb-4">
          Nenhuma arma equipada.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/weapons">
            Equipar Arma
          </Link>
        </Button>
      </Card>
    )}
  </div>
</div>

{/* 🆕 SEÇÃO DE INVOCAÇÃO */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
    <Footprints className="h-5 w-5 text-purple-500" />
    Animal de Invocação
  </h3>
  <div className="flex justify-center">
    {equippedSummon ? (
      <Card className="w-full max-w-sm flex flex-col items-center p-4 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-indigo-500/5">
        <div className="relative w-24 h-24 mb-4 rounded-md overflow-hidden bg-black/20">
          <Image 
            src={equippedSummon.imageUrl} 
            alt={equippedSummon.name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <CardTitle className="text-xl mb-2 text-center text-purple-400 flex items-center gap-2">
          {equippedSummon.name}
          <Badge variant="secondary" className="text-xs">
            Nv. {userProfile.summon_level || 1}
          </Badge>
        </CardTitle>
        <CardDescription className="text-center mb-4">
          {equippedSummon.description}
        </CardDescription>
        <CardContent className="w-full p-0 mt-2 space-y-1">
          <h4 className="font-semibold text-sm mb-2 text-center text-purple-400">Bônus de Atributos</h4>
          {Object.entries(equippedSummon.buffs).map(([stat, baseValue]) => {
            const trainedStat = userProfile.summon_trained_stat;
            const summonLevel = userProfile.summon_level || 1;
            const bonus = (trainedStat === stat && summonLevel > 1) 
              ? ((summonLevel - 1) * TRAINING_BONUS_PER_LEVEL) 
              : 0;
            const finalValue = baseValue + bonus;
            
            return finalValue !== 0 && (
              <div key={stat} className="flex justify-between items-center text-sm">
                <span className={cn(
                  "capitalize",
                  trainedStat === stat ? "text-orange-400 font-bold" : "text-muted-foreground"
                )}>
                  {stat} {trainedStat === stat && '⭐'}
                </span>
                <span className={cn("font-semibold", finalValue > 0 ? "text-green-400" : "text-red-500")}>
                  {finalValue > 0 ? '+' : ''}{finalValue}
                  {bonus > 0 && <span className="text-xs text-orange-400 ml-1">(+{bonus})</span>}
                </span>
              </div>
            );
          })}
        </CardContent>
        {userProfile.summon_trained_stat && (
          <div className="w-full mt-3 p-2 bg-orange-500/10 rounded-md border border-orange-500/20">
            <p className="text-xs text-center">
              <span className="font-bold text-orange-400 capitalize">{userProfile.summon_trained_stat}</span> em treinamento
            </p>
          </div>
        )}
        <Button asChild className="w-full mt-4" variant="outline">
          <Link href="/summons">
            Gerenciar Invocação
          </Link>
        </Button>
      </Card>
    ) : (
      <Card className="w-full max-w-sm flex flex-col items-center p-6 border-dashed border-2">
        <Footprints className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground mb-4">
          Nenhuma invocação contratada.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/summons">
            Formar Contrato
          </Link>
        </Button>
      </Card>
    )}
  </div>
</div>

{/* Seção de Dōjutsu */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center">Dōjutsu</h3>
  <div className="flex justify-center">
    {doujutsu ? (
      <Card className="w-full max-w-sm flex flex-col items-center p-4">
        <div className="relative w-20 h-20 mb-4">
          <img 
            src={doujutsuImages[doujutsu.type]?.imageUrl} 
            alt={doujutsu.type}
            className="object-contain w-full h-full"
          />
        </div>
        <CardTitle className="flex items-center gap-2 text-xl mb-2">
          <Eye className="h-5 w-5 text-primary" />
          {doujutsu.type}
        </CardTitle>
        <CardDescription className="text-center mb-4">
          {doujutsuData[doujutsu.type]?.description}
        </CardDescription>
        <CardContent className="w-full p-0 mt-2 space-y-1">
          <h4 className="font-semibold text-sm mb-2 text-center">Bônus Ativos</h4>
          {Object.entries(doujutsuData[doujutsu.type]?.stages[1]?.buffs || {}).map(([stat, value]: [string, any]) => (
            <StatBuffDisplay 
              key={stat} 
              label={stat.charAt(0).toUpperCase() + stat.slice(1)} 
              value={`${Math.round(((value || 1) - 1) * 100)}%`}
            />
          ))}
        </CardContent>
        <Button 
          className="w-full mt-4" 
          variant={isDoujutsuActive ? "destructive" : "default"}
          onClick={handleToggleDoujutsu}
          disabled={!isDoujutsuActive && doujutsuCooldownRemaining > 0}
        >
          {isDoujutsuActive 
            ? "Desativar" 
            : doujutsuCooldownRemaining > 0 
              ? `Cooldown: ${Math.ceil(doujutsuCooldownRemaining / (60 * 1000))} min`
              : "Ativar"
          }
        </Button>
      </Card>
    ) : (
      <Card className="w-full max-w-sm flex flex-col items-center p-6 border-dashed border-2">
        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground">
          Nenhum Dōjutsu despertado.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/doujutsu">
            Despertar Poder
          </Link>
        </Button>
      </Card>
    )}
  </div>
</div>

{/* 🆕 SEÇÃO DO SELO AMALDIÇOADO */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
    <ShieldQuestion className="h-5 w-5 text-red-500" />
    Selo Amaldiçoado
  </h3>
  <div className="flex justify-center">
    {sealLevel > 0 ? (
      <Card className="w-full max-w-sm flex flex-col items-center p-4 border-red-500/50 bg-gradient-to-br from-red-500/10 to-purple-500/5">
        <div className="w-32 h-32 mb-4 flex items-center justify-center">
          <img 
            src={sealLevel === 1 ? SEAL_IMAGES.level1 : SEAL_IMAGES.level2}
            alt={`Selo Amaldiçoado Nível ${sealLevel}`}
            className="w-full h-full object-contain"
          />
        </div>
        <CardTitle className="text-xl mb-2 text-center text-red-400 flex items-center gap-2">
          Selo Nível {sealLevel}
          {isSealCurrentlyActive && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              ATIVO
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-center mb-4">
          {sealLevel === 1 ? 'Primeiro estágio do selo amaldiçoado' : 'Transformação completa do selo'}
        </CardDescription>
        <CardContent className="w-full p-0 mt-2 space-y-1">
          <h4 className="font-semibold text-sm mb-2 text-center text-red-400">
            {isSealCurrentlyActive ? 'Efeitos Ativos' : 'Efeitos (quando ativo)'}
          </h4>
          {sealLevel === 1 ? (
            <>
              <StatBuffDisplay label="Ninjutsu" value="+20%" />
              <StatBuffDisplay label="Taijutsu" value="+20%" />
              <StatBuffDisplay label="Selo" value="+15%" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Vida Máxima</span>
                <span className="font-semibold text-red-500">-15%</span>
              </div>
            </>
          ) : (
            <>
              <StatBuffDisplay label="Ninjutsu" value="+40%" />
              <StatBuffDisplay label="Taijutsu" value="+40%" />
              <StatBuffDisplay label="Selo" value="+30%" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Vida Máxima</span>
                <span className="font-semibold text-red-500">-30%</span>
              </div>
            </>
          )}
        </CardContent>
        {isSealCurrentlyActive && (
          <div className="w-full mt-3 p-2 bg-red-500/10 rounded-md border border-red-500/20">
            <p className="text-xs text-center text-red-400 font-bold">
              ⚠️ Poder sombrio ativo
            </p>
          </div>
        )}
        <Button 
          className="w-full mt-4" 
          variant={isSealCurrentlyActive ? "destructive" : "default"}
          onClick={handleActivateSeal}
          disabled={sealCooldownRemaining > 0}
        >
          {isSealCurrentlyActive 
            ? "Desativar Selo" 
            : sealCooldownRemaining > 0 
              ? `Cooldown: ${Math.ceil(sealCooldownRemaining / (60 * 1000))} min`
              : "Ativar Selo"
          }
        </Button>
      </Card>
    ) : (
      <Card className="w-full max-w-sm flex flex-col items-center p-6 border-dashed border-2">
        <ShieldQuestion className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground mb-4">
          Nenhum selo amaldiçoado obtido.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/cursed-seal">
            Buscar Poder
          </Link>
        </Button>
      </Card>
    )}
  </div>
</div>

{/* 🆕 SEÇÃO DE PREMIUM PASS ATIVO */}
{hasPremiumPass && premiumPassData && (
  <div className="mt-6 border-t pt-6">
    <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
      <Crown className="h-5 w-5 text-yellow-500" />
      Premium Pass
    </h3>
    <div className="flex justify-center">
      <Card className="w-full max-w-md border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-amber-500/5">
        <CardHeader className="pb-3 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-yellow-500" />
            {premiumPassData.item_data?.name || 'Premium Pass'}
          </CardTitle>
          <CardDescription>
            {premiumPassData.item_data?.description || 'Acesso Premium Ativo'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Benefícios Ativos:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>3x atualizações de missões por dia</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Até 5 jutsus por elemento</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Acesso a armas exclusivas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Acesso a invocações exclusivas</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-3 border-t">
            <Clock className="h-4 w-4" />
            <span>
              Expira em: {(() => {
                const expiresAt = new Date(premiumPassData.expires_at);
                const now = new Date();
                const timeRemaining = expiresAt.getTime() - now.getTime();
                const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                return `${daysRemaining}d ${hoursRemaining}h`;
              })()}
            </span>
          </div>

          <div className="space-y-1">
            <Progress 
              value={(() => {
                const expiresAt = new Date(premiumPassData.expires_at);
                const createdAt = new Date(premiumPassData.created_at);
                const totalDuration = expiresAt.getTime() - createdAt.getTime();
                const timeRemaining = expiresAt.getTime() - Date.now();
                return ((totalDuration - timeRemaining) / totalDuration) * 100;
              })()} 
              className="h-2"
            />
            <p className="text-xs text-center text-muted-foreground">
              {new Date(premiumPassData.expires_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)}

{/* 🆕 SEÇÃO DE ITENS PREMIUM CONSUMÍVEIS */}
{activePotions && activePotions.length > 0 && (
  <div className="mt-6 border-t pt-6">
    <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
      <Sparkles className="h-5 w-5 text-purple-500" />
      Itens Premium
    </h3>
    <div className="flex justify-center gap-4 flex-wrap">
      {activePotions.map((item: any) => {
        const canUseChakra = item.item_type === 'chakra_potion' && currentChakra < calculatedStats.maxChakra;
        const canUseHealth = item.item_type === 'health_potion' && currentHealth < calculatedStats.maxHealth;
        const canUse = canUseChakra || canUseHealth;
        
        // ✅ BUSCAR DADOS DO PREMIUM ITEM DO MAPA
        const premiumItem = premiumItemsMap.get(item.premium_item_id);
        const itemName = premiumItem?.name || item.item_data?.name || 'Item Premium';
        const itemDescription = premiumItem?.description || item.item_data?.description || '';
        const itemData = premiumItem?.item_data || item.item_data || {};
        
        return (
          <Card key={item.id} className="w-48 border-purple-500/50 relative">
            {/* 🆕 BADGE DE QUANTIDADE */}
            {item.quantity > 1 && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold border-2 border-background z-10">
                {item.quantity}
              </div>
            )}
            
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-center">
                {itemName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-2xl mb-2">🧪</div>
                <p className="text-xs text-muted-foreground">
                  {itemData.restore_amount 
                    ? `Restaura ${itemData.restore_amount}` 
                    : `Restaura ${itemData.restore_percentage || 100}%`
                  } de {item.item_type === 'chakra_potion' ? 'Chakra' : 'Vida'}
                </p>
              </div>
              
              <Button 
                className="w-full" 
                size="sm"
                disabled={!canUse}
                onClick={() => handleUsePremiumItem(item, premiumItem)}
              >
                {canUse ? 'Usar' : (
                  item.item_type === 'chakra_potion' ? 'Chakra Cheio' : 'Vida Cheia'
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
)}


{/* Elementos Dominados */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center">Elementos Dominados</h3>
  {unlockedElements.length > 0 ? (
  <div className="flex justify-center gap-4 flex-wrap">
    {allElements.map((elementName) => {
    if ((userProfile.element_levels?.[elementName] || 0) > 0) {
      const elementImage = elementImages[elementName as keyof typeof elementImages];
      const elementLevel = userProfile.element_levels?.[elementName] || 0;
      
      // ✅ VALORES FINAIS DOS AJUSTES
      const finalAdjustments = {
        Katon: { x: -1, y: 0, scale: 2.1 },
        Futon: { x: -5, y: -1, scale: 1.95 },
        Raiton: { x: 3, y: 1, scale: 2.3 },
        Doton: { x: 0, y: 0, scale: 2.1 },
        Suiton: { x: 3, y: 0, scale: 1.85 },
      };
      
      const adj = finalAdjustments[elementName as keyof typeof finalAdjustments] || { x: 0, y: 0, scale: 1 };
      
      return (
        <div key={elementName} className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-all">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-all">
              <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center bg-muted/50 overflow-hidden p-2 shrink-0">
                <div 
                  className="relative w-full h-full"
                  style={{
                    transform: `translate(${adj.x}px, ${adj.y}px) scale(${adj.scale})`,
                  }}
                >
                  <Image 
                    src={elementImage} 
                    alt={elementName}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
              <span className="text-sm font-medium">{elementName}</span>
              <span className="text-xs text-muted-foreground">Nível {elementLevel}</span>
              </div>
          </div>
        );
      }
      return null;
    })}
  </div>
) : (
    <p className="text-center text-muted-foreground">Nenhum elemento dominado ainda.</p>
  )}
</div>


{/* Jutsus Aprendidos */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center">Jutsus Aprendidos</h3>
  {learnedJutsus.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {learnedJutsus.map(([jutsuName, level]) => {
        const jutsuData = jutsusMap.get(jutsuName);
        // ✅ CONVERTER LEVEL PARA NUMBER EXPLICITAMENTE
        const jutsuLevel = Number(level);
        
        return (
          <Card key={jutsuName} className="p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-lg">
            <div className="flex items-center gap-3">
              {/* ✅ IMAGEM DO JUTSU DO BANCO DE DADOS */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40 flex-shrink-0 border-2 border-primary/30 p-1">
                <div className="relative w-full h-full">
                  <Image 
                    src={jutsuData?.imageUrl || defaultJutsuImage} 
                    alt={jutsuName}
                    fill
                    className="object-contain drop-shadow-lg"
                    unoptimized
                  />
                </div>
                {/* Badge de nível */}
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold border-2 border-background">
                  {jutsuLevel}
                </div>
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-sm">{jutsuName}</p>
                {jutsuData?.description && (
                  <p className="text-xs text-muted-foreground">{jutsuData.description}</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  ) : (
    <p className="text-center text-muted-foreground">Nenhum jutsu aprendido ainda.</p>
  )}
</div>


{/* Inventário */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center">Inventário</h3>
  {inventoryItems.length > 0 ? (
    <TooltipProvider>
      <div className="flex justify-center gap-2 flex-wrap">
        {inventoryItems.map((item) => {
          const isHealthFull = item.healthRecovery && currentHealth >= calculatedStats.maxHealth;
          const isChakraFull = false;
          const isDisabled = (item.healthRecovery && !item.chakraRecovery && isHealthFull) || (item.chakraRecovery && !item.healthRecovery && isChakraFull) || (isHealthFull && isChakraFull);
          
          let tooltipContent = `Usar ${item.name}`;
          if(isDisabled){
            if(isHealthFull && isChakraFull) tooltipContent = "Vida e Chakra cheios";
            else if (isHealthFull) tooltipContent = "Vida cheia";
            else if (isChakraFull) tooltipContent = "Chakra cheio";
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="h-16 w-16 p-2 flex items-center justify-center flex-col gap-1 border-2"
                    onClick={() => handleUseItem(item)}
                    disabled={isDisabled}
                  >
                    <Image src={item.imageUrl} alt={item.name} width={32} height={32} objectFit="contain" />
                  </Button>
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                    {item.quantity}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  ) : (
    <p className="text-center text-muted-foreground">Seu inventário está vazio. Visite o Ichiraku para comprar itens!</p>
  )}
</div>

 

{/* Inventário do Boss */}
<div className="mt-6 border-t pt-6">
  <h3 className="mb-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
    <Gift className="h-5 w-5 text-purple-500" />
    Recompensas do Boss
  </h3>
  {(() => {
    const bossInventory = userProfile.boss_inventory || {};
    const bossItems = Object.entries(bossInventory)
      .filter(([_, quantity]) => (quantity as number) > 0)
      .map(([id, quantity]) => {
        const allDrops = [
          ...bossDrops.comum,
          ...bossDrops.raro,
          ...bossDrops.epico,
          ...bossDrops.lendario
        ];
        const itemData = allDrops.find(item => item.id === id);
        return itemData ? { ...itemData, quantity } : null;
      })
      .filter(Boolean);

    if (bossItems.length === 0) {
      return (
        <p className="text-center text-muted-foreground">
          Nenhum item do boss ainda. Participe da Invasão Global!
        </p>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {bossItems.map((item: any) => {
          const rarityColors = {
            comum: 'border-gray-500',
            raro: 'border-blue-500',
            épico: 'border-purple-500',
            lendário: 'border-amber-500',
          };

          return (
            <Card
              key={item.id}
              className={cn(
                'relative transition-all hover:scale-105',
                rarityColors[item.rarity as keyof typeof rarityColors]
              )}
            >
              <CardHeader className="pb-3">
                <div className="text-4xl text-center mb-2">{item.icon}</div>
                <CardTitle className="text-sm text-center">{item.name}</CardTitle>
                <CardDescription className="text-xs text-center">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="secondary">x{item.quantity}</Badge>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleUseBossItem(item)}
                >
                  Usar
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  })()}
</div>

          </CardContent>
        </Card>
      </div>

      {/* 🆕 MODAIS DE SELEÇÃO */}
      <SelectionModal
        isOpen={showStatSelection}
        onClose={() => {
          setShowStatSelection(false);
          setCurrentItem(null);
        }}
        onConfirm={handleStatSelection}
        title={currentItem?.effect === 'triple_stat_points' ? 'Escolha 3 Atributos' : 'Escolha 2 Atributos'}
        description={`Selecione ${currentItem?.effect === 'triple_stat_points' ? '3' : '2'} atributos para receber +${currentItem?.amount} pontos cada`}
        options={[
          { value: 'Vitalidade', label: 'Vitalidade' },
          { value: 'Inteligência', label: 'Inteligência' },
          { value: 'Taijutsu', label: 'Taijutsu' },
          { value: 'Ninjutsu', label: 'Ninjutsu' },
          { value: 'Genjutsu', label: 'Genjutsu' },
          { value: 'Selo', label: 'Selo' },
        ]}
        maxSelections={currentItem?.effect === 'triple_stat_points' ? 3 : 2}
        icon={currentItem?.icon || '📜'}
      />

      <SelectionModal
        isOpen={showElementSelection}
        onClose={() => {
          setShowElementSelection(false);
          setCurrentItem(null);
        }}
        onConfirm={handleElementSelection}
        title={currentItem?.effect === 'dual_element_xp' || currentItem?.effect === 'element_and_jutsu_xp' ? 'Escolha 2 Elementos' : 'Escolha 1 Elemento'}
        description={`Selecione ${currentItem?.effect === 'dual_element_xp' || currentItem?.effect === 'element_and_jutsu_xp' ? '2' : '1'} elemento(s) para receber +${currentItem?.amount} XP`}
        options={allElements.map(el => ({ value: el, label: el }))}
        maxSelections={currentItem?.effect === 'dual_element_xp' || currentItem?.effect === 'element_and_jutsu_xp' ? 2 : 1}
        icon={currentItem?.icon || '🔥'}
      />

      <SelectionModal
        isOpen={showJutsuSelection}
        onClose={() => {
          setShowJutsuSelection(false);
          setCurrentItem(null);
        }}
        onConfirm={handleJutsuSelection}
        title={currentItem?.effect === 'element_and_jutsu_xp' ? 'Escolha 2 Jutsus' : 'Escolha 1 Jutsu'}
        description={`Selecione ${currentItem?.effect === 'element_and_jutsu_xp' ? '2' : '1'} jutsu(s) para receber +${currentItem?.amount} XP`}
        options={learnedJutsus.map(([name]) => ({ value: name, label: name }))}
        maxSelections={currentItem?.effect === 'element_and_jutsu_xp' ? 2 : 1}
        icon={currentItem?.icon || '🥷'}
      />

      {/* Modal de Relatório de Batalha */}
      <BattleReportModal />
    </div>
  );
}