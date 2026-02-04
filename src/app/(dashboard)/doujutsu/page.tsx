'use client';

import { PageHeader } from '@/components/common/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { Loader2, Eye, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { cn } from '@/lib/utils';
import Image from 'next/image';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { doujutsuData, evolutionPaths, type DoujutsuType } from '@/lib/dojutsu-data';
import { doujutsuImages } from '@/lib/dojutsu-images';


const StatChange = ({ label, value, positive = true }: { label: string; value: string; positive?: boolean }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold", positive ? "text-green-400" : "text-red-500")}>{value}</span>
    </div>
);

const DoujutsuCard = ({ 
    type, 
    onChoose, 
    onEvolve,
    disabled, 
    userLevel, 
    userElementLevel,
    isObtained, 
    isCurrent,
    isNextEvolution,
}: { 
    type: DoujutsuType, 
    onChoose: (type: DoujutsuType) => void, 
    onEvolve: (type: DoujutsuType) => void,
    disabled: boolean, 
    userLevel: number, 
    userElementLevel: number,
    isObtained: boolean, 
    isCurrent: boolean,
    isNextEvolution: boolean,
}) => {
    const data = doujutsuData[type];
    const image = doujutsuImages[type];
    const isBase = data.type === 'base';

    const hasMetLevelRequirement = userLevel >= data.requiredLevel;
    const hasMetElementRequirement = userElementLevel >= data.requiredElementLevel;
    const hasMetAllRequirements = hasMetLevelRequirement && hasMetElementRequirement;

    const canChoose = isBase && hasMetAllRequirements && !isObtained;
    const canEvolve = isNextEvolution && hasMetAllRequirements;
    
    const showRequirementOverlay = !hasMetAllRequirements && !isObtained;

    const RequirementOverlay = () => (
         <div className="absolute inset-0 bg-red-900/50 rounded-lg z-10 flex flex-col items-center justify-center text-center p-2">
            {!hasMetLevelRequirement && <p className="text-white font-bold text-md">Requer Nível {data.requiredLevel}</p>}
            {!hasMetElementRequirement && <p className="text-white font-bold text-md">Requer Nível Elemental Total {data.requiredElementLevel}</p>}
        </div>
    );

    const cardContent = (
        <Card className={cn("flex flex-col h-full w-64 flex-shrink-0 relative", !isBase ? 'bg-muted/30 border-dashed' : 'border-primary/50', isObtained && 'border-primary border-2', isCurrent && 'ring-2 ring-primary shadow-lg')}>
            {showRequirementOverlay && <RequirementOverlay />}
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4 relative">
                    <img src={image.imageUrl} alt={data.name} width={80} height={80} className={cn("object-contain", !isBase && !isObtained && 'opacity-30')} />
                </div>
                <CardTitle>{data.name}</CardTitle>
                <CardDescription>{data.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className='space-y-1'>
                    <h4 className="font-semibold text-center text-sm mb-2">Requisitos</h4>
                    <p className='text-sm text-muted-foreground text-center'>Nível {data.requiredLevel} | Nível Elemental {data.requiredElementLevel}</p>
                 </div>
                 {data.stages && data.stages[1]?.buffs && (
                    <div className='space-y-1'>
                        <h4 className="font-semibold text-center text-sm mb-2">Bônus de Ativação</h4>
                        {Object.entries(data.stages[1].buffs).map(([stat, value]: [string, any]) => (
                             <StatChange key={stat} label={stat.charAt(0).toUpperCase() + stat.slice(1)} value={`+${Math.round(((value || 1) - 1) * 100)}%`} positive={((value || 1) - 1) >=0} />
                        ))}
                    </div>
                 )}
            </CardContent>
            <CardFooter>
                 {isBase && !isObtained ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button className="w-full" disabled={!canChoose || disabled}>
                                {!hasMetAllRequirements ? `Requisitos não atendidos` : `Despertar`}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Despertar?</AlertDialogTitle>
                              <AlertDialogDescription>
                               Esta escolha é permanente. Uma vez que você desperta um Dōjutsu, não poderá trocá-lo. Deseja despertar o {data.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onChoose(type)}>
                                Despertar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                    </AlertDialog>
                 ) : isNextEvolution ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full" disabled={!canEvolve}>
                                {!hasMetAllRequirements ? `Requisitos não atendidos` : `Evoluir`}
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Evolução?</AlertDialogTitle>
                              <AlertDialogDescription>
                               Seu poder ocular atingirá um novo patamar. Esta evolução é permanente. Deseja evoluir para o {data.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onEvolve(type)}>
                                Evoluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                    </AlertDialog>
                 ) : (
                    <Button className="w-full" variant={isCurrent ? 'default' : 'outline'} disabled>
                         {isCurrent ? "Seu Dōjutsu Atual" : isObtained ? "Estágio Anterior" : `Requisitos não atendidos`}
                    </Button>
                 )}
            </CardFooter>
        </Card>
    );

     if (!isBase && !isObtained) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {cardContent}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Este Dōjutsu só pode ser obtido através de evolução.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return cardContent;
}

export default function DoujutsuPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);

  const { data: userProfile, isLoading: isUserLoading } = useDoc(userProfileRef);

  const doujutsu = userProfile?.doujutsu;

  const handleChoosePath = (path: DoujutsuType) => {
    if (!userProfileRef || !userProfile || !supabase) return;
    
    const data = doujutsuData[path];
    const totalElementLevel = Object.values(userProfile.element_levels || {}).reduce((sum: number, level) => sum + (level as number), 0) as number;

    const userLevel = Number(userProfile.level);
    if (userLevel < data.requiredLevel || totalElementLevel < data.requiredElementLevel) return;

    updateDocumentNonBlocking(userProfileRef, {
      doujutsu: {
        type: path,
        stage: 1,
        isActive: false,
      },
    }, supabase);

    toast({
      title: 'Um Novo Poder Desperta!',
      description: `Seus olhos agora carregam o legado do ${path}.`,
    });
  };

  const handleEvolveDoujutsu = (targetType: DoujutsuType) => {
    if (!userProfileRef || !userProfile || !doujutsu || !supabase) return;
    
    const data = doujutsuData[targetType];
    const totalElementLevel = Object.values(userProfile.element_levels || {}).reduce((sum: number, level) => sum + (level as number), 0) as number;
    
    const userLevel = Number(userProfile.level);
    if (userLevel < data.requiredLevel || totalElementLevel < data.requiredElementLevel) return;

    updateDocumentNonBlocking(userProfileRef, {
      doujutsu: {
        ...userProfile.doujutsu,
        type: targetType,
        stage: 1,
        isActive: false,
      },
    }, supabase);

    toast({
      title: 'Evolução Concluída!',
      description: `Seu Dōjutsu evoluiu para ${targetType}!`,
    });
  }


  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Carregando..." description="Perscrutando os segredos do poder ocular." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Crie um Personagem" description="O caminho do poder ocular exige um corpo para habitá-lo." />
        <Button asChild className="mt-6">
          <Link href="/create-character">Criar Personagem</Link>
        </Button>
      </div>
    );
  }
  
  const chosenPathKey = doujutsu ? Object.keys(evolutionPaths).find(key => (evolutionPaths[key] as DoujutsuType[]).includes(doujutsu.type as DoujutsuType)) : null;
  const pathsToRender = chosenPathKey ? { [chosenPathKey]: evolutionPaths[chosenPathKey] } : evolutionPaths;
  const totalElementLevel = Object.values(userProfile.element_levels || {}).reduce((sum: number, level) => sum + (level as number), 0) as number;


  return (
    <div>
      <PageHeader
        title="Dōjutsu"
        description="Desperte e treine seus olhos lendários para obter poderes incomparáveis."
      />
      
      <div className="mt-8 flex justify-center">
        <Card className="w-full max-w-7xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Eye className="h-6 w-6"/>
                Caminho do Poder Ocular
            </CardTitle>
            <CardDescription>
                {!doujutsu ? "Você ainda não despertou seu poder ocular. Atenda aos requisitos e escolha seu caminho (a escolha é permanente)." : 
                `Seu caminho atual: ${doujutsu.type}. Atinga os requisitos para desbloquear novas evoluções.`
                }
            </CardDescription>
             <div className="text-center pt-2">
                <p className="font-semibold text-lg flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Nível Elemental Total: <span className="text-primary">{Number(totalElementLevel)}</span>
                </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
             <div className="space-y-8">
                {!doujutsu && (
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="font-semibold text-lg">Escolha Seu Caminho</p>
                        <p className="text-muted-foreground text-sm">Alcance os requisitos de nível e nível elemental para despertar seu primeiro Dōjutsu.</p>
                    </div>
                )}
                 {Object.values(pathsToRender).map((path, index) => (
                     <div key={index} className="space-y-4">
                         <div className="flex overflow-x-auto items-stretch space-x-4 p-4 scrollbar-thin">
                            {(path as DoujutsuType[]).map((doujutsuType, pathIndex) => {
                                const currentType = doujutsu?.type;
                                const currentIndexInPath = currentType ? (path as DoujutsuType[]).indexOf(currentType as DoujutsuType) : -1;
                                
                                const isObtained = currentIndexInPath !== -1 && pathIndex <= currentIndexInPath;
                                const isCurrent = currentType === doujutsuType;
                                const isNextEvolution = currentIndexInPath !== -1 && pathIndex === currentIndexInPath + 1;


                                return (
                                <div key={doujutsuType} className="flex items-center">
                                    <DoujutsuCard 
                                        type={doujutsuType} 
                                        onChoose={handleChoosePath} 
                                        onEvolve={handleEvolveDoujutsu}
                                        disabled={!!doujutsu} 
                                        userLevel={Number(userProfile.level)}
                                        userElementLevel={Number(totalElementLevel)}
                                        isObtained={isObtained}
                                        isCurrent={isCurrent}
                                        isNextEvolution={isNextEvolution}
                                    />
                                    {pathIndex < path.length - 1 && (
                                        <ArrowRight className="h-8 w-8 text-muted-foreground mx-4 flex-shrink-0" />
                                    )}
                                </div>
                            )})}
                        </div>
                     </div>
                 ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}