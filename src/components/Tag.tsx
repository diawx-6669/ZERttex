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
