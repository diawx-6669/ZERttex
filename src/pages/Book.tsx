import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHead, Stepper, TestModeBanner } from '../components/Layout';
import { Tag } from '../components/Tag';
import { ui } from '../data/i18n';
import { tourById, tours } from '../data/tours';
import type { L, TourId } from '../data/types';
import { bookingCode, cny, fmtDate, kzt, usd } from '../lib/format';
import { href, navigate } from '../lib/router';
import { defaultTripDate, minBookDate, useApp, type BookingDraft, type PayMethod } from '../state';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const countries: { code: string; name: L }[] = [
  { code: 'CN', name: { en: 'China (mainland)', zh: '中国大陆' } },
  { code: 'HK', name: { en: 'Hong Kong SAR, China', zh: '中国香港' } },
  { code: 'MO', name: { en: 'Macao SAR, China', zh: '中国澳门' } },
  { code: 'SG', name: { en: 'Singapore', zh: '新加坡' } },
  { code: 'MY', name: { en: 'Malaysia', zh: '马来西亚' } },
  { code: 'KR', name: { en: 'South Korea', zh: '韩国' } },
  { code: 'JP', name: { en: 'Japan', zh: '日本' } },
  { code: 'DE', name: { en: 'Germany', zh: '德国' } },
  { code: 'GB', name: { en: 'United Kingdom', zh: '英国' } },
  { code: 'US', name: { en: 'United States', zh: '美国' } },
  { code: 'KZ', name: { en: 'Kazakhstan', zh: '哈萨克斯坦' } },
  { code: 'OT', name: { en: 'Other', zh: '其他' } },
];

type Errors = Partial<Record<string, string>>;

export const draftTotal = (d: BookingDraft) =>
  d.items.reduce((s, it) => s + (tourById(it.tourId || undefined)?.priceKzt ?? 0), 0) * d.travelers;

export default function Book({ query }: { query: URLSearchParams }) {
  const { t, lang, draft, setDraft, resetDraft, setBooking, booking } = useApp();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [agree, setAgree] = useState(false);
  const [decline, setDecline] = useState(false);
  const [status, setStatus] = useState<'form' | 'processing' | 'declined' | 'success'>('form');
  const formRef = useRef<HTMLDivElement>(null);
  const minDate = minBookDate();

  // Prefill from ?tour= unless we came from the trip builder.
  useEffect(() => {
    const qt = query.get('tour') as TourId | null;
    if (qt && tourById(qt) && !draft.fromPlan) resetDraft([{ tourId: qt, date: defaultTripDate() }]);
    if (!qt && !draft.fromPlan && draft.items.every((i) => !i.tourId)) resetDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = draftTotal(draft);

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 1) {
      draft.items.forEach((it, i) => {
        if (!it.tourId) e[`tour${i}`] = t(ui.book.errTour);
        if (!it.date || it.date < minDate) e[`date${i}`] = t(ui.book.errDate);
      });
      if (draft.travelers < 1 || draft.travelers > 12) e.travelers = t(ui.book.errTravelers);
    }
    if (s === 2) {
      if (draft.name.trim().length < 2) e.name = t(ui.book.errName);
      if (!EMAIL_RE.test(draft.email.trim())) e.email = t(ui.book.errEmail);
      if (!draft.country) e.country = t(ui.book.errCountry);
      if (!draft.guideLang) e.guideLang = t(ui.book.errGuide);
    }
    if (s === 3) {
      if (!draft.method) e.method = t(ui.book.errMethod);
      if (!agree) e.agree = t(ui.book.errAgree);
    }
    return e;
  };

  const focusFirstError = () =>
    window.setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.focus();
    }, 0);

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError();
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStatus('processing');
    window.setTimeout(() => {
      if (decline) {
        setStatus('declined');
        return;
      }
      setBooking({ ...draft, code: bookingCode(), total, createdAt: new Date().toISOString() });
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1300);
  };

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1.5 flex items-center gap-1 text-sm text-danger">
        <Icon name="alert" size={14} /> {errors[k]}
      </p>
    ) : null;
  const a11y = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  if (status === 'success' && booking) return <Success />;

  const steps = [ui.book.step1, ui.book.step2, ui.book.step3];

  return (
    <>
      <PageHead loop={3} title={t(ui.book.title)} />
      <div className="container-x mt-4">
        <TestModeBanner />
      </div>

      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div ref={formRef} className="min-w-0">
          <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Steps">
            {steps.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={i + 1 > step}
                  onClick={() => i + 1 < step && setStep(i + 1)}
                  aria-current={step === i + 1 ? 'step' : undefined}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold disabled:cursor-default disabled:opacity-100 ${step === i + 1 ? 'border-teal bg-teal/10 text-teal' : i + 1 < step ? 'border-line bg-surface text-ink' : 'border-line bg-surface text-muted'}`}
                >
                  <span className={`num grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${i + 1 < step ? 'bg-ok text-white' : step === i + 1 ? 'bg-teal text-tealInk' : 'bg-surface2'}`}>
                    {i + 1 < step ? <Icon name="check" size={13} /> : i + 1}
                  </span>
                  <span className="truncate">{t(s)}</span>
                </button>
              </li>
            ))}
          </ol>

          {status === 'declined' ? (
            <div className="card rise p-6" role="alert">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
                  <Icon name="x" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">{t(ui.book.declinedTitle)}</h2>
                  <p className="mt-1 text-muted">{t(ui.book.declinedText)}</p>
                  <div className="mt-2"><Tag kind="demo" extra={t(ui.book.simulated)} /></div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setDecline(false);
                    setStatus('form');
                  }}
                >
                  <Icon name="refresh" /> {t(ui.book.retry)}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setDraft({ method: '' });
                    setStatus('form');
                  }}
                >
                  {t(ui.book.otherMethod)}
                </button>
                <a href={href('/ask?q=' + encodeURIComponent(lang === 'zh' ? '人工客服' : 'talk to a manager'))} className="btn-ghost">
                  <Icon name="users" /> {t(ui.ask.manager)}
                </a>
              </div>
              <p className="mt-3 text-xs text-muted">{t({ en: 'Retry turns off the decline simulation.', zh: '重试将关闭支付失败模拟。' })}</p>
            </div>
          ) : (
            <div className="card p-4 sm:p-6">
              {step === 1 && (
                <fieldset className="space-y-5">
                  <legend className="sr-only">{t(ui.book.step1)}</legend>
                  {draft.fromPlan && (
                    <p className="flex items-center gap-2 rounded-xl bg-teal/10 p-3 text-sm text-teal">
                      <Icon name="route" /> {t(ui.book.fromPlan)}
                    </p>
                  )}
                  {draft.items.map((it, i) => (
                    <div key={i} className="grid gap-4 rounded-xl border border-line p-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-start sm:p-4">
                      <div>
                        <label className="label" htmlFor={`tour${i}`}>{t(ui.book.tour)}</label>
                        <select
                          id={`tour${i}`}
                          className={`input ${errors[`tour${i}`] ? 'input-error' : ''}`}
                          value={it.tourId}
                          onChange={(e) => setDraft({ items: draft.items.map((x, j) => (j === i ? { ...x, tourId: e.target.value as TourId } : x)) })}
                          {...a11y(`tour${i}`)}
                        >
                          <option value="">—</option>
                          {tours.map((tt) => (
                            <option key={tt.id} value={tt.id}>
                              {t(tt.name)} · {tt.days} {t(ui.tour.days)} · {kzt(tt.priceKzt)}
                            </option>
                          ))}
                        </select>
                        {err(`tour${i}`)}
                      </div>
                      <div>
                        <label className="label" htmlFor={`date${i}`}>{t(ui.book.date)}</label>
                        <input
                          id={`date${i}`}
                          type="date"
                          min={minDate}
                          className={`input ${errors[`date${i}`] ? 'input-error' : ''}`}
                          value={it.date}
                          onChange={(e) => setDraft({ items: draft.items.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)) })}
                          {...a11y(`date${i}`)}
                        />
                        {errors[`date${i}`] ? err(`date${i}`) : <p className="mt-1.5 text-xs text-muted">{t(ui.book.dateHint)}</p>}
                      </div>
                      {draft.items.length > 1 && (
                        <button
                          type="button"
                          className="btn-ghost btn-sm self-end sm:mt-7"
                          onClick={() => setDraft({ items: draft.items.filter((_, j) => j !== i) })}
                        >
                          <Icon name="x" size={14} /> {t(ui.book.remove)}
                        </button>
                      )}
                    </div>
                  ))}
                  {draft.items.length < 4 && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setDraft({ items: [...draft.items, { tourId: '', date: defaultTripDate() }] })}>
                      <Icon name="plus" size={14} /> {t(ui.book.addTour)}
                    </button>
                  )}
                  <div>
                    <span className="label" id="travelers-label">{t(ui.book.travelers)}</span>
                    <Stepper id="travelers-label" label={t(ui.book.travelers)} value={draft.travelers} onChange={(n) => setDraft({ travelers: n })} />
                    {err('travelers')}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="grid gap-5 sm:grid-cols-2">
                  <legend className="sr-only">{t(ui.book.step2)}</legend>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="name">{t(ui.book.name)}</label>
                    <input id="name" className={`input ${errors.name ? 'input-error' : ''}`} value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} autoComplete="name" {...a11y('name')} />
                    {err('name')}
                  </div>
                  <div>
                    <label className="label" htmlFor="email">{t(ui.book.email)}</label>
                    <input id="email" type="email" inputMode="email" className={`input ${errors.email ? 'input-error' : ''}`} value={draft.email} onChange={(e) => setDraft({ email: e.target.value })} autoComplete="email" {...a11y('email')} />
                    {err('email')}
                  </div>
                  <div>
                    <label className="label" htmlFor="country">{t(ui.book.country)}</label>
                    <select id="country" className={`input ${errors.country ? 'input-error' : ''}`} value={draft.country} onChange={(e) => setDraft({ country: e.target.value })} {...a11y('country')}>
                      <option value="">{t(ui.book.countryPick)}</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{t(c.name)}</option>
                      ))}
                    </select>
                    {err('country')}
                  </div>
                  <fieldset className="sm:col-span-2">
                    <legend className="label">{t(ui.book.guideLang)}</legend>
                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" {...a11y('guideLang')} tabIndex={-1}>
                      {(['en', 'zh'] as const).map((g) => (
                        <label key={g} className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border p-3 ${draft.guideLang === g ? 'border-teal bg-teal/10' : 'border-line hover:border-teal/50'}`}>
                          <input type="radio" name="guideLang" className="h-5 w-5 accent-[rgb(var(--teal))]" checked={draft.guideLang === g} onChange={() => setDraft({ guideLang: g })} />
                          <span className="flex flex-wrap items-center gap-2 font-semibold">
                            {g === 'en' ? 'English' : '中文'}
                            {g === 'zh' && <Tag kind="confirm" />}
                          </span>
                        </label>
                      ))}
                    </div>
                    {err('guideLang')}
                  </fieldset>
                  <p className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
                    <Icon name="lock" size={15} /> {t(ui.book.noPassport)}
                  </p>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset className="space-y-4">
                  <legend className="label">{t(ui.book.method)}</legend>
                  <div className="grid gap-3" role="radiogroup" {...a11y('method')} tabIndex={-1}>
                    {(
                      [
                        { id: 'card', label: ui.book.card, icon: 'card', planned: false },
                        { id: 'alipay', label: ui.book.alipay, icon: 'phone', planned: true },
                        { id: 'wechat', label: ui.book.wechat, icon: 'chat', planned: true },
                      ] as const
                    ).map((m) => (
                      <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${draft.method === m.id ? 'border-teal bg-teal/10' : 'border-line hover:border-teal/50'}`}>
                        <input type="radio" name="method" className="mt-1 h-5 w-5 accent-[rgb(var(--teal))]" checked={draft.method === m.id} onChange={() => setDraft({ method: m.id as PayMethod })} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 font-semibold">
                            <Icon name={m.icon} size={17} /> {t(m.label)}
                            {m.planned && <Tag kind="proposal" extra={t(ui.book.planned)} />}
                          </span>
                          {m.id === 'card' && <span className="mt-1 block text-sm text-muted">{t(ui.book.cardText)}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {err('method')}
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${errors.agree ? 'border-danger' : 'border-line'}`}>
                    <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[rgb(var(--teal))]" checked={agree} onChange={(e) => setAgree(e.target.checked)} {...a11y('agree')} />
                    <span>{t(ui.book.agree)}</span>
                  </label>
                  {err('agree')}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-warn/60 bg-warn/10 p-3 text-sm">
                    <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--warn))]" checked={decline} onChange={(e) => setDecline(e.target.checked)} />
                    <span className="font-semibold">{t(ui.book.simulateDecline)}</span>
                  </label>
                </fieldset>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                {step > 1 ? (
                  <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)} disabled={status === 'processing'}>
                    <Icon name="arrowLeft" /> {t(ui.book.back)}
                  </button>
                ) : (
                  <span />
                )}
                <button type="button" className="btn-primary min-w-[180px] text-base" onClick={next} disabled={status === 'processing'}>
                  {status === 'processing' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-tealInk/40 border-t-tealInk" aria-hidden /> {t(ui.book.processing)}
                    </>
                  ) : step === 3 ? (
                    <>
                      <Icon name="lock" /> {t(ui.book.pay)} · <span className="num">{kzt(total)}</span>
                    </>
                  ) : (
                    <>
                      {t(ui.book.next)} <Icon name="arrow" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <Summary />
      </div>
    </>
  );
}

function Summary() {
  const { t, lang, draft } = useApp();
  const total = draftTotal(draft);
  const items = draft.items.filter((i) => i.tourId);
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between bg-night px-5 py-3 text-nightInk">
          <span className="font-semibold">{t(ui.book.summary)}</span>
          <Tag kind="demo" className="!border-teal/60" />
        </div>
        <div className="space-y-4 p-5">
          {items.length === 0 && <p className="text-sm text-muted">{t(ui.book.errTour)}</p>}
          {items.map((it, i) => {
            const tour = tourById(it.tourId)!;
            return (
              <div key={i} className="space-y-2 border-b border-line pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{t(tour.name)}</div>
                    <div className="text-xs text-muted">{fmtDate(it.date, lang)}</div>
                  </div>
                  <div className="num text-right text-sm">
                    {kzt(tour.priceKzt * draft.travelers)}
                    <div className="text-xs text-muted">
                      {kzt(tour.priceKzt)} {t(ui.book.perPersonX)} {draft.travelers}
                    </div>
                  </div>
                </div>
                <details className="group rounded-lg bg-surface2/70 p-2.5 text-xs" open>
                  <summary className="flex cursor-pointer items-center gap-1.5 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-ok" /> {t(ui.book.includedRecap)}
                  </summary>
                  <ul className="mt-1.5 space-y-0.5 pl-3.5 text-muted">
                    {tour.inclusions.included.map((x, j) => (
                      <li key={j}>• {t(x.label)}</li>
                    ))}
                  </ul>
                </details>
                <details className="rounded-lg border border-dashed border-warn/50 bg-warn/10 p-2.5 text-xs" open>
                  <summary className="flex cursor-pointer items-center gap-1.5 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-warn" /> {t(ui.book.unconfirmedRecap)}
                  </summary>
                  <ul className="mt-1.5 space-y-0.5 pl-3.5 text-muted">
                    {tour.inclusions.unconfirmed.map((x, j) => (
                      <li key={j}>• {t(x.label)}</li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
          <div className="border-t border-line pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{t(ui.book.total)}</span>
              <span className="num text-2xl font-semibold" aria-live="polite">{kzt(total)}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-sm text-muted">
              <span>{t(ui.book.indicative)}:</span>
              <span className="num">{usd(total)}</span>
              <span>·</span>
              <span className="num">{cny(total)}</span>
              <Tag kind="demo" extra={`${t(ui.book.demoRate)} 1 USD = 500 · 1 CNY = 70 KZT`} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Success() {
  const { t, lang, booking, resetDraft } = useApp();
  if (!booking) return null;
  return (
    <>
      <PageHead loop={3} title={t(ui.book.successTitle)} />
      <div className="container-x mt-4">
        <TestModeBanner />
      </div>
      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card rise overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 bg-night p-6 text-nightInk">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ok text-white">
              <Icon name="check" size={28} />
            </span>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-nightInk/70">{t(ui.book.code)}</div>
              <div className="num font-display text-4xl font-extrabold tracking-wider text-gold" data-testid="booking-code">{booking.code}</div>
            </div>
            <Tag kind="demo" extra={t(ui.book.simulated)} className="ml-auto !border-teal/60" />
          </div>
          <div className="space-y-5 p-6">
            <p>
              {t(ui.book.successText)} <strong>{booking.email}</strong>.
            </p>
            <ul className="space-y-1 text-sm">
              {booking.items.map((it, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line py-2">
                  <span className="font-semibold">{t(tourById(it.tourId || undefined)!.name)}</span>
                  <span className="text-muted">{fmtDate(it.date, lang)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 py-2">
                <span>
                  {booking.travelers} × {t(ui.book.travelers).toLowerCase()} · {booking.method === 'card' ? t(ui.book.card) : booking.method === 'alipay' ? t(ui.book.alipay) : t(ui.book.wechat)}
                </span>
                <span className="num font-semibold">{kzt(booking.total)}</span>
              </li>
            </ul>
            <ol className="space-y-2 text-sm">
              {[ui.book.next1, ui.book.next2, ui.book.next3].map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface2 text-xs">{i + 1}</span>
                  <span>{t(n)}</span>
                  {i < 2 && <Tag kind="proposal" />}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => navigate('/trip')}>
                <Icon name="map" /> {t(ui.book.goTrip)}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  resetDraft();
                  navigate('/tours');
                }}
              >
                {t(ui.book.newBooking)}
              </button>
            </div>
          </div>
        </div>
        <Summary />
      </div>
    </>
  );
}
