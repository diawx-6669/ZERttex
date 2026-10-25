import type { L, TourId } from './types';
import credits from './photoCredits.json';

// Real destination photos are optional. Files in src/assets/photos named
// "<tour>-<n>.jpg" are picked up automatically, but ONLY if they have a credit
// entry in photoCredits.json. Without photos the app falls back to SVG scenes.

export type PhotoCredit = {
  author: string;
  license: string;
  licenseUrl?: string;
  source: string;
  title?: string;
  alt?: L;
};

export type Photo = { src: string; file: string; tour: TourId; credit: PhotoCredit };

const files = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const creditMap = credits as Record<string, PhotoCredit>;

const all: Photo[] = Object.entries(files)
  .map(([path, src]) => {
    const file = path.split('/').pop()!;
    const tour = file.split('-')[0] as TourId;
    return { src, file, tour, credit: creditMap[file] };
  })
  .filter((p): p is Photo => !!p.credit && ['charyn', 'kolsai', 'turkestan', 'burabay'].includes(p.tour))
  .sort((a, b) => a.file.localeCompare(b.file, 'en', { numeric: true }));

export const photosFor = (tour: TourId): Photo[] => all.filter((p) => p.tour === tour);
export const hasPhotos = all.length > 0;
