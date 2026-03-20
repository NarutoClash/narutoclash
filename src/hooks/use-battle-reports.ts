import { useEffect, useState, useCallback } from 'react';

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
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Aplica a vida final de um relatório no perfil do jogador.
  // Deve ser chamada EXPLICITAMENTE pelo componente após o usuário
  // visualizar o relatório — não automaticamente ao buscar.
  const applyHealthFromReport = useCallback(async (report: any) => {
    if (!supabase || !userId) return;
    if (report.final_health === null || report.final_health === undefined) return;

    await supabase
      .from('profiles')
      .update({
        current_health: report.final_health,
        is_recovering: report.final_health === 0,
      })
      .eq('id', userId);
  }, [supabase, userId]);

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
    applyHealthFromReport,
  };
};