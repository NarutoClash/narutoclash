'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MailCheck, Send, Flame, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

const registerSchema = z
  .object({
    email: z
      .string()
      .email('Email inválido.')
      .refine(
        (email) => email.endsWith('@gmail.com') || email.endsWith('@hotmail.com'),
        {
          message: 'O email deve ser @gmail.com ou @hotmail.com.',
        }
      ),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const inviteCode = searchParams?.get('invite');

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterValues) => {
    if (!supabase) return;
    
    setIsSubmitting(true);
    try {
      // ✅ VERIFICAR CÓDIGO DE CONVITE (se fornecido)
      let invitedByUserId = null;
      if (inviteCode) {
        const { data: inviter, error: inviteError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('invite_code', inviteCode.toUpperCase())
          .single();

        if (inviteError || !inviter) {
          toast({
            variant: "destructive",
            title: "Código de Convite Inválido",
            description: `O código "${inviteCode}" não é válido ou expirou.`,
          });
          setIsSubmitting(false);
          return;
        }

        invitedByUserId = inviter.id;
        setInviterName(inviter.name);
        
        toast({
          title: "Convite Aceito!",
          description: `Você foi convidado por ${inviter.name}!`,
        });
      }

      // ✅ CRIAR CONTA NO SUPABASE AUTH
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
          data: {
            invite_code: inviteCode || null,
            invited_by: invitedByUserId || null,
          }
        },
      });

      if (authError) throw authError;

      // ✅ Supabase envia email de verificação automaticamente
      setEmailSent(true);
      toast({
        title: 'Verificação Necessária',
        description: `Um email de verificação foi enviado para ${values.email}.`,
      });
    } catch (error: any) {
      setIsSubmitting(false);
      let title = 'Erro de Cadastro';
      let description = 'Ocorreu um erro desconhecido. Tente novamente.';

      if (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('User already registered') || 
            errorMessage.includes('already registered')) {
          title = 'Email em Uso';
          description = 'Este endereço de email já está cadastrado.';
        } else if (errorMessage.includes('Invalid email')) {
          title = 'Email Inválido';
          description = 'O formato do email fornecido não é válido.';
        } else if (errorMessage.includes('Password')) {
          title = 'Senha Fraca';
          description = 'Sua senha deve ter pelo menos 6 caracteres.';
        } else {
          description = errorMessage || 'Ocorreu um erro desconhecido.';
        }
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    }
  };
  
  const handleResendVerification = async () => {
    if (!user?.email) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Usuário não encontrado. Tente fazer login primeiro.' 
      });
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      toast({ title: 'E-mail Reenviado', description: 'Um novo link de verificação foi enviado para sua caixa de entrada.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível reenviar o e-mail de verificação. Tente novamente mais tarde.' });
    }
  };


  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950">
        {/* Efeito de partículas animadas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-red-500 rounded-full animate-pulse delay-100"></div>
          <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse delay-200"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-orange-400 rounded-full animate-pulse delay-300"></div>
        </div>

        <Card className="w-full max-w-sm text-center bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30 shadow-xl shadow-orange-500/20 relative z-10">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <MailCheck className="h-12 w-12 text-orange-500 animate-pulse" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              Verifique seu Email
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enviamos um link de ativação para sua caixa de entrada. Por favor,
              clique no link para verificar sua conta e então faça o login.
            </CardDescription>
            {inviterName && (
              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-sm text-purple-400 flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Convidado por: <span className="font-bold">{inviterName}</span>
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs text-gray-400">Não recebeu o email?</p>
            <Button 
              variant="outline" 
              onClick={handleResendVerification}
              className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300"
            >
              <Send className="mr-2 h-4 w-4"/>
              Reenviar Email de Verificação
            </Button>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/50">
              <Link href="/login">Ir para o Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-orange-950">
      {/* Efeito de partículas animadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-red-500 rounded-full animate-pulse delay-100"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse delay-200"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-orange-400 rounded-full animate-pulse delay-300"></div>
      </div>

      <Card className="w-full max-w-sm bg-gradient-to-br from-gray-900 to-gray-800 border-orange-500/30 shadow-xl shadow-orange-500/20 relative z-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                Crie sua Conta
              </CardTitle>
              <CardDescription className="text-gray-400">
                Comece sua lenda no mundo Shinobi.
              </CardDescription>
              
              {/* ✅ MOSTRAR CÓDIGO DE CONVITE SE PRESENTE */}
              {inviteCode && (
                <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <p className="text-sm text-purple-400 flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Código de Convite: <span className="font-bold">{inviteCode.toUpperCase()}</span>
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-400">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@gmail.com"
                        className="bg-gray-800/50 border-orange-500/30 focus:border-orange-500 text-gray-200 placeholder:text-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-400">Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="******" 
                        className="bg-gray-800/50 border-orange-500/30 focus:border-orange-500 text-gray-200 placeholder:text-gray-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-400">Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="******" 
                        className="bg-gray-800/50 border-orange-500/30 focus:border-orange-500 text-gray-200 placeholder:text-gray-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/50"
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                {!isSubmitting && 'Cadastrar'}
              </Button>
              <p className="text-xs text-gray-400">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-orange-500 hover:text-orange-400 hover:underline">
                  Faça Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}