'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Loader2, Coins, CheckCircle, Grip, Trash2, Shirt, Footprints, Hand, Accessibility } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { equipmentsData, type Equipment } from '@/lib/equipments-data';
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
import { Separator } from '@/components/ui/separator';


const StatBuff = ({ label, value }: { label: string; value: number }) => {
    if (value === 0) return null;
    const isBuff = value > 0;
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn("font-semibold", isBuff ? "text-green-400" : "text-red-500")}>
                {isBuff ? '+' : ''}{value}
            </span>
        </div>
    );
};

const EquipmentCard = ({
    item,
    userProfile,
    onBuy,
    onEquip,
    onSell,
    isEquipped,
    isOwned,
}: {
    item: Equipment;
    userProfile: any;
    onBuy: (item: Equipment) => void;
    onEquip: (item: Equipment) => void;
    onSell: (item: Equipment) => void;
    isEquipped: boolean;
    isOwned: boolean;
}) => {
    const canAfford = userProfile.ryo >= item.price;
    const canUse = userProfile.level >= item.requiredLevel;

    return (
        <Card className={cn("flex flex-col relative", isEquipped && "border-primary ring-2 ring-primary")}>
             {!canUse && !isOwned && (
                <div className="absolute inset-0 bg-red-900/40 rounded-lg z-10 flex items-center justify-center">
                    <p className="text-white font-bold text-lg">Requer Nível {item.requiredLevel}</p>
                </div>
            )}
            <CardHeader>
                <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden bg-muted">
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Atributos</h4>
                    {Object.entries(item.buffs).map(([stat, value]) => (
                        <StatBuff key={stat} label={stat.charAt(0).toUpperCase() + stat.slice(1)} value={value} />
                    ))}
                 </div>
                 <div className="space-y-1">
                     <h4 className="font-semibold text-sm">Requisitos</h4>
                     <p className="text-sm text-muted-foreground">Nível: {item.requiredLevel}</p>
                 </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                 {isOwned ? (
                    <>
                        <Button className="w-full" onClick={() => onEquip(item)} disabled={isEquipped}>
                            {isEquipped ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Equipado
                                </>
                            ) : (
                                <>
                                    <Grip className="mr-2 h-4 w-4" />
                                    Equipar
                                </>
                            )}
                        </Button>
                        <div className="w-full space-y-2">
                            <p className="text-sm text-center text-muted-foreground">
                                Valor de venda: <span className="font-semibold text-foreground">{(item.price / 2).toLocaleString()} Ryo</span>
                            </p>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button variant="outline" size="sm" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Vender
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Vender {item.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Você receberá 50% do valor de volta. O item será removido do seu inventário.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onSell(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Confirmar Venda
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </>
                 ) : (
                    <div className="w-full space-y-2">
                        {!canUse ? (
                            <p className="text-sm text-center text-destructive font-semibold">
                                Requer Nível {item.requiredLevel}
                            </p>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground">
                                Preço: <span className="font-semibold text-foreground">{item.price.toLocaleString()} Ryo</span>
                            </p>
                        )}
                        <Button className="w-full" onClick={() => onBuy(item)} disabled={!canAfford || !canUse}>
                            <Coins className="mr-2 h-4 w-4" />
                            {canAfford || !canUse ? 'Comprar' : 'Ryo Insuficiente'}
                        </Button>
                    </div>
                 )}
            </CardFooter>
        </Card>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
    <div className="my-8">
        <Separator />
        <h2 className="mt-8 text-2xl font-bold flex items-center gap-2 justify-center">
            <Icon className="h-6 w-6 text-primary" />
            {title}
        </h2>
    </div>
);


export default function EquipamentosPage() {
    const { user, supabase } = useSupabase();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const userProfileRef = useMemoSupabase(() => {
        if (!user) return null;
        return { table: 'profiles', id: user.id };
    }, [user]);

    const { data: userProfile, isLoading } = useDoc(userProfileRef);

    const typeToFieldMap = {
        'Peito': 'chest_id',
        'Pernas': 'legs_id',
        'Pés': 'feet_id',
        'Mãos': 'hands_id',
    };

    const handleBuyItem = async (item: Equipment) => {
        if (!userProfileRef || !userProfile || !supabase || isProcessing) return;

        if (userProfile.ryo < item.price) {
            toast({ variant: "destructive", title: "Ryo Insuficiente!" });
            return;
        }

        setIsProcessing(true);

        try {
            const currentOwnedIds = userProfile.ownedEquipmentIds || [];
            const updatePayload: any = {
                ryo: (userProfile.ryo || 0) - item.price,
                ownedEquipmentIds: [...currentOwnedIds, item.id]
            };
            
            const fieldToUpdate = typeToFieldMap[item.type];
            if (fieldToUpdate) {
                updatePayload[fieldToUpdate] = item.id;
            }

            await updateDocumentNonBlocking(userProfileRef, updatePayload, supabase);
            
            toast({ title: "Compra realizada!", description: `${item.name} foi comprado e equipado.` });

            // Reload após 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao comprar item" });
            setIsProcessing(false);
        }
    };

    const handleEquipItem = async (item: Equipment) => {
        if (!userProfileRef || !supabase || isProcessing) return;
        
        setIsProcessing(true);

        try {
            const updatePayload: any = {};
            const fieldToUpdate = typeToFieldMap[item.type];
            if(fieldToUpdate) {
                updatePayload[fieldToUpdate] = item.id;
            }
            
            await updateDocumentNonBlocking(userProfileRef, updatePayload, supabase);
            
            toast({ title: 'Equipamento Alterado!', description: `Você equipou ${item.name}.` });

            // Reload após 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao equipar item" });
            setIsProcessing(false);
        }
    };

    const handleSellItem = async (item: Equipment) => {
        if (!userProfileRef || !userProfile || !supabase || isProcessing) return;

        setIsProcessing(true);

        try {
            const sellPrice = Math.floor(item.price / 2);
            const currentOwnedIds = userProfile.ownedEquipmentIds || [];
            const updatePayload: any = {
                ryo: (userProfile.ryo || 0) + sellPrice,
                ownedEquipmentIds: currentOwnedIds.filter((id: string) => id !== item.id)
            };
            
            const fieldToUpdate = typeToFieldMap[item.type];
            if (fieldToUpdate) {
                const currentlyEquippedId = userProfile[fieldToUpdate];
                if (currentlyEquippedId === item.id) {
                    updatePayload[fieldToUpdate] = null;
                }
            }

            await updateDocumentNonBlocking(userProfileRef, updatePayload, supabase);
            
            toast({ title: "Item Vendido!", description: `${item.name} foi vendido por ${sellPrice} Ryo.` });

            // Reload após 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao vender item" });
            setIsProcessing(false);
        }
    };
    
    const equipmentCategories: { name: 'Peito' | 'Pernas' | 'Pés' | 'Mãos', icon: React.ElementType }[] = [
        { name: 'Peito', icon: Shirt },
        { name: 'Pernas', icon: Accessibility },
        { name: 'Pés', icon: Footprints },
        { name: 'Mãos', icon: Hand },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <PageHeader title="Carregando Arsenal..." description="Polindo as armaduras..." />
                <Loader2 className="h-8 w-8 animate-spin mt-6" />
            </div>
        );
    }
     
    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para vestir uma armadura." />
                <Button asChild className="mt-6">
                    <Link href="/create-character">Criar Personagem</Link>
                </Button>
            </div>
        );
    }

    const ownedIds = userProfile.ownedEquipmentIds || [];

    return (
        <div>
            <PageHeader
                title="Arsenal Shinobi"
                description="Compre e equipe armaduras para fortalecer seu personagem em batalha."
            />
            
            <div className="my-8 flex justify-center">
                <Card className='p-4 text-center'>
                    <CardTitle>Seus Recursos</CardTitle>
                    <div className='flex gap-4 mt-2'>
                        <p>Ryo: {userProfile.ryo?.toLocaleString() || 0}</p>
                        <p>Nível: {userProfile.level}</p>
                    </div>
                </Card>
            </div>
            
            {equipmentCategories.map(category => (
                <div key={category.name}>
                    <SectionHeader title={category.name} icon={category.icon} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {equipmentsData.filter(e => e.type === category.name).map((item) => {
                            const fieldName = typeToFieldMap[item.type];
                            const equippedItemId = fieldName ? userProfile[fieldName] : null;
                            const isOwned = ownedIds.includes(item.id);
                            
                            return (
                                <EquipmentCard
                                    key={item.id}
                                    item={item}
                                    userProfile={userProfile}
                                    onBuy={handleBuyItem}
                                    onEquip={handleEquipItem}
                                    onSell={handleSellItem}
                                    isEquipped={equippedItemId === item.id}
                                    isOwned={isOwned}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
