import { Icon } from '../components/Icon';
import { LoopStrip, Section } from '../components/Layout';
import { RouteMap } from '../components/RouteMap';
import { HeroLandscape } from '../components/Scene';
import { CountUp, DestinationDeck } from '../components/Showcase';
import { Tag } from '../components/Tag';
import { TourCard } from '../components/TourParts';
import { complaints, evidence, methodNote } from '../data/facts';
import { ui } from '../data/i18n';
import { hubName, tours } from '../data/tours';
import { kzt } from '../lib/format';
import { href } from '../lib/router';
import { useApp } from '../state';

export default function Home({ query }: { query: URLSearchParams }) {
  const { t } = useApp();
  const ref = query.get('ref');

  const stats = [
    { v: <CountUp to={2020} plain />, l: { en: 'Founded in Astana', zh: '成立于阿斯塔纳' } },
    { v: <CountUp to={3400} />, l: { en: 'Travelers in 2025', zh: '2025年接待旅客' } },
    { v: <CountUp to={25} prefix="~" />, l: { en: 'Freelance guides', zh: '兼职导游' } },
    { v: <CountUp to={4} />, l: { en: 'Signature destinations', zh: '精品目的地' } },
  ];

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
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-night/20" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night/70 to-transparent" />
        </div>
        <div className="container-x grid min-h-[580px] items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div className="rise max-w-2xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {t(ui.home.eyebrow)}
            </p>
            <h1 className="text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">
              {t(ui.home.title)}
            </h1>
            <p className="max-w-xl text-lg text-nightInk/85">{t(ui.home.lead)}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href={href('/tours')} className="btn-primary px-6 text-base shadow-lg shadow-teal/30">
                {t(ui.home.ctaTours)} <Icon name="arrow" />
              </a>
              <a href={href('/plan')} className="btn border border-nightInk/30 bg-white/5 px-6 text-base text-nightInk backdrop-blur hover:bg-white/15">
                <Icon name="route" /> {t(ui.home.ctaPlan)}
              </a>
            </div>
            <ul className="grid max-w-xl grid-cols-2 gap-x-5 gap-y-2.5 pt-2 text-sm text-nightInk/85 sm:flex sm:flex-wrap">
              <li className="flex items-center gap-1.5"><Icon name="globe" size={16} className="text-teal" /> EN · 中文</li>
              <li className="flex items-center gap-1.5"><Icon name="card" size={16} className="text-teal" /> {t({ en: 'Foreign cards', zh: '支持外卡' })}</li>
              <li className="flex items-center gap-1.5"><Icon name="video" size={16} className="text-teal" /> {t({ en: 'Meet your guide first', zh: '先见导游再付款' })}</li>
              <li className="flex flex-wrap items-center gap-1.5"><Icon name="shield" size={16} className="text-teal" /> {t({ en: 'Refund guarantee', zh: '退款保障' })} <Tag kind="proposal" className="!border-gold/60" /></li>
            </ul>
          </div>
          <div className="hidden pb-10 lg:block">
            <DestinationDeck />
          </div>
        </div>
      </section>

      <div className="container-x relative z-10 -mt-8">
        <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-surface shadow-card sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className={`p-4 sm:p-6 ${i % 2 ? 'border-l border-line' : ''} ${i > 1 ? 'border-t border-line sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l' : ''}`}>
              <dd className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{s.v}</dd>
              <dt className="mt-1 text-sm text-muted">{t(s.l)}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-2 flex justify-end"><Tag kind="case" /></div>
      </div>

      <Section title={t(ui.loop.title)} sub={t(ui.loop.sub)}>
        <LoopStrip />
      </Section>

      <Section title={t(ui.home.complaintsTitle)} sub={t(ui.home.complaintsSub)}>
        <div className="grid gap-4 md:grid-cols-2">
          {complaints.map((c, i) => (
            <a key={i} href={href(c.route)} className="card group grid gap-4 p-5 transition hover:-translate-y-0.5 hover:border-teal sm:grid-cols-[1fr_auto_1.2fr] sm:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="eyebrow">{t(ui.home.guestSaid)}</span>
                  <Tag kind="case" />
                </div>
                <p className="font-display text-lg font-semibold leading-snug">{t(c.quote)}</p>
              </div>
              <span className="hidden h-10 w-10 place-items-center rounded-full bg-teal/10 text-teal transition group-hover:bg-teal group-hover:text-tealInk sm:grid">
                <Icon name="arrow" size={18} />
              </span>
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
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {tours.map((tour) => (
            <div key={tour.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
              <TourCard tour={tour} />
            </div>
          ))}
        </div>
      </Section>

      <Section title={t({ en: 'Where we go', zh: '我们去哪里' })} sub={t({ en: 'Tap a pin. Three start cities, four landscapes, one booking.', zh: '点击地图上的标记。三个出发城市，四种风景，一次预订。' })}>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
          <RouteMap className="mx-auto w-full max-w-xl" />
          <div className="space-y-3">
            {tours.map((tour) => (
              <a key={tour.id} href={href(`/tour/${tour.id}`)} className="card group flex items-center gap-4 p-4 transition hover:border-teal">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal/10 text-teal group-hover:bg-teal group-hover:text-tealInk">
                  <Icon name="pin" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t(tour.name)}</div>
                  <div className="text-sm text-muted">
                    {t(ui.tour.starts)} {t(hubName[tour.hub])} · {tour.days} {t(ui.tour.days)} · <span className="num">{kzt(tour.priceKzt)}</span>
                  </div>
                </div>
                <Icon name="chevron" className="text-muted group-hover:text-teal" />
              </a>
            ))}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ok/40 bg-ok/10 p-4 text-sm">
              <Icon name="globe" className="text-ok" />
              <span>
                {t({ en: 'Visa-free for citizens of China: up to 30 days per visit, max 90 days in 180.', zh: '中国公民免签：每次最多停留30天，每180天累计不超过90天。' })}
              </span>
              <Tag kind="verified" />
            </div>
          </div>
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
      </Section>

      <section className="container-x mt-16 sm:mt-20" data-reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-night p-6 text-nightInk sm:p-10">
          <div className="absolute inset-0 -z-0 opacity-40">
            <HeroLandscape />
          </div>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Icon name="flag" className="text-gold" />
                <span className="eyebrow !text-gold">{t(ui.home.goalTitle)}</span>
                <Tag kind="case" className="!border-gold/50" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold leading-snug sm:text-3xl">{t(ui.home.goalText)}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a href={href('/plan')} className="btn-primary px-6 text-base">
                <Icon name="route" /> {t(ui.home.ctaPlan)}
              </a>
              <a href={href('/impact')} className="btn border border-nightInk/30 bg-white/5 px-6 text-base text-nightInk hover:bg-white/15">
                {t(ui.nav.impact)} <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
