'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSupabase } from '@/supabase';
import { ProfileCard } from '@/components/profile-card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PROFILES_PER_PAGE = 100;

export default function RankingPage() {
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
        .select('*', { count: 'exact', head: true }); // ✅ MUDEI PARA '*'
  
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
        .select('id, name, avatar_url, level, village, experience, max_experience, ryo') // ✅ REMOVIDO 'rank' e 'user_id'
        .order('level', { ascending: false })
        .order('created_at', { ascending: true }) // ✅ ORDENAÇÃO SECUNDÁRIA
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
      setProfiles([]); // ✅ GARANTIR QUE PROFILES SEJA ARRAY VAZIO
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

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Inicializando..." description="Carregando sistema de ranking." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

// ✅ ADICIONAR ANTES DO RETURN (linha ~140)
const getKageStatus = (profile: any, position: number) => {
  // É Kage se for TOP 1 da aldeia
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

      {/* Header com Total de Ninjas */}
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

      {/* Filtro de Aldeias - Horizontal Clicável */}
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

      {/* Lista de Perfis */}
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
          {/* Grid de Perfis com Posição no Ranking */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {profiles.map((profile, index) => {
    const rankPosition = (currentPage - 1) * PROFILES_PER_PAGE + index + 1;
    return (
      <div key={profile.id} className="relative">
        {/* Badge de Posição */}
        <div className="absolute -left-2 -top-2 z-10">
          {rankPosition === 1 ? (
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-amber-300">
              👑
            </div>
          ) : rankPosition === 2 ? (
            <div className="bg-gradient-to-br from-slate-300 to-slate-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-slate-200">
              {rankPosition}
            </div>
          ) : rankPosition === 3 ? (
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-amber-500">
              {rankPosition}
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow border">
              {rankPosition}
            </div>
          )}
        </div>
        <ProfileCard 
  profile={profile} 
  showExperience={false}
  isKage={getKageStatus(profile, rankPosition)}
/>
      </div>
    );
  })}
</div>

          {/* Paginação */}
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

              {/* Números de Página */}
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