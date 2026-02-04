/**
 * Dados de equipamentos
 * VERSÃO ATUALIZADA - Nomenclatura padronizada
 */

import { Equipment } from './types';

// Re-exportar o tipo para facilitar imports
export type { Equipment } from './types';

export const EQUIPMENT_DATA: Equipment[] = [
  // ==================== PEITO ====================
  {
    id: 'colete-genin',
    name: 'Colete Ninja (Genin)',
    description: 'O colete padrão para um genin. Oferece proteção básica e bolsos para ferramentas.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Peito',
    buffs: { vitalidade: 5, taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 1,
    price: 300,
  },
  {
    id: 'colete-chunin',
    name: 'Colete Ninja (Chūnin)',
    description: 'Um colete reforçado, símbolo de um Chūnin. Oferece maior proteção contra golpes físicos.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Peito',
    buffs: { vitalidade: 15, taijutsu: 2, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 15,
    price: 2000,
  },
  {
    id: 'colete-jonin',
    name: 'Colete Ninja (Jōnin)',
    description: 'O colete de elite. Leve, resistente e projetado para a máxima mobilidade e proteção.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Peito',
    buffs: { vitalidade: 25, taijutsu: 5, ninjutsu: 5, genjutsu: 0, selo: 5, inteligencia: 5 },
    requiredLevel: 30,
    price: 10000,
  },
  {
    id: 'manto-akatsuki',
    name: 'Manto da Akatsuki',
    description: 'O infame manto negro com nuvens vermelhas. Aumenta a proeza em ninjutsu e genjutsu.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Peito',
    buffs: { vitalidade: 10, taijutsu: 0, ninjutsu: 20, genjutsu: 10, selo: 0, inteligencia: 0 },
    requiredLevel: 40,
    price: 25000,
  },

  // ==================== PERNAS ====================
  {
    id: 'calca-reforcada',
    name: 'Calça Ninja Reforçada',
    description: 'Calças com placas de metal ocultas, oferecendo proteção extra para as pernas.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Pernas',
    buffs: { vitalidade: 8, taijutsu: 2, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 10,
    price: 1000,
  },
  {
    id: 'calca-chakra',
    name: 'Calça de Chakra',
    description: 'Calças feitas com fibras que otimizam o fluxo de chakra, melhorando a execução de jutsus.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Pernas',
    buffs: { vitalidade: 2, taijutsu: 0, ninjutsu: 8, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 20,
    price: 5000,
  },

  // ==================== PÉS ====================
  {
    id: 'sandalias-padrao',
    name: 'Sandálias Ninja',
    description: 'O calçado padrão de um shinobi, projetado para mobilidade e silêncio.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Pés',
    buffs: { vitalidade: 0, taijutsu: 2, ninjutsu: 0, genjutsu: 0, selo: 2, inteligencia: 0 },
    requiredLevel: 1,
    price: 150,
  },
  {
    id: 'botas-velocidade',
    name: 'Botas de Velocidade',
    description: 'Botas leves infundidas com chakra do vento, permitindo movimentos mais rápidos e ágeis.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Pés',
    buffs: { vitalidade: 0, taijutsu: 8, ninjutsu: 0, genjutsu: 0, selo: 5, inteligencia: 0 },
    requiredLevel: 25,
    price: 8000,
  },

  // ==================== MÃOS ====================
  {
    id: 'luvas-ninja',
    name: 'Luvas Ninja',
    description: 'Luvas simples que melhoram a aderência e protegem as mãos durante o combate.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Mãos',
    buffs: { vitalidade: 0, taijutsu: 3, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 5,
    price: 400,
  },
  {
    id: 'bracadeiras-defesa',
    name: 'Braçadeiras de Defesa',
    description: 'Braçadeiras de metal usadas para bloquear ataques de lâminas e projéteis.',
    imageUrl: 'https://i.imgur.com/example.png',
    type: 'Mãos',
    buffs: { vitalidade: 10, taijutsu: -2, ninjutsu: 0, genjutsu: 0, selo: 0, inteligencia: 0 },
    requiredLevel: 18,
    price: 3500,
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
 * Filtra equipamentos que o fighter pode usar
 */
export function getAvailableEquipments(fighterLevel: number): Equipment[] {
  return EQUIPMENT_DATA.filter(eq => eq.requiredLevel <= fighterLevel);
}