/**
 * Tipos para o sistema de batalha
 * VERSÃO ATUALIZADA - Nomenclatura padronizada e validações
 */

export type Element = 'Katon' | 'Futon' | 'Raiton' | 'Doton' | 'Suiton';

export type AttackType = 'taijutsu' | 'ninjutsu' | 'genjutsu';

export type DoujutsuType = 
  | 'Sharingan' 
  | 'Mangekyō Sharingan' 
  | 'Rinnegan' 
  | 'Byakugan' 
  | 'Tenseigan' 
  | 'Jōgan';

export type EquipmentType = 'Peito' | 'Pernas' | 'Pés' | 'Mãos';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: EquipmentType;
  buffs: {
    taijutsu: number;
    ninjutsu: number;
    genjutsu: number;
    selo: number;
    vitalidade: number;
    inteligencia: number;
  };
  requiredLevel: number;
  price: number;
}

export interface DoujutsuStage {
  name: string;
  buffs: {
    ninjutsu?: number;
    genjutsu?: number;
    taijutsu?: number;
    intelligence?: number;
  };
}

export interface DoujutsuInfo {
  name: DoujutsuType;
  description: string;
  type: 'base' | 'evolution';
  requiredLevel: number;
  requiredElementLevel: number;
  stages: {
    [key: number]: DoujutsuStage;
  };
}

export interface Fighter {
  // Atributos base
  vitality: number;
  taijutsu: number;
  ninjutsu: number;
  genjutsu: number;
  intelligence: number;
  selo: number;
  
  // Elementos (níveis de 0-10)
  elementLevels?: Partial<Record<Element, number>>;
  
  // Jutsus aprendidos (níveis de 0-25)
  jutsus?: Record<string, number>;
  
  // Selo Amaldiçoado
  cursedSeal?: {
    level: 0 | 1 | 2;
    isActive: boolean;
    activationTime?: number | null;
    cooldownUntil?: number | null;
  };
  
  // Dōjutsu
  doujutsu?: {
    type: DoujutsuType;
    stage: number;
    isActive: boolean;
    cooldownUntil?: number | null;
  };
  
  // Equipamentos (nomenclatura padronizada)
  weaponId?: string | null;
  summonId?: string | null;
  summonLevel?: number | null;
  summonTrainedStat?: string | null;
  chestId?: string | null;
  legsId?: string | null;
  feetId?: string | null;
  handsId?: string | null;
  
  // Informações opcionais
  name?: string;
  level?: number;
  ryo?: number;
  experience?: number;
  
  // Vida atual (necessário para validar ativação de selo)
  currentHealth?: number;
}

export interface DynamicStats {
  maxHealth: number;
  maxChakra: number;
  finalVitality: number;
  finalTaijutsu: number;
  finalNinjutsu: number;
  finalGenjutsu: number;
  finalSelo: number;
  finalIntelligence: number;
}

export interface AttackResult {
  damage: number;
  log: string;
  jutsuUsed?: string;
  jutsuGif?: string | null; // ✅ ADICIONAR ESTA LINHA
  elementUsed?: Element;
  isCritical: boolean;
}

export interface BattleTurn {
  turnNumber: number;
  attacker: string;
  attackType: AttackType;
  damage: number;
  log: string;
  attackerHealth: number;
  defenderHealth: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CursedSealActivationResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
}
