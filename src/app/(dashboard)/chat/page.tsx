'use client';
   
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSupabase, useDoc, useMemoSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { villageImages } from '@/lib/village-images';

type ChatMessage = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_village: string | null;
  message: string;
  created_at: string;
};

const COOLDOWN_MS = 10000; // 10 segundos
const MAX_MESSAGE_LENGTH = 60;

export default function ChatPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  
  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);
  
  const { data: userProfile } = useDoc(userProfileRef);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
  
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;
  
    setShouldAutoScroll(isAtBottom);
  };
  

  const scrollToBottom = () => {
    if (!shouldAutoScroll) return;
  
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  

  // Buscar mensagens iniciais e configurar refresh periódico
useEffect(() => {
  const fetchMessages = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('global_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      // ✅ Atualizar mensagens sem duplicar
      setMessages(prevMessages => {
        if (!data) return prevMessages;
        
        // Criar um Map para evitar duplicatas
        const messagesMap = new Map();
        
        // Adicionar mensagens existentes
        prevMessages.forEach(msg => messagesMap.set(msg.id, msg));
        
        // Adicionar/atualizar com novas mensagens
        data.forEach(msg => messagesMap.set(msg.id, msg));
        
        // Converter de volta para array e ordenar
        return Array.from(messagesMap.values()).sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      
      // Buscar último tempo de mensagem do usuário
      if (user && isLoading) {
        const { data: lastMsg } = await supabase
          .from('global_chat')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastMsg) {
          setLastMessageTime(new Date(lastMsg.created_at).getTime());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar mensagens inicialmente
  fetchMessages();
  
  // ✅ REFRESH AUTOMÁTICO A CADA 3 SEGUNDOS
  const refreshInterval = setInterval(() => {
    fetchMessages();
  }, 3000);
  
  return () => clearInterval(refreshInterval);
}, [supabase, user, isLoading]);

  // Inscrever-se para novas mensagens em tempo real
useEffect(() => {
  if (!supabase) return;
  
  const channel = supabase
    .channel('global_chat_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'global_chat',
      },
      (payload) => {
        const newMsg = payload.new as ChatMessage;
        // ✅ Verificar se a mensagem já existe antes de adicionar
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === newMsg.id);
          if (exists) return prev; // Não adicionar se já existe
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'global_chat',
      },
      (payload) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [supabase]);

  // Timer de cooldown
  useEffect(() => {
    if (!lastMessageTime) {
      setCooldownRemaining(0);
      return;
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastMessageTime;
      const remaining = Math.max(0, COOLDOWN_MS - elapsed);
      
      setCooldownRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [lastMessageTime]);
  // Auto-deletar mensagens antigas (client-side)
useEffect(() => {
  if (!supabase) return;
  
  const cleanupOldMessages = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    await supabase
      .from('global_chat')
      .delete()
      .lt('created_at', tenMinutesAgo);
  };
  
  // Executar limpeza a cada 2 minutos
  const cleanupInterval = setInterval(cleanupOldMessages, 2 * 60 * 1000);
  
  // Executar uma vez ao carregar
  cleanupOldMessages();
  
  return () => clearInterval(cleanupInterval);
}, [supabase]);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !supabase || !userProfile) return;
    
    const trimmedMessage = newMessage.trim();
    
    // Validações
    if (!trimmedMessage) {
      toast({
        variant: 'destructive',
        title: 'Mensagem vazia',
        description: 'Digite algo antes de enviar.',
      });
      return;
    }
    
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Mensagem muito longa',
        description: `Máximo de ${MAX_MESSAGE_LENGTH} caracteres.`,
      });
      return;
    }
    
    // Verificar cooldown
    if (cooldownRemaining > 0) {
      toast({
        variant: 'destructive',
        title: 'Aguarde',
        description: `Você pode enviar outra mensagem em ${Math.ceil(cooldownRemaining / 1000)}s.`,
      });
      return;
    }
    
    // Verificar se a última mensagem não é do mesmo usuário
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.user_id === user.id) {
      toast({
        variant: 'destructive',
        title: 'Mensagem duplicada',
        description: 'Aguarde outro jogador enviar uma mensagem antes de enviar outra.',
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('global_chat')
        .insert({
          user_id: user.id,
          user_name: userProfile.name,
          user_avatar: userProfile.avatar_url,
          user_village: userProfile.village,
          message: trimmedMessage,
        });
      
      if (error) throw error;
      
      setNewMessage('');
      setLastMessageTime(Date.now());
      
      // Limpar mensagens antigas (manter últimas 100)
      await supabase.rpc('cleanup_old_messages');
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: error?.message || 'Não foi possível enviar a mensagem.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <PageHeader title="Chat Global" description="Carregando mensagens..." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Chat Global"
        description="Converse com ninjas de todas as vilas."
      />
      
      <Card className="mt-6 flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Global
          </CardTitle>
        </CardHeader>
        
        <CardContent
  ref={chatContainerRef}
  onScroll={handleScroll}
  className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]"
>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Seja o primeiro a falar!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.user_id === user?.id;
              const villageImage = msg.user_village ? villageImages[msg.user_village] : null;
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 items-start',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={msg.user_avatar || undefined} />
                    <AvatarFallback>{msg.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className={cn('flex flex-col gap-1 max-w-[70%]', isOwnMessage && 'items-end')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{msg.user_name}</span>
                      {villageImage && (
                        <Image
                          src={villageImage.imageUrl}
                          alt={villageImage.description}
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                      )}
                    </div>
                    
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 break-words',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <div className="flex gap-2 w-full">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  cooldownRemaining > 0
                    ? `Aguarde ${Math.ceil(cooldownRemaining / 1000)}s...`
                    : `Digite sua mensagem (máx. ${MAX_MESSAGE_LENGTH} caracteres)...`
                }
                disabled={isSending || cooldownRemaining > 0 || !userProfile}
                maxLength={MAX_MESSAGE_LENGTH}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {newMessage.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={
                isSending ||
                !newMessage.trim() ||
                cooldownRemaining > 0 ||
                !userProfile
              }
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}