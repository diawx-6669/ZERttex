import { useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { PageHead, Section } from '../components/Layout';
import { Tag } from '../components/Tag';
import { budget, budgetConfig, PHASE2_MAX } from '../data/budget';
import { kzt, num } from '../lib/format';
import { contributionPerTraveler, defaultResults } from '../lib/paybackModel';
import { href } from '../lib/router';

// Company dashboard for the pilot. English only, like the Impact page.
// Every number on this page is DEMO DATA, except the two month-9 thresholds,
// which come from the payback model (src/lib/paybackModel.ts).

const M = budgetConfig.model;
const GATE = M.stageGateMonth;
const R = defaultResults();
/** Paid bookings per month the model expects at the stage gate (−30% path ≈21, stress path ≈8). */
const GO = Math.round(R.down[GATE - 1].travelers);
const STOP = Math.round(R.stress[GATE - 1].travelers);
const CONTRIBUTION = contributionPerTraveler(M.margin);
const marketingLine = budget.find((b) => b.group === 'Launch' && b.item.startsWith('Xiaohongshu'))!;
const MARKETING_PER_MONTH = marketingLine.amount / (marketingLine.end - marketingLine.start + 1);

/** Demo month: month 9 after launch at month 4. 1 paid booking = 1 foreign traveler in the model. */
const funnel: { step: string; count: number; icon: IconName; how: string }[] = [
  { step: 'Visited the site', count: 2400, icon: 'globe', how: 'Page-view event, no cookies, no personal data' },
  { step: 'Asked in the chat', count: 360, icon: 'chat', how: 'First message sent to the concierge' },
  { step: 'Started a booking', count: 96, icon: 'calendar', how: 'Step 1 of the booking form completed' },
  { step: 'Paid', count: 17, icon: 'card', how: 'Payment-provider webhook: payment succeeded' },
  { step: 'Shared a postcard', count: 6, icon: 'image', how: 'Postcard PNG downloaded or referral link copied' },
  { step: 'A friend came and booked', count: 2, icon: 'heart', how: 'Paid booking that opened from a postcard QR (?ref= code)' },
];
const PAID = funnel[3].count;

/** Paid bookings per month since launch (demo), months 4..9. */
const monthly = [2, 5, 8, 11, 14, PAID];

const verdict = (n: number) =>
  n >= GO
    ? { tone: 'ok', title: 'On track: release Phase 2', text: `At or above the −30% path. Phase 2 (up to ${num(PHASE2_MAX)} KZT) can be released.` }
    : n <= STOP
      ? { tone: 'danger', title: 'Stop paid ads', text: 'At the stress-test path. Pause paid ads, re-test the offer with travelers, Phase 2 is not released.' }
      : { tone: 'warn', title: 'Keep Phase 1, fix the funnel', text: 'Between the two paths. Keep spending only from Phase 1, fix the weakest funnel step, Phase 2 is not released yet.' };

const toneText: Record<string, string> = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' };
const toneBg: Record<string, string> = { ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger' };

function Funnel() {
  const max = funnel[0].count;
  // Biggest relative drop between two steps: the first thing to fix.
  let worst = 1;
  for (let i = 1; i < funnel.length; i++) if (funnel[i].count / funnel[i - 1].count < funnel[worst].count / funnel[worst - 1].count) worst = i;
  return (
    <div className="card p-4 sm:p-6" data-testid="pilot-funnel">
      <ol className="space-y-3">
        {funnel.map((f, i) => {
          const rate = i ? f.count / funnel[i - 1].count : 1;
          // Square-root scale so the small steps at the end stay visible.
          const w = Math.max(4, Math.sqrt(f.count / max) * 100);
          return (
            <li key={f.step} className="grid gap-x-4 gap-y-1 sm:grid-cols-[230px_1fr_110px] sm:items-center">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface2 text-xs">{i + 1}</span>
                <Icon name={f.icon} size={16} className="text-teal" /> {f.step}
              </div>
              <div>
                <div className="h-7 rounded-md bg-surface2">
                  <div className={`flex h-full items-center rounded-md px-2 font-mono text-xs font-semibold bg-teal text-tealInk ${i === 3 ? 'ring-2 ring-ok ring-offset-2 ring-offset-surface' : ''}`} style={{ width: `${w}%` }}>
                    {num(f.count)}
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-muted">How we measure: {f.how}</div>
              </div>
              <div className="num text-sm sm:text-right">
                {i === 0 ? <span className="text-muted">this month</span> : (
                  <span className={i === worst ? 'font-semibold text-danger' : 'text-muted'}>
                    {(rate * 100).toFixed(rate < 0.1 ? 1 : 0)}% of step {i}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm">
        <Icon name="alert" size={16} className="mt-0.5 text-danger" />
        <span>
          Weakest step now: <strong>{funnel[worst - 1].step} → {funnel[worst].step}</strong> ({((funnel[worst].count / funnel[worst - 1].count) * 100).toFixed(0)}%). This is the first thing the team fixes next month.
        </span>
      </p>
    </div>
  );
}

function Gate() {
  const [paid, setPaid] = useState(PAID);
  const v = verdict(paid);
  const SCALE = 30;
  const pos = (n: number) => `${(Math.min(n, SCALE) / SCALE) * 100}%`;
  return (
    <div className="card p-5 sm:p-6" data-testid="pilot-gate">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold">Month-{GATE} checkpoint</h3>
        <Tag kind="proposal" extra="rule" />
      </div>
      <p className="mt-1 text-sm text-muted">
        Need <strong className="text-ink">≈{GO} paid bookings a month</strong> (−30% path). At <strong className="text-ink">≈{STOP}</strong> (stress test) we stop paid ads. Both numbers come from the payback model.
      </p>

      <div className="relative mt-8 h-3 rounded-full bg-surface2" aria-hidden>
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-danger/25" style={{ width: pos(STOP) }} />
        <div className="absolute inset-y-0 bg-warn/25" style={{ left: pos(STOP), width: `calc(${pos(GO)} - ${pos(STOP)})` }} />
        <div className="absolute inset-y-0 right-0 rounded-r-full bg-ok/25" style={{ left: pos(GO) }} />
        {[
          { n: STOP, l: `stop ads · ${STOP}` },
          { n: GO, l: `go · ${GO}` },
        ].map((m) => (
          <div key={m.n} className="absolute -top-6 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-semibold" style={{ left: pos(m.n) }}>
            {m.l}
            <div className="mx-auto mt-0.5 h-[34px] w-px bg-ink/50" />
          </div>
        ))}
        <div className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface ${toneBg[v.tone]}`} style={{ left: pos(paid) }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-muted"><span>0</span><span>{SCALE}+</span></div>

      <div className={`mt-5 rounded-xl border border-line p-4`} role="status" aria-live="polite">
        <div className="text-sm text-muted">Paid bookings in month {GATE}: <span className="num font-semibold text-ink">{paid}</span>{paid === PAID && <> · <Tag kind="demo" /></>}</div>
        <div className={`mt-1 text-xl font-bold ${toneText[v.tone]}`} data-testid="gate-verdict">{v.title}</div>
        <p className="mt-1 text-sm text-muted">{v.text}</p>
      </div>

      <label className="mt-5 block text-sm font-semibold" htmlFor="gate-slider">What if month {GATE} ended with a different number?</label>
      <input id="gate-slider" type="range" min={0} max={SCALE} value={paid} onChange={(e) => setPaid(+e.target.value)} className="mt-2 w-full accent-[rgb(var(--teal))]" />
      {paid !== PAID && (
        <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setPaid(PAID)}>
          <Icon name="refresh" size={14} /> Back to demo value ({PAID})
        </button>
      )}
    </div>
  );
}

function MonthlyChart() {
  const W = 560;
  const H = 220;
  const pad = { l: 36, r: 12, t: 14, b: 28 };
  const months = monthly.map((_, i) => M.launchMonth + i);
  const yMax = 30;
  const x = (m: number) => pad.l + ((m - months[0]) / (months[months.length - 1] - months[0])) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
  const line = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(months[i]).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const down = months.map((m) => R.down[m - 1].travelers);
  const stress = months.map((m) => R.stress[m - 1].travelers);
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold">Paid bookings per month</h3>
        <Tag kind="demo" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Paid bookings per month from month ${months[0]} to ${GATE}: ${monthly.join(', ')}. Model −30% path reaches ${GO} at month ${GATE}, stress path ${STOP}.`}>
        {[0, 10, 20, 30].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" className="fill-muted font-mono">{v}</text>
          </g>
        ))}
        {months.map((m) => (
          <text key={m} x={x(m)} y={H - 8} textAnchor="middle" fontSize="11" className="fill-muted font-mono">M{m}</text>
        ))}
        <path d={line(stress)} fill="none" stroke="rgb(var(--danger))" strokeWidth="2" strokeDasharray="2 4" />
        <path d={line(down)} fill="none" stroke="rgb(var(--ok))" strokeWidth="2" strokeDasharray="7 5" />
        <path d={line(monthly)} fill="none" stroke="rgb(var(--teal))" strokeWidth="3" />
        {monthly.map((v, i) => (
          <circle key={i} cx={x(months[i])} cy={y(v)} r="4" fill="rgb(var(--teal))" stroke="rgb(var(--surface))" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-[3px] w-5 rounded bg-teal" /> Real (demo) bookings</span>
        <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-ok" /> Model −30% path (go)</span>
        <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dotted border-danger" /> Stress path (stop ads)</span>
      </div>
    </div>
  );
}

export default function Pilot() {
  const visits = funnel[0].count;
  const referral = funnel[5].count;
  const costPerPaid = MARKETING_PER_MONTH / PAID;
  const kpis = [
    { k: 'Paid bookings this month', v: num(PAID), s: `Month ${GATE} · goal ≈${GO}` },
    { k: 'Visit → paid', v: `${((PAID / visits) * 100).toFixed(1)}%`, s: `${num(visits)} visits` },
    { k: 'Marketing cost per paid booking', v: kzt(costPerPaid), s: `vs ${kzt(CONTRIBUTION)} earned per traveler` },
    { k: 'Bookings from postcards', v: num(referral), s: 'free: no ad spend' },
  ];

  return (
    <>
      <PageHead
        eyebrow={<>For Saryarqa Routes · pilot dashboard <Tag kind="demo" extra="no real traffic yet" /></>}
        title="Pilot dashboard"
        sub="How the company sees, every month, whether the site earns back its budget. This is the answer to “how will you measure it”."
      >
        <a href={href('/impact')} className="btn-ghost btn-sm"><Icon name="chart" size={14} /> Budget and payback model</a>
      </PageHead>

      <div className="container-x mt-6">
        <div className="flex items-start gap-2 rounded-xl border border-dashed border-teal/50 bg-teal/5 p-3 text-sm">
          <Icon name="info" size={16} className="mt-0.5 text-teal" />
          <span>
            <strong>Demo data.</strong> The site is not live yet, so all counts below are made up to show the layout. The two month-{GATE} thresholds (≈{GO} and ≈{STOP}) are real outputs of our payback model.
          </span>
        </div>
      </div>

      <section className="container-x mt-8" aria-label="Key numbers">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((x) => (
            <div key={x.k} className="card p-4">
              <div className="text-xs text-muted">{x.k}</div>
              <div className="num mt-1 text-2xl font-semibold">{x.v}</div>
              <div className="mt-0.5 text-xs text-muted">{x.s}</div>
            </div>
          ))}
        </div>
      </section>

      <Section title="Funnel: from visit to a friend's booking" sub={`One month (month ${GATE}). Each step is one event the site records. The loop closes when a shared postcard brings a new paid booking.`}>
        <Funnel />
      </Section>

      <Section title={`Is it working? The month-${GATE} checkpoint`} sub="One rule decides whether the rest of the budget is released.">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <Gate />
          <div className="space-y-5">
            <MonthlyChart />
            <div className="card p-5 text-sm">
              <h3 className="mb-2 text-lg font-bold">Link to the budget</h3>
              <ul className="space-y-1.5 text-muted">
                <li className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 text-teal" />Marketing line “{marketingLine.item}”: {kzt(marketingLine.amount)} over months {marketingLine.start}–{marketingLine.end} ≈ {kzt(MARKETING_PER_MONTH)} a month.</li>
                <li className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 text-teal" />Each paid traveler brings {kzt(CONTRIBUTION)} ({Math.round(M.margin * 100)}% of {kzt(M.avgPrice)}). Cost per paid booking must stay below that.</li>
                <li className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 text-teal" />Phase 2 (up to {kzt(PHASE2_MAX)}) is released only on a “go” at month {GATE}.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section title="How the data is collected" sub="Simple and privacy-first. Built in the 12-week MVP.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { h: 'Site events', p: 'Six events, one per funnel step. Counted without cookies or personal data.', icon: 'chart' as IconName },
            { h: 'Payments', p: 'The payment provider confirms each paid booking. No card data is stored by us.', icon: 'card' as IconName },
            { h: 'Postcard codes', p: 'Each postcard QR carries a referral code, so a friend’s booking is counted to the right postcard.', icon: 'image' as IconName },
          ].map((c) => (
            <div key={c.h} className="card p-5">
              <h3 className="mb-1 flex items-center gap-2 font-bold"><Icon name={c.icon} className="text-teal" /> {c.h}</h3>
              <p className="text-sm text-muted">{c.p}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Reviewed monthly by the product owner at Saryarqa Routes. <Tag kind="proposal" /></p>
      </Section>
    </>
  );
}
