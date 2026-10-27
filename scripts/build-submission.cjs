#!/usr/bin/env node
// Builds the ZERTTEX submission package in submission/ with a plain
// Google Docs look (Arial 11, 1" margins, default heading styles):
//   1_Main_Report.pdf, 2_Financials_Business_Model.pdf, 3_User_Flow_Wireframes.pdf,
//   4_References.pdf, 5_AI_Declaration.pdf, TeamName_TechnologyProduct.pdf
//   and TeamName_TechnologyProduct.docx (upload to Google Docs to edit).
// All money numbers come from src/data/budget.ts via scripts/lib/model.cjs.
// Needs Playwright + Chromium, pandoc, and screenshots in docs/img.
//   node scripts/build-submission.cjs

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'submission');
const HTML = path.join(OUT, 'html');
const IMG = path.join(ROOT, 'docs/img');
fs.mkdirSync(HTML, { recursive: true });

const n = (x) => Math.round(x).toLocaleString('en-US');
const m = (x) => (x / 1e6).toFixed(1) + 'M';

// ---------- payback model: the ONE config in src/data/budget.ts ----------
const MODEL = require('./lib/model.cjs');
const CFG = MODEL.budgetConfig;
const CAP = MODEL.BUDGET_CAP;
const PRICE = CFG.model.avgPrice;
const MARGIN = CFG.model.margin;
const EXTRA = MODEL.derivation.extra;
const RUN = CFG.model.runningCostPerMonth;
const DOWN = CFG.model.downsideFactor;
const CPT = PRICE * MARGIN;
const BREAK_EVEN = MODEL.breakEvenTravelers(MARGIN);
function series(factor, margin = MARGIN) {
  const s = MODEL.series({ margin, travelersPerYear: EXTRA, runningCost: RUN }, factor);
  let prev = 0;
  return s.map((p) => {
    const contrib = p.travelers * PRICE * margin;
    const cost = contrib - (p.cumulative - prev);
    prev = p.cumulative;
    return { mo: p.month, trav: p.travelers, contrib, cost, cum: p.cumulative };
  });
}
const payback = (s) => (s.find((p) => p.mo >= CFG.model.launchMonth && p.cum >= 0) || {}).mo || null;
const base = series(1);
const down = series(DOWN);
const PB = payback(base);
const PD = payback(down);
const lowOf = (s) => s.reduce((a, p) => (p.cum < a.cum ? p : a), s[0]);
const years = (s) =>
  [1, 2, 3, 4].map((y) => {
    const part = s.slice((y - 1) * 12, y * 12);
    const sum = (k) => part.reduce((a, p) => a + p[k], 0);
    return { y, trav: sum('trav'), contrib: sum('contrib'), cost: sum('cost'), net: sum('contrib') - sum('cost'), cum: part[11].cum };
  });
const pbText = (x) => (x ? 'month ' + x : 'after 48');
const budgetRows = (cols) =>
  CFG.lines
    .map((b) => (cols === 4 ? `<tr><td>${b.kind === 'one-time' ? 'Development' : b.kind === 'reserve' ? 'Reserve' : 'Launch'}</td><td>${b.item}</td><td>${b.kind === 'one-time' ? 'one-time' : 'year 1'}</td><td class="r">${n(b.amount)}</td></tr>` : `<tr><td>${b.item}</td><td>${b.kind}</td><td class="r">${n(b.amount)}</td></tr>`))
    .join('');
const sens = [0.2, 0.25, 0.3, 0.35, 0.4].map((mg) => ({ mg, b: payback(series(1, mg)), d: payback(series(DOWN, mg)) }));

// Chart in the style of a Google Sheets line chart (default blue / red series).
function chartSvg() {
  const W = 720, H = 300, L = 60, R = 20, T = 46, B = 34;
  const all = [...base, ...down].map((p) => p.cum);
  const lo = Math.min(...all), hi = Math.max(...all);
  const x = (mo) => L + ((mo - 1) / 47) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = (s) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.mo).toFixed(1)} ${y(p.cum).toFixed(1)}`).join(' ');
  const ticks = [];
  for (let v = Math.ceil(lo / 5e6) * 5e6; v <= hi; v += 5e6) ticks.push(v);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial">
    <rect width="${W}" height="${H}" fill="#fff"/>
    <text x="${W / 2}" y="18" text-anchor="middle" font-size="14" fill="#222">Cumulative cash flow, 48 months (KZT)</text>
    <rect x="${W / 2 - 150}" y="28" width="12" height="3" fill="#4285F4"/><text x="${W / 2 - 133}" y="33" font-size="11" fill="#222">Base case</text>
    <rect x="${W / 2 - 40}" y="28" width="12" height="3" fill="#EA4335"/><text x="${W / 2 - 23}" y="33" font-size="11" fill="#222">Downside (travelers x 0.7)</text>
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#333' : '#e0e0e0'}" stroke-width="1"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#444">${v === 0 ? '0' : (v / 1e6).toFixed(0) + 'M'}</text>`).join('')}
    ${[1, 6, 12, 18, 24, 30, 36, 42, 48].map((mo) => `<text x="${x(mo)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="#444">${mo}</text>`).join('')}
    <text x="${W / 2}" y="${H - 1}" text-anchor="middle" font-size="11" fill="#444">Month</text>
    <path d="${line(base)}" fill="none" stroke="#4285F4" stroke-width="2.2"/>
    <path d="${line(down)}" fill="none" stroke="#EA4335" stroke-width="2.2"/>
  </svg>`;
}

// Flow diagram in the style of Google Drawings (plain boxes, black arrows).
function flowSvg() {
  const cx = [30, 275, 520, 765];
  const ry = [58, 196, 334, 472];
  const w = 205, h = 76;
  const box = (c, r, title, sub, kind = 'main') => {
    const fill = kind === 'ok' ? '#d9ead3' : kind === 'warn' ? '#fff2cc' : kind === 'opt' ? '#ffffff' : '#cfe2f3';
    const dash = kind === 'opt' ? 'stroke-dasharray="6 4"' : '';
    return `<rect x="${cx[c]}" y="${ry[r]}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="#000" stroke-width="1.2" ${dash}/>
      <text x="${cx[c] + w / 2}" y="${ry[r] + 25}" text-anchor="middle" font-size="14" font-weight="bold" fill="#000">${title}</text>
      ${sub.map((s, i) => `<text x="${cx[c] + w / 2}" y="${ry[r] + 44 + i * 15}" text-anchor="middle" font-size="11.5" fill="#000">${s}</text>`).join('')}`;
  };
  const A = (x1, y1, x2, y2, dashed = false) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#000" stroke-width="1.3" fill="none" ${dashed ? 'stroke-dasharray="6 4"' : ''} marker-end="url(#ah)"/>`;
  const P = (d, dashed = false, end = false) => `<path d="${d}" stroke="#000" stroke-width="1.3" fill="none" ${dashed ? 'stroke-dasharray="6 4"' : ''} ${end ? 'marker-end="url(#ah)"' : ''}/>`;
  const right = (c, r) => [cx[c] + w, ry[r] + h / 2];
  const left = (c, r) => [cx[c], ry[r] + h / 2];
  const top = (c, r) => [cx[c] + w / 2, ry[r]];
  const bottom = (c, r) => [cx[c] + w / 2, ry[r] + h];
  const lane = (r, label) => `<text x="30" y="${ry[r] - 12}" font-size="13" font-weight="bold" fill="#000">${label}</text>`;
  const bus = ry[2] - 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" font-family="Arial">
  <rect width="1000" height="600" fill="#fff"/>
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#000"/></marker></defs>
  ${lane(0, '1. Discover')}${lane(1, '2. Check and decide (optional, any order)')}${lane(2, '3. Book')}${lane(3, '4. Pay, travel, share')}
  ${box(0, 0, 'Finds Saryarqa Go', ['Xiaohongshu post, search', "or a friend's postcard"])}
  ${box(1, 0, 'Home page', ['English or Chinese', '4 tours'])}
  ${box(2, 0, 'Tour page', ["what's included,", 'price in KZT and CNY'])}
  ${box(3, 0, 'Trip builder', ['fits tours and transfers', 'into the trip length'], 'opt')}
  ${box(0, 1, 'Manager', ['answers by email when', 'the chat is not sure'], 'opt')}
  ${box(1, 1, 'Chat (EN / 中文)', ['answers from checked', 'tour information only'], 'opt')}
  ${box(2, 1, 'Trust page', ['guide video, 5 min call,', 'refund rules'], 'opt')}
  ${box(0, 2, 'Step 1: Trip', ['tour, date, number', 'of travelers'])}
  ${box(1, 2, 'Step 2: Traveler', ['name, email, country,', 'guide language'])}
  ${box(2, 2, 'Step 3: Payment', ['foreign card (Alipay /', 'WeChat Pay later)'])}
  ${box(3, 2, 'Payment page', ["payment provider's page,", 'we never see the card'])}
  ${box(3, 3, 'Payment OK?', ['yes: go left', 'no: try again'], 'warn')}
  ${box(2, 3, 'Confirmation', ['booking code + email,', 'money held until the tour'], 'ok')}
  ${box(1, 3, 'My trip', ['daily check-ins,', 'weather reschedule'], 'ok')}
  ${box(0, 3, 'Postcard', ['shared on Xiaohongshu /', 'WeChat with a link'], 'ok')}
  ${A(...right(0, 0), ...left(1, 0))}${A(...right(1, 0), ...left(2, 0))}${A(...right(2, 0), ...left(3, 0), true)}
  ${A(...bottom(2, 0), ...top(2, 1), true)}
  ${A(cx[2] + 40, ry[0] + h, cx[1] + w - 30, ry[1], true)}
  ${A(...left(1, 1), ...right(0, 1), true)}
  ${P(`M${cx[3] + w / 2} ${ry[0] + h} L${cx[3] + w / 2} ${bus} L${cx[0] + w / 2} ${bus}`)}
  ${P(`M${cx[1] + w / 2} ${ry[1] + h} L${cx[1] + w / 2} ${bus}`, true)}
  ${P(`M${cx[2] + w / 2} ${ry[1] + h} L${cx[2] + w / 2} ${bus}`, true)}
  ${P(`M${cx[2] + w + 18} ${ry[0] + h / 2} L${cx[2] + w + 18} ${bus}`)}
  <text x="${cx[3] + 8}" y="${bus - 6}" font-size="11" fill="#000">"Book this tour"</text>
  ${A(cx[0] + w / 2, bus, ...top(0, 2))}
  ${A(...right(0, 2), ...left(1, 2))}${A(...right(1, 2), ...left(2, 2))}${A(...right(2, 2), ...left(3, 2))}
  ${A(...bottom(3, 2), ...top(3, 3))}
  ${A(...left(3, 3), ...right(2, 3))}${A(...left(2, 3), ...right(1, 3))}${A(...left(1, 3), ...right(0, 3))}
  ${P(`M${cx[3] + w} ${ry[3] + h / 2} L${cx[3] + w + 18} ${ry[3] + h / 2} L${cx[3] + w + 18} ${ry[2] + h + 14} L${cx[2] + w / 2} ${ry[2] + h + 14}`, true)}
  ${A(cx[2] + w / 2, ry[2] + h + 14, cx[2] + w / 2, ry[2] + h + 2)}
  <text x="${cx[2] + w / 2 + 8}" y="${ry[2] + h + 30}" font-size="11" fill="#000">No: try again, another method, or ask the manager</text>
  ${P(`M${cx[0] + 10} ${ry[3] + h} L${cx[0] + 10} ${ry[3] + h + 34} L8 ${ry[3] + h + 34} L8 ${ry[0] + h / 2} L${cx[0]} ${ry[0] + h / 2}`, true, true)}
  <text x="${cx[0] + 18}" y="${ry[3] + h + 30}" font-size="11" fill="#000">A friend opens the postcard link and starts at step 1</text>
  </svg>`;
}

// ---------- Google Docs-like styling ----------
const css = `
@page { size: A4; margin: 25.4mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.32; color: #000; margin: 0; }
.title { font-size: 26pt; margin: 0 0 3pt; font-weight: normal; }
.subtitle { font-size: 15pt; color: #666; margin: 0 0 14pt; }
h1 { font-size: 20pt; font-weight: normal; margin: 20pt 0 6pt; break-after: avoid; }
h2 { font-size: 16pt; font-weight: normal; margin: 18pt 0 6pt; break-after: avoid; }
h3 { font-size: 14pt; font-weight: normal; color: #434343; margin: 14pt 0 4pt; break-after: avoid; }
p { margin: 0 0 9pt; }
ul, ol { margin: 0 0 9pt; padding-left: 26pt; }
li { margin: 0 0 3pt; }
table { border-collapse: collapse; width: 100%; margin: 4pt 0 11pt; font-size: 10pt; break-inside: avoid; }
td, th { border: 1px solid #000; padding: 5pt; vertical-align: top; text-align: left; }
th { font-weight: bold; }
td.r, th.r { text-align: right; }
a { color: #1155cc; text-decoration: underline; word-break: break-all; }
img { max-width: 100%; display: block; margin: 6pt auto 4pt; }
.caption { text-align: center; font-size: 10pt; font-style: italic; color: #444; margin: 0 0 12pt; }
.small { font-size: 9.5pt; }
.pb { break-before: page; }
.two { display: flex; gap: 10pt; } .two > div { flex: 1; }
`;
const docPage = (title, body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;

// ---------- content ----------
const main = `
<p class="title">Saryarqa Go</p>
<p class="subtitle">ZERTTEX Hackathon 2026, Final (Stage 2). Case 1: Technology Product<br>Team: ____________________</p>

<h1>1. Summary</h1>
<p>Saryarqa Routes is a tour company from Astana. In 2025 it had 3,400 travelers, but about 96% of them were from Kazakhstan, and the company wants 30% of its travelers to come from abroad within 24 months (case data). We think the main reason foreigners do not book is simple: they cannot easily see what a trip includes, they cannot pay with their own card, and they have no way to check that the company is real.</p>
<p>Our answer is Saryarqa Go, a booking website and app in English and Chinese. We start with independent travelers from China. The first version can be built in 12 weeks, and all year-1 costs stay within ${n(CAP)} KZT. With our assumptions it pays back in month ${PB}, or in month ${PD} if we get 30% fewer travelers than planned.</p>

<h1>2. The problem</h1>
<p>Today the company sells tours through Instagram messages, WhatsApp and phone calls. Customers pay by Kaspi transfer or cash, and the website is one page in Russian (case data). This works for local customers, but not for a tourist from Shanghai or Berlin. The case lists four things foreign guests said, and each of them stops a booking before the payment:</p>
<table>
<tr><th>What guests said (case data)</th><th>When the booking fails</th><th>Why it happens now</th></tr>
<tr><td>"It is unclear how to book."</td><td>Before the first message</td><td>Sales only through chats; Russian-only website</td></tr>
<tr><td>"I am not sure the company is trustworthy."</td><td>Before sending money abroad</td><td>Nothing on the website proves the company is real</td></tr>
<tr><td>"My foreign card does not work."</td><td>At the payment</td><td>Only Kaspi transfer or cash</td></tr>
<tr><td>"I do not know what is included."</td><td>Before deciding</td><td>No clear list of what the price covers</td></tr>
</table>

<h1>3. Why we start with travelers from China</h1>
<p>According to the Ministry of Tourism and Sports, about 655,000 people from China visited Kazakhstan in 2024, 78% more than in 2023 [1][2]. Since November 2023 the two countries have a visa-free regime: up to 30 days per visit and up to 90 days in any 180 days [1]. In 2024 China was the largest source of tourists outside the neighbouring countries [3]. Overall Kazakhstan counted 15.3 million foreign visitors for tourism in 2024 [3], and 15.7 million in the first nine months of 2025 alone [5].</p>
<p>We are careful with these numbers. An analyst estimate gives 241,700 Chinese visitors in 2025 [4], which is much lower than the Ministry figure for 2024, but the two are counted in different ways, so we do not compare them. World Bank data [6] only counts overnight arrivals, which is again a different definition.</p>
<p>Because there is no visa barrier, the decision for a Chinese traveler mostly depends on trust, clear information and payment, which are exactly the four complaints above. The tours also fit what independent travelers look for: nature and photography (Charyn, Kolsai, Burabay) and Silk Road history (Turkestan). This last point is our own judgement, not a statistic.</p>
<h3>How many more foreign travelers are needed</h3>
<p>About 4% of 3,400 travelers are foreign today, so roughly 136 people. If the company keeps its 3,264 local travelers, foreigners have to be 30% of about 4,663 travelers in total, which is about 1,399 people. That means around 1,263 additional foreign travelers per year, or about 105 per month. Fixing only one complaint will not be enough to get there.</p>

<h1>4. Our solution: Saryarqa Go</h1>
<p>Saryarqa Go covers the whole trip, not only the booking form. We built it around six steps. The last step (sharing a postcard) brings the next traveler back to the first one.</p>
<table>
<tr><th>Step</th><th>What the traveler gets</th><th>Which complaint it solves</th></tr>
<tr><td>Discover</td><td>Tour pages in English and Chinese. Each tour shows four lists: included, optional extras, not included, and not yet confirmed.</td><td>"I do not know what is included"</td></tr>
<tr><td>Plan</td><td>A trip builder that puts tours, transfers between Almaty, Turkestan and Astana, and free days into the number of days the traveler has.</td><td>"It is unclear how to book"</td></tr>
<tr><td>Check</td><td>A trust page with a short video from the guide, a 5-minute video call before paying, refund rules and an honest list of what is verified. A chat in English and Chinese that passes hard questions to a manager.</td><td>"I am not sure the company is trustworthy"</td></tr>
<tr><td>Book</td><td>Booking in three steps. Payment with a foreign card on the payment provider's page. Alipay and WeChat Pay later, after the providers approve us. Prices in KZT with USD or CNY next to them.</td><td>"My foreign card does not work"</td></tr>
<tr><td>Travel</td><td>A trip page with daily check-ins, optional updates for family at home, and free rescheduling if a mountain road is closed.</td><td>Trust during the trip</td></tr>
<tr><td>Share</td><td>A postcard sized for Xiaohongshu and WeChat Moments with a link for friends.</td><td>Cheap way to find new travelers</td></tr>
</table>
<img src="IMG:complaints" style="width:100%">
<p class="caption">Figure 1. Our prototype: each complaint from the case is linked to a feature.</p>

<h1>5. What makes it different</h1>
<p>Most travel sites hide what is still unknown. We do the opposite. Park fees, exact guesthouse names, the 4x4 transfer at Kaindy and the availability of a Chinese-speaking guide are shown in a separate "not yet confirmed" list, and the company confirms them in writing before the trip. We think being open about this builds more trust than a perfect-looking page.</p>
<p>For someone traveling to a new country, the guide is the company. That is why the traveler can watch a short video of the guide and book a 5-minute call before paying. The chat answers in the traveler's language, but only from checked tour information. If it does not know something, for example whether there are free places on a date, it says so and passes the question to a person.</p>
<p>Two smaller ideas are also important for Chinese travelers and their families. Family members can follow the trip status (not the exact location) if the traveler turns it on, and it stops automatically after the trip. The postcard at the end is something people want to post anyway, so it becomes free advertising.</p>
<p>In the prototype every number and claim has a small label: case data, checked source, our proposal, demo data, or "needs confirmation". We did this so that judges and future customers can see what is a fact and what is still a plan.</p>

<h1>6. A realistic 12-week MVP</h1>
<table>
<tr><th>Weeks</th><th>What we do</th><th>We know it is done when</th></tr>
<tr><td>1-2</td><td>Interviews and research; apply to payment providers</td><td>At least 10 interviews with Chinese travelers; applications sent</td></tr>
<tr><td>3-4</td><td>Design and tour pages in English and Chinese</td><td>4 tour pages checked by 3 or more target users</td></tr>
<tr><td>5-7</td><td>Booking, inclusion lists, chat, trust page</td><td>A full test booking works in the payment test mode</td></tr>
<tr><td>8-9</td><td>Real payment page, manager inbox, postcard QR</td><td>Staff make a first real test payment</td></tr>
<tr><td>10-11</td><td>Usability tests and payment checks</td><td>5-8 test sessions with no blocking problems left</td></tr>
<tr><td>12</td><td>Pilot with real travelers</td><td>Pilot results collected</td></tr>
</table>
<p>Phase 2 comes after the ${n(CAP)} KZT MVP: the trip builder, weather and road rescheduling, family updates, the offline audio guide, live Alipay and WeChat Pay, and listing on Trip.com. This way the MVP stays small and does not get stuck waiting for someone else.</p>
<p>The app would be built with React and TypeScript, a database with an admin page for the managers, and the payment provider's own payment page, so card data never touches our servers. We plan a small hired team: a designer, two developers and a Chinese translator, with one person from Saryarqa Routes as the product owner (our proposal).</p>
<p>We already have a working clickable prototype that shows the whole path from choosing a tour to the postcard. Payments in it are only simulated and it collects no card or passport data. It was built with the help of an AI coding assistant; see our AI Declaration.</p>

<h1>7. Costs, payback and impact</h1>
<p>The year-1 budget is exactly ${n(CAP)} KZT: ${m(MODEL.oneTimeTotal)} for building the product and ${m(MODEL.otherTotal)} for launch, marketing, support and a reserve. The company earns its normal margin on every additional foreign traveler. We assume a ${MARGIN * 100}% margin on the average price of ${n(PRICE)} KZT, so ${n(CPT)} KZT per traveler (our assumption). The company needs about ${n(BREAK_EVEN)} additional travelers in total to earn back ${m(CAP)}. With our ramp-up plan the money comes back in month ${PB}. If demand is 30% lower, it comes back in month ${PD}. The full calculation is in the separate financial document.</p>
<p>If it works, the company gets a second source of income next to local customers. Travelers get clear prices, a way to pay with their own card, and a guide they have already met. For Kazakhstan, every positive trip that is shared on Chinese social media is a small advertisement for the country, and it brings tourists to regions outside Almaty and Astana.</p>

<h1>8. Risks</h1>
<table>
<tr><th>Risk</th><th>What we do about it</th></tr>
<tr><td>Alipay or WeChat Pay approval takes long or is refused</td><td>Start with foreign cards on the provider's page; apply in week 1; a manager can help with payment as a backup</td></tr>
<tr><td>The chat gives a wrong answer</td><td>It only uses checked tour information, says "I don't know" when unsure and passes the question to a person; we read the chat logs every week</td></tr>
<tr><td>Not enough demand from China</td><td>Talk to travelers before building; run a small pilot; test Xiaohongshu posts and postcards before paying for ads</td></tr>
<tr><td>Data and privacy rules</td><td>Collect only what we need (no passport, no card numbers); get a legal check; family sharing is off by default</td></tr>
<tr><td>Guides do not speak enough Chinese</td><td>Test the guides; work with interpreters; show Chinese guides as "not yet confirmed" until checked; offer the audio guide in Chinese</td></tr>
</table>
<p>Before launch we still need to confirm the company's registration, licence and insurance documents, the park and site fees, the payment provider's terms, and whether the 30% margin matches the company's real costs.</p>
`;

const yb = years(base), yd = years(down);
const fin = `
<p class="title">Financial calculations and business model</p>
<p class="subtitle">Saryarqa Go. All amounts in KZT.</p>

<h1>1. Business model</h1>
<p>The traveler pays Saryarqa Routes for the tour, the same way local customers do now. Saryarqa Go itself is not sold to anyone. It is the new sales channel that lets foreign travelers find, understand and pay for the tours.</p>
<p>In our calculation we count only one source of income: the margin on additional foreign travelers. The average price is 44,000 KZT (case data). We assume that 30% of it is left after paying guides, transport, accommodation and payment fees, so ${n(CPT)} KZT per traveler (our assumption). We do not count three other possible sources, so the result is on the careful side:</p>
<ul>
<li>optional extras sold on the tour page, like horse riding, boats or a single room;</li>
<li>longer trips, because the trip builder makes it easy to combine two or three tours;</li>
<li>new travelers who come through postcard links, which cost almost nothing to get.</li>
</ul>
<p class="small">Note: 150,000,000 / 3,400 = 44,118 KZT, which is a little higher than the 44,000 KZT average price given in the case. We use 44,000 KZT.</p>

<h1>2. Budget</h1>
<table>
<tr><th>Part</th><th>Item</th><th>When</th><th class="r">KZT</th></tr>
${budgetRows(4)}
<tr><td colspan="3"><b>Total year 1</b> (Stage 2 limit ${n(CAP)})</td><td class="r"><b>${n(MODEL.budgetTotal)}</b></td></tr>
</table>
<p>From year 2 we expect running costs of ${n(RUN)} KZT per month, or ${n(RUN * 12)} KZT per year, for hosting, support and keeping the content up to date. All budget numbers are our planning estimates and should be checked with real quotes.</p>

<h1>3. How many travelers we expect</h1>
<p>To reach 30% foreign travelers the company needs about ${n(EXTRA)} additional foreign travelers per year (see section 3 of the main report). We launch in month 4 and expect the number to grow step by step until it reaches the full level in month 24 (in month m we get (m - 3) / 21 of the full level). After that we keep it flat, which is also a careful choice.</p>

<h1>4. Payback</h1>
<p>Each month we calculate: additional travelers x ${n(CPT)} KZT, minus costs. The ${m(MODEL.oneTimeTotal)} one-time costs are spread over months 1-3, the other ${m(MODEL.otherTotal)} over months 1-12, and from month 13 the cost is ${n(RUN)} KZT per month. The payback month is the first month when the total since the start is no longer negative. For the pessimistic (downside) scenario we use 30% fewer travelers and keep everything else the same.</p>
<img src="IMG:chart" style="width:100%">
<p class="caption">Figure 1. Cumulative cash flow for the base case and the downside case.</p>
<table>
<tr><th>Year</th><th class="r">Additional travelers</th><th class="r">Margin earned</th><th class="r">Costs</th><th class="r">Result of the year</th><th class="r">Total so far (base)</th><th class="r">Total so far (downside)</th></tr>
${yb.map((r, i) => `<tr><td>${r.y}</td><td class="r">${n(r.trav)}</td><td class="r">${m(r.contrib)}</td><td class="r">${m(r.cost)}</td><td class="r">${m(r.net)}</td><td class="r">${m(r.cum)}</td><td class="r">${m(yd[i].cum)}</td></tr>`).join('')}
</table>
<table>
<tr><th>Result</th><th class="r">Base case</th><th class="r">Downside (x 0.7)</th></tr>
<tr><td>Lowest point</td><td class="r">${m(lowOf(base).cum)} (month ${lowOf(base).mo})</td><td class="r">${m(lowOf(down).cum)} (month ${lowOf(down).mo})</td></tr>
<tr><td>Total after 24 months</td><td class="r">${m(base[23].cum)}</td><td class="r">${m(down[23].cum)}</td></tr>
<tr><td><b>Payback month</b></td><td class="r"><b>${payback(base)}</b></td><td class="r"><b>${payback(down)}</b></td></tr>
<tr><td>Total after 48 months</td><td class="r">${m(base[47].cum)}</td><td class="r">${m(down[47].cum)}</td></tr>
<tr><td>Travelers needed to earn back ${m(CAP)} (${n(CAP)} / ${n(CPT)})</td><td class="r">${n(BREAK_EVEN)}</td><td class="r">${n(BREAK_EVEN)}</td></tr>
</table>

<h3>What if our margin is wrong?</h3>
<p>The 30% margin is our biggest assumption, so we checked how the payback changes:</p>
<table>
<tr><th>Margin</th>${sens.map((s) => `<th class="r">${Math.round(s.mg * 100)}%</th>`).join('')}</tr>
<tr><td>Payback, base case</td>${sens.map((s) => `<td class="r">${s.b ? 'month ' + s.b : 'after 48'}</td>`).join('')}</tr>
<tr><td>Payback, downside</td>${sens.map((s) => `<td class="r">${s.d ? 'month ' + s.d : 'after 48'}</td>`).join('')}</tr>
</table>
<p>In the base case the project pays back in month ${sens[0].b} even with a 20% margin. In the downside case it pays back in ${pbText(sens[0].d)} with a 20% margin and in month ${sens[2].d} with 30%. So the first thing we would check with the company is its real cost per traveler. If the pilot shows lower demand, we would move more of the marketing to free channels (postcards and our own Xiaohongshu posts), delay paid ads, and keep running costs at ${n(RUN)} KZT per month.</p>
`;

const flow = `
<p class="title">User flow</p>
<p class="subtitle">How a foreign traveler goes from search to payment in Saryarqa Go</p>
<img src="IMG:flow" style="width:100%">
<p class="caption">Figure 1. User flow. Dashed boxes are optional and can be used in any order.</p>
<p>A traveler usually finds us through a Xiaohongshu post, a search, or a postcard from a friend. On the home page they choose English or Chinese and open a tour. The tour page shows what is included and what is not, and the price in KZT and CNY. Before booking, they can use the trip builder, ask the chat, or open the trust page with the guide's video. None of these steps is required.</p>
<p>Booking has three steps: the tour and date, the lead traveler (no passport needed), and the payment method. Payment happens on the payment provider's page. If the card is declined, the traveler can try again, choose another method, or write to a manager. After a successful payment they get a booking code by email, and the money is held until the tour starts. During the trip they use the trip page, and at the end they can share a postcard. A friend who opens the postcard link starts again at step 1.</p>

<h2 class="pb">Wireframes: screens from our prototype</h2>
<div class="two"><div><img src="IMG:inclusions"><p class="caption">Tour page with the four lists.</p></div><div><img src="IMG:chat-zh"><p class="caption">Chat answering in Chinese.</p></div></div>
<div class="two"><div><img src="IMG:booking"><p class="caption">Booking, step 3: payment method.</p></div><div><img src="IMG:confirmed"><p class="caption">Booking confirmed.</p></div></div>
<p class="small">Tour prices and guide profiles in the prototype are demo data. Payments are simulated.</p>
`;

const refs = `
<p class="title">References</p>
<p class="small">Accessed 25 October 2026.</p>
<ol>
<li>The Times of Central Asia. (2025, June 19). [News article on the launch of the 2025 Year of China Tourism in Kazakhstan, citing the Ministry of Tourism and Sports of the Republic of Kazakhstan]. <a href="https://timesca.com/kazakhstan-launches-2025-year-of-china-tourism/">https://timesca.com/kazakhstan-launches-2025-year-of-china-tourism/</a></li>
<li>The Astana Times. (2025, February). Tourist numbers from China to Kazakhstan surge 78% in 2024. <a href="https://astanatimes.com/2025/02/tourist-numbers-from-china-to-kazakhstan-surge-78-in-2024/">https://astanatimes.com/2025/02/tourist-numbers-from-china-to-kazakhstan-surge-78-in-2024/</a></li>
<li>The Astana Times. (2025, June). Who's visiting Kazakhstan? These five countries top list [citing the Tourism Industry Committee]. <a href="https://astanatimes.com/2025/06/whos-visiting-kazakhstan-these-five-countries-top-list/">https://astanatimes.com/2025/06/whos-visiting-kazakhstan-these-five-countries-top-list/</a></li>
<li>Orda.kz. (2026). Chinese tourist arrivals in Kazakhstan rose sharply in 2025, analysts say [citing Energyprom.kz]. <a href="https://en.orda.kz/chinese-tourist-arrivals-in-kazakhstan-rose-sharply-in-2025-analysts-say-10111/">https://en.orda.kz/chinese-tourist-arrivals-in-kazakhstan-rose-sharply-in-2025-analysts-say-10111/</a></li>
<li>The Astana Times. (2026, February). Kazakhstan reports tourism growth surge as visitor numbers and revenues climb in 2025. <a href="https://astanatimes.com/2026/02/kazakhstan-reports-tourism-growth-surge-as-visitor-numbers-and-revenues-climb-in-2025/">https://astanatimes.com/2026/02/kazakhstan-reports-tourism-growth-surge-as-visitor-numbers-and-revenues-climb-in-2025/</a></li>
<li>World Bank. International tourism, number of arrivals (ST.INT.ARVL), Kazakhstan [data from UN Tourism]. <a href="https://data.worldbank.org/indicator/ST.INT.ARVL?locations=KZ">https://data.worldbank.org/indicator/ST.INT.ARVL?locations=KZ</a></li>
<li>Bureau of National Statistics of the Agency for Strategic Planning and Reforms of the Republic of Kazakhstan. Tourism statistics, dynamic tables. <a href="https://stat.gov.kz/en/industries/businessstatistics/stat-tourism/dynamic-tables/">https://stat.gov.kz/en/industries/businessstatistics/stat-tourism/dynamic-tables/</a></li>
<li>Trip.com. 1-day tour to Charyn Canyon + Kolsai Lake + Lake Kaindy from Almaty, Kazakhstan [tour listing]. <a href="https://uk.trip.com/things-to-do/detail/97639672">https://uk.trip.com/things-to-do/detail/97639672</a></li>
<li>GetYourGuide Supply. What commission fee does GetYourGuide charge supply partners? <a href="https://www.getyourguide.supply/join/how-much-does-getyourguide-charge">https://www.getyourguide.supply/join/how-much-does-getyourguide-charge</a></li>
<li>ZERTTEX Hackathon 2026. Stage 1, Case 1 "Technology Product": Saryarqa Routes (case description).</li>
</ol>
<p class="small">Saryarqa Routes is a fictional company from the case. Tour prices, guide profiles and weather data in our prototype are demo data and are marked as such.</p>
`;

const ai = `
<p class="title">AI Declaration</p>
<p class="subtitle">Team: ____________________</p>
<h2>Level of AI use</h2>
<table>
<tr><th>Part</th><th>Level</th><th>How AI was used</th></tr>
<tr><td>Prototype (code)</td><td>High</td><td>The code of the clickable prototype and its automated tests were written by an AI coding assistant, based on our written description of the product. We decided what the product does, which market we target and which numbers and rules to use.</td></tr>
<tr><td>Report, financial document, user flow</td><td>High</td><td>The AI assistant wrote the first draft of the text, the tables and the diagram from our description. The calculations are done by code from our assumptions. We read, edited and checked the final text.</td></tr>
<tr><td>Idea, target market, assumptions</td><td>Low</td><td>Our own decisions. The AI pointed out some risks and weak points.</td></tr>
<tr><td>Research and sources</td><td>Low to medium</td><td>The team chose the target market and found the main market sources. The AI was used only to double-check them with web search: it found that the 15.7 million figure is for the first nine months of 2025 and suggested additional references (Trip.com, GetYourGuide, The Astana Times, World Bank, national statistics). We opened and checked the links ourselves.</td></tr>
<tr><td>Images</td><td>None</td><td>No AI-generated images or photos were used. The pictures are screenshots of our prototype.</td></tr>
</table>
<h2>Tools</h2>
<table>
<tr><th>Tool</th><th>What for</th><th>Link</th></tr>
<tr><td>Claude (Anthropic), in Claude Code</td><td>Writing the prototype code and tests, drafting the documents, checking sources with web search, creating the PDF files</td><td><a href="https://claude.ai/code/session_01HrYY9Y9MwxQVFQRES5YEHH">https://claude.ai/code/session_01HrYY9Y9MwxQVFQRES5YEHH</a></td></tr>
<tr><td>[other tools, if any]</td><td>[what for]</td><td>[link]</td></tr>
</table>
<p>We did not use AI to invent statistics, interviews, reviews, licences or partnerships. Everything that is not proven yet is marked as a proposal or as "needs confirmation".</p>
<p>Signed: ____________________ &nbsp;&nbsp;&nbsp; Date: ______________</p>
`;


// ---------- single file in the official structure ----------
const single = `
<p class="title">Saryarqa Go</p>
<p class="subtitle">ZERTTEX Hackathon 2026, Final (Stage 2). Case 1: Technology Product<br>Team: ____________________</p>
<p>Saryarqa Routes wants 30% of its travelers to come from abroad within 24 months, but today about 96% of its 3,400 travelers are from Kazakhstan (case data). We propose Saryarqa Go, a booking platform in English and Chinese for independent travelers from China. It shows exactly what each tour includes, lets travelers meet their guide before paying, and accepts foreign cards. The first version can be built in 12 weeks, with all year-1 costs within ${n(CAP)} KZT. Clickable prototype: <a href="https://diawx-6669.github.io/ZERttex/">https://diawx-6669.github.io/ZERttex/</a></p>

<h1>1. Problem and market</h1>
<h3>Target market: independent travelers from mainland China</h3>
<p>According to the Ministry of Tourism and Sports, about 655,000 people from China visited Kazakhstan in 2024, 78% more than in 2023 [1][2]. Since November 2023 the two countries have a visa-free regime: up to 30 days per visit and up to 90 days in any 180 days [1]. In 2024 China was the largest source of tourists outside the neighbouring countries [3]. Overall, Kazakhstan counted 15.3 million foreign visitors for tourism in 2024 [3] and 15.7 million in the first nine months of 2025 [5]. An analyst estimate gives 241,700 Chinese visitors in 2025 [4], but it is counted in a different way from the Ministry figure, so we do not compare the two. The tours fit what independent travelers look for: nature and photography (Charyn, Kolsai, Burabay) and Silk Road history (Turkestan). This last point is our own judgement.</p>
<h3>What stops them from booking today</h3>
<p>The company sells through Instagram messages, WhatsApp and phone calls, takes payment by Kaspi transfer or cash, and has a one-page website in Russian (case data). Foreign guests named four problems:</p>
<table>
<tr><th>What guests said (case data)</th><th>When the booking fails</th><th>Why it happens now</th></tr>
<tr><td>"It is unclear how to book."</td><td>Before the first message</td><td>Sales only through chats; Russian-only website</td></tr>
<tr><td>"I am not sure the company is trustworthy."</td><td>Before sending money abroad</td><td>Nothing proves the company is real</td></tr>
<tr><td>"My foreign card does not work."</td><td>At the payment</td><td>Only Kaspi transfer or cash</td></tr>
<tr><td>"I do not know what is included."</td><td>Before deciding</td><td>No clear list of what the price covers</td></tr>
</table>
<p>About 4% of 3,400 travelers (roughly 136) are foreign today. If the company keeps its 3,264 local travelers, 30% foreign means about 4,663 travelers in total and about 1,399 foreigners. So the company needs around 1,263 additional foreign travelers per year, about 105 per month.</p>

<h1>2. Existing solutions</h1>
<p>Big booking platforms already sell tours to this region. Trip.com, for example, lists one-day tours from Almaty to Charyn Canyon, Kolsai Lake and Lake Kaindy [8]. These platforms solve the payment problem and work in many languages. But for Saryarqa Routes they have three weak points. First, they take a large commission: GetYourGuide says it charges suppliers 20-30% depending on the country [9], which is most of a small company's margin. Second, the tour becomes one listing among many similar day trips, so the company cannot show its own guides or build trust in its brand. Third, the customer relationship belongs to the platform, so it is hard to sell longer trips or get repeat and referral customers.</p>
<p>The company's current tools (Instagram, WhatsApp, phone) keep the relationship but fail all four complaints above. Saryarqa Go keeps the direct relationship and the full margin, and adds what the platforms do not: the "not yet confirmed" list, meeting the guide before paying, and help in Chinese. Later we can still list on Trip.com as an extra channel.</p>

<h1>3. Our product</h1>
<p>Saryarqa Go is a web platform (also usable as a mobile app) built around one path: discover, plan, check, book, travel and share. The last step brings new travelers back to the first. It has five main features:</p>
<ol>
<li><b>Clear tour pages in English and Chinese.</b> Every tour shows four lists: included, optional extras, not included, and not yet confirmed (for example park fees or the 4x4 transfer at Kaindy). The company confirms the last list in writing before the trip.</li>
<li><b>Booking and payment in three steps.</b> Tour and date, lead traveler (no passport needed), payment. Foreign cards are paid on the payment provider's own page; Alipay and WeChat Pay are added after the providers approve us. Prices are in KZT with CNY or USD next to them.</li>
<li><b>Trust page.</b> A short video from each guide, a 5-minute video call before paying, refund rules, and an honest list of which company documents are already shown and which are still coming.</li>
<li><b>Chat assistant in English and Chinese.</b> It answers only from checked tour information and passes anything it is not sure about (dates, discounts) to a manager.</li>
<li><b>Trip page and postcard.</b> Daily check-ins, optional updates for family at home, free rescheduling if a mountain road is closed, and a postcard for Xiaohongshu and WeChat Moments with a link for friends.</li>
</ol>
<p><b>Technology:</b> React and TypeScript web app, a database with an admin page for managers, and the payment provider's hosted payment page, so card data never touches our servers. <b>What makes it unique:</b> it is honest about what is still unknown, it lets the traveler meet the person who will guide them, and every shared trip brings a new customer at almost no cost.</p>
<img src="IMG:complaints" style="width:88%">
<p class="caption">Figure 1. Our clickable prototype: each complaint from the case is linked to a feature.</p>

<h1>4. MVP and implementation</h1>
<p>The MVP (paid from the ${n(CAP)} KZT budget) includes the tour pages in English and Chinese with the inclusion lists, booking in three steps with a foreign card on the provider's page, the trust page, a chat that answers only from checked tour data and hands off to a manager, the postcard with a referral QR code, and a manager inbox for staff. Phase 2 comes later: the trip builder, weather and road rescheduling, family updates, the offline audio guide, live Alipay and WeChat Pay, and listing on Trip.com.</p>
<table>
<tr><th>Weeks</th><th>What we do</th><th>We know it is done when</th></tr>
<tr><td>1-2</td><td>Interviews and research; apply to payment providers</td><td>At least 10 interviews with Chinese travelers; applications sent</td></tr>
<tr><td>3-4</td><td>Design and tour pages in English and Chinese</td><td>4 tour pages checked by 3 or more target users</td></tr>
<tr><td>5-7</td><td>Booking, inclusion lists, chat, trust page</td><td>A full test booking works in the payment test mode</td></tr>
<tr><td>8-9</td><td>Real payment page, manager inbox, postcard QR</td><td>Staff make a first real test payment</td></tr>
<tr><td>10-11</td><td>Usability tests and payment checks</td><td>5-8 test sessions with no blocking problems left</td></tr>
<tr><td>12</td><td>Pilot with real travelers</td><td>Pilot results collected</td></tr>
</table>
<p><b>Team:</b> a hired designer, two developers and a Chinese translator, with one person from Saryarqa Routes as product owner (our proposal). <b>How we test it:</b> 5-8 usability sessions with Chinese-speaking travelers, then a pilot where we measure how many people who start a booking finish it, how often the chat has to hand off to a manager, and how many postcards lead to new bookings. We already built a working clickable prototype of the whole path (payments in it are simulated): <a href="https://diawx-6669.github.io/ZERttex/">https://diawx-6669.github.io/ZERttex/</a></p>
<img src="IMG:flow" style="width:100%">
<p class="caption">Figure 2. User flow from search to payment. Dashed boxes are optional.</p>

<h1>5. Costs, payback and impact</h1>
<table>
<tr><th>Item</th><th>Type</th><th class="r">KZT</th></tr>
${budgetRows(3)}
<tr><td colspan="2"><b>Total year 1</b> (Stage 2 limit ${n(CAP)})</td><td class="r"><b>${n(MODEL.budgetTotal)}</b></td></tr>
</table>
<p>From year 2 running costs are ${n(RUN)} KZT per month (our estimate). <b>How it earns money:</b> the company keeps its margin on every additional foreign traveler. We assume ${MARGIN * 100}% of the ${n(PRICE)} KZT average price (case data) is left after guides, transport, hotels and payment fees, so ${n(CPT)} KZT per traveler (our assumption). We do not count extras, longer trips or referrals, so the result is careful. Travelers start in month 4 and grow step by step to ${n(EXTRA)} per year by month 24.</p>
<img src="IMG:chart" style="width:92%">
<p class="caption">Figure 3. Cumulative cash flow. Red line: results 30% worse than planned.</p>
<table>
<tr><th>Result</th><th class="r">Base case</th><th class="r">30% worse</th></tr>
<tr><td>Lowest point</td><td class="r">${m(lowOf(base).cum)}</td><td class="r">${m(lowOf(down).cum)}</td></tr>
<tr><td><b>Payback month</b></td><td class="r"><b>${payback(base)}</b></td><td class="r"><b>${payback(down)}</b></td></tr>
<tr><td>Total after 48 months</td><td class="r">${m(base[47].cum)}</td><td class="r">${m(down[47].cum)}</td></tr>
<tr><td>Payback if the margin is 20% / 40%</td><td class="r">month ${sens[0].b} / ${sens[4].b}</td><td class="r">${pbText(sens[0].d)} / month ${sens[4].d}</td></tr>
</table>
<p>If results are 30% worse, the project still pays back, but in month ${PD} instead of ${PB}. In that case we would move marketing to free channels (postcards, our own Xiaohongshu posts), delay paid ads and keep running costs at the minimum. <b>Scalability:</b> the same platform can add Korean or English-speaking markets with new translations, and new tours can be added by managers without developers.</p>
<p><b>Impact.</b> The company gets a second source of income next to local customers and stops losing foreign guests at the payment step. Travelers get clear prices, their own payment method and a guide they have already met. For Kazakhstan, every good trip shared on Chinese social media is free advertising, and it brings tourists to regions outside Almaty and Astana.</p>
<table>
<tr><th>Biggest risks</th><th>What we do about it</th></tr>
<tr><td>Alipay or WeChat Pay approval is slow</td><td>Start with foreign cards; apply in week 1; a manager can help with payment</td></tr>
<tr><td>The chat gives a wrong answer</td><td>Only checked information; it says "I don't know" and passes to a person</td></tr>
<tr><td>Not enough demand from China</td><td>Interviews first; small pilot; test free posts before paid ads</td></tr>
<tr><td>Data privacy and payments</td><td>No passport and no card data stored; legal check; family sharing off by default</td></tr>
<tr><td>Guides' Chinese is weak</td><td>Test guides; interpreters; Chinese audio guide as backup</td></tr>
</table>

<h1>6. Conclusion</h1>
<p>Foreign travelers do not book Saryarqa Routes because they cannot see what is included, cannot pay with their card and cannot check the company. Saryarqa Go fixes all four problems in one product, starting with Chinese travelers who can already visit without a visa. It fits the ${n(CAP)} KZT limit and pays back in month ${PB}, or month ${PD} if results are 30% worse. Our next steps: interview at least 10 Chinese travelers, check the real margin with the company, and apply to payment providers in the first week.</p>
`;

const docs = [
  ['1_Main_Report', 'Saryarqa Go - Main report', main],
  ['2_Financials_Business_Model', 'Saryarqa Go - Financials and business model', fin],
  ['3_User_Flow_Wireframes', 'Saryarqa Go - User flow and wireframes', flow],
  ['4_References', 'Saryarqa Go - References', refs],
  ['5_AI_Declaration', 'Saryarqa Go - AI Declaration', ai],
];

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2 });

  // Render the chart and the flow diagram to PNG so the PDF and the DOCX use the same images.
  const svgToPng = async (svg, file, w, h) => {
    await pg.setViewportSize({ width: w, height: h });
    await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await pg.locator('svg').screenshot({ path: path.join(HTML, file) });
  };
  await svgToPng(chartSvg(), 'chart.png', 720, 300);
  await svgToPng(flowSvg(), 'flow.png', 1000, 600);
  const src = (name) => (['chart', 'flow'].includes(name) ? path.join(HTML, name + '.png') : path.join(IMG, name + '.png'));
  const withImgs = (html) => html.replace(/IMG:([a-z-]+)/g, (_, name) => 'file://' + src(name));

  const footer = '<div style="width:100%;font-family:Arial;font-size:9px;color:#000;padding:0 25.4mm;text-align:right"><span class="pageNumber"></span></div>';
  const print = async (file, title, body) => {
    const hp = path.join(HTML, file + '.html');
    fs.writeFileSync(hp, docPage(title, withImgs(body)));
    await pg.goto('file://' + hp);
    await pg.waitForTimeout(300);
    await pg.pdf({ path: path.join(OUT, file + '.pdf'), format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer, margin: { top: '25.4mm', bottom: '25.4mm', left: '25.4mm', right: '25.4mm' } });
  };
  // One file, as the case requires: report, then References, then AI Declaration.
  // The five required parts as separate files too.
  await print('1_Main_Report', 'Saryarqa Go - Main report', single);
  await print('2_Financials_Business_Model', 'Saryarqa Go - Financials and business model', fin);
  await print('3_User_Flow_Wireframes', 'Saryarqa Go - User flow and wireframes', flow);
  await print('4_References', 'Saryarqa Go - References', refs);
  await print('5_AI_Declaration', 'Saryarqa Go - AI Declaration', ai);
  const all = [single, refs, ai].join('<div class="pb"></div>');
  await print('TeamName_TechnologyProduct', 'Saryarqa Go - Technology Product', all);
  await browser.close();

  // DOCX for Google Docs (File > Open > Upload, then File > Download > PDF).
  const docxHtml = path.join(HTML, 'docx-source.html');
  // Shift heading levels so each document title becomes Heading 1 in Google Docs.
  const forDocx = withImgs(all)
    .replace(/<div class="pb"><\/div>/g, '<p>[[PAGEBREAK]]</p>')
    .replace(/<h3 class="pb">/g, '<p>[[PAGEBREAK]]</p><h3>')
    .replace(/<(\/?)h3([ >])/g, '<$1h4$2')
    .replace(/<(\/?)h2([ >])/g, '<$1h3$2')
    .replace(/<(\/?)h1([ >])/g, '<$1h2$2')
    .replace(/<p class="title">(.*?)<\/p>/g, '<h1>$1</h1>');
  fs.writeFileSync(docxHtml, `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>${forDocx.replace(/file:\/\//g, '')}</body></html>`);
  const docxOut = path.join(OUT, 'TeamName_TechnologyProduct.docx');
  execFileSync('pandoc', [docxHtml, '-f', 'html', '-t', 'docx', '-o', docxOut], { cwd: HTML });
  execFileSync('python3', [path.join(__dirname, 'gdocs_docx.py'), docxOut]);
  console.log('written to', OUT);
})();
