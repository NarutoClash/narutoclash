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
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/tonton.png',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 5, vitalidade: 1, inteligencia: 2 },
        requiredLevel: 1,
        price: 100,
        trainableStats: ['selo', 'vitalidade', 'inteligencia'],
    },
    {
        id: 'akamaru',
        name: 'Akamaru',
        description: 'O fiel companheiro canino de Kiba Inuzuka. Um parceiro de combate que cresce e fica mais forte junto com seu dono.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/akamaru.png',
        buffs: { taijutsu: 5, ninjutsu: 0, genjutsu: 0, selo: 2, vitalidade: 5, inteligencia: 0 },
        requiredLevel: 5,
        price: 500,
        trainableStats: ['taijutsu', 'selo', 'vitalidade'],
    },
    {
        id: 'pakkun',
        name: 'Pakkun',
        description: 'O líder dos Ninken de Kakashi. Um rastreador excepcional com um olfato que supera o de qualquer humano.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/pakkun.png',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 10, vitalidade: 0, inteligencia: 10 },
        requiredLevel: 10,
        price: 1500,
        trainableStats: ['selo', 'inteligencia'],
    },
    {
        id: 'ninkame',
        name: 'Ninkame',
        description: 'A tartaruga ninja pessoal de Might Guy. Sábia e defensiva, pode se transformar em um escudo resistente.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/ninkame.png',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 0, vitalidade: 20, inteligencia: 5 },
        requiredLevel: 15,
        price: 2000,
        trainableStats: ['vitalidade', 'inteligencia'],
    },
    {
        id: 'ninken',
        name: 'Ninken (8 Cães Ninjas)',
        description: 'A matilha de cães ninja de Kakashi. Juntos, eles são uma força formidável de rastreamento e combate.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Ninken__8_Caes_Ninjas.png',
        buffs: { taijutsu: 15, ninjutsu: 0, genjutsu: 0, selo: 15, vitalidade: 10, inteligencia: 10 },
        requiredLevel: 20,
        price: 5000,
        trainableStats: ['taijutsu', 'selo', 'vitalidade', 'inteligencia'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'gamakichi',
        name: 'Gamakichi',
        description: 'O filho de Gamabunta. Inicialmente pequeno, cresce para se tornar um sapo guerreiro poderoso e confiável.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Gamakichi%20.png',
        buffs: { taijutsu: 10, ninjutsu: 10, genjutsu: 0, selo: 0, vitalidade: 15, inteligencia: 5 },
        requiredLevel: 25,
        price: 7500,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
    },
    {
        id: 'kyodaija',
        name: 'Kyodaija (Aoda)',
        description: 'Uma cobra gigante invocada por Sasuke. Rápida e letal, ideal para ataques surpresa e constrição.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Aoda.png',
        buffs: { taijutsu: 20, ninjutsu: 0, genjutsu: 5, selo: 25, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 30,
        price: 10000,
        trainableStats: ['taijutsu', 'genjutsu', 'selo'],
    },
    {
        id: 'enma',
        name: 'Rei Macaco: Enma',
        description: 'A poderosa invocação de Hiruzen Sarutobi. Pode se transformar no Bastão Indestrutível, uma arma de taijutsu suprema.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Rei_Macaco_Enma.png',
        buffs: { taijutsu: 35, ninjutsu: 0, genjutsu: 0, selo: 0, vitalidade: 20, inteligencia: 15 },
        requiredLevel: 35,
        price: 15000,
        trainableStats: ['taijutsu', 'vitalidade', 'inteligencia'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'manda',
        name: 'Manda',
        description: 'A serpente mais poderosa, anteriormente invocada por Orochimaru. Arrogante e mortal, exige sacrifícios em troca de seu poder.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/manda.png',
        buffs: { taijutsu: 30, ninjutsu: 20, genjutsu: 10, selo: 10, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 40,
        price: 20000,
        trainableStats: ['taijutsu', 'ninjutsu', 'genjutsu', 'selo'],
    },
    {
        id: 'katsuyu',
        name: 'Katsuyu',
        description: 'A rainha das lesmas, invocada por Tsunade. Pode se dividir e transferir chakra, curando múltiplos aliados simultaneamente.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Katsuyu.png',
        buffs: { taijutsu: 0, ninjutsu: 20, genjutsu: 0, selo: 0, vitalidade: 50, inteligencia: 20 },
        requiredLevel: 45,
        price: 25000,
        trainableStats: ['ninjutsu', 'vitalidade', 'inteligencia'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'gamabunta',
        name: 'Gamabunta',
        description: 'O Chefe dos Sapos do Monte Myōboku. Um guerreiro imenso e habilidoso com sua tantō, mas também um pouco rabugento.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Gamabunta.png',
        buffs: { taijutsu: 40, ninjutsu: 20, genjutsu: 0, selo: 0, vitalidade: 35, inteligencia: 10 },
        requiredLevel: 50,
        price: 30000,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'baku',
        name: 'Baku',
        description: 'Uma criatura gigantesca que se assemelha a uma quimera, invocada por Danzō. Tem o poder de sugar qualquer coisa para dentro de si.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Baku.png',
        buffs: { taijutsu: 0, ninjutsu: 50, genjutsu: 0, selo: -10, vitalidade: 40, inteligencia: 0 },
        requiredLevel: 55,
        price: 35000,
        trainableStats: ['ninjutsu', 'vitalidade'],
    },
    {
        id: 'fukasaku',
        name: 'Fukasaku & Shima',
        description: 'Os Dois Grandes Sábios Sapos. Mestres do senjutsu, eles podem fundir-se ao invocador para reunir energia natural e executar genjutsus poderosos.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Fukasaku___Shima.png',
        buffs: { taijutsu: 10, ninjutsu: 30, genjutsu: 50, selo: 0, vitalidade: 0, inteligencia: 30 },
        requiredLevel: 60,
        price: 40000,
        trainableStats: ['ninjutsu', 'genjutsu', 'inteligencia'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'shukaku',
        name: 'Shukaku (Ichibi)',
        description: 'A Besta de Uma Cauda. Um tanuki gigante feito de areia, com uma defesa absoluta e poder sobre o vento e magnetismo.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/shukaku.png',
        buffs: { taijutsu: 0, ninjutsu: 60, genjutsu: 0, selo: 0, vitalidade: 50, inteligencia: 0 },
        requiredLevel: 65,
        price: 50000,
        trainableStats: ['ninjutsu', 'vitalidade'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'matatabi',
        name: 'Matatabi (Nibi)',
        description: 'A Besta de Duas Caudas. Um gato monstruoso envolto em chamas azuis, mestre do Katon em sua forma mais destrutiva.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/matatabi.png',
        buffs: { taijutsu: 0, ninjutsu: 70, genjutsu: 0, selo: 20, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 68,
        price: 55000,
        trainableStats: ['ninjutsu', 'selo'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'isobu',
        name: 'Isobu (Sanbi)',
        description: 'A Besta de Três Caudas. Uma tartaruga gigante com uma carapaça quase impenetrável, capaz de criar corais e ilusões aquáticas.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Isobu.png',
        buffs: { taijutsu: 0, ninjutsu: 30, genjutsu: 30, selo: 0, vitalidade: 80, inteligencia: 0 },
        requiredLevel: 71,
        price: 60000,
        trainableStats: ['ninjutsu', 'genjutsu', 'vitalidade'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'son-goku',
        name: 'Son Gokū (Yonbi)',
        description: 'A Besta de Quatro Caudas. Um gorila de pelo vermelho que domina o Yōton, a Liberação de Lava.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/son_goku.png',
        buffs: { taijutsu: 70, ninjutsu: 40, genjutsu: 0, selo: 0, vitalidade: 30, inteligencia: 0 },
        requiredLevel: 74,
        price: 65000,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'kokuo',
        name: 'Kokuō (Gobi)',
        description: 'A Besta de Cinco Caudas. Uma mistura de golfinho e cavalo, mestre da Liberação de Fervura, combinando Suiton e Katon.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Kokuo.png',
        buffs: { taijutsu: 0, ninjutsu: 80, genjutsu: 0, selo: 20, vitalidade: 0, inteligencia: 10 },
        requiredLevel: 77,
        price: 70000,
        trainableStats: ['ninjutsu', 'selo', 'inteligencia'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'saiken',
        name: 'Saiken (Rokubi)',
        description: 'A Besta de Seis Caudas. Uma lesma gigante que pode expelir substâncias corrosivas e alcalinas.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/saiken.png',
        buffs: { taijutsu: 0, ninjutsu: 60, genjutsu: 0, selo: 0, vitalidade: 60, inteligencia: 0 },
        requiredLevel: 80,
        price: 75000,
        trainableStats: ['ninjutsu', 'vitalidade'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'chomei',
        name: 'Chōmei (Nanabi)',
        description: 'A Besta de Sete Caudas. Um besouro-rinoceronte gigante com seis asas, que pode voar e usar pós que cegam e criam ilusões.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Chomei.png',
        buffs: { taijutsu: 20, ninjutsu: 0, genjutsu: 40, selo: 50, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 83,
        price: 80000,
        trainableStats: ['taijutsu', 'genjutsu', 'selo'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'gyuki',
        name: 'Gyūki (Hachibi)',
        description: 'A Besta de Oito Caudas. Um Ushi-oni, mistura de touro e polvo, com imensa força física e a capacidade de disparar Bijuudamas.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Gyuki.png',
        buffs: { taijutsu: 80, ninjutsu: 50, genjutsu: 0, selo: 0, vitalidade: 40, inteligencia: 0 },
        requiredLevel: 86,
        price: 85000,
        trainableStats: ['taijutsu', 'ninjutsu', 'vitalidade'],
        
    },
    {
        id: 'kurama',
        name: 'Kurama (Kyūbi)',
        description: 'A Besta de Nove Caudas. Uma raposa de poder colossal, símbolo de destruição, mas também de uma imensa força vital e de chakra.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/kurama.png',
        buffs: { taijutsu: 0, ninjutsu: 100, genjutsu: 0, selo: 0, vitalidade: 100, inteligencia: 0 },
        requiredLevel: 90,
        price: 90000,
        trainableStats: ['ninjutsu', 'vitalidade'],
        isPremium: true, // 🆕 PREMIUM
    },
    {
        id: 'juubi',
        name: 'Jūbi',
        description: 'A Besta de Dez Caudas. A personificação do início e do fim, uma entidade de poder divino e incompreensível, progenitor de todo o chakra.',
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Animais/Jubi.png',
        buffs: { taijutsu: 100, ninjutsu: 100, genjutsu: 100, selo: 100, vitalidade: 100, inteligencia: 100 },
        requiredLevel: 100,
        price: 1000000,
        trainableStats: ['taijutsu', 'ninjutsu', 'genjutsu', 'selo', 'vitalidade', 'inteligencia'],
        isPremium: true, // 🆕 PREMIUM
    }
];

// ✅ Função para calcular custo de treinamento
export const getTrainingCost = (currentLevel: number): number => {
    return 500 * currentLevel;
};

// ✅ Constantes
export const MAX_SUMMON_LEVEL = 10;
export const TRAINING_BONUS_PER_LEVEL = 2;