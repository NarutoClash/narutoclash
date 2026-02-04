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
import { Loader2, MailCheck, Send, Flame } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido.'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { supabase } = useSupabase();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'Email Enviado',
        description: `Um link para redefinir sua senha foi enviado para ${values.email}.`,
      });
    } catch (error: any) {
      setIsSubmitting(false);
      let title = 'Erro ao Enviar Email';
      let description = 'Ocorreu um erro desconhecido. Tente novamente.';

      if (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
          title = 'Usuário Não Encontrado';
          description = 'Nenhuma conta encontrada com este endereço de email.';
        } else if (errorMessage.includes('Invalid email')) {
          title = 'Email Inválido';
          description = 'O formato do email fornecido não é válido.';
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
              Enviamos um link para você redefinir sua senha. Por favor,
              clique no link para criar uma nova senha e então faça o login.
            </CardDescription>
          </CardHeader>
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
                Recuperar Senha
              </CardTitle>
              <CardDescription className="text-gray-400">
                Digite seu email para receber um link de redefinição de senha.
              </CardDescription>
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
                        placeholder="seu@email.com"
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
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2" /> Enviar Email
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-400">
                Lembrou sua senha?{' '}
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
