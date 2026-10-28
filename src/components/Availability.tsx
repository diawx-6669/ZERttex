import { GROUP_SIZE, seatsLeft, upcomingSaturdays } from '../data/availability';
import type { TourId } from '../data/types';
import { href } from '../lib/router';
import { minBookDate, useApp } from '../state';
import { Icon } from './Icon';
import { Tag } from './Tag';

const shortDate = (iso: string, lang: 'en' | 'zh') =>
  new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'long' });

/** "18 November: 4 of 12 seats left" under a date field. Amber when few seats are left. */
export function SeatsLine({ tour, date, travelers }: { tour: TourId; date: string; travelers: number }) {
  const { t, lang } = useApp();
  const left = seatsLeft(tour, date);
  const low = left <= 4;
  const short = travelers > left;
  return (
    <p data-testid="seats-left" className={`mt-1.5 flex flex-wrap items-center gap-1.5 text-sm font-semibold ${short ? 'text-danger' : low ? 'text-warn' : 'text-ok'}`}>
      <Icon name="users" size={14} />
      <span>
        {shortDate(date, lang)}: {t({ en: `${left} of ${GROUP_SIZE} seats left`, zh: `剩余 ${left} / ${GROUP_SIZE} 个名额` })}
      </span>
      <Tag kind="demo" />
    </p>
  );
}

/** Tour page: the next Saturdays with seats left; one tap opens the booking with that date. */
export function UpcomingDates({ tour }: { tour: TourId }) {
  const { t, lang } = useApp();
  const dates = upcomingSaturdays(minBookDate(), 6);
  return (
    <section aria-labelledby="dates-h">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="dates-h" className="text-xl font-bold">{t({ en: 'Upcoming dates', zh: '近期出发日期' })}</h2>
        <Tag kind="demo" />
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {dates.map((d) => {
          const left = seatsLeft(tour, d);
          return (
            <li key={d}>
              <a href={href(`/book?tour=${tour}&date=${d}`)} className="block rounded-2xl border border-line bg-surface p-3 transition hover:border-teal">
                <span className="block text-sm font-semibold">{shortDate(d, lang)}</span>
                <span className={`mt-0.5 block text-sm ${left <= 4 ? 'font-semibold text-warn' : 'text-muted'}`}>
                  {t({ en: `${left} of ${GROUP_SIZE} seats left`, zh: `剩余 ${left} / ${GROUP_SIZE} 个名额` })}
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface2" aria-hidden>
                  <span className={`block h-full rounded-full ${left <= 4 ? 'bg-warn' : 'bg-teal'}`} style={{ width: `${((GROUP_SIZE - left) / GROUP_SIZE) * 100}%` }} />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">{t({ en: 'Small groups of up to 12. Any other date: pick it when booking.', zh: '每团最多 12 人。其他日期可在预订时选择。' })}</p>
    </section>
  );
}
