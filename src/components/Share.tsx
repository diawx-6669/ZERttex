import { useEffect, useState } from 'react';
import { copyText } from '../lib/format';
import { useApp } from '../state';
import { Icon } from './Icon';
import { QR } from './QR';
import { Scope, Tag } from './Tag';

// Sharing where Chinese travelers already are. What works today, with no account:
//  • WeChat: a QR code of the link (scan from WeChat on the phone), or, inside WeChat's
//    own browser, the "···" menu (we show where to tap). Opening WeChat by link (weixin://).
//  • Xiaohongshu: no web share API exists, so: copy a ready caption with the link,
//    save the image, open the app (xhsdiscover://) and paste.
// Signing in with WeChat and a Mini Program need a WeChat Open Platform account for the
// company: shown as Phase 2.

export const inWeChat = () => typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);
const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function ShareSheet({ url, title, caption, onSaveImage, className = '' }: { url: string; title: string; caption: string; onSaveImage?: () => void; className?: string }) {
  const { t, toast } = useApp();
  const [tab, setTab] = useState<'wechat' | 'xhs'>('wechat');
  const [overlay, setOverlay] = useState(false);
  const copy = async (text: string, msg: string) => toast((await copyText(text)) ? msg : text);
  const xhsText = `${caption}\n${url}`;

  return (
    <div className={`card overflow-hidden ${className}`} data-testid="share-sheet">
      <div className="flex border-b-2 border-edge" role="tablist" aria-label={t({ en: 'Share to', zh: '分享到' })}>
        {(
          [
            { id: 'wechat', label: '微信 WeChat', dot: 'bg-[#07c160]' },
            { id: 'xhs', label: '小红书 Xiaohongshu', dot: 'bg-[#ff2442]' },
          ] as const
        ).map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold ${tab === x.id ? 'bg-sun text-sunInk' : 'text-muted hover:text-ink'} ${x.id === 'xhs' ? 'border-l-2 border-edge' : ''}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${x.dot}`} aria-hidden /> {x.label}
          </button>
        ))}
      </div>

      {tab === 'wechat' ? (
        <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr] sm:items-center">
          <div className="mx-auto w-[132px] rounded-[10px] border-2 border-edge bg-white p-1.5">
            <QR text={url} label={t({ en: `QR code for ${title}`, zh: `${title} 的二维码` })} />
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{t({ en: 'Open WeChat → Scan, then send to a chat or Moments.', zh: '打开微信 → 扫一扫，发送给朋友或朋友圈。' })}</p>
            <div className="flex flex-wrap gap-2">
              {inWeChat() ? (
                <button type="button" className="btn-primary btn-sm" onClick={() => setOverlay(true)}>
                  <Icon name="share" size={14} /> {t({ en: 'Share in WeChat', zh: '在微信中分享' })}
                </button>
              ) : (
                isMobile() && (
                  <a className="btn-primary btn-sm" href="weixin://" onClick={() => copyText(url)}>
                    <Icon name="chat" size={14} /> {t({ en: 'Copy link & open WeChat', zh: '复制链接并打开微信' })}
                  </a>
                )
              )}
              <button type="button" className="btn-ghost btn-sm" onClick={() => copy(url, t({ en: 'Link copied', zh: '链接已复制' }))}>
                <Icon name="copy" size={14} /> {t({ en: 'Copy for WeChat', zh: '复制到微信' })}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4 text-sm">
          <ol className="space-y-1.5">
            {[
              { en: 'Copy the caption (the link is inside).', zh: '复制文案（已含链接）。' },
              { en: 'Save the picture.', zh: '保存图片。' },
              { en: 'Open Xiaohongshu → + → choose the picture → paste.', zh: '打开小红书 → + → 选择图片 → 粘贴文案。' },
            ].map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-edge text-[10px] font-bold">{i + 1}</span>
                {t(s)}
              </li>
            ))}
          </ol>
          <p className="whitespace-pre-line rounded-[10px] border-2 border-dashed border-edge/40 bg-surface2 p-2.5 text-[13px]" lang="zh-CN">{xhsText}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary btn-sm" onClick={() => copy(xhsText, t({ en: 'Caption copied', zh: '文案已复制' }))}>
              <Icon name="copy" size={14} /> {t({ en: 'Copy caption', zh: '复制文案' })}
            </button>
            {onSaveImage && (
              <button type="button" className="btn-ghost btn-sm" onClick={onSaveImage}>
                <Icon name="image" size={14} /> {t({ en: 'Save picture', zh: '保存图片' })}
              </button>
            )}
            {isMobile() && (
              <a className="btn-ghost btn-sm" href="xhsdiscover://">
                {t({ en: 'Open Xiaohongshu', zh: '打开小红书' })}
              </a>
            )}
          </div>
        </div>
      )}
      {overlay && <WeChatOverlay onClose={() => setOverlay(false)} />}
    </div>
  );
}

/** Inside WeChat's browser: point at the "···" menu (the only way to share a web page there). */
function WeChatOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useApp();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <button type="button" className="fixed inset-0 z-[70] bg-night/80 text-left text-nightInk" onClick={onClose} aria-label={t({ en: 'Close', zh: '关闭' })}>
      <span className="absolute right-5 top-3 text-5xl" aria-hidden>↗</span>
      <span className="absolute right-6 top-20 max-w-[16rem] text-right text-lg font-bold">
        {t({ en: 'Tap ··· at the top right, then “Send to Chat” or “Share to Moments”.', zh: '点击右上角 ···，选择「发送给朋友」或「分享到朋友圈」。' })}
      </span>
    </button>
  );
}

/** "Sign in with WeChat": the real flow needs the company's WeChat Open Platform account (Phase 2). Demo only. */
export function WeChatSignIn({ onDemoSignedIn }: { onDemoSignedIn: (name: string) => void }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-ghost w-full !border-[#07c160] sm:w-auto" onClick={() => setOpen(true)} data-testid="wechat-signin">
        <span className="h-2.5 w-2.5 rounded-full bg-[#07c160]" aria-hidden /> {t({ en: 'Sign in with WeChat', zh: '微信登录' })}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-night/60 p-4" role="dialog" aria-modal="true" aria-label={t({ en: 'Sign in with WeChat', zh: '微信登录' })}>
          <div className="card rise w-full max-w-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold">{t({ en: 'Sign in with WeChat', zh: '微信登录' })}</h3>
              <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setOpen(false)} aria-label={t({ en: 'Close', zh: '关闭' })}><Icon name="x" size={16} /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5"><Scope phase="p2" /><Tag kind="demo" /></div>
            <div className="relative mx-auto mt-4 w-44 rounded-[10px] border-2 border-edge bg-white p-2">
              <QR text="https://diawx-6669.github.io/ZERttex/#/trip" label={t({ en: 'Demo WeChat login QR', zh: '演示微信登录二维码' })} />
              <span className="absolute inset-0 grid place-items-center"><span className="sticker !bg-surface">DEMO</span></span>
            </div>
            <p className="mt-3 text-sm text-muted">
              {t({
                en: 'Real WeChat login needs a verified WeChat Open Platform account for Saryarqa Routes. We only receive your WeChat nickname: no phone number, no passport.',
                zh: '真实微信登录需要公司完成微信开放平台认证。我们只获取您的微信昵称，不获取手机号或护照信息。',
              })}
            </p>
            <button type="button" className="btn-primary mt-4 w-full" onClick={() => { onDemoSignedIn('王小明'); setOpen(false); }}>
              {t({ en: 'Simulate scan (demo)', zh: '模拟扫码（演示）' })}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
