'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { calculateRank } from '@/lib/rank-calculator';

const PROFILES_PER_PAGE = 100;

export default function RankingPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [villageFilter, setVillageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);

  const villages = [
    { name: 'Todas', value: 'all' },
    { name: 'Akatsuki', value: 'Akatsuki' },
    { name: 'Folha', value: 'Folha' },
    { name: 'Areia', value: 'Areia' },
    { name: 'Névoa', value: 'Névoa' },
    { name: 'Pedra', value: 'Pedra' },
    { name: 'Nuvem', value: 'Nuvem' },
    { name: 'Chuva', value: 'Chuva' },
    { name: 'Som', value: 'Som' },
    { name: 'Cachoeira', value: 'Cachoeira' },
    { name: 'Redemoinho', value: 'Redemoinho' },
    { name: 'Grama', value: 'Grama' },
  ];

  useEffect(() => {
    fetchProfiles();
    fetchTotalCount();
  }, [villageFilter, currentPage, supabase]);

  const fetchTotalCount = async () => {
    if (!supabase) return;
  
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
  
      if (villageFilter !== 'all') {
        query = query.eq('village', villageFilter);
      }
  
      const { count, error } = await query;
  
      if (error) {
        console.error('❌ Erro ao contar perfis:', error);
        throw error;
      }
      
      console.log('📊 Total de perfis:', count);
      setTotalProfiles(count || 0);
    } catch (error: any) {
      console.error('❌ Erro ao contar perfis:', error);
      setTotalProfiles(0);
    }
  };

  const fetchProfiles = async () => {
    if (!supabase) {
      console.log('⏳ Aguardando Supabase inicializar...');
      return;
    }
  
    setIsLoading(true);
    try {
      console.log('🔍 Buscando perfis...', { 
        villageFilter, 
        currentPage, 
        from: (currentPage - 1) * PROFILES_PER_PAGE,
        to: currentPage * PROFILES_PER_PAGE - 1
      });
      
      const from = (currentPage - 1) * PROFILES_PER_PAGE;
      const to = from + PROFILES_PER_PAGE - 1;
  
      let query = supabase
  .from('profiles')
  .select('id, name, avatar_url, level, village, experience, max_experience, ryo, rank')
  .order('level', { ascending: false })
  .order('created_at', { ascending: true })
  .range(from, to);
  
      if (villageFilter !== 'all') {
        query = query.eq('village', villageFilter);
      }
  
      const { data, error } = await query;
  
      if (error) {
        console.error('❌ Erro do Supabase:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }
  
      if (!data) {
        console.warn('⚠️ Nenhum dado retornado');
        setProfiles([]);
        return;
      }
  
      console.log('✅ Perfis carregados:', data.length);
      setProfiles(data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar perfis:', error);
      console.error('❌ Stack:', error?.stack);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar ranking',
        description: error?.message || 'Não foi possível carregar os ninjas.',
      });
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalProfiles / PROFILES_PER_PAGE);

  const handleVillageChange = (value: string) => {
    setVillageFilter(value);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Inicializando..." description="Carregando sistema de ranking." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  const getKageStatus = (profile: any, position: number) => {
    if (villageFilter !== 'all' && position === 1) {
      return true;
    }
    return false;
  };

  return (
    <div>
      <PageHeader
        title="Ranking de Ninjas"
        description="Descubra os ninjas mais poderosos do mundo, ordenados por nível."
      />

      <Card className="mt-8 mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 justify-center">
            <Trophy className="h-6 w-6 text-amber-500" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Ranking Geral</h3>
              <p className="text-sm text-muted-foreground">
                {totalProfiles} ninjas cadastrados
                {villageFilter !== 'all' && ` • ${villageFilter}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {villages.map((village) => (
              <Button
                key={village.value}
                variant={villageFilter === village.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVillageChange(village.value)}
                className={cn(
                  'transition-all',
                  villageFilter === village.value && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {village.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando ninjas...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum ninja encontrado nesta aldeia.
          </p>
        </div>
      ) : (
        <>
          {currentPage === 1 && profiles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top 3 Ninjas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {profiles.slice(0, 3).map((profile, index) => {
                  const rankPosition = index + 1;
                  return (
                    <Card 
                      key={profile.id} 
                      className={cn(
                        "relative overflow-hidden transition-all hover:shadow-xl cursor-pointer",
                        rankPosition === 1 && "ring-2 ring-amber-400",
                        rankPosition === 2 && "ring-2 ring-slate-400",
                        rankPosition === 3 && "ring-2 ring-amber-600"
                      )}
                      onClick={() => handleProfileClick(profile.id)}
                    >
                      <div className="absolute top-3 right-3 z-10">
                        {rankPosition === 1 ? (
                          <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold shadow-lg border-2 border-amber-300">
                            👑
                          </div>
                        ) : rankPosition === 2 ? (
                          <div className="bg-gradient-to-br from-slate-300 to-slate-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-slate-200">
                            {rankPosition}
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-full h-12 w-12 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-amber-500">
                            {rankPosition}
                          </div>
                        )}
                      </div>

                      <CardContent className="pt-6 pb-6">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <img
                              src={profile.avatar_url || '/default-avatar.png'}
                              alt={profile.name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                            />
                            {getKageStatus(profile, rankPosition) && (
                              <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background">
                                KAGE
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="text-center font-bold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
  {profile.name}
</h4>

<div className="flex flex-col items-center gap-2 mb-4">
  <p className="text-center text-sm text-muted-foreground">
    {profile.village}
  </p>
  
  <div className="flex items-center gap-2">
    {/* Badge do Rank */}
    <Badge variant="secondary" className="text-xs">
      {profile.rank || calculateRank(profile.level)}
    </Badge>
    
    {/* Badge de Kage (só aparece se for 1º lugar da vila) */}
    {getKageStatus(profile, rankPosition) && (
      <Badge 
        variant="default"
        className="text-xs bg-gradient-to-r from-yellow-400 to-amber-600 text-white"
      >
        <Crown className="h-3 w-3 mr-1" />
        Kage
      </Badge>
    )}
  </div>
</div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Nível:</span>
                            <span className="font-bold text-lg">{profile.level}</span>
                          </div>
                          <div className="pt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>XP</span>
                              <span>{profile.experience}/{profile.max_experience}</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all"
                                style={{
                                  width: `${(profile.experience / profile.max_experience) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {currentPage === 1 ? 'Demais Ninjas' : `Página ${currentPage}`}
            </h3>
            {profiles.slice(currentPage === 1 ? 3 : 0).map((profile, index) => {
              const rankPosition = currentPage === 1 
                ? index + 4 
                : (currentPage - 1) * PROFILES_PER_PAGE + index + 1;
              
              return (
                <Card 
                  key={profile.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProfileClick(profile.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{rankPosition}
                        </span>
                      </div>

                      <div className="flex-shrink-0 relative">
                        <img
                          src={profile.avatar_url || '/default-avatar.png'}
                          alt={profile.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-background"
                        />
                        {getKageStatus(profile, rankPosition) && (
                          <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full border border-background">
                            K
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
  <h4 className="font-semibold truncate">{profile.name}</h4>
  <div className="flex items-center gap-2 mt-1">
    <p className="text-sm text-muted-foreground">{profile.village}</p>
    <Badge variant="secondary" className="text-xs">
      {profile.rank || calculateRank(profile.level)}
    </Badge>
    {getKageStatus(profile, rankPosition) && (
      <Badge 
        variant="default"
        className="text-xs bg-gradient-to-r from-yellow-400 to-amber-600 text-white"
      >
        <Crown className="h-3 w-3" />
      </Badge>
    )}
  </div>
</div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Nível</p>
                          <p className="font-bold text-lg">{profile.level}</p>
                        </div>
                        
                        <div className="sm:hidden">
                          <p className="font-bold text-lg">Lv.{profile.level}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} • Mostrando{' '}
              {(currentPage - 1) * PROFILES_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * PROFILES_PER_PAGE, totalProfiles)} de{' '}
              {totalProfiles} ninjas
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}