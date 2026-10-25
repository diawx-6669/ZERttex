#!/usr/bin/env node
// Builds the ZERTTEX submission package as A4 PDFs in submission/:
//   1_Main_Report.pdf, 2_Financials_Business_Model.pdf, 3_User_Flow_Wireframes.pdf,
//   4_References.pdf, 5_AI_Declaration.pdf and Saryarqa_Go_Submission_ALL.pdf
// Needs Playwright + Chromium and the screenshots in docs/img (npm run report:docx makes them).
//   node scripts/build-submission.cjs

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'submission');
const IMG = path.join(ROOT, 'docs/img');
fs.mkdirSync(path.join(OUT, 'html'), { recursive: true });

const img = (name) => 'data:image/png;base64,' + fs.readFileSync(path.join(IMG, name + '.png')).toString('base64');
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

function chart() {
  const W = 680, H = 250, L = 52, R = 12, T = 12, B = 30;
  const all = [...base, ...down].map((p) => p.cum);
  const lo = Math.min(...all), hi = Math.max(...all);
  const x = (mo) => L + ((mo - 1) / 47) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = (s) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.mo).toFixed(1)} ${y(p.cum).toFixed(1)}`).join(' ');
  const ticks = [];
  for (let v = Math.ceil(lo / 5e6) * 5e6; v <= hi; v += 5e6) ticks.push(v);
  const pb = payback(base), pd = payback(down);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cumulative cash over 48 months">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#16191f' : '#dadde2'}" stroke-width="${v === 0 ? 1.2 : 0.8}"/><text x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end" font-size="10" fill="#585e68">${v === 0 ? '0' : v / 1e6 + 'M'}</text>`).join('')}
    ${[1, 4, 12, 24, 36, 48].map((mo) => `<text x="${x(mo)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#585e68">M${mo}</text>`).join('')}
    <path d="${line(down)}" fill="none" stroke="#a05c00" stroke-width="2" stroke-dasharray="6 4"/>
    <path d="${line(base)}" fill="none" stroke="#0b6f8c" stroke-width="2.6"/>
    <line x1="${x(pb)}" x2="${x(pb)}" y1="${T}" y2="${H - B}" stroke="#0b6f8c" stroke-dasharray="3 3"/>
    <text x="${x(pb) - 4}" y="${T + 10}" text-anchor="end" font-size="10.5" font-weight="700" fill="#0b6f8c">Base: month ${pb}</text>
    <line x1="${x(pd)}" x2="${x(pd)}" y1="${T}" y2="${H - B}" stroke="#a05c00" stroke-dasharray="3 3"/>
    <text x="${x(pd) - 4}" y="${T + 24}" text-anchor="end" font-size="10.5" font-weight="700" fill="#a05c00">Downside: month ${pd}</text>
  </svg>`;
}

// ---------- user flow diagram ----------
function flow() {
  const cx = [30, 275, 520, 765];
  const ry = [58, 196, 334, 472];
  const w = 205, h = 76;
  const box = (c, r, title, sub, kind = 'main') => {
    const fill = kind === 'opt' ? '#ffffff' : kind === 'ok' ? '#e6f2ec' : kind === 'warn' ? '#fbf0df' : '#eef5f8';
    const stroke = kind === 'opt' ? '#9aa1ac' : kind === 'ok' ? '#1a7a48' : kind === 'warn' ? '#a05c00' : '#0b6f8c';
    const dash = kind === 'opt' ? 'stroke-dasharray="5 4"' : '';
    return `<g><rect x="${cx[c]}" y="${ry[r]}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.4" ${dash}/>
      <text x="${cx[c] + 12}" y="${ry[r] + 24}" font-size="13" font-weight="700" fill="#16191f">${title}</text>
      ${sub.map((s, i) => `<text x="${cx[c] + 12}" y="${ry[r] + 43 + i * 15}" font-size="10.5" fill="#3d434c">${s}</text>`).join('')}</g>`;
  };
  const A = (x1, y1, x2, y2, dashed = false, color = '#16191f') =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="1.4" fill="none" ${dashed ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#ah)"/>`;
  const right = (c, r) => [cx[c] + w, ry[r] + h / 2];
  const left = (c, r) => [cx[c], ry[r] + h / 2];
  const top = (c, r) => [cx[c] + w / 2, ry[r]];
  const bottom = (c, r) => [cx[c] + w / 2, ry[r] + h];
  const lane = (r, label) => `<text x="30" y="${ry[r] - 12}" font-size="11" font-weight="700" fill="#0b6f8c" letter-spacing="0.5">${label}</text>`;
  const bus = ry[2] - 22;
  return `<svg viewBox="0 0 1000 600" width="100%" role="img" aria-label="Traveler flow from search to payment">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#16191f"/></marker></defs>
  ${lane(0, '1  DISCOVER')}${lane(1, '2  CHECK AND DECIDE (optional, any order)')}${lane(2, '3  BOOK (3 steps)')}${lane(3, '4  PAY, TRAVEL, SHARE')}
  ${box(0, 0, 'Finds Saryarqa Go', ['Xiaohongshu post, search,', "or a friend's postcard"])}
  ${box(1, 0, 'Home page', ['English or Chinese', 'four tours, one clear loop'])}
  ${box(2, 0, 'Tour page', ["What's included (4 groups),", 'price in KZT + CNY'])}
  ${box(3, 0, 'Trip builder', ['fits tours, transfers and', 'city days to trip length'], 'opt')}
  ${box(0, 1, 'Human manager', ['email hand-off when the', 'concierge is not sure'], 'opt')}
  ${box(1, 1, 'Concierge chat', ['EN / 中文, answers only', 'from verified tour data'], 'opt')}
  ${box(2, 1, 'Trust Center', ['guide video, 5-min call,', 'refund rules, checklist'], 'opt')}
  ${box(0, 2, 'Step 1: Trip', ['tour, date (7+ days ahead),', 'number of travelers'])}
  ${box(1, 2, 'Step 2: Lead traveler', ['name, email, country,', 'guide language; no passport'])}
  ${box(2, 2, 'Step 3: Payment', ['international card;', 'Alipay / WeChat Pay planned'])}
  ${box(3, 2, 'Hosted checkout', ["payment provider's page;", 'we never see card numbers'])}
  ${box(3, 3, 'Payment OK?', ['yes: continue left', 'no: declined screen'], 'warn')}
  ${box(2, 3, 'Confirmation', ['code SG-XXXX + email;', 'money held until tour start'], 'ok')}
  ${box(1, 3, 'My trip', ['check-ins, family updates,', 'weather/road reschedule'], 'ok')}
  ${box(0, 3, 'Postcard + referral', ['4:5 for Xiaohongshu and', 'WeChat; brings a friend'], 'ok')}
  ${A(...right(0, 0), ...left(1, 0))}${A(...right(1, 0), ...left(2, 0))}${A(...right(2, 0), ...left(3, 0), true)}
  ${A(...bottom(2, 0), ...top(2, 1), true)}
  ${A(cx[2] + 40, ry[0] + h, cx[1] + w - 30, ry[1], true)}
  ${A(...left(1, 1), ...right(0, 1), true)}
  <path d="M${cx[3] + w / 2} ${ry[0] + h} L${cx[3] + w / 2} ${bus} L${cx[0] + w / 2} ${bus}" stroke="#16191f" stroke-width="1.4" fill="none"/>
  <path d="M${cx[1] + w / 2} ${ry[1] + h} L${cx[1] + w / 2} ${bus}" stroke="#16191f" stroke-width="1.4" fill="none" stroke-dasharray="5 4"/>
  <path d="M${cx[2] + w / 2} ${ry[1] + h} L${cx[2] + w / 2} ${bus}" stroke="#16191f" stroke-width="1.4" fill="none" stroke-dasharray="5 4"/>
  <path d="M${cx[2] + w + 18} ${ry[0] + h / 2} L${cx[2] + w + 18} ${bus}" stroke="#16191f" stroke-width="1.4" fill="none"/>
  <text x="${cx[3] + 8}" y="${bus - 6}" font-size="10" fill="#3d434c">Book this tour / book plan</text>
  ${A(cx[0] + w / 2, bus, ...top(0, 2))}
  ${A(...right(0, 2), ...left(1, 2))}${A(...right(1, 2), ...left(2, 2))}${A(...right(2, 2), ...left(3, 2))}
  ${A(...bottom(3, 2), ...top(3, 3))}
  ${A(...left(3, 3), ...right(2, 3))}${A(...left(2, 3), ...right(1, 3))}${A(...left(1, 3), ...right(0, 3))}
  <path d="M${cx[3] + w} ${ry[3] + h / 2} L${cx[3] + w + 18} ${ry[3] + h / 2} L${cx[3] + w + 18} ${ry[2] + h + 14} L${cx[2] + w / 2} ${ry[2] + h + 14}" stroke="#a05c00" stroke-width="1.4" fill="none" stroke-dasharray="5 4"/>
  <path d="M${cx[2] + w / 2} ${ry[2] + h + 14} L${cx[2] + w / 2} ${ry[2] + h + 2}" stroke="#a05c00" stroke-width="1.4" fill="none" marker-end="url(#ah)"/>
  <text x="${cx[2] + w / 2 + 8}" y="${ry[2] + h + 28}" font-size="10" fill="#a05c00">No: retry, other method or manager</text>
  <path d="M${cx[0] + 10} ${ry[3] + h} L${cx[0] + 10} ${ry[3] + h + 34} L8 ${ry[3] + h + 34} L8 ${ry[0] + h / 2} L${cx[0]} ${ry[0] + h / 2}" stroke="#0b6f8c" stroke-width="1.4" fill="none" stroke-dasharray="5 4" marker-end="url(#ah)"/>
  <text x="${cx[0] + 18}" y="${ry[3] + h + 30}" font-size="10" fill="#0b6f8c">The friend who opens the postcard link starts at step 1 (closed loop)</text>
  </svg>`;
}

// ---------- shared HTML ----------
const css = `
@page { size: A4; margin: 15mm 16mm 17mm; }
* { box-sizing: border-box; }
body { font-family: 'Instrument Sans', Arial, sans-serif; font-size: 10pt; line-height: 1.45; color: #16191f; margin: 0; }
h1, h2, h3 { font-family: 'Archivo', Arial, sans-serif; font-stretch: 108%; letter-spacing: -0.01em; line-height: 1.15; margin: 0; }
h1 { font-size: 22pt; font-weight: 800; }
h2 { font-size: 13pt; font-weight: 800; margin: 14pt 0 5pt; color: #16191f; break-after: avoid; }
h3 { font-size: 10.5pt; font-weight: 700; margin: 9pt 0 3pt; break-after: avoid; }
p { margin: 0 0 6pt; }
ul, ol { margin: 0 0 6pt; padding-left: 15pt; }
li { margin: 0 0 2.5pt; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 9pt; break-inside: avoid; }
th { text-align: left; background: #16191f; color: #fff; font-weight: 600; padding: 4pt 6pt; }
td { padding: 3.5pt 6pt; border-bottom: 0.6pt solid #dadde2; vertical-align: top; }
td.r, th.r { text-align: right; font-variant-numeric: tabular-nums; }
tr.total td { font-weight: 700; border-top: 1pt solid #16191f; border-bottom: none; }
.muted { color: #585e68; }
.small { font-size: 8.5pt; }
.lead { font-size: 11pt; }
.tag { display: inline-block; border: 0.7pt solid; border-radius: 2pt; padding: 0 3pt; font-size: 7pt; font-weight: 700; vertical-align: 1pt; white-space: nowrap; }
.case { background: #16191f; color: #fff; border-color: #16191f; }
.ver { color: #1a7a48; } .prop { color: #a85212; } .demo { color: #0b6f8c; } .conf { color: #a05c00; border-style: dashed; }
.doc-head { border-bottom: 1.6pt solid #0b6f8c; padding-bottom: 7pt; margin-bottom: 10pt; }
.doc-head .kicker { font-size: 8.5pt; color: #0b6f8c; font-weight: 700; margin-bottom: 4pt; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 0.8pt solid #dadde2; border-bottom: 0.8pt solid #dadde2; margin: 6pt 0 10pt; }
.kpis div { padding: 6pt 8pt; border-left: 0.8pt solid #dadde2; } .kpis div:first-child { border-left: none; padding-left: 0; }
.kpis b { display: block; font-family: Archivo, Arial; font-size: 15pt; font-stretch: 110%; }
.note { border-left: 2pt solid #0b6f8c; padding: 3pt 8pt; background: #f1f6f8; margin: 6pt 0 8pt; }
.warnnote { border-left: 2pt solid #a05c00; padding: 3pt 8pt; background: #fbf4e8; margin: 6pt 0 8pt; }
figure { margin: 6pt 0 8pt; break-inside: avoid; }
figure img { width: 100%; border: 0.6pt solid #dadde2; border-radius: 4pt; display: block; }
figcaption { font-size: 8.5pt; color: #585e68; margin-top: 3pt; }
.shots { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; }
.page-break { break-before: page; }
.refs { list-style: none; padding-left: 0; }
.refs li { margin-bottom: 7pt; padding-left: 22pt; text-indent: -22pt; }
.shots.fixed img { height: 58mm; object-fit: cover; object-position: top left; }
.sign { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; margin-top: 18pt; }
.sign div { border-top: 0.8pt solid #16191f; padding-top: 3pt; font-size: 8.5pt; color: #585e68; }
a { color: #0b6f8c; text-decoration: none; word-break: break-all; }
`;
const T = {
  case: '<span class="tag case">Case fact</span>',
  ver: '<span class="tag ver">Verified source</span>',
  prop: '<span class="tag prop">Proposal</span>',
  demo: '<span class="tag demo">Demo data</span>',
  conf: '<span class="tag conf">Needs confirmation</span>',
};
const head = (kicker, title, sub = '') =>
  `<div class="doc-head"><div class="kicker">ZERTTEX Hackathon 2026 · Stage 1 · Case 1 "Technology Product" · ${kicker}</div><h1>${title}</h1>${sub ? `<p class="muted" style="margin:4pt 0 0">${sub}</p>` : ''}</div>`;
const page = (title, body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..800&family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet">
<style>${css}</style></head><body>${body}</body></html>`;

// ---------- 1. main report ----------
const main = `
${head('Main report', 'Saryarqa Go: book Kazakhstan with confidence', 'An English / Chinese booking app that helps Saryarqa Routes reach 30% foreign travelers within 24 months. Team: ____________________')}

<h2>1. Summary</h2>
<p class="lead">Saryarqa Routes sells guided trips almost only to Kazakhstan residents because its sales process (Instagram messages, WhatsApp, phone, Kaspi or cash, a Russian-only one-page site) does not work for foreigners ${T.case}. Saryarqa Go is a bilingual booking app built as one closed loop (Discover, Plan, Verify, Book, Travel, Share) that answers the four complaints foreign guests actually made. We start with Chinese-speaking independent travelers. The 12-week MVP fits the 20,000,000 KZT year-1 budget and, under stated assumptions, pays back in month 32 (base) or month 44 (downside).</p>

<h2>2. Problem and relevance</h2>
<p>Saryarqa Routes (Astana, founded 2020; 9 staff, ~25 freelance guides) served 3,400 travelers in 2025 with revenue of 150,000,000 KZT and an average price of 44,000 KZT; about 96% were from Kazakhstan. The goal is 30% foreign travelers within 24 months ${T.case}. Foreign guests named four problems, and each one stops a sale before payment:</p>
<table>
<tr><th style="width:34%">Guest said ${T.case.replace('tag case', 'tag case')}</th><th style="width:28%">Where the sale breaks</th><th>Root cause today</th></tr>
<tr><td>"It is unclear how to book."</td><td>Before first contact</td><td>Chat-only sales; Russian-only one-page website</td></tr>
<tr><td>"I am not sure the company is trustworthy."</td><td>Before paying abroad</td><td>No visible proof; no way to meet the people</td></tr>
<tr><td>"My foreign card does not work."</td><td>At payment</td><td>Kaspi transfer or cash only</td></tr>
<tr><td>"I do not know what is included."</td><td>Before committing</td><td>No structured description of the price</td></tr>
</table>

<h3>Why Chinese-speaking independent travelers first</h3>
<ul>
<li><b>Fast-growing market.</b> Kazakhstan received about 655,000 visitors from China in 2024, +78% vs 367,000 in 2023, according to the Ministry of Tourism and Sports [1][2] ${T.ver}. China was the largest source market outside the near abroad in 2024 [3] ${T.ver}.</li>
<li><b>No visa barrier.</b> A mutual visa-free regime has applied since November 2023: up to 30 days per visit, max 90 days in 180 [1] ${T.ver}. The decision is about trust, clarity and payment, exactly the four complaints.</li>
<li><b>Big inbound flow overall.</b> Kazakhstan counted 15.3 million foreign visitors for tourism purposes in 2024 [3] and 15.7 million in the first nine months of 2025 [5] ${T.ver}.</li>
<li><b>Product fit.</b> Nature and photography (Charyn, Kolsai, Burabay) and Silk Road culture (Turkestan) match what independent travelers look for ${T.prop}.</li>
</ul>
<p class="small muted">Method note: an analyst estimate of 241,700 Chinese visitors in 2025 [4] uses a different method from the Ministry figure for 2024 [1], so the two are not compared. National visitor counts [3][5] and World Bank / UN Tourism overnight arrivals [6] use different definitions.</p>

<h3>The size of the job</h3>
<p>About 4% of 3,400 ≈ 136 travelers are foreign today. Keeping ≈ 3,264 domestic travelers, 30% foreign needs ≈ 4,663 travelers in total, so ≈ 1,399 foreign: about <b>1,263 more foreign travelers per year</b>, ≈ 105 per month. One complaint fixed at a time will not get there; the whole buying journey must work for a foreigner.</p>

<h2>3. The product: Saryarqa Go</h2>
<p>One closed loop instead of a pile of features. Every step removes one doubt, and the last step brings the next traveler back to the first.</p>
<table>
<tr><th style="width:15%">Step</th><th style="width:47%">What the traveler gets</th><th>Complaint answered</th></tr>
<tr><td><b>Discover</b></td><td>Tour pages in EN / 中文; "What's included" in four groups: Included, Optional extra, Not included, Not yet confirmed</td><td>"I do not know what is included"</td></tr>
<tr><td><b>Plan</b></td><td>Trip builder: arrival, real tour days, Almaty / Turkestan / Astana transfers, city days, cost estimate</td><td>"It is unclear how to book"</td></tr>
<tr><td><b>Verify</b></td><td>Trust Center: guide intro video, 5-minute video call before paying, honest verification checklist, refund rules; bilingual concierge that hands off to a human when unsure</td><td>"I am not sure the company is trustworthy"</td></tr>
<tr><td><b>Book</b></td><td>Three steps (trip, lead traveler, payment); international card via the provider's hosted checkout; Alipay / WeChat Pay after provider approval; price in KZT with USD / CNY</td><td>"My foreign card does not work"; "unclear how to book"</td></tr>
<tr><td><b>Travel</b></td><td>Timeline with daily check-ins, opt-in family updates (no GPS), weather and road-closure rescheduling, audio guide in Chinese</td><td>Trust during the trip</td></tr>
<tr><td><b>Share</b></td><td>Postcard sized for Xiaohongshu / WeChat Moments with a referral link that opens step 1 for a friend</td><td>Low-cost acquisition</td></tr>
</table>
<figure><div class="shots"><img src="${img('complaints')}"><img src="${img('inclusions')}"></div>
<figcaption>Prototype screens: the four complaints mapped to features (left) and the four-group "What's included" breakdown (right). Full flow and more screens in the separate flow document.</figcaption></figure>

<h2>4. Originality and unique value</h2>
<ul>
<li><b>"Not yet confirmed" as a feature.</b> Park fees, guesthouse names, the Kaindy 4×4 transfer and Chinese-guide availability are shown openly and confirmed in writing before the trip. Honesty about the unknown is the trust signal.</li>
<li><b>Meet the guide before you pay.</b> For a traveler abroad, the guide is the company. A short video and an optional 5-minute call turn an unknown firm into a person.</li>
<li><b>A concierge that refuses to guess.</b> It answers in the traveler's language from verified tour data only and passes availability, discount and edge-case questions to a manager.</li>
<li><b>Safety for the family at home.</b> Opt-in, one trip only, ends automatically, shares check-in status rather than live location.</li>
<li><b>The postcard closes the loop.</b> Content the traveler wants to post anyway becomes the cheapest acquisition channel.</li>
<li><b>Honesty labels everywhere.</b> Every claim in the app is marked Case fact, Verified source, Proposal, Demo data or Needs confirmation.</li>
</ul>

<h2>5. Feasibility: a realistic 12-week MVP</h2>
<table>
<tr><th style="width:13%">Weeks</th><th style="width:40%">Work</th><th>Done when</th></tr>
<tr><td>W1-2</td><td>Research and validation; apply to payment providers</td><td>10+ traveler interviews done; applications sent</td></tr>
<tr><td>W3-4</td><td>UX and EN / 中文 tour pages</td><td>4 tour pages reviewed by 3+ target users</td></tr>
<tr><td>W5-7</td><td>Booking, inclusions, concierge, Trust Center</td><td>End-to-end test booking in payment sandbox</td></tr>
<tr><td>W8-9</td><td>Trip builder, live checkout, reschedule workflow</td><td>First real test payment by staff</td></tr>
<tr><td>W10-11</td><td>Usability tests; payment-provider checks</td><td>5-8 sessions, no blocking issue left</td></tr>
<tr><td>W12</td><td>Pilot with real travelers</td><td>Pilot metrics collected</td></tr>
</table>
<p><b>Rule:</b> anything that needs a third party's approval or live data waits for later (live LLM concierge, Alipay / WeChat Pay, live weather, GPS sharing, offline audio, Trip.com / Klook). The MVP therefore ships in 12 weeks regardless. <b>Tools:</b> React + TypeScript web app (reuses the prototype), managed database with admin panel, payment provider hosted checkout with webhooks. <b>People:</b> a contracted designer, two developers and a Chinese localizer, with one Saryarqa Routes staff member as product owner ${T.prop}.</p>
<p><b>Proof:</b> a working clickable prototype already covers the whole loop (booking with validation and a simulated declined payment, bilingual concierge, trip builder, trust center, in-trip screen, postcard, live payback calculator). An automated test checks 75 acceptance points, including phone width and dark mode; all pass. Payments are simulated in the prototype (TEST MODE); no card or passport data is collected.</p>

<h2>6. Costs, payback and impact</h2>
<div class="kpis"><div><b>20.0M KZT</b><span class="small muted">year-1 budget (12.0M one-time)</span></div><div><b>13,200 KZT</b><span class="small muted">contribution per traveler</span></div><div><b>Month 32</b><span class="small muted">payback, base case</span></div><div><b>Month 44</b><span class="small muted">payback, downside (× 0.7)</span></div></div>
<p>Revenue comes from the margin on additional foreign travelers (44,000 KZT × 30% assumed margin) ${T.prop}. Break-even needs 1,516 extra foreign travelers in total. Payback falls inside 48 months for any margin of 20% or more in the base case; the downside needs about 30% or more. Full budget, revenue model, yearly cash flow and sensitivity are in the separate financial document.</p>
<p><b>Impact</b> ${T.prop}: a second, foreign revenue stream for the company beside its domestic base; travelers get clear prices, their own payment method and a guide they have met; Kazakhstan gets an easy-to-book, trustworthy experience that Chinese travelers share on their own social platforms, spreading demand to regions beyond the big cities.</p>

<h2>7. Risks and how we reduce them</h2>
<table>
<tr><th style="width:36%">Risk</th><th>Mitigation</th></tr>
<tr><td>Alipay / WeChat Pay approval slow or refused</td><td>Launch with international cards via hosted checkout; apply in week 1; manager-assisted payment as fallback</td></tr>
<tr><td>Concierge gives a wrong answer</td><td>Verified data only, visible labels, "I won't guess" rule with human hand-off, weekly log review</td></tr>
<tr><td>Low demand from Chinese travelers</td><td>Interviews before building; small pilot; test Xiaohongshu content and postcards before paid ads</td></tr>
<tr><td>Cross-border data and privacy</td><td>Minimum data (no passport, no card numbers); legal review; family sharing off by default</td></tr>
<tr><td>Guides' Chinese is not good enough</td><td>Language test; interpreter partners; "Not yet confirmed" until checked; Chinese audio guide as backup</td></tr>
</table>
<p class="small muted">Still to verify before launch ${T.conf}: business registration, operator licence and insurance documents; park and site fees; payment-provider terms; the 30% margin against real costs.</p>
`;

// ---------- 2. financials ----------
const yb = years(base), yd = years(down);
const fin = `
${head('Financial calculations and business model', 'Budget, revenue model and payback', 'All figures in KZT. Planning assumptions are labelled; case facts come from the official brief.')}

<h2>1. Business model</h2>
<p><b>Who pays:</b> foreign travelers pay Saryarqa Routes for guided trips booked through the app. The app is not sold to anyone; it is a sales channel that turns foreign interest into paid bookings.</p>
<table>
<tr><th style="width:30%">Revenue stream</th><th>How it works</th><th style="width:22%">In the model?</th></tr>
<tr><td><b>Margin on additional foreign travelers</b></td><td>Average price 44,000 KZT ${T.case} × contribution margin 30% ${T.prop} = 13,200 KZT per traveler, after direct tour costs and payment fees</td><td>Yes, the only revenue counted</td></tr>
<tr><td>Optional extras</td><td>Horse rides, boats, single rooms, photo sessions sold on the tour page</td><td>No (upside)</td></tr>
<tr><td>Multi-tour trips</td><td>Trip builder combines tours, raising spend per traveler</td><td>No (upside)</td></tr>
<tr><td>Referrals</td><td>Postcard links bring friends at low acquisition cost</td><td>No (upside)</td></tr>
</table>
<p class="small muted">Only one stream is counted so the result is conservative. Note: 150,000,000 ÷ 3,400 = 44,118 KZT, slightly above the stated 44,000 KZT average; the model uses 44,000.</p>

<h2>2. Budget: development, launch and maintenance</h2>
<table>
<tr><th style="width:18%">Block</th><th>Item</th><th style="width:16%">Type</th><th class="r" style="width:16%">KZT</th></tr>
<tr><td rowspan="4"><b>Development</b></td><td>Design and development</td><td>one-time</td><td class="r">8,000,000</td></tr>
<tr><td>Localization EN / 中文</td><td>one-time</td><td class="r">1,500,000</td></tr>
<tr><td>Payment integration and testing</td><td>one-time</td><td class="r">1,500,000</td></tr>
<tr><td>Trust content: guide videos, photos</td><td>one-time</td><td class="r">1,000,000</td></tr>
<tr><td rowspan="2"><b>Launch</b></td><td>Marketing and acquisition (Xiaohongshu, WeChat, partners)</td><td>year 1</td><td class="r">4,500,000</td></tr>
<tr><td>Pilot and support</td><td>year 1</td><td class="r">1,000,000</td></tr>
<tr><td><b>Maintenance</b></td><td>Hosting, AI usage, maintenance</td><td>year 1</td><td class="r">1,500,000</td></tr>
<tr><td><b>Reserve</b></td><td>Contingency</td><td>year 1</td><td class="r">1,000,000</td></tr>
<tr class="total"><td colspan="3">Total year 1 (case limit: up to 20,000,000 KZT ${T.case})</td><td class="r">20,000,000</td></tr>
</table>
<p>After year 1, running costs (hosting, support, marketing upkeep) are assumed at <b>300,000 KZT per month = 3,600,000 KZT per year</b> ${T.prop}. All budget lines are planning assumptions ${T.prop} to be confirmed with at least two quotes.</p>

<h2>3. Volume assumption</h2>
<p>Goal: 30% foreign travelers within 24 months ${T.case}. Today ≈ 136 foreign travelers (4% of 3,400). Keeping ≈ 3,264 domestic travelers, 30% foreign means ≈ 4,663 total and ≈ 1,399 foreign, so <b>≈ 1,263 additional foreign travelers per year</b> by month 24. Launch is in month 4; volume ramps linearly from launch to the full run rate in month 24 (month <i>m</i> gets (m − 3) ÷ 21 of it), then stays flat.</p>

<h2>4. Payback model</h2>
<p><b>Formula.</b> Monthly net = additional travelers × 13,200 − costs. Costs: 12.0M one-time spread over months 1-3; the other 8.0M over months 1-12; 300,000 per month from month 13. Payback = first month in which cumulative cash is ≥ 0. <b>Downside scenario:</b> 30% fewer travelers than planned (× 0.7), everything else unchanged.</p>
<figure>${chart()}<figcaption>Cumulative cash over 48 months. Solid: base case. Dashed: downside (travelers × 0.7).</figcaption></figure>
<table>
<tr><th>Year</th><th class="r">Add. travelers (base)</th><th class="r">Contribution</th><th class="r">Costs</th><th class="r">Net</th><th class="r">Cumulative base</th><th class="r">Cumulative downside</th></tr>
${yb.map((r, i) => `<tr><td>Year ${r.y}</td><td class="r">${n(r.trav)}</td><td class="r">${m(r.contrib)}</td><td class="r">${m(r.cost)}</td><td class="r">${m(r.net)}</td><td class="r">${m(r.cum)}</td><td class="r">${m(yd[i].cum)}</td></tr>`).join('')}
</table>
<div class="grid2">
<div>
<h3>Results</h3>
<table>
<tr><th></th><th class="r">Base</th><th class="r">Downside</th></tr>
<tr><td>Lowest cumulative cash</td><td class="r">${m(Math.min(...base.map((p) => p.cum)))}</td><td class="r">${m(Math.min(...down.map((p) => p.cum)))}</td></tr>
<tr><td>Cumulative cash, month 24</td><td class="r">${m(base[23].cum)}</td><td class="r">${m(down[23].cum)}</td></tr>
<tr><td><b>Payback month</b></td><td class="r"><b>${payback(base)}</b></td><td class="r"><b>${payback(down)}</b></td></tr>
<tr><td>Cumulative cash, month 48</td><td class="r">${m(base[47].cum)}</td><td class="r">${m(down[47].cum)}</td></tr>
<tr><td>Break-even travelers (20M ÷ 13,200)</td><td class="r">1,516</td><td class="r">1,516</td></tr>
</table>
</div>
<div>
<h3>Sensitivity to the margin assumption</h3>
<table>
<tr><th>Margin</th><th class="r">Payback base</th><th class="r">Payback downside</th></tr>
${sens.map((s) => `<tr><td>${Math.round(s.mg * 100)}%${s.mg === 0.3 ? ' (default)' : ''}</td><td class="r">${s.b ? 'month ' + s.b : '> 48 months'}</td><td class="r">${s.d ? 'month ' + s.d : '> 48 months'}</td></tr>`).join('')}
</table>
</div>
</div>
<div class="warnnote"><b>Reading it honestly.</b> The base case pays back within 48 months for any margin from 20% up. The downside needs a margin of about 30% or more, so the margin is the first number to check with the company's real costs. If the pilot shows weaker demand, the levers are: shift marketing to referrals and organic Xiaohongshu content, delay paid ads, and keep running costs at the 300,000 KZT per month floor. The model is also live and adjustable on the Impact page of the prototype.</div>
`;

// ---------- 3. flow + wireframes ----------
const flowDoc = `
${head('Wireframe and flow diagram', 'How a foreign traveler goes from search to payment', 'Solid boxes are the main path. Dashed boxes are optional checks the traveler can use in any order before booking.')}
<figure style="margin-top:4pt">${flow()}</figure>
<table>
<tr><th style="width:24%">Step</th><th>What happens</th><th style="width:30%">Doubt removed</th></tr>
<tr><td>1. Discover</td><td>Lands from a Xiaohongshu post, search or a friend's postcard; switches to 中文; opens a tour</td><td>"Unclear how to book"; "what is included"</td></tr>
<tr><td>2. Check and decide</td><td>Optional: trip builder, concierge in Chinese (hand-off to a manager if unsure), Trust Center with guide video and a 5-minute call</td><td>"Is this company trustworthy?"</td></tr>
<tr><td>3. Book</td><td>Three short steps with clear inline errors; price summary repeats Included and Not-yet-confirmed items</td><td>"Unclear how to book"</td></tr>
<tr><td>4. Pay, travel, share</td><td>Provider-hosted card checkout; declined payments can be retried; confirmation code; trip timeline; postcard with referral link</td><td>"My foreign card does not work"</td></tr>
</table>
<div class="page-break"></div>
${head('Wireframe and flow diagram', 'Key screens of the working prototype', 'Screens from the clickable prototype (dist/index.html). Tour details and prices are demo data; payments are simulated (TEST MODE).')}
<div class="shots fixed">
<figure><img src="${img('inclusions')}"><figcaption>1. Tour page: "What's included" in four groups.</figcaption></figure>
<figure><img src="${img('chat-zh')}"><figcaption>2. Concierge answering in Chinese, opened from the tour page.</figcaption></figure>
<figure><img src="${img('trust')}"><figcaption>3. Trust Center: guide intro, video-call request, honest checklist.</figcaption></figure>
<figure><img src="${img('plan')}"><figcaption>4. Trip builder: 8 days, Kolsai + Burabay, transfer to Astana.</figcaption></figure>
<figure><img src="${img('booking')}"><figcaption>5. Booking step 3: international card; Alipay / WeChat Pay planned.</figcaption></figure>
<figure><img src="${img('confirmed')}"><figcaption>6. Confirmation with booking code.</figcaption></figure>
</div>
`;

// ---------- 4. references ----------
const refs = `
${head('References', 'Sources of statistics and facts', 'Accessed 25 October 2026. The team opens every link again before submission. Numbers in [brackets] are used in the main report.')}
<ol class="refs">
<li><b>[1]</b> The Times of Central Asia (19 June 2025). Article on the launch of the 2025 Year of China Tourism in Kazakhstan, citing the Ministry of Tourism and Sports of the Republic of Kazakhstan. 655,000 visitors from China in 2024 (+78% vs 367,000 in 2023); mutual visa-free regime since November 2023, up to 30 days per visit, max 90 days in 180.<br><a href="https://timesca.com/kazakhstan-launches-2025-year-of-china-tourism/">https://timesca.com/kazakhstan-launches-2025-year-of-china-tourism/</a></li>
<li><b>[2]</b> The Astana Times (February 2025). <i>Tourist Numbers from China to Kazakhstan Surge 78% in 2024.</i> Corroborates the 2024 figure.<br><a href="https://astanatimes.com/2025/02/tourist-numbers-from-china-to-kazakhstan-surge-78-in-2024/">https://astanatimes.com/2025/02/tourist-numbers-from-china-to-kazakhstan-surge-78-in-2024/</a></li>
<li><b>[3]</b> The Astana Times (June 2025). <i>Who's Visiting Kazakhstan? These Five Countries Top List</i>, citing the Tourism Industry Committee. 15.3 million foreign visitors for tourism purposes in 2024; China first outside the near abroad with 655,000.<br><a href="https://astanatimes.com/2025/06/whos-visiting-kazakhstan-these-five-countries-top-list/">https://astanatimes.com/2025/06/whos-visiting-kazakhstan-these-five-countries-top-list/</a></li>
<li><b>[4]</b> Orda.kz, citing Energyprom.kz analysts. <i>Chinese Tourist Arrivals in Kazakhstan Rose Sharply in 2025, Analysts Say.</i> 241,700 Chinese citizens in 2025 (+38.9%); Russia 429,800. Different method from [1]; not compared directly.<br><a href="https://en.orda.kz/chinese-tourist-arrivals-in-kazakhstan-rose-sharply-in-2025-analysts-say-10111/">https://en.orda.kz/chinese-tourist-arrivals-in-kazakhstan-rose-sharply-in-2025-analysts-say-10111/</a></li>
<li><b>[5]</b> The Astana Times (February 2026). <i>Kazakhstan Reports Tourism Growth Surge as Visitor Numbers and Revenues Climb in 2025.</i> 15.7 million foreign visitors for tourism purposes in the first nine months of 2025, excluding labour migrants and permanent residents.<br><a href="https://astanatimes.com/2026/02/kazakhstan-reports-tourism-growth-surge-as-visitor-numbers-and-revenues-climb-in-2025/">https://astanatimes.com/2026/02/kazakhstan-reports-tourism-growth-surge-as-visitor-numbers-and-revenues-climb-in-2025/</a></li>
<li><b>[6]</b> World Bank. <i>International tourism, number of arrivals (ST.INT.ARVL), Kazakhstan.</i> Data from UN Tourism (World Tourism Organization), CC BY 4.0. Counts overnight inbound visitors; not comparable with national visitor counts.<br><a href="https://data.worldbank.org/indicator/ST.INT.ARVL?locations=KZ">https://data.worldbank.org/indicator/ST.INT.ARVL?locations=KZ</a></li>
<li><b>[7]</b> Bureau of National Statistics of the Agency for Strategic Planning and Reforms of the Republic of Kazakhstan. <i>Tourism statistics: dynamic tables</i> ("Number of inbound tourism visitors"; "Incoming visitors served, by nationality"). Official series for checking the figures above.<br><a href="https://stat.gov.kz/en/industries/businessstatistics/stat-tourism/dynamic-tables/">https://stat.gov.kz/en/industries/businessstatistics/stat-tourism/dynamic-tables/</a></li>
<li><b>[8]</b> ZERTTEX Hackathon 2026, Stage 1, Case 1 "Technology Product": company facts for Saryarqa Routes (fictional case company), complaints from foreign guests, goal and budget.</li>
</ol>
<div class="note small">Everything not taken from these sources is labelled in the report and the prototype as Proposal, Demo data or Needs confirmation. Tour prices, guide profiles, weather and road data in the prototype are demo data.</div>
`;

// ---------- 5. AI declaration ----------
const ai = `
${head('AI Declaration', 'Use of artificial intelligence', 'Completed honestly by the team. Edit the bracketed fields before submission.')}
<h2>Level of AI use</h2>
<table>
<tr><th style="width:34%">Part of the submission</th><th style="width:16%">AI use</th><th>What the AI did / what people did</th></tr>
<tr><td>Prototype code (web app, logic, tests)</td><td><b>High</b></td><td>AI wrote the code from the team's written brief and also wrote and ran the automated tests. The team defined the product, features, case facts, honesty rules and the payback model logic.</td></tr>
<tr><td>Main report, financial document, flow diagram</td><td><b>High</b> (first draft)</td><td>AI produced first drafts, tables and the diagram from the team's brief; numbers are calculated by code from the stated assumptions. The team reviewed, edited and is responsible for the final text.</td></tr>
<tr><td>Product idea, target market, assumptions</td><td><b>Low</b></td><td>Chosen by the team (target market, features, 30% margin, budget split). AI pointed out risks and inconsistencies.</td></tr>
<tr><td>Sources and statistics</td><td><b>Medium</b></td><td>Facts come from the case and published sources. AI ran web searches to cross-check them and found one correction (15.7 million refers to the first nine months of 2025). The team re-opens every link.</td></tr>
<tr><td>Images</td><td><b>None generated</b></td><td>No AI-generated images or photos. Illustrations are simple vector drawings written as code; screenshots are of the prototype.</td></tr>
</table>

<h2>Tools</h2>
<table>
<tr><th style="width:30%">Tool</th><th>Used for</th><th style="width:30%">Link to chat / session</th></tr>
<tr><td>Claude (Anthropic), via Claude Code on the web</td><td>Writing the prototype code and automated tests; building the PDFs and Word report; drafting text; web search to cross-check sources</td><td><a href="https://claude.ai/code/session_01HrYY9Y9MwxQVFQRES5YEHH">claude.ai/code/session_01HrYY9Y9MwxQVFQRES5YEHH</a></td></tr>
<tr><td>[Other AI tools used by the team, if any]</td><td>[purpose]</td><td>[link]</td></tr>
</table>

<h2>What AI did not do</h2>
<ul>
<li>It did not invent statistics, interviews, reviews, licences, insurance, partnerships or awards. Unproven items are labelled "Needs confirmation".</li>
<li>It did not take decisions for the team: the idea, market, scope and assumptions are the team's.</li>
<li>No real payments, card numbers or personal data were processed; payments in the prototype are simulated.</li>
</ul>
<p>We confirm that this declaration describes our use of AI accurately.</p>
<div class="sign"><div>Team name and members</div><div>Date</div></div>
`;

const docs = [
  ['1_Main_Report', 'Saryarqa Go: main report', main],
  ['2_Financials_Business_Model', 'Saryarqa Go: financials and business model', fin],
  ['3_User_Flow_Wireframes', 'Saryarqa Go: wireframe and flow diagram', flowDoc],
  ['4_References', 'Saryarqa Go: references', refs],
  ['5_AI_Declaration', 'Saryarqa Go: AI declaration', ai],
];

(async () => {
  const browser = await chromium.launch();
  const pageObj = await browser.newPage();
  const footer = (label) =>
    `<div style="width:100%;font-family:Arial;font-size:7.5px;color:#888;padding:0 16mm;display:flex;justify-content:space-between"><span>Saryarqa Go · ${label}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  const render = async (file, title, body, label) => {
    const html = page(title, body);
    const hp = path.join(OUT, 'html', file + '.html');
    fs.writeFileSync(hp, html);
    await pageObj.goto('file://' + hp, { waitUntil: 'networkidle' }).catch(() => pageObj.goto('file://' + hp));
    await pageObj.waitForTimeout(400);
    await pageObj.pdf({ path: path.join(OUT, file + '.pdf'), format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer(label), margin: { top: '15mm', bottom: '17mm', left: '16mm', right: '16mm' } });
  };
  for (const [file, title, body] of docs) await render(file, title, body, title.replace('Saryarqa Go: ', ''));
  await render('Saryarqa_Go_Submission_ALL', 'Saryarqa Go: full submission', docs.map((d) => d[2]).join('<div class="page-break"></div>'), 'ZERTTEX 2026 submission');
  await browser.close();
  console.log('written to', OUT);
})();
