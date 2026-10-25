import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/Layout';
import { Tag } from '../components/Tag';
import { guides } from '../data/guides';
import { ui } from '../data/i18n';
import { tourById } from '../data/tours';
import type { Guide, L, TagKind } from '../data/types';
import { useApp } from '../state';

const SLIDE_MS = 4000;

function captions(g: Guide): L[] {
  return [
    { en: `Hi, I’m ${g.name}.`, zh: `你好，我是${g.name}。` },
    { en: g.role.en, zh: g.role.zh },
    g.intro,
    { en: `I speak ${g.languages.map((l) => l.en).join(', ')}.`, zh: `我会说${g.languages.map((l) => l.zh).join('、')}。` },
    { en: `I lead: ${g.tours.map((id) => tourById(id)!.name.en).join(' · ')}`, zh: `我带的线路：${g.tours.map((id) => tourById(id)!.name.zh).join(' · ')}` },
    { en: 'Book a 5-minute call with me before you pay.', zh: '付款前可以和我预约5分钟视频通话。' },
  ];
}

function GuideVideo({ guide }: { guide: Guide }) {
  const { t } = useApp();
  const caps = captions(guide);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    setIdx(-1);
    setPlaying(false);
  }, [guide.id]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      if (idx >= caps.length - 1) {
        setPlaying(false);
        setIdx(caps.length);
      } else setIdx(idx + 1);
    }, idx < 0 ? 50 : SLIDE_MS);
    return () => window.clearTimeout(timer.current);
  }, [playing, idx, caps.length]);

  const ended = idx >= caps.length;
  const progress = idx < 0 ? 0 : Math.min(1, (idx + 1) / caps.length);

  return (
    <div className="overflow-hidden rounded-2xl bg-night text-nightInk">
      <div className="relative grid aspect-video place-items-center overflow-hidden">
        <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`vg-${guide.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d3560" />
              <stop offset="1" stopColor="#0e7f7a" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill={`url(#vg-${guide.id})`} />
          <path d="M0 140 L60 96 L100 118 L150 70 L200 112 L250 86 L320 128 V180 H0Z" fill="#0b1830" opacity="0.5" />
          <circle cx="160" cy="76" r="30" fill="#e7d3b0" opacity="0.18" />
          <path d="M112 180 C116 132 204 132 208 180Z" fill="#e7d3b0" opacity="0.18" />
        </svg>
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-gold/70 bg-night/60 font-display text-xl font-extrabold">{guide.initials}</span>
          {idx >= 0 && !ended ? (
            <p key={idx} className="caption-in max-w-md font-display text-lg font-semibold sm:text-xl" aria-live="polite">
              {t(caps[idx])}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIdx(-1);
                setPlaying(true);
              }}
              className="btn-primary"
            >
              <Icon name="play" /> {ended ? t(ui.trust.replay) : t(ui.trust.play)}
            </button>
          )}
        </div>
        {playing && (
          <button type="button" onClick={() => setPlaying(false)} className="absolute right-3 top-3 z-10 rounded-full bg-night/70 px-3 py-1.5 text-xs font-semibold">
            <Icon name="pause" size={14} className="mr-1 inline" /> {t(ui.trust.pause)}
          </button>
        )}
        {!playing && idx >= 0 && !ended && (
          <button type="button" onClick={() => setPlaying(true)} className="absolute right-3 top-3 z-10 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-tealInk">
            <Icon name="play" size={14} className="mr-1 inline" /> {t(ui.trust.play)}
          </button>
        )}
      </div>
      <div className="h-1 bg-white/10">
        <div className="h-full bg-gold transition-all duration-700" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-nightInk/75">
        <span>{t(ui.trust.videoNote)}</span>
        <span className="num">0:{String(Math.round(progress * 60)).padStart(2, '0')} / 1:00</span>
      </div>
    </div>
  );
}

export default function Trust() {
  const { t, toast } = useApp();
  const [gid, setGid] = useState(guides[0].id);
  const guide = guides.find((g) => g.id === gid)!;
  const [call, setCall] = useState({ guide: guides[0].id, time: '', app: 'WeChat video', sent: false, err: '' });

  const submitCall = (e: FormEvent) => {
    e.preventDefault();
    if (!call.time) {
      setCall({ ...call, err: t({ en: 'Choose a preferred time.', zh: '请选择期望时间。' }) });
      return;
    }
    setCall({ ...call, sent: true, err: '' });
    toast(t(ui.trust.callSent));
  };

  const checklist: { label: L; tag: TagKind; extra?: L; ok: boolean }[] = [
    { label: ui.trust.founded, tag: 'case', ok: true },
    { label: ui.trust.staff, tag: 'case', ok: true },
    { label: ui.trust.travelers, tag: 'case', ok: true },
    { label: ui.trust.reg, tag: 'confirm', extra: ui.trust.docPending, ok: false },
    { label: ui.trust.licence, tag: 'confirm', extra: ui.trust.docPending, ok: false },
    { label: ui.trust.insurance, tag: 'confirm', extra: ui.trust.docPending, ok: false },
    { label: ui.trust.guideChecks, tag: 'proposal', ok: false },
  ];

  return (
    <>
      <PageHead loop={2} title={t(ui.trust.title)} sub={t(ui.trust.sub)} />

      <div className="container-x mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-4 sm:p-5" aria-labelledby="meet">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="meet" className="text-xl font-bold">{t(ui.trust.meet)}</h2>
              <p className="text-sm text-muted">{t(ui.trust.meetSub)}</p>
            </div>
            <Tag kind="demo" />
          </div>
          <GuideVideo guide={guide} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t(ui.trust.meet)}>
            {guides.map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={gid === g.id}
                onClick={() => setGid(g.id)}
                className={`rounded-xl border p-3 text-left transition ${gid === g.id ? 'border-teal bg-teal/10' : 'border-line bg-surface hover:border-teal/60'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night font-display text-sm font-bold text-nightInk">{g.initials}</span>
                  <div className="min-w-0">
                    <div className="font-semibold">{g.name}</div>
                    <div className="truncate text-xs text-muted">{t(g.role)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-line bg-surface2/60 p-4 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-bold">{guide.name}</span>
              <Tag kind="demo" extra={t(ui.trust.sample)} />
            </div>
            <dl className="grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wide text-muted">{t(ui.trust.languages)}</dt>
                <dd>{guide.languages.map((l) => t(l)).join(', ')}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wide text-muted">{t(ui.trust.specialties)}</dt>
                <dd>{guide.specialties.map((l) => t(l)).join(', ')}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wide text-muted">{t(ui.trust.based)}</dt>
                <dd>{t(guide.base)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="card p-4 sm:p-5" aria-labelledby="call">
          <div className="mb-1 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal text-tealInk">
              <Icon name="video" />
            </span>
            <div>
              <h2 id="call" className="text-xl font-bold">{t(ui.trust.callTitle)}</h2>
              <p className="text-sm text-muted">{t(ui.trust.callSub)}</p>
            </div>
          </div>
          <div className="mb-4 mt-2"><Tag kind="proposal" /></div>
          {call.sent ? (
            <div className="rise rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm" role="status">
              <p className="flex items-center gap-2 font-semibold text-ok">
                <Icon name="check" /> {t(ui.trust.callSent)}
              </p>
              <button type="button" className="btn-ghost btn-sm mt-3" onClick={() => setCall({ ...call, sent: false })}>
                {t({ en: 'Request another', zh: '再次申请' })}
              </button>
            </div>
          ) : (
            <form onSubmit={submitCall} className="space-y-3" noValidate>
              <div>
                <label className="label" htmlFor="c-guide">{t(ui.trust.callGuide)}</label>
                <select id="c-guide" className="input" value={call.guide} onChange={(e) => setCall({ ...call, guide: e.target.value })}>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} · {t(g.role)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="c-time">{t(ui.trust.callTime)}</label>
                <input
                  id="c-time"
                  type="datetime-local"
                  className={`input ${call.err ? 'input-error' : ''}`}
                  value={call.time}
                  onChange={(e) => setCall({ ...call, time: e.target.value, err: '' })}
                  aria-invalid={!!call.err}
                  aria-describedby={call.err ? 'c-time-err' : undefined}
                />
                {call.err && <p id="c-time-err" className="mt-1 text-sm text-danger">{call.err}</p>}
              </div>
              <fieldset>
                <legend className="label">{t(ui.trust.callApp)}</legend>
                <div className="flex flex-wrap gap-2">
                  {['WeChat video', 'WhatsApp video', 'Zoom'].map((a) => (
                    <label key={a} className={`chip cursor-pointer ${call.app === a ? '!border-teal !bg-teal/10 !text-teal' : ''}`}>
                      <input type="radio" name="app" className="sr-only" checked={call.app === a} onChange={() => setCall({ ...call, app: a })} />
                      {a === 'WeChat video' ? t({ en: 'WeChat video', zh: '微信视频' }) : a}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="btn-primary w-full">
                <Icon name="calendar" /> {t(ui.trust.callRequest)}
              </button>
            </form>
          )}
        </section>
      </div>

      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-4 sm:p-5" aria-labelledby="check">
          <h2 id="check" className="text-xl font-bold">{t(ui.trust.checklist)}</h2>
          <p className="mb-4 text-sm text-muted">{t(ui.trust.checklistSub)}</p>
          <ul className="divide-y divide-line">
            {checklist.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${c.ok ? 'bg-ok/15 text-ok' : 'border border-dashed border-warn text-warn'}`}>
                  <Icon name={c.ok ? 'check' : 'clock'} size={15} />
                </span>
                <span className="min-w-0 flex-1 font-medium">{t(c.label)}</span>
                <Tag kind={c.tag} extra={c.extra ? t(c.extra) : undefined} />
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card overflow-hidden" aria-labelledby="refund">
            <div className="bg-night p-4 text-nightInk sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Icon name="shieldCheck" className="text-teal" />
                <h2 id="refund" className="text-xl font-bold">{t(ui.trust.refund)}</h2>
                <Tag kind="proposal" className="!border-gold/60" />
              </div>
              <p className="mt-1 text-sm text-nightInk/80">{t(ui.trust.refundSub)}</p>
            </div>
            <ul className="space-y-2.5 p-4 text-sm sm:p-5">
              {[
                [ui.trust.refund14, 'bg-ok', '100%'],
                [ui.trust.refund4, 'bg-warn', '50%'],
                [ui.trust.refund0, 'bg-danger', '0%'],
                [ui.trust.refundWeather, 'bg-teal', '↻'],
              ].map(([l, c, v], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`num grid h-9 w-12 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white ${c}`}>{v as string}</span>
                  {t(l as L)}
                </li>
              ))}
            </ul>
          </section>

          <section className="card flex items-start gap-3 border-danger/40 p-4 sm:p-5" aria-labelledby="sos">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-danger font-display text-lg font-extrabold text-white">112</span>
            <div>
              <h2 id="sos" className="font-bold">{t(ui.trust.emergency)}</h2>
              <p className="text-sm">{t(ui.trust.emergencyText)}</p>
              <div className="mt-2"><Tag kind="confirm" extra={t({ en: 'team to cite official source', zh: '团队需补充官方来源' })} /></div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
