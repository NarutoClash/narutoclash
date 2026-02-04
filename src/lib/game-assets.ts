const SUPABASE_STORAGE_URL = 'https://nsenzuptpdudbswyxqfc.supabase.co/storage/v1/object/public/projeto';

export const getBossImage = (bossId: string) => {
  return `${SUPABASE_STORAGE_URL}/bosses/${bossId}.png`;
};

// Ou se preferir usar direto do bossesData
export const getBossImageFromData = (bossId: string) => {
  const boss = bossesData.find(b => b.id === bossId);
  return boss?.imageUrl || `${SUPABASE_STORAGE_URL}/bosses/default.png`;
};