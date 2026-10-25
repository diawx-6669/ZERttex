const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs/img') + '/';
const URL = 'file://' + path.join(ROOT, 'dist/index.html') + '#';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/fonts\./, r => r.abort());
  await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.fab{display:none!important}'; document.head.appendChild(st); }));
  const p = await ctx.newPage();
  const go = async (h) => { await p.goto(URL + h); await p.waitForTimeout(700); };
  const el = async (loc, name) => { await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await loc.screenshot({ path: OUT + name + '.png' }); };

  await go('/'); await p.screenshot({ path: OUT + 'hero.png' });
  await el(p.locator('section').filter({ hasText: 'One closed loop' }).first(), 'loop');
  await el(p.locator('section').filter({ hasText: 'Four complaints, four answers' }).first(), 'complaints');
  await el(p.locator('section').filter({ hasText: 'Where the trips go' }).first(), 'map');

  await go('/tour/kolsai');
  await p.getByRole('button', { name: 'Open all' }).click();
  await el(p.locator('#inc'), 'inclusions');
  await el(p.locator('#audio'), 'audio');

  await go('/plan');
  await p.locator('label').filter({ hasText: 'Burabay Lakes & Granite' }).click();
  await p.locator('#len').fill('8');
  await p.getByRole('button', { name: /Build my itinerary/ }).click(); await p.waitForTimeout(400);
  await p.locator('#plan-result').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -90)); await p.waitForTimeout(300); await p.screenshot({ path: OUT + 'plan.png' });
  await p.getByRole('button', { name: /Book these tours/ }).click(); await p.waitForTimeout(400);
  await p.getByRole('button', { name: /^Continue/ }).click();
  await p.fill('#name', 'Li Wei'); await p.fill('#email', 'li.wei@example.com'); await p.selectOption('#country', 'CN');
  await p.locator('label').filter({ hasText: /^中文/ }).click();
  await p.getByRole('button', { name: /^Continue/ }).click(); await p.waitForTimeout(200);
  await p.locator('label').filter({ hasText: 'International card' }).click();
  await p.locator('label').filter({ hasText: 'I have read what is included' }).click();
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + 'booking.png' });
  await p.getByRole('button', { name: /Pay \(test mode\)/ }).click(); await p.waitForTimeout(1700);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + 'confirmed.png' });

  await go('/trust'); await p.getByRole('button', { name: /Play intro/ }).click(); await p.waitForTimeout(4500);
  await p.screenshot({ path: OUT + 'trust.png' });

  await go('/trip');
  await p.getByRole('switch').click();
  await p.getByRole('radio', { name: /Road closure/ }).click();
  await p.locator('label.chip').first().click();
  for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /Advance demo time/ }).click();
  await p.evaluate(() => window.scrollTo(0, 260)); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + 'trip.png' });

  await go('/postcard');
  await p.fill('#pc-name', 'Li Wei'); await p.fill('#pc-msg', 'Kaindy was unreal!');
  await el(p.getByTestId('postcard'), 'postcard');

  await go('/impact');
  await el(p.locator('section').filter({ hasText: 'Payback model' }).first(), 'payback');
  await el(p.locator('section').filter({ hasText: '12-week MVP plan' }).first(), 'gantt');

  await go('/');
  await p.getByRole('button', { name: '中文', exact: true }).first().click(); await p.waitForTimeout(300);
  await go('/tour/turkestan'); await p.evaluate(() => window.scrollTo(0, 0));
  await p.getByRole('button', { name: /提问/ }).first().click(); await p.waitForTimeout(1300);
  await p.screenshot({ path: OUT + 'chat-zh.png' });
  await p.keyboard.press('Escape');
  await p.getByRole('button', { name: 'EN', exact: true }).first().click();

  const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await m.route(/fonts\./, r => r.abort());
  const mp = await m.newPage();
  await mp.goto(URL + '/'); await mp.waitForTimeout(700); await mp.screenshot({ path: OUT + 'm-home.png' });
  await mp.goto(URL + '/tour/kolsai'); await mp.waitForTimeout(700); await mp.screenshot({ path: OUT + 'm-tour.png' });
  await mp.goto(URL + '/tours'); await mp.waitForTimeout(500);
  await mp.getByRole('navigation', { name: 'Quick' }).getByRole('button', { name: /Ask/ }).click(); await mp.waitForTimeout(300);
  await mp.locator('#chat-input').fill('需要签证吗？'); await mp.keyboard.press('Enter'); await mp.waitForTimeout(900);
  await mp.screenshot({ path: OUT + 'm-chat.png' });
  await b.close();
})();
