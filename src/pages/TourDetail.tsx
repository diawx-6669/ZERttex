import { useEffect, useState } from 'react';
import { tourQuestion, useChat } from '../components/Chat';
import { Icon } from '../components/Icon';
import { LoopStrip, ReferralBanner } from '../components/Layout';
import { Gallery, Media } from '../components/Media';
import { Scope, Tag } from '../components/Tag';
import { AudioGuide, Inclusions, Itinerary, PackingList, TourCard } from '../components/TourParts';
import { interestText, ui } from '../data/i18n';
import type { L } from '../data/types';
import { hubName, tourById, tours } from '../data/tours';
import { indicative, kzt } from '../lib/format';
import { href } from '../lib/router';
import { useApp } from '../state';

const sections: { id: string; label: L }[] = [
  { id: 'inc', label: ui.tour.whatsIncluded },
  { id: 'days', label: ui.tour.itinerary },
  { id: 'audio', label: ui.audio.title },
  { id: 'pack', label: ui.tour.packing },
];

/** Sticky in-page tabs that follow the scroll position. */
function SectionTabs() {
  const { t } = useApp();
  const [active, setActive] = useState('inc');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-35% 0px -60% 0px' },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label={t({ en: 'On this page', zh: '本页内容' })} className="sticky top-16 z-20 -mx-4 border-b border-line bg-bg/90 px-4 backdrop-blur-md sm:mx-0 sm:px-0">
      <ul className="flex gap-2 overflow-x-auto no-scrollbar">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#/${location.hash.split('/').slice(1, 3).join('/')}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              aria-current={active === s.id ? 'true' : undefined}
              className={`block border-b-2 px-3 py-2.5 text-[15px] font-medium transition ${active === s.id ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {t(s.label)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function TourDetail({ id, refCode = null }: { id?: string; refCode?: string | null }) {
  const { t, lang } = useApp();
  const { openChat } = useChat();
  const tour = tourById(id);
  if (!tour)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-bold">{t(ui.tour.notFound)}</h1>
        <a className="btn-primary mt-6" href={href('/tours')}>{t(ui.tour.allTours)}</a>
      </div>
    );

  const askAbout = () => openChat(tourQuestion(tour.id, lang));
  const others = tours.filter((x) => x.id !== tour.id).slice(0, 3);

  return (
    <>
      <ReferralBanner code={refCode} />
      <div className="container-x pt-6">
        <LoopStrip compact current={0} />
      </div>
      <section className="container-x mt-6">
        <a href={href('/tours')} className="inline-flex items-center gap-1.5 text-[15px] text-muted hover:text-ink">
          <Icon name="arrowLeft" size={16} /> {t(ui.tour.allTours)}
        </a>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-12">
          <h1 className="text-[2.2rem] font-extrabold leading-[1.02] sm:text-6xl" style={{ fontStretch: '112%' }}>
            {t(tour.name)}
          </h1>
          <p className="max-w-[46ch] text-lg text-muted lg:pb-2">
            {t(tour.tagline)} {t({ en: 'Good for', zh: '适合' })} {tour.bestFor.map((b) => t(interestText[b]).toLowerCase()).join(', ')}.
          </p>
        </div>
        <div className="grain relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl bg-surface2 sm:aspect-[21/9]">
          <Media tour={tour.id} title={t(tour.name)} eager />
        </div>
      </section>

      <div className="container-x mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                [{ en: 'Duration', zh: '时长' }, `${tour.days} ${t(ui.tour.days)}`, 'clock'],
                [ui.tour.starts, t(hubName[tour.hub]), 'pin'],
                [{ en: 'Region', zh: '地区' }, t(tour.region), 'map'],
                [ui.tour.difficulty, t(tour.difficulty), 'route'],
              ] as [L, string, 'clock' | 'pin' | 'map' | 'route'][]
            ).map(([k, v, ic], i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <Icon name={ic} size={13} className="text-teal" /> {t(k)}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="mb-3 text-xl font-bold">{t(ui.tour.highlights)}</h2>
            <ul className="grid gap-2 sm:grid-cols-3">
              {tour.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 rounded-2xl bg-surface2 p-3 text-sm font-medium">
                  <Icon name="sparkle" size={16} className="mt-0.5 text-gold" />
                  {t(h)}
                </li>
              ))}
            </ul>
          </section>

          <Gallery tour={tour.id} />

          <SectionTabs />

          <section id="inc" aria-labelledby="inc-h" className="scroll-mt-32">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 id="inc-h" className="text-xl font-bold">{t(ui.tour.whatsIncluded)}</h2>
              <Tag kind="demo" />
              <Scope phase="mvp" />
            </div>
            <Inclusions tour={tour} />
          </section>

          <section id="days" className="scroll-mt-32">
            <h2 className="mb-3 text-xl font-bold">{t(ui.tour.itinerary)}</h2>
            <Itinerary tour={tour} />
          </section>

          <section id="audio" className="scroll-mt-32">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{t(ui.audio.title)}</h2>
              <Scope phase="p2" />
            </div>
            <p className="mb-3 text-sm text-muted">{t(ui.audio.sub)}</p>
            <AudioGuide tour={tour} />
          </section>

          <section id="pack" className="scroll-mt-32">
            <h2 className="mb-3 text-xl font-bold">{t(ui.tour.packing)}</h2>
            <PackingList tour={tour} />
          </section>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <div className="text-xs text-muted">{t(ui.tour.from)}</div>
              <div className="num text-3xl font-semibold">{kzt(tour.priceKzt)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                {t(ui.tour.perPerson)} · <span className="num">{indicative(tour.priceKzt, lang)}</span> <Tag kind="demo" />
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {[
                { en: 'Pay with a foreign card', zh: '可用外国银行卡支付' },
                { en: 'Money held until the tour starts', zh: '款项托管至行程开始' },
                { en: 'Free reschedule for road closure', zh: '道路封闭可免费改期' },
              ].map((x, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Icon name="check" size={15} className="text-teal" /> {t(x)}
                </li>
              ))}
            </ul>
            <a href={href(`/book?tour=${tour.id}`)} className="btn-primary w-full text-base">
              {t(ui.tour.book)} <Icon name="arrow" />
            </a>
            <button type="button" onClick={askAbout} className="btn-ghost w-full">
              <Icon name="chat" /> {t(ui.tour.ask)}
            </button>
            <a href={href('/trust')} className="flex items-center gap-2 rounded-xl bg-surface2 p-3 text-sm hover:text-teal">
              <Icon name="video" className="text-teal" />
              {t(ui.trust.callTitle)}
            </a>
            <p className="text-xs text-muted">{t(ui.tour.priceNote)} <Tag kind="proposal" /></p>
          </div>
        </aside>
      </div>

      <section className="container-x mt-16" data-reveal>
        <h2 className="mb-5 text-2xl font-extrabold">{t({ en: 'Combine with', zh: '可以搭配' })}</h2>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
          {others.map((o) => (
            <div key={o.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <TourCard tour={o} />
            </div>
          ))}
        </div>
      </section>

      {/* Phones: price and booking always one tap away, above the tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-bg/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="num whitespace-nowrap font-semibold">{kzt(tour.priceKzt)}</div>
            <div className="text-xs text-muted">
              {t(ui.tour.perPerson)} · <span className="num">{indicative(tour.priceKzt, lang)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={askAbout} className="btn-ghost btn-sm !px-3" aria-label={t(ui.tour.ask)}>
              <Icon name="chat" />
            </button>
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
