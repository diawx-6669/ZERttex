import { Icon } from '../components/Icon';
import { Media } from '../components/Media';
import { QR } from '../components/QR';
import { Scope, Tag } from '../components/Tag';
import { tourById } from '../data/tours';
import type { TourId } from '../data/types';
import { fmtDate } from '../lib/format';
import { SITE_URL } from '../lib/qr';
import { href } from '../lib/router';
import { addDays, toIso } from '../lib/tripBuilder';
import { useApp } from '../state';

// Trip Pass for the family (#/pass/<data>): where the traveler is and what comes next.
// No server and no account: the link itself carries only what the traveler chose to share
// (first name, booking code, tour, start date, current step), so it opens in WeChat on
// any phone. The real version adds live check-ins from the guide; here they are simulated.

export type PassData = { n: string; c: string; t: TourId; d: string; s: number };

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export const passUrl = (p: PassData) => `${SITE_URL}#/pass/${b64(JSON.stringify(p))}`;
export function readPass(raw?: string): PassData | null {
  try {
    const p = JSON.parse(unb64(raw ?? '')) as PassData;
    return p && typeof p.n === 'string' && tourById(p.t) && /^\d{4}-\d{2}-\d{2}$/.test(p.d) ? { ...p, n: p.n.slice(0, 24), c: String(p.c).slice(0, 12), s: Number(p.s) || 0 } : null;
  } catch {
    return null;
  }
}

export default function Pass({ raw }: { raw?: string }) {
  const { t, lang } = useApp();
  const p = readPass(raw);
  if (!p)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-3xl font-black">{t({ en: 'This Trip Pass link is not valid', zh: '此行程通行证链接无效' })}</h1>
        <p className="mt-2 text-muted">{t({ en: 'Ask the traveler to send it again from “My trip”.', zh: '请让旅客从「我的行程」重新发送。' })}</p>
      </div>
    );
  const tour = tourById(p.t)!;
  // Steps: 0 booked · 1 briefing · 2 met guide · 3..(2+days) day check-ins · last: back home.
  const days = tour.days;
  const last = days + 3;
  const today = toIso(new Date());
  const byDate = today < p.d ? 0 : today > addDays(p.d, days - 1) ? last : 3 + Math.round((new Date(today).getTime() - new Date(p.d).getTime()) / 864e5);
  const step = Math.min(last, Math.max(p.s, byDate));
  const dayNow = step >= 3 && step < last ? step - 2 : 0;
  const status =
    step === last
      ? { tone: 'bg-ok', text: { en: 'Back in the start city. The trip is over and sharing has ended.', zh: '已返回出发城市，行程结束，分享已停止。' } }
      : dayNow
        ? { tone: 'bg-ok', text: { en: `Day ${dayNow} of ${days} · checked in at 19:10 · all OK`, zh: `第 ${dayNow}/${days} 天 · 19:10 已报平安 · 一切正常` } }
        : { tone: 'bg-sun', text: { en: `Trip starts on ${fmtDate(p.d, 'en')}`, zh: `行程将于 ${fmtDate(p.d, 'zh')} 开始` } };

  return (
    <div className="container-x max-w-3xl pt-8" data-testid="trip-pass">
      <div className="flex flex-wrap items-center gap-2">
        <span className="sticker !bg-sun">Trip Pass · 行程通行证</span>
        <Scope phase="p2" />
        <Tag kind="demo" extra={t({ en: 'check-ins simulated', zh: '报平安为模拟' })} />
      </div>
      <h1 className="mt-4 text-4xl font-black sm:text-5xl">{t({ en: `${p.n} in Kazakhstan`, zh: `${p.n} 在哈萨克斯坦` })}</h1>

      <div className="card mt-6 overflow-hidden">
        <div className="h-40 border-b-2 border-edge sm:h-52"><Media tour={tour.id} credit={false} /></div>
        <div className="p-5">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted">{p.c}</div>
          <div className="text-2xl font-bold">{t(tour.name)}</div>
          <div className="text-sm text-muted">{fmtDate(p.d, lang)} · {days} {t({ en: 'days', zh: '天' })} · {t(tour.region)}</div>
          <div className="mt-4 flex items-center gap-2 rounded-[12px] border-2 border-edge bg-surface2 p-3 font-semibold" data-testid="pass-status">
            <span className={`h-3 w-3 shrink-0 rounded-full border-2 border-edge ${status.tone}`} /> {t(status.text)}
          </div>
        </div>
      </div>

      <section className="card mt-6 p-5" aria-labelledby="pass-plan">
        <h2 id="pass-plan" className="text-xl font-bold">{t({ en: 'The plan, day by day', zh: '每日行程' })}</h2>
        <ol className="mt-3 space-y-2">
          {tour.itinerary.map((d, i) => {
            const st = dayNow ? (i + 1 < dayNow ? 'done' : i + 1 === dayNow ? 'now' : 'next') : step === last ? 'done' : 'next';
            return (
              <li key={i} className={`rounded-[12px] border-2 p-3 ${st === 'now' ? 'border-edge bg-sun/50' : 'border-edge/25'}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {st === 'done' ? <Icon name="check" size={15} className="text-ok" /> : st === 'now' ? <Icon name="pin" size={15} /> : <Icon name="clock" size={15} className="text-muted" />}
                  {t(d.title)} <span className="text-xs font-normal text-muted">· {fmtDate(addDays(p.d, i), lang)}</span>
                </div>
                <ul className="mt-1 list-disc pl-8 text-sm text-muted">
                  {d.items.slice(0, 3).map((x, j) => <li key={j}>{t(x)}</li>)}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">{t({ en: 'If you are worried', zh: '如果您担心' })}</h2>
          <p>{t({ en: 'Message the Saryarqa Routes manager in Chinese or English. In an emergency in Kazakhstan, call 112.', zh: '可用中文或英文联系 Saryarqa Routes 经理。在哈萨克斯坦遇到紧急情况请拨打 112。' })}</p>
          <a href={href('/ask')} className="btn-primary btn-sm mt-3"><Icon name="chat" size={14} /> {t({ en: 'Message the company', zh: '联系公司' })}</a>
        </div>
        <div className="card flex items-center gap-4 p-5 text-sm">
          <div className="w-28 shrink-0 rounded-[8px] border-2 border-edge bg-white p-1"><QR text={passUrl(p)} label="Trip Pass QR" /></div>
          <p>{t({ en: 'Scan in WeChat to open this pass on another phone.', zh: '在微信中扫码，在其他手机上打开此通行证。' })}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">{t({ en: 'Shared by the traveler: first name, tour and dates only. No location tracking, no phone number, no passport.', zh: '由旅客主动分享：仅名字、线路和日期。不追踪位置，不含电话号码和护照信息。' })}</p>
    </div>
  );
}
