/**
 * Tipos para o sistema de batalha
 * VERSÃO 2.0 - Com sistema de builds, passivas e relatórios ricos
 */

export type Element = 'Katon' | 'Futon' | 'Raiton' | 'Doton' | 'Suiton';
export type AttackType = 'taijutsu' | 'ninjutsu' | 'genjutsu';
export type DoujutsuType = 
  | 'Sharingan' | 'Mangekyō Sharingan' | 'Rinnegan'
  | 'Byakugan' | 'Tenseigan' | 'Jōgan';
export type EquipmentType = 'Peito' | 'Pernas' | 'Pés' | 'Mãos';

export type BuildEffectType =
  | 'dual_attack' | 'second_hit' | 'counter_attack'
  | 'burn_applied' | 'burn_damage' | 'paralysis_applied' | 'paralysis_skipped'
  | 'seal_applied' | 'seal_blocked_ninjutsu' | 'barrier_blocked'
  | 'survived_death' | 'regen' | 'weaken_applied'
  | 'combo_ready' | 'combo_triggered' | 'first_crit'
  | 'no_cap_triggered' | 'vit_crit_bonus' | 'ninj_combo_bonus'
  // Passivas de Item
  | 'item_veneno' | 'item_queimadura' | 'item_paralisia' | 'item_selar_jutsu'
  | 'item_lifesteal' | 'item_regeneracao' | 'item_enfraquecer'
  | 'item_barreira' | 'item_refletir' | 'item_ignorar_cap'
  | 'item_veneno_tick' | 'item_barreira_absorveu';

export interface BuildEffect {
  type: BuildEffectType;
  label: string;
  value?: number;
  color?: string;
}

export type PassiveTrigger =
  | 'ao_atacar'
  | 'ao_receber_dano'
  | 'inicio_turno'
  | 'ao_usar_taijutsu'
  | 'ao_usar_ninjutsu'
  | 'ao_usar_genjutsu';

export type PassiveEffectType =
  | 'veneno'         // dano por turno no alvo
  | 'queimadura'     // dano por turno no alvo (fogo)
  | 'paralisia'      // alvo perde próximo turno
  | 'selar_jutsu'    // bloqueia ninjutsu do alvo
  | 'lifesteal'      // recupera % do dano causado como HP
  | 'regeneracao'    // recupera % do HP máximo por turno
  | 'enfraquecer'    // alvo recebe +20% de dano
  | 'barreira'       // absorve o próximo ataque
  | 'refletir'       // devolve % do dano recebido
  | 'ignorar_cap';   // próximo ataque ignora o cap de dano

export interface ItemPassive {
  id: string;
  nome: string;
  descricao: string;
  /** 'sempre' = efeito permanente ativo; número = chance por ativação (0.0 a 1.0) */
  chance: 'sempre' | number;
  gatilho: PassiveTrigger;
  efeito: PassiveEffectType;
  /** Valor do efeito: percentual (0.10 = 10%) ou fixo dependendo do efeito */
  valor?: number;
  /** Se true, a passiva só ativa quando o portador estiver com <= 50% do HP máximo */
  ativaApos50HP?: boolean;
  /** Barreira: ativa apenas 1 vez por turno */
  barreiraPorTurno?: boolean;
  cor?: string;
  emoji?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: EquipmentType;
  buffs: {
    taijutsu: number; ninjutsu: number; genjutsu: number;
    selo: number; vitalidade: number; inteligencia: number;
  };
  requiredLevel: number;
  price: number;
  passivas?: ItemPassive[];
}

export interface DoujutsuStage {
  name: string;
  buffs: { ninjutsu?: number; genjutsu?: number; taijutsu?: number; intelligence?: number; };
}

export interface DoujutsuInfo {
  name: DoujutsuType;
  description: string;
  type: 'base' | 'evolution';
  requiredLevel: number;
  requiredElementLevel: number;
  stages: { [key: number]: DoujutsuStage };
}

export interface Fighter {
  vitality: number;
  taijutsu: number;
  ninjutsu: number;
  genjutsu: number;
  intelligence: number;
  selo: number;
  elementLevels?: Partial<Record<Element, number>>;
  jutsus?: Record<string, number>;
  cursedSeal?: {
    level: 0 | 1 | 2;
    isActive: boolean;
    activationTime?: number | null;
    cooldownUntil?: number | null;
  };
  doujutsu?: {
    type: DoujutsuType;
    stage: number;
    isActive: boolean;
    cooldownUntil?: number | null;
  };
  weaponId?: string | null;
  summonId?: string | null;
  summonLevel?: number | null;
  summonTrainedStat?: string | null;
  chestId?: string | null;
  legsId?: string | null;
  feetId?: string | null;
  handsId?: string | null;
  name?: string;
  level?: number;
  ryo?: number;
  experience?: number;
  currentHealth?: number;
  clan_war_points?: number;
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
  jutsuGif?: string | null;
  elementUsed?: Element;
  isCritical: boolean;
  buildEffects?: BuildEffect[];
  secondHitDamage?: number;
  secondHitJutsu?: string;
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

export type RichBattleLogEntry = string | {
  turn: number;
  attacker: 'player' | 'opponent' | 'boss';
  attackType: AttackType;
  jutsuName: string;
  jutsuGif: string | null;
  damageLog: string;
  damage: number;
  totalDamage: number;
  isCritical: boolean;
  buildEffects: BuildEffect[];         // efeitos durante o ataque (passivas ofensivas)
  startOfTurnEffects?: BuildEffect[];  // NOVO: veneno/burn/regen aplicados antes do ataque
  reactionEffects?: BuildEffect[];     // NOVO: barreira ativada, refletir (reações ao ataque)
  secondHit?: { damage: number; jutsuName: string; };
  playerHealth?: string;
  opponentHealth?: string;
  playerHealthPct?: number;
  opponentHealthPct?: number;
  attackerBuild?: string;
  attackerBuildEmoji?: string;
  attackerBuildColor?: string;
};

export interface ValidationError {
  field: string;
  message: string;
}

export interface CursedSealActivationResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
}