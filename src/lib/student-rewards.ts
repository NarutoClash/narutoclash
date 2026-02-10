// ✅ RECOMPENSAS POR NÍVEL DO ALUNO
export const STUDENT_REWARDS = [
    { level: 5, ryo: 500, statPoints: 1, label: "Nível 5" },
    { level: 10, ryo: 1000, statPoints: 2, label: "Nível 10" },
    { level: 15, ryo: 1500, statPoints: 3, label: "Nível 15" },
    { level: 20, ryo: 2500, statPoints: 5, label: "Nível 20" },
    { level: 25, ryo: 3500, statPoints: 7, label: "Nível 25" },
    { level: 30, ryo: 5000, statPoints: 10, label: "Nível 30" },
    { level: 40, ryo: 7500, statPoints: 15, label: "Nível 40" },
    { level: 50, ryo: 10000, statPoints: 20, label: "Nível 50" },
    { level: 60, ryo: 15000, statPoints: 25, label: "Nível 60" },
    { level: 70, ryo: 20000, statPoints: 30, label: "Nível 70" },
    { level: 80, ryo: 25000, statPoints: 35, label: "Nível 80" },
    { level: 90, ryo: 30000, statPoints: 40, label: "Nível 90" },
    { level: 100, ryo: 50000, statPoints: 50, label: "Nível 100" },
  ];
  
  export type StudentReward = typeof STUDENT_REWARDS[number];