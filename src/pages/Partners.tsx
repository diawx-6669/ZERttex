import { useMemo, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { PageHead, Section } from '../components/Layout';
import { Scope, Tag } from '../components/Tag';
import { budget, budgetConfig } from '../data/budget';
import type { L } from '../data/types';
import { kzt, num } from '../lib/format';
import { SITE_URL, drawQr } from '../lib/qr';
import { href } from '../lib/router';
import { useApp } from '../state';
import { QR } from './Postcard';

// Partner page for hostels and hotels: a QR card at reception, a share of every booking.
// The commission is a team proposal; guest counts in the calculator are demo inputs.

/** Proposal: share of the tour price paid to the partner for each traveler who books via their QR. */
const COMMISSION = 0.05;
const AVG_PRICE = budgetConfig.model.avgPrice;
const PER_TRAVELER = AVG_PRICE * COMMISSION;
const cardLine = budget.find((b) => b.item.startsWith('Printed postcards'))!;

const cities: { id: string; name: L }[] = [
  { id: 'almaty', name: { en: 'Almaty', zh: '阿拉木图' } },
  { id: 'astana', name: { en: 'Astana', zh: '阿斯塔纳' } },
  { id: 'turkestan', name: { en: 'Turkestan', zh: '突厥斯坦' } },
  { id: 'other', name: { en: 'Other city', zh: '其他城市' } },
];

/** Stable partner code from the name: letters of the name + 3 digits, e.g. "NOMAD-417". */
const partnerCode = (name: string) => {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'HOSTEL';
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  return `${base}-${String(h).padStart(3, '0')}`;
};
const partnerUrl = (code: string) => `${SITE_URL}#/?partner=${encodeURIComponent(code)}`;

/** A6 reception card (1240 × 1748 px, 300 dpi) as PNG. */
function downloadCard(name: string, city: string, code: string) {
  const W = 1240;
  const H = 1748;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const sans = '"Instrument Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillStyle = '#fcfcfd';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0b6f8c';
  ctx.fillRect(0, 0, W, 300);
  ctx.fillStyle = '#f2b33d';
  ctx.beginPath();
  ctx.arc(130, 150, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 84px ${sans}`;
  ctx.fillText('Saryarqa Go', 210, 180);
  ctx.fillStyle = '#16191f';
  ctx.textAlign = 'center';
  ctx.font = `800 76px ${sans}`;
  ctx.fillText('Tours across Kazakhstan', W / 2, 430);
  ctx.font = `700 64px ${sans}`;
  ctx.fillText('哈萨克斯坦精品线路', W / 2, 520);
  ctx.fillStyle = '#585e68';
  ctx.font = `500 40px ${sans}`;
  ctx.fillText('Book in English or 中文 · pay with a foreign card', W / 2, 600);
  drawQr(ctx, partnerUrl(code), (W - 760) / 2, 660, 760, 3);
  ctx.fillStyle = '#16191f';
  ctx.font = `700 48px ${sans}`;
  ctx.fillText('Scan to see tours · 扫码查看线路', W / 2, 1500);
  ctx.fillStyle = '#585e68';
  ctx.font = `500 38px ${sans}`;
  ctx.fillText(`Recommended by ${name || 'your hostel'}${city ? ', ' + city : ''}`, W / 2, 1590);
  ctx.font = `500 30px "JetBrains Mono", ui-monospace, monospace`;
  ctx.fillText(`Partner code ${code}`, W / 2, 1660);
  const a = document.createElement('a');
  a.download = `saryarqa-go-qr-card-${code}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
}

export default function Partners() {
  const { t, toast } = useApp();
  const [name, setName] = useState('Nomad Hostel');
  const [city, setCity] = useState('almaty');
  const [guests, setGuests] = useState(150);
  const [share, setShare] = useState(3);
  const code = useMemo(() => partnerCode(name.trim()), [name]);
  const cityName = t(cities.find((x) => x.id === city)!.name);
  const travelers = Math.round((guests * share) / 100);

  const steps: { icon: IconName; h: L; p: L }[] = [
    { icon: 'image', h: { en: 'Put the QR card at reception', zh: '把二维码卡放在前台' }, p: { en: 'We print and bring A6 cards with your own QR code. Free for you.', zh: '我们免费印制并送来带有您专属二维码的 A6 卡片。' } },
    { icon: 'phone', h: { en: 'Your guest scans and books', zh: '客人扫码并预订' }, p: { en: 'Tours in English and 中文, clear prices, foreign cards. The guest pays the same price as on the site.', zh: '英文和中文线路、价格清楚、可用外国银行卡。客人价格与网站相同。' } },
    { icon: 'card', h: { en: 'You earn for every traveler', zh: '每位旅客都有佣金' }, p: { en: `${COMMISSION * 100}% of the tour price for each traveler who books with your code, paid monthly.`, zh: `通过您的代码预订的每位旅客，按线路价格的 ${COMMISSION * 100}% 支付佣金，按月结算。` } },
  ];

  return (
    <>
      <PageHead
        eyebrow={<>{t({ en: 'For hostels and hotels', zh: '面向青旅和酒店' })} <Tag kind="proposal" /></>}
        title={t({ en: 'Partner with Saryarqa Go', zh: '成为 Saryarqa Go 合作伙伴' })}
        sub={t({
          en: 'Your foreign guests ask “what can I see in Kazakhstan?”. Give them one QR card, and earn a share of every tour they book.',
          zh: '外国客人常问“在哈萨克斯坦能去哪儿？”。放一张二维码卡，客人每预订一次线路，您都能获得佣金。',
        })}
      >
        <Scope phase="mvp" />
      </PageHead>

      <section className="container-x mt-8" aria-label={t({ en: 'How it works', zh: '合作方式' })}>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="card flex gap-3 p-5">
              <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/15 font-semibold text-teal">{i + 1}</span>
              <div>
                <h2 className="flex items-center gap-2 font-bold"><Icon name={s.icon} size={17} className="text-teal" /> {t(s.h)}</h2>
                <p className="mt-1 text-sm text-muted">{t(s.p)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Section title={t({ en: 'The offer', zh: '合作条件' })}>
        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="card p-6" data-testid="partner-offer">
            <div className="num font-display text-6xl font-extrabold text-teal">{COMMISSION * 100}%</div>
            <p className="mt-2 text-lg font-semibold">{t({ en: 'of the tour price for every traveler who books with your QR code', zh: '通过您的二维码预订的每位旅客，按线路价格支付' })}</p>
            <p className="mt-1 text-muted">
              {t({ en: 'On an average tour of', zh: '以平均线路价格' })} <span className="num">{kzt(AVG_PRICE)}</span> {t({ en: 'that is', zh: '计算，即' })} <strong className="num text-ink">{kzt(PER_TRAVELER)}</strong> {t({ en: 'per traveler.', zh: '每位旅客。' })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2"><Tag kind="proposal" extra={t({ en: 'to agree with Saryarqa Routes', zh: '待与公司确认' })} /></div>
          </div>
          <ul className="card space-y-2.5 p-6 text-sm">
            {[
              { en: 'No cost for you: cards are printed and delivered by us.', zh: '您无需任何费用：卡片由我们印制并送达。' },
              { en: 'Same price for your guest. The share is paid from our margin.', zh: '客人价格不变，佣金从我们的利润中支付。' },
              { en: 'Monthly statement: bookings made with your code, and the amount.', zh: '每月对账：您的代码带来的预订和佣金金额。' },
              { en: 'Paid only for completed trips. Cancelled and refunded bookings do not count.', zh: '仅对已完成的行程付款，取消或退款的预订不计入。' },
              { en: 'Stop any time: just take the card off the desk.', zh: '随时可以停止：把卡片收起来即可。' },
            ].map((x, i) => (
              <li key={i} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-teal" />{t(x)}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title={t({ en: 'Your QR card', zh: '您的二维码卡' })} sub={t({ en: 'Type your hostel or hotel name. The card and its QR code update live; the code is real and scannable.', zh: '输入您的青旅或酒店名称，卡片和二维码实时更新，二维码可真实扫描。' })}>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card space-y-5 p-5 sm:p-6">
            <div>
              <label className="label" htmlFor="p-name">{t({ en: 'Hostel or hotel name', zh: '青旅或酒店名称' })}</label>
              <input id="p-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="p-city">{t({ en: 'City', zh: '城市' })}</label>
              <select id="p-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{t(c.name)}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-surface2/70 p-3 text-sm">
              <div className="text-muted">{t({ en: 'Your partner code', zh: '您的合作代码' })}</div>
              <div className="num text-lg font-semibold" data-testid="partner-code">{code}</div>
              <div className="mt-1 break-all font-mono text-xs text-muted">{partnerUrl(code)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => downloadCard(name.trim(), cityName, code)}>
                <Icon name="image" /> {t({ en: 'Download card (PNG, A6)', zh: '下载卡片（PNG，A6）' })}
              </button>
              <button type="button" className="btn-ghost" onClick={() => toast(t({ en: 'Request saved. A manager would call you within 1 working day (demo).', zh: '申请已保存。经理将在 1 个工作日内联系您（演示）。' }))}>
                <Icon name="mail" /> {t({ en: 'Request printed cards', zh: '申请印刷卡片' })}
              </button>
            </div>
            <p className="text-xs text-muted">
              {t({ en: 'Printing is already in the Phase 1 budget:', zh: '印刷费用已列入第一阶段预算：' })} “{cardLine.item}”, <span className="num">{kzt(cardLine.amount)}</span>. <Tag kind="proposal" />
            </p>
          </div>

          <div className="mx-auto w-full max-w-[380px]">
            <div className="overflow-hidden rounded-2xl border border-line bg-white text-[#16191f] shadow-card" style={{ aspectRatio: '105 / 148' }} data-testid="partner-card">
              <div className="flex items-center gap-2 bg-[#0b6f8c] px-5 py-4 text-white">
                <span className="h-5 w-5 rounded-full bg-[#f2b33d]" aria-hidden />
                <span className="font-display text-xl font-bold">Saryarqa Go</span>
              </div>
              <div className="px-5 pt-4 text-center">
                <div className="font-display text-xl font-extrabold leading-tight">Tours across Kazakhstan</div>
                <div className="mt-0.5 text-lg font-bold">哈萨克斯坦精品线路</div>
                <div className="mt-1 text-xs text-[#585e68]">Book in English or 中文 · pay with a foreign card</div>
                <div className="mx-auto mt-3 w-[62%]">
                  <QR text={partnerUrl(code)} label={t({ en: 'QR code with your partner link', zh: '带有合作链接的二维码' })} />
                </div>
                <div className="mt-2 text-sm font-bold">Scan to see tours · 扫码查看线路</div>
                <div className="mt-1 text-xs text-[#585e68]">Recommended by {name.trim() || 'your hostel'}, {cityName}</div>
                <div className="mt-0.5 font-mono text-[10px] text-[#585e68]">{code}</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t({ en: 'What it could earn you', zh: '预计收入' })} sub={t({ en: 'Move the sliders with your own numbers.', zh: '用您自己的数字调整滑块。' })}>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="card space-y-6 p-5">
            <div>
              <label className="flex justify-between text-sm font-semibold" htmlFor="p-guests">
                {t({ en: 'Foreign guests per month', zh: '每月外国客人数' })} <span className="num">{guests}</span>
              </label>
              <input id="p-guests" type="range" min={20} max={600} step={10} value={guests} onChange={(e) => setGuests(+e.target.value)} className="mt-2 w-full accent-[rgb(var(--teal))]" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-semibold" htmlFor="p-share">
                {t({ en: 'Of them book a tour via the card', zh: '其中通过卡片预订线路的比例' })} <span className="num">{share}%</span>
              </label>
              <input id="p-share" type="range" min={1} max={10} value={share} onChange={(e) => setShare(+e.target.value)} className="mt-2 w-full accent-[rgb(var(--teal))]" />
            </div>
            <Tag kind="demo" extra={t({ en: 'example inputs', zh: '示例数据' })} />
          </div>
          <div className="card grid grid-cols-2 gap-4 p-5" aria-live="polite">
            <div>
              <div className="text-xs text-muted">{t({ en: 'Travelers per month', zh: '每月旅客' })}</div>
              <div className="num mt-1 text-3xl font-semibold">{num(travelers)}</div>
            </div>
            <div>
              <div className="text-xs text-muted">{t({ en: 'Your share per month', zh: '每月佣金' })}</div>
              <div className="num mt-1 text-3xl font-semibold text-teal" data-testid="partner-month">{kzt(travelers * PER_TRAVELER)}</div>
            </div>
            <div className="col-span-2 border-t border-line pt-3 text-sm text-muted">
              {t({ en: 'Per year:', zh: '每年：' })} <span className="num font-semibold text-ink">{kzt(travelers * PER_TRAVELER * 12)}</span> · {t({ en: 'based on an average tour of', zh: '按平均线路价格' })} <span className="num">{kzt(AVG_PRICE)}</span>
            </div>
          </div>
        </div>
      </Section>

      <section className="container-x mt-16" data-reveal>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-teal/10 p-6 sm:p-8">
          <p className="max-w-[52ch] text-lg font-semibold">
            {t({ en: 'Want to see what your guests will see? Open the tours as a traveler.', zh: '想看看客人会看到什么？以旅客身份浏览线路。' })}
          </p>
          <a href={href('/tours')} className="btn-primary">{t({ en: 'See the tours', zh: '查看线路' })} <Icon name="arrow" /></a>
        </div>
      </section>
    </>
  );
}
