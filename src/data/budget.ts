// ONE place for every money assumption in the project.
// The Impact page, KPI tiles, chart, payback model and the submission
// generators (scripts/*) all read from `budgetConfig`. Change a number here,
// rebuild, and every screen and document follows.
//
// Case rule: development and launch in year 1 within 20,000,000 KZT. The build
// fails (vite.config.ts → budgetGuard) if the lines do not add up to BUDGET_CAP.

import type { TagKind } from './types';

export const BUDGET_CAP = 20_000_000;

export type BudgetKind = 'one-time' | 'recurring' | 'reserve';
/** Staged spending: gate 1 funds the MVP + pilot; gate 2 is released only if pilot metrics are met. */
export type BudgetGate = 1 | 2;
export type BudgetLine = { item: string; zh: string; amount: number; kind: BudgetKind; gate: BudgetGate; label: TagKind };

export const budgetConfig = {
  cap: BUDGET_CAP,
  currency: 'KZT',
  /** Year-1 lines (Stage 1 planning assumptions, team proposal). AI usage is inside "Hosting, AI usage, maintenance". */
  lines: [
    { item: 'Design & development', zh: '设计与开发', amount: 8_000_000, kind: 'one-time', gate: 1, label: 'proposal' },
    { item: 'Localization EN / 中文', zh: '英文/中文本地化', amount: 1_500_000, kind: 'one-time', gate: 1, label: 'proposal' },
    { item: 'Payment integration & testing', zh: '支付接入与测试', amount: 1_500_000, kind: 'one-time', gate: 1, label: 'proposal' },
    { item: 'Trust content: guide videos, photos', zh: '信任内容：导游视频、照片', amount: 1_000_000, kind: 'one-time', gate: 1, label: 'proposal' },
    { item: 'Marketing & acquisition', zh: '营销与获客', amount: 4_500_000, kind: 'recurring', gate: 2, label: 'proposal' },
    { item: 'Hosting, AI usage, maintenance', zh: '托管、AI 用量、维护', amount: 1_500_000, kind: 'recurring', gate: 1, label: 'proposal' },
    { item: 'Pilot & support', zh: '试点与客服', amount: 1_000_000, kind: 'recurring', gate: 1, label: 'proposal' },
    { item: 'Contingency', zh: '预备金', amount: 1_000_000, kind: 'reserve', gate: 2, label: 'proposal' },
  ] as BudgetLine[],
  model: {
    /** Case fact. */
    avgPrice: 44_000,
    /** Team assumption. */
    margin: 0.3,
    /** Team assumption: KZT per month from month 13. */
    runningCostPerMonth: 300_000,
    /** One-time lines are spent over months 1..oneTimeMonths; the rest over months 1..otherMonths. */
    oneTimeMonths: 3,
    otherMonths: 12,
    launchMonth: 4,
    /** Ramp reaches the full yearly rate at this month, then stays flat. */
    rampEndMonth: 24,
    /** Worse case: 30% lower results. */
    downsideFactor: 0.7,
    horizonMonths: 48,
  },
  /** Case facts used to derive the target of extra foreign travelers. */
  caseFacts: {
    travelers2025: 3_400,
    revenue2025: 150_000_000,
    foreignShareToday: 0.04,
    goalForeignShare: 0.3,
  },
} as const;

export const budget: BudgetLine[] = budgetConfig.lines;
export const sumOf = (kind?: BudgetKind) => budget.filter((b) => !kind || b.kind === kind).reduce((s, b) => s + b.amount, 0);
export const budgetTotal = sumOf();
export const oneTimeTotal = sumOf('one-time');
export const recurringTotal = sumOf('recurring');
export const reserveTotal = sumOf('reserve');
/** Everything that is not one-time (recurring + contingency), spread over months 1-12. */
export const otherTotal = budgetTotal - oneTimeTotal;
export const gateTotal = (g: BudgetGate) => budget.filter((b) => b.gate === g).reduce((s, b) => s + b.amount, 0);

/** Throws if the budget lines do not add up to the cap. Used at build time. */
export function assertBudget() {
  if (budgetTotal !== BUDGET_CAP) throw new Error(`Budget lines add up to ${budgetTotal.toLocaleString('en-US')} KZT, but BUDGET_CAP is ${BUDGET_CAP.toLocaleString('en-US')} KZT.`);
}

export const gantt: { label: string; start: number; end: number; detail: string }[] = [
  { label: 'Research & validation', start: 1, end: 2, detail: '10+ interviews with Chinese-speaking travelers; competitor scan' },
  { label: 'UX + tour pages', start: 3, end: 4, detail: 'Wireframes, EN/中文 tour pages, design system' },
  { label: 'Booking, inclusions, concierge, trust', start: 5, end: 7, detail: 'Core flow and Trust Center content' },
  { label: 'Trip builder, checkout, weather/reschedule', start: 8, end: 9, detail: 'Hosted checkout sandbox, reschedule workflow' },
  { label: 'Usability tests + payment-provider checks', start: 10, end: 11, detail: '5-8 test sessions; provider due diligence' },
  { label: 'Pilot with real users', start: 12, end: 12, detail: 'Limited launch, measure success metrics' },
];

/** In MVP: built in the 12 weeks. Mirrors the "In MVP" badges in the app. */
export const inMvp = [
  'EN / 中文 tour pages with "What\'s included" breakdown',
  '3-step booking with international card via hosted checkout',
  'Scripted bilingual concierge with human handoff',
  'Trust Center: guide videos, verification checklist, refund policy',
  'Rules-based trip builder',
  'My trip: timeline, check-ins, reschedule requests',
  'Postcard + referral link',
];

/** Phase 2: after the pilot. Mirrors the "Phase 2" badges in the app. */
export const later = [
  'Live LLM concierge with retrieval over verified tour data',
  'Live Alipay / WeChat Pay after provider approval',
  'Live weather and road feeds',
  'GPS-based family sharing',
  'Offline audio downloads',
  'Listing on Trip.com / Klook',
];

export const risks: { risk: string; mitigation: string }[] = [
  {
    risk: 'Payment-provider approval is slow or refused (Alipay / WeChat Pay)',
    mitigation: 'Launch with international cards via a hosted checkout; apply to providers in week 1; keep manager-assisted payment as fallback.',
  },
  {
    risk: 'AI concierge gives a wrong answer (price, availability, visa)',
    mitigation: 'Answer only from verified tour data; show labels; "I won\'t guess" rule with handoff to a human manager; weekly review of logs.',
  },
  {
    risk: 'Low demand from Chinese travelers',
    mitigation: 'Validate with 10+ interviews before building; small pilot; test Xiaohongshu content and postcards before paid ads.',
  },
  {
    risk: 'Cross-border data and privacy rules',
    mitigation: 'Collect minimum data (no passport, no card numbers); legal review of Kazakhstan and China rules before launch; family sharing off by default.',
  },
  {
    risk: 'Guides\' Chinese skills are not good enough',
    mitigation: 'Test guide language level; partner with interpreters; mark Chinese-guide availability "Not yet confirmed" until checked; audio guide in Chinese as backup.',
  },
];

export const metrics: { metric: string; target: string }[] = [
  { metric: 'Booking completion (start → paid)', target: 'Team to set after pilot baseline' },
  { metric: 'Concierge questions answered without handoff', target: 'Track; review every wrong answer' },
  { metric: 'Manager time on repeat questions', target: 'Saves manager time on repeat questions (to measure in pilot)' },
  { metric: 'Pre-trip video calls requested', target: 'Track share of bookings' },
  { metric: 'Foreign travelers per month', target: 'Ramp toward ≈105/month by month 24' },
  { metric: 'Postcards shared → referral bookings', target: 'Track referral link clicks and bookings' },
  { metric: 'Post-trip satisfaction (survey)', target: 'Collect after every pilot trip' },
];
