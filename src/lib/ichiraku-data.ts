export type IchirakuItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    healthRecovery?: number;
    chakraRecovery?: number;
    imageUrl: string;
};

export const ichirakuMenu: IchirakuItem[] = [
    {
        id: 'onigiri',
        name: 'Onigiri Simples',
        description: 'Um lanche rápido e clássico. Ótimo para recuperar um pouco de vitalidade após um treino leve.',
        price: 150,
        healthRecovery: 100,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/onigiri.png',
    },
    {
        id: 'green_tea',
        name: 'Chá Revigorante',
        description: 'Uma bebida quente e calmante que ajuda a clarear a mente e a restaurar a estamina do corpo.',
        price: 220,
        healthRecovery: 150,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/green_tea.png',
    },
    {
        id: 'dango',
        name: 'Dango Restaurador',
        description: 'Espetos doces e mastigáveis, um deleite para qualquer shinobi. Surpreendentemente eficaz para recuperar a força.',
        price: 350,
        healthRecovery: 250,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/dango.png',
    },
    {
        id: 'miso_ramen',
        name: 'Miso Ramen',
        description: 'O prato favorito de Naruto! Uma tigela generosa que aquece o corpo e recupera a vitalidade.',
        price: 600,
        healthRecovery: 400,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/miso_ramen.png',
    },
    {
        id: 'shio_ramen',
        name: 'Shio Ramen com Porco',
        description: 'Um ramen de caldo leve e salgado, com fatias de porco para uma recuperação de vida mais substancial.',
        price: 850,
        healthRecovery: 600,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/shio_ramen.png',
    },
    {
        id: 'tonkotsu_ramen',
        name: 'Tonkotsu Ramen Especial',
        description: 'A especialidade da casa! Um caldo rico e cremoso que recupera grande parte da vitalidade. O melhor para um shinobi faminto!',
        price: 1100,
        healthRecovery: 800,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/tonkotsu_ramen.png',
    },
    {
        id: 'curry',
        name: 'Curry da Vida',
        description: 'Um curry lendário de ingredientes secretos que regenera rapidamente o corpo, fechando até ferimentos graves.',
        price: 1500,
        healthRecovery: 1000,
        imageUrl: 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto/Ichiraku/Curry.png',
    }
];
