import { useEffect, useState } from 'react';
import { interestText, ui } from '../data/i18n';
import { hubName } from '../data/tours';
import type { InclusionItem, Tour } from '../data/types';
import { indicative, kzt } from '../lib/format';
import { href } from '../lib/router';
import { speak, stopSpeaking } from '../lib/speech';
import { useApp } from '../state';
import { Icon } from './Icon';
import { Media } from './Media';
import { Tag } from './Tag';

export function TourCard({ tour }: { tour: Tour }) {
  const { t, lang } = useApp();
  return (
    <article className="card group flex flex-col overflow-hidden">
      <a href={href(`/tour/${tour.id}`)} className="grain relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden>
        <div className="h-full w-full transition duration-700 group-hover:scale-[1.05]">
          <Media tour={tour.id} credit={false} />
        </div>
        <span className="absolute left-3 top-3 z-[2] rounded-full bg-night/80 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-nightInk backdrop-blur">
          {tour.days} {t(ui.tour.days)}
        </span>
        <span className="absolute right-3 top-3 z-[2] flex gap-1">
          {tour.bestFor.slice(0, 2).map((b) => (
            <span key={b} className="rounded-full bg-white/85 px-2 py-0.5 text-[10.5px] font-semibold text-night">
              {t(interestText[b])}
            </span>
          ))}
        </span>
      </a>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted">
          <span>
            {tour.days} {t(ui.tour.days)}
          </span>
          <span aria-hidden>·</span>
          <span>
            {t(ui.tour.starts)} {t(hubName[tour.hub])}
          </span>
        </div>
        <h3 className="text-xl font-bold">
          <a href={href(`/tour/${tour.id}`)} className="hover:text-teal">
            {t(tour.name)}
          </a>
        </h3>
        <p className="text-sm text-muted">{t(tour.tagline)}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
          <div>
            <div className="num whitespace-nowrap text-lg font-semibold">{kzt(tour.priceKzt)}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {t(ui.tour.perPerson)} · <span className="num">{indicative(tour.priceKzt, lang)}</span>
              <Tag kind="demo" />
            </div>
          </div>
          <a href={href(`/tour/${tour.id}`)} className="btn-dark btn-sm shrink-0">
            {t(ui.tour.view)} <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}

const groups = [
  { key: 'included', dot: 'bg-ok', label: ui.tour.included },
  { key: 'optional', dot: 'bg-teal', label: ui.tour.optional },
  { key: 'notIncluded', dot: 'bg-danger', label: ui.tour.notIncluded },
  { key: 'unconfirmed', dot: 'bg-warn', label: ui.tour.unconfirmed },
] as const;

export function Inclusions({ tour }: { tour: Tour }) {
  const { t } = useApp();
  const [open, setOpen] = useState<Record<string, boolean>>({ included: true });
  const allOpen = groups.every((g) => open[g.key]);
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{t(ui.tour.whatsIncludedSub)}</p>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setOpen(Object.fromEntries(groups.map((g) => [g.key, !allOpen])))}
        >
          {allOpen ? t(ui.tour.closeAll) : t(ui.tour.openAll)}
        </button>
      </div>
      <div className="divide-y divide-line">
        {groups.map((g) => {
          const items: InclusionItem[] = tour.inclusions[g.key];
          const isOpen = !!open[g.key];
          const panelId = `inc-${tour.id}-${g.key}`;
          return (
            <div key={g.key}>
              <button
                type="button"
                className="flex w-full items-center gap-3 py-3 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
              >
                <span className={`h-3 w-3 shrink-0 rounded-full ${g.dot}`} aria-hidden />
                <span className="flex-1 font-semibold">{t(g.label)}</span>
                <span className="num rounded-full bg-surface2 px-2 text-xs text-muted">{items.length}</span>
                <Icon name="chevronDown" className={`transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <ul id={panelId} className="mb-3 space-y-2 pl-6">
                  {items.map((it, i) => (
                    <li key={i} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-sm">
                      <span className="flex items-start gap-2">
                        <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${g.dot}`} aria-hidden />
                        {t(it.label)}
                      </span>
                      {it.priceKzt ? (
                        <span className="num whitespace-nowrap text-muted">+{kzt(it.priceKzt)}</span>
                      ) : g.key === 'unconfirmed' ? (
                        <Tag kind="confirm" />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Itinerary({ tour }: { tour: Tour }) {
  const { t } = useApp();
  const [open, setOpen] = useState(0);
  return (
    <ol className="card divide-y divide-line">
      {tour.itinerary.map((d, i) => (
        <li key={i}>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-night text-xs text-nightInk">{i + 1}</span>
            <span className="flex-1 font-semibold">{t(d.title)}</span>
            <Icon name="chevronDown" className={`transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <ul className="space-y-1.5 px-4 pb-4 pl-[3.75rem] text-sm text-muted sm:px-5 sm:pl-[3.75rem]">
              {d.items.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <Icon name="chevron" size={14} className="mt-1 text-teal" />
                  {t(it)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

export function PackingList({ tour }: { tour: Tour }) {
  const { t } = useApp();
  const [done, setDone] = useState<boolean[]>(() => tour.packing.map(() => false));
  useEffect(() => setDone(tour.packing.map(() => false)), [tour.id, tour.packing]);
  const count = done.filter(Boolean).length;
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="num text-sm font-semibold" aria-live="polite">
          {count} {t(ui.tour.of)} {tour.packing.length} {t(ui.tour.packed)}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2" aria-hidden>
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(count / tour.packing.length) * 100}%` }} />
        </div>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {tour.packing.map((p, i) => (
          <li key={i}>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface2">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[rgb(var(--teal))]"
                checked={done[i] ?? false}
                onChange={() => setDone((d) => d.map((x, j) => (j === i ? !x : x)))}
              />
              <span className={done[i] ? 'text-muted line-through' : ''}>{t(p)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AudioGuide({ tour }: { tour: Tour }) {
  const { t, lang } = useApp();
  const [voice, setVoice] = useState<'zh' | 'en'>(lang);
  const [playing, setPlaying] = useState<number | null>(null);
  const [fallback, setFallback] = useState<number | null>(null);
  useEffect(() => setVoice(lang), [lang]);
  useEffect(() => () => stopSpeaking(), []);

  const play = async (i: number) => {
    if (playing === i) {
      stopSpeaking();
      setPlaying(null);
      return;
    }
    setFallback(null);
    setPlaying(i);
    const res = await speak(tour.audio[i].text[voice], voice === 'zh' ? 'zh-CN' : 'en-US', () => setPlaying((p) => (p === i ? null : p)));
    if (res !== 'ok') {
      setPlaying(null);
      setFallback(i);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-night px-4 py-3 text-nightInk sm:px-5">
        <div className="flex items-center gap-2">
          <Icon name="volume" />
          <span className="font-semibold">{t(ui.audio.title)}</span>
        </div>
        <div role="group" aria-label={t(ui.audio.voiceLang)} className="flex rounded-full bg-white/10 p-0.5 text-xs">
          {(['zh', 'en'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={voice === v}
              onClick={() => {
                stopSpeaking();
                setPlaying(null);
                setFallback(null);
                setVoice(v);
              }}
              className={`min-h-[32px] rounded-full px-3 font-semibold ${voice === v ? 'bg-teal text-tealInk' : 'text-nightInk/80'}`}
            >
              {v === 'zh' ? '中文' : 'English'}
            </button>
          ))}
        </div>
      </div>
      <ol className="divide-y divide-line">
        {tour.audio.map((a, i) => (
          <li key={i} className="px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => play(i)}
                aria-label={`${playing === i ? t(ui.audio.stop) : t(ui.audio.play)}: ${a.title[voice]}`}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${playing === i ? 'bg-gold text-night' : 'bg-teal text-tealInk'}`}
              >
                <Icon name={playing === i ? 'stop' : 'play'} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11px] uppercase tracking-wide text-muted">Stop {i + 1}</div>
                <div className="font-semibold">{a.title[voice]}</div>
              </div>
              {playing === i && <span className="text-xs text-teal">{t(ui.audio.playing)}</span>}
            </div>
            {(fallback === i || playing === i) && (
              <div className="mt-2 rounded-lg bg-surface2 p-3 text-sm" aria-live="polite">
                {fallback === i && (
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-warn">
                    <Icon name="info" size={15} /> {t(ui.audio.noVoice)}
                  </p>
                )}
                <p lang={voice === 'zh' ? 'zh-CN' : 'en'}>{a.text[voice]}</p>
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
        <Tag kind="proposal" />
        {t(ui.audio.offline)}
      </div>
    </div>
  );
}
