// ONE place for every money assumption in the project.
// The Impact page, KPI tiles, chart, payback model and the submission
// generators (scripts/*) all read from `budgetConfig`. Change a number here,
// rebuild, and every screen and document follows.
//
// Case rule: development and launch in year 1 within 20,000,000 KZT. The build
// fails (vite.config.ts → budgetGuard) if the lines do not add up to BUDGET_CAP.

import type { TagKind } from './types';

/** Case cap for development, launch and year-1 operations (organizers, Stage 2 clarification). */
export const BUDGET_CAP = 20_000_000;
/** Phase 1: what we actually ask for. Bottom-up, every line justified. Must add up exactly. */
export const PHASE1_TOTAL = 8_000_000;
/** Phase 2: the rest of the cap, released only after the month-9 stage gate. */
export const PHASE2_MAX = BUDGET_CAP - PHASE1_TOTAL;

export type BudgetGroup = 'Build' | 'Validation' | 'Launch' | 'Operations' | 'Reserve';
export type BudgetKind = 'one-time' | 'recurring' | 'reserve';
export type BudgetGate = 1 | 2;
export type BudgetLine = {
  item: string;
  zh: string;
  amount: number;
  group: BudgetGroup;
  /** Spent evenly over months start..end (inclusive). */
  start: number;
  end: number;
  why: string;
  kind: BudgetKind;
  gate: BudgetGate;
  label: TagKind;
};

const L = (item: string, zh: string, amount: number, group: BudgetGroup, start: number, end: number, why: string): BudgetLine => ({
  item, zh, amount, group, start, end, why,
  kind: group === 'Reserve' ? 'reserve' : group === 'Build' || group === 'Validation' ? 'one-time' : 'recurring',
  gate: 1,
  label: 'proposal',
});

export const budgetConfig = {
  cap: BUDGET_CAP,
  phase1: PHASE1_TOTAL,
  currency: 'KZT',
  /** Phase 1 lines (team model: Saryarqa_Go_Budget_8M_Payback_Model.xlsx → Budget_8M). */
  lines: [
    L('Senior full-stack developer (contract)', '高级全栈开发（合同）', 2_100_000, 'Build', 1, 3, 'Booking flow, payment-page integration, admin page, database, security basics. 3 months × 700,000. Benchmark: hh.kz median salary expectation for senior IT ≈508,000 KZT/month (Q1 2026) + contract premium.'),
    L('UX/UI design finishing (freelance)', 'UX/UI 设计完善', 400_000, 'Build', 1, 2, 'Turn the prototype into a consistent, accessible EN/ZH design system (mobile first). About 4 weeks part-time.'),
    L('Localization ZH + EN, native proofreading', '中英本地化与母语校对', 600_000, 'Build', 2, 3, 'UI, 4 tour pages × 4 lists, trust page, refund rules, privacy notice, chat scripts.'),
    L('Legal: offer, refund rules, privacy, data consent', '法务：条款、退款、隐私', 450_000, 'Build', 1, 3, 'Public offer / terms, refund rules, privacy notice and personal-data consent under Kazakhstan law; review of the payment-provider contract.'),
    L('Payment provider onboarding + real test payments', '支付服务商接入与真实测试', 150_000, 'Build', 2, 3, 'Provider set-up fees (if any) and real test payments with foreign cards before launch.'),
    L('Guide videos + tour photos (4 guides, 4 tours)', '导游视频与线路照片', 500_000, 'Build', 2, 3, '60–90 s video per guide with ZH/EN subtitles + photos of 4 tours, hosted on our own storage (YouTube is not reachable from mainland China).'),
    L('Pre-launch security review', '上线前安全审查', 250_000, 'Build', 3, 3, 'External review of payment flow, admin access and data storage before real payments start.'),
    L('Interviews + usability tests', '访谈与可用性测试', 250_000, 'Validation', 1, 3, 'At least 10 interviews + 5–8 usability sessions with Chinese-speaking travelers: small incentives, recruiting.'),
    L('Xiaohongshu content + creator collaborations', '小红书内容与达人合作', 1_200_000, 'Launch', 4, 12, 'Own Xiaohongshu notes + short videos, small paid collaborations with travel creators (KOC).'),
    L('Printed postcards + QR cards', '印刷明信片与二维码卡', 100_000, 'Launch', 4, 4, 'Postcards with QR code for guides, hotel and hostel partners (pilot quantity).'),
    L('Hosting, CDN, database, domain, e-mail, monitoring', '托管、CDN、数据库、邮件、监控', 300_000, 'Operations', 1, 12, 'Hosting and CDN reachable from mainland China, database, domain, e-mail, monitoring. ≈25,000/month.'),
    L('Chinese-speaking support, part-time', '中文客服（兼职）', 1_080_000, 'Operations', 4, 12, 'Chat hand-off and 5-minute video calls before payment. 9 months × 120,000.'),
    L('Contingency reserve (assumed fully spent)', '预备金（按全部花完计）', 620_000, 'Reserve', 3, 12, 'About 8% for overruns and post-launch fixes. Assumed fully spent in the model.'),
  ] as BudgetLine[],
  /** Monthly costs from month 13, paid from operations (team estimates). */
  runningItems: [
    { item: 'Hosting & tools', amount: 25_000 },
    { item: 'Chinese-speaking support, part-time', amount: 120_000 },
    { item: 'Developer retainer for fixes', amount: 100_000 },
    { item: 'Marketing (Xiaohongshu + small creator collaborations)', amount: 150_000 },
  ],
  /** Not paid from the budget, stated openly. */
  notInBudget: [
    'Team of 4 works unpaid (research, content entry, QA, interview coordination).',
    'Saryarqa Routes staff: product owner, the manager who answers hand-offs and confirms "not yet confirmed" items, guides.',
    'Payment-provider fees per transaction: inside the 30% contribution-margin assumption.',
  ],
  /** Phase 2, funded from the rest of the cap only after the month-9 stage gate. */
  phase2: [
    'Alipay / WeChat Pay online checkout (after provider approval)',
    'Live AI concierge (already shown as a preview in this prototype)',
    'AI trip builder, live weather and road data',
    'Scaled marketing toward the full company target',
    'Listing 1–2 standard day tours on Trip.com / Ctrip',
  ],
  model: {
    /** Case fact. */
    avgPrice: 44_000,
    /** Team assumption, to confirm with the company. */
    margin: 0.3,
    /** Sum of runningItems, KZT per month from month 13. */
    runningCostPerMonth: 395_000,
    launchMonth: 4,
    /** Ramp reaches the full yearly rate at this month, then stays flat. */
    rampEndMonth: 24,
    /** Required worse case: 30% lower results (70% of the company target path). */
    downsideFactor: 0.7,
    /** Stress test: 40% of the target path, 25% margin, launch 2 months late. */
    stress: { volume: 0.4, margin: 0.25, delay: 2 },
    stageGateMonth: 9,
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
export const groupTotal = (g: BudgetGroup) => budget.filter((b) => b.group === g).reduce((s, b) => s + b.amount, 0);
export const budgetGroups: BudgetGroup[] = ['Build', 'Validation', 'Launch', 'Operations', 'Reserve'];
/** Phase 1 total (what we ask for). */
export const budgetTotal = sumOf();
export const oneTimeTotal = sumOf('one-time');
export const recurringTotal = sumOf('recurring');
export const reserveTotal = sumOf('reserve');
export const otherTotal = budgetTotal - oneTimeTotal;
/** Gate 1 = Phase 1 lines; gate 2 = the rest of the cap, released after the stage gate. */
export const gateTotal = (g: BudgetGate) => (g === 1 ? budgetTotal : BUDGET_CAP - budgetTotal);

/** Spend in month m (1..12) from the Phase 1 lines. */
export function spendInMonth(m: number) {
  return budget.reduce((s, b) => (m >= b.start && m <= b.end ? s + b.amount / (b.end - b.start + 1) : s), 0);
}

/** Throws if Phase 1 does not add up exactly or exceeds the case cap. Used at build time. */
export function assertBudget() {
  if (budgetTotal !== PHASE1_TOTAL) throw new Error(`Phase 1 lines add up to ${budgetTotal.toLocaleString('en-US')} KZT, expected ${PHASE1_TOTAL.toLocaleString('en-US')}.`);
  if (budgetTotal > BUDGET_CAP) throw new Error('Phase 1 exceeds the case cap.');
  const run = budgetConfig.runningItems.reduce((s, r) => s + r.amount, 0);
  if (run !== budgetConfig.model.runningCostPerMonth) throw new Error(`Running items add up to ${run}, model says ${budgetConfig.model.runningCostPerMonth}.`);
  for (const b of budget) if (b.start < 1 || b.end > 12 || b.start > b.end) throw new Error(`Bad months for ${b.item}`);
}

export const gantt: { label: string; start: number; end: number; detail: string }[] = [
  { label: 'Interviews, margin check, payment applications', start: 1, end: 2, detail: 'Done when: ≥10 interviews; margin confirmed with the company; 2 provider applications sent' },
  { label: 'Design + 4 tour pages EN / 中文', start: 3, end: 4, detail: 'Done when: pages checked by ≥3 target users' },
  { label: 'Booking, four lists, scripted chat, trust page', start: 5, end: 7, detail: 'Done when: a full test booking works in provider test mode' },
  { label: 'Trip page, real payment page, security review', start: 8, end: 9, detail: 'Done when: staff make a first real payment' },
  { label: 'Usability tests + payment checks', start: 10, end: 11, detail: 'Done when: 5–8 sessions, no blocking issue left' },
  { label: 'Pilot with real travelers', start: 12, end: 12, detail: 'Measure completion rate, chat hand-off rate, postcard bookings' },
];

/** In MVP: built in the 12 weeks. Mirrors the "In MVP" badges in the app. */
export const inMvp = [
  'EN / 中文 tour pages with the four "What\'s included" lists',
  '3-step booking; real foreign-card payment on the provider\'s hosted page',
  'Trust Center: real guide videos, 5-minute call before paying, refund rules',
  'Scripted bilingual chat with hand-off to a manager',
  'My trip page: booking code, check-ins, manager-handled rescheduling',
  'Postcard with a real QR code + referral link',
];

/** Phase 2: after the pilot. Mirrors the "Phase 2" badges in the app. */
export const later = [
  'Live AI concierge with retrieval over verified tour data (preview in prototype)',
  'Alipay / WeChat Pay online after provider approval',
  'AI trip builder, live weather and road feeds',
  'Family updates, offline audio guide',
  'Listing 1–2 day tours on Trip.com / Ctrip',
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
  { metric: 'Foreign travelers per month', target: 'Ramp toward ≈105/month by month 24; month-9 stage gate: ≈21 bookings/month on the −30% path, ≈8 on the stress path → pause paid ads' },
  { metric: 'Postcards shared → referral bookings', target: 'Track referral link clicks and bookings' },
  { metric: 'Post-trip satisfaction (survey)', target: 'Collect after every pilot trip' },
];
