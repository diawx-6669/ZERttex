import { tagExplain, tagText } from '../data/i18n';
import type { TagKind } from '../data/types';
import { useApp } from '../state';

const style: Record<TagKind, string> = {
  case: 'border-ink/70 bg-ink text-bg',
  verified: 'border-ok/45 text-ok',
  proposal: 'border-gold/50 text-gold',
  demo: 'border-teal/45 text-teal',
  confirm: 'border-warn/60 border-dashed text-warn',
};

/** One of exactly five honesty labels. `extra` appends a short note, e.g. "· document to be provided". */
export function Tag({ kind, extra, className = '' }: { kind: TagKind; extra?: string; className?: string }) {
  const { t } = useApp();
  return (
    <span
      className={`inline-flex w-fit max-w-full items-center whitespace-normal rounded border px-1.5 py-px align-middle text-[11px] font-semibold leading-tight ${style[kind]} ${className}`}
      title={t(tagExplain[kind])}
    >
      <span>
        {t(tagText[kind])}
        {extra ? <span className="normal-case tracking-normal"> · {extra}</span> : null}
      </span>
    </span>
  );
}

export const allTagKinds: TagKind[] = ['case', 'verified', 'proposal', 'demo', 'confirm'];

/**
 * Scope badge: built in the 12-week MVP, or Phase 2 (after the pilot).
 * Pill-shaped so it is never confused with the five square honesty labels.
 */
export function Scope({ phase, className = '' }: { phase: 'mvp' | 'p2'; className?: string }) {
  const { t } = useApp();
  const text = phase === 'mvp' ? { en: 'In MVP', zh: 'MVP 范围内' } : { en: 'Phase 2', zh: '第二阶段' };
  const tip =
    phase === 'mvp'
      ? { en: 'Built in the 12-week MVP.', zh: '在 12 周 MVP 内完成。' }
      : { en: 'Shown in the prototype, but built after the pilot.', zh: '原型中可演示，但在试点之后开发。' };
  return (
    <span
      data-scope={phase}
      title={t(tip)}
      className={`inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-px align-middle text-[11px] font-semibold leading-tight ${
        phase === 'mvp' ? 'border-ok/50 bg-ok/10 text-ok' : 'border-dashed border-muted/60 text-muted'
      } ${className}`}
    >
      {phase === 'mvp' ? '●' : '○'} {t(text)}
    </span>
  );
}
