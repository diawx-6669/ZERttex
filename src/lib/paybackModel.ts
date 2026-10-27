// Payback model for the Impact page and the submission documents.
// Planning assumptions only. Every input comes from budgetConfig (src/data/budget.ts).
//
// Cash out:
//   • one-time lines spread evenly over months 1-3
//   • everything else (recurring + reserve) spread evenly over months 1-12
//   • from month 13: running cost per month
// Cash in:
//   • launch at month 4
//   • extra foreign travelers ramp linearly from launch to the yearly run rate
//     at month 24, then stay flat. Ramp factor for month m (4…24) = (m − 3) / 21
//   • contribution per traveler = average price × contribution margin
// Downside: travelers × 0.7 (30% lower results).

import { BUDGET_CAP, budgetConfig, oneTimeTotal, otherTotal } from '../data/budget';

const M = budgetConfig.model;
export const AVG_PRICE = M.avgPrice;
export const MONTHS = M.horizonMonths;
export const DEFAULT_MARGIN = M.margin;
export const DEFAULT_RUNNING = M.runningCostPerMonth;
export const DOWNSIDE = M.downsideFactor;

export type PaybackInput = {
  margin: number; // 0..1
  travelersPerYear: number; // extra foreign travelers per year at month 24
  runningCost: number; // KZT per month after year 1
  oneTime?: number;
  other?: number;
};

export type PaybackSeries = { month: number; cumulative: number; travelers: number }[];

export function contributionPerTraveler(margin: number) {
  return AVG_PRICE * margin;
}

export function ramp(m: number) {
  if (m < M.launchMonth) return 0;
  if (m >= M.rampEndMonth) return 1;
  return (m - (M.launchMonth - 1)) / (M.rampEndMonth - (M.launchMonth - 1));
}

export function series(input: PaybackInput, factor = 1): PaybackSeries {
  const oneTime = input.oneTime ?? oneTimeTotal;
  const other = input.other ?? otherTotal;
  const cpt = contributionPerTraveler(input.margin);
  const monthlyRun = (input.travelersPerYear * factor) / 12;
  let cum = 0;
  const out: PaybackSeries = [];
  for (let m = 1; m <= MONTHS; m++) {
    let cost = 0;
    if (m <= M.oneTimeMonths) cost += oneTime / M.oneTimeMonths;
    if (m <= M.otherMonths) cost += other / M.otherMonths;
    else cost += input.runningCost;
    const travelers = monthlyRun * ramp(m);
    cum += travelers * cpt - cost;
    out.push({ month: m, cumulative: cum, travelers });
  }
  return out;
}

/** First month where cumulative cash is ≥ 0 (after launch), or null if not within the horizon. */
export function paybackMonth(s: PaybackSeries): number | null {
  const hit = s.find((p) => p.month >= M.launchMonth && p.cumulative >= 0);
  return hit ? hit.month : null;
}

export function breakEvenTravelers(margin: number, investment = BUDGET_CAP) {
  const cpt = contributionPerTraveler(margin);
  return cpt > 0 ? Math.ceil(investment / cpt) : Infinity;
}

// Derivation of the default 1,263 extra foreign travelers (shown on the page).
export const derivation = (() => {
  const c = budgetConfig.caseFacts;
  const travelers2025 = c.travelers2025;
  const foreignToday = Math.round(travelers2025 * c.foreignShareToday); // 136
  const domestic = travelers2025 - foreignToday; // 3,264
  const total = Math.round(domestic / (1 - c.goalForeignShare)); // 4,663
  const foreignNeeded = Math.round(total * c.goalForeignShare); // 1,399
  const extra = foreignNeeded - foreignToday; // 1,263
  const revPerTraveler = c.revenue2025 / travelers2025; // 44,117.6
  return { travelers2025, foreignToday, domestic, total, foreignNeeded, extra, revPerTraveler };
})();

/** Default scenario, base and downside, used by the Impact page tests and the submission generators. */
export function defaultResults() {
  const input = { margin: DEFAULT_MARGIN, travelersPerYear: derivation.extra, runningCost: DEFAULT_RUNNING };
  const base = series(input);
  const down = series(input, DOWNSIDE);
  const low = (s: PaybackSeries) => s.reduce((a, p) => (p.cumulative < a.cumulative ? p : a), s[0]);
  return {
    input,
    base,
    down,
    pbBase: paybackMonth(base),
    pbDown: paybackMonth(down),
    lowBase: low(base),
    lowDown: low(down),
    breakEven: breakEvenTravelers(DEFAULT_MARGIN),
    contribution: contributionPerTraveler(DEFAULT_MARGIN),
  };
}
