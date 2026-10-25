// Year-1 budget (planning assumptions). Total must equal exactly 20,000,000 KZT.
export type BudgetLine = { item: string; amount: number; kind: 'one-time' | 'recurring' | 'reserve' };

export const budget: BudgetLine[] = [
  { item: 'Design & development', amount: 8_000_000, kind: 'one-time' },
  { item: 'Localization EN / 中文', amount: 1_500_000, kind: 'one-time' },
  { item: 'Payment integration & testing', amount: 1_500_000, kind: 'one-time' },
  { item: 'Trust content: guide videos, photos', amount: 1_000_000, kind: 'one-time' },
  { item: 'Marketing & acquisition', amount: 4_500_000, kind: 'recurring' },
  { item: 'Hosting, AI usage, maintenance', amount: 1_500_000, kind: 'recurring' },
  { item: 'Pilot & support', amount: 1_000_000, kind: 'recurring' },
  { item: 'Contingency', amount: 1_000_000, kind: 'reserve' },
];

export const budgetTotal = budget.reduce((s, b) => s + b.amount, 0);
export const oneTimeTotal = budget.filter((b) => b.kind === 'one-time').reduce((s, b) => s + b.amount, 0);
export const otherTotal = budgetTotal - oneTimeTotal;

if (budgetTotal !== 20_000_000) {
  // Guard: the report depends on this number.
  console.error('Budget total is not 20,000,000 KZT:', budgetTotal);
}

export const gantt: { label: string; start: number; end: number; detail: string }[] = [
  { label: 'Research & validation', start: 1, end: 2, detail: '10+ interviews with Chinese-speaking travelers; competitor scan' },
  { label: 'UX + tour pages', start: 3, end: 4, detail: 'Wireframes, EN/中文 tour pages, design system' },
  { label: 'Booking, inclusions, concierge, trust', start: 5, end: 7, detail: 'Core flow and Trust Center content' },
  { label: 'Trip builder, checkout, weather/reschedule', start: 8, end: 9, detail: 'Hosted checkout sandbox, reschedule workflow' },
  { label: 'Usability tests + payment-provider checks', start: 10, end: 11, detail: '5–8 test sessions; provider due diligence' },
  { label: 'Pilot with real users', start: 12, end: 12, detail: 'Limited launch, measure success metrics' },
];

export const inMvp = [
  'EN / 中文 tour pages with "What\'s included" breakdown',
  '3-step booking with international card via hosted checkout',
  'Scripted bilingual concierge with human handoff',
  'Trust Center: guide videos, verification checklist, refund policy',
  'Rules-based trip builder',
  'My trip: timeline, check-ins, reschedule requests',
  'Postcard + referral link',
];

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
  { metric: 'Pre-trip video calls requested', target: 'Track share of bookings' },
  { metric: 'Foreign travelers per month', target: 'Ramp toward ≈105/month by month 24' },
  { metric: 'Postcards shared → referral bookings', target: 'Track referral link clicks and bookings' },
  { metric: 'Post-trip satisfaction (survey)', target: 'Collect after every pilot trip' },
];
