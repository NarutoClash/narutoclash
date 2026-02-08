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
    query: (builder: any) => builder
      .eq('is_active', true)
      .order('sort_order', { ascending: true }), // 👈 ORDENAR POR sort_order
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
        // ✅ 1. VERIFICAR SE JÁ POSSUI ITEM DO MESMO TIPO ATIVO (APENAS PARA NÃO-STACKABLE)
        
        // Para Premium Pass - só pode ter 1 ativo
        if (item.item_type === 'premium_pass') {
          const { data: existingPass, error: checkError } = await supabase
            .from('user_premium_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_type', 'premium_pass')
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();
    
          if (checkError && checkError.code !== 'PGRST116') {
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
    
        // Para XP Boost - só pode ter 1 ativo (qualquer um dos 3)
        if (item.item_type === 'xp_boost') {
          const { data: existingBoost, error: checkError } = await supabase
            .from('user_premium_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_type', 'xp_boost')
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();
    
          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(`Erro ao verificar XP Boost: ${checkError.message}`);
          }
    
          if (existingBoost) {
            const expiresAt = new Date(existingBoost.expires_at);
            toast({
              variant: 'destructive',
              title: 'XP Boost Ativo',
              description: `Você já possui um Pergaminho de Sabedoria ativo até ${expiresAt.toLocaleString('pt-BR')}`,
            });
            setIsLoading(false);
            return;
          }
        }
    
        // Para Ryo Boost - só pode ter 1 ativo (qualquer um dos 3)
        if (item.item_type === 'ryo_boost') {
          const { data: existingBoost, error: checkError } = await supabase
            .from('user_premium_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_type', 'ryo_boost')
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();
    
          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(`Erro ao verificar Ryo Boost: ${checkError.message}`);
          }
    
          if (existingBoost) {
            const expiresAt = new Date(existingBoost.expires_at);
            toast({
              variant: 'destructive',
              title: 'Ryo Boost Ativo',
              description: `Você já possui uma Bolsa de Riqueza ativa até ${expiresAt.toLocaleString('pt-BR')}`,
            });
            setIsLoading(false);
            return;
          }
        }
    
        // ✅ 2. Descontar Clash Points
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ clash_points: userProfile.clash_points - item.price_cp })
          .eq('id', user.id);
    
        if (updateError) throw new Error(`Erro ao descontar CP: ${updateError.message}`);
    
        // ✅ 3. Preparar dados do inventário
        const now = new Date();
        const isStackable = item.item_data?.stackable === true;
    
        // 🆕 VERIFICAR SE JÁ EXISTE ITEM STACKABLE DO MESMO TIPO
        if (isStackable && (item.item_type === 'chakra_potion' || item.item_type === 'health_potion')) {
          const { data: existingItem, error: findError } = await supabase
            .from('user_premium_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('premium_item_id', item.id)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();
    
          if (findError && findError.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar item existente: ${findError.message}`);
          }
    
          if (existingItem) {
            // ✅ INCREMENTAR QUANTIDADE DO ITEM EXISTENTE
            const newQuantity = (existingItem.quantity || 1) + 1;
            
            const { error: updateItemError } = await supabase
              .from('user_premium_inventory')
              .update({ quantity: newQuantity })
              .eq('id', existingItem.id);
    
            if (updateItemError) {
              // Reverter desconto de CP
              await supabase
                .from('profiles')
                .update({ clash_points: userProfile.clash_points })
                .eq('id', user.id);
              
              throw new Error(`Erro ao atualizar quantidade: ${updateItemError.message}`);
            }
    
            // ✅ Registrar compra e transação
            await supabase.from('premium_purchases').insert({
              user_id: user.id,
              item_id: item.id,
              item_name: item.name,
              price_paid: item.price_cp,
            });
    
            await supabase.from('cp_transactions').insert({
              user_id: user.id,
              amount: -item.price_cp,
              transaction_type: 'purchase',
              description: `Compra: ${item.name}`,
            });
    
            toast({
              title: '✅ Compra Realizada!',
              description: `${item.name} adicionado! Quantidade total: ${newQuantity}`,
            });
    
            setTimeout(() => window.location.reload(), 1000);
            setIsLoading(false);
            return;
          }
        }
    
        // ✅ 4. CRIAR NOVO ITEM NO INVENTÁRIO
        const inventoryData: any = {
          user_id: user.id,
          item_id: crypto.randomUUID(),
          premium_item_id: item.id,
          item_type: item.item_type,
          item_data: {
            ...item.item_data,
            name: item.name,
            description: item.description,
          },
          quantity: 1,
          is_equipped: false,
          acquired_at: now.toISOString(),
        };
    
        // ✅ 5. Calcular expires_at baseado no tipo
        if (item.item_type === 'premium_pass') {
          const durationDays = item.item_data?.duration_days || 30;
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + durationDays);
          inventoryData.expires_at = expiresAt.toISOString();
          inventoryData.quantity = null;
          
          inventoryData.item_data = {
            name: item.name,
            description: item.description,
            benefits: [
              "3x atualizações de missões",
              "5 jutsus por elemento",
              "Armas exclusivas",
              "Equipamentos exclusivos"
            ],
            duration_days: durationDays,
          };
        } 
        else if (item.item_type === 'xp_boost' || item.item_type === 'ryo_boost') {
          const durationDays = item.item_data?.duration_days || 1;
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + durationDays);
          inventoryData.expires_at = expiresAt.toISOString();
        } 
        else if (item.item_type === 'chakra_potion' || item.item_type === 'health_potion') {
          const expiresAt = new Date(now);
          expiresAt.setFullYear(expiresAt.getFullYear() + 10);
          inventoryData.expires_at = expiresAt.toISOString();
        }
    
        // ✅ 6. Adicionar ao inventário
        const { error: inventoryError } = await supabase
          .from('user_premium_inventory')
          .insert(inventoryData);
    
        if (inventoryError) {
          // Reverter desconto de CP
          await supabase
            .from('profiles')
            .update({ clash_points: userProfile.clash_points })
            .eq('id', user.id);
          
          throw new Error(`Erro ao adicionar ao inventário: ${inventoryError.message}`);
        }
    
        // ✅ 7. Registrar compra
        await supabase.from('premium_purchases').insert({
          user_id: user.id,
          item_id: item.id,
          item_name: item.name,
          price_paid: item.price_cp,
        });
    
        // ✅ 8. Registrar transação
        await supabase.from('cp_transactions').insert({
          user_id: user.id,
          amount: -item.price_cp,
          transaction_type: 'purchase',
          description: `Compra: ${item.name}`,
        });
    
        toast({
          title: '✅ Compra Realizada!',
          description: `${item.name} foi adicionado ao seu inventário!`,
        });
    
        setTimeout(() => window.location.reload(), 1000);
        
      } catch (error: any) {
        console.error('❌ Erro ao comprar item:', error);
        
        toast({
          variant: 'destructive',
          title: 'Erro na compra',
          description: error?.message || 'Ocorreu um erro desconhecido.',
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
  className="hover:shadow-xl hover:shadow-orange-500/20 transition-all bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30 flex flex-col min-h-[320px]" // 👈 min-h-[320px] para cards maiores
>
  <CardHeader className="flex-grow pb-2"> {/* 👈 pb-2 para reduzir espaço */}
    <div className="flex justify-between items-start gap-2 mb-3">
      <CardTitle className="text-xl text-orange-400 leading-tight"> {/* 👈 text-xl e sem line-clamp */}
        {item.name}
      </CardTitle>
      <Badge className="bg-orange-500 shrink-0 text-xs">{item.category}</Badge>
    </div>
    <CardDescription className="text-gray-400 text-sm leading-relaxed"> {/* 👈 sem line-clamp, leading-relaxed */}
      {item.description}
    </CardDescription>
  </CardHeader>
  
  <CardContent className="space-y-3 mt-auto pt-4"> {/* 👈 space-y-3 e pt-4 */}
    {/* Preço */}
    <div className="text-center pb-2 border-b border-orange-500/20">
      <span className="text-3xl font-bold text-yellow-500"> {/* 👈 text-3xl para destaque */}
        💎 {item.price_cp} CP
      </span>
    </div>
    
    {/* Informação de quantidade (se aplicável) */}
    {item.item_data?.stackable && (
      <div className="text-center text-sm text-gray-400">
        ✨ Item empilhável
      </div>
    )}
    
    {/* Botão de Comprar */}
    <Button
      onClick={() => handlePurchase(item)}
      disabled={isLoading || userProfile.clash_points < item.price_cp}
      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 h-12 text-base font-semibold" // 👈 w-full, h-12, text-base
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Comprar
        </>
      )}
    </Button>
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
