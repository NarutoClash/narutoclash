'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, TrendingUp, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type Technology = {
  id: 'dojo' | 'hospital' | 'library';
  name: string;
  description: string;
  icon: React.ReactNode;
  effect: string;
  maxLevel: number;
};

const TECHNOLOGIES: Technology[] = [
  {
    id: 'dojo',
    name: 'Dojo de Treinamento',
    description: 'Aumenta XP ganho em missões pessoais',
    icon: <TrendingUp className="h-6 w-6 text-orange-500" />,
    effect: '+1% XP por nível',
    maxLevel: 10,
  },
  {
    id: 'hospital',
    name: 'Hospital Ninja',
    description: 'Acelera regeneração de chakra',
    icon: <Heart className="h-6 w-6 text-red-500" />,
    effect: '+1% velocidade por nível',
    maxLevel: 10,
  },
  {
    id: 'library',
    name: 'Biblioteca de Jutsus',
    description: 'Reduz duração de missões pessoais',
    icon: <BookOpen className="h-6 w-6 text-blue-500" />,
    effect: '-1% duração por nível',
    maxLevel: 5,
  },
];

type ClanTechnologiesProps = {
  clanId: string;
  technologies: {
    dojo: number;
    hospital: number;
    library: number;
  };
  treasuryRyo: number;
  isLeader: boolean;
  supabase: any;
  userId: string;
};

export function ClanTechnologies({
  clanId,
  technologies,
  treasuryRyo,
  isLeader,
  supabase,
  userId,
}: ClanTechnologiesProps) {
  // 🆕 VALORES SEGUROS
  const safeTechnologies = {
    dojo: technologies?.dojo || 0,
    hospital: technologies?.hospital || 0,
    library: technologies?.library || 0,
  };

  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const LEVEL_COSTS: Record<number, number> = {
    0: 500000,
    1: 1500000,
    2: 4000000,
    3: 8000000,
    4: 15000000,
    5: 25000000,
    6: 40000000,
    7: 60000000,
    8: 85000000,
    9: 120000000,
  };

  const calculateCost = (currentLevel: number) => {
    return LEVEL_COSTS[currentLevel] ?? 120000000;
  };

  const handleUpgrade = async (techId: 'dojo' | 'hospital' | 'library') => {
    if (!isLeader) {
      toast({
        variant: 'destructive',
        title: 'Permissão Negada',
        description: 'Apenas o líder pode melhorar tecnologias.',
      });
      return;
    }

    const currentLevel = safeTechnologies[techId]; // ✅ MUDOU AQUI
    const cost = calculateCost(currentLevel);

    if (treasuryRyo < cost) {
      toast({
        variant: 'destructive',
        title: 'Ryo Insuficiente',
        description: `O clã precisa de ${cost.toLocaleString()} Ryo no tesouro.`,
      });
      return;
    }

    setUpgrading(techId);

    try {
      const { data, error } = await supabase.rpc('upgrade_clan_technology', {
        p_clan_id: clanId,
        p_technology_name: techId,
        p_user_id: userId,
      });

      if (error) throw error;

      if (data.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.error,
        });
        return;
      }

      toast({
        title: '🎉 Tecnologia Melhorada!',
        description: `${TECHNOLOGIES.find(t => t.id === techId)?.name} agora está no nível ${data.new_level}!`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao melhorar tecnologia:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Tecnologias do Clã</h3>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-amber-500">
            {treasuryRyo.toLocaleString()} Ryo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TECHNOLOGIES.map((tech) => {
          const currentLevel = safeTechnologies[tech.id]; // ✅ MUDOU AQUI
          const cost = calculateCost(currentLevel);
          const isMaxLevel = currentLevel >= tech.maxLevel;
          const canAfford = treasuryRyo >= cost;

          return (
            <Card key={tech.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {tech.icon}
                    <div>
                      <CardTitle className="text-lg">{tech.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        Nível {currentLevel}/{tech.maxLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {tech.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{tech.effect}</span>
                  </div>
                  <Progress value={(currentLevel / tech.maxLevel) * 100} />
                </div>

                <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                  <p className="text-sm font-medium">Bônus Atual:</p>
                  <p className="text-xl font-bold text-primary">
                    {tech.id === 'dojo' && `+${(currentLevel || 0) * 5}% XP`}
                    {tech.id === 'hospital' && `+${(currentLevel || 0) * 1}% Regeneração`}
                    {tech.id === 'library' && `-${(currentLevel || 0) * 1}% Duração`}
                  </p>
                </div>

                {!isMaxLevel && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Próximo nível:</span>
                      <span className="font-bold">{cost.toLocaleString()} Ryo</span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tech.id)}
                      disabled={!isLeader || !canAfford || upgrading === tech.id}
                    >
                      {upgrading === tech.id
                        ? 'Melhorando...'
                        : !isLeader
                        ? 'Apenas Líder'
                        : !canAfford
                        ? 'Ryo Insuficiente'
                        : 'Melhorar'}
                    </Button>
                  </div>
                )}

                {isMaxLevel && (
                  <div className="text-center py-2 text-sm font-semibold text-green-500">
                    ✓ Nível Máximo
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}