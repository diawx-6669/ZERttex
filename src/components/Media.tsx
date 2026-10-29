import { useEffect, useRef, useState } from 'react';
import { photosFor, type Photo } from '../data/photos';
import type { TourId } from '../data/types';
import { useApp } from '../state';
import { Icon } from './Icon';
import { Scene } from './Scene';

/** Photo credit line required by CC licences: author · licence, linked to the source. */
export function Credit({ photo, className = '' }: { photo: Photo; className?: string }) {
  return (
    <a
      href={photo.credit.source}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto max-w-[90%] truncate rounded bg-black/45 px-1.5 py-0.5 text-[10px] leading-tight text-white/90 hover:bg-black/70 ${className}`}
      title={`${photo.credit.title ?? 'Photo'}, ${photo.credit.author}, ${photo.credit.license}`}
    >
      © {photo.credit.author} · {photo.credit.license}
    </a>
  );
}

/**
 * Destination image: the n-th real photo when one is available,
 * otherwise the hand-drawn SVG scene (always works offline).
 */
export function Media({ tour, index = 0, className = '', title, credit = true, eager = false }: { tour: TourId; index?: number; className?: string; title?: string; credit?: boolean; eager?: boolean }) {
  const { t } = useApp();
  const photos = photosFor(tour);
  const photo = photos.length ? photos[index % photos.length] : undefined;
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <Scene id={tour} className={className} title={title} />;
  return (
    <div className="relative h-full w-full bg-surface2">
      <img
        onError={() => setFailed(true)}
        src={photo.src}
        alt={photo.credit.alt ? t(photo.credit.alt) : title ?? ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`block h-full w-full object-cover ${className}`}
      />
      {credit && (
        <div className="pointer-events-none absolute bottom-1.5 right-1.5 flex justify-end">
          <Credit photo={photo} />
        </div>
      )}
    </div>
  );
}

/** Full-screen photo viewer: arrows, swipe, Esc. */
export function Lightbox({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const { t } = useApp();
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const n = photos.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = photos[i];
  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Photos"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between p-3">
        <span className="num text-sm opacity-80">
          {i + 1} / {n}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
          <Icon name="x" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        <img key={p.src} src={p.src} alt={p.credit.alt ? t(p.credit.alt) : ''} className="rise max-h-full max-w-full rounded-lg object-contain" />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/25" aria-label="Previous photo">
              <Icon name="arrowLeft" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/25" aria-label="Next photo">
              <Icon name="arrow" />
            </button>
          </>
        )}
      </div>
      <div className="p-3 text-center text-xs opacity-80">
        {p.credit.title && <span>{p.credit.title} · </span>}
        <a href={p.credit.source} target="_blank" rel="noreferrer" className="underline">
          {p.credit.author}
        </a>{' '}
        ·{' '}
        {p.credit.licenseUrl ? (
          <a href={p.credit.licenseUrl} target="_blank" rel="noreferrer" className="underline">
            {p.credit.license}
          </a>
        ) : (
          p.credit.license
        )}
      </div>
    </div>
  );
}

/** Photo strip for tour pages. Renders nothing when the tour has no photos. */
export function Gallery({ tour }: { tour: TourId }) {
  const { t } = useApp();
  const photos = photosFor(tour);
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{t({ en: 'Photos', zh: '照片' })}</h2>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(0)}>
          <Icon name="image" size={15} /> {t({ en: 'View all', zh: '查看全部' })} ({photos.length})
        </button>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {photos.map((p, i) => (
          <button
            key={p.file}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] w-[78%] shrink-0 snap-start overflow-hidden rounded-[14px] border-2 border-edge sm:w-auto"
            aria-label={`${t({ en: 'Open photo', zh: '打开照片' })} ${i + 1}`}
          >
            <img src={p.src} alt={p.credit.alt ? t(p.credit.alt) : ''} loading="lazy" onError={(e) => ((e.currentTarget.closest('button') as HTMLElement).hidden = true)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="pointer-events-none absolute bottom-1.5 right-1.5">
              <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90">© {p.credit.author}</span>
            </span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} start={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
