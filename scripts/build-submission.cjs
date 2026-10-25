#!/usr/bin/env node
// Builds the ZERTTEX submission package in submission/ with a plain
// Google Docs look (Arial 11, 1" margins, default heading styles):
//   1_Main_Report.pdf, 2_Financials_Business_Model.pdf, 3_User_Flow_Wireframes.pdf,
//   4_References.pdf, 5_AI_Declaration.pdf, Saryarqa_Go_Submission_ALL.pdf
//   and Saryarqa_Go_Submission_ALL.docx (upload to Google Docs to edit).
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

// ---------- payback model (same logic as src/lib/paybackModel.ts) ----------
const PRICE = 44000;
const MARGIN = 0.3;
const EXTRA = 1263;
const RUN = 300000;
function series(factor, margin = MARGIN) {
  let cum = 0;
  const out = [];
  for (let mo = 1; mo <= 48; mo++) {
    const cost = (mo <= 3 ? 12e6 / 3 : 0) + (mo <= 12 ? 8e6 / 12 : RUN);
    const ramp = mo < 4 ? 0 : mo >= 24 ? 1 : (mo - 3) / 21;
    const trav = ((EXTRA * factor) / 12) * ramp;
    const contrib = trav * PRICE * margin;
    cum += contrib - cost;
    out.push({ mo, trav, contrib, cost, cum });
  }
  return out;
}
const payback = (s) => (s.find((p) => p.mo >= 4 && p.cum >= 0) || {}).mo || null;
const base = series(1);
const down = series(0.7);
const years = (s) =>
  [1, 2, 3, 4].map((y) => {
    const part = s.slice((y - 1) * 12, y * 12);
    const sum = (k) => part.reduce((a, p) => a + p[k], 0);
    return { y, trav: sum('trav'), contrib: sum('contrib'), cost: sum('cost'), net: sum('contrib') - sum('cost'), cum: part[11].cum };
  });
const sens = [0.2, 0.25, 0.3, 0.35, 0.4].map((mg) => ({ mg, b: payback(series(1, mg)), d: payback(series(0.7, mg)) }));

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
<p class="subtitle">ZERTTEX Hackathon 2026, Stage 1. Case 1: Technology Product<br>Team: ____________________</p>

<h1>1. Summary</h1>
<p>Saryarqa Routes is a tour company from Astana. In 2025 it had 3,400 travelers, but about 96% of them were from Kazakhstan, and the company wants 30% of its travelers to come from abroad within 24 months (case data). We think the main reason foreigners do not book is simple: they cannot easily see what a trip includes, they cannot pay with their own card, and they have no way to check that the company is real.</p>
<p>Our answer is Saryarqa Go, a booking website and app in English and Chinese. We start with independent travelers from China. The first version can be built in 12 weeks within the 20 million KZT budget from the case. With our assumptions it pays back in month 32, or in month 44 if we get 30% fewer travelers than planned.</p>

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
<tr><td>8-9</td><td>Trip builder, real payment page, rescheduling</td><td>Staff make a first real test payment</td></tr>
<tr><td>10-11</td><td>Usability tests and payment checks</td><td>5-8 test sessions with no blocking problems left</td></tr>
<tr><td>12</td><td>Pilot with real travelers</td><td>Pilot results collected</td></tr>
</table>
<p>Everything that depends on another company's approval or on live data comes later: Alipay and WeChat Pay, a smarter AI chat, live weather and road data, GPS sharing, offline audio, and listing on Trip.com or Klook. This way the MVP does not get stuck waiting for someone else.</p>
<p>The app would be built with React and TypeScript, a database with an admin page for the managers, and the payment provider's own payment page, so card data never touches our servers. We plan a small hired team: a designer, two developers and a Chinese translator, with one person from Saryarqa Routes as the product owner (our proposal).</p>
<p>We already have a working clickable prototype that shows the whole path from choosing a tour to the postcard. Payments in it are only simulated and it collects no card or passport data. It was built with the help of an AI coding assistant; see our AI Declaration.</p>

<h1>7. Costs, payback and impact</h1>
<p>The year-1 budget is exactly 20,000,000 KZT: 12 million for building the product and 8 million for launch, marketing, support and a reserve. The company earns its normal margin on every additional foreign traveler. We assume a 30% margin on the average price of 44,000 KZT, so 13,200 KZT per traveler (our assumption). The company needs about 1,516 additional travelers in total to earn back 20 million. With our ramp-up plan the money comes back in month 32. If demand is 30% lower, it comes back in month 44. The full calculation is in the separate financial document.</p>
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
<p>In our calculation we count only one source of income: the margin on additional foreign travelers. The average price is 44,000 KZT (case data). We assume that 30% of it is left after paying guides, transport, accommodation and payment fees, so 13,200 KZT per traveler (our assumption). We do not count three other possible sources, so the result is on the careful side:</p>
<ul>
<li>optional extras sold on the tour page, like horse riding, boats or a single room;</li>
<li>longer trips, because the trip builder makes it easy to combine two or three tours;</li>
<li>new travelers who come through postcard links, which cost almost nothing to get.</li>
</ul>
<p class="small">Note: 150,000,000 / 3,400 = 44,118 KZT, which is a little higher than the 44,000 KZT average price given in the case. We use 44,000 KZT.</p>

<h1>2. Budget</h1>
<table>
<tr><th>Part</th><th>Item</th><th>When</th><th class="r">KZT</th></tr>
<tr><td>Development</td><td>Design and development</td><td>one-time</td><td class="r">8,000,000</td></tr>
<tr><td>Development</td><td>Translation and localization (English, Chinese)</td><td>one-time</td><td class="r">1,500,000</td></tr>
<tr><td>Development</td><td>Payment integration and testing</td><td>one-time</td><td class="r">1,500,000</td></tr>
<tr><td>Development</td><td>Guide videos and photos</td><td>one-time</td><td class="r">1,000,000</td></tr>
<tr><td>Launch</td><td>Marketing (Xiaohongshu, WeChat, partners)</td><td>year 1</td><td class="r">4,500,000</td></tr>
<tr><td>Launch</td><td>Pilot and customer support</td><td>year 1</td><td class="r">1,000,000</td></tr>
<tr><td>Maintenance</td><td>Hosting, AI usage, maintenance</td><td>year 1</td><td class="r">1,500,000</td></tr>
<tr><td>Reserve</td><td>Contingency</td><td>year 1</td><td class="r">1,000,000</td></tr>
<tr><td colspan="3"><b>Total year 1</b> (the case allows up to 20,000,000)</td><td class="r"><b>20,000,000</b></td></tr>
</table>
<p>From year 2 we expect running costs of 300,000 KZT per month, or 3,600,000 KZT per year, for hosting, support and keeping the content up to date. All budget numbers are our planning estimates and should be checked with real quotes.</p>

<h1>3. How many travelers we expect</h1>
<p>To reach 30% foreign travelers the company needs about 1,263 additional foreign travelers per year (see section 3 of the main report). We launch in month 4 and expect the number to grow step by step until it reaches the full level in month 24 (in month m we get (m - 3) / 21 of the full level). After that we keep it flat, which is also a careful choice.</p>

<h1>4. Payback</h1>
<p>Each month we calculate: additional travelers x 13,200 KZT, minus costs. The 12 million one-time costs are spread over months 1-3, the other 8 million over months 1-12, and from month 13 the cost is 300,000 KZT per month. The payback month is the first month when the total since the start is no longer negative. For the pessimistic (downside) scenario we use 30% fewer travelers and keep everything else the same.</p>
<img src="IMG:chart" style="width:100%">
<p class="caption">Figure 1. Cumulative cash flow for the base case and the downside case.</p>
<table>
<tr><th>Year</th><th class="r">Additional travelers</th><th class="r">Margin earned</th><th class="r">Costs</th><th class="r">Result of the year</th><th class="r">Total so far (base)</th><th class="r">Total so far (downside)</th></tr>
${yb.map((r, i) => `<tr><td>${r.y}</td><td class="r">${n(r.trav)}</td><td class="r">${m(r.contrib)}</td><td class="r">${m(r.cost)}</td><td class="r">${m(r.net)}</td><td class="r">${m(r.cum)}</td><td class="r">${m(yd[i].cum)}</td></tr>`).join('')}
</table>
<table>
<tr><th>Result</th><th class="r">Base case</th><th class="r">Downside (x 0.7)</th></tr>
<tr><td>Lowest point (month 12)</td><td class="r">${m(Math.min(...base.map((p) => p.cum)))}</td><td class="r">${m(Math.min(...down.map((p) => p.cum)))}</td></tr>
<tr><td>Total after 24 months</td><td class="r">${m(base[23].cum)}</td><td class="r">${m(down[23].cum)}</td></tr>
<tr><td><b>Payback month</b></td><td class="r"><b>${payback(base)}</b></td><td class="r"><b>${payback(down)}</b></td></tr>
<tr><td>Total after 48 months</td><td class="r">${m(base[47].cum)}</td><td class="r">${m(down[47].cum)}</td></tr>
<tr><td>Travelers needed to earn back 20M (20,000,000 / 13,200)</td><td class="r">1,516</td><td class="r">1,516</td></tr>
</table>

<h3>What if our margin is wrong?</h3>
<p>The 30% margin is our biggest assumption, so we checked how the payback changes:</p>
<table>
<tr><th>Margin</th>${sens.map((s) => `<th class="r">${Math.round(s.mg * 100)}%</th>`).join('')}</tr>
<tr><td>Payback, base case</td>${sens.map((s) => `<td class="r">${s.b ? 'month ' + s.b : 'after 48'}</td>`).join('')}</tr>
<tr><td>Payback, downside</td>${sens.map((s) => `<td class="r">${s.d ? 'month ' + s.d : 'after 48'}</td>`).join('')}</tr>
</table>
<p>In the base case the project pays back within four years even with a 20% margin. In the downside case it needs a margin of about 30% or more. So the first thing we would check with the company is its real cost per traveler. If the pilot shows lower demand, we would move more of the marketing to free channels (postcards and our own Xiaohongshu posts), delay paid ads, and keep running costs at 300,000 KZT per month.</p>
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
<tr><td>Sources</td><td>Medium</td><td>The AI used web search to check our sources and found that the 15.7 million figure is for the first nine months of 2025. We checked the links ourselves.</td></tr>
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
  for (const [file, title, body] of docs) await print(file, title, body);
  const all = docs.map((d) => d[2]).join('<div class="pb"></div>');
  await print('Saryarqa_Go_Submission_ALL', 'Saryarqa Go - ZERTTEX 2026 submission', all);
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
  const docxOut = path.join(OUT, 'Saryarqa_Go_Submission_ALL.docx');
  execFileSync('pandoc', [docxHtml, '-f', 'html', '-t', 'docx', '-o', docxOut], { cwd: HTML });
  execFileSync('python3', [path.join(__dirname, 'gdocs_docx.py'), docxOut]);
  console.log('written to', OUT);
})();
