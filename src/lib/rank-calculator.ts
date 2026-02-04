/**
 * Calcula o rank do ninja baseado no seu nível
 * Nota: Kage é um título especial dado apenas ao TOP 1 de cada aldeia
 */
export function calculateRank(level: number): string {
  if (level >= 100) return 'Sennin';
  if (level >= 75) return 'ANBU';
  if (level >= 50) return 'Jounin';
  if (level >= 25) return 'Chunin';
  if (level >= 10) return 'Genin';
  return 'Estudante';
}

/**
 * Retorna informações detalhadas sobre o rank
 */
export function getRankInfo(rank: string) {
  const rankInfoMap: Record<string, { 
    minLevel: number; 
    maxLevel: number; 
    color: string;
    description: string;
  }> = {
    'Estudante': {
      minLevel: 1,
      maxLevel: 9,
      color: 'gray',
      description: 'Ninja em treinamento básico'
    },
    'Genin': {
      minLevel: 10,
      maxLevel: 24,
      color: 'green',
      description: 'Ninja de rank inferior'
    },
    'Chunin': {
      minLevel: 25,
      maxLevel: 49,
      color: 'blue',
      description: 'Ninja de rank médio'
    },
    'Jounin': {
      minLevel: 50,
      maxLevel: 74,
      color: 'purple',
      description: 'Ninja de elite'
    },
    'ANBU': {
      minLevel: 75,
      maxLevel: 99,
      color: 'red',
      description: 'Força especial de operações secretas'
    },
    'Sennin': {
      minLevel: 100,
      maxLevel: 999,
      color: 'orange',
      description: 'Ninja lendário de poder supremo'
    },
    'Kage': {
      minLevel: 0,
      maxLevel: 999,
      color: 'gold',
      description: 'Líder supremo da aldeia (TOP 1)'
    }
  };

  return rankInfoMap[rank] || rankInfoMap['Estudante'];
}

/**
 * Verifica se o jogador subiu de rank
 */
export function checkRankUp(oldLevel: number, newLevel: number): {
  rankedUp: boolean;
  oldRank: string;
  newRank: string;
} {
  const oldRank = calculateRank(oldLevel);
  const newRank = calculateRank(newLevel);
  
  return {
    rankedUp: oldRank !== newRank,
    oldRank,
    newRank
  };
}

/**
 * Verifica se o jogador é Kage da sua aldeia
 * Um jogador só é Kage se for o TOP 1 (maior level) da sua aldeia
 */
export async function checkIfKage(
  supabase: any,
  userId: string,
  village: string,
  currentLevel: number
): Promise<boolean> {
  if (!village || village === 'Sem Vila') return false;
  
  try {
    // Busca o TOP 1 da aldeia (maior level)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, level')
      .eq('village', village)
      .order('level', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return false;
    
    // O jogador é Kage se for o TOP 1
    return data.id === userId;
  } catch (error) {
    console.error('Erro ao verificar Kage:', error);
    return false;
  }
}

/**
 * Calcula o rank final do jogador (incluindo título de Kage)
 */
export async function calculateFinalRank(
  supabase: any,
  userId: string,
  village: string,
  level: number
): Promise<string> {
  const baseRank = calculateRank(level);
  const isKage = await checkIfKage(supabase, userId, village, level);
  
  return isKage ? 'Kage' : baseRank;
}
