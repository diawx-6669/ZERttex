#!/usr/bin/env python3
"""Relabels the team's payback workbook for the final and writes
submission/stage2/Cost_Payback_Sheet.xlsx. Source: scripts/team-model-source.xlsx.
Formulas are untouched; only labels change and Summary becomes the first sheet.
Usage: python3 scripts/finalize-team-model.py && (LibreOffice recalc, see build script)"""
import sys, openpyxl
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src)
R, I, B, C, S, SE, P = (wb[n] for n in ['README', 'Inputs', 'Budget_8M', 'Cashflow', 'Summary', 'Sensitivity', 'PDF_20M_check'])
T, W, X = 'Company target (100%)', 'Worst case −30% (required)', 'Stress test'
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

# ---- Cost_Sheet: the items the Stage 2 rules list, in their order, all as live formulas ----
from openpyxl.styles import Font, PatternFill, Alignment
K = wb.create_sheet('Cost_Sheet', 0)
bold = Font(bold=True); h1 = Font(bold=True, size=14); h2 = Font(bold=True, size=11, color='FFFFFF')
fillh = PatternFill('solid', fgColor='1C293C'); fillk = PatternFill('solid', fgColor='FFE700')
K.column_dimensions['A'].width = 58; K.column_dimensions['B'].width = 16
for c in 'CDEFGHIJKLMN': K.column_dimensions[c].width = 12
r = 1
K.cell(r, 1, 'Saryarqa Go — Cost and Payback Sheet (KZT)').font = h1; r += 1
K.cell(r, 1, 'All numbers are formulas linked to the Inputs, Budget_8M, Cashflow and Summary sheets. Planning assumptions, not a forecast.'); r += 2
def head(t):
    global r
    for c in range(1, 4):
        K.cell(r, c).fill = fillh
    K.cell(r, 1, t).font = h2; r += 1
head('1. One-time costs')
one = [5, 6, 7, 8, 9, 10, 11, 12, 14]
first = r
for i in one:
    K.cell(r, 1, f'=Budget_8M!B{i}'); K.cell(r, 2, f'=Budget_8M!D{i}').number_format = '#,##0'; r += 1
K.cell(r, 1, 'One-time total').font = bold; K.cell(r, 2, f'=SUM(B{first}:B{r-1})').number_format = '#,##0'; K.cell(r, 2).font = bold
one_tot = f'B{r}'; r += 2
head('2. Monthly operating costs')
K.cell(r, 1, 'Item'); K.cell(r, 2, 'KZT / month'); K.cell(r, 3, 'Months'); r += 1
for i in [13, 15, 16, 17]:
    K.cell(r, 1, f'=Budget_8M!B{i}'); K.cell(r, 2, f'=Budget_8M!D{i}/(Budget_8M!F{i}-Budget_8M!E{i}+1)').number_format = '#,##0'
    K.cell(r, 3, f'="M"&Budget_8M!E{i}&"–"&Budget_8M!F{i}'); r += 1
K.cell(r, 1, 'Operating cost by month, year 1').font = bold
for m in range(12):
    col = chr(ord('C') + m)
    K.cell(r - 1 if False else r, 3 + m, f'=Budget_8M!{col}39+Budget_8M!{col}41+Budget_8M!{col}42+Budget_8M!{col}43').number_format = '#,##0'
months_row = r; r += 1
K.cell(r, 1, '(columns C–N = months 1–12)'); r += 1
K.cell(r, 1, 'Operating cost per month from month 13 (hosting, support, developer retainer, marketing)'); K.cell(r, 2, '=Inputs!B24').number_format = '#,##0'; r += 2
head('3. Total first-year costs')
K.cell(r, 1, 'One-time costs'); K.cell(r, 2, f'={one_tot}').number_format = '#,##0'; a1 = r; r += 1
K.cell(r, 1, '12 months of operating costs'); K.cell(r, 2, f'=SUM(C{months_row}:N{months_row})').number_format = '#,##0'; a2 = r; r += 1
K.cell(r, 1, 'Total first-year costs (one-time + 12 months operating)').font = bold; K.cell(r, 2, f'=B{a1}+B{a2}').number_format = '#,##0'; K.cell(r, 2).font = bold
for c in (1, 2): K.cell(r, c).fill = fillk
tot = r; r += 1
K.cell(r, 1, 'Case budget limit (Technology Product)'); K.cell(r, 2, 20000000).number_format = '#,##0'; r += 1
K.cell(r, 1, 'Check'); K.cell(r, 2, f'=IF(B{tot}<=B{r-1},"within limit","OVER LIMIT")'); r += 1
K.cell(r, 1, 'Check: equals the Phase 1 budget sheet'); K.cell(r, 2, f'=IF(B{tot}=Budget_8M!D18,"OK","CHECK")'); r += 2
head('4. Revenue assumptions')
for label, f, fmt in [('Average tour price per traveler (case fact)', '=Inputs!B4', '#,##0'), ('Contribution margin (team assumption, to confirm)', '=Inputs!B5', '0%'), ('Contribution per extra foreign traveler', '=Inputs!B17', '#,##0'), ('Extra foreign travelers per year at the company target', '=Inputs!B22', '#,##0'), ('Launch month (first bookings)', '=Inputs!B9', '0'), ('Travelers per month to cover month-13 costs', '=Inputs!B25', '0')]:
    K.cell(r, 1, label); K.cell(r, 2, f).number_format = fmt; r += 1
r += 1
head('5. Payback and worst case (30% lower results)')
K.cell(r, 2, '=Summary!B3'); K.cell(r, 3, '=Summary!C3'); K.cell(r, 4, '=Summary!D3')
for c in (2, 3, 4): K.cell(r, c).font = bold; K.cell(r, c).alignment = Alignment(wrap_text=True)
r += 1
for label, row, fmt in [('Payback month (cumulative cash ≥ 0)', 15, '0'), ('Lowest cumulative cash flow', 12, '#,##0'), ('Month of lowest point', 13, '0'), ('Cumulative cash flow at month 48', 16, '#,##0')]:
    K.cell(r, 1, label)
    for c, col in zip((2, 3, 4), 'BCD'):
        K.cell(r, c, f'=Summary!{col}{row}').number_format = fmt
    r += 1
K.cell(r, 1, 'Worst case = 70% of the company target path (30% lower results). Stress test = 40%, margin 25%, launch 2 months late.')
wb.active = 0
wb.save(out)
print('written', out, wb.sheetnames)
