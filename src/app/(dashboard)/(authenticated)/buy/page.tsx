'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
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
import { Loader2, ShoppingCart, Sparkles, CreditCard, DollarSign, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DadosAdicionaisForm } from '@/components/forms/DadosAdicionaisForm';


// ✅ Declaração global do MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [deviceSessionId, setDeviceSessionId] = useState<string>('');
  const [mpReady, setMpReady] = useState(false);
  const [mpLoadAttempts, setMpLoadAttempts] = useState(0);

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

  // ✅ Gerar Device Session ID IMEDIATAMENTE (não depende do MP)
  useEffect(() => {
    if (!deviceSessionId) {
      const sessionId = `mp-device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      setDeviceSessionId(sessionId);
      console.log('🔐 Device Session ID gerado:', sessionId);
    }
  }, [deviceSessionId]);

  // ✅ Tentar inicializar MP múltiplas vezes se necessário
  useEffect(() => {
    const MAX_ATTEMPTS = 10;
    const RETRY_DELAY = 500;

    const tryInitMercadoPago = () => {
      if (mpReady) return; // Já inicializou

      if (typeof window !== 'undefined' && window.MercadoPago) {
        try {
          const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
          
          if (!publicKey) {
            console.error('❌ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY não configurada');
            toast({
              variant: 'destructive',
              title: 'Erro de Configuração',
              description: 'Sistema de pagamentos não configurado. Entre em contato com o suporte.',
            });
            return;
          }

          console.log('🔑 Inicializando Mercado Pago (tentativa', mpLoadAttempts + 1, ')...');
          
          const mp = new window.MercadoPago(publicKey, {
            locale: 'pt-BR'
          });

          setMpInstance(mp);
          setMpReady(true);
          
          console.log('✅ Mercado Pago inicializado com sucesso!');

        } catch (error) {
          console.error('❌ Erro ao inicializar Mercado Pago:', error);
        }
      } else {
        // SDK ainda não carregou
        if (mpLoadAttempts < MAX_ATTEMPTS) {
          console.log('⏳ SDK do Mercado Pago ainda não carregou, tentando novamente...');
          setMpLoadAttempts(prev => prev + 1);
          setTimeout(tryInitMercadoPago, RETRY_DELAY);
        } else {
          console.error('❌ Timeout ao carregar SDK do Mercado Pago');
          toast({
            variant: 'destructive',
            title: 'Erro ao Carregar Pagamentos',
            description: 'Não foi possível carregar o sistema. Recarregue a página.',
          });
        }
      }
    };

    tryInitMercadoPago();
  }, [mpLoadAttempts, mpReady, toast]);

  // 🎨 Cores para cada pacote
  const getPackageTheme = (nome: string) => {
    if (nome.includes('Genin')) return 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
    if (nome.includes('Chunin')) return 'from-green-500/20 to-green-600/20 border-green-500/50';
    if (nome.includes('Jonin')) return 'from-blue-500/20 to-blue-600/20 border-blue-500/50';
    if (nome.includes('Anbu')) return 'from-purple-500/20 to-purple-600/20 border-purple-500/50';
    if (nome.includes('Kage')) return 'from-amber-500/20 to-amber-600/20 border-amber-500/50';
    return 'from-orange-500/20 to-red-500/20 border-orange-500/50';
  };

  // ✅ Abrir popup de confirmação
  const handleClickComprar = (pacote: WithId<PacoteCP>) => {
    // ✅ Verificar se o Device ID foi gerado
    if (!deviceSessionId) {
      toast({
        variant: 'destructive',
        title: 'Aguarde',
        description: 'Sistema ainda está inicializando...',
      });
      return;
    }

    console.log('🛒 Pacote selecionado:', pacote.nome);
    console.log('🔐 Device ID disponível:', deviceSessionId);
    
    setSelectedPackage(pacote);
    setShowConfirmDialog(true);
  };

  // ✅ Confirmar compra e abrir checkout
  const handleConfirmarCompra = async () => {
    if (!user || !supabase || !selectedPackage || !deviceSessionId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Dados incompletos para processar a compra.',
      });
      return;
    }

    setShowConfirmDialog(false);
    setIsLoading(true);

    try {
      console.log('🛒 Iniciando compra:', selectedPackage.nome);
      console.log('👤 Usuário:', user.id);
      console.log('🔐 Device Session ID:', deviceSessionId);
      console.log('📦 Pacote ID:', selectedPackage.id);

      // 1️⃣ Criar preferência de pagamento
      const requestBody = {
        pacote_id: selectedPackage.id,
        user_id: user.id,
        device_session_id: deviceSessionId, // ✅ SEMPRE ENVIA
      };

      console.log('📤 Enviando requisição:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Status da resposta:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erro da API:', error);
        throw new Error(error.message || error.error || 'Erro ao criar pagamento');
      }

      const data = await response.json();
      console.log('📦 Resposta completa da API:', data);

      // 2️⃣ Verificar se o init_point foi retornado
      if (!data.init_point) {
        console.error('❌ init_point não retornado. Resposta completa:', data);
        throw new Error('Link de pagamento não foi gerado. Tente novamente.');
      }

      console.log('✅ Link de pagamento gerado:', data.init_point);

      // 3️⃣ Abrir checkout
      console.log('🌐 Abrindo checkout...');
      
      const checkoutWindow = window.open(
        data.init_point, 
        '_blank', 
        'noopener,noreferrer,width=800,height=600'
      );
      
      if (!checkoutWindow || checkoutWindow.closed || typeof checkoutWindow.closed === 'undefined') {
        console.warn('⚠️ Popup bloqueado pelo navegador');
        
        toast({
          title: 'Popup Bloqueado',
          description: 'Permita popups para este site ou abra o link manualmente.',
          variant: 'destructive',
        });
        
        // Perguntar se quer abrir na mesma aba
        const openInSameTab = window.confirm(
          'Os popups estão bloqueados.\n\nDeseja abrir o pagamento nesta aba? (Você será redirecionado)'
        );
        
        if (openInSameTab) {
          window.location.href = data.init_point;
        }
      } else {
        console.log('✅ Checkout aberto em nova aba');
        toast({
          title: '✅ Checkout Aberto!',
          description: 'Complete o pagamento na nova aba. Você pode continuar navegando aqui!',
        });
      }

    } catch (error: any) {
      console.error('❌ Erro ao processar compra:', error);
      console.error('Stack trace:', error.stack);
      
      toast({
        variant: 'destructive',
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
      });
    } finally {
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
    <>
      {/* ✅ SDK do Mercado Pago */}
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('📦 SDK do Mercado Pago carregado');
          setMpLoadAttempts(0); // Reset contador para tentar inicializar
        }}
        onError={(e) => {
          console.error('❌ Erro ao carregar SDK:', e);
          toast({
            variant: 'destructive',
            title: 'Erro ao Carregar',
            description: 'Não foi possível carregar o sistema de pagamentos.',
          });
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950 p-6">
        <PageHeader 
          title="Comprar Clash Points" 
          description="Adquira CP para desbloquear itens premium no jogo"
        />

        {/* Dialog de Confirmação */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-400">
                <ShoppingCart className="h-5 w-5" />
                Confirmar Compra
              </DialogTitle>
            </DialogHeader>
            
            {selectedPackage && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-black/30 rounded-lg border border-orange-500/20">
                  <div className="text-lg font-semibold text-yellow-500">
                    💎 {selectedPackage.nome}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {selectedPackage.quantidade_cp + selectedPackage.bonus_cp} CP totais
                  </div>
                  <div className="text-2xl font-bold text-green-400 mt-2">
                    R$ {selectedPackage.preco_brl.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-gray-300">
                    O checkout será aberto em uma <strong>nova aba</strong>. 
                    Você pode continuar jogando enquanto completa o pagamento!
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter className="gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                className="border-gray-600"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmarCompra}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                disabled={isLoading || !deviceSessionId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ir para Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alerta de carregamento */}
        {!deviceSessionId && (
          <Alert className="mt-6 max-w-4xl mx-auto bg-yellow-500/10 border-yellow-500/30">
            <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
            <AlertDescription className="text-gray-300">
              Inicializando sistema de pagamentos...
            </AlertDescription>
          </Alert>
        )}

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

        {/* Informações */}
        <Alert className="mt-6 max-w-4xl mx-auto bg-orange-500/10 border-orange-500/30">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-gray-300">
            <strong className="text-orange-400">Como funciona:</strong> Escolha um pacote → 
            Checkout abre em nova aba → Continue jogando → Receba CP após confirmação!
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
                      <div className="text-center py-4 rounded-lg bg-black/30 border border-orange-500/20">
                        <div className="text-4xl font-bold text-yellow-500">
                          💎 {totalCP.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {pacote.quantidade_cp.toLocaleString('pt-BR')} CP
                          {pacote.bonus_cp > 0 && ` + ${pacote.bonus_cp.toLocaleString('pt-BR')} bônus`}
                        </div>
                      </div>

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
                        onClick={() => handleClickComprar(pacote)}
                        disabled={isLoading || !deviceSessionId}
                      >
                        {!deviceSessionId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
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

        {/* Debug Info (só em dev) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-4 max-w-4xl mx-auto bg-gray-900/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-xs font-mono text-gray-500 space-y-1">
                <p>🔐 Device ID: {deviceSessionId || '⏳ Gerando...'}</p>
                <p>📡 MP Ready: {mpReady ? '✅ Sim' : '⏳ Não'}</p>
                <p>🔄 Tentativas: {mpLoadAttempts}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
