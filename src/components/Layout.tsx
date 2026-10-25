import { useEffect, useRef, useState, type ReactNode } from 'react';
import { tagExplain, tagText, ui } from '../data/i18n';
import { href } from '../lib/router';
import { useApp } from '../state';
import { useChat } from './Chat';
import { Icon, type IconName } from './Icon';
import { Tag, allTagKinds } from './Tag';

const navItems: { to: string; key: keyof typeof ui.nav; icon: IconName }[] = [
  { to: '/tours', key: 'tours', icon: 'compass' },
  { to: '/plan', key: 'plan', icon: 'route' },
  { to: '/ask', key: 'ask', icon: 'chat' },
  { to: '/trust', key: 'trust', icon: 'shieldCheck' },
  { to: '/trip', key: 'trip', icon: 'map' },
  { to: '/impact', key: 'impact', icon: 'chart' },
];

export function Logo({ compact = false, sub = false }: { compact?: boolean; sub?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <circle cx="15" cy="12" r="6.5" fill="#F2B33D" />
        <path d="M2 21.5h26" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M6 26h18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[18px] font-bold" style={{ fontStretch: '112%' }}>
            Saryarqa Go
          </span>
          {sub && <span className="mt-1 block text-xs text-muted">by Saryarqa Routes, Astana</span>}
        </span>
      )}
    </span>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useApp();
  return (
    <div role="group" aria-label={t(ui.nav.language)} className="flex rounded-[10px] border border-line bg-surface p-0.5 text-sm">
      {(['en', 'zh'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-[34px] rounded-[8px] px-3 font-semibold ${lang === l ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
        >
          {l === 'en' ? 'EN' : '中文'}
        </button>
      ))}
    </div>
  );
}

function TextToggle() {
  const { large, setLarge, t } = useApp();
  return (
    <button
      type="button"
      onClick={() => setLarge(!large)}
      aria-pressed={large}
      title={t(ui.nav.largeText)}
      aria-label={t(ui.nav.largeText)}
      className={`min-h-[38px] min-w-[38px] rounded-[10px] border px-2.5 font-display text-sm font-bold ${large ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink hover:border-ink/30'}`}
    >
      A+
    </button>
  );
}

export function Header({ current }: { current: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [current]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const active = (to: string) => current === to.slice(1) || (to === '/tours' && current === 'tour');

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <a href={href('/')} className="rounded-lg" aria-label="Saryarqa Go home">
          <Logo />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((n) => (
            <a
              key={n.to}
              href={href(n.to)}
              aria-current={active(n.to) ? 'page' : undefined}
              className={`relative px-3 py-2 text-[15px] font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[2px] after:rounded-full ${active(n.to) ? 'text-ink after:bg-teal' : 'text-muted hover:text-ink after:bg-transparent'}`}
            >
              {t(ui.nav[n.key])}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <LangToggle />
            <TextToggle />
          </div>
          <a href={href('/book')} className="btn-primary btn-sm hidden xl:inline-flex">
            {t({ en: 'Book', zh: '预订' })} <Icon name="arrow" size={14} />
          </a>
          <button
            type="button"
            className="flex min-h-[42px] items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 text-sm font-semibold lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
            {t(ui.nav.menu)}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t(ui.nav.menu)} id="mobile-menu">
          <button type="button" className="absolute inset-0 bg-night/60" aria-label={t(ui.nav.close)} onClick={() => setOpen(false)} />
          <div className="rise absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-4 overflow-y-auto bg-bg p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)} autoFocus>
                <Icon name="x" /> {t(ui.nav.close)}
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {[{ to: '/', key: 'about' as const, icon: 'compass' as IconName, home: true }, ...navItems, { to: '/postcard', key: 'postcard' as const, icon: 'image' as IconName }, { to: '/about', key: 'about' as const, icon: 'info' as IconName }].map((n, i) => (
                <a
                  key={n.to + i}
                  href={href(n.to)}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-3 text-base font-semibold ${active(n.to) || (n.to === '/' && current === '') ? 'bg-ink text-bg' : 'hover:bg-surface2'}`}
                >
                  <Icon name={n.icon} />
                  {'home' in n ? t(ui.common.home) : t(ui.nav[n.key])}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
              <LangToggle />
              <TextToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-8 py-10 md:grid-cols-[1.2fr_2fr]">
        <div className="space-y-3">
          <Logo sub />
          <p className="max-w-sm text-sm text-muted">{t(ui.common.prototype)}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a className="underline-offset-4 hover:underline" href={href('/about')}>{t(ui.nav.about)}</a>
            <a className="underline-offset-4 hover:underline" href={href('/impact')}>{t(ui.nav.impact)}</a>
            <a className="underline-offset-4 hover:underline" href={href('/postcard')}>{t(ui.nav.postcard)}</a>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t(ui.common.legend)}</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {allTagKinds.map((k) => (
              <li key={k} className="flex items-start gap-2 text-sm">
                <Tag kind={k} className="mt-0.5 shrink-0" />
                <span className="text-muted">{t(tagExplain[k])}</span>
              </li>
            ))}
            <li className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0 rounded border border-ink/40 px-1.5 py-px text-[11px] font-semibold">TEST MODE</span>
              <span className="text-muted">
                {t({ en: 'Payments are simulated. No card numbers or passport data are collected.', zh: '支付为模拟，不收集卡号或护照信息。' })}
              </span>
            </li>
          </ul>
          <p className="sr-only">{allTagKinds.map((k) => t(tagText[k])).join(', ')}</p>
        </div>
      </div>
    </footer>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] lg:bottom-6 flex flex-col items-center gap-2 px-4">
      {toasts.map((x) => (
        <div key={x.id} className="rise pointer-events-auto flex max-w-md items-start gap-2 rounded-[10px] bg-ink px-4 py-3 text-sm text-bg shadow-card">
          <Icon name="check" className="mt-0.5" />
          <span>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

/** The closed loop Discover → … → Share. `current` marks the active step on loop pages. */
export function LoopStrip({ current, compact = false }: { current?: number; compact?: boolean }) {
  const { t } = useApp();
  const steps = ui.loop.steps;
  if (compact)
    return (
      <nav aria-label={t(ui.loop.title)} className="no-print max-w-full overflow-x-auto no-scrollbar">
        <ol className="flex min-w-max items-center gap-1 text-sm">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1">
              <a
                href={href(s.route)}
                aria-current={current === i ? 'step' : undefined}
                className={`rounded-md px-1.5 py-1 ${current === i ? 'font-semibold text-ink underline decoration-teal decoration-2 underline-offset-[6px]' : 'text-muted hover:text-ink'}`}
              >
                {t(s.label)}
              </a>
              {i < steps.length - 1 && <span className="text-line" aria-hidden>/</span>}
            </li>
          ))}
          <li className="flex items-center pl-1 text-muted" title={t({ en: 'Back to Discover', zh: '回到发现' })}>
            <Icon name="refresh" size={14} />
          </li>
        </ol>
      </nav>
    );
  return (
    <div>
      <ol className="relative grid gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
        <span className="absolute left-0 right-0 top-[11px] hidden h-px bg-line lg:block" aria-hidden />
        {steps.map((s) => (
          <li key={s.key} className="relative">
            <a href={href(s.route)} className="group block pr-4">
              <span className="relative z-[1] mb-4 hidden h-[23px] w-[23px] place-items-center rounded-full border-2 border-teal bg-bg lg:grid" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-teal transition group-hover:scale-150" />
              </span>
              <span className="block font-display text-2xl font-bold transition-colors group-hover:text-teal" style={{ fontStretch: '112%' }}>
                {t(s.label)}
              </span>
              <span className="mt-1 block text-[15px] text-muted">{t(s.text)}</span>
            </a>
          </li>
        ))}
      </ol>
      <svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="mt-6 hidden h-12 w-full text-teal lg:block" aria-hidden>
        <path d="M985 4 C 985 46, 960 52, 900 52 L 100 52 C 40 52, 15 46, 15 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 6" vectorEffect="non-scaling-stroke" />
        <path d="M9 18 L15 6 L21 18" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-2 flex items-center gap-2 text-[15px] text-muted lg:-mt-9 lg:justify-center lg:bg-transparent">
        <span className="bg-bg px-3">{t(ui.loop.sub)}</span>
      </p>
    </div>
  );
}

export function PageHead({ eyebrow, title, sub, children, loop }: { eyebrow?: ReactNode; title: string; sub?: string; children?: ReactNode; loop?: number }) {
  return (
    <div className="container-x pt-6 sm:pt-8">
      {loop !== undefined && (
        <div className="mb-5">
          <LoopStrip compact current={loop} />
        </div>
      )}
      {eyebrow && <div className="eyebrow mb-3 flex flex-wrap items-center gap-2">{eyebrow}</div>}
      <h1 className="max-w-3xl text-[2rem] font-extrabold sm:text-5xl">{title}</h1>
      {sub && <p className="mt-3 max-w-[60ch] text-lg text-muted">{sub}</p>}
      {children && <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Section({ title, sub, children, id, right }: { title: string; sub?: string; children: ReactNode; id?: string; right?: ReactNode }) {
  return (
    <section id={id} className="container-x mt-20 sm:mt-28" data-reveal>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="max-w-3xl text-[1.75rem] font-extrabold sm:text-4xl">{title}</h2>
          {sub && <p className="mt-3 max-w-[60ch] text-lg text-muted">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function TestModeBanner() {
  const { t } = useApp();
  return (
    <div className="test-stripes rounded-[10px] p-[3px]" role="status">
      <div className="flex items-center gap-2 rounded-[8px] bg-night px-3 py-2 text-sm font-semibold text-nightInk">
        <Icon name="lock" size={15} className="text-warn" />
        {t(ui.book.testMode)}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 12, label, id }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; id: string }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-labelledby={id}>
      <button type="button" className="btn-ghost h-11 w-11 !p-0" aria-label={`${label} −1`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Icon name="minus" />
      </button>
      <output aria-live="polite" className="num w-10 text-center text-lg font-semibold">{value}</output>
      <button type="button" className="btn-ghost h-11 w-11 !p-0" aria-label={`${label} +1`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

const mobileItems: { to: string; key: keyof typeof ui.nav; icon: IconName; chat?: boolean }[] = [
  { to: '/tours', key: 'tours', icon: 'compass' },
  { to: '/plan', key: 'plan', icon: 'route' },
  { to: '/ask', key: 'ask', icon: 'chat', chat: true },
  { to: '/trust', key: 'trust', icon: 'shieldCheck' },
  { to: '/trip', key: 'trip', icon: 'map' },
];

/** Thumb-friendly tab bar on phones. "Ask" opens the concierge drawer in place. */
export function MobileNav({ current }: { current: string }) {
  const { t } = useApp();
  const { openChat } = useChat();
  return (
    <nav aria-label="Quick" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {mobileItems.map((n) => {
          const active = current === n.to.slice(1) || (n.to === '/tours' && current === 'tour');
          const cls = `flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? 'text-teal' : 'text-muted'}`;
          const inner = (
            <>
              <span className={`grid h-8 w-12 place-items-center rounded-[10px] transition ${active ? 'bg-teal/12' : ''}`}>
                <Icon name={n.icon} size={20} />
              </span>
              {t(ui.nav[n.key])}
            </>
          );
          return (
            <li key={n.to}>
              {n.chat && current !== 'ask' ? (
                <button type="button" className={cls} onClick={() => openChat()}>
                  {inner}
                </button>
              ) : (
                <a href={href(n.to)} className={cls} aria-current={active ? 'page' : undefined}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop: floating concierge button + back-to-top. */
export function FloatingActions({ current }: { current: string }) {
  const { t } = useApp();
  const { openChat } = useChat();
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinel.current || !('IntersectionObserver' in window)) return;
    // Sentinel sits 900px down the page; once it has scrolled above the viewport, show "back to top".
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, []);
  return (
    <>
    <div ref={sentinel} aria-hidden className="pointer-events-none absolute left-0 top-[900px] h-px w-px" />
    <div className={`no-print fixed right-4 z-30 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6 ${current === 'tour' ? 'bottom-[calc(9rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(5rem+env(safe-area-inset-bottom))]'}`}>
      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rise grid h-11 w-11 place-items-center rounded-[10px] border border-line bg-surface text-ink shadow-card hover:border-ink/30"
          aria-label={t({ en: 'Back to top', zh: '回到顶部' })}
        >
          <Icon name="arrow" className="-rotate-90" />
        </button>
      )}
      {current !== 'ask' && (
        <button
          type="button"
          onClick={() => openChat()}
          className="fab hidden items-center gap-2.5 rounded-[12px] bg-ink py-2.5 pl-3 pr-4 text-[15px] font-semibold text-bg shadow-card transition hover:-translate-y-0.5 lg:flex"
        >
          <Icon name="chat" size={20} />
          {t({ en: 'Ask in EN or 中文', zh: '中英文咨询' })}
        </button>
      )}
    </div>
    </>
  );
}
