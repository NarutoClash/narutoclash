'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase, useMemoSupabase, useDoc, useCollection, WithId } from '@/supabase';
import { Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    query: (builder: any) => builder.eq('is_active', true),
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
        // Verificar autenticação
        const { data: authData } = await supabase.auth.getUser();
        console.log('👤 User autenticado:', authData.user?.id);
        console.log('✅ IDs são iguais?', user.id === authData.user?.id);
    
        // 🆕 VERIFICAR SE JÁ POSSUI ESTE ITEM (pelo premium_item_id)
console.log('🔍 Verificando se já possui o item...');

// Para Premium Pass, verificar se já tem um ativo
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

// Para Boosts, verificar se já tem o mesmo tipo ativo
if (item.item_type === 'boost' || item.item_type === 'ryo_boost' || item.item_type === 'xp_boost') {
  const { data: existingBoost, error: checkError } = await supabase
    .from('user_premium_inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('premium_item_id', item.id) // ✅ Usar premium_item_id
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
    
        // Para Boosts, verificar se já tem o mesmo tipo ativo
        if (item.item_type === 'boost' || item.item_type === 'ryo_boost' || item.item_type === 'xp_boost') {
          const { data: existingBoost, error: checkError } = await supabase
            .from('user_premium_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_type', item.item_type)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();
    
          if (checkError) {
            console.error('❌ Erro ao verificar boost:', checkError);
            throw new Error(`Erro ao verificar boost: ${checkError.message}`);
          }
    
          if (existingBoost) {
            const expiresAt = new Date(existingBoost.expires_at);
            toast({
              variant: 'destructive',
              title: 'Boost Ativo',
              description: `Você já possui este tipo de boost ativo até ${expiresAt.toLocaleString('pt-BR')}`,
            });
            setIsLoading(false);
            return;
          }
        }
    
        // Descontar Clash Points
        console.log('💸 Descontando Clash Points...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ clash_points: userProfile.clash_points - item.price_cp })
          .eq('id', user.id);
    
        if (updateError) {
          console.error('❌ Erro ao descontar CP:', updateError);
          throw new Error(`Erro ao descontar CP: ${updateError.message}`);
        }
    
        // ✅ GERAR UUID ÚNICO PARA item_id
        const newItemId = crypto.randomUUID();
        console.log('🆔 Novo item_id gerado:', newItemId);
    
// Preparar dados do inventário
const now = new Date();
const inventoryData: any = {
  user_id: user.id,  // ✅ ID do usuário autenticado
  item_id: crypto.randomUUID(), // ✅ UUID único para esta compra específica
  premium_item_id: item.id, // ✅ Referência ao item da loja premium_items
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

// Calcular expires_at baseado no tipo (seu código já faz isso)
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

// Adicionar ao inventário
console.log('📦 Dados para inserir:', JSON.stringify(inventoryData, null, 2));

const { data: insertedData, error: inventoryError } = await supabase
  .from('user_premium_inventory')
  .insert(inventoryData)
  .select();

console.log('✅ Dados inseridos:', insertedData);

if (inventoryError) {
  console.error('❌ Erro ao adicionar ao inventário:', inventoryError);
  console.error('📋 Detalhes completos:', JSON.stringify(inventoryError, null, 2));
  
  // Tentar reverter o desconto de CP
  await supabase
    .from('profiles')
    .update({ clash_points: userProfile.clash_points })
    .eq('id', user.id);
  
  throw new Error(`Erro ao adicionar ao inventário: ${inventoryError.message || JSON.stringify(inventoryError)}`);
}
    
        // Registrar compra
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
    
        // Registrar transação
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
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader 
        title="Mercado Premium" 
        description="Adquira itens exclusivos com Clash Points"
      />

      {/* Saldo de Clash Points */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" />
            Seus Clash Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-yellow-500">💎 {userProfile.clash_points}</span>
            <span className="text-sm text-muted-foreground">CP disponíveis</span>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Categoria */}
      <div className="mt-8 flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </Button>
        ))}
      </div>

      {/* Grid de Itens */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areItemsLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge>{item.category}</Badge>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-yellow-500">
                    💎 {item.price_cp} CP
                  </span>
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={isLoading || userProfile.clash_points < item.price_cp}
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
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum item disponível nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}