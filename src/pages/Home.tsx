import type { CSSProperties, ReactNode } from 'react';
import { useChat } from '../components/Chat';
import { CountUp, LiveChatDemo, Marquee, SeatsCountdown, useParallax } from '../components/Motion';
import { DemoVideo } from '../components/DemoVideo';
import { Icon } from '../components/Icon';
import { TravelerVoices } from '../components/Interviews';
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
  const { t, lang } = useApp();
  const { openChat } = useChat();
  const heroRef = useParallax<HTMLElement>();
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

      {/* Hero: words rise, marker draws, collage floats with mouse parallax, the chat plays itself */}
      <section ref={heroRef} className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="blob left-[-8%] top-[8%] h-[520px] w-[520px]" style={{ background: 'radial-gradient(circle, rgb(var(--teal) / 0.35), transparent 65%)' }} />
          <div className="blob right-[-6%] top-[-10%] h-[560px] w-[560px]" style={{ background: 'radial-gradient(circle, rgb(var(--sun) / 0.55), transparent 65%)', animationDelay: '-6s' }} />
          <div className="blob bottom-[-20%] left-[35%] h-[480px] w-[480px]" style={{ background: 'radial-gradient(circle, rgb(var(--pink) / 0.3), transparent 65%)', animationDelay: '-11s' }} />
          <div className="spotlight absolute inset-0" />
        </div>
        <div className="container-x grid items-center gap-12 pb-12 pt-10 sm:pt-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_1.02fr] lg:gap-10 lg:py-12">
          <div className="max-w-xl">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="sticker pop-in !bg-sun" style={{ '--d': '0.05s' } as CSSProperties}>EN · 中文</span>
              <span className="sticker pop-in !bg-surface" style={{ '--d': '0.15s' } as CSSProperties}>{t({ en: 'Small groups · from Almaty, Astana, Turkestan', zh: '小团 · 阿拉木图、阿斯塔纳、突厥斯坦出发' })}</span>
            </div>
            <h1 className="text-[2.75rem] font-black leading-[0.98] sm:text-7xl" data-testid="hero-title" aria-label={t(ui.home.title)}>
              <span aria-hidden>
                {lang === 'zh' ? (
                  <>
                    <W i={0}>哈萨克斯坦，</W>
                    <br />
                    <span className="mark mark-draw my-2 -rotate-1">三步</span>
                    <W i={3}>轻松预订。</W>
                  </>
                ) : (
                  <>
                    <W i={0}>Kazakhstan,</W>{' '}
                    <span className="mark mark-draw my-2 -rotate-1">booked</span>
                    <br />
                    <W i={2}>in</W> <W i={3}>three</W> <W i={4}>clear</W> <W i={5}>steps.</W>
                  </>
                )}
              </span>
            </h1>
            <p className="pop-in mt-6 max-w-[46ch] text-lg text-muted sm:text-xl" style={{ '--d': '0.7s' } as CSSProperties}>{t(ui.home.lead)}</p>
            <div className="pop-in mt-8 flex flex-wrap gap-3" style={{ '--d': '0.85s' } as CSSProperties}>
              <a href={href('/tours')} className="btn-primary px-6 text-base">
                {t(ui.home.ctaTours)} <Icon name="arrow" />
              </a>
              <button type="button" className="btn-sun px-6 text-base" onClick={() => openChat(lang === 'zh' ? '查伦峡谷两个人多少钱？' : 'How much is Charyn Canyon for two?')}>
                <Icon name="chat" /> {t({ en: 'Ask in 中文 or English', zh: '用中文提问' })}
              </button>
            </div>
            <ul className="mt-9 grid grid-cols-2 gap-x-5 gap-y-3 text-sm font-semibold sm:max-w-lg">
              {[
                { i: 'card' as const, l: { en: 'Your own foreign card', zh: '使用外国银行卡' } },
                { i: 'video' as const, l: { en: 'Meet your guide first', zh: '出发前先见导游' } },
                { i: 'shieldCheck' as const, l: { en: 'AI that cannot invent prices', zh: 'AI 不会编造价格' } },
                { i: 'globe' as const, l: { en: 'No Google: built for China', zh: '无 Google 依赖，面向中国' } },
              ].map((x, k) => (
                <li key={x.i} className="pop-in flex items-center gap-2" style={{ '--d': `${1 + k * 0.08}s` } as CSSProperties}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border-2 border-edge bg-surface"><Icon name={x.i} size={15} /></span>
                  {t(x.l)}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] pb-10 lg:pb-0">
            <div className="parallax" style={{ '--depth': '-14px' } as CSSProperties}>
              <div className="pop-in" style={{ '--d': '0.3s' } as CSSProperties}>
              <figure className="float-a relative overflow-hidden rounded-[18px] border-2 border-edge bg-surface2 shadow-hard-lg">
                <div className="grain relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
                  <div className="kenburns h-full w-full"><Media tour="kolsai" eager credit /></div>
                </div>
                <figcaption className="flex items-center justify-between gap-2 border-t-2 border-edge bg-surface px-4 py-2.5 text-sm font-bold">
                  <span>{t({ en: 'Kolsai Lakes & Kaindy', zh: '科尔赛湖与凯恩迪湖' })}</span>
                  <span className="num font-mono text-xs">69,000 KZT</span>
                </figcaption>
              </figure>
              </div>
            </div>

            <div className="parallax absolute -left-3 top-8 z-[2] w-[min(300px,80%)] sm:-left-10 lg:-left-16" style={{ '--depth': '22px' } as CSSProperties}>
              <div className="pop-in" style={{ '--d': '0.9s' } as CSSProperties}>
                <div className="float-b">
                  <LiveChatDemo />
                </div>
              </div>
            </div>

            <div className="parallax absolute -bottom-2 right-2 z-[2] sm:right-6 lg:-right-4" style={{ '--depth': '30px' } as CSSProperties}>
              <div className="pop-in" style={{ '--d': '1.2s' } as CSSProperties}>
                <div className="wobble rotate-[3deg] rounded-[12px] border-2 border-edge bg-sun px-3.5 py-2.5 text-sunInk shadow-hard" aria-hidden>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider">18 Nov · Kolsai</div>
                  <div className="num text-lg font-black leading-tight"><SeatsCountdown /></div>
                </div>
              </div>
            </div>

            <div className="parallax absolute -top-3 right-6 z-[2]" style={{ '--depth': '18px' } as CSSProperties}>
              <div className="pop-in" style={{ '--d': '1.05s' } as CSSProperties}>
                <div className="float-c">
                  <div className="sticker" aria-hidden>{t({ en: 'Foreign cards · Alipay+ planned', zh: '支持外卡 · 支付宝筹备中' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two crossing ticker bands */}
      <section className="relative -mt-2 overflow-hidden py-6" aria-label={t({ en: 'Destinations', zh: '目的地' })}>
        <div className="-mx-4 -rotate-[1.5deg] border-y-2 border-edge bg-ink py-3 text-bg">
          <Marquee className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl" items={['Charyn Canyon', '查伦大峡谷', 'Kolsai Lakes', '科尔赛湖', 'Turkestan', '突厥斯坦', 'Burabay', '布拉拜']} />
        </div>
        <div className="-mx-4 -mt-1 rotate-[1deg] border-y-2 border-edge bg-sun py-2.5 text-sunInk">
          <Marquee reverse className="font-mono text-sm font-bold uppercase tracking-wider" items={[t({ en: 'Foreign cards', zh: '外卡支付' }), t({ en: 'Guide on video before you pay', zh: '付款前视频见导游' }), t({ en: 'Prices checked by code', zh: '价格由代码核对' }), t({ en: 'Opens without Google', zh: '无需 Google' }), t({ en: 'WeChat · Xiaohongshu', zh: '微信 · 小红书' }), t({ en: 'Translator in the trip', zh: '旅途翻译' })]} />
        </div>
      </section>

      {/* Case facts, plain numbers */}
      <section className="border-y-2 border-edge bg-sun text-sunInk" aria-label={t({ en: 'About the company', zh: '关于公司' })}>
        <div className="container-x grid grid-cols-2 sm:grid-cols-4">
          {facts.map((f, i) => (
            <div
              key={i}
              className={`py-6 sm:py-8 ${i % 2 ? 'border-l-2 border-sunInk/80 pl-5' : 'pr-5'} ${i > 1 ? 'border-t-2 border-sunInk/80 sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l-2 sm:pl-8' : ''} ${i > 0 ? 'sm:pl-8' : ''}`}
            >
              <div className="font-display text-4xl font-black tracking-tight sm:text-6xl">
                <CountUp value={f.v} />
              </div>
              <div className="mt-1 font-mono text-xs font-bold uppercase tracking-wider">{t(f.l)}</div>
            </div>
          ))}
        </div>
        <div className="container-x -mt-3 flex justify-end pb-3">
          <Tag kind="case" className="!bg-sunInk !text-sun" />
        </div>
      </section>

      <Section title={t(ui.loop.title)}>
        <LoopStrip />
      </Section>

      <Section id="demo" title={t({ en: 'See the whole loop in 48 seconds', zh: '48 秒看完整个闭环' })} sub={t({ en: 'Tour → guide video call → payment with a foreign card → postcard with a QR code.', zh: '线路 → 导游视频通话 → 外国银行卡支付 → 带二维码的明信片。' })}>
        <div className="mx-auto max-w-4xl">
          <DemoVideo />
        </div>
      </Section>

      {/* Complaints as an editorial list */}
      <Section id="complaints" title={t(ui.home.complaintsTitle)} sub={t(ui.home.complaintsSub)}>
        <ol className="stagger border-b border-line">
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
        <div className="stagger grid gap-x-6 gap-y-12 lg:grid-cols-3">
          <div className="lg:col-span-2 lg:row-span-2">
            <TourCard tour={tours[1]} featured />
          </div>
          {[tours[0], tours[2]].map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
          <div className="lg:col-span-3 lg:grid lg:grid-cols-3 lg:gap-6">
            <TourCard tour={tours[3]} />
            <div className="card mt-10 bg-surface2 p-6 lg:col-span-2 lg:mt-0 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-10">
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
      {/* China channels: where Chinese travelers find and share us */}
      <Section title={t({ en: 'Inside WeChat and Xiaohongshu', zh: '在微信和小红书里找到我们' })} sub={t({ en: 'For Chinese travelers these are what WhatsApp and Instagram are elsewhere. We meet them there.', zh: '对中国旅客来说，微信和小红书就是日常入口。我们就在那里。' })}>
        <div className="stagger grid gap-4 md:grid-cols-3">
          {[
            { dot: 'bg-[#07c160]', h: { en: 'WeChat share + QR', zh: '微信分享与二维码' }, p: { en: 'Every tour and postcard has a QR to scan in WeChat and a one-tap hint inside WeChat’s browser.', zh: '每条线路和明信片都有可在微信扫码的二维码；在微信内打开时提示一键分享。' }, phase: 'mvp' as const, to: '/tour/kolsai' },
            { dot: 'bg-[#ff2442]', h: { en: 'Xiaohongshu notes', zh: '小红书笔记' }, p: { en: 'Ready Chinese captions with the link, the postcard picture, and “open Xiaohongshu”.', zh: '现成的中文文案（含链接）、明信片图片，一键打开小红书。' }, phase: 'mvp' as const, to: '/postcard' },
            { dot: 'bg-[#07c160]', h: { en: 'WeChat login · Official Account · Mini Program', zh: '微信登录 · 公众号 · 小程序' }, p: { en: 'Needs a verified WeChat Open Platform account for the company. Planned after the pilot.', zh: '需要公司完成微信开放平台认证，计划在试点后上线。' }, phase: 'p2' as const, to: '/book' },
          ].map((c) => (
            <a key={c.h.en} href={href(c.to)} className="card group block p-5 transition hover:-translate-y-0.5 hover:shadow-hard-lg">
              <div className="flex items-center justify-between gap-2">
                <span className={`h-3 w-3 rounded-full ${c.dot}`} aria-hidden />
                <Scope phase={c.phase} />
              </div>
              <h3 className="mt-3 text-lg font-bold">{t(c.h)}</h3>
              <p className="mt-1 text-sm text-muted">{t(c.p)}</p>
            </a>
          ))}
        </div>
      </Section>

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
      <TravelerVoices />

      <Section title={t(ui.home.marketTitle)}>
        <div className="stagger grid border-t border-line md:grid-cols-[1fr_1fr_1.3fr]">
          {evidence.map((e, i) => (
            <figure key={e.url} className={`py-8 md:py-10 ${i > 0 ? 'border-t border-line md:border-l md:border-t-0 md:pl-8' : 'md:pr-8'}`}>
              <div className="num whitespace-nowrap font-display text-5xl font-bold text-teal xl:text-6xl">
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
        <div className="grid gap-8 rounded-[18px] border-2 border-edge bg-teal p-6 text-tealInk shadow-hard-lg sm:p-12 lg:grid-cols-[1.5fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-sun">{t(ui.home.goalTitle)}</p>
            <p className="mt-3 font-display text-2xl font-bold leading-snug sm:text-4xl">
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

/** One word of the hero title that rises into place (index sets the delay). */
function W({ i, children }: { i: number; children: ReactNode }) {
  return (
    <span className="word">
      <span style={{ '--i': i } as CSSProperties}>{children}</span>
    </span>
  );
}
