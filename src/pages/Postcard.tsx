import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Icon } from '../components/Icon';
import { Logo, PageHead } from '../components/Layout';
import { Media } from '../components/Media';
import { Tag } from '../components/Tag';
import { ui } from '../data/i18n';
import { tourById, tours } from '../data/tours';
import type { TourId } from '../data/types';
import { copyText } from '../lib/format';
import { navigate } from '../lib/router';
import { qrPattern } from '../lib/qr';
import { useApp } from '../state';

function QR({ seed }: { seed: string }) {
  const grid = useMemo(() => qrPattern(seed), [seed]);
  const n = grid.length;
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-full w-full" role="img" aria-label="QR placeholder, not scannable">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      {grid.flatMap((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" fill="#12213f" /> : null)))}
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
  const link = `https://go.saryarqa.example/r/${encodeURIComponent(refCode)}`;

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
              <Tag kind="demo" extra={t({ en: 'example domain', zh: '示例域名' })} />
            </div>
            <button type="button" className="btn-ghost btn-sm mt-3 !whitespace-normal text-left" onClick={() => navigate(`/?ref=${encodeURIComponent(refCode)}`)}>
              <Icon name="refresh" size={14} /> {t(ui.postcard.friendView)}
            </button>
          </div>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <figure
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
                    <div className="h-[84px] w-[84px] rounded-md border border-[#12213f]/15 p-1">
                      <QR seed={refCode} />
                    </div>
                    <span className="text-center text-[8.5px] leading-tight text-[#5c6270]">{t(ui.postcard.notScannable)}</span>
                  </div>
                </div>
              </div>
            </div>
          </figure>
          <p className="mt-3 text-center text-xs text-muted">
            4:5 · Xiaohongshu 小红书 · WeChat Moments 朋友圈 · Instagram
          </p>
          <p className="mt-1 text-center text-xs text-muted" lang={lang === 'zh' ? 'zh-CN' : 'en'}>
            {t({ en: 'Tip: take a screenshot of the card to share it.', zh: '提示：截图即可分享这张明信片。' })}
          </p>
        </div>
      </div>
    </>
  );
}
