'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase, useMemoSupabase, useDoc, useCollection, WithId } from '@/supabase';
import { Loader2, ShoppingCart, Sparkles, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PacoteCP = {
  nome: string;
  quantidade_cp: number;
  preco_brl: number;
  bonus_cp: number;
  descricao: string;
  ativo: boolean;
  ordem: number;
  imagem_url?: string;
};

export default function ComprarCPPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<WithId<PacoteCP> | null>(null);

  // Buscar perfil do usuário
  const userProfileRef = useMemoSupabase(() => 
    user ? { table: 'profiles', id: user.id } : null, 
    [user]
  );
  const { data: userProfile } = useDoc(userProfileRef);

  // Buscar pacotes de CP disponíveis
  const pacotesQuery = useMemoSupabase(() => ({
    table: 'pacotes_cp',
    query: (builder: any) => builder.eq('ativo', true).order('ordem', { ascending: true }),
  }), []);
  const { data: pacotes, isLoading: arePacotesLoading } = useCollection<WithId<PacoteCP>>(pacotesQuery);

  // 🎨 Cores para cada pacote (baseado em Naruto)
  const getPackageTheme = (nome: string) => {
    if (nome.includes('Genin')) return 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
    if (nome.includes('Chunin')) return 'from-green-500/20 to-green-600/20 border-green-500/50';
    if (nome.includes('Jonin')) return 'from-blue-500/20 to-blue-600/20 border-blue-500/50';
    if (nome.includes('Anbu')) return 'from-purple-500/20 to-purple-600/20 border-purple-500/50';
    if (nome.includes('Kage')) return 'from-amber-500/20 to-amber-600/20 border-amber-500/50';
    return 'from-orange-500/20 to-red-500/20 border-orange-500/50';
  };

  const handleComprar = async (pacote: WithId<PacoteCP>) => {
    if (!user || !supabase) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para comprar CP.',
      });
      return;
    }

    setIsLoading(true);
    setSelectedPackage(pacote);

    try {
      // 1️⃣ Criar preferência de pagamento no Mercado Pago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacote_id: pacote.id,
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar pagamento');
      }

      const data = await response.json();

      // 2️⃣ Redirecionar para o Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não foi gerado');
      }

    } catch (error: any) {
      console.error('Erro ao iniciar compra:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao processar pagamento',
        description: error.message || 'Tente novamente mais tarde.',
      });
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950 p-6">
      <PageHeader 
        title="Comprar Clash Points" 
        description="Adquira CP para desbloquear itens premium no jogo"
      />

      {/* Saldo Atual */}
      <Card className="mt-6 max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30 shadow-xl shadow-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Sparkles className="text-yellow-500 animate-pulse" />
            Seu Saldo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-yellow-500">
              💎 {userProfile.clash_points || 0}
            </span>
            <span className="text-sm text-gray-400">CP disponíveis</span>
          </div>
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Alert className="mt-6 max-w-4xl mx-auto bg-orange-500/10 border-orange-500/30">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-gray-300">
          <strong className="text-orange-400">Como funciona:</strong> Escolha um pacote abaixo → Pague com Pix, Cartão ou Boleto → 
          Receba seus CP automaticamente após confirmação do pagamento (instantâneo para Pix!)
        </AlertDescription>
      </Alert>

      {/* Grid de Pacotes */}
      <div className="mt-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
          Escolha seu Pacote
        </h2>
        
        {arePacotesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : pacotes && pacotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pacotes.map((pacote) => {
              const totalCP = pacote.quantidade_cp + pacote.bonus_cp;
              const bonusPercentage = pacote.bonus_cp > 0 
                ? Math.round((pacote.bonus_cp / pacote.quantidade_cp) * 100) 
                : 0;

              return (
                <Card 
                  key={pacote.id} 
                  className={`relative overflow-hidden bg-gradient-to-br ${getPackageTheme(pacote.nome)} hover:shadow-xl hover:shadow-orange-500/20 transition-all border-2`}
                >
                  {bonusPercentage > 0 && (
                    <Badge className="absolute top-4 right-4 bg-green-500 text-white shadow-lg">
                      +{bonusPercentage}% Bônus
                    </Badge>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl text-orange-400">{pacote.nome}</CardTitle>
                    <CardDescription className="text-sm text-gray-400">
                      {pacote.descricao}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* CP Total */}
                    <div className="text-center py-4 rounded-lg bg-black/30 border border-orange-500/20">
                      <div className="text-4xl font-bold text-yellow-500">
                        💎 {totalCP.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pacote.quantidade_cp.toLocaleString('pt-BR')} CP
                        {pacote.bonus_cp > 0 && ` + ${pacote.bonus_cp.toLocaleString('pt-BR')} bônus`}
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        R$ {pacote.preco_brl.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/50" 
                      size="lg"
                      onClick={() => handleComprar(pacote)}
                      disabled={isLoading && selectedPackage?.id === pacote.id}
                    >
                      {isLoading && selectedPackage?.id === pacote.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Comprar Agora
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Nenhum pacote disponível no momento.
          </div>
        )}
      </div>

      {/* Métodos de Pagamento */}
      <Card className="mt-8 max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30 shadow-xl shadow-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <CreditCard className="h-5 w-5" />
            Formas de Pagamento Aceitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-orange-500/20 bg-black/20">
              <DollarSign className="h-8 w-8 text-green-500" />
              <span className="font-semibold text-gray-200">Pix</span>
              <span className="text-xs text-gray-400 text-center">
                Aprovação instantânea
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-orange-500/20 bg-black/20">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <span className="font-semibold text-gray-200">Cartão de Crédito</span>
              <span className="text-xs text-gray-400 text-center">
                Até 12x sem juros
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-orange-500/20 bg-black/20">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <span className="font-semibold text-gray-200">Boleto</span>
              <span className="text-xs text-gray-400 text-center">
                Aprovação em até 2 dias úteis
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
