'use client';

import { useEffect, useState, useCallback } from 'react';

export function useUnreadNews(supabase: any, userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!supabase || !userId) {
      setUnreadCount(0);
      return;
    }

    try {
      // Buscar todas as notícias que são updates e estão publicadas
      const { data: newsData } = await supabase
        .from('news')
        .select('id')
        .eq('published', true)
        .eq('is_update', true);

      if (!newsData || newsData.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Buscar quais o usuário já leu
      const { data: readData } = await supabase
        .from('user_news_read')
        .select('news_id')
        .eq('user_id', userId);

      const readIds = new Set(readData?.map((item: any) => item.news_id) || []);
      const unread = newsData.filter((n: any) => !readIds.has(n.id)).length;
      
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao buscar notícias não lidas:', error);
      setUnreadCount(0);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchUnreadCount();

    if (!supabase || !userId) return;

    // Atualizar em tempo real quando novas notícias forem publicadas
    const channel = supabase
      .channel('news_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_news_read',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCount, supabase, userId]);

  return { unreadCount, refreshCount: fetchUnreadCount };
}