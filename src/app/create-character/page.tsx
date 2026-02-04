'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { UserPlus, Loader2 } from 'lucide-react';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

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

export default function CreateCharacterPage() {
  const router = useRouter();
  const { supabase, user, isUserLoading } = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CreateCharacterValues>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      village: '',
    },
  });

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
      const initialProfileData = {
        id: user.id,
        name: values.name,
        avatar_url: values.avatarUrl,
        village: values.village,
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
        // Inicializando objetos JSONB vazios conforme o seu SQL
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
      };
        
      const { error } = await supabase
        .from('profiles')
        .insert([initialProfileData]);

      if (error) throw error;

      toast({
          title: "Personagem Criado!",
          description: `Bem-vindo, ${values.name}! Sua jornada começou.`,
      });

      // Força o sistema a revalidar os dados do perfil
      router.refresh();
      
      // Pequeno delay para garantir sincronia do banco antes de mudar de página
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
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Personagem</FormLabel>
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
      <FormLabel>Aldeia</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecione sua aldeia..." />
          </SelectTrigger>
        </FormControl>
        <SelectContent className="bg-background border-2 shadow-xl z-50">
          {villages.map((village) => (
            <SelectItem key={village} value={village}>
              {village}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolha seu Avatar</FormLabel>
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
              <CardFooter>
                <Button type="submit" disabled={isButtonDisabled} className="w-full h-12">
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
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}