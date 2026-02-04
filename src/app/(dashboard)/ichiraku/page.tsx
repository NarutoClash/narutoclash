'use client';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Utensils, Heart, Sparkles, Coins, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { ichirakuMenu, type IchirakuItem } from '@/lib/ichiraku-data';
import Image from 'next/image';
import { useMemo } from 'react';
import { useState } from 'react';
import { calculateFinalStats } from '@/lib/stats-calculator';

const ItemCard = ({ item, onBuy, userProfile }: { item: IchirakuItem; onBuy: (item: IchirakuItem, quantity: number) => void; userProfile: any }) => {
    const [quantity, setQuantity] = useState(1);
    
    const totalPrice = item.price * quantity;
    const canAfford = userProfile.ryo >= totalPrice;
    const isDisabled = !canAfford;
    
    let buttonText = `Comprar (${totalPrice} Ryo)`;
    if (!canAfford) {
        buttonText = 'Ryo Insuficiente';
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden">
                    <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" />
                </div>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Coins className="h-4 w-4 text-yellow-400" /> Preço Unitário</span>
                    <span className="font-semibold">{item.price} Ryo</span>
                </div>
                {item.healthRecovery && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><Heart className="h-4 w-4 text-red-500" /> Recupera Vida</span>
                        <span className="font-semibold text-green-400">+{item.healthRecovery}</span>
                    </div>
                )}
                {item.chakraRecovery && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><Sparkles className="h-4 w-4 text-blue-400" /> Recupera Chakra</span>
                        <span className="font-semibold text-blue-400">+{item.chakraRecovery}</span>
                    </div>
                )}
                
                {/* ✅ NOVO: Seletor de quantidade */}
                <div className="pt-4 border-t">
                    <label className="text-sm font-medium mb-2 block">Quantidade</label>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                        >
                            -
                        </Button>
                        <span className="w-12 text-center font-bold">{quantity}</span>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            disabled={quantity >= 10}
                        >
                            +
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => onBuy(item, quantity)} disabled={isDisabled}>
                    <Utensils className="mr-2 h-4 w-4" />
                    {buttonText}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function IchirakuPage() {
    const { user, supabase } = useSupabase();
    const { toast } = useToast();

    const userProfileRef = useMemoSupabase(() => {
        if (!user) return null;
        return { table: 'profiles', id: user.id };
    }, [user]);

    const { data: userProfile, isLoading } = useDoc(userProfileRef);
    
    const calculatedStats = useMemo(() => {
    return calculateFinalStats(userProfile);
}, [userProfile]);


    const handleBuyItem = async (item: IchirakuItem, quantity: number = 1) => {
        if (!userProfile || !userProfileRef || !supabase) return;
    
        const totalPrice = item.price * quantity;
    
        if (userProfile.ryo < totalPrice) {
            toast({ 
                variant: 'destructive', 
                title: 'Dinheiro Insuficiente', 
                description: 'Você não tem Ryo suficiente para comprar este item.' 
            });
            return;
        }
    
        try {
            const currentQuantity = userProfile.inventory?.[item.id] || 0;
            
            const { error } = await supabase
                .from('profiles')
                .update({
                    ryo: (userProfile.ryo || 0) - totalPrice,
                    inventory: {
                        ...userProfile.inventory,
                        [item.id]: currentQuantity + quantity,  // ✅ Adiciona a quantidade selecionada
                    },
                })
                .eq('id', userProfileRef.id);
    
            if (error) {
                console.error('🔴 Erro ao comprar:', error);
                throw error;
            }
    
            toast({ 
                title: 'Item Comprado!', 
                description: `${quantity}x ${item.name} ${quantity > 1 ? 'foram adicionados' : 'foi adicionado'} ao seu inventário.` 
            });
    
            setTimeout(() => {
                window.location.reload();
            }, 1500);
    
        } catch (error) {
            console.error("Error buying item:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao comprar item' 
            });
        }
    };

    if (isLoading || !userProfile || !calculatedStats) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <PageHeader title="Bem-vindo ao Ichiraku!" description="O melhor ramen da Aldeia da Folha." />
                 <Loader2 className="h-8 w-8 animate-spin mt-6" />
                {!isLoading && !userProfile && (
                     <div className="mt-6">
                        <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para visitar o Ichiraku." />
                        <Button asChild className="mt-6">
                          <Link href="/create-character">Criar Personagem</Link>
                        </Button>
                    </div>
                )}
            </div>
        );
    }
    
    const { maxHealth, maxChakra } = calculatedStats;
    const currentHealth = Math.min(userProfile.current_health ?? maxHealth, maxHealth);
    const currentChakra = Math.min(userProfile.current_chakra ?? maxChakra, maxChakra);

    return (
        <div>
            <PageHeader
                title="Ichiraku Ramen"
                description="O melhor ramen da Aldeia da Folha. Compre itens para recuperar suas energias mais tarde!"
            />

            <Card className="mt-8 mb-8 max-w-4xl mx-auto">
                 <CardHeader>
                    <CardTitle className='text-center'>Status Atual</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                     <div className="w-full">
                        <div className="mb-1 flex items-baseline justify-between text-sm">
                          <span className="font-medium flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /> Vida</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(currentHealth)} / {Math.round(maxHealth)}
                          </span>
                        </div>
                        <Progress value={(currentHealth / maxHealth) * 100} className="h-4 [&>div]:bg-red-500" />
                      </div>
                     <div className="w-full">
                        <div className="mb-1 flex items-baseline justify-between text-sm">
                          <span className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500" /> Chakra</span>
                          <span className="text-xs text-muted-foreground">
                             {Math.round(currentChakra)} / {Math.round(maxChakra)}
                          </span>
                        </div>
                        <Progress value={(currentChakra / maxChakra) * 100} className="h-4 [&>div]:bg-blue-500" />
                      </div>
                      <div className="flex items-center justify-center gap-2 border rounded-md p-3">
                           <Coins className="h-6 w-6 text-yellow-400" />
                           <span className='text-xl font-bold'>{userProfile.ryo.toLocaleString()}</span>
                           <span className='text-lg'>Ryo</span>
                      </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ichirakuMenu.map((item) => (
                    <ItemCard key={item.id} item={item} onBuy={handleBuyItem} userProfile={userProfile} />
                ))}
            </div>
        </div>
    );
}
    