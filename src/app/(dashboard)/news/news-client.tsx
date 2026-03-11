'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/supabase';
import { Badge } from '@/components/ui/badge';
import { Bell, Sparkles, Check, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { News } from '@/lib/supabase';

export function NewsClient() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [news, setNews] = useState<News[]>([]);
  const [readNews, setReadNews] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Função para mostrar notificação do navegador
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'naruto-clash-news',
        requireInteraction: false,
      });
    }
  };

  // 🆕 Buscar mensagens não lidas
  useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = async () => {
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      const { count: reportsCount } = await supabase
        .from('battle_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('viewed', false);

      setUnreadMessages((messagesCount || 0) + (reportsCount || 0));
    };

    fetchUnreadMessages();

    // Subscrever mudanças em tempo real
    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => fetchUnreadMessages()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_reports',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUnreadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, supabase]);

  // Buscar notícias do Supabase
  useEffect(() => {
    const fetchNews = async () => {
      console.log('🔍 Buscando notícias...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar notícias:', error);
        setLoading(false);
        return;
      }

      console.log('✅ Notícias encontradas:', data?.length || 0);
      setNews(data || []);
      setLoading(false);
    };

    fetchNews();
  }, [supabase]);

  // Buscar notícias já lidas pelo usuário
  useEffect(() => {
    if (!user || news.length === 0) return;

    const fetchReadNews = async () => {
      const { data } = await supabase
        .from('user_news_read')
        .select('news_id')
        .eq('user_id', user.id);

      if (data) {
        const readIds = new Set(data.map(item => item.news_id));
        setReadNews(readIds);
        
        // Contar notícias não lidas que são atualizações
        const unread = news.filter(n => n.is_update && !readIds.has(n.id)).length;
        setUnreadCount(unread);
      }
    };

    fetchReadNews();
  }, [user, supabase, news]);

  // Subscrever a novas notícias em tempo real com notificações
  useEffect(() => {
    const channel = supabase
      .channel('news_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news',
          filter: 'published=eq.true'
        },
        (payload) => {
          const newNews = payload.new as News;
          console.log('📢 Nova notícia recebida!', newNews);
          
          // Adicionar notícia à lista
          setNews(prev => [newNews, ...prev]);
          
          // Atualizar contador de não lidas
          if (newNews.is_update) {
            setUnreadCount(prev => prev + 1);
          }
          
          // Notificação Toast (sempre aparece)
          toast({
            title: '🔥 Nova Atualização!',
            description: newNews.title,
            duration: 5000,
          });

          // Notificação do Navegador (se permitido)
          showBrowserNotification(
            '🔥 Naruto Clash - Nova Atualização!',
            newNews.title
          );

          // Tocar som de notificação (opcional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);

  // Marcar notícia como lida
  const markAsRead = async (newsId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('user_news_read')
        .insert({ user_id: user.id, news_id: newsId });

      setReadNews(prev => new Set([...prev, newsId]));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNews = news.filter(n => !readNews.has(n.id));
      
      if (unreadNews.length === 0) return;

      await supabase
        .from('user_news_read')
        .insert(unreadNews.map(n => ({ user_id: user.id, news_id: n.id })));

      setReadNews(new Set(news.map(n => n.id)));
      setUnreadCount(0);

      toast({
        title: 'Tudo lido!',
        description: 'Todas as notícias foram marcadas como lidas.',
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* 🆕 Banner de mensagens não lidas */}
      {unreadMessages > 0 && user && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500 animate-pulse" />
              <div>
                <p className="text-sm font-semibold">
                  Você tem {unreadMessages} {unreadMessages === 1 ? 'mensagem não lida' : 'mensagens não lidas'}!
                </p>
                <p className="text-xs text-muted-foreground">
                  Confira suas mensagens e relatórios de batalha
                </p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/messages'}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Ver Mensagens
            </Button>
          </div>
        </div>
      )}

      {/* Header com contador de não lidas */}
      {unreadCount > 0 && user && (
        <div className="mb-6 flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-orange-500 animate-pulse" />
            <span className="text-sm font-semibold">
              {unreadCount} {unreadCount === 1 ? 'nova atualização' : 'novas atualizações'}!
            </span>
          </div>
          <Button 
            variant="ghost"
            onClick={markAllAsRead}
            className="text-orange-400 hover:text-orange-300"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      )}

      {/* Lista de notícias */}
      <div className="space-y-6">
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Ainda não há notícias. Volte em breve!
            </p>
          </div>
        ) : (
          news.map((item) => {
            const isUnread = user && item.is_update && !readNews.has(item.id);

            return (
              <article 
                key={item.id}
                className={`
                  relative
                  border rounded-lg p-6 bg-card transition-all cursor-pointer
                  ${isUnread 
                    ? 'border-orange-500/50 shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/30' 
                    : 'hover:shadow-lg'
                  }
                `}
                onClick={() => isUnread && markAsRead(item.id)}
              >
                {/* 🆕 BOLINHA DE NÃO LIDA */}
                {isUnread && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 animate-pulse border-2 border-background z-10" />
                )}

                {/* Badge de nova atualização */}
                {isUnread && (
                  <Badge className="mb-3 bg-gradient-to-r from-orange-500 to-red-600 animate-pulse">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nova Atualização
                  </Badge>
                )}

                <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
                
                <div className="text-sm text-muted-foreground mb-4">
                  {item.author && <span>Por {item.author} • </span>}
                  <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-auto rounded-lg mb-4 max-h-96 object-cover"
                  />
                )}
                
                <div className="whitespace-pre-line text-muted-foreground">
                  {item.content}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}