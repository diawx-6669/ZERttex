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

// 1) XLSX: the team's own model (live formulas) is the source spreadsheet.
//    scripts/finalize-team-model.py relabels it; this script only checks it exists.
if (!fs.existsSync(path.join(OUT, 'Cost_Payback_Sheet.xlsx'))) throw new Error('submission/stage2/Cost_Payback_Sheet.xlsx is missing');

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
  const all = [...r.base, ...r.down, ...r.stress].map((p) => p.cumulative);
  const lo = Math.min(...all), hi = Math.max(...all);
  const x = (m) => L + ((m - 1) / 47) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = (s) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(1)} ${y(p.cumulative).toFixed(1)}`).join(' ');
  const ticks = [];
  for (let v = Math.ceil(lo / 10e6) * 10e6; v <= hi; v += 10e6) ticks.push(v);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" font-family="Arial" font-size="7.5">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#333' : '#ddd'}"/><text x="${L - 3}" y="${y(v) + 2.5}" text-anchor="end" fill="#555">${v / 1e6}M</text>`).join('')}
    ${[1, 12, 24, 36, 48].map((m) => `<text x="${x(m)}" y="${H - 6}" text-anchor="middle" fill="#555">M${m}</text>`).join('')}
    <path d="${line(r.stress)}" fill="none" stroke="#888" stroke-width="1.2" stroke-dasharray="1.5 2.5"/>
    <path d="${line(r.down)}" fill="none" stroke="#C0392B" stroke-width="1.6" stroke-dasharray="4 3"/>
    <path d="${line(r.base)}" fill="none" stroke="#0E807A" stroke-width="2"/>
    ${r.pbBase ? `<circle cx="${x(r.pbBase)}" cy="${y(0)}" r="2.8" fill="#0E807A"/><text x="${x(r.pbBase)}" y="${y(0) - 5}" text-anchor="middle" fill="#0E807A" font-weight="bold">M${r.pbBase}</text>` : ''}
    ${r.pbDown ? `<circle cx="${x(r.pbDown)}" cy="${y(0)}" r="2.8" fill="#C0392B"/><text x="${x(r.pbDown)}" y="${y(0) + 11}" text-anchor="middle" fill="#C0392B" font-weight="bold">M${r.pbDown}</text>` : ''}
  </svg>`;
}

const mo = (b) => (b.start === b.end ? `M${b.start}` : `M${b.start}–${b.end}`);
const rowsGroup = (groups) => C.lines.filter((b) => groups.includes(b.group)).map((b) => `<tr><td>${b.item}</td><td class="c">${mo(b)}</td><td class="r">${n(b.amount)}</td></tr>`).join('');
const gsum = (groups) => C.lines.filter((b) => groups.includes(b.group)).reduce((x, b) => x + b.amount, 0);
const m13 = C.model.runningCostPerMonth;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 9mm 10mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #111; margin: 0; line-height: 1.22; }
h1 { font-size: 15pt; margin: 0 0 1mm; } .sub { color: #555; margin: 0 0 3mm; }
h2 { font-size: 9pt; margin: 2.2mm 0 1mm; color: #12213F; border-bottom: 1.2px solid #12213F; padding-bottom: 0.6mm; }
table { border-collapse: collapse; width: 100%; } td, th { padding: 0.55mm 1.2mm; border-bottom: 0.5px solid #ddd; vertical-align: top; }
th { text-align: left; background: #F1EEE6; font-size: 7.8pt; } .r { text-align: right; white-space: nowrap; } .c { text-align: center; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; } .tot td { font-weight: bold; border-top: 1px solid #111; }
.lab { display: inline-block; border: 0.6px solid; border-radius: 2px; padding: 0 1mm; font-size: 6.6pt; font-weight: bold; white-space: nowrap; }
.lab.case { background: #12213F; color: #fff; border-color: #12213F; } .lab.a, .lab.p { color: #7A5C1C; border-color: #C9A85C; } .lab.calc { color: #555; border-color: #aaa; }
.key { background: #E3F1EF; font-weight: bold; } .note { color: #555; font-size: 7.4pt; margin: 1mm 0 0; } .warn { background: #FBEBD2; padding: 1.2mm 1.6mm; border-radius: 2px; }
</style></head><body>
<h1>Saryarqa Go · Cost and Payback Sheet</h1>
<p class="sub">ZERTTEX Hackathon 2026 · Case 1 Technology Product · all amounts in KZT · planning assumptions, not a forecast · same model and numbers as Cost_Payback_Sheet.xlsx (live formulas) and the prototype's Impact page</p>
<div class="grid">
<div>
<h2>1. One-time costs ${lab('p')}</h2>
<table><tr><th>Item</th><th class="c">Months</th><th class="r">KZT</th></tr>${C.lines.filter((b) => b.kind === 'one-time').map((b) => `<tr><td>${b.item}</td><td class="c">${mo(b)}</td><td class="r">${n(b.amount)}</td></tr>`).join('')}<tr class="tot"><td>One-time total</td><td></td><td class="r">${n(M.firstYearOneTime)}</td></tr></table>
<h2>2. Monthly operating costs ${lab('a')}</h2>
<table><tr><th>Item</th><th class="c">Months</th><th class="r">KZT / month</th></tr>${C.lines.filter((b) => b.kind !== 'one-time').map((b) => `<tr><td>${b.item}</td><td class="c">${mo(b)}</td><td class="r">${n(b.amount / (b.end - b.start + 1))}</td></tr>`).join('')}
<tr class="tot"><td>Operating cost per month: M1–2 / M3 / M4–12</td><td></td><td class="r">${n(M.operatingInMonth(1))} / ${n(M.operatingInMonth(3))} / ${n(M.operatingInMonth(4))}</td></tr>
<tr><td>From month 13: ${C.runningItems.map((x) => `${x.item.split(' (')[0].toLowerCase()} ${n(x.amount)}`).join(' + ')}</td><td></td><td class="r">${n(C.model.runningCostPerMonth)}</td></tr></table>
<h2>3. Total first-year costs</h2>
<table>
<tr><td>One-time costs</td><td class="r">${n(M.firstYearOneTime)}</td></tr>
<tr><td>+ 12 months of operating costs</td><td class="r">${n(M.firstYearOperating)}</td></tr>
<tr class="tot key"><td>= Total first-year costs (Phase 1)</td><td class="r">${n(M.firstYearTotal)}</td></tr>
<tr><td>Case budget limit ${lab('case')}</td><td class="r">${n(M.BUDGET_CAP)}</td></tr>
<tr><td>Phase 2, only after the month-${C.model.stageGateMonth} stage gate ${lab('p')}</td><td class="r">≤ ${n(M.PHASE2_MAX)}</td></tr></table>
<p class="note">Not paid from the budget (stated): unpaid team work; Saryarqa Routes staff; per-transaction payment fees (inside the margin). Reasons for every line: Cost_Payback_Sheet.xlsx → Budget_8M, column G.</p>
<h2>4. Revenue assumptions</h2>
<table>
<tr><td>Average price per traveler</td><td class="r">${n(C.model.avgPrice)}</td><td>${lab('case')}</td></tr>
<tr><td>Contribution margin (after guides, transport, hotels, fees)</td><td class="r">${Math.round(C.model.margin * 100)}%</td><td>${lab('a')}</td></tr>
<tr><td>Contribution per traveler (price × margin)</td><td class="r">${n(r.contribution)}</td><td>${lab('calc')}</td></tr>
<tr><td>Launch month / ramp reaches 100% in month</td><td class="r">${C.model.launchMonth} / ${C.model.rampEndMonth}</td><td>${lab('a')}</td></tr>
<tr><td>Extra foreign travelers per year at 100% (from month 24)</td><td class="r">${n(d.extra)}</td><td>${lab('calc')}</td></tr>
<tr><td>Travelers / month to cover month-13 costs (${n(C.model.runningCostPerMonth)} ÷ ${n(r.contribution)})</td><td class="r">≈ ${Math.round(r.monthlyBreakEven)}</td><td>${lab('calc')}</td></tr>
</table>
</div>
<div>
<h2>5. Payback: company target vs worst case (−30% results)</h2>
<table><tr><th></th><th class="r">Target 100%</th><th class="r">−30%</th><th class="r">Stress*</th></tr>
<tr><td>Lowest cumulative cash</td><td class="r">${mm(r.lowBase.cumulative)} (M${r.lowBase.month})</td><td class="r">${mm(r.lowDown.cumulative)} (M${r.lowDown.month})</td><td class="r">${mm(r.lowStress.cumulative)} (M${r.lowStress.month})</td></tr>
<tr><td>Cumulative cash, month 24</td><td class="r">${mm(at(r.base, 24))}</td><td class="r">${mm(at(r.down, 24))}</td><td class="r">${mm(at(r.stress, 24))}</td></tr>
<tr class="key"><td>Payback month (cumulative ≥ 0)</td><td class="r">Month ${r.pbBase}</td><td class="r">Month ${r.pbDown}</td><td class="r">${r.pbStress ? 'Month ' + r.pbStress : 'none in 48'}</td></tr>
<tr><td>Cumulative cash, month 48</td><td class="r">${mm(at(r.base, 48))}</td><td class="r">${mm(at(r.down, 48))}</td><td class="r">${mm(at(r.stress, 48))}</td></tr>
<tr><td>Break-even travelers (${n(M.budgetTotal)} ÷ ${n(r.contribution)})</td><td class="r" colspan="3">${n(r.breakEven)}</td></tr></table>
<p class="note">*Stress test: ${Math.round(C.model.stress.volume * 100)}% of the target path, ${Math.round(C.model.stress.margin * 100)}% margin, launch ${C.model.stress.delay} months late → the month-${C.model.stageGateMonth} stage gate stops paid ads and keeps Phase 2 closed.</p>
${chart()}
<p class="note"><span style="color:#0E807A">━ company target</span> &nbsp; <span style="color:#C0392B">╍ worst case (−30%)</span> &nbsp; <span style="color:#888">┈ stress test</span> &nbsp; cumulative cash, 48 months</p>
<table><tr><th>Margin</th>${sens.map((s) => `<th class="r">${Math.round(s.mg * 100)}%</th>`).join('')}</tr>
<tr><td>Payback, target</td>${sens.map((s) => `<td class="r">${pb(s.b)}</td>`).join('')}</tr>
<tr><td>Payback, −30%</td>${sens.map((s) => `<td class="r">${pb(s.d)}</td>`).join('')}</tr></table>
<h2>6. Where ${n(d.extra)} comes from</h2>
<table>
<tr><td>~4% of ${n(d.travelers2025)} travelers are foreign today ${lab('case')}</td><td class="r">≈ ${n(d.foreignToday)}</td></tr>
<tr><td>Keep the domestic travelers</td><td class="r">${n(d.domestic)}</td></tr>
<tr><td>30% foreign ⇒ total = ${n(d.domestic)} ÷ 0.7</td><td class="r">≈ ${n(d.total)}</td></tr>
<tr><td>30% of ${n(d.total)} = foreign travelers needed</td><td class="r">≈ ${n(d.foreignNeeded)}</td></tr>
<tr class="key"><td>Extra foreign travelers per year (${n(d.foreignNeeded)} − ${n(d.foreignToday)})</td><td class="r">≈ ${n(d.extra)}</td></tr></table>
<p class="note warn">Check: 150,000,000 ÷ 3,400 = ${n(d.revPerTraveler)} KZT, slightly above the stated 44,000 KZT average price. The model uses 44,000 (the careful choice).</p>
<p class="note">Method: each line is spent evenly over its months; travelers in month m = scenario % × ${n(d.extra)} ÷ 12 × ramp(m), ramp = (m − 3) ÷ 21 for months 4–24, then 1; net = travelers × ${n(r.contribution)} − costs. Payback = first month the cumulative total is ≥ 0. Labels: Case fact = given in the case; Assumption / Proposal = team estimate to confirm with real quotes and company cost data.</p>
</div></div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: path.join(OUT, 'Cost_Payback_Sheet.pdf'), format: 'A4', printBackground: true });
  await browser.close();
  console.log('written submission/stage2/Cost_Payback_Sheet.pdf');
})();
