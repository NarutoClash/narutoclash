'use client';

import { useState, useEffect } from 'react';
import { calculateRank, checkIfKage } from '@/lib/rank-calculator';

/**
 * Hook para buscar o rank atual do jogador
 * Verifica automaticamente se o jogador é Kage (TOP 1 da aldeia)
 */
export function usePlayerRank(
  supabase: any,
  userId: string | undefined,
  village: string | undefined,
  level: number | undefined
) {
  const [rank, setRank] = useState<string>('Estudante');
  const [isLoading, setIsLoading] = useState(true);
  const [isKage, setIsKage] = useState(false);

  useEffect(() => {
    async function fetchRank() {
      if (!supabase || !userId || !village || level === undefined) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Calcula o rank base
        const baseRank = calculateRank(level);
        
        // Verifica se é Kage
        const kageStatus = await checkIfKage(supabase, userId, village, level);
        
        setIsKage(kageStatus);
        setRank(kageStatus ? 'Kage' : baseRank);
      } catch (error) {
        console.error('Erro ao buscar rank:', error);
        setRank(calculateRank(level));
      } finally {
        setIsLoading(false);
      }
    }

    fetchRank();
  }, [supabase, userId, village, level]);

  return { rank, isKage, isLoading };
}
