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
const FILES = ['README.md', 'REPORT.md', 'REPORT_NOTES.md', 'PLAN.md'];

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
const labelName = { case: 'Case fact', verified: 'Verified source', proposal: 'Proposal', demo: 'Demo data', confirm: 'Needs confirmation' };

const values = {
  cap: n(M.BUDGET_CAP),
  capM: `${M.BUDGET_CAP / 1e6}M`,
  total: n(M.budgetTotal),
  oneTime: n(M.oneTimeTotal),
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
    '| Item | Type | KZT | Share | Label |',
    '|---|---|---:|---:|---|',
    ...C.lines.map((b) => `| ${b.item} | ${b.kind} | ${n(b.amount)} | ${((b.amount / M.budgetTotal) * 100).toFixed(1)}% | ${labelName[b.label]} |`),
    `| **Total** (Stage 2 cap ${n(M.BUDGET_CAP)}) | | **${n(M.budgetTotal)}** | **100%** | |`,
  ].join('\n'),
  resultsTable: [
    '| | Base | Worse case (−30%, travelers × 0.7) |',
    '|---|---:|---:|',
    `| Lowest cumulative cash | ${mm(r.lowBase.cumulative)} KZT (month ${r.lowBase.month}) | ${mm(r.lowDown.cumulative)} KZT (month ${r.lowDown.month}) |`,
    `| Cumulative cash at month 24 | ${mm(at(r.base, 24))} KZT | ${mm(at(r.down, 24))} KZT |`,
    `| **Payback month** | **Month ${r.pbBase}** | **Month ${r.pbDown}** |`,
    `| Cumulative cash at month 48 | ${mm(at(r.base, 48))} KZT | ${mm(at(r.down, 48))} KZT |`,
    `| Break-even travelers (${n(M.BUDGET_CAP)} ÷ ${n(r.contribution)}) | ${n(r.breakEven)} | ${n(r.breakEven)} |`,
  ].join('\n'),
  sensTable: [
    `| Contribution margin | ${sens.map((s) => (s.mg === C.model.margin ? `**${s.mg * 100}%**` : `${s.mg * 100}%`)).join(' | ')} |`,
    `|---|${sens.map(() => '---').join('|')}|`,
    `| Payback · base | ${sens.map((s) => (s.mg === C.model.margin ? `**${pb(s.b)}**` : pb(s.b))).join(' | ')} |`,
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
