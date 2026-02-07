'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase, useMemoSupabase, useDoc, useCollection, WithId } from '@/supabase';
import { Loader2, ShoppingCart, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PremiumItem = {
  name: string;
  description: string;
  category: string;
  price_cp: number;
  item_type: string;
  item_data: any;
  image_url?: string;
  is_active: boolean;
};

export default function MercadoPremiumPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Buscar perfil do usuário
  const userProfileRef = useMemoSupabase(() => user ? { table: 'profiles', id: user.id } : null, [user]);
  const { data: userProfile } = useDoc(userProfileRef);

  // Buscar itens premium
  const itemsQuery = useMemoSupabase(() => ({
    table: 'premium_items',
    query: (builder: any) => builder.eq('is_active', true).order('category', { ascending: true }),
  }), []);
  const { data: premiumItems, isLoading: areItemsLoading } = useCollection<WithId<PremiumItem>>(itemsQuery);

  const categories = [
    { id: 'all', label: 'Todos', icon: '🎯' },
    { id: 'cosmetic', label: 'Cosméticos', icon: '✨' },
    { id: 'boost', label: 'Boosts', icon: '⚡' },
    { id: 'utility', label: 'Utilidades', icon: '🔧' },
    { id: 'exclusive', label: 'Exclusivos', icon: '👑' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? premiumItems 
    : premiumItems?.filter(item => item.category === selectedCategory);

  const handlePurchase = async (item: WithId<PremiumItem>) => {
    if (!user || !supabase || !userProfile) return;

    console.log('🛒 Iniciando compra:', item.name);
    console.log('💰 CP do usuário:', userProfile.clash_points);
    console.log('💎 Preço do item:', item.price_cp);
    console.log('🆔 Premium Item ID:', item.id);

    if (userProfile.clash_points < item.price_cp) {
      toast({
        variant: 'destructive',
        title: 'Clash Points Insuficientes',
        description: `Você precisa de ${item.price_cp} CP, mas só tem ${userProfile.clash_points} CP.`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // ✅ 1. Verificar se o item existe e está ativo
      const { data: premiumItemCheck, error: itemCheckError } = await supabase
        .from('premium_items')
        .select('*')
        .eq('id', item.id)
        .eq('is_active', true)
        .single();

      if (itemCheckError || !premiumItemCheck) {
        toast({
          variant: 'destructive',
          title: 'Item Indisponível',
          description: 'Este item não está mais disponível para compra.',
        });
        setIsLoading(false);
        return;
      }

      // ✅ 2. VERIFICAR SE JÁ POSSUI ESTE ITEM (usando premium_item_id)
      console.log('🔍 Verificando se já possui o item...');

      // Para Premium Pass - verificar se já tem um ativo
      if (item.item_type === 'premium_pass') {
        const { data: existingPass, error: checkError } = await supabase
          .from('user_premium_inventory')
          .select('*')
          .eq('user_id', user.id)
          .eq('premium_item_id', item.id) // ✅ Usar premium_item_id
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Erro ao verificar Premium Pass:', checkError);
          throw new Error(`Erro ao verificar Premium Pass: ${checkError.message}`);
        }

        if (existingPass) {
          toast({
            variant: 'destructive',
            title: 'Premium Pass Ativo',
            description: `Você já possui um Premium Pass ativo até ${new Date(existingPass.expires_at).toLocaleDateString('pt-BR')}`,
          });
          setIsLoading(false);
          return;
        }
      }

      // Para Boosts - verificar se já tem este boost específico ativo
      if (item.item_type === 'boost' || item.item_type === 'ryo_boost' || item.item_type === 'xp_boost') {
        const { data: existingBoost, error: checkError } = await supabase
          .from('user_premium_inventory')
          .select('*')
          .eq('user_id', user.id)
          .eq('premium_item_id', item.id) // ✅ Usar premium_item_id para verificar o item específico
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Erro ao verificar boost:', checkError);
          throw new Error(`Erro ao verificar boost: ${checkError.message}`);
        }

        if (existingBoost) {
          const expiresAt = new Date(existingBoost.expires_at);
          toast({
            variant: 'destructive',
            title: 'Boost Ativo',
            description: `Você já possui este boost ativo até ${expiresAt.toLocaleString('pt-BR')}`,
          });
          setIsLoading(false);
          return;
        }
      }

      // ✅ 3. Descontar Clash Points
      console.log('💸 Descontando Clash Points...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ clash_points: userProfile.clash_points - item.price_cp })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erro ao descontar CP:', updateError);
        throw new Error(`Erro ao descontar CP: ${updateError.message}`);
      }

      // ✅ 4. Preparar dados do inventário
      const now = new Date();
      const inventoryData: any = {
        user_id: user.id,
        item_id: crypto.randomUUID(), // ✅ UUID único para esta compra
        premium_item_id: item.id, // ✅ FK para premium_items
        item_type: item.item_type,
        item_data: {
          ...item.item_data,
          name: item.name,
          description: item.description,
        },
        quantity: null,
        is_equipped: false,
        acquired_at: now.toISOString(),
      };

      // ✅ 5. Calcular expires_at baseado no tipo
      if (item.item_type === 'premium_pass') {
        const durationDays = item.item_data?.duration_days || 30;
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        inventoryData.expires_at = expiresAt.toISOString();
        
        inventoryData.item_data = {
          name: item.name || 'Premium Pass - 30 Dias',
          description: item.description || 'Acesso premium completo por 30 dias',
          benefits: item.item_data?.benefits || {
            mission_refreshes: 3,
            max_jutsus_per_element: 5,
            exclusive_weapons: true,
            exclusive_summons: true,
          },
          duration_days: durationDays,
          premium_item_id: item.id,
        };
      } 
      else if (item.item_type === 'boost' || item.item_type === 'ryo_boost' || item.item_type === 'xp_boost') {
        let durationInHours = 24;
        
        if (item.item_data?.duration_hours) {
          durationInHours = item.item_data.duration_hours;
        } else if (item.item_data?.duration_days) {
          durationInHours = item.item_data.duration_days * 24;
        }
        
        const expiresAt = new Date(now);
        expiresAt.setHours(expiresAt.getHours() + durationInHours);
        inventoryData.expires_at = expiresAt.toISOString();
        inventoryData.quantity = 1;
      } 
      else if (item.item_type === 'chakra_potion' || item.item_type === 'health_potion') {
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 10);
        inventoryData.expires_at = expiresAt.toISOString();
        inventoryData.quantity = 1;
      }

      // ✅ 6. Adicionar ao inventário
      console.log('📦 Dados para inserir:', JSON.stringify(inventoryData, null, 2));

      const { data: insertedData, error: inventoryError } = await supabase
        .from('user_premium_inventory')
        .insert(inventoryData)
        .select();

      console.log('✅ Dados inseridos:', insertedData);

      if (inventoryError) {
        console.error('❌ Erro ao adicionar ao inventário:', inventoryError);
        console.error('📋 Detalhes completos:', JSON.stringify(inventoryError, null, 2));
        
        // ✅ Tentar reverter o desconto de CP
        await supabase
          .from('profiles')
          .update({ clash_points: userProfile.clash_points })
          .eq('id', user.id);
        
        throw new Error(`Erro ao adicionar ao inventário: ${inventoryError.message || JSON.stringify(inventoryError)}`);
      }

      // ✅ 7. Registrar compra
      console.log('📝 Registrando compra...');
      const { error: purchaseError } = await supabase
        .from('premium_purchases')
        .insert({
          user_id: user.id,
          item_id: item.id,
          item_name: item.name,
          price_paid: item.price_cp,
        });

      if (purchaseError) {
        console.warn('⚠️ Erro ao registrar compra (não crítico):', purchaseError);
      }

      // ✅ 8. Registrar transação
      console.log('💳 Registrando transação...');
      const { error: transactionError } = await supabase
        .from('cp_transactions')
        .insert({
          user_id: user.id,
          amount: -item.price_cp,
          transaction_type: 'purchase',
          description: `Compra: ${item.name}`,
        });

      if (transactionError) {
        console.warn('⚠️ Erro ao registrar transação (não crítico):', transactionError);
      }

      console.log('✅ Compra realizada com sucesso!');
      toast({
        title: '✅ Compra Realizada!',
        description: `${item.name} foi adicionado ao seu inventário!`,
      });

      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error: any) {
      console.error('❌ Erro ao comprar item:', error);
      console.error('📋 Detalhes do erro:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        full: error,
      });
      
      toast({
        variant: 'destructive',
        title: 'Erro na compra',
        description: error?.message || 'Ocorreu um erro desconhecido. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
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
        title="Mercado Premium" 
        description="Adquira itens exclusivos com Clash Points"
      />

      {/* Saldo de Clash Points */}
      <Card className="mt-6 max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Sparkles className="text-yellow-500 animate-pulse" />
            Seus Clash Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-yellow-500">
              💎 {userProfile.clash_points}
            </span>
            <span className="text-sm text-gray-400">CP disponíveis</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerta Informativo */}
      <Alert className="mt-6 max-w-4xl mx-auto bg-blue-500/10 border-blue-500/30">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-gray-300">
          <strong className="text-blue-400">Dica:</strong> Compre Clash Points na loja para adquirir itens premium!
        </AlertDescription>
      </Alert>

      {/* Filtros de Categoria */}
      <div className="mt-8 max-w-6xl mx-auto flex gap-2 flex-wrap justify-center">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
            className={selectedCategory === cat.id ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            {cat.icon} {cat.label}
          </Button>
        ))}
      </div>

      {/* Grid de Itens */}
      <div className="mt-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areItemsLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <Card 
              key={item.id} 
              className="hover:shadow-xl hover:shadow-orange-500/20 transition-all bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-orange-400">{item.name}</CardTitle>
                  <Badge className="bg-orange-500">{item.category}</Badge>
                </div>
                <CardDescription className="text-gray-400">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-yellow-500">
                    💎 {item.price_cp} CP
                  </span>
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={isLoading || userProfile.clash_points < item.price_cp}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Comprar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            Nenhum item disponível nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}
