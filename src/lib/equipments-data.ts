/**
 * Arquivo de compatibilidade - redireciona para o novo sistema de batalha
 * TODO: Migrar todos os imports para usar @/lib/battle-system/equipment-data
 */

export { 
    EQUIPMENT_DATA as equipmentsData,
    getEquipmentById,
    getEquipmentsByType,
    getAvailableEquipments
  } from '@/lib/battle-system/equipment-data';
  
  export type { 
    Equipment,
    EquipmentType
  } from '@/lib/battle-system/types';