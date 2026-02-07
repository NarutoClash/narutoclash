'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/supabase';
import { Badge } from '@/components/ui/badge';
import { Bell, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { News } from '@/lib/supabase';

export function NewsClient({ news }: { news: News[] }) {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const [readNews, setReadNews] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar notícias já lidas pelo usuário
  useEffect(() => {
    if (!user) return;

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

  return (
    <div className="mt-8">
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
            size="sm" 
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
          <p className="text-muted-foreground text-center">
            Ainda não há notícias. Volte em breve!
          </p>
        ) : (
          news.map((item) => {
            const isUnread = user && item.is_update && !readNews.has(item.id);

            return (
              <article 
                key={item.id}
                className={`
                  border rounded-lg p-6 bg-card transition-all cursor-pointer
                  ${isUnread 
                    ? 'border-orange-500/50 shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/30' 
                    : 'hover:shadow-lg'
                  }
                `}
                onClick={() => isUnread && markAsRead(item.id)}
              >
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