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
  const { t, lang, toast } = useApp();
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

  return (
    <>
      <PageHead
        scope="mvp"
        eyebrow={<span data-testid="staff-label">{t({ en: 'For Saryarqa Routes staff · demo', zh: '供 Saryarqa Routes 员工使用 · 演示' })}</span>}
        title={t({ en: 'Manager inbox', zh: '经理收件箱' })}
        sub={t({ en: 'Questions the concierge handed to a person. Get a short Russian summary and a reply draft in the traveler’s language, then edit and approve it yourself.', zh: '助手转交给人工的问题。获取俄语摘要和旅客语言的回复草稿，由您修改并确认后再发送。' })}
      >
        <AiModeBadge />
        <Tag kind="proposal" extra={t({ en: 'saves manager time on repeat questions, to measure in pilot', zh: '减少重复问题耗时，试点中衡量' })} />
      </PageHead>

      <div className="container-x mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
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
    </>
  );
}
