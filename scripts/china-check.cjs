#!/usr/bin/env node
// "Opens from China" check: loads every page of the built site in Chromium and records
// every network request. Fails if any request goes to a service that is blocked or
// unreliable in mainland China (Google incl. Fonts and Gemini, YouTube, Wikimedia, Meta, X…).
// Links the visitor may click (e.g. photo credits) are not requests and are not counted.
//   npm run build && npm run china-check
const { chromium } = require('playwright');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'index.html');
const BLOCKED = /(google|googleapis|gstatic|googleusercontent|youtube|ytimg|youtu\.be|wikimedia|wikipedia|facebook|fbcdn|instagram|twitter|twimg|x\.com|whatsapp|telegram|t\.me|discord|openai|anthropic|cloudflareinsights)/i;
const ROUTES = ['/', '/tours', '/tour/charyn', '/tour/kolsai', '/tour/turkestan', '/tour/burabay', '/plan', '/ask', '/trust', '/book?tour=kolsai', '/trip', '/postcard', '/impact', '/pilot', '/partners', '/talk', '/manager', '/about'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const external = new Map();
  page.on('request', (r) => {
    const u = r.url();
    if (!/^https?:/.test(u)) return;
    const host = new URL(u).host;
    external.set(host, (external.get(host) ?? 0) + 1);
  });
  for (const r of ROUTES) {
    await page.goto(PAGE + '#' + r);
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
  }
  await browser.close();
  const bad = [...external].filter(([h]) => BLOCKED.test(h));
  console.log(`Pages checked: ${ROUTES.length}`);
  console.log(`External hosts requested: ${external.size ? [...external].map(([h, n]) => `${h} (${n})`).join(', ') : 'none'}`);
  if (bad.length) {
    console.log(`FAIL  blocked in mainland China: ${bad.map(([h]) => h).join(', ')}`);
    process.exit(1);
  }
  console.log('PASS  no request to Google, YouTube, Wikimedia or other services blocked in mainland China');
})();
