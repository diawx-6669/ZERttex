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

// Freely licensed photos on Wikimedia Commons, loaded by the visitor's browser
// straight from Commons (Special:FilePath serves a resized copy). Author and
// licence come from each file page. If a photo cannot load (offline file,
// blocked network), the component falls back to the SVG scene.
const commons = (file: string, width = 1600) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
const page = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
const BYSA = (v: string) => ({ license: `CC BY-SA ${v}`, licenseUrl: `https://creativecommons.org/licenses/by-sa/${v}/` });

const remoteList: { tour: TourId; file: string; author: string; lic: { license: string; licenseUrl?: string }; title: string; zh: string }[] = [
  { tour: 'charyn', file: 'Charyn Canyon (3991842679).jpg', author: 'Peretz Partensky', lic: BYSA('2.0'), title: 'Charyn Canyon, Valley of Castles', zh: '查伦大峡谷城堡谷' },
  { tour: 'charyn', file: 'Charyn Canyon.jpg', author: 'Peretz Partensky', lic: BYSA('2.0'), title: 'Charyn Canyon', zh: '查伦大峡谷' },
  { tour: 'kolsai', file: 'Lower Kolsay Lake in April.jpg', author: 'Dylanvt', lic: BYSA('4.0'), title: 'Lower Kolsay Lake in April', zh: '四月的下科尔赛湖' },
  { tour: 'kolsai', file: 'Scenic Lake Kaindy.jpg', author: 'Inverseharpy', lic: BYSA('4.0'), title: 'Lake Kaindy', zh: '凯恩迪湖' },
  { tour: 'kolsai', file: 'IMG 9366-Kaindy-e.jpg', author: 'Jonas Satkauskas', lic: BYSA('2.5'), title: 'Lake Kaindy', zh: '凯恩迪湖' },
  { tour: 'kolsai', file: 'Kolsai lake.jpg', author: 'Katariyakartikey', lic: { license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }, title: 'Kolsay Lake', zh: '科尔赛湖' },
  { tour: 'turkestan', file: 'Mausoleum of Khoja Ahmed Yasawi in Hazrat-e Turkestan, Kazakhstan.jpg', author: 'Petar Milošević', lic: BYSA('4.0'), title: 'Mausoleum of Khoja Ahmed Yasawi', zh: '霍贾·艾哈迈德·亚萨维陵墓' },
  { tour: 'turkestan', file: 'Mausoleum of Khoja Ahmed Yasawi in Turkistan 9.jpg', author: 'Adam Harangozó', lic: BYSA('4.0'), title: 'Mausoleum of Khoja Ahmed Yasawi', zh: '霍贾·艾哈迈德·亚萨维陵墓' },
  { tour: 'turkestan', file: 'Mausoleum of Khoja Ahmed Yasavi in Turkestan, Kazakhstan.jpg', author: 'Petar Milošević', lic: BYSA('4.0'), title: 'Mausoleum of Khoja Ahmed Yasawi', zh: '霍贾·艾哈迈德·亚萨维陵墓' },
  { tour: 'burabay', file: 'Окжетпес Боровое.jpg', author: 'Dots foto', lic: BYSA('4.0'), title: 'Okzhetpes rock, Burabay', zh: '布拉拜奥日佩斯石' },
  { tour: 'burabay', file: 'Казахстан. Боровое. Вид на озеро с пляжа.jpg', author: 'Evgenyem', lic: BYSA('4.0'), title: 'Lake Burabay from the beach', zh: '从湖滩看布拉拜湖' },
  { tour: 'burabay', file: 'Burabay 020000, Kazakhstan - panoramio (2).jpg', author: 'alexandrorodrigez', lic: BYSA('3.0'), title: 'Burabay', zh: '布拉拜' },
];

const remote: Photo[] = remoteList.map((r) => ({
  src: commons(r.file),
  file: r.file,
  tour: r.tour,
  credit: { author: r.author, ...r.lic, source: page(r.file), title: r.title, alt: { en: r.title, zh: r.zh } },
}));

// Local files (if any) come first, then the Commons photos.
const combined = [...all, ...remote];
export const photosFor = (tour: TourId): Photo[] => combined.filter((p) => p.tour === tour);
export const allPhotos = combined;
export const hasPhotos = combined.length > 0;
