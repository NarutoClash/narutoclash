// ✅ CRIAR ESTE ARQUIVO NOVO

export const calculateWarPointsBonus = (warPoints: number): number => {
    // Se tiver pontos negativos ou zero, não dá bônus
    if (warPoints <= 0) {
      return 0;
    }
    
    // Limite máximo de 1000 pontos
    const cappedPoints = Math.min(warPoints, 1000);
    
    // Fórmula: √pontos × 2 (arredondado para baixo)
    const bonus = Math.floor(Math.sqrt(cappedPoints) * 2);
    
    return bonus; // Máximo de 63 quando warPoints = 1000
  };