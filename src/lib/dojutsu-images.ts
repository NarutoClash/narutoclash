import data from './placeholder-images.json';

export type DoujutsuImage = {
  id: string;
  imageUrl: string;
};

export const doujutsuImages: { [key: string]: DoujutsuImage } = data.doujutsuImages.reduce((acc, image) => {
  acc[image.id] = image;
  return acc;
}, {} as { [key: string]: DoujutsuImage });
