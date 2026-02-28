// /lib/clan-technologies.ts

export type TechnologyType = 'hospital' | 'dojo' | 'treasury';

export type TechnologyLevel = {
  level: number;
  cost: number;
  name: string;
  description: string;
  benefits: string[];
};

export type Technology = {
  id: TechnologyType;
  name: string;
  icon: string;
  description: string;
  maxLevel: 5;
  levels: TechnologyLevel[];
};

// 🏥 HOSPITAL DO CLÃ
export const hospitalLevels: TechnologyLevel[] = [
  {
    level: 1,
    cost: 500000,
    name: 'Enfermaria Básica',
    description: 'Melhora a regeneração de chakra',
    benefits: ['Regeneração de chakra 10% mais rápida']
  },
  {
    level: 2,
    cost: 1500000,
    name: 'Ala Médica',
    description: 'Instalações médicas aprimoradas',
    benefits: ['Regeneração de chakra 10% mais rápida', 'Mantém benefício do Nv 1']
  },
  {
    level: 3,
    cost: 4000000,
    name: 'Centro Médico',
    description: 'Poções funcionam melhor',
    benefits: [
      'Regeneração de chakra 10% mais rápida',
      'Poções 20% mais eficientes',
      'Acumula com níveis anteriores'
    ]
  },
  {
    level: 4,
    cost: 10000000,
    name: 'Hospital Avançado',
    description: 'Tratamentos especializados',
    benefits: [
      'Regeneração de chakra 10% mais rápida',
      'Poções 20% mais eficientes',
      'Mantém todos os benefícios'
    ]
  },
  {
    level: 5,
    cost: 25000000,
    name: 'Hospital Lendário',
    description: 'Medicina shinobi de elite',
    benefits: [
      'Regeneração de chakra 10% mais rápida',
      'Poções 20% mais eficientes',
      'Reduz cooldown de Dōjutsu/Selo em 20%'
    ]
  }
];

// 🥋 DOJO DO CLÃ
export const dojoLevels: TechnologyLevel[] = [
  {
    level: 1,
    cost: 500000,
    name: 'Área de Treino',
    description: 'Espaço básico para treinamento',
    benefits: ['+5% XP em missões']
  },
  {
    level: 2,
    cost: 1500000,
    name: 'Dojo Tradicional',
    description: 'Treino estruturado',
    benefits: ['+10% XP em missões', 'Acumula com Nv 1']
  },
  {
    level: 3,
    cost: 4000000,
    name: 'Dojo Avançado',
    description: 'Métodos de treino superiores',
    benefits: ['+15% XP em missões', 'Total: +15% XP']
  },
  {
    level: 4,
    cost: 10000000,
    name: 'Academia de Elite',
    description: 'Treinamento elemental especializado',
    benefits: [
      '+15% XP em missões',
      '+10% XP de elementos',
      'Bônus cumulativo'
    ]
  },
  {
    level: 5,
    cost: 25000000,
    name: 'Santuário do Sábio',
    description: 'Conhecimento ancestral',
    benefits: [
      '+15% XP em missões',
      '+10% XP de elementos',
      '+10% XP de jutsus'
    ]
  }
];

// 💰 TESOURO DO CLÃ
export const treasuryLevels: TechnologyLevel[] = [
  {
    level: 1,
    cost: 500000,
    name: 'Cofre Básico',
    description: 'Armazenamento seguro',
    benefits: ['+5% Ryo em missões']
  },
  {
    level: 2,
    cost: 1500000,
    name: 'Cofre Reforçado',
    description: 'Maior capacidade de armazenamento',
    benefits: ['+10% Ryo em missões', 'Acumula com Nv 1']
  },
  {
    level: 3,
    cost: 4000000,
    name: 'Tesouro Fortificado',
    description: 'Conexões comerciais estabelecidas',
    benefits: [
      '+10% Ryo em missões',
      '3% desconto em todas as lojas'
    ]
  },
  {
    level: 4,
    cost: 10000000,
    name: 'Câmara do Tesouro',
    description: 'Rede comercial expandida',
    benefits: [
      '+10% Ryo em missões',
      '5% desconto em todas as lojas',
      'Descontos cumulativos'
    ]
  },
  {
    level: 5,
    cost: 25000000,
    name: 'Vault Imperial',
    description: 'Riqueza lendária',
    benefits: [
      '+10% Ryo em missões',
      '5% desconto em todas as lojas',
      'Mantém todos os benefícios'
    ]
  }
];

// 📚 CATÁLOGO DE TECNOLOGIAS
export const clanTechnologies: Technology[] = [
  {
    id: 'hospital',
    name: 'Hospital do Clã',
    icon: '🏥',
    description: 'Melhora regeneração de chakra, eficiência de poções e reduz cooldowns',
    maxLevel: 5,
    levels: hospitalLevels
  },
  {
    id: 'dojo',
    name: 'Dojo do Clã',
    icon: '🥋',
    description: 'Aumenta ganho de XP em missões, elementos e jutsus',
    maxLevel: 5,
    levels: dojoLevels
  },
  {
    id: 'treasury',
    name: 'Tesouro do Clã',
    icon: '💰',
    description: 'Aumenta ganho de Ryo e concede descontos em lojas',
    maxLevel: 5,
    levels: treasuryLevels
  }
];

// 🔧 HELPER: Calcular benefícios ativos
export const getClanBenefits = (technologies: { hospital: number; dojo: number; treasury: number }) => {
  return {
    // Hospital
    chakraRegenBonus: technologies.hospital >= 1 ? 10 : 0, // %
    potionEfficiencyBonus: technologies.hospital >= 3 ? 20 : 0, // %
    cooldownReduction: technologies.hospital >= 5 ? 20 : 0, // %
    
    // Dojo
    missionXpBonus: 
      technologies.dojo >= 3 ? 15 :
      technologies.dojo >= 2 ? 10 :
      technologies.dojo >= 1 ? 5 : 0, // %
    elementXpBonus: technologies.dojo >= 4 ? 10 : 0, // %
    jutsuXpBonus: technologies.dojo >= 5 ? 10 : 0, // %
    
    // Treasury
    missionRyoBonus: 
      technologies.treasury >= 2 ? 10 :
      technologies.treasury >= 1 ? 5 : 0, // %
    shopDiscount: 
      technologies.treasury >= 4 ? 5 :
      technologies.treasury >= 3 ? 3 : 0, // %
  };
};

// 🔧 HELPER: Verificar se pode fazer upgrade
export const canUpgradeTechnology = (
  technologyId: TechnologyType,
  currentLevel: number,
  treasuryRyo: number
): { canUpgrade: boolean; cost: number; reason?: string } => {
  const technology = clanTechnologies.find(t => t.id === technologyId);
  
  if (!technology) {
    return { canUpgrade: false, cost: 0, reason: 'Tecnologia não encontrada' };
  }
  
  if (currentLevel >= technology.maxLevel) {
    return { canUpgrade: false, cost: 0, reason: 'Nível máximo atingido' };
  }
  
  const nextLevel = technology.levels[currentLevel]; // currentLevel é o índice do próximo nível
  
  if (!nextLevel) {
    return { canUpgrade: false, cost: 0, reason: 'Próximo nível não disponível' };
  }
  
  if (treasuryRyo < nextLevel.cost) {
    return { 
      canUpgrade: false, 
      cost: nextLevel.cost, 
      reason: `Faltam ${nextLevel.cost - treasuryRyo} Ryo no cofre` 
    };
  }
  
  return { canUpgrade: true, cost: nextLevel.cost };
};