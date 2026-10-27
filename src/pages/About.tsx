import { Icon } from '../components/Icon';
import { TravelerVoices } from '../components/Interviews';
import { PageHead, Section } from '../components/Layout';
import { Tag } from '../components/Tag';
import { caseFacts, evidence, methodNote } from '../data/facts';
import { ui } from '../data/i18n';
import { allPhotos } from '../data/photos';
import { useApp } from '../state';

export default function About() {
  const { t } = useApp();
  return (
    <>
      <PageHead
        eyebrow={<>ZERTTEX Hackathon 2026 · Stage 1 · Case 1</>}
        title={t({ en: 'About this prototype', zh: '关于本原型' })}
        sub={t({
          en: 'Saryarqa Go is a team concept for Saryarqa Routes, a fictional Astana tour company from the official case. Below: the case facts we were given, and the market evidence with sources.',
          zh: 'Saryarqa Go 是团队为官方案例中的虚构公司（阿斯塔纳旅行社 Saryarqa Routes）设计的方案。以下为案例给出的事实，以及附来源的市场数据。',
        })}
      />

      <Section title={t({ en: 'Case facts', zh: '案例事实' })} sub={t({ en: 'Used exactly as given in the case.', zh: '完全按照案例原文使用。' })}>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <tbody>
              {caseFacts.map((f) => (
                <tr key={f.label} className="border-b border-line/70 last:border-0">
                  <th scope="row" className="w-1/3 px-4 py-3 text-left font-semibold">{f.label}</th>
                  <td className="px-4 py-3">{f.value}</td>
                  <td className="px-4 py-3 text-right"><Tag kind="case" /></td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="px-4 py-3 text-left font-semibold">{t({ en: 'What foreign guests said', zh: '外国游客反馈' })}</th>
                <td className="px-4 py-3" colSpan={1}>
                  "It is unclear how to book." · "I am not sure the company is trustworthy." · "My foreign card does not work." · "I do not know what is included."
                </td>
                <td className="px-4 py-3 text-right"><Tag kind="case" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t({ en: 'Market evidence', zh: '市场数据' })} sub={t({ en: 'Target market: Chinese-speaking independent travelers (mainland China first).', zh: '目标市场：中文自由行游客（以中国大陆为先）。' })}>
        <div className="grid gap-4 md:grid-cols-3">
          {evidence.map((e) => (
            <a key={e.url} href={e.url} target="_blank" rel="noreferrer" className="card group flex flex-col gap-3 p-5 hover:border-teal">
              <Tag kind="verified" />
              <div className="num font-display text-3xl font-extrabold text-teal">{e.figure}</div>
              <p className="text-sm">{t(e.text)}</p>
              <div className="mt-auto flex items-start gap-1.5 border-t border-line pt-3 text-xs text-muted">
                <Icon name="arrow" size={14} className="mt-0.5 text-teal" />
                <span>
                  <span className="font-semibold text-ink group-hover:underline">{e.source}</span> · {e.date}
                  <span className="mt-0.5 block break-all opacity-80">{e.url}</span>
                </span>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
          <Icon name="info" className="mt-0.5 text-warn" /> {t(methodNote)}
        </p>
      </Section>

      <TravelerVoices />

      <Section title={t({ en: 'Honesty rules we follow', zh: '我们遵守的诚信原则' })}>
        <ul className="grid gap-3 text-sm md:grid-cols-2">
          {[
            { en: 'No invented statistics, reviews, licences, insurance, partnerships, awards or conversion rates.', zh: '不编造任何统计数据、评价、许可证、保险、合作、奖项或转化率。' },
            { en: 'Payments are a simulation with a visible TEST MODE banner. No card numbers, no passport data.', zh: '支付为模拟，并显示"测试模式"横幅。不收集卡号和护照信息。' },
            { en: 'Concierge and trip builder are scripted / rules-based, not live AI. They hand off to a human when unsure.', zh: '咨询助手和行程规划为预设脚本/规则，非实时AI。不确定时转接人工。' },
            { en: 'Weather and road data are demo data. Guide profiles are samples, not real people.', zh: '天气和道路数据为演示数据。导游资料为示例，非真实人物。' },
          ].map((x, i) => (
            <li key={i} className="card flex gap-2 p-4">
              <Icon name="shieldCheck" className="text-teal" /> {t(x)}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{t(ui.common.prototype)}</p>
      </Section>

      <Section
        title={t({ en: 'Photo credits', zh: '图片来源' })}
        sub={t({ en: 'Destination photos are freely licensed images from Wikimedia Commons, shown with their authors and licences. They show the places, not Saryarqa Routes tours.', zh: '目的地照片来自维基共享资源的自由授权图片，并注明作者和许可。照片展示的是地点，而非 Saryarqa Routes 的线路。' })}
      >
        <ul className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2" id="photo-credits">
          {allPhotos.map((p) => (
            <li key={p.file} className="border-b border-line py-2">
              <a href={p.credit.source} target="_blank" rel="noreferrer" className="font-medium hover:text-teal hover:underline">
                {p.credit.title ?? p.file}
              </a>
              <span className="text-muted">
                {' '}
                {t({ en: 'by', zh: '作者' })} {p.credit.author},{' '}
                {p.credit.licenseUrl ? (
                  <a href={p.credit.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {p.credit.license}
                  </a>
                ) : (
                  p.credit.license
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
