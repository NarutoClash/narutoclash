'use client';
   
   export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Loader2, Swords, CheckCircle, Coins, Trash2, Crown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { weaponsData, type Weapon } from '@/lib/weapons-data';
import { useRouter } from 'next/navigation';
import { usePremiumStatus } from '@/hooks/use-premium-status';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
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

const StatBuff = ({ label, value }: { label: string; value: number }) => {
    if (value === 0) return null;
    const isBuff = value > 0;
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">{label}</span>
            <span className={cn("font-semibold", isBuff ? "text-green-400" : "text-red-500")}>
                {isBuff ? '+' : ''}{value}
            </span>
        </div>
    );
};

const WeaponCard = ({ 
    weapon, 
    userProfile, 
    onBuy, 
    onSell,
    isOwned,
    isPremium,
}: { 
    weapon: Weapon; 
    userProfile: any; 
    onBuy: (weapon: Weapon) => void; 
    onSell: (weapon: Weapon) => void,
    isOwned: boolean,
    isPremium: boolean,
}) => {
    const canAfford = userProfile.ryo >= weapon.price;
    const canUse = userProfile.level >= weapon.requiredLevel;
    const hasWeapon = !!userProfile.weapon_id;
    const canBuy = canAfford && canUse && (!weapon.isPremium || isPremium);

    return (
        <Card className={cn(
            "flex flex-col relative bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20",
            isOwned && "border-orange-500 ring-2 ring-orange-500 shadow-xl shadow-orange-500/30"
        )}>
             {!isOwned && !canUse && (
                <div className="absolute inset-0 bg-red-900/40 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                    <p className="text-white font-bold text-lg">Requer Nível {weapon.requiredLevel}</p>
                </div>
            )}
            {weapon.isPremium && !isPremium && !isOwned && canUse && (
                <div className="absolute inset-0 bg-yellow-900/40 rounded-lg z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    <p className="text-white font-bold text-lg">Apenas Premium</p>
                </div>
            )}
            <CardHeader>
                <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden bg-black/30 border border-orange-500/20">
                    <Image src={weapon.imageUrl} alt={weapon.name} layout="fill" objectFit="contain" unoptimized/>
                </div>
                <CardTitle className="flex items-center justify-between text-orange-400">
                    {weapon.name}
                    {weapon.isPremium && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                </CardTitle>
                <CardDescription className="text-gray-400">{weapon.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-orange-400">Atributos</h4>
                    {Object.entries(weapon.buffs).map(([stat, value]) => (
                        <StatBuff key={stat} label={stat.charAt(0).toUpperCase() + stat.slice(1)} value={value} />
                    ))}
                 </div>
                 <div className="space-y-1">
                     <h4 className="font-semibold text-sm text-orange-400">Requisitos</h4>
                     <p className="text-sm text-gray-400">Nível: {weapon.requiredLevel}</p>
                 </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
    {isOwned ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button 
                variant="destructive" 
                className="w-full h-auto min-h-[56px] py-3 bg-red-600 hover:bg-red-700 whitespace-normal"
            >
                <div className="flex flex-col items-center gap-1 w-full">
                    <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 flex-shrink-0" />
                        <span className="font-semibold">Vender</span>
                    </div>
                    <span className="text-xs text-white/90">
                        {(weapon.price / 2).toLocaleString()} Ryo
                    </span>
                </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-orange-400">Vender {weapon.name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Você receberá 50% do valor de volta. Após vender, você poderá comprar uma nova arma.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-orange-500/50 hover:bg-orange-500/10">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onSell(weapon)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                Confirmar Venda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    ) : (
        <Button 
            className={cn(
                "w-full h-auto min-h-[56px] py-3 whitespace-normal text-center",
                canBuy && !hasWeapon && "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/50"
            )}
            onClick={() => onBuy(weapon)} 
            disabled={!canBuy || hasWeapon}
        >
            <div className="flex flex-col items-center gap-1 w-full">
                <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 flex-shrink-0" />
                    <span className="font-semibold">
                        {hasWeapon ? 'Arma já equipada' : 
                         weapon.isPremium && !isPremium ? 'Apenas Premium' :
                         canUse ? (canAfford ? 'Comprar' : 'Ryo Insuficiente') : 
                         `Requer Nível ${weapon.requiredLevel}`}
                    </span>
                </div>
                {canBuy && !hasWeapon && (
                    <span className="text-xs text-white/80">
                        {weapon.price.toLocaleString()} Ryo
                    </span>
                )}
            </div>
        </Button>
    )}
</CardFooter>
        </Card>
    );
};

export default function WeaponsPage() {
    const { user, supabase } = useSupabase();
    const { toast } = useToast();
    const { isActive: isPremium } = usePremiumStatus(supabase, user?.id);
    const router = useRouter();

    const userProfileRef = useMemoSupabase(() => {
        if (!user) return null;
        return { table: 'profiles', id: user.id };
    }, [user]);

    const { data: userProfile, isLoading } = useDoc(userProfileRef);

    const handleBuyWeapon = async (weapon: Weapon) => {
        if (!userProfile || !userProfileRef || !supabase || userProfile.weapon_id) return;
        
        if (userProfile.ryo < weapon.price) {
            toast({ variant: 'destructive', title: 'Ryo Insuficiente' });
            return;
        }
         if (userProfile.level < weapon.requiredLevel) {
            toast({ variant: 'destructive', title: 'Nível Insuficiente' });
            return;
        }
    
        // ✅ Aguarda a atualização
        await updateDocumentNonBlocking(userProfileRef, {
            ryo: (userProfile.ryo || 0) - weapon.price,
            weapon_id: weapon.id
        }, supabase);
    
        toast({ title: 'Arma Comprada e Equipada!', description: `${weapon.name} agora é sua arma principal.` });
        
        // ✅ Recarrega a página completamente
        window.location.reload();
    };
    
    const handleSellWeapon = async (weapon: Weapon) => {
        if (!userProfileRef || !userProfile || !supabase) return;
        
        const sellPrice = Math.floor(weapon.price / 2);
    
        // ✅ Aguarda a atualização
        await updateDocumentNonBlocking(userProfileRef, {
            weapon_id: null,
            ryo: (userProfile.ryo || 0) + sellPrice
        }, supabase);
    
        toast({ title: 'Arma Vendida!', description: `Você vendeu ${weapon.name} por ${sellPrice} Ryo.` });
        
        // ✅ Recarrega a página completamente
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950 flex flex-col items-center justify-center text-center px-4">
                <PageHeader title="Carregando Arsenal..." description="Forjando as lâminas..." />
                <Loader2 className="h-8 w-8 animate-spin mt-6 text-orange-500" />
            </div>
        );
    }
     
    if (!userProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950 flex flex-col items-center justify-center text-center px-4">
                <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para empunhar uma arma." />
                <Button asChild className="mt-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/50">
                    <Link href="/create-character">Criar Personagem</Link>
                </Button>
            </div>
        );
    }

    const currentWeaponId = userProfile.weapon_id;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950 pb-12">
            <div className="container mx-auto px-4 py-8">
                <PageHeader
                    title="Arsenal Shinobi"
                    description="Compre uma arma para fortalecer seu personagem. Você só pode ter uma de cada vez. Venda a atual para comprar uma nova."
                />
                
                <div className="my-8 flex justify-center">
                    <Card className='p-6 text-center bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30'>
                        <CardTitle className="text-orange-400 mb-4">Seus Recursos</CardTitle>
                        <div className='flex gap-6 justify-center'>
                            <div className="flex flex-col items-center">
                                <Coins className="h-5 w-5 text-yellow-500 mb-1" />
                                <p className="text-sm text-gray-400">Ryo</p>
                                <p className="text-xl font-bold text-orange-400">{userProfile.ryo?.toLocaleString() || 0}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Swords className="h-5 w-5 text-blue-500 mb-1" />
                                <p className="text-sm text-gray-400">Nível</p>
                                <p className="text-xl font-bold text-orange-400">{userProfile.level}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {weaponsData.map((weapon) => (
                        <WeaponCard
                            key={weapon.id}
                            weapon={weapon}
                            userProfile={userProfile}
                            onBuy={handleBuyWeapon}
                            onSell={handleSellWeapon}
                            isOwned={currentWeaponId === weapon.id}
                            isPremium={isPremium}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
