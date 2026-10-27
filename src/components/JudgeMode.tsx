import { useEffect, useSyncExternalStore } from 'react';
import { navigate } from '../lib/router';
import { useApp } from '../state';
import { Icon } from './Icon';

// "Judge mode": a guided 2-minute walk through the closed loop for the live demo.
// Each step opens a page, scrolls to one element and highlights it.

type Step = { route: string; selector: string; title: string; text: string };

const steps: Step[] = [
  { route: '/', selector: '#complaints', title: '1 · The problem', text: 'Four sentences from foreign guests (Case fact). Each one stops a booking before payment.' },
  { route: '/tour/kolsai', selector: '#inc', title: '2 · Discover', text: 'Every tour splits costs into four lists. "Not yet confirmed" is shown before the traveler pays.' },
  { route: '/ask', selector: '[role="log"]', title: '3 · Verify: concierge', text: 'Answers in English or 中文 from verified data only, hands hard questions to a person.' },
  { route: '/trust', selector: '#meet', title: '4 · Verify: trust', text: 'Meet the guide on video, request a call, see what is verified and what is not yet.' },
  { route: '/book?tour=kolsai', selector: 'main form', title: '5 · Book', text: 'Three steps, foreign card on the provider’s page. TEST MODE: no money moves.' },
  { route: '/manager', selector: '[data-testid="inbox-list"]', title: '6 · Staff side', text: 'Handoffs land here with a Russian summary and a draft the manager must approve.' },
  { route: '/postcard', selector: '[data-testid="postcard"]', title: '7 · Share', text: 'A real QR code opens the tour with the friend’s referral code: the loop starts again.' },
  { route: '/impact', selector: '[data-testid="staged-spending"]', title: '8 · Money', text: '20,000,000 KZT cap in two gates; payback month 32 (base) and 44 (−30%).' },
];

let current: number | null = null;
const subs = new Set<() => void>();
const set = (v: number | null) => {
  current = v;
  subs.forEach((f) => f());
};
export const startJudgeMode = () => set(0);
const useStep = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => current);

export function JudgeMode() {
  const { t } = useApp();
  const i = useStep();
  const step = i === null ? null : steps[i];

  useEffect(() => {
    if (!step) return;
    navigate(step.route);
    let el: Element | null = null;
    const timer = window.setTimeout(() => {
      el = document.querySelector(step.selector) ?? document.querySelector('main h1');
      el?.classList.add('judge-hl');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);
    return () => {
      window.clearTimeout(timer);
      el?.classList.remove('judge-hl');
    };
  }, [step]);

  useEffect(() => {
    if (i === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') set(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i]);

  if (!step || i === null) return null;
  return (
    <div role="dialog" aria-label={t({ en: 'Judge mode', zh: '评委模式' })} data-testid="judge-mode" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[58] mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-2xl lg:bottom-6">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{t({ en: 'Judge mode', zh: '评委模式' })} · {i + 1}/{steps.length}</span>
        <button type="button" className="rounded px-2 py-1 hover:bg-surface2" onClick={() => set(null)} aria-label={t({ en: 'Exit judge mode', zh: '退出评委模式' })}>
          <Icon name="x" size={14} />
        </button>
      </div>
      <div className="font-display text-lg font-bold" data-testid="judge-title">{step.title}</div>
      <p className="mt-1 text-sm text-muted">{step.text}</p>
      <div className="mt-3 flex justify-between gap-2">
        <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => set(i - 1)}>{t({ en: 'Back', zh: '上一步' })}</button>
        {i < steps.length - 1 ? (
          <button type="button" className="btn-primary btn-sm" onClick={() => set(i + 1)}>{t({ en: 'Next', zh: '下一步' })} <Icon name="arrow" size={14} /></button>
        ) : (
          <button type="button" className="btn-primary btn-sm" onClick={() => set(null)}>{t({ en: 'Finish', zh: '完成' })}</button>
        )}
      </div>
    </div>
  );
}
