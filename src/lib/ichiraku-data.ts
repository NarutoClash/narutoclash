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
        price: 75,
        healthRecovery: 150,
        imageUrl: 'https://i.imgur.com/Gz2w3Y3.png',
    },
    {
        id: 'green_tea',
        name: 'Chá Revigorante',
        description: 'Uma bebida quente e calmante que ajuda a clarear a mente e a restaurar a estamina do corpo.',
        price: 90,
        healthRecovery: 200,
        imageUrl: 'https://i.imgur.com/gK2RAlL.png',
    },
    {
        id: 'miso_ramen',
        name: 'Miso Ramen',
        description: 'O prato favorito de Naruto! Uma tigela generosa que aquece o corpo e recupera a vitalidade.',
        price: 200,
        healthRecovery: 500,
        imageUrl: 'https://i.imgur.com/Cq2TqIu.png',
    },
    {
        id: 'shio_ramen',
        name: 'Shio Ramen com Porco',
        description: 'Um ramen de caldo leve e salgado, com fatias de porco para uma recuperação de vida mais substancial.',
        price: 250,
        healthRecovery: 650,
        imageUrl: 'https://i.imgur.com/hY4PzF1.png',
    },
    {
        id: 'tonkotsu_ramen',
        name: 'Tonkotsu Ramen Especial',
        description: 'A especialidade da casa! Um caldo rico e cremoso que recupera grande parte da vitalidade. O melhor para um shinobi faminto!',
        price: 400,
        healthRecovery: 1000,
        imageUrl: 'https://i.imgur.com/u5OV22L.png',
    },
    {
        id: 'dango',
        name: 'Dango Restaurador',
        description: 'Espetos doces e mastigáveis, um deleite para qualquer shinobi. Surpreendentemente eficaz para recuperar a força.',
        price: 120,
        healthRecovery: 250,
        imageUrl: 'https://i.imgur.com/R3Wj2fQ.png',
    },
    {
        id: 'soldier_pill_health',
        name: 'Pílula de Soldado',
        description: 'Uma pílula militar concentrada. Acelera a coagulação e a regeneração celular, recuperando uma quantidade significativa de vida.',
        price: 600,
        healthRecovery: 2000,
        imageUrl: 'https://i.imgur.com/nJgXC9u.png',
    },
    {
        id: 'soldier_pill_chakra',
        name: 'Pílula de Super Soldado',
        description: 'Uma versão aprimorada da pílula militar. Contém nutrientes que são rapidamente convertidos para fechar feridas graves.',
        price: 800,
        healthRecovery: 3000,
        imageUrl: 'https://i.imgur.com/Q2yVf2d.png',
    },
    {
        id: 'vitality_elixir',
        name: 'Elixir de Vitalidade',
        description: 'Uma poção rara e poderosa, criada com ervas lendárias. Dizem ser capaz de trazer um ninja de volta da beira da morte, restaurando sua vida quase por completo.',
        price: 2500,
        healthRecovery: 6000,
        imageUrl: 'https://i.imgur.com/pYvj2oK.png',
    },
    {
        id: 'chakra_essence',
        name: 'Sopa Milagrosa da Vida',
        description: 'Uma sopa lendária feita com ingredientes secretos. Recupera uma quantidade extraordinária de vida, fechando ferimentos profundos.',
        price: 3000,
        healthRecovery: 8000,
        imageUrl: 'https://i.imgur.com/L7oHkYt.png',
    }
];
