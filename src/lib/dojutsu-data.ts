/**
 * Arquivo de compatibilidade - redireciona para o novo sistema de batalha
 * TODO: Migrar todos os imports para usar @/lib/battle-system/doujutsu-loader
 */

export { 
    DOUJUTSU_DATA as doujutsuData,
    EVOLUTION_PATHS as evolutionPaths,
    calculateDoujutsuBonuses,
    canEvolveDoujutsu,
    evolveDoujutsu,
    getDoujutsuInfo
  } from '@/lib/battle-system/doujutsu-loader';
  
  export type { 
    DoujutsuType, 
    DoujutsuInfo,
    DoujutsuStage
  } from '@/lib/battle-system/types';
  
  export type { DoujutsuBonuses } from '@/lib/battle-system/doujutsu-loader';