import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Icon } from '../components/Icon';
import { Logo, PageHead } from '../components/Layout';
import { Media } from '../components/Media';
import { AiTag, Scope, Tag } from '../components/Tag';
import { aiLive, callAi, validateCaptions, type AiCaptions } from '../lib/ai';
import { ui } from '../data/i18n';
import { tourById, tours } from '../data/tours';
import type { TourId } from '../data/types';
import { copyText } from '../lib/format';
import { navigate } from '../lib/router';
import { qrMatrix, referralUrl } from '../lib/qr';
import { downloadPostcard } from '../lib/postcardPng';
import { useApp } from '../state';

/** Scripted captions from verified tour data only (used when the live AI is off or fails). */
function scriptedCaptions(id: TourId): AiCaptions {
  const tour = tourById(id)!;
  const [h1, h2] = tour.highlights;
  return {
    zh: [`${tour.name.zh}｜${h1.zh} #哈萨克斯坦`, `在${tour.region.zh}的${tour.days}天：${h2?.zh ?? h1.zh}`, `下一站，${tour.name.zh} #哈萨克斯坦旅行`],
    en: [`${tour.name.en}: ${h1.en.toLowerCase()} #Kazakhstan`, `${tour.days} days in ${tour.region.en}. ${h2?.en ?? h1.en}.`, `Postcard from ${tour.name.en} #Kazakhstan`],
  };
}

/** Real, scannable QR code (SVG, 2-module quiet zone). */
export function QR({ text, label }: { text: string; label: string }) {
  const grid = useMemo(() => qrMatrix(text), [text]);
  const n = grid.length;
  const d = grid.flatMap((row, r) => row.map((on, c) => (on ? `M${c} ${r}h1v1h-1z` : ''))).join('');
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="h-full w-full" role="img" aria-label={label} data-qr={text} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      <path d={d} fill="#12213f" />
    </svg>
  );
}

export default function Postcard() {
  const { t, lang, booking, toast } = useApp();
  const firstTour = (booking?.items[0]?.tourId || 'kolsai') as TourId;
  const [dest, setDest] = useState<TourId>(firstTour);
  const [name, setName] = useState(booking?.name?.split(' ')[0] ?? '');
  const [msg, setMsg] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const tour = tourById(dest)!;

  const code = booking?.code?.replace('SG-', '') ?? '7KQ2';
  const refName = (name.trim() || 'FRIEND').toUpperCase().replace(/[^A-Z0-9一-鿿]/g, '').slice(0, 12) || 'FRIEND';
  const refCode = `${refName}-${code}`;
  const link = referralUrl(dest, refCode);
  const figRef = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const savePng = async () => {
    setSaving(true);
    try {
      await downloadPostcard(
        { photos, figure: figRef.current, titleEn: tour.name.en, titleZh: tour.name.zh, message: msg || t(ui.postcard.defaultMsg), name: name || 'Li Wei', scanText: t(ui.postcard.scan), qrText: link },
        `saryarqa-postcard-${dest}.png`,
      );
    } catch {
      toast(t({ en: 'Could not create the PNG. Take a screenshot instead.', zh: '无法生成图片，请直接截图。' }));
    }
    setSaving(false);
  };

  const [captions, setCaptions] = useState<(AiCaptions & { ai: boolean }) | null>(null);
  const [capBusy, setCapBusy] = useState(false);
  const suggest = async () => {
    setCapBusy(true);
    let c: AiCaptions | null = null;
    if (aiLive()) c = await callAi('caption', { tourId: dest, message: msg }, validateCaptions);
    setCaptions(c ? { ...c, ai: true } : { ...scriptedCaptions(dest), ai: false });
    setCapBusy(false);
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    const room = 4 - photos.length;
    setNote(files.length > room ? t(ui.postcard.tooMany) : '');
    files.slice(0, Math.max(0, room)).forEach((f) => {
      const r = new FileReader();
      r.onload = () => typeof r.result === 'string' && setPhotos((p) => (p.length < 4 ? [...p, r.result as string] : p));
      r.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const layout = photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2';

  return (
    <>
      <PageHead loop={5} scope="mvp" title={t(ui.postcard.title)} sub={t(ui.postcard.sub)} />

      <div className="container-x mt-6 grid gap-8 lg:grid-cols-[1fr_440px]">
        <form className="card h-fit min-w-0 space-y-5 p-4 sm:p-5" onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend className="label">{t(ui.postcard.destination)}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tours.map((tt) => (
                <label key={tt.id} className={`cursor-pointer overflow-hidden rounded-xl border-2 text-xs font-semibold ${dest === tt.id ? 'border-teal' : 'border-line'}`}>
                  <input type="radio" name="dest" className="sr-only" checked={dest === tt.id} onChange={() => setDest(tt.id)} />
                  <div className="aspect-[4/3]"><Media tour={tt.id} credit={false} /></div>
                  <div className="p-2 leading-tight">{t(tt.name)}</div>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pc-name">{t(ui.postcard.name)}</label>
              <input id="pc-name" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Li Wei" />
            </div>
            <div>
              <label className="label" htmlFor="pc-msg">{t(ui.postcard.message)}</label>
              <input id="pc-msg" className="input" value={msg} maxLength={70} onChange={(e) => setMsg(e.target.value)} placeholder={t(ui.postcard.defaultMsg)} />
            </div>
          </div>
          <div>
            <span className="label">{t(ui.postcard.photos)}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} id="pc-files" type="file" accept="image/*" multiple className="sr-only" onChange={onFiles} />
              <label htmlFor="pc-files" className={`btn-dark cursor-pointer ${photos.length >= 4 ? 'pointer-events-none opacity-50' : ''}`}>
                <Icon name="upload" /> {t({ en: 'Add photos', zh: '添加照片' })} <span className="num text-xs opacity-80">{photos.length}/4</span>
              </label>
              {photos.length > 0 && (
                <button type="button" className="btn-ghost btn-sm" onClick={() => setPhotos([])}>
                  <Icon name="x" size={14} /> {t(ui.postcard.clearPhotos)}
                </button>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <Icon name="lock" size={13} /> {t(ui.postcard.photosNote)}
            </p>
            {note && <p className="mt-1 text-xs text-warn">{note}</p>}
            {photos.length > 0 && (
              <ul className="mt-3 flex gap-2">
                {photos.map((p, i) => (
                  <li key={i} className="relative">
                    <img src={p} alt={`Photo ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-night text-nightInk"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={suggest} disabled={capBusy}>
                <Icon name="chat" size={14} /> {capBusy ? t({ en: 'Thinking…', zh: '生成中…' }) : t({ en: 'Suggest a caption', zh: '推荐文案' })}
              </button>
              <span className="text-xs text-muted">{t({ en: 'For your Xiaohongshu / Instagram post text', zh: '用于小红书 / Instagram 的帖子文案' })}</span>
              <Scope phase="p2" />
            </div>
            {captions && (
              <div className="mt-3 space-y-2" data-testid="captions">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {captions.ai ? <AiTag /> : <span className="rounded-full border border-line px-2 py-px font-semibold text-muted">{t({ en: 'Scripted templates', zh: '预设模板' })}</span>}
                </div>
                {[...captions.zh.map((c) => ({ c, zh: true })), ...captions.en.map((c) => ({ c, zh: false }))].map(({ c, zh }, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-surface2 px-1.5 text-[10px] font-semibold text-muted">{zh ? '小红书' : 'EN'}</span>
                    <span className="min-w-0 flex-1 break-words" lang={zh ? 'zh-CN' : 'en'} data-caption={zh ? 'zh' : 'en'}>{c}</span>
                    <button type="button" className="shrink-0 text-xs font-semibold text-teal hover:underline" onClick={async () => toast((await copyText(c)) ? t(ui.trip.copied) : c)}>
                      {t({ en: 'Copy', zh: '复制' })}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface2/60 p-4">
            <label className="label" htmlFor="ref-link">{t(ui.postcard.referral)}</label>
            <div className="flex gap-2">
              <input id="ref-link" readOnly className="input num min-w-0 flex-1 text-xs" value={link} />
              <button
                type="button"
                className="btn-primary btn-sm shrink-0"
                onClick={async () => {
                  const ok = await copyText(link);
                  toast(ok ? t(ui.trip.copied) : link);
                }}
              >
                <Icon name="copy" size={14} /> {t(ui.postcard.copyLink)}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Icon name="heart" size={15} className="text-gold" /> {t(ui.postcard.friendOffer)} <Tag kind="proposal" />
              <Tag kind="demo" extra={t({ en: 'links to this prototype', zh: '链接到本原型' })} />
            </div>
            <button type="button" className="btn-ghost btn-sm mt-3 !whitespace-normal text-left" onClick={() => navigate(`/tour/${dest}?ref=${encodeURIComponent(refCode)}`)}>
              <Icon name="refresh" size={14} /> {t(ui.postcard.friendView)}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <figure
            ref={figRef}
            className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[22px] bg-[#fbf6ea] text-[#12213f] shadow-2xl ring-1 ring-black/5"
            aria-label={t(ui.postcard.title)}
            data-testid="postcard"
          >
            <div className="relative aspect-[4/5]">
              <div className="absolute inset-0 grid grid-rows-[1fr_auto]">
                <div className="relative overflow-hidden">
                  {photos.length ? (
                    <div className={`grid h-full gap-0.5 ${layout}`}>
                      {photos.map((p, i) => (
                        <img key={i} src={p} alt="" className={`h-full w-full object-cover ${photos.length === 3 && i === 0 ? 'row-span-2' : ''}`} />
                      ))}
                    </div>
                  ) : (
                    <Media tour={dest} eager />
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-[#12213f]/85 px-3 py-1 text-xs font-semibold text-[#f0ebde]">
                    Kazakhstan · 哈萨克斯坦
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-white">
                    <div className="font-display text-2xl font-extrabold leading-tight">{tour.name.en}</div>
                    <div className="text-sm font-semibold opacity-90" lang="zh-CN">{tour.name.zh}</div>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold leading-snug">"{msg || t(ui.postcard.defaultMsg)}"</p>
                    <p className="mt-1 text-sm">- {name || 'Li Wei'}</p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#0e807a]">
                      <Icon name="refresh" size={13} /> {t(ui.postcard.scan)}
                    </div>
                    <div className="mt-2 scale-90 origin-left [&_span]:!text-[#12213f]">
                      <Logo />
                    </div>
                  </div>
                  <div className="flex w-[92px] flex-col items-center gap-1">
                    <div className="h-[84px] w-[84px] rounded-md border border-[#12213f]/15 bg-white">
                      <QR text={link} label={t({ en: `QR code: opens ${tour.name.en} with your referral code`, zh: `二维码：打开${tour.name.zh}并带上推荐码` })} />
                    </div>
                    <span className="text-center text-[8.5px] leading-tight text-[#5c6270]">{t(ui.postcard.qrHint)}</span>
                  </div>
                </div>
              </div>
            </div>
          </figure>
          <p className="mt-3 text-center text-xs text-muted">
            4:5 · Xiaohongshu 小红书 · WeChat Moments 朋友圈 · Instagram
          </p>
          <div className="mt-3 flex justify-center">
            <button type="button" className="btn-primary" onClick={savePng} disabled={saving}>
              <Icon name="upload" size={16} className="rotate-180" /> {t({ en: 'Download PNG', zh: '下载 PNG' })}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted" lang={lang === 'zh' ? 'zh-CN' : 'en'}>
            {t({ en: '1080 × 1350 px, made in your browser. Nothing is uploaded.', zh: '1080 × 1350 像素，在浏览器中生成，不会上传。' })}
          </p>
        </div>
      </div>
    </>
  );
}
