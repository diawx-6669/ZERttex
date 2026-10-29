// Shared by the Worker (server) and the browser (direct Gemini demo mode):
// what the browser may send, how the model output is cleaned, and the price guard.
// No runtime dependencies, so both sides import it as is.

import grounding from './grounding.json';
import { BUDGETS, INTERESTS, LABELS, ROUTES, TOUR_IDS, type EndpointName } from './prompts';

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lang = (v: unknown): 'en' | 'zh' => (v === 'zh' ? 'zh' : 'en');
export const pick = <T extends string>(arr: unknown, allowed: readonly T[], max = 10): T[] =>
  Array.isArray(arr) ? [...new Set(arr.filter((x): x is T => allowed.includes(x as T)))].slice(0, max) : [];
const strings = (arr: unknown, n: number, maxLen: number) =>
  Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim().slice(0, maxLen)).slice(0, n) : [];
const CLAIMS = /(\bbest\b|no\.?\s?1|\bofficial\b|guarantee|\bcertified\b|\blicen[cs]ed\b|最好|第一|官方|保证|认证|最便宜)/i;

// ---------- input: what the browser may send ----------
export function userInput(name: EndpointName, body: Record<string, unknown>): Record<string, unknown> | null {
  switch (name) {
    case 'chat': {
      const question = str(body.question, 600);
      if (!question) return null;
      const history = Array.isArray(body.history)
        ? body.history.slice(-6).map((h) => ({ from: (h as { from?: string })?.from === 'user' ? 'user' : 'assistant', text: str((h as { text?: unknown })?.text, 400) }))
        : [];
      return { lang: lang(body.lang), question, recentConversation: history, currentTour: pick([body.tourId], TOUR_IDS)[0] ?? null };
    }
    case 'plan': {
      const text = str(body.text, 800);
      return text ? { lang: lang(body.lang), description: text } : null;
    }
    case 'caption': {
      const tourId = pick([body.tourId], TOUR_IDS)[0];
      return tourId ? { tourId, travelerMessage: str(body.message, 140) } : null;
    }
    case 'manager': {
      const question = str(body.question, 800);
      return question ? { travelerLang: lang(body.travelerLang), question, tourId: pick([body.tourId], TOUR_IDS)[0] ?? null } : null;
    }
    case 'translate': {
      const text = str(body.text, 600);
      const L = ['zh', 'ru', 'en', 'kk'] as const;
      const from = pick([body.from], L)[0];
      const to = pick([body.to], L)[0];
      return text && from && to && from !== to ? { from, to, text } : null;
    }
  }
}

// ---------- price guard: the model can never put a made-up amount in front of a traveler ----------
// Every number of 100 or more in a reply must be a number that exists in the verified data,
// or a total built from verified tour/extra prices (× 1–12 travelers, any combination of tours),
// or, when "$"/"¥"/"元" is written next to it, that total at the demo rates; or a year.
// Otherwise the reply is rejected.

const RATE_USD = 500;
const RATE_CNY = 70;

type Found = { n: number; cur: 'usd' | 'cny' | null };
const KZT_NEAR = /(kzt|₸|坚戈|тенге|tenge)/i;
const USD_NEAR = /(\$|usd|美元|美金|dollar)/i;
const CNY_NEAR = /(¥|￥|cny|rmb|元|人民币|yuan)/i;

/** Numbers written in a text (54000 · 54,000 · 54 000 · 5.4万) with the currency written next to them. */
function found(text: string): Found[] {
  const out: Found[] = [];
  const re = /(\d{1,3}(?:[,\u00a0\u202f ]\d{3})+|\d+(?:\.\d+)?)\s*(万|千|k\b|K\b)?/g;
  for (const m of text.matchAll(re)) {
    let n = Number(m[1].replace(/[,\u00a0\u202f ]/g, ''));
    if (m[2] === '万') n *= 10_000;
    else if (m[2]) n *= 1_000;
    if (!Number.isFinite(n)) continue;
    const at = m.index ?? 0;
    const near = text.slice(Math.max(0, at - 4), at) + ' ' + text.slice(at + m[0].length, at + m[0].length + 6);
    out.push({ n, cur: KZT_NEAR.test(near) ? null : USD_NEAR.test(near) ? 'usd' : CNY_NEAR.test(near) ? 'cny' : null });
  }
  return out;
}
export const numbersIn = (text: string) => found(text).map((f) => f.n);

const allowed = (() => {
  const exact = new Set<number>();
  const walk = (v: unknown) => {
    if (typeof v === 'number') exact.add(v);
    else if (typeof v === 'string') numbersIn(v).forEach((n) => exact.add(n));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(grounding);
  const tours = grounding.tours.list as { demoPriceKztPerPerson: number; optionalExtra?: { priceKzt?: number }[] }[];
  const prices = tours.map((t) => t.demoPriceKztPerPerson);
  const extras = tours.flatMap((t) => (t.optionalExtra ?? []).map((x) => x.priceKzt ?? 0)).filter(Boolean);
  const kzt = new Set<number>();
  // Every combination of tours (multi-tour bookings) and single extras, for 1–12 travelers.
  for (let mask = 1; mask < 1 << prices.length; mask++) {
    const sum = prices.reduce((s, p, i) => (mask & (1 << i) ? s + p : s), 0);
    for (let n = 1; n <= 12; n++) kzt.add(sum * n);
  }
  for (const e of extras) for (let n = 1; n <= 12; n++) kzt.add(e * n);
  const usd: number[] = [];
  const cny: number[] = [];
  for (const k of kzt) {
    exact.add(k);
    usd.push(k / RATE_USD);
    cny.push(k / RATE_CNY);
  }
  return { exact, usd, cny };
})();

const close = (list: number[], n: number) => list.some((c) => Math.abs(c - n) <= Math.max(1, c * 0.02));
const okNumber = ({ n, cur }: Found) =>
  n < 100 ||
  (Number.isInteger(n) && n >= 1900 && n <= 2100) ||
  allowed.exact.has(n) ||
  (cur === 'usd' && close(allowed.usd, n)) ||
  (cur === 'cny' && close(allowed.cny, n));

/** Returns the numbers that are not backed by verified data (empty = reply is safe). */
export const unverifiedNumbers = (text: string) => found(text).filter((f) => !okNumber(f)).map((f) => f.n);

// ---------- output: validate and clean what the model returned ----------
export function cleanOutput(name: EndpointName, raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  switch (name) {
    case 'chat': {
      const answer = str(o.answer, 1200);
      if (!answer) return null;
      const bad = unverifiedNumbers(answer);
      // Blocked reply: the caller shows its checked (scripted) answer and offers the manager.
      if (bad.length) return { blocked: 'unverified_number', numbers: bad.slice(0, 5) };
      return { answer, labels: pick(o.labels, LABELS), actions: pick(o.actions, ROUTES, 3), priceCheck: 'passed' };
    }
    case 'plan': {
      const int = (v: unknown, lo: number, hi: number) => (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : 0);
      return {
        destinations: pick(o.destinations, TOUR_IDS, 4),
        days: int(o.days, 1, 30),
        travelers: int(o.travelers, 1, 12),
        interests: pick(o.interests, INTERESTS, 5),
        budget: pick([o.budget], BUDGETS)[0] ?? 'unknown',
        note: str(o.note, 300),
      };
    }
    case 'caption': {
      const keep = (c: string) => !CLAIMS.test(c) && unverifiedNumbers(c).length === 0;
      const zh = strings(o.zh, 3, 80).filter(keep);
      const en = strings(o.en, 3, 160).filter(keep);
      return zh.length && en.length ? { zh, en } : null;
    }
    case 'manager': {
      const summary = str(o.summary_ru, 600);
      const reply = str(o.reply, 1500);
      if (!summary || !reply) return null;
      // Numbers inside [placeholders] are for the manager to fill in, not claims.
      const bad = unverifiedNumbers(reply.replace(/\[[^\]]*\]/g, ''));
      const check = strings(o.check_ru, 4, 200);
      if (bad.length) check.unshift(`Проверьте цифры, их нет в проверенных данных: ${bad.join(', ')}`);
      return { summary_ru: summary, reply, check_ru: check.slice(0, 5), labels: pick(o.labels, LABELS) };
    }
    case 'translate': {
      const text = str(o.text, 1200);
      return text ? { text, pinyin: str(o.pinyin, 1200) } : null;
    }
  }
}
