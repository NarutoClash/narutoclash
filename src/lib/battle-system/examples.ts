/**
 * EXEMPLOS DE USO DO SISTEMA DE BATALHA
 * Este arquivo demonstra como usar todas as funcionalidades
 */

import {
  Fighter,
  calculateDynamicStats,
  calculateDamage,
  validateFighter,
  validateCursedSealActivation,
  validateDoujutsuActivation,
  calculateCursedSealCooldown,
  canEvolveDoujutsu,
  evolveDoujutsu,
  canEquipItem,
  equipItem,
} from './index';
import { EQUIPMENT_DATA } from './equipment-data';

// ========================================
// EXEMPLO 1: Criar um Fighter básico
// ========================================
const naruto: Fighter = {
  name: 'Naruto Uzumaki',
  level: 25,
  vitality: 50,
  taijutsu: 40,
  ninjutsu: 45,
  genjutsu: 10,
  intelligence: 30,
  selo: 35,
  elementLevels: {
    Futon: 8,
    Katon: 3,
  },
  jutsus: {
    'Futon: Rasenshuriken': 15,
    'Katon: Gōkakyū no Jutsu': 5,
  },
  currentHealth: 850, // Vida atual
};

// ========================================
// EXEMPLO 2: Validar Fighter
// ========================================
const errors = validateFighter(naruto);
if (errors.length > 0) {
  console.log('❌ Erros encontrados no fighter:');
  errors.forEach(err => console.log(`  - ${err.field}: ${err.message}`));
} else {
  console.log('✅ Fighter válido!');
}

// ========================================
// EXEMPLO 3: Calcular Stats Dinâmicos
// ========================================
const narutoStats = calculateDynamicStats(naruto, EQUIPMENT_DATA);
console.log('\n📊 Stats do Naruto:');
console.log(`  HP Máximo: ${narutoStats.maxHealth}`);
console.log(`  Chakra Máximo: ${narutoStats.maxChakra}`);
console.log(`  Taijutsu Final: ${narutoStats.finalTaijutsu}`);
console.log(`  Ninjutsu Final: ${narutoStats.finalNinjutsu}`);

// ========================================
// EXEMPLO 4: Equipar Itens
// ========================================
const colete = EQUIPMENT_DATA.find(eq => eq.id === 'colete-chunin')!;
const canEquip = canEquipItem(naruto, colete);

if (canEquip.canEquip) {
  const narutoEquipado = equipItem(naruto, colete);
  console.log(`\n🎽 ${naruto.name} equipou ${colete.name}`);
  
  // Recalcular stats com equipamento
  const newStats = calculateDynamicStats(narutoEquipado, EQUIPMENT_DATA);
  console.log(`  HP Máximo (com equipamento): ${newStats.maxHealth}`);
} else {
  console.log(`\n❌ Não pode equipar: ${canEquip.reason}`);
}

// ========================================
// EXEMPLO 5: Ativar Selo Amaldiçoado
// ========================================
const sasuke: Fighter = {
  name: 'Sasuke Uchiha',
  level: 30,
  vitality: 45,
  taijutsu: 50,
  ninjutsu: 55,
  genjutsu: 40,
  intelligence: 45,
  selo: 40,
  elementLevels: {
    Katon: 9,
    Raiton: 8,
  },
  jutsus: {
    'Katon: Gōryūka no Jutsu': 18,
    'Raiton: Kirin': 20,
  },
  cursedSeal: {
    level: 2,
    isActive: false,
    cooldownUntil: null,
  },
  currentHealth: 700,
};

const sasukeStats = calculateDynamicStats(sasuke, EQUIPMENT_DATA);
const canActivateSeal = validateCursedSealActivation(sasuke, sasukeStats.maxHealth);

if (canActivateSeal.success) {
  console.log(`\n⚡ ${sasuke.name} ativou o Selo Amaldiçoado!`);
  
  // Ativar o selo
  sasuke.cursedSeal!.isActive = true;
  sasuke.cursedSeal!.activationTime = Date.now();
  
  // Recalcular stats com selo ativo
  const statsComSelo = calculateDynamicStats(sasuke, EQUIPMENT_DATA);
  console.log(`  Ninjutsu SEM selo: ${sasukeStats.finalNinjutsu.toFixed(0)}`);
  console.log(`  Ninjutsu COM selo: ${statsComSelo.finalNinjutsu.toFixed(0)}`);
  console.log(`  HP Máximo SEM selo: ${sasukeStats.maxHealth.toFixed(0)}`);
  console.log(`  HP Máximo COM selo: ${statsComSelo.maxHealth.toFixed(0)}`);
  
  // Desativar e definir cooldown
  sasuke.cursedSeal!.isActive = false;
  sasuke.cursedSeal!.cooldownUntil = calculateCursedSealCooldown(2);
} else {
  console.log(`\n❌ ${canActivateSeal.message}`);
  canActivateSeal.errors?.forEach(err => console.log(`  - ${err.message}`));
}

// ========================================
// EXEMPLO 6: Ativar e Evoluir Dōjutsu
// ========================================
const sasukeComSharingan: Fighter = {
  ...sasuke,
  doujutsu: {
    type: 'Sharingan',
    stage: 1,
    isActive: false,
    cooldownUntil: null,
  },
};

// Ativar Sharingan
const canActivateDoujutsu = validateDoujutsuActivation(sasukeComSharingan);
if (canActivateDoujutsu.success) {
  console.log(`\n👁️ ${sasuke.name} ativou o Sharingan!`);
  sasukeComSharingan.doujutsu!.isActive = true;
  
  const statsComSharingan = calculateDynamicStats(sasukeComSharingan, EQUIPMENT_DATA);
  console.log(`  Ninjutsu com Sharingan: ${statsComSharingan.finalNinjutsu.toFixed(0)}`);
}

// Verificar se pode evoluir
const evolutionCheck = canEvolveDoujutsu(sasukeComSharingan);
if (evolutionCheck.canEvolve) {
  console.log(`\n🔄 ${sasuke.name} pode evoluir para ${evolutionCheck.nextDoujutsu}!`);
  const sasukeEvoluido = evolveDoujutsu(sasukeComSharingan);
  console.log(`  Dōjutsu evoluído: ${sasukeEvoluido.doujutsu?.type}`);
} else {
  console.log(`\n⏸️ ${evolutionCheck.reason}`);
}

// ========================================
// EXEMPLO 7: Calcular Dano em Batalha
// ========================================
console.log('\n⚔️ BATALHA: Naruto vs Sasuke');

// Ataque 1: Naruto usa Ninjutsu (Rasenshuriken)
const ataque1 = calculateDamage(naruto, sasuke, 'ninjutsu', {
  preferredElement: 'Futon',
  preferredJutsu: 'Futon: Rasenshuriken',
  equipmentData: EQUIPMENT_DATA,
  isBoss: false,
});

console.log(`\n${naruto.name} ${ataque1.log}`);
if (ataque1.elementUsed) console.log(`  Elemento: ${ataque1.elementUsed}`);
if (ataque1.isCritical) console.log(`  🔥 ACERTO CRÍTICO!`);

// Ataque 2: Sasuke usa Taijutsu
const ataque2 = calculateDamage(sasuke, naruto, 'taijutsu', {
  equipmentData: EQUIPMENT_DATA,
});

console.log(`\n${sasuke.name} ${ataque2.log}`);

// Ataque 3: Sasuke usa Kirin
const ataque3 = calculateDamage(sasuke, naruto, 'ninjutsu', {
  preferredElement: 'Raiton',
  preferredJutsu: 'Raiton: Kirin',
  equipmentData: EQUIPMENT_DATA,
});

console.log(`\n${sasuke.name} ${ataque3.log}`);

// ========================================
// EXEMPLO 8: Batalha contra Boss
// ========================================
const madara: Fighter = {
  name: 'Madara Uchiha',
  level: 99,
  vitality: 200,
  taijutsu: 150,
  ninjutsu: 180,
  genjutsu: 160,
  intelligence: 170,
  selo: 150,
  elementLevels: {
    Katon: 10,
    Futon: 10,
    Raiton: 10,
    Doton: 10,
    Suiton: 10,
  },
  jutsus: {
    'Katon: Gōkakyū no Jutsu': 25,
  },
  doujutsu: {
    type: 'Rinnegan',
    stage: 1,
    isActive: true,
  },
  currentHealth: 5000,
};

console.log('\n⚔️ BATALHA CONTRA BOSS: Naruto vs Madara');

const ataqueBoss = calculateDamage(naruto, madara, 'ninjutsu', {
  preferredElement: 'Futon',
  preferredJutsu: 'Futon: Rasenshuriken',
  equipmentData: EQUIPMENT_DATA,
  isBoss: true, // SEM limite de 35% de dano!
});

console.log(`\n${naruto.name} ${ataqueBoss.log}`);
console.log(`  💀 Dano causado no Boss: ${ataqueBoss.damage.toFixed(0)}`);

// ========================================
// EXEMPLO 9: Verificar Cooldown
// ========================================
console.log('\n⏱️ SISTEMA DE COOLDOWN');

// Simular que o selo foi usado há 2 minutos
const doisMinutosAtras = Date.now() - (2 * 60 * 1000);
const sasukeComCooldown: Fighter = {
  ...sasuke,
  cursedSeal: {
    level: 2,
    isActive: false,
    cooldownUntil: doisMinutosAtras + (10 * 60 * 1000), // 10 min total
  },
};

const cooldownCheck = validateCursedSealActivation(
  sasukeComCooldown,
  calculateDynamicStats(sasukeComCooldown).maxHealth
);

if (!cooldownCheck.success) {
  console.log(`❌ ${cooldownCheck.message}`);
}

// ========================================
// EXEMPLO 10: Verificar Vida Mínima
// ========================================
console.log('\n💔 VERIFICAR VIDA MÍNIMA PARA SELO');

const sasukeComPoucaVida: Fighter = {
  ...sasuke,
  currentHealth: 200, // Apenas 200 HP de 800+ HP máximo
  cursedSeal: {
    level: 2,
    isActive: false,
    cooldownUntil: null,
  },
};

const statsVidaBaixa = calculateDynamicStats(sasukeComPoucaVida);
const healthCheck = validateCursedSealActivation(sasukeComPoucaVida, statsVidaBaixa.maxHealth);

if (!healthCheck.success) {
  console.log(`❌ ${healthCheck.message}`);
  healthCheck.errors?.forEach(err => console.log(`  - ${err.message}`));
}

console.log('\n✅ Todos os exemplos executados com sucesso!');