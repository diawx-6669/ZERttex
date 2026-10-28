// Seats left per tour date. DEMO DATA: a stable made-up number per (tour, date),
// so the same date always shows the same seats. In the product this comes from
// the booking database (group size minus paid bookings).
import type { TourId } from './types';

/** Group size per departure (also the booking form's traveler limit). */
export const GROUP_SIZE = 12;
/** Never show fewer seats than this, so the default 2-traveler demo flow is never blocked. */
const MIN_LEFT = 3;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export function seatsLeft(tour: TourId, date: string): number {
  return MIN_LEFT + (hash(`${tour}|${date}`) % (GROUP_SIZE - MIN_LEFT + 1));
}

/** Next `count` Saturdays on or after `from` (ISO date): popular departure dates on tour pages. */
export function upcomingSaturdays(from: string, count: number): string[] {
  const d = new Date(from + 'T00:00:00');
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return Array.from({ length: count }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i * 7);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  });
}
