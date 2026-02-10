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
        imageUrl: 'https://i.ibb.co/RGwbhCCL/onigiri.png',
    },
    {
        id: 'green_tea',
        name: 'Chá Revigorante',
        description: 'Uma bebida quente e calmante que ajuda a clarear a mente e a restaurar a estamina do corpo.',
        price: 220,
        healthRecovery: 150,
        imageUrl: 'https://i.ibb.co/4w2w9fVz/green-tea.png',
    },
    {
        id: 'dango',
        name: 'Dango Restaurador',
        description: 'Espetos doces e mastigáveis, um deleite para qualquer shinobi. Surpreendentemente eficaz para recuperar a força.',
        price: 350,
        healthRecovery: 250,
        imageUrl: 'https://i.ibb.co/0ywYrFXb/dango.png',
    },
    {
        id: 'miso_ramen',
        name: 'Miso Ramen',
        description: 'O prato favorito de Naruto! Uma tigela generosa que aquece o corpo e recupera a vitalidade.',
        price: 600,
        healthRecovery: 400,
        imageUrl: 'https://i.ibb.co/nV6FD7q/miso-ramen.png',
    },
    {
        id: 'shio_ramen',
        name: 'Shio Ramen com Porco',
        description: 'Um ramen de caldo leve e salgado, com fatias de porco para uma recuperação de vida mais substancial.',
        price: 850,
        healthRecovery: 600,
        imageUrl: 'https://i.ibb.co/W4Tt8cbx/shio-ramen.png',
    },
    {
        id: 'tonkotsu_ramen',
        name: 'Tonkotsu Ramen Especial',
        description: 'A especialidade da casa! Um caldo rico e cremoso que recupera grande parte da vitalidade. O melhor para um shinobi faminto!',
        price: 1100,
        healthRecovery: 800,
        imageUrl: 'https://i.ibb.co/G4YBvdYm/tonkotsu-ramen.png',
    },
    {
        id: 'curry',
        name: 'Curry da Vida',
        description: 'Um curry lendário de ingredientes secretos que regenera rapidamente o corpo, fechando até ferimentos graves.',
        price: 1500,
        healthRecovery: 1000,
        imageUrl: 'https://i.ibb.co/TxtJncc2/Curry.png',
    }
];