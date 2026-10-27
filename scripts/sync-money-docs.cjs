#!/usr/bin/env node
// Rewrites every money number in the Markdown docs from the ONE config
// (src/data/budget.ts). In a .md file, write a value as
//   <!--m:pbBase-->20<!--/m-->
// or a whole table as
//   <!--m:budgetTable-->
//   ...
//   <!--/m-->
// and run `npm run sync:money`. The markers are invisible when rendered.
// `--check` exits 1 if a file is out of date (used by the acceptance test).

const fs = require('fs');
const path = require('path');
const M = require('./lib/model.cjs');

const ROOT = path.resolve(__dirname, '..');
// REPORT.md is the Stage 1 report as submitted (20M plan) and is frozen.
const FILES = ['README.md', 'REPORT_NOTES.md', 'PLAN.md'];

const n = (x) => Math.round(x).toLocaleString('en-US');
const mm = (x) => `${x < 0 ? '−' : '+'}${(Math.abs(x) / 1e6).toFixed(1)}M`;
const C = M.budgetConfig;
const r = M.defaultResults();
const at = (s, m) => s[m - 1].cumulative;
const pb = (x) => (x ? `M${x}` : `> M${M.MONTHS}`);
const sens = [0.2, 0.25, 0.3, 0.35, 0.4].map((mg) => {
  const input = { ...r.input, margin: mg };
  return { mg, b: M.paybackMonth(M.series(input)), d: M.paybackMonth(M.series(input, M.DOWNSIDE)) };
});

const values = {
  cap: n(M.BUDGET_CAP),
  capM: `${M.BUDGET_CAP / 1e6}M`,
  total: n(M.budgetTotal),
  oneTime: n(M.oneTimeTotal),
  gate1: n(M.gateTotal(1)),
  gate2: n(M.gateTotal(2)),
  other: n(M.otherTotal),
  recurring: n(M.recurringTotal),
  reserve: n(M.reserveTotal),
  run: n(C.model.runningCostPerMonth),
  margin: `${Math.round(C.model.margin * 100)}%`,
  price: n(C.model.avgPrice),
  contribution: n(r.contribution),
  extra: n(M.derivation.extra),
  pbBase: String(r.pbBase),
  pbDown: String(r.pbDown),
  breakEven: n(r.breakEven),
  lowBase: mm(r.lowBase.cumulative),
  lowDown: mm(r.lowDown.cumulative),
  m24Base: mm(at(r.base, 24)),
  m24Down: mm(at(r.down, 24)),
  m48Base: mm(at(r.base, 48)),
  m48Down: mm(at(r.down, 48)),
  budgetTable: [
    '| Item | Group | Months | KZT |',
    '|---|---|---|---:|',
    ...C.lines.map((b) => `| ${b.item} | ${b.group} | ${b.start === b.end ? `M${b.start}` : `M${b.start}–${b.end}`} | ${n(b.amount)} |`),
    `| **Phase 1 total** (case cap ${n(M.BUDGET_CAP)}; Phase 2 up to ${n(M.PHASE2_MAX)} only after the month-${C.model.stageGateMonth} stage gate) | | | **${n(M.budgetTotal)}** |`,
  ].join('\n'),
  resultsTable: [
    '| | Company target (100%) | Worse case (−30%, required) | Stress test |',
    '|---|---:|---:|---:|',
    `| Lowest cumulative cash | ${mm(r.lowBase.cumulative)} KZT (month ${r.lowBase.month}) | ${mm(r.lowDown.cumulative)} KZT (month ${r.lowDown.month}) | ${mm(r.lowStress.cumulative)} KZT (month ${r.lowStress.month}) |`,
    `| Cumulative cash at month 24 | ${mm(at(r.base, 24))} KZT | ${mm(at(r.down, 24))} KZT | ${mm(at(r.stress, 24))} KZT |`,
    `| **Payback month** | **Month ${r.pbBase}** | **Month ${r.pbDown}** | ${r.pbStress ? `Month ${r.pbStress}` : 'none within 48 months'} |`,
    `| Cumulative cash at month 48 | ${mm(at(r.base, 48))} KZT | ${mm(at(r.down, 48))} KZT | ${mm(at(r.stress, 48))} KZT |`,
    `| Break-even travelers (${n(M.budgetTotal)} ÷ ${n(r.contribution)}) | ${n(r.breakEven)} | ${n(r.breakEven)} | |`,
  ].join('\n'),
  sensTable: [
    `| Contribution margin | ${sens.map((s) => (s.mg === C.model.margin ? `**${s.mg * 100}%**` : `${s.mg * 100}%`)).join(' | ')} |`,
    `|---|${sens.map(() => '---').join('|')}|`,
    `| Payback · company target | ${sens.map((s) => (s.mg === C.model.margin ? `**${pb(s.b)}**` : pb(s.b))).join(' | ')} |`,
    `| Payback · worse case | ${sens.map((s) => (s.mg === C.model.margin ? `**${pb(s.d)}**` : pb(s.d))).join(' | ')} |`,
  ].join('\n'),
};

const check = process.argv.includes('--check');
let stale = 0;
for (const f of FILES) {
  const file = path.join(ROOT, f);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const out = src.replace(/<!--m:(\w+)-->([\s\S]*?)<!--\/m-->/g, (all, key, body) => {
    if (!(key in values)) throw new Error(`${f}: unknown money key "${key}"`);
    const v = values[key];
    return v.includes('\n') ? `<!--m:${key}-->\n${v}\n<!--/m-->` : `<!--m:${key}-->${v}<!--/m-->`;
  });
  if (out !== src) {
    stale++;
    if (!check) fs.writeFileSync(file, out);
    console.log(`${check ? 'out of date' : 'updated'}: ${f}`);
  }
}
if (check && stale) process.exit(1);
if (!stale) console.log('money docs are up to date');
module.exports = values;
