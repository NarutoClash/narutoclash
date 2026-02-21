// lib/stats-calculator.ts
import { weaponsData, type Weapon } from '@/lib/weapons-data';
import { summonsData, type Summon, TRAINING_BONUS_PER_LEVEL } from '@/lib/summons-data';
import { EQUIPMENT_DATA as equipmentsData, type Equipment } from '@/lib/battle-system/equipment-data';
import { DOUJUTSU_DATA as doujutsuData } from '@/lib/battle-system/doujutsu-loader';
import { calculateWarPointsBonus } from './clan-bonus-calculator'; // 🆕 ADICIONAR

/**
 * Calcula o buff da invocação com treinamento
 */
function getSummonBuffWithTraining(
  summon: Summon | undefined,
  stat: string,
  summonLevel: number | null | undefined,
  trainedStat: string | null | undefined
): number {
  if (!summon) return 0;
  
  const statKey = stat as keyof Summon['buffs'];
  const baseBuff = summon.buffs[statKey] || 0;
  
  // Se ESTE stat está sendo treinado, adiciona bônus
  if (trainedStat === stat && summonLevel && summonLevel > 1) {
    return baseBuff + ((summonLevel - 1) * TRAINING_BONUS_PER_LEVEL);
  }
  
  return baseBuff;
}

/**
 * Calcula stats finais com TODOS os buffs aplicados
 * ✅ AGORA EXPORTADA CORRETAMENTE
 */
export function calculateFinalStats(userProfile: any) {
  if (!userProfile) return null;

  const {
    vitality: baseVitality = 0,
    intelligence: baseIntelligence = 0,
    taijutsu: baseTaijutsu = 0,
    ninjutsu: baseNinjutsu = 0,
    genjutsu: baseGenjutsu = 0,
    selo: baseSelo = 0,
    element_levels: elementLevels = {},
    cursed_seal: cursedSeal,
    doujutsu: doujutsuProfile,
    weapon_id: weaponId,
    summon_id: summonId,
    summon_level: summonLevel,
    summon_trained_stat: trainedStat,
    chest_id: chestId,
    legs_id: legsId,
    feet_id: feetId,
    hands_id: handsId,
    clan_war_points: clanWarPoints = 0, // 🆕 ADICIONAR
  } = userProfile;

  // Equipamentos
  const equippedWeapon = weaponsData.find(w => w.id === weaponId);
  const equippedSummon = summonsData.find(s => s.id === summonId);
  const equippedChest = equipmentsData.find(e => e.id === chestId);
  const equippedLegs = equipmentsData.find(e => e.id === legsId);
  const equippedFeet = equipmentsData.find(e => e.id === feetId);
  const equippedHands = equipmentsData.find(e => e.id === handsId);

  // 🆕 CALCULAR BÔNUS DO CLÃ (PONTOS DE GUERRA)
  const clanBonus = calculateWarPointsBonus(clanWarPoints);

  // ========== VITALIDADE ==========
  let vitality = baseVitality
    + (equippedWeapon?.buffs.vitalidade || 0)
    + getSummonBuffWithTraining(equippedSummon, 'vitalidade', summonLevel, trainedStat)
    + (equippedChest?.buffs.vitalidade || 0)
    + (equippedLegs?.buffs.vitalidade || 0)
    + (equippedFeet?.buffs.vitalidade || 0)
    + (equippedHands?.buffs.vitalidade || 0);

  // ========== INTELIGÊNCIA ==========
  let intelligence = baseIntelligence
    + (equippedWeapon?.buffs.inteligencia || 0)
    + getSummonBuffWithTraining(equippedSummon, 'inteligencia', summonLevel, trainedStat)
    + (equippedChest?.buffs.inteligencia || 0)
    + (equippedLegs?.buffs.inteligencia || 0)
    + (equippedFeet?.buffs.inteligencia || 0)
    + (equippedHands?.buffs.inteligencia || 0);

  // ========== TAIJUTSU ==========
  let taijutsu = baseTaijutsu
    + (equippedWeapon?.buffs.taijutsu || 0)
    + getSummonBuffWithTraining(equippedSummon, 'taijutsu', summonLevel, trainedStat)
    + (equippedChest?.buffs.taijutsu || 0)
    + (equippedLegs?.buffs.taijutsu || 0)
    + (equippedFeet?.buffs.taijutsu || 0)
    + (equippedHands?.buffs.taijutsu || 0);

  // ========== NINJUTSU ==========
  let ninjutsu = baseNinjutsu
    + (equippedWeapon?.buffs.ninjutsu || 0)
    + getSummonBuffWithTraining(equippedSummon, 'ninjutsu', summonLevel, trainedStat)
    + (equippedChest?.buffs.ninjutsu || 0)
    + (equippedLegs?.buffs.ninjutsu || 0)
    + (equippedFeet?.buffs.ninjutsu || 0)
    + (equippedHands?.buffs.ninjutsu || 0);

  // ========== GENJUTSU ==========
  let genjutsu = baseGenjutsu
    + (equippedWeapon?.buffs.genjutsu || 0)
    + getSummonBuffWithTraining(equippedSummon, 'genjutsu', summonLevel, trainedStat)
    + (equippedChest?.buffs.genjutsu || 0)
    + (equippedLegs?.buffs.genjutsu || 0)
    + (equippedFeet?.buffs.genjutsu || 0)
    + (equippedHands?.buffs.genjutsu || 0);

  // ========== SELO ==========
  let selo = baseSelo
    + (equippedWeapon?.buffs.selo || 0)
    + getSummonBuffWithTraining(equippedSummon, 'selo', summonLevel, trainedStat)
    + (equippedChest?.buffs.selo || 0)
    + (equippedLegs?.buffs.selo || 0)
    + (equippedFeet?.buffs.selo || 0)
    + (equippedHands?.buffs.selo || 0);

  // ========== MULTIPLICADORES: SELO AMALDIÇOADO ==========
  const isSealActive = cursedSeal?.isActive && cursedSeal?.activationTime 
    && (Date.now() - cursedSeal.activationTime) < (30 * 60 * 1000);

  if (isSealActive && cursedSeal) {
    if (cursedSeal.level === 1) {
      vitality *= 0.85;
      ninjutsu *= 1.20;
      taijutsu *= 1.20;
      selo *= 1.15;
    } else if (cursedSeal.level === 2) {
      vitality *= 0.70;
      ninjutsu *= 1.40;
      taijutsu *= 1.40;
      selo *= 1.30;
    }
  }

  // ========== MULTIPLICADORES: DŌJUTSU ==========
  const isDoujutsuActive = doujutsuProfile?.isActive || false;

  if (isDoujutsuActive && doujutsuProfile) {
    const doujutsuInfo = doujutsuData[doujutsuProfile.type];
    if (doujutsuInfo) {
      const buffs = doujutsuInfo.stages[1]?.buffs as Record<string, number> | undefined;
      ninjutsu *= (buffs?.['ninjutsu'] || 1);
      genjutsu *= (buffs?.['genjutsu'] || 1);
      taijutsu *= (buffs?.['taijutsu'] || 1);
      intelligence *= (buffs?.['intelligence'] || 1);
    }
  }

  // ========== BÔNUS DE ELEMENTOS ==========
  const dotonLevel = elementLevels['Doton'] || 0;
  const suitonLevel = elementLevels['Suiton'] || 0;
  const futonLevel = elementLevels['Futon'] || 0;
  const katonLevel = elementLevels['Katon'] || 0;
  const raitonLevel = elementLevels['Raiton'] || 0;

  let finalVitality = vitality + (futonLevel * 0); // Futon não afeta vitalidade
  let finalTaijutsu = taijutsu + (futonLevel * 2);
  let finalNinjutsu = ninjutsu + (katonLevel * 2);
  let finalGenjutsu = genjutsu + (dotonLevel * 2);
  let finalSelo = selo + (raitonLevel * 2);
  let finalIntelligence = intelligence + (suitonLevel * 2);

  // 🆕 ADICIONAR BÔNUS DO CLÃ (DEPOIS DE TODOS OS MULTIPLICADORES E ELEMENTOS)
  finalVitality += clanBonus;
  finalIntelligence += clanBonus;
  finalTaijutsu += clanBonus;
  finalNinjutsu += clanBonus;
  finalGenjutsu += clanBonus;
  finalSelo += clanBonus;

  // ========== VIDA E CHAKRA ==========
  const maxHealth = 100 + (finalVitality * 15);
  const maxChakra = 100 + (finalIntelligence * 5);

  return {
    // Stats finais (com todos os buffs)
    finalVitality,
    finalIntelligence,
    finalTaijutsu,
    finalNinjutsu,
    finalGenjutsu,
    finalSelo,
    
    // Stats intermediários (para tooltips)
    profileVitality: baseVitality,
    profileIntelligence: baseIntelligence,
    profileTaijutsu: baseTaijutsu,
    profileNinjutsu: baseNinjutsu,
    profileGenjutsu: baseGenjutsu,
    profileSelo: baseSelo,
    
    // Stats base (sem buffs) - MANTIDO PARA COMPATIBILIDADE
    baseVitality,
    baseIntelligence,
    baseTaijutsu,
    baseNinjutsu,
    baseGenjutsu,
    baseSelo,
    
    // Vida e Chakra
    maxHealth,
    maxChakra,
  };
}