import { Icon } from '../components/Icon';
import { LoopStrip } from '../components/Layout';
import { Scene } from '../components/Scene';
import { Tag } from '../components/Tag';
import { AudioGuide, Inclusions, Itinerary, PackingList } from '../components/TourParts';
import { ui } from '../data/i18n';
import type { L } from '../data/types';
import { hubName, tourById } from '../data/tours';
import { indicative, kzt } from '../lib/format';
import { href } from '../lib/router';
import { useApp } from '../state';

export default function TourDetail({ id }: { id?: string }) {
  const { t, lang } = useApp();
  const tour = tourById(id);
  if (!tour)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-bold">{t(ui.tour.notFound)}</h1>
        <a className="btn-primary mt-6" href={href('/tours')}>{t(ui.tour.allTours)}</a>
      </div>
    );

  return (
    <>
      <div className="container-x pt-6">
        <LoopStrip compact current={0} />
      </div>
      <section className="container-x mt-5">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-night">
          <div className="aspect-[4/3] sm:aspect-[21/9]">
            <Scene id={tour.id} title={t(tour.name)} />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/95 via-night/60 to-transparent p-5 pt-16 text-nightInk sm:p-8">
            <a href={href('/tours')} className="mb-3 inline-flex items-center gap-1 text-sm text-nightInk/80 hover:text-nightInk">
              <Icon name="arrowLeft" size={14} /> {t(ui.tour.allTours)}
            </a>
            <h1 className="text-3xl font-extrabold sm:text-5xl">{t(tour.name)}</h1>
            <p className="mt-2 max-w-2xl text-nightInk/85 sm:text-lg">{t(tour.tagline)}</p>
          </div>
        </div>
      </section>

      <div className="container-x mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [{ en: 'Duration', zh: '时长' }, `${tour.days} ${t(ui.tour.days)}`],
                [ui.tour.starts, t(hubName[tour.hub])],
                [{ en: 'Region', zh: '地区' }, t(tour.region)],
                [ui.tour.difficulty, t(tour.difficulty)],
              ] as [L, string][]
            ).map(([k, v], i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-3">
                <dt className="font-mono text-[10.5px] uppercase tracking-wide text-muted">{t(k)}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="mb-3 text-xl font-bold">{t(ui.tour.highlights)}</h2>
            <ul className="grid gap-2 sm:grid-cols-3">
              {tour.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-surface2 p-3 text-sm font-medium">
                  <Icon name="sparkle" size={16} className="mt-0.5 text-gold" />
                  {t(h)}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="inc">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 id="inc" className="text-xl font-bold">{t(ui.tour.whatsIncluded)}</h2>
              <Tag kind="demo" />
            </div>
            <Inclusions tour={tour} />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">{t(ui.tour.itinerary)}</h2>
            <Itinerary tour={tour} />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">{t(ui.audio.title)}</h2>
            <p className="mb-3 text-sm text-muted">{t(ui.audio.sub)}</p>
            <AudioGuide tour={tour} />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">{t(ui.tour.packing)}</h2>
            <PackingList tour={tour} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-muted">{t(ui.tour.from)}</div>
              <div className="num text-3xl font-semibold">{kzt(tour.priceKzt)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                {t(ui.tour.perPerson)} · <span className="num">{indicative(tour.priceKzt, lang)}</span> <Tag kind="demo" />
              </div>
            </div>
            <p className="text-sm text-muted">{t(ui.tour.priceNote)}</p>
            <a href={href(`/book?tour=${tour.id}`)} className="btn-primary w-full text-base">
              {t(ui.tour.book)} <Icon name="arrow" />
            </a>
            <a href={href(`/ask?tour=${tour.id}`)} className="btn-ghost w-full">
              <Icon name="chat" /> {t(ui.tour.ask)}
            </a>
            <a href={href('/trust')} className="flex items-center gap-2 rounded-xl bg-surface2 p-3 text-sm hover:text-teal">
              <Icon name="video" className="text-teal" />
              {t(ui.trust.callTitle)}
            </a>
          </div>
        </aside>
      </div>

      {/* Mobile: keep price and the booking action one tap away. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="num whitespace-nowrap font-semibold">{kzt(tour.priceKzt)}</div>
            <div className="text-xs text-muted">
              {t(ui.tour.perPerson)} · <span className="num">{indicative(tour.priceKzt, lang)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={href(`/ask?tour=${tour.id}`)} className="btn-ghost btn-sm !px-3" aria-label={t(ui.tour.ask)}>
              <Icon name="chat" />
            </a>
            <a href={href(`/book?tour=${tour.id}`)} className="btn-primary btn-sm">
              {t(ui.tour.book)}
            </a>
          </div>
        </div>
      </div>
      <div className="h-16 lg:hidden" aria-hidden />
    </>
  );
}
