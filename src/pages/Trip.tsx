import { useMemo, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { PageHead } from '../components/Layout';
import { Media } from '../components/Media';
import { Tag } from '../components/Tag';
import { ui } from '../data/i18n';
import { tourById } from '../data/tours';
import type { L, Tour } from '../data/types';
import { copyText, fmtDate } from '../lib/format';
import { href, navigate } from '../lib/router';
import { addDays } from '../lib/tripBuilder';
import { defaultTripDate, useApp } from '../state';

type Cond = 'clear' | 'rain' | 'road' | 'snow';

const condInfo: Record<Cond, { icon: IconName; label: L; impact: (t: Tour) => L; disrupt: boolean }> = {
  clear: {
    icon: 'sun',
    label: ui.trip.clear,
    disrupt: false,
    impact: () => ({ en: 'No impact. The tour runs as planned.', zh: '无影响，行程按计划进行。' }),
  },
  rain: {
    icon: 'rain',
    label: ui.trip.rain,
    disrupt: true,
    impact: (t) =>
      t.hub === 'almaty'
        ? { en: 'Trails and dirt roads become slippery. The guide may shorten hikes; the day can be moved.', zh: '步道和土路湿滑，导游可能缩短徒步；当天行程可改期。' }
        : { en: 'Outdoor walks may be shortened. Indoor alternatives are offered.', zh: '户外步行可能缩短，将提供室内替代方案。' },
  },
  road: {
    icon: 'road',
    label: ui.trip.road,
    disrupt: true,
    impact: () => ({ en: 'The access road is closed. This day cannot run. Free reschedule under the proposed policy.', zh: '进出道路封闭，当天行程无法进行。按提案政策可免费改期。' }),
  },
  snow: {
    icon: 'snow',
    label: ui.trip.snow,
    disrupt: true,
    impact: (t) =>
      t.id === 'kolsai'
        ? { en: 'Mountain road to Saty and Kaindy may be unsafe. Reschedule recommended.', zh: '前往萨特村和凯恩迪湖的山路可能不安全，建议改期。' }
        : { en: 'Cold and slippery paths. Warm clothes needed; the guide decides on the day.', zh: '天气寒冷、道路湿滑，需备保暖衣物；由导游当天决定。' },
  },
};

export default function Trip() {
  const { t, lang, booking, toast } = useApp();
  const sample = !booking;
  const item = booking?.items[0] ?? { tourId: 'kolsai' as const, date: defaultTripDate() };
  const tour = tourById(item.tourId || 'kolsai')!;
  const code = booking?.code ?? 'SG-7KQ2';

  const stages = useMemo(() => {
    const s: { title: L; when: string; icon: IconName; text: L }[] = [
      { title: { en: 'Booking confirmed', zh: '预订已确认' }, when: fmtDate(addDays(item.date, -21), lang), icon: 'check', text: { en: `Code ${code}. Money held until the tour starts.`, zh: `编号 ${code}，款项托管至行程开始。` } },
      { title: { en: 'Pre-trip briefing', zh: '行前说明' }, when: fmtDate(addDays(item.date, -3), lang), icon: 'info', text: { en: 'Meeting point, weather check, packing list, guide’s phone.', zh: '集合地点、天气检查、行李清单、导游电话。' } },
      { title: { en: 'Meet your guide', zh: '与导游会合' }, when: fmtDate(item.date, lang), icon: 'users', text: { en: 'Pick-up in the start city in the morning.', zh: '早上在出发城市接您。' } },
    ];
    for (let d = 1; d <= tour.days; d++)
      s.push({
        title: { en: `Day ${d} check-in`, zh: `第${d}天报平安` },
        when: fmtDate(addDays(item.date, d - 1), lang),
        icon: 'pin',
        text: { en: `Tap "I’m OK" in the evening. Guide confirms the group is safe.`, zh: '晚上点击"我很好"，导游确认全团平安。' },
      });
    s.push({ title: { en: 'Return', zh: '返程' }, when: fmtDate(addDays(item.date, tour.days - 1), lang), icon: 'flag', text: { en: 'Back in the start city. Family sharing ends automatically.', zh: '返回出发城市，家人分享自动结束。' } });
    return s;
  }, [item.date, tour.days, lang, code]);

  const [now, setNow] = useState(0);
  const [family, setFamily] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cond, setCond] = useState<Cond>('clear');
  const [alt, setAlt] = useState<string>('');
  const [requested, setRequested] = useState(false);
  const done = now >= stages.length - 1;
  const shareLink = `https://go.saryarqa.example/family/${code}-${tour.id}`;
  const altDates = [3, 7, 14].map((n) => addDays(item.date, n));
  const ci = condInfo[cond];

  const lastCheckin = (() => {
    const idx = Math.min(now, stages.length - 1);
    if (idx < 3) return t({ en: 'Trip not started yet.', zh: '行程尚未开始。' });
    if (done) return t({ en: 'Back home. Sharing ended.', zh: '已返程，分享已结束。' });
    const day = idx - 2;
    return t({ en: `Day ${day} · checked in at 19:10 · all OK`, zh: `第${day}天 · 19:10已报平安 · 一切正常` });
  })();

  return (
    <>
      <PageHead loop={4} scope="p2" title={t(ui.trip.title)}>
        {sample && (
          <span className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-gold/15 px-3 py-2 text-sm">
            <Icon name="info" size={15} className="text-gold" /> {t(ui.trip.sample)} <Tag kind="demo" />
            <a href={href('/tours')} className="font-semibold text-teal underline">{t(ui.home.ctaTours)}</a>
          </span>
        )}
      </PageHead>

      <div className="container-x mt-6">
        <div className="card flex flex-wrap items-center gap-4 overflow-hidden p-0">
          <div className="h-28 w-full sm:h-24 sm:w-40">
            <Media tour={tour.id} credit={false} />
          </div>
          <div className="min-w-0 flex-1 px-4 pb-4 sm:p-0">
            <div className="text-xs text-muted">{code}</div>
            <div className="font-display text-xl font-bold">{t(tour.name)}</div>
            <div className="text-sm text-muted">
              {fmtDate(item.date, lang)} · {tour.days} {t(ui.tour.days)}
              {booking && booking.items.length > 1 && ` · +${booking.items.length - 1}`}
            </div>
          </div>
          <a href={href(`/tour/${tour.id}`)} className="btn-ghost btn-sm mx-4 mb-4 sm:mb-0">
            <Icon name="volume" size={15} /> {t(ui.audio.title)}
          </a>
        </div>
      </div>

      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="card p-4 sm:p-5" aria-labelledby="tl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="tl" className="text-xl font-bold">{t(ui.trip.timeline)}</h2>
            <div className="flex gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={() => setNow(Math.min(stages.length - 1, now + 1))} disabled={done}>
                <Icon name="clock" size={15} /> {t(ui.trip.advance)}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setNow(0)} aria-label={t(ui.trip.restart)}>
                <Icon name="refresh" size={15} />
              </button>
            </div>
          </div>
          <ol className="relative space-y-1" aria-live="polite">
            {stages.map((s, i) => {
              const state = i < now ? 'done' : i === now ? 'now' : 'next';
              return (
                <li key={i} className="relative flex gap-3 pb-3">
                  {i < stages.length - 1 && <span className={`absolute left-[17px] top-9 h-[calc(100%-24px)] w-0.5 ${i < now ? 'bg-teal' : 'bg-line'}`} aria-hidden />}
                  <span
                    className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${state === 'done' ? 'border-teal bg-teal text-tealInk' : state === 'now' ? 'border-gold bg-gold text-night' : 'border-line bg-surface text-muted'}`}
                  >
                    <Icon name={state === 'done' ? 'check' : s.icon} size={16} />
                  </span>
                  <div className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${state === 'now' ? 'bg-gold/15' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${state === 'next' ? 'text-muted' : ''}`}>{t(s.title)}</span>
                      {state === 'now' && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-night">{t(ui.trip.now)}</span>}
                    </div>
                    <div className="font-mono text-[11px] text-muted">{s.when}</div>
                    {state !== 'next' && <p className="mt-0.5 text-sm text-muted">{t(s.text)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {done && (
            <div className="rise mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-teal/10 p-4">
              <Icon name="heart" className="text-gold" />
              <span className="flex-1">{t(ui.trip.tripDone)}</span>
              <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/postcard')}>
                <Icon name="image" size={15} /> {t(ui.trip.makePostcard)}
              </button>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="card p-4 sm:p-5" aria-labelledby="fam">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="fam" className="text-xl font-bold">{t(ui.trip.family)}</h2>
                  <Tag kind="proposal" />
                </div>
                <p className="mt-1 text-sm text-muted">{t(ui.trip.familyToggle)}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={family && !done}
                aria-label={t(ui.trip.familyToggle)}
                disabled={done}
                onClick={() => setFamily(!family)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${family && !done ? 'bg-teal' : 'bg-line'} disabled:opacity-50`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${family && !done ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            {!family || done ? (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-surface2 p-3 text-sm">
                <Icon name="lock" size={15} /> {done ? t({ en: 'Trip ended. Sharing stopped automatically.', zh: '行程已结束，分享已自动停止。' }) : t(ui.trip.familyOff)}
              </p>
            ) : (
              <div className="rise mt-3 space-y-3 text-sm">
                <ul className="space-y-1.5">
                  <li className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 text-teal" /> {t(ui.trip.familyScope1)}</li>
                  <li className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 text-teal" /> {t(ui.trip.familyScope2)}</li>
                </ul>
                <div>
                  <label htmlFor="fam-link" className="label">{t(ui.trip.familyLink)}</label>
                  <div className="flex gap-2">
                    <input id="fam-link" readOnly className="input num min-w-0 flex-1 text-xs" value={shareLink} />
                    <button
                      type="button"
                      className="btn-dark btn-sm shrink-0"
                      onClick={async () => {
                        const ok = await copyText(shareLink);
                        setCopied(ok);
                        toast(ok ? t(ui.trip.copied) : shareLink);
                        window.setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? t(ui.trip.copied) : t(ui.trip.copy)}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted"><Tag kind="demo" extra={t({ en: 'example domain, not a live link', zh: '示例域名，非真实链接' })} /></p>
                </div>
                <div className="rounded-xl border border-line p-3">
                  <div className="text-xs text-muted">{t(ui.trip.familySees)}</div>
                  <div className="mt-1 flex items-center gap-2 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-ok" /> {lastCheckin}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost btn-sm !border-danger/50 !text-danger"
                  onClick={() => {
                    setFamily(false);
                    toast(t({ en: 'Sharing stopped.', zh: '已停止分享。' }));
                  }}
                >
                  <Icon name="x" size={14} /> {t(ui.trip.stop)}
                </button>
              </div>
            )}
          </section>

          <section className="card p-4 sm:p-5" aria-labelledby="wx">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="wx" className="text-xl font-bold">{t(ui.trip.weather)}</h2>
              <Tag kind="demo" />
            </div>
            <p className="mb-3 mt-1 text-sm text-muted">{t(ui.trip.weatherSub)}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t(ui.trip.weather)}>
              {(Object.keys(condInfo) as Cond[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={cond === c}
                  onClick={() => {
                    setCond(c);
                    setAlt('');
                    setRequested(false);
                  }}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-sm font-semibold ${cond === c ? (condInfo[c].disrupt ? 'border-warn bg-warn/15 text-warn' : 'border-ok bg-ok/10 text-ok') : 'border-line hover:border-teal/50'}`}
                >
                  <Icon name={condInfo[c].icon} size={20} />
                  {t(condInfo[c].label)}
                </button>
              ))}
            </div>
            <div className={`mt-3 rounded-xl p-3 text-sm ${ci.disrupt ? 'border border-warn/50 bg-warn/10' : 'bg-ok/10'}`} aria-live="polite">
              <p className="flex gap-2 font-semibold">
                <Icon name={ci.disrupt ? 'alert' : 'check'} size={16} className={`mt-0.5 ${ci.disrupt ? 'text-warn' : 'text-ok'}`} />
                {t(ci.impact(tour))}
              </p>
            </div>
            {ci.disrupt && (
              <div className="rise mt-3 space-y-3">
                {requested ? (
                  <p className="flex items-start gap-2 rounded-xl border border-ok/40 bg-ok/10 p-3 text-sm font-semibold text-ok" role="status">
                    <Icon name="check" size={16} className="mt-0.5" /> {t(ui.trip.requested)} → {fmtDate(alt, lang)}
                  </p>
                ) : (
                  <>
                    <fieldset>
                      <legend className="label">{t(ui.trip.altDates)}</legend>
                      <div className="flex flex-wrap gap-2">
                        {altDates.map((d) => (
                          <label key={d} className={`chip cursor-pointer ${alt === d ? '!border-teal !bg-teal !text-tealInk' : ''}`}>
                            <input type="radio" name="alt" className="sr-only" checked={alt === d} onChange={() => setAlt(d)} />
                            {fmtDate(d, lang)}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <button
                      type="button"
                      className="btn-dark"
                      disabled={!alt}
                      onClick={() => {
                        setRequested(true);
                        toast(t(ui.trip.requested));
                      }}
                    >
                      <Icon name="calendar" /> {t(ui.trip.request)}
                    </button>
                    {!alt && <p className="text-xs text-muted">{t({ en: 'Pick a date first.', zh: '请先选择日期。' })}</p>}
                  </>
                )}
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Tag kind="proposal" /> {t(ui.trust.refundWeather)}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
