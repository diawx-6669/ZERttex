import { useState, type FormEvent } from 'react';
import { sampleReviews, type Review } from '../data/reviews';
import type { TourId } from '../data/types';
import { aiLive, callAi, validateTranslation } from '../lib/ai';
import { fmtDate } from '../lib/format';
import { useApp } from '../state';
import { Icon } from './Icon';
import { AiTag, Scope, Tag } from './Tag';

// Reviews only from people who went: writing needs a booking code for this tour, and a
// review is published after the trip date. Shown in the reader's language with the
// original one tap away. Sample reviews are Demo data and say so.

type Mine = Review & { pendingUntil: string; aiTranslated: boolean };
const KEY = (tour: TourId) => `sg.reviews.${tour}`;
const readMine = (tour: TourId): Mine[] => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY(tour)) ?? '[]');
  } catch {
    return [];
  }
};

const langName = { zh: '中文', en: 'English', ru: 'Русский' };

function Stars({ n }: { n: number }) {
  return (
    <span className="text-sm tracking-tight" aria-label={`${n} / 5`}>
      {'★★★★★'.slice(0, n)}
      <span className="text-line">{'★★★★★'.slice(n)}</span>
    </span>
  );
}

function ReviewCard({ r, mine }: { r: Review; mine?: Mine }) {
  const { t, lang } = useApp();
  const translated = r.lang !== lang;
  const [orig, setOrig] = useState(false);
  const shown = orig || !translated ? (r.text[r.lang] ?? r.text.en) : r.text[lang];
  return (
    <li className="card-flat flex flex-col p-4" data-testid="review">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold">{r.name} <span className="text-sm font-normal text-muted">· {r.from}</span></div>
          <Stars n={r.stars} />
        </div>
        <span className="inline-flex items-center gap-1 rounded-[8px] border-2 border-ok px-1.5 py-0.5 text-[11px] font-bold text-ok" title={t({ en: 'Written with a booking code after the trip', zh: '行程结束后凭预订编号撰写' })}>
          <Icon name="shieldCheck" size={12} /> {t({ en: 'Went on this trip', zh: '已参加此行程' })}
        </span>
      </div>
      <p className="mt-2 flex-1 text-[15px]" lang={orig || !translated ? (r.lang === 'zh' ? 'zh-CN' : r.lang) : lang === 'zh' ? 'zh-CN' : 'en'}>{shown}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-mono">{r.code} · {r.month}</span>
        {translated && (
          <button type="button" className="font-semibold text-teal underline-offset-2 hover:underline" onClick={() => setOrig(!orig)}>
            {orig ? t({ en: 'Show translation', zh: '显示翻译' }) : t({ en: `Translated from ${langName[r.lang]} · show original`, zh: `译自${langName[r.lang]} · 查看原文` })}
          </button>
        )}
        {mine?.aiTranslated && translated && !orig && <AiTag />}
      </div>
      {mine && <p className="mt-2 rounded-[8px] bg-sun/40 px-2 py-1 text-xs font-semibold">{t({ en: `Your review · published after your trip (${fmtDate(mine.pendingUntil, 'en')})`, zh: `您的评价 · 行程结束后发布（${fmtDate(mine.pendingUntil, 'zh')}）` })}</p>}
    </li>
  );
}

export function Reviews({ tour }: { tour: TourId }) {
  const { t, lang, booking } = useApp();
  const [mine, setMine] = useState<Mine[]>(() => readMine(tour));
  const [code, setCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [err, setErr] = useState('');
  const [text, setText] = useState('');
  const [stars, setStars] = useState<Review['stars']>(5);
  const [busy, setBusy] = useState(false);
  const list = sampleReviews.filter((r) => r.tour === tour);
  const avg = list.reduce((s, r) => s + r.stars, 0) / Math.max(1, list.length);
  const myItem = booking?.items.find((i) => i.tourId === tour);

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (booking && myItem && code.trim().toUpperCase() === booking.code) {
      setUnlocked(true);
      setErr('');
    } else setErr(t({ en: 'No booking for this tour with that code.', zh: '找不到此线路对应的预订编号。' }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!booking || !myItem || text.trim().length < 10) return;
    setBusy(true);
    const from = lang;
    const to = lang === 'zh' ? 'en' : 'zh';
    const tr = aiLive() ? await callAi('translate', { from, to, text: text.trim() }, validateTranslation) : null;
    const r: Mine = {
      tour,
      name: booking.name.trim().split(/\s+/)[0] || 'Traveler',
      from: booking.country || '—',
      lang: from,
      stars,
      code: booking.code,
      month: new Date().toISOString().slice(0, 7),
      text: { [from]: text.trim(), [to]: tr?.text ?? text.trim() } as Review['text'],
      pendingUntil: myItem.date,
      aiTranslated: !!tr,
    };
    const next = [r, ...mine];
    setMine(next);
    try {
      window.localStorage.setItem(KEY(tour), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setText('');
    setBusy(false);
  };

  return (
    <section aria-labelledby="rev-h" data-testid="reviews">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 id="rev-h" className="text-xl font-bold">{t({ en: 'Reviews from people who went', zh: '真实出行者的评价' })}</h2>
        <Scope phase="mvp" />
        <Tag kind="demo" extra={t({ en: 'sample reviews written by the team', zh: '团队编写的示例评价' })} />
      </div>
      <p className="mb-3 text-sm text-muted">
        <span className="font-semibold text-ink">{avg.toFixed(1)} ★</span> · {t({ en: 'Only travelers with a booking code can review, after their trip. Shown in your language; the original is one tap away.', zh: '只有持预订编号的旅客在行程结束后才能评价。以您的语言显示，可一键查看原文。' })}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {mine.map((r, i) => <ReviewCard key={`m${i}`} r={r} mine={r} />)}
        {list.map((r) => <ReviewCard key={r.code} r={r} />)}
      </ul>

      <div className="card-flat mt-3 p-4">
        {!unlocked ? (
          <form onSubmit={check} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label className="label" htmlFor={`rev-code-${tour}`}>{t({ en: 'Went on this trip? Enter your booking code to review', zh: '参加过此行程？输入预订编号即可评价' })}</label>
              <input id={`rev-code-${tour}`} className={`input font-mono uppercase ${err ? 'input-error' : ''}`} placeholder="SG-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button type="submit" className="btn-dark" disabled={!code.trim()}>{t({ en: 'Check', zh: '验证' })}</button>
            {err && <p className="w-full text-sm text-danger">{err}</p>}
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-1" role="radiogroup" aria-label={t({ en: 'Rating', zh: '评分' })}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button key={n} type="button" role="radio" aria-checked={stars === n} onClick={() => setStars(n)} className={`text-2xl ${n <= stars ? 'text-ink' : 'text-line'}`}>★</button>
              ))}
            </div>
            <label className="label sr-only" htmlFor={`rev-text-${tour}`}>{t({ en: 'Your review', zh: '您的评价' })}</label>
            <textarea id={`rev-text-${tour}`} className="input min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} placeholder={t({ en: 'What should the next traveler know?', zh: '想告诉下一位旅客什么？' })} />
            <button type="submit" className="btn-primary" disabled={busy || text.trim().length < 10}>{busy ? '…' : t({ en: 'Publish after my trip', zh: '行程结束后发布' })}</button>
          </form>
        )}
      </div>
    </section>
  );
}
