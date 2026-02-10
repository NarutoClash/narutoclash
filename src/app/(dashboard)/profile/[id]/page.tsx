'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Swords, ScrollText, Footprints, Shirt, Hand, Crown, Users } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import { useSupabase } from '@/supabase';
import { villageImages } from '@/lib/village-images';
import { weaponsData } from '@/lib/weapons-data';
import { summonsData } from '@/lib/summons-data';
import { equipmentsData } from '@/lib/equipments-data';
import { doujutsuData } from '@/lib/dojutsu-data';
import { calculateFinalStats } from '@/lib/stats-calculator';
import { BioEditor } from '@/components/bio-editor';
import { usePlayerRank } from '@/hooks/use-player-rank';
import { cn } from '@/lib/utils';
import { JUTSU_GIFS } from '@/lib/battle-system/jutsu-gifs';
import { elementImages } from '@/lib/element-images';

// ✅ COMPONENTE CORRIGIDO - Valida NaN
const StatDisplay = ({ label, value, className }: { label: string; value: number | null | undefined; className?: string }) => {
  const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
  
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-4 shadow-sm", className)}>
      <span className="text-sm font-medium text-muted-foreground mb-1">{label}</span>
      <span className="text-2xl font-bold text-foreground">{Math.round(safeValue)}</span>
    </div>
  );
};

// ✅ COMPONENTE CORRIGIDO - Valida NaN
const ProgressBarStat = ({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number | null | undefined;
  max: number | null | undefined;
  className?: string;
}) => {
  const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
  const safeMax = typeof max === 'number' && !isNaN(max) && isFinite(max) && max > 0 ? max : 1;
  const percentage = (safeValue / safeMax) * 100;
  
  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {Math.round(safeValue)} / {Math.round(safeMax)}
        </span>
      </div>
      <Progress value={percentage} className={cn('h-3', className)} />
    </div>
  );
};

const allElements = ['Katon', 'Futon', 'Raiton', 'Doton', 'Suiton'];

export default function ProfilePage() {
  const params = useParams();
  const profileId = params?.id as string;
  const { supabase, user } = useSupabase();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = user?.id === profileId;

  const { rank: playerRank, isKage, isLoading: isRankLoading } = usePlayerRank(
    supabase,
    profileId,
    profile?.village,
    profile?.level
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!supabase || !profileId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, profileId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Carregando Perfil..." description="Buscando informações do ninja." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Perfil Não Encontrado" description="Este ninja não existe ou foi removido." />
      </div>
    );
  }

  const villageImage = profile.village ? villageImages[profile.village] : null;
  const calculatedStats = calculateFinalStats(profile);

  const currentHealth = Math.min(profile.current_health ?? calculatedStats?.maxHealth ?? 100, calculatedStats?.maxHealth ?? 100);
  const currentChakra = profile.current_chakra ?? calculatedStats?.maxChakra ?? 100;

  const unlockedElements = allElements.filter(
    (elementName) => (profile.element_levels?.[elementName] || 0) > 0
  );

  const learnedJutsus = Object.entries(profile.jutsus || {})
    .filter(([_, level]) => (level as number) > 0)
    .sort(([jutsuNameA], [jutsuNameB]) => jutsuNameA.localeCompare(jutsuNameB));

  const equippedWeapon = weaponsData.find(w => w.id === profile.weapon_id);
  const equippedSummon = summonsData.find(s => s.id === profile.summon_id);
  const equippedChest = equipmentsData.find(e => e.id === profile.chest_id);
  const equippedLegs = equipmentsData.find(e => e.id === profile.legs_id);
  const equippedFeet = equipmentsData.find(e => e.id === profile.feet_id);
  const equippedHands = equipmentsData.find(e => e.id === profile.hands_id);

  const doujutsu = profile.doujutsu;
  const doujutsuInfo = doujutsu ? doujutsuData[doujutsu.type] : null;

  return (
    <div>
      <PageHeader
        title={`Perfil de ${profile.name || 'Ninja'}`}
        description="Veja as informações e conquistas deste ninja."
      />

      <div className="mt-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-32 w-32 rounded-md border-2 border-primary shadow-lg">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback>{profile.name?.charAt(0) || 'N'}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 mb-2">
                  <CardTitle className="font-headline text-3xl">
                    {profile.name || 'Ninja'}
                  </CardTitle>
                  {villageImage && (
                    <Image 
                      src={villageImage.imageUrl} 
                      alt={villageImage.description}
                      width={80}
                      height={80}
                      className="rounded-md"
                    />
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
  <Badge variant="default" className="text-md">
    Nível {profile.level ?? 0}
  </Badge>
  <Badge variant="outline" className="text-md">
    {profile.village || 'Sem Vila'}
  </Badge>
  {!isRankLoading && playerRank && (
    <>
      {/* Badge do Rank (sempre aparece) */}
      <Badge 
        variant="secondary"
        className="text-md font-semibold"
      >
        {playerRank}
      </Badge>
      
      {/* Badge de Kage (só aparece se for Kage) */}
      {isKage && (
        <Badge 
          variant="default"
          className="text-md font-semibold bg-gradient-to-r from-yellow-400 to-amber-600 text-white shadow-lg"
        >
          <Crown className="h-3 w-3 mr-1" />
          Kage
        </Badge>
      )}
    </>
  )}
</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* ✅ SEÇÃO DE BIO ATUALIZADA */}
            <div>
              <BioEditor 
                profileId={profileId} 
                isOwner={isOwnProfile}
                initialContent={profile.bio || ''}
              />
            </div>

            {(profile.level ?? 0) < 100 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Progresso</h3>
                <div className="space-y-3">
                  <ProgressBarStat
                    label="Experiência"
                    value={profile.experience ?? 0}
                    max={profile.max_experience ?? 100}
                    className="[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500"
                  />
                  <ProgressBarStat
                    label="HP"
                    value={currentHealth}
                    max={calculatedStats?.maxHealth ?? 100}
                    className="[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-rose-500"
                  />
                  <ProgressBarStat
                    label="Chakra"
                    value={currentChakra}
                    max={calculatedStats?.maxChakra ?? 100}
                    className="[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-violet-500"
                  />
                </div>
              </div>
            )}

            {((profile.vitality ?? 0) > 0 || (profile.intelligence ?? 0) > 0 || (profile.taijutsu ?? 0) > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Atributos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatDisplay label="Vitalidade" value={calculatedStats?.finalVitality ?? 0} />
                  <StatDisplay label="Inteligência" value={calculatedStats?.finalIntelligence ?? 0} />
                  <StatDisplay label="Taijutsu" value={calculatedStats?.finalTaijutsu ?? 0} />
                  <StatDisplay label="Ninjutsu" value={calculatedStats?.finalNinjutsu ?? 0} />
                  <StatDisplay label="Genjutsu" value={calculatedStats?.finalGenjutsu ?? 0} />
                  <StatDisplay label="Selo" value={calculatedStats?.finalSelo ?? 0} />
                </div>
              </div>
            )}

            {doujutsu && doujutsuInfo && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dōjutsu</h3>
                <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <LucideIcons.Eye className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{doujutsuInfo.name}</h4>
                      <p className="text-sm text-muted-foreground">{doujutsuInfo.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {profile.cursed_seal && (profile.cursed_seal.level ?? 0) > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Selo Amaldiçoado</h3>
                <Card className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold">Nível {profile.cursed_seal.level ?? 0}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(profile.cursed_seal.level ?? 0) === 1 ? "Primeiro Estágio" : "Segundo Estágio"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {equippedWeapon && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Arma</h3>
                <Card className="p-4 bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted/30">
                      <Image 
                        src={equippedWeapon.imageUrl} 
                        alt={equippedWeapon.name} 
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2">
                        <Swords className="h-4 w-4 text-primary" />
                        {equippedWeapon.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{equippedWeapon.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {equippedSummon && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Invocação</h3>
                <Card className="p-4 bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted/30">
                      <Image 
                        src={equippedSummon.imageUrl} 
                        alt={equippedSummon.name} 
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2">
                        <Footprints className="h-4 w-4 text-primary" />
                        {equippedSummon.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{equippedSummon.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {(equippedChest || equippedLegs || equippedFeet || equippedHands) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Equipamentos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { item: equippedChest, label: 'Peito', Icon: Shirt },
                    { item: equippedLegs, label: 'Pernas', Icon: Shirt },
                    { item: equippedFeet, label: 'Pés', Icon: Footprints },
                    { item: equippedHands, label: 'Mãos', Icon: Hand },
                  ].map(({ item, label, Icon }) => (
                    item ? (
                      <Card key={label} className="p-3 bg-muted/20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted/30">
                            <Image 
                              src={item.imageUrl} 
                              alt={item.name} 
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div className="text-center w-full">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card key={label} className="p-3 bg-muted/10 border-dashed">
                        <div className="flex flex-col items-center gap-3 py-4">
                          <Icon className="h-12 w-12 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-sm text-muted-foreground">Vazio</p>
                          </div>
                        </div>
                      </Card>
                    )
                  ))}
                </div>
              </div>
            )}

            {unlockedElements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Elementos Dominados</h3>
                <div className="flex justify-center gap-4 flex-wrap">
                  {unlockedElements.map((elementName) => {
                    const elementImage = elementImages[elementName as keyof typeof elementImages];
                    const elementLevel = profile.element_levels?.[elementName] || 0;
                    
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
                        <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center bg-muted/50 overflow-hidden p-2">
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
                    );
                  })}
                </div>
              </div>
            )}

            {learnedJutsus.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Jutsus Aprendidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {learnedJutsus.map(([jutsuName]) => {
                    const jutsuGif = JUTSU_GIFS[jutsuName];
                    
                    return (
                      <Card key={jutsuName} className="p-3 bg-muted/20">
                        <div className="flex items-center gap-3">
                          {jutsuGif ? (
                            <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted/30 flex-shrink-0">
                              <Image 
                                src={jutsuGif} 
                                alt={jutsuName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <ScrollText className="h-5 w-5 text-amber-400 flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm">{jutsuName}</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🆕 SEÇÃO DE ALUNOS (PÚBLICO - SÓ MOSTRA QUANTIDADE) */}
            {(profile.total_students ?? 0) > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Alunos</h3>
                <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
                  <div className="flex items-center justify-center gap-4">
                    <Users className="h-12 w-12 text-purple-500" />
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-500">
                        {profile.total_students}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Aluno{profile.total_students > 1 ? 's' : ''} Treinado{profile.total_students > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}