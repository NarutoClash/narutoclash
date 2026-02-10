'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Loader2, Gift, CheckCircle, Clock } from 'lucide-react';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { STUDENT_REWARDS, type StudentReward } from '@/lib/student-rewards';
import { cn } from '@/lib/utils';

type Student = {
  id: string;
  name: string;
  avatar_url: string;
  level: number;
  village: string;
  created_at: string;
};

export function StudentsList({ 
  userId, 
  claimedRewards 
}: { 
  userId: string; 
  claimedRewards: string[];
}) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [userId, supabase]);

  const fetchStudents = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, level, village, created_at')
        .eq('invited_by', userId)
        .order('level', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimReward = async (studentId: string, reward: StudentReward) => {
    if (!supabase || isClaiming) return;

    setIsClaiming(true);
    try {
      const rewardKey = `${studentId}-${reward.level}`;

      // Buscar dados atuais do mestre
      const { data: masterData, error: fetchError } = await supabase
        .from('profiles')
        .select('ryo, stat_points, student_rewards_claimed')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentClaimed = masterData.student_rewards_claimed || [];
      
      // Verificar se já foi reclamado
      if (currentClaimed.includes(rewardKey)) {
        toast({
          variant: 'destructive',
          title: 'Recompensa já reclamada',
          description: 'Você já coletou esta recompensa.',
        });
        setIsClaiming(false);
        return;
      }

      // Atualizar perfil do mestre
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ryo: (masterData.ryo || 0) + reward.ryo,
          stat_points: (masterData.stat_points || 0) + reward.statPoints,
          student_rewards_claimed: [...currentClaimed, rewardKey],
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: '🎉 Recompensa Coletada!',
        description: `+${reward.ryo} Ryo e +${reward.statPoints} Pontos de Atributo!`,
        duration: 5000,
      });

      // Recarregar página
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao coletar recompensa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível coletar a recompensa.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const getAvailableRewards = (studentLevel: number, studentId: string) => {
    return STUDENT_REWARDS.filter(reward => {
      const rewardKey = `${studentId}-${reward.level}`;
      const isClaimed = claimedRewards.includes(rewardKey);
      const isAvailable = studentLevel >= reward.level;
      
      return { ...reward, isClaimed, isAvailable, rewardKey };
    }).map(reward => {
      const rewardKey = `${studentId}-${reward.level}`;
      const isClaimed = claimedRewards.includes(rewardKey);
      const isAvailable = studentLevel >= reward.level;
      
      return { ...reward, isClaimed, isAvailable, rewardKey };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">
            Você ainda não tem alunos. Compartilhe seu link de convite!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const rewards = getAvailableRewards(student.level, student.id);
        const availableRewardsCount = rewards.filter(r => r.isAvailable && !r.isClaimed).length;
        const nextReward = STUDENT_REWARDS.find(r => r.level > student.level);

        return (
          <Card key={student.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={student.avatar_url} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">Nível {student.level}</Badge>
                    <Badge variant="outline">{student.village}</Badge>
                    {availableRewardsCount > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        {availableRewardsCount} Recompensa{availableRewardsCount > 1 ? 's' : ''} Disponível{availableRewardsCount > 1 ? 'is' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Próxima Recompensa */}
              {nextReward && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Próxima Recompensa: Nível {nextReward.level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {nextReward.level - student.level} níveis restantes
                    </span>
                  </div>
                  <Progress 
                    value={(student.level / nextReward.level) * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>💰 {nextReward.ryo} Ryo</span>
                    <span>⭐ {nextReward.statPoints} Pontos</span>
                  </div>
                </div>
              )}

              {/* Recompensas Disponíveis */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recompensas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rewards.map((reward) => (
                    <div
                      key={reward.rewardKey}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        reward.isClaimed && "bg-muted/30 opacity-60",
                        reward.isAvailable && !reward.isClaimed && "border-green-500 bg-green-500/10",
                        !reward.isAvailable && "bg-muted/10 opacity-40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{reward.label}</span>
                        {reward.isClaimed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : reward.isAvailable ? (
                          <Gift className="h-4 w-4 text-amber-500 animate-pulse" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs mb-2">
                        <span>💰 {reward.ryo}</span>
                        <span>⭐ {reward.statPoints}</span>
                      </div>

                      {reward.isAvailable && !reward.isClaimed && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleClaimReward(student.id, reward)}
                          disabled={isClaiming}
                        >
                          {isClaiming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Coletar'
                          )}
                        </Button>
                      )}
                      
                      {reward.isClaimed && (
                        <p className="text-xs text-center text-green-500 font-medium">
                          ✓ Coletado
                        </p>
                      )}
                      
                      {!reward.isAvailable && !reward.isClaimed && (
                        <p className="text-xs text-center text-muted-foreground">
                          Bloqueado
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}