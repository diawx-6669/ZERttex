#!/usr/bin/env node
// Prints the A6 referral postcards (one per tour) to submission/stage2/postcards.pdf.
// 148 × 105 mm trim + 3 mm bleed = 154 × 111 mm pages. Uses the built app
// (dist/index.html#/print/postcards), so run `npm run build` first.
//   node scripts/build-postcards.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'submission/stage2/postcards.pdf');

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(ROOT, 'dist/index.html') + '#/print/postcards');
  await page.waitForSelector('[data-card]');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: OUT, width: '154mm', height: '111mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
  await browser.close();
  console.log('written', path.relative(ROOT, OUT));
})();
