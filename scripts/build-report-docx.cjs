#!/usr/bin/env node
// Builds docs/Saryarqa_Go_Report.docx from REPORT.md, with a cover page,
// coloured honesty labels, styled tables and prototype screenshots (docs/img).
//   node scripts/build-report-docx.cjs

const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, Packer, PageBreak,
  LineRuleType, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'docs/img');
const OUT = path.join(ROOT, 'docs/Saryarqa_Go_Report.docx');
// Money markers (<!--m:key-->…<!--/m-->, see scripts/sync-money-docs.cjs) are invisible: strip them.
const md = fs.readFileSync(path.join(ROOT, 'REPORT.md'), 'utf8').replace(/<!--m:\w+-->\n?|\n?<!--\/m-->/g, '').split('\n');

const C = { night: '12213F', teal: '0E807A', gold: 'A8802E', muted: '5C6270', line: 'DED2BC', sand: 'F8F3E9', zebra: 'FBF8F1' };
const FONT = 'Arial';
const CONTENT_W = 9638; // A4 minus 2 cm margins, in DXA

const LABELS = {
  'Case fact': { fg: 'FFFFFF', bg: C.night },
  'Verified source': { fg: '1F6B43', bg: 'E2F1E8' },
  Proposal: { fg: '7A5C1C', bg: 'F5EAD2' },
  'Demo data': { fg: '0B6460', bg: 'DCEFEC' },
  'Needs confirmation': { fg: '8A5208', bg: 'FBEBD2' },
};

// ---------- inline markdown → TextRuns ----------
function runs(text, base = {}) {
  text = text.replace(/\*(\w)\*/g, '$1').replace(/▶/g, 'Play');
  const out = [];
  const re = /(\*\*\[(Case fact|Verified source|Proposal|Demo data|Needs confirmation)([^\]]*)\]\*\*|\[(Case fact|Verified source|Proposal|Demo data|Needs confirmation)([^\]]*)\]|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const label = m[2] || m[4];
    if (label) {
      const extra = (m[3] || m[5] || '').trim();
      const st = LABELS[label];
      out.push(new TextRun({ text: ` ${label.toUpperCase()}${extra ? ' ' + extra : ''} `, bold: true, size: 15, color: st.fg, shading: { type: ShadingType.CLEAR, color: 'auto', fill: st.bg }, font: 'Courier New' }));
    } else if (m[6]) out.push(new TextRun({ text: m[6], bold: true, ...base }));
    else if (m[7]) out.push(new TextRun({ text: m[7], italics: true, ...base }));
    else if (m[8]) out.push(new TextRun({ text: m[8], font: 'Courier New', size: 18, color: C.teal, ...base }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

// ---------- images ----------
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}
function image(name, maxW = 600, maxH = 640) {
  const file = path.join(IMG, name + '.png');
  if (!fs.existsSync(file)) return null;
  const { w, h, data } = pngSize(file);
  const s = Math.min(maxW / w, maxH / h, 1.2);
  return new ImageRun({ type: 'png', data, transformation: { width: Math.round(w * s), height: Math.round(h * s) } });
}
function figure(name, caption, maxW = 600, maxH = 400) {
  const img = image(name, maxW, maxH);
  if (!img) return [];
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60, line: 240, lineRule: LineRuleType.AUTO }, keepNext: true, children: [img] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: caption, italics: true, size: 17, color: C.muted })] }),
  ];
}
function phoneRow(items) {
  const w = Math.floor(CONTENT_W / items.length);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: items.map(() => w),
    borders: noBorders(),
    rows: [
      new TableRow({
        children: items.map(([name, cap]) =>
          new TableCell({
            width: { size: w, type: WidthType.DXA },
            borders: noBorders(),
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 240, lineRule: LineRuleType.AUTO }, children: [image(name, 190, 420)].filter(Boolean) }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: cap, italics: true, size: 17, color: C.muted })] }),
            ],
          }),
        ),
      }),
    ],
  });
}
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
function noBorders() {
  return { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
}

// Screenshots placed at the end of a section (key = heading prefix).
const inline = {
  '2.1': [['loop', 'The closed loop on the home page. Every step opens a working screen.']],
  '2.2': [
    ['complaints', '"Four complaints, four answers" — each quote from the case mapped to a feature.'],
    ['inclusions', 'Every tour splits costs into Included / Optional extra / Not included / Not yet confirmed.'],
  ],
  '2.3': [
    ['trust', 'Trust Center: guide intro, video-call request, honest verification checklist, refund rules.'],
    ['trip', 'My trip: timeline with daily check-ins, family updates (off by default), road-closure rescheduling.'],
  ],
  '3.1': [
    ['booking', 'Booking step 3 in TEST MODE: international card via hosted checkout; Alipay / WeChat Pay planned.'],
    ['chat-zh', 'Concierge answering in Chinese, opened from a tour page without leaving it.'],
  ],
  '3.2': [['gantt', '12-week MVP plan (Impact page).']],
  '4.2': [['payback', 'Live payback model: sliders, KPI tiles and the 48-month cumulative cash chart.']],
};

// ---------- tables ----------
function mdTable(lines) {
  const rows = lines.filter((l) => !/^\|\s*:?-{2,}/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const n = rows[0].length;
  const lens = Array.from({ length: n }, (_, i) => Math.max(...rows.map((r) => (r[i] || '').replace(/\*|`|\[|\]/g, '').length)));
  const heads = rows[0].map((h) => h.replace(/\*|\[[^\]]*\]/g, '').trim().length);
  const weights = lens.map((x, k) => Math.min(Math.max(x, 16, heads[k] + 6), 70));
  const sum = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((x) => Math.floor((x / sum) * CONTENT_W));
  widths[n - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const alignRight = rows[0].map((_, i) => rows.slice(1).every((r) => /^[\s*−+\-–]*[\d.,]+[\s%MKZT*]*$|^\*\*[\d.,]+\*\*$/.test(r[i] || '') && (r[i] || '').length > 0));
  const border = { style: BorderStyle.SINGLE, size: 4, color: C.line };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: rows.map((r, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        cantSplit: true,
        children: r.map((cell, ci) =>
          new TableCell({
            width: { size: widths[ci], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: ri === 0 ? C.night : ri % 2 ? 'FFFFFF' : C.zebra },
            margins: { top: 70, bottom: 70, left: 110, right: 110 },
            children: [
              new Paragraph({
                alignment: alignRight[ci] && ri > 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: runs(cell, ri === 0 ? { bold: true, color: 'FFFFFF', size: 18 } : { size: 18 }),
              }),
            ],
          }),
        ),
      }),
    ),
  });
}

// ---------- body ----------
const body = [];
let i = 0;
let currentKey = null;
let firstH1 = true;
let numInstance = 0;
let inNumbered = false;

const flushInline = () => {
  if (currentKey && inline[currentKey]) inline[currentKey].forEach(([n, cap]) => body.push(...figure(n, cap)));
  currentKey = null;
};

// Skip the markdown title block; the cover page replaces it.
while (i < md.length && !md[i].startsWith('## Contents')) i++;

for (; i < md.length; i++) {
  const line = md[i];
  if (!line.startsWith('1. ') && !/^\d+\. /.test(line)) inNumbered = false;

  if (line.startsWith('## ')) {
    flushInline();
    const title = line.slice(3).trim();
    if (!firstH1) body.push(new Paragraph({ children: [new PageBreak()] }));
    firstH1 = false;
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(title) }));
    const key = title.split(' ')[0];
    if (inline[key]) currentKey = key;
    if (title.startsWith('Appendix B')) {
      // Replace the screens table with real screenshots.
      while (i + 1 < md.length && !md[i + 1].startsWith('## ')) i++;
      [
        ['map', 'Interactive route map: places from real coordinates; tap a pin for a tour card.'],
        ['plan', 'Trip builder: Kolsai + Burabay in 8 days, with the Almaty → Astana transfer and cost estimate.'],
        ['confirmed', 'Simulated payment success with a booking code.'],
        ['audio', 'Audio guide in English and Chinese (browser speech, text fallback).'],
        ['postcard', 'Postcard sized 4:5 for Xiaohongshu / WeChat Moments, with referral link.'],
      ].forEach(([n, cap]) => body.push(...figure(n, cap, 600, 560)));
      body.push(new Paragraph({ children: [new PageBreak()] }));
      body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('On a phone (390 px)')] }));
      body.push(phoneRow([['m-home', 'Home'], ['m-tour', 'Tour page'], ['m-chat', 'Chat in Chinese']]));
    }
    continue;
  }
  if (line.startsWith('### ')) {
    flushInline();
    const title = line.slice(4).trim();
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(title) }));
    const key = title.split(' ')[0];
    if (inline[key]) currentKey = key;
    continue;
  }
  if (line.trim() === '---' || line.trim() === '') continue;

  if (line.startsWith('```')) {
    const code = [];
    for (i++; i < md.length && !md[i].startsWith('```'); i++) code.push(md[i]);
    code.forEach((c, k) =>
      body.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF5F4' },
          spacing: { before: k === 0 ? 120 : 0, after: k === code.length - 1 ? 160 : 0 },
          indent: { left: 200, right: 200 },
          children: [new TextRun({ text: c || ' ', font: 'Courier New', size: 18, color: C.night, bold: true })],
        }),
      ),
    );
    continue;
  }
  if (line.startsWith('|')) {
    const block = [];
    for (; i < md.length && md[i].startsWith('|'); i++) block.push(md[i]);
    i--;
    body.push(mdTable(block));
    body.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    continue;
  }
  if (line.startsWith('>')) {
    const quote = [];
    for (; i < md.length && md[i].startsWith('>'); i++) quote.push(md[i].replace(/^>\s?/, ''));
    i--;
    quote.filter((q) => q.trim()).forEach((q) =>
      body.push(
        new Paragraph({
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: C.teal, space: 10 } },
          spacing: { after: 80 },
          children: runs(q, { italics: false, color: '2B3550' }),
        }),
      ),
    );
    continue;
  }
  let m;
  if ((m = line.match(/^(\s*)- \[ \] (.*)$/))) {
    body.push(new Paragraph({ numbering: { reference: 'boxes', level: 0 }, spacing: { after: 60 }, children: runs(m[2]) }));
    continue;
  }
  if ((m = line.match(/^(\s*)[-•] (.*)$/))) {
    body.push(new Paragraph({ numbering: { reference: 'bullets', level: m[1].length >= 2 ? 1 : 0 }, spacing: { after: 60 }, children: runs(m[2]) }));
    continue;
  }
  if ((m = line.match(/^\d+\. (.*)$/))) {
    if (!inNumbered) numInstance++;
    inNumbered = true;
    body.push(new Paragraph({ numbering: { reference: 'numbers', level: 0, instance: numInstance }, spacing: { after: 60 }, children: runs(m[1]) }));
    continue;
  }
  body.push(new Paragraph({ spacing: { after: 140 }, children: runs(line) }));
}
flushInline();

// ---------- cover ----------
const legendRows = Object.entries({
  'Case fact': 'Given in the official ZERTTEX case',
  'Verified source': 'Published figure with a linked source',
  Proposal: 'Our team’s idea or assumption',
  'Demo data': 'Invented for the prototype only',
  'Needs confirmation': 'Must be proven before launch',
});
const cover = [
  new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: 'ZERTTEX HACKATHON 2026 · STAGE 1 · CASE 1 “TECHNOLOGY PRODUCT”', bold: true, size: 18, color: C.gold, font: 'Courier New' })] }),
  new Paragraph({ spacing: { before: 360, after: 80, line: 240, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: 'Saryarqa Go', bold: true, size: 76, color: C.night })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Discover Kazakhstan. Book with confidence.', size: 34, color: C.teal })] }),
  new Paragraph({
    spacing: { after: 300 },
    children: [new TextRun({ text: 'An English / Chinese booking app that helps Saryarqa Routes reach 30% foreign travelers in 24 months — starting with Chinese-speaking independent travelers.', size: 22, color: C.muted })],
  }),
  ...figure('hero', 'Clickable prototype: dist/index.html (opens offline by double-click).', 600, 380),
  new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: 'How to read this report', bold: true, size: 22, color: C.night })] }),
  new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [2800, CONTENT_W - 2800],
    borders: noBorders(),
    rows: legendRows.map(([k, v]) =>
      new TableRow({
        children: [
          new TableCell({ width: { size: 2800, type: WidthType.DXA }, borders: noBorders(), margins: { top: 40, bottom: 40 }, children: [new Paragraph({ children: runs(`[${k}]`) })] }),
          new TableCell({ width: { size: CONTENT_W - 2800, type: WidthType.DXA }, borders: noBorders(), margins: { top: 40, bottom: 40 }, children: [new Paragraph({ children: [new TextRun({ text: v, size: 19 })] })] }),
        ],
      }),
    ),
  }),
  new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: 'The same five labels appear inside the clickable prototype. Payments in the prototype are simulated (TEST MODE).', size: 18, color: C.muted, italics: true })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

const doc = new Document({
  creator: 'Saryarqa Go team',
  title: 'Saryarqa Go — ZERTTEX Hackathon 2026 report',
  description: 'Case 1 Technology Product report',
  styles: {
    default: { document: { run: { font: FONT, size: 20, color: '1C2436' }, paragraph: { spacing: { line: 276, lineRule: LineRuleType.AUTO } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, color: C.night, font: FONT }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.teal, space: 6 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: C.teal, font: FONT }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } },
      ] },
      { reference: 'boxes', levels: [{ level: 0, format: LevelFormat.BULLET, text: '☐', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }, titlePage: true },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Saryarqa Go · ZERTTEX Hackathon 2026 · Case 1', size: 16, color: C.muted })] })] }),
        first: new Header({ children: [] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted })] })] }),
        first: new Footer({ children: [] }),
      },
      children: [...cover, ...body],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('wrote', OUT, (buf.length / 1024).toFixed(0) + ' KB');
});
