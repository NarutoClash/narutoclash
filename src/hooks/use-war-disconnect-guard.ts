'use client';

/**
 * Hook: useWarDisconnectGuard
 * Detecta fechamento de aba / perda de visibilidade durante guerra ativa.
 * Chama /api/clan-war/disconnect para marcar o jogador como desconectado.
 * O engine trata disconnected=true como hp=0 no próximo turno.
 */

import { useEffect } from 'react';

export function useWarDisconnectGuard(
  warId: string | null,
  playerId: string | undefined,
  isAlive: boolean,
) {
  useEffect(() => {
    if (!warId || !playerId || !isAlive) return;

    const markDisconnected = () => {
      // Usa sendBeacon para garantir envio mesmo no unload
      const body = JSON.stringify({ war_id: warId, player_id: playerId });
      navigator.sendBeacon('/api/clan-war/disconnect', body);
    };

    // Fecha aba / navegador
    window.addEventListener('beforeunload', markDisconnected);

    // Troca de aba (visibilidade perdida por >30s = desconectado)
    let hiddenTimer: NodeJS.Timeout | null = null;
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(markDisconnected, 30_000);
      } else {
        if (hiddenTimer) clearTimeout(hiddenTimer);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', markDisconnected);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (hiddenTimer) clearTimeout(hiddenTimer);
    };
  }, [warId, playerId, isAlive]);
}
