// /lib/jutsus-data.ts

export type Jutsu = {
    id: string;
    name: string;
    element: string;
    requiredLevel: number;
    imageUrl: string;
    description?: string;
  };
  
  // Imagem padrão para jutsus sem imagem (use uma imagem genérica do seu storage)
  export const defaultJutsuImage = 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto2/default-jutsu.png';