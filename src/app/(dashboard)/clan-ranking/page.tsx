'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Users, Swords, TrendingUp, TrendingDown, ArrowLeft, Shield, Star, Crown } from 'lucide-react';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type ClanRanking = {
  id: string;
  name: string;
  tag: string;
  leader_name: string;
  war_points: number;
  level: number;
  village: string;
  member_count?: number;
  description?: string;
};

type ClanMember = {
  id: string;
  name: string;
  level: number;
  rank: string;
  avatar_url: string;
  village: string;
};

export default function ClanRankingPage() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [clans, setClans] = useState<ClanRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [villageFilter, setVillageFilter] = useState<string>('all');
  
  // 🆕 Estados para visualização de clã
  const [selectedClan, setSelectedClan] = useState<ClanRanking | null>(null);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

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
    fetchClans();
  }, [villageFilter, supabase]);

  const fetchClans = async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    try {
      // Buscar todos os clãs com descrição
      const { data: clansData, error: clansError } = await supabase
        .from('clans')
        .select('id, name, tag, leader_name, level, war_points, description');
      
      if (clansError) {
        console.error('Erro ao buscar clãs:', clansError);
        throw clansError;
      }
      
      if (!clansData || clansData.length === 0) {
        setClans([]);
        return;
      }
      
      // Buscar aldeia do líder e contagem de membros para cada clã
      const clansWithDetails = await Promise.all(
        clansData.map(async (clan) => {
          // Buscar aldeia do líder
          const { data: leaderData } = await supabase
            .from('profiles')
            .select('village')
            .eq('name', clan.leader_name)
            .single();
          
          // Buscar contagem de membros
          const { count } = await supabase
            .from('clan_members')
            .select('*', { count: 'exact', head: true })
            .eq('clan_id', clan.id);
          
          return {
            ...clan,
            village: leaderData?.village || 'Desconhecida',
            member_count: count || 0,
          };
        })
      );
      
      // Filtrar por aldeia se necessário
      let filteredClans = clansWithDetails;
      if (villageFilter !== 'all') {
        filteredClans = clansWithDetails.filter(clan => clan.village === villageFilter);
      }
      
      // Ordenar baseado no filtro
      if (villageFilter === 'all') {
        // Ranking geral: ordenar por pontos (DESC) e depois por nível (DESC)
        filteredClans.sort((a, b) => {
          if (b.war_points !== a.war_points) {
            return b.war_points - a.war_points;
          }
          return b.level - a.level;
        });
      } else {
        // Ranking por aldeia: ordenar por nível (DESC) e depois por pontos (DESC)
        filteredClans.sort((a, b) => {
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.war_points - a.war_points;
        });
      }
      
      setClans(filteredClans);
    } catch (error: any) {
      console.error('Erro ao carregar ranking de clãs:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar ranking',
        description: error?.message || 'Não foi possível carregar os clãs.',
      });
      setClans([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Função para buscar membros do clã
  const fetchClanMembers = async (clanId: string) => {
    if (!supabase) return;
    
    setIsLoadingMembers(true);
    try {
      // Buscar IDs dos membros
      const { data: memberData, error: memberError } = await supabase
        .from('clan_members')
        .select('user_id')
        .eq('clan_id', clanId);
      
      if (memberError) throw memberError;
      
      if (!memberData || memberData.length === 0) {
        setClanMembers([]);
        return;
      }
      
      // Buscar detalhes dos membros
      const memberIds = memberData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, level, rank, avatar_url, village')
        .in('id', memberIds)
        .order('level', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      setClanMembers(profilesData || []);
    } catch (error: any) {
      console.error('Erro ao buscar membros:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar membros',
        description: error?.message || 'Não foi possível carregar os membros do clã.',
      });
      setClanMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 🆕 Função para abrir visualização de clã
  const handleClanClick = (clan: ClanRanking) => {
    setSelectedClan(clan);
    fetchClanMembers(clan.id);
  };

  // 🆕 Função para voltar ao ranking
  const handleBackToRanking = () => {
    setSelectedClan(null);
    setClanMembers([]);
  };

  const handleVillageChange = (value: string) => {
    setVillageFilter(value);
  };

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Inicializando..." description="Carregando ranking de clãs." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  // 🆕 VISUALIZAÇÃO DETALHADA DO CLÃ
  if (selectedClan) {
    return (
      <div>
        <Button 
          variant="outline" 
          onClick={handleBackToRanking}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Ranking
        </Button>

        <Card className="mb-6">
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <Shield className="h-12 w-12 text-primary" />
              <div className="flex-1">
                <CardTitle className="text-3xl flex items-center gap-3">
                  {selectedClan.name}
                  <Badge variant="outline" className="text-sm">
                    [{selectedClan.tag}]
                  </Badge>
                </CardTitle>
                <CardDescription className="text-lg mt-1">
                  {selectedClan.village}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-muted-foreground">Nível</span>
                </div>
                <p className="text-2xl font-bold">{selectedClan.level}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Pontos de Guerra</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  selectedClan.war_points > 0 ? "text-green-600" : 
                  selectedClan.war_points < 0 ? "text-red-600" : 
                  "text-muted-foreground"
                )}>
                  {selectedClan.war_points > 0 && "+"}
                  {selectedClan.war_points}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">Membros</span>
                </div>
                <p className="text-2xl font-bold">{selectedClan.member_count}</p>
              </div>
            </div>

            {/* Descrição */}
            {selectedClan.description && (
              <div className="p-4 rounded-lg bg-muted/20 border">
                <h3 className="font-semibold text-lg mb-2">Descrição</h3>
                <p className="text-muted-foreground">{selectedClan.description}</p>
              </div>
            )}

            {/* Lista de Membros */}
            <div>
              <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Membros do Clã
              </h3>

              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : clanMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro encontrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {clanMembers.map((member, index) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <Avatar className="h-12 w-12 border-2 border-primary">
                              <AvatarImage src={member.avatar_url} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg truncate">
                                {member.name}
                              </h4>
                              {member.name === selectedClan.leader_name && (
                                <Badge variant="default" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Líder
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {member.village}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {member.rank}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span className="font-bold text-lg">Nv. {member.level}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // VISUALIZAÇÃO DO RANKING (CÓDIGO ORIGINAL)
  return (
    <div>
      <PageHeader
        title="Ranking de Clãs"
        description={
          villageFilter === 'all' 
            ? "Os clãs mais poderosos ordenados por pontos de guerra." 
            : `Clãs de ${villageFilter} ordenados por nível.`
        }
      />

      <Card className="mt-8 mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 justify-center">
            <Trophy className="h-6 w-6 text-amber-500" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {villageFilter === 'all' ? 'Guerra entre Clãs' : `Ranking de ${villageFilter}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {clans.length} clãs
                {villageFilter === 'all' ? ' ativos' : ` em ${villageFilter}`}
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
          <p className="text-muted-foreground">Carregando clãs...</p>
        </div>
      ) : clans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {villageFilter === 'all' 
              ? 'Nenhum clã encontrado.' 
              : `Nenhum clã encontrado em ${villageFilter}.`
            }
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Clãs */}
          {clans.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top 3 Clãs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {clans.slice(0, 3).map((clan, index) => {
                  const position = index + 1;
                  return (
                    <Card 
                      key={clan.id} 
                      className={cn(
                        "relative overflow-hidden transition-all hover:shadow-xl cursor-pointer",
                        position === 1 && "ring-2 ring-amber-400",
                        position === 2 && "ring-2 ring-slate-400",
                        position === 3 && "ring-2 ring-amber-600"
                      )}
                      onClick={() => handleClanClick(clan)}
                    >
                      <div className="absolute top-3 right-3 z-10">
                        {position === 1 ? (
                          <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold shadow-lg border-2 border-amber-300">
                            👑
                          </div>
                        ) : position === 2 ? (
                          <div className="bg-gradient-to-br from-slate-300 to-slate-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-slate-200">
                            {position}
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-full h-12 w-12 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-amber-500">
                            {position}
                          </div>
                        )}
                      </div>

                      <CardContent className="pt-6 pb-6">
                        <div className="text-center mb-4">
                          <h4 className="font-bold text-2xl mb-1">
                            {clan.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            [{clan.tag}]
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {clan.village}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Swords className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Pontos</span>
                            </div>
                            <span className={cn(
                              "font-bold text-lg",
                              clan.war_points > 0 ? "text-green-600" : 
                              clan.war_points < 0 ? "text-red-600" : 
                              "text-muted-foreground"
                            )}>
                              {clan.war_points > 0 && "+"}
                              {clan.war_points}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span className="text-sm font-medium">Nível</span>
                            </div>
                            <span className="font-bold text-lg">{clan.level}</span>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">Membros</span>
                            </div>
                            <span className="font-bold text-lg">{clan.member_count}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Demais Clãs */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Ranking Completo
            </h3>
            {clans.slice(3).map((clan, index) => {
              const position = index + 4;
              
              return (
                <Card 
                  key={clan.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleClanClick(clan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{position}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">
                          {clan.name} <span className="text-sm text-muted-foreground">[{clan.tag}]</span>
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {clan.village}
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-muted-foreground">
                              {clan.member_count} membros
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-muted-foreground">
                              Nível {clan.level}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Swords className="h-3 w-3" />
                            Pontos
                          </p>
                          <p className={cn(
                            "font-bold text-xl",
                            clan.war_points > 0 ? "text-green-600 flex items-center gap-1" : 
                            clan.war_points < 0 ? "text-red-600 flex items-center gap-1" : 
                            "text-muted-foreground"
                          )}>
                            {clan.war_points > 0 && <TrendingUp className="h-4 w-4" />}
                            {clan.war_points < 0 && <TrendingDown className="h-4 w-4" />}
                            {clan.war_points > 0 && "+"}
                            {clan.war_points}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}