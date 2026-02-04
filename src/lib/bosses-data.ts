export type BossData = {
  id: string;
  name: string;
  description: string;
  totalHealth: number;
  bossLevel: number;
  imageUrl: string;
};

export const bossesData: BossData[] = [
  // ========================================
  // TIER 1: BOSSES FRACOS (Nível 92-94)
  // HP: 2M | Multiplicador: x9-10
  // ========================================
  {
    id: 'zetsu',
    name: 'Zetsu',
    description: 'O espião da Akatsuki. Capaz de se fundir com o ambiente e criar clones, ele é um mestre da infiltração e da enganação.',
    totalHealth: 2000000,
    bossLevel: 92,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/zetsu.png',
  },
  {
    id: 'hidan',
    name: 'Hidan',
    description: 'O imortal seguidor de Jashin. Qualquer dano que ele recebe é transferido para sua vítima através de um ritual de maldição.',
    totalHealth: 2000000,
    bossLevel: 94,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/hidan.png',
  },

  // ========================================
  // TIER 2: BOSSES MÉDIOS (Nível 95-97)
  // HP: 3M | Multiplicador: x9-10
  // ========================================
  {
    id: 'konan',
    name: 'Konan',
    description: 'O "Anjo de Deus" da Akatsuki. Ela pode transformar seu corpo em incontáveis folhas de papel, criando ataques e defesas mortais.',
    totalHealth: 3000000,
    bossLevel: 95,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/konan.png',
  },
  {
    id: 'deidara',
    name: 'Deidara',
    description: 'O artista terrorista da Akatsuki. Sua argila explosiva toma várias formas, e sua arte final é uma explosão catastrófica.',
    totalHealth: 3000000,
    bossLevel: 96,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/deidara.png',
  },
  {
    id: 'sasori',
    name: 'Sasori da Areia Vermelha',
    description: 'Um mestre de marionetes que transformou a si mesmo em uma. Ele comanda centenas de marionetes humanas, cada uma com suas próprias técnicas.',
    totalHealth: 3000000,
    bossLevel: 96,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/sasori.png',
  },
  {
    id: 'kisame',
    name: 'Kisame Hoshigaki',
    description: 'A "Besta sem Cauda". Com sua espada Samehada, ele pode absorver chakra e fundir-se a ela, tornando-se um tubarão humano.',
    totalHealth: 3000000,
    bossLevel: 97,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/kisame.png',
  },
  {
    id: 'tsunade',
    name: 'Tsunade (Quinta Hokage)',
    description: 'Uma dos Sannin Lendários e a maior ninja médica do mundo. Sua força sobre-humana e a técnica de regeneração Byakugou a tornam uma oponente formidável.',
    totalHealth: 3000000,
    bossLevel: 97,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/tsunade.png',
  },
  {
    id: 'mei',
    name: 'Mei Terumī (Quinta Mizukage)',
    description: 'Mestra de duas Kekkei Genkai, Estilo Lava e Estilo Fervura, capaz de derreter qualquer defesa e preencher o campo de batalha com uma névoa ácida.',
    totalHealth: 3000000,
    bossLevel: 97,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/Mei_Terumi.png',
  },

  // ========================================
  // TIER 3: BOSSES FORTES (Nível 98-99)
  // HP: 4M | Multiplicador: x9-10
  // ========================================
  {
    id: 'onoki',
    name: 'Ōnoki (Terceiro Tsuchikage)',
    description: 'O mestre do Estilo Poeira, uma Kekkei Tōta que lhe permite desintegrar qualquer coisa a nível molecular.',
    totalHealth: 4000000,
    bossLevel: 98,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/onoki.png',
  },
  {
    id: 'hiruzen',
    name: 'Hiruzen Sarutobi (Terceiro Hokage)',
    description: 'Conhecido como "O Professor", ele dominou todos os jutsus de Konoha e pode invocar o Rei Macaco Enma.',
    totalHealth: 4000000,
    bossLevel: 98,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/hiruzen.png',
  },
  {
    id: 'gaara',
    name: 'Gaara (Quinto Kazekage)',
    description: 'Ex-jinchuuriki do Shukaku, Gaara comanda a areia com uma vontade de ferro, criando defesas absolutas e ataques esmagadores.',
    totalHealth: 4000000,
    bossLevel: 98,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/gaara.png',
  },
  {
    id: 'kakuzu',
    name: 'Kakuzu',
    description: 'O tesoureiro da Akatsuki. Ele possui cinco corações e pode usar jutsus dos cinco elementos, tornando-o quase imortal.',
    totalHealth: 4000000,
    bossLevel: 98,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/kakuzu.png',
  },
  {
    id: 'ay_fourth',
    name: 'A (Quarto Raikage)',
    description: 'Um shinobi de força e velocidade brutais, envolto em uma armadura de chakra de raio que o torna quase invulnerável.',
    totalHealth: 4000000,
    bossLevel: 98,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/ay_fourth.png',
  },
  {
    id: 'itachi',
    name: 'Itachi Uchiha',
    description: 'Um prodígio do clã Uchiha, mestre do Sharingan e de genjutsus aterrorizantes como o Tsukuyomi e chamas negras do Amaterasu.',
    totalHealth: 4000000,
    bossLevel: 99,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/itachi.png',
  },
  {
    id: 'tobirama',
    name: 'Tobirama Senju (Segundo Hokage)',
    description: 'Criador de inúmeros jutsus proibidos, incluindo o Hiraishin e o Edo Tensei. Um mestre do Estilo Água incomparável.',
    totalHealth: 4000000,
    bossLevel: 99,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/tobirama.png',
  },
  {
    id: 'mu',
    name: 'Mū (Segundo Tsuchikage)',
    description: 'O "Não-Humano". Usuário do Estilo Poeira como seu sucessor, ele também pode se tornar completamente invisível e indetectável.',
    totalHealth: 4000000,
    bossLevel: 99,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/mu.png',
  },

  // ========================================
  // TIER 4: BOSSES ELITE (Nível 100)
  // HP: 4.5M-5M | Multiplicador: x10
  // ========================================
  {
    id: 'pain',
    name: 'Pain (Caminho Deva)',
    description: 'O líder da Akatsuki e portador do Rinnegan. Seus poderes divinos podem repelir qualquer ataque e atrair a destruição.',
    totalHealth: 4500000,
    bossLevel: 100,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/pain_deva.png',
  },
  {
    id: 'obito_akatsuki',
    name: 'Tobi (Obito Uchiha)',
    description: 'O verdadeiro líder da Akatsuki, manipulando os eventos das sombras. Com o Kamui, ele pode se tornar intangível e teleportar.',
    totalHealth: 4500000,
    bossLevel: 100,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/Tobi__Obito_Uchiha.png',
  },
  {
    id: 'minato',
    name: 'Minato Namikaze (Quarto Hokage)',
    description: 'O Relâmpago Amarelo de Konoha. Usando o Hiraishin no Jutsu, ele se move em velocidades instantâneas, tornando-o o ninja mais rápido de sua era.',
    totalHealth: 4500000,
    bossLevel: 100,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/minato.png',
  },
  {
    id: 'madara_juubi',
    name: 'Madara Uchiha (Jinchūriki do Dez-Caudas)',
    description: 'O lendário Uchiha em sua forma mais poderosa, controlando o poder do Dez-Caudas e buscando aprisionar o mundo em uma ilusão eterna.',
    totalHealth: 5000000,
    bossLevel: 100,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/Madara_Uchiha__Jinchuriki_do_Dez-Caudas.png',
  },
  {
    id: 'hashirama',
    name: 'Hashirama Senju (Primeiro Hokage)',
    description: 'O Deus dos Shinobi. Fundador de Konoha e mestre do Estilo Madeira, capaz de criar florestas e subjugar Bestas com Cauda.',
    totalHealth: 5000000,
    bossLevel: 100,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/Hashirama_Senju__Primeiro_Hokage.png',
  },

  // ========================================
  // TIER 5: BOSS DEUS (Nível 100)
  // HP: 5.5M | Multiplicador: x10
  // ========================================
  {
    id: 'kaguya',
    name: 'Kaguya Ōtsutsuki',
    description: 'A deusa ancestral do chakra. Um ser de poder imensurável que ameaça a própria existência do mundo shinobi.',
    totalHealth: 5500000,
    bossLevel: 100,
    imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/bosses/Kaguya_Otsutsuki.png',
  },
];