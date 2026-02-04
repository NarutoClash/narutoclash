import data from './placeholder-images.json';

export type VillageImage = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const villageImages: { [key: string]: VillageImage } = data.villageImages.reduce((acc, image) => {
  acc[image.id] = image;
  return acc;
}, {} as { [key: string]: VillageImage });
