import { useEffect, useState } from 'react';
import { useSupabase } from '@/supabase';
import { Bell, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function BattleReportsNotification() {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestReports, setLatestReports] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!supabase || !user?.id) return;

    const fetchUnreadReports = async () => {
      try {
        const { data, error } = await supabase
          .from('battle_reports')
          .select(`
            *,
            opponent:opponent_id(name, level, village)
          `)
          .eq('user_id', user.id)
          .eq('viewed', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setUnreadCount(data?.length || 0);
        setLatestReports(data || []);
      } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
      }
    };

    fetchUnreadReports();

    // 🆕 Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadReports, 30000);

    // 🆕 Listener em tempo real para novos relatórios
    const subscription = supabase
      .channel('battle_reports_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_reports',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadReports();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [supabase, user?.id]);

  const handleViewReports = () => {
    setIsOpen(false);
    router.push('/messages?tab=reports');
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Relatórios de Batalha</h4>
            <Badge variant="destructive">{unreadCount} novos</Badge>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {latestReports.map((report) => (
              <div
                key={report.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                  report.is_victory ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                )}
                onClick={handleViewReports}
              >
                <div className="flex items-start gap-2">
                  <FileText className={cn(
                    "h-4 w-4 mt-0.5 flex-shrink-0",
                    report.is_victory ? "text-green-500" : "text-red-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {report.is_victory ? '✅ Vitória' : '❌ Derrota'} vs {report.opponent?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.is_victory 
                        ? `+${report.ryo_gained} Ryo, +${report.xp_gained} XP`
                        : `-${report.ryo_lost} Ryo`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" size="sm" onClick={handleViewReports}>
            Ver Todos os Relatórios
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
