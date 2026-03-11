/**
 * Tipos do Sistema PVP por Turnos v3 — Simultâneo
 */

import { FighterBattleState, BuildType } from '@/lib/battle-system/build-detector';
import { Fighter, AttackType, BuildEffect } from '@/lib/battle-system/types';

export type PVPBattleStatus    = 'waiting' | 'active' | 'finished';
export type PVPChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type PVPActionType      = 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'defend' | 'charge' | 'doujutsu' | 'cursed_seal' | 'summon';

// Cooldowns em turnos após o uso
export const ACTION_COOLDOWNS: Record<PVPActionType, number> = {
  taijutsu:    2,
  ninjutsu:    3,
  genjutsu:    2,
  defend:      2,
  charge:      0,
  doujutsu:    0,  // 1x por batalha
  cursed_seal: 0,  // 1x por batalha
  summon:      0,  // 1x por batalha
};

export interface PVPFighterSnapshot {
  id: string;
  name: string;
  level: number;
  avatar_url?: string;
  vitality: number;
  taijutsu: number;
  ninjutsu: number;
  genjutsu: number;
  intelligence: number;
  selo: number;
  elementLevels: Record<string, number>;
  jutsus: Record<string, number>;
  cursedSeal?: { level: 0 | 1 | 2; isActive: boolean; cooldownUntil?: number | null };
  doujutsu?: { type: string; stage: number; isActive: boolean; cooldownUntil?: number | null };
  weaponId?: string | null;
  summonId?: string | null;
  summonLevel?: number | null;
  summonTrainedStat?: string | null;
  chestId?: string | null;
  legsId?: string | null;
  feetId?: string | null;
  handsId?: string | null;
  clanWarPoints?: number;
  savedCurrentHealth?: number | null;
}

export interface PVPFighterState {
  snapshot: PVPFighterSnapshot;
  currentHealth: number;
  currentChakra: number;
  maxHealth: number;
  maxChakra: number;
  battleState: FighterBattleState;
  build: BuildType;
  doujutsuUsed: boolean;
  cursedSealUsed: boolean;
  summonUsed: boolean;
  isDefending: boolean;
  cooldowns: Partial<Record<PVPActionType, number>>;
}

export interface PVPTurnLogEntry {
  turn: number;
  challenger: {
    actorId: string;
    action: PVPActionType;
    attackType?: AttackType;
    jutsuUsed?: string;
    jutsuGif?: string | null;
    damage: number;
    totalDamage: number;
    isCritical: boolean;
    buildEffects: BuildEffect[];
    secondHit?: { damage: number; jutsuName: string };
    logText: string;
  };
  opponent: {
    actorId: string;
    action: PVPActionType;
    attackType?: AttackType;
    jutsuUsed?: string;
    jutsuGif?: string | null;
    damage: number;
    totalDamage: number;
    isCritical: boolean;
    buildEffects: BuildEffect[];
    secondHit?: { damage: number; jutsuName: string };
    logText: string;
  };
  challengerHealthAfter: number;
  opponentHealthAfter: number;
}

export interface PVPBattleState {
  challenger: PVPFighterState;
  opponent: PVPFighterState;
  currentTurn: number;
  log: PVPTurnLogEntry[];
  status: PVPBattleStatus;
  winnerId?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface PVPBattleRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: PVPBattleStatus;
  current_turn_user_id: string;
  state: PVPBattleState;
  winner_id?: string | null;
  xp_reward?: number | null;
  ryo_reward?: number | null;
  pvp_points_change?: number | null;
  created_at: string;
  updated_at: string;
  turn_deadline?: string | null;
  pending_challenger_action?: PVPActionType | null;
  pending_opponent_action?: PVPActionType | null;
  challenger_online?: boolean;
  opponent_online?: boolean;
  turn_number?: number;
}

export interface PVPChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: PVPChallengeStatus;
  created_at: string;
  expires_at: string;
}

export interface PVPPlayerInfo {
  id: string;
  name: string;
  level: number;
  avatar_url?: string;
  pvp_points?: number;
  pvp_wins?: number;
  pvp_losses?: number;
}