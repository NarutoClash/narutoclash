import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export const PREMIUM_ITEM_TYPE = 'premium_pass';
export const PREMIUM_DURATION_DAYS = 30;

export interface PremiumItemData {
  name: string;
  description: string;
  benefits: {
    mission_refreshes: number;
    max_jutsus_per_element: number;
    exclusive_weapons: boolean;
    exclusive_summons: boolean;
  };
  duration_days: number;
}

export interface PremiumPassData {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  item_data: PremiumItemData;
  quantity?: number | null;
  is_equipped?: boolean | null;
  expires_at: string | null;
  acquired_at?: string | null;
}

export interface PremiumStatus {
  isActive: boolean;
  expiresAt: string | null;
  itemData: PremiumItemData | null;
  passData: PremiumPassData | null;
}

// ✅ Função helper para verificar status premium
export const checkPremiumStatus = (premiumData: any[] | null): PremiumStatus => {
  if (!premiumData || premiumData.length === 0) {
    return { 
      isActive: false, 
      expiresAt: null,
      itemData: null,
      passData: null,
    };
  }

  const activePremium = premiumData.find((item: any) => {
    if (item.item_type !== PREMIUM_ITEM_TYPE) return false;
    const expiresAt = new Date(item.expires_at);
    return expiresAt > new Date();
  });

  if (activePremium) {
    return {
      isActive: true,
      expiresAt: activePremium.expires_at,
      itemData: activePremium.item_data || null,
      passData: activePremium,
    };
  }

  return { 
    isActive: false, 
    expiresAt: null,
    itemData: null,
    passData: null,
  };
};

// ✅ Hook principal
export const usePremiumStatus = (
  supabase: SupabaseClient | null, 
  userId: string | undefined
) => {
  const [isActive, setIsActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [itemData, setItemData] = useState<PremiumItemData | null>(null);
  const [passData, setPassData] = useState<PremiumPassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setIsActive(false);
      setExpiresAt(null);
      setItemData(null);
      setPassData(null);
      setIsLoading(false);
      return;
    }

    const checkPremiumStatusAsync = async () => {
      try {
        // 🆕 VERIFICAR PREMIUM PASS NO INVENTÁRIO COM TODOS OS DADOS
        const { data: premiumPass, error: passError } = await supabase
          .from('user_premium_inventory')
          .select('id, user_id, item_id, item_type, item_data, quantity, is_equipped, expires_at, acquired_at')
          .eq('user_id', userId)
          .eq('item_type', 'premium_pass')
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .single();

        if (!passError && premiumPass) {
          setIsActive(true);
          setExpiresAt(premiumPass.expires_at);
          setItemData(premiumPass.item_data || null);
          setPassData(premiumPass as PremiumPassData);
          setIsLoading(false);
          
          console.log('✅ Premium Pass Ativo:', {
            name: premiumPass.item_data?.name,
            expires_at: premiumPass.expires_at,
            benefits: premiumPass.item_data?.benefits,
          });
          
          return;
        }

        // 🔄 FALLBACK: Verificar assinatura tradicional
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('expires_at, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .single();

        if (!subError && subscription) {
          setIsActive(true);
          setExpiresAt(subscription.expires_at);
          setItemData(null); // Assinatura antiga não tem item_data
          setPassData(null);
          
          console.log('✅ Assinatura Tradicional Ativa');
        } else {
          setIsActive(false);
          setExpiresAt(null);
          setItemData(null);
          setPassData(null);
          
          console.log('❌ Nenhum Premium Ativo');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status premium:', error);
        setIsActive(false);
        setExpiresAt(null);
        setItemData(null);
        setPassData(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatusAsync();

    // 🔄 Atualizar a cada 5 minutos
    const interval = setInterval(checkPremiumStatusAsync, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [supabase, userId]);

  return { 
    isActive, 
    expiresAt, 
    itemData,
    passData,
    isLoading,
  };
};