import { useState } from 'react';
import { hubName, tourById } from '../data/tours';
import type { Hub, L, TourId } from '../data/types';
import { indicative, kzt } from '../lib/format';
import { href } from '../lib/router';
import { useApp } from '../state';
import { Icon } from './Icon';
import { Media } from './Media';

// Schematic map: places are projected from real latitude/longitude
// (lon 64-82°E, lat 41-54.5°N), but there is no country border outline.
const W = 640;
const H = 700;
const proj = (lon: number, lat: number) => ({ x: ((lon - 64) / 18) * W, y: ((54.5 - lat) / 13.5) * H });

const hubs: Record<Hub, { x: number; y: number }> = {
  astana: proj(71.45, 51.17),
  almaty: proj(76.89, 43.24),
  turkestan: proj(68.25, 43.3),
};

const spots: Record<TourId, { x: number; y: number; label: L; dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }> = {
  burabay: { ...proj(70.3, 53.08), label: { en: 'Burabay', zh: '布拉拜' }, dx: -14, dy: 4, anchor: 'end' },
  charyn: { ...proj(79.08, 43.35), label: { en: 'Charyn', zh: '查伦' }, dx: 14, dy: -6, anchor: 'start' },
  kolsai: { ...proj(78.32, 42.93), label: { en: 'Kolsai · Kaindy', zh: '科尔赛' }, dx: 10, dy: 26, anchor: 'start' },
  turkestan: { ...proj(68.25, 43.3), label: { en: 'Turkestan', zh: '突厥斯坦' }, dx: 0, dy: 34, anchor: 'middle' },
};

// Lake Balkhash, very roughly, as a landmark.
const balkhash = [
  [73.5, 46.6], [74.6, 46.2], [75.6, 46.4], [76.5, 46.5], [77.4, 46.2], [78.3, 46.4], [79.1, 46.7],
  [79.2, 46.9], [78.2, 46.7], [77.2, 46.6], [76.0, 46.9], [75.0, 46.8], [74.0, 46.95], [73.4, 46.8],
].map(([lo, la]) => proj(lo, la));

const line = (a: { x: number; y: number }, b: { x: number; y: number }) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
const curve = (a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const nx = -(b.y - a.y) * bend;
  const ny = (b.x - a.x) * bend;
  return `M${a.x} ${a.y} Q${mx + nx} ${my + ny} ${b.x} ${b.y}`;
};

export function RouteMap({ highlight, className = '', interactive = true }: { highlight?: TourId[]; className?: string; interactive?: boolean }) {
  const { t, lang } = useApp();
  const [active, setActive] = useState<TourId | null>(null);
  const on = (id: TourId) => !highlight || highlight.includes(id);
  const tour = active ? tourById(active)! : null;

  const tourLink = (id: TourId) => (tourById(id)!.hub === 'almaty' ? line(hubs.almaty, spots[id]) : id === 'burabay' ? line(hubs.astana, spots.burabay) : '');

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-line bg-surface ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={t({ en: 'Schematic map of tour locations in Kazakhstan', zh: '哈萨克斯坦线路位置示意图' })}>
        <defs>
          <pattern id="rm-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgb(var(--line))" />
          </pattern>
          <linearGradient id="rm-steppe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--gold))" stopOpacity="0.05" />
            <stop offset="1" stopColor="rgb(var(--gold))" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#rm-steppe)" />
        <rect width={W} height={H} fill="url(#rm-grid)" />
        {/* Tien Shan foothills, south-east */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const x = 330 + i * 34;
          const y = 640 - (i % 3) * 6;
          return <path key={i} d={`M${x} ${y} l14 -22 l14 22`} fill="none" stroke="rgb(var(--muted))" strokeOpacity="0.35" strokeWidth="2" />;
        })}
        <text x="470" y="672" textAnchor="middle" className="fill-muted font-mono" fontSize="12" letterSpacing="2">
          {lang === 'zh' ? '天山' : 'TIEN SHAN'}
        </text>
        {/* Lake Balkhash */}
        <path d={`M${balkhash.map((p) => `${p.x} ${p.y}`).join(' L')} Z`} fill="rgb(var(--teal))" fillOpacity="0.25" stroke="rgb(var(--teal))" strokeOpacity="0.5" />
        <text x={proj(76.2, 47.6).x} y={proj(76.2, 47.6).y} textAnchor="middle" className="fill-muted font-mono" fontSize="11" letterSpacing="1">
          {lang === 'zh' ? '巴尔喀什湖' : 'Lake Balkhash'}
        </text>
        {/* From China, east */}
        <path d={`M${W - 6} ${hubs.almaty.y - 70} Q ${W - 70} ${hubs.almaty.y - 70} ${hubs.almaty.x + 22} ${hubs.almaty.y - 12}`} fill="none" stroke="rgb(var(--gold))" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
        <text x={W - 12} y={hubs.almaty.y - 82} textAnchor="end" className="fill-gold font-mono" fontSize="12" fontWeight="700">
          {lang === 'zh' ? '← 来自中国' : '← from China'}
        </text>
        {/* Domestic transfers */}
        {[
          [hubs.almaty, hubs.astana],
          [hubs.almaty, hubs.turkestan],
          [hubs.turkestan, hubs.astana],
        ].map(([a, b], i) => (
          <path key={i} d={curve(a, b, i === 1 ? -0.12 : 0.12)} fill="none" stroke="rgb(var(--ink))" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="6 7" />
        ))}
        {/* Tour legs */}
        {(['charyn', 'kolsai', 'burabay'] as TourId[]).map((id) => (
          <path key={id} d={tourLink(id)} stroke="rgb(var(--teal))" strokeOpacity={on(id) ? 1 : 0.25} strokeWidth="4" strokeLinecap="round" />
        ))}
        {/* Hubs */}
        {(Object.keys(hubs) as Hub[]).map((h) => {
          const p = hubs[h];
          const labelBelow = h === 'astana';
          return (
            <g key={h}>
              <circle cx={p.x} cy={p.y} r="11" fill="rgb(var(--night))" stroke="rgb(var(--surface))" strokeWidth="3" />
              <circle cx={p.x} cy={p.y} r="4" fill="rgb(var(--gold))" />
              {h !== 'turkestan' && (
                <text x={p.x + (labelBelow ? 18 : -16)} y={p.y + (labelBelow ? 26 : -16)} textAnchor={labelBelow ? 'start' : 'end'} className="fill-ink font-display" fontSize="19" fontWeight="800">
                  {t(hubName[h])}
                </text>
              )}
            </g>
          );
        })}
        {/* Pin pulses: separate from the buttons so their hit area stays still */}
        <g pointerEvents="none" aria-hidden>
          {(Object.keys(spots) as TourId[]).filter(on).map((id) => (
            <circle key={id} cx={spots[id].x} cy={spots[id].y} r="22" fill="rgb(var(--teal))" opacity="0.18" className="pin-pulse" />
          ))}
        </g>
        {/* Tour pins */}
        {(Object.keys(spots) as TourId[]).map((id) => {
          const s = spots[id];
          const isOn = on(id);
          const isActive = active === id;
          return (
            <g
              key={id}
              opacity={isOn ? 1 : 0.35}
              className={interactive ? 'cursor-pointer' : ''}
              onClick={interactive ? () => setActive(isActive ? null : id) : undefined}
              onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActive(isActive ? null : id)) : undefined}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? t(tourById(id)!.name) : undefined}
              aria-pressed={interactive ? isActive : undefined}
            >
              {/* Generous invisible touch target around pin and label */}
              <circle cx={s.x} cy={s.y + s.dy / 2} r="30" fill="transparent" />
              <circle cx={s.x} cy={s.y} r={isActive ? 13 : 10} fill="rgb(var(--teal))" stroke="rgb(var(--surface))" strokeWidth="3" />
              <text x={s.x + s.dx} y={s.y + s.dy} textAnchor={s.anchor} className="fill-ink font-display" fontSize="16" fontWeight="700">
                {t(s.label)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full bg-surface/90 px-2 py-1">{t({ en: 'Schematic map', zh: '示意图' })}</span>
        <span className="flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1">
          <span className="h-1 w-4 rounded bg-teal" /> {t({ en: 'Tour', zh: '线路' })}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1">
          <span className="h-0 w-4 border-t-2 border-dashed border-ink/40" /> {t({ en: 'Domestic transfer', zh: '国内交通' })}
        </span>
      </div>

      {tour && (
        <div className="rise absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[14px] border-2 border-edge bg-surface p-2.5 shadow-hard">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl">
            <Media tour={tour.id} credit={false} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{t(tour.name)}</div>
            <div className="text-xs text-muted">
              {tour.days} {t({ en: 'days', zh: '天' })} · <span className="num">{kzt(tour.priceKzt)}</span> · <span className="num">{indicative(tour.priceKzt, lang)}</span>
            </div>
          </div>
          <a href={href(`/tour/${tour.id}`)} className="btn-primary btn-sm shrink-0" aria-label={t(tour.name)}>
            <Icon name="arrow" size={15} />
          </a>
        </div>
      )}
    </div>
  );
}
