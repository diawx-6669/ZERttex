import { hubName, tourById } from '../data/tours';
import type { Hub, Interest, L, TourId } from '../data/types';

// Rules-based trip builder. NOT a live AI.
// Plan = arrival day + selected tours' real itinerary days + intercity
// transfers when the hub changes + remaining days as city days by interest.

export type BudgetLevel = 'budget' | 'comfort' | 'premium';

export type PlanInput = {
  tours: TourId[];
  days: number;
  interests: Interest[];
  budget: BudgetLevel;
  travelers: number;
  arrival: string; // YYYY-MM-DD
};

export type PlanDay = {
  day: number;
  date: string;
  kind: 'arrival' | 'tour' | 'transfer' | 'city';
  city: Hub;
  title: L;
  items: L[];
  tourId?: TourId;
};

export type PlanResult =
  | { ok: true; days: PlanDay[]; tourItems: { tourId: TourId; date: string }[]; cost: PlanCost; minDays: number }
  | { ok: false; error: 'none' | 'fit'; minDays: number };

export type PlanCost = { guided: number; cityDays: number; transfers: number; total: number; cityDayCount: number };

// Estimates (team planning assumptions), KZT per person.
export const cityDayRate: Record<BudgetLevel, number> = { budget: 25_000, comfort: 45_000, premium: 85_000 };
const transferCost: Record<string, number> = {
  'almaty-astana': 30_000,
  'almaty-turkestan': 25_000,
  'turkestan-astana': 35_000,
};
const transferMode: Record<string, L> = {
  'almaty-astana': { en: 'Domestic flight (about 1.5 h) or overnight train', zh: '国内航班（约1.5小时）或夜间火车' },
  'almaty-turkestan': { en: 'Domestic flight or train', zh: '国内航班或火车' },
  'turkestan-astana': { en: 'Domestic flight', zh: '国内航班' },
};
const pairKey = (a: Hub, b: Hub) => [a, b].sort().join('-');
// Normalise alphabetical keys to the table above.
const keyFor = (a: Hub, b: Hub) => {
  const k = pairKey(a, b);
  return k === 'astana-turkestan' ? 'turkestan-astana' : k;
};

const hubOrder: Hub[] = ['almaty', 'turkestan', 'astana'];

const cityIdeas: Record<Hub, Record<Interest, L[]>> = {
  almaty: {
    nature: [{ en: 'Medeu valley and mountain air above the city', zh: '麦迪奥山谷，俯瞰城市的山间空气' }],
    photography: [{ en: 'Kok-Tobe hill at sunset for city views', zh: '日落时登阔克托别山拍城市全景' }],
    culture: [{ en: 'Central State Museum and the Green Bazaar', zh: '国家中央博物馆与绿色巴扎' }],
    adventure: [{ en: 'Day hike in the foothills with a local guide (to be arranged)', zh: '与当地向导在山麓徒步一日（待安排）' }],
    relaxation: [{ en: 'Panfilov Park, cafés and a slow evening', zh: '潘菲洛夫公园、咖啡馆，悠闲夜晚' }],
  },
  astana: {
    nature: [{ en: 'Walk along the Yesil river embankment', zh: '沿伊希姆河畔散步' }],
    photography: [{ en: 'Bayterek tower and the modern skyline at night', zh: '巴伊杰列克观景塔与现代夜景' }],
    culture: [{ en: 'National Museum of Kazakhstan', zh: '哈萨克斯坦国家博物馆' }],
    adventure: [{ en: 'Bike ride through the city parks', zh: '骑行穿越城市公园' }],
    relaxation: [{ en: 'Botanical garden and a relaxed dinner', zh: '植物园与悠闲晚餐' }],
  },
  turkestan: {
    nature: [{ en: 'Morning walk in the old town gardens', zh: '清晨漫步古城花园' }],
    photography: [{ en: 'Golden-hour photos around the old town', zh: '黄金时段在古城拍照' }],
    culture: [{ en: 'Free day for crafts and the bazaar', zh: '自由日：手工艺与巴扎' }],
    adventure: [{ en: 'Day trip to Sauran ruins (to be arranged)', zh: '扫兰古城遗址一日游（待安排）' }],
    relaxation: [{ en: 'Slow day: tea houses and evening lights', zh: '慢节奏：茶馆与夜色灯光' }],
  },
};

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function minDaysFor(ids: TourId[]): number {
  const selected = ids.map((id) => tourById(id)!).filter(Boolean);
  const hubs = hubOrder.filter((h) => selected.some((t) => t.hub === h));
  return 1 + selected.reduce((s, t) => s + t.days, 0) + Math.max(0, hubs.length - 1);
}

export function buildPlan(input: PlanInput): PlanResult {
  const selected = hubOrder.flatMap((h) =>
    input.tours.map((id) => tourById(id)!).filter((t) => t && t.hub === h),
  );
  const minDays = minDaysFor(input.tours);
  if (selected.length === 0) return { ok: false, error: 'none', minDays };
  if (minDays > input.days) return { ok: false, error: 'fit', minDays };

  const hubs = hubOrder.filter((h) => selected.some((t) => t.hub === h));
  const free = input.days - minDays;
  const interests: Interest[] = input.interests.length ? input.interests : ['nature', 'culture'];

  // Distribute free city days: start with the last hub (departure city),
  // then go round-robin backwards.
  const freePerHub: Record<Hub, number> = { almaty: 0, turkestan: 0, astana: 0 };
  for (let i = 0; i < free; i++) freePerHub[hubs[hubs.length - 1 - (i % hubs.length)]]++;

  const days: Omit<PlanDay, 'day' | 'date'>[] = [];
  let ideaIdx = 0;
  const cityDay = (h: Hub): Omit<PlanDay, 'day' | 'date'> => {
    const interest = interests[ideaIdx++ % interests.length];
    const idea = cityIdeas[h][interest][0];
    return {
      kind: 'city',
      city: h,
      title: { en: `${hubName[h].en} · city day`, zh: `${hubName[h].zh} · 城市游` },
      items: [idea, { en: `Self-guided · ${interest}`, zh: `自由行 · ${interestZh[interest]}` }],
    };
  };

  hubs.forEach((h, hi) => {
    if (hi === 0) {
      days.push({
        kind: 'arrival',
        city: h,
        title: { en: `Arrival in ${hubName[h].en}`, zh: `抵达${hubName[h].zh}` },
        items: [
          { en: 'Airport or station pick-up (to be arranged)', zh: '机场或车站接送（待安排）' },
          { en: 'Rest, SIM card, currency exchange', zh: '休息、办理电话卡、兑换货币' },
        ],
      });
    } else {
      const from = hubs[hi - 1];
      days.push({
        kind: 'transfer',
        city: h,
        title: { en: `Transfer ${hubName[from].en} → ${hubName[h].en}`, zh: `中转 ${hubName[from].zh} → ${hubName[h].zh}` },
        items: [transferMode[keyFor(from, h)], { en: 'Check in, evening free', zh: '入住，晚间自由活动' }],
      });
    }
    // City days before the tours in non-final hubs, after the tours in the final hub.
    const isLast = hi === hubs.length - 1;
    if (!isLast) for (let i = 0; i < freePerHub[h]; i++) days.push(cityDay(h));
    selected
      .filter((t) => t.hub === h)
      .forEach((t) =>
        t.itinerary.forEach((d) =>
          days.push({ kind: 'tour', city: h, tourId: t.id, title: d.title, items: d.items }),
        ),
      );
    if (isLast) for (let i = 0; i < freePerHub[h]; i++) days.push(cityDay(h));
  });

  const dated: PlanDay[] = days.map((d, i) => ({ ...d, day: i + 1, date: addDays(input.arrival, i) }));
  const last = dated[dated.length - 1];
  last.items = [...last.items, { en: 'Evening departure', zh: '晚间离开' }];

  const tourItems: { tourId: TourId; date: string }[] = [];
  dated.forEach((d) => {
    if (d.kind === 'tour' && d.tourId && !tourItems.some((x) => x.tourId === d.tourId))
      tourItems.push({ tourId: d.tourId, date: d.date });
  });

  const guided = selected.reduce((s, t) => s + t.priceKzt, 0) * input.travelers;
  const cityDayCount = dated.filter((d) => d.kind !== 'tour').length;
  const cityDays = cityDayCount * cityDayRate[input.budget] * input.travelers;
  let transfers = 0;
  for (let i = 1; i < hubs.length; i++) transfers += transferCost[keyFor(hubs[i - 1], hubs[i])] * input.travelers;

  return {
    ok: true,
    days: dated,
    tourItems,
    minDays,
    cost: { guided, cityDays, transfers, total: guided + cityDays + transfers, cityDayCount },
  };
}

const interestZh: Record<Interest, string> = {
  nature: '自然',
  photography: '摄影',
  culture: '文化',
  adventure: '探险',
  relaxation: '休闲',
};
