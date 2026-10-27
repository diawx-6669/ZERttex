#!/usr/bin/env python3
"""Relabels the team's payback workbook for the final and writes
submission/stage2/Cost_Payback_Sheet.xlsx. Source: scripts/team-model-source.xlsx.
Formulas are untouched; only labels change and Summary becomes the first sheet.
Usage: python3 scripts/finalize-team-model.py && (LibreOffice recalc, see build script)"""
import sys, openpyxl
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src)
R, I, B, C, S, SE, P = (wb[n] for n in ['README', 'Inputs', 'Budget_8M', 'Cashflow', 'Summary', 'Sensitivity', 'PDF_20M_check'])
T, W, X = 'Company target (100%)', 'Worse case −30% (required)', 'Stress test'
R['A1'] = 'Saryarqa Go — Cost and Payback Sheet: Phase 1 budget 8,000,000 KZT within the 20,000,000 KZT case cap'
R['A2'] = 'ZERTTEX Hackathon 2026, Final (Stage 2), Case 1 Technology Product. Updated 27 Oct 2026. All amounts in KZT.'
R['A3'] = 'Case cap 20,000,000 KZT (organizers). We ask for 8,000,000 now (Phase 1); up to 12,000,000 more (Phase 2) only after the month-9 stage gate.'
R['A10'] = 'Budget_8M — the 13 Phase 1 lines that add up to exactly 8,000,000 KZT, with timing and a reason for each line; what is done unpaid; what is in Phase 2.'
R['A12'] = 'Summary (first sheet) — the numbers on slide 7 and on the prototype\'s Impact page: lowest point, monthly break-even, payback month, totals by year.'
R['A14'] = 'PDF_20M_check — Stage 1 model (20M spent in year 1) rebuilt to show its arithmetic (32 / 44). Superseded by the Phase 1 plan.'
R['A20'] = "Payback month = first month when cumulative cash flow (including the 8M Phase 1 investment) is ≥ 0. Monthly break-even = first month when that month's cash flow is ≥ 0."
R['A25'] = '3. The team works unpaid (research, content entry, QA, testing coordination). Saryarqa Routes provides a product owner, a manager and guides for videos from existing staff. Neither is in the budget.'
R['A30'] = 'Nothing in this model is a forecast of guaranteed results. Scenarios are tools for decisions (see the month-9 stage gate on slide 8).'
I['A29'], I['A30'], I['A31'] = T, W, X
I['E29'] = 'The company goal (30% foreign within 24 months) reached on time.'
I['E30'] = 'Required by the rules: 30% lower results than the target path. Also our realistic plan, since Phase 1 has only 1.2M for marketing.'
I['E31'] = 'Extra test: 40% of target, margin 25%, payment approval delays launch by 2 months. Triggers the month-9 stage gate.'
B['A1'] = 'Phase 1 budget: 8,000,000 KZT (12 months), within the 20,000,000 KZT case cap'
B['B20'] = 'Room left under the 20,000,000 KZT case cap (Phase 2, only after the month-9 stage gate)'
B['D20'] = '=20000000-D18'
B['A47'] = 'Not paid from the budget (stated assumptions, not hidden costs)'
B['A52'] = 'Phase 2 — up to 12,000,000 KZT of the case cap, released only after the month-9 stage gate'
for col, name in [('C', 'Target'), ('I', '−30%'), ('O', 'Stress')]:
    pass
C['C3'], C['I3'], C['O3'] = T, W, X
for row in C.iter_rows(min_row=4, max_row=4):
    for c in row:
        if isinstance(c.value, str):
            c.value = c.value.replace('Optimistic:', 'Target:').replace('Base:', '−30%:').replace('Downside:', 'Stress:')
S['A1'] = 'Summary — slide 7 and the Impact page'
S['B3'], S['C3'], S['D3'] = T, W, X
SE['A1'] = 'Payback month by margin and volume (launch month 4, Phase 1 budget 8M, running costs + marketing from month 13)'
P['A1'] = 'Stage 1 model check (20M spent in year 1) — superseded by the Phase 1 plan, kept only to show the arithmetic'
wb.move_sheet('Summary', offset=-wb.sheetnames.index('Summary'))
wb.active = 0
wb.save(out)
print('written', out, wb.sheetnames)
