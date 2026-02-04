import { useEffect, useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

export function useMessages(supabase: SupabaseClient | null, userId: string | undefined) {
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Mensagens recebidas
      const { data: inboxData, error: inboxError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (inboxError) {
        console.error('Erro ao buscar inbox:', inboxError);
      }

      // Buscar perfis dos remetentes
      let enrichedInbox: Message[] = [];
      if (inboxData && inboxData.length > 0) {
        const senderIds = [...new Set(inboxData.map(m => m.sender_id))];
        const { data: sendersProfiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', senderIds);

        const profilesMap = new Map(sendersProfiles?.map(p => [p.id, p]) || []);
        
        enrichedInbox = inboxData.map(msg => ({
          ...msg,
          sender: profilesMap.get(msg.sender_id),
        }));
        
        setInbox(enrichedInbox);
        setUnreadCount(enrichedInbox.filter(m => !m.read).length);
      } else {
        setInbox([]);
        setUnreadCount(0);
      }

      // Mensagens enviadas
      const { data: sentData, error: sentError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error('Erro ao buscar sent:', sentError);
      }

      // Buscar perfis dos destinatários
      let enrichedSent: Message[] = [];
      if (sentData && sentData.length > 0) {
        const receiverIds = [...new Set(sentData.map(m => m.receiver_id))];
        const { data: receiversProfiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', receiverIds);

        const profilesMap = new Map(receiversProfiles?.map(p => [p.id, p]) || []);
        
        enrichedSent = sentData.map(msg => ({
          ...msg,
          receiver: profilesMap.get(msg.receiver_id),
        }));
        
        setSent(enrichedSent);
      } else {
        setSent([]);
      }

    } catch (error) {
      console.error('Erro geral ao buscar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchMessages();

    if (!supabase || !userId) return;

    // Realtime subscription
    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchMessages]);

  const sendMessage = async (receiverId: string, subject: string, content: string) => {
    if (!supabase || !userId) return { error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        subject,
        content,
      })
      .select();

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
    } else {
      console.log('Mensagem enviada com sucesso:', data);
      // Atualizar lista após enviar
      await fetchMessages();
    }

    return { error };
  };

  const markAsRead = async (messageId: string) => {
    if (!supabase) return;
  
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
  
    if (error) {
      console.error('Erro ao marcar como lida:', error);
    }
    
    // Atualizar imediatamente a contagem local
    setInbox(prevInbox => 
      prevInbox.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteMessage = async (messageId: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Erro ao deletar:', error);
    } else {
      // Atualizar lista após deletar
      await fetchMessages();
    }
  };

  return {
    inbox,
    sent,
    unreadCount,
    isLoading,
    sendMessage,
    markAsRead,
    deleteMessage,
    refreshMessages: fetchMessages,
  };
}