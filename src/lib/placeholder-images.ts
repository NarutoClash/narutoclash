import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export type VillageImage = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export type DoujutsuImage = {
  id: string;
  imageUrl: string;
};

export type SummonImage = {
  id: string;
  imageUrl: string;
};

// ✅ Characters agora têm a mesma estrutura que PlaceHolderImages
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
export const Characters: ImagePlaceholder[] = data.characters;
export const VillageImages: VillageImage[] = data.villageImages;
export const DoujutsuImages: DoujutsuImage[] = data.doujutsuImages;
export const SummonImages: SummonImage[] = data.summonImages;