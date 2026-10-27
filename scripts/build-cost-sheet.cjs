#!/usr/bin/env node
// Builds submission/stage2/Cost_Payback_Sheet.xlsx (live formulas) and
// Cost_Payback_Sheet.pdf (exactly one A4 page) from src/data/budget.ts.
//   npm run cost-sheet
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const M = require('./lib/model.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'submission/stage2');
fs.mkdirSync(OUT, { recursive: true });
const C = M.budgetConfig;

// 1) XLSX with formulas
const tmp = path.join(os.tmpdir(), 'sg-budget-config.json');
fs.writeFileSync(tmp, JSON.stringify(C));
execFileSync('python3', [path.join(__dirname, 'cost_sheet_xlsx.py'), tmp, path.join(OUT, 'Cost_Payback_Sheet.xlsx')], { stdio: 'inherit' });

// 2) One-page PDF
const n = (x) => Math.round(x).toLocaleString('en-US');
const mm = (x) => `${x < 0 ? '−' : '+'}${(Math.abs(x) / 1e6).toFixed(1)}M`;
const r = M.defaultResults();
const d = M.derivation;
const at = (s, m) => s[m - 1].cumulative;
const sens = [0.2, 0.25, 0.3, 0.35, 0.4].map((mg) => {
  const input = { ...r.input, margin: mg };
  return { mg, b: M.paybackMonth(M.series(input)), d: M.paybackMonth(M.series(input, M.DOWNSIDE)) };
});
const pb = (x) => (x ? `M${x}` : '> M48');
const lab = (k) => `<span class="lab ${k}">${{ case: 'Case fact', a: 'Assumption', calc: 'Calculated', p: 'Proposal' }[k]}</span>`;

function chart() {
  const W = 330, H = 150, L = 34, R = 6, T = 8, B = 18;
  const all = [...r.base, ...r.down].map((p) => p.cumulative);
  const lo = Math.min(...all), hi = Math.max(...all);
  const x = (m) => L + ((m - 1) / 47) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = (s) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(1)} ${y(p.cumulative).toFixed(1)}`).join(' ');
  const ticks = [];
  for (let v = Math.ceil(lo / 10e6) * 10e6; v <= hi; v += 10e6) ticks.push(v);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" font-family="Arial" font-size="7.5">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#333' : '#ddd'}"/><text x="${L - 3}" y="${y(v) + 2.5}" text-anchor="end" fill="#555">${v / 1e6}M</text>`).join('')}
    ${[1, 12, 24, 36, 48].map((m) => `<text x="${x(m)}" y="${H - 6}" text-anchor="middle" fill="#555">M${m}</text>`).join('')}
    <path d="${line(r.down)}" fill="none" stroke="#C0392B" stroke-width="1.6" stroke-dasharray="4 3"/>
    <path d="${line(r.base)}" fill="none" stroke="#0E807A" stroke-width="2"/>
    ${r.pbBase ? `<circle cx="${x(r.pbBase)}" cy="${y(0)}" r="2.8" fill="#0E807A"/><text x="${x(r.pbBase)}" y="${y(0) - 5}" text-anchor="middle" fill="#0E807A" font-weight="bold">M${r.pbBase}</text>` : ''}
    ${r.pbDown ? `<circle cx="${x(r.pbDown)}" cy="${y(0)}" r="2.8" fill="#C0392B"/><text x="${x(r.pbDown)}" y="${y(0) + 11}" text-anchor="middle" fill="#C0392B" font-weight="bold">M${r.pbDown}</text>` : ''}
  </svg>`;
}

const rowsBudget = (kind) => C.lines.filter((b) => (kind === 'one-time' ? b.kind === 'one-time' : b.kind !== 'one-time')).map((b) => `<tr><td>${b.item}</td><td class="c">${b.gate}</td><td class="r">${n(b.amount)}</td></tr>`).join('');
const m13 = C.model.runningCostPerMonth;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 11mm 12mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 8.4pt; color: #111; margin: 0; line-height: 1.28; }
h1 { font-size: 15pt; margin: 0 0 1mm; } .sub { color: #555; margin: 0 0 3mm; }
h2 { font-size: 9.6pt; margin: 3mm 0 1.2mm; color: #12213F; border-bottom: 1.2px solid #12213F; padding-bottom: 0.6mm; }
table { border-collapse: collapse; width: 100%; } td, th { padding: 0.9mm 1.4mm; border-bottom: 0.5px solid #ddd; vertical-align: top; }
th { text-align: left; background: #F1EEE6; font-size: 7.8pt; } .r { text-align: right; white-space: nowrap; } .c { text-align: center; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; } .tot td { font-weight: bold; border-top: 1px solid #111; }
.lab { display: inline-block; border: 0.6px solid; border-radius: 2px; padding: 0 1mm; font-size: 6.6pt; font-weight: bold; white-space: nowrap; }
.lab.case { background: #12213F; color: #fff; border-color: #12213F; } .lab.a, .lab.p { color: #7A5C1C; border-color: #C9A85C; } .lab.calc { color: #555; border-color: #aaa; }
.key { background: #E3F1EF; font-weight: bold; } .note { color: #555; font-size: 7.4pt; margin: 1mm 0 0; } .warn { background: #FBEBD2; padding: 1.2mm 1.6mm; border-radius: 2px; }
</style></head><body>
<h1>Saryarqa Go · Cost and Payback Sheet</h1>
<p class="sub">ZERTTEX Hackathon 2026 · Case 1 Technology Product · all amounts in KZT · planning assumptions, not a forecast · same numbers as Cost_Payback_Sheet.xlsx (live formulas)</p>
<div class="grid">
<div>
<h2>1. One-time costs (spent in months 1–${C.model.oneTimeMonths})</h2>
<table><tr><th>Item</th><th class="c">Gate</th><th class="r">KZT</th></tr>${rowsBudget('one-time')}<tr class="tot"><td>One-time total</td><td></td><td class="r">${n(M.oneTimeTotal)}</td></tr></table>
<h2>2. Monthly costs</h2>
<table><tr><th>Year-1 recurring + contingency (months 1–${C.model.otherMonths})</th><th class="c">Gate</th><th class="r">KZT</th></tr>${rowsBudget('other')}
<tr class="tot"><td>Recurring + contingency total</td><td></td><td class="r">${n(M.otherTotal)}</td></tr>
<tr><td>Per month, months 1–3 (one-time + recurring)</td><td></td><td class="r">${n(M.oneTimeTotal / C.model.oneTimeMonths + M.otherTotal / C.model.otherMonths)}</td></tr>
<tr><td>Per month, months 4–12</td><td></td><td class="r">${n(M.otherTotal / C.model.otherMonths)}</td></tr>
<tr><td>Per month from month 13 (running cost) ${lab('a')}</td><td></td><td class="r">${n(m13)}</td></tr>
<tr class="tot key"><td>Total year 1 (cap ${n(M.BUDGET_CAP)}) ${lab('case')}</td><td></td><td class="r">${n(M.budgetTotal)}</td></tr></table>
<p class="note">Staged spending ${lab('p')}: the cap is a ceiling. Gate 1 (${n(M.gateTotal(1))}) funds the MVP + pilot; Gate 2 (${n(M.gateTotal(2))}) is released only if pilot metrics are met. AI usage is inside "Hosting, AI usage, maintenance".</p>
<h2>3. Revenue assumptions</h2>
<table>
<tr><td>Average price per traveler</td><td class="r">${n(C.model.avgPrice)}</td><td>${lab('case')}</td></tr>
<tr><td>Contribution margin</td><td class="r">${Math.round(C.model.margin * 100)}%</td><td>${lab('a')}</td></tr>
<tr><td>Contribution per traveler (price × margin)</td><td class="r">${n(r.contribution)}</td><td>${lab('calc')}</td></tr>
<tr><td>Launch month / ramp reaches 100% in month</td><td class="r">${C.model.launchMonth} / ${C.model.rampEndMonth}</td><td>${lab('a')}</td></tr>
<tr><td>Extra foreign travelers per year (from month 24)</td><td class="r">${n(d.extra)}</td><td>${lab('calc')}</td></tr>
<tr><td>Worse case: travelers × ${C.model.downsideFactor}</td><td class="r">−30%</td><td>${lab('a')}</td></tr>
</table>
<p class="note">Only one income source is counted: the margin on extra foreign travelers (no extras, longer trips or referrals).</p>
</div>
<div>
<h2>4. Payback: base vs worse case (−30%)</h2>
<table><tr><th></th><th class="r">Base</th><th class="r">−30%</th></tr>
<tr><td>Lowest cumulative cash</td><td class="r">${mm(r.lowBase.cumulative)} (M${r.lowBase.month})</td><td class="r">${mm(r.lowDown.cumulative)} (M${r.lowDown.month})</td></tr>
<tr><td>Cumulative cash, month 24</td><td class="r">${mm(at(r.base, 24))}</td><td class="r">${mm(at(r.down, 24))}</td></tr>
<tr class="key"><td>Payback month (cumulative ≥ 0)</td><td class="r">Month ${r.pbBase}</td><td class="r">Month ${r.pbDown}</td></tr>
<tr><td>Cumulative cash, month 48</td><td class="r">${mm(at(r.base, 48))}</td><td class="r">${mm(at(r.down, 48))}</td></tr>
<tr><td>Break-even travelers (${n(M.BUDGET_CAP)} ÷ ${n(r.contribution)})</td><td class="r">${n(r.breakEven)}</td><td class="r">${n(r.breakEven)}</td></tr></table>
${chart()}
<p class="note"><span style="color:#0E807A">━ base</span> &nbsp; <span style="color:#C0392B">╍ worse case (−30%)</span> &nbsp; cumulative cash, 48 months</p>
<table><tr><th>Margin</th>${sens.map((s) => `<th class="r">${Math.round(s.mg * 100)}%</th>`).join('')}</tr>
<tr><td>Payback base</td>${sens.map((s) => `<td class="r">${pb(s.b)}</td>`).join('')}</tr>
<tr><td>Payback −30%</td>${sens.map((s) => `<td class="r">${pb(s.d)}</td>`).join('')}</tr></table>
<h2>5. Where ${n(d.extra)} comes from</h2>
<table>
<tr><td>~4% of ${n(d.travelers2025)} travelers are foreign today ${lab('case')}</td><td class="r">≈ ${n(d.foreignToday)}</td></tr>
<tr><td>Keep the domestic travelers</td><td class="r">${n(d.domestic)}</td></tr>
<tr><td>30% foreign ⇒ total = ${n(d.domestic)} ÷ 0.7</td><td class="r">≈ ${n(d.total)}</td></tr>
<tr><td>30% of ${n(d.total)} = foreign travelers needed</td><td class="r">≈ ${n(d.foreignNeeded)}</td></tr>
<tr class="key"><td>Extra foreign travelers per year (${n(d.foreignNeeded)} − ${n(d.foreignToday)})</td><td class="r">≈ ${n(d.extra)}</td></tr></table>
<p class="note warn">Check: 150,000,000 ÷ 3,400 = ${n(d.revPerTraveler)} KZT, slightly above the stated 44,000 KZT average price. The model uses 44,000 (the careful choice).</p>
<p class="note">Method: costs as in sections 1–2; travelers in month m = ${n(d.extra)} ÷ 12 × ramp(m), ramp = (m − 3) ÷ 21 for months 4–24, then 1; net = travelers × ${n(r.contribution)} − costs. Payback = first month the cumulative total is ≥ 0. Labels: Case fact = given in the case; Assumption / Proposal = team estimate to confirm with real quotes and company cost data.</p>
</div></div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: path.join(OUT, 'Cost_Payback_Sheet.pdf'), format: 'A4', printBackground: true });
  await browser.close();
  console.log('written submission/stage2/Cost_Payback_Sheet.pdf');
})();
