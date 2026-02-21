'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Coins, TrendingUp } from 'lucide-react';

type ClanDonationProps = {
  clanId: string;
  userRyo: number;
  userId: string;
  userName: string;
  supabase: any;
};

export function ClanDonation({ clanId, userRyo, userId, userName, supabase }: ClanDonationProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isDonating, setIsDonating] = useState(false);

  const handleDonate = async () => {
    const donationAmount = parseInt(amount);

    if (!donationAmount || donationAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor Inválido',
        description: 'Digite um valor válido para doar.',
      });
      return;
    }

    if (donationAmount > userRyo) {
      toast({
        variant: 'destructive',
        title: 'Ryo Insuficiente',
        description: `Você só tem ${userRyo.toLocaleString()} Ryo.`,
      });
      return;
    }

    setIsDonating(true);

    try {
      // Buscar dados atuais
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('ryo')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const { data: clanData, error: clanError } = await supabase
        .from('clans')
        .select('treasury_ryo')
        .eq('id', clanId)
        .single();

      if (clanError) throw clanError;

      // Verificar novamente se tem Ryo suficiente
      if (userData.ryo < donationAmount) {
        toast({
          variant: 'destructive',
          title: 'Ryo Insuficiente',
          description: 'Você não tem Ryo suficiente.',
        });
        setIsDonating(false);
        return;
      }

      // Atualizar Ryo do usuário
      const { error: updateUserError } = await supabase
        .from('profiles')
        .update({ ryo: userData.ryo - donationAmount })
        .eq('id', userId);

      if (updateUserError) throw updateUserError;

      // Atualizar tesouro do clã
      const { error: updateClanError } = await supabase
        .from('clans')
        .update({ treasury_ryo: (clanData.treasury_ryo || 0) + donationAmount })
        .eq('id', clanId);

      if (updateClanError) throw updateClanError;

      toast({
        title: '💰 Doação Realizada!',
        description: `Você doou ${donationAmount.toLocaleString()} Ryo para o clã!`,
      });

      setAmount('');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao doar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao doar',
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setIsDonating(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 50000];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          Doar para o Clã
        </CardTitle>
        <CardDescription>
          Contribua com Ryo para o tesouro do clã e ajude a melhorar as tecnologias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-sm">Seu Ryo: </span>
          <span className="font-bold text-amber-500">{userRyo.toLocaleString()}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Valor da Doação</label>
          <Input
            type="number"
            placeholder="Digite o valor..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={userRyo}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickAmounts.map((value) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              onClick={() => setAmount(value.toString())}
              disabled={value > userRyo}
            >
              {value.toLocaleString()} Ryo
            </Button>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={handleDonate}
          disabled={isDonating || !amount || parseInt(amount) <= 0}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {isDonating ? 'Doando...' : 'Doar para o Clã'}
        </Button>
      </CardContent>
    </Card>
  );
}