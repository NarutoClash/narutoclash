import { useEffect, useState, useCallback } from 'react';

// 🆕 Hook para buscar relatórios de batalha COM APLICAÇÃO AUTOMÁTICA DE VIDA
export const useBattleReports = (supabase: any, userId: string | undefined) => {
  const [reports, setReports] = useState<any[]>([]);
  const [unreadReportsCount, setUnreadReportsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
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
      
      // 🆕 APLICAR VIDA AUTOMATICAMENTE DE RELATÓRIOS NÃO VISUALIZADOS
      const unviewedReports = (data || []).filter((r: any) => !r.viewed);
      
      if (unviewedReports.length > 0) {
        // Pegar o relatório mais recente não visualizado
        const latestReport = unviewedReports[0];
        
        // 🆕 Atualizar vida do jogador baseado no relatório
        if (latestReport.final_health !== null && latestReport.final_health !== undefined) {
          await supabase
            .from('profiles')
            .update({
              current_health: latestReport.final_health,
              is_recovering: latestReport.final_health === 0, // Se vida = 0, marcar como em recuperação
            })
            .eq('id', userId);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
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