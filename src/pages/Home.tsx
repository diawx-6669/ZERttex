import { Icon } from '../components/Icon';
import { LoopStrip, Section } from '../components/Layout';
import { HeroLandscape } from '../components/Scene';
import { Tag } from '../components/Tag';
import { TourCard } from '../components/TourParts';
import { complaints, evidence, methodNote } from '../data/facts';
import { ui } from '../data/i18n';
import { tours } from '../data/tours';
import { href } from '../lib/router';
import { useApp } from '../state';

export default function Home({ query }: { query: URLSearchParams }) {
  const { t } = useApp();
  const ref = query.get('ref');

  return (
    <>
      {ref && (
        <div className="border-b border-gold/40 bg-gold/15">
          <div className="container-x flex flex-wrap items-center gap-2 py-3 text-sm">
            <Icon name="heart" className="text-gold" />
            <span className="font-mono text-xs font-semibold">{ref}</span>
            <span>{t(ui.home.referral)}</span>
            <Tag kind="proposal" />
          </div>
        </div>
      )}

      <section className="relative isolate overflow-hidden bg-night text-nightInk">
        <div className="absolute inset-0 -z-10">
          <HeroLandscape />
          <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/70 to-night/10" />
        </div>
        <div className="container-x grid min-h-[560px] content-center gap-6 py-16 sm:min-h-[600px]">
          <div className="rise max-w-2xl space-y-5">
            <p className="eyebrow !text-gold">{t(ui.home.eyebrow)}</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">{t(ui.home.title)}</h1>
            <p className="max-w-xl text-lg text-nightInk/85">{t(ui.home.lead)}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href={href('/tours')} className="btn-primary text-base">
                {t(ui.home.ctaTours)} <Icon name="arrow" />
              </a>
              <a href={href('/plan')} className="btn border border-nightInk/30 bg-white/5 text-base text-nightInk hover:bg-white/15">
                <Icon name="route" /> {t(ui.home.ctaPlan)}
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-sm text-nightInk/80">
              <li className="flex items-center gap-1.5"><Icon name="globe" size={16} className="text-teal" /> EN · 中文</li>
              <li className="flex items-center gap-1.5"><Icon name="card" size={16} className="text-teal" /> {t({ en: 'Foreign cards', zh: '支持外卡' })}</li>
              <li className="flex items-center gap-1.5"><Icon name="video" size={16} className="text-teal" /> {t({ en: 'Meet your guide first', zh: '先见导游再付款' })}</li>
              <li className="flex items-center gap-1.5"><Icon name="shield" size={16} className="text-teal" /> {t({ en: 'Refund guarantee', zh: '退款保障' })} <Tag kind="proposal" className="!border-gold/60" /></li>
            </ul>
          </div>
        </div>
      </section>

      <Section title={t(ui.loop.title)} sub={t(ui.loop.sub)}>
        <LoopStrip />
      </Section>

      <Section title={t(ui.home.complaintsTitle)} sub={t(ui.home.complaintsSub)}>
        <div className="grid gap-4 md:grid-cols-2">
          {complaints.map((c, i) => (
            <a key={i} href={href(c.route)} className="card group grid gap-4 p-5 transition hover:border-teal sm:grid-cols-[1fr_auto_1.2fr] sm:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="eyebrow">{t(ui.home.guestSaid)}</span>
                  <Tag kind="case" />
                </div>
                <p className="font-display text-lg font-semibold leading-snug">{t(c.quote)}</p>
              </div>
              <Icon name="arrow" className="hidden text-teal sm:block" size={22} />
              <div className="border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <span className="eyebrow !text-teal">{t(ui.home.weBuilt)}</span>
                <p className="mt-1 font-semibold">{t(c.feature)}</p>
                <p className="mt-1 text-sm text-muted">{t(c.answer)}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal group-hover:underline">
                  {t(ui.home.open)} <Icon name="arrow" size={14} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </Section>

      <Section
        title={t(ui.home.toursTitle)}
        sub={t(ui.home.toursSub)}
        right={
          <a href={href('/tours')} className="btn-ghost btn-sm">
            {t(ui.tour.allTours)} <Icon name="arrow" size={14} />
          </a>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </Section>

      <Section title={t(ui.home.marketTitle)} sub={t(ui.home.marketSub)}>
        <div className="grid gap-4 md:grid-cols-3">
          {evidence.map((e) => (
            <figure key={e.url} className="card flex flex-col gap-3 p-5">
              <Tag kind="verified" />
              <div className="num font-display text-4xl font-extrabold text-teal">{e.figure}</div>
              <p className="text-sm">{t(e.text)}</p>
              <figcaption className="mt-auto border-t border-line pt-3 text-xs text-muted">
                {t(ui.common.source)}:{' '}
                <a className="font-semibold text-ink underline underline-offset-2 hover:text-teal" href={e.url} target="_blank" rel="noreferrer">
                  {e.source}
                </a>{' '}
                · {e.date}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
          <Icon name="info" className="mt-0.5 text-warn" />
          {t(methodNote)}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-night p-5 text-nightInk">
          <Icon name="flag" className="text-gold" />
          <span className="font-semibold">{t(ui.home.goalTitle)}:</span>
          <span className="text-nightInk/85">{t(ui.home.goalText)}</span>
          <Tag kind="case" className="!border-gold/50" />
          <a href={href('/impact')} className="btn-primary btn-sm ml-auto">
            {t(ui.nav.impact)} <Icon name="arrow" size={14} />
          </a>
        </div>
      </Section>
    </>
  );
}
