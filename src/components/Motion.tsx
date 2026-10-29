import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useApp } from '../state';
import { Icon } from './Icon';

// Small motion pieces. All of them render their final state at once when motion is
// off (reduced motion, automation): see html.motion in main.tsx / index.css.

export const motionOn = () => typeof document !== 'undefined' && document.documentElement.classList.contains('motion');

/** Number that counts up when it scrolls into view. Keeps prefix/suffix: "~25", "3,400", "15.7 million". */
export function CountUp({ value, className = '' }: { value: string; className?: string }) {
  const m = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  const target = m ? Number(m[2].replace(/,/g, '')) : NaN;
  const decimals = m && m[2].includes('.') ? m[2].split('.')[1].length : 0;
  const comma = !!m && m[2].includes(',');
  const isYear = !comma && !decimals && target >= 1900 && target <= 2100;
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!m || !Number.isFinite(target) || !motionOn() || !('IntersectionObserver' in window)) return;
    const from = isYear ? target - 30 : 0;
    const fmt = (n: number) => `${m[1]}${comma ? Math.round(n).toLocaleString('en-US') : n.toFixed(decimals)}${m[3]}`;
    setShown(fmt(from));
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1400);
        const eased = 1 - Math.pow(2, -10 * p);
        setShown(fmt(from + (target - from) * (p === 1 ? 1 : eased)));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setShown(value);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span ref={ref} className={`num ${className}`} aria-label={value}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

/** Infinite ticker. Items are rendered twice so the loop is seamless. */
export function Marquee({ items, reverse = false, className = '' }: { items: ReactNode[]; reverse?: boolean; className?: string }) {
  const row = (k: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={k === 'b'}>
      {items.map((it, i) => (
        <span key={k + i} className="flex items-center gap-6 whitespace-nowrap px-3 py-1 leading-[1.15]">
          {it}
          <span className="text-[0.7em]" aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={`marquee ${reverse ? 'reverse' : ''}`}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}

/** Mouse parallax for a block: sets --mx / --my (−1..1) on it; children with .parallax move. */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOn() || window.matchMedia('(pointer: coarse)').matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
      el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2));
      el.style.setProperty('--sx', `${e.clientX - r.left}px`);
      el.style.setProperty('--sy', `${e.clientY - r.top}px`);
    };
    const leave = () => (el.style.setProperty('--mx', '0'), el.style.setProperty('--my', '0'));
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => (el.removeEventListener('pointermove', move), el.removeEventListener('pointerleave', leave));
  }, []);
  return ref;
}

/** 3D tilt + glare for cards. Spread the returned handlers on the card (class "tilt"). */
export const tiltHandlers = {
  onMouseMove: (e: MouseEvent<HTMLElement>) => {
    if (!motionOn()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  },
  onMouseLeave: (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  },
};

/** Thin progress bar under the header + "scrolled" class on the header. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const p = h.scrollHeight > h.clientHeight ? h.scrollTop / (h.scrollHeight - h.clientHeight) : 0;
        ref.current?.style.setProperty('--scroll', String(p));
        document.querySelector('header')?.classList.toggle('scrolled', h.scrollTop > 8);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => (window.removeEventListener('scroll', on), window.removeEventListener('resize', on), cancelAnimationFrame(raf));
  }, []);
  return <div ref={ref} className="scroll-bar pointer-events-none fixed inset-x-0 top-0 z-[45] h-1 bg-sun" aria-hidden />;
}

/** One burst of confetti in the brand colours (motion only). */
export function Confetti() {
  const [on, setOn] = useState(true);
  const [pieces] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      x: (Math.random() - 0.5) * 260,
      r: 360 + Math.random() * 720,
      d: Math.random() * 0.5,
      t: 2 + Math.random() * 1.4,
      c: ['rgb(var(--sun))', 'rgb(var(--teal))', 'rgb(var(--pink))', 'rgb(var(--ok))', 'rgb(var(--surface))'][i % 5],
    })),
  );
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), 4200);
    return () => window.clearTimeout(id);
  }, []);
  if (!on || !motionOn()) return null;
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.c, '--x': `${p.x}px`, '--r': `${p.r}deg`, '--d': `${p.d}s`, '--t': `${p.t}s` } as CSSProperties} />
      ))}
    </div>
  );
}

// Hero chat: a short conversation that plays itself. Every number is a real demo price.
const SCRIPT = [
  { q: '查伦峡谷两个人多少钱？', a: '每人 54,000 坚戈，两人共 108,000 坚戈。门票待确认。', ok: '价格核对通过' },
  { q: '科尔赛湖包含门票吗？', a: '国家公园门票尚未确认，公司会在出发前书面确认。', ok: '只用已核实数据' },
  { q: '能给我打个七折吗？', a: '抱歉，我不能承诺折扣。需要的话，我帮您转人工经理。', ok: '不编造价格' },
];

/** The hero chat bubble: question pops in, typing dots, answer types out, check badge pops. Loops. */
export function LiveChatDemo() {
  const { t } = useApp();
  const animate = motionOn();
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<'q' | 'typing' | 'a' | 'done'>(animate ? 'q' : 'done');
  const [chars, setChars] = useState(animate ? 0 : SCRIPT[0].a.length);
  const s = SCRIPT[n];
  useEffect(() => {
    if (!animate) return;
    let id: number;
    if (phase === 'q') id = window.setTimeout(() => setPhase('typing'), 700);
    else if (phase === 'typing') id = window.setTimeout(() => (setChars(0), setPhase('a')), 1100);
    else if (phase === 'a') {
      if (chars < s.a.length) id = window.setTimeout(() => setChars((c) => c + 1), 45);
      else id = window.setTimeout(() => setPhase('done'), 250);
    } else id = window.setTimeout(() => (setN((x) => (x + 1) % SCRIPT.length), setChars(0), setPhase('q')), 3600);
    return () => window.clearTimeout(id);
  }, [animate, phase, chars, s.a.length]);
  return (
    <div className="rounded-[14px] border-2 border-edge bg-surface p-3 text-[13px] shadow-hard" aria-hidden>
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-ok" /></span>
        Live AI · 中文
      </div>
      <p key={`q${n}`} className="pop-in ml-auto w-fit rounded-[10px] rounded-br-sm border-2 border-edge bg-teal px-2.5 py-1.5 text-tealInk" lang="zh-CN">{s.q}</p>
      <div className="mt-2 min-h-[52px]">
        {phase === 'typing' ? (
          <p className="typing w-fit rounded-[10px] rounded-bl-sm border-2 border-edge bg-surface2 px-3 py-1 text-xl leading-none text-muted"><span>•</span><span>•</span><span>•</span></p>
        ) : phase !== 'q' ? (
          <p className={`rounded-[10px] rounded-bl-sm border-2 border-edge bg-surface2 px-2.5 py-1.5 ${phase === 'a' ? 'caret' : ''}`} lang="zh-CN">{s.a.slice(0, chars)}</p>
        ) : null}
      </div>
      <p key={`ok${n}${phase === 'done'}`} className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-ok ${phase === 'done' ? 'pop-in' : 'invisible'}`}>
        <Icon name="shieldCheck" size={12} /> {s.ok} <span className="font-normal text-muted">· {t({ en: 'checked by code', zh: '代码核对' })}</span>
      </p>
    </div>
  );
}

/** Seats sticker that counts down 12 → 4 on load. */
export function SeatsCountdown({ to = 4, of = 12 }: { to?: number; of?: number }) {
  const { t } = useApp();
  const [n, setN] = useState(motionOn() ? of : to);
  useEffect(() => {
    if (n <= to) return;
    const id = window.setTimeout(() => setN((x) => x - 1), n === of ? 1400 : 120);
    return () => window.clearTimeout(id);
  }, [n, to, of]);
  return <>{t({ en: `${n} of ${of} seats left`, zh: `剩 ${n} / ${of} 个名额` })}</>;
}
