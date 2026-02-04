/**
 * Sistema de carregamento de Dōjutsus
 */

import { Fighter, DoujutsuInfo, DoujutsuType } from './types';

/**
 * Interface para os bônus de Dōjutsu
 */
export interface DoujutsuBonuses {
  ninjutsu: number;
  genjutsu: number;
  taijutsu: number;
  intelligence: number;
}

/**
 * Dados dos Dōjutsus
 */
export const DOUJUTSU_DATA: Record<DoujutsuType, DoujutsuInfo> = {
  'Sharingan': {
    name: 'Sharingan',
    description: 'O olho copiador, que permite ao usuário prever movimentos e copiar jutsus.',
    type: 'base',
    requiredLevel: 20,
    requiredElementLevel: 10,
    stages: {
      1: { name: 'Sharingan', buffs: { ninjutsu: 1.05, genjutsu: 1.05 } },
    },
  },
  'Mangekyō Sharingan': {
    name: 'Mangekyō Sharingan',
    description: 'Uma forma avançada do Sharingan, despertada através de um trauma. Concede habilidades únicas e poderosas.',
    type: 'evolution',
    requiredLevel: 40,
    requiredElementLevel: 25,
    stages: {
      1: { name: 'Mangekyō Sharingan', buffs: { ninjutsu: 1.15, genjutsu: 1.15 } }
    }
  },
  'Rinnegan': {
    name: 'Rinnegan',
    description: 'O olho mais exaltado. Concede ao usuário o domínio sobre os Seis Caminhos, um poder divino.',
    type: 'evolution',
    requiredLevel: 60,
    requiredElementLevel: 50,
    stages: {
      1: { name: 'Rinnegan', buffs: { ninjutsu: 1.30, genjutsu: 1.30 } }
    }
  },
  'Byakugan': {
    name: 'Byakugan',
    description: 'O olho que tudo vê, que concede uma visão de quase 360° e a capacidade de ver o fluxo de chakra.',
    type: 'base',
    requiredLevel: 20,
    requiredElementLevel: 10,
    stages: {
      1: { name: 'Byakugan', buffs: { taijutsu: 1.05, intelligence: 1.05 } },
    },
  },
  'Tenseigan': {
    name: 'Tenseigan',
    description: 'A forma evoluída do Byakugan. Concede poder sobre as forças atrativas e repulsivas e um modo de chakra único.',
    type: 'evolution',
    requiredLevel: 40,
    requiredElementLevel: 25,
    stages: {
      1: { name: 'Tenseigan', buffs: { taijutsu: 1.15, intelligence: 1.15 } }
    }
  },
  'Jōgan': {
    name: 'Jōgan',
    description: 'Um Dōjutsu único e misterioso, capaz de perceber o fluxo de chakra e ver através de barreiras dimensionais.',
    type: 'evolution',
    requiredLevel: 60,
    requiredElementLevel: 50,
    stages: {
      1: { name: 'Jōgan', buffs: { taijutsu: 1.30, intelligence: 1.30 } }
    }
  }
};

/**
 * Caminhos de evolução dos Dōjutsus
 */
export const EVOLUTION_PATHS: Record<string, DoujutsuType[]> = {
  sharinganPath: ['Sharingan', 'Mangekyō Sharingan', 'Rinnegan'],
  byakuganPath: ['Byakugan', 'Tenseigan', 'Jōgan'],
};

/**
 * Calcula os bônus do Dōjutsu (apenas se estiver ativo)
 */
export function calculateDoujutsuBonuses(fighter: Fighter): DoujutsuBonuses {
  const bonuses: DoujutsuBonuses = {
    ninjutsu: 1.0,
    genjutsu: 1.0,
    taijutsu: 1.0,
    intelligence: 1.0,
  };

  // Se não tem dōjutsu ou não está ativo, retorna multiplicadores neutros
  if (!fighter.doujutsu || !fighter.doujutsu.isActive) {
    return bonuses;
  }

  const doujutsuInfo = DOUJUTSU_DATA[fighter.doujutsu.type];
  if (!doujutsuInfo) {
    return bonuses;
  }

  const stage = doujutsuInfo.stages[fighter.doujutsu.stage];
  if (!stage) {
    return bonuses;
  }

  // Aplicar multiplicadores
  if (stage.buffs.ninjutsu !== undefined) {
    bonuses.ninjutsu = stage.buffs.ninjutsu;
  }
  if (stage.buffs.genjutsu !== undefined) {
    bonuses.genjutsu = stage.buffs.genjutsu;
  }
  if (stage.buffs.taijutsu !== undefined) {
    bonuses.taijutsu = stage.buffs.taijutsu;
  }
  if (stage.buffs.intelligence !== undefined) {
    bonuses.intelligence = stage.buffs.intelligence;
  }

  return bonuses;
}

/**
 * Verifica se o fighter pode evoluir seu Dōjutsu
 */
export function canEvolveDoujutsu(fighter: Fighter): {
  canEvolve: boolean;
  nextDoujutsu?: DoujutsuType;
  reason?: string;
} {
  if (!fighter.doujutsu) {
    return { canEvolve: false, reason: 'Você não possui Dōjutsu' };
  }

  // Encontrar caminho de evolução
  let evolutionPath: DoujutsuType[] | undefined;
  let currentIndex = -1;

  for (const path of Object.values(EVOLUTION_PATHS)) {
    const index = path.indexOf(fighter.doujutsu.type);
    if (index !== -1) {
      evolutionPath = path;
      currentIndex = index;
      break;
    }
  }

  if (!evolutionPath || currentIndex === -1) {
    return { canEvolve: false, reason: 'Dōjutsu não possui caminho de evolução' };
  }

  // Verificar se já é o último da linha
  if (currentIndex >= evolutionPath.length - 1) {
    return { canEvolve: false, reason: 'Seu Dōjutsu já está no nível máximo' };
  }

  const nextDoujutsu = evolutionPath[currentIndex + 1];
  const nextDoujutsuInfo = DOUJUTSU_DATA[nextDoujutsu];

  // Verificar requisitos
  const fighterLevel = fighter.level ?? 1;
  if (fighterLevel < nextDoujutsuInfo.requiredLevel) {
    return {
      canEvolve: false,
      nextDoujutsu,
      reason: `Você precisa ser nível ${nextDoujutsuInfo.requiredLevel} para evoluir para ${nextDoujutsu}`,
    };
  }

  // Verificar nível de elemento (verifica se tem ALGUM elemento no nível necessário)
  const elementLevels = Object.values(fighter.elementLevels || {});
  const hasRequiredElementLevel = elementLevels.some(
    level => level >= nextDoujutsuInfo.requiredElementLevel
  );

  if (!hasRequiredElementLevel) {
    return {
      canEvolve: false,
      nextDoujutsu,
      reason: `Você precisa ter pelo menos um elemento no nível ${nextDoujutsuInfo.requiredElementLevel} para evoluir`,
    };
  }

  return {
    canEvolve: true,
    nextDoujutsu,
  };
}

/**
 * Evolui o Dōjutsu do fighter
 */
export function evolveDoujutsu(fighter: Fighter): Fighter {
  const evolutionCheck = canEvolveDoujutsu(fighter);
  
  if (!evolutionCheck.canEvolve || !evolutionCheck.nextDoujutsu) {
    throw new Error(evolutionCheck.reason || 'Não é possível evoluir o Dōjutsu');
  }

  return {
    ...fighter,
    doujutsu: {
      type: evolutionCheck.nextDoujutsu,
      stage: 1,
      isActive: false,
      cooldownUntil: null,
    },
  };
}

/**
 * Obtém informações do Dōjutsu
 */
export function getDoujutsuInfo(doujutsuType: DoujutsuType): DoujutsuInfo {
  return DOUJUTSU_DATA[doujutsuType];
}
