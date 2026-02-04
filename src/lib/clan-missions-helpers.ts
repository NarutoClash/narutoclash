/**
 * Funções auxiliares para o sistema de missões de clã
 */

/**
 * Verifica se as missões do clã devem ser resetadas (00:00 BRT)
 */
export function shouldResetClanMissions(lastReset: number): boolean {
  const now = new Date();
  const lastResetDate = new Date(lastReset);
  
  // Converter para BRT (UTC-3)
  const brtOffset = -3 * 60; // -3 horas em minutos
  const nowBRT = new Date(now.getTime() + (brtOffset + now.getTimezoneOffset()) * 60000);
  const lastResetBRT = new Date(lastResetDate.getTime() + (brtOffset + lastResetDate.getTimezoneOffset()) * 60000);
  
  // Se for outro dia OU se passou das 00:00 e o último reset foi antes
  return nowBRT.getDate() !== lastResetBRT.getDate() || 
         (nowBRT.getHours() === 0 && lastResetBRT.getHours() !== 0);
}

/**
 * Retorna o tempo até o próximo reset (00:00 BRT)
 */
export function getTimeUntilReset(): string {
  const now = new Date();
  
  // Converter para BRT (UTC-3)
  const brtOffset = -3 * 60;
  const nowBRT = new Date(now.getTime() + (brtOffset + now.getTimezoneOffset()) * 60000);
  
  // Calcular próximo reset (00:00 BRT)
  const nextReset = new Date(nowBRT);
  nextReset.setHours(24, 0, 0, 0); // Próximo dia às 00:00
  
  const diff = nextReset.getTime() - nowBRT.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Gera 10 missões aleatórias do pool total
 */
export function generateClanMissions(allMissionIds: string[]): {
  missions: string[];
  nextReset: number;
} {
  const shuffled = [...allMissionIds].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 10);
  
  // Próximo reset às 00:00 BRT do próximo dia
  const now = new Date();
  const brtOffset = -3 * 60;
  const nowBRT = new Date(now.getTime() + (brtOffset + now.getTimezoneOffset()) * 60000);
  const nextReset = new Date(nowBRT);
  nextReset.setHours(24, 0, 0, 0);
  
  return {
    missions: selected,
    nextReset: nextReset.getTime(),
  };
}