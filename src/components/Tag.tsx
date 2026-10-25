import { tagExplain, tagText } from '../data/i18n';
import type { TagKind } from '../data/types';
import { useApp } from '../state';

const style: Record<TagKind, string> = {
  case: 'bg-night text-nightInk border-night',
  verified: 'bg-ok/10 text-ok border-ok/40',
  proposal: 'bg-gold/15 text-gold border-gold/45',
  demo: 'bg-teal/10 text-teal border-teal/40',
  confirm: 'bg-warn/10 text-warn border-warn/45 border-dashed',
};

const dot: Record<TagKind, string> = {
  case: 'bg-gold',
  verified: 'bg-ok',
  proposal: 'bg-gold',
  demo: 'bg-teal',
  confirm: 'bg-warn',
};

/** One of exactly five honesty labels. `extra` appends a short note, e.g. "· document to be provided". */
export function Tag({ kind, extra, className = '' }: { kind: TagKind; extra?: string; className?: string }) {
  const { t } = useApp();
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-full border px-2 py-0.5 align-middle font-mono text-[10.5px] font-semibold uppercase leading-tight tracking-wide ${style[kind]} ${className}`}
      title={t(tagExplain[kind])}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[kind]}`} aria-hidden />
      <span>
        {t(tagText[kind])}
        {extra ? <span className="normal-case tracking-normal"> · {extra}</span> : null}
      </span>
    </span>
  );
}

export const allTagKinds: TagKind[] = ['case', 'verified', 'proposal', 'demo', 'confirm'];
