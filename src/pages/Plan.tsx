import { useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHead, Stepper } from '../components/Layout';
import { Media } from '../components/Media';
import { RouteMap } from '../components/RouteMap';
import { Tag } from '../components/Tag';
import { interestText, ui } from '../data/i18n';
import { hubName, tours } from '../data/tours';
import type { Interest, TourId } from '../data/types';
import { fmtDate, indicative, kzt } from '../lib/format';
import { navigate } from '../lib/router';
import { buildPlan, cityDayRate, minDaysFor, type BudgetLevel, type PlanResult } from '../lib/tripBuilder';
import { defaultTripDate, minBookDate, useApp } from '../state';

const interests: Interest[] = ['nature', 'photography', 'culture', 'adventure', 'relaxation'];

const kindStyle = {
  arrival: { dot: 'bg-gold', label: ui.plan.arrival },
  tour: { dot: 'bg-teal', label: ui.plan.guidedDay },
  transfer: { dot: 'bg-night', label: ui.plan.transfer },
  city: { dot: 'bg-ok', label: ui.plan.city },
};

export default function Plan() {
  const { t, lang, resetDraft } = useApp();
  const [sel, setSel] = useState<TourId[]>(['kolsai']);
  const [days, setDays] = useState(7);
  const [ints, setInts] = useState<Interest[]>(['nature', 'photography']);
  const [budget, setBudget] = useState<BudgetLevel>('comfort');
  const [travelers, setTravelers] = useState(2);
  const [guideLang, setGuideLang] = useState<'en' | 'zh'>(lang);
  const [arrival, setArrival] = useState(defaultTripDate());
  const [result, setResult] = useState<PlanResult | null>(null);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const min = minDaysFor(sel);

  const generate = () => {
    setResult(buildPlan({ tours: sel, days, interests: ints, budget, travelers, arrival: arrival < minBookDate() ? minBookDate() : arrival }));
    window.setTimeout(() => document.getElementById('plan-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const book = () => {
    if (!result?.ok) return;
    resetDraft(result.tourItems, { travelers, guideLang, fromPlan: true });
    navigate('/book');
  };

  return (
    <>
      <PageHead loop={1} scope="mvp" title={t(ui.plan.title)} sub={t(ui.plan.sub)}>
        <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-teal/60 px-2 py-0.5 text-sm font-medium text-teal">
          <Icon name="info" size={13} /> {t(ui.plan.rules)}
        </span>
      </PageHead>

      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[400px_1fr]">
        <form
          className="card h-fit space-y-6 p-4 sm:p-5 lg:sticky lg:top-24"
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
        >
          <fieldset>
            <legend className="label">{t(ui.plan.destinations)}</legend>
            <div className="grid grid-cols-2 gap-2">
              {tours.map((tt) => {
                const on = sel.includes(tt.id);
                return (
                  <label key={tt.id} className={`relative cursor-pointer overflow-hidden rounded-xl border-2 ${on ? 'border-teal' : 'border-transparent'}`}>
                    <input type="checkbox" className="peer sr-only" checked={on} onChange={() => setSel(toggle(sel, tt.id))} />
                    <div className="aspect-[4/3]">
                      <Media tour={tt.id} credit={false} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-2 pt-6 text-xs font-semibold leading-tight text-white">
                      {t(tt.name)}
                      <div className="font-mono text-[10px] font-normal opacity-80">
                        {tt.days} {t(ui.tour.days)} · {t(hubName[tt.hub])}
                      </div>
                    </div>
                    <span className={`absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full ${on ? 'bg-teal text-tealInk' : 'bg-night/50 text-white'}`}>
                      {on ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}
                    </span>
                    <span className="pointer-events-none absolute inset-0 rounded-[10px] peer-focus-visible:ring-4 peer-focus-visible:ring-teal" />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="label" htmlFor="len">{t(ui.plan.length)}</label>
              <span className="num text-lg font-semibold">
                {days} {t(ui.tour.days)}
              </span>
            </div>
            <input id="len" type="range" min={3} max={14} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full accent-[rgb(var(--teal))]" />
            <div className="flex justify-between font-mono text-[11px] text-muted">
              <span>3</span>
              {sel.length > 0 && (
                <span className={min > days ? 'font-semibold text-danger' : ''}>
                  min {min}
                </span>
              )}
              <span>14</span>
            </div>
          </div>

          <fieldset>
            <legend className="label">{t(ui.plan.interests)}</legend>
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <label key={i} className={`chip cursor-pointer ${ints.includes(i) ? '!border-teal !bg-teal !text-tealInk' : ''}`}>
                  <input type="checkbox" className="sr-only" checked={ints.includes(i)} onChange={() => setInts(toggle(ints, i))} />
                  {t(interestText[i])}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">{t(ui.plan.budget)}</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['budget', 'comfort', 'premium'] as BudgetLevel[]).map((b) => (
                <label key={b} className={`cursor-pointer rounded-xl border p-2.5 text-center text-sm ${budget === b ? 'border-teal bg-teal/10 font-semibold text-teal' : 'border-line'}`}>
                  <input type="radio" name="budget" className="sr-only" checked={budget === b} onChange={() => setBudget(b)} />
                  {t(ui.plan.budgetLv[b])}
                  <span className="num block text-[11px] font-normal text-muted">{(cityDayRate[b] / 1000).toFixed(0)}k/day</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <span className="label" id="pl-trav">{t(ui.plan.travelers)}</span>
              <Stepper id="pl-trav" label={t(ui.plan.travelers)} value={travelers} onChange={setTravelers} />
            </div>
            <fieldset>
              <legend className="label">{t(ui.plan.language)}</legend>
              <div className="flex gap-2">
                {(['en', 'zh'] as const).map((g) => (
                  <label key={g} className={`chip cursor-pointer ${guideLang === g ? '!border-teal !bg-teal/10 !text-teal' : ''}`}>
                    <input type="radio" name="pl-lang" className="sr-only" checked={guideLang === g} onChange={() => setGuideLang(g)} />
                    {g === 'en' ? 'EN' : '中文'}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div>
            <label className="label" htmlFor="arr">{t(ui.plan.startDate)}</label>
            <input id="arr" type="date" className="input" min={minBookDate()} value={arrival} onChange={(e) => setArrival(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary w-full text-base">
            <Icon name="sparkle" /> {t(ui.plan.generate)}
          </button>
        </form>

        <section id="plan-result" className="min-w-0 scroll-mt-24" aria-live="polite">
          {!result && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-muted">
                <Icon name="route" className="text-teal" /> {t({ en: 'Your selected places light up on the map. Press "Build my itinerary" when ready.', zh: '所选地点会在地图上亮起。准备好后点击"生成行程"。' })}
              </p>
              <RouteMap highlight={sel} className="mx-auto max-w-xl" />
            </div>
          )}
          {result && !result.ok && (
            <div className="card rise flex items-start gap-3 border-danger/50 p-5" role="alert">
              <Icon name="alert" className="mt-0.5 text-danger" />
              <p className="font-semibold">
                {result.error === 'none' ? t(ui.plan.errNone) : t(ui.plan.errFit).replace('{n}', String(result.minDays))}
              </p>
            </div>
          )}
          {result && result.ok && (
            <div className="rise space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-extrabold">{t(ui.plan.result)}</h2>
                <span className="num text-sm text-muted">
                  {fmtDate(result.days[0].date, lang)} → {fmtDate(result.days[result.days.length - 1].date, lang)}
                </span>
              </div>
              <ol className="relative space-y-3 border-l-2 border-line pl-5">
                {result.days.map((d) => {
                  const k = kindStyle[d.kind];
                  return (
                    <li key={d.day} className="relative">
                      <span className={`absolute -left-[29px] top-4 h-4 w-4 rounded-full border-4 border-bg ${k.dot}`} aria-hidden />
                      <div className="card p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="font-semibold text-ink">
                            {lang === 'zh' ? `第${d.day}天` : `Day ${d.day}`}
                          </span>
                          <span>· {fmtDate(d.date, lang)}</span>
                          <span>· {t(hubName[d.city])}</span>
                          <span className="rounded bg-surface2 px-1.5 py-0.5 text-ink">{t(k.label)}</span>
                        </div>
                        <div className="mt-1 font-semibold">{t(d.title)}</div>
                        <ul className="mt-1 space-y-0.5 text-sm text-muted">
                          {d.items.map((it, i) => (
                            <li key={i}>· {t(it)}</li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-3 font-semibold">{t(ui.plan.total)}</div>
                <dl className="divide-y divide-line px-5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <dt className="flex flex-wrap items-center gap-2">{t(ui.plan.guided)} <Tag kind="demo" /></dt>
                    <dd className="num">{kzt(result.cost.guided)}</dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <dt className="flex flex-wrap items-center gap-2">
                      {t(ui.plan.cityDays)} ({result.cost.cityDayCount} × {travelers}) <Tag kind="proposal" extra={t(ui.common.estimate)} />
                    </dt>
                    <dd className="num">{kzt(result.cost.cityDays)}</dd>
                  </div>
                  {result.cost.transfers > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <dt className="flex flex-wrap items-center gap-2">{t(ui.plan.transfers)} <Tag kind="proposal" extra={t(ui.common.estimate)} /></dt>
                      <dd className="num">{kzt(result.cost.transfers)}</dd>
                    </div>
                  )}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                    <dt className="font-semibold">{t(ui.plan.total)}</dt>
                    <dd className="text-right">
                      <span className="num text-2xl font-semibold">{kzt(result.cost.total)}</span>
                      <span className="num block text-xs text-muted">{indicative(result.cost.total, lang)} · {t(ui.book.demoRate)}</span>
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface2/60 px-5 py-4">
                  <p className="text-xs text-muted">{t(ui.plan.excl)}</p>
                  <button type="button" className="btn-primary" onClick={book}>
                    {t(ui.plan.bookPlan)} <Icon name="arrow" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
