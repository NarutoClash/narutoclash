'use client';

import * as React from 'react';
import { useSupabase } from '@/supabase';
import { useMessages } from '@/hooks/use-messages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2, Mail, MailOpen, Plus, Search, FileText, Trophy, Swords, TrendingUp, TrendingDown, Clock, Eye, EyeOff, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// 🆕 Hook para buscar relatórios de batalha
const useBattleReports = (supabase: any, userId: string | undefined) => {
  const [reports, setReports] = React.useState<any[]>([]);
  const [unreadReportsCount, setUnreadReportsCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchReports = React.useCallback(async () => {
    if (!supabase || !userId) return;

    try {
      const { data, error } = await supabase
        .from('battle_reports')
        .select(`
          *,
          opponent:opponent_id(id, name, avatar_url, level, village)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
      setUnreadReportsCount((data || []).filter((r: any) => !r.viewed).length);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const markAsViewed = async (reportId: string) => {
    if (!supabase) return;

    try {
      await supabase
        .from('battle_reports')
        .update({ viewed: true, viewed_at: new Date().toISOString() })
        .eq('id', reportId);

      await fetchReports();
    } catch (error) {
      console.error('Erro ao marcar relatório:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!supabase) return;

    try {
      await supabase
        .from('battle_reports')
        .delete()
        .eq('id', reportId);

      await fetchReports();
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
    }
  };

  return {
    reports,
    unreadReportsCount,
    isLoading,
    markAsViewed,
    deleteReport,
    refreshReports: fetchReports,
  };
};

export default function MessagesPage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const { inbox, sent, unreadCount, isLoading, sendMessage, markAsRead, deleteMessage, refreshMessages } = useMessages(supabase, user?.id);
  
  // 🆕 Hook para relatórios
  const { 
    reports, 
    unreadReportsCount, 
    isLoading: isLoadingReports, 
    markAsViewed, 
    deleteReport,
    refreshReports 
  } = useBattleReports(supabase, user?.id);

  const [selectedMessage, setSelectedMessage] = React.useState<any>(null);
  const [selectedReport, setSelectedReport] = React.useState<any>(null);
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  
  // Form state
  const [receiverName, setReceiverName] = React.useState('');
  const [receiverId, setReceiverId] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [content, setContent] = React.useState('');

  // 🆕 Cleanup automático de relatórios antigos
  React.useEffect(() => {
    const cleanupReports = async () => {
      if (!supabase || !user?.id) return;

      const now = Date.now();
      const VIEWED_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
      const UNVIEWED_EXPIRY = 48 * 60 * 60 * 1000; // 48 horas

      try {
        // Deletar relatórios visualizados há mais de 24h
        await supabase
          .from('battle_reports')
          .delete()
          .eq('user_id', user.id)
          .eq('viewed', true)
          .lt('viewed_at', new Date(now - VIEWED_EXPIRY).toISOString());

        // Deletar relatórios não visualizados há mais de 48h
        await supabase
          .from('battle_reports')
          .delete()
          .eq('user_id', user.id)
          .eq('viewed', false)
          .lt('created_at', new Date(now - UNVIEWED_EXPIRY).toISOString());

        refreshReports();
      } catch (error) {
        console.error('Erro no cleanup:', error);
      }
    };

    cleanupReports();
    const interval = setInterval(cleanupReports, 60 * 60 * 1000); // A cada 1 hora

    return () => clearInterval(interval);
  }, [supabase, user?.id, refreshReports]);

  const handleSearch = async () => {
    if (!supabase || searchQuery.length < 3) return;
    
    setIsSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level')
      .ilike('name', `%${searchQuery}%`)
      .limit(10);
    
    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSelectReceiver = (profile: any) => {
    setReceiverId(profile.id);
    setReceiverName(profile.name);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSendMessage = async () => {
    if (!receiverId || !subject || !content) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await sendMessage(receiverId, subject, content);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!",
      });
      setIsComposeOpen(false);
      setReceiverId('');
      setReceiverName('');
      setSubject('');
      setContent('');
    }
  };

  const handleOpenMessage = (message: any) => {
    setSelectedMessage(message);
    if (!message.read && message.receiver_id === user?.id) {
      markAsRead(message.id);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
    setSelectedMessage(null);
    
    toast({
      title: "Sucesso",
      description: "Mensagem excluída",
    });
  };

  // 🆕 Handlers para relatórios
  const handleOpenReport = (report: any) => {
    setSelectedReport(report);
    if (!report.viewed) {
      markAsViewed(report.id);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReport(reportId);
    setSelectedReport(null);
    
    toast({
      title: "Sucesso",
      description: "Relatório excluído",
    });
  };

  const getTimeRemaining = (report: any) => {
    const now = Date.now();
    const createdAt = new Date(report.created_at).getTime();
    const viewedAt = report.viewed_at ? new Date(report.viewed_at).getTime() : null;
    
    const expiryTime = viewedAt 
      ? viewedAt + (24 * 60 * 60 * 1000) // 24h após visualização
      : createdAt + (48 * 60 * 60 * 1000); // 48h após criação
    
    const remaining = expiryTime - now;
    
    if (remaining <= 0) return 'Expirando em breve...';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `Expira em ${hours}h ${minutes}m`;
  };

  if (isLoading && isLoadingReports) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensagens e Relatórios</h1>
          <p className="text-muted-foreground">
            Envie mensagens e veja seus relatórios de batalha
          </p>
        </div>
        
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie uma mensagem para outro jogador
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="receiver">Para:</Label>
                {receiverId ? (
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <span className="text-sm">{receiverName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReceiverId('');
                        setReceiverName('');
                      }}
                    >
                      Mudar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="receiver"
                        placeholder="Buscar jogador..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={isSearching}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <Card>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-1 p-2">
                            {searchResults.map((profile) => (
                              <Button
                                key={profile.id}
                                variant="ghost"
                                className="w-full justify-start gap-3"
                                onClick={() => handleSelectReceiver(profile)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={profile.avatar_url} />
                                  <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium">{profile.name}</span>
                                  <span className="text-xs text-muted-foreground">Nível {profile.level}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </Card>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto:</Label>
                <Input
                  id="subject"
                  placeholder="Digite o assunto..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Mensagem:</Label>
                <Textarea
                  id="content"
                  placeholder="Digite sua mensagem..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendMessage} disabled={!receiverId || !subject || !content}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Mail className="h-4 w-4" />
            Caixa de Entrada
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Enviadas ({sent.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
            {unreadReportsCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadReportsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB CAIXA DE ENTRADA */}
        <TabsContent value="inbox" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Mensagens Recebidas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {inbox.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem recebida
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {inbox.map((message) => (
                        <Card
                          key={message.id}
                          className={`cursor-pointer transition-colors hover:bg-accent ${
                            selectedMessage?.id === message.id ? 'bg-accent' : ''
                          } ${!message.read ? 'border-orange-500' : ''}`}
                          onClick={() => handleOpenMessage(message)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={message.sender?.avatar_url} />
                                <AvatarFallback>
                                  {message.sender?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">
                                    {message.sender?.name}
                                  </p>
                                  {!message.read && (
                                    <Badge variant="destructive" className="h-5">
                                      Nova
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium text-sm">{message.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                              {message.read ? (
                                <MailOpen className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Mail className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Detalhes da Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedMessage.sender?.avatar_url} />
                          <AvatarFallback>
                            {selectedMessage.sender?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{selectedMessage.sender?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(selectedMessage.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Assunto:</Label>
                        <p className="font-semibold">{selectedMessage.subject}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Mensagem:</Label>
                        <Card className="mt-2">
                          <CardContent className="p-4">
                            <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setReceiverId(selectedMessage.sender_id);
                        setReceiverName(selectedMessage.sender?.name);
                        setSubject(`Re: ${selectedMessage.subject}`);
                        setIsComposeOpen(true);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione uma mensagem para visualizar
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB ENVIADAS */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {sent.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem enviada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sent.map((message) => (
                      <Card key={message.id} className="hover:bg-accent transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={message.receiver?.avatar_url} />
                              <AvatarFallback>
                                {message.receiver?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold text-sm">
                                Para: {message.receiver?.name}
                              </p>
                              <p className="font-medium text-sm">{message.subject}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🆕 TAB RELATÓRIOS */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Relatórios de Batalha</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {reports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum relatório disponível
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {reports.map((report) => {
                        const isVictory = report.is_victory;
                        
                        return (
                          <Card
                            key={report.id}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-accent",
                              selectedReport?.id === report.id && "bg-accent",
                              !report.viewed && "border-2",
                              !report.viewed && isVictory && "border-green-500",
                              !report.viewed && !isVictory && "border-red-500"
                            )}
                            onClick={() => handleOpenReport(report)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "h-10 w-10 rounded-full flex items-center justify-center",
                                  isVictory ? "bg-green-500/20" : "bg-red-500/20"
                                )}>
                                  {isVictory ? (
                                    <Trophy className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">
                                      {isVictory ? 'Vitória' : 'Derrota'} vs {report.opponent?.name}
                                    </p>
                                    {!report.viewed && (
                                      <Badge variant="destructive" className="h-5">
                                        Novo
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Swords className="h-3 w-3" />
                                    <span>Nível {report.opponent?.level}</span>
                                    <span>•</span>
                                    {isVictory ? (
                                      <span className="text-green-500 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        +{report.ryo_gained} Ryo, +{report.xp_gained} XP
                                      </span>
                                    ) : (
                                      <span className="text-red-500 flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3" />
                                        -{report.ryo_lost} Ryo
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(report.created_at), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })}
                                  </p>
                                  
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{getTimeRemaining(report)}</span>
                                  </div>
                                </div>
                                
                                {report.viewed ? (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Detalhes da Batalha</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedReport ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedReport.opponent?.avatar_url} />
                          <AvatarFallback>
                            {selectedReport.opponent?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{selectedReport.opponent?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Nível {selectedReport.opponent?.level} - {selectedReport.opponent?.village}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReport(selectedReport.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Resultado da Batalha */}
                    <Card className={cn(
                      "border-2",
                      selectedReport.is_victory ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"
                    )}>
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <div className={cn(
                            "inline-flex items-center gap-2 text-lg font-bold",
                            selectedReport.is_victory ? "text-green-500" : "text-red-500"
                          )}>
                            {selectedReport.is_victory ? (
                              <>
                                <Trophy className="h-5 w-5" />
                                Você Venceu!
                              </>
                            ) : (
                              <>
                                <X className="h-5 w-5" />
                                Você Foi Derrotado!
                              </>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {selectedReport.is_victory ? (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Ryo Ganho</p>
                                  <p className="text-xl font-bold text-green-500">
                                    +{selectedReport.ryo_gained}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">XP Ganho</p>
                                  <p className="text-xl font-bold text-green-500">
                                    +{selectedReport.xp_gained}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Ryo Perdido</p>
                                <p className="text-xl font-bold text-red-500">
                                  -{selectedReport.ryo_lost}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rounds da Batalha */}
                    {selectedReport.rounds && selectedReport.rounds.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Rounds da Batalha</h4>
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-2">
                            {selectedReport.rounds.map((round: any, index: number) => (
                              <Card key={index} className="p-3 bg-muted/20">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-sm">Round {index + 1}</span>
                                  <Badge variant={round.winner === user?.id ? "default" : "destructive"}>
                                    {round.winner === user?.id ? "Vitória" : "Derrota"}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">Seu Ataque</p>
                                    <p className="font-bold">{round.player_damage || 0} de dano</p>
                                    {round.player_jutsu && (
                                      <p className="text-blue-400 mt-1">🔥 {round.player_jutsu}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-muted-foreground">Ataque Inimigo</p>
                                    <p className="font-bold">{round.opponent_damage || 0} de dano</p>
                                    {round.opponent_jutsu && (
                                      <p className="text-orange-400 mt-1">⚡ {round.opponent_jutsu}</p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Informações de Expiração */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/20">
                      <Clock className="h-4 w-4" />
                      <span>{getTimeRemaining(selectedReport)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione um relatório para visualizar
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
