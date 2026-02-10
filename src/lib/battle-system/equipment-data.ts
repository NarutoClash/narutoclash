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