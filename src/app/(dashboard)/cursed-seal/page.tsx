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
import { Loader2, ShieldQuestion, AlertCircle, Sparkles, BookOpen, Lock, Coins } from 'lucide-react';
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
const OBTAIN_COST = 10000; // 💰 Custo para obter Nível 1
const UPGRADE_COST = 30000; // 💰 Custo para evoluir para Nível 2
const OBTAIN_ELEMENT_REQ = 15;
const UPGRADE_ELEMENT_REQ = 30;

// 🆕 URLs DAS IMAGENS DOS SELOS
const SEAL_IMAGES = {
  level1: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Selo/selo1.png',
  level2: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Selo/selo3%20.png',
};


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

  const sealData = userProfile?.cursed_seal || {};
  const { level: sealLevel = 0, isActive: isSealActive = false, activationTime, cooldownUntil } = sealData;
  
  // ✅ USAR A FUNÇÃO DE NORMALIZAÇÃO AQUI
  const elementLevels = normalizeElementLevels(userProfile?.element_levels);
  const totalElementLevel = Object.values(elementLevels).reduce((sum: number, level: number) => sum + level, 0);
  
  // 💰 Ryous do usuário
  const userRyous = userProfile?.ryo || 0;

  // ✅ Verificações de requisitos
  const meetsObtainLevelReq = userProfile && userProfile.level >= OBTAIN_LEVEL_REQ;
  const meetsObtainElementReq = totalElementLevel >= OBTAIN_ELEMENT_REQ;
  const meetsObtainRyousReq = userRyous >= OBTAIN_COST;
  const canAttemptObtain = meetsObtainLevelReq && meetsObtainElementReq && meetsObtainRyousReq;

  const meetsUpgradeElementReq = totalElementLevel >= UPGRADE_ELEMENT_REQ;
  const meetsUpgradeRyousReq = userRyous >= UPGRADE_COST;
  const canAttemptUpgrade = userProfile && sealLevel === 1 && meetsUpgradeElementReq && meetsUpgradeRyousReq;

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
      // ✅ Sucesso - conceder selo e descontar ryous
      updateDocumentNonBlocking(userProfileRef, {
        cursed_seal: {
          level: 1,
          isActive: false,
          activationTime: null,
          cooldownUntil: null,
        },
        ryo: userRyous - OBTAIN_COST,
      }, supabase);
      toast({
        title: 'Você sobreviveu!',
        description: `O poder do Selo Amaldiçoado agora corre em você. ${OBTAIN_COST.toLocaleString()} ryous foram gastos.`,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      // ❌ Falha - descontar ryous e quase morrer
      updateDocumentNonBlocking(userProfileRef, {
        current_health: 1,
        ryo: userRyous - OBTAIN_COST,
      }, supabase);
      toast({
        variant: 'destructive',
        title: 'Você foi rejeitado!',
        description: `O poder era grande demais. Você quase morreu e perdeu ${OBTAIN_COST.toLocaleString()} ryous.`,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };
  
  const handleUpgradeSeal = () => {
      if (!userProfileRef || !userProfile || !canAttemptUpgrade || !supabase) return;

      if (Math.random() <= 0.25) {
        // ✅ Sucesso - evoluir selo e descontar ryous
        updateDocumentNonBlocking(userProfileRef, {
          cursed_seal: {
            ...userProfile.cursed_seal,
            level: 2,
            isActive: false,
            activationTime: null,
          },
          ryo: userRyous - UPGRADE_COST,
        }, supabase);
        toast({
          title: 'Evolução Completa!',
          description: `Seu Selo Amaldiçoado atingiu o segundo estágio. ${UPGRADE_COST.toLocaleString()} ryous foram gastos.`,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // ❌ Falha - descontar ryous e quase morrer
        updateDocumentNonBlocking(userProfileRef, {
          current_health: 1,
          ryo: userRyous - UPGRADE_COST,
        }, supabase);
        toast({
          variant: 'destructive',
          title: 'A Evolução Falhou!',
          description: `Seu corpo não suportou. Você quase morreu e perdeu ${UPGRADE_COST.toLocaleString()} ryous.`,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
             <div className="text-center pt-2 space-y-1">
                <p className="font-semibold text-lg flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Nível Elemental Total: <span className="text-primary">{totalElementLevel}</span>
                </p>
                <p className="font-semibold text-lg flex items-center justify-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    Ryous Disponíveis: <span className="text-yellow-500">{userRyous.toLocaleString()}</span>
                </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 🆕 SEMPRE MOSTRAR OS DOIS NÍVEIS DE SELO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NÍVEL 1 */}
                <Card className={cn(
                  "relative",
                  sealLevel >= 1 ? 'border-primary' : 'border-muted'
                )}>
                    {/* 🔒 OVERLAY DE BLOQUEIO PARA NÍVEL 1 */}
                    {sealLevel === 0 && !canAttemptObtain && (
                       <div className="absolute inset-0 bg-black/70 rounded-lg z-10 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                            <Lock className="h-12 w-12 text-red-500 mb-3" />
                            <p className="text-white font-bold text-sm mb-2">BLOQUEADO</p>
                            <div className="space-y-1 text-xs">
                              {!meetsObtainLevelReq && <p className="text-red-300">❌ Nível {OBTAIN_LEVEL_REQ} necessário</p>}
                              {!meetsObtainElementReq && <p className="text-red-300">❌ Nível Elemental {OBTAIN_ELEMENT_REQ} necessário</p>}
                              {!meetsObtainRyousReq && <p className="text-red-300">❌ {OBTAIN_COST.toLocaleString()} ryous necessários</p>}
                            </div>
                       </div>
                    )}
                    
                    <CardHeader>
                        {/* 🆕 IMAGEM DO SELO NÍVEL 1 */}
                        <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                            <img 
                                src={SEAL_IMAGES.level1} 
                                alt="Selo Amaldiçoado Nível 1"
                                className={cn(
                                  "w-full h-full object-contain transition-all",
                                  sealLevel === 0 && !canAttemptObtain && "opacity-30 grayscale"
                                )}
                            />
                        </div>
                        <CardTitle className="text-xl text-center">
                          Nível 1
                          {sealLevel >= 1 && <span className="ml-2 text-sm text-green-500">✓ OBTIDO</span>}
                        </CardTitle>
                        <CardDescription className="text-center">
                          O primeiro estágio do selo.
                          <p className="text-yellow-500 font-semibold mt-1 flex items-center justify-center gap-1">
                            <Coins className="h-4 w-4" />
                            Custo: {OBTAIN_COST.toLocaleString()} ryous
                          </p>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <StatChange label="Ninjutsu" value="+20%" />
                        <StatChange label="Taijutsu" value="+20%" />
                        <StatChange label="Selo" value="+15%" />
                        <StatChange label="Vida Máxima" value="-15%" positive={false} />
                        <div className="pt-2 border-t mt-3 space-y-1 text-xs">
                          <p className="font-semibold text-muted-foreground">Requisitos:</p>
                          <p className={meetsObtainLevelReq ? "text-green-500" : "text-red-500"}>
                            {meetsObtainLevelReq ? "✓" : "✗"} Nível {OBTAIN_LEVEL_REQ}
                          </p>
                          <p className={meetsObtainElementReq ? "text-green-500" : "text-red-500"}>
                            {meetsObtainElementReq ? "✓" : "✗"} Nível Elemental {OBTAIN_ELEMENT_REQ}
                          </p>
                          <p className={meetsObtainRyousReq ? "text-green-500" : "text-red-500"}>
                            {meetsObtainRyousReq ? "✓" : "✗"} {OBTAIN_COST.toLocaleString()} ryous
                          </p>
                        </div>
                    </CardContent>
                    {sealLevel === 0 && canAttemptObtain && (
                      <CardFooter>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Buscar o Selo (25% chance)
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é extremamente perigosa. Você gastará {OBTAIN_COST.toLocaleString()} ryous e terá apenas 25% de chance de sucesso. Se falhar, você ficará à beira da morte e perderá os ryous. Deseja continuar?
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
                      </CardFooter>
                    )}
                </Card>

                {/* NÍVEL 2 */}
                <Card className={cn(
                  "relative", 
                  sealLevel >= 2 ? 'border-purple-500' : 'border-muted'
                )}>
                    {/* 🔒 OVERLAY DE BLOQUEIO PARA NÍVEL 2 */}
                    {sealLevel < 2 && (!canAttemptUpgrade || sealLevel === 0) && (
                       <div className="absolute inset-0 bg-black/70 rounded-lg z-10 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                            <Lock className="h-12 w-12 text-purple-500 mb-3" />
                            <p className="text-white font-bold text-sm mb-2">BLOQUEADO</p>
                            <div className="space-y-1 text-xs">
                              {sealLevel === 0 && <p className="text-purple-300">❌ Obtenha o Nível 1 primeiro</p>}
                              {sealLevel === 1 && !meetsUpgradeElementReq && <p className="text-red-300">❌ Nível Elemental {UPGRADE_ELEMENT_REQ} necessário</p>}
                              {sealLevel === 1 && !meetsUpgradeRyousReq && <p className="text-red-300">❌ {UPGRADE_COST.toLocaleString()} ryous necessários</p>}
                            </div>
                       </div>
                    )}
                    
                    <CardHeader>
                        {/* 🆕 IMAGEM DO SELO NÍVEL 2 */}
                        <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                            <img 
                                src={SEAL_IMAGES.level2} 
                                alt="Selo Amaldiçoado Nível 2"
                                className={cn(
                                  "w-full h-full object-contain transition-all",
                                  (sealLevel < 2 && (!canAttemptUpgrade || sealLevel === 0)) && "opacity-30 grayscale"
                                )}
                            />
                        </div>
                        <CardTitle className="text-xl text-center">
                          Nível 2
                          {sealLevel >= 2 && <span className="ml-2 text-sm text-purple-500">✓ OBTIDO</span>}
                        </CardTitle>
                        <CardDescription className="text-center">
                          A transformação completa.
                          <p className="text-yellow-500 font-semibold mt-1 flex items-center justify-center gap-1">
                            <Coins className="h-4 w-4" />
                            Custo: {UPGRADE_COST.toLocaleString()} ryous
                          </p>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         <StatChange label="Ninjutsu" value="+40%" />
                        <StatChange label="Taijutsu" value="+40%" />
                        <StatChange label="Selo" value="+30%" />
                        <StatChange label="Vida Máxima" value="-30%" positive={false}/>
                        <div className="pt-2 border-t mt-3 space-y-1 text-xs">
                          <p className="font-semibold text-muted-foreground">Requisitos:</p>
                          <p className={sealLevel >= 1 ? "text-green-500" : "text-red-500"}>
                            {sealLevel >= 1 ? "✓" : "✗"} Selo Nível 1
                          </p>
                          <p className={meetsUpgradeElementReq ? "text-green-500" : "text-red-500"}>
                            {meetsUpgradeElementReq ? "✓" : "✗"} Nível Elemental {UPGRADE_ELEMENT_REQ}
                          </p>
                          <p className={meetsUpgradeRyousReq ? "text-green-500" : "text-red-500"}>
                            {meetsUpgradeRyousReq ? "✓" : "✗"} {UPGRADE_COST.toLocaleString()} ryous
                          </p>
                        </div>
                    </CardContent>
                    {sealLevel === 1 && canAttemptUpgrade && (
                      <CardFooter>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="secondary" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isSealActive}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              {isSealActive ? 'Desative o selo para evoluir' : 'Forçar Evolução (25% chance)'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Evolução Perigosa</AlertDialogTitle>
                              <AlertDialogDescription>
                               Forçar a evolução para o Nível 2 custará {UPGRADE_COST.toLocaleString()} ryous e tem apenas 25% de chance de sucesso. Se falhar, seu corpo pode não aguentar o poder e você ficará à beira da morte, perdendo os ryous. Deseja prosseguir?
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
                      </CardFooter>
                    )}
                </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}