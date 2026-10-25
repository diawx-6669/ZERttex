import type { Lang } from '../data/types';

export const RATE_USD = 500; // Demo rate: 1 USD = 500 KZT
export const RATE_CNY = 70; // Demo rate: 1 CNY = 70 KZT

export const kzt = (n: number) => `${Math.round(n).toLocaleString('en-US')} KZT`;
export const num = (n: number) => Math.round(n).toLocaleString('en-US');
export const usd = (n: number) => `≈ $${Math.round(n / RATE_USD).toLocaleString('en-US')}`;
export const cny = (n: number) => `≈ ¥${Math.round(n / RATE_CNY).toLocaleString('en-US')}`;
export const indicative = (n: number, lang: Lang) => (lang === 'zh' ? cny(n) : usd(n));

export const millions = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

export const fmtDate = (iso: string, lang: Lang) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
};

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const bookingCode = () =>
  'SG-' + Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
