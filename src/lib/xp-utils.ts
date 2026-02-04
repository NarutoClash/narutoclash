
export const getLevelFromXp = (xp: number, maxLevel = 100, baseCost = 100, factor = 1.2): { level: number, xpForNext: number, currentLevelXp: number } => {
    let level = 1;
    let requiredXpForNext = baseCost;
    let totalXpForCurrentLevel = 0;

    while (level < maxLevel) {
        if (xp < requiredXpForNext) {
            break;
        }
        totalXpForCurrentLevel = requiredXpForNext;
        requiredXpForNext += Math.floor(baseCost * Math.pow(factor, level));
        level++;
    }
    
    // Adjust level back if we looped one too many times
    if(xp < totalXpForCurrentLevel && level > 1) {
       level--;
    }

    // Recalculate required XP for the actual next level
    let nextLevelXp = baseCost;
    for(let i=1; i<level; i++) {
        nextLevelXp += Math.floor(baseCost * Math.pow(factor, i));
    }


    return { level, xpForNext: nextLevelXp, currentLevelXp: totalXpForCurrentLevel };
};

export const getXpForLevel = (level: number, baseCost = 100, factor = 1.2): number => {
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
        totalXp += Math.floor(baseCost * Math.pow(factor, i-1));
    }
    return totalXp;
};
