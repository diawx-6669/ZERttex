import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { startJudgeMode } from '../components/JudgeMode';
import { PageHead, Section } from '../components/Layout';
import { Scope, Tag } from '../components/Tag';
import { BUDGET_CAP, PHASE2_MAX, budget, budgetConfig, budgetGroups, budgetTotal, firstYearOneTime, firstYearOperating, firstYearTotal, gantt, groupTotal, inMvp, later, metrics, operatingInMonth, risks } from '../data/budget';
import { kzt, millions, num } from '../lib/format';
import { AVG_PRICE, DEFAULT_MARGIN, DEFAULT_RUNNING, DOWNSIDE, MONTHS, STRESS, breakEvenTravelers, contributionPerTraveler, derivation, paybackMonth, series, type PaybackSeries } from '../lib/paybackModel';

const M = budgetConfig.model;
const DEF_MARGIN = Math.round(DEFAULT_MARGIN * 100);

// Judges' page. English only, as allowed by the brief.

function Chart({ base, down, stress, pbBase, pbDown }: { base: PaybackSeries; down: PaybackSeries; stress: PaybackSeries; pbBase: number | null; pbDown: number | null }) {
  const W = 720;
  const H = 300;
  const pad = { l: 56, r: 16, t: 16, b: 34 };
  const all = [...base, ...down, ...stress].map((p) => p.cumulative);
  const yMin = Math.min(...all, 0);
  const yMax = Math.max(...all, 0);
  const span = yMax - yMin || 1;
  const x = (m: number) => pad.l + ((m - 1) / (MONTHS - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - yMin) / span) * (H - pad.t - pad.b);
  const path = (s: PaybackSeries) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(1)} ${y(p.cumulative).toFixed(1)}`).join(' ');
  const step = span > 40e6 ? 10e6 : 5e6;
  const ticks: number[] = [];
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v);
  const marker = (m: number | null, s: PaybackSeries, color: string, label: string, dy: number) => {
    if (!m) return null;
    const p = s[m - 1];
    return (
      <g>
        <line x1={x(m)} x2={x(m)} y1={pad.t} y2={H - pad.b} stroke={color} strokeDasharray="4 4" strokeWidth="1.5" />
        <circle cx={x(m)} cy={y(p.cumulative)} r="5" fill={color} stroke="rgb(var(--surface))" strokeWidth="2" />
        <text x={x(m) - 6} y={pad.t + 12 + dy} textAnchor="end" className="fill-ink font-mono" fontSize="11" fontWeight="600">
          {label} M{m}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Cumulative cash over 48 months. Payback at company target month ${pbBase ?? 'beyond 48'}, worst case −30% month ${pbDown ?? 'beyond 48'}, stress test none within 48 months.`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" strokeWidth={v === 0 ? 1.6 : 1} />
          <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" className="fill-muted font-mono">
            {v === 0 ? '0' : `${v / 1e6}M`}
          </text>
        </g>
      ))}
      {[1, 4, 12, 24, 36, 48].map((m) => (
        <text key={m} x={x(m)} y={H - 12} textAnchor="middle" fontSize="11" className="fill-muted font-mono">
          M{m}
        </text>
      ))}
      <rect x={x(1)} y={pad.t} width={x(4) - x(1)} height={H - pad.t - pad.b} fill="rgb(var(--gold))" opacity="0.08" />
      <text x={x(1) + 4} y={H - pad.b - 6} fontSize="10" className="fill-muted font-mono">build</text>
      <path d={path(stress)} fill="none" stroke="rgb(var(--muted))" strokeWidth="2" strokeDasharray="2 4" />
      <path d={path(down)} fill="none" stroke="rgb(var(--warn))" strokeWidth="2.5" strokeDasharray="7 5" />
      <path d={path(base)} fill="none" stroke="rgb(var(--teal))" strokeWidth="3" />
      {marker(pbBase, base, 'rgb(var(--teal))', 'Target', 0)}
      {marker(pbDown, down, 'rgb(var(--warn))', '−30%', 16)}
    </svg>
  );
}

function Slider({ id, label, value, min, max, step, onChange, display, tag }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; display: string; tag: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="label !mb-0">{label}</label>
        <span className="num text-lg font-semibold">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1 w-full accent-[rgb(var(--teal))]" />
      <div className="text-xs text-muted">{tag}</div>
    </div>
  );
}

export default function Impact() {
  const [margin, setMargin] = useState(DEF_MARGIN);
  const [trav, setTrav] = useState(derivation.extra);
  const [run, setRun] = useState<number>(DEFAULT_RUNNING);

  const { base, down, stress, pbBase, pbDown, pbStress } = useMemo(() => {
    const input = { margin: margin / 100, travelersPerYear: trav, runningCost: run };
    const base = series(input);
    const down = series(input, DOWNSIDE);
    const stress = series({ ...input, margin: STRESS.margin, delay: STRESS.delay }, STRESS.volume);
    return { base, down, stress, pbBase: paybackMonth(base), pbDown: paybackMonth(down), pbStress: paybackMonth(stress) };
  }, [margin, trav, run]);

  const cpt = contributionPerTraveler(margin / 100);
  const be = breakEvenTravelers(margin / 100);
  const isDefault = margin === DEF_MARGIN && trav === derivation.extra && run === DEFAULT_RUNNING;
  const at = (s: PaybackSeries, m: number) => s[Math.min(m, s.length) - 1].cumulative;
  const low = (s: PaybackSeries) => s.reduce((a, p) => (p.cumulative < a.cumulative ? p : a), s[0]);

  return (
    <>
      <PageHead eyebrow={<>For judges · ZERTTEX 2026 · Case 1</>} title="Impact, plan and payback" sub={`12-week MVP. The case allows up to ${num(BUDGET_CAP)} KZT; Phase 1 needs ${num(budgetTotal)} KZT, built bottom-up. An honest payback model you can stress-test.`}>
        <button type="button" className="btn-primary btn-sm" onClick={startJudgeMode}>
          <Icon name="arrow" size={14} /> Judge mode: 2-minute walkthrough
        </button>
        <a href="#/pilot" className="btn-ghost btn-sm"><Icon name="chart" size={14} /> Pilot dashboard: how we measure it</a>
      </PageHead>

      <Section title="12-week MVP plan" sub="One closed loop shipped end-to-end, then tested with real users.">
        <div className="card overflow-x-auto p-4 sm:p-5">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[220px_repeat(12,1fr)] gap-1 font-mono text-[11px] text-muted">
              <span />
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="text-center">W{i + 1}</span>
              ))}
            </div>
            {gantt.map((g, i) => (
              <div key={i} className="mt-1.5 grid grid-cols-[220px_repeat(12,1fr)] items-center gap-1">
                <div className="pr-2 text-sm">
                  <div className="font-semibold leading-tight">{g.label}</div>
                  <div className="text-xs text-muted">{g.detail}</div>
                </div>
                {Array.from({ length: 12 }, (_, w) => {
                  const on = w + 1 >= g.start && w + 1 <= g.end;
                  return <div key={w} className={`h-7 rounded ${on ? (i === gantt.length - 1 ? 'bg-gold' : 'bg-teal') : 'bg-surface2'}`} />;
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-3 flex flex-wrap items-center gap-2 text-lg font-bold"><Icon name="check" className="text-ok" /> In MVP (12 weeks) <Scope phase="mvp" /></h3>
            <ul className="space-y-1.5 text-sm">
              {inMvp.map((x) => (
                <li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 flex flex-wrap items-center gap-2 text-lg font-bold"><Icon name="clock" className="text-gold" /> Later phases <Scope phase="p2" /></h3>
            <ul className="space-y-1.5 text-sm">
              {later.map((x) => (
                <li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Phase 1 budget" sub={`Bottom-up: every line is quantity × price with a reason. The case cap is ${num(BUDGET_CAP)} KZT; we ask for ${num(budgetTotal)} KZT now. The build fails if Phase 1 does not add up exactly.`}>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3">Item and why</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Months</th>
                <th className="px-4 py-3 text-right">KZT</th>
              </tr>
            </thead>
            <tbody>
              {budget.map((b) => (
                <tr key={b.item} className="border-b border-line/70 align-top">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{b.item}</div>
                    <div className="text-xs text-muted">{b.why}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted" data-gate={b.gate}>{b.group}</td>
                  <td className="num px-4 py-2.5 text-muted">{b.start === b.end ? `M${b.start}` : `M${b.start}–${b.end}`}</td>
                  <td className="num px-4 py-2.5 text-right" data-testid="budget-amount">{num(b.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-night text-nightInk">
                <td className="px-4 py-3 font-bold" colSpan={3}>Phase 1 total (12 months)</td>
                <td className="num px-4 py-3 text-right font-bold" data-testid="budget-total">{num(budgetTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <Tag kind="proposal" extra="planning assumptions" />
          {budgetGroups.map((g) => (
            <span key={g}>{g}: <span className="num text-ink">{millions(groupTotal(g))}</span></span>
          ))}
        </div>
        <div className="card mt-4 p-5 text-sm" data-testid="first-year">
          <h3 className="mb-3 text-lg font-bold">Total first-year costs</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { k: 'One-time costs', v: firstYearOneTime, s: 'build, validation, printed QR cards' },
              { k: 'Operating costs, 12 months', v: firstYearOperating, s: 'hosting, Chinese support, marketing, reserve' },
              { k: 'Total first year', v: firstYearTotal, s: `case limit ${num(BUDGET_CAP)} KZT` },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-line p-3">
                <div className="text-xs text-muted">{x.k}</div>
                <div className="num text-xl font-semibold" data-testid={`fy-${x.k.split(' ')[0].toLowerCase()}`}>{num(x.v)}</div>
                <div className="text-xs text-muted">{x.s}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm" data-testid="monthly-operating">
              <thead><tr className="border-b border-line text-left text-xs text-muted"><th className="py-2 pr-3">Monthly operating costs</th><th className="py-2 pr-3 text-right">Months 1–2</th><th className="py-2 pr-3 text-right">Month 3</th><th className="py-2 pr-3 text-right">Months 4–12</th><th className="py-2 text-right">From month 13</th></tr></thead>
              <tbody><tr><td className="py-2 pr-3">KZT per month</td>{[1, 3, 4, 13].map((m) => (<td key={m} className="num py-2 pr-3 text-right">{num(operatingInMonth(m))}</td>))}</tr></tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">One-time + 12 months of operating costs = {num(firstYearOneTime)} + {num(firstYearOperating)} = {num(firstYearTotal)} KZT, within the {num(BUDGET_CAP)} KZT case limit.</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card p-5 text-sm" data-testid="staged-spending">
            <h3 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold">Staged spending <Tag kind="proposal" /></h3>
            <p className="text-muted">The {num(BUDGET_CAP)} KZT is a cap, not a target.</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-baseline justify-between gap-2"><span className="font-semibold">Phase 1 · build, launch, year-1 operations</span><span className="num font-semibold" data-testid="gate-1">{num(budgetTotal)}</span></div>
              </div>
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-baseline justify-between gap-2"><span className="font-semibold">Phase 2 · only after the month-{M.stageGateMonth} stage gate</span><span className="num font-semibold" data-testid="gate-2">up to {num(PHASE2_MAX)}</span></div>
                <ul className="mt-1.5 space-y-0.5 text-muted">
                  {budgetConfig.phase2.map((x) => (<li key={x}>• {x}</li>))}
                </ul>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">Stage gate at month {M.stageGateMonth}: compare real bookings with the scenarios below. Near the stress-test path → pause paid ads and re-test the offer; Phase 2 is not released.</p>
          </div>
          <div className="card p-5 text-sm">
            <h3 className="mb-2 text-lg font-bold">From month 13 <span className="num text-muted">({kzt(DEFAULT_RUNNING)} / month)</span></h3>
            <ul className="space-y-1 text-muted">
              {budgetConfig.runningItems.map((r) => (<li key={r.item} className="flex justify-between gap-2"><span>{r.item}</span><span className="num">{num(r.amount)}</span></li>))}
            </ul>
            <h3 className="mb-2 mt-4 text-lg font-bold">Not paid from the budget (stated, not hidden)</h3>
            <ul className="space-y-1 text-muted">
              {budgetConfig.notInBudget.map((x) => (<li key={x}>• {x}</li>))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Payback model" sub="Move the sliders. Chart and KPIs update live. Defaults are not tuned to look good.">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="card space-y-6 p-5">
            <Slider id="s-margin" label="Contribution margin" value={margin} min={10} max={50} step={1} onChange={setMargin} display={`${margin}%`} tag={`Team assumption (default ${DEF_MARGIN}%)`} />
            <Slider id="s-trav" label="Extra foreign travelers / year by month 24" value={trav} min={300} max={2500} step={1} onChange={setTrav} display={num(trav)} tag={`Derived from the 30% goal (default ${num(derivation.extra)})`} />
            <Slider id="s-run" label="Running cost after year 1 / month" value={run} min={100_000} max={1_500_000} step={50_000} onChange={setRun} display={kzt(run)} tag={`Team assumption (default ${num(DEFAULT_RUNNING)} KZT)`} />
            <button type="button" className="btn-ghost btn-sm w-full" disabled={isDefault} onClick={() => { setMargin(DEF_MARGIN); setTrav(derivation.extra); setRun(DEFAULT_RUNNING); }}>
              <Icon name="refresh" size={14} /> Reset to defaults
            </button>
            <Tag kind="proposal" extra="model, not a forecast" />
          </div>
          <div className="min-w-0 space-y-5">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                { k: 'Contribution / traveler', v: kzt(cpt), s: `${num(AVG_PRICE)} × ${margin}%` },
                { k: 'Break-even travelers', v: Number.isFinite(be) ? num(be) : 'n/a', s: `${millions(budgetTotal)} ÷ contribution` },
                { k: 'Payback · company target', v: pbBase ? `Month ${pbBase}` : '> 48 mo', s: '100% of the 30% goal path', accent: 'text-teal' },
                { k: 'Payback · worst case −30%', v: pbDown ? `Month ${pbDown}` : '> 48 mo', s: `travelers × ${DOWNSIDE} (required scenario)`, accent: 'text-warn' },
              ].map((x) => (
                <div key={x.k} className="card p-4">
                  <div className="text-xs text-muted">{x.k}</div>
                  <div className={`num mt-1 text-xl font-semibold sm:text-2xl ${x.accent ?? ''}`} aria-live="polite">{x.v}</div>
                  <div className="text-xs text-muted">{x.s}</div>
                </div>
              ))}
            </div>
            <div className="card p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold">Cumulative cash, {MONTHS} months</span>
                <span className="flex items-center gap-1.5"><span className="h-1 w-6 rounded bg-teal" /> Company target</span>
                <span className="flex items-center gap-1.5"><span className="h-1 w-6 rounded border-t-2 border-dashed border-warn" /> Worst case −30%</span>
                <span className="flex items-center gap-1.5"><span className="h-1 w-6 rounded border-t-2 border-dotted border-muted" /> Stress test ({Math.round(STRESS.volume * 100)}%, margin {Math.round(STRESS.margin * 100)}%, +{STRESS.delay} mo): {pbStress ? `M${pbStress}` : 'no payback in 48 mo'}</span>
              </div>
              <Chart base={base} down={down} stress={stress} pbBase={pbBase} pbDown={pbDown} />
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm" data-testid="payback-table">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-4 py-2.5">Cumulative cash</th>
                    <th className="px-4 py-2.5 text-right">Company target</th>
                    <th className="px-4 py-2.5 text-right">Worst case (−30%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line/70"><td className="px-4 py-2">Lowest point</td><td className="num px-4 py-2 text-right">{millions(low(base).cumulative)} (M{low(base).month})</td><td className="num px-4 py-2 text-right">{millions(low(down).cumulative)} (M{low(down).month})</td></tr>
                  <tr className="border-b border-line/70"><td className="px-4 py-2">Month 24</td><td className="num px-4 py-2 text-right">{millions(at(base, 24))}</td><td className="num px-4 py-2 text-right">{millions(at(down, 24))}</td></tr>
                  <tr className="border-b border-line/70"><td className="px-4 py-2">Month {MONTHS}</td><td className="num px-4 py-2 text-right">{millions(at(base, MONTHS))}</td><td className="num px-4 py-2 text-right">{millions(at(down, MONTHS))}</td></tr>
                  <tr><td className="px-4 py-2 font-semibold">Payback month</td><td className="num px-4 py-2 text-right font-semibold text-teal">{pbBase ? `M${pbBase}` : `> M${MONTHS}`}</td><td className="num px-4 py-2 text-right font-semibold text-warn">{pbDown ? `M${pbDown}` : `> M${MONTHS}`}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="card p-5 text-sm">
            <h3 className="mb-2 text-lg font-bold">How the model works</h3>
            <ul className="space-y-1.5 text-muted">
              <li>• Months 1-12: each Phase 1 line is spent evenly over its own months (table above), {millions(budgetTotal)} KZT in total.</li>
              <li>• From month 13: running costs + marketing per month (slider, default {num(DEFAULT_RUNNING)} KZT).</li>
              <li>• Launch at month {M.launchMonth}. Extra foreign travelers ramp linearly: month m gets (m − {M.launchMonth - 1}) / {M.rampEndMonth - M.launchMonth + 1} of the year-2 run rate, reaching 100% at month {M.rampEndMonth}, then flat.</li>
              <li>• Contribution per traveler = {num(AVG_PRICE)} KZT × margin.</li>
              <li>• Worst case (required): {Math.round((1 - DOWNSIDE) * 100)}% fewer extra travelers (× {DOWNSIDE}), same costs. Stress test: {Math.round(STRESS.volume * 100)}% of the path, {Math.round(STRESS.margin * 100)}% margin, launch {STRESS.delay} months late.</li>
              <li>• Monthly net = travelers × contribution − costs. Payback = first month the cumulative total is ≥ 0.</li>
            </ul>
          </div>
          <div className="card p-5 text-sm">
            <h3 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold">Where 1,263 comes from <Tag kind="case" extra="inputs" /></h3>
            <ul className="space-y-1.5 text-muted">
              <li>• ~4% of {num(derivation.travelers2025)} travelers are foreign today ≈ <b className="text-ink">{num(derivation.foreignToday)}</b>.</li>
              <li>• Keep ≈{num(derivation.domestic)} domestic travelers. For 30% foreign: {num(derivation.domestic)} ÷ 0.7 ≈ <b className="text-ink">{num(derivation.total)}</b> total.</li>
              <li>• 30% of {num(derivation.total)} ≈ <b className="text-ink">{num(derivation.foreignNeeded)}</b> foreign → ≈ <b className="text-ink">{num(derivation.extra)}</b> more per year.</li>
              <li className="rounded-lg border border-warn/40 bg-warn/10 p-2 text-ink">
                Note: 150,000,000 ÷ 3,400 = {num(derivation.revPerTraveler)} KZT, slightly above the stated 44,000 KZT average price. The model uses 44,000 KZT and flags the gap.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Pilot success metrics" sub="Measured in week 12 and after. No targets are invented before the pilot baseline.">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <tbody>
              {metrics.map((m) => (
                <tr key={m.metric} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3 font-medium">{m.metric}</td>
                  <td className="px-4 py-3 text-muted">{m.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Top 5 risks" sub="And what we do about each.">
        <div className="grid gap-3 md:grid-cols-2">
          {risks.map((r, i) => (
            <div key={i} className="card flex gap-3 p-4">
              <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-danger/15 text-sm font-semibold text-danger">{i + 1}</span>
              <div className="text-sm">
                <div className="font-semibold">{r.risk}</div>
                <div className="mt-1 text-muted"><span className="font-semibold text-teal">Mitigation: </span>{r.mitigation}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Impact" sub="Who wins if this works.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { h: 'Saryarqa Routes', icon: 'chart' as const, p: ['A second, foreign revenue stream beside ~96% domestic demand.', 'Direct bookings instead of chat-only sales; fewer manual questions.', 'Saves manager time on repeat questions (to measure in pilot).', 'Reusable assets: bilingual tour data, guide videos, trust content.'] },
            { h: 'Travelers', icon: 'users' as const, p: ['Clear prices and inclusions before paying.', 'Pay with a foreign card; Chinese language support.', 'Meet the guide first; refund rules in writing; family updates.'] },
            { h: 'Kazakhstan abroad', icon: 'globe' as const, p: ['Shows Kazakhstan as easy and safe to book for Chinese travelers.', 'Spreads demand to regions: Charyn, Kolsai, Turkestan, Burabay.', 'Postcards on Xiaohongshu / WeChat carry the country image further.'] },
          ].map((c) => (
            <div key={c.h} className="card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-bold"><Icon name={c.icon} className="text-teal" /> {c.h}</h3>
              <ul className="space-y-1.5 text-sm text-muted">
                {c.p.map((x) => (
                  <li key={x} className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 text-teal" />{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">All impact statements are <Tag kind="proposal" /> expected effects, to be measured in the pilot. Phase 1 budget: {millions(budgetTotal)} KZT of the {millions(BUDGET_CAP)} KZT cap.</p>
      </Section>
    </>
  );
}
