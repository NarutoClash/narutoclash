'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Loader2, Footprints, CheckCircle, Coins, Trash2, TrendingUp, Star, Crown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { summonsData, type Summon, getTrainingCost, MAX_SUMMON_LEVEL, TRAINING_BONUS_PER_LEVEL, getSummonBuildAbility } from '@/lib/summons-data';
import { detectBuild } from '@/lib/battle-system/build-detector';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { calculateDynamicStats } from '@/lib/battle-system/calculator';
import { EQUIPMENT_DATA } from '@/lib/battle-system/equipment-data';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { usePremiumStatus } from '@/hooks/use-premium-status';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const StatBuff = ({ label, value, isTraining = false }: { label: string; value: number; isTraining?: boolean }) => {
    if (value === 0) return null;
    const isBuff = value > 0;
    return (
        <div className="flex justify-between items-center text-sm">
            <span className={cn("text-[#888855]", isTraining && "font-bold text-[#cc9900]")}>
                {label} {isTraining && '⭐'}
            </span>
            <span className={cn("font-semibold", isBuff ? "text-green-400" : "text-red-500")}>
                {isBuff ? '+' : ''}{value}
            </span>
        </div>
    );
};

const SummonCard = ({ 
    summon, 
    userProfile, 
    onBuy, 
    onSell,
    onTrain,
    isOwned,
    isPremium,
}: { 
    summon: Summon; 
    userProfile: any; 
    onBuy: (summon: Summon) => void; 
    onSell: (summon: Summon) => void;
    onTrain: (summon: Summon, stat: string) => void;
    isOwned: boolean;
    isPremium: boolean;
}) => {
    const [selectedStat, setSelectedStat] = useState<string>('');
    const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);

    const canAfford = userProfile.ryo >= summon.price;
    const canUse = userProfile.level >= summon.requiredLevel;
    const hasSummon = !!userProfile.summon_id;
    const canBuy = canAfford && canUse && (!summon.isPremium || isPremium);

    const summonLevel = userProfile.summon_level || 1;
    const trainedStat = userProfile.summon_trained_stat || '';
    const trainingCost = getTrainingCost(summonLevel);
    const canAffordTraining = userProfile.ryo >= trainingCost;
    const isMaxLevel = summonLevel >= MAX_SUMMON_LEVEL;

    const getBuffValue = (stat: string, baseValue: number) => {
        if (!isOwned) return baseValue;
        if (stat === trainedStat) {
            return baseValue + ((summonLevel - 1) * TRAINING_BONUS_PER_LEVEL);
        }
        return baseValue;
    };

    const handleTrainClick = () => {
        if (!selectedStat) return;
        onTrain(summon, selectedStat);
        setIsTrainingDialogOpen(false);
        setSelectedStat('');
    };

    return (
        <Card className={cn(
            "flex flex-col relative bg-white border-[#ffcc00]/40 hover:border-[#ffcc00] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#ffcc00]/20",
            isOwned && "border-[#ffcc00] ring-2 ring-[#ffcc00] shadow-xl shadow-[#ffcc00]/30"
        )}>
             {!isOwned && !canUse && (
                <div className="absolute inset-0 bg-red-900/40 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                    <p className="text-white font-bold text-lg">Requer Nível {summon.requiredLevel}</p>
                </div>
            )}
            {summon.isPremium && !isPremium && !isOwned && canUse && (
                <div className="absolute inset-0 bg-yellow-900/40 rounded-lg z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    <p className="text-white font-bold text-lg">Apenas Premium</p>
                </div>
            )}
            <CardHeader>
                <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden bg-[#fffbe6] border border-[#ffcc00]/30">
                    <Image src={summon.imageUrl} alt={summon.name} layout="fill" objectFit="contain" unoptimized/>
                </div>
                <CardTitle className="flex items-center justify-between text-[#664400]">
                    <span className="flex items-center gap-2">
                        {summon.name}
                        {summon.isPremium && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                    </span>
                    {isOwned && (
                        <span className="flex items-center gap-1 text-sm font-normal text-[#888855]">
                            <Star className="h-4 w-4" />
                            Nível {summonLevel}
                        </span>
                    )}
                </CardTitle>
                <CardDescription className="text-[#888855]">{summon.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-[#664400]">Bônus de Atributos</h4>
                    <StatBuff label="Taijutsu" value={getBuffValue('taijutsu', summon.buffs.taijutsu)} isTraining={trainedStat === 'taijutsu'} />
                    <StatBuff label="Ninjutsu" value={getBuffValue('ninjutsu', summon.buffs.ninjutsu)} isTraining={trainedStat === 'ninjutsu'} />
                    <StatBuff label="Genjutsu" value={getBuffValue('genjutsu', summon.buffs.genjutsu)} isTraining={trainedStat === 'genjutsu'} />
                    <StatBuff label="Selo" value={getBuffValue('selo', summon.buffs.selo)} isTraining={trainedStat === 'selo'} />
                    <StatBuff label="Vitalidade" value={getBuffValue('vitalidade', summon.buffs.vitalidade)} isTraining={trainedStat === 'vitalidade'} />
                    <StatBuff label="Inteligência" value={getBuffValue('inteligencia', summon.buffs.inteligencia)} isTraining={trainedStat === 'inteligencia'} />
                 </div>
                 <div className="space-y-1">
                     <h4 className="font-semibold text-sm text-[#664400]">Requisitos</h4>
                     <p className="text-sm text-[#888855]">Nível: {summon.requiredLevel}</p>
                 </div>
                 {isOwned && trainedStat && (
                    <div className="p-2 bg-[#ffcc00]/10 rounded-md border border-[#ffcc00]/30">
                        <p className="text-xs text-center">
                            <span className="font-bold text-[#664400] capitalize">{trainedStat}</span> em treinamento 
                            <span className="text-[#888855]"> (+{(summonLevel - 1) * TRAINING_BONUS_PER_LEVEL} bônus)</span>
                        </p>
                    </div>
                 )}
                 {(() => {
                    // Detecta a build atual do jogador e mostra o buff de batalha da invocação
                    const _stats  = calculateFinalStats(userProfile);
                    const _fighter = {
                      vitality: userProfile.vitality || 0,
                      taijutsu: userProfile.taijutsu || 0,
                      ninjutsu: userProfile.ninjutsu || 0,
                      genjutsu: userProfile.genjutsu || 0,
                      intelligence: userProfile.intelligence || 0,
                      selo: userProfile.selo || 0,
                      elementLevels: userProfile.element_levels || {},
                      jutsus: userProfile.jutsus || {},
                    } as any;
                    const _dynStats = calculateDynamicStats(_fighter, EQUIPMENT_DATA);
                    const _build    = detectBuild(_dynStats);
                    const _ability  = getSummonBuildAbility(summon.id, _build);
                    if (!_ability) return null;
                    const _lvBonus  = Math.floor((summonLevel - 1) * 5);
                    return (
                      <div className="mt-3 rounded-lg border border-[#ffcc00]/50 bg-gradient-to-br from-[#fffbe6] to-[#fff8d6] p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{_ability.emoji}</span>
                          <span className="text-xs font-bold text-[#664400] uppercase tracking-wide">Habilidade de Batalha</span>
                        </div>
                        <p className="text-sm font-bold text-[#442200]">{_ability.name}</p>
                        <p className="text-xs text-[#886633] leading-snug">{_ability.description}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] bg-[#ffcc00]/20 text-[#664400] px-2 py-0.5 rounded-full font-semibold capitalize">
                            Build: {_build}
                          </span>
                          {isOwned && _lvBonus > 0 && (
                            <span className="text-[10px] text-green-600 font-semibold">
                              +{_lvBonus}% eficácia (Nv {summonLevel})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                 })()}
            </CardContent>
            <CardFooter className="flex-col gap-2">
    {isOwned ? (
        <>
            <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
                <DialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="w-full h-auto min-h-[44px] py-3 border-[#ffcc00] text-[#664400] hover:bg-[#ffcc00]/10 whitespace-normal text-center" 
                        disabled={isMaxLevel}
                    >
                        <div className="flex flex-col items-center gap-1 w-full">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                                <span className="font-semibold">
                                    {isMaxLevel ? 'Nível Máximo' : 'Treinar'}
                                </span>
                            </div>
                            {!isMaxLevel && (
                                <span className="text-xs text-muted-foreground">
                                    {trainingCost.toLocaleString()} Ryo
                                </span>
                            )}
                        </div>
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-[#ffcc00]/40">
                    <DialogHeader>
                        <DialogTitle className="text-[#664400]">Treinar {summon.name}</DialogTitle>
                        <DialogDescription className="text-[#888855]">
                            Escolha qual atributo você quer treinar. Cada nível adiciona +{TRAINING_BONUS_PER_LEVEL} ao stat escolhido.
                            {trainedStat && (
                                <span className="block mt-2 text-[#664400] font-semibold">
                                    Atributo atual em treinamento: {trainedStat.charAt(0).toUpperCase() + trainedStat.slice(1)}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2 my-4">
                        {summon.trainableStats.map(stat => (
                            <Button
                                key={stat}
                                variant={selectedStat === stat ? "default" : "outline"}
                                onClick={() => setSelectedStat(stat)}
                                className={cn(
                                    "capitalize h-auto py-3",
                                    selectedStat === stat && "bg-gradient-to-r from-orange-500 to-red-600"
                                )}
                            >
                                {stat}
                            </Button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={handleTrainClick} 
                            disabled={!selectedStat || !canAffordTraining}
                            className={cn(
                                "h-auto py-3",
                                selectedStat && canAffordTraining && "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                            )}
                        >
                            {!canAffordTraining ? 'Ryo Insuficiente' : 'Confirmar Treinamento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        variant="destructive" 
                        className="w-full h-auto min-h-[44px] py-3 bg-red-600 hover:bg-red-700 whitespace-normal"
                    >
                        <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>Cancelar Contrato</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-[#ffcc00]/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#664400]">Cancelar contrato com {summon.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#888855]">
                            Você receberá apenas 50% do valor base ({(summon.price / 2).toLocaleString()} Ryo).
                            {summonLevel > 1 && (
                                <span className="block mt-2 text-red-500 font-semibold">
                                    ⚠️ Todo o investimento em treinamento será perdido!
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-[#ffcc00] text-[#664400] hover:bg-[#ffcc00]/10">Manter Contrato</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => onSell(summon)}
                            className="bg-[#ffcc00] text-[#664400] font-bold hover:bg-[#cc9900]"
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    ) : (
        <Button 
            className={cn(
                "w-full h-auto min-h-[56px] py-3 whitespace-normal text-center",
                canBuy && !hasSummon && "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/50"
            )}
            onClick={() => onBuy(summon)} 
            disabled={!canBuy || hasSummon}
        >
            <div className="flex flex-col items-center gap-1 w-full">
                <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 flex-shrink-0" />
                    <span className="font-semibold">
                        {hasSummon ? 'Contrato já ativo' : 
                         summon.isPremium && !isPremium ? 'Apenas Premium' :
                         canUse ? (canAfford ? 'Formar Contrato' : 'Ryo Insuficiente') : 
                         `Requer Nível ${summon.requiredLevel}`}
                    </span>
                </div>
                {canBuy && !hasSummon && (
                    <span className="text-xs text-white/80">
                        {summon.price.toLocaleString()} Ryo
                    </span>
                )}
            </div>
        </Button>
    )}
</CardFooter>
        </Card>
    );
};

export default function SummonsPage() {
    const { user, supabase } = useSupabase();
    const { toast } = useToast();
    const { isActive: isPremium } = usePremiumStatus(supabase, user?.id);

    const userProfileRef = useMemoSupabase(() => {
        if (!user) return null;
        return { table: 'profiles', id: user.id };
    }, [user]);

    const { data: userProfile, isLoading, setData: setUserProfile } = useDoc(userProfileRef);

    const handleBuySummon = async (summon: Summon) => {
        if (!userProfile || !userProfileRef || !supabase || userProfile.summon_id) return;
        
        if (userProfile.ryo < summon.price) {
            toast({ variant: 'destructive', title: 'Ryo Insuficiente' });
            return;
        }
        if (userProfile.level < summon.requiredLevel) {
            toast({ variant: 'destructive', title: 'Nível Insuficiente' });
            return;
        }

        const newRyo = (userProfile.ryo || 0) - summon.price;
        const { data: updated, error } = await supabase.from('profiles').update({
            ryo: newRyo,
            summon_id: summon.id,
            summon_level: 1,
            summon_trained_stat: null,
        }).eq('id', userProfile.id).select().single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao formar contrato', description: error.message });
            return;
        }

        if (updated) setUserProfile(updated);
        toast({ title: 'Contrato Formado!', description: `Você agora pode invocar ${summon.name}.` });
    };

    const handleSellSummon = async (summon: Summon) => {
        if (!userProfileRef || !userProfile || !supabase) return;
        
        const sellPrice = Math.floor(summon.price / 2);
        const newRyo = (userProfile.ryo || 0) + sellPrice;

        const { data: updated, error } = await supabase.from('profiles').update({
            summon_id: null,
            summon_level: null,
            summon_trained_stat: null,
            ryo: newRyo,
        }).eq('id', userProfile.id).select().single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao cancelar contrato', description: error.message });
            return;
        }

        if (updated) setUserProfile(updated);
        toast({ title: 'Contrato Cancelado!', description: `Você recebeu ${sellPrice.toLocaleString()} Ryo.` });
    };

    const handleTrainSummon = async (summon: Summon, stat: string) => {
        if (!userProfileRef || !userProfile || !supabase) return;

        const currentLevel = userProfile.summon_level || 1;
        const trainingCost = getTrainingCost(currentLevel);

        if (userProfile.ryo < trainingCost) {
            toast({ variant: 'destructive', title: 'Ryo Insuficiente' });
            return;
        }

        if (currentLevel >= MAX_SUMMON_LEVEL) {
            toast({ variant: 'destructive', title: 'Nível Máximo Atingido' });
            return;
        }

        const newRyo  = (userProfile.ryo || 0) - trainingCost;
        const newLevel = currentLevel + 1;

        const { data: updated, error } = await supabase.from('profiles').update({
            ryo: newRyo,
            summon_level: newLevel,
            summon_trained_stat: stat,
        }).eq('id', userProfile.id).select().single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erro no treinamento', description: error.message });
            return;
        }

        if (updated) setUserProfile(updated);
        toast({ 
            title: 'Treinamento Concluído!', 
            description: `${summon.name} subiu para nível ${newLevel}! ${stat.charAt(0).toUpperCase() + stat.slice(1)} +${TRAINING_BONUS_PER_LEVEL}` 
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center px-4">
                <PageHeader title="Carregando Pergaminhos..." description="Buscando os contratos de invocação..." />
                <Loader2 className="h-8 w-8 animate-spin mt-6 text-orange-500" />
            </div>
        );
    }
     
    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center text-center px-4">
                <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para formar um contrato de invocação." />
                <Button asChild className="mt-6">
                    <Link href="/create-character">Criar Personagem</Link>
                </Button>
            </div>
        );
    }

    const currentSummonId = userProfile.summon_id;

    return (
        <div className="pb-12">
            <div className="container mx-auto px-4 py-8">
                <PageHeader
                    title="Animais de Invocação"
                    description="Forme um contrato com uma criatura lendária e treine-a para aumentar seus poderes. Você só pode ter um contrato ativo por vez."
                />
                
                <div className="my-8 flex justify-center">
                    <Card className='p-6 text-center bg-white border-2 border-[#ffcc00]'>
                        <CardTitle className="text-[#664400] mb-4">Seus Recursos</CardTitle>
                        <div className='flex gap-6 justify-center'>
                            <div className="flex flex-col items-center">
                                <Coins className="h-5 w-5 text-yellow-500 mb-1" />
                                <p className="text-sm text-[#888855]">Ryo</p>
                                <p className="text-xl font-bold text-[#664400]">{userProfile.ryo?.toLocaleString() || 0}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Footprints className="h-5 w-5 text-blue-500 mb-1" />
                                <p className="text-sm text-[#888855]">Nível</p>
                                <p className="text-xl font-bold text-[#664400]">{userProfile.level}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {summonsData.map((summon) => (
                        <SummonCard
                            key={summon.id}
                            summon={summon}
                            userProfile={userProfile}
                            onBuy={handleBuySummon}
                            onSell={handleSellSummon}
                            onTrain={handleTrainSummon}
                            isOwned={currentSummonId === summon.id}
                            isPremium={isPremium}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}