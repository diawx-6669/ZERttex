import { useEffect, useState, type ReactNode } from 'react';
import { tagExplain, tagText, ui } from '../data/i18n';
import { href } from '../lib/router';
import { useApp } from '../state';
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

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#12213f" />
        <path d="M4 24 L12 12 L17 19 L21 14 L28 24Z" fill="#20b2aa" />
        <circle cx="23" cy="9" r="3" fill="#c9a24a" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-extrabold tracking-tight">Saryarqa Go</span>
          <span className="block font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">by Saryarqa Routes</span>
        </span>
      )}
    </span>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useApp();
  return (
    <div role="group" aria-label={t(ui.nav.language)} className="flex rounded-full border border-line bg-surface p-0.5 text-sm">
      {(['en', 'zh'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-[34px] rounded-full px-3 font-semibold ${lang === l ? 'bg-night text-nightInk' : 'text-muted hover:text-ink'}`}
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
      className={`min-h-[38px] min-w-[38px] rounded-full border px-2.5 font-display text-sm font-bold ${large ? 'border-teal bg-teal text-tealInk' : 'border-line bg-surface text-ink hover:bg-surface2'}`}
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
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <a href={href('/')} className="rounded-lg" aria-label="Saryarqa Go home">
          <Logo />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navItems.map((n) => (
            <a
              key={n.to}
              href={href(n.to)}
              aria-current={active(n.to) ? 'page' : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ${active(n.to) ? 'bg-night text-nightInk' : 'text-ink/80 hover:bg-surface2 hover:text-ink'}`}
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
          <button
            type="button"
            className="flex min-h-[42px] items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold lg:hidden"
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold ${active(n.to) || (n.to === '/' && current === '') ? 'bg-night text-nightInk' : 'hover:bg-surface2'}`}
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
    <footer className="mt-20 border-t border-line bg-surface2/60">
      <div className="container-x grid gap-8 py-10 md:grid-cols-[1.2fr_2fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted">{t(ui.common.prototype)}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a className="underline-offset-4 hover:underline" href={href('/about')}>{t(ui.nav.about)}</a>
            <a className="underline-offset-4 hover:underline" href={href('/impact')}>{t(ui.nav.impact)}</a>
            <a className="underline-offset-4 hover:underline" href={href('/postcard')}>{t(ui.nav.postcard)}</a>
          </div>
        </div>
        <div>
          <h2 className="eyebrow mb-3">{t(ui.common.legend)}</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {allTagKinds.map((k) => (
              <li key={k} className="flex flex-wrap items-center gap-2 text-sm">
                <Tag kind={k} />
                <span className="text-muted">{t(tagExplain[k])}</span>
              </li>
            ))}
            <li className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase">TEST MODE</span>
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
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((x) => (
        <div key={x.id} className="rise pointer-events-auto flex max-w-md items-start gap-2 rounded-2xl bg-night px-4 py-3 text-sm text-nightInk shadow-2xl">
          <Icon name="check" className="mt-0.5 text-teal" />
          <span>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

const loopIcons: IconName[] = ['compass', 'route', 'shieldCheck', 'card', 'map', 'share'];

/** The closed loop DISCOVER → … → SHARE. `current` highlights the active step on loop pages. */
export function LoopStrip({ current, compact = false }: { current?: number; compact?: boolean }) {
  const { t } = useApp();
  const steps = ui.loop.steps;
  if (compact)
    return (
      <nav aria-label={t(ui.loop.title)} className="no-print -mx-4 overflow-x-auto px-4 pb-1">
        <ol className="flex min-w-max items-center gap-1.5">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <a
                href={href(s.route)}
                aria-current={current === i ? 'step' : undefined}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${current === i ? 'border-teal bg-teal text-tealInk' : 'border-line bg-surface text-muted hover:text-ink'}`}
              >
                <span>{i + 1}</span>
                {t(s.label)}
              </a>
              {i < steps.length - 1 && <Icon name="chevron" size={12} className="text-muted" />}
            </li>
          ))}
          <li className="flex items-center gap-1 pl-1 font-mono text-[11px] text-muted">
            <Icon name="refresh" size={12} /> 1
          </li>
        </ol>
      </nav>
    );
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map((s, i) => (
        <li key={s.key} className="relative">
          <a
            href={href(s.route)}
            className="group flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-teal hover:shadow-card"
          >
            <span className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-night text-nightInk group-hover:bg-teal group-hover:text-tealInk">
                <Icon name={loopIcons[i]} />
              </span>
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
            </span>
            <span className="font-display text-lg font-bold">{t(s.label)}</span>
            <span className="text-sm text-muted">{t(s.text)}</span>
            {i === steps.length - 1 && (
              <span className="mt-auto flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-teal">
                <Icon name="refresh" size={13} /> → 01 {t(steps[0].label)}
              </span>
            )}
          </a>
        </li>
      ))}
    </ol>
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
      {eyebrow && <div className="eyebrow mb-2 flex flex-wrap items-center gap-2">{eyebrow}</div>}
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {sub && <p className="mt-2 max-w-2xl text-muted">{sub}</p>}
      {children && <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Section({ title, sub, children, id, right }: { title: string; sub?: string; children: ReactNode; id?: string; right?: ReactNode }) {
  return (
    <section id={id} className="container-x mt-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
          {sub && <p className="mt-1 max-w-2xl text-muted">{sub}</p>}
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
    <div className="test-stripes rounded-xl p-1" role="status">
      <div className="flex items-center gap-2 rounded-lg bg-night px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-nightInk">
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
