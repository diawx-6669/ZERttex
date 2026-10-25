// Payback model for the Impact page. Planning assumptions only.
//
// Cash out:
//   • one-time 12,000,000 KZT spread evenly over months 1–3
//   • the other 8,000,000 KZT spread evenly over months 1–12
//   • from month 13: running cost per month (slider)
// Cash in:
//   • launch at month 4
//   • extra foreign travelers ramp linearly from launch to the year-2 run rate
//     at month 24, then stay flat. Ramp factor for month m (4…24) = (m − 3) / 21
//   • contribution per traveler = 44,000 KZT × contribution margin

export const AVG_PRICE = 44_000;
export const MONTHS = 48;

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
  if (m < 4) return 0;
  if (m >= 24) return 1;
  return (m - 3) / 21;
}

export function series(input: PaybackInput, factor = 1): PaybackSeries {
  const oneTime = input.oneTime ?? 12_000_000;
  const other = input.other ?? 8_000_000;
  const cpt = contributionPerTraveler(input.margin);
  const monthlyRun = (input.travelersPerYear * factor) / 12;
  let cum = 0;
  const out: PaybackSeries = [];
  for (let m = 1; m <= MONTHS; m++) {
    let cost = 0;
    if (m <= 3) cost += oneTime / 3;
    if (m <= 12) cost += other / 12;
    else cost += input.runningCost;
    const travelers = monthlyRun * ramp(m);
    cum += travelers * cpt - cost;
    out.push({ month: m, cumulative: cum, travelers });
  }
  return out;
}

/** First month where cumulative cash is ≥ 0 (after launch), or null if not within 48 months. */
export function paybackMonth(s: PaybackSeries): number | null {
  const hit = s.find((p) => p.month >= 4 && p.cumulative >= 0);
  return hit ? hit.month : null;
}

export function breakEvenTravelers(margin: number, investment = 20_000_000) {
  const cpt = contributionPerTraveler(margin);
  return cpt > 0 ? Math.ceil(investment / cpt) : Infinity;
}

// Derivation of the default 1,263 extra foreign travelers (shown on the page).
export const derivation = (() => {
  const travelers2025 = 3400;
  const foreignToday = Math.round(travelers2025 * 0.04); // 136
  const domestic = travelers2025 - foreignToday; // 3,264
  const total = Math.round(domestic / 0.7); // 4,663
  const foreignNeeded = Math.round(total * 0.3); // 1,399
  const extra = foreignNeeded - foreignToday; // 1,263
  const revPerTraveler = 150_000_000 / travelers2025; // 44,117.6
  return { travelers2025, foreignToday, domestic, total, foreignNeeded, extra, revPerTraveler };
})();
