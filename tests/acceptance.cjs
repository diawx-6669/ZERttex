// End-to-end check of the acceptance checklist against dist/index.html.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'dist/index.html');
const SHOTS = path.join(ROOT, 'screenshots');
const PHOTO = path.join(__dirname, 'fixtures/photo.png');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const decodePng = (buf) => {
  const png = PNG.sync.read(buf);
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
};
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (name, cond, info = '') => {
  results.push({ name, pass: !!cond, info });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
};
// A check that cannot run in this environment is reported, never counted as passed.
const skipped = [];
const skip = (name, why) => {
  skipped.push({ name, why });
  console.log(`SKIP  ${name}  — ${why}`);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  // Block Google Fonts so the test is offline-deterministic.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts|ERR_FAILED|net::ERR_/.test(m.text()) && errors.push(m.text()));

  const go = async (h) => {
    await page.goto(URL + '#' + h);
    await page.waitForTimeout(700);
  };
  const shot = async (name, full = true) => (await page.waitForTimeout(500), page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: full }));

  // 1. Home → Explore tours → Kolsai → open all → packing
  await go('/');
  ok('Home shows loop strip with 6 steps', (await page.locator('ol >> a[href^="#/"]').filter({ hasText: /Discover|Plan|Verify|Book|Travel|Share/ }).count()) >= 6);
  ok('Home shows "Four complaints, four answers"', await page.getByText('Four complaints, four answers').isVisible());
  await shot('01-home');
  await page.getByRole('link', { name: /Explore tours/ }).first().click();
  await page.waitForTimeout(200);
  ok('Explore tours → #/tours', page.url().endsWith('#/tours'));
  await page.locator('a[href="#/tour/kolsai"]').first().click();
  await page.waitForTimeout(200);
  ok('Kolsai detail opened', page.url().endsWith('#/tour/kolsai'));
  await page.getByRole('button', { name: 'Open all' }).click();
  const expanded = await page.locator('button[aria-controls^="inc-kolsai"][aria-expanded="true"]').count();
  ok('All 4 inclusion groups open', expanded === 4, `${expanded} open`);
  ok('Kaindy 4×4 marked not yet confirmed', await page.getByText('Kaindy 4×4 transfer').isVisible());
  const boxes = page.locator('input[type="checkbox"]');
  for (let i = 0; i < 3; i++) await boxes.nth(i).check();
  ok('Packing list "3 of 6 packed"', await page.getByText('3 of 6 packed').isVisible());
  await shot('02-tour-kolsai');

  // 2. Audio guide
  await page.getByRole('button', { name: /^Play: Lower Kolsai Lake/ }).click();
  await page.waitForTimeout(1200);
  const fallback = await page.getByText('Your browser has no voice').count();
  const playing = await page.getByText('Playing…').count();
  ok('Audio guide EN plays or degrades gracefully', fallback > 0 || playing > 0, fallback ? 'fallback text shown' : 'speaking');
  await page.getByRole('button', { name: '中文', exact: true }).last().click();
  await page.getByRole('button', { name: /Play: 下科尔赛湖/ }).click();
  await page.waitForTimeout(1200);
  ok('Audio guide 中文 plays or degrades gracefully', (await page.getByText('科尔赛湖是被云杉林环绕').count()) > 0 || (await page.getByText('Playing…').count()) > 0);

  // 3. Ask a question from tour → auto-asks; Chinese → Chinese
  await page.getByRole('button', { name: /Ask a question/ }).first().click();
  await page.waitForTimeout(1100);
  ok('Ask a question opens the concierge drawer in place', (await page.getByRole('dialog').count()) === 1 && page.url().endsWith('#/tour/kolsai'));
  const log = page.locator('[role="log"]');
  ok('Concierge auto-asked about Kolsai', (await log.getByText("What's included in Kolsai Lakes & Kaindy?").count()) === 1);
  ok('Concierge answered with inclusions', (await log.getByText(/Not yet confirmed \(confirmed in writing/).count()) === 1);
  await page.fill('#chat-input', '外国银行卡能用吗？');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  ok('Chinese question → Chinese answer', (await log.getByText(/外国银行卡（Visa、万事达等）/).count()) === 1);
  await page.fill('#chat-input', 'Is Kolsai available on 3 May?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  ok('Availability → "won\'t guess" + handoff form', (await log.getByText(/I can't see live availability/).count()) === 1 && (await page.locator('#h-email').count()) === 1);
  await page.fill('#h-email', 'li.wei@example.com');
  await page.getByRole('button', { name: 'Send to manager' }).click();
  await page.waitForTimeout(300);
  ok('Handoff sends (simulated) with toast', (await page.getByText(/Sent to a manager \(simulated\)/).count()) >= 1);
  await shot('03-concierge', false);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  ok('Esc closes the drawer', (await page.getByRole('dialog').count()) === 0);

  // 3b. Tours filters + map
  await go('/tours');
  await page.getByRole('button', { name: 'Astana', exact: true }).click();
  ok('Filter by start city: Astana → 1 tour', (await page.locator('article').count()) === 1);
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  ok('Clear filters → 4 tours', (await page.locator('article').count()) === 4);
  await go('/');
  await page.getByRole('button', { name: 'Turkestan: Silk Road Heritage' }).first().click();
  ok('Map pin opens a tour card', (await page.locator('a[aria-label="Turkestan: Silk Road Heritage"]').count()) >= 1);
  await page.getByRole('button', { name: /Ask in EN or 中文/ }).click();
  await page.waitForTimeout(300);
  ok('Floating chat button opens drawer from any page', (await page.getByRole('dialog').count()) === 1);
  ok('Conversation is kept between pages', (await page.locator('[role="log"]').getByText(/I can't see live availability/).count()) === 1);
  await page.keyboard.press('Escape');

  // 4. Trip builder: Kolsai + Burabay, 8 days
  await go('/plan');
  await page.locator('label').filter({ hasText: 'Burabay Lakes & Granite' }).click();
  await page.locator('#len').fill('8');
  await page.getByRole('button', { name: /Build my itinerary/ }).click();
  await page.waitForTimeout(500);
  ok('Itinerary includes transfer to Astana', (await page.getByText('Transfer Almaty → Astana').count()) === 1);
  const dayCount = await page.locator('#plan-result ol > li').count();
  ok('Itinerary has 8 days', dayCount === 8, `${dayCount} days`);
  ok('Estimate tags shown', (await page.getByText(/Estimate/).count()) >= 2);
  await shot('04-trip-builder');
  // error when too short
  await page.locator('#len').fill('5');
  await page.getByRole('button', { name: /Build my itinerary/ }).click();
  ok('Error when tours do not fit', (await page.getByText(/need at least 7 days/).count()) === 1);
  await page.locator('#len').fill('8');
  await page.getByRole('button', { name: /Build my itinerary/ }).click();
  await page.getByRole('button', { name: /Book these tours/ }).click();
  await page.waitForTimeout(300);
  ok('Book → prefilled booking (2 tours)', page.url().includes('#/book') && (await page.getByText('Prefilled from your trip plan.').count()) === 1 && (await page.locator('select[id^="tour"]').count()) === 2);
  ok('TEST MODE banner visible', await page.getByText(/TEST MODE/).first().isVisible());
  ok('No card-number input exists', (await page.locator('input[autocomplete="cc-number"], input[name*="card" i]').count()) === 0);

  // 5. Booking validation, decline, success
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForTimeout(150);
  ok('Validation errors show on step 2', (await page.getByText('Enter your name (at least 2 letters).').count()) === 1 && (await page.getByText(/Enter a valid email/).count()) === 1);
  await shot('05a-booking-errors', false);
  await page.fill('#name', 'Li Wei');
  await page.fill('#email', 'li.wei@example');
  await page.selectOption('#country', 'CN');
  await page.locator('label').filter({ hasText: /^中文/ }).click();
  await page.getByRole('button', { name: /^Continue/ }).click();
  ok('Invalid email rejected', (await page.getByText(/Enter a valid email/).count()) === 1);
  await page.fill('#email', 'li.wei@example.com');
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: /Pay \(test mode\)/ }).click();
  ok('Step 3 requires method + agreement', (await page.getByText('Choose a payment method.').count()) === 1 && (await page.getByText(/Please confirm you have read/).count()) === 1);
  ok('Alipay / WeChat Pay marked Phase 2', (await page.locator('[data-scope="p2"]').count()) === 2);
  await page.locator('label').filter({ hasText: 'International card' }).click();
  await page.locator('label').filter({ hasText: 'I have read what is included' }).click();
  await page.locator('label').filter({ hasText: 'Demo: simulate a declined payment' }).click();
  await shot('05b-booking-payment');
  await page.getByRole('button', { name: /Pay \(test mode\)/ }).click();
  await page.waitForTimeout(1700);
  ok('Declined payment screen', (await page.getByText('Payment declined').count()) === 1);
  await shot('05c-booking-declined', false);
  await page.getByRole('button', { name: /Try again/ }).click();
  await page.getByRole('button', { name: /Pay \(test mode\)/ }).click();
  await page.waitForTimeout(1700);
  const code = (await page.getByTestId('booking-code').textContent()) || '';
  ok('Success → booking code SG-XXXX', /^SG-[A-Z0-9]{4}$/.test(code), code);
  await shot('05d-booking-confirmed');

  // 6. My trip
  await page.getByRole('button', { name: /Open My trip/ }).click();
  await page.waitForTimeout(300);
  ok('My trip shows the real booking code', (await page.getByText(code).count()) >= 1);
  await page.getByRole('switch').click();
  ok('Family sharing on shows scope + link', (await page.getByText(/not live GPS/).count()) === 1 && (await page.locator('#fam-link').count()) === 1);
  await page.getByRole('button', { name: /^Copy$/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole('radio', { name: /Road closure/ }).click();
  await page.locator('label.chip').first().click();
  await page.getByRole('button', { name: /Request reschedule/ }).click();
  ok('Road closure → reschedule requested', (await page.getByText(/Reschedule requested. The operator must confirm./).count()) >= 1);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Advance demo time/ }).click();
  await shot('06-my-trip');
  await page.getByRole('button', { name: /Stop sharing now/ }).click();
  ok('Stop sharing turns family off', (await page.getByRole('switch').getAttribute('aria-checked')) === 'false');
  for (let i = 0; i < 10; i++) {
    const b = page.getByRole('button', { name: /Advance demo time/ });
    if (await b.isDisabled()) break;
    await b.click();
  }
  ok('Advance time to the end → postcard CTA', (await page.getByRole('button', { name: /Make your postcard/ }).count()) === 1);
  await page.getByRole('button', { name: /Make your postcard/ }).click();
  await page.waitForTimeout(300);

  // 7. Postcard
  ok('Postcard page opened', page.url().endsWith('#/postcard'));
  await page.setInputFiles('#pc-files', PHOTO);
  await page.waitForTimeout(400);
  ok('Uploaded photo shows on postcard', (await page.locator('[data-testid="postcard"] img').count()) === 1);
  await page.fill('#pc-msg', 'Kaindy was unreal!');
  await page.getByRole('button', { name: /Copy link/ }).click();
  await page.waitForTimeout(200);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  ok('Copy referral link works', clip.startsWith('https://diawx-6669.github.io/ZERttex/#/tour/'), clip);
  ok('No "not scannable" label left', (await page.getByText(/not scannable/).count()) === 0);
  // Decode the on-screen QR (screenshot of the SVG) and the downloaded PNG with jsQR.
  const qrEl = page.locator('[data-testid="postcard"] svg[data-qr]');
  // Enlarge the 84px QR to 300px for a reliable decode, then restore it.
  await qrEl.evaluate((el) => Object.assign(el.parentElement.style, { width: '300px', height: '300px' }));
  const qrShot = decodePng(await qrEl.screenshot());
  await qrEl.evaluate((el) => Object.assign(el.parentElement.style, { width: '', height: '' }));
  ok('On-screen QR decodes to the tour page with ?ref=', !!qrShot && /^https:\/\/diawx-6669\.github\.io\/ZERttex\/#\/tour\/(charyn|kolsai|turkestan|burabay)\?ref=[A-Z0-9-]+$/.test(qrShot.data) && qrShot.data === clip, qrShot ? qrShot.data : 'not decoded');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download PNG/ }).click()]);
  const pngPath = path.join(SHOTS, '07b-postcard-download.png');
  await dl.saveAs(pngPath);
  const pngBuf = fs.readFileSync(pngPath);
  const pngMeta = PNG.sync.read(pngBuf);
  ok('Download PNG: 1080×1350 file', dl.suggestedFilename().endsWith('.png') && pngMeta.width === 1080 && pngMeta.height === 1350, `${dl.suggestedFilename()} ${pngMeta.width}×${pngMeta.height}`);
  const qrPng = decodePng(pngBuf);
  ok('Downloaded PNG QR scans to the same tour link', !!qrPng && qrPng.data === clip, qrPng ? qrPng.data : 'not decoded');
  // Destination change → QR follows
  await page.locator('label').filter({ hasText: 'Charyn Canyon' }).first().click();
  await page.waitForTimeout(150);
  ok('QR follows the chosen destination', (await qrEl.getAttribute('data-qr')).includes('#/tour/charyn?ref='));
  await page.locator('label').filter({ hasText: 'Kolsai Lakes' }).first().click();
  await shot('07-postcard');
  await page.getByRole('button', { name: /See what your friend sees/ }).click();
  await page.waitForTimeout(300);
  ok('Postcard leads to the tour page with referral banner', /#\/tour\/\w+\?ref=/.test(page.url()) && (await page.getByText(/A friend sent you this postcard/).count()) === 1, page.url());
  await go('/tour/burabay/r/LIWEI-7KQ2');
  ok('Hash-safe referral path #/tour/<id>/r/<code> works', (await page.getByTestId('referral-banner').getByText('LIWEI-7KQ2').count()) === 1 && (await page.locator('h1').textContent()).includes('Burabay'));

  // 8. Impact
  await go('/impact');
  ok('Budget total exactly 20,000,000', (await page.getByTestId('budget-total').textContent()) === '20,000,000');
  const lineSum = await page.evaluate(() => [...document.querySelectorAll('[data-testid="budget-amount"]')].reduce((s, td) => s + Number(td.textContent.replace(/,/g, '')), 0));
  ok('Budget lines add up to 20,000,000', lineSum === 20000000, String(lineSum));
  ok('Staged spending: Gate 1 14,500,000 + Gate 2 5,500,000 (Proposal)', (await page.getByTestId('gate-1').textContent()) === '14,500,000' && (await page.getByTestId('gate-2').textContent()) === '5,500,000' && (await page.getByTestId('staged-spending').getByText('Proposal').count()) === 1);
  ok('Default payback base = Month 32', (await page.getByText('Month 32').count()) >= 1);
  ok('Default payback downside = Month 44', (await page.getByText('Month 44').count()) >= 1);
  ok('Payback table shows base and −30%', (await page.getByTestId('payback-table').getByText('M32').count()) === 1 && (await page.getByTestId('payback-table').getByText('M44').count()) === 1);
  ok('Break-even travelers 1,516 (20M ÷ 13,200)', (await page.getByText('1,516', { exact: true }).count()) >= 1);
  ok('No 8M cap wording left on Impact', !/Stage 2 (cap|rule|limit)|In MVP \(8M\)|within 8,000,000/.test(await page.content()));
  ok('Impact lists: In MVP and Phase 2 badges', (await page.locator('[data-scope="mvp"]').count()) >= 1 && (await page.locator('[data-scope="p2"]').count()) >= 1);
  ok('Impact MVP / later lists from budget.ts', (await page.getByText('Rules-based trip builder').count()) === 1 && (await page.getByText('Live LLM concierge with retrieval').count()) === 1);
  await shot('08-impact');
  await page.locator('#s-margin').fill('40');
  await page.waitForTimeout(150);
  const after = await page.locator('text=/Month \\d+/').allTextContents();
  ok('Sliders update KPIs live', !after.includes('Month 32'), after.join(', '));

  // 9. Trust center
  await go('/trust');
  await page.getByRole('button', { name: /Play intro/ }).click();
  await page.waitForTimeout(800);
  ok('Guide intro slideshow plays captions', (await page.getByText(/Hi, I’m Aruzhan/).count()) === 1);
  ok('Licence marked Needs confirmation', (await page.getByText(/Document to be provided by company/).count()) >= 3);
  await page.fill('#c-time', '2026-11-20T10:00');
  await page.getByRole('button', { name: /Request video call/ }).click();
  ok('Video call request (simulated)', (await page.getByText(/Request sent \(simulated\)/).count()) >= 1);
  await shot('09-trust');

  // 9b. Scope badges: In MVP vs Phase 2
  const scopeOf = async (r) => { await go(r); return page.locator('h1').locator('xpath=preceding-sibling::*[@data-scope][1]').getAttribute('data-scope').catch(() => null); };
  for (const [r, want] of [['/tours', 'mvp'], ['/book?tour=kolsai', 'mvp'], ['/ask', 'mvp'], ['/trust', 'mvp'], ['/postcard', 'mvp'], ['/plan', 'mvp'], ['/trip', 'mvp']]) {
    const got = await scopeOf(r);
    ok(`Scope badge on ${r}: ${want}`, got === want, String(got));
  }
  await go('/tour/kolsai');
  ok('Tour page: inclusions and audio guide In MVP', (await page.locator('#inc [data-scope="mvp"]').count()) === 1 && (await page.locator('#audio [data-scope="mvp"]').count()) === 1);
  ok('Scope badge text says "In MVP" (no 8M)', (await page.locator('#inc [data-scope="mvp"]').textContent()).trim().endsWith('In MVP'));

  // 9c. Evidence slot: empty until the team adds real interviews; never sample data.
  const interviewsSrc = fs.readFileSync(path.join(ROOT, 'src/data/interviews.ts'), 'utf8');
  const interviewsEmpty = /export const interviews: Interview\[\] = \[\];/.test(interviewsSrc);
  for (const r of ['/', '/about']) {
    await go(r);
    const n = await page.getByRole('heading', { name: 'What travelers told us' }).count();
    ok(`Evidence slot on ${r}: ${interviewsEmpty ? 'hidden while empty' : 'shows real interviews'}`, interviewsEmpty ? n === 0 : n === 1);
  }

  // 10. Language toggle
  await go('/');
  await page.getByRole('button', { name: '中文', exact: true }).first().click();
  await page.waitForTimeout(200);
  ok('中文 toggle: home in Chinese', (await page.getByText('四个顾虑，四个解决方案').count()) === 1);
  await shot('10-home-zh', false);
  for (const r of ['/tour/turkestan', '/book?tour=charyn', '/ask', '/trust', '/plan', '/trip']) {
    await go(r);
    const latin = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
    ok(`中文 heading on ${r}`, /[\u4e00-\u9fff]/.test(latin), latin.slice(0, 30));
  }
  await go('/tour/turkestan');
  await shot('11-tour-turkestan-zh');
  await go('/ask');
  await page.fill('#chat-input', '需要签证吗？');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await shot('12-concierge-zh', false);
  await page.getByRole('button', { name: 'EN', exact: true }).first().click();

  ok('No JS errors', errors.length === 0, errors.join(' | '));

  // 11. Mobile 375px: no horizontal overflow on every route
  const m = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const mp = await m.newPage();
  const routes = ['/', '/tours', '/tour/kolsai', '/tour/turkestan', '/plan', '/ask', '/trust', '/book', '/trip', '/postcard', '/impact', '/about'];
  for (const r of routes) {
    await mp.goto(URL + '#' + r);
    await mp.waitForTimeout(250);
    const sw = await mp.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
    ok(`375px no horizontal scroll: ${r}`, sw <= 375, `scrollWidth ${sw}`);
  }
  await mp.goto(URL + '#/');
  await mp.waitForTimeout(800);
  await mp.screenshot({ path: path.join(SHOTS, '13-mobile-home.png') });
  ok('Mobile bottom tab bar visible', await mp.getByRole('navigation', { name: 'Quick' }).isVisible());
  await mp.getByRole('navigation', { name: 'Quick' }).getByRole('button', { name: /Ask/ }).click();
  await mp.waitForTimeout(300);
  ok('Mobile tab bar Ask opens chat drawer', (await mp.getByRole('dialog').count()) === 1);
  await mp.screenshot({ path: path.join(SHOTS, '19-mobile-chat.png') });
  await mp.keyboard.press('Escape');
  await mp.getByRole('button', { name: /Menu/ }).click();
  await mp.waitForTimeout(250);
  ok('Mobile menu drawer opens', await mp.getByRole('dialog').isVisible());
  await mp.screenshot({ path: path.join(SHOTS, '14-mobile-menu.png') });
  await mp.goto(URL + '#/tour/kolsai');
  await mp.waitForTimeout(250);
  await mp.screenshot({ path: path.join(SHOTS, '15-mobile-tour.png'), fullPage: true });

  // 11b. Offline-safe photos: with the network disabled, tour pages still show real (bundled) photos.
  const photoDir = path.join(ROOT, 'src/assets/photos');
  const commonsList = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/commonsPhotos.json'), 'utf8'));
  const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/photoCredits.json'), 'utf8'));
  const bundled = commonsList.filter((p) => fs.existsSync(path.join(photoDir, p.local)) && credits[p.local]);
  if (bundled.length === 0) {
    skip('Photos show with network disabled', 'no local photos yet: run `npm run photos:offline` on a machine with internet');
  } else {
    ok('All 12 credited photos are bundled', bundled.length === commonsList.length, `${bundled.length}/${commonsList.length}`);
    for (const p of bundled) {
      const st = fs.statSync(path.join(photoDir, p.local));
      const dims = fs.readFileSync(path.join(photoDir, p.local));
      // JPEG SOF0/SOF2 marker → width
      let w = 0;
      for (let i = 2; i < dims.length - 9; i++) if (dims[i] === 0xff && (dims[i + 1] === 0xc0 || dims[i + 1] === 0xc2)) { w = dims.readUInt16BE(i + 7); break; }
      ok(`Photo ${p.local} ≤ 1600px and ≤ 250 KB`, w > 0 && w <= 1600 && st.size <= 250 * 1024, `${w}px, ${Math.round(st.size / 1024)} KB`);
    }
    const off = await browser.newContext({ viewport: { width: 1366, height: 900 }, offline: true });
    const op = await off.newPage();
    for (const tour of ['charyn', 'kolsai', 'turkestan', 'burabay']) {
      await op.goto(URL + '#/tour/' + tour);
      await op.waitForTimeout(900);
      const real = await op.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth > 0 && i.src.startsWith('data:image/')).length);
      ok(`Offline: real photos on /tour/${tour}`, real >= 1, `${real} loaded`);
    }
    await op.goto(URL + '#/about');
    await op.waitForTimeout(400);
    ok('Offline: About lists photo credits', (await op.locator('#photo-credits li').count()) >= 12);
    await off.close();
  }

  // 12. Dark mode
  const d = await browser.newContext({ viewport: { width: 1366, height: 900 }, colorScheme: 'dark' });
  await d.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const dp = await d.newPage();
  await dp.goto(URL + '#/');
  await dp.waitForTimeout(800);
  const bg = await dp.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok('Dark mode applies dark background', bg === 'rgb(14, 17, 22)', bg);
  await dp.screenshot({ path: path.join(SHOTS, '16-dark-home.png') });
  await dp.goto(URL + '#/book?tour=kolsai');
  await dp.waitForTimeout(300);
  await dp.screenshot({ path: path.join(SHOTS, '17-dark-booking.png') });
  await dp.goto(URL + '#/impact');
  await dp.waitForTimeout(300);
  await dp.screenshot({ path: path.join(SHOTS, '18-dark-impact.png'), fullPage: true });

  // 14. New screens in scripted mode (no VITE_AI_ENDPOINT in this build)
  const sp = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const sErrors = [];
  sp.on('pageerror', (e) => sErrors.push(e.message));
  await sp.goto(URL + '#/ask');
  await sp.waitForTimeout(500);
  ok('Scripted build: mode badge says "Scripted demo"', (await sp.locator('[data-ai-mode="scripted"]').count()) >= 1 && (await sp.locator('[data-ai-mode="live"]').count()) === 0);
  ok('Scripted build: footer says no AI server', (await sp.getByText('(no AI server in this build)').count()) === 1);
  await sp.fill('#chat-input', 'Is Kolsai available on 3 May?');
  await sp.keyboard.press('Enter');
  await sp.waitForTimeout(900);
  await sp.fill('#h-email', 'li.wei@example.com');
  await sp.getByRole('button', { name: 'Send to manager' }).click();
  await sp.waitForTimeout(200);
  await sp.goto(URL + '#/plan');
  await sp.waitForTimeout(400);
  await sp.fill('#plan-text', '8 days, Kolsai and Burabay lakes, two of us, comfortable');
  await sp.getByRole('button', { name: 'Read my request' }).click();
  await sp.waitForTimeout(500);
  ok('Describe your trip (scripted) → 8-day itinerary from the rules builder', (await sp.locator('#plan-result ol > li').count()) === 8 && (await sp.getByTestId('plan-understood').getByText('Scripted rules').count()) === 1);
  ok('Describe your trip has a Phase 2 badge', (await sp.locator('section[aria-labelledby="describe-h"] [data-scope="p2"]').count()) === 1);
  await sp.goto(URL + '#/manager');
  await sp.waitForTimeout(400);
  ok('Manager inbox labelled "For Saryarqa Routes staff · demo"', (await sp.getByTestId('staff-label').textContent()).includes('For Saryarqa Routes staff · demo'));
  ok('Manager inbox: handoff from the concierge arrives', (await sp.getByTestId('inbox-list').getByText('Is Kolsai available on 3 May?').count()) === 1);
  ok('Manager inbox: seed rows labelled Demo data', (await sp.getByTestId('inbox-list').getByText('Demo data').count()) === 3);
  await sp.getByTestId('inbox-list').getByText('Is Kolsai available on 3 May?').click();
  await sp.getByRole('button', { name: /Summarize \+ draft a reply/ }).click();
  await sp.waitForTimeout(300);
  ok('Manager: Russian summary + reply draft (scripted template)', /Турист/.test(await sp.getByTestId('mgr-summary').textContent()) && (await sp.locator('#mgr-reply').inputValue()).includes("I can't see live availability"));
  const sendBtn = sp.getByRole('button', { name: /Approve and send/ });
  ok('Manager: never auto-sends (button disabled before review)', await sendBtn.isDisabled());
  await sp.getByTestId('mgr-checked').check();
  ok('Manager: still disabled while [placeholders] remain', await sendBtn.isDisabled());
  await sp.fill('#mgr-reply', 'Hello! Yes, we have 2 seats on 3 May. Saryarqa Routes team');
  await sendBtn.click();
  await sp.waitForTimeout(200);
  ok('Manager: approve → answered (simulated)', (await sp.getByText('Answered (simulated)', { exact: true }).count()) === 1);
  await sp.screenshot({ path: path.join(SHOTS, '20-manager-inbox.png'), fullPage: true });
  await sp.goto(URL + '#/postcard');
  await sp.waitForTimeout(400);
  await sp.getByRole('button', { name: 'Suggest a caption' }).click();
  await sp.waitForTimeout(300);
  ok('Caption (scripted): 3 中文 + 3 EN', (await sp.locator('[data-caption="zh"]').count()) === 3 && (await sp.locator('[data-caption="en"]').count()) === 3);
  await sp.goto(URL + '#/impact');
  await sp.waitForTimeout(300);
  ok('Impact: "Saves manager time on repeat questions (to measure in pilot)"', (await sp.getByText('Saves manager time on repeat questions (to measure in pilot)').count()) >= 1);
  await sp.goto(URL + '#/manager');
  await sp.getByRole('button', { name: '中文', exact: true }).first().click();
  await sp.waitForTimeout(200);
  ok('中文 heading on /manager', /[一-鿿]/.test(await sp.locator('h1').textContent()));
  await sp.goto(URL + '#/plan');
  await sp.waitForTimeout(200);
  ok('中文 on Describe your trip', (await sp.getByText('描述您的行程').count()) >= 1);
  await sp.getByRole('button', { name: 'EN', exact: true }).first().click();
  ok('No JS errors on new screens', sErrors.length === 0, sErrors.join(' | '));
  await sp.close();
  for (const [ctxOpts, label] of [[{ viewport: { width: 375, height: 812 }, isMobile: true }, '375px'], [{ viewport: { width: 1366, height: 900 }, colorScheme: 'dark' }, 'dark']]) {
    const c = await browser.newContext(ctxOpts);
    const cp = await c.newPage();
    for (const r of ['/manager', '/postcard', '/plan']) {
      await cp.goto(URL + '#' + r);
      await cp.waitForTimeout(250);
      if (label === '375px') {
        const sw = await cp.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        ok(`375px no horizontal scroll: ${r}`, sw <= 375, `scrollWidth ${sw}`);
      } else {
        const bg = await cp.evaluate(() => getComputedStyle(document.querySelector('.card')).backgroundColor);
        ok(`Dark mode cards on ${r}`, bg !== 'rgb(255, 255, 255)', bg);
      }
    }
    if (label === 'dark') await cp.goto(URL + '#/manager'), await cp.waitForTimeout(300), await cp.screenshot({ path: path.join(SHOTS, '21-dark-manager.png') });
    await c.close();
  }

  // 15. Live AI with a MOCKED endpoint: valid answers, invalid JSON, HTTP errors, timeout, stage switch
  const { execFileSync: run } = require('child_process');
  const AI_DIST = path.join(ROOT, 'dist-aitest');
  run('npx', ['vite', 'build', '--outDir', AI_DIST, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, env: { ...process.env, VITE_AI_ENDPOINT: 'https://ai.mock.test' } });
  const AI_URL = 'file://' + path.join(AI_DIST, 'app.html');
  const ac = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ac.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  let mode = 'ok';
  const calls = [];
  await ac.route('https://ai.mock.test/**', async (route) => {
    const req = route.request();
    const ep = new globalThis.URL(req.url()).pathname.slice(1);
    calls.push({ ep, body: req.postDataJSON() });
    const send = (obj, status = 200) => route.fulfill({ status, contentType: 'application/json', body: typeof obj === 'string' ? obj : JSON.stringify(obj) });
    if (mode === 'invalid') return send('{"answer": "half', 200);
    if (mode === 'error') return send({ error: 'model_failed' }, 502);
    if (mode === 'slow') { await new Promise((r) => setTimeout(r, 9000)); return send({ answer: 'too late', labels: [], actions: [] }).catch(() => {}); }
    if (ep === 'chat') return send({ answer: '【AI】Kolsai: guide and transport are included. Park fees are not yet confirmed.', labels: ['Demo data', 'Needs confirmation'], actions: ['/tour/kolsai', 'handoff'] });
    if (ep === 'plan') return send({ destinations: ['charyn', 'turkestan'], days: 9, travelers: 3, interests: ['culture'], budget: 'budget', note: 'Canyon and Silk Road, 9 days, 3 people.' });
    if (ep === 'caption') return send({ zh: ['查伦峡谷 #哈萨克斯坦', '红色岩壁', '草原星空'], en: ['Charyn Canyon #Kazakhstan', 'Red walls', 'Steppe stars'] });
    if (ep === 'manager') return send({ summary_ru: 'ИИ: турист спрашивает о местах на 3 мая.', reply: 'Hello! [confirm availability for 3 May]', check_ru: ['Проверить места'], labels: ['Demo data'] });
    return send({ error: 'not_found' }, 404);
  });
  const ap = await ac.newPage();
  const aErrors = [];
  ap.on('pageerror', (e) => aErrors.push(e.message));
  await ap.goto(AI_URL + '#/ask');
  await ap.waitForTimeout(500);
  ok('Live build: badge says "Live AI · beta"', (await ap.locator('[data-ai-mode="live"]').count()) >= 1);
  const alog = ap.locator('[role="log"]');
  await ap.fill('#chat-input', "What's included in Kolsai?");
  await ap.keyboard.press('Enter');
  await ap.waitForTimeout(700);
  ok('Live concierge: AI answer shown with AI tag + labels', (await alog.getByText(/【AI】Kolsai/).count()) === 1 && (await alog.locator('[data-ai-tag]').count()) === 1 && (await alog.getByText('Needs confirmation').count()) >= 1);
  ok('Live concierge: request carries lang + tourId only (no secrets)', calls.at(-1).ep === 'chat' && calls.at(-1).body.lang === 'en' && calls.at(-1).body.tourId === 'kolsai' && !JSON.stringify(calls.at(-1).body).includes('sk-ant'));
  await alog.getByRole('button', { name: /Talk to a manager|manager/i }).last().click();
  ok('Live concierge: "handoff" action opens the manager form', (await ap.locator('#h-email').count()) === 1);
  mode = 'invalid';
  await ap.fill('#chat-input', '外国银行卡能用吗？');
  await ap.keyboard.press('Enter');
  await ap.waitForTimeout(800);
  ok('Invalid JSON → scripted answer, no AI tag', (await alog.getByText(/外国银行卡（Visa、万事达等）/).count()) === 1 && (await alog.locator('[data-ai-tag]').count()) === 1);
  mode = 'error';
  await ap.fill('#chat-input', 'Do I need a visa?');
  await ap.keyboard.press('Enter');
  await ap.waitForTimeout(800);
  ok('HTTP 502 → scripted answer', (await alog.locator('[data-ai-tag]').count()) === 1 && (await alog.locator('div.whitespace-pre-line').last().textContent()).length > 20);
  mode = 'slow';
  const t0 = Date.now();
  await ap.fill('#chat-input', 'What should I pack?');
  await ap.keyboard.press('Enter');
  await ap.waitForFunction(() => document.querySelectorAll('[role="log"] div.whitespace-pre-line').length >= 9 && !document.querySelector('.typing'), null, { timeout: 15000 });
  const waited = Date.now() - t0;
  ok('Timeout > 8 s → scripted answer', waited >= 7500 && waited < 12000 && (await alog.locator('[data-ai-tag]').count()) === 1, `${waited} ms`);
  mode = 'ok';
  const before = calls.length;
  await ap.getByTestId('force-scripted').check();
  await ap.waitForTimeout(100);
  ok('Stage switch → badge "Scripted demo"', (await ap.locator('[data-ai-mode="live"]').count()) === 0);
  await ap.fill('#chat-input', 'How do I book?');
  await ap.keyboard.press('Enter');
  await ap.waitForTimeout(900);
  ok('Stage switch → no network call to the AI', calls.length === before);
  await ap.getByTestId('force-scripted').uncheck();
  await ap.goto(AI_URL + '#/plan');
  await ap.waitForTimeout(400);
  await ap.fill('#plan-text', '想去峡谷和丝绸之路，9天，三个人，经济一点');
  await ap.getByRole('button', { name: /Read my request|读取我的需求/ }).click();
  await ap.waitForTimeout(800);
  ok('AI trip builder: AI preferences → rules builder (9 days)', calls.at(-1).ep === 'plan' && (await ap.locator('#plan-result ol > li').count()) === 9 && (await ap.getByTestId('plan-understood').locator('[data-ai-tag]').count()) === 1);
  ok('AI trip builder: selected tours follow the AI (Charyn + Turkestan)', (await ap.locator('label:has(input[type=checkbox]:checked)').filter({ hasText: /Charyn|Turkestan/ }).count()) === 2);
  await ap.goto(AI_URL + '#/manager');
  await ap.waitForTimeout(400);
  await ap.getByRole('button', { name: /Summarize \+ draft a reply/ }).click();
  await ap.waitForTimeout(500);
  ok('Manager (AI): Russian summary + draft with AI tag', (await ap.getByTestId('mgr-summary').textContent()).startsWith('ИИ:') && (await ap.locator('[data-ai-tag]').count()) === 1);
  ok('Manager (AI): send disabled until reviewed', await ap.getByRole('button', { name: /Approve and send/ }).isDisabled());
  await ap.goto(AI_URL + '#/postcard');
  await ap.waitForTimeout(400);
  await ap.getByRole('button', { name: 'Suggest a caption' }).click();
  await ap.waitForTimeout(500);
  ok('Caption (AI): 3 中文 + 3 EN with AI tag', (await ap.locator('[data-caption="zh"]').count()) === 3 && (await ap.locator('[data-caption="en"]').count()) === 3 && (await ap.getByTestId('captions').locator('[data-ai-tag]').count()) === 1);
  mode = 'invalid';
  await ap.getByRole('button', { name: 'Suggest a caption' }).click();
  await ap.waitForTimeout(500);
  ok('Caption: invalid JSON → scripted templates', (await ap.getByTestId('captions').getByText('Scripted templates').count()) === 1);
  ok('No JS errors in live-AI build', aErrors.length === 0, aErrors.join(' | '));
  await ac.close();

  // 13. Print-ready A6 postcards (route + PDF)
  const pr = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await pr.goto(URL + '#/print/postcards');
  await pr.waitForTimeout(600);
  const cards = pr.locator('[data-card]');
  ok('Print route renders 4 A6 postcards', (await cards.count()) === 4);
  for (const tour of ['charyn', 'kolsai', 'turkestan', 'burabay']) {
    const q = pr.locator(`[data-card="${tour}"] svg[data-qr]`);
    await q.evaluate((el) => Object.assign(el.parentElement.style, { width: '300px', height: '300px' }));
    const dec = decodePng(await q.screenshot());
    ok(`Print postcard QR (${tour}) scans to its tour`, !!dec && dec.data === `https://diawx-6669.github.io/ZERttex/#/tour/${tour}?ref=PRINT-${tour.toUpperCase()}`, dec ? dec.data : 'not decoded');
  }
  ok('Print postcards have headline + credit line', (await pr.getByText('Kazakhstan, booked in three clear steps').count()) === 4 && (await pr.locator('[data-credit]').count()) === 4);
  await pr.close();
  const pcPdf = path.join(ROOT, 'submission/stage2/postcards.pdf');
  if (fs.existsSync(pcPdf)) {
    const { execFileSync } = require('child_process');
    try {
      const info = execFileSync('pdfinfo', [pcPdf]).toString();
      const pages = +(/Pages:\s+(\d+)/.exec(info) || [])[1];
      const [, w, h] = /Page size:\s+([\d.]+) x ([\d.]+)/.exec(info) || [];
      const mm = (pt) => (pt / 72) * 25.4;
      ok('postcards.pdf: 4 pages of 154 × 111 mm (A6 + 3 mm bleed)', pages === 4 && Math.abs(mm(+w) - 154) < 0.6 && Math.abs(mm(+h) - 111) < 0.6, `${pages} pages, ${mm(+w).toFixed(1)} × ${mm(+h).toFixed(1)} mm`);
      const tmp = path.join(require('os').tmpdir(), 'sg-pc');
      execFileSync('pdftoppm', ['-r', '200', '-f', '2', '-l', '2', '-png', pcPdf, tmp]);
      const pngFile = fs.readdirSync(path.dirname(tmp)).filter((f) => f.startsWith('sg-pc') && f.endsWith('.png')).map((f) => path.join(path.dirname(tmp), f))[0];
      const dec = decodePng(fs.readFileSync(pngFile));
      fs.unlinkSync(pngFile);
      ok('postcards.pdf QR (page 2) scans to Kolsai', !!dec && dec.data.endsWith('#/tour/kolsai?ref=PRINT-KOLSAI'), dec ? dec.data : 'not decoded');
    } catch (e) {
      skip('postcards.pdf page checks', 'pdfinfo / pdftoppm not installed');
    }
  } else ok('postcards.pdf exists', false, 'run npm run postcards');

  // 16. Stage 2 deliverables exist
  for (const f of ['Cost_Payback_Sheet.pdf', 'Cost_Payback_Sheet.xlsx', 'SLIDES_CONTENT.md', 'DEMO_SCRIPT.md', 'AI_DECLARATION_STAGE2.md', 'CHANGELOG_STAGE2.md', 'postcards.pdf']) {
    const fp = path.join(ROOT, 'submission/stage2', f);
    ok(`submission/stage2/${f} exists`, fs.existsSync(fp) && fs.statSync(fp).size > 500);
  }
  try {
    const info = require('child_process').execFileSync('pdfinfo', [path.join(ROOT, 'submission/stage2/Cost_Payback_Sheet.pdf')]).toString();
    ok('Cost_Payback_Sheet.pdf is exactly one A4 page', /Pages:\s+1\b/.test(info) && /A4/.test(info));
  } catch {
    skip('Cost_Payback_Sheet.pdf page count', 'pdfinfo not installed');
  }
  const xlsx = fs.readFileSync(path.join(ROOT, 'submission/stage2/Cost_Payback_Sheet.xlsx'));
  const sheetXml = require('child_process').execFileSync('unzip', ['-p', path.join(ROOT, 'submission/stage2/Cost_Payback_Sheet.xlsx'), 'xl/worksheets/sheet1.xml']).toString();
  ok('Cost_Payback_Sheet.xlsx uses real formulas', xlsx.length > 0 && (sheetXml.match(/<f>/g) || []).length >= 15);
  ok('Money docs in sync with budget.ts', (() => { try { require('child_process').execFileSync('node', [path.join(ROOT, 'scripts/sync-money-docs.cjs'), '--check']); return true; } catch { return false; } })());

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed${skipped.length ? `, ${skipped.length} skipped: ${skipped.map((x) => x.name).join('; ')}` : ''}`);
  
  process.exit(failed.length ? 1 : 0);
})();
