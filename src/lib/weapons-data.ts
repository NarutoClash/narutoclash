import type { ItemPassive } from '@/lib/battle-system/types';

export type Weapon = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    type: 'Lâmina Curta' | 'Espada Grande' | 'Ferramenta Ninja' | 'Marionete' | 'Lendária';
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
    isPremium?: boolean;
    passivas?: ItemPassive[];
};

// Organizado por poder crescente
export const weaponsData: Weapon[] = [
    // Nível Genin
    {
        id: 'senbon',
        name: 'Senbon',
        description: 'Agulhas metálicas longas e finas usadas para ataques rápidos e precisos, visando pontos de pressão. Requer grande precisão.',
        imageUrl: 'https://i.ibb.co/9kxbsnpz/senbol.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: -2, ninjutsu: 0, genjutsu: 0, selo: 8, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 1,
        price: 200,
        passivas: [
          { id: 'senbon_ponto_pressao', nome: 'Ponto de Pressão', descricao: '20% de chance ao atacar de paralisar o alvo atingindo pontos vitais.', chance: 0.20, gatilho: 'ao_atacar', efeito: 'paralisia', cor: '#facc15', emoji: '🪡' },
        ],
    },
    {
        id: 'kunai',
        name: 'Kunai Simples',
        description: 'Uma ferramenta ninja versátil, usada tanto para combate corpo a corpo quanto como projétil. Essencial para qualquer shinobi.',
        imageUrl: 'https://i.ibb.co/h1LTrHxs/kunai-simples.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: 5, ninjutsu: 0, genjutsu: -1, selo: 0, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 1,
        price: 250,
        passivas: [
          { id: 'kunai_arremesso_rapido', nome: 'Arremesso Rápido', descricao: 'Sempre que usar Taijutsu, enfraquece o alvo com a precisão do golpe.', chance: 0.3, gatilho: 'ao_usar_taijutsu', efeito: 'enfraquecer', cor: '#94a3b8', emoji: '🔪' },
        ],
    },
    {
        id: 'shuriken',
        name: 'Shuriken Simples',
        description: 'Uma estrela de arremesso afiada. Perfeita para distrair inimigos ou para ataques rápidos à distância.',
        imageUrl: 'https://i.ibb.co/yFXxHVkH/Shuriken-Simples.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: 0, ninjutsu: 0, genjutsu: 0, selo: 5, vitalidade: -1, inteligencia: 0 },
        requiredLevel: 1,
        price: 250,
        passivas: [
          { id: 'shuriken_corte_raso', nome: 'Corte Raso', descricao: '25% de chance ao atacar de aplicar veneno leve (5% HP/turno).', chance: 0.25, gatilho: 'ao_atacar', efeito: 'veneno', valor: 0.05, cor: '#a3e635', emoji: '⭐' },
        ],
    },
     {
        id: 'kunai_explosiva',
        name: 'Kunai Explosiva',
        description: 'Uma kunai com um selo explosivo anexado. Causa dano em área ao impactar.',
        imageUrl: 'https://i.ibb.co/6cZjJ7SY/Kunai-Explosiva.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: 2, ninjutsu: 8, genjutsu: 0, selo: -2, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 4,
        price: 700,
        passivas: [
          { id: 'kunai_exp_queimadura', nome: 'Detonação', descricao: '30% de chance ao atacar de causar queimadura (8% HP/turno).', chance: 0.30, gatilho: 'ao_atacar', efeito: 'queimadura', valor: 0.08, cor: '#f97316', emoji: '💥' },
        ],
    },
    {
        id: 'fuma_shuriken',
        name: 'Fūma Shuriken',
        description: 'Uma shuriken gigante e dobrável com quatro lâminas. Causa mais dano que uma shuriken comum, mas é mais lenta.',
        imageUrl: 'https://i.ibb.co/fYLd8dr3/Fuma-Shuriken.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: 12, ninjutsu: 0, genjutsu: 0, selo: -3, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 5,
        price: 800,
        passivas: [
          { id: 'fuma_forca_centrifuga', nome: 'Força Centrífuga', descricao: '20% de chance ao usar Taijutsu de o próximo ataque ignorar o cap de dano.', chance: 0.20, gatilho: 'ao_usar_taijutsu', efeito: 'ignorar_cap', cor: '#60a5fa', emoji: '🌀' },
        ],
    },
    {
        id: 'tanto',
        name: 'Tantō',
        description: 'Uma adaga curta e ágil, ideal para combates rápidos e ataques furtivos. Favorece a velocidade e a precisão.',
        imageUrl: 'https://i.ibb.co/7NgPzhQq/Tanto.png',
        type: 'Lâmina Curta',
        buffs: { taijutsu: 10, ninjutsu: 0, genjutsu: -2, selo: 10, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 8,
        price: 1200,
        passivas: [
          { id: 'tanto_lamina_precisa', nome: 'Lâmina Precisa', descricao: '25% de chance ao atacar de enfraquecer o alvo com o corte certeiro.', chance: 0.25, gatilho: 'ao_atacar', efeito: 'enfraquecer', cor: '#f43f5e', emoji: '⚡' },
          { id: 'tanto_instinto_furtivo', nome: 'Instinto Furtivo', descricao: 'Ao receber dano, 15% de chance de criar uma barreira reflexiva.', chance: 0.15, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#818cf8', emoji: '🛡️' },
        ],
    },
    // Nível Chunin
    {
        id: 'katana',
        name: 'Katana Padrão',
        description: 'Uma espada longa e curva, a arma preferida de muitos samurais e ninjas espadachins. Oferece um bom equilíbrio entre ataque e defesa.',
        imageUrl: 'https://i.ibb.co/SD0f5vMz/Katana-Padrao.png',
        type: 'Lâmina Curta',
        buffs: { taijutsu: 15, ninjutsu: 0, genjutsu: 0, selo: -2, vitalidade: 5, inteligencia: 0 },
        requiredLevel: 10,
        price: 1500,
        passivas: [
          { id: 'katana_bushido', nome: 'Código Bushido', descricao: 'Sempre que usar Taijutsu, enfraquece o alvo com a maestria do corte.', chance: 0.4, gatilho: 'ao_usar_taijutsu', efeito: 'enfraquecer', cor: '#a3e635', emoji: '⚔️' },
        ],
    },
    {
        id: 'karasu',
        name: 'Marionete: Karasu',
        description: 'Uma marionete de ataque criada por Kankurō, cheia de lâminas venenosas e mecanismos ocultos.',
        imageUrl: 'https://i.ibb.co/j9xZZZfN/Karasu.png',
        isPremium: true,
        type: 'Marionete',
        buffs: { taijutsu: -10, ninjutsu: 20, genjutsu: 0, selo: 15, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 12,
        price: 2500,
        passivas: [
          { id: 'karasu_veneno_corvo', nome: 'Veneno do Corvo', descricao: '35% de chance ao usar Ninjutsu de envenenar o alvo (8% HP/turno).', chance: 0.35, gatilho: 'ao_usar_ninjutsu', efeito: 'veneno', valor: 0.08, cor: '#84cc16', emoji: '🐦‍⬛' },
        ],
    },
    {
        id: 'leque_gigante',
        name: 'Leque Gigante',
        description: 'A arma icônica de Temari. Pode gerar rajadas de vento poderosas, amplificando jutsus Futon e repelindo inimigos.',
        imageUrl: 'https://i.ibb.co/8DVBTCYd/Leque-Gigante.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: -5, ninjutsu: 25, genjutsu: 0, selo: 0, vitalidade: 0, inteligencia: 5 },
        requiredLevel: 15,
        price: 3000,
        passivas: [
          { id: 'leque_rajada', nome: 'Rajada de Vento', descricao: 'Ao usar Ninjutsu, 30% de chance de selar o jutsu do alvo com a rajada.', chance: 0.30, gatilho: 'ao_usar_ninjutsu', efeito: 'selar_jutsu', cor: '#86efac', emoji: '💨' },
        ],
    },
    {
        id: 'aian_nakkuru',
        name: 'Lâminas de Vento (Asuma)',
        description: 'Facas de trincheira especiais que podem ser infundidas com chakra do vento para aumentar drasticamente seu poder de corte.',
        imageUrl: 'https://i.ibb.co/r2t3XFDj/Laminas-de-Vento.png',
        type: 'Lâmina Curta',
        buffs: { taijutsu: 15, ninjutsu: 15, genjutsu: 0, selo: 5, vitalidade: -5, inteligencia: 0 },
        requiredLevel: 20,
        price: 7500,
        passivas: [
          { id: 'vento_corte_selo', nome: 'Corte de Vento', descricao: 'Ao usar Taijutsu, 30% de chance de selar o ninjutsu do alvo.', chance: 0.30, gatilho: 'ao_usar_taijutsu', efeito: 'selar_jutsu', cor: '#67e8f9', emoji: '🌬️' },
          { id: 'vento_queimadura', nome: 'Lâmina Incandescente', descricao: '20% de chance ao atacar de causar queimadura (7% HP/turno).', chance: 0.20, gatilho: 'ao_atacar', efeito: 'queimadura', valor: 0.07, cor: '#fbbf24', emoji: '🔥' },
        ],
    },
    // Nível Jounin
    {
        id: 'kubikiribocho',
        name: 'Kubikiribōchō',
        description: 'A "Lâmina do Carrasco" de Zabuza. Uma espada gigante que se regenera usando o ferro do sangue de suas vítimas.',
        imageUrl: 'https://i.ibb.co/fYpRbCMP/kubikiribocho.png',
        type: 'Espada Grande',
        buffs: { taijutsu: 40, ninjutsu: 0, genjutsu: 0, selo: -10, vitalidade: 15, inteligencia: 0 },
        requiredLevel: 25,
        price: 12000,
        passivas: [
          { id: 'kubikiri_ferro_sanguineo', nome: 'Regeneração do Ferro Sanguíneo', descricao: 'Sempre que usar Taijutsu, rouba 8% do dano causado como HP.', chance: 0.35, gatilho: 'ao_usar_taijutsu', efeito: 'lifesteal', valor: 0.08, cor: '#ef4444', emoji: '🗡️' },
        ],
    },
    {
        id: 'cabaca_gaara',
        name: 'Cabaça de Areia',
        description: 'A cabaça de Gaara, infundida com chakra, que carrega areia especial para ataques e defesas rápidas. Aumenta o poder do Ninjutsu e a Inteligência.',
        imageUrl: 'https://i.ibb.co/bgsBPnqf/Cabaca-de-Areia.png',
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: -10, ninjutsu: 35, genjutsu: 0, selo: 0, vitalidade: 5, inteligencia: 15 },
        requiredLevel: 28,
        price: 13500,
        passivas: [
          { id: 'areia_escudo', nome: 'Escudo de Areia', descricao: 'No início de cada turno, 25% de chance de criar uma barreira de areia.', chance: 0.25, gatilho: 'inicio_turno', efeito: 'barreira', cor: '#fbbf24', emoji: '🏜️' },
          { id: 'areia_veneno', nome: 'Areia Cortante', descricao: '20% de chance ao usar Ninjutsu de envenenar o alvo (6% HP/turno).', chance: 0.20, gatilho: 'ao_usar_ninjutsu', efeito: 'veneno', valor: 0.06, cor: '#d97706', emoji: '🌪️' },
        ],
    },
    {
        id: 'samehada',
        name: 'Samehada',
        description: 'A "Pele de Tubarão" de Kisame. Uma espada viva que se alimenta de chakra. Ela rasga em vez de cortar e só se une a quem tem grandes reservas de energia.',
        imageUrl: 'https://i.ibb.co/Y4xkw5Rk/samehada.png',
        isPremium: true,
        type: 'Espada Grande',
        buffs: { taijutsu: 15, ninjutsu: 35, genjutsu: 0, selo: -10, vitalidade: 30, inteligencia: 0 },
        requiredLevel: 30,
        price: 15000,
        passivas: [
          { id: 'samehada_devorar_chakra', nome: 'Devorar Chakra', descricao: 'Sempre que atacar, rouba 10% do dano causado como HP.', chance: 0.4, gatilho: 'ao_atacar', efeito: 'lifesteal', valor: 0.10, cor: '#818cf8', emoji: '🦈' },
          { id: 'samehada_escamas', nome: 'Escamas Afiadas', descricao: 'Ao receber dano, 30% de chance de refletir 20% de volta ao atacante.', chance: 0.30, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.20, cor: '#6366f1', emoji: '⚡' },
        ],
    },
    {
        id: 'hiramekarei',
        name: 'Hiramekarei',
        description: 'Uma espada de dois cabos que pode armazenar e liberar chakra, moldando-o em diferentes formas, como um martelo ou uma longa espada.',
        imageUrl: 'https://i.ibb.co/8gTccCkp/Hiramekarei.png',
        type: 'Espada Grande',
        buffs: { taijutsu: 10, ninjutsu: 40, genjutsu: 0, selo: -5, vitalidade: 0, inteligencia: 15 },
        requiredLevel: 32,
        price: 18000,
        passivas: [
          { id: 'hiramekarei_forma_chakra', nome: 'Forma de Chakra', descricao: 'Ao usar Ninjutsu, 30% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.30, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#38bdf8', emoji: '✨' },
        ],
    },
    {
        id: 'marionete_sasori',
        name: 'Marionete: Hiruko',
        description: 'A marionete defensiva favorita de Sasori, com uma cauda de escorpião venenosa e um casco quase impenetrável.',
        imageUrl: 'https://i.ibb.co/7NJxRncL/Marionete-Hiruko.png',
        type: 'Marionete',
        buffs: { taijutsu: -20, ninjutsu: 40, genjutsu: 10, selo: 0, vitalidade: 25, inteligencia: 0 },
        requiredLevel: 34,
        price: 21000,
        passivas: [
          { id: 'hiruko_ferrao', nome: 'Ferrão Venenoso', descricao: 'Sempre que usar Ninjutsu, aplica veneno no alvo (10% HP/turno).', chance: 0.45, gatilho: 'ao_usar_ninjutsu', efeito: 'veneno', valor: 0.10, cor: '#a3e635', emoji: '🦂' },
          { id: 'hiruko_casco', nome: 'Casco Impenetrável', descricao: 'Ao receber dano, 35% de chance de criar uma barreira protetora.', chance: 0.35, gatilho: 'ao_receber_dano', efeito: 'barreira', cor: '#94a3b8', emoji: '🛡️' },
        ],
    },
    {
        id: 'kiba',
        name: 'Kiba',
        description: 'Espadas gêmeas infundidas com o elemento raio, capazes de gerar e controlar relâmpagos. Aumentam a velocidade e o poder dos jutsus Raiton.',
        imageUrl: 'https://i.ibb.co/wFjkwGdK/kiba-1.png',
        type: 'Lâmina Curta',
        buffs: { taijutsu: 10, ninjutsu: 30, genjutsu: 0, selo: 25, vitalidade: 0, inteligencia: -5 },
        requiredLevel: 35,
        price: 22000,
        passivas: [
          { id: 'kiba_descarga', nome: 'Descarga Relampejante', descricao: '35% de chance ao usar Taijutsu de paralisar o alvo com raio.', chance: 0.35, gatilho: 'ao_usar_taijutsu', efeito: 'paralisia', cor: '#fde047', emoji: '⚡' },
          { id: 'kiba_queimadura_raio', nome: 'Queimadura do Raio', descricao: '25% de chance ao atacar de causar queimadura elétrica (9% HP/turno).', chance: 0.25, gatilho: 'ao_atacar', efeito: 'queimadura', valor: 0.09, cor: '#facc15', emoji: '🌩️' },
        ],
    },
    {
        id: 'kusanagi',
        name: 'Espada Kusanagi',
        description: 'A lendária espada de Orochimaru, capaz de se estender a grandes distâncias e ser controlada remotamente.',
        imageUrl: 'https://i.ibb.co/prn0MbYS/Espada-Kusanagi-1.png',
        type: 'Lendária',
        buffs: { taijutsu: 25, ninjutsu: 15, genjutsu: 0, selo: 25, vitalidade: 0, inteligencia: 20 },
        requiredLevel: 40,
        price: 25000,
        passivas: [
          { id: 'kusanagi_lamina_estendida', nome: 'Lâmina Estendida', descricao: 'Ao usar Genjutsu, 30% de chance de selar o jutsu do alvo.', chance: 0.30, gatilho: 'ao_usar_genjutsu', efeito: 'selar_jutsu', cor: '#c084fc', emoji: '🐍' },
          { id: 'kusanagi_veneno', nome: 'Veneno de Orochimaru', descricao: '25% de chance ao atacar de aplicar veneno mortal (12% HP/turno).', chance: 0.25, gatilho: 'ao_atacar', efeito: 'veneno', valor: 0.12, cor: '#84cc16', emoji: '☠️' },
        ],
    },
    {
        id: 'foice_tripla',
        name: 'Foice de Lâmina Tripla',
        description: 'A arma profana de Hidan. Uma foice gigante com três lâminas, projetada para coletar sangue para seus rituais de maldição.',
        imageUrl: 'https://i.ibb.co/XxNS6x7p/Foice-de-Lamina-Tripla.png',
        type: 'Lendária',
        buffs: { taijutsu: 30, ninjutsu: -10, genjutsu: 0, selo: 0, vitalidade: 40, inteligencia: -10 },
        requiredLevel: 42,
        price: 27000,
        passivas: [
          { id: 'hidan_ritual_jashin', nome: 'Ritual de Jashin', descricao: 'Sempre que usar Taijutsu, rouba 12% do dano causado como HP.', chance: 0.4, gatilho: 'ao_usar_taijutsu', efeito: 'lifesteal', valor: 0.12, cor: '#dc2626', emoji: '☠️' },
          { id: 'hidan_maldicao', nome: 'Maldição de Sangue', descricao: '20% de chance ao atacar de envenenar o alvo (10% HP/turno).', chance: 0.20, gatilho: 'ao_atacar', efeito: 'veneno', valor: 0.10, cor: '#7f1d1d', emoji: '🩸' },
        ],
    },
    // Nível Kage
    {
        id: 'shibuki',
        name: 'Shibuki',
        description: 'A "Espada de Explosão", que combina esgrima com explosões. Contém um pergaminho cheio de selos explosivos.',
        imageUrl: 'https://i.ibb.co/RphnpLdt/shibuki.png',
        type: 'Espada Grande',
        buffs: { taijutsu: 20, ninjutsu: 45, genjutsu: 0, selo: 0, vitalidade: -10, inteligencia: 0 },
        requiredLevel: 45,
        price: 28000,
        passivas: [
          { id: 'shibuki_explosao', nome: 'Explosão em Cadeia', descricao: '35% de chance ao usar Ninjutsu de causar queimadura pela detonação (10% HP/turno).', chance: 0.35, gatilho: 'ao_usar_ninjutsu', efeito: 'queimadura', valor: 0.10, cor: '#fb923c', emoji: '💣' },
        ],
    },
    {
        id: 'nuibari',
        name: 'Nuibari',
        description: 'A "Agulha de Costura", uma espada longa e fina que pode perfurar vários inimigos e costurá-los com um fio de aço.',
        imageUrl: 'https://i.ibb.co/hxLm7PTC/Nuibari.png',
        type: 'Lendária',
        buffs: { taijutsu: -5, ninjutsu: 20, genjutsu: 25, selo: 40, vitalidade: 0, inteligencia: 0 },
        requiredLevel: 52,
        price: 32000,
        passivas: [
          { id: 'nuibari_costura', nome: 'Costura Mortal', descricao: 'Sempre que usar Genjutsu, sela o ninjutsu do alvo com o fio de aço.', chance: 0.4, gatilho: 'ao_usar_genjutsu', efeito: 'selar_jutsu', cor: '#e879f9', emoji: '🧵' },
          { id: 'nuibari_perfuracao', nome: 'Perfuração Precisa', descricao: '30% de chance ao atacar de enfraquecer o alvo.', chance: 0.30, gatilho: 'ao_atacar', efeito: 'enfraquecer', cor: '#c084fc', emoji: '🎯' },
        ],
    },
    {
        id: 'kabutowari',
        name: 'Kabutowari',
        description: 'O "Rachador de Elmos". Uma combinação de um machado e um martelo que dizem ser capaz de quebrar qualquer defesa.',
        imageUrl: 'https://i.ibb.co/C3ZMzDZh/Kabutowari.png',
        type: 'Espada Grande',
        buffs: { taijutsu: 60, ninjutsu: 0, genjutsu: 0, selo: -30, vitalidade: 20, inteligencia: 0 },
        requiredLevel: 55,
        price: 35000,
        passivas: [
          { id: 'kabutowari_quebrar_defesa', nome: 'Quebrar Qualquer Defesa', descricao: 'Sempre que usar Taijutsu, enfraquece o alvo destruindo sua defesa.', chance: 0.45, gatilho: 'ao_usar_taijutsu', efeito: 'enfraquecer', cor: '#f87171', emoji: '🪓' },
          { id: 'kabutowari_ignorar', nome: 'Golpe Devastador', descricao: '20% de chance ao atacar de o próximo ataque ignorar o cap de dano.', chance: 0.20, gatilho: 'ao_atacar', efeito: 'ignorar_cap', cor: '#ef4444', emoji: '💥' },
        ],
    },
    {
        id: 'gunbai',
        name: 'Gunbai (Leque Uchiha)',
        description: 'O leque de guerra de Madara Uchiha. Pode refletir ataques, converter chakra em vento e ser usado como uma maça ou escudo.',
        imageUrl: 'https://i.ibb.co/7Jbqrdmc/Gunbai-Leque-Uchiha.png',
        type: 'Lendária',
        buffs: { taijutsu: 10, ninjutsu: 20, genjutsu: 40, selo: 0, vitalidade: -10, inteligencia: 30 },
        requiredLevel: 58,
        price: 45000,
        passivas: [
          { id: 'gunbai_reflexo', nome: 'Reflexo do Leque de Guerra', descricao: 'Ao receber dano, 35% de chance de refletir 25% de volta ao atacante.', chance: 0.35, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.25, cor: '#f0abfc', emoji: '🪭' },
          { id: 'gunbai_barreira_madara', nome: 'Barreira de Madara', descricao: 'No início de cada turno, 20% de chance de criar uma barreira de chakra.', chance: 0.20, gatilho: 'inicio_turno', efeito: 'barreira', cor: '#a855f7', emoji: '🔮' },
        ],
    },
    // Nível Lendário / Divino
    {
        id: 'samehada_v2',
        name: 'Samehada (Forma Liberada)',
        description: 'A verdadeira forma da Samehada quando totalmente desperta. A espada viva revela sua natureza de criatura, com escamas afiadas e capacidade massiva de devorar chakra. Apenas shinobis com reservas de chakra colossais podem empunhá-la neste estado.',
        imageUrl: 'https://i.ibb.co/0prcPQbW/samehada2.png',
        isPremium: true,
        type: 'Espada Grande',
        buffs: { taijutsu: 25, ninjutsu: 55, genjutsu: 0, selo: -15, vitalidade: 50, inteligencia: 10 },
        requiredLevel: 60,
        price: 50000,
        passivas: [
          { id: 'samehada_v2_devour', nome: 'Devoração Total', descricao: 'Sempre que atacar, rouba 15% do dano causado como HP.', chance: 0.45, gatilho: 'ao_atacar', efeito: 'lifesteal', valor: 0.15, cor: '#6366f1', emoji: '🦈' },
          { id: 'samehada_v2_escamas', nome: 'Escamas Vivas', descricao: 'Ao receber dano, 40% de chance de refletir 30% de volta.', chance: 0.40, gatilho: 'ao_receber_dano', efeito: 'refletir', valor: 0.30, cor: '#4f46e5', emoji: '⚡' },
        ],
    },
    {
        id: 'bashosen',
        name: 'Bashōsen',
        description: 'O Leque de Plumas de Bananeira, uma das Ferramentas Valiosas do Sábio dos Seis Caminhos. Pode gerar qualquer um dos cinco elementos.',
        imageUrl: 'https://i.ibb.co/Kz72PVBw/Bashosen.png',
        type: 'Lendária',
        buffs: { taijutsu: -10, ninjutsu: 70, genjutsu: 0, selo: 10, vitalidade: -20, inteligencia: 20 },
        requiredLevel: 65,
        price: 60000,
        passivas: [
          { id: 'bashosen_cinco_elementos', nome: 'Geração dos Cinco Elementos', descricao: 'Ao usar Ninjutsu, 40% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.40, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#34d399', emoji: '🌿' },
          { id: 'bashosen_queimadura', nome: 'Chama Elemental', descricao: '30% de chance ao atacar de causar queimadura (12% HP/turno).', chance: 0.30, gatilho: 'ao_atacar', efeito: 'queimadura', valor: 0.12, cor: '#f97316', emoji: '🔥' },
        ],
    },
    {
        id: 'ryuuga_garian_tou',
        name: 'Ryūga Garian Tō',
        description: 'A lendária "Espada do Dragão Faminto" forjada nas chamas de um dragão ancestral. Sua lâmina emana um calor intenso capaz de incinerar qualquer coisa que toque. Dizem que apenas aqueles com vontade de ferro podem empunhá-la sem serem consumidos por sua fúria flamejante.',
        imageUrl: 'https://i.ibb.co/fdStn4P1/Ryuuga-Garian-Tou.png',
        type: 'Lendária',
        buffs: { taijutsu: 35, ninjutsu: 45, genjutsu: 0, selo: 20, vitalidade: 10, inteligencia: -5 },
        requiredLevel: 68,
        price: 80000,
        passivas: [
          { id: 'ryuuga_furia_dragao', nome: 'Fúria do Dragão Flamejante', descricao: 'Sempre que usar Taijutsu, aplica queimadura intensa no alvo (15% HP/turno).', chance: 0.4, gatilho: 'ao_usar_taijutsu', efeito: 'queimadura', valor: 0.15, cor: '#ef4444', emoji: '🐉' },
          { id: 'ryuuga_lifesteal', nome: 'Chamas Devoradoras', descricao: '35% de chance ao atacar de roubar 12% do dano causado como HP.', chance: 0.35, gatilho: 'ao_atacar', efeito: 'lifesteal', valor: 0.12, cor: '#dc2626', emoji: '🔥' },
        ],
    },
    {
        id: 'hiraishin_kunai',
        name: 'Hiraishin Kunai',
        description: 'A kunai especial de três pontas marcada com a fórmula do Jutsu Deus Voador do Trovão. Criada por Minato Namikaze, permite teletransporte instantâneo para quem domina a técnica. Sua lâmina é mais resistente que kunais comuns e a marca de selamento nunca desaparece.',
        imageUrl: 'https://i.ibb.co/xtmrWrWD/Hiraishin-Kunai.png',
        isPremium: true,
        type: 'Ferramenta Ninja',
        buffs: { taijutsu: 20, ninjutsu: 35, genjutsu: 0, selo: 60, vitalidade: 0, inteligencia: 25 },
        requiredLevel: 70,
        price: 90000,
        passivas: [
          { id: 'hiraishin_teletransporte', nome: 'Teletransporte Relampejante', descricao: 'Ao usar Ninjutsu, 35% de chance de o próximo ataque ignorar o cap de dano.', chance: 0.35, gatilho: 'ao_usar_ninjutsu', efeito: 'ignorar_cap', cor: '#fbbf24', emoji: '⚡' },
          { id: 'hiraishin_paralisia', nome: 'Impacto Sônico', descricao: '25% de chance ao atacar de paralisar o alvo pelo choque do teletransporte.', chance: 0.25, gatilho: 'ao_atacar', efeito: 'paralisia', cor: '#f59e0b', emoji: '💫' },
        ],
    },
    {
        id: 'kohaku_no_johei',
        name: 'Pote Purificador de Brasas',
        description: 'Uma das ferramentas do Sábio dos Seis Caminhos. Um pote gigante que pode selar qualquer coisa se o alvo responder ao chamado.',
        imageUrl: 'https://i.ibb.co/Xxrghw9k/kohaku-no-johei.png',
        isPremium: true,
        type: 'Lendária',
        buffs: { taijutsu: -20, ninjutsu: 0, genjutsu: 0, selo: 100, vitalidade: 20, inteligencia: 20 },
        requiredLevel: 75,
        price: 120000,
        passivas: [
          { id: 'kohaku_selamento', nome: 'Selamento do Pote Purificador', descricao: 'Sempre que usar Genjutsu, sela o ninjutsu do alvo.', chance: 0.45, gatilho: 'ao_usar_genjutsu', efeito: 'selar_jutsu', cor: '#fbbf24', emoji: '🏺' },
          { id: 'kohaku_barreira', nome: 'Barreira Sagrada', descricao: 'No início de cada turno, 30% de chance de criar uma barreira purificadora.', chance: 0.30, gatilho: 'inicio_turno', efeito: 'barreira', cor: '#fcd34d', emoji: '✨' },
        ],
    }
];