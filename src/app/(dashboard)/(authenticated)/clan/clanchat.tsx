'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
  user_id: string;
};

type ClanChatProps = {
  clanId: string;
  userId: string;
  userName: string;
  supabase: any;
};

export function ClanChat({ clanId, userId, userName, supabase }: ClanChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens iniciais
  useEffect(() => {
    loadMessages();
  }, [clanId]);

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`clan_chat_${clanId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clan_chat_messages',
          filter: `clan_id=eq.${clanId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'clan_chat_messages',
          filter: `clan_id=eq.${clanId}`,
        },
        (payload: any) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('Chat status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clanId, supabase]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clan_chat_messages')
        .select('*')
        .eq('clan_id', clanId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar mensagens',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = newMessage.trim();
    
    // Validações
    if (!trimmedMessage) return;
    
    if (trimmedMessage.length > 60) {
      toast({
        variant: 'destructive',
        title: 'Mensagem muito longa',
        description: 'Máximo de 60 caracteres permitido.',
      });
      return;
    }

    // Anti-flood: 2 segundos entre mensagens
    const now = Date.now();
    if (now - lastMessageTime < 2000) {
      toast({
        variant: 'destructive',
        title: 'Calma aí!',
        description: 'Aguarde 2 segundos entre mensagens.',
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase
  .from('clan_chat_messages')
  .insert({
    clan_id: clanId,
    user_id: userId,
    user_name: userName,
    message: trimmedMessage,
  })
  .select()
  .single();

if (error) throw error;

if (data) {
  setMessages((prev) => [...prev, data as ChatMessage]);
  scrollToBottom();
}

setNewMessage('');
      setLastMessageTime(now);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar mensagem',
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes === 0 ? 'agora' : `${minutes}m atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="text-primary" />
          Chat do Clã
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Mensagens são deletadas após 24 horas • Máximo 60 caracteres
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de mensagens */}
        <ScrollArea className="h-80 w-full rounded-md border p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma mensagem ainda.
                <br />
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {isOwnMessage ? 'Você' : msg.user_name}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input de mensagem */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={60}
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground">
          {newMessage.length}/60 caracteres
        </p>
      </CardContent>
    </Card>
  );
}