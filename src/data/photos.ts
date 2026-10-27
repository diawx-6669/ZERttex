import type { L, TourId } from './types';
import credits from './photoCredits.json';
import commonsList from './commonsPhotos.json';

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

// The 12 credited Wikimedia Commons photos (src/data/commonsPhotos.json).
// Offline-safe: `npm run photos:offline` downloads each one into
// src/assets/photos/<local> (≤ 1600 px wide, ≤ 250 KB) and writes its credit to
// photoCredits.json, so it is inlined into the single-file build and works with
// no network. Until a file is downloaded, the browser loads it straight from
// Commons; if that fails too (offline), the component falls back to the SVG scene.
const commons = (file: string, width = 1600) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
const page = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;

type CommonsEntry = { tour: TourId; local: string; file: string; author: string; license: string; licenseUrl?: string; title: string; zh: string };
const localNames = new Set(all.map((p) => p.file));

const remote: Photo[] = (commonsList as CommonsEntry[])
  .filter((r) => !localNames.has(r.local))
  .map((r) => ({
    src: commons(r.file),
    file: r.file,
    tour: r.tour,
    credit: { author: r.author, license: r.license, licenseUrl: r.licenseUrl, source: page(r.file), title: r.title, alt: { en: r.title, zh: r.zh } },
  }));

/** True when every credited photo is bundled in the build (no network needed). */
export const photosOffline = remote.length === 0 && all.length > 0;

// Local files first, then any Commons photo that is not downloaded yet.
const combined = [...all, ...remote];
export const photosFor = (tour: TourId): Photo[] => combined.filter((p) => p.tour === tour);
export const allPhotos = combined;
export const hasPhotos = combined.length > 0;
