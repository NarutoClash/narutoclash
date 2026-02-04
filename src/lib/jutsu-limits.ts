import { allJutsus } from '@/lib/missions-data';

export const MAX_JUTSUS_FREE = 3;
export const MAX_JUTSUS_PREMIUM = 5;

export const getMaxJutsusPerElement = (isPremium: boolean): number => {
  return isPremium ? MAX_JUTSUS_PREMIUM : MAX_JUTSUS_FREE;
};

export const getLockedJutsus = (
  jutsus: Record<string, number>,
  element: string,
  isPremium: boolean
): string[] => {
  if (isPremium) return [];

  const elementJutsus = Object.entries(jutsus)
    .filter(([name, level]) => {
      // Verificar se o jutsu pertence ao elemento
      const jutsuData = allJutsus.find(j => j.name === name); // ✅ Agora vai funcionar
      return jutsuData?.element === element && level > 0;
    })
    .sort(([, levelA], [, levelB]) => (levelB as number) - (levelA as number));

  // Se tem mais de 3, os excedentes ficam bloqueados
  if (elementJutsus.length > MAX_JUTSUS_FREE) {
    return elementJutsus.slice(MAX_JUTSUS_FREE).map(([name]) => name);
  }

  return [];
};