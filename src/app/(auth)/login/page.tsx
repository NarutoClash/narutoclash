'use client';
   
   export const dynamic = 'force-dynamic';

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
import { Loader2, Flame } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Usuário não encontrado. Tente fazer login novamente para que possamos identificá-lo.' 
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

  const onSubmit = async (values: LoginValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        setIsSubmitting(false);
        toast({
          variant: 'destructive',
          title: 'Verificação de Email Necessária',
          description: 'Sua conta ainda não foi ativada. Por favor, verifique seu e-mail.',
          action: <Button onClick={handleResendVerification}>Reenviar E-mail</Button>,
          duration: 10000,
        });
        return;
      }
      
      router.push('/status');

    } catch (error: any) {
      setIsSubmitting(false);
      let title = 'Falha no Login';
      let description = 'Ocorreu um erro desconhecido. Tente novamente.';

      if (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('Invalid login credentials') || 
            errorMessage.includes('Email not confirmed') ||
            errorMessage.includes('Invalid credentials')) {
          title = 'Credenciais Inválidas';
          description = 'Email ou senha incorretos. Por favor, tente novamente.';
        } else if (errorMessage.includes('Email rate limit exceeded')) {
          title = 'Muitas Tentativas';
          description = 'Muitas tentativas de login. Tente novamente mais tarde.';
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
                Bem-vindo de volta!
              </CardTitle>
              <CardDescription className="text-gray-400">
                Entre com sua conta para continuar sua jornada ninja.
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-orange-400">Senha</FormLabel>
                      <Link href="/forgot-password" passHref className="text-xs text-orange-500 hover:text-orange-400 hover:underline">
                        Esqueceu sua senha?
                      </Link>
                    </div>
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
                {!isSubmitting && 'Entrar'}
              </Button>
              <p className="text-xs text-gray-400">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-orange-500 hover:text-orange-400 hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
