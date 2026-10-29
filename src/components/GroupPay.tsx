import { useEffect, useState } from 'react';
import { copyText, kzt } from '../lib/format';
import { SITE_URL } from '../lib/qr';
import { useApp, type Booking } from '../state';
import { Icon } from './Icon';
import { QR } from './QR';
import { Tag } from './Tag';

// Group booking with split payment: one person books, each traveler pays their own share
// with their own card or wallet. Seats are held for 48 hours; if a share is still open,
// the organizer can pay it or free the seat. Test mode: shares are marked paid on this device.

const store = (code: string) => `sg.split.${code}`;
const readPaid = (code: string, n: number): boolean[] => {
  try {
    const v = JSON.parse(window.localStorage.getItem(store(code)) ?? 'null');
    if (Array.isArray(v) && v.length === n) return v.map(Boolean);
  } catch {
    /* ignore */
  }
  return Array.from({ length: n }, (_, i) => i === 0);
};

export function GroupPay({ booking }: { booking: Booking }) {
  const { t, toast } = useApp();
  const n = booking.travelers;
  const share = Math.round(booking.total / n);
  const [paid, setPaid] = useState<boolean[]>(() => readPaid(booking.code, n));
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    try {
      window.localStorage.setItem(store(booking.code), JSON.stringify(paid));
    } catch {
      /* ignore */
    }
  }, [paid, booking.code]);
  const count = paid.filter(Boolean).length;
  const link = (i: number) => `${SITE_URL}#/book?pay=${booking.code}-${i + 1}`;

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="gp-h" data-testid="group-pay">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="gp-h" className="text-xl font-bold">{t({ en: 'Group payment', zh: '团体分开付款' })}</h2>
        <span className={`num rounded-[8px] border-2 border-edge px-2 py-0.5 text-sm font-bold ${count === n ? 'bg-ok text-white' : 'bg-sun text-sunInk'}`} data-testid="gp-count">
          {count}/{n} {t({ en: 'paid', zh: '已付' })}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {t({ en: `Each traveler pays ${kzt(share)} with their own card or wallet. Seats are held for 48 hours.`, zh: `每人用自己的银行卡或钱包支付 ${kzt(share)}。名额保留 48 小时。` })}
      </p>
      <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-edge bg-surface2" aria-hidden>
        <div className="h-full bg-ok transition-all" style={{ width: `${(count / n) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {paid.map((p, i) => (
          <li key={i} className="rounded-[12px] border-2 border-edge p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                <span className={`grid h-7 w-7 place-items-center rounded-full border-2 border-edge text-xs ${p ? 'bg-ok text-white' : 'bg-surface'}`}>{p ? <Icon name="check" size={13} /> : i + 1}</span>
                {i === 0 ? t({ en: 'You (organizer)', zh: '您（发起人）' }) : t({ en: `Traveler ${i + 1}`, zh: `旅客 ${i + 1}` })}
                <span className="num text-sm text-muted">{kzt(share)}</span>
              </span>
              {p ? (
                <span className="text-sm font-semibold text-ok">{t({ en: 'Paid', zh: '已支付' })}</span>
              ) : (
                <span className="flex flex-wrap gap-1.5">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(open === i ? null : i)}>
                    <Icon name="share" size={14} /> {t({ en: 'Send pay link', zh: '发送付款链接' })}
                  </button>
                  <button type="button" className="btn-primary btn-sm" onClick={() => (setPaid(paid.map((x, j) => (j === i ? true : x))), toast(t({ en: 'Share paid (test mode)', zh: '已支付（测试模式）' })))} data-testid={`gp-pay-${i}`}>
                    {t({ en: 'Simulate paid', zh: '模拟已付' })}
                  </button>
                </span>
              )}
            </div>
            {open === i && !p && (
              <div className="rise mt-3 flex flex-wrap items-center gap-3">
                <div className="w-28 rounded-[8px] border-2 border-edge bg-white p-1">
                  <QR text={link(i)} label={t({ en: 'Pay link QR', zh: '付款链接二维码' })} />
                </div>
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p>{t({ en: 'Scan in WeChat or send the link. They pay only their share.', zh: '在微信中扫码或发送链接，对方只支付自己的份额。' })}</p>
                  <button type="button" className="btn-ghost btn-sm" onClick={async () => toast((await copyText(link(i))) ? t({ en: 'Link copied', zh: '链接已复制' }) : link(i))}>
                    <Icon name="copy" size={14} /> {t({ en: 'Copy pay link', zh: '复制付款链接' })}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        {t({ en: 'If a share is still open after 48 h, you can pay it or free the seat.', zh: '48 小时后仍有未付份额时，您可代付或释放名额。' })} <Tag kind="proposal" /> <Tag kind="demo" extra="TEST MODE" />
      </p>
    </section>
  );
}
