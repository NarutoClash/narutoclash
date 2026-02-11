'use client';
   
   export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/common/page-header';
import { elementImages } from '@/lib/element-images';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Wind, Zap, Mountain, Waves, ScrollText, GraduationCap, Lock, Sparkles, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabase, useMemoSupabase, useCollection } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { usePremiumStatus } from '@/hooks/use-premium-status';
import { getMaxJutsusPerElement, getLockedJutsus, MAX_JUTSUS_FREE, MAX_JUTSUS_PREMIUM } from '@/lib/jutsu-limits';
import type { Jutsu } from '@/lib/jutsus-data';
import { defaultJutsuImage } from '@/lib/jutsus-data';

const elementData: { name: string; icon: LucideIcon }[] = [
  { name: 'Katon', icon: Flame },
  { name: 'Futon', icon: Wind },
  { name: 'Raiton', icon: Zap },
  { name: 'Doton', icon: Mountain },
  { name: 'Suiton', icon: Waves },
];

// ✅ FUNÇÃO PARA NORMALIZAR ELEMENT_LEVELS DO BANCO DE DADOS
const normalizeElementLevels = (elementLevels: any): Record<string, number> => {
  if (!elementLevels || typeof elementLevels !== 'object') return {};
  
  const normalized: Record<string, number> = {};
  
  Object.entries(elementLevels).forEach(([element, value]) => {
    if (typeof value === 'object' && value !== null && 'level' in value) {
      // ✅ Se for objeto com propriedade 'level', extrair o número
      normalized[element] = Number((value as any).level) || 0;
    } else if (typeof value === 'number') {
      // ✅ Se já for número, usar diretamente
      normalized[element] = value;
    } else {
      // ✅ Caso contrário, usar 0
      normalized[element] = 0;
    }
  });
  
  return normalized;
};

const getLevelFromXp = (xp: number, maxLevel: number, baseCost = 100, factor = 1.5) => {
  let level = 0;
  let requiredXp = 0;
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

const getXpForLevel = (targetLevel: number, baseCost = 100, factor = 1.5) => {
  let totalXp = 0;
  for (let i = 0; i < targetLevel; i++) {
    totalXp += Math.floor(baseCost * Math.pow(factor, i));
  }
  return totalXp;
};

const getXpForNextLevel = (level: number, baseCost = 100, factor = 1.5) => {
  let totalXpForNextLevel = 0;
  for (let i = 0; i <= level; i++) {
    totalXpForNextLevel += Math.floor(baseCost * Math.pow(factor, i));
  }
  return totalXpForNextLevel;
};

export default function ElementsPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const { isActive: isPremium } = usePremiumStatus(supabase, user?.id);

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);

  const { data: userProfile, isLoading } = useDoc(userProfileRef);

  const jutsusQuery = useMemoSupabase(() => {
    return {
      table: 'jutsus',
      query: (builder: any) => builder.select('*').order('element').order('required_level')
    };
  }, []);

  const { data: jutsusFromDB, isLoading: isLoadingJutsus } = useCollection(jutsusQuery);

  const allJutsus: Jutsu[] = (jutsusFromDB || []).map((jutsu: any) => ({
    id: jutsu.id,
    name: jutsu.name,
    element: jutsu.element,
    requiredLevel: jutsu.required_level,
    imageUrl: jutsu.image_url || defaultJutsuImage,
    description: jutsu.description,
  }));

  const elementExperience = userProfile?.element_experience || {};
  const jutsuExperience = userProfile?.jutsu_experience || {};

  const handleLearnJutsu = async (jutsuName: string, element: string) => {
    if (!userProfileRef || !supabase) return;
    
    const currentJutsuLevel = userProfile?.jutsus?.[jutsuName] || 0;
  
    if (currentJutsuLevel !== 0) return;
    
    const elementJutsus = Object.entries(userProfile?.jutsus || {})
      .filter(([name, level]) => {
        const jutsuData = allJutsus.find(j => j.name === name);
        return jutsuData?.element === element && (level as number) > 0;
      });
    
    const maxJutsus = getMaxJutsusPerElement(isPremium);
    
    if (elementJutsus.length >= maxJutsus) {
      toast({
        variant: "destructive",
        title: "Limite Atingido",
        description: isPremium 
          ? `Você já tem ${MAX_JUTSUS_PREMIUM} jutsus de ${element}.`
          : `Você atingiu o limite de ${MAX_JUTSUS_FREE} jutsus. Adquira Premium para desbloquear mais!`,
      });
      return;
    }
  
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          jutsus: {
            ...(userProfile?.jutsus || {}),
            [jutsuName]: 1,
          },
          jutsu_experience: {
            ...(userProfile?.jutsu_experience || {}),
            [jutsuName]: 0,
          },
        })
        .eq('id', userProfileRef.id);
  
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao aprender jutsu",
          description: error.message,
        });
      } else {
        toast({
          title: "Jutsu Aprendido!",
          description: `Você aprendeu ${jutsuName}!`,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('🔴 Erro:', error);
    }
  };

  if (isLoading || isLoadingJutsus) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
        <PageHeader title="Carregando..." description="Verificando seus elementos e jutsus." />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para aprender elementos e jutsus." />
        <Button asChild className="mt-6">
          <Link href="/create-character">Criar Personagem</Link>
        </Button>
      </div>
    );
  }
  
  // ✅ USAR A FUNÇÃO DE NORMALIZAÇÃO AQUI
  const elementLevels = normalizeElementLevels(userProfile?.element_levels);
  
  const learnedJutsus = allJutsus.filter(jutsu => {
    const level = elementLevels[jutsu.element] || 0;
    return level >= jutsu.requiredLevel;
  });
  
  const userJutsus = userProfile?.jutsus || {};

  return (
    <div>
      <PageHeader title="Elementos e Jutsus" description="Treine seus elementos e jutsus para aumentar seu poder." />
      
      <div className="my-6 flex flex-col items-center gap-4">
        <p className="text-lg">Aumente o nível dos seus elementos através de missões. Os jutsus sobem de nível automaticamente ao ganhar XP nas missões.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {elementData.map((element) => {
          const currentXp = elementExperience[element.name] || 0;
          const level = elementLevels[element.name] || 0;
          const xpForNextLevel = getXpForNextLevel(level);
          const xpForCurrentLevel = level > 0 ? getXpForNextLevel(level - 1) : 0;
          const progress = level >= 10 ? 100 : ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
          
          const finalAdjustments = {
            Katon: { x: 0, y: 0, scale: 2.1 },
            Futon: { x: -9, y: -2, scale: 1.95 },
            Raiton: { x: 6, y: 0, scale: 2.3 },
            Doton: { x: 0, y: 0, scale: 2.1 },
            Suiton: { x: 4, y: 1, scale: 1.85 },
          };
          
          const adj = finalAdjustments[element.name as keyof typeof finalAdjustments];
            
          return (
            <div key={element.name} className="space-y-2">
              <Card className={cn('flex flex-col text-center transition-all', level > 0 ? 'border-primary shadow-lg' : '')}>
                <CardHeader className="flex flex-col items-center gap-4 pt-8">
                  <div className="w-28 h-28 rounded-full border-4 border-primary/30 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40 p-4 shrink-0 overflow-hidden">
                    <div 
                      className="relative w-full h-full"
                      style={{
                        transform: `translate(${adj.x}px, ${adj.y}px) scale(${adj.scale})`,
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <Image 
                        src={elementImages[element.name as keyof typeof elementImages]} 
                        alt={element.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold">{element.name}</CardTitle>
                    <p className="font-bold text-lg">Nível: {level}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-end flex-grow items-center gap-4 pb-6">
                  <div className="w-full px-4">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground mt-1">XP: {currentXp} / {level >= 10 ? 'MAX' : xpForNextLevel}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      
      {learnedJutsus.length > 0 && (
        <>
          <Separator className="my-8" />
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Jutsus Desbloqueados</h2>
            <p className="text-muted-foreground">Aprenda novos jutsus e eles subirão de nível automaticamente conforme você completa missões.</p>
          </div>
          
          {elementData.map(element => {
            const elementJutsus = learnedJutsus.filter(j => j.element === element.name);
            if (elementJutsus.length === 0) return null;
            
            return (
              <div key={element.name} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <element.icon className="h-6 w-6 text-primary" />
                  {element.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elementJutsus.map(jutsu => {
                    const currentXp = jutsuExperience[jutsu.name] || 0;
                    let level = userJutsus[jutsu.name] || 0;
                    
                    const lockedJutsus = getLockedJutsus(userProfile?.jutsus || {}, jutsu.element, isPremium);
                    const isLocked = lockedJutsus.includes(jutsu.name);
                    
                    const xpForNextLevel = getXpForNextLevel(level, 120, 1.4);
                    const xpForCurrentLevel = level > 0 ? getXpForNextLevel(level - 1, 120, 1.4) : 0;
                    
                    let progress = 0;
                    if (level >= 25) {
                      progress = 100;
                    } else if (level > 0) {
                      progress = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
                    }
                    
                    return (
                      <Card key={jutsu.name} className={cn(
                        "p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-lg",
                        isLocked && "opacity-50 border-destructive"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40 flex-shrink-0 border-2 border-primary/30 p-1">
                            <div className="relative w-full h-full">
                              <Image 
                                src={jutsu.imageUrl} 
                                alt={jutsu.name}
                                fill
                                className="object-contain drop-shadow-lg"
                                unoptimized
                              />
                            </div>
                            {level > 0 && (
                              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold border-2 border-background">
                                {level}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{jutsu.name}</p>
                            {jutsu.description && (
                              <p className="text-xs text-muted-foreground">{jutsu.description}</p>
                            )}
                          </div>
                          
                          {isLocked && (
                            <div className="flex items-center gap-1 text-destructive">
                              <Lock className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        {level > 0 ? (
                          isLocked ? (
                            <div className="text-xs text-center text-destructive font-semibold">
                              🔒 Jutsu bloqueado. Adquira Premium para desbloquear!
                            </div>
                          ) : (
                            <div className="w-full">
                              <Progress value={progress} />
                              <p className="text-xs text-muted-foreground mt-1">XP: {currentXp} / {level >= 25 ? 'MAX' : xpForNextLevel}</p>
                            </div>
                          )
                        ) : (
                          <Button onClick={() => handleLearnJutsu(jutsu.name, jutsu.element)} className="w-full">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Aprender
                          </Button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}