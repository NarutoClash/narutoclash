export type Summon = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    buffs: {
        taijutsu: number;
        ninjutsu: number;
        genjutsu: number;
        selo: number;
        vitalidade: number;
        inteligencia: number;
    };
    requiredLevel: number;
    price: number;
    trainableStats: string[];
    isPremium?: boolean; // 🆕 NOVO CAMPO OPCIONAL
};

export const summonsData: Summon[] = [
    {
        id: 'ton-ton',
        name: 'Tonton',
        description: 'A porquinha de estimação de Tsunade e Shizune. Apesar de pequena, tem um olfato apurado.',
        imageUrl: 'https://i.ibb.co/Zz5hpX5D/tonton.png',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 5, vitalidade: 1, inteligencia: 2 },
        requiredLevel: 1,
        price: 100,
        trainableStats: ['selo', 'vitalidade', 'inteligencia'],
    },
    {
        id: 'akamaru',
        name: 'Akamaru',
        description: 'O fiel companheiro canino de Kiba Inuzuka.',
        imageUrl: 'https://i.ibb.co/7xskt10S/akamaru.png',
        buffs: { taijutsu: 5, ninjutsu: 0, genjutsu: 0, selo: 2, vitalidade: 5, inteligencia: 0 },
        requiredLevel: 5,
        price: 500,
        trainableStats: ['taijutsu', 'selo', 'vitalidade'],
    },
    {
        id: 'pakkun',
        name: 'Pakkun',
        description: 'O líder dos Ninken de Kakashi.',
        imageUrl: 'https://i.ibb.co/fdgChM9c/pakkun.png',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 10, vitalidade: 0, inteligencia: 10 },
        requiredLevel: 10,
        price: 1500,
        trainableStats: ['selo', 'inteligencia'],
    },
    {
        id: 'ninkame',
        name: 'Ninkame',
        description: 'A tartaruga ninja pessoal de Might Guy.',
        imageUrl: 'https://i.ibb.co/WpFNXRsM/ninkame.png',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 0, vitalidade: 20, inteligencia: 5 },
        requiredLevel: 15,
        price: 2000,
        trainableStats: ['vitalidade', 'inteligencia'],
    },
    {
        id: 'ninken',
        name: 'Ninken (8 Cães Ninjas)',
        description: 'A matilha de cães ninja de Kakashi.',
        imageUrl: 'https://i.ibb.co/mFNnx2fG/Ninken-8-Caes-Ninjas.png',
        buffs: { taijutsu: 15, ninjutsu: 0, genjutsu: 0, selo: 15, vitalidade: 10, inteligencia: 10 },
        requiredLevel: 20,
        price: 5000,
        trainableStats: ['taijutsu', 'selo', 'vitalidade', 'inteligencia'],
        isPremium: true,
    },
    {
        id: 'gamakichi',
        name: 'Gamakichi',
        description: 'O filho de Gamabunta.',
        imageUrl: 'https://i.ibb.co/rRBzXrfV/Gamakichi.png',
        buffs: { taijutsu: 10, ninjutsu: 10, genjutsu: 0, selo: 0, vitalidade: 15, inteligencia: 5 },
        requiredLevel: 25,
        price: 7500,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
    },
    {
        id: 'kyodaija',
        name: 'Kyodaija (Aoda)',
        description: 'Uma cobra gigante invocada por Sasuke.',
        imageUrl: 'https://i.ibb.co/fd44K2Qb/Aoda.png',
        buffs: { taijutsu: 20, ninjutsu: 0, genjutsu: 5, selo: 25, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 30,
        price: 10000,
        trainableStats: ['taijutsu', 'genjutsu', 'selo'],
    },
    {
        id: 'enma',
        name: 'Rei Macaco: Enma',
        description: 'A poderosa invocação de Hiruzen Sarutobi.',
        imageUrl: 'https://i.ibb.co/m5syzZmn/Rei-Macaco-Enma.png',
        buffs: { taijutsu: 35, ninjutsu: 0, genjutsu: 0, selo: 0, vitalidade: 20, inteligencia: 15 },
        requiredLevel: 35,
        price: 15000,
        trainableStats: ['taijutsu', 'vitalidade', 'inteligencia'],
        isPremium: true,
    },
    {
        id: 'manda',
        name: 'Manda',
        description: 'A serpente mais poderosa.',
        imageUrl: 'https://i.ibb.co/S7v2N2nY/manda.png',
        buffs: { taijutsu: 30, ninjutsu: 20, genjutsu: 10, selo: 10, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 40,
        price: 20000,
        trainableStats: ['taijutsu', 'ninjutsu', 'genjutsu', 'selo'],
    },
    {
        id: 'katsuyu',
        name: 'Katsuyu',
        description: 'A rainha das lesmas.',
        imageUrl: 'https://i.ibb.co/zhqnH9x3/Katsuyu.png',
        buffs: { taijutsu: 0, ninjutsu: 20, genjutsu: 0, selo: 0, vitalidade: 50, inteligencia: 20 },
        requiredLevel: 45,
        price: 25000,
        trainableStats: ['ninjutsu', 'vitalidade', 'inteligencia'],
        isPremium: true,
    },
    {
        id: 'gamabunta',
        name: 'Gamabunta',
        description: 'O Chefe dos Sapos.',
        imageUrl: 'https://i.ibb.co/s9k8SZ7v/Gamabunta.png',
        buffs: { taijutsu: 40, ninjutsu: 20, genjutsu: 0, selo: 0, vitalidade: 35, inteligencia: 10 },
        requiredLevel: 50,
        price: 30000,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
        isPremium: true,
    },
    {
        id: 'baku',
        name: 'Baku',
        description: 'Criatura invocada por Danzō.',
        imageUrl: 'https://i.ibb.co/ZpbwCpwn/Baku.png',
        buffs: { taijutsu: 0, ninjutsu: 50, genjutsu: 0, selo: -10, vitalidade: 40, inteligencia: 0 },
        requiredLevel: 55,
        price: 35000,
        trainableStats: ['ninjutsu', 'vitalidade'],
    },
    {
        id: 'fukasaku',
        name: 'Fukasaku & Shima',
        description: 'Os Dois Grandes Sábios Sapos.',
        imageUrl: 'https://i.ibb.co/LXmS2m0F/Fukasaku-Shima.png',
        buffs: { taijutsu: 10, ninjutsu: 30, genjutsu: 50, selo: 0, vitalidade: 0, inteligencia: 30 },
        requiredLevel: 60,
        price: 40000,
        trainableStats: ['ninjutsu', 'genjutsu', 'inteligencia'],
        isPremium: true,
    },
    {
        id: 'shukaku',
        name: 'Shukaku',
        description: 'A Besta de Uma Cauda.',
        imageUrl: 'https://i.ibb.co/jvqKs6FZ/shukaku.png',
        buffs: { taijutsu: 0, ninjutsu: 60, genjutsu: 0, selo: 0, vitalidade: 50, inteligencia: 0 },
        requiredLevel: 65,
        price: 50000,
        trainableStats: ['ninjutsu', 'vitalidade'],
        isPremium: true,
    },
    {
        id: 'matatabi',
        name: 'Matatabi',
        description: 'A Besta de Duas Caudas.',
        imageUrl: 'https://i.ibb.co/LdjHBTCT/matatabi.png',
        buffs: { taijutsu: 0, ninjutsu: 70, genjutsu: 0, selo: 20, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 68,
        price: 55000,
        trainableStats: ['ninjutsu', 'selo'],
        isPremium: true,
    },
    {
        id: 'isobu',
        name: 'Isobu',
        description: 'A Besta de Três Caudas.',
        imageUrl: 'https://i.ibb.co/dJHCLpbw/Isobu.png',
        buffs: { taijutsu: 0, ninjutsu: 30, genjutsu: 30, selo: 0, vitalidade: 80, inteligencia: 0 },
        requiredLevel: 71,
        price: 60000,
        trainableStats: ['ninjutsu', 'genjutsu', 'vitalidade'],
        isPremium: true,
    },
    {
        id: 'son-goku',
        name: 'Son Gokū',
        description: 'A Besta de Quatro Caudas.',
        imageUrl: 'https://i.ibb.co/4w10f1YN/son-goku.png',
        buffs: { taijutsu: 70, ninjutsu: 40, genjutsu: 0, selo: 0, vitalidade: 30, inteligencia: 0 },
        requiredLevel: 74,
        price: 65000,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
        isPremium: true,
    },
    {
        id: 'kokuo',
        name: 'Kokuō',
        description: 'A Besta de Cinco Caudas.',
        imageUrl: 'https://i.ibb.co/fdm6tJ2h/Kokuo.png',
        buffs: { taijutsu: 0, ninjutsu: 80, genjutsu: 0, selo: 20, vitalidade: 0, inteligencia: 10 },
        requiredLevel: 77,
        price: 70000,
        trainableStats: ['ninjutsu', 'selo', 'inteligencia'],
        isPremium: true,
    },
    {
        id: 'saiken',
        name: 'Saiken',
        description: 'A Besta de Seis Caudas.',
        imageUrl: 'https://i.ibb.co/3mwyyrS2/saiken.png',
        buffs: { taijutsu: 0, ninjutsu: 60, genjutsu: 0, selo: 0, vitalidade: 60, inteligencia: 0 },
        requiredLevel: 80,
        price: 75000,
        trainableStats: ['ninjutsu', 'vitalidade'],
        isPremium: true,
    },
    {
        id: 'chomei',
        name: 'Chōmei',
        description: 'A Besta de Sete Caudas.',
        imageUrl: 'https://i.ibb.co/HfK49xKt/Chomei.png',
        buffs: { taijutsu: 20, ninjutsu: 0, genjutsu: 40, selo: 50, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 83,
        price: 80000,
        trainableStats: ['taijutsu', 'genjutsu', 'selo'],
        isPremium: true,
    },
    {
        id: 'gyuki',
        name: 'Gyūki',
        description: 'A Besta de Oito Caudas.',
        imageUrl: 'https://i.ibb.co/d4gKMD18/Gyuki.png',
        buffs: { taijutsu: 80, ninjutsu: 50, genjutsu: 0, selo: 0, vitalidade: 40, inteligencia: 0 },
        requiredLevel: 86,
        price: 85000,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
    },
    {
        id: 'kurama',
        name: 'Kurama',
        description: 'A Besta de Nove Caudas.',
        imageUrl: 'https://i.ibb.co/pBCPJnjg/kurama.png',
        buffs: { taijutsu: 0, ninjutsu: 100, genjutsu: 0, selo: 0, vitalidade: 100, inteligencia: 0 },
        requiredLevel: 90,
        price: 90000,
        trainableStats: ['ninjutsu', 'vitalidade'],
        isPremium: true,
    },
    {
        id: 'juubi',
        name: 'Jūbi',
        description: 'A Besta de Dez Caudas.',
        imageUrl: 'https://i.ibb.co/NgjX895C/Jubi.png',
        buffs: { taijutsu: 100, ninjutsu: 100, genjutsu: 100, selo: 100, vitalidade: 100, inteligencia: 100 },
        requiredLevel: 100,
        price: 1000000,
        trainableStats: ['taijutsu', 'ninjutsu', 'genjutsu', 'selo', 'vitalidade', 'inteligencia'],
        isPremium: true,
    }
];


// ✅ Função para calcular custo de treinamento
export const getTrainingCost = (currentLevel: number): number => {
    return 500 * currentLevel;
};

// ✅ Constantes
export const MAX_SUMMON_LEVEL = 10;
export const TRAINING_BONUS_PER_LEVEL = 2;