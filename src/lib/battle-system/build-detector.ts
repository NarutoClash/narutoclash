/**
 * Sistema de Detecção de Build
 * Detecta os 2 stats mais altos do lutador e retorna o arquétipo com bônus passivos
 */

import { DynamicStats } from './types';

export type BuildType =
  | 'berserker'        // taijutsu + selo
  | 'sombra'           // taijutsu + ninjutsu
  | 'ilusionista'      // taijutsu + genjutsu
  | 'tanque'           // taijutsu + vitality
  | 'fisico_sabio'     // taijutsu + intelligence
  | 'artes_proibidas'  // ninjutsu + genjutsu
  | 'feiticeiro'       // ninjutsu + selo
  | 'guardiao'         // ninjutsu + vitality
  | 'oraculo'          // ninjutsu + intelligence
  | 'fantasma'         // genjutsu + selo
  | 'monge'            // genjutsu + intelligence
  | 'imortal'          // genjutsu + vitality
  | 'senhor_guerra'    // vitality + selo
  | 'protetor'         // vitality + intelligence
  | 'ermitao'          // intelligence + selo
  | 'generico';        // fallback

export interface BuildInfo {
  type: BuildType;
  name: string;
  emoji: string;
  color: string;
  description: string;
  passives: BuildPassive[];
}

export interface BuildPassive {
  id: string;
  name: string;
  description: string;
}

// Estado de batalha por lutador (passivo de turno)
export interface FighterBattleState {
  burnDamage: number;        // queimadura: dano no próximo turno
  paralyzed: boolean;        // paralisia: perde próximo turno
  sealed: boolean;           // selado: não pode usar ninjutsu no próximo turno
  weakened: boolean;         // fraqueza: recebe +20% dano no próximo turno
  nextHitNoCap: boolean;     // próximo ataque ignora cap de 35%
  regenPercent: number;      // regen de HP por turno (0.03 = 3%)
  barrierUsed: boolean;      // barreira Doton já usada nesta batalha
  barrierActiveThisTurn: boolean; // barreira de item: ativa 1x por turno após 50% HP
  barrierPending: boolean;        // barreira ativada neste turno → protege o PRÓXIMO ataque
  survivedDeathUsed: boolean;// sobreviveu à morte já foi usado
  nextNinjutsuBonus: number; // bônus de dano no próximo ninjutsu
  comboReady: boolean;       // ilusionista: genjutsu resistido → próximo tai +50%
  // Passivas de item em tick (acumulam por turno)
  poisonDamage: number;      // veneno: dano fixo no próximo turno
  lifestealHealed: number;   // lifesteal: HP recuperado neste turno (acumulado)
  reflectDamage: number;     // refletir: dano a ser devolvido ao próximo atacante
}

export function emptyBattleState(): FighterBattleState {
  return {
    burnDamage: 0,
    paralyzed: false,
    sealed: false,
    weakened: false,
    nextHitNoCap: false,
    regenPercent: 0,
    barrierUsed: false,
    barrierActiveThisTurn: false,
    barrierPending: false,
    survivedDeathUsed: false,
    nextNinjutsuBonus: 0,
    comboReady: false,
    poisonDamage: 0,
    lifestealHealed: 0,
    reflectDamage: 0,
  };
}

const BUILD_MAP: Record<string, BuildType> = {
  'taijutsu+selo':        'berserker',
  'ninjutsu+taijutsu':    'sombra',
  'genjutsu+taijutsu':    'ilusionista',
  'taijutsu+vitality':    'tanque',
  'intelligence+taijutsu':'fisico_sabio',
  'genjutsu+ninjutsu':    'artes_proibidas',
  'ninjutsu+selo':        'feiticeiro',
  'ninjutsu+vitality':    'guardiao',
  'intelligence+ninjutsu':'oraculo',
  'genjutsu+selo':        'fantasma',
  'genjutsu+intelligence':'monge',
  'genjutsu+vitality':    'imortal',
  'selo+vitality':        'senhor_guerra',
  'intelligence+vitality':'protetor',
  'intelligence+selo':    'ermitao',
};

export const BUILD_INFO: Record<BuildType, BuildInfo> = {
  berserker: {
    type: 'berserker', name: 'Hachimon', emoji: '⚔️', color: '#ef4444',
    description: 'Guerreiro Crítico - especialista em golpes devastadores',
    passives: [
      { id: 'extra_crit', name: '+5% Crítico', description: '+5% de chance de crítico fixo' },
      { id: 'tai_bonus', name: 'Fúria', description: 'Dano de taijutsu +15%' },
      { id: 'no_cap_on_crit', name: 'Golpe Fatal', description: 'Ao acertar crítico, próximo ataque ignora cap de 35%' },
    ],
  },
  sombra: {
    type: 'sombra', name: 'Ankoku', emoji: '🌑', color: '#6366f1',
    description: 'Shinobi Completo - domina corpo e magia',
    passives: [
      { id: 'dual_attack', name: 'Ataque Duplo', description: '30% de chance de atacar duas vezes por turno (segundo ataque = 60% dano)' },
      { id: 'adaptive', name: 'Adaptável', description: 'Usa o tipo de ataque mais forte (ponderado por stat)' },
    ],
  },
  ilusionista: {
    type: 'ilusionista', name: 'Kyomei', emoji: '🎭', color: '#a855f7',
    description: 'Combatente Enganoso - usa ilusões para potencializar golpes físicos',
    passives: [
      { id: 'combo_ready', name: 'Golpe Exposto', description: 'Após genjutsu resistido, próximo taijutsu causa +50% de dano' },
      { id: 'gen_weaken', name: 'Ilusão Debilitante', description: 'Genjutsu bem-sucedido aplica fraqueza: alvo recebe +20% dano no próximo turno' },
    ],
  },
  tanque: {
    type: 'tanque', name: 'Daikabe', emoji: '🛡️', color: '#22c55e',
    description: 'Corpo Fechado - absorve dano e contra-ataca',
    passives: [
      { id: 'dmg_reduction', name: 'Pele Dura', description: 'Recebe -20% de dano de todos os tipos' },
      { id: 'counter', name: 'Contra-Ataque', description: 'Ao levar crítico, devolve 30% do dano como taijutsu imediato' },
    ],
  },
  fisico_sabio: {
    type: 'fisico_sabio', name: 'Shisaku', emoji: '🧠', color: '#0ea5e9',
    description: 'Combatente Estratégico - combina força e intelecto',
    passives: [
      { id: 'int_tai_bonus', name: 'Golpe Calculado', description: 'Intelligence também entra no cálculo de taijutsu (int × 0.3)' },
      { id: 'ninj_resist', name: 'Resistência Mágica', description: 'Redução de dano de ninjutsu recebido +25%' },
    ],
  },
  artes_proibidas: {
    type: 'artes_proibidas', name: 'Kinjutsu', emoji: '🔮', color: '#f59e0b',
    description: 'Mestre das Artes Ocultas - sela e destrói',
    passives: [
      { id: 'seal_chance', name: 'Selo Proibido', description: 'Genjutsu bem-sucedido tem 25% de chance de selar ninjutsu do alvo por 1 turno' },
      { id: 'combo_ninj', name: 'Encadeamento', description: 'Ninjutsu após genjutsu bem-sucedido causa +20% dano no mesmo turno' },
    ],
  },
  feiticeiro: {
    type: 'feiticeiro', name: 'Jutsushi', emoji: '✨', color: '#f97316',
    description: 'Mestre dos Jutsus - domina o poder dos elementos',
    passives: [
      { id: 'jutsu_cap_up', name: 'Domínio Elemental', description: 'jutsuMultiplier cap aumenta para ×2.2' },
      { id: 'burn', name: 'Queimadura', description: 'Crítico de ninjutsu aplica queimadura: 10% do dano no próximo turno' },
    ],
  },
  guardiao: {
    type: 'guardiao', name: 'Shugosha', emoji: '🌊', color: '#06b6d4',
    description: 'Ninja Resiliente - regenera e persiste',
    passives: [
      { id: 'regen', name: 'Regeneração', description: 'Recupera 3% do HP máximo por turno' },
      { id: 'min_ninj', name: 'Fluxo Constante', description: 'Ninjutsu nunca causa menos de 15% do dano base (mínimo maior)' },
    ],
  },
  oraculo: {
    type: 'oraculo', name: 'Chikan', emoji: '🔯', color: '#84cc16',
    description: 'Técnico Supremo - amplifica poder elemental',
    passives: [
      { id: 'ninj_resist_50', name: 'Escudo Arcano', description: 'Redução de dano de ninjutsu recebido +50%' },
      { id: 'element_bonus_up', name: 'Potência Elemental', description: 'elementMultiplier aumentado de ×0.04 para ×0.07 por nível de elemento' },
    ],
  },
  fantasma: {
    type: 'fantasma', name: 'Reikon', emoji: '👻', color: '#c084fc',
    description: 'Ilusão Letal - genjutsu assassino',
    passives: [
      { id: 'gen_attack_up', name: 'Ilusão Letal', description: 'Multiplicador de ataque de genjutsu: ×1.6 (era ×1.2)' },
      { id: 'selo_gen_bonus', name: 'Foco Sombrio', description: 'Selo entra no cálculo de genjutsu (selo × 0.4)' },
    ],
  },
  monge: {
    type: 'monge', name: 'Seishin', emoji: '🧘', color: '#10b981',
    description: 'Mente Transcendente - control mental absoluto',
    passives: [
      { id: 'int_gen_bonus', name: 'Mente Superior', description: 'Intelligence entra no ataque de genjutsu (int × 0.5)' },
      { id: 'gen_resist', name: 'Barreira Mental', description: 'Redução de dano de genjutsu recebido +40%' },
    ],
  },
  imortal: {
    type: 'imortal', name: 'Kairai', emoji: '💀', color: '#64748b',
    description: 'Ninja Indestrutível - simplesmente não morre',
    passives: [
      { id: 'hp_bonus', name: 'Corpo Imortal', description: 'HP máximo +25% adicional' },
      { id: 'survive_death', name: 'Vontade de Ferro', description: '20% de chance de sobreviver com 1 HP (uma vez por batalha)' },
    ],
  },
  senhor_guerra: {
    type: 'senhor_guerra', name: 'Taishō', emoji: '🏆', color: '#dc2626',
    description: 'Ninja Implacável - vitalidade se converte em poder',
    passives: [
      { id: 'vit_crit', name: 'Força Bruta', description: 'Cada 100 pts de vitality dão +1% de chance de crítico' },
      { id: 'post_win_regen', name: 'Sede de Batalha', description: 'Ao derrotar oponente, recupera 20% do HP perdido na batalha' },
    ],
  },
  protetor: {
    type: 'protetor', name: 'Shirogane', emoji: '🏯', color: '#0284c7',
    description: 'Muralha Viva - máxima sobrevivência',
    passives: [
      { id: 'hp_formula_up', name: 'Muralha Viva', description: 'HP máximo: vit×15 + int×8 (em vez de só vit×15)' },
      { id: 'all_dmg_reduction', name: 'Guardião Eterno', description: 'Redução de todos os danos recebidos +15%' },
    ],
  },
  ermitao: {
    type: 'ermitao', name: 'Kyoshi', emoji: '🌙', color: '#7c3aed',
    description: 'Estrategista Silencioso - o primeiro golpe sempre acerta',
    passives: [
      { id: 'first_crit', name: 'Golpe Surpresa', description: 'Primeiro ataque da batalha é sempre crítico' },
      { id: 'int_gen_resist', name: 'Mente Fortalecida', description: 'Intelligence reduz dano de genjutsu recebido em 60%' },
    ],
  },
  generico: {
    type: 'generico', name: 'Ninja', emoji: '🥷', color: '#94a3b8',
    description: 'Ninja sem especialização definida',
    passives: [],
  },
};

export function detectBuild(stats: DynamicStats): BuildType {
  const statValues: [string, number][] = [
    ['vitality',     stats.finalVitality],
    ['intelligence', stats.finalIntelligence],
    ['taijutsu',     stats.finalTaijutsu],
    ['ninjutsu',     stats.finalNinjutsu],
    ['genjutsu',     stats.finalGenjutsu],
    ['selo',         stats.finalSelo],
  ];

  const sorted = statValues.sort((a, b) => b[1] - a[1]);
  const top2 = [sorted[0][0], sorted[1][0]].sort().join('+');
  return BUILD_MAP[top2] || 'generico';
}

export function getBuildInfo(buildType: BuildType): BuildInfo {
  return BUILD_INFO[buildType];
}