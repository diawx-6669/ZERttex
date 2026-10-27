// Payback model for the Impact page and the submission documents.
// Planning assumptions only. Every input comes from budgetConfig (src/data/budget.ts)
// and mirrors the team's spreadsheet (Saryarqa_Go_Budget_8M_Payback_Model.xlsx).
//
// Cash out:
//   • months 1-12: each Phase 1 budget line spread evenly over its own months
//   • from month 13: running costs + marketing per month
// Cash in:
//   • launch at month 4 (+ any delay)
//   • extra foreign travelers = volume × yearly target / 12 × ramp,
//     ramp = min(1, (m − launch − delay + 1) / (24 − launch + 1))
//   • contribution per traveler = average price × contribution margin
// Scenarios: company target (volume 1), required worse case (−30% → 0.7),
// stress test (0.4 volume, 25% margin, launch 2 months late).

import { budgetConfig, budgetTotal, spendInMonth } from '../data/budget';

const M = budgetConfig.model;
export const AVG_PRICE = M.avgPrice;
export const MONTHS = M.horizonMonths;
export const DEFAULT_MARGIN = M.margin;
export const DEFAULT_RUNNING = M.runningCostPerMonth;
export const DOWNSIDE = M.downsideFactor;
export const STRESS = M.stress;

export type PaybackInput = {
  margin: number; // 0..1
  travelersPerYear: number; // extra foreign travelers per year at month 24
  runningCost: number; // KZT per month after year 1
  /** Launch delay in months (stress test). */
  delay?: number;
};

export type PaybackSeries = { month: number; cumulative: number; travelers: number }[];

export function contributionPerTraveler(margin: number) {
  return AVG_PRICE * margin;
}

export function ramp(m: number, delay = 0) {
  const start = M.launchMonth + delay;
  if (m < start) return 0;
  return Math.min(1, (m - start + 1) / (M.rampEndMonth - M.launchMonth + 1));
}

export function series(input: PaybackInput, factor = 1): PaybackSeries {
  const cpt = contributionPerTraveler(input.margin);
  const monthlyRun = (input.travelersPerYear * factor) / 12;
  const delay = input.delay ?? 0;
  let cum = 0;
  const out: PaybackSeries = [];
  for (let m = 1; m <= MONTHS; m++) {
    const cost = m <= 12 ? spendInMonth(m) : input.runningCost;
    const travelers = monthlyRun * ramp(m, delay);
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

export function breakEvenTravelers(margin: number, investment = budgetTotal) {
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

/** Default scenarios used by the Impact page, tests and the submission generators. */
export function defaultResults() {
  const input = { margin: DEFAULT_MARGIN, travelersPerYear: derivation.extra, runningCost: DEFAULT_RUNNING };
  const base = series(input);
  const down = series(input, DOWNSIDE);
  const stress = series({ ...input, margin: STRESS.margin, delay: STRESS.delay }, STRESS.volume);
  const low = (s: PaybackSeries) => s.reduce((a, p) => (p.cumulative < a.cumulative ? p : a), s[0]);
  return {
    input,
    base,
    down,
    stress,
    pbBase: paybackMonth(base),
    pbDown: paybackMonth(down),
    pbStress: paybackMonth(stress),
    lowBase: low(base),
    lowDown: low(down),
    lowStress: low(stress),
    breakEven: breakEvenTravelers(DEFAULT_MARGIN),
    contribution: contributionPerTraveler(DEFAULT_MARGIN),
    /** Travelers per month needed to cover running costs from month 13. */
    monthlyBreakEven: DEFAULT_RUNNING / contributionPerTraveler(DEFAULT_MARGIN),
  };
}
