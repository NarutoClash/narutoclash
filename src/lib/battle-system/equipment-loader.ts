/**
 * Sistema de carregamento de equipamentos
 */

import { Fighter, Equipment } from './types';

/**
 * Interface para os bônus totais de equipamentos
 */
export interface EquipmentBonuses {
  vitality: number;
  taijutsu: number;
  ninjutsu: number;
  genjutsu: number;
  selo: number;
  intelligence: number;
}

/**
 * Calcula os bônus totais de todos os equipamentos do fighter
 * 
 * NOTA: Esta função assume que você tem um sistema para carregar
 * os dados dos equipamentos por ID. Você precisará implementar
 * a função getEquipmentById() baseado em seu banco de dados.
 */
export function calculateEquipmentBonuses(
  fighter: Fighter,
  equipmentData: Equipment[]
): EquipmentBonuses {
  const bonuses: EquipmentBonuses = {
    vitality: 0,
    taijutsu: 0,
    ninjutsu: 0,
    genjutsu: 0,
    selo: 0,
    intelligence: 0,
  };

  // Helper para adicionar bônus de um equipamento
  const addEquipmentBonus = (equipmentId: string | null | undefined) => {
    if (!equipmentId) return;
    
    const equipment = equipmentData.find(eq => eq.id === equipmentId);
    if (!equipment) return;

    bonuses.vitality += equipment.buffs.vitalidade;
    bonuses.taijutsu += equipment.buffs.taijutsu;
    bonuses.ninjutsu += equipment.buffs.ninjutsu;
    bonuses.genjutsu += equipment.buffs.genjutsu;
    bonuses.selo += equipment.buffs.selo;
    bonuses.intelligence += equipment.buffs.inteligencia;
  };

  // Processar cada slot de equipamento
  addEquipmentBonus(fighter.chestId);
  addEquipmentBonus(fighter.legsId);
  addEquipmentBonus(fighter.feetId);
  addEquipmentBonus(fighter.handsId);
  addEquipmentBonus(fighter.weaponId);

  return bonuses;
}

/**
 * Valida se o fighter pode equipar um item
 */
export function canEquipItem(fighter: Fighter, equipment: Equipment): {
  canEquip: boolean;
  reason?: string;
} {
  // Verificar nível
  const fighterLevel = fighter.level ?? 1;
  if (fighterLevel < equipment.requiredLevel) {
    return {
      canEquip: false,
      reason: `Você precisa ser nível ${equipment.requiredLevel} para equipar ${equipment.name}`,
    };
  }

  return { canEquip: true };
}

/**
 * Equipa um item no fighter
 * Retorna o fighter atualizado
 */
export function equipItem(fighter: Fighter, equipment: Equipment): Fighter {
  const updatedFighter = { ...fighter };

  switch (equipment.type) {
    case 'Peito':
      updatedFighter.chestId = equipment.id;
      break;
    case 'Pernas':
      updatedFighter.legsId = equipment.id;
      break;
    case 'Pés':
      updatedFighter.feetId = equipment.id;
      break;
    case 'Mãos':
      updatedFighter.handsId = equipment.id;
      break;
  }

  return updatedFighter;
}

/**
 * Remove um equipamento do fighter
 */
export function unequipItem(fighter: Fighter, slot: 'chest' | 'legs' | 'feet' | 'hands' | 'weapon'): Fighter {
  const updatedFighter = { ...fighter };

  switch (slot) {
    case 'chest':
      updatedFighter.chestId = null;
      break;
    case 'legs':
      updatedFighter.legsId = null;
      break;
    case 'feet':
      updatedFighter.feetId = null;
      break;
    case 'hands':
      updatedFighter.handsId = null;
      break;
    case 'weapon':
      updatedFighter.weaponId = null;
      break;
  }

  return updatedFighter;
}

/**
 * Obtém lista de equipamentos equipados
 */
export function getEquippedItems(fighter: Fighter, equipmentData: Equipment[]): Equipment[] {
  const equipped: Equipment[] = [];

  const equipmentIds = [
    fighter.chestId,
    fighter.legsId,
    fighter.feetId,
    fighter.handsId,
    fighter.weaponId,
  ].filter(Boolean) as string[];

  for (const id of equipmentIds) {
    const equipment = equipmentData.find(eq => eq.id === id);
    if (equipment) {
      equipped.push(equipment);
    }
  }

  return equipped;
}
