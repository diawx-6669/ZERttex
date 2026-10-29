import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/Layout';
import { AiModeBadge, AiTag, Scope, Tag } from '../components/Tag';
import { tourById } from '../data/tours';
import type { Lang, TagKind } from '../data/types';
import { aiLive, callAi, validateManager } from '../lib/ai';
import { answer, findTour } from '../lib/concierge';
import { markAnswered, useInbox, type InboxItem } from '../lib/inbox';
import { useApp } from '../state';
import { kzt, fmtDate } from '../lib/format';
import { href } from '../lib/router';
import { GO, STOP, funnel } from './Pilot';

// Operator side (for Saryarqa Routes staff). Handoff questions from the concierge,
// an AI summary in Russian and a reply draft in the traveler's language.
// The draft is NEVER sent automatically: a manager edits it and confirms the checks.

type Draft = { summaryRu: string; reply: string; checkRu: string[]; tags: TagKind[]; ai: boolean };

const TOPIC_RU: Record<string, string> = {
  availability: 'свободные места на дату',
  payment: 'оплата',
  cancel: 'отмена или возврат',
  book: 'как забронировать',
  included: 'что входит в стоимость',
  visa: 'виза и въезд',
  zhguide: 'гид, говорящий по-китайски',
  choose: 'выбор тура',
  packing: 'что взять с собой',
  trust: 'надёжность компании и документы',
  transport: 'транспорт и трансфер',
  price: 'цена',
  weather: 'погода и сезон',
  emergency: 'экстренная ситуация',
};
const CHECK_RU: Record<string, string[]> = {
  availability: ['Проверить свободные места на эту дату', 'Подтвердить итоговую цену'],
  included: ['Подтвердить входные билеты и трансфер (пункты «не подтверждено»)'],
  zhguide: ['Проверить, свободен ли гид с китайским языком на дату'],
  trust: ['Приложить документы компании (лицензия, регистрация, страховка), если они есть'],
  price: ['Подтвердить итоговую цену; цены в приложении демонстрационные'],
};

/** Scripted fallback: a template summary + the scripted concierge answer as a draft. */
function scriptedDraft(item: InboxItem): Draft {
  const a = answer(item.question, item.lang);
  const tour = tourById(item.tourId) ?? findTour(item.question);
  const langRu = item.lang === 'zh' ? 'китайский' : 'английский';
  const summaryRu = `Турист (язык: ${langRu}) спрашивает: ${TOPIC_RU[a.intent] ?? 'другой вопрос'}${tour ? `, тур «${tour.name.en}»` : ''}. Автоответ не смог закрыть вопрос — нужен менеджер.`;
  const reply =
    item.lang === 'zh'
      ? `您好！感谢您的提问。\n\n${a.text}\n\n[经理：请补充确认信息]\n\nSaryarqa Routes 团队`
      : `Hello, and thank you for your question.\n\n${a.text}\n\n[manager: add the confirmed details]\n\nSaryarqa Routes team`;
  return { summaryRu, reply, checkRu: CHECK_RU[a.intent] ?? ['Проверить факты перед отправкой'], tags: a.tag ? [a.tag] : [], ai: false };
}

const fmtTime = (iso: string, lang: Lang) => new Date(iso).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Manager() {
  const { t, lang, toast, booking } = useApp();
  const inbox = useInbox();
  const [selId, setSelId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [replyText, setReplyText] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const item = inbox.find((i) => i.id === selId) ?? inbox[0] ?? null;
  const draft = item ? drafts[item.id] : undefined;

  useEffect(() => {
    setReplyText(draft?.reply ?? '');
    setChecked(false);
  }, [item?.id, draft]);

  const makeDraft = async () => {
    if (!item) return;
    setBusy(true);
    let d: Draft | null = null;
    if (aiLive()) {
      const r = await callAi('manager', { question: item.question, travelerLang: item.lang, tourId: item.tourId }, validateManager);
      if (r) d = { ...r, ai: true };
    }
    setDrafts((all) => ({ ...all, [item.id]: d ?? scriptedDraft(item) }));
    setBusy(false);
  };

  const send = () => {
    if (!item || !checked || !replyText.trim()) return;
    markAnswered(item.id, replyText.trim());
    toast(t({ en: 'Marked as answered (simulated): nothing was emailed.', zh: '已标记为已回复（模拟）：未实际发送邮件。' }));
  };

  const newCount = inbox.filter((i) => i.status === 'new').length;
  const [tab, setTab] = useState<'questions' | 'bookings' | 'funnel'>('questions');
  const paidMonth = funnel[3].count;
  // Demo rows plus the booking made in this browser (if any).
  const bookings = [
    ...(booking ? [{ code: booking.code, name: booking.name || '—', tour: booking.items[0]?.tourId || 'kolsai', date: booking.items[0]?.date ?? '', n: booking.travelers, total: booking.total, status: booking.split ? 'split' : 'paid', demo: false }] : []),
    { code: 'SG-H7KD', name: '王丽', tour: 'kolsai', date: '2026-11-21', n: 2, total: 138000, status: 'paid', demo: true },
    { code: 'SG-2PXR', name: 'Chen Chen', tour: 'charyn', date: '2026-11-14', n: 4, total: 216000, status: 'split', demo: true },
    { code: 'SG-K4NE', name: '李明', tour: 'turkestan', date: '2026-12-05', n: 1, total: 89000, status: 'paid', demo: true },
    { code: 'SG-B8HM', name: 'Ji-woo Park', tour: 'burabay', date: '2026-11-28', n: 3, total: 144000, status: 'pending', demo: true },
  ];

  return (
    <>
      <PageHead
        scope="mvp"
        eyebrow={<span data-testid="staff-label">{t({ en: 'For Saryarqa Routes staff · demo', zh: '供 Saryarqa Routes 员工使用 · 演示' })}</span>}
        title={t({ en: 'Manager cabinet', zh: '经理工作台' })}
        sub={t({ en: 'Bookings, questions the concierge handed to a person, and how many travelers reach payment. Questions get a Russian summary and a reply draft you edit and approve yourself.', zh: '预订、助手转交给人工的问题，以及有多少旅客完成付款。问题附俄语摘要和回复草稿，由您修改并确认后发送。' })}
      >
        <AiModeBadge />
        <Tag kind="proposal" extra={t({ en: 'saves manager time on repeat questions, to measure in pilot', zh: '减少重复问题耗时，试点中衡量' })} />
      </PageHead>

      <div className="container-x mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="mgr-kpis">
        {[
          { k: t({ en: 'Open questions', zh: '待处理问题' }), v: String(newCount), s: t({ en: 'from the concierge', zh: '来自智能助手' }) },
          { k: t({ en: 'Paid bookings this month', zh: '本月已付预订' }), v: String(paidMonth), s: `${t({ en: 'goal', zh: '目标' })} ≈${GO} · ${t({ en: 'stop ads at', zh: '低于则停投' })} ≈${STOP}` },
          { k: t({ en: 'Reached payment', zh: '进入付款' }), v: `${((funnel[3].count / funnel[2].count) * 100).toFixed(0)}%`, s: t({ en: 'of started bookings paid', zh: '开始预订后完成付款' }) },
          { k: t({ en: 'From postcards', zh: '来自明信片' }), v: String(funnel[5].count), s: t({ en: 'friend bookings, no ad cost', zh: '朋友预订，无广告费' }) },
        ].map((x) => (
          <div key={x.k} className="card p-4">
            <div className="text-xs text-muted">{x.k}</div>
            <div className="num mt-1 text-3xl font-black">{x.v}</div>
            <div className="text-xs text-muted">{x.s}</div>
          </div>
        ))}
      </div>
      <div className="container-x mt-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t({ en: 'Cabinet', zh: '工作台' })}>
          {(
            [
              ['questions', { en: 'Questions', zh: '问题' }],
              ['bookings', { en: 'Bookings', zh: '预订' }],
              ['funnel', { en: 'Funnel', zh: '转化漏斗' }],
            ] as const
          ).map(([id, l]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`chip ${tab === id ? '!bg-sun !text-sunInk shadow-hard-sm' : ''}`} data-testid={`mgr-tab-${id}`}>
              {t(l)}{id === 'questions' && newCount ? ` · ${newCount}` : ''}
            </button>
          ))}
          <Tag kind="demo" className="ml-auto self-center" extra={t({ en: 'counts', zh: '统计数据' })} />
        </div>
      </div>

      {tab === 'bookings' && (
        <div className="container-x mt-4">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm" data-testid="mgr-bookings">
              <thead>
                <tr className="border-b-2 border-edge text-left font-mono text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">{t({ en: 'Code', zh: '编号' })}</th>
                  <th className="px-4 py-3">{t({ en: 'Lead traveler', zh: '联系人' })}</th>
                  <th className="px-4 py-3">{t({ en: 'Tour · date', zh: '线路 · 日期' })}</th>
                  <th className="px-4 py-3 text-right">{t({ en: 'People', zh: '人数' })}</th>
                  <th className="px-4 py-3 text-right">{t({ en: 'Total', zh: '总额' })}</th>
                  <th className="px-4 py-3">{t({ en: 'Payment', zh: '付款' })}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.code} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold">{b.code}{b.demo ? '' : ' ★'}</td>
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3">{t(tourById(b.tour as Parameters<typeof tourById>[0])?.name ?? { en: b.tour, zh: b.tour })} · <span className="text-muted">{b.date ? fmtDate(b.date, lang) : '—'}</span></td>
                    <td className="num px-4 py-3 text-right">{b.n}</td>
                    <td className="num px-4 py-3 text-right">{kzt(b.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-[6px] border-2 border-edge px-1.5 py-0.5 text-xs font-bold ${b.status === 'paid' ? 'bg-ok text-white' : b.status === 'split' ? 'bg-sun text-sunInk' : 'bg-surface2'}`}>
                        {b.status === 'paid' ? t({ en: 'Paid', zh: '已付' }) : b.status === 'split' ? t({ en: 'Split · in progress', zh: '分开付款中' }) : t({ en: 'Waiting', zh: '待付款' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">★ {t({ en: 'booking made in this browser. Other rows are Demo data.', zh: '在此浏览器中完成的预订，其余为演示数据。' })}</p>
        </div>
      )}

      {tab === 'funnel' && (
        <div className="container-x mt-4">
          <div className="card p-5">
            <ol className="grid gap-2 sm:grid-cols-6">
              {funnel.map((f, i) => (
                <li key={f.step} className="rounded-[10px] border-2 border-edge p-3">
                  <div className="num text-2xl font-black">{f.count.toLocaleString('en-US')}</div>
                  <div className="text-xs font-semibold">{f.step}</div>
                  {i > 0 && <div className="num text-xs text-muted">{((f.count / funnel[i - 1].count) * 100).toFixed(0)}%</div>}
                </li>
              ))}
            </ol>
            <a href={href('/pilot')} className="btn-primary btn-sm mt-4">{t({ en: 'Open the full pilot dashboard', zh: '打开完整试点看板' })} <Icon name="arrow" size={14} /></a>
          </div>
        </div>
      )}

      {tab === 'questions' && (
      <div className="container-x mt-4 grid gap-5 lg:grid-cols-[340px_1fr]">
        <section aria-labelledby="inbox-h" className="card h-fit overflow-hidden">
          <h2 id="inbox-h" className="flex items-center justify-between border-b border-line px-4 py-3 text-sm font-semibold">
            <span>{t({ en: 'Handoff questions', zh: '转人工问题' })}</span>
            <span className="num rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">{newCount} {t({ en: 'new', zh: '新' })}</span>
          </h2>
          <ul className="max-h-[60vh] overflow-y-auto" data-testid="inbox-list">
            {inbox.map((i) => (
              <li key={i.id} className="border-b border-line/70 last:border-0">
                <button
                  type="button"
                  onClick={() => setSelId(i.id)}
                  aria-current={item?.id === i.id ? 'true' : undefined}
                  className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-surface2 ${item?.id === i.id ? 'bg-surface2' : ''}`}
                >
                  <span className="line-clamp-2 font-medium" lang={i.lang === 'zh' ? 'zh-CN' : 'en'}>{i.question}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span className="uppercase">{i.lang}</span>· <span>{fmtTime(i.createdAt, lang)}</span>
                    <span className={`rounded-full px-1.5 ${i.status === 'new' ? 'bg-gold/15 text-gold' : 'bg-ok/15 text-ok'}`}>
                      {i.status === 'new' ? t({ en: 'new', zh: '待处理' }) : t({ en: 'answered', zh: '已回复' })}
                    </span>
                    {i.demo && <Tag kind="demo" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {item && (
          <section className="card min-w-0 space-y-4 p-4 sm:p-5" aria-label={t({ en: 'Selected question', zh: '所选问题' })}>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{item.email}</span>
                {item.tourId && <span>· {t(tourById(item.tourId)!.name)}</span>}
                {item.demo && <Tag kind="demo" extra={t({ en: 'sample question', zh: '示例问题' })} />}
              </div>
              <p className="font-display text-xl font-semibold" lang={item.lang === 'zh' ? 'zh-CN' : 'en'} data-testid="mgr-question">{item.question}</p>
            </div>

            {item.status === 'answered' ? (
              <div className="rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm">
                <div className="mb-1 font-semibold text-ok">{t({ en: 'Answered (simulated)', zh: '已回复（模拟）' })}</div>
                <p className="whitespace-pre-line">{item.sentReply}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-dark btn-sm" onClick={makeDraft} disabled={busy}>
                  <Icon name="refresh" size={14} /> {busy ? t({ en: 'Working…', zh: '处理中…' }) : draft ? t({ en: 'New draft', zh: '重新生成' }) : t({ en: 'Summarize + draft a reply', zh: '生成摘要和回复草稿' })}
                </button>
                <Scope phase="p2" />
                <span className="text-xs text-muted">{t({ en: 'AI drafts are Phase 2; the scripted template works today.', zh: 'AI 草稿属于第二阶段；预设模板现在即可使用。' })}</span>
                </div>

                {draft && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-line bg-surface2/60 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                        {t({ en: 'Summary for staff (Russian)', zh: '员工摘要（俄语）' })}
                        {draft.ai ? <AiTag /> : <span className="rounded-full border border-line px-2 py-px text-[11px]">{t({ en: 'Scripted template', zh: '预设模板' })}</span>}
                        {draft.tags.map((k) => <Tag key={k} kind={k} />)}
                      </div>
                      <p lang="ru" data-testid="mgr-summary">{draft.summaryRu}</p>
                      {draft.checkRu.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-sm text-muted" lang="ru">
                          {draft.checkRu.map((c) => <li key={c}>{c}</li>)}
                        </ul>
                      )}
                    </div>
                    <div>
                      <label htmlFor="mgr-reply" className="label">
                        {t({ en: 'Reply draft — edit before sending', zh: '回复草稿——发送前请修改' })} ({item.lang === 'zh' ? '中文' : 'English'})
                      </label>
                      <textarea id="mgr-reply" className="input min-h-[180px] w-full" lang={item.lang === 'zh' ? 'zh-CN' : 'en'} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                      {/\[[^\]]+\]/.test(replyText) && (
                        <p className="mt-1 text-sm text-warn">{t({ en: 'The draft still has [placeholders] to fill in.', zh: '草稿中仍有 [占位内容] 需要补充。' })}</p>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--teal))]" checked={checked} onChange={(e) => setChecked(e.target.checked)} data-testid="mgr-checked" />
                      {t({ en: 'I checked dates, availability and prices, and edited the draft. It contains no promise we cannot keep.', zh: '我已核对日期、余位和价格并修改了草稿，内容不包含无法兑现的承诺。' })}
                    </label>
                    <button type="button" className="btn-primary" onClick={send} disabled={!checked || !replyText.trim() || /\[[^\]]+\]/.test(replyText)}>
                      <Icon name="mail" size={15} /> {t({ en: 'Approve and send (simulated)', zh: '确认并发送（模拟）' })}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
      )}
    </>
  );
}
