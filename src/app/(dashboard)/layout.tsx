'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { ShurikenIcon } from '@/components/icons/shuriken';
import {
  Newspaper,
  Activity,
  Users,
  MessageCircle,
  ScrollText,
  ShieldAlert,
  Target,
  Swords,
  Flame,
  User,
  LogOut,
  Trophy,
  ShieldQuestion,
  Eye,
  Utensils,
  Footprints,
  Grip,
  Database,
  ShoppingCart,
  Mail,
  Crown,
  BookOpen,
  MessageCircleQuestion,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase, useMemoSupabase } from '@/supabase';
import { useDoc } from '@/supabase/hooks/use-doc';
import { useActiveMission } from '@/hooks/use-active-mission';
import { missionsData, allJutsus } from '@/lib/missions-data';
import { weaponsData } from '@/lib/weapons-data';
import { summonsData } from '@/lib/summons-data';
import { DOUJUTSU_DATA as doujutsuData, EVOLUTION_PATHS as evolutionPaths } from '@/lib/battle-system/doujutsu-loader';
import { usePremiumStatus } from '@/hooks/use-premium-status';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks/use-messages';
import { useUnreadNews } from '@/hooks/use-unread-news';

const useBattleReportsCount = (supabase: any, userId: string | undefined) => {
  const [unreadReportsCount, setUnreadReportsCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!supabase || !userId) return;
    
    try {
      const { count } = await supabase
        .from('battle_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('viewed', false);

      setUnreadReportsCount(count || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem:', error);
    }
  }, [supabase, userId]);

  React.useEffect(() => {
    fetchUnreadCount();

    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);

    // Subscription em tempo real
    const subscription = supabase
      ?.channel('battle_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_reports',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription?.unsubscribe();
    };
  }, [fetchUnreadCount, supabase, userId]);

  return { unreadReportsCount, refreshCount: fetchUnreadCount };
};

const OBTAIN_LEVEL_REQ = 30;
const OBTAIN_ELEMENT_REQ = 15;
const UPGRADE_ELEMENT_REQ = 30;
const ATTACK_COOLDOWN = 10 * 60 * 1000;
const BOSS_DOC_ID = 'current_boss';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, supabase, isUserLoading } = useSupabase();
  const router = useRouter();
  const { isActive: isPremium, expiresAt } = usePremiumStatus(supabase, user?.id);
  const { unreadCount } = useMessages(supabase, user?.id);
  const { unreadReportsCount, refreshCount } = useBattleReportsCount(supabase, user?.id);
  const { unreadCount: unreadNewsCount, refreshCount: refreshNewsCount } = useUnreadNews(supabase, user?.id);

  const userProfileRef = useMemoSupabase(() => {
    if (!user) return null;
    return { table: 'profiles', id: user.id };
  }, [user]);
  
  const bossRef = useMemoSupabase(() => {
    if (!user || isUserLoading) return null;
    return { table: 'world_bosses', id: BOSS_DOC_ID };
  }, [user, isUserLoading]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  const { data: boss } = useDoc(bossRef);

  // 🆕 REFRESH da contagem quando entrar na página de mensagens
  React.useEffect(() => {
    if (pathname === '/messages' && refreshCount) {
      const timer = setTimeout(() => {
        refreshCount();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, refreshCount]);

  // 🆕 REFRESH da contagem quando entrar na página de news
  React.useEffect(() => {
    if (pathname === '/news' && refreshNewsCount) {
      const timer = setTimeout(() => {
        refreshNewsCount();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, refreshNewsCount]);

  React.useEffect(() => {
    if (isUserLoading || isProfileLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (user && !userProfile && pathname !== '/create-character') {
      router.push('/create-character');
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, pathname]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/'); 
  };

  const { isMissionComplete } = useActiveMission(userProfile as any, missionsData);
  const isHuntComplete = userProfile?.active_hunt && Date.now() >= (userProfile.active_hunt as any).endTime;
  const hasStatPoints = (userProfile?.stat_points || 0) > 0;
  
  const totalElementLevel = Object.values(userProfile?.element_levels || {}).reduce((sum: number, level: any) => sum + (level as number), 0);
  const canAttemptObtainSeal = userProfile && (userProfile.level as number) >= OBTAIN_LEVEL_REQ && (totalElementLevel as number) >= OBTAIN_ELEMENT_REQ && ((userProfile.cursed_seal as any)?.level || 0) === 0;
  const canAttemptUpgradeSeal = userProfile && ((userProfile.cursed_seal as any)?.level || 0) === 1 && (totalElementLevel as number) >= UPGRADE_ELEMENT_REQ;
  const showSealNotification = canAttemptObtainSeal || canAttemptUpgradeSeal;

  const canAwakenDojutsu = !userProfile?.doujutsu && Object.values(doujutsuData).some(d => d.type === 'base' && userProfile && (userProfile.level as number) >= d.requiredLevel && (totalElementLevel as number) >= d.requiredElementLevel);
  const currentDojutsu = userProfile?.doujutsu?.type;
  let canEvolveDojutsu = false;
  if(currentDojutsu) {
      const currentPathKey = Object.keys(evolutionPaths).find(key => (evolutionPaths[key] as any[]).includes(currentDojutsu));
      if(currentPathKey) {
          const path = evolutionPaths[currentPathKey];
          const currentIndex = path.indexOf(currentDojutsu as any);
          if (currentIndex !== -1 && currentIndex < path.length - 1) {
              const nextDoujutsuType = path[currentIndex + 1];
              const nextDoujutsuData = doujutsuData[nextDoujutsuType as keyof typeof doujutsuData];
              if (userProfile && (userProfile.level as number) >= nextDoujutsuData.requiredLevel && (totalElementLevel as number) >= nextDoujutsuData.requiredElementLevel) {
                  canEvolveDojutsu = true;
              }
          }
      }
  }
  const showDojutsuNotification = canAwakenDojutsu || canEvolveDojutsu;

  const showWeaponNotification = !userProfile?.weapon_id && weaponsData.some(w => userProfile && (userProfile.level as number) >= w.requiredLevel && (userProfile.ryo as number) >= w.price);
  const showSummonNotification = !userProfile?.summon_id && summonsData.some(s => userProfile && (userProfile.level as number) >= s.requiredLevel && (userProfile.ryo as number) >= s.price);
  const canAttackBoss = boss && (boss.current_health as number) > 0 && (!userProfile?.last_boss_attack || Date.now() - (userProfile.last_boss_attack as number) > ATTACK_COOLDOWN);
  
  const showElementsNotification = allJutsus.some(jutsu => {
    const hasLearned = ((userProfile?.jutsus as any)?.[jutsu.name] || 0) > 0;
    const canLearn = ((userProfile?.element_levels as any)?.[jutsu.element] || 0) >= jutsu.requiredLevel;
    return canLearn && !hasLearned;
  });

  // 🔝 ITENS DO MENU SUPERIOR (Menos Acessados)
const topMenuItems = [
  { 
    href: '/news', 
    label: 'News', 
    icon: Newspaper, 
    notification: unreadNewsCount > 0,
    badge: unreadNewsCount
  },
  { 
    href: '/messages', 
    label: 'Mensagens', 
    icon: Mail, 
    notification: unreadCount > 0 || unreadReportsCount > 0,
    badge: (unreadCount || 0) + (unreadReportsCount || 0)
  },
  { href: '/ranking', label: 'Ranking', icon: Trophy, notification: false },
  { href: '/chat', label: 'Chat Global', icon: MessageCircle, notification: false },
  { href: '/manual-ninja', label: 'Manual Ninja', icon: BookOpen, notification: false },
  { href: '/mercado-premium', label: 'Mercado Premium', icon: Database, notification: false },
  { href: '/buy', label: 'Comprar CP', icon: ShoppingCart, notification: false },
  { href: '/suporte', label: 'Suporte', icon: MessageCircleQuestion, notification: false }, // 🆕 SUPORTE
];

// 📱 ITENS DA SIDEBAR (Mais Acessados)
const sidebarItems = [
  { href: '/status', label: 'Status', icon: Activity, notification: hasStatPoints },
  { href: '/missions', label: 'Missões', icon: ScrollText, notification: isMissionComplete },
  { href: '/hunts', label: 'Caçadas', icon: Target, notification: isHuntComplete },
  { href: '/invasion', label: 'Invasão', icon: ShieldAlert, notification: canAttackBoss },
  { href: '/elements', label: 'Elementos', icon: Flame, notification: showElementsNotification },
  { href: '/doujutsu', label: 'Dōjutsu', icon: Eye, notification: showDojutsuNotification },
  { href: '/cursed-seal', label: 'Selo Amaldiçoado', icon: ShieldQuestion, notification: showSealNotification },
  { href: '/weapons', label: 'Armas', icon: Swords, notification: showWeaponNotification },
  { href: '/summons', label: 'Invocação', icon: Footprints, notification: showSummonNotification },
  { href: '/equipamentos', label: 'Equipamentos', icon: Grip, notification: false },
  { href: '/clan', label: 'Clã', icon: Users, notification: false },
  { href: '/ichiraku', label: 'Ichiraku', icon: Utensils, notification: false },
  // ✅ Chat Global removido daqui
];

  if (isUserLoading || (user && !userProfile && pathname !== '/create-character')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <ShurikenIcon className="h-12 w-12 animate-spin-slow text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      {/* Sidebar Lateral */}
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-0 overflow-hidden">
          <Link href="/status" className="block hover:opacity-80 transition-opacity">
            <img 
              src="https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Telas/Naruto%20Clash.png" 
              alt="Naruto Clash"
              className="w-full h-20 object-cover scale-110"
            />
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.notification && <SidebarMenuBadge />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/profile')}
                tooltip="Perfil"
              >
                <Link href={user ? `/profile/${user.id}` : '/login'}>
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header Superior com Menu Horizontal */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger className="md:hidden" />
            
            {/* Menu Superior - Itens Secundários */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {topMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.notification && (
                    <>
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex-1 md:hidden" />

            {/* User Info */}
            {userProfile && (
              <div className="flex items-center gap-3">
                {isPremium && expiresAt && (
                  <Badge className="hidden sm:flex bg-gradient-to-r from-yellow-400 to-amber-600 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    <span className="hidden md:inline">Premium</span>
                  </Badge>
                )}
                
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-semibold">{userProfile.name}</span>
                  <span className="text-xs text-muted-foreground">Nível {userProfile.level}</span>
                </div>
                
                <Link href={`/profile/${user.id}`}>
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-orange-500/20 hover:ring-orange-500/50 transition-all">
                    <AvatarImage src={userProfile.avatar_url} alt={userProfile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
                      {userProfile.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}