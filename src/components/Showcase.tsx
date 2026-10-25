import { useEffect, useRef, useState } from 'react';
import { ui } from '../data/i18n';
import { tours } from '../data/tours';
import { indicative, kzt } from '../lib/format';
import { href } from '../lib/router';
import { useApp } from '../state';
import { Icon } from './Icon';
import { Media } from './Media';

const calm = () =>
  typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver);

/** Fanned stack of destination cards that rotates on its own (pauses on hover/focus). */
export function DestinationDeck() {
  const { t, lang } = useApp();
  const [idx, setIdx] = useState(1);
  const [paused, setPaused] = useState(false);
  const n = tours.length;

  useEffect(() => {
    if (paused || calm()) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % n), 4500);
    return () => window.clearInterval(id);
  }, [paused, n]);

  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {tours.map((tour, i) => {
        const pos = (i - idx + n) % n;
        const style =
          pos === 0
            ? 'z-30 rotate-[-3deg] opacity-100'
            : pos === 1
              ? 'z-20 translate-x-10 -translate-y-6 rotate-[5deg] scale-[0.93] opacity-90'
              : pos === 2
                ? 'z-10 translate-x-16 -translate-y-10 rotate-[11deg] scale-[0.86] opacity-60'
                : 'z-0 scale-[0.8] opacity-0';
        return (
          <a
            key={tour.id}
            href={href(`/tour/${tour.id}`)}
            tabIndex={pos === 0 ? 0 : -1}
            aria-hidden={pos !== 0}
            className={`grain absolute inset-0 overflow-hidden rounded-[28px] border-[6px] border-[#fbf6ea] bg-night shadow-2xl transition-all duration-700 ease-out ${style}`}
          >
            <Media tour={tour.id} credit={pos === 0} eager={i < 2} />
            <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-16 text-white">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/75">
                {tour.days} {t(ui.tour.days)} · {t(tour.region)}
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold leading-tight">{t(tour.name)}</div>
              <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                <span>
                  <span className="num font-semibold">{kzt(tour.priceKzt)}</span>{' '}
                  <span className="num text-white/70">{indicative(tour.priceKzt, lang)}</span>
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-tealInk">
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            </div>
          </a>
        );
      })}
      <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2" role="tablist" aria-label={t({ en: 'Destinations', zh: '目的地' })}>
        {tours.map((tour, i) => (
          <button
            key={tour.id}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={t(tour.name)}
            onClick={() => setIdx(i)}
            className={`h-2.5 rounded-full transition-all ${i === idx ? 'w-8 bg-gold' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Number that counts up once when scrolled into view. */
export function CountUp({ to, suffix = '', prefix = '', plain = false }: { to: number; suffix?: string; prefix?: string; plain?: boolean }) {
  const [v, setV] = useState(() => (calm() ? to : 0));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (calm() || !ref.current || !('IntersectionObserver' in window)) {
      setV(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1200);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref} className="num">
      {prefix}
      {to >= 1000 && !plain ? v.toLocaleString('en-US') : v}
      {suffix}
    </span>
  );
}
