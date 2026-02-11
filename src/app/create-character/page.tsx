'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { UserPlus, Loader2, Users } from 'lucide-react';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const villages = [
  'Akatsuki',
  'Folha',
  'Areia',
  'Névoa',
  'Pedra',
  'Nuvem',
  'Chuva',
  'Som',
  'Cachoeira',
  'Redemoinho',
  'Grama',
];

const createCharacterSchema = z.object({
  name: z.string().min(3, { message: 'O nome precisa ter pelo menos 3 caracteres.' }),
  avatarUrl: z.string({ required_error: 'Por favor, selecione um avatar.' }),
  village: z.string({ required_error: 'Por favor, selecione uma aldeia.' }),
});

type CreateCharacterValues = z.infer<typeof createCharacterSchema>;

// ✅ COMPONENTE INTERNO QUE USA useSearchParams
function CreateCharacterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, user, isUserLoading } = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviterData, setInviterData] = useState<{ name: string; village: string } | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<CreateCharacterValues>({
    resolver: zodResolver(createCharacterSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      avatarUrl: '',
      village: '',
    },
  });

  // ✅ BUSCAR DADOS DO CONVITE
  useEffect(() => {
    const fetchInviterData = async () => {
      if (!user?.id || !supabase) return;

      try {
        // ✅ USAR getUser() para acessar user_metadata
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('Erro ao buscar usuário:', userError);
          setIsLoadingInvite(false);
          return;
        }

        const inviteCode = authUser?.user_metadata?.invite_code;
        
        if (inviteCode) {
          // Buscar dados do mestre pelo código de convite
          const { data: inviter, error: inviterError } = await supabase
            .from('profiles')
            .select('name, village')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

          if (inviterError) {
            console.error('Erro ao buscar mestre:', inviterError);
            setIsLoadingInvite(false);
            return;
          }

          if (inviter) {
            setInviterData(inviter);
            // ✅ PRÉ-PREENCHER A ALDEIA DO MESTRE
            form.setValue('village', inviter.village);
            
            toast({
              title: "Convite Aceito!",
              description: `Você foi convidado por ${inviter.name}. Você entrará na aldeia ${inviter.village}!`,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar convite:', error);
      } finally {
        setIsLoadingInvite(false);
      }
    };

    if (user?.id) {
      fetchInviterData();
    } else {
      setIsLoadingInvite(false);
    }
  }, [user?.id, supabase, toast, form]);

  const onSubmit = async (values: CreateCharacterValues) => {
    if (isUserLoading) return;
  
    if (!user || !supabase) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // ✅ VERIFICAR SE O NOME JÁ EXISTE
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('name')
        .ilike('name', values.name)
        .limit(1);

      if (checkError) {
        throw new Error('Erro ao verificar disponibilidade do nome.');
      }

      if (existingProfiles && existingProfiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Nome já existe!",
          description: `O nome "${values.name}" já está sendo usado. Por favor, escolha outro nome.`,
        });
        setIsSubmitting(false);
        return;
      }

      // ✅ BUSCAR invited_by DO user_metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const invitedByUserId = authUser?.user_metadata?.invited_by || null;

      const initialProfileData = {
        id: user.id,
        name: values.name,
        avatar_url: values.avatarUrl,
        village: values.village, // ✅ Será sempre a aldeia do mestre se foi convidado
        level: 1,
        experience: 0,
        max_experience: 100,
        stat_points: 5,
        vitality: 10,
        taijutsu: 10,
        ninjutsu: 10,
        genjutsu: 10,
        intelligence: 10,
        selo: 10,
        current_health: 250,
        max_health: 250,
        current_chakra: 150,
        max_chakra: 150,
        ryo: 1000,
        element_levels: {},
        element_experience: {},
        jutsus: {},
        jutsu_experience: {},
        inventory: {},
        owned_equipment_ids: [],
        active_mission: null,
        weapon_id: null,
        summon_id: null,
        chest_id: null,
        legs_id: null,
        feet_id: null,
        hands_id: null,
        invited_by: invitedByUserId, // ✅ SALVAR QUEM CONVIDOU
      };
        
      const { error } = await supabase
        .from('profiles')
        .insert([initialProfileData]);

      if (error) throw error;

      // ✅ SE FOI CONVIDADO, INCREMENTAR total_students DO MESTRE
      if (invitedByUserId) {
        const { data: masterData } = await supabase
          .from('profiles')
          .select('total_students')
          .eq('id', invitedByUserId)
          .single();

        if (masterData) {
          await supabase
            .from('profiles')
            .update({ total_students: (masterData.total_students || 0) + 1 })
            .eq('id', invitedByUserId);
        }
      }

      toast({
          title: "Personagem Criado!",
          description: `Bem-vindo, ${values.name}! Sua jornada começou.`,
      });

      router.refresh();
      
      setTimeout(() => {
        router.push('/status');
      }, 800);

    } catch (error: any) {
      console.error("Error creating character:", error);
      toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: error.message || "Não foi possível criar o seu personagem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isSubmitting || isUserLoading;
  const isInvited = !!inviterData;

  if (isLoadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader
          title="Carregando..."
          description="Verificando convite..."
        />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <PageHeader
        title="Criar Personagem"
        description="Dê vida ao seu shinobi, escolhendo seu nome, aparência e aldeia."
        className="text-center mb-8"
      />

      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Informações do Personagem</CardTitle>
                
                {/* ✅ MOSTRAR INFORMAÇÃO DO CONVITE */}
                {isInvited && (
                  <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-semibold text-purple-400">
                          Convidado por: {inviterData.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Você entrará automaticamente na aldeia <span className="font-bold text-purple-400">{inviterData.village}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Botão de Criar no Topo */}
                <Button 
                  type="submit" 
                  disabled={
                    isButtonDisabled || 
                    !form.watch('name') || 
                    form.watch('name').length < 3 || 
                    !form.watch('village') || 
                    !form.watch('avatarUrl')
                  } 
                  className="w-full h-12"
                >
                  {isSubmitting ? (
                     <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Forjando Shinobi...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Personagem
                    </>
                  )}
                </Button>

                {(!form.watch('name') || form.watch('name').length < 3 || !form.watch('village') || !form.watch('avatarUrl')) && (
                  <div className="text-sm text-center space-y-1">
                    <p className="font-semibold text-destructive">Complete todos os campos:</p>
                    <ul className="text-muted-foreground space-y-0.5">
                      {(!form.watch('name') || form.watch('name').length < 3) && <li>✗ Nome do personagem (mínimo 3 caracteres)</li>}
                      {!form.watch('village') && <li>✗ Escolha uma aldeia</li>}
                      {!form.watch('avatarUrl') && <li>✗ Selecione um avatar</li>}
                    </ul>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Personagem *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Naruto Uzumaki" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aldeia *</FormLabel>
                      <FormControl>
                        {/* ✅ SE FOI CONVIDADO, MOSTRAR BADGE FIXO AO INVÉS DE BOTÕES */}
                        {isInvited ? (
                          <div className="flex items-center justify-center p-4 rounded-lg border-2 border-purple-500 bg-purple-500/10">
                            <Badge variant="default" className="text-lg px-6 py-2 bg-purple-600">
                              {inviterData.village}
                            </Badge>
                            <input type="hidden" {...field} />
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {villages.map((village) => (
                              <Button
                                key={village}
                                type="button"
                                variant={field.value === village ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => field.onChange(village)}
                                className={cn(
                                  'transition-all',
                                  field.value === village && 'ring-2 ring-primary ring-offset-2'
                                )}
                              >
                                {village}
                              </Button>
                            ))}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolha seu Avatar *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-4 gap-4">
                          {PlaceHolderImages.map((image: ImagePlaceholder) => (
                            <button
                              type="button"
                              key={image.id}
                              onClick={() => field.onChange(image.imageUrl)}
                              className={cn(
                                'rounded-lg overflow-hidden border-2 transition-all aspect-square',
                                field.value === image.imageUrl
                                  ? 'border-primary ring-2 ring-primary'
                                  : 'border-muted hover:border-primary/50'
                              )}
                            >
                              <Avatar className="h-full w-full rounded-none">
                                <AvatarImage src={image.imageUrl} alt={image.description} className="object-cover" />
                                <AvatarFallback className="rounded-none">{image.id}</AvatarFallback>
                              </Avatar>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL COM SUSPENSE
export default function CreateCharacterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full text-center">
        <PageHeader
          title="Carregando..."
          description="Preparando criação de personagem..."
        />
        <Loader2 className="h-8 w-8 animate-spin mt-4" />
      </div>
    }>
      <CreateCharacterContent />
    </Suspense>
  );
}
