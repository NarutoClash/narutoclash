'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { useToast } from '@/hooks/use-toast';
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  Send, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_CHARACTERS = 400;

const messageTypes = [
  {
    value: 'bug',
    label: 'Reportar Bug',
    icon: Bug,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    hoverBgColor: 'hover:bg-red-500/20',
    borderColor: 'border-red-500/30',
    selectedBorderColor: 'border-red-500',
    description: 'Encontrou um erro ou problema no jogo? Nos avise!'
  },
  {
    value: 'suggestion',
    label: 'Enviar Sugestão',
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    hoverBgColor: 'hover:bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    selectedBorderColor: 'border-yellow-500',
    description: 'Tem uma ideia para melhorar o jogo? Compartilhe conosco!'
  },
  {
    value: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    hoverBgColor: 'hover:bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    selectedBorderColor: 'border-blue-500',
    description: 'Quer dar sua opinião sobre o jogo? Fale conosco!'
  }
];

export default function SuportePage() {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();

  const [messageType, setMessageType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);

  const { data: userProfile, isLoading } = useDoc(userProfileRef);

  const selectedType = messageTypes.find(t => t.value === messageType);
  const remainingChars = MAX_CHARACTERS - message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageType) {
      toast({
        variant: 'destructive',
        title: 'Selecione o tipo',
        description: 'Por favor, escolha o tipo de mensagem que deseja enviar.'
      });
      return;
    }

    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Mensagem vazia',
        description: 'Por favor, escreva sua mensagem antes de enviar.'
      });
      return;
    }

    if (message.length > MAX_CHARACTERS) {
      toast({
        variant: 'destructive',
        title: 'Mensagem muito longa',
        description: `Sua mensagem tem ${message.length} caracteres. O limite é ${MAX_CHARACTERS}.`
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Inserir diretamente no banco - o trigger SQL enviará o email automaticamente
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user?.id,
          player_name: userProfile?.name || 'Desconhecido',
          player_email: user?.email || null,
          player_level: userProfile?.level || 0,
          player_village: userProfile?.village || null,
          message_type: messageType,
          message: message.trim()
        });

      if (error) throw error;

      // Sucesso
      setSubmitSuccess(true);
      setMessage('');
      setMessageType('');

      toast({
        title: '✅ Mensagem Enviada!',
        description: 'Recebemos sua mensagem e você receberá um email de confirmação em breve!',
      });

      // Reset após 3 segundos
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar sua mensagem. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Carregando..." description="Preparando o formulário..." />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader title="Crie um Personagem" description="Você precisa de um personagem para entrar em contato." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Suporte"
        description="Entre em contato conosco para reportar bugs, enviar sugestões ou dar feedback!"
      />

      <div className="mt-8 max-w-2xl mx-auto">
        {submitSuccess ? (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
              <h3 className="text-2xl font-bold text-green-500">Mensagem Enviada!</h3>
              <p className="text-center text-muted-foreground">
                Recebemos sua mensagem e entraremos em contato em breve se necessário.
                <br />
                Obrigado por ajudar a melhorar o Naruto Clash!
              </p>
              <Button onClick={() => setSubmitSuccess(false)} className="mt-4">
                Enviar Outra Mensagem
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Formulário de Contato</CardTitle>
                <CardDescription>
                  Preencha os campos abaixo para entrar em contato com nossa equipe
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Informações do Jogador */}
                <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Seus Dados (serão enviados automaticamente)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Nome:</span> {userProfile.name}
                    </div>
                    <div>
                      <span className="font-medium">Nível:</span> {userProfile.level}
                    </div>
                    <div>
                      <span className="font-medium">Vila:</span> {userProfile.village || 'Sem vila'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {user?.email || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Tipo de Mensagem - VERSÃO MELHORADA COM CARDS */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tipo de Mensagem</Label>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma das opções abaixo:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {messageTypes.map((type) => {
                      const isSelected = messageType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setMessageType(type.value)}
                          className={cn(
                            "relative p-4 rounded-lg border-2 transition-all duration-200",
                            "flex flex-col items-center gap-3 text-center",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            type.bgColor,
                            type.hoverBgColor,
                            isSelected 
                              ? cn(type.selectedBorderColor, "shadow-lg scale-105") 
                              : cn(type.borderColor, "hover:scale-102")
                          )}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          
                          <type.icon className={cn("h-8 w-8", type.color)} />
                          
                          <div>
                            <p className={cn("font-semibold text-sm", isSelected && "text-foreground")}>
                              {type.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {type.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mensagem */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="message" className="text-base font-semibold">Sua Mensagem</Label>
                    <span className={cn(
                      "text-xs font-medium",
                      remainingChars < 50 ? "text-yellow-500" : "text-muted-foreground",
                      remainingChars < 0 && "text-red-500"
                    )}>
                      {remainingChars} caracteres restantes
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Descreva seu bug, sugestão ou feedback aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[200px] resize-none"
                    maxLength={MAX_CHARACTERS}
                  />
                  <p className="text-xs text-muted-foreground">
                    Seja o mais específico possível. Quanto mais detalhes, melhor poderemos ajudar!
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !messageType || !message.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* Dicas */}
        <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Dicas para uma boa mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Bugs:</strong> Descreva o que aconteceu, quando aconteceu e como reproduzir</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Sugestões:</strong> Explique sua ideia e como ela melhoraria o jogo</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span><strong>Feedback:</strong> Seja honesto e construtivo sobre sua experiência</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
