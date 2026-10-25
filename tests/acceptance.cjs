// End-to-end check of the acceptance checklist against dist/index.html.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'dist/index.html');
const SHOTS = path.join(ROOT, 'screenshots');
const PHOTO = path.join(__dirname, 'fixtures/photo.png');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (name, cond, info = '') => {
  results.push({ name, pass: !!cond, info });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  // Block Google Fonts so the test is offline-deterministic.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts|ERR_FAILED/.test(m.text()) && errors.push(m.text()));

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
  await page.locator('a[href="#/tour/kolsai"]').filter({ hasText: 'View tour' }).click();
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
  ok('Copy referral link works', clip.includes('go.saryarqa.example/r/'), clip);
  ok('QR labelled not scannable', (await page.getByText(/not scannable/).count()) >= 1);
  await shot('07-postcard');
  await page.getByRole('button', { name: /See what your friend sees/ }).click();
  await page.waitForTimeout(300);
  ok('Postcard leads back to DISCOVER with referral banner', (await page.getByText(/A friend sent you this postcard/).count()) === 1);

  // 8. Impact
  await go('/impact');
  ok('Budget total exactly 20,000,000', (await page.getByTestId('budget-total').textContent()) === '20,000,000');
  ok('Default payback base = Month 32', (await page.getByText('Month 32').count()) >= 1);
  ok('Default payback downside = Month 44', (await page.getByText('Month 44').count()) >= 1);
  ok('Break-even travelers 1,516', (await page.getByText('1,516').count()) >= 1);
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

  // 12. Dark mode
  const d = await browser.newContext({ viewport: { width: 1366, height: 900 }, colorScheme: 'dark' });
  await d.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const dp = await d.newPage();
  await dp.goto(URL + '#/');
  await dp.waitForTimeout(800);
  const bg = await dp.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok('Dark mode applies dark background', bg === 'rgb(11, 18, 33)', bg);
  await dp.screenshot({ path: path.join(SHOTS, '16-dark-home.png') });
  await dp.goto(URL + '#/book?tour=kolsai');
  await dp.waitForTimeout(300);
  await dp.screenshot({ path: path.join(SHOTS, '17-dark-booking.png') });
  await dp.goto(URL + '#/impact');
  await dp.waitForTimeout(300);
  await dp.screenshot({ path: path.join(SHOTS, '18-dark-impact.png'), fullPage: true });

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  
  process.exit(failed.length ? 1 : 0);
})();
