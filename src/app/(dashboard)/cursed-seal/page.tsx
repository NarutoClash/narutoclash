'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Loader2, ShieldQuestion, Zap, ShieldOff, Shield, AlertCircle, Sparkles, Hourglass, RefreshCw, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { cn } from '@/lib/utils';
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


const StatChange = ({ label, value, positive = true }: { label: string, value: string, positive?: boolean }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold", positive ? "text-green-400" : "text-red-500")}>{value}</span>
    </div>
);

const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

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

const SEAL_DURATION = 30 * 60 * 1000; // 30 minutes
const SEAL_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const OBTAIN_LEVEL_REQ = 30;
const OBTAIN_ELEMENT_REQ = 15;
const UPGRADE_ELEMENT_REQ = 30;


export default function CursedSealPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState('');

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);

  const { data: userProfile, isLoading: isUserLoading } = useDoc(userProfileRef);

  const sealData = userProfile?.cursedSeal || {};
  const { level: sealLevel = 0, isActive: isSealActive = false, activationTime, cooldownUntil } = sealData;
  
  // ✅ USAR A FUNÇÃO DE NORMALIZAÇÃO AQUI
  const elementLevels = normalizeElementLevels(userProfile?.element_levels);
  const totalElementLevel = Object.values(elementLevels).reduce((sum: number, level: number) => sum + level, 0);

  const canAttemptObtain = userProfile && userProfile.level >= OBTAIN_LEVEL_REQ && totalElementLevel >= OBTAIN_ELEMENT_REQ;
  const canAttemptUpgrade = userProfile && sealLevel === 1 && totalElementLevel >= UPGRADE_ELEMENT_REQ;

  useEffect(() => {
    if (!sealData) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Handle active seal duration
      if (isSealActive && activationTime) {
        const elapsed = now - activationTime;
        const remaining = SEAL_DURATION - elapsed;

        if (remaining <= 0) {
          setTimeRemaining('');
        } else {
          setTimeRemaining(formatTime(remaining));
        }
      } else {
        setTimeRemaining('');
      }

      // Handle cooldown
      if (cooldownUntil && now < cooldownUntil) {
        const remaining = cooldownUntil - now;
        setCooldownRemaining(formatTime(remaining));
      } else {
        setCooldownRemaining('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSealActive, activationTime, cooldownUntil, sealData]);


  const handleObtainSeal = () => {
    if (!userProfileRef || !userProfile || !canAttemptObtain || !supabase) return;

    if (Math.random() <= 0.25) {
      updateDocumentNonBlocking(userProfileRef, {
        cursedSeal: {
          level: 1,
          isActive: false,
          activationTime: null,
          cooldownUntil: null,
        },
      }, supabase);
      toast({
        title: 'Você sobreviveu!',
        description: 'O poder do Selo Amaldiçoado agora corre em você. Use-o com sabedoria.',
      });
    } else {
      updateDocumentNonBlocking(userProfileRef, {
        currentHealth: 1,
      }, supabase);
      toast({
        variant: 'destructive',
        title: 'Você foi rejeitado!',
        description: 'O poder era grande demais. Seu corpo cedeu e você quase morreu.',
      });
    }
  };
  
  const handleUpgradeSeal = () => {
      if (!userProfileRef || !userProfile || !canAttemptUpgrade || !supabase) return;

       if (Math.random() <= 0.50) {
            updateDocumentNonBlocking(userProfileRef, {
                cursedSeal: {
                  ...userProfile.cursedSeal,
                  level: 2,
                  isActive: false,
                  activationTime: null,
                },
            }, supabase);
            toast({
                title: 'Evolução Completa!',
                description: 'Seu Selo Amaldiçoado atingiu o segundo estágio.',
            });
       } else {
            updateDocumentNonBlocking(userProfileRef, {
                currentHealth: 1,
            }, supabase);
            toast({
                variant: 'destructive',
                title: 'A Evolução Falhou!',
                description: 'Seu corpo não suportou a transformação. Você está à beira da morte.',
            });
       }
  }


  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Carregando..." description="Verificando a marca em sua alma." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para buscar tamanho poder." />
        <Button asChild className="mt-6">
          <Link href="/create-character">Criar Personagem</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Selo Amaldiçoado"
        description="Um poder perigoso que concede grande força a um custo terrível."
      />
      
      <div className="mt-8 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShieldQuestion className="h-6 w-6"/>
                Status do Selo
            </CardTitle>
            <CardDescription>
                {sealLevel === 0 
                    ? "Você não possui o selo amaldiçoado." 
                    : `Você possui o Selo Amaldiçoado Nível ${sealLevel}. Estado: ${isSealActive ? `ATIVO (${timeRemaining})` : 'INATIVO'}`
                }
                 {cooldownRemaining && <p className="text-amber-400 font-semibold mt-2">Pode ativar novamente em: {cooldownRemaining}</p>}
            </CardDescription>
             <div className="text-center pt-2">
                <p className="font-semibold text-lg flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Nível Elemental Total: <span className="text-primary">{totalElementLevel}</span>
                </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {sealLevel === 0 ? (
                <div className="text-center space-y-4 p-6 bg-muted/30 rounded-lg relative">
                     {!canAttemptObtain && (
                        <div className="absolute inset-0 bg-red-900/50 rounded-lg z-10 flex flex-col items-center justify-center text-center p-2">
                            {userProfile.level < OBTAIN_LEVEL_REQ && <p className="text-white font-bold text-lg">Requer Nível {OBTAIN_LEVEL_REQ}</p>}
                            {totalElementLevel < OBTAIN_ELEMENT_REQ && <p className="text-white font-bold text-lg">Requer Nível Elemental {OBTAIN_ELEMENT_REQ}</p>}
                        </div>
                    )}
                    <p className="font-semibold text-lg">Busque o Poder Proibido</p>
                    <p className="text-muted-foreground text-sm">Atenda aos requisitos de nível e poder elemental para tentar obter o selo. A chance de sucesso é baixa (25%), e a falha pode ser fatal.</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={!canAttemptObtain}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {canAttemptObtain ? 'Buscar o Selo Amaldiçoado' : 'Requisitos não atendidos'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é extremamente perigosa. Você está tentando obter um poder que pode destruir seu corpo. Se falhar, você ficará à beira da morte. Deseja continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Recuar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleObtainSeal} className={buttonVariants({variant: 'destructive'})}>
                            Arriscar Tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className={cn(sealLevel >= 1 ? 'border-primary' : '')}>
                        <CardHeader>
                            <CardTitle className="text-xl">Nível 1</CardTitle>
                            <CardDescription>O primeiro estágio do selo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <StatChange label="Ninjutsu" value="+20%" />
                            <StatChange label="Taijutsu" value="+20%" />
                            <StatChange label="Selo" value="+15%" />
                            <StatChange label="Vida Máxima" value="-15%" positive={false} />
                        </CardContent>
                    </Card>
                    <Card className={cn("relative", sealLevel >= 2 ? 'border-purple-500' : '')}>
                        {sealLevel === 1 && !canAttemptUpgrade && (
                           <div className="absolute inset-0 bg-red-900/50 rounded-lg z-10 flex flex-col items-center justify-center text-center p-2">
                                <p className="text-white font-bold text-lg">Requer Nível Elemental {UPGRADE_ELEMENT_REQ}</p>
                           </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-xl">Nível 2</CardTitle>
                            <CardDescription>A transformação completa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <StatChange label="Ninjutsu" value="+40%" />
                            <StatChange label="Taijutsu" value="+40%" />
                            <StatChange label="Selo" value="+30%" />
                            <StatChange label="Vida Máxima" value="-30%" positive={false}/>
                        </CardContent>
                    </Card>
                </div>
            )}
          </CardContent>
          {sealLevel === 1 && (
            <CardFooter className="flex-col gap-4">
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isSealActive || !canAttemptUpgrade}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isSealActive ? 'Desative o selo para evoluir' : !canAttemptUpgrade ? 'Requisitos não atendidos' : 'Forçar Evolução para Nível 2'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Evolução Perigosa</AlertDialogTitle>
                      <AlertDialogDescription>
                       Forçar a evolução para o Nível 2 é arriscado (50% de chance). Se falhar, seu corpo pode não aguentar o poder e você ficará à beira da morte. Deseja prosseguir?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Não, é muito arriscado</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUpgradeSeal} className={buttonVariants({variant: 'destructive'})}>
                        Evoluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                 <p className="text-xs text-muted-foreground">Requisito para evolução: Nível Elemental Total {UPGRADE_ELEMENT_REQ}</p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
