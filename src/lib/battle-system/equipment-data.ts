/**
 * Dados de equipamentos
 * VERSÃO COMPLETA - Economia Rebalanceada (Naruto Root)
 */

import { Equipment } from './types';

// Re-exportar o tipo para facilitar imports
export type { Equipment } from './types';

export const EQUIPMENT_DATA: Equipment[] = [

  // ==================== PEITO ====================

  {
    id: 'colete-genin',
    name: 'Colete Ninja Genin',
    description: 'Colete padrão utilizado por genins em missões iniciais.',
    imageUrl: 'https://i.ibb.co/5x2fYcL6/Colete-Ninja-Genin.png',
    type: 'Peito',
    buffs: { vitalidade: 5, taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 1,
    price: 10000,
    passivas: [
      { id: 'colete_genin_resistencia', nome: 'Resistência Iniciante', descricao: 'Ao receber dano, 10% de chance de criar uma pequena barreira protetora.', chance: 0.10, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#86efac', emoji: '🛡️' },
    ],
  },
  {
    id: 'colete-chunin',
    name: 'Colete Ninja Chūnin',
    description: 'Colete reforçado que simboliza a patente de Chūnin.',
    imageUrl: 'https://i.ibb.co/1YzwPjCY/Colete-Ninja-Chunin.png',
    type: 'Peito',
    buffs: { vitalidade: 15, taijutsu: 2, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 15,
    price: 25000,
    passivas: [
      { id: 'colete_chunin_regen', nome: 'Resiliência Chunin', descricao: 'No início de cada turno, regenera 2% do HP máximo.', chance: 0.3, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.02, cor: '#4ade80', emoji: '💚' },
    ],
  },
  {
    id: 'colete-jonin',
    name: 'Colete Ninja Jōnin',
    description: 'Equipamento padrão de um ninja de elite.',
    imageUrl: 'https://i.ibb.co/yBMDtVSb/Colete-Ninja-Jonin.png',
    type: 'Peito',
    buffs: { vitalidade: 25, taijutsu: 5, ninjutsu: 5, genjutsu: 0, selo: 5, inteligencia: 5 },
    requiredLevel: 30,
    price: 80000,
    passivas: [
      { id: 'colete_jonin_barreira', nome: 'Guarda do Jōnin', descricao: 'Ao receber dano, 20% de chance de criar uma barreira de elite.', chance: 0.20, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#22d3ee', emoji: '🛡️' },
      { id: 'colete_jonin_regen', nome: 'Vitalidade de Elite', descricao: 'No início de cada turno, regenera 2% do HP máximo.', chance: 0.3, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.02, cor: '#34d399', emoji: '💙' },
    ],
  },
  {
    id: 'manto-akatsuki',
    name: 'Manto da Akatsuki',
    description: 'Manto negro com nuvens vermelhas, usado por ninjas renegados.',
    imageUrl: 'https://i.ibb.co/jvNRbY64/Manto-da-Akatsuki.png',
    type: 'Peito',
    buffs: { vitalidade: 10, taijutsu: 0, ninjutsu: 20, genjutsu: 10, selo: 0, inteligencia: 0 },
    requiredLevel: 40,
    price: 150000,
    passivas: [
      { id: 'akatsuki_aura', nome: 'Aura da Akatsuki', descricao: 'Sempre que usar Genjutsu, enfraquece o alvo com a presença intimidante.', chance: 0.35, gatilho: 'ao_usar_genjutsu', efeito: 'enfraquecer', cor: '#f43f5e', emoji: '☁️' },
    ],
  },
  {
    id: 'armadura-anbu',
    name: 'Armadura Tática ANBU',
    description: 'Armadura leve utilizada em missões secretas da ANBU.',
    imageUrl: 'https://i.ibb.co/VWkLn9fC/Armadura-ANB.png',
    type: 'Peito',
    buffs: { vitalidade: 35, taijutsu: 5, ninjutsu: 5, genjutsu: 5, selo: 5, inteligencia: 5 },
    requiredLevel: 45,
    price: 180000,
    passivas: [
      { id: 'anbu_reflexo', nome: 'Reflexo da ANBU', descricao: 'Ao receber dano, 25% de chance de refletir 15% de volta ao atacante.', chance: 0.25, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.15, cor: '#94a3b8', emoji: '🐾' },
      { id: 'anbu_sombra', nome: 'Passo Silencioso', descricao: 'Ao usar Taijutsu, 20% de chance de paralisar o alvo com o golpe furtivo.', chance: 0.20, gatilho: 'ao_usar_taijutsu', efeito: 'paralisia', cor: '#64748b', emoji: '🥷' },
    ],
  },
  {
    id: 'manto-sen-nin',
    name: 'Manto de Senjutsu',
    description: 'Manto adaptado para usuários de energia natural.',
    imageUrl: 'https://i.ibb.co/whYbrkfV/Manto-do-Sabio.png',
    type: 'Peito',
    buffs: { vitalidade: 20, taijutsu: 0, ninjutsu: 25, genjutsu: 15, selo: 10, inteligencia: 10 },
    requiredLevel: 55,
    price: 300000,
    passivas: [
      { id: 'sennin_natureza_regen', nome: 'Energia Natural', descricao: 'No início de cada turno, regenera 4% do HP máximo pela energia senjutsu.', chance: 0.4, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.04, cor: '#86efac', emoji: '🌿' },
    ],
  },
  {
    id: 'armadura-kage',
    name: 'Armadura de Kage',
    description: 'Equipamento usado por líderes de vila.',
    imageUrl: 'https://i.ibb.co/Z1B339kQ/Armadura-de-Kage.png',
    type: 'Peito',
    buffs: { vitalidade: 50, taijutsu: 10, ninjutsu: 10, genjutsu: 10, selo: 10, inteligencia: 10 },
    requiredLevel: 65,
    price: 500000,
    passivas: [
      { id: 'kage_barreira', nome: 'Escudo do Kage', descricao: 'Ao receber dano, 30% de chance de criar uma barreira de alto nível.', chance: 0.30, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#fbbf24', emoji: '👑' },
      { id: 'kage_reflexo', nome: 'Autoridade do Kage', descricao: 'Sempre que usar qualquer jutsu, enfraquece o alvo com sua presença dominante.', chance: 0.4, gatilho: 'ao_atacar', efeito: 'enfraquecer', cor: '#f59e0b', emoji: '⚡' },
    ],
  },
  {
    id: 'manto-chakra-denso',
    name: 'Manto de Chakra Denso',
    description: 'Manto projetado para suportar grandes volumes de chakra.',
    imageUrl: 'https://i.ibb.co/wNp5zH3N/Manto-de-Chakra-Denso.png',
    type: 'Peito',
    buffs: { vitalidade: 25, taijutsu: 0, ninjutsu: 35, genjutsu: 25, selo: 15, inteligencia: 15 },
    requiredLevel: 75,
    price: 750000,
    passivas: [
      { id: 'chakra_denso_cap', nome: 'Surto de Chakra', descricao: 'Ao usar Ninjutsu, 30% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.30, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#818cf8', emoji: '🌀' },
      { id: 'chakra_denso_regen', nome: 'Fluxo Denso', descricao: 'No início de cada turno, regenera 3% do HP máximo.', chance: 0.35, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.03, cor: '#a78bfa', emoji: '💜' },
    ],
  },
  {
    id: 'armadura-elite-ninja',
    name: 'Armadura de Elite Ninja',
    description: 'Equipamento máximo desenvolvido para ninjas de alto nível.',
    imageUrl: 'https://i.ibb.co/67yD8kd3/Armadura-de-Elite-Ninja.png',
    type: 'Peito',
    buffs: { vitalidade: 70, taijutsu: 20, ninjutsu: 20, genjutsu: 20, selo: 20, inteligencia: 20 },
    requiredLevel: 90,
    price: 2000000,
    passivas: [
      { id: 'elite_barreira', nome: 'Armadura Invicta', descricao: 'Ao receber dano, 35% de chance de criar uma barreira máxima.', chance: 0.35, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#f59e0b', emoji: '🏆' },
      { id: 'elite_reflexo', nome: 'Contramedida Elite', descricao: 'Ao receber dano, 25% de chance de refletir 20% de volta ao atacante.', chance: 0.25, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.20, cor: '#fbbf24', emoji: '⚔️' },
    ],
  },

  // ==================== PERNAS ====================

  {
    id: 'calca-ninja-reforcada',
    name: 'Calça Ninja Reforçada',
    description: 'Calça com proteção adicional para combate.',
    imageUrl: 'https://i.ibb.co/r27jpctP/Calca-Ninja-Reforcada.png',
    type: 'Pernas',
    buffs: { vitalidade: 8, taijutsu: 2, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 10,
    price: 15000,
    passivas: [
      { id: 'calca_ref_regen', nome: 'Base Sólida', descricao: 'No início de cada turno, regenera 1% do HP máximo.', chance: 0.25, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.01, cor: '#a3e635', emoji: '🦵' },
    ],
  },
  {
    id: 'calca-fluxo-chakra',
    name: 'Calça de Fluxo de Chakra',
    description: 'Auxilia a circulação de chakra nas pernas.',
    imageUrl: 'https://i.ibb.co/MkdYj1mF/Calca-de-Chakra.png',
    type: 'Pernas',
    buffs: { vitalidade: 2, taijutsu: 0, ninjutsu: 8, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 20,
    price: 50000,
    passivas: [
      { id: 'calca_fluxo_cap', nome: 'Fluxo Acelerado', descricao: 'Ao usar Ninjutsu, 15% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.15, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#38bdf8', emoji: '💧' },
    ],
  },
  {
    id: 'calca-anbu',
    name: 'Calça Tática ANBU',
    description: 'Calça usada em missões de infiltração.',
    imageUrl: 'https://i.ibb.co/dJtPCtpM/Calca-ANBU.png',
    type: 'Pernas',
    buffs: { vitalidade: 15, taijutsu: 5, ninjutsu: 5, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 30,
    price: 90000,
    passivas: [
      { id: 'calca_anbu_paralisia', nome: 'Golpe Certeiro', descricao: 'Ao usar Taijutsu, 20% de chance de paralisar o alvo.', chance: 0.20, gatilho: 'ao_usar_taijutsu', efeito: 'paralisia', cor: '#94a3b8', emoji: '🥷' },
    ],
  },
  {
    id: 'calca-movimento-rapido',
    name: 'Calça de Movimento Rápido',
    description: 'Facilita deslocamentos ágeis em combate.',
    imageUrl: 'https://i.ibb.co/QFTXCSj0/Calca-do-Vento-Cortante.png',
    type: 'Pernas',
    buffs: { vitalidade: 5, taijutsu: 12, ninjutsu: 0, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 40,
    price: 160000,
    passivas: [
      { id: 'calca_mov_enfraquecer', nome: 'Pressão Constante', descricao: 'Sempre que usar Taijutsu, enfraquece o alvo pelo impacto da velocidade.', chance: 0.4, gatilho: 'ao_usar_taijutsu', efeito: 'enfraquecer', cor: '#4ade80', emoji: '💨' },
    ],
  },
  {
    id: 'calca-controle-chakra',
    name: 'Calça de Controle de Chakra',
    description: 'Melhora a estabilidade na execução de técnicas.',
    imageUrl: 'https://i.ibb.co/YTZ3nmk8/Calca-de-Selos.png',
    type: 'Pernas',
    buffs: { vitalidade: 10, taijutsu: 0, ninjutsu: 15, genjutsu: 5, selo: 10, inteligencia: 5 },
    requiredLevel: 55,
    price: 320000,
    passivas: [
      { id: 'calca_controle_seal', nome: 'Controle Apurado', descricao: 'Ao usar Genjutsu, 25% de chance de selar o ninjutsu do alvo.', chance: 0.25, gatilho: 'ao_usar_genjutsu', efeito: 'selar_jutsu', cor: '#a855f7', emoji: '🔮' },
      { id: 'calca_controle_regen', nome: 'Estabilidade de Chakra', descricao: 'No início de cada turno, regenera 2% do HP máximo.', chance: 0.3, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.02, cor: '#c084fc', emoji: '💜' },
    ],
  },
  {
    id: 'calca-kage',
    name: 'Calça de Kage',
    description: 'Equipamento reservado a líderes.',
    imageUrl: 'https://i.ibb.co/PzvLDSZF/Calca-de-Kage.png',
    type: 'Pernas',
    buffs: { vitalidade: 25, taijutsu: 10, ninjutsu: 10, genjutsu: 10, selo: 10, inteligencia: 5 },
    requiredLevel: 70,
    price: 600000,
    passivas: [
      { id: 'calca_kage_reflexo', nome: 'Passo do Kage', descricao: 'Ao receber dano, 25% de chance de refletir 15% de volta ao atacante.', chance: 0.25, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.15, cor: '#fbbf24', emoji: '👑' },
    ],
  },
  {
    id: 'calca-controle-avancado',
    name: 'Calça de Controle Avançado',
    description: 'Projetada para ninjas de alto domínio técnico.',
    imageUrl: 'https://i.ibb.co/5gGJ8zMr/Calca-de-Controle-Avancado-de-Chakra.png',
    type: 'Pernas',
    buffs: { vitalidade: 35, taijutsu: 20, ninjutsu: 20, genjutsu: 10, selo: 15, inteligencia: 10 },
    requiredLevel: 85,
    price: 1300000,
    passivas: [
      { id: 'calca_av_cap', nome: 'Domínio Total', descricao: 'Ao usar Ninjutsu, 30% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.30, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#818cf8', emoji: '⚡' },
      { id: 'calca_av_regen', nome: 'Controle Avançado', descricao: 'No início de cada turno, regenera 3% do HP máximo.', chance: 0.35, gatilho: 'inicio_turno', efeito: 'regeneracao', valor: 0.03, cor: '#a78bfa', emoji: '💜' },
    ],
  },

  // ==================== PÉS ====================

  {
    id: 'sandalias-ninja',
    name: 'Sandálias Ninja',
    description: 'Calçado padrão shinobi.',
    imageUrl: 'https://i.ibb.co/wN70N8xg/Sandalias-Ninja.png',
    type: 'Pés',
    buffs: { vitalidade: 0, taijutsu: 2, ninjutsu: 0, genjutsu: 0, selo: 2, inteligencia: 0 },
    requiredLevel: 1,
    price: 10000,
    passivas: [
      { id: 'sandalia_barreira', nome: 'Postura Shinobi', descricao: 'Ao receber dano, 10% de chance de criar uma barreira básica.', chance: 0.10, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#86efac', emoji: '👟' },
    ],
  },
  {
    id: 'botas-movimento-rapido',
    name: 'Botas de Movimento Rápido',
    description: 'Projetadas para deslocamento ágil.',
    imageUrl: 'https://i.ibb.co/d0fMnGTz/Botas-de-Alta-Velocidade.png',
    type: 'Pés',
    buffs: { vitalidade: 0, taijutsu: 8, ninjutsu: 0, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 25,
    price: 70000,
    passivas: [
      { id: 'botas_mov_enfraquecer', nome: 'Impacto Veloz', descricao: 'Ao usar Taijutsu, 20% de chance de enfraquecer o alvo pela velocidade do golpe.', chance: 0.20, gatilho: 'ao_usar_taijutsu', efeito: 'enfraquecer', cor: '#4ade80', emoji: '💨' },
    ],
  },
  {
    id: 'botas-anbu',
    name: 'Botas Táticas ANBU',
    description: 'Silenciosas e resistentes.',
    imageUrl: 'https://i.ibb.co/67hLyhPY/Botas-ANBU.png',
    type: 'Pés',
    buffs: { vitalidade: 5, taijutsu: 8, ninjutsu: 5, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 30,
    price: 90000,
    passivas: [
      { id: 'botas_anbu_paralisia', nome: 'Passo Silencioso ANBU', descricao: '20% de chance ao atacar de paralisar o alvo com o golpe surpresa.', chance: 0.20, gatilho: 'ao_atacar', efeito: 'paralisia', cor: '#94a3b8', emoji: '🥷' },
    ],
  },
  {
    id: 'botas-raiton',
    name: 'Botas de Impulso Raiton',
    description: 'Aumentam explosão de velocidade.',
    imageUrl: 'https://i.ibb.co/5XTMGmCL/Botas-do-Relampago.png',
    type: 'Pés',
    buffs: { vitalidade: 0, taijutsu: 15, ninjutsu: 5, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 45,
    price: 180000,
    passivas: [
      { id: 'botas_raiton_paralisia', nome: 'Impulso Relampejante', descricao: 'Sempre que usar Taijutsu, 30% de chance de paralisar o alvo com o impacto carregado.', chance: 0.30, gatilho: 'ao_usar_taijutsu', efeito: 'paralisia', cor: '#fde047', emoji: '⚡' },
      { id: 'botas_raiton_cap', nome: 'Velocidade do Raio', descricao: '20% de chance ao atacar de o próximo golpe ignorar o cap de dano.', chance: 0.20, gatilho: 'ao_atacar', efeito: 'ignorar_cap', cor: '#facc15', emoji: '🌩️' },
    ],
  },
  {
    id: 'botas-infiltracao',
    name: 'Botas de Infiltração',
    description: 'Desenvolvidas para missões furtivas.',
    imageUrl: 'https://i.ibb.co/q3XmJnM4/Botas-de-Infiltracao.png',
    type: 'Pés',
    buffs: { vitalidade: 5, taijutsu: 10, ninjutsu: 10, genjutsu: 10, selo: 5, inteligencia: 5 },
    requiredLevel: 60,
    price: 400000,
    passivas: [
      { id: 'botas_inf_veneno', nome: 'Veneno Furtivo', descricao: 'Ao usar Genjutsu, 25% de chance de envenenar o alvo (6% HP/turno).', chance: 0.25, gatilho: 'ao_usar_genjutsu', efeito: 'veneno', valor: 0.06, cor: '#84cc16', emoji: '🌑' },
      { id: 'botas_inf_seal', nome: 'Sabotagem Silenciosa', descricao: '20% de chance ao atacar de selar o ninjutsu do alvo.', chance: 0.20, gatilho: 'ao_atacar', efeito: 'selar_jutsu', cor: '#64748b', emoji: '🔇' },
    ],
  },
  {
    id: 'botas-kage',
    name: 'Botas de Kage',
    description: 'Equipamento de elite.',
    imageUrl: 'https://i.ibb.co/kscZDgtk/Botas-de-Kage.png',
    type: 'Pés',
    buffs: { vitalidade: 15, taijutsu: 20, ninjutsu: 10, genjutsu: 10, selo: 10, inteligencia: 5 },
    requiredLevel: 75,
    price: 750000,
    passivas: [
      { id: 'botas_kage_reflexo', nome: 'Passo Inabalável do Kage', descricao: 'Ao receber dano, 30% de chance de refletir 20% de volta ao atacante.', chance: 0.30, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.20, cor: '#fbbf24', emoji: '👑' },
    ],
  },
  {
    id: 'botas-alta-velocidade',
    name: 'Botas de Alta Velocidade',
    description: 'Projetadas para combates de alto nível.',
    imageUrl: 'https://i.ibb.co/N6N5SHTg/Botas-de-Velocidade.png',
    type: 'Pés',
    buffs: { vitalidade: 20, taijutsu: 30, ninjutsu: 20, genjutsu: 15, selo: 15, inteligencia: 10 },
    requiredLevel: 90,
    price: 1500000,
    passivas: [
      { id: 'botas_vel_cap', nome: 'Velocidade Máxima', descricao: 'Sempre que usar Taijutsu, 35% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.35, gatilho: 'ao_usar_taijutsu', efeito: 'ignorar_cap', cor: '#38bdf8', emoji: '🚀' },
      { id: 'botas_vel_enfraquecer', nome: 'Pressão Extrema', descricao: 'Ao atacar, enfraquece o alvo pela pressão constante da velocidade.', chance: 0.35, gatilho: 'ao_atacar', efeito: 'enfraquecer', cor: '#7dd3fc', emoji: '💨' },
    ],
  },

  // ==================== MÃOS ====================

  {
    id: 'luvas-ninja',
    name: 'Luvas Ninja',
    description: 'Melhoram a aderência em combate.',
    imageUrl: 'https://i.ibb.co/671pqLKv/Luvas-Ninja.png',
    type: 'Mãos',
    buffs: { vitalidade: 0, taijutsu: 3, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 5,
    price: 12000,
    passivas: [
      { id: 'luvas_ninja_lifesteal', nome: 'Empunhadura Afiada', descricao: 'Ao usar Taijutsu, 10% de chance de roubar 5% do dano causado como HP.', chance: 0.10, gatilho: 'ao_usar_taijutsu', efeito: 'lifesteal', valor: 0.05, cor: '#a3e635', emoji: '🥊' },
    ],
  },
  {
    id: 'bracadeiras-defensivas',
    name: 'Braçadeiras Defensivas',
    description: 'Reduzem impacto de golpes diretos.',
    imageUrl: 'https://i.ibb.co/4R3JWjjM/Bracadeiras-de-Defesa.png',
    type: 'Mãos',
    buffs: { vitalidade: 10, taijutsu: -2, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 18,
    price: 45000,
    passivas: [
      { id: 'bracadeiras_barreira', nome: 'Defesa Reforçada', descricao: 'Ao receber dano, 20% de chance de criar uma barreira absorvente.', chance: 0.20, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#6b7280', emoji: '🛡️' },
      { id: 'bracadeiras_reflexo', nome: 'Contra-Impacto', descricao: 'Ao receber dano, 15% de chance de refletir 10% de volta ao atacante.', chance: 0.15, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.10, cor: '#9ca3af', emoji: '💥' },
    ],
  },
  {
    id: 'luvas-anbu',
    name: 'Luvas Táticas ANBU',
    description: 'Aumentam precisão e controle.',
    imageUrl: 'https://i.ibb.co/21VTjn3q/Luvas-ANBU.png',
    type: 'Mãos',
    buffs: { vitalidade: 5, taijutsu: 8, ninjutsu: 5, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 30,
    price: 90000,
    passivas: [
      { id: 'luvas_anbu_veneno', nome: 'Garra Envenenada', descricao: 'Ao usar Taijutsu, 25% de chance de envenenar o alvo (7% HP/turno).', chance: 0.25, gatilho: 'ao_usar_taijutsu', efeito: 'veneno', valor: 0.07, cor: '#84cc16', emoji: '🐾' },
    ],
  },
  {
    id: 'luvas-concentracao-chakra',
    name: 'Luvas de Concentração de Chakra',
    description: 'Amplificam golpes canalizados.',
    imageUrl: 'https://i.ibb.co/DgQS2W1s/Luvas-de-Chakra-Concentrado.png',
    type: 'Mãos',
    buffs: { vitalidade: 0, taijutsu: 10, ninjutsu: 15, genjutsu: 0, selo: 10, inteligencia: 5 },
    requiredLevel: 45,
    price: 200000,
    passivas: [
      { id: 'luvas_chakra_lifesteal', nome: 'Golpe Canalizado', descricao: 'Sempre que usar Taijutsu, rouba 8% do dano causado como HP.', chance: 0.35, gatilho: 'ao_usar_taijutsu', efeito: 'lifesteal', valor: 0.08, cor: '#818cf8', emoji: '💪' },
      { id: 'luvas_chakra_cap', nome: 'Chakra Concentrado', descricao: 'Ao usar Ninjutsu, 20% de chance de ignorar o cap de dano.', chance: 0.20, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#6366f1', emoji: '✨' },
    ],
  },
  {
    id: 'manoplas-selos-complexos',
    name: 'Manoplas de Selos Complexos',
    description: 'Otimizadas para execução rápida de técnicas.',
    imageUrl: 'https://i.ibb.co/C5wvH0X3/Manoplas-de-Selos-Complexo.png',
    type: 'Mãos',
    buffs: { vitalidade: 5, taijutsu: 0, ninjutsu: 15, genjutsu: 15, selo: 15, inteligencia: 10 },
    requiredLevel: 60,
    price: 420000,
    passivas: [
      { id: 'manoplas_seal', nome: 'Selos Relâmpago', descricao: 'Sempre que usar Ninjutsu, sela o jutsu do alvo com a rapidez dos selos.', chance: 0.4, gatilho: 'ao_usar_ninjutsu', efeito: 'selar_jutsu', cor: '#fbbf24', emoji: '📿' },
    ],
  },
  {
    id: 'manoplas-kage',
    name: 'Manoplas de Kage',
    description: 'Equipamento avançado de combate.',
    imageUrl: 'https://i.ibb.co/kgqHp5Q1/Manoplas-de-Kage.png',
    type: 'Mãos',
    buffs: { vitalidade: 15, taijutsu: 15, ninjutsu: 15, genjutsu: 10, selo: 10, inteligencia: 10 },
    requiredLevel: 75,
    price: 800000,
    passivas: [
      { id: 'manoplas_kage_lifesteal', nome: 'Punho do Kage', descricao: 'Sempre que usar Taijutsu, rouba 10% do dano causado como HP.', chance: 0.4, gatilho: 'ao_usar_taijutsu', efeito: 'lifesteal', valor: 0.10, cor: '#fbbf24', emoji: '👊' },
      { id: 'manoplas_kage_reflexo', nome: 'Defesa do Kage', descricao: 'Ao receber dano, 25% de chance de refletir 20% de volta ao atacante.', chance: 0.25, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.20, cor: '#f59e0b', emoji: '🛡️' },
    ],
  },
  {
    id: 'manoplas-combate-avancado',
    name: 'Manoplas de Combate Avançado',
    description: 'Desenvolvidas para confrontos de alto nível.',
    imageUrl: 'https://i.ibb.co/PZ9g2XVr/Manoplas-de-Combate-Avancado.png',
    type: 'Mãos',
    buffs: { vitalidade: 25, taijutsu: 30, ninjutsu: 25, genjutsu: 20, selo: 20, inteligencia: 15 },
    requiredLevel: 90,
    price: 1600000,
    passivas: [
      { id: 'manoplas_av_lifesteal', nome: 'Golpe Devastador', descricao: 'Sempre que usar Taijutsu, rouba 12% do dano causado como HP.', chance: 0.4, gatilho: 'ao_usar_taijutsu', efeito: 'lifesteal', valor: 0.12, cor: '#ef4444', emoji: '🤜' },
      { id: 'manoplas_av_cap', nome: 'Força Máxima', descricao: '30% de chance ao usar Taijutsu de o próximo ataque ignorar o cap de dano.', chance: 0.30, gatilho: 'ao_usar_taijutsu', efeito: 'ignorar_cap', cor: '#dc2626', emoji: '💥' },
    ],
  },

];

/**
 * Encontra um equipamento pelo ID
 */
export function getEquipmentById(id: string): Equipment | undefined {
  return EQUIPMENT_DATA.find(eq => eq.id === id);
}

/**
 * Filtra equipamentos por tipo
 */
export function getEquipmentsByType(type: Equipment['type']): Equipment[] {
  return EQUIPMENT_DATA.filter(eq => eq.type === type);
}

/**
 * Filtra equipamentos disponíveis por nível
 */
export function getAvailableEquipments(fighterLevel: number): Equipment[] {
  return EQUIPMENT_DATA.filter(eq => eq.requiredLevel <= fighterLevel);
}