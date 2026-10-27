import { Icon } from '../components/Icon';
import { LoopStrip, ReferralBanner, Section } from '../components/Layout';
import { Media } from '../components/Media';
import { RouteMap } from '../components/RouteMap';
import { Scope, Tag } from '../components/Tag';
import { TourCard } from '../components/TourParts';
import { complaints, evidence, methodNote } from '../data/facts';
import { ui } from '../data/i18n';
import { tours } from '../data/tours';
import { href } from '../lib/router';
import { useApp } from '../state';

export default function Home({ query }: { query: URLSearchParams }) {
  const { t } = useApp();
  const ref = query.get('ref');

  const facts = [
    { v: '2020', l: { en: 'Founded in Astana', zh: '成立于阿斯塔纳' } },
    { v: '3,400', l: { en: 'Travelers in 2025', zh: '2025年接待旅客' } },
    { v: '~25', l: { en: 'Freelance guides', zh: '兼职导游' } },
    { v: '4', l: { en: 'Destinations', zh: '目的地' } },
  ];

  return (
    <>
      <ReferralBanner code={ref} />

      {/* Hero: copy left, photo collage right */}
      <section className="container-x grid items-center gap-10 pb-8 pt-10 sm:pt-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:py-12">
        <div className="rise max-w-xl">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl" style={{ fontStretch: '115%' }}>
            {t(ui.home.title)}
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg text-muted sm:text-xl">{t(ui.home.lead)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={href('/tours')} className="btn-primary px-6 text-base">
              {t(ui.home.ctaTours)} <Icon name="arrow" />
            </a>
            <a href={href('/plan')} className="btn-ghost px-6 text-base">
              {t(ui.home.ctaPlan)}
            </a>
          </div>
        </div>

        <div className="relative">
          <figure>
            <div className="grain relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface2 sm:aspect-[5/4] lg:aspect-[4/5]">
              <div className="h-full w-full">
                <Media tour="kolsai" eager credit />
              </div>
            </div>
            <figcaption className="mt-3 text-sm text-muted">
              {t({ en: 'Kolsai Lakes, three days from Almaty.', zh: '科尔赛湖，从阿拉木图出发三天。' })}
            </figcaption>
          </figure>
          <div className="grain absolute -left-6 bottom-16 hidden aspect-square w-40 overflow-hidden rounded-2xl border-[5px] border-bg bg-surface2 shadow-card md:block xl:-left-14 xl:w-48">
            <Media tour="turkestan" credit={false} />
          </div>
        </div>
      </section>

      {/* Case facts, plain numbers */}
      <section className="border-y border-line" aria-label={t({ en: 'About the company', zh: '关于公司' })}>
        <div className="container-x grid grid-cols-2 sm:grid-cols-4">
          {facts.map((f, i) => (
            <div
              key={i}
              className={`py-6 sm:py-8 ${i % 2 ? 'border-l border-line pl-5' : 'pr-5'} ${i > 1 ? 'border-t border-line sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l sm:pl-8' : ''} ${i > 0 ? 'sm:pl-8' : ''}`}
            >
              <div className="num font-display text-4xl font-bold sm:text-5xl" style={{ fontStretch: '112%' }}>
                {f.v}
              </div>
              <div className="mt-1 text-[15px] text-muted">{t(f.l)}</div>
            </div>
          ))}
        </div>
        <div className="container-x -mt-3 flex justify-end pb-3">
          <Tag kind="case" />
        </div>
      </section>

      <Section title={t(ui.loop.title)}>
        <LoopStrip />
      </Section>

      {/* Complaints as an editorial list */}
      <Section title={t(ui.home.complaintsTitle)} sub={t(ui.home.complaintsSub)}>
        <ol className="border-b border-line">
          {complaints.map((c, i) => (
            <li key={i} className="border-t border-line">
              <a href={href(c.route)} className="group grid gap-3 py-7 sm:grid-cols-[1.1fr_1fr_auto] sm:items-baseline sm:gap-10">
                <p className="font-display text-2xl font-semibold leading-snug sm:text-[1.7rem]">{t(c.quote)}</p>
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">{t(c.feature)} <Scope phase="mvp" /></p>
                  <p className="mt-1 text-muted">{t(c.answer)}</p>
                </div>
                <Icon name="arrow" size={22} className="hidden text-muted transition group-hover:translate-x-1 group-hover:text-teal sm:block" />
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">
          {t({ en: 'Quotes from foreign guests, as given in the case.', zh: '外国游客原话，摘自案例。' })} <Tag kind="case" />
        </p>
      </Section>

      {/* Tours: one featured, three supporting */}
      <Section
        title={t(ui.home.toursTitle)}
        right={
          <a href={href('/tours')} className="inline-flex items-center gap-1.5 font-semibold text-teal hover:underline">
            {t(ui.tour.allTours)} <Icon name="arrow" size={16} />
          </a>
        }
      >
        <div className="grid gap-x-6 gap-y-12 lg:grid-cols-3">
          <div className="lg:col-span-2 lg:row-span-2">
            <TourCard tour={tours[1]} featured />
          </div>
          {[tours[0], tours[2]].map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
          <div className="lg:col-span-3 lg:grid lg:grid-cols-3 lg:gap-6">
            <TourCard tour={tours[3]} />
            <div className="mt-10 rounded-2xl bg-surface2 p-6 lg:col-span-2 lg:mt-0 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-10">
              <div>
                <h3 className="text-2xl font-bold">{t({ en: 'Not sure which one?', zh: '不知道选哪条？' })}</h3>
                <p className="mt-2 max-w-[44ch] text-muted">
                  {t({ en: 'Tell the trip builder your days and interests. It fits the tours, transfers and city days for you.', zh: '告诉行程规划你的天数和兴趣，它会为你安排线路、交通和城市游。' })}
                </p>
              </div>
              <a href={href('/plan')} className="btn-dark mt-5 lg:mt-0">
                {t(ui.home.ctaPlan)} <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* Map with context */}
      <Section title={t({ en: 'Where the trips go', zh: '线路分布' })}>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <RouteMap className="w-full" />
          <div className="space-y-6 text-lg">
            <p>
              {t({
                en: 'Three start cities. Canyons and mountain lakes east of Almaty, granite and pine forest near Astana, and the Silk Road heritage of Turkestan in the south.',
                zh: '三个出发城市：阿拉木图以东的峡谷与高山湖泊，阿斯塔纳附近的花岗岩与松林，以及南部突厥斯坦的丝绸之路遗产。',
              })}
            </p>
            <p className="text-muted">
              {t({ en: 'Citizens of China can visit visa-free for up to 30 days per visit, max 90 days in 180.', zh: '中国公民可免签入境，每次最多停留30天，每180天累计不超过90天。' })}{' '}
              <Tag kind="verified" />
            </p>
            <p className="text-base text-muted">{t({ en: 'Tap a pin on the map to open a tour.', zh: '点击地图上的标记即可查看线路。' })}</p>
          </div>
        </div>
      </Section>

      {/* Evidence: big numbers, no cards */}
      <Section title={t(ui.home.marketTitle)}>
        <div className="grid border-t border-line md:grid-cols-[1fr_1fr_1.3fr]">
          {evidence.map((e, i) => (
            <figure key={e.url} className={`py-8 md:py-10 ${i > 0 ? 'border-t border-line md:border-l md:border-t-0 md:pl-8' : 'md:pr-8'}`}>
              <div className="num whitespace-nowrap font-display text-5xl font-bold text-teal xl:text-6xl" style={{ fontStretch: "108%" }}>
                {e.figure}
              </div>
              <p className="mt-4 max-w-[40ch]">{t(e.text)}</p>
              <figcaption className="mt-4 text-sm text-muted">
                <a className="underline decoration-line underline-offset-4 hover:text-ink" href={e.url} target="_blank" rel="noreferrer">
                  {e.source}
                </a>
                , {e.date}. <Tag kind="verified" />
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-2 flex max-w-3xl items-start gap-2 text-[15px] text-muted">
          <Icon name="info" className="mt-1 text-warn" />
          {t(methodNote)}
        </p>
      </Section>

      {/* Goal */}
      <section className="container-x mt-20 sm:mt-28" data-reveal>
        <div className="grid gap-8 rounded-2xl bg-teal/10 p-6 sm:p-12 lg:grid-cols-[1.5fr_auto] lg:items-end">
          <div>
            <p className="font-semibold text-teal">{t(ui.home.goalTitle)}</p>
            <p className="mt-3 font-display text-2xl font-bold leading-snug sm:text-4xl" style={{ fontStretch: '110%' }}>
              {t(ui.home.goalText)}
            </p>
            <div className="mt-4">
              <Tag kind="case" />
            </div>
          </div>
          <a href={href('/impact')} className="btn-ghost px-6 text-base">
            {t({ en: 'See the plan and payback', zh: '查看计划与回本' })} <Icon name="arrow" />
          </a>
        </div>
      </section>
    </>
  );
}
