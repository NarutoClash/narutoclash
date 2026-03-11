/**
 * Tipos do Sistema de Guerra de Clãs 2v2 (escalável para 5v5)
 * Adaptado do sistema PVP existente
 */

import { FighterBattleState } from '@/lib/battle-system/build-detector';
import { BuildType } from '@/lib/battle-system/build-detector';

// Configuração central — mude aqui para 5v5
export const TEAM_SIZE = 5;
export const TOTAL_WAR_ROOMS = 10;
export const TURN_DURATION_SECONDS = 30;
export const TURN_RESULT_DISPLAY_SECONDS = 5;

export type WarRoomStatus   = 'available' | 'waiting' | 'active' | 'finished';
export type ClanWarStatus   = 'lobby' | 'active' | 'finished';
export type ClanWarPhase    = 'submit' | 'resolving' | 'result';
export type InviteStatus    = 'pending' | 'accepted' | 'declined';
export type WarActionType   = 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'defend' | 'charge' | 'doujutsu' | 'cursed_seal' | 'summon';

// ── Salas ────────────────────────────────────────────────────────────
export interface WarRoom {
  id: number;               // 1 ou 2 — fixo para sempre
  status: WarRoomStatus;
  war_id: string | null;
  clan_a_id: string | null;
  clan_a_name: string | null;
  clan_b_id: string | null;
  clan_b_name: string | null;
  opened_by: string | null;
  expires_at: string | null;
  spectator_count: number;
}

// ── Guerra ───────────────────────────────────────────────────────────
export interface ClanWar {
  id: string;
  room_id: number;
  clan_a_id: string;
  clan_a_name: string;
  clan_b_id: string;
  clan_b_name: string;
  status: ClanWarStatus;
  current_turn: number;
  current_phase: ClanWarPhase;
  phase_ends_at: string | null;
  team_a_bonus: number;
  team_b_bonus: number;
  winner_clan_id: string | null;
  started_at: string | null;
  finished_at: string | null;
}

// ── Membros (snapshot no momento de entrar) ──────────────────────────
export interface ClanWarMember {
  id: string;
  war_id: string;
  clan_id: string;
  player_id: string;
  player_name: string;
  player_avatar: string | null;
  slot: number;           // 1 a TEAM_SIZE
  // stats snapshot
  vitality: number;
  taijutsu: number;
  ninjutsu: number;
  genjutsu: number;
  intelligence: number;
  selo: number;
  element_levels: Record<string, number>;
  jutsus: Record<string, number>;
  weapon_id: string | null;
  chest_id: string | null;
  legs_id: string | null;
  feet_id: string | null;
  hands_id: string | null;
  summon_id: string | null;
  summon_level: number | null;
  summon_trained_stat: string | null;
  doujutsu: any | null;
  cursed_seal: any | null;
  build: BuildType;
  // estado de batalha (persiste entre turnos)
  hp_max: number;
  hp_current: number;
  chakra_max: number;
  chakra_current: number;
  is_alive: boolean;
  disconnected: boolean;
  inactive_turns: number; // turnos consecutivos sem ação
  // FighterBattleState serializado (veneno, queimadura, etc.)
  battle_state: FighterBattleState;
  // controles especiais
  doujutsu_used: boolean;
  cursed_seal_used: boolean;
  summon_used: boolean;
  is_defending: boolean;
  cooldowns: Record<string, number>;
}

// ── Ações por turno ──────────────────────────────────────────────────
export interface ClanWarAction {
  id: string;
  war_id: string;
  turn: number;
  player_id: string;
  clan_id: string;
  action_type: WarActionType;
  target_player_id: string;
  submitted_at: string;
  was_auto: boolean;
}

// ── Log de cada turno ────────────────────────────────────────────────
export interface WarTurnEvent {
  type: 'attack' | 'defend' | 'charge' | 'death' | 'disconnect' | 'auto' | 'special';
  actor_id: string;
  actor_name: string;
  target_id?: string;
  target_name?: string;
  action_type?: WarActionType;
  damage?: number;
  heal?: number;
  jutsu_used?: string;
  jutsu_gif?: string | null;
  is_critical?: boolean;
  build_effects?: any[];
  log_text: string;
}

export interface ClanWarTurnLog {
  id: string;
  war_id: string;
  turn: number;
  events: WarTurnEvent[];
  team_a_alive: number;
  team_b_alive: number;
  created_at: string;
}

// ── Convites ─────────────────────────────────────────────────────────
export interface ClanWarInvite {
  id: string;
  room_id: number;
  war_id: string | null;
  player_id: string;
  player_name: string;
  clan_id: string;
  status: InviteStatus;
  invited_by: string;
  created_at: string;
}

// ── Chakra costs (igual ao PVP) ───────────────────────────────────────
export const WAR_CHAKRA_COSTS: Record<WarActionType, number> = {
  taijutsu: 0, ninjutsu: 30, genjutsu: 25, defend: 10,
  charge: 0, doujutsu: 0, cursed_seal: 0, summon: 50,
};

// ── Bônus de equipe — desativado, dano sempre normal ─────────────────
export function calcTeamBonus(_alive: number): number {
  return 1.0; // sem bônus/penalidade por número de membros vivos
}

// ── Bônus de foco (3+ atacando o mesmo alvo) ─────────────────────────
export function calcFocusBonus(attackersOnTarget: number): number {
  return attackersOnTarget >= 3 ? 1.20 : 1.0;
}